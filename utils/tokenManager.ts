/**
 * JWT Token Manager - Handles token storage, expiration, and automatic cleanup
 */
export class TokenManager {
  private static readonly TOKEN_KEY = 'token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private static readonly USER_KEY = 'user';

  /**
   * Set token with expiration tracking
   */
  static setToken(token: string, expiresIn: string = '1d'): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      
      // Calculate expiration time
      const expirationTime = new Date();
      
      // Parse expiration string (e.g., '1d', '12h', '30m')
      const match = expiresIn.match(/^(\d+)([dhm])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
          case 'd':
            expirationTime.setDate(expirationTime.getDate() + value);
            break;
          case 'h':
            expirationTime.setHours(expirationTime.getHours() + value);
            break;
          case 'm':
            expirationTime.setMinutes(expirationTime.getMinutes() + value);
            break;
        }
      } else {
        // Default to 1 day if parsing fails
        expirationTime.setDate(expirationTime.getDate() + 1);
      }
      
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expirationTime.getTime().toString());
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  /**
   * Get token only if it's valid (not expired)
   */
  static getToken(): string | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) return null;

      // Check if token is expired
      if (this.isTokenExpired()) {
        this.clearAuth();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(): boolean {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) return true;

      const now = new Date().getTime();
      const expiry = parseInt(expiryTime);
      
      return now >= expiry;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Check if token is expiring soon (within 1 hour)
   */
  static isTokenExpiringSoon(): boolean {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) return false;

      const now = new Date().getTime();
      const expiry = parseInt(expiryTime);
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      return (expiry - now) <= oneHour && (expiry - now) > 0;
    } catch (error) {
      console.error('Error checking token expiration warning:', error);
      return false;
    }
  }

  /**
   * Get time until token expiry in milliseconds
   */
  static getTimeUntilExpiry(): number {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) return 0;

      const now = new Date().getTime();
      const expiry = parseInt(expiryTime);
      
      return Math.max(0, expiry - now);
    } catch (error) {
      console.error('Error getting time until expiry:', error);
      return 0;
    }
  }

  /**
   * Set user data
   */
  static setUser(user: any): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user:', error);
    }
  }

  /**
   * Get user data
   */
  static getUser(): any | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Clear all authentication data
   */
  static clearAuth(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * API request wrapper with automatic token handling
   */
  static async apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token expiration
      if (response.status === 401) {
        this.clearAuth();
        window.location.href = '/login';
        throw new Error('Token expired');
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
}

// Export a convenience function for API requests
export const apiRequest = TokenManager.apiRequest.bind(TokenManager);