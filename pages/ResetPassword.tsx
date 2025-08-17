/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import { validatePassword, validateConfirmPassword } from '../utils/formValidation';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [searchParams] = useSearchParams();

  // Get token from URL parameters
  const token = searchParams.get('token');

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError('');
    setError('');

    // Validate password in real-time
    if (newPassword) {
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        setPasswordError(validation.error || '');
      }
    }

    // Re-validate confirm password if it exists
    if (confirmPassword) {
      const confirmValidation = validateConfirmPassword(newPassword, confirmPassword);
      if (!confirmValidation.isValid) {
        setConfirmPasswordError(confirmValidation.error || '');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    setConfirmPasswordError('');
    setError('');

    // Validate confirm password in real-time
    if (newConfirmPassword) {
      const validation = validateConfirmPassword(password, newConfirmPassword);
      if (!validation.isValid) {
        setConfirmPasswordError(validation.error || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || '');
      return;
    }

    // Validate confirm password
    const confirmValidation = validateConfirmPassword(password, confirmPassword);
    if (!confirmValidation.isValid) {
      setConfirmPasswordError(confirmValidation.error || '');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002'}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password reset successfully! You can now log in with your new password.');
      } else {
        setError(data.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 m-4">
        <div className="flex justify-center mb-6">
          <i className="fas fa-lock text-6xl text-blue-600"></i>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Reset Password</h2>
        <p className="text-center text-gray-500 mb-8">
          Enter your new password below.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <i className="fas fa-check-circle mr-2"></i>
            {message}
            <div className="mt-2">
              <Link to="/login" className="text-green-800 hover:text-green-900 font-medium underline">
                Go to Login →
              </Link>
            </div>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                New Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your new password"
                error={passwordError}
                success={!passwordError && password ? "Password meets requirements" : undefined}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm your new password"
                error={confirmPasswordError}
                success={!confirmPasswordError && confirmPassword && password === confirmPassword ? "Passwords match" : undefined}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!passwordError || !!confirmPasswordError || !token}
              className={`w-full font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ${
                loading || passwordError || confirmPasswordError || !token
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  <span>Resetting Password...</span>
                </div>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;