// Frontend configuration for Civic+ application
// In production, these should be set via environment variables

// Environment-aware configuration
const getBackendUrl = () => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development' || 
                       import.meta.env.DEV || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
  } else {
    return import.meta.env.VITE_BACKEND_URL_PRODUCTION || 
           import.meta.env.VITE_BACKEND_URL || 
           'https://civic-backend-f8a1.onrender.com';
  }
};

export const config = {
  // API Configuration
  API_BASE_URL: getBackendUrl(),
  
  // Environment info
  IS_DEVELOPMENT: import.meta.env.VITE_NODE_ENV === 'development' || 
                  import.meta.env.DEV || 
                  window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1',
  
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '289773391020-da1s5ueqalq5v2ppe01ujm9m0ordiomg.apps.googleusercontent.com',
  
  // Maps Configuration (using OpenStreetMap - no API key required)
  
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
  WARD_COUNCILLOR: `${config.API_BASE_URL}/api/wards`,
  
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
  ,
  // President
  PRESIDENT_WARDS: `${config.API_BASE_URL}/api/president/wards`,
  PRESIDENT_WELFARE: `${config.API_BASE_URL}/api/president/welfare`,
  PRESIDENT_ANNOUNCEMENTS: `${config.API_BASE_URL}/api/president/announcements`,
  PRESIDENT_EVENTS: `${config.API_BASE_URL}/api/president/events`,
  PRESIDENT_MESSAGES: `${config.API_BASE_URL}/api/president/messages`,
  PRESIDENT_CONVERSATIONS: `${config.API_BASE_URL}/api/president/conversations`,
  PRESIDENT_VIDEO: `${config.API_BASE_URL}/api/president/video`,
  MEETING_PUBLIC: `${config.API_BASE_URL}/api/meeting`,
  
  // Councillor create (citizens-only)
  COUNCILLOR_ANNOUNCEMENTS: `${config.API_BASE_URL}/api/councillors/announcements`,
  COUNCILLOR_ANNOUNCEMENTS_MINE: `${config.API_BASE_URL}/api/councillors/announcements/mine`,
  COUNCILLOR_EVENTS: `${config.API_BASE_URL}/api/councillors/events`,
  COUNCILLOR_EVENTS_MINE: `${config.API_BASE_URL}/api/councillors/events/mine`,
  
  // Messaging
  COUNCILLOR_MESSAGES: `${config.API_BASE_URL}/api/councillors/messages`,
  COUNCILLOR_CONVERSATIONS: `${config.API_BASE_URL}/api/councillors/conversations`,
  COUNCILLOR_MARK_READ: `${config.API_BASE_URL}/api/councillors/messages/mark-read`,
  
  // AI Chatbot
  AI_CHATBOT: `${config.API_BASE_URL}/api/ai/chatbot`
}; 