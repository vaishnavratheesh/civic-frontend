
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Complaint, ComplaintStatus, WelfareApplication, ApplicationStatus, WelfareScheme } from '../../types';
import { STATUS_COLORS } from '../../constants';
import { scoreWelfareApplication } from '../../services/geminiService';
import Spinner from '../../components/Spinner';

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
    const [activeTab, setActiveTab] = useState<Tab>('complaints');

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <main className="container mx-auto p-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Councillor Dashboard (Ward 5)</h2>
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button onClick={() => setActiveTab('complaints')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'complaints' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            Ward Complaints
                        </button>
                        <button onClick={() => setActiveTab('welfare')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'welfare' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            Welfare Applications
                        </button>
                    </nav>
                </div>
                {activeTab === 'complaints' ? <WardComplaints /> : <WelfareQueue />}
            </main>
        </div>
    );
};

const WardComplaints: React.FC = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-bold text-xl mb-4">Pending Complaints in Your Ward</h3>
         <ul className="divide-y divide-gray-200">
            {mockWardComplaints.map(c => (
                <li key={c.id} className="py-4 flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-blue-700">{c.issueType} <span className="text-sm font-normal text-gray-500">(Priority: {c.priorityScore})</span></p>
                        <p className="text-gray-700">{c.description}</p>
                    </div>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Assign Officer</button>
                </li>
            ))}
        </ul>
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
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-xl mb-4">Welfare Application Queue</h3>
            <ul className="divide-y divide-gray-200">
                {sortedApplications.map(app => (
                    <li key={app.id} className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-lg text-gray-800">{app.userName} - <span className="font-semibold text-blue-600">{app.schemeTitle}</span></p>
                                <p className="text-gray-600 mt-1 italic">"{app.reason}"</p>
                                <p className="text-sm text-gray-500 mt-2">Income: ₹{app.familyIncome.toLocaleString()}/yr | Dependents: {app.dependents}</p>
                            </div>
                            <div className="text-right flex-shrink-0 w-48">
                                {app.score !== undefined ? (
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">AI Score</p>
                                        <p className="text-3xl font-bold text-green-600">{app.score}</p>
                                    </div>
                                ) : (
                                    <button onClick={() => handleGetScore(app.id)} disabled={loadingScores[app.id]} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-indigo-300">
                                        {loadingScores[app.id] ? <Spinner size="sm" /> : 'Get AI Score'}
                                    </button>
                                )}
                            </div>
                        </div>
                        {app.justification && <p className="text-sm text-indigo-700 bg-indigo-50 p-2 mt-2 rounded-md"><i className="fas fa-lightbulb mr-2"></i>{app.justification}</p>}
                        <div className="mt-3 flex space-x-2">
                           <button className="bg-green-100 hover:bg-green-200 text-green-800 font-bold py-1 px-3 rounded-lg">Approve</button>
                           <button className="bg-red-100 hover:bg-red-200 text-red-800 font-bold py-1 px-3 rounded-lg">Reject</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CouncillorDashboard;