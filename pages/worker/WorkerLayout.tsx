import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../hooks/useAuth';

const WorkerLayout: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('workerToken');
        if (!token) {
            navigate('/worker/login');
        }
    }, [navigate]);

    const workerData = JSON.parse(localStorage.getItem('workerData') || '{}');
    const workerName = workerData.name || user?.name || 'Worker';
    const workerType = (workerData.type || user?.role || 'worker').replace('_', ' ').toUpperCase();
    const workerWard = workerData.ward || user?.ward || 'N/A';
    const profilePic = workerData.profilePicture
        ? `${import.meta.env.VITE_BACKEND_URL}${workerData.profilePicture}`
        : `https://ui-avatars.com/api/?name=${workerName}&background=random`;

    const handleLogout = () => {
        Swal.fire({
            title: 'Logout?',
            text: 'Are you sure you want to end your session?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#7c3aed',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Logout'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('workerToken');
                localStorage.removeItem('workerData');
                navigate('/worker/login');
            }
        });
    };

    const navItems = [
        { path: '/worker/dashboard', label: 'Overview', icon: 'fas fa-th-large' },
        { path: '/worker/tasks', label: 'My Tasks', icon: 'fas fa-tasks' },
        { path: '/worker/profile', label: 'Profile', icon: 'fas fa-user-circle' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-20">
                <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                        C+
                    </div>
                    <span className="text-xl font-bold text-gray-800 tracking-tight">Civic<span className="text-purple-600">+</span></span>
                </div>

                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6 p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <img
                            src={profilePic}
                            alt={workerName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div className="overflow-hidden">
                            <h3 className="font-semibold text-gray-800 text-sm truncate">{workerName}</h3>
                            <p className="text-xs text-purple-600 truncate">{workerType}</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
                                    }`
                                }
                            >
                                <i className={`${item.icon} w-5 text-center group-hover:scale-110 transition-transform`}></i>
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
                    >
                        <i className="fas fa-sign-out-alt w-5 text-center"></i>
                        <span className="font-medium">Logout</span>
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-4">v1.0.0 • Ward {workerWard}</p>
                </div>
            </aside>

            {/* Mobile Header & Overlay */}
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>

            {/* Mobile Sidebar */}
            <aside className={`fixed top-0 left-0 w-64 h-full bg-white z-40 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">Civic<span className="text-purple-600">+</span></span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500"><i className="fas fa-times text-xl"></i></button>
                </div>
                <div className="p-4">
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-purple-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                <i className={`${item.icon} w-5 text-center`}></i>
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto p-6 border-t border-gray-100 absolute bottom-0 w-full">
                    <button onClick={handleLogout} className="flex items-center space-x-3 text-red-600 font-medium">
                        <i className="fas fa-sign-out-alt"></i> <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all">
                {/* Mobile Topbar */}
                <header className="md:hidden bg-white shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600">
                        <i className="fas fa-bars text-xl"></i>
                    </button>
                    <span className="font-bold text-gray-800">{navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}</span>
                    <img src={profilePic} alt="Profile" className="w-8 h-8 rounded-full" />
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default WorkerLayout;
