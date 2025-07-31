import React, { useState } from 'react';
import Header from '../../components/Header';
import { Complaint, ComplaintStatus, WelfareScheme, ApplicationStatus, WelfareApplication } from '../../types';
import { STATUS_COLORS } from '../../constants';
import SubmitGrievance from './SubmitGrievance';
import { useAuth } from '../../hooks/useAuth';
import { askAboutWard } from '../../services/geminiService';
import Spinner from '../../components/Spinner';
import CommunityGrievances from './CommunityGrievances';
import WelfareApplicationForm from './WelfareApplicationForm';

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
    const [activeTab, setActiveTab] = useState('my-ward');
    const [myComplaints, setMyComplaints] = useState<Complaint[]>(mockMyComplaints);
    const [myApplications, setMyApplications] = useState<WelfareApplication[]>(mockMyApplications);
    const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState<WelfareScheme | null>(null);

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
        <div className="min-h-screen bg-gray-100">
            <Header />
            <main className="container mx-auto p-4 sm:p-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Citizen Dashboard</h2>
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                <i className={`fas ${tab.icon}`}></i>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                <div>{renderContent()}</div>
            </main>
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
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">My Ward Information</h3>
            <p className="text-gray-600 mb-6">Welcome, {user?.name}. You are in Ward {user?.ward}.</p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
                <p className="font-bold">Councillor: Jane Doe</p>
                <p className="text-sm">Office: Room 201, City Hall</p>
            </div>
            <div className="mt-6">
                <h4 id="ask-ai-label" className="font-semibold text-lg text-gray-700 mb-2">Ask about your ward:</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., When is the next garbage collection?"
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        aria-labelledby="ask-ai-label"
                    />
                    <button onClick={handleAsk} disabled={isLoading || !question.trim()} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center justify-center">
                        {isLoading ? <Spinner size="sm" /> : "Ask AI"}
                    </button>
                </div>
                {error && <p className="text-red-500 mt-2" role="alert">{error}</p>}
                {isLoading && (
                    <div className="mt-4 p-4 text-center">
                        <Spinner message="Thinking..." />
                    </div>
                )}
                {answer && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border" aria-live="polite">
                        <p className="font-semibold text-gray-800">Answer:</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{answer}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const MyGrievancesTab: React.FC<{ complaints: Complaint[], onGrievanceSubmitted: (complaint: Complaint) => void }> = ({ complaints, onGrievanceSubmitted }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-2">
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg h-full">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">My Submitted Grievances</h3>
                    {complaints.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {complaints.map(c => (
                                <li key={c.id} className="py-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-blue-600">{c.issueType}</p>
                                            <p className="font-bold text-gray-800">{c.description}</p>
                                            <p className="text-sm text-gray-500 mt-1">Submitted on: {new Date(c.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">You have not submitted any grievances yet.</p>
                    )}
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
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Available Welfare Schemes</h3>
            <ul className="space-y-4">
                {schemes.map(s => (
                    <li key={s.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <h4 className="font-bold text-lg text-blue-700">{s.title}</h4>
                        <p className="text-gray-600 mt-1">{s.description}</p>
                        <p className="text-xs text-gray-400 mt-2">Posted by: {s.postedBy}</p>
                        <button onClick={() => onApplyClick(s)} className="mt-3 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Apply Now</button>
                    </li>
                ))}
            </ul>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">My Applications</h3>
            {applications.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {applications.map(app => (
                        <li key={app.id} className="py-4">
                             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">{app.schemeTitle}</p>
                                    <p className="text-sm text-gray-500 mt-1">Applied on: {new Date(app.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`flex-shrink-0 px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500 py-8">You have not applied for any schemes yet.</p>
            )}
        </div>
    </div>
);

export default CitizenDashboard;