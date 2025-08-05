import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../components/Spinner';
import axios from 'axios';

interface LocationState {
  email?: string;
}

const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state as LocationState;
  const email = state?.email;

  useEffect(() => {
    // If no email, redirect to register
    if (!email) {
      navigate('/register');
      return;
    }

    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/verify-otp', {
        email,
        otp,
      });

      if (response.data.success) {
        // Show success message and redirect to login
        alert('Registration completed successfully! You can now login.');
        navigate('/login');
      }
    } catch (err: any) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'OTP verification failed');
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await axios.post('http://localhost:3001/api/resend-otp', { email });
      setTimer(600); // Reset timer to 10 minutes
      setSuccessMessage('New OTP sent to your email! Please check your inbox.');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err: any) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Failed to resend OTP. Please try again.');
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 m-4">
        <div className="flex justify-center mb-6">
          <i className="fas fa-envelope-open-text text-6xl text-blue-600"></i>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Verify Your Email</h2>
        <p className="text-center text-gray-500 mb-6">
          We've sent a 6-digit OTP to<br />
          <span className="font-semibold text-gray-700">{email}</span>
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otp">
              Enter OTP
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError(''); // Clear error when user types
                setSuccessMessage(''); // Clear success message when user types
              }}
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 text-center text-2xl font-mono tracking-widest leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="000000"
              maxLength={6}
              autoComplete="off"
              required
            />
          </div>

          <div className="text-center">
            {timer > 0 ? (
              <p className="text-sm text-gray-500">
                OTP expires in: <span className="font-semibold text-red-600">{formatTime(timer)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-600 font-semibold">OTP has expired!</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || timer === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 disabled:bg-blue-300"
            >
              {loading ? <Spinner size="sm" /> : 'Verify OTP'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">Didn't receive the OTP?</p>
          <button
            onClick={handleResendOTP}
            disabled={resendLoading || timer > 540} // Allow resend after 1 minute
            className="text-blue-600 hover:text-blue-800 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {resendLoading ? 'Sending...' : 'Resend OTP'}
          </button>
          {timer > 540 && (
            <p className="text-xs text-gray-500 mt-1">
              You can resend OTP in {formatTime(timer - 540)}
            </p>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/register')}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
