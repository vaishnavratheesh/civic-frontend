import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import CreateWelfareScheme from '../../components/CreateWelfareScheme';
import Spinner from '../../components/Spinner';
import AdminTopNav from '../../components/AdminTopNav';

interface WelfareScheme {
  _id: string;
  title: string;
  description: string;
  category: string;
  scope: 'panchayath' | 'ward';
  ward?: number;
  totalSlots: number;
  availableSlots: number;
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  applicationDeadline: string;
  startDate: string;
  endDate: string;
  createdBy: 'admin' | 'councillor';
  creatorName: string;
  createdAt: string;
  approved: boolean;
}

const AdminWelfareSchemes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterScope, setFilterScope] = useState<'all' | 'panchayath' | 'ward'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCreator, setFilterCreator] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalSchemes: 0,
    activeSchemes: 0,
    panchayathSchemes: 0,
    wardSchemes: 0,
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
      const response = await fetch('http://localhost:3002/api/welfare/schemes', {
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
      const response = await fetch('http://localhost:3002/api/welfare/schemes/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {
          totalSchemes: 0,
          activeSchemes: 0,
          panchayathSchemes: 0,
          wardSchemes: 0,
          totalApplications: 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSchemeCreated = () => {
    fetchSchemes();
    fetchStats();
  };

  const toggleSchemeStatus = async (schemeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`http://localhost:3002/api/welfare/schemes/${schemeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSchemes(prev => prev.map(scheme => 
          scheme._id === schemeId ? { ...scheme, status: newStatus as any } : scheme
        ));
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to update scheme status');
    }
  };

  const deleteScheme = async (schemeId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/welfare/schemes/${schemeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSchemes(prev => prev.filter(scheme => scheme._id !== schemeId));
        fetchStats(); // Refresh stats
      } else {
        console.error('Failed to delete scheme');
      }
    } catch (error) {
      console.error('Network error. Please try again.');
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
    if (filterScope !== 'all' && scheme.scope !== filterScope) return false;
    if (filterCategory !== 'all' && scheme.category !== filterCategory) return false;
    if (filterStatus !== 'all' && scheme.status !== filterStatus) return false;
    if (filterCreator !== 'all' && scheme.createdBy !== filterCreator) return false;
    if (searchTerm && !scheme.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Get unique categories and creators for filters
  const categories = [...new Set(schemes.map(scheme => scheme.category))];
  const creators = [...new Set(schemes.map(scheme => scheme.createdBy))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScopeColor = (scope: string) => {
    return scope === 'panchayath' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const getCreatorColor = (creator: string) => {
    return creator === 'admin' 
      ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
      : 'bg-orange-100 text-orange-800 border-orange-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner message="Loading welfare schemes..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
      <AdminTopNav activeId="welfare-schemes" />
      
      {/* Admin Sidebar */}
      <AdminSidebar
        items={adminSidebarItems}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onItemClick={(id) => navigate(adminSidebarItems.find(i => i.id === id)?.path || '/admin')}
        activeTab={'welfare-schemes'}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welfare Scheme Management</h1>
          <p className="text-gray-600">Manage and oversee all welfare schemes across Erumeli Panchayath</p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <i className="fas fa-hands-helping text-2xl text-indigo-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Schemes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSchemes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <i className="fas fa-check-circle text-2xl text-green-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Schemes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeSchemes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <i className="fas fa-globe text-2xl text-blue-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Panchayath-wide</p>
                <p className="text-2xl font-bold text-gray-900">{stats.panchayathSchemes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <i className="fas fa-map-marker-alt text-2xl text-purple-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ward-specific</p>
                <p className="text-2xl font-bold text-gray-900">{stats.wardSchemes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <i className="fas fa-file-alt text-2xl text-yellow-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Scheme Management</h2>
              <p className="text-gray-600">Create new schemes and manage existing ones</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium shadow-lg shadow-indigo-500/25 flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Create New Scheme
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search schemes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Scope</label>
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Scopes</option>
                <option value="panchayath">Panchayath-wide</option>
                <option value="ward">Ward-specific</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Creator</label>
              <select
                value={filterCreator}
                onChange={(e) => setFilterCreator(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Creators</option>
                {creators.map(creator => (
                  <option key={creator} value={creator}>
                    {creator === 'admin' ? 'Panchayath President' : 'Ward Councillor'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterScope('all');
                  setFilterCategory('all');
                  setFilterStatus('all');
                  setFilterCreator('all');
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
              <p className="text-gray-500">
                {searchTerm || filterScope !== 'all' || filterCategory !== 'all' || filterStatus !== 'all' || filterCreator !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Create your first welfare scheme to get started'
                }
              </p>
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
                      Scope & Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creator & Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slots & Dates
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
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {scheme.description}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            Created: {new Date(scheme.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getScopeColor(scheme.scope)}`}>
                            {scheme.scope === 'panchayath' ? 'Panchayath-wide' : `Ward ${scheme.ward}`}
                          </span>
                          <div className="text-sm text-gray-900">{scheme.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getCreatorColor(scheme.createdBy)}`}>
                            {scheme.createdBy === 'admin' ? 'Panchayath President' : 'Ward Councillor'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(scheme.status)}`}>
                            {scheme.status.charAt(0).toUpperCase() + scheme.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div>
                            <span className="font-medium">{scheme.availableSlots}</span>
                            <span className="text-gray-500"> / {scheme.totalSlots} slots</span>
                          </div>
                          <div>
                            <span className="font-medium">Deadline:</span>
                            <div className="text-gray-500">
                              {new Date(scheme.applicationDeadline).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleSchemeStatus(scheme._id, scheme.status)}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                              scheme.status === 'active'
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {scheme.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          
                          <button
                            onClick={() => deleteScheme(scheme._id)}
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

        {/* Create Scheme Modal */}
        {showCreateForm && (
          <CreateWelfareScheme
            onSchemeCreated={handleSchemeCreated}
            onClose={() => setShowCreateForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminWelfareSchemes; 