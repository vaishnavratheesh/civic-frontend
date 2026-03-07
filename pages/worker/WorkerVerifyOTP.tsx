import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import Spinner from '../../components/Spinner';
import axios from 'axios';

const WorkerVerifyOTP: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const email = location.state?.email || '';
    const name = location.state?.name || '';

    useEffect(() => {
        if (!email) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Access',
                text: 'Please register first',
                confirmButtonText: 'OK'
            }).then(() => {
                navigate('/worker/login');
            });
        }
    }, [email, navigate]);

    useEffect(() => {
        if (timer > 0) {
            const countdown = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(countdown);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid OTP',
                text: 'Please enter a 6-digit OTP',
                confirmButtonText: 'OK'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/worker/verify-otp`,
                { email, otp }
            );

            if (response.data.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Email Verified!',
                    html: `
                        <p class="mb-2">${response.data.message}</p>
                        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p class="text-sm text-blue-800">
                                <i class="fas fa-info-circle mr-2"></i>
                                Your registration is pending admin approval. You will receive an email notification once your account is approved.
                            </p>
                        </div>
                    `,
                    confirmButtonText: 'Back to Login'
                });

                navigate('/worker/login');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'OTP verification failed';
            
            Swal.fire({
                icon: 'error',
                title: 'Verification Failed',
                text: errorMessage,
                confirmButtonText: 'Try Again'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResending(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/worker/resend-otp`,
                { email }
            );

            await Swal.fire({
                icon: 'success',
                title: 'OTP Resent!',
                text: response.data.message,
                timer: 2000,
                showConfirmButton: false
            });

            setTimer(60);
            setCanResend(false);
            setOtp('');
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to resend OTP';
            
            Swal.fire({
                icon: 'error',
                title: 'Resend Failed',
                text: errorMessage,
                confirmButtonText: 'OK'
            });
        } finally {
            setResending(false);
        }
    };

    const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(value);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white text-center">
                    <div className="mb-4">
                        <i className="fas fa-envelope-open-text text-5xl"></i>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
                    <p className="text-purple-100">Worker Registration - Erumeli Panchayath</p>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="text-center mb-6">
                        <p className="text-gray-700 mb-2">
                            Hi <strong>{name}</strong>! We've sent a 6-digit OTP to:
                        </p>
                        <p className="text-purple-600 font-semibold text-lg">{email}</p>
                    </div>

                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        {/* OTP Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                Enter OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={handleOTPChange}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full px-4 py-4 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                disabled={loading || resending}
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Please enter the 6-digit code sent to your email
                            </p>
                        </div>

                        {/* Verify Button */}
                        <button
                            type="submit"
                            disabled={loading || resending || otp.length !== 6}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <Spinner />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check-circle"></i>
                                    <span>Verify OTP</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Resend OTP */}
                    <div className="mt-6 text-center">
                        {!canResend ? (
                            <p className="text-sm text-gray-600">
                                <i className="fas fa-clock mr-1 text-blue-500"></i>
                                Resend OTP in <strong className="text-purple-600">{timer}s</strong>
                            </p>
                        ) : (
                            <button
                                onClick={handleResendOTP}
                                disabled={resending}
                                className="text-purple-600 hover:text-purple-800 font-semibold text-sm disabled:opacity-50"
                            >
                                {resending ? (
                                    <><Spinner /> Resending...</>
                                ) : (
                                    <><i className="fas fa-redo mr-1"></i>Resend OTP</>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">
                            <i className="fas fa-info-circle mr-2"></i>
                            What happens next?
                        </h3>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>✓ Email verification will be completed</li>
                            <li>✓ Your registration will be sent to admin for approval</li>
                            <li>✓ You'll receive an email once approved</li>
                            <li>✓ After approval, you can login and start working</li>
                        </ul>
                    </div>

                    {/* Back Button */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/worker/login')}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                            <i className="fas fa-arrow-left mr-1"></i>
                            Back to Login
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                            <i className="fas fa-shield-alt text-green-500"></i>
                            <span>Secure</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                            <i className="fas fa-clock text-blue-500"></i>
                            <span>OTP valid for 10 minutes</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkerVerifyOTP;
