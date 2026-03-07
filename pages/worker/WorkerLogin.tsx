import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Spinner from '../../components/Spinner';
import PasswordInput from '../../components/PasswordInput';
import { WARD_NUMBERS } from '../../constants';
import axios from 'axios';
import { API_ENDPOINTS } from '../../src/config/config';

const WorkerLogin: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        workerId: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.workerId || !formData.password) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Fields',
                text: 'Please enter both Worker ID and Password',
                confirmButtonText: 'OK'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/worker/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store token and worker info
                localStorage.setItem('workerToken', data.token);
                localStorage.setItem('workerData', JSON.stringify(data.worker));

                await Swal.fire({
                    icon: 'success',
                    title: 'Login Successful!',
                    text: `Welcome back, ${data.worker.name}`,
                    timer: 2000,
                    showConfirmButton: false
                });

                navigate('/worker/dashboard');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: data.message || 'Invalid credentials',
                    confirmButtonText: 'Try Again'
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: 'Unable to connect to server. Please try again.',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white text-center">
                    <div className="mb-4">
                        <i className="fas fa-hard-hat text-5xl"></i>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Worker Portal</h1>
                    <p className="text-purple-100">Erumeli Panchayath</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Welcome Back!</h2>
                    <p className="text-gray-600 text-center mb-6">Sign in to manage your tasks</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Worker ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <i className="fas fa-id-card mr-2 text-purple-600"></i>
                                Worker ID
                            </label>
                            <input
                                type="text"
                                name="workerId"
                                value={formData.workerId}
                                onChange={handleChange}
                                placeholder="Enter your Worker ID"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                disabled={loading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <i className="fas fa-lock mr-2 text-purple-600"></i>
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <Spinner />
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt"></i>
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Help Text */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            <i className="fas fa-info-circle mr-1 text-blue-500"></i>
                            Contact your supervisor for login credentials
                        </p>
                    </div>

                    {/* Back to Home */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/')}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                            <i className="fas fa-arrow-left mr-1"></i>
                            Back to Home
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                            <i className="fas fa-shield-alt text-green-500"></i>
                            <span>Secure Login</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                            <i className="fas fa-clock text-blue-500"></i>
                            <span>24/7 Access</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkerLogin;
