
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
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    Councillor Dashboard
                                </h1>
                                <p className="text-gray-600">
                                    Welcome back, {user.name} | Ward {user.ward} | Erumeli Panchayath
                                </p>
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
                                    <p className="text-2xl font-bold text-gray-900">12</p>
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
                                    <p className="text-2xl font-bold text-gray-900">8</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <i className="fas fa-check-circle text-blue-600"></i>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Resolved Issues</p>
                                    <p className="text-2xl font-bold text-gray-900">45</p>
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
                                    <p className="text-2xl font-bold text-gray-900">2,847</p>
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

    // Fetch real applications for councillor's ward from backend
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const token = localStorage.getItem('token');
                const url = user?.ward
                    ? `http://localhost:3002/api/welfare/applications?ward=${user.ward}`
                    : 'http://localhost:3002/api/welfare/applications';
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
    }, [user?.id, user?.ward]);

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

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-gray-800">Welfare Application Queue</h3>
                <div className="flex space-x-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        <i className="fas fa-download mr-2"></i>
                        Export Applications
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        <i className="fas fa-chart-bar mr-2"></i>
                        View Analytics
                    </button>
                </div>
            </div>
            
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
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                            required
                            disabled={!tokenValid}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="e.g., Free Sewing Machines for Women"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Category *
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
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
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe the scheme in detail..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Eligibility Criteria *
                    </label>
                    <textarea
                        name="eligibilityCriteria"
                        value={formData.eligibilityCriteria}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Who is eligible for this scheme?"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Benefits *
                    </label>
                    <textarea
                        name="benefits"
                        value={formData.benefits}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="What benefits will recipients receive?"
                    />
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
                            required
                            min="1"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Number of beneficiaries"
                        />
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
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
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
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
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
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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
                    setSchemes(data.schemes || []);
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
                    const response = await fetch(`http://localhost:3002/api/welfare/applications?schemeId=${scheme.id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        counts[scheme.id] = data.applications?.length || 0;
                    } else {
                        counts[scheme.id] = 0;
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
    const activeSchemes = schemes.filter(scheme => 
        scheme.status === 'active' || scheme.status === 'draft'
    );
    
    const completedSchemes = schemes.filter(scheme => 
        scheme.status === 'completed' || scheme.status === 'expired'
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
        if (window.confirm('Are you sure you want to delete this scheme?')) {
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
        }
    };

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
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        <i className="fas fa-download mr-2"></i>
                        Export Schemes
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
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
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
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
        </div>
    );
};

export default CouncillorDashboard;