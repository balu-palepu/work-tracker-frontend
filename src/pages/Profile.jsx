import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import { User, Mail, Lock, Save, Check, X, Eye, EyeOff } from 'lucide-react';
import { SPECIALTY_OPTIONS, getMemberDesignation, normalizeSpecialtySelection } from '../utils/memberSpecialties';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { isAdmin, teamMembership } = useTeam();
  const currentDesignation = getMemberDesignation(user);
  const matchedSpeciality = SPECIALTY_OPTIONS.find((option) => option !== 'Other' && option === currentDesignation);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    speciality: matchedSpeciality || (currentDesignation ? 'Other' : ''),
    otherSpeciality: matchedSpeciality ? '' : currentDesignation,
  });

  const reportingManagerName = user?.reportingManager?.name || user?.reportingManagerName || '';
  const reportingManagerEmail = user?.reportingManager?.email || '';
  const isTeamAdmin = typeof isAdmin === 'function' ? isAdmin() : false;

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Password strength validation
  const passwordRequirements = useMemo(() => {
    const password = passwordData.newPassword;
    return {
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      passwordsMatch: password && password === passwordData.confirmPassword,
    };
  }, [passwordData.newPassword, passwordData.confirmPassword]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordRequirements).every(Boolean);
  }, [passwordRequirements]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });

    if (name === 'email') {
      if (!value) {
        setEmailError('');
      } else if (!isValidEmail(value)) {
        setEmailError('Enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(profileData.email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    const speciality = normalizeSpecialtySelection(profileData.speciality, profileData.otherSpeciality);
    if (!speciality) {
      toast.error('Please select your designation');
      return;
    }
    setLoading(true);

    try {
      const response = await authService.updateProfile({
        name: profileData.name,
        email: profileData.email,
        speciality,
        customTitle: speciality,
      });
      updateUser(response.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.userMessage ||
        error.message ||
        'Error changing password';
      if (message.toLowerCase().includes('incorrect')) {
        toast.error('Old password is incorrect');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Password</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="speciality" className="block text-sm font-medium text-gray-700 mb-1">
                Designation
              </label>
              <select
                id="speciality"
                name="speciality"
                value={profileData.speciality}
                onChange={handleProfileChange}
                className="input-field appearance-none bg-white"
                style={{ height: '42px' }}
              >
                <option value="">Select designation</option>
                {SPECIALTY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {profileData.speciality === 'Other' && (
              <div>
                <label htmlFor="otherSpeciality" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Designation
                </label>
                <input
                  type="text"
                  id="otherSpeciality"
                  name="otherSpeciality"
                  value={profileData.otherSpeciality}
                  onChange={handleProfileChange}
                  className="input-field"
                  placeholder="Enter your designation"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                  className="input-field pl-10"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'profile-email-error' : undefined}
                />
              </div>
              {emailError && (
                <p id="profile-email-error" className="mt-1 text-xs text-red-600">
                  {emailError}
                </p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="Enter Current Password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter New Password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {passwordData.newPassword && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center space-x-1 ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${passwordRequirements.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.hasLowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>One lowercase letter</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>One uppercase letter</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>One number</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${passwordRequirements.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>One special character</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="Enter Confirm New Password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordData.confirmPassword && (
                <p className={`mt-1 text-xs flex items-center space-x-1 ${passwordRequirements.passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordRequirements.passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>{passwordRequirements.passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                <span>{loading ? 'Changing...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account Info */}
      <div className="card mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Account Status</span>
            <span className="font-medium text-green-600">Active</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Role</span>
            <span className="font-medium text-gray-900 capitalize">
              {teamMembership?.role || user?.role || 'member'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Manager</span>
            <span className="font-medium text-gray-900">
              {user?.role === 'admin' || isTeamAdmin
                ? 'Self'
                : reportingManagerName || 'Not assigned'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Designation</span>
            <span className="font-medium text-gray-900">
              {getMemberDesignation(user) || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Member Since</span>
            <span className="font-medium text-gray-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
