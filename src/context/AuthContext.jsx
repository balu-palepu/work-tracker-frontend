import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const token = localStorage.getItem('token');

    // If we have a stored user and token, trust it and don't validate immediately
    // This prevents the redirect loop on page load after login
    if (storedUser && token) {
      setUser(storedUser);
      setLoading(false);
      return;
    }

    // No stored user or token - not logged in
    if (!token) {
      setLoading(false);
      return;
    }

    // We have a token but no stored user - fetch user data
    authService.getCurrentUser()
      .then((response) => {
        if (response?.user) {
          setUser(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
        } else {
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      })
      .catch((error) => {
        console.error('Error fetching current user:', error);
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    // Clear team data on logout
    localStorage.removeItem('currentTeamId');
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const isSystemAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isSystemAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
