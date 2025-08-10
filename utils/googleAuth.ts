export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  sub: string; // Google user ID
}

export const decodeGoogleCredential = (credential: string): GoogleUserInfo | null => {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = credential.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    
    // Parse JSON
    const userInfo = JSON.parse(decodedPayload);
    
    return {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      sub: userInfo.sub
    };
  } catch (error) {
    console.error('Error decoding Google credential:', error);
    return null;
  }
};

export const googleAuthLogin = async (credential: string) => {
  const response = await fetch('http://localhost:3002/api/google-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credential }),
  });

  if (!response.ok) {
    throw new Error('Google login failed');
  }

  return response.json();
};

export const googleAuthRegister = async (credential: string, ward: number, panchayath: string) => {
  const response = await fetch('http://localhost:3002/api/google-register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credential, ward, panchayath }),
  });

  if (!response.ok) {
    throw new Error('Google registration failed');
  }

  return response.json();
};
