import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import { Calendar, Lock, Eye, EyeOff, Check, X, AlertCircle, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await authService.verifyResetToken(token);
        setTokenValid(true);
        setMaskedEmail(response.email || '');
      } catch (error) {
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setLoading(false);
      setTokenValid(false);
    }
  }, [token]);

  // Password strength validation
  const passwordRequirements = useMemo(() => {
    const password = passwordData.password;
    return {
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      passwordsMatch: password && password === passwordData.confirmPassword,
    };
  }, [passwordData.password, passwordData.confirmPassword]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordRequirements).every(Boolean);
  }, [passwordRequirements]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error('Please meet all password requirements');
      return;
    }

    setSubmitting(true);
    try {
      await authService.resetPassword(token, passwordData.password);
      setSuccess(true);
      toast.success('Password reset successful!');

      // Redirect to teams page after a short delay
      setTimeout(() => {
        navigate('/teams');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Calendar className="h-16 w-16 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">WorkTracker</h2>
          </div>

          <div className="card text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Invalid or Expired Link</h3>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new password reset.
            </p>
            <Link to="/login" className="btn-primary inline-block">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Calendar className="h-16 w-16 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">WorkTracker</h2>
          </div>

          <div className="card text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Reset Successful!</h3>
            <p className="text-gray-600 mb-6">
              Your password has been changed successfully. You will be redirected to your dashboard shortly.
            </p>
            <Link to="/teams" className="btn-primary inline-block">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Calendar className="h-16 w-16 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">WorkTracker</h2>
          <p className="mt-2 text-sm text-gray-600">Create a new password</p>
        </div>

        <div className="card">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Reset Your Password</h3>
          {maskedEmail && (
            <p className="text-sm text-gray-600 mb-6">
              Enter a new password for <span className="font-medium">{maskedEmail}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter new password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {passwordData.password && (
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
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="Confirm new password"
                  required
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

            <button
              type="submit"
              disabled={submitting || !isPasswordValid}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
