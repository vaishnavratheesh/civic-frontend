import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import Spinner from '../../components/Spinner';
import AdminTopNav from '../../components/AdminTopNav';
import { getAllUsers, updateUser, deleteUser, bulkApproveUsers } from '../../services/adminService';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  ward: number;
  approved: boolean;
  isVerified: boolean;
  createdAt: string;
  profilePicture?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Filters
  const [filters, setFilters] = useState({
    role: '',
    ward: '',
    approved: '',
    isVerified: '',
    search: ''
  });

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Selected users for bulk actions
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  // Admin sidebar navigation items
  const adminSidebarItems = [
    { id: 'overview', name: 'Overview', icon: 'fa-tachometer-alt', path: '/admin' },
    { id: 'welfare-schemes', name: 'Welfare Schemes', icon: 'fa-hands-helping', path: '/admin/welfare-schemes' },
    { id: 'welfare-applications', name: 'Applications', icon: 'fa-file-alt', path: '/admin/welfare-applications' },
    { id: 'users', name: 'User Management', icon: 'fa-users', path: '/admin/users' },
    { id: 'grievances', name: 'Grievance Management', icon: 'fa-bullhorn', path: '/admin/grievances' },
    { id: 'councillors', name: 'Councillors', icon: 'fa-user-tie', path: '/admin/councillors' },
    { id: 'analytics', name: 'Analytics', icon: 'fa-chart-bar', path: '/admin/analytics' },
    { id: 'settings', name: 'Settings', icon: 'fa-cog', path: '/admin/settings' },
  ];

  const handleSidebarNavigation = (itemId: string) => {
    switch (itemId) {
      case 'overview':
        navigate('/admin');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'grievances':
        navigate('/admin/grievances');
        break;
      case 'councillors':
        navigate('/admin/councillors');
        break;
      case 'analytics':
        navigate('/admin/analytics');
        break;
      case 'settings':
        navigate('/admin/settings');
        break;
      default:
        break;
    }
  };

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
      if (filters.search !== debouncedSearch) {
        setSearching(true);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [filters.search, debouncedSearch]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadUsers();
  }, [user, navigate, debouncedSearch, filters.role, filters.ward, filters.approved, filters.isVerified, pagination.currentPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.currentPage,
        limit: 10
      };

      if (filters.role) params.role = filters.role;
      if (filters.ward) params.ward = parseInt(filters.ward);
      if (filters.approved !== '') params.approved = filters.approved === 'true';
      if (filters.isVerified !== '') params.isVerified = filters.isVerified === 'true';
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await getAllUsers(params);
      if (response.success) {
        const fetchedUsers: User[] = response.users || [];
        // Hide the logged-in admin from the table
        const filtered = fetchedUsers.filter(u => u._id !== user?.id);
        setUsers(filtered);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset pagination and selections for all filters except search
    if (key !== 'search') {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      setSelectedUsers([]);
      setSelectAll(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    setSelectedUsers([]);
    setSelectAll(false);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
      setSelectAll(false);
    } else {
      setSelectedUsers(users.map(user => user._id));
      setSelectAll(true);
    }
  };

  const handleBulkApprove = async (approved: boolean) => {
    if (selectedUsers.length === 0) return;

    try {
      const response = await bulkApproveUsers(selectedUsers, approved);
      if (response.success) {
        loadUsers();
        setSelectedUsers([]);
        setSelectAll(false);
      }
    } catch (error) {
      console.error('Error bulk approving users:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await deleteUser(userId);
      if (response.success) {
        loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'councillor': return 'bg-green-100 text-green-800';
      case 'officer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
      <AdminTopNav activeId="users" />

      <AdminSidebar
        items={adminSidebarItems}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onItemClick={handleSidebarNavigation}
        activeTab="users"
      />

      <div className={`flex-1 flex flex-col overflow-hidden ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage all users in the system including citizens, officers, and councillors.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name or email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="citizen">Citizen</option>
                <option value="councillor">Councillor</option>
                <option value="officer">Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
              <select
                value={filters.ward}
                onChange={(e) => handleFilterChange('ward', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Wards</option>
                {Array.from({ length: 23 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Ward {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approved</label>
              <select
                value={filters.approved}
                onChange={(e) => handleFilterChange('approved', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Approved</option>
                <option value="false">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verified</label>
              <select
                value={filters.isVerified}
                onChange={(e) => handleFilterChange('isVerified', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({
                    role: '',
                    ward: '',
                    approved: '',
                    isVerified: '',
                    search: ''
                  });
                  setDebouncedSearch('');
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                  setSelectedUsers([]);
                  setSelectAll(false);
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkApprove(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkApprove(false)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Unapprove Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Users ({pagination.totalUsers})</h3>
            <div className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ward</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleUserSelect(user._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-4 text-gray-700">{(pagination.currentPage - 1) * 10 + (idx + 1)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                            <i className="fas fa-user text-gray-600 text-sm"></i>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">Ward {user.ward}</td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.approved ? 'Approved' : 'Pending'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Edit
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalUsers)} of {pagination.totalUsers} users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 