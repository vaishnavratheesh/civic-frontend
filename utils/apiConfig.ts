// API Configuration utility for environment switching

interface ApiConfig {
  baseUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

// Detect environment
const detectEnvironment = (): 'development' | 'production' => {
  // Check various indicators for development environment
  if (
    import.meta.env.VITE_NODE_ENV === 'development' ||
    import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '5173' ||
    window.location.port === '3000'
  ) {
    return 'development';
  }
  return 'production';
};

// Get backend URL based on environment
const getBackendUrl = (): string => {
  const env = detectEnvironment();
  
  if (env === 'development') {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
  } else {
    return import.meta.env.VITE_BACKEND_URL_PRODUCTION || 
           import.meta.env.VITE_BACKEND_URL || 
           'https://civic-backend-f8a1.onrender.com';
  }
};

// Create API configuration
export const createApiConfig = (): ApiConfig => {
  const env = detectEnvironment();
  const baseUrl = getBackendUrl();
  
  console.log(`🌐 Frontend running in ${env.toUpperCase()} mode`);
  console.log(`📡 Backend URL: ${baseUrl}`);
  
  return {
    baseUrl,
    isProduction: env === 'production',
    isDevelopment: env === 'development'
  };
};

// Export the configuration
export const apiConfig = createApiConfig();

// Helper function to get API URL with endpoint
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${apiConfig.baseUrl}${cleanEndpoint}`;
};

// Environment switching utility (for development/testing)
export const switchEnvironment = (forceProduction: boolean = false): ApiConfig => {
  if (forceProduction) {
    return {
      baseUrl: import.meta.env.VITE_BACKEND_URL_PRODUCTION || 'https://civic-backend-f8a1.onrender.com',
      isProduction: true,
      isDevelopment: false
    };
  }
  return createApiConfig();
};

export default apiConfig;