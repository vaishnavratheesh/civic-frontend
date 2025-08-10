import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Complaint, ComplaintStatus, WelfareScheme, ApplicationStatus, WelfareApplication } from '../../types';
import { STATUS_COLORS } from '../../constants';
import SubmitGrievance from './SubmitGrievance';
import { useAuth } from '../../hooks/useAuth';
import { askAboutWard } from '../../services/geminiService';
import Spinner from '../../components/Spinner';
import CommunityGrievances from './CommunityGrievances';
import WelfareApplicationForm from './WelfareApplicationForm';
import { useNavigate } from 'react-router-dom';

// Mock Data
const mockMyComplaints: Complaint[] = [
    { id: 'comp-1', userId: 'user-citizen', userName: 'John Doe', ward: 3, imageURL: 'https://picsum.photos/400/300?random=1', issueType: 'Road Repair', description: 'Large pothole causing traffic issues.', location: { lat: 12.9716, lng: 77.5946 }, priorityScore: 4, status: ComplaintStatus.IN_PROGRESS, assignedTo: 'officer-1', officerName: 'Officer Smith', source: 'user', createdAt: '2023-10-26T10:00:00Z' },
    { id: 'comp-2', userId: 'user-citizen', userName: 'John Doe', ward: 3, imageURL: 'https://picsum.photos/400/300?random=2', issueType: 'Streetlight Outage', description: 'Streetlight on 2nd street has been out for a week.', location: { lat: 12.9716, lng: 77.5946 }, priorityScore: 3, status: ComplaintStatus.RESOLVED, assignedTo: 'officer-2', officerName: 'Officer Jones', source: 'user', createdAt: '2023-10-20T14:30:00Z', resolvedAt: '2023-10-25T16:00:00Z' },
];

const mockCommunityComplaints: Complaint[] = [
    { id: 'comm-1', userId: 'user-citizen-2', userName: 'Jane Smith', ward: 3, imageURL: 'https://picsum.photos/400/300?random=10', issueType: 'Waste Management', description: 'Overflowing bin at Harmony Park.', location: { lat: 12.9716, lng: 77.5946 }, priorityScore: 3, status: ComplaintStatus.PENDING, source: 'user', createdAt: '2023-10-28T14:00:00Z' },
    { id: 'comm-2', userId: 'user-citizen-3', userName: 'Anil Kumar', ward: 5, imageURL: 'https://picsum.photos/400/300?random=11', issueType: 'Water Leakage', description: 'Constant water leakage near the community hall.', location: { lat: 12.9716, lng: 77.5946 }, priorityScore: 5, status: ComplaintStatus.IN_PROGRESS, assignedTo: 'officer-1', officerName: 'Officer Smith', source: 'user', createdAt: '2023-10-27T09:00:00Z' },
    { id: 'comm-3', userId: 'user-citizen-4', userName: 'Priya Singh', ward: 1, imageURL: 'https://picsum.photos/400/300?random=12', issueType: 'Road Repair', description: 'Pavement is broken outside the school.', location: { lat: 12.9716, lng: 77.5946 }, priorityScore: 4, status: ComplaintStatus.RESOLVED, assignedTo: 'officer-2', officerName: 'Officer Jones', source: 'user', createdAt: '2023-10-25T11:00:00Z', resolvedAt: '2023-10-28T15:00:00Z' },
    { id: 'comm-4', userId: 'user-citizen-5', userName: 'Mike Ross', ward: 2, imageURL: 'https://picsum.photos/400/300?random=13', issueType: 'Public Nuisance', description: 'Loud music from neighbours every night.', location: { lat: 12.9716, lng: 77.5946 }, priorityScore: 2, status: ComplaintStatus.REJECTED, source: 'user', createdAt: '2023-10-29T23:00:00Z' },
];

const mockWelfareSchemes: WelfareScheme[] = [
    { id: 'sch-1', title: 'Educational Scholarship for Girls', description: 'A scholarship program to support the education of girls from low-income families.', postedBy: 'Dept. of Social Welfare', ward: 0, totalItems: 100, createdAt: '2023-09-01T00:00:00Z' },
    { id: 'sch-2', title: 'Senior Citizen Health Subsidy', description: 'Provides subsidies for essential health checkups and medicines for senior citizens.', postedBy: 'Health Department', ward: 0, totalItems: 500, createdAt: '2023-09-15T00:00:00Z' },
];

