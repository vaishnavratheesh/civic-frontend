
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

// Real API call for login
const loginUser = async (email: string, password: string) => {
    const response = await axios.post('http://localhost:3001/api/login', {
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

            // Create user object from backend response
            const user: User = {
                id: response.userId || 'user-citizen',
                name: response.name || 'Citizen User',
                email: email,
                role: Role.CITIZEN, // Default to citizen role for now
                ward: response.ward || 1,
                approved: true,
                token: response.token,
                panchayath: response.panchayath || ''
            };

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

            // Create user object from backend response
            const user: User = {
                id: response.userId || 'user-citizen',
                name: response.name || 'Citizen User',
                email: response.email,
                role: Role.CITIZEN,
                ward: response.ward || 1,
                approved: true,
                token: response.token,
                panchayath: response.panchayath || ''
            };

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
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 m-4">
                <div className="flex justify-center mb-6">
                     <i className="fas fa-brain text-6xl text-blue-600"></i>
                </div>
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Welcome to CivicBrain+</h2>
                <p className="text-center text-gray-500 mb-8">Sign in to your account</p>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                <form onSubmit={handleSubmit} autoComplete="off" key={formKey}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${
                                validationErrors.email
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'focus:ring-blue-500'
                            }`}
                            autoComplete="nope"
                            data-lpignore="true"
                            data-form-type="other"
                            placeholder="Enter your email address"
                            required
                        />
                        {validationErrors.email && (
                            <p className="text-red-500 text-xs italic mt-1">
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {validationErrors.email}
                            </p>
                        )}
                        {isValidating && email && !validationErrors.email && (
                            <p className="text-blue-500 text-xs italic mt-1">
                                <i className="fas fa-spinner fa-spin mr-1"></i>
                                Validating email...
                            </p>
                        )}
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${
                                validationErrors.password
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'focus:ring-blue-500'
                            }`}
                            autoComplete="new-password"
                            data-lpignore="true"
                            data-form-type="other"
                            placeholder="Enter your password"
                            required
                        />
                        {validationErrors.password && (
                            <p className="text-red-500 text-xs italic mt-1">
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {validationErrors.password}
                            </p>
                        )}
                    </div>
                    {/* Validation Summary */}
                    {hasValidationErrors(validationErrors) && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center mb-2">
                                <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                                <span className="text-red-700 font-medium text-sm">Please fix the following errors:</span>
                            </div>
                            <ul className="text-red-600 text-xs space-y-1">
                                {validationErrors.email && <li>• {validationErrors.email}</li>}
                                {validationErrors.password && <li>• {validationErrors.password}</li>}
                            </ul>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={loading || isValidating || hasValidationErrors(validationErrors)}
                            className={`w-full font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ${
                                loading || isValidating || hasValidationErrors(validationErrors)
                                    ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <Spinner size="sm" />
                                    <span className="ml-2">Signing In...</span>
                                </div>
                            ) : isValidating ? (
                                <div className="flex items-center justify-center">
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    <span>Validating...</span>
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
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

                <div className="text-center mt-6">
                    <p className="text-gray-600 mb-2">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800">
                            Register as a Citizen
                        </Link>
                    </p>
                    <p className="text-sm text-gray-500">
                        New users can also use Google Sign-In above to create an account quickly.
                        You'll be asked to provide your location details during the process.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
