
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Role, User } from '../types';
import Spinner from '../components/Spinner';
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
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
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
                setError(err.response.data.error || 'Login failed');
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
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
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 disabled:bg-blue-300"
                        >
                            {loading ? <Spinner size="sm" /> : 'Sign In'}
                        </button>
                    </div>
                </form>
                <p className="text-center text-gray-600 mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800">
                        Register as a Citizen
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
