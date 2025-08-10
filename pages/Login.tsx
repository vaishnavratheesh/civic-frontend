
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Role, User } from '../types';
import Spinner from '../components/Spinner';
import GoogleSignIn from '../components/GoogleSignIn';
import { decodeGoogleCredential, googleAuthLogin } from '../utils/googleAuth';
import {
    validateEmail,
    validatePassword,
    checkEmailExists,
    ValidationErrors,
    hasValidationErrors
} from '../utils/formValidation';
import axios from 'axios';

/// <reference types="vite/client" />

// Real API call for login
const loginUser = async (email: string, password: string) => {
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002'}/api/login`, {
        email,
        password,
    });
    return response.data;
};

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [formKey, setFormKey] = useState(Date.now()); // Force fresh form
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isValidating, setIsValidating] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Force clear fields on component mount
    useEffect(() => {
        setEmail('');
        setPassword('');
        setFormKey(Date.now());
        setValidationErrors({});
    }, []);

    // Real-time email validation
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);

        // Clear previous errors
        setValidationErrors(prev => ({ ...prev, email: undefined }));
        setError('');

        // Validate email in real-time (with debounce effect)
        if (newEmail) {
            const validation = validateEmail(newEmail);
            if (!validation.isValid) {
                setValidationErrors(prev => ({ ...prev, email: validation.error }));
            }
        }
    };

    // Real-time password validation
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);

        // Clear previous errors
        setValidationErrors(prev => ({ ...prev, password: undefined }));
        setError('');

        // Validate password in real-time
        if (newPassword) {
            const validation = validatePassword(newPassword);
            if (!validation.isValid) {
                setValidationErrors(prev => ({ ...prev, password: validation.error }));
            }
        }
    };

    // Comprehensive form validation
    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};

        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            errors.email = emailValidation.error;
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            errors.password = passwordValidation.error;
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setValidationErrors({});

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setIsValidating(true);

        try {
            // Additional email existence check for better UX
            const emailExists = await checkEmailExists(email);
            if (!emailExists) {
                setError('No account found with this email address. Please check your email or register for a new account.');
                return;
            }

            const response = await loginUser(email, password);

            // Debug: Log the response
            console.log('🔍 Login response:', response);

            // Create user object from backend response
            const user: User = {
                id: response.userId || 'user-citizen',
                name: response.name || 'Citizen User',
                email: email,
                role: Role.CITIZEN, // Default to citizen role for now
                ward: response.ward || 1,
                approved: true,
                token: response.token,
                panchayath: response.panchayath || '',
                profilePicture: response.profilePicture || ''
            };

            // Debug: Log the user object
            console.log('🔍 User object created:', user);

            login(user);
            navigate('/citizen'); // Redirect to citizen dashboard
        } catch (err: any) {
            console.error(err);
            if (axios.isAxiosError(err) && err.response) {
                const errorMessage = err.response.data.error || 'Login failed';

                // Provide specific error messages based on response
                if (errorMessage.includes('Invalid credentials') || errorMessage.includes('password')) {
                    setError('Invalid email or password. Please check your credentials and try again.');
                } else if (errorMessage.includes('not verified') || errorMessage.includes('verify')) {
                    setError('Please verify your email address before logging in. Check your inbox for the verification email.');
                } else if (errorMessage.includes('account not found')) {
                    setError('No account found with this email address. Please register for a new account.');
                } else {
                    setError(errorMessage);
                }
            } else {
                setError('Login failed. Please check your internet connection and try again.');
            }
        } finally {
            setLoading(false);
            setIsValidating(false);
        }
    };

    const handleGoogleSuccess = async (credential: string) => {
        setError('');
        setLoading(true);

        try {
            const response = await googleAuthLogin(credential);

            // Debug: Log the Google login response
            console.log('🔍 Google login response:', response);

            // Create user object from backend response
            const user: User = {
                id: response.userId || 'user-citizen',
                name: response.name || 'Citizen User',
                email: response.email,
                role: Role.CITIZEN,
                ward: response.ward || 1,
                approved: true,
                token: response.token,
                panchayath: response.panchayath || '',
                profilePicture: response.profilePicture || ''
            };

            // Debug: Log the user object
            console.log('🔍 Google user object created:', user);

            login(user);
            navigate('/citizen');
        } catch (err: any) {
            console.error(err);

            // Check if this is a "no account found" error
            if (err.message.includes('No account found') ||
                (axios.isAxiosError(err) && err.response?.data?.error?.includes('No account found'))) {

                // Decode Google credential to get user info
                const userInfo = decodeGoogleCredential(credential);
                if (userInfo) {
                    // Redirect to complete profile page with Google user data
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
                    return;
                }
            }

            setError('Google login failed. Please try again.');
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
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-8 py-6 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <i className="fas fa-shield-alt text-blue-800 text-2xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Government Portal Access</h2>
                    <p className="text-blue-100 text-sm">Civic+ - Official Citizen Platform</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Sign In to Your Account</h3>
                        <p className="text-gray-600 text-sm">Access government services and civic engagement tools</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6" role="alert">
                            <div className="flex items-center">
                                <i className="fas fa-exclamation-triangle mr-3"></i>
                                <div>
                                    <p className="font-medium">Authentication Error</p>
                                    <p className="text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} autoComplete="off" key={formKey} className="space-y-6">
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
                                autoComplete="nope"
                                data-lpignore="true"
                                data-form-type="other"
                                placeholder="Enter your registered email"
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
                                    Validating email...
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                                <i className="fas fa-lock mr-2 text-blue-600"></i>
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={handlePasswordChange}
                                className={`w-full px-4 py-3 border rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    validationErrors.password
                                        ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                                autoComplete="new-password"
                                data-lpignore="true"
                                data-form-type="other"
                                placeholder="Enter your password"
                                required
                            />
                            {validationErrors.password && (
                                <p className="text-red-500 text-xs mt-2 flex items-center">
                                    <i className="fas fa-exclamation-circle mr-1"></i>
                                    {validationErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Validation Summary */}
                        {hasValidationErrors(validationErrors) && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-center mb-3">
                                    <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                                    <span className="text-red-700 font-semibold text-sm">Please fix the following errors:</span>
                                </div>
                                <ul className="text-red-600 text-xs space-y-1">
                                    {validationErrors.email && <li>• {validationErrors.email}</li>}
                                    {validationErrors.password && <li>• {validationErrors.password}</li>}
                                </ul>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || isValidating || hasValidationErrors(validationErrors)}
                                className={`w-full font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                                    loading || isValidating || hasValidationErrors(validationErrors)
                                        ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                                        : 'bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <Spinner size="sm" />
                                        <span className="ml-2">Authenticating...</span>
                                    </div>
                                ) : isValidating ? (
                                    <div className="flex items-center justify-center">
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        <span>Validating...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <i className="fas fa-sign-in-alt mr-2"></i>
                                        <span>Sign In to Portal</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
                            <i className="fas fa-key mr-1"></i>
                            Forgot Password?
                        </Link>
                    </div>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <GoogleSignIn
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                text="continue_with"
                                theme="outline"
                                size="large"
                                width={384}
                            />
                        </div>
                    </div>

                    <div className="text-center mt-8 pt-6 border-t border-gray-200">
                        <p className="text-gray-600 mb-3">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                Register as Citizen
                            </Link>
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            New users can also use Google Sign-In above to create an account quickly.
                            You'll be asked to provide your location details during the process.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-4 text-center">
                    <p className="text-xs text-gray-500">
                        <i className="fas fa-shield-alt mr-1 text-blue-600"></i>
                        Secure Government Portal | 
                        <Link to="#" className="text-blue-600 hover:text-blue-800 ml-2">Privacy Policy</Link> | 
                        <Link to="#" className="text-blue-600 hover:text-blue-800 ml-2">Terms of Service</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
