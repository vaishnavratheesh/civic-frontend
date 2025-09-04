// Frontend configuration for Civic+ application
// In production, these should be set via environment variables

export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002',
  
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '289773391020-da1s5ueqalq5v2ppe01ujm9m0ordiomg.apps.googleusercontent.com',
  
  // Google Maps Configuration
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBvaAFVs6SkzyL2inovZqFYgcpjPLhO8I8',
  
  // Application Configuration
  APP_NAME: 'Civic+',
  APP_DESCRIPTION: 'Erumeli Panchayath Digital Platform',
  
  // Features
  ENABLE_GOOGLE_AUTH: true,
  ENABLE_AI_FEATURES: true,
  ENABLE_FILE_UPLOAD: true,
  
  // Development overrides
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
};

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${config.API_BASE_URL}/api/login`,
  REGISTER: `${config.API_BASE_URL}/api/register`,
  GOOGLE_LOGIN: `${config.API_BASE_URL}/api/google-login`,
  GOOGLE_REGISTER: `${config.API_BASE_URL}/api/google-register`,
  GOOGLE_REGISTER_COMPLETE: `${config.API_BASE_URL}/api/google-register-complete`,
  CHECK_GOOGLE_USER: `${config.API_BASE_URL}/api/check-google-user`,
  VERIFY_OTP: `${config.API_BASE_URL}/api/verify-otp`,
  RESEND_OTP: `${config.API_BASE_URL}/api/resend-otp`,
  FORGOT_PASSWORD: `${config.API_BASE_URL}/api/forgot-password`,
  RESET_PASSWORD: `${config.API_BASE_URL}/api/reset-password`,
  
  // Councillor
  COUNCILLOR_LOGIN: `${config.API_BASE_URL}/api/councillor-login`,
  COUNCILLOR_COMPLETE_PROFILE: `${config.API_BASE_URL}/api/councillors/complete-profile`,
  COUNCILLOR_CHANGE_PASSWORD: `${config.API_BASE_URL}/api/councillors/change-password`,
  COUNCILLOR_PROFILE: `${config.API_BASE_URL}/api/councillors/profile`,
  COUNCILLOR_UPDATE_PROFILE: `${config.API_BASE_URL}/api/councillors/profile`,
  
  // User Management
  USER_PROFILE: `${config.API_BASE_URL}/api/users`,
  USER_UPDATE_PROFILE: `${config.API_BASE_URL}/api/users`,
  USER_PROFILE_PICTURE: `${config.API_BASE_URL}/api/users`,
  USER_CHANGE_PASSWORD: `${config.API_BASE_URL}/api/users`,
  WARD_STATS: `${config.API_BASE_URL}/api/wards`,
  
  // Admin
  ADMIN_DASHBOARD_STATS: `${config.API_BASE_URL}/api/admin/dashboard-stats`,
  ADMIN_USERS: `${config.API_BASE_URL}/api/admin/users`,
  ADMIN_USER_BY_ID: `${config.API_BASE_URL}/api/admin/users`,
  ADMIN_UPDATE_USER: `${config.API_BASE_URL}/api/admin/users`,
  ADMIN_DELETE_USER: `${config.API_BASE_URL}/api/admin/users`,
  ADMIN_BULK_APPROVE_USERS: `${config.API_BASE_URL}/api/admin/users/bulk-approve`,
  ADMIN_COUNCILLORS: `${config.API_BASE_URL}/api/admin/councillors`,
  ADMIN_UPDATE_COUNCILLOR: `${config.API_BASE_URL}/api/admin/councillors`,
  ADMIN_WARD_USERS: `${config.API_BASE_URL}/api/admin/wards`,
  
  // Test
  TEST: `${config.API_BASE_URL}/api/test`
}; 