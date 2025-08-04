import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PANCHAYATH_NAMES, PANCHAYATH_DATA } from '../constants';
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
  const [panchayath, setPanchayath] = useState('');
  const [ward, setWard] = useState<number>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state as LocationState;
  const googleUserData = state?.googleUserData;

  // Get available wards based on selected panchayath
  const availableWards = panchayath ? PANCHAYATH_DATA[panchayath as keyof typeof PANCHAYATH_DATA] || [] : [];

  useEffect(() => {
    // If no Google user data, redirect to login
    if (!googleUserData) {
      navigate('/login');
    }
  }, [googleUserData, navigate]);

  // Reset ward when panchayath changes
  const handlePanchayathChange = (selectedPanchayath: string) => {
    setPanchayath(selectedPanchayath);
    if (selectedPanchayath && PANCHAYATH_DATA[selectedPanchayath as keyof typeof PANCHAYATH_DATA]) {
      setWard(PANCHAYATH_DATA[selectedPanchayath as keyof typeof PANCHAYATH_DATA][0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!panchayath) {
      setError('Please select a Panchayath/Municipality.');
      return;
    }

    if (!googleUserData) {
      setError('Missing user data. Please try signing in again.');
      return;
    }

    setLoading(true);

    try {
      // Complete Google registration with additional details
      const response = await axios.post('http://localhost:3001/api/google-register-complete', {
        credential: googleUserData.credential,
        ward,
        panchayath,
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
        panchayath: panchayath
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 m-4">
        <div className="flex justify-center mb-6">
          <i className="fas fa-user-plus text-6xl text-blue-600"></i>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Complete Your Profile</h2>
        <p className="text-center text-gray-500 mb-6">
          Welcome, {googleUserData.name}! Please provide additional details to complete your registration.
        </p>

        {/* User Info Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            {googleUserData.picture && (
              <img 
                src={googleUserData.picture} 
                alt="Profile" 
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold text-gray-800">{googleUserData.name}</p>
              <p className="text-sm text-gray-600">{googleUserData.email}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="panchayath">
              Panchayath/Municipality *
            </label>
            <select
              id="panchayath"
              value={panchayath}
              onChange={(e) => handlePanchayathChange(e.target.value)}
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Panchayath/Municipality</option>
              {PANCHAYATH_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ward">
              Ward Number *
            </label>
            <select
              id="ward"
              value={ward}
              onChange={(e) => setWard(Number(e.target.value))}
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!panchayath}
            >
              {availableWards.map((wardNum) => (
                <option key={wardNum} value={wardNum}>
                  Ward {wardNum}
                </option>
              ))}
            </select>
            {!panchayath && (
              <p className="text-sm text-gray-500 mt-1">Please select a Panchayath first</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !panchayath}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 disabled:bg-blue-300"
            >
              {loading ? <Spinner size="sm" /> : 'Complete Registration'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
