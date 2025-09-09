
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import { API_ENDPOINTS } from '../../src/config/config';
import { getDashboardStats, getCouncillors } from '../../services/adminService';
import AdminTopNav from '../../components/AdminTopNav';

interface DashboardStats {
  totalUsers: number;
  totalGrievances: number;
  resolvedGrievances: number;
  pendingGrievances: number;
  totalCouncillors: number;
  activeOfficers: number;
  totalWards: number;
}

interface GrievanceData {
  ward: number;
  count: number;
  resolved: number;
  pending: number;
}

interface UserData {
  role: string;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalGrievances: 0,
    resolvedGrievances: 0,
    pendingGrievances: 0,
    totalCouncillors: 0,
    activeOfficers: 0,
    totalWards: 23
  });
  const [grievanceData, setGrievanceData] = useState<GrievanceData[]>([]);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [councillors, setCouncillors] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [welfareStats, setWelfareStats] = useState({
    totalSchemes: 0,
    activeSchemes: 0,
    totalApplications: 0,
    pendingApplications: 0
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

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load dashboard statistics from backend
      await loadStats();
      // Load grievance data by ward
      await loadGrievanceData();
      // Load user distribution
      await loadUserData();
      // Load recent grievances
      await loadRecentGrievances();
      // Load councillors data
      await loadCouncillorsData();
      // Load welfare scheme statistics
      await loadWelfareStats();
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
          totalGrievances: 342, // Mock data for now
          resolvedGrievances: 289, // Mock data for now
          pendingGrievances: 53, // Mock data for now
          totalCouncillors: data.totalCouncillors || 0,
          activeOfficers: data.totalOfficers || 0,
          totalWards: 23
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to mock data
      setStats({
        totalUsers: 1247,
        totalGrievances: 342,
        resolvedGrievances: 289,
        pendingGrievances: 53,
        totalCouncillors: 23,
        activeOfficers: 8,
        totalWards: 23
      });
    }
  };

  const loadWelfareStats = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/welfare/schemes/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWelfareStats({
          totalSchemes: data.stats.totalSchemes || 0,
          activeSchemes: data.stats.activeSchemes || 0,
          totalApplications: 0, // Will be fetched separately
          pendingApplications: 0
        });
      }
    } catch (error) {
      console.error('Error loading welfare stats:', error);
      setWelfareStats({
        totalSchemes: 0,
        activeSchemes: 0,
        totalApplications: 0,
        pendingApplications: 0
      });
    }
  };

  const loadGrievanceData = async () => {
    // Mock data for ward-wise grievances
    const mockData = Array.from({ length: 23 }, (_, i) => ({
      ward: i + 1,
      count: Math.floor(Math.random() * 20) + 5,
      resolved: Math.floor(Math.random() * 15) + 3,
      pending: Math.floor(Math.random() * 8) + 1
    }));
    setGrievanceData(mockData);
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
      // Fallback to mock data
      setUserData([
        { role: 'Citizens', count: 1200 },
        { role: 'Councillors', count: 23 },
        { role: 'Officers', count: 8 },
        { role: 'Admins', count: 2 }
      ]);
    }
  };

  const loadRecentGrievances = async () => {
    // Mock recent grievances
    setRecentGrievances([
      { id: 1, title: 'Road Repair Needed', ward: 5, status: 'Pending', date: '2024-01-15' },
      { id: 2, title: 'Water Supply Issue', ward: 12, status: 'Resolved', date: '2024-01-14' },
      { id: 3, title: 'Street Light Problem', ward: 8, status: 'In Progress', date: '2024-01-13' },
      { id: 4, title: 'Garbage Collection', ward: 3, status: 'Pending', date: '2024-01-12' },
      { id: 5, title: 'Drainage Issue', ward: 15, status: 'Resolved', date: '2024-01-11' }
    ]);
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

  const handleTabChange = (tab: string) => {
    if (tab === 'users') {
      navigate('/admin/users');
      return;
    }
    if (tab === 'grievances') {
      navigate('/admin/grievances');
      return;
    }
    setActiveTab(tab);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'manage-users':
        navigate('/admin/users');
        break;
      case 'manage-grievances':
        navigate('/admin/grievances');
        break;
      case 'manage-councillors':
        setActiveTab('councillors');
        break;
      case 'welfare-schemes':
        navigate('/admin/welfare-schemes');
        break;
      case 'welfare-applications':
        navigate('/admin/welfare-applications');
        break;
      case 'system-settings':
        setActiveTab('settings');
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
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        items={adminSidebarItems}
        onItemClick={handleSidebarNavigation}
        activeTab={activeTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={`flex-1 flex flex-col overflow-hidden ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <Navbar onMenuClick={toggleSidebar} />
        <AdminTopNav activeId="overview" />
        <div className="container mx-auto px-4 py-8">
          {/* Header (no big page title) */}
          <div className="mb-6">
            <p className="text-gray-700 text-sm">Welcome back, <span className="font-semibold">{user?.name}</span>. Here's what's happening in Erumeli Panchayath.</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-lg">
              {[
                { id: 'overview', name: 'Overview', icon: 'fa-chart-line' },
                { id: 'users', name: 'User Management', icon: 'fa-users' },
                { id: 'grievances', name: 'Grievances', icon: 'fa-clipboard-list' },
                { id: 'councillors', name: 'Councillors', icon: 'fa-user-tie' },
                { id: 'analytics', name: 'Analytics', icon: 'fa-chart-bar' },
                { id: 'settings', name: 'Settings', icon: 'fa-cog' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className={`fas ${tab.icon} mr-2`}></i>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  icon="fa-users" 
                  title="Total Users" 
                  value={stats.totalUsers.toLocaleString()} 
                  color="bg-blue-500"
                  trend="+12%"
                  trendUp={true}
                />
                <StatCard 
                  icon="fa-clipboard-list" 
                  title="Total Grievances" 
                  value={stats.totalGrievances.toLocaleString()} 
                  color="bg-orange-500"
                  trend="+5%"
                  trendUp={true}
                />
                <StatCard 
                  icon="fa-check-circle" 
                  title="Resolved" 
                  value={stats.resolvedGrievances.toLocaleString()} 
                  color="bg-green-500"
                  trend="+8%"
                  trendUp={true}
                />
                <StatCard 
                  icon="fa-hourglass-half" 
                  title="Pending" 
                  value={stats.pendingGrievances.toLocaleString()} 
                  color="bg-yellow-500"
                  trend="-3%"
                  trendUp={false}
                />
              </div>

              {/* Welfare Scheme Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  icon="fa-hands-helping" 
                  title="Total Schemes" 
                  value={welfareStats.totalSchemes.toLocaleString()} 
                  color="bg-indigo-500"
                  trend="Active"
                  trendUp={true}
                />
                <StatCard 
                  icon="fa-check-circle" 
                  title="Active Schemes" 
                  value={welfareStats.activeSchemes.toLocaleString()} 
                  color="bg-green-500"
                  trend="Live"
                  trendUp={true}
                />
                <StatCard 
                  icon="fa-file-alt" 
                  title="Total Applications" 
                  value={welfareStats.totalApplications.toLocaleString()} 
                  color="bg-blue-500"
                  trend="+15%"
                  trendUp={true}
                />
                <StatCard 
                  icon="fa-clock" 
                  title="Pending Applications" 
                  value={welfareStats.pendingApplications.toLocaleString()} 
                  color="bg-yellow-500"
                  trend="Review Required"
                  trendUp={false}
                />
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <i className="fas fa-bolt mr-3 text-blue-600"></i>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { id: 'manage-users', title: 'Manage Users', icon: 'fa-users', color: 'bg-blue-500' },
                    { id: 'manage-grievances', title: 'Manage Grievances', icon: 'fa-clipboard-list', color: 'bg-orange-500' },
                    { id: 'manage-councillors', title: 'Manage Councillors', icon: 'fa-user-tie', color: 'bg-green-500' },
                    { id: 'welfare-schemes', title: 'Welfare Schemes', icon: 'fa-hands-helping', color: 'bg-indigo-500' },
                    { id: 'welfare-applications', title: 'Applications', icon: 'fa-file-alt', color: 'bg-purple-500' },
                    { id: 'system-settings', title: 'System Settings', icon: 'fa-cog', color: 'bg-gray-500' }
                  ].map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      className={`${action.color} text-white p-6 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
                    >
                      <i className={`fas ${action.icon} text-2xl mb-3`}></i>
                      <h4 className="font-semibold">{action.title}</h4>
                    </button>
                  ))}
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Grievances by Ward */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <i className="fas fa-chart-bar mr-3 text-blue-600"></i>
                    Grievances by Ward
                  </h3>
                  <div style={{ height: 300 }}>
                          <ResponsiveContainer>
                    <BarChart data={grievanceData.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ward" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                      <Bar dataKey="count" name="Total" fill="#3B82F6" />
                      <Bar dataKey="resolved" name="Resolved" fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Distribution */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <i className="fas fa-chart-pie mr-3 text-green-600"></i>
                    User Distribution
                  </h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={userData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {userData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Grievances */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <i className="fas fa-clock mr-3 text-orange-600"></i>
                  Recent Grievances
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Ward</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentGrievances.map((grievance: any) => (
                        <tr key={grievance.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-600">#{grievance.id}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">{grievance.title}</td>
                          <td className="py-3 px-4 text-gray-600">Ward {grievance.ward}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              grievance.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                              grievance.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {grievance.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{grievance.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <i className="fas fa-users mr-3 text-blue-600"></i>
                User Management
              </h3>
              <p className="text-gray-600 mb-6">Manage all users in the system including citizens, officers, and councillors.</p>
              <div className="text-center py-12">
                <i className="fas fa-tools text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">User management features coming soon...</p>
              </div>
            </div>
          )}

          {/* Grievances Tab */}
          {activeTab === 'grievances' && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <i className="fas fa-clipboard-list mr-3 text-orange-600"></i>
                Grievance Management
              </h3>
              <p className="text-gray-600 mb-6">Monitor and manage all grievances across all wards.</p>
              <div className="text-center py-12">
                <i className="fas fa-tools text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">Grievance management features coming soon...</p>
              </div>
            </div>
          )}

          {/* Councillors Tab */}
          {activeTab === 'councillors' && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <i className="fas fa-user-tie mr-3 text-green-600"></i>
                Councillor Management
              </h3>
              <p className="text-gray-600 mb-6">Manage ward councillors and their profiles.</p>
              
              {councillors.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-users text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-500">No councillors found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Ward</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Appointment Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">End Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Days in Office</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {councillors.map((councillor: any) => (
                        <tr key={councillor._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-600">Ward {councillor.ward}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">{councillor.name}</td>
                          <td className="py-3 px-4 text-gray-600">{councillor.email}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {councillor.appointmentDate ? new Date(councillor.appointmentDate).toLocaleDateString() : 'Not set'}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {councillor.endDate ? new Date(councillor.endDate).toLocaleDateString() : 'Not set'}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {councillor.daysInOffice ? `${councillor.daysInOffice} days` : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              councillor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {councillor.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <i className="fas fa-chart-bar mr-3 text-purple-600"></i>
                Advanced Analytics
              </h3>
              <p className="text-gray-600 mb-6">Detailed analytics and insights for better decision making.</p>
              <div className="text-center py-12">
                <i className="fas fa-tools text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">Advanced analytics features coming soon...</p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <i className="fas fa-cog mr-3 text-gray-600"></i>
                System Settings
              </h3>
              <p className="text-gray-600 mb-6">Configure system settings and preferences.</p>
              <div className="text-center py-12">
                <i className="fas fa-tools text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">System settings features coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
