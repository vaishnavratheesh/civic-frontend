
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Complaint, ComplaintStatus, WelfareApplication, ApplicationStatus, WelfareScheme } from '../../types';
import { STATUS_COLORS } from '../../constants';
import { scoreWelfareApplication } from '../../services/geminiService';
import Spinner from '../../components/Spinner';


// Councillor sidebar navigation items
const councillorSidebarItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'fa-tachometer-alt', path: '/councillor' },
    { id: 'complaints', name: 'Complaints', icon: 'fa-exclamation-triangle', path: '/councillor/complaints' },
    { id: 'welfare', name: 'Welfare Applications', icon: 'fa-hands-helping', path: '/councillor/welfare' },
    { id: 'view-schemes', name: 'View Schemes', icon: 'fa-list-alt', path: '/councillor/view-schemes' },
    { id: 'add-schemes', name: 'Add Schemes', icon: 'fa-plus-circle', path: '/councillor/add-schemes' },
    { id: 'edit-profile', name: 'Edit Profile', icon: 'fa-user-edit', path: '/councillor/edit-profile' },
];

const mockWardComplaints: Complaint[] = [
    { id: 'comp-1', userId: 'user-citizen', userName: 'John Doe', ward: 5, imageURL: 'https://picsum.photos/400/300?random=1', issueType: 'Road Repair', description: 'Large pothole causing traffic issues.', location: { lat: 12.9716, lng: 77.5946 }, priorityScore: 4, status: ComplaintStatus.PENDING, source: 'user', createdAt: '2023-10-26T10:00:00Z' },
    { id: 'comp-5', userId: 'user-citizen-2', userName: 'Jane Smith', ward: 5, imageURL: 'https://picsum.photos/400/300?random=5', issueType: 'Water Leakage', description: 'Main water line leaking for two days on 5th cross.', location: { lat: 12.9716, lng: 77.5946 }, priorityScore: 5, status: ComplaintStatus.PENDING, source: 'user', createdAt: '2023-10-28T11:00:00Z' },
];

const mockWelfareApplications: WelfareApplication[] = [
    { id: 'app-1', schemeId: 'sch-1', schemeTitle: 'Free Sewing Machines', userId: 'user-3', userName: 'Anita Devi', address: '12, New Colony, Ward 5', phoneNumber: '9876543211', rationCardNumber: 'RC98765', aadharNumber: '1111-2222-3333', ward: 5, reason: 'I am a single mother and want to start a tailoring business to support my two children.', isHandicapped: false, isSingleWoman: true, familyIncome: 120000, dependents: 3, status: ApplicationStatus.PENDING, createdAt: '2023-10-27T10:00:00Z' },
    { id: 'app-2', schemeId: 'sch-1', schemeTitle: 'Free Sewing Machines', userId: 'user-4', userName: 'Sunita Kumari', address: '45, Old Town, Ward 5', phoneNumber: '9876543212', rationCardNumber: 'RC54321', aadharNumber: '4444-5555-6666', ward: 5, reason: 'I have tailoring skills but cannot afford a machine.', isHandicapped: false, isSingleWoman: false, familyIncome: 90000, dependents: 1, status: ApplicationStatus.PENDING, createdAt: '2023-10-28T11:30:00Z' },
];


type Tab = 'complaints' | 'welfare' | 'view-schemes' | 'add-schemes';

const CouncillorDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('complaints');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [headerStats, setHeaderStats] = useState({
        pendingComplaints: 0,
        welfareApplications: 0,
        welfareSchemes: 0,
        wardPopulation: 0
    });
    const [headerLoading, setHeaderLoading] = useState(true);

    useEffect(() => {
        const fetchHeaderStats = async () => {
            if (!user) return;
            try {
                setHeaderLoading(true);
                const token = localStorage.getItem('token');
                const tokenHeader = token ? { Authorization: `Bearer ${token}` } : {};
                const [appsRes, wardRes, schemesRes, appsListRes] = await Promise.all([
                    fetch('http://localhost:3002/api/welfare/applications/stats', {
                        headers: {
                            'Content-Type': 'application/json',
                            ...tokenHeader
                        }
                    }),
                    fetch(`http://localhost:3002/api/users/wards/${user.ward}/stats`),
                    fetch('http://localhost:3002/api/welfare/schemes', {
                        headers: {
                            'Content-Type': 'application/json',
                            ...tokenHeader
                        }
                    }),
                    fetch(`http://localhost:3002/api/welfare/applications?ward=${user.ward}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...tokenHeader
                        }
                    })
                ]);

                let welfareApplications = 0;
                if (appsRes.ok) {
                    const data = await appsRes.json();
                    const s = data?.stats || {};
                    welfareApplications = Number(s.totalApplications || 0);
                }
                // Fallback to direct list count if stats endpoint returns 0
                if (welfareApplications === 0 && appsListRes.ok) {
                    const data = await appsListRes.json();
                    welfareApplications = Array.isArray(data?.applications) ? data.applications.length : 0;
                }

                let wardPopulation = 0;
                if (wardRes.ok) {
                    const data = await wardRes.json();
                    wardPopulation = Number(data?.stats?.totalUsers || 0);
                }

                let welfareSchemes = 0;
                if (schemesRes.ok) {
                    const data = await schemesRes.json();
                    const schemes: any[] = data?.schemes || [];
                    // Count councillor-owned schemes (or panchayath visible ones); we show total returned for councillor
                    welfareSchemes = schemes.length;
                }

                setHeaderStats({
                    pendingComplaints: 0, // real complaints endpoint not available yet
                    welfareApplications,
                    welfareSchemes,
                    wardPopulation
                });
            } catch (e) {
                setHeaderStats({
                    pendingComplaints: 0,
                    welfareApplications: 0,
                    resolvedIssues: 0,
                    wardPopulation: 0
                });
            } finally {
                setHeaderLoading(false);
            }
        };
        fetchHeaderStats();
    }, [user]);

    const handleSidebarNavigation = (itemId: string) => {
        if (itemId === 'edit-profile') {
            // Navigate to edit profile page
            navigate('/councillor/edit-profile');
        } else {
            setActiveTab(itemId as Tab);
        }
    };

    // No profile completion check - councillors can edit profile from dashboard

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar onMenuClick={() => setSidebarOpen(true)} />
            <div className="flex">
                <Sidebar 
                    items={councillorSidebarItems}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    activeTab={activeTab}
                    onItemClick={handleSidebarNavigation}
                />
                <main className="flex-1 p-6">
                    {/* Header (no big page title) */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div className="text-gray-700 text-sm">
                                Welcome back, <span className="font-semibold">{user.name}</span> • Ward {user.ward} • Erumeli Panchayath
                            </div>
                            <div className="text-right">
                                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                                    <p className="text-sm font-medium">Ward {user.ward}</p>
                                    <p className="text-xs">Councillor</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <i className="fas fa-exclamation-triangle text-red-600"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Pending Complaints</p>
                                    <p className="text-2xl font-bold text-gray-900">{headerLoading ? '—' : headerStats.pendingComplaints}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <i className="fas fa-hands-helping text-green-600"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Welfare Applications</p>
                                    <p className="text-2xl font-bold text-gray-900">{headerLoading ? '—' : headerStats.welfareApplications}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <i className="fas fa-hands-helping text-blue-600"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Welfare Schemes</p>
                                    <p className="text-2xl font-bold text-gray-900">{headerLoading ? '—' : headerStats.welfareSchemes}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <i className="fas fa-users text-purple-600"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Ward Population</p>
                                    <p className="text-2xl font-bold text-gray-900">{headerLoading ? '—' : headerStats.wardPopulation.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 px-6">
                                <button 
                                    onClick={() => setActiveTab('complaints')} 
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'complaints' 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <i className="fas fa-exclamation-triangle mr-2"></i>
                            Ward Complaints
                        </button>
                                <button 
                                    onClick={() => setActiveTab('welfare')} 
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'welfare' 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <i className="fas fa-hands-helping mr-2"></i>
                            Welfare Applications
                        </button>
                                <button 
                                    onClick={() => setActiveTab('view-schemes')} 
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'view-schemes' 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <i className="fas fa-list-alt mr-2"></i>
                                    View Schemes
                        </button>
                                <button 
                                    onClick={() => setActiveTab('add-schemes')} 
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'add-schemes' 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <i className="fas fa-plus-circle mr-2"></i>
                                    Add Schemes
                        </button>
                    </nav>
                </div>
                        <div className="p-6">
                            {activeTab === 'complaints' && <WardComplaints />}
                            {activeTab === 'welfare' && <WelfareQueue />}
                            {activeTab === 'view-schemes' && <ViewSchemes />}
                            {activeTab === 'add-schemes' && <AddSchemes />}
                        </div>
                    </div>
            </main>
            </div>
        </div>
    );
};

const WardComplaints: React.FC = () => (
    <div>
        <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-gray-800">Pending Complaints in Your Ward</h3>
            <div className="flex space-x-2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    <i className="fas fa-download mr-2"></i>
                    Export Report
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    <i className="fas fa-plus mr-2"></i>
                    Add Note
                </button>
            </div>
        </div>
        
        <div className="space-y-4">
            {mockWardComplaints.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-3">
                                    Priority {c.priorityScore}
                                </span>
                                <span className="text-sm text-gray-500">
                                    <i className="fas fa-clock mr-1"></i>
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-2">{c.issueType}</h4>
                            <p className="text-gray-600 mb-3">{c.description}</p>
                            <div className="flex items-center text-sm text-gray-500">
                                <i className="fas fa-user mr-2"></i>
                                <span>Reported by: {c.userName}</span>
                                <span className="mx-2">•</span>
                                <i className="fas fa-map-marker-alt mr-2"></i>
                                <span>Ward {c.ward}</span>
                            </div>
                        </div>
                        <div className="ml-6 flex flex-col space-y-2">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                <i className="fas fa-user-tie mr-2"></i>
                                Assign Officer
                            </button>
                            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                <i className="fas fa-eye mr-2"></i>
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const WelfareQueue: React.FC = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState<WelfareApplication[]>([]);
    const [loadingScores, setLoadingScores] = useState<{[key: string]: boolean}>({});
    const [schemes, setSchemes] = useState<{ id: string; title: string }[]>([]);
    const [selectedSchemeId, setSelectedSchemeId] = useState<string>('all');
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Load councillor's schemes for filter
    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3002/api/welfare/schemes', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    const mapped = (data.schemes || []).map((s: any) => ({ id: s._id || s.id, title: s.title }));
                    setSchemes(mapped);
                }
            } catch (e) {
                console.error('Failed to load schemes', e);
            }
        };
        fetchSchemes();
    }, [user?.id]);

    // Fetch applications for councillor's ward, optionally by scheme
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const token = localStorage.getItem('token');
                const params = new URLSearchParams();
                if (user?.ward) params.append('ward', String(user.ward));
                if (selectedSchemeId !== 'all') params.append('schemeId', selectedSchemeId);
                const url = `http://localhost:3002/api/welfare/applications?${params.toString()}`;
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const statusMap: Record<string, ApplicationStatus> = {
                        pending: ApplicationStatus.PENDING,
                        approved: ApplicationStatus.APPROVED,
                        rejected: ApplicationStatus.REJECTED,
                    };
                    const mapped: WelfareApplication[] = (data.applications || []).map((a: any) => ({
                        id: a._id,
                        schemeId: typeof a.schemeId === 'object' ? a.schemeId._id || a.schemeId.id : a.schemeId,
                        schemeTitle: a.schemeTitle || (typeof a.schemeId === 'object' ? a.schemeId.title : ''),
                        userId: typeof a.userId === 'object' ? a.userId._id || a.userId.id : a.userId,
                        userName: a.userName,
                        address: a.personalDetails?.address || '',
                        phoneNumber: a.personalDetails?.phoneNumber || '',
                        rationCardNumber: a.personalDetails?.rationCardNumber || '',
                        aadharNumber: a.personalDetails?.aadharNumber || '',
                        ward: a.userWard,
                        reason: a.reason,
                        isHandicapped: !!a.personalDetails?.isHandicapped,
                        isSingleWoman: !!a.personalDetails?.isSingleWoman,
                        familyIncome: a.personalDetails?.familyIncome ?? 0,
                        dependents: a.personalDetails?.dependents ?? 0,
                        status: statusMap[(a.status || 'pending').toLowerCase()] || ApplicationStatus.PENDING,
                        createdAt: a.appliedAt,
                        score: a.score,
                        justification: a.justification,
                    }));
                    setApplications(mapped);
                } else {
                    console.error('Failed to fetch applications:', response.statusText);
                    setApplications([]);
                }
            } catch (err) {
                console.error('Error fetching applications:', err);
                setApplications([]);
            }
        };

        fetchApplications();
    }, [user?.id, user?.ward, selectedSchemeId]);

    const handleGetScore = async (appId: string) => {
        const app = applications.find(a => a.id === appId);
        if (!app || app.score !== undefined) return;

        setLoadingScores(prev => ({ ...prev, [appId]: true }));
        try {
            const result = await scoreWelfareApplication(app.reason, app.familyIncome, app.dependents);
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, score: result.score, justification: result.justification } : a));
        } catch (error) {
            console.error("Failed to get score", error);
        } finally {
            setLoadingScores(prev => ({ ...prev, [appId]: false }));
        }
    };
    
    const sortedApplications = [...applications].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

    // Group by scheme when All selected
    const applicationsByScheme: Record<string, WelfareApplication[]> = sortedApplications.reduce((acc, app) => {
        const key = app.schemeId;
        if (!acc[key]) acc[key] = [];
        acc[key].push(app);
        return acc;
    }, {} as Record<string, WelfareApplication[]>);

    const exportApplicationsCSV = () => {
        const headers = ['Scheme','Applicant','Income','Dependents','Status','Score','Applied At'];
        const source = selectedSchemeId === 'all' ? sortedApplications : sortedApplications.filter(a => a.schemeId === selectedSchemeId);
        const rows = source.map(a => [
            a.schemeTitle,
            a.userName,
            a.familyIncome,
            a.dependents,
            ApplicationStatus[a.status],
            a.score ?? '',
            a.createdAt ? new Date(a.createdAt).toLocaleString() : ''
        ]);
        const csv = [headers, ...rows].map(r => r.map(x => `"${String(x ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = selectedSchemeId === 'all' ? 'applications_all.csv' : `applications_${selectedSchemeId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const appAnalytics = (() => {
        const total = sortedApplications.length;
        const withScores = sortedApplications.filter(a => a.score !== undefined);
        const avgScore = withScores.length ? (withScores.reduce((s,a)=> s + (a.score as number), 0) / withScores.length) : 0;
        const approved = sortedApplications.filter(a => a.status === ApplicationStatus.APPROVED).length;
        const rejected = sortedApplications.filter(a => a.status === ApplicationStatus.REJECTED).length;
        const pending = sortedApplications.filter(a => a.status === ApplicationStatus.PENDING).length;
        // top by score
        const top = [...withScores].sort((a,b) => (b.score as number) - (a.score as number)).slice(0,5);
        return { total, avgScore, approved, rejected, pending, top };
    })();

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-gray-800">Welfare Application Queue</h3>
                <div className="flex space-x-2 items-center">
                    <select
                        value={selectedSchemeId}
                        onChange={(e) => setSelectedSchemeId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="all">All Schemes</option>
                        {schemes.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                    <button onClick={exportApplicationsCSV} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        <i className="fas fa-download mr-2"></i>
                        Export Applications
                    </button>
                    <button onClick={() => setShowAnalytics(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        <i className="fas fa-chart-bar mr-2"></i>
                        View Analytics
                    </button>
                </div>
            </div>
            
            <div className="space-y-6">
                {selectedSchemeId === 'all' ? (
                    Object.keys(applicationsByScheme).length === 0 ? (
                        <div className="text-gray-600">No applications found.</div>
                    ) : (
                        Object.entries(applicationsByScheme).map(([schemeId, apps]) => {
                            const schemeTitle = apps[0]?.schemeTitle || (schemes.find(s => s.id === schemeId)?.title ?? 'Scheme');
                            return (
                                <div key={schemeId}>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">{schemeTitle}</h4>
                                    <div className="space-y-4">
                                        {apps.map(app => (
                                            <div key={app.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-3">
                                                            <h4 className="font-bold text-lg text-gray-800 mr-4">{app.userName}</h4>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {app.schemeTitle}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-600 mb-3 italic">"{app.reason}"</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-500">Income:</span>
                                                                <span className="font-medium ml-1">₹{app.familyIncome.toLocaleString()}/yr</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Dependents:</span>
                                                                <span className="font-medium ml-1">{app.dependents}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Status:</span>
                                                                <span className="font-medium ml-1">{app.isSingleWoman ? 'Single Woman' : 'Married'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Address:</span>
                                                                <span className="font-medium ml-1">{app.address}</span>
                                                            </div>
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
                                                                <div className="text-3xl font-bold text-green-600 bg-green-100 rounded-lg px-3 py-2">
                                                                    {app.score}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleGetScore(app.id)} 
                                                                disabled={loadingScores[app.id]} 
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:bg-indigo-300"
                                                            >
                                                                {loadingScores[app.id] ? (
                                                                    <div className="flex items-center">
                                                                        <Spinner size="sm" />
                                                                        <span className="ml-2">Analyzing...</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center">
                                                                        <i className="fas fa-brain mr-2"></i>
                                                                        Get AI Score
                                                                    </div>
                                                                )}
                                                            </button>
                                                        )}
                                                        <div className="flex space-x-2">
                                                            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                                                <i className="fas fa-check mr-2"></i>
                                                                Approve
                                                            </button>
                                                            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                                                <i className="fas fa-times mr-2"></i>
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )
                ) : (
                    <div className="space-y-4">
                        {sortedApplications.map(app => (
                            <div key={app.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-3">
                                            <h4 className="font-bold text-lg text-gray-800 mr-4">{app.userName}</h4>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {app.schemeTitle}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-3 italic">"{app.reason}"</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Income:</span>
                                                <span className="font-medium ml-1">₹{app.familyIncome.toLocaleString()}/yr</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Dependents:</span>
                                                <span className="font-medium ml-1">{app.dependents}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Status:</span>
                                                <span className="font-medium ml-1">{app.isSingleWoman ? 'Single Woman' : 'Married'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Address:</span>
                                                <span className="font-medium ml-1">{app.address}</span>
                                            </div>
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
                                                <div className="text-3xl font-bold text-green-600 bg-green-100 rounded-lg px-3 py-2">
                                                    {app.score}
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleGetScore(app.id)} 
                                                disabled={loadingScores[app.id]} 
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:bg-indigo-300"
                                            >
                                                {loadingScores[app.id] ? (
                                                    <div className="flex items-center">
                                                        <Spinner size="sm" />
                                                        <span className="ml-2">Analyzing...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                                                        <i className="fas fa-brain mr-2"></i>
                                                        Get AI Score
                                                    </div>
                                                )}
                                            </button>
                                        )}
                                        <div className="flex space-x-2">
                                            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                                <i className="fas fa-check mr-2"></i>
                                                Approve
                                            </button>
                                            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                                <i className="fas fa-times mr-2"></i>
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Applications Analytics Modal */}
            {showAnalytics && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h4 className="text-lg font-semibold">Applications Analytics</h4>
                            <button onClick={() => setShowAnalytics(false)} className="px-3 py-1 rounded-md border hover:bg-gray-50">Close</button>
                        </div>

                        {/* KPI cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <div className="text-xs uppercase tracking-wide text-gray-500">Total</div>
                                <div className="text-2xl font-bold">{appAnalytics.total}</div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="text-xs uppercase tracking-wide text-green-700">Approved</div>
                                <div className="text-2xl font-bold text-green-700">{appAnalytics.approved}</div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                <div className="text-xs uppercase tracking-wide text-red-700">Rejected</div>
                                <div className="text-2xl font-bold text-red-700">{appAnalytics.rejected}</div>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                                <div className="text-xs uppercase tracking-wide text-yellow-700">Pending</div>
                                <div className="text-2xl font-bold text-yellow-700">{appAnalytics.pending}</div>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="text-xs uppercase tracking-wide text-purple-700">Avg Score</div>
                                <div className="text-2xl font-bold text-purple-700">{appAnalytics.avgScore.toFixed(1)}</div>
                            </div>
                        </div>

                        {/* Simple stacked bar for status distribution */}
                        <div className="mb-8">
                            <div className="mb-2 text-sm text-gray-600">Status Distribution</div>
                            {(() => {
                                const total = Math.max(appAnalytics.total, 1);
                                const pct = (n: number) => (n / total) * 100;
                                return (
                                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-green-500" style={{width: `${pct(appAnalytics.approved)}%`}} title={`Approved ${appAnalytics.approved}`}></div>
                                        <div className="h-full bg-red-500" style={{width: `${pct(appAnalytics.rejected)}%`}} title={`Rejected ${appAnalytics.rejected}`}></div>
                                        <div className="h-full bg-yellow-500" style={{width: `${pct(appAnalytics.pending)}%`}} title={`Pending ${appAnalytics.pending}`}></div>
                                    </div>
                                );
                            })()}
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Approved</span><span>Rejected</span><span>Pending</span>
                            </div>
                        </div>

                        {/* Top applicants by score */}
                        <div>
                            <div className="mb-2 font-medium">Top Applicants by Score</div>
                            <div className="space-y-2">
                                {appAnalytics.top.map((a, i) => (
                                    <div key={a.id} className="flex items-center space-x-3">
                                        <div className="w-6 text-sm text-gray-500">{i+1}</div>
                                        <div className="flex-1">
                                            <div className="truncate text-sm">{a.userName} — <span className="text-gray-500">{a.schemeTitle}</span></div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{width: `${Math.min((a.score ?? 0) * 10, 100)}%`}}></div>
                                            </div>
                                        </div>
                                        <div className="w-10 text-right font-semibold">{a.score}</div>
                                    </div>
                                ))}
                                {appAnalytics.top.length === 0 && <div className="text-sm text-gray-500">No scored applications yet.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AddSchemes: React.FC = () => {
    const { user, logout } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        eligibilityCriteria: '',
        benefits: '',
        documentsRequired: '',
        totalSlots: '',
        applicationDeadline: '',
        startDate: '',
        endDate: '',
        additionalDetails: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Simple token check - just verify it exists
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setTokenValid(false);
            setError('Please login to create schemes.');
        } else {
            setTokenValid(true);
            setError('');
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setTouched(prev => ({ ...prev, [name]: true }));
        // real-time validation on change
        const nextValues = { ...formData, [name]: value } as typeof formData;
        setFieldErrors(validate(nextValues));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setFieldErrors(validate());
    };

    const validate = (values = formData) => {
        const errs: Record<string, string> = {};
        const trim = (s: string) => (s || '').trim();
        const asInt = (s: string) => Number.parseInt(String(s), 10);
        const toDate = (s: string) => (s ? new Date(s + 'T00:00:00') : null);

        if (trim(values.title).length < 3) errs.title = 'Title must be at least 3 characters.';
        if (!values.category) errs.category = 'Select a category.';
        if (trim(values.description).length < 20) errs.description = 'Description must be at least 20 characters.';
        if (trim(values.eligibilityCriteria).length < 10) errs.eligibilityCriteria = 'Provide clear eligibility criteria (min 10 chars).';
        if (trim(values.benefits).length < 10) errs.benefits = 'Describe key benefits (min 10 chars).';

        const slots = asInt(String(values.totalSlots));
        if (!Number.isFinite(slots) || slots < 1) errs.totalSlots = 'Total slots must be a positive integer.';

        const today = new Date(); today.setHours(0,0,0,0);
        const start = toDate(values.startDate);
        const end = toDate(values.endDate);
        const deadline = toDate(values.applicationDeadline);
        if (!start) errs.startDate = 'Start date is required.';
        if (!end) errs.endDate = 'End date is required.';
        if (!deadline) errs.applicationDeadline = 'Application deadline is required.';
        if (start && end && start > end) errs.endDate = 'End date must be after or on the start date.';
        if (deadline && start && deadline > end!) errs.applicationDeadline = 'Deadline must be on/before end date.';
        if (deadline && deadline < today) errs.applicationDeadline = 'Deadline cannot be in the past.';
        if (start && start < today) errs.startDate = 'Start date cannot be in the past.';
        return errs;
    };

    useEffect(() => {
        // keep errors in sync as user types
        setFieldErrors(validate());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.startDate, formData.endDate, formData.applicationDeadline, formData.totalSlots]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // mark all fields as touched to show errors
        setTouched({
            title: true,
            category: true,
            description: true,
            eligibilityCriteria: true,
            benefits: true,
            documentsRequired: true,
            totalSlots: true,
            applicationDeadline: true,
            startDate: true,
            endDate: true,
            additionalDetails: true
        });
        const errs = validate();
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) {
            setError('Please fix the highlighted fields and try again.');
            return;
        }
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            console.log('Form submission started');
            console.log('Token exists:', !!token);
            console.log('User data:', user);
            console.log('Form data:', formData);
            
            if (!token) {
                setError('Please login to create schemes.');
                return;
            }

            const requestData = {
                ...formData,
                totalSlots: parseInt(formData.totalSlots),
                documentsRequired: formData.documentsRequired.split(',').map(doc => doc.trim()).filter(doc => doc),
                scope: 'ward',
                ward: user?.ward,
                createdBy: 'councillor',
                creatorId: user?.id,
                creatorName: user?.name,
                status: 'inactive'
            };

            console.log('Sending request to:', 'http://localhost:3002/api/welfare/schemes');
            console.log('Request data:', requestData);

            const response = await fetch('http://localhost:3002/api/welfare/schemes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                console.log('Success! Scheme created');
                setMessage('Scheme created successfully! You can now publish it to make it visible to citizens.');
                setFormData({
                    title: '',
                    description: '',
                    category: '',
                    eligibilityCriteria: '',
                    benefits: '',
                    documentsRequired: '',
                    totalSlots: '',
                    applicationDeadline: '',
                    startDate: '',
                    endDate: '',
                    additionalDetails: ''
                });
                setSubmitted(false);
                setFieldErrors({});
            } else {
                console.log('Error response:', data);
                setError(data.error || data.message || 'Failed to create scheme');
            }
        } catch (err) {
            console.log('Network error:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h3 className="font-bold text-xl text-gray-800 mb-2">Create New Welfare Scheme</h3>
                <p className="text-gray-600">Create a new welfare scheme for your ward. Citizens will be able to see and apply for it once you publish it.</p>
            </div>

            {message && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                        <i className="fas fa-check-circle text-green-500 mr-3"></i>
                        <p className="text-green-700 font-medium">{message}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                        <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {!tokenValid && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <i className="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                            <button
                                onClick={() => {
                                    logout();
                                    window.location.href = '/login';
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                                Login Again
                            </button>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Scheme Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required
                            disabled={!tokenValid}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="e.g., Free Sewing Machines for Women"
                        />
                        {touched.title && fieldErrors.title && <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Category *
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select Category</option>
                            <option value="Education">Education</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Employment">Employment</option>
                            <option value="Housing">Housing</option>
                            <option value="Women Empowerment">Women Empowerment</option>
                            <option value="Senior Citizens">Senior Citizens</option>
                            <option value="Disability Support">Disability Support</option>
                            <option value="Agriculture">Agriculture</option>
                            <option value="Other">Other</option>
                        </select>
                        {touched.category && fieldErrors.category && <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description *
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe the scheme in detail..."
                    />
                    {touched.description && fieldErrors.description && <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Eligibility Criteria *
                    </label>
                    <textarea
                        name="eligibilityCriteria"
                        value={formData.eligibilityCriteria}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Who is eligible for this scheme?"
                    />
                    {touched.eligibilityCriteria && fieldErrors.eligibilityCriteria && <p className="mt-1 text-sm text-red-600">{fieldErrors.eligibilityCriteria}</p>}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Benefits *
                    </label>
                    <textarea
                        name="benefits"
                        value={formData.benefits}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="What benefits will recipients receive?"
                    />
                    {touched.benefits && fieldErrors.benefits && <p className="mt-1 text-sm text-red-600">{fieldErrors.benefits}</p>}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Documents Required
                    </label>
                    <input
                        type="text"
                        name="documentsRequired"
                        value={formData.documentsRequired}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Aadhar Card, Ration Card, Income Certificate (separate with commas)"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Total Slots *
                        </label>
                        <input
                            type="number"
                            name="totalSlots"
                            value={formData.totalSlots}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required
                            min="1"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Number of beneficiaries"
                        />
                        {touched.totalSlots && fieldErrors.totalSlots && <p className="mt-1 text-sm text-red-600">{fieldErrors.totalSlots}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Application Deadline *
                        </label>
                        <input
                            type="date"
                            name="applicationDeadline"
                            value={formData.applicationDeadline}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {touched.applicationDeadline && fieldErrors.applicationDeadline && <p className="mt-1 text-sm text-red-600">{fieldErrors.applicationDeadline}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Start Date *
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {touched.startDate && fieldErrors.startDate && <p className="mt-1 text-sm text-red-600">{fieldErrors.startDate}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        End Date *
                    </label>
                    <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {touched.endDate && fieldErrors.endDate && <p className="mt-1 text-sm text-red-600">{fieldErrors.endDate}</p>}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Additional Details (Optional)
                    </label>
                    <textarea
                        name="additionalDetails"
                        value={formData.additionalDetails}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Any additional information, special instructions, or notes..."
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => setFormData({
                            title: '',
                            description: '',
                            category: '',
                            eligibilityCriteria: '',
                            benefits: '',
                            documentsRequired: '',
                            totalSlots: '',
                            applicationDeadline: '',
                            startDate: '',
                            endDate: '',
                            additionalDetails: ''
                        })}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                        Clear Form
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !tokenValid}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <Spinner size="sm" />
                                <span className="ml-2">Creating Scheme...</span>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <i className="fas fa-plus mr-2"></i>
                                Create Scheme
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

const ViewSchemes: React.FC = () => {
    const { user } = useAuth();
    const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
    const [applicationCounts, setApplicationCounts] = useState<{[key: string]: number}>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingScheme, setEditingScheme] = useState<any>(null);
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Fetch schemes created by this councillor
    useEffect(() => {
        const fetchSchemes = async () => {
            if (!user?.ward) {
                console.log('No ward found for user:', user);
                return;
            }
            
            setFetching(true);
            try {
                const token = localStorage.getItem('token');
                console.log('Fetching schemes for user:', user);
                console.log('Using token:', token ? 'Present' : 'Missing');
                
                const response = await fetch(`http://localhost:3002/api/welfare/schemes`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched schemes data:', data);
                    const normalized = (data.schemes || []).map((s: any) => ({
                        ...s,
                        id: s._id || s.id
                    }));
                    setSchemes(normalized);
                } else {
                    const errorText = await response.text();
                    console.error('Failed to fetch schemes:', response.status, errorText);
                    setSchemes([]);
                }
            } catch (error) {
                console.error('Error fetching schemes:', error);
                setSchemes([]);
            } finally {
                setFetching(false);
            }
        };

        fetchSchemes();
    }, [user?.ward, user?.id]);

    // Fetch application counts for each scheme
    useEffect(() => {
        const fetchApplicationCounts = async () => {
            if (schemes.length === 0) return;
            
            try {
                const token = localStorage.getItem('token');
                const counts: {[key: string]: number} = {};
                
                // Fetch application counts for each scheme
                for (const scheme of schemes) {
                    const schemeKey = (scheme as any).id || (scheme as any)._id;
                    const response = await fetch(`http://localhost:3002/api/welfare/applications?schemeId=${schemeKey}&ward=${user?.ward}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('Scheme', schemeKey, 'applications length:', data.applications?.length);
                        counts[String(schemeKey)] = Array.isArray(data.applications) ? data.applications.length : 0;
                    } else {
                        counts[String(schemeKey)] = 0;
                    }
                }
                
                setApplicationCounts(counts);
            } catch (error) {
                console.error('Error fetching application counts:', error);
            }
        };

        fetchApplicationCounts();
    }, [schemes]);

    // Filter schemes based on status
    const now = new Date();
    const activeSchemes = schemes.filter(scheme => 
        (scheme.status === 'active' || scheme.status === 'draft') && new Date(scheme.endDate) >= now
    );
    
    const completedSchemes = schemes.filter(scheme => 
        scheme.status === 'completed' || scheme.status === 'expired' || new Date(scheme.endDate) < now
    );

    const currentSchemes = activeTab === 'active' ? activeSchemes : completedSchemes;

    const handlePublishScheme = async (schemeId: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3002/api/welfare/schemes/${schemeId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'active' })
            });

            if (response.ok) {
                // Update local state
                setSchemes(prev => prev.map(scheme => 
                    scheme.id === schemeId 
                        ? { ...scheme, status: 'active' }
                        : scheme
                ));
            } else {
                console.error('Failed to publish scheme:', response.statusText);
            }
        } catch (error) {
            console.error('Error publishing scheme:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteScheme = async (schemeId: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3002/api/welfare/schemes/${schemeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Remove from local state
                setSchemes(prev => prev.filter(scheme => scheme.id !== schemeId));
            } else {
                console.error('Failed to delete scheme:', response.statusText);
            }
        } catch (error) {
            console.error('Error deleting scheme:', error);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (scheme: any) => {
        setEditingScheme({
            id: (scheme as any).id,
            title: scheme.title || '',
            description: scheme.description || '',
            totalSlots: scheme.totalSlots || 0,
            applicationDeadline: scheme.applicationDeadline ? new Date(scheme.applicationDeadline).toISOString().slice(0,10) : '',
            startDate: scheme.startDate ? new Date(scheme.startDate).toISOString().slice(0,10) : '',
            endDate: scheme.endDate ? new Date(scheme.endDate).toISOString().slice(0,10) : '',
            status: scheme.status || 'active'
        });
        setShowEditModal(true);
    };

    const saveEdit = async () => {
        if (!editingScheme) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload: any = {
                title: editingScheme.title,
                description: editingScheme.description,
                totalSlots: Number(editingScheme.totalSlots),
                applicationDeadline: editingScheme.applicationDeadline,
                startDate: editingScheme.startDate,
                endDate: editingScheme.endDate,
                status: editingScheme.status
            };
            const res = await fetch(`http://localhost:3002/api/welfare/schemes/${editingScheme.id}` ,{
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                setSchemes(prev => prev.map(s => s.id === editingScheme.id ? { ...s, ...data.scheme, id: (data.scheme as any)._id || editingScheme.id } : s));
                setShowEditModal(false);
            } else {
                console.error('Failed to update scheme');
            }
        } catch (e) {
            console.error('Error updating scheme:', e);
        } finally {
            setLoading(false);
        }
    };

    // Auto-mark schemes as completed if endDate has passed
    useEffect(() => {
        const markCompletedIfExpired = async () => {
            const token = localStorage.getItem('token');
            const nowLocal = new Date();
            for (const sch of schemes) {
                if (sch.status !== 'completed' && sch.status !== 'expired' && new Date(sch.endDate) < nowLocal) {
                    try {
                        await fetch(`http://localhost:3002/api/welfare/schemes/${(sch as any).id}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ status: 'completed' })
                        });
                        setSchemes(prev => prev.map(s => s.id === (sch as any).id ? { ...s, status: 'completed' } : s));
                    } catch (err) {
                        console.warn('Failed to mark scheme completed', err);
                    }
                }
            }
        };
        if (schemes.length) markCompletedIfExpired();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schemes.length]);

    const exportCSV = () => {
        const headers = ['Title','Description','Ward','Scope','Status','Total Slots','Applications','Start Date','End Date'];
        const rows = currentSchemes.map(s => [
            s.title,
            (s as any).description || '',
            s.ward ?? '',
            (s as any).scope || '',
            s.status,
            s.totalSlots,
            applicationCounts[(s as any).id] || 0,
            new Date((s as any).startDate).toLocaleDateString(),
            new Date((s as any).endDate).toLocaleDateString()
        ]);
        const csv = [headers, ...rows].map(r => r.map(x => `"${String(x ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'schemes.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const analytics = (() => {
        const total = schemes.length;
        const active = schemes.filter(s => (s.status === 'active' || s.status === 'draft') && new Date(s.endDate) >= now).length;
        const completed = schemes.filter(s => s.status === 'completed' || s.status === 'expired' || new Date(s.endDate) < now).length;
        const totalApplications = Object.values(applicationCounts).reduce((a,b) => a + (b || 0), 0);
        // applications per scheme (sorted desc, top 7)
        const perScheme = schemes
            .map(s => ({ title: s.title, count: applicationCounts[(s as any).id] || 0 }))
            .sort((a,b) => b.count - a.count)
            .slice(0, 7);
        return { total, active, completed, totalApplications, perScheme };
    })();

    if (fetching) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex items-center">
                    <Spinner size="lg" />
                    <span className="ml-3 text-gray-600">Loading your schemes...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-gray-800">Your Created Schemes</h3>
                <div className="flex space-x-2">
                    <button onClick={exportCSV} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        <i className="fas fa-download mr-2"></i>
                        Export Schemes
                    </button>
                    <button onClick={() => setShowAnalytics(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        <i className="fas fa-chart-bar mr-2"></i>
                        View Analytics
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            activeTab === 'active'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <i className="fas fa-play-circle mr-2"></i>
                        Active Schemes ({activeSchemes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            activeTab === 'completed'
                                ? 'border-gray-500 text-gray-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <i className="fas fa-check-circle mr-2"></i>
                        Completed Schemes ({completedSchemes.length})
                    </button>
                </nav>
            </div>
            
            <div className="space-y-4">
                {currentSchemes.length > 0 ? (
                    currentSchemes.map((scheme, index) => (
                        <div key={scheme.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center mb-3">
                                        <h4 className="font-bold text-lg text-gray-800 mr-4">{scheme.title}</h4>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            scheme.status === 'active' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {scheme.status === 'active' ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-4">{scheme.description}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Total Slots:</span>
                                            <span className="font-medium ml-1">{scheme.totalSlots}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Created:</span>
                                            <span className="font-medium ml-1">{new Date(scheme.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Ward:</span>
                                            <span className="font-medium ml-1">{scheme.ward}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Applications:</span>
                                            <span className="font-medium ml-1">{applicationCounts[scheme.id] || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-6 flex flex-col space-y-2">
                                    {scheme.status === 'draft' && (
                                        <button 
                                            onClick={() => handlePublishScheme(scheme.id)}
                                            disabled={loading}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:bg-green-300"
                                        >
                                            <i className="fas fa-eye mr-2"></i>
                                            Publish
                                        </button>
                                    )}
                                    {scheme.status !== 'completed' && scheme.status !== 'expired' && (
                                        <button onClick={() => openEdit(scheme)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                            <i className="fas fa-edit mr-2"></i>
                                            Edit
                                        </button>
                                    )}
                                    {scheme.status !== 'completed' && scheme.status !== 'expired' && (
                                        <button 
                                            onClick={() => handleDeleteScheme(scheme.id)}
                                            disabled={loading}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:bg-red-300"
                                        >
                                            <i className="fas fa-trash mr-2"></i>
                                            Delete
                                        </button>
                                    )}
                                    {scheme.status === 'completed' && (
                                        <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                            <i className="fas fa-eye mr-2"></i>
                                            View Details
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className={`fas ${activeTab === 'active' ? 'fa-play-circle' : 'fa-check-circle'} text-3xl text-gray-400`}></i>
                        </div>
                        <h4 className="text-xl font-bold text-gray-700 mb-2">
                            {activeTab === 'active' ? 'No Active Schemes' : 'No Completed Schemes'}
                        </h4>
                        <p className="text-gray-500 mb-6">
                            {activeTab === 'active' 
                                ? 'You don\'t have any active welfare schemes at the moment.'
                                : 'You don\'t have any completed welfare schemes yet.'
                            }
                        </p>
                        {activeTab === 'active' && (
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                                <p className="text-blue-800 text-sm">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Create your first welfare scheme using the "Add Schemes" tab to get started.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Scheme Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
                        <h4 className="text-lg font-semibold mb-4">Edit Scheme</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Title</label>
                                <input value={editingScheme?.title || ''} onChange={e => setEditingScheme({ ...editingScheme, title: e.target.value })} className="w-full border rounded-md px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Total Slots</label>
                                <input type="number" value={editingScheme?.totalSlots || 0} onChange={e => setEditingScheme({ ...editingScheme, totalSlots: e.target.value })} className="w-full border rounded-md px-3 py-2" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-600 mb-1">Description</label>
                                <textarea value={editingScheme?.description || ''} onChange={e => setEditingScheme({ ...editingScheme, description: e.target.value })} className="w-full border rounded-md px-3 py-2" rows={3} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                                <input type="date" value={editingScheme?.startDate || ''} onChange={e => setEditingScheme({ ...editingScheme, startDate: e.target.value })} className="w-full border rounded-md px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                                <input type="date" value={editingScheme?.endDate || ''} onChange={e => setEditingScheme({ ...editingScheme, endDate: e.target.value })} className="w-full border rounded-md px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Application Deadline</label>
                                <input type="date" value={editingScheme?.applicationDeadline || ''} onChange={e => setEditingScheme({ ...editingScheme, applicationDeadline: e.target.value })} className="w-full border rounded-md px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Status</label>
                                <select value={editingScheme?.status || 'active'} onChange={e => setEditingScheme({ ...editingScheme, status: e.target.value })} className="w-full border rounded-md px-3 py-2">
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-md border">Cancel</button>
                            <button onClick={saveEdit} disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 text-white">{loading ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics Modal */}
            {showAnalytics && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h4 className="text-lg font-semibold">Schemes Analytics</h4>
                            <button onClick={() => setShowAnalytics(false)} className="px-3 py-1 rounded-md border hover:bg-gray-50">Close</button>
                        </div>

                        {/* KPI cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <div className="text-xs uppercase tracking-wide text-gray-500">Total Schemes</div>
                                <div className="text-2xl font-bold">{analytics.total}</div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="text-xs uppercase tracking-wide text-green-700">Active</div>
                                <div className="text-2xl font-bold text-green-700">{analytics.active}</div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="text-xs uppercase tracking-wide text-blue-700">Completed</div>
                                <div className="text-2xl font-bold text-blue-700">{analytics.completed}</div>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="text-xs uppercase tracking-wide text-purple-700">Total Applications</div>
                                <div className="text-2xl font-bold text-purple-700">{analytics.totalApplications}</div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Donut chart: Active vs Completed */}
                            <div className="p-4 border rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="font-medium">Status Breakdown</div>
                                    <div className="text-xs text-gray-500">Active vs Completed</div>
                                </div>
                                {(() => {
                                    const active = analytics.active;
                                    const completed = analytics.completed;
                                    const total = Math.max(active + completed, 1);
                                    const r = 90; const c = 2 * Math.PI * r;
                                    let activePct = total ? active / total : 0;
                                    let completedPct = total ? completed / total : 0;
                                    // clamp to [0,1] to avoid floating rounding artefacts
                                    activePct = Math.min(1, Math.max(0, activePct));
                                    completedPct = Math.min(1, Math.max(0, completedPct));
                                    const activeFull = activePct >= 0.9995; // treat as 100%
                                    const completedVisible = completedPct >= 0.001;
                                    return (
                                        <div className="flex items-center space-x-6">
                                            <svg width="220" height="220" viewBox="0 0 220 220">
                                                <circle cx="110" cy="110" r={r} stroke="#e5e7eb" strokeWidth="22" fill="none" />
                                                <circle cx="110" cy="110" r={r} stroke="#10b981" strokeWidth="22" fill="none" strokeDasharray={activeFull ? `${c} 0` : `${c * activePct} ${c}`} strokeDashoffset={c * 0.25} strokeLinecap="round" />
                                                {completedVisible && (
                                                    <circle cx="110" cy="110" r={r} stroke="#3b82f6" strokeWidth="22" fill="none" strokeDasharray={`${c * completedPct} ${c}`} strokeDashoffset={c * (0.25 + activePct)} strokeLinecap="round" />
                                                )}
                                                <text x="110" y="115" textAnchor="middle" className="fill-gray-800" style={{fontSize: '28px', fontWeight: 700}}>{Math.round(activePct * 100)}%</text>
                                            </svg>
                                            <div>
                                                <div className="flex items-center mb-2"><span className="w-3 h-3 rounded-sm bg-green-500 mr-2"></span>Active: <span className="ml-2 font-medium">{active}</span></div>
                                                <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-blue-500 mr-2"></span>Completed: <span className="ml-2 font-medium">{completed}</span></div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Bar chart: Applications per scheme */}
                            <div className="p-4 border rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="font-medium">Applications per Scheme (Top 7)</div>
                                    <div className="text-xs text-gray-500">Counts</div>
                                </div>
                                {(() => {
                                    const labels = analytics.perScheme.map(p => p.title);
                                    const values = analytics.perScheme.map(p => p.count);
                                    const max = Math.max(...values, 1);
                                    return (
                                        <div className="space-y-2">
                                            {labels.map((label, i) => (
                                                <div key={i} className="flex items-center space-x-3">
                                                    <div className="w-40 truncate text-sm" title={label}>{label}</div>
                                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${i % 2 === 0 ? 'bg-indigo-500' : 'bg-fuchsia-500'}`} style={{ width: `${(values[i] / max) * 100}%` }}></div>
                                                    </div>
                                                    <div className="w-8 text-right text-sm font-medium">{values[i]}</div>
                                                </div>
                                            ))}
                                            {labels.length === 0 && (
                                                <div className="text-sm text-gray-500">No applications yet.</div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouncillorDashboard;