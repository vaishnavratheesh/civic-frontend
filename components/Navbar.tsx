import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { notificationService, Notification } from '../services/notificationService';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
  title?: string;
  className?: string;
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title = 'Dashboard', className = '', onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasNewDot, setHasNewDot] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update notification count
  useEffect(() => {
    const updateNotificationCount = () => {
      if (user?.id) {
        const count = notificationService.getUnreadCount(user.id);
        setNotificationCount(count);
        if (count > 0) setHasNewDot(true);
      }
    };

    // Initial count only (no immediate scheme check to prevent spam)
    updateNotificationCount();

    // Poll for new schemes (5 minutes - very reduced frequency to prevent spam)
    const interval = setInterval(async () => {
      if (user?.ward && user?.role === 'citizen' && user?.id) {
        await notificationService.checkForNewSchemes(user.id, user.ward);
        updateNotificationCount();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [user?.ward, user?.role, user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'new_scheme') {
      // Navigate to welfare schemes tab
      navigate('/citizen');
      // You could also trigger a tab change event here
    }
    // Update notification count after clicking
    if (user?.id) {
      setNotificationCount(notificationService.getUnreadCount(user.id));
    }
  };

  const handleNotificationUpdate = () => {
    // Update notification count when notifications are modified
    if (user?.id) {
      setNotificationCount(notificationService.getUnreadCount(user.id));
    }
  };

  return (
    <nav className={`bg-white shadow-lg border-b border-gray-100 ${className}`}>
      <div className="px-6 py-4 flex justify-between items-center">
        {/* Left side - Burger menu and Civic+ title */}
        <div className="flex items-center space-x-4">
          {/* Burger menu button */}
          <button
            onClick={onMenuClick}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-all duration-200"
          >
            <i className="fas fa-bars text-lg"></i>
          </button>
          
          {/* Civic+ Title */}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Civic+
          </h1>
        </div>

        {/* Right side - User info and actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => {
                const next = !showNotifications;
                setShowNotifications(next);
                if (next) setHasNewDot(false);
              }}
              className="relative p-3 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:bg-gray-50 rounded-xl"
            >
              <i className="fas fa-bell text-xl"></i>
              {hasNewDot && !showNotifications && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {notificationCount}
                </span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {user?.id && (
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onNotificationClick={handleNotificationClick}
                onNotificationUpdate={handleNotificationUpdate}
                userId={user.id}
              />
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <i className="fas fa-chevron-down text-gray-400 group-hover:text-gray-600 transition-colors"></i>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                <Link
                  to={user?.role === 'councillor' ? '/councillor/edit-profile' : '/citizen/edit-profile'}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <i className="fas fa-user-edit mr-3 text-blue-500"></i>
                  <span className="font-medium">Edit Profile</span>
                </Link>
                <Link
                  to="/citizen/settings"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <i className="fas fa-cog mr-3 text-gray-500"></i>
                  <span className="font-medium">Settings</span>
                </Link>
                <hr className="my-2 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <i className="fas fa-sign-out-alt mr-3"></i>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 