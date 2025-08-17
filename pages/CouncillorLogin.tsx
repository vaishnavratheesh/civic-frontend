import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Role, User } from '../types';
import Spinner from '../components/Spinner';
import PasswordInput from '../components/PasswordInput';
import { validateEmail, validatePassword } from '../utils/formValidation';
import axios from 'axios';
import { API_ENDPOINTS } from '../src/config/config';

const WARD_NUMBERS = Array.from({ length: 23 }, (_, i) => i + 1);

const CouncillorLogin: React.FC = () => {
  const [ward, setWard] = useState<number>(1);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    ward?: string;
    password?: string;
  }>({});
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWard = parseInt(e.target.value);
    setWard(newWard);
    setValidationErrors(prev => ({ ...prev, ward: undefined }));
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setValidationErrors(prev => ({ ...prev, password: undefined }));
    setError('');
  };

  const validateForm = (): boolean => {
    const errors: { ward?: string; password?: string } = {};

    if (!ward || ward < 1 || ward > 23) {
      errors.ward = 'Please select a valid ward';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.error;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
              // Councillor login with ward-specific credentials
        const response = await axios.post(API_ENDPOINTS.COUNCILLOR_LOGIN, {
            ward,
            password
        });

      const responseData = response.data;

      // Create user object from backend response
      const user: User = {
        id: responseData.userId || `councillor-ward-${ward}`,
        name: responseData.name || `Councillor Ward ${ward}`,
        email: responseData.email || `councillor.ward${ward}@erumeli.gov.in`,
        role: Role.COUNCILLOR,
        ward: ward,
        approved: true,
        token: responseData.token,
        panchayath: responseData.panchayath || 'Erumeli Panchayath',
        profilePicture: responseData.profilePicture || ''
      };

      login(user);

      // Check if profile is complete
      if (responseData.profileComplete) {
        navigate('/councillor/dashboard');
      } else {
        navigate('/councillor/complete-profile');
      }
    } catch (err: any) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data.error || 'Login failed';
        
        if (errorMessage.includes('Invalid credentials')) {
          setError('Invalid ward number or password. Please check your credentials.');
        } else if (errorMessage.includes('not found')) {
          setError('Councillor account not found for this ward.');
        } else if (errorMessage.includes('not approved')) {
          setError('Your councillor account is pending approval.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 px-8 py-8 text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="fas fa-user-tie text-blue-800 text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Councillor Login</h2>
          <p className="text-blue-100 text-sm">Erumeli Panchayath - Ward Councillor Access</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome Back, Councillor</h3>
            <p className="text-gray-600 text-sm">Please enter your ward credentials to access your dashboard</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6" role="alert">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle mr-3"></i>
                <div>
                  <p className="font-medium">Login Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="ward">
                <i className="fas fa-map-marker-alt mr-2 text-blue-600"></i>
                Ward Number
              </label>
              <select
                id="ward"
                value={ward}
                onChange={handleWardChange}
                className={`w-full px-4 py-3 border rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-all duration-200 bg-white ${
                  validationErrors.ward
                    ? 'border-red-500 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                required
              >
                <option value="">Select Your Ward</option>
                {WARD_NUMBERS.map(w => (
                  <option key={w} value={w}>Ward {w}</option>
                ))}
              </select>
              {validationErrors.ward && (
                <p className="text-red-500 text-xs mt-2 flex items-center">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {validationErrors.ward}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-2 flex items-center">
                <i className="fas fa-info-circle mr-1"></i>
                Erumeli Panchayath has 23 wards
              </p>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                <i className="fas fa-lock mr-2 text-blue-600"></i>
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your ward password"
                error={validationErrors.password}
                required
                className="w-full"
              />
              <p className="text-gray-500 text-xs mt-2 flex items-center">
                <i className="fas fa-key mr-1"></i>
                Format: ward@wardnumber (e.g., ward@5 for Ward 5)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !!validationErrors.ward || !!validationErrors.password}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                loading || validationErrors.ward || validationErrors.password
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Spinner />
                  <span className="ml-2">Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Sign In as Councillor
                </div>
              )}
            </button>
          </form>

          {/* Information Section */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
              <i className="fas fa-info-circle mr-2"></i>
              Important Information
            </h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Your credentials are provided by the admin via email</li>
              <li>• Password format: ward@wardnumber</li>
              <li>• Complete your profile after first login</li>
              <li>• Contact admin for credential issues</li>
            </ul>
          </div>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium text-sm block">
              ← Back to Citizen Login
            </Link>
            <Link to="/forgot-password" className="text-gray-600 hover:text-gray-800 font-medium text-sm block">
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouncillorLogin; 