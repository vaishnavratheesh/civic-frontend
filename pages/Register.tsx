
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Role, User } from '../types';
import { PANCHAYATH_NAMES, PANCHAYATH_DATA } from '../constants';
import Spinner from '../components/Spinner';
import GoogleSignIn from '../components/GoogleSignIn';
import { decodeGoogleCredential, googleAuthRegister } from '../utils/googleAuth';
import {
    validateName,
    validateEmailForRegistration,
    validatePassword,
    validateConfirmPassword,
    validatePanchayath,
    validateWard,
    ValidationErrors,
    hasValidationErrors
} from '../utils/formValidation';
import axios from 'axios';

// Real API call for registration
const registerUser = async (name: string, email: string, ward: number, password: string, panchayath: string) => {
    const response = await axios.post('http://localhost:3001/api/register', {
        name,
        email,
        ward,
        password,
        panchayath,
    });
    return response.data;
};

const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [panchayath, setPanchayath] = useState('');
    const [ward, setWard] = useState<number>(1);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isValidating, setIsValidating] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Get available wards based on selected panchayath
    const availableWards = panchayath ? PANCHAYATH_DATA[panchayath as keyof typeof PANCHAYATH_DATA] || [] : [];

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
            const confirmValidation = validateConfirmPassword(newPassword, confirmPassword);
            if (!confirmValidation.isValid) {
                setValidationErrors(prev => ({ ...prev, confirmPassword: confirmValidation.error }));
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

    const handlePanchayathChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPanchayath = e.target.value;
        setPanchayath(newPanchayath);
        setWard(1); // Reset ward when panchayath changes

        // Clear previous errors
        setValidationErrors(prev => ({ ...prev, panchayath: undefined, ward: undefined }));
        setError('');

        // Validate panchayath
        const validation = validatePanchayath(newPanchayath);
        if (!validation.isValid) {
            setValidationErrors(prev => ({ ...prev, panchayath: validation.error }));
        }
    };

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newWard = parseInt(e.target.value);
        setWard(newWard);

        // Clear previous errors
        setValidationErrors(prev => ({ ...prev, ward: undefined }));
        setError('');

        // Validate ward
        const validation = validateWard(newWard, availableWards);
        if (!validation.isValid) {
            setValidationErrors(prev => ({ ...prev, ward: validation.error }));
        }
    };

    // Comprehensive form validation
    const validateForm = async (): Promise<boolean> => {
        const errors: ValidationErrors = {};

        // Validate all fields
        const nameValidation = validateName(name);
        if (!nameValidation.isValid) {
            errors.name = nameValidation.error;
        }

        const emailValidation = await validateEmailForRegistration(email);
        if (!emailValidation.isValid) {
            errors.email = emailValidation.error;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            errors.password = passwordValidation.error;
        }

        const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
        if (!confirmPasswordValidation.isValid) {
            errors.confirmPassword = confirmPasswordValidation.error;
        }

        const panchayathValidation = validatePanchayath(panchayath);
        if (!panchayathValidation.isValid) {
            errors.panchayath = panchayathValidation.error;
        }

        const wardValidation = validateWard(ward, availableWards);
        if (!wardValidation.isValid) {
            errors.ward = wardValidation.error;
        }

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
            await registerUser(name, email, ward, password, panchayath);

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
            const checkResponse = await axios.post('http://localhost:3001/api/check-google-user', {
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 m-4">
                <div className="flex justify-center mb-6">
                     <i className="fas fa-user-plus text-6xl text-blue-600"></i>
                </div>
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Create Citizen Account</h2>
                <p className="text-center text-gray-500 mb-8">Join CivicBrain+ to make your voice heard.</p>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

                {/* Validation Summary */}
                {hasValidationErrors(validationErrors) && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center mb-2">
                            <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                            <span className="text-red-700 font-medium text-sm">Please fix the following errors:</span>
                        </div>
                        <ul className="text-red-600 text-xs space-y-1">
                            {validationErrors.name && <li>• {validationErrors.name}</li>}
                            {validationErrors.email && <li>• {validationErrors.email}</li>}
                            {validationErrors.password && <li>• {validationErrors.password}</li>}
                            {validationErrors.confirmPassword && <li>• {validationErrors.confirmPassword}</li>}
                            {validationErrors.panchayath && <li>• {validationErrors.panchayath}</li>}
                            {validationErrors.ward && <li>• {validationErrors.ward}</li>}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${
                                validationErrors.name
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'focus:ring-blue-500'
                            }`}
                            placeholder="Enter your full name"
                            required
                        />
                        {validationErrors.name && (
                            <p className="text-red-500 text-xs italic mt-1">
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {validationErrors.name}
                            </p>
                        )}
                    </div>
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
                                validationErrors.email
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'focus:ring-blue-500'
                            }`}
                            autoComplete="new-email"
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
                                Checking email availability...
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="panchayath">
                            Panchayath/Municipality
                        </label>
                        <select
                            id="panchayath"
                            value={panchayath}
                            onChange={handlePanchayathChange}
                            className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 bg-white ${
                                validationErrors.panchayath
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'focus:ring-blue-500'
                            }`}
                            required
                        >
                            <option value="">Select Panchayath/Municipality</option>
                            {PANCHAYATH_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {validationErrors.panchayath && (
                            <p className="text-red-500 text-xs italic mt-1">
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {validationErrors.panchayath}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ward">
                            Ward Number
                        </label>
                        <select
                            id="ward"
                            value={ward}
                            onChange={handleWardChange}
                            className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 bg-white ${
                                validationErrors.ward
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'focus:ring-blue-500'
                            }`}
                            required
                            disabled={!panchayath}
                        >
                            {availableWards.map(w => <option key={w} value={w}>Ward {w}</option>)}
                        </select>
                        {validationErrors.ward && (
                            <p className="text-red-500 text-xs italic mt-1">
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {validationErrors.ward}
                            </p>
                        )}
                        {!panchayath && (
                            <p className="text-gray-500 text-xs italic mt-1">
                                <i className="fas fa-info-circle mr-1"></i>
                                Please select a Panchayath/Municipality first
                            </p>
                        )}
                    </div>
                    <div>
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
                            placeholder="Enter a secure password"
                            required
                        />
                        {validationErrors.password && (
                            <p className="text-red-500 text-xs italic mt-1">
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {validationErrors.password}
                            </p>
                        )}
                        {!validationErrors.password && password && (
                            <p className="text-green-600 text-xs italic mt-1">
                                <i className="fas fa-check-circle mr-1"></i>
                                Password meets requirements
                            </p>
                        )}
                    </div>
                     <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
                           Confirm Password
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${
                                validationErrors.confirmPassword
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'focus:ring-blue-500'
                            }`}
                            autoComplete="new-password"
                            placeholder="Confirm your password"
                            required
                        />
                        {validationErrors.confirmPassword && (
                            <p className="text-red-500 text-xs italic mt-1">
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {validationErrors.confirmPassword}
                            </p>
                        )}
                        {!validationErrors.confirmPassword && confirmPassword && password === confirmPassword && (
                            <p className="text-green-600 text-xs italic mt-1">
                                <i className="fas fa-check-circle mr-1"></i>
                                Passwords match
                            </p>
                        )}
                    </div>
                    <div className="pt-2">
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
                                    <span className="ml-2">Creating Account...</span>
                                </div>
                            ) : isValidating ? (
                                <div className="flex items-center justify-center">
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    <span>Validating...</span>
                                </div>
                            ) : (
                                'Create Account'
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
                            text="signup_with"
                            theme="outline"
                            size="large"
                            width={384}
                        />
                    </div>
                </div>

                <p className="text-center text-gray-600 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-blue-600 hover:text-blue-800">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
