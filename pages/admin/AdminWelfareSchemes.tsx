import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import Spinner from '../../components/Spinner';
import AdminTopNav from '../../components/AdminTopNav';

interface WelfareScheme {
  _id: string;
  title: string;
  description: string;
  category: string;
  minAge: number;
  maxAge: number;
  benefits: string;
  documentsRequired: string[];
  totalSlots: number;
  availableSlots: number;
  applicationDeadline: string;
  startDate: string;
  endDate: string;
  scope: 'panchayath' | 'ward';
  createdBy: 'admin' | 'councillor';
  creatorId: string;
  creatorName: string;
  ward?: number;
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminWelfareSchemes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterScope, setFilterScope] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<WelfareScheme | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState({
    totalSchemes: 0,
    activeSchemes: 0,
    inactiveSchemes: 0,
    expiredSchemes: 0,
    totalApplications: 0
  });

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchSchemes();
    fetchStats();
  }, [user, navigate]);

  const fetchSchemes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchemes(data.schemes || []);
      }
    } catch (error) {
      console.error('Error fetching schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {
          totalSchemes: 0,
          activeSchemes: 0,
          inactiveSchemes: 0,
          expiredSchemes: 0,
          totalApplications: 0
        });
      }
    } catch (error) {
      console.error('Error fetching scheme stats:', error);
    }
  };

  const handleToggleStatus = async (schemeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes/${schemeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSchemes(prev => prev.map(scheme => 
          scheme._id === schemeId 
            ? { ...scheme, status: newStatus as any }
            : scheme
        ));
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to update scheme status');
    }
  };

  const handleDeleteScheme = async (schemeId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes/${schemeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSchemes(prev => prev.filter(scheme => scheme._id !== schemeId));
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to delete scheme');
    }
  };

  const handleSidebarNavigation = (itemId: string) => {
    switch (itemId) {
      case 'overview':
        navigate('/admin');
        break;
      case 'welfare-schemes':
        navigate('/admin/welfare-schemes');
        break;
      case 'welfare-applications':
        navigate('/admin/welfare-applications');
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

  // Filter schemes based on current filters
  const filteredSchemes = schemes.filter(scheme => {
    if (filterCategory !== 'all' && scheme.category !== filterCategory) return false;
    if (filterStatus !== 'all' && scheme.status !== filterStatus) return false;
    if (filterScope !== 'all' && scheme.scope !== filterScope) return false;
    if (searchTerm && !scheme.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !scheme.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Get unique categories and scopes for filters
  const categories = [...new Set(schemes.map(scheme => scheme.category))];
  const scopes = [...new Set(schemes.map(scheme => scheme.scope))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'fa-check-circle';
      case 'inactive': return 'fa-pause-circle';
      case 'expired': return 'fa-times-circle';
      case 'cancelled': return 'fa-ban';
      default: return 'fa-question-circle';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner message="Loading schemes..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar onMenuClick={handleMenuClick} />
      <AdminTopNav activeId="welfare-schemes" />
      
      {/* Admin Sidebar */}
      <AdminSidebar
        items={adminSidebarItems}
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        onItemClick={handleSidebarNavigation}
        activeTab="welfare-schemes"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Welfare Schemes</h1>
              <p className="text-gray-600">Manage welfare schemes for Erumeli Panchayath</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25"
            >
              <i className="fas fa-plus mr-2"></i>
              Create New Scheme
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search schemes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Scope</label>
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Scopes</option>
                <option value="panchayath">Panchayath</option>
                <option value="ward">Ward</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterCategory('all');
                  setFilterStatus('all');
                  setFilterScope('all');
                  setSearchTerm('');
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Schemes List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {filteredSchemes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-hands-helping text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Schemes Found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' || filterScope !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'No welfare schemes have been created yet'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25"
              >
                <i className="fas fa-plus mr-2"></i>
                Create First Scheme
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheme Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scope & Slots
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Dates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creator
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSchemes.map((scheme) => (
                    <tr key={scheme._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {scheme.title}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {scheme.description.length > 100 
                              ? `${scheme.description.substring(0, 100)}...` 
                              : scheme.description
                            }
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {scheme.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div>
                            <span className="font-medium">Scope:</span> 
                            <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                              scheme.scope === 'panchayath' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {scheme.scope === 'panchayath' ? 'Panchayath-wide' : `Ward ${scheme.ward}`}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Total Slots:</span> {scheme.totalSlots}
                          </div>
                          <div>
                            <span className="font-medium">Available:</span> {scheme.availableSlots}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(scheme.status)}`}>
                            <i className={`fas ${getStatusIcon(scheme.status)} mr-1`}></i>
                            {scheme.status.charAt(0).toUpperCase() + scheme.status.slice(1)}
                          </span>
                          <div className="text-sm text-gray-500">
                            <div>Start: {new Date(scheme.startDate).toLocaleDateString()}</div>
                            <div>End: {new Date(scheme.endDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{scheme.creatorName}</div>
                          <div className="text-gray-500">{scheme.createdBy}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(scheme.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleStatus(scheme._id, scheme.status)}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                              scheme.status === 'active'
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {scheme.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedScheme(scheme);
                              setShowEditModal(true);
                            }}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleDeleteScheme(scheme._id)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal Placeholder */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {showCreateModal ? 'Create New Scheme' : 'Edit Scheme'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedScheme(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-tools text-2xl text-blue-600"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Coming Soon</h3>
                  <p className="text-gray-600">
                    The scheme creation and editing interface is being developed. 
                    For now, you can manage existing schemes using the action buttons.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWelfareSchemes;