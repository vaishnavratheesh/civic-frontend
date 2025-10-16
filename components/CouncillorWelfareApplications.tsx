import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';

interface WelfareApplication {
  _id: string;
  schemeId: string;
  schemeTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userWard: number;
  personalDetails: {
    address: string;
    phoneNumber: string;
    houseNumber: string;
    caste: string;
    isKudumbasreeMember: boolean;
    paysHarithakarmasenaFee: boolean;
    hasFamilyMemberWithGovtJob: boolean;
    hasDisabledPersonInHouse: boolean;
    hasFamilyMemberWithPension: boolean;
    totalIncome: number;
    incomeCategory: string;
    ownsLand: boolean;
    landDetails: {
      villageName: string;
      surveyNumber: string;
      area: string;
    };
    drinkingWaterSource: string;
    hasToilet: boolean;
  };
  documents: Array<{ name: string; url: string }>;
  score?: number;
  justification?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  appliedAt: string;
  reviewedAt?: string;
}

interface WelfareScheme {
  _id: string;
  title: string;
  description: string;
  category: string;
  minAge: number;
  maxAge: number;
  benefits: string;
  totalSlots: number;
  availableSlots: number;
  applicationDeadline: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  createdAt: string;
}

const CouncillorWelfareApplications: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<WelfareApplication[]>([]);
  const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('all');
  const [expandedSchemes, setExpandedSchemes] = useState<{[key: string]: boolean}>({});
  const [verifying, setVerifying] = useState<{[key: string]: boolean}>({});
  const [selectedApplication, setSelectedApplication] = useState<WelfareApplication | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user?.ward]);

  const fetchData = async () => {
    if (!user?.ward) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch schemes and applications together
      const [schemesRes, applicationsRes] = await Promise.all([
        fetch('http://localhost:3002/api/welfare/schemes', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:3002/api/welfare/applications?ward=${user.ward}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      let schemesData = [];
      let applicationsData = [];
      
      if (schemesRes.ok) {
        const data = await schemesRes.json();
        schemesData = data.schemes || [];
      }
      
      if (applicationsRes.ok) {
        const data = await applicationsRes.json();
        applicationsData = data.applications || [];
      }
      
      // Filter out completed/expired schemes and their applications
      const activeSchemes = schemesData.filter((scheme: any) => {
        const now = new Date();
        const endDate = scheme.endDate ? new Date(scheme.endDate) : null;
        const applicationDeadline = scheme.applicationDeadline ? new Date(scheme.applicationDeadline) : null;
        
        // Keep scheme if it's active and not expired
        return scheme.status === 'active' && 
               (!endDate || endDate > now) && 
               (!applicationDeadline || applicationDeadline > now);
      });
      
      const activeSchemeIds = new Set(activeSchemes.map((s: any) => s._id));
      
      // Filter applications to only include those for active schemes
      const activeApplications = applicationsData.filter((app: any) => 
        activeSchemeIds.has(app.schemeId)
      );
      
      // Map applications to proper format
      const mappedApplications = activeApplications.map((a: any) => ({
        _id: a._id || `temp-${Date.now()}-${Math.random()}`,
        schemeId: a.schemeId,
        schemeTitle: a.schemeTitle,
        userId: a.userId,
        userName: a.userName,
        userEmail: a.userEmail,
        userWard: a.userWard,
        status: a.status || 'pending',
        appliedAt: a.appliedAt,
        score: a.score,
        justification: a.justification,
        personalDetails: {
          address: a.personalDetails?.address || '',
          phoneNumber: a.personalDetails?.phoneNumber || '',
          houseNumber: a.personalDetails?.houseNumber || '',
          caste: a.personalDetails?.caste || '',
          isKudumbasreeMember: a.personalDetails?.isKudumbasreeMember || false,
          paysHarithakarmasenaFee: a.personalDetails?.paysHarithakarmasenaFee || false,
          hasFamilyMemberWithGovtJob: a.personalDetails?.hasFamilyMemberWithGovtJob || false,
          hasDisabledPersonInHouse: a.personalDetails?.hasDisabledPersonInHouse || false,
          hasFamilyMemberWithPension: a.personalDetails?.hasFamilyMemberWithPension || false,
          totalIncome: a.personalDetails?.totalIncome || 0,
          incomeCategory: a.personalDetails?.incomeCategory || '',
          ownsLand: a.personalDetails?.ownsLand || false,
          landDetails: a.personalDetails?.landDetails || { villageName: '', surveyNumber: '', area: '' },
          drinkingWaterSource: a.personalDetails?.drinkingWaterSource || '',
          hasToilet: a.personalDetails?.hasToilet || false
        },
        documents: a.documents || []
      }));
      
      setSchemes(activeSchemes);
      setApplications(mappedApplications);
      
      // Auto-expand schemes that have applications
      const schemesWithApps = new Set(mappedApplications.map(app => app.schemeId));
      const initialExpanded: {[key: string]: boolean} = {};
      activeSchemes.forEach((scheme: any) => {
        if (schemesWithApps.has(scheme._id)) {
          initialExpanded[scheme._id] = true;
        }
      });
      setExpandedSchemes(initialExpanded);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setSchemes([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const toggleSchemeExpansion = (schemeId: string) => {
    setExpandedSchemes(prev => ({
      ...prev,
      [schemeId]: !prev[schemeId]
    }));
  };
  
  const getApplicationsForScheme = (schemeId: string) => {
    return applications.filter(app => app.schemeId === schemeId)
                      .sort((a, b) => (b.score || 0) - (a.score || 0));
  };
  
  const getSchemeStats = (schemeId: string) => {
    const schemeApps = getApplicationsForScheme(schemeId);
    return {
      total: schemeApps.length,
      pending: schemeApps.filter(app => app.status === 'pending').length,
      approved: schemeApps.filter(app => app.status === 'approved').length,
      rejected: schemeApps.filter(app => app.status === 'rejected').length
    };
  };

  const handleGetScore = async (appId: string) => {
    const app = applications.find(a => a._id === appId);
    if (!app || app.score !== undefined) return;

    try {
      // Call ML service directly
      const resp = await fetch(`http://localhost:8001/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(app)
      });
      
      if (resp.ok) {
        const data = await resp.json();
        setApplications(prev => prev.map(a => 
          a._id === appId ? { 
            ...a, 
            score: Math.round(data.score),
            justification: data.justification
          } : a
        ));
      } else {
        // Fallback scoring
        const fallbackScore = Math.floor(Math.random() * 100);
        setApplications(prev => prev.map(a => 
          a._id === appId ? { 
            ...a, 
            score: fallbackScore,
            justification: `⚠️ ML Service Not Running - Fallback score generated`
          } : a
        ));
      }
    } catch (error) {
      console.error("Failed to get score", error);
      const fallbackScore = Math.floor(Math.random() * 100);
      setApplications(prev => prev.map(a => 
        a._id === appId ? { 
          ...a, 
          score: fallbackScore,
          justification: `⚠️ ML Service Error - Fallback score generated`
        } : a
      ));
    }
  };

  const openVerificationModal = (appId: string) => {
    const app = applications.find(a => a._id === appId);
    if (app) {
      setSelectedApplication(app);
      setShowVerificationModal(true);
    }
  };

  const autoVerify = async (appId: string) => {
    try {
      setVerifying(prev => ({ ...prev, [appId]: true }));
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:3002/api/welfare/applications/${appId}/auto-verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        // Update application status in local state
        setApplications(prev => prev.map(app => 
          app._id === appId ? { 
            ...app, 
            status: data.status || 'verified'
          } : app
        ));
      }
    } catch (e) {
      console.error('Auto verify failed', e);
    } finally {
      setVerifying(prev => ({ ...prev, [appId]: false }));
    }
  };

  const exportApplicationsCSV = () => {
    const filteredApplications = selectedSchemeId === 'all' 
      ? applications 
      : applications.filter(app => app.schemeId === selectedSchemeId);
      
    const headers = ['Scheme','Applicant','Income','Income Category','Caste','House Number','Status','Score','Applied At','Phone','Address'];
    const rows = filteredApplications.map(a => [
      a.schemeTitle,
      a.userName,
      a.personalDetails.totalIncome || 0,
      a.personalDetails.incomeCategory || 'N/A',
      a.personalDetails.caste || 'N/A',
      a.personalDetails.houseNumber || 'N/A',
      a.status,
      a.score ?? '',
      a.appliedAt ? new Date(a.appliedAt).toLocaleString() : '',
      a.personalDetails.phoneNumber || '',
      a.personalDetails.address || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${String(x ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedSchemeId === 'all' ? 'welfare_applications_all.csv' : `welfare_applications_${selectedSchemeId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get filtered applications based on selected scheme
  const filteredApplications = selectedSchemeId === 'all' 
    ? applications 
    : applications.filter(app => app.schemeId === selectedSchemeId);
  
  const totalStats = {
    total: filteredApplications.length,
    pending: filteredApplications.filter(app => app.status === 'pending').length,
    approved: filteredApplications.filter(app => app.status === 'approved').length,
    rejected: filteredApplications.filter(app => app.status === 'rejected').length,
    withScores: filteredApplications.filter(app => app.score !== undefined).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-gray-600">Loading welfare applications...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xl text-gray-800">Welfare Application Management</h3>
          <div className="flex space-x-2 items-center">
            <select
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Active Schemes</option>
              {schemes.map(s => (
                <option key={s._id} value={s._id}>{s.title}</option>
              ))}
            </select>
            <button onClick={exportApplicationsCSV} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              <i className="fas fa-download mr-2"></i>
              Export
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{totalStats.total}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">{totalStats.pending}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{totalStats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-red-600">{totalStats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{schemes.length}</div>
            <div className="text-sm text-gray-600">Active Schemes</div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="space-y-6">
        {schemes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Schemes</h3>
            <p className="text-gray-600">There are currently no active welfare schemes with applications.</p>
          </div>
        ) : selectedSchemeId === 'all' ? (
          // Show all schemes with their applications
          schemes.map(scheme => {
            const schemeApps = getApplicationsForScheme(scheme._id);
            const stats = getSchemeStats(scheme._id);
            const isExpanded = expandedSchemes[scheme._id];
            
            return (
              <div key={scheme._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Scheme Header */}
                <div 
                  className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSchemeExpansion(scheme._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 mr-4">{scheme.title}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          scheme.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {scheme.status}
                        </span>
                        {scheme.endDate && (
                          <span className="ml-2 text-xs text-gray-500">
                            Ends: {new Date(scheme.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{scheme.description}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">
                          <i className="fas fa-users mr-1"></i>
                          Age: {scheme.minAge}-{scheme.maxAge} years
                        </span>
                        <span className="text-gray-600">
                          <i className="fas fa-calendar mr-1"></i>
                          Created: {new Date(scheme.createdAt).toLocaleDateString()}
                        </span>
                        {scheme.totalSlots && (
                          <span className="text-gray-600">
                            <i className="fas fa-clipboard-list mr-1"></i>
                            Slots: {scheme.totalSlots}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Application Stats */}
                      <div className="flex space-x-3 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{stats.total}</div>
                          <div className="text-gray-500">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-yellow-600">{stats.pending}</div>
                          <div className="text-gray-500">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{stats.approved}</div>
                          <div className="text-gray-500">Approved</div>
                        </div>
                      </div>
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-400`}></i>
                    </div>
                  </div>
                </div>
                
                {/* Applications List */}
                {isExpanded && (
                  <div className="p-6">
                    {schemeApps.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <i className="fas fa-inbox text-2xl mb-2"></i>
                        <p>No applications for this scheme yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4"> 
                       {schemeApps.map(app => (
                          <div key={app._id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-3">
                                  <h5 className="font-bold text-lg text-gray-800 mr-4">{app.userName}</h5>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {app.status}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    Applied: {new Date(app.appliedAt).toLocaleDateString()}
                                  </span>
                                </div>
                                
                                {/* Application Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                  <div>
                                    <span className="text-gray-500">Income:</span>
                                    <span className="font-medium ml-1">₹{(app.personalDetails.totalIncome || 0).toLocaleString()}/yr</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Category:</span>
                                    <span className="font-medium ml-1">{(app.personalDetails.incomeCategory || 'N/A').toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Caste:</span>
                                    <span className="font-medium ml-1">{(app.personalDetails.caste || 'N/A').toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">House:</span>
                                    <span className="font-medium ml-1">{app.personalDetails.houseNumber || 'N/A'}</span>
                                  </div>
                                </div>
                                
                                {/* Additional Info */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {app.personalDetails.isKudumbasreeMember && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      Kudumbasree Member
                                    </span>
                                  )}
                                  {app.personalDetails.hasFamilyMemberWithGovtJob && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                      Govt Job in Family
                                    </span>
                                  )}
                                  {app.personalDetails.hasDisabledPersonInHouse && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                      Disabled Person
                                    </span>
                                  )}
                                  {app.personalDetails.ownsLand && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                      Land Owner
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-sm text-gray-600">
                                  <i className="fas fa-map-marker-alt mr-1"></i>
                                  {app.personalDetails.address}
                                </div>
                                
                                {app.justification && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                      <i className="fas fa-lightbulb mr-2"></i>
                                      {app.justification}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="ml-6 flex flex-col items-end space-y-3">
                                {app.score !== undefined ? (
                                  <div className="text-center">
                                    <p className="text-sm text-gray-500 mb-1">AI Score</p>
                                    <div className={`text-2xl font-bold rounded-lg px-3 py-2 ${
                                      app.score >= 80 ? 'text-green-600 bg-green-100' :
                                      app.score >= 60 ? 'text-yellow-600 bg-yellow-100' :
                                      'text-red-600 bg-red-100'
                                    }`}>
                                      {app.score}
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleGetScore(app._id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                  >
                                    <i className="fas fa-calculator mr-2"></i>Get AI Score
                                  </button>
                                )}
                                
                                <div className="flex flex-col space-y-2">
                                  <button
                                    onClick={() => openVerificationModal(app._id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                                  >
                                    <i className="fas fa-eye mr-2"></i>Review
                                  </button>
                                  <button
                                    onClick={() => autoVerify(app._id)}
                                    disabled={verifying[app._id]}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                                  >
                                    {verifying[app._id] ? (
                                      <><i className="fas fa-spinner fa-spin mr-1"></i>Verifying...</>
                                    ) : (
                                      <><i className="fas fa-magic mr-2"></i>Auto Verify</>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Show single scheme view
          (() => {
            const selectedScheme = schemes.find(s => s._id === selectedSchemeId);
            const schemeApps = getApplicationsForScheme(selectedSchemeId);
            
            if (!selectedScheme) {
              return <div className="text-gray-600">Scheme not found.</div>;
            }
            
            return (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedScheme.title}</h4>
                  <p className="text-gray-600 mb-4">{selectedScheme.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span><i className="fas fa-users mr-1"></i>Age: {selectedScheme.minAge}-{selectedScheme.maxAge}</span>
                    <span><i className="fas fa-calendar mr-1"></i>Created: {new Date(selectedScheme.createdAt).toLocaleDateString()}</span>
                    {selectedScheme.totalSlots && <span><i className="fas fa-clipboard-list mr-1"></i>Slots: {selectedScheme.totalSlots}</span>}
                  </div>
                </div>
                <div className="p-6">
                  {schemeApps.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-inbox text-2xl mb-2"></i>
                      <p>No applications for this scheme yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {schemeApps.map(app => (
                        <div key={app._id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-bold text-lg text-gray-800 mb-2">{app.userName}</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                <div>
                                  <span className="text-gray-500">Income:</span>
                                  <span className="font-medium ml-1">₹{(app.personalDetails.totalIncome || 0).toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Category:</span>
                                  <span className="font-medium ml-1">{(app.personalDetails.incomeCategory || 'N/A').toUpperCase()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Caste:</span>
                                  <span className="font-medium ml-1">{(app.personalDetails.caste || 'N/A').toUpperCase()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Status:</span>
                                  <span className={`font-medium ml-1 ${
                                    app.status === 'approved' ? 'text-green-600' :
                                    app.status === 'rejected' ? 'text-red-600' :
                                    'text-yellow-600'
                                  }`}>{app.status}</span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-6 flex flex-col items-end space-y-2">
                              {app.score !== undefined && (
                                <div className={`text-xl font-bold rounded-lg px-3 py-2 ${
                                  app.score >= 80 ? 'text-green-600 bg-green-100' :
                                  app.score >= 60 ? 'text-yellow-600 bg-yellow-100' :
                                  'text-red-600 bg-red-100'
                                }`}>
                                  {app.score}
                                </div>
                              )}
                              <button
                                onClick={() => openVerificationModal(app._id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                              >
                                <i className="fas fa-eye mr-2"></i>Review
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Verification Modal */}
      {showVerificationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedApplication.userName}</div>
                  <div><span className="font-medium">Email:</span> {selectedApplication.userEmail}</div>
                  <div><span className="font-medium">Ward:</span> {selectedApplication.userWard}</div>
                  <div><span className="font-medium">Phone:</span> {selectedApplication.personalDetails.phoneNumber}</div>
                  <div><span className="font-medium">House Number:</span> {selectedApplication.personalDetails.houseNumber}</div>
                  <div><span className="font-medium">Caste:</span> {selectedApplication.personalDetails.caste}</div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Total Income:</span> ₹{selectedApplication.personalDetails.totalIncome.toLocaleString()}/year</div>
                  <div><span className="font-medium">Income Category:</span> {selectedApplication.personalDetails.incomeCategory.toUpperCase()}</div>
                  <div><span className="font-medium">Owns Land:</span> {selectedApplication.personalDetails.ownsLand ? 'Yes' : 'No'}</div>
                  {selectedApplication.personalDetails.ownsLand && (
                    <div className="col-span-2">
                      <span className="font-medium">Land Details:</span> 
                      {selectedApplication.personalDetails.landDetails.villageName} - 
                      Survey No: {selectedApplication.personalDetails.landDetails.surveyNumber}, 
                      Area: {selectedApplication.personalDetails.landDetails.area}
                    </div>
                  )}
                </div>
              </div>

              {/* Family & Social Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Family & Social Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Kudumbasree Member:</span> {selectedApplication.personalDetails.isKudumbasreeMember ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">Pays Harithakarmasena Fee:</span> {selectedApplication.personalDetails.paysHarithakarmasenaFee ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">Family Member with Govt Job:</span> {selectedApplication.personalDetails.hasFamilyMemberWithGovtJob ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">Disabled Person in House:</span> {selectedApplication.personalDetails.hasDisabledPersonInHouse ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">Family Member with Pension:</span> {selectedApplication.personalDetails.hasFamilyMemberWithPension ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* Utilities */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Utilities & Infrastructure</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Drinking Water Source:</span> {selectedApplication.personalDetails.drinkingWaterSource}</div>
                  <div><span className="font-medium">Has Toilet:</span> {selectedApplication.personalDetails.hasToilet ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* Documents */}
              {selectedApplication.documents.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Uploaded Documents</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedApplication.documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <i className="fas fa-file-alt mr-1"></i>
                        {doc.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Score */}
              {selectedApplication.score !== undefined && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">AI Assessment</h3>
                  <div className="flex items-center space-x-4">
                    <div className={`text-3xl font-bold rounded-lg px-4 py-2 ${
                      selectedApplication.score >= 80 ? 'text-green-600 bg-green-100' :
                      selectedApplication.score >= 60 ? 'text-yellow-600 bg-yellow-100' :
                      'text-red-600 bg-red-100'
                    }`}>
                      {selectedApplication.score}/100
                    </div>
                    {selectedApplication.justification && (
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{selectedApplication.justification}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => autoVerify(selectedApplication._id)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium shadow-lg shadow-purple-500/25"
                >
                  <i className="fas fa-magic mr-2"></i>
                  Auto Verify with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouncillorWelfareApplications;