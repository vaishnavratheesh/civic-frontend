import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AdminSidebarItem {
  id: string;
  name: string;
  icon: string;
  path: string;
}

interface AdminSidebarProps {
  items: AdminSidebarItem[];
  className?: string;
  onItemClick?: (itemId: string) => void;
  activeTab?: string;
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ items, className = '', onItemClick, activeTab, isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const handleItemClick = (item: AdminSidebarItem) => {
    if (onItemClick) {
      onItemClick(item.id);
    }
    // Close sidebar after item click
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${className}
      `}>
        <div className="bg-white min-h-screen w-80 flex flex-col shadow-2xl border-r border-gray-200">
          {/* Header with close button */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{user?.name}</p>
                  <p className="text-xs text-red-600 font-medium">Administrator</p>
                </div>
              </div>
              {/* Close button */}
              <button
                onClick={onClose}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-all duration-200"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {items && items.length > 0 ? items.map((item) => {
                const isActive = activeTab === item.id || location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive 
                        ? 'bg-red-100' 
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <i className={`fas ${item.icon} text-base ${isActive ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-700'}`}></i>
                    </div>
                    <span className={`font-semibold text-base ${isActive ? 'text-red-600' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      {item.name}
                    </span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-red-600 rounded-full"></div>
                    )}
                  </button>
                );
              }) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-info-circle text-2xl mb-2"></i>
                  <p>No navigation items available</p>
                </div>
              )}
            </div>
          </nav>

          {/* Bottom Icons */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex justify-center space-x-3">
              <Link 
                to="/admin" 
                className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-all duration-200"
                onClick={onClose}
              >
                <i className="fas fa-home text-lg"></i>
              </Link>
              <Link 
                to="/admin/users" 
                className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-all duration-200"
                onClick={onClose}
              >
                <i className="fas fa-users text-lg"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar; 