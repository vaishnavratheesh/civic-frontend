import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { WARD_NUMBERS } from '../constants';
import Spinner from '../components/Spinner';
import { Role, User } from '../types';
import axios from 'axios';

interface LocationState {
  googleUserData?: {
    email: string;
    name: string;
    picture?: string;
    credential: string;
  };
}

const CompleteProfile: React.FC = () => {
  const [ward, setWard] = useState<number>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state as LocationState;
  const googleUserData = state?.googleUserData;

  useEffect(() => {
    // If no Google user data, redirect to login
    if (!googleUserData) {
      navigate('/login');
    }
  }, [googleUserData, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!googleUserData) {
      setError('Missing user data. Please try signing in again.');
      return;
    }

    setLoading(true);

    try {
      // Complete Google registration with additional details
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/google-register-complete`, {
        credential: googleUserData.credential,
        ward,
        panchayath: 'Erumeli Panchayath', // Automatically set to Erumeli Panchayath
      });

      // Create user object and login
      const user: User = {
        id: response.data.userId,
        name: googleUserData.name,
        email: googleUserData.email,
        role: Role.CITIZEN,
        ward: ward,
        approved: true,
        token: response.data.token,
        panchayath: 'Erumeli Panchayath'
      };

      login(user);
      navigate('/citizen');
    } catch (err: any) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Registration failed');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!googleUserData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-8 py-6 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="fab fa-google text-blue-800 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Complete Your Profile</h2>
          <p className="text-blue-100 text-sm">Erumeli Panchayath - Additional Details Required</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome, {googleUserData.name}!</h3>
            <p className="text-gray-600 text-sm">Please provide your ward information to complete your registration</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6" role="alert">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle mr-3"></i>
                <div>
                  <p className="font-medium">Registration Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="ward">
                <i className="fas fa-map-marker-alt mr-2 text-blue-600"></i>
                Ward Number
              </label>
              <select
                id="ward"
                value={ward}
                onChange={(e) => setWard(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              >
                <option value="">Select Your Ward</option>
                {WARD_NUMBERS.map(w => <option key={w} value={w}>Ward {w}</option>)}
              </select>
              <p className="text-gray-500 text-xs mt-2 flex items-center">
                <i className="fas fa-info-circle mr-1"></i>
                Erumeli Panchayath has 23 wards
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Spinner />
                  <span className="ml-2">Completing Registration...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="fas fa-check mr-2"></i>
                  Complete Registration
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              By completing registration, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
