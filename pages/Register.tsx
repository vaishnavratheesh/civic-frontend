
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Role, User } from '../types';
import { WARD_NUMBERS } from '../constants';
import Spinner from '../components/Spinner';
import GoogleSignIn from '../components/GoogleSignIn';
import PasswordInput from '../components/PasswordInput';
import { decodeGoogleCredential, googleAuthRegister } from '../utils/googleAuth';
import {
    validateName,
    validateEmailForRegistration,
    validatePassword,
    validateConfirmPassword,
    validateWard,
    ValidationErrors,
    hasValidationErrors
} from '../utils/formValidation';
import axios from 'axios';
import { API_ENDPOINTS } from '../src/config/config';

// Real API call for registration
const registerUser = async (name: string, email: string, ward: number, password: string) => {
    const response = await axios.post(API_ENDPOINTS.REGISTER, {
        name,
        email,
        ward,
        password,
        panchayath: 'Erumeli Panchayath', // Automatically set to Erumeli Panchayath
    });
    return response.data;
};

const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [ward, setWard] = useState<number>(1);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isValidating, setIsValidating] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Real-time validation handlers
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);

        // Clear previous errors
        setValidationErrors(prev => ({ ...prev, name: undefined }));
        setError('');

        // Validate name in real-time
        if (newName) {
            const validation = validateName(newName);
            if (!validation.isValid) {
                setValidationErrors(prev => ({ ...prev, name: validation.error }));
            }
        }
    };

    const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);

        // Clear previous errors
        setValidationErrors(prev => ({ ...prev, email: undefined }));
        setError('');

        // Validate email in real-time (with debounce effect)
        if (newEmail && newEmail.includes('@')) {
            setIsValidating(true);
            try {
                const validation = await validateEmailForRegistration(newEmail);
                if (!validation.isValid) {
                    setValidationErrors(prev => ({ ...prev, email: validation.error }));
                }
            } catch (error) {
                console.error('Email validation error:', error);
            } finally {
                setIsValidating(false);
            }
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);

        // Clear previous errors
        setValidationErrors(prev => ({ ...prev, password: undefined, confirmPassword: undefined }));
        setError('');

        // Validate password in real-time
        if (newPassword) {
            const validation = validatePassword(newPassword);
            if (!validation.isValid) {
                setValidationErrors(prev => ({ ...prev, password: validation.error }));
            }
        }

        // Re-validate confirm password if it exists
        if (confirmPassword) {
            const validation = validateConfirmPassword(newPassword, confirmPassword);
            if (!validation.isValid) {
                setValidationErrors(prev => ({ ...prev, confirmPassword: validation.error }));
            }
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newConfirmPassword = e.target.value;
        setConfirmPassword(newConfirmPassword);

        // Clear previous errors
        setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
        setError('');

        // Validate confirm password in real-time
        if (newConfirmPassword) {
            const validation = validateConfirmPassword(password, newConfirmPassword);
            if (!validation.isValid) {
                setValidationErrors(prev => ({ ...prev, confirmPassword: validation.error }));
            }
        }
    };

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newWard = parseInt(e.target.value);
        setWard(newWard);

        // Clear previous errors
        setValidationErrors(prev => ({ ...prev, ward: undefined }));
        setError('');

        // Validate ward in real-time
        if (newWard) {
            const validation = validateWard(newWard);
            if (!validation.isValid) {
                setValidationErrors(prev => ({ ...prev, ward: validation.error }));
            }
        }
    };

    const validateForm = async (): Promise<boolean> => {
        const errors: ValidationErrors = {};

        // Validate all fields
        const nameValidation = validateName(name);
        if (!nameValidation.isValid) errors.name = nameValidation.error;

        const emailValidation = await validateEmailForRegistration(email);
        if (!emailValidation.isValid) errors.email = emailValidation.error;

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) errors.password = passwordValidation.error;

        const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
        if (!confirmPasswordValidation.isValid) errors.confirmPassword = confirmPasswordValidation.error;

        const wardValidation = validateWard(ward);
        if (!wardValidation.isValid) errors.ward = wardValidation.error;

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setValidationErrors({});

        // Validate form before submission
        setIsValidating(true);
        const isValid = await validateForm();
        setIsValidating(false);

        if (!isValid) {
            return;
        }

        setLoading(true);
        try {
            await registerUser(name, email, ward, password);

            // Redirect to OTP verification page with email
            navigate('/verify-otp', {
                state: { email: email }
            });
        } catch (err: any) {
            console.error(err);
            if (axios.isAxiosError(err) && err.response) {
                const errorMessage = err.response.data.error || 'Registration failed';

                // Provide specific error messages
                if (errorMessage.includes('already exists') || errorMessage.includes('Email already')) {
                    setError('An account with this email already exists. Please use a different email or try logging in.');
                } else if (errorMessage.includes('invalid email')) {
                    setError('Please enter a valid email address.');
                } else if (errorMessage.includes('password')) {
                    setError('Password does not meet requirements. Please check and try again.');
                } else {
                    setError(errorMessage);
                }
            } else {
                setError('Registration failed. Please check your internet connection and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credential: string) => {
        setError('');
        setLoading(true);

        try {
            // Decode Google credential to get user info
            const userInfo = decodeGoogleCredential(credential);
            if (!userInfo) {
                setError('Failed to process Google authentication. Please try again.');
                return;
            }

            // Check if user already exists
            const checkResponse = await axios.post(API_ENDPOINTS.CHECK_GOOGLE_USER, {
                email: userInfo.email
            });

            if (checkResponse.data.exists) {
                setError('An account with this email already exists. Please try logging in instead.');
                return;
            }

            // Redirect to profile completion page with Google user data
            navigate('/complete-profile', {
                state: {
                    googleUserData: {
                        email: userInfo.email,
                        name: userInfo.name,
                        picture: userInfo.picture,
                        credential: credential
                    }
                }
            });
        } catch (err: any) {
            console.error(err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.error || 'Google registration failed');
            } else {
                setError('Google registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = (error: any) => {
        console.error('Google Sign-In Error:', error);
        setError('Google Sign-In failed. Please try again.');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-8 py-6 text-white text-center">
                    <div className="flex items-center justify-between mb-4">
                        <Link 
                            to="/" 
                            className="flex items-center text-blue-100 hover:text-white transition-colors duration-200"
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
                            <span className="text-sm font-medium">Back to Landing</span>
                        </Link>
                        <div className="flex-1"></div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                    <p className="text-blue-100">Join Civic+ to access government services</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Create Your Citizen Account</h3>
                        <p className="text-gray-600 text-sm">Register to access Erumeli Panchayath services and civic engagement tools</p>
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

                    {/* Validation Summary */}
                    {hasValidationErrors(validationErrors) && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                            <div className="flex items-center mb-3">
                                <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                                <span className="text-red-700 font-semibold text-sm">Please fix the following errors:</span>
                            </div>
                            <ul className="text-red-600 text-xs space-y-1">
                                {validationErrors.name && <li>• {validationErrors.name}</li>}
                                {validationErrors.email && <li>• {validationErrors.email}</li>}
                                {validationErrors.password && <li>• {validationErrors.password}</li>}
                                {validationErrors.confirmPassword && <li>• {validationErrors.confirmPassword}</li>}
                                {validationErrors.ward && <li>• {validationErrors.ward}</li>}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">
                                <i className="fas fa-user mr-2 text-blue-600"></i>
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={handleNameChange}
                                className={`w-full px-4 py-3 border rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    validationErrors.name
                                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                                placeholder="Enter your full name"
                                required
                            />
                            {validationErrors.name && (
                                <p className="text-red-500 text-xs mt-2 flex items-center">
                                    <i className="fas fa-exclamation-circle mr-1"></i>
                                    {validationErrors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
                                <i className="fas fa-envelope mr-2 text-blue-600"></i>
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                className={`w-full px-4 py-3 border rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    validationErrors.email
                                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                                autoComplete="new-email"
                                placeholder="Enter your email address"
                                required
                            />
                            {validationErrors.email && (
                                <p className="text-red-500 text-xs mt-2 flex items-center">
                                    <i className="fas fa-exclamation-circle mr-1"></i>
                                    {validationErrors.email}
                                </p>
                            )}
                            {isValidating && email && !validationErrors.email && (
                                <p className="text-blue-500 text-xs mt-2 flex items-center">
                                    <i className="fas fa-spinner fa-spin mr-1"></i>
                                    Checking email availability...
                                </p>
                            )}
                        </div>

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
                                {WARD_NUMBERS.map(w => <option key={w} value={w}>Ward {w}</option>)}
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
                                placeholder="Enter a secure password"
                                error={validationErrors.password}
                                required
                                className="w-full"
                            />
                            {!validationErrors.password && password && (
                                <div className="mt-2">
                                    <div className="flex space-x-1">
                                        <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <div className={`h-1 flex-1 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <div className={`h-1 flex-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <div className={`h-1 flex-1 rounded-full ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    </div>
                                    <p className="text-green-600 text-xs mt-1">Password strength indicator</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="confirmPassword">
                                <i className="fas fa-lock mr-2 text-blue-600"></i>
                                Confirm Password
                            </label>
                            <PasswordInput
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                placeholder="Confirm your password"
                                error={validationErrors.confirmPassword}
                                required
                                className="w-full"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || isValidating}
                            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                                loading || isValidating
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <Spinner />
                                    <span className="ml-2">Creating Account...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <i className="fas fa-user-plus mr-2"></i>
                                    Create Account
                                </div>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="px-4 text-gray-500 text-sm">or</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    {/* Google Sign-In */}
                    <GoogleSignIn onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
