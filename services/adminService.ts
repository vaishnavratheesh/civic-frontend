import { API_ENDPOINTS } from '../src/config/config';

// Get auth token from localStorage
const getAuthToken = () => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return userData.token;
  }
  return null;
};

// Common headers for API calls
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Dashboard Statistics
export const getDashboardStats = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_DASHBOARD_STATS, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Get all users with filtering and pagination
export const getAllUsers = async (params: {
  page?: number;
  limit?: number;
  role?: string;
  ward?: number;
  approved?: boolean;
  isVerified?: boolean;
  search?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.role) queryParams.append('role', params.role);
    if (params.ward) queryParams.append('ward', params.ward.toString());
    if (params.approved !== undefined) queryParams.append('approved', params.approved.toString());
    if (params.isVerified !== undefined) queryParams.append('isVerified', params.isVerified.toString());
    if (params.search) queryParams.append('search', params.search);

    const url = `${API_ENDPOINTS.ADMIN_USERS}?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId: string) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_USER_BY_ID}/${userId}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (userId: string, userData: {
  name?: string;
  ward?: number;
  panchayath?: string;
  approved?: boolean;
  isVerified?: boolean;
  role?: string;
}) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_UPDATE_USER}/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId: string) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_DELETE_USER}/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Bulk approve users
export const bulkApproveUsers = async (userIds: string[], approved: boolean) => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_BULK_APPROVE_USERS, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userIds, approved })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error bulk approving users:', error);
    throw error;
  }
};

// Get all councillors
export const getCouncillors = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_COUNCILLORS, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching councillors:', error);
    throw error;
  }
};

// Update councillor
export const updateCouncillor = async (councillorId: string, councillorData: {
  name?: string;
  ward?: number;
  appointmentDate?: string;
  endDate?: string;
  partyAffiliation?: string;
  educationalQualification?: string;
  previousExperience?: string;
  emergencyContact?: string;
  emergencyContactRelation?: string;
  approved?: boolean;
  isVerified?: boolean;
}) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_UPDATE_COUNCILLOR}/${councillorId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(councillorData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating councillor:', error);
    throw error;
  }
};

// Get users by ward
export const getUsersByWard = async (ward: number) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ADMIN_WARD_USERS}/${ward}/users`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching ward users:', error);
    throw error;
  }
}; 