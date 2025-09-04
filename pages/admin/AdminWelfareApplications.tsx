import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import Spinner from '../../components/Spinner';

interface WelfareApplication {
  _id: string;
  schemeId: {
    _id: string;
    title: string;
    scope: 'panchayath' | 'ward';
    ward?: number;
  };
  schemeTitle: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  userName: string;
  userEmail: string;
  userWard: number;
  personalDetails: {
    address: string;
    phoneNumber: string;
    rationCardNumber?: string;
    aadharNumber?: string;
    familyIncome: number;
    dependents: number;
    isHandicapped: boolean;
    isSingleWoman: boolean;
  };
  reason: string;
  score?: number;
  justification?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewComments?: string;
  appliedAt: string;
  reviewedAt?: string;
  completedAt?: string;
}

const AdminWelfareApplications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<WelfareApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScheme, setFilterScheme] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWard, setFilterWard] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<WelfareApplication | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'pending',
    reviewComments: ''
  });
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    completedApplications: 0
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
    fetchApplications();
    fetchStats();
  }, [user, navigate]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/welfare/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/welfare/applications/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {
          totalApplications: 0,
          pendingApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
          completedApplications: 0
        });
      }
    } catch (error) {
      console.error('Error fetching application stats:', error);
    }
  };

  const handleReviewApplication = async () => {
    if (!selectedApplication) return;

    try {
      const response = await fetch(`http://localhost:3002/api/welfare/applications/${selectedApplication._id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewData)
      });

      if (response.ok) {
        setApplications(prev => prev.map(app => 
          app._id === selectedApplication._id 
            ? { 
                ...app, 
                status: reviewData.status as any,
                reviewComments: reviewData.reviewComments,
                reviewedAt: new Date().toISOString()
              }
            : app
        ));
        fetchStats(); // Refresh stats
        setShowReviewModal(false);
        setSelectedApplication(null);
        setReviewData({ status: 'pending', reviewComments: '' });
      }
    } catch (error) {
      alert('Failed to review application');
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

  // Filter applications based on current filters
  const filteredApplications = applications.filter(application => {
    if (filterScheme !== 'all' && application.schemeId._id !== filterScheme) return false;
    if (filterStatus !== 'all' && application.status !== filterStatus) return false;
    if (filterWard !== 'all' && application.userWard !== parseInt(filterWard)) return false;
    if (searchTerm && !application.userName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !application.schemeTitle.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Get unique schemes and wards for filters
  const schemes = [...new Set(applications.map(app => ({ id: app.schemeId._id, title: app.schemeTitle })))];
  const wards = [...new Set(applications.map(app => app.userWard))].sort((a, b) => a - b);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'fa-clock';
      case 'under_review': return 'fa-eye';
      case 'approved': return 'fa-check-circle';
      case 'rejected': return 'fa-times-circle';
      case 'completed': return 'fa-flag-checkered';
      default: return 'fa-question-circle';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner message="Loading applications..." />
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
        activeTab="welfare-applications"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welfare Applications</h1>
          <p className="text-gray-600">Review and manage all welfare scheme applications across Erumeli Panchayath</p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <i className="fas fa-file-alt text-2xl text-blue-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <i className="fas fa-clock text-2xl text-yellow-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <i className="fas fa-check-circle text-2xl text-green-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-xl">
                <i className="fas fa-times-circle text-2xl text-red-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejectedApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <i className="fas fa-flag-checkered text-2xl text-purple-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedApplications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name or scheme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Scheme</label>
              <select
                value={filterScheme}
                onChange={(e) => setFilterScheme(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Schemes</option>
                {schemes.map(scheme => (
                  <option key={scheme.id} value={scheme.id}>{scheme.title}</option>
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
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ward</label>
              <select
                value={filterWard}
                onChange={(e) => setFilterWard(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Wards</option>
                {wards.map(ward => (
                  <option key={ward} value={ward}>Ward {ward}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterScheme('all');
                  setFilterStatus('all');
                  setFilterWard('all');
                  setSearchTerm('');
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-file-alt text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Applications Found</h3>
              <p className="text-gray-500">
                {searchTerm || filterScheme !== 'all' || filterStatus !== 'all' || filterWard !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'No applications have been submitted yet'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant & Scheme
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Personal Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => (
                    <tr key={application._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {application.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.schemeTitle}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Ward {application.userWard} • {application.userEmail}
                          </div>
                          <div className="text-xs text-gray-400">
                            {application.schemeId.scope === 'panchayath' ? 'Panchayath-wide' : `Ward ${application.schemeId.ward}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div>
                            <span className="font-medium">Income:</span> ₹{application.personalDetails.familyIncome.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Dependents:</span> {application.personalDetails.dependents}
                          </div>
                          <div className="flex space-x-2">
                            {application.personalDetails.isHandicapped && (
                              <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Handicapped
                              </span>
                            )}
                            {application.personalDetails.isSingleWoman && (
                              <span className="inline-flex px-2 py-1 text-xs bg-pink-100 text-pink-800 rounded-full">
                                Single Woman
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(application.status)}`}>
                            <i className={`fas ${getStatusIcon(application.status)} mr-1`}></i>
                            {application.status.replace('_', ' ').charAt(0).toUpperCase() + application.status.replace('_', ' ').slice(1)}
                          </span>
                          {application.score && (
                            <div className="text-sm">
                              <span className="font-medium">Score:</span> {application.score}/100
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div>
                            <span className="font-medium">Applied:</span>
                            <div className="text-gray-500">
                              {new Date(application.appliedAt).toLocaleDateString()}
                            </div>
                          </div>
                          {application.reviewedAt && (
                            <div>
                              <span className="font-medium">Reviewed:</span>
                              <div className="text-gray-500">
                                {new Date(application.reviewedAt).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedApplication(application);
                              setReviewData({
                                status: application.status,
                                reviewComments: application.reviewComments || ''
                              });
                              setShowReviewModal(true);
                            }}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            Review
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedApplication(application);
                              setReviewData({
                                status: application.status,
                                reviewComments: application.reviewComments || ''
                              });
                              setShowReviewModal(true);
                            }}
                            className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            View Details
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

        {/* Review Modal */}
        {showReviewModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Review Application</h2>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Application Details */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Application Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Applicant:</span> {selectedApplication.userName}
                    </div>
                    <div>
                      <span className="font-medium">Scheme:</span> {selectedApplication.schemeTitle}
                    </div>
                    <div>
                      <span className="font-medium">Ward:</span> {selectedApplication.userWard}
                    </div>
                    <div>
                      <span className="font-medium">Income:</span> ₹{selectedApplication.personalDetails.familyIncome.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Application</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                    {selectedApplication.reason}
                  </div>
                </div>

                {/* Review Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                    <select
                      value={reviewData.status}
                      onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Review Comments</label>
                    <textarea
                      value={reviewData.reviewComments}
                      onChange={(e) => setReviewData(prev => ({ ...prev, reviewComments: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add your review comments..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReviewApplication}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25"
                  >
                    Update Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWelfareApplications; 