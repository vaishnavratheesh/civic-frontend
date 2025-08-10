/// <reference types="vite/client" />
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { validateEmail } from '../utils/formValidation';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailError('');
    setError('');
    setMessage('');

    // Validate email in real-time
    if (newEmail) {
      const validation = validateEmail(newEmail);
      if (!validation.isValid) {
        setEmailError(validation.error || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email before submission
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');
    setEmailError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002'}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('If this email is registered, a password reset link has been sent to your email address.');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
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
          <i className="fas fa-key text-6xl text-blue-600"></i>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Forgot Password</h2>
        <p className="text-center text-gray-500 mb-8">
          Enter your email address and we'll send you a link to reset your password.
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
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${
                emailError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'focus:ring-blue-500'
              }`}
              placeholder="Enter your email address"
              required
            />
            {emailError && (
              <p className="text-red-500 text-xs italic mt-1">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {emailError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !!emailError}
            className={`w-full font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ${
              loading || emailError
                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                <span>Sending Reset Link...</span>
              </div>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;