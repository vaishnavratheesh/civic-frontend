
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { TokenManager } from '../utils/tokenManager';

interface AuthContextType {
  user: User | null;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isTokenExpired: boolean;
  isTokenExpiringSoon: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isTokenExpiringSoon, setIsTokenExpiringSoon] = useState(false);

  useEffect(() => {
    try {
      // Check if token is valid first
      const token = TokenManager.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const storedUser = TokenManager.getUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Failed to load user authentication", error);
      TokenManager.clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check token status periodically
  useEffect(() => {
    const checkTokenStatus = () => {
      const expired = TokenManager.isTokenExpired();
      const expiringSoon = TokenManager.isTokenExpiringSoon();
      
      setIsTokenExpired(expired);
      setIsTokenExpiringSoon(expiringSoon);

      if (expired && user) {
        // Auto logout if token is expired
        logout();
      }
    };

    // Check immediately
    checkTokenStatus();

    // Check every minute
    const interval = setInterval(checkTokenStatus, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const login = (userData: User, token?: string) => {
    if (token) {
      TokenManager.setToken(token);
    }
    TokenManager.setUser(userData);
    setUser(userData);
    setIsTokenExpired(false);
    setIsTokenExpiringSoon(false);
  };

  const logout = () => {
    TokenManager.clearAuth();
    setUser(null);
    setIsTokenExpired(false);
    setIsTokenExpiringSoon(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user && !isTokenExpired, 
      isLoading,
      isTokenExpired,
      isTokenExpiringSoon
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
