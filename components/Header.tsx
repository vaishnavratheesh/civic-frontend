
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import { useNavigate } from 'react-router-dom';

const roleDisplayNames: Record<Role, string> = {
    [Role.ADMIN]: 'Admin',
    [Role.COUNCILLOR]: 'Councillor',
    [Role.OFFICER]: 'Officer',
    [Role.CITIZEN]: 'Citizen',
};

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <i className="fas fa-brain text-3xl text-blue-600"></i>
                    <h1 className="text-2xl font-bold text-gray-800">Civic+</h1>
                </div>
                {user && (
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="font-semibold text-gray-700">{user.name}</p>
                            <p className="text-sm text-gray-500">{roleDisplayNames[user.role]}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center space-x-2"
                        >
                            <i className="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
