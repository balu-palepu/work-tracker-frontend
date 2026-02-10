import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import { Calendar, Lock, Mail, X, ArrowLeft, CheckCircle, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [accountLocked, setAccountLocked] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email', 'reset', 'success'
  const [resetToken, setResetToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  // Password reset state
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
    setFormData({
      ...formData,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(formData.email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setLoading(true);
    setAccountLocked(false);

    try {
      await login(formData);
      toast.success('Login successful!');
      navigate('/teams');
    } catch (error) {
      // Check if account is locked (HTTP 423)
      if (error.response?.status === 423) {
        setAccountLocked(true);
      } else {
        toast.error(error.response?.data?.message || error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmailChange = (e) => {
    const value = e.target.value;
    setForgotEmail(value);
    if (!value) {
      setForgotEmailError('');
    } else if (!isValidEmail(value)) {
      setForgotEmailError('Enter a valid email address');
    } else {
      setForgotEmailError('');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) {
      setForgotEmailError('Enter a valid email address');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await authService.forgotPassword(forgotEmail);
      if (response.success && response.resetToken) {
        setResetToken(response.resetToken);
        setMaskedEmail(response.email || forgotEmail);
        setForgotStep('reset');
        // Clear any locked account message since they can reset password
        setAccountLocked(false);
      }
    } catch (error) {
      // Handle locked account specially
      if (error.response?.status === 423) {
        toast.error('Account is locked. Password reset will unlock your account after successful reset.');
      } else {
        toast.error(error.response?.data?.message || 'Email not found. Please check and try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error('Please meet all password requirements');
      return;
    }

    setResetLoading(true);
    try {
      await authService.resetPassword(resetToken, passwordData.password);
      setForgotStep('success');
      toast.success('Password reset successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail('');
    setForgotEmailError('');
    setForgotStep('email');
    setResetToken('');
    setMaskedEmail('');
    setPasswordData({ password: '', confirmPassword: '' });
  };

  const openForgotModal = () => {
    setForgotEmail(formData.email || '');
    setForgotEmailError('');
    setForgotStep('email');
    setShowForgotModal(true);
  };

  const handleSuccessClose = () => {
    closeForgotModal();
    navigate('/teams');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Calendar className="h-16 w-16 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">WorkTracker</h2>
          <p className="mt-2 text-sm text-gray-600">Track your daily work activities</p>
        </div>

        <div className="card">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Sign in to your account</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter Email Address"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'login-email-error' : undefined}
                />
              </div>
              {emailError && (
                <p id="login-email-error" className="mt-1 text-xs text-red-600">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter Password"
                />
              </div>
            </div>

            {/* Account Locked Warning */}
            {accountLocked && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800">Account Locked</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Your account has been temporarily locked due to too many failed login attempts.
                    </p>
                    <p className="text-sm text-red-700 mt-2">
                      The lock will automatically expire in <span className="font-medium">2 hours</span>.
                      If you need immediate access, please contact your administrator to unlock your account.
                    </p>
                    <button
                      type="button"
                      onClick={openForgotModal}
                      className="mt-3 text-sm text-red-800 hover:text-red-900 font-medium underline"
                    >
                      Reset your password instead
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {forgotStep === 'email' && 'Reset Password'}
                {forgotStep === 'reset' && 'Create New Password'}
                {forgotStep === 'success' && 'Password Updated'}
              </h2>
              <button
                onClick={closeForgotModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Step 1: Email Verification */}
              {forgotStep === 'email' && (
                <>
                  <p className="text-gray-600 mb-6">
                    Enter your registered email address to verify your account.
                  </p>

                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="forgot-email"
                          type="email"
                          value={forgotEmail}
                          onChange={handleForgotEmailChange}
                          className="input-field pl-10"
                          placeholder="Enter your email address"
                          required
                          autoFocus
                        />
                      </div>
                      {forgotEmailError && (
                        <p className="mt-1 text-xs text-red-600">{forgotEmailError}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full btn-primary"
                    >
                      {forgotLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <button
                      onClick={closeForgotModal}
                      className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Login
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Password Reset Form */}
              {forgotStep === 'reset' && (
                <>
                  <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      Email verified: <span className="font-medium">{maskedEmail}</span>
                    </p>
                  </div>

                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="new-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.password}
                          onChange={handlePasswordChange}
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
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="confirm-password"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
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
                      disabled={resetLoading || !isPasswordValid}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetLoading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setForgotStep('email')}
                      className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Email
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Success */}
              {forgotStep === 'success' && (
                <div className="text-center py-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Password Updated!</h3>
                  <p className="text-gray-600 mb-6">
                    Your password has been successfully changed. You are now logged in.
                  </p>
                  <button
                    onClick={handleSuccessClose}
                    className="w-full btn-primary"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
