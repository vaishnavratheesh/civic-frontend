
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import { API_ENDPOINTS } from '../../src/config/config';
import { getDashboardStats, getCouncillors } from '../../services/adminService';
import Swal from 'sweetalert2';
import axios from 'axios';

interface DashboardStats {
  totalUsers: number;
  totalCitizens: number;
  totalCouncillors: number;
  totalAdmins: number;
  totalOfficers: number;
  totalWards: number;
  assignedWards: number;
  vacantWards: number;
}

interface UserData {
  role: string;
  count: number;
}

interface WardData {
  ward: number;
  citizenCount: number;
  hasCouncillor: boolean;
}

interface Ward {
  wardNumber: number;
  councillor?: {
    _id: string;
    name: string;
    email: string;
    ward: number;
    createdAt: string;
  } | null;
  population: number;
  citizenCount: number;
  isVacant: boolean;
}

interface President {
  _id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  appointmentDate?: string;
}

interface AssignModalData {
  type: 'councillor' | 'president';
  wardNumber?: number;
  existingName?: string;
  existingEmail?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdminDashboard: React.FC = () => {
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCitizens: 0,
    totalCouncillors: 0,
    totalAdmins: 0,
    totalOfficers: 0,
    totalWards: 23,
    assignedWards: 0,
    vacantWards: 23
  });
  const [userData, setUserData] = useState<UserData[]>([]);
  const [wardData, setWardData] = useState<WardData[]>([]);
  const [councillors, setCouncillors] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Citizens management state
  const [citizens, setCitizens] = useState<any[]>([]);
  const [citizensLoading, setCitizensLoading] = useState(false);
  const [citizensPagination, setCitizensPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Councillor management state
  const [wards, setWards] = useState<Ward[]>([]);
  const [president, setPresident] = useState<President | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignModalData, setAssignModalData] = useState<AssignModalData | null>(null);
  const [assignForm, setAssignForm] = useState({ name: '', email: '' });
  const [assignLoading, setAssignLoading] = useState(false);

  const API_BASE = 'http://localhost:3002/api';

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // User dropdown state
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  
  const handleLogout = () => {
    Swal.fire({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Use the auth context logout function
        authLogout();
        
        // Clear all session data
        localStorage.clear();
        sessionStorage.clear();
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Logged Out Successfully',
          text: 'You have been logged out of the admin panel.',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          // Force navigation and prevent back button
          window.location.replace('/login');
        });
      }
    });
  };

  useEffect(() => {
    // Check authentication and session validity
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser || !user || user.role !== 'admin') {
        // Clear any invalid session data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        // Redirect to login
        navigate('/login', { replace: true });
        return false;
      }
      return true;
    };

    if (checkAuth()) {
      loadDashboardData();
    }
  }, [user, navigate]);

  // Prevent back button after logout
  useEffect(() => {
    const handlePopState = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.replace('/login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown) {
        const target = event.target as Element;
        if (!target.closest('.user-dropdown')) {
          setShowUserDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load dashboard statistics from backend
      await loadStats();
      // Load user distribution
      await loadUserData();
      // Load ward data
      await loadWardData();
      // Load councillors data
      await loadCouncillorsData();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getDashboardStats();
      if (response.success) {
        const data = response.stats;
        setStats({
          totalUsers: data.totalUsers || 0,
          totalCitizens: data.totalCitizens || 0,
          totalCouncillors: data.totalCouncillors || 0,
          totalAdmins: data.totalAdmins || 0,
          totalOfficers: data.totalOfficers || 0,
          totalWards: 23,
          assignedWards: data.totalCouncillors || 0,
          vacantWards: 23 - (data.totalCouncillors || 0)
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Try to get real data from councillor API
      try {
        const wardsResponse = await axios.get(`${API_BASE}/admin/wards`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        
        if (wardsResponse.data.success) {
          const wards = wardsResponse.data.wards;
          const assignedWards = wards.filter((w: any) => !w.isVacant).length;
          
          setStats({
            totalUsers: 0,
            totalCitizens: 0,
            totalCouncillors: assignedWards,
            totalAdmins: 1,
            totalOfficers: 0,
            totalWards: 23,
            assignedWards: assignedWards,
            vacantWards: 23 - assignedWards
          });
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
  };

  const loadWardData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/wards`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      if (response.data.success) {
        const wards = response.data.wards;
        const wardData = wards.map((ward: any) => ({
          ward: ward.wardNumber,
          citizenCount: ward.citizenCount || 0,
          hasCouncillor: !ward.isVacant
        }));
        setWardData(wardData);
      }
    } catch (error) {
      console.error('Error loading ward data:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const response = await getDashboardStats();
      if (response.success) {
        const data = response.stats;
        setUserData([
          { role: 'Citizens', count: data.totalCitizens || 0 },
          { role: 'Councillors', count: data.totalCouncillors || 0 },
          { role: 'Officers', count: data.totalOfficers || 0 },
          { role: 'Admins', count: data.totalAdmins || 0 }
        ]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Try to get real data from councillor API
      try {
        const wardsResponse = await axios.get(`${API_BASE}/admin/wards`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        
        if (wardsResponse.data.success) {
          const wards = wardsResponse.data.wards;
          const assignedWards = wards.filter((w: any) => !w.isVacant).length;
          const totalCitizens = wards.reduce((sum: number, ward: any) => sum + (ward.citizenCount || 0), 0);
          
          setUserData([
            { role: 'Citizens', count: totalCitizens },
            { role: 'Councillors', count: assignedWards },
            { role: 'Officers', count: 0 },
            { role: 'Admins', count: 1 }
          ]);
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
  };

  const loadCouncillorsData = async () => {
    try {
      const response = await getCouncillors();
      if (response.success) {
        setCouncillors(response.councillors || []);
      }
    } catch (error) {
      console.error('Error loading councillors:', error);
      setCouncillors([]);
    }
  };

  // Councillor management functions
  const fetchCouncillorData = async () => {
    try {
      const [wardsResponse, presidentResponse] = await Promise.all([
        axios.get(`${API_BASE}/admin/wards`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        }),
        axios.get(`${API_BASE}/admin/president`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        })
      ]);

      if (wardsResponse.data.success) {
        setWards(wardsResponse.data.wards);
      }

      if (presidentResponse.data.success) {
        setPresident(presidentResponse.data.president);
      }
    } catch (error) {
      console.error('Error fetching councillor data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load councillor data'
      });
    }
  };

  const openAssignModal = (type: 'councillor' | 'president', wardNumber?: number, existingName?: string, existingEmail?: string) => {
    setAssignModalData({ type, wardNumber, existingName, existingEmail });
    setAssignForm({ 
      name: existingName || '', 
      email: existingEmail || '' 
    });
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setAssignModalData(null);
    setAssignForm({ name: '', email: '' });
  };

  const handleAssign = async () => {
    if (!assignForm.name.trim() || !assignForm.email.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all fields'
      });
      return;
    }

    if (!assignModalData) return;

    try {
      setAssignLoading(true);

      let endpoint = '';
      let payload: any = {
        name: assignForm.name.trim(),
        email: assignForm.email.trim()
      };

      if (assignModalData.type === 'councillor') {
        endpoint = `${API_BASE}/admin/councillors/assign`;
        payload.wardNumber = assignModalData.wardNumber;
      } else {
        endpoint = `${API_BASE}/admin/president/assign`;
      }

      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: response.data.message,
          timer: 3000,
          showConfirmButton: false
        });

        closeAssignModal();
        fetchCouncillorData(); // Refresh data
      }
    } catch (error: any) {
      console.error('Error assigning:', error);
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: error.response?.data?.message || 'Failed to assign. Please try again.'
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemove = async (type: 'councillor' | 'president', wardNumber?: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will remove the ${type} and revoke their access immediately.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove access',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      let endpoint = '';
      if (type === 'councillor') {
        endpoint = `${API_BASE}/admin/councillors/remove/${wardNumber}`;
      } else {
        endpoint = `${API_BASE}/admin/president/remove`;
      }

      const response = await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Removed!',
          text: response.data.message,
          timer: 3000,
          showConfirmButton: false
        });

        fetchCouncillorData(); // Refresh data
      }
    } catch (error: any) {
      console.error('Error removing:', error);
      Swal.fire({
        icon: 'error',
        title: 'Removal Failed',
        text: error.response?.data?.message || 'Failed to remove. Please try again.'
      });
    }
  };

  const handleResendCredentials = async (userId: string, type: 'councillor' | 'president') => {
    const result = await Swal.fire({
      title: 'Resend Credentials?',
      text: 'This will generate a new password and send it via email.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, send credentials',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axios.post(`${API_BASE}/admin/send-credentials`, {
        userId,
        type
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Credentials Sent!',
          text: 'New login credentials have been sent via email.',
          timer: 3000,
          showConfirmButton: false
        });
      }
    } catch (error: any) {
      console.error('Error resending credentials:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Send',
        text: error.response?.data?.message || 'Failed to send credentials. Please try again.'
      });
    }
  };

  // Citizens management functions
  const fetchCitizens = async (page = 1) => {
    try {
      setCitizensLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/admin/users?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCitizens(response.data.users);
        setCitizensPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching citizens:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load citizens data'
      });
    } finally {
      setCitizensLoading(false);
    }
  };

  const handleRemoveCitizen = async (userId: string, userName: string) => {
    const result = await Swal.fire({
      title: 'Remove Citizen?',
      text: `This will permanently remove ${userName} from the system.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove citizen',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Citizen Removed!',
          text: response.data.message,
          timer: 3000,
          showConfirmButton: false
        });

        // Refresh citizens list
        fetchCitizens(citizensPagination.page);
        // Refresh stats
        loadDashboardData();
      }
    } catch (error: any) {
      console.error('Error removing citizen:', error);
      Swal.fire({
        icon: 'error',
        title: 'Removal Failed',
        text: error.response?.data?.message || 'Failed to remove citizen. Please try again.'
      });
    }
  };

  const handleToggleVerification = async (userId: string, userName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'unverify' : 'verify';
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Citizen?`,
      text: `This will ${action} ${userName}'s account.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#f59e0b' : '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      console.log('Toggling verification for user:', userId, 'Current status:', currentStatus);
      console.log('API URL:', `${API_BASE}/admin/users/${userId}/toggle-verification`);
      console.log('Token exists:', !!token);
      
      const response = await axios.patch(`${API_BASE}/admin/users/${userId}/toggle-verification`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Toggle verification response:', response.data);

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Status Updated!',
          text: response.data.message,
          timer: 3000,
          showConfirmButton: false
        });

        // Update the citizen in the local state immediately for better UX
        setCitizens(prevCitizens => 
          prevCitizens.map(citizen => 
            citizen._id === userId 
              ? { ...citizen, isVerified: !currentStatus, approved: !currentStatus }
              : citizen
          )
        );
        
        // Also refresh the full list to ensure consistency
        setTimeout(() => fetchCitizens(citizensPagination.page), 1000);
      }
    } catch (error: any) {
      console.error('Error toggling verification:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update verification status. Please try again.'
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Load councillor data when switching to councillors tab
    if (tab === 'councillors') {
      fetchCouncillorData();
    }
    
    // Load citizens data when switching to users tab
    if (tab === 'users') {
      fetchCitizens();
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'manage-users':
        setActiveTab('users');
        break;
      case 'manage-councillors':
        setActiveTab('councillors');
        fetchCouncillorData();
        break;
      case 'view-analytics':
        setActiveTab('analytics');
        break;
      case 'assign-councillor':
        setActiveTab('councillors');
        fetchCouncillorData();
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-city text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Civic+ Admin</h1>
                  <p className="text-xs text-gray-500">Erumeli Panchayath</p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 bg-gray-100/80 rounded-xl p-1">
              {[
                { id: 'overview', name: 'Dashboard', icon: 'fa-chart-line' },
                { id: 'users', name: 'Citizens', icon: 'fa-users' },
                { id: 'councillors', name: 'Councillors', icon: 'fa-user-tie' },
                { id: 'analytics', name: 'Analytics', icon: 'fa-chart-bar' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <i className={`fas ${tab.icon} text-sm`}></i>
                  <span className="text-sm">{tab.name}</span>
                </button>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* User Dropdown */}
              <div className="relative user-dropdown">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="hidden sm:flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100/50 transition-colors"
                >
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-white text-sm"></i>
                  </div>
                  <i className={`fas fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                          <i className="fas fa-user text-white"></i>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user?.name}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                          <p className="text-xs text-blue-600 font-medium">System Administrator</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          // Add profile management functionality here if needed
                        }}
                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <i className="fas fa-user-cog mr-3 text-gray-400"></i>
                        <span className="text-sm">Profile Settings</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('analytics');
                        }}
                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <i className="fas fa-chart-bar mr-3 text-gray-400"></i>
                        <span className="text-sm">System Analytics</span>
                      </button>

                      <div className="border-t border-gray-100 my-2"></div>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <i className="fas fa-sign-out-alt mr-3 text-red-500"></i>
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <i className="fas fa-bars"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsSidebarOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              {/* Mobile User Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              {[
                { id: 'overview', name: 'Dashboard', icon: 'fa-chart-line' },
                { id: 'users', name: 'Citizens', icon: 'fa-users' },
                { id: 'councillors', name: 'Councillors', icon: 'fa-user-tie' },
                { id: 'analytics', name: 'Analytics', icon: 'fa-chart-bar' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    handleTabChange(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <i className={`fas ${tab.icon}`}></i>
                  <span>{tab.name}</span>
                </button>
              ))}
              
              {/* Mobile Logout Button */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-red-600 hover:bg-red-50"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}! 👋
            </h2>
            <p className="text-gray-600">
              Here's what's happening in Erumeli Panchayath today.
            </p>
          </div>
        </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: 'fa-users',
                    title: 'Total Citizens',
                    value: stats.totalCitizens.toLocaleString(),
                    trend: 'Active Users',
                    trendUp: true,
                    bgColor: 'bg-blue-50',
                    iconColor: 'text-blue-600'
                  },
                  {
                    icon: 'fa-user-tie',
                    title: 'Councillors',
                    value: stats.totalCouncillors.toLocaleString(),
                    trend: `${stats.assignedWards}/23 Wards`,
                    trendUp: true,
                    bgColor: 'bg-green-50',
                    iconColor: 'text-green-600'
                  },
                  {
                    icon: 'fa-map-marked-alt',
                    title: 'Assigned Wards',
                    value: stats.assignedWards.toLocaleString(),
                    trend: `${((stats.assignedWards / 23) * 100).toFixed(1)}% Coverage`,
                    trendUp: stats.assignedWards > 15,
                    bgColor: 'bg-indigo-50',
                    iconColor: 'text-indigo-600'
                  },
                  {
                    icon: 'fa-exclamation-triangle',
                    title: 'Vacant Wards',
                    value: stats.vacantWards.toLocaleString(),
                    trend: stats.vacantWards === 0 ? 'All Assigned' : 'Need Assignment',
                    trendUp: stats.vacantWards === 0,
                    bgColor: stats.vacantWards === 0 ? 'bg-green-50' : 'bg-yellow-50',
                    iconColor: stats.vacantWards === 0 ? 'text-green-600' : 'text-yellow-600'
                  }
                ].map((stat, index) => (
                  <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        <div className="flex items-center mt-2">
                          <span className={`text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                            <i className={`fas ${stat.trendUp ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
                            {stat.trend}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">vs last month</span>
                        </div>
                      </div>
                      <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center`}>
                        <i className={`fas ${stat.icon} text-2xl ${stat.iconColor}`}></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>



              {/* Quick Actions */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <i className="fas fa-bolt mr-3 text-blue-600"></i>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'manage-users', title: 'Manage Citizens', icon: 'fa-users', bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
                    { id: 'manage-councillors', title: 'Manage Councillors', icon: 'fa-user-tie', bgColor: 'bg-green-50', iconColor: 'text-green-600' },
                    { id: 'assign-councillor', title: 'Assign Councillor', icon: 'fa-plus-circle', bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
                    { id: 'view-analytics', title: 'View Analytics', icon: 'fa-chart-bar', bgColor: 'bg-purple-50', iconColor: 'text-purple-600' }
                  ].map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      className="group bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-gray-100"
                    >
                      <div className={`w-12 h-12 ${action.bgColor} rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                        <i className={`fas ${action.icon} text-xl ${action.iconColor}`}></i>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm">{action.title}</h4>
                    </button>
                  ))}
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Citizens by Ward */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <i className="fas fa-chart-bar mr-3 text-blue-600"></i>
                    Citizens by Ward
                  </h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={wardData.slice(0, 12)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="ward" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="citizenCount" name="Citizens" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* User Distribution */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <i className="fas fa-chart-pie mr-3 text-green-600"></i>
                    User Distribution
                  </h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={userData.filter(u => u.count > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {userData.filter(u => u.count > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Ward Coverage Status */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <i className="fas fa-map-marked-alt mr-3 text-indigo-600"></i>
                    Ward Coverage Status
                  </h3>
                  <button 
                    onClick={() => handleTabChange('councillors')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                  >
                    Manage Councillors <i className="fas fa-arrow-right ml-1"></i>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {wardData.slice(0, 12).map((ward) => (
                    <div key={ward.ward} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Ward {ward.ward}</h4>
                        <div className={`w-3 h-3 rounded-full ${ward.hasCouncillor ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Citizens: <span className="font-medium">{ward.citizenCount}</span>
                      </p>
                      <p className={`text-xs font-medium ${ward.hasCouncillor ? 'text-green-600' : 'text-red-600'}`}>
                        {ward.hasCouncillor ? 'Councillor Assigned' : 'Vacant'}
                      </p>
                    </div>
                  ))}
                </div>
                {wardData.length > 12 && (
                  <div className="mt-4 text-center">
                    <button 
                      onClick={() => handleTabChange('councillors')}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View All {wardData.length} Wards
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Citizens Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-8">
              {/* Header */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Citizens Management</h1>
                    <p className="text-gray-600">Manage citizen registrations and account verification</p>
                  </div>
                  <button
                    onClick={() => fetchCitizens(1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <i className="fas fa-sync-alt mr-2"></i>
                    Refresh
                  </button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { 
                    title: 'Total Citizens', 
                    value: citizensPagination.total, 
                    icon: 'fa-users', 
                    color: 'blue',
                    bgColor: 'bg-blue-50',
                    iconColor: 'text-blue-600'
                  },
                  { 
                    title: 'Verified Users', 
                    value: citizens.filter(c => c.isVerified).length, 
                    icon: 'fa-check-circle', 
                    color: 'green',
                    bgColor: 'bg-green-50',
                    iconColor: 'text-green-600'
                  },
                  { 
                    title: 'Pending Verification', 
                    value: citizens.filter(c => !c.isVerified).length, 
                    icon: 'fa-clock', 
                    color: 'yellow',
                    bgColor: 'bg-yellow-50',
                    iconColor: 'text-yellow-600'
                  },
                  { 
                    title: 'Officers', 
                    value: citizens.filter(c => c.role === 'officer').length, 
                    icon: 'fa-user-tie', 
                    color: 'indigo',
                    bgColor: 'bg-indigo-50',
                    iconColor: 'text-indigo-600'
                  }
                ].map((stat, index) => (
                  <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center`}>
                        <i className={`fas ${stat.icon} text-2xl ${stat.iconColor}`}></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Citizens Table */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <i className="fas fa-users mr-3 text-blue-600"></i>
                    All Citizens ({citizensPagination.total})
                  </h3>
                </div>

                {citizensLoading ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span className="text-gray-600">Loading citizens...</span>
                    </div>
                  </div>
                ) : citizens.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-users text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Citizens Found</h3>
                    <p className="text-gray-600">No citizens are registered in the system yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Name</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Email</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Ward</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Role</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Status</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Registered</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {citizens.map((citizen) => (
                            <tr key={citizen._id} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <i className="fas fa-user text-blue-600"></i>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{citizen.name}</p>
                                    <p className="text-sm text-gray-500">{citizen.registrationSource || 'Manual'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-gray-600">{citizen.email}</td>
                              <td className="py-4 px-6 text-gray-600">Ward {citizen.ward}</td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  citizen.role === 'officer' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {citizen.role.charAt(0).toUpperCase() + citizen.role.slice(1)}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  citizen.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {citizen.isVerified ? 'Verified' : 'Pending'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-gray-600 text-sm">
                                {new Date(citizen.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleToggleVerification(citizen._id, citizen.name, citizen.isVerified)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                      citizen.isVerified 
                                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                  >
                                    <i className={`fas ${citizen.isVerified ? 'fa-times' : 'fa-check'} mr-1`}></i>
                                    {citizen.isVerified ? 'Unverify' : 'Verify'}
                                  </button>
                                  <button
                                    onClick={() => handleRemoveCitizen(citizen._id, citizen.name)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
                                  >
                                    <i className="fas fa-trash mr-1"></i>
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {citizensPagination.pages > 1 && (
                      <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Showing {((citizensPagination.page - 1) * citizensPagination.limit) + 1} to {Math.min(citizensPagination.page * citizensPagination.limit, citizensPagination.total)} of {citizensPagination.total} citizens
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => fetchCitizens(citizensPagination.page - 1)}
                            disabled={citizensPagination.page === 1}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-2 text-sm font-medium text-gray-700">
                            Page {citizensPagination.page} of {citizensPagination.pages}
                          </span>
                          <button
                            onClick={() => fetchCitizens(citizensPagination.page + 1)}
                            disabled={citizensPagination.page === citizensPagination.pages}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}



          {/* Councillors Tab */}
          {activeTab === 'councillors' && (
            <div className="space-y-8">
              {/* Header */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Councillor Management</h1>
                <p className="text-gray-600">Manage ward councillors and panchayath president assignments</p>
              </div>

              {/* President Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="fas fa-crown text-purple-600 mr-2"></i>
                  Panchayath President
                </h2>
                
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  {president ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-user-tie text-purple-600 text-xl"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{president.name}</h3>
                          <p className="text-gray-600">{president.email}</p>
                          <p className="text-sm text-gray-500">
                            Appointed: {new Date(president.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openAssignModal('president', undefined, president.name, president.email)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <i className="fas fa-edit mr-2"></i>
                          Edit
                        </button>
                        <button
                          onClick={() => handleResendCredentials(president._id, 'president')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <i className="fas fa-paper-plane mr-2"></i>
                          Resend Credentials
                        </button>
                        <button
                          onClick={() => handleRemove('president')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <i className="fas fa-trash mr-2"></i>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-crown text-gray-400 text-2xl"></i>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No President Assigned</h3>
                      <p className="text-gray-600 mb-4">Assign a panchayath president to manage overall operations</p>
                      <button
                        onClick={() => openAssignModal('president')}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Assign President
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Councillors Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="fas fa-users text-blue-600 mr-2"></i>
                  Ward Councillors ({wards.filter(w => !w.isVacant).length}/23)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {wards.map((ward) => (
                    <div key={ward.wardNumber} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Ward {ward.wardNumber}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ward.isVacant 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {ward.isVacant ? 'Vacant' : 'Assigned'}
                        </div>
                      </div>

                      {ward.isVacant ? (
                        <div className="text-center py-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i className="fas fa-user-plus text-gray-400"></i>
                          </div>
                          <p className="text-gray-600 text-sm mb-4">No councillor assigned</p>
                          <button
                            onClick={() => openAssignModal('councillor', ward.wardNumber)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <i className="fas fa-plus mr-2"></i>
                            Assign Councillor
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-user text-blue-600"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{ward.councillor?.name}</h4>
                              <p className="text-sm text-gray-600 truncate">{ward.councillor?.email}</p>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Citizens:</span>
                              <span className="font-medium">{ward.citizenCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Population:</span>
                              <span className="font-medium">{ward.population.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => openAssignModal('councillor', ward.wardNumber, ward.councillor?.name, ward.councillor?.email)}
                              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                              <i className="fas fa-edit mr-1"></i>
                              Edit
                            </button>
                            <button
                              onClick={() => handleResendCredentials(ward.councillor!._id, 'councillor')}
                              className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                            >
                              <i className="fas fa-paper-plane mr-1"></i>
                              Send
                            </button>
                            <button
                              onClick={() => handleRemove('councillor', ward.wardNumber)}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">System Analytics</h3>
                
                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[
                    { title: 'Ward Coverage', value: `${((stats.assignedWards / 23) * 100).toFixed(1)}%`, icon: 'fa-map-marked-alt', color: 'indigo' },
                    { title: 'Avg Citizens/Ward', value: Math.floor(stats.totalCitizens / 23), icon: 'fa-calculator', color: 'blue' },
                    { title: 'System Uptime', value: '99.9%', icon: 'fa-server', color: 'green' },
                    { title: 'Active Sessions', value: Math.floor(stats.totalCitizens * 0.08), icon: 'fa-users-cog', color: 'purple' }
                  ].map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 border border-gray-100">
                      <div className={`w-12 h-12 bg-${stat.color}-50 rounded-xl flex items-center justify-center mb-4`}>
                        <i className={`fas ${stat.icon} text-${stat.color}-600`}></i>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Ward Assignment Progress */}
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Ward Assignment Progress</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Assigned Wards</span>
                          <span>{stats.assignedWards}/23</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(stats.assignedWards / 23) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Vacant Wards</span>
                          <span>{stats.vacantWards}/23</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-red-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(stats.vacantWards / 23) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Growth Trend */}
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h4>
                    <div className="space-y-3">
                      {userData.filter(u => u.count > 0).map((user, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{user.role}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  index === 0 ? 'bg-blue-500' : 
                                  index === 1 ? 'bg-green-500' : 
                                  index === 2 ? 'bg-purple-500' : 'bg-gray-500'
                                }`}
                                style={{ width: `${(user.count / Math.max(...userData.map(u => u.count))) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8">{user.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </main>

      {/* Assignment Modal */}
      {showAssignModal && assignModalData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full border border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {assignModalData.type === 'president' ? 'Assign President' : `Assign Ward ${assignModalData.wardNumber} Councillor`}
                </h3>
                <button
                  onClick={closeAssignModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={assignForm.name}
                    onChange={(e) => setAssignForm({ ...assignForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={assignForm.email}
                    onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                      <i className="fas fa-info-circle text-blue-600 text-sm"></i>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Automatic Credential Generation</p>
                      <p>A secure password will be generated automatically and sent to the provided email address along with login instructions.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeAssignModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={assignLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                >
                  {assignLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      <span>Assigning...</span>
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Assign & Send Credentials
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
