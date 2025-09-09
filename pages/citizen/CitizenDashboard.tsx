import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Complaint, ComplaintStatus, WelfareScheme, ApplicationStatus, WelfareApplication } from '../../types';
import { STATUS_COLORS } from '../../constants';
import SubmitGrievance from './SubmitGrievance';
import { useAuth } from '../../hooks/useAuth';
import { askAboutWard } from '../../services/geminiService';
import Spinner from '../../components/Spinner';
import CommunityGrievances from './CommunityGrievances';
import WelfareApplicationForm from '../../components/WelfareApplicationForm';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../src/config/config';
import { notificationService } from '../../services/notificationService';

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
    const [myApplications, setMyApplications] = useState<WelfareApplication[]>([]);
    const [availableSchemes, setAvailableSchemes] = useState<WelfareScheme[]>([]);
    const [schemesLoading, setSchemesLoading] = useState(false);
    const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState<WelfareScheme | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Fetch user's applications
    const fetchMyApplications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3002/api/welfare/applications/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                const mapped = (data.applications || []).map((a: any) => ({
                    id: a._id,
                    schemeId: typeof a.schemeId === 'object' ? (a.schemeId._id || a.schemeId.id) : a.schemeId,
                    schemeTitle: a.schemeTitle,
                    userId: a.userId,
                    userName: a.userName,
                    address: a.personalDetails?.address || '',
                    phoneNumber: a.personalDetails?.phoneNumber || '',
                    rationCardNumber: a.personalDetails?.rationCardNumber || '',
                    aadharNumber: a.personalDetails?.aadharNumber || '',
                    ward: a.userWard,
                    reason: a.reason,
                    isHandicapped: a.personalDetails?.isHandicapped || false,
                    isSingleWoman: a.personalDetails?.isSingleWoman || false,
                    familyIncome: a.personalDetails?.familyIncome || 0,
                    dependents: a.personalDetails?.dependents || 0,
                    status: (a.status || 'pending') as ApplicationStatus,
                    createdAt: a.appliedAt,
                    score: a.score,
                    justification: a.justification,
                }));
                setMyApplications(mapped);
            } else {
                console.error('Failed to fetch applications:', response.statusText);
                setMyApplications([]);
            }
        } catch (err) {
            console.error('Error fetching applications:', err);
            setMyApplications([]);
        }
    };

    useEffect(() => {
        fetchMyApplications();
    }, []);

    // Fetch available welfare schemes for the citizen's ward
    useEffect(() => {
        const fetchAvailableSchemes = async () => {
            if (!user?.ward) return;
            
            setSchemesLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3002/api/welfare/schemes/citizens/${user.ward}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched schemes for citizen:', data);
                    console.log('Number of schemes received:', data.schemes?.length || 0);
                    
                    // Map the schemes to include id field
                    const mappedSchemes = data.schemes?.map((s: any) => ({
                        id: s._id,
                        title: s.title,
                        description: s.description,
                        ward: s.ward,
                        scope: s.scope,
                        status: s.status,
                        approved: s.approved,
                        applicationDeadline: s.applicationDeadline,
                        totalSlots: s.totalSlots,
                        availableSlots: s.availableSlots,
                        creatorName: s.creatorName,
                        category: s.category,
                        eligibilityCriteria: s.eligibilityCriteria,
                        benefits: s.benefits,
                        documentsRequired: s.documentsRequired,
                        startDate: s.startDate,
                        endDate: s.endDate,
                        createdAt: s.createdAt
                    })) || [];
                    
                    console.log('Mapped schemes:', mappedSchemes);
                    setAvailableSchemes(mappedSchemes);
                    
                    // Check for new schemes and create notifications
                    await notificationService.checkForNewSchemes(user.id, user.ward);
                } else {
                    console.error('Failed to fetch schemes:', response.statusText);
                    setAvailableSchemes([]);
                }
            } catch (error) {
                console.error('Error fetching schemes:', error);
                setAvailableSchemes([]);
            } finally {
                setSchemesLoading(false);
            }
        };

        fetchAvailableSchemes();
    }, [user?.ward]);

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
    
    const hasAppliedForScheme = (schemeId: string) => {
        return myApplications.some(app => app.schemeId === schemeId);
    };

    const handleApplyClick = (scheme: WelfareScheme) => {
        if (hasAppliedForScheme(scheme.id)) {
            // Already applied: keep UI silent and disable button elsewhere
            return;
        }
        setSelectedScheme(scheme);
        setIsApplicationFormOpen(true);
    };

    const handleApplicationSubmitted = () => {
        // Refresh applications list
        fetchMyApplications();
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
                return <WelfareSchemesTab schemes={availableSchemes} applications={myApplications} onApplyClick={handleApplyClick} loading={schemesLoading} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
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
                <main className="flex-1 overflow-y-auto p-6">
                    {/* Header Section */}
                    <div className="mb-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Welcome, <span className="font-semibold">{user?.name}</span> • Ward {user?.ward} • Erumeli Panchayath
                                </div>
                                <div className="hidden md:flex items-center space-x-6 text-sm text-gray-700">
                                    <div className="text-center">
                                        <div className="text-base font-semibold">{myComplaints.length}</div>
                                        <div>My Grievances</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-base font-semibold">{myApplications.length}</div>
                                        <div>Applications</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <nav className="flex space-x-1 p-1 bg-gray-50">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-2 px-4 rounded-md font-medium text-sm flex items-center justify-center space-x-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-gray-200 text-gray-900'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                    aria-current={activeTab === tab.id ? 'page' : undefined}
                                >
                                    <i className={`fas ${tab.icon} text-base`}></i>
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
                    schemeId={selectedScheme.id}
                    schemeTitle={selectedScheme.title}
                    onClose={() => setIsApplicationFormOpen(false)}
                    onSuccess={handleApplicationSubmitted}
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
    const [wardPopulation, setWardPopulation] = useState<number | null>(null);
    const [councillor, setCouncillor] = useState<{ name: string; email?: string; contactNumber?: string; address?: string; profilePicture?: string } | null>(null);

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

    useEffect(() => {
        const fetchWardStats = async () => {
            if (!user?.ward) return;
            try {
                const res = await fetch(`${API_ENDPOINTS.WARD_STATS}/${user.ward}/stats`);
                const data = await res.json();
                if (res.ok) {
                    const population = (data && data.stats && typeof data.stats.totalUsers === 'number')
                        ? data.stats.totalUsers
                        : 0;
                    setWardPopulation(population);
                } else setWardPopulation(0);
            } catch (e) {
                setWardPopulation(0);
                console.error('Failed to fetch ward stats', e);
            }
        };
        const fetchCouncillor = async () => {
            if (!user?.ward) return;
            try {
                const res = await fetch(`${API_ENDPOINTS.WARD_COUNCILLOR}/${user.ward}/councillor`);
                const data = await res.json();
                if (res.ok && data?.success && data?.councillor) {
                    setCouncillor(data.councillor);
                } else {
                    setCouncillor(null);
                }
            } catch (e) {
                console.error('Failed to fetch councillor', e);
                setCouncillor(null);
            }
        };
        fetchWardStats();
        fetchCouncillor();
    }, [user?.ward]);

    return (
        <div className="space-y-8">
            {/* Ward Overview Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Ward {user?.ward} Information</h3>
                    <p className="text-gray-600 text-sm">Official government data and services</p>
                </div>
                <div className="p-5">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-md border border-gray-200 bg-gray-50">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i className="fas fa-users text-gray-700"></i>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">Population</h4>
                            <p className="text-lg font-semibold text-gray-800">{wardPopulation !== null ? wardPopulation.toLocaleString() : '0'}</p>
                            <p className="text-gray-600 text-xs">Registered Users</p>
                        </div>
                        <div className="text-center p-4 rounded-md border border-gray-200 bg-gray-50">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i className="fas fa-check-circle text-gray-700"></i>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">Active Issues</h4>
                            <p className="text-lg font-semibold text-gray-800">23</p>
                            <p className="text-gray-600 text-xs">Under Resolution</p>
                        </div>
                        <div className="text-center p-4 rounded-md border border-gray-200 bg-gray-50">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i className="fas fa-star text-gray-700"></i>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">Rating</h4>
                            <p className="text-lg font-semibold text-gray-800">4.2/5</p>
                            <p className="text-gray-600 text-xs">Citizen Satisfaction</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Councillor Information */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Your Ward Representative</h3>
                    <p className="text-gray-600 text-sm">Direct contact with your elected official</p>
                </div>
                <div className="p-5">
                    {councillor ? (
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                                {councillor.profilePicture ? (
                                    <img src={councillor.profilePicture} alt={councillor.name} className="w-full h-full object-cover" />
                                ) : (
                                    <i className="fas fa-user-tie text-gray-700"></i>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-base font-semibold text-gray-900">{councillor.name}</h4>
                                <p className="text-gray-600 text-sm mb-2">Ward {user?.ward}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <i className="fas fa-map-marker-alt text-gray-600"></i>
                                        <span>{councillor.address || 'Office details unavailable'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <i className="fas fa-phone text-gray-600"></i>
                                        <span>{councillor.contactNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <i className="fas fa-envelope text-gray-600"></i>
                                        <span>{councillor.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <i className="fas fa-clock text-gray-600"></i>
                                        <span>Mon-Fri: 9 AM - 5 PM</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-600">Councillor information is not available for your ward.</div>
                    )}
                </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Government AI Assistant</h3>
                    <p className="text-gray-600 text-sm">Get answers about your ward and services</p>
                </div>
                <div className="p-5">
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g., When is the next garbage collection? What are the current welfare schemes?"
                            className="flex-grow p-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                            aria-labelledby="ask-ai-label"
                        />
                        <button 
                            onClick={handleAsk} 
                            disabled={isLoading || !question.trim()} 
                            className="px-4 py-2 bg-gray-800 text-white font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-3" role="alert">
                            <div className="flex items-center">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                <span className="font-medium">{error}</span>
                            </div>
                        </div>
                    )}
                    
                    {isLoading && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
                            <Spinner message="Processing your request..." />
                        </div>
                    )}
                    
                    {answer && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4" aria-live="polite">
                            <div className="flex items-center mb-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                                    <i className="fas fa-robot text-gray-700"></i>
                                </div>
                                <h4 className="font-semibold text-gray-900">Government AI Response</h4>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{answer}</p>
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

const WelfareSchemesTab: React.FC<{ schemes: WelfareScheme[], applications: WelfareApplication[], onApplyClick: (scheme: WelfareScheme) => void, loading?: boolean }> = ({ schemes, applications, onApplyClick, loading = false }) => (
    <div className="space-y-6 animate-fade-in">
        {/* Available Schemes */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Available Welfare Schemes</h3>
                <p className="text-gray-600 text-sm">Government assistance programs for eligible citizens</p>
            </div>
            <div className="p-5">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center">
                            <Spinner size="lg" />
                            <span className="ml-3 text-gray-600">Loading available schemes...</span>
                        </div>
                    </div>
                ) : schemes.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {schemes.map(s => (
                            <div key={s.id} className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 text-gray-800">
                                        <i className="fas fa-hands-helping text-gray-700"></i>
                                        <h4 className="font-semibold text-gray-900">{s.title}</h4>
                                    </div>
                                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded">Active</span>
                                </div>
                                <p className="text-gray-700 mb-2 text-sm">{s.description}</p>
                                <div className="flex items-center justify-between mb-3 text-sm text-gray-700">
                                    <span>
                                        <i className="fas fa-building mr-1"></i>
                                        {s.creatorName}
                                    </span>
                                    <span>
                                        <i className="fas fa-users mr-1"></i>
                                        {s.availableSlots} slots
                                    </span>
                                </div>
                                <button 
                                    onClick={() => onApplyClick(s)} 
                                    disabled={applications.some(a => a.schemeId === s.id)}
                                    className={`w-full text-white font-medium py-2.5 px-4 rounded-md flex items-center justify-center ${applications.some(a => a.schemeId === s.id) ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'}`}
                                >
                                    <i className="fas fa-edit mr-2"></i>
                                    {applications.some(a => a.schemeId === s.id) ? 'Already Applied' : 'Apply Now'}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-600 text-sm">No schemes available right now.</div>
                )}
            </div>
        </div>

        {/* My Applications */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">My Applications</h3>
                <p className="text-gray-600 text-sm">Track your applications</p>
            </div>
            <div className="p-5">
                {applications.length > 0 ? (
                    <div className="space-y-4">
                        {applications.map(app => (
                            <div key={app.id} className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <i className="fas fa-file-alt text-gray-700"></i>
                                            </div>
                                            <div>
                                                <h4 className="text-base font-semibold text-gray-900">{app.schemeTitle}</h4>
                                                <p className="text-xs text-gray-600">Score: {app.score}/100</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 mb-2">
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
                                            <p className="text-gray-700 text-sm">
                                                <span className="font-medium">Justification:</span> {app.justification}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className={`px-3 py-1.5 text-xs font-medium rounded-md ${STATUS_COLORS[app.status]}`}>
                                            {app.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-600 text-sm">No applications submitted yet.</div>
                )}
            </div>
        </div>
    </div>
);

export default CitizenDashboard;