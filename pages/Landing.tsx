
import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white shadow-lg border-b-4 border-blue-800">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
                            <i className="fas fa-landmark text-white text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Civic+</h1>
                            <p className="text-xs text-gray-600 font-medium">Government of India Initiative</p>
                        </div>
                    </div>
                    <nav className="flex items-center space-x-6">
                        <Link to="/login" className="text-gray-700 hover:text-blue-800 font-semibold transition-colors duration-200">
                            Sign In
                        </Link>
                        <Link to="/register" className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                            Register Now
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-6 py-16 sm:py-24">
                <div className="text-center max-w-5xl mx-auto">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-800 to-blue-900 rounded-full shadow-2xl mb-6">
                            <i className="fas fa-shield-alt text-white text-3xl"></i>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
                            <span className="text-gray-800">Empowering</span>
                            <br />
                            <span className="bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent">
                                Digital Democracy
                            </span>
                        </h2>
                        <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                            Your official platform for civic engagement, grievance redressal, and welfare scheme applications. 
                            <span className="font-semibold text-blue-800"> Building a transparent, responsive government together.</span>
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
                        <Link
                            to="/register"
                            className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3"
                        >
                            <i className="fas fa-user-plus text-xl"></i>
                            <span>Register as Citizen</span>
                        </Link>
                        <Link
                            to="/login"
                            className="bg-white hover:bg-gray-50 text-blue-800 font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-blue-800 flex items-center justify-center space-x-3"
                        >
                            <i className="fas fa-sign-in-alt text-xl"></i>
                            <span>Access Portal</span>
                        </Link>
                    </div>
                </div>
            </main>
            
            {/* Features Section */}
            <section className="bg-white py-20 border-t border-gray-200">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h3 className="text-4xl font-bold text-gray-800 mb-4">Official Government Services</h3>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Comprehensive digital solutions for citizen-government interaction, ensuring transparency and efficiency in public service delivery.
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                                <i className="fas fa-exclamation-triangle text-white text-2xl"></i>
                            </div>
                            <h4 className="text-2xl font-bold text-gray-800 mb-4">Grievance Redressal</h4>
                            <p className="text-gray-600 leading-relaxed">
                                Report civic issues with photo evidence and track resolution status in real-time. 
                                Direct communication with local authorities for prompt action.
                            </p>
                        </div>
                        
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                                <i className="fas fa-hands-helping text-white text-2xl"></i>
                            </div>
                            <h4 className="text-2xl font-bold text-gray-800 mb-4">Welfare Schemes</h4>
                            <p className="text-gray-600 leading-relaxed">
                                Apply for government welfare programs with simplified digital processes. 
                                Transparent eligibility assessment and application tracking.
                            </p>
                        </div>
                        
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                                <i className="fas fa-chart-line text-white text-2xl"></i>
                            </div>
                            <h4 className="text-2xl font-bold text-gray-800 mb-4">Data-Driven Governance</h4>
                            <p className="text-gray-600 leading-relaxed">
                                AI-powered insights for informed decision-making. 
                                Community analytics and performance metrics for better public service delivery.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Government Badge Section */}
            <section className="bg-gradient-to-r from-blue-800 to-blue-900 py-16">
                <div className="container mx-auto px-6 text-center">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center space-x-4 mb-8">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <i className="fas fa-award text-blue-800 text-2xl"></i>
                            </div>
                            <h3 className="text-3xl font-bold text-white">Official Government Platform</h3>
                        </div>
                        <p className="text-xl text-blue-100 mb-8">
                            Certified by the Ministry of Electronics and Information Technology (MeitY)
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-400 mb-2">100%</div>
                                <div className="text-blue-100">Secure</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
                                <div className="text-blue-100">Available</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-400 mb-2">Real-time</div>
                                <div className="text-blue-100">Tracking</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-400 mb-2">Zero</div>
                                <div className="text-blue-100">Corruption</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-landmark text-white"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold">Civic+</h4>
                                    <p className="text-xs text-gray-400">Government Initiative</p>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Empowering citizens through digital governance and transparent public service delivery.
                            </p>
                        </div>
                        
                        <div>
                            <h5 className="font-bold mb-4 text-blue-300">Quick Links</h5>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link></li>
                                <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">Register</Link></li>
                                <li><Link to="/citizen/help" className="text-gray-400 hover:text-white transition-colors">Help & Support</Link></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h5 className="font-bold mb-4 text-blue-300">Services</h5>
                            <ul className="space-y-2 text-sm">
                                <li className="text-gray-400">Grievance Redressal</li>
                                <li className="text-gray-400">Welfare Schemes</li>
                                <li className="text-gray-400">Community Engagement</li>
                                <li className="text-gray-400">Government Updates</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h5 className="font-bold mb-4 text-blue-300">Contact</h5>
                            <ul className="space-y-2 text-sm">
                                <li className="text-gray-400 flex items-center space-x-2">
                                    <i className="fas fa-phone text-blue-400"></i>
                                    <span>1800-XXX-XXXX</span>
                                </li>
                                <li className="text-gray-400 flex items-center space-x-2">
                                    <i className="fas fa-envelope text-blue-400"></i>
                                    <span>support@civicbrain.gov.in</span>
                                </li>
                                <li className="text-gray-400 flex items-center space-x-2">
                                    <i className="fas fa-map-marker-alt text-blue-400"></i>
                                    <span>New Delhi, India</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center">
                        <p className="text-gray-400 text-sm">
                            &copy; {new Date().getFullYear()} Civic+. An initiative of the Government of India. 
                            All rights reserved. | 
                            <Link to="#" className="text-blue-400 hover:text-blue-300 ml-2">Privacy Policy</Link> | 
                            <Link to="#" className="text-blue-400 hover:text-blue-300 ml-2">Terms of Service</Link>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;