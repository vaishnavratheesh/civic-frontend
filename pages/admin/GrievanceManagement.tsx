import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import Spinner from '../../components/Spinner';
import { API_ENDPOINTS } from '../../src/config/config';

interface Grievance {
  _id: string;
  title: string;
  description: string;
  category: string;
  ward: number;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  attachments?: string[];
  comments?: Array<{
    _id: string;
    user: string;
    comment: string;
    createdAt: string;
  }>;
}

const GrievanceManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [filteredGrievances, setFilteredGrievances] = useState<Grievance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [wardFilter, setWardFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Admin sidebar navigation items
  const adminSidebarItems = [
    { id: 'overview', name: 'Overview', icon: 'fa-tachometer-alt', path: '/admin' },
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

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadGrievances();
  }, [user, navigate]);

  useEffect(() => {
    filterGrievances();
  }, [grievances, searchTerm, statusFilter, priorityFilter, wardFilter, categoryFilter]);

  const loadGrievances = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockGrievances: Grievance[] = [
        {
          _id: '1',
          title: 'Road Repair Needed',
          description: 'The main road in Ward 5 has several potholes that need immediate attention.',
          category: 'Infrastructure',
          ward: 5,
          status: 'pending',
          priority: 'high',
          submittedBy: {
            _id: 'user1',
            name: 'John Doe',
            email: 'john@example.com'
          },
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          _id: '2',
          title: 'Water Supply Issue',
          description: 'No water supply for the past 3 days in Ward 12.',
          category: 'Water Supply',
          ward: 12,
          status: 'in-progress',
          priority: 'urgent',
          submittedBy: {
            _id: 'user2',
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          assignedTo: {
            _id: 'officer1',
            name: 'Bob Johnson',
            role: 'officer'
          },
          createdAt: '2024-01-14T08:15:00Z',
          updatedAt: '2024-01-15T14:20:00Z'
        },
        {
          _id: '3',
          title: 'Street Light Problem',
          description: 'Street lights are not working in Ward 8, making it unsafe at night.',
          category: 'Infrastructure',
          ward: 8,
          status: 'resolved',
          priority: 'medium',
          submittedBy: {
            _id: 'user3',
            name: 'Alice Brown',
            email: 'alice@example.com'
          },
          assignedTo: {
            _id: 'officer2',
            name: 'Mike Wilson',
            role: 'officer'
          },
          createdAt: '2024-01-13T16:45:00Z',
          updatedAt: '2024-01-15T09:30:00Z',
          resolvedAt: '2024-01-15T09:30:00Z'
        },
        {
          _id: '4',
          title: 'Garbage Collection',
          description: 'Garbage is not being collected regularly in Ward 3.',
          category: 'Sanitation',
          ward: 3,
          status: 'pending',
          priority: 'medium',
          submittedBy: {
            _id: 'user4',
            name: 'David Lee',
            email: 'david@example.com'
          },
          createdAt: '2024-01-12T11:20:00Z',
          updatedAt: '2024-01-12T11:20:00Z'
        },
        {
          _id: '5',
          title: 'Drainage Issue',
          description: 'Severe waterlogging due to blocked drainage in Ward 15.',
          category: 'Infrastructure',
          ward: 15,
          status: 'resolved',
          priority: 'high',
          submittedBy: {
            _id: 'user5',
            name: 'Sarah Wilson',
            email: 'sarah@example.com'
          },
          assignedTo: {
            _id: 'officer3',
            name: 'Tom Davis',
            role: 'officer'
          },
          createdAt: '2024-01-11T13:10:00Z',
          updatedAt: '2024-01-14T17:45:00Z',
          resolvedAt: '2024-01-14T17:45:00Z'
        }
      ];
      setGrievances(mockGrievances);
    } catch (error) {
      console.error('Error loading grievances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterGrievances = () => {
    let filtered = grievances;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(grievance =>
        grievance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grievance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grievance.submittedBy.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(grievance => grievance.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(grievance => grievance.priority === priorityFilter);
    }

    // Ward filter
    if (wardFilter !== 'all') {
      filtered = filtered.filter(grievance => grievance.ward === parseInt(wardFilter));
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(grievance => grievance.category === categoryFilter);
    }

    setFilteredGrievances(filtered);
  };

  const handleStatusChange = async (grievanceId: string, newStatus: string) => {
    try {
      // API call to update grievance status
      setGrievances(prev => prev.map(grievance => 
        grievance._id === grievanceId 
          ? { 
              ...grievance, 
              status: newStatus as any,
              updatedAt: new Date().toISOString(),
              resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : grievance.resolvedAt
            } 
          : grievance
      ));
    } catch (error) {
      console.error('Error updating grievance status:', error);
    }
  };

  const handleAssignGrievance = async (grievanceId: string, officerId: string) => {
    try {
      // API call to assign grievance to officer
      setGrievances(prev => prev.map(grievance => 
        grievance._id === grievanceId 
          ? { 
              ...grievance, 
              assignedTo: {
                _id: officerId,
                name: 'Assigned Officer',
                role: 'officer'
              },
              updatedAt: new Date().toISOString()
            } 
          : grievance
      ));
    } catch (error) {
      console.error('Error assigning grievance:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'fa-exclamation-triangle';
      case 'high': return 'fa-exclamation-circle';
      case 'medium': return 'fa-info-circle';
      case 'low': return 'fa-check-circle';
      default: return 'fa-info-circle';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'fa-clock';
      case 'in-progress': return 'fa-spinner';
      case 'resolved': return 'fa-check-circle';
      case 'rejected': return 'fa-times-circle';
      default: return 'fa-question-circle';
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
      <Navbar onMenuClick={handleMenuClick} />
      
      {/* Admin Sidebar */}
      <AdminSidebar
        items={adminSidebarItems}
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        onItemClick={handleSidebarNavigation}
        activeTab="grievances"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Grievance Management</h1>
          <p className="text-gray-600">Monitor and manage all grievances across all wards</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search grievances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ward</label>
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Wards</option>
                {Array.from({ length: 23 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Ward {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Electricity">Electricity</option>
                <option value="Transportation">Transportation</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowGrievanceModal(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Grievance
              </button>
            </div>
          </div>
        </div>

        {/* Grievances Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Grievance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Ward
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGrievances.map((grievance) => (
                  <tr key={grievance._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{grievance.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{grievance.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          By {grievance.submittedBy.name} • {new Date(grievance.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {grievance.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Ward {grievance.ward}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(grievance.priority)}`}>
                        <i className={`fas ${getPriorityIcon(grievance.priority)} mr-1`}></i>
                        {grievance.priority.charAt(0).toUpperCase() + grievance.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(grievance.status)}`}>
                        <i className={`fas ${getStatusIcon(grievance.status)} mr-1`}></i>
                        {grievance.status.charAt(0).toUpperCase() + grievance.status.slice(1).replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {grievance.assignedTo ? grievance.assignedTo.name : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedGrievance(grievance);
                            setShowGrievanceModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <select
                          value={grievance.status}
                          onChange={(e) => handleStatusChange(grievance._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500">
                <i className="fas fa-clipboard-list text-white text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Grievances</p>
                <p className="text-2xl font-bold text-gray-900">{grievances.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-500">
                <i className="fas fa-clock text-white text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{grievances.filter(g => g.status === 'pending').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500">
                <i className="fas fa-spinner text-white text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{grievances.filter(g => g.status === 'in-progress').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500">
                <i className="fas fa-check-circle text-white text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{grievances.filter(g => g.status === 'resolved').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrievanceManagement; 