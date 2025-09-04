// Utility functions for JWT token management

export const isTokenExpired = (token: string): boolean => {
  try {
    if (!token || typeof token !== 'string') return true;
    
    // Check if token has the correct JWT format (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decode JWT token (without verification - just for expiration check)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if payload has exp field
    if (!payload.exp || typeof payload.exp !== 'number') return true;
    
    const currentTime = Date.now() / 1000;
    
    // Only consider truly expired tokens (no buffer)
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If we can't decode it, consider it expired
  }
};

export const getTokenExpirationTime = (token: string): Date | null => {
  try {
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

export const getTokenTimeRemaining = (token: string): number => {
  try {
    if (!token) return 0;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const timeRemaining = payload.exp - currentTime;
    
    return Math.max(0, timeRemaining);
  } catch (error) {
    console.error('Error getting token time remaining:', error);
    return 0;
  }
};

// Debug function to log token information
export const debugToken = (token: string): void => {
  try {
    if (!token) {
      console.log('Token: No token found');
      return;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Token: Invalid JWT format');
      return;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;
    const expirationTime = payload.exp;
    const timeRemaining = expirationTime - currentTime;
    
    console.log('Token Debug Info:', {
      hasToken: !!token,
      tokenLength: token.length,
      expirationTime: new Date(expirationTime * 1000).toLocaleString(),
      currentTime: new Date(currentTime * 1000).toLocaleString(),
      timeRemainingMinutes: Math.round(timeRemaining / 60),
      isExpired: timeRemaining < 0,
      payload: payload
    });
  } catch (error) {
    console.error('Error debugging token:', error);
  }
};