const mockMyApplications: WelfareApplication[] = [
    { id: 'app-3', schemeId: 'sch-1', schemeTitle: 'Educational Scholarship for Girls', userId: 'user-citizen', userName: 'John Doe', address: '123, Harmony Lane, Metropolis', phoneNumber: '9876543210', rationCardNumber: 'RC12345678', aadharNumber: '1234-5678-9012', ward: 3, reason: 'Requesting financial support for my daughter\'s college education.', isHandicapped: false, isSingleWoman: false, familyIncome: 150000, dependents: 4, status: ApplicationStatus.APPROVED, createdAt: '2023-10-15T09:00:00Z', score: 85, justification: 'High need due to income and dependents.' },
];

const tabs = [
    { id: 'my-ward', name: 'My Ward', icon: 'fa-map-marker-alt' },
    { id: 'my-grievances', name: 'My Grievances', icon: 'fa-bullhorn' },
    { id: 'community-grievances', name: 'Community Grievances', icon: 'fa-users' },
    { id: 'welfare-schemes', name: 'Welfare Schemes', icon: 'fa-hands-helping' },
];

const CitizenDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('my-ward');
    const [myComplaints, setMyComplaints] = useState<Complaint[]>(mockMyComplaints);
    const [myApplications, setMyApplications] = useState<WelfareApplication[]>(mockMyApplications);
    const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState<WelfareScheme | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Sidebar navigation items
    const sidebarItems = [
        { id: 'my-ward', name: 'My Ward', icon: 'fa-map-marker-alt', path: '/citizen' },
        { id: 'my-grievances', name: 'My Grievances', icon: 'fa-bullhorn', path: '/citizen' },
        { id: 'community-grievances', name: 'Community Grievances', icon: 'fa-users', path: '/citizen' },
        { id: 'welfare-schemes', name: 'Welfare Schemes', icon: 'fa-hands-helping', path: '/citizen' },
        { id: 'edit-profile', name: 'Edit Profile', icon: 'fa-user-edit', path: '/citizen/edit-profile' },
        { id: 'help', name: 'Help', icon: 'fa-question-circle', path: '/citizen/help' },
    ];

    const handleSidebarNavigation = (itemId: string) => {
        if (itemId === 'help') {
            navigate('/citizen/help');
        } else if (itemId === 'edit-profile') {
            navigate('/citizen/edit-profile');
        } else {
            setActiveTab(itemId);
        }
    };

    const handleMenuClick = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleSidebarClose = () => {
        setIsSidebarOpen(false);
    };
    
    const handleGrievanceSubmitted = (newComplaint: Complaint) => {
        setMyComplaints(prev => [newComplaint, ...prev]);
    };
    
    const handleApplyClick = (scheme: WelfareScheme) => {
        setSelectedScheme(scheme);
        setIsApplicationFormOpen(true);
    };

    const handleApplicationSubmitted = (newApplication: WelfareApplication) => {
        setMyApplications(prev => [newApplication, ...prev]);
        setIsApplicationFormOpen(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'my-ward':
                return <MyWardInfo />;
            case 'my-grievances':
                return <MyGrievancesTab complaints={myComplaints} onGrievanceSubmitted={handleGrievanceSubmitted} />;
            case 'community-grievances':
                return <CommunityGrievances complaints={[...mockMyComplaints, ...mockCommunityComplaints]} />;
            case 'welfare-schemes':
                return <WelfareSchemesTab schemes={mockWelfareSchemes} applications={myApplications} onApplyClick={handleApplyClick} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Sidebar */}
            <Sidebar 
                items={sidebarItems} 
                onItemClick={handleSidebarNavigation} 
                activeTab={activeTab}
                isOpen={isSidebarOpen}
                onClose={handleSidebarClose}
            />

            {/* Main Content */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
                {/* Navbar */}
                <Navbar onMenuClick={handleMenuClick} />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-2xl p-6 text-white shadow-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
                                    <p className="text-blue-100 text-lg">Ward {user?.ward} • Erumeli Panchayath</p>
                                    <p className="text-blue-200 text-sm mt-2">Access government services and civic engagement tools</p>
                                </div>
                                <div className="hidden md:flex items-center space-x-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-yellow-400">{myComplaints.length}</div>
                                        <div className="text-blue-200 text-sm">My Grievances</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-yellow-400">{myApplications.length}</div>
                                        <div className="text-blue-200 text-sm">Applications</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <nav className="flex space-x-1 p-2 bg-gray-50">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm flex items-center justify-center space-x-3 transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg'
                                            : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
                                    }`}
                                    aria-current={activeTab === tab.id ? 'page' : undefined}
                                >
                                    <i className={`fas ${tab.icon} text-lg`}></i>
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="animate-fade-in">{renderContent()}</div>
                </main>
            </div>

            {isApplicationFormOpen && selectedScheme && (
                <WelfareApplicationForm
                    scheme={selectedScheme}
                    onClose={() => setIsApplicationFormOpen(false)}
                    onSubmit={handleApplicationSubmitted}
                />
            )}
        </div>
    );
};

const MyWardInfo: React.FC = () => {
    const { user } = useAuth();
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAsk = async () => {
        if (!question.trim() || !user) return;
        setIsLoading(true);
        setError('');
        setAnswer('');
        try {
            const result = await askAboutWard(question, user.ward);
            setAnswer(result);
        } catch (e: any) {
            setError('Sorry, something went wrong. Please try again.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Ward Overview Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-8 py-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">Ward {user?.ward} Information</h3>
                    <p className="text-blue-100">Official government data and services for your area</p>
                </div>
                <div className="p-8">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <i className="fas fa-users text-white text-xl"></i>
                            </div>
                            <h4 className="font-bold text-blue-900 mb-2">Population</h4>
                            <p className="text-2xl font-bold text-blue-800">12,450</p>
                            <p className="text-blue-600 text-sm">Registered Citizens</p>
                        </div>
                        
                        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <i className="fas fa-check-circle text-white text-xl"></i>
                            </div>
                            <h4 className="font-bold text-green-900 mb-2">Active Issues</h4>
                            <p className="text-2xl font-bold text-green-800">23</p>
                            <p className="text-green-600 text-sm">Under Resolution</p>
                        </div>
                        
                        <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <i className="fas fa-star text-white text-xl"></i>
                            </div>
                            <h4 className="font-bold text-yellow-900 mb-2">Rating</h4>
                            <p className="text-2xl font-bold text-yellow-800">4.2/5</p>
                            <p className="text-yellow-600 text-sm">Citizen Satisfaction</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Councillor Information */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">Your Ward Representative</h3>
                    <p className="text-indigo-100">Direct contact with your elected official</p>
                </div>
                <div className="p-8">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg">
                            <i className="fas fa-user-tie text-white text-2xl"></i>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-800 mb-2">Councillor Jane Doe</h4>
                            <p className="text-gray-600 mb-3">Elected Representative for Ward {user?.ward}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-3">
                                    <i className="fas fa-map-marker-alt text-indigo-600"></i>
                                    <span className="text-gray-700">Office: Room 201, City Hall</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <i className="fas fa-phone text-indigo-600"></i>
                                    <span className="text-gray-700">+91 98765 43210</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <i className="fas fa-envelope text-indigo-600"></i>
                                    <span className="text-gray-700">councillor.ward{user?.ward}@gov.in</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <i className="fas fa-clock text-indigo-600"></i>
                                    <span className="text-gray-700">Mon-Fri: 9 AM - 5 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-800 to-purple-900 px-8 py-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">Government AI Assistant</h3>
                    <p className="text-purple-100">Get instant answers about your ward and government services</p>
                </div>
                <div className="p-8">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g., When is the next garbage collection? What are the current welfare schemes?"
                            className="flex-grow p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            aria-labelledby="ask-ai-label"
                        />
                        <button 
                            onClick={handleAsk} 
                            disabled={isLoading || !question.trim()} 
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 flex items-center justify-center"
                        >
                            {isLoading ? <Spinner size="sm" /> : (
                                <>
                                    <i className="fas fa-robot mr-2"></i>
                                    Ask AI
                                </>
                            )}
                        </button>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-4" role="alert">
                            <div className="flex items-center">
                                <i className="fas fa-exclamation-triangle mr-3"></i>
                                <span className="font-medium">{error}</span>
                            </div>
                        </div>
                    )}
                    
                    {isLoading && (
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 text-center">
                            <Spinner message="Processing your request..." />
                        </div>
                    )}
                    
                    {answer && (
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6" aria-live="polite">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center mr-3">
                                    <i className="fas fa-robot text-white"></i>
                                </div>
                                <h4 className="font-bold text-purple-900">Government AI Response</h4>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{answer}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MyGrievancesTab: React.FC<{ complaints: Complaint[], onGrievanceSubmitted: (complaint: Complaint) => void }> = ({ complaints, onGrievanceSubmitted }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-800 to-red-900 px-8 py-6 text-white">
                        <h3 className="text-2xl font-bold mb-2">My Submitted Grievances</h3>
                        <p className="text-red-100">Track the status of your civic issue reports</p>
                    </div>
                    <div className="p-8">
                        {complaints.length > 0 ? (
                            <div className="space-y-6">
                                {complaints.map(c => (
                                    <div key={c.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
                                                        <i className="fas fa-exclamation-triangle text-white"></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-gray-800">{c.issueType}</p>
                                                        <p className="text-sm text-gray-600">Priority Score: {c.priorityScore}/5</p>
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 mb-3 leading-relaxed">{c.description}</p>
                                                <div className="flex items-center space-x-6 text-sm text-gray-500">
                                                    <span className="flex items-center">
                                                        <i className="fas fa-calendar mr-2"></i>
                                                        {new Date(c.createdAt).toLocaleDateString()}
                                                    </span>
                                                    {c.assignedTo && (
                                                        <span className="flex items-center">
                                                            <i className="fas fa-user-tie mr-2"></i>
                                                            {c.officerName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <span className={`px-4 py-2 text-sm font-semibold rounded-xl ${STATUS_COLORS[c.status]} shadow-lg`}>
                                                    {c.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <i className="fas fa-inbox text-3xl text-gray-400"></i>
                                </div>
                                <h4 className="text-xl font-bold text-gray-700 mb-2">No Grievances Submitted</h4>
                                <p className="text-gray-500 mb-6">You haven't submitted any civic issues yet.</p>
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                                    <p className="text-blue-800 text-sm">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        Submit your first grievance using the form on the right to get started.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div>
                <SubmitGrievance onGrievanceSubmitted={onGrievanceSubmitted} />
            </div>
        </div>
    );
};

const WelfareSchemesTab: React.FC<{ schemes: WelfareScheme[], applications: WelfareApplication[], onApplyClick: (scheme: WelfareScheme) => void }> = ({ schemes, applications, onApplyClick }) => (
    <div className="space-y-8 animate-fade-in">
        {/* Available Schemes */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-800 to-green-900 px-8 py-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Available Welfare Schemes</h3>
                <p className="text-green-100">Government assistance programs for eligible citizens</p>
            </div>
            <div className="p-8">
                {schemes.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {schemes.map(s => (
                            <div key={s.id} className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                                        <i className="fas fa-hands-helping text-white text-xl"></i>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">
                                            Active
                                        </span>
                                    </div>
                                </div>
                                <h4 className="font-bold text-xl text-green-900 mb-3">{s.title}</h4>
                                <p className="text-green-800 mb-4 leading-relaxed">{s.description}</p>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-green-700">
                                        <i className="fas fa-building mr-1"></i>
                                        {s.postedBy}
                                    </span>
                                    <span className="text-sm text-green-700">
                                        <i className="fas fa-users mr-1"></i>
                                        {s.totalItems} slots available
                                    </span>
                                </div>
                                <button 
                                    onClick={() => onApplyClick(s)} 
                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg shadow-green-500/25 flex items-center justify-center"
                                >
                                    <i className="fas fa-edit mr-2"></i>
                                    Apply Now
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-hands-helping text-3xl text-gray-400"></i>
                        </div>
                        <h4 className="text-xl font-bold text-gray-700 mb-2">No Schemes Available</h4>
                        <p className="text-gray-500">Currently there are no welfare schemes open for applications.</p>
                    </div>
                )}
            </div>
        </div>

        {/* My Applications */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-8 py-6 text-white">
                <h3 className="text-2xl font-bold mb-2">My Applications</h3>
                <p className="text-blue-100">Track your welfare scheme applications</p>
            </div>
            <div className="p-8">
                {applications.length > 0 ? (
                    <div className="space-y-6">
                        {applications.map(app => (
                            <div key={app.id} className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                                                <i className="fas fa-file-alt text-white"></i>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-800">{app.schemeTitle}</h4>
                                                <p className="text-sm text-gray-600">Application Score: {app.score}/100</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                                            <div>
                                                <span className="font-medium">Applied:</span> {new Date(app.createdAt).toLocaleDateString()}
                                            </div>
                                            <div>
                                                <span className="font-medium">Family Income:</span> ₹{app.familyIncome.toLocaleString()}
                                            </div>
                                            <div>
                                                <span className="font-medium">Dependents:</span> {app.dependents}
                                            </div>
                                            <div>
                                                <span className="font-medium">Address:</span> {app.address}
                                            </div>
                                        </div>
                                        {app.justification && (
                                            <p className="text-gray-700 text-sm italic">
                                                <span className="font-medium">Justification:</span> {app.justification}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className={`px-4 py-2 text-sm font-semibold rounded-xl ${STATUS_COLORS[app.status]} shadow-lg`}>
                                            {app.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-file-alt text-3xl text-gray-400"></i>
                        </div>
                        <h4 className="text-xl font-bold text-gray-700 mb-2">No Applications Submitted</h4>
                        <p className="text-gray-500 mb-6">You haven't applied for any welfare schemes yet.</p>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                            <p className="text-blue-800 text-sm">
                                <i className="fas fa-info-circle mr-2"></i>
                                Browse available schemes above and apply for those you're eligible for.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);

export default CitizenDashboard;