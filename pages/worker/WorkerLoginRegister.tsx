import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Spinner from '../../components/Spinner';
import PasswordInput from '../../components/PasswordInput';
import { WARD_NUMBERS } from '../../constants';
import axios from 'axios';

const WorkerLoginRegister: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    
    // Login state
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    // Register state
    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        type: '',
        contact: '',
        ward: '1',
        specialization: '',
        experience: ''
    });

    const workerTypes = [
        { value: 'harithakarmasena', label: 'Haritha Karma Sena', doc: 'Haritha Karma Sena Certificate' },
        { value: 'plumber', label: 'Plumber', doc: 'Plumber License/Certificate' },
        { value: 'electrician', label: 'Electrician', doc: 'Electrician License' },
        { value: 'water_authority', label: 'Water Authority', doc: 'Water Authority ID' },
        { value: 'sanitation_worker', label: 'Sanitation Worker', doc: 'Employment Certificate' },
        { value: 'road_contractor', label: 'Road Contractor', doc: 'Contractor License' },
        { value: 'civil_engineer', label: 'Civil Engineer', doc: 'Engineering Degree Certificate' },
        { value: 'mason', label: 'Mason', doc: 'Trade Certificate' },
        { value: 'kseb_technician', label: 'KSEB Technician', doc: 'KSEB ID Card' },
        { value: 'drainage_worker', label: 'Drainage Worker', doc: 'Employment Certificate' },
        { value: 'maintenance_worker', label: 'Maintenance Worker', doc: 'Employment Certificate' },
        { value: 'supervisor', label: 'Supervisor', doc: 'Supervisor Certificate' },
        { value: 'pipe_fitter', label: 'Pipe Fitter', doc: 'Trade Certificate' },
        { value: 'police', label: 'Police', doc: 'Police ID' },
        { value: 'municipal_inspector', label: 'Municipal Inspector', doc: 'Municipal ID' },
        { value: 'general_worker', label: 'General Worker', doc: 'Employment Certificate' }
    ];

    // Login handlers
    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value
        });
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!loginData.email || !loginData.password) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Fields',
                text: 'Please enter both email and password',
                confirmButtonText: 'OK'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/worker/auth/login`,
                loginData
            );

            if (response.data.token) {
                localStorage.setItem('workerToken', response.data.token);
                localStorage.setItem('workerData', JSON.stringify(response.data.worker));

                await Swal.fire({
                    icon: 'success',
                    title: 'Login Successful!',
                    text: `Welcome back, ${response.data.worker.name}`,
                    timer: 2000,
                    showConfirmButton: false
                });

                navigate('/worker/dashboard');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Invalid credentials';
            
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: errorMessage,
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    };

    // Register handlers
    const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setRegisterData({
            ...registerData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!registerData.name || !registerData.email || !registerData.password || 
            !registerData.type || !registerData.contact || !registerData.ward) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Fields',
                text: 'Please fill in all required fields',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (registerData.password !== registerData.confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Password Mismatch',
                text: 'Passwords do not match',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (registerData.password.length < 6) {
            Swal.fire({
                icon: 'error',
                title: 'Weak Password',
                text: 'Password must be at least 6 characters long',
                confirmButtonText: 'OK'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/worker/register`,
                {
                    name: registerData.name,
                    email: registerData.email,
                    password: registerData.password,
                    type: registerData.type,
                    contact: registerData.contact,
                    ward: registerData.ward,
                    specialization: registerData.specialization,
                    experience: registerData.experience ? parseInt(registerData.experience) : 0
                }
            );

            if (response.data.email) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Registration Successful!',
                    text: 'OTP has been sent to your email. Please verify to complete registration.',
                    confirmButtonText: 'Verify OTP'
                });

                // Navigate to OTP verification page
                navigate('/worker/verify-otp', { 
                    state: { 
                        email: response.data.email,
                        name: registerData.name
                    } 
                });
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Registration failed';
            
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: errorMessage,
                confirmButtonText: 'Try Again'
            });
        } finally {
            setLoading(false);
        }
    };

    const selectedWorkerType = workerTypes.find(w => w.value === registerData.type);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white text-center">
                    <div className="mb-3">
                        <i className="fas fa-hard-hat text-5xl"></i>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Worker Portal</h1>
                    <p className="text-purple-100">Erumeli Panchayath - Worker Registration & Login</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('login')}
                        className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                            activeTab === 'login'
                                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <i className="fas fa-sign-in-alt mr-2"></i>
                        Login
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                            activeTab === 'register'
                                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <i className="fas fa-user-plus mr-2"></i>
                        Register
                    </button>
                </div>

                {/* Forms */}
                <div className="p-8">
                    {/* Login Form */}
                    {activeTab === 'login' && (
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome Back!</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fas fa-envelope mr-2 text-purple-600"></i>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={loginData.email}
                                    onChange={handleLoginChange}
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fas fa-lock mr-2 text-purple-600"></i>
                                    Password
                                </label>
                                <PasswordInput
                                    id="login-password"
                                    value={loginData.password}
                                    onChange={(e) => handleLoginChange(e)}
                                    placeholder="Enter your password"
                                    name="password"
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <><Spinner /> Signing In...</>
                                ) : (
                                    <><i className="fas fa-sign-in-alt mr-2"></i>Sign In</>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Register Form */}
                    {activeTab === 'register' && (
                        <form onSubmit={handleRegisterSubmit} className="space-y-5">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Worker Account</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={registerData.name}
                                        onChange={handleRegisterChange}
                                        placeholder="Your full name"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={registerData.email}
                                        onChange={handleRegisterChange}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Worker Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="type"
                                        value={registerData.type}
                                        onChange={handleRegisterChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        {workerTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contact Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="contact"
                                        value={registerData.contact}
                                        onChange={handleRegisterChange}
                                        placeholder="10-digit mobile"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ward Number <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="ward"
                                        value={registerData.ward}
                                        onChange={handleRegisterChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        required
                                    >
                                        {WARD_NUMBERS.map(ward => (
                                            <option key={ward} value={ward}>Ward {ward}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Experience (Years)
                                    </label>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={registerData.experience}
                                        onChange={handleRegisterChange}
                                        placeholder="Years of experience"
                                        min="0"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Specialization (Optional)
                                </label>
                                <input
                                    type="text"
                                    name="specialization"
                                    value={registerData.specialization}
                                    onChange={handleRegisterChange}
                                    placeholder="e.g., Pipeline repairs, Road construction"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <PasswordInput
                                        id="register-password"
                                        value={registerData.password}
                                        onChange={(e) => handleRegisterChange(e)}
                                        placeholder="Create password (min 6 chars)"
                                        name="password"
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <PasswordInput
                                        id="register-confirm-password"
                                        value={registerData.confirmPassword}
                                        onChange={(e) => handleRegisterChange(e)}
                                        placeholder="Confirm your password"
                                        name="confirmPassword"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {selectedWorkerType && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        <strong>Required Document:</strong> {selectedWorkerType.doc}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        You can upload this document after email verification for admin approval.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <><Spinner /> Registering...</>
                                ) : (
                                    <><i className="fas fa-user-plus mr-2"></i>Register & Send OTP</>
                                )}
                            </button>

                            <p className="text-xs text-gray-600 text-center mt-4">
                                By registering, your account will be pending admin approval after email verification.
                            </p>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                        <button
                            onClick={() => navigate('/')}
                            className="text-purple-600 hover:text-purple-800 font-medium"
                        >
                            <i className="fas fa-arrow-left mr-1"></i>
                            Back to Home
                        </button>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span><i className="fas fa-shield-alt text-green-500"></i> Secure</span>
                            <span><i className="fas fa-check-circle text-blue-500"></i> Verified</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkerLoginRegister;
