
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Role, User } from '../types';
import { PANCHAYATH_NAMES, PANCHAYATH_DATA } from '../constants';
import Spinner from '../components/Spinner';
import GoogleSignIn from '../components/GoogleSignIn';
import { decodeGoogleCredential, googleAuthRegister } from '../utils/googleAuth';
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
    const { login } = useAuth();
    const navigate = useNavigate();

    // Get available wards based on selected panchayath
    const availableWards = panchayath ? PANCHAYATH_DATA[panchayath as keyof typeof PANCHAYATH_DATA] || [] : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (!panchayath) {
            setError('Please select a Panchayath/Municipality.');
            return;
        }

        setLoading(true);
        try {
            await registerUser(name, email, ward, password, panchayath);
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.error || 'Registration failed');
            } else {
                setError('Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    // Reset ward when panchayath changes
    const handlePanchayathChange = (selectedPanchayath: string) => {
        setPanchayath(selectedPanchayath);
        if (selectedPanchayath && PANCHAYATH_DATA[selectedPanchayath as keyof typeof PANCHAYATH_DATA]) {
            setWard(PANCHAYATH_DATA[selectedPanchayath as keyof typeof PANCHAYATH_DATA][0]);
        }
    };

    const handleGoogleSuccess = async (credential: string) => {
        setError('');

        if (!panchayath) {
            setError('Please select a Panchayath/Municipality before signing up with Google.');
            return;
        }

        setLoading(true);

        try {
            // Use the complete registration endpoint that returns user data and token
            const response = await axios.post('http://localhost:3001/api/google-register-complete', {
                credential,
                ward,
                panchayath,
            });

            // Create user object and login immediately
            const userInfo = decodeGoogleCredential(credential);
            const user: User = {
                id: response.data.userId,
                name: userInfo?.name || 'Google User',
                email: userInfo?.email || '',
                role: Role.CITIZEN,
                ward: ward,
                approved: true,
                token: response.data.token,
                panchayath: panchayath
            };

            login(user);
            navigate('/citizen'); // Direct redirect to citizen dashboard
        } catch (err: any) {
            console.error(err);
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.data.error?.includes('already exists')) {
                    setError('An account with this email already exists. Please try logging in instead.');
                } else {
                    setError(err.response.data.error || 'Google registration failed');
                }
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                     <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="panchayath">
                            Panchayath/Municipality
                        </label>
                        <select
                            id="panchayath"
                            value={panchayath}
                            onChange={(e) => handlePanchayathChange(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            required
                        >
                            <option value="">Select Panchayath/Municipality</option>
                            {PANCHAYATH_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ward">
                            Ward Number
                        </label>
                        <select
                            id="ward"
                            value={ward}
                            onChange={(e) => setWard(Number(e.target.value))}
                            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            required
                            disabled={!panchayath}
                        >
                            {availableWards.map(w => <option key={w} value={w}>Ward {w}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="******************"
                            required
                        />
                    </div>
                     <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
                           Confirm Password
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="******************"
                            required
                        />
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 disabled:bg-blue-300"
                        >
                            {loading ? <Spinner size="sm" /> : 'Register'}
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

                    {!panchayath && (
                        <p className="text-center text-sm text-amber-600 mt-2">
                            Please select a Panchayath/Municipality above before using Google Sign-Up
                        </p>
                    )}
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
