# CivicBrain+ Frontend

A React-based frontend application for civic engagement and municipal services.

## Setup Instructions

### Prerequisites
- Node.js (version 16 or higher)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
1. Add your Gemini API key to the `.env` file:
```bash
# In .env file, uncomment and add your API key:
GEMINI_API_KEY=your_actual_api_key_here
```

2. Get your Gemini API key from: https://aistudio.google.com/app/apikey

3. For Google Sign-In functionality, add your Google Client ID:
```bash
# In .env file, uncomment and add your Google Client ID:
GOOGLE_CLIENT_ID=your_google_client_id_here
```

4. Follow the detailed Google OAuth setup guide in `GOOGLE_OAUTH_SETUP.md`

### 3. Run the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Features

- **Grievance Management**: AI-powered analysis of citizen complaints
- **Welfare Applications**: Automated scoring system for welfare applications
- **Ward Information**: AI assistant for ward-specific queries
- **Role-based Access**: Different interfaces for citizens, officers, councillors, and admins
- **Google Sign-In**: Secure authentication using Google OAuth 2.0

## Technologies Used

- React 19
- TypeScript
- Tailwind CSS
- Vite
- Google Gemini AI
- React Router
- Recharts for data visualization

## Notes

- The application includes mock data functionality when no API key is configured
- Tailwind CSS is properly configured for production builds
- All AI services gracefully fallback to mock responses when the API is unavailable

## Fixed Issues

✅ **Gemini API Error**: Fixed the "An API Key must be set when running in a browser" error by conditionally creating the GoogleGenAI instance only when an API key is available.

✅ **Tailwind CSS Warning**: Replaced CDN version with proper Tailwind CSS installation for production use.

✅ **Tailwind CSS Configuration**: Fixed by downgrading to Tailwind CSS v3.4.x and configuring proper PostCSS integration with ES module syntax. The v4 beta was causing compatibility issues.

✅ **Environment Variables**: Properly configured environment variable handling through Vite.
