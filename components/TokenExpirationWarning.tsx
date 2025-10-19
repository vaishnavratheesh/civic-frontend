import React, { useState, useEffect } from 'react';
import { TokenManager } from '../utils/tokenManager';
import { useAuth } from '../hooks/useAuth';

const TokenExpirationWarning: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const { logout } = useAuth();

  useEffect(() => {
    const checkTokenStatus = () => {
      const isExpiringSoon = TokenManager.isTokenExpiringSoon();
      const timeUntilExpiry = TokenManager.getTimeUntilExpiry();
      
      setShowWarning(isExpiringSoon);
      setTimeLeft(timeUntilExpiry);
    };

    // Check immediately
    checkTokenStatus();

    // Check every minute
    const interval = setInterval(checkTokenStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeLeft = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = async () => {
    try {
      const token = TokenManager.getToken();
      if (!token) return;

      // Make a request to refresh the token
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          TokenManager.setToken(data.token, '1d');
          setShowWarning(false);
        }
      }
    } catch (error) {
      console.error('Error extending session:', error);
    }
  };

  const handleLogoutNow = () => {
    logout();
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm">
              ⚠️ Your session will expire in <strong>{formatTimeLeft(timeLeft)}</strong>. Please save your work.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExtendSession}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Extend Session
          </button>
          <button
            onClick={handleLogoutNow}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Logout Now
          </button>
          <button
            onClick={handleDismiss}
            className="text-yellow-700 hover:text-yellow-900 p-1"
            aria-label="Dismiss warning"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenExpirationWarning;