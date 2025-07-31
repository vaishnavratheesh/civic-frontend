
import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 text-gray-800">
            <header className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <i className="fas fa-brain text-3xl text-blue-600"></i>
                    <h1 className="text-2xl font-bold text-gray-800">CivicBrain+</h1>
                </div>
                <nav className="space-x-2 sm:space-x-4">
                    <Link to="/login" className="font-semibold text-gray-600 hover:text-blue-600 transition-colors px-2 py-2 sm:px-4">Login</Link>
                    <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                        Register
                    </Link>
                </nav>
            </header>

            <main className="container mx-auto px-6 py-16 sm:py-24 text-center flex flex-col items-center">
                <div className="max-w-4xl">
                    <h2 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-down">
                        Empowering Communities, <span className="text-blue-600">One Voice at a Time.</span>
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 mb-8 animate-fade-in-up">
                        Your platform to report civic issues, connect with your representatives, and access welfare schemes. Together, let's build a smarter, more responsive city.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
                        <Link
                            to="/login"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 transform hover:scale-105 shadow-lg"
                        >
                            Get Started
                        </Link>
                        <Link
                            to="/register"
                            className="bg-white hover:bg-gray-50 text-blue-600 font-bold py-3 px-8 rounded-full text-lg transition duration-300 transform hover:scale-105 shadow-lg border-2 border-blue-600"
                        >
                            Register Now
                        </Link>
                    </div>
                </div>
            </main>
            
            <section className="container mx-auto px-6 py-16">
                 <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div className="p-6">
                        <i className="fas fa-bullhorn text-5xl text-blue-500 mb-4"></i>
                        <h3 className="text-xl font-bold mb-2">Report Issues</h3>
                        <p className="text-gray-600">Quickly report grievances with images and get real-time status updates.</p>
                    </div>
                     <div className="p-6">
                        <i className="fas fa-hands-helping text-5xl text-green-500 mb-4"></i>
                        <h3 className="text-xl font-bold mb-2">Access Welfare</h3>
                        <p className="text-gray-600">Apply for beneficial government schemes with a simple, transparent process.</p>
                    </div>
                     <div className="p-6">
                        <i className="fas fa-chart-line text-5xl text-indigo-500 mb-4"></i>
                        <h3 className="text-xl font-bold mb-2">Drive Change</h3>
                        <p className="text-gray-600">See AI-driven insights and help your representatives make data-backed decisions.</p>
                    </div>
                 </div>
            </section>

            <footer className="text-center py-8 text-gray-500">
                <p>&copy; {new Date().getFullYear()} CivicBrain+. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Landing;