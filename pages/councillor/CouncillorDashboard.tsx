
import React, { useState, useEffect } from 'react';
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
    { id: 'welfare', name: 'Welfare Schemes', icon: 'fa-hands-helping', path: '/councillor/welfare' },
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

type Tab = 'complaints' | 'welfare';

const CouncillorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('complaints');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSidebarNavigation = (itemId: string) => {
        if (itemId === 'edit-profile') {
            // Navigate to edit profile page
            window.location.href = '/councillor/edit-profile';
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
                            </nav>
                        </div>
                        <div className="p-6">
                            {activeTab === 'complaints' ? <WardComplaints /> : <WelfareQueue />}
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
    const [applications, setApplications] = useState<WelfareApplication[]>(mockWelfareApplications.map(app => ({...app, score: undefined})));
    const [loadingScores, setLoadingScores] = useState<{[key: string]: boolean}>({});

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

export default CouncillorDashboard;