
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import VerificationModal from '../../components/VerificationModal';
import { Complaint, ComplaintStatus, WelfareApplication, ApplicationStatus, WelfareScheme } from '../../types';
import io from 'socket.io-client';
// Sabha Meeting Join Button
const SabhaMeetingJoin: React.FC = () => {
    const [meetingUrl, setMeetingUrl] = useState<string|null>(null);
    useEffect(() => {
        let interval: any;
        const fetchMeeting = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.MEETING_PUBLIC);
                const data = await res.json();
                setMeetingUrl(data.url || null);
            } catch {}
        };
        fetchMeeting();
        interval = setInterval(fetchMeeting, 15000); // poll every 15s
        return () => clearInterval(interval);
    }, []);
    if (!meetingUrl) return null;
    return (
        <div className="mb-4">
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <i className="fas fa-video mr-2"></i>Join Sabha Meeting
                </button>
            </a>
        </div>
    );
};
import Swal from 'sweetalert2';
// ML scoring now handled by backend endpoint
import Spinner from '../../components/Spinner';
import { STATUS_COLORS } from '../../constants';
import MapView from '../../components/MapView';
import { API_ENDPOINTS } from '../../src/config/config';


// Councillor sidebar navigation items
const councillorSidebarItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'fa-tachometer-alt', path: '/councillor' },
    { id: 'complaints', name: 'Complaints', icon: 'fa-exclamation-triangle', path: '/councillor/complaints' },
    { id: 'welfare', name: 'Welfare Applications', icon: 'fa-hands-helping', path: '/councillor/welfare' },
    { id: 'verification', name: 'Verification', icon: 'fa-user-check', path: '/councillor/verification' },
    { id: 'view-schemes', name: 'View Schemes', icon: 'fa-list-alt', path: '/councillor/view-schemes' },
    { id: 'add-schemes', name: 'Add Schemes', icon: 'fa-plus-circle', path: '/councillor/add-schemes' },
    { id: 'esabha', name: 'E-Sabha', icon: 'fa-video', path: '/councillor/esabha' },
    { id: 'edit-profile', name: 'Edit Profile', icon: 'fa-user-edit', path: '/councillor/edit-profile' },
];

// No mock data; complaints fetched from backend



type Tab = 'complaints' | 'welfare' | 'verification' | 'view-schemes' | 'add-schemes' | 'announcements' | 'events' | 'esabha' | 'communication';
// E-Sabha Tab
const ESabhaTab: React.FC = () => {
    const [meetingUrl, setMeetingUrl] = useState<string|null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        let interval: any;
        const fetchMeeting = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.MEETING_PUBLIC);
                const data = await res.json();
                setMeetingUrl(data.url || null);
                setLoading(false);
            } catch {
                setLoading(false);
            }
        };
        fetchMeeting();
        interval = setInterval(fetchMeeting, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                    <i className="fas fa-video mr-2 text-purple-600"></i>
                    E-Sabha Meeting
                </h3>
                
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="ml-2 text-gray-600">Checking for active meeting...</span>
                    </div>
                ) : meetingUrl ? (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-center mb-3">
                                <i className="fas fa-check-circle text-green-600 text-2xl mr-2"></i>
                                <span className="text-green-800 font-semibold">Active Sabha Meeting</span>
                            </div>
                            <p className="text-green-700 text-sm mb-4">
                                The President has started an E-Sabha meeting. As a councillor, you can actively participate in the discussion.
                            </p>
                            <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl">
                                    <i className="fas fa-video mr-2"></i>
                                    Join Sabha Meeting
                                </button>
                            </a>
                        </div>
                        <div className="text-xs text-gray-500">
                            <i className="fas fa-info-circle mr-1"></i>
                            Meeting will open in a new tab. Make sure your microphone and camera permissions are enabled.
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-center mb-3">
                                <i className="fas fa-clock text-gray-500 text-2xl mr-2"></i>
                                <span className="text-gray-700 font-semibold">No Active Meeting</span>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">
                                There is currently no active E-Sabha meeting. Please wait for the President to start a meeting.
                            </p>
                            <div className="text-xs text-gray-500">
                                <i className="fas fa-info-circle mr-1"></i>
                                This page will automatically update when a meeting becomes available.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Communication Tab Component
const CommunicationTab: React.FC = () => {
    const { user } = useAuth();
    const FIXED_THREAD_ID = 'councillor-president';
    const [selectedConversation, setSelectedConversation] = useState<string | null>(FIXED_THREAD_ID);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');

    const fetchMessages = async (threadId: string) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_MESSAGES}?threadId=${threadId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMessages(data.items || []);
            }
        } catch (e) {
            console.error('Failed to fetch messages:', e);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        
        try {
            setLoading(true);
            const res = await fetch(API_ENDPOINTS.COUNCILLOR_MESSAGES, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: newMessage,
                    threadId: FIXED_THREAD_ID
                })
            });
            
            if (res.ok) {
                setNewMessage('');
                fetchMessages(FIXED_THREAD_ID);
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to send message');
            }
        } catch (e) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const sendFile = async (file: File) => {
        try {
            const token = localStorage.getItem('token');
            const fd = new FormData();
            fd.append('file', file);
            fd.append('threadId', FIXED_THREAD_ID);
            const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_MESSAGES}/file`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd as any
            });
            if (res.ok) fetchMessages(FIXED_THREAD_ID);
        } catch (e) {
            console.error('Failed to send file', e);
        }
    };

    const markAsRead = async (threadId: string) => {
        try {
            await fetch(API_ENDPOINTS.COUNCILLOR_MARK_READ, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ threadId })
            });
        } catch (e) {
            console.error('Failed to mark as read:', e);
        }
    };

    useEffect(() => {
        // Ensure default selection on mount
        setSelectedConversation(FIXED_THREAD_ID);
    }, [token]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation);
            markAsRead(selectedConversation);
        }
    }, [selectedConversation, token]);

    // Socket.IO for real-time messages (join ward & user rooms) and send delivery/read acks
    useEffect(() => {
        const socket = io('http://localhost:3002', { withCredentials: true });
        try {
            if (user?.ward) socket.emit('join', { ward: user.ward, userId: user.id, role: 'councillor' });
        } catch {}
        
        socket.on('message:new', (data: { message: any, threadId: string, ward: number }) => {
            // delivery ack
            try { socket.emit('message:delivered', { messageId: data.message._id, userId: user?.id }); } catch {}
            // Only append if it belongs to this ward or active thread
            if (data.threadId === FIXED_THREAD_ID || data.ward === user?.ward) {
                setMessages(prev => [...prev, data.message]);
                // read ack if panel is open for this thread
                try { if (selectedConversation === FIXED_THREAD_ID) socket.emit('message:read', { messageId: data.message._id, userId: user?.id }); } catch {}
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [selectedConversation, user?.ward]);

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
                <i className="fas fa-comments mr-2 text-blue-600"></i>
                Communication with President
            </h3>
            
            <div className="flex h-96">
                {/* Conversations List */}
                <div className="w-1/3 border-r border-gray-200 pr-4">
                    <h4 className="font-semibold text-gray-700 mb-3">Conversations</h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        <div
                            onClick={() => setSelectedConversation(FIXED_THREAD_ID)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedConversation === FIXED_THREAD_ID
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium text-sm">President</div>
                                    <div className="text-xs text-gray-600 truncate">
                                        All messages and files in one chat
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 pl-4">
                    {selectedConversation ? (
                        <>
                            <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {messages.map((msg, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex ${
                                                    (msg.senderId && msg.senderId._id) === user?.id ? 'justify-end' : 'justify-start'
                                                }`}
                                            >
                                                <div
                                                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                                        (msg.senderId && msg.senderId._id) === user?.id
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white border border-gray-200'
                                                    }`}
                                                >
                                                    <div className="font-medium text-xs mb-1">
                                                        {(msg.senderId?.name || 'Unknown')} ({msg.senderId?.role || 'user'})
                                                    </div>
                                                    <div>
                                                        {msg.messageType === 'file' ? (
                                                            <a href={`http://localhost:3002${msg.fileUrl}`} target="_blank" rel="noreferrer" className="underline">
                                                                {msg.fileName || msg.message}
                                                            </a>
                                                        ) : (
                                                            msg.message
                                                        )}
                                                    </div>
                                                    <div className="text-xs opacity-75 mt-1">
                                                        {new Date(msg.createdAt).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {messages.length === 0 && (
                                            <div className="text-sm text-gray-500 text-center py-4">
                                                No messages in this conversation
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            <div className="flex gap-2">
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                />
                                <label className="cursor-pointer bg-gray-100 border border-gray-300 px-3 py-2 rounded-lg text-sm text-gray-700">
                                    Attach
                                    <input type="file" className="hidden" onChange={e => e.target.files && e.target.files[0] && sendFile(e.target.files[0])} />
                                </label>
                                <button
                                    onClick={sendMessage}
                                    disabled={loading || !newMessage.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select a conversation to start messaging
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
};

const CouncillorDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('complaints');
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
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                
                const [appsRes, wardRes, schemesRes, appsListRes] = await Promise.all([
                    fetch('http://localhost:3002/api/welfare/applications/stats', {
                        headers
                    }),
                    fetch(`http://localhost:3002/api/wards/${user.ward}/stats`),
                    fetch('http://localhost:3002/api/welfare/schemes', {
                        headers
                    }),
                    fetch(`http://localhost:3002/api/welfare/applications?ward=${user.ward}`, {
                        headers
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
                    welfareSchemes: 0,
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
                    <SabhaMeetingJoin />
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
                                    onClick={() => setActiveTab('verification')} 
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'verification' 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <i className="fas fa-user-check mr-2"></i>
                                    Verification
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
                                <button 
                                    onClick={() => setActiveTab('announcements')} 
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'announcements' 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <i className="fas fa-bullhorn mr-2"></i>
                                    Announcements
                        </button>
                                <button 
                                    onClick={() => setActiveTab('events')} 
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'events' 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <i className="fas fa-calendar-alt mr-2"></i>
                                    Events
                        </button>
                                <button 
                                    onClick={() => setActiveTab('esabha')} 
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'esabha' 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <i className="fas fa-video mr-2"></i>
                                    E-Sabha
                        </button>
                                <button 
                                    onClick={() => setActiveTab('communication')} 
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'communication' 
                                            ? 'border-blue-500 text-blue-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <i className="fas fa-comments mr-2"></i>
                                    Communication
                        </button>
                    </nav>
                </div>
                        <div className="p-6">
                            {activeTab === 'complaints' && <WardComplaints />}
                            {activeTab === 'welfare' && <WelfareQueue />}
                            {activeTab === 'view-schemes' && <ViewSchemes />}
                            {activeTab === 'announcements' && <PresidentAnnouncements />}
                            {activeTab === 'events' && <PresidentEvents />}
                            {activeTab === 'verification' && <VerificationTab />}
                            {activeTab === 'add-schemes' && <AddSchemes />}
                            {activeTab === 'esabha' && <ESabhaTab />}
                            {activeTab === 'communication' && <CommunicationTab />}
                        </div>
                    </div>
            </main>
            </div>
        </div>
    );
};

const PresidentAnnouncements: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [mine, setMine] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string|null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_ENDPOINTS.PRESIDENT_ANNOUNCEMENTS}?audience=councillors`);
                const data = await res.json();
                if (data.success) setItems(data.items || []);
            } catch {}
        })();
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_ANNOUNCEMENTS}/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                if (data.success) setMine(data.items || []);
            } catch {}
        })();
        const socket = io('http://localhost:3002', { withCredentials: true });
        socket.on('announcement:new', async () => {
            try {
                const res = await fetch(`${API_ENDPOINTS.PRESIDENT_ANNOUNCEMENTS}?audience=councillors`);
                const data = await res.json();
                if (data.success) setItems(data.items || []);
                Swal.fire({ toast: true, icon: 'info', title: 'New announcement', position: 'top-end', timer: 3000, showConfirmButton: false });
            } catch {}
        });
        return () => { socket.disconnect(); };
    }, []);
    return (
        <div className="space-y-3">
            <div className="border rounded-md p-4 bg-white">
                <div className="font-semibold mb-2">Post Announcement (Citizens only)</div>
                <div className="grid md:grid-cols-3 gap-2">
                    <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="border rounded px-3 py-2" />
                    <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="border rounded px-3 py-2 md:col-span-2" />
                </div>
                <div className="mt-2 text-right">
                    <button onClick={async()=>{
                        if (!title.trim() || !description.trim()) return;
                        try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(API_ENDPOINTS.COUNCILLOR_ANNOUNCEMENTS, { method:'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title, description }) });
                            const data = await res.json();
                            if (res.ok && data.success) {
                                setTitle(''); setDescription('');
                                setMine(prev => [data.item, ...prev]);
                                Swal.fire({ toast: true, icon:'success', title:'Announcement posted', timer:2000, position:'top-end', showConfirmButton:false });
                            }
                        } catch {}
                    }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Publish</button>
                </div>
            </div>
            {/* My announcements */}
            <div className="border rounded-md p-4 bg-gray-50">
                <div className="font-semibold mb-2">My Announcements</div>
                <div className="space-y-2">
                    {mine.map(m => (
                        <div key={m._id} className="border rounded p-3 bg-white">
                            {editingId === m._id ? (
                                <div className="space-y-2">
                                    <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} className="border rounded px-2 py-1 w-full" />
                                    <input value={editDesc} onChange={e=>setEditDesc(e.target.value)} className="border rounded px-2 py-1 w-full" />
                                    <div className="text-right space-x-2">
                                        <button onClick={async()=>{
                                            const token = localStorage.getItem('token');
                                            const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_ANNOUNCEMENTS}/${m._id}`, { method:'PUT', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify({ title: editTitle, description: editDesc }) });
                                            const data = await res.json();
                                            if (res.ok && data.success) {
                                                setMine(prev => prev.map(x => x._id === m._id ? data.item : x));
                                                setEditingId(null);
                                            }
                                        }} className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
                                        <button onClick={()=>setEditingId(null)} className="px-3 py-1 border rounded">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between">
                    <div>
                                        <div className="font-semibold">{m.title} <span className="text-xs text-gray-500">(by Councillor)</span></div>
                                        <div className="text-sm text-gray-700">{m.description}</div>
                                        <div className="text-xs text-gray-500 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                                    <div className="space-x-2">
                                        <button onClick={()=>{ setEditingId(m._id); setEditTitle(m.title); setEditDesc(m.description); }} className="px-3 py-1 border rounded">Edit</button>
                                        <button onClick={async()=>{
                                            const token = localStorage.getItem('token');
                                            const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_ANNOUNCEMENTS}/${m._id}`, { method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` } });
                                            if (res.ok) setMine(prev => prev.filter(x => x._id !== m._id));
                                        }} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {mine.length === 0 && <div className="text-sm text-gray-500">No announcements yet.</div>}
                </div>
            </div>
            {items.map(a => (
                <div key={a._id} className="border rounded-md p-4 bg-gray-50">
                    <div className="font-semibold">{a.title} <span className="text-xs text-gray-500">(by {a.createdByRole === 'president' ? 'President' : 'Authority'})</span></div>
                    <div className="text-sm text-gray-700">{a.description}</div>
                    <div className="text-xs text-gray-500 mt-1">Audience: {a.audience} • {new Date(a.createdAt).toLocaleString()}</div>
                </div>
            ))}
            {items.length === 0 && <div className="text-sm text-gray-500">No announcements.</div>}
    </div>
);
};

const PresidentEvents: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [mine, setMine] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_ENDPOINTS.PRESIDENT_EVENTS}?audience=councillors`);
                const data = await res.json();
                if (data.success) setItems(data.items || []);
            } catch {}
        })();
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_EVENTS}/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                if (data.success) setMine(data.items || []);
            } catch {}
        })();
        const socket = io('http://localhost:3002', { withCredentials: true });
        socket.on('event:new', async () => {
            try {
                const res = await fetch(`${API_ENDPOINTS.PRESIDENT_EVENTS}?audience=councillors`);
                const data = await res.json();
                if (data.success) setItems(data.items || []);
                Swal.fire({ toast: true, icon: 'info', title: 'New event', position: 'top-end', timer: 3000, showConfirmButton: false });
            } catch {}
        });
        return () => { socket.disconnect(); };
    }, []);
    return (
        <div className="space-y-3">
            <div className="border rounded-md p-4 bg-white">
                <div className="font-semibold mb-2">Create Event (Citizens only)</div>
                <div className="grid md:grid-cols-4 gap-2">
                    <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="border rounded px-3 py-2" />
                    <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="border rounded px-3 py-2 md:col-span-2" />
                    <input type="datetime-local" value={time} onChange={e=>setTime(e.target.value)} className="border rounded px-3 py-2" />
                    <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location" className="border rounded px-3 py-2 md:col-span-3" />
                </div>
                <div className="mt-2 text-right">
                    <button onClick={async()=>{
                        if (!title.trim() || !description.trim() || !time.trim()) return;
                        try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(API_ENDPOINTS.COUNCILLOR_EVENTS, { method:'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title, description, time, location }) });
                            const data = await res.json();
                            if (res.ok && data.success) {
                                setTitle(''); setDescription(''); setTime(''); setLocation('');
                                setMine(prev => [data.item, ...prev]);
                                Swal.fire({ toast: true, icon:'success', title:'Event created', timer:2000, position:'top-end', showConfirmButton:false });
                            }
                        } catch {}
                    }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Create</button>
                </div>
            </div>
            {/* My events */}
            <div className="border rounded-md p-4 bg-gray-50">
                <div className="font-semibold mb-2">My Events</div>
                <div className="space-y-2">
                    {mine.map(e => {
                        const start = new Date(e.time);
                        return (
                            <div key={e._id} className="border rounded p-3 bg-white flex items-start justify-between">
                                <div>
                                    <div className="font-semibold">{e.title} <span className="text-xs text-gray-500">(by Councillor)</span></div>
                                    <div className="text-sm text-gray-700">{e.description}</div>
                                    <div className="text-xs text-gray-500 mt-1">{start.toLocaleString()} • {e.location}</div>
                                </div>
                                <div className="space-x-2">
                                    <button onClick={async()=>{
                                        const nt = prompt('New title', e.title) || e.title;
                                        const nd = prompt('New description', e.description) || e.description;
                                        const ntime = prompt('New time (YYYY-MM-DDTHH:mm)', e.time?.slice?.(0,16) || '') || e.time;
                                        const nloc = prompt('New location', e.location || '') || e.location;
                                        const token = localStorage.getItem('token');
                                        const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_EVENTS}/${e._id}`, { method:'PUT', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify({ title: nt, description: nd, time: ntime, location: nloc }) });
                                        const data = await res.json();
                                        if (res.ok && data.success) setMine(prev => prev.map(x => x._id === e._id ? data.item : x));
                                    }} className="px-3 py-1 border rounded">Edit</button>
                                    <button onClick={async()=>{
                                        const token = localStorage.getItem('token');
                                        const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_EVENTS}/${e._id}`, { method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` } });
                                        if (res.ok) setMine(prev => prev.filter(x => x._id !== e._id));
                                    }} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                                </div>
                            </div>
                        );
                    })}
                    {mine.length === 0 && <div className="text-sm text-gray-500">No events yet.</div>}
                </div>
            </div>
            {items.map(e => {
                const start = new Date(e.time);
                const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${start.toISOString().replace(/[-:]/g,'').split('.')[0]}Z\nSUMMARY:${(e.title||'Event').replace(/\n/g,' ')}\nDESCRIPTION:${(e.description||'').replace(/\n/g,' ')}\nLOCATION:${(e.location||'').replace(/\n/g,' ')}\nEND:VEVENT\nEND:VCALENDAR`;
                const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                return (
                    <div key={e._id} className="border rounded-md p-4 bg-gray-50 flex items-start justify-between">
                        <div>
                            <div className="font-semibold">{e.title} <span className="text-xs text-gray-500">(by {e.createdByRole === 'president' ? 'President' : 'Authority'})</span></div>
                            <div className="text-sm text-gray-700">{e.description}</div>
                            <div className="text-xs text-gray-500 mt-1">{start.toLocaleString()} • {e.location}</div>
                        </div>
                        <a href={url} download={`${e.title||'event'}.ics`} className="text-blue-600 text-sm underline">Add to Calendar</a>
                    </div>
                );
            })}
            {items.length === 0 && <div className="text-sm text-gray-500">No upcoming events.</div>}
        </div>
    );
};

const VerificationTab: React.FC = () => {
    const [citizens, setCitizens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
    const [removalReason, setRemovalReason] = useState<'death' | 'relocation' | 'other'>('relocation');
    const [removalComments, setRemovalComments] = useState('');
    const [deathCertificate, setDeathCertificate] = useState<File | null>(null);
    const [removing, setRemoving] = useState(false);

    const fetchCitizens = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', '10');
            if (search) params.set('search', search);
            if (filter === 'verified') params.set('verified', 'true');
            if (filter === 'unverified') params.set('verified', 'false');
            const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}/../councillors/ward/citizens?${params.toString()}`.replace('/users/..',''), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCitizens(data.citizens || []);
                setTotalPages(data.totalPages || 1);
            } else {
                setCitizens([]);
            }
        } catch (e) {
            console.error('Failed to fetch citizens', e);
            setCitizens([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCitizens();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filter]);

    const verifyCitizen = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}/../councillors/ward/citizens/${id}/verify`.replace('/users/..',''), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                setCitizens(prev => prev.map(c => c._id === id ? { ...c, isVerified: true } : c));
            }
        } catch (e) {
            console.error('Verify failed', e);
        }
    };

    const openRemoveModal = (citizen: any) => {
        setSelectedCitizen(citizen);
        setShowRemoveModal(true);
        setRemovalReason('relocation');
        setRemovalComments('');
        setDeathCertificate(null);
    };

    const handleRemoveCitizen = async () => {
        if (!selectedCitizen) return;
        
        setRemoving(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('removalReason', removalReason);
            formData.append('removalComments', removalComments);
            
            if (deathCertificate) {
                formData.append('deathCertificate', deathCertificate);
            }
            
            const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}/../councillors/ward/citizens/${selectedCitizen._id}`.replace('/users/..',''), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (res.ok) {
                setCitizens(prev => prev.filter(c => c._id !== selectedCitizen._id));
                setShowRemoveModal(false);
                setSelectedCitizen(null);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to remove citizen');
            }
        } catch (e) {
            console.error('Remove failed', e);
            alert('Failed to remove citizen');
        } finally {
            setRemoving(false);
        }
    };

    return (
                    <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-gray-800">Citizen Verification</h3>
                <div className="flex space-x-2">
                    <select value={filter} onChange={e => { setFilter(e.target.value as any); setPage(1); }} className="border rounded-md px-3 py-2 text-sm">
                        <option value="all">All</option>
                        <option value="unverified">Unverified</option>
                        <option value="verified">Verified</option>
                    </select>
                    <div className="relative">
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name/email/address" className="border rounded-md pl-8 pr-3 py-2 text-sm w-64" />
                        <i className="fas fa-search absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <button onClick={() => { setPage(1); fetchCitizens(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Search</button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Email</th>
                            <th className="px-4 py-3 text-left">Address</th>
                            <th className="px-4 py-3 text-left">Ward</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">ID Proof</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">Loading citizens...</td></tr>
                        ) : citizens.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No citizens found.</td></tr>
                        ) : (
                            citizens.map(c => (
                                <tr key={c._id}>
                                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.address || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.ward}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.isVerified ? 'Verified' : 'Unverified'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {c.idProof?.fileUrl ? (
                                            <a href={c.idProof.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">View Proof</a>
                                        ) : (
                                            <span className="text-xs text-gray-500">Not uploaded</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        {!c.isVerified && (
                                            <button onClick={() => verifyCitizen(c._id)} disabled={!c.idProof?.fileUrl} className={`px-3 py-1.5 rounded-md text-xs font-medium text-white ${c.idProof?.fileUrl ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                                                <i className="fas fa-check mr-1"></i> Verify
                                            </button>
                                        )}
                                        <button onClick={() => openRemoveModal(c)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium">
                                            <i className="fas fa-user-times mr-1"></i> Remove
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
                <div className="space-x-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50">Previous</button>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))} className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50">Next</button>
                </div>
            </div>

            {/* Removal Modal */}
            {showRemoveModal && selectedCitizen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Remove Citizen</h3>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Removing: <span className="font-medium">{selectedCitizen.name}</span> ({selectedCitizen.email})
                            </p>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Removal</label>
                            <select 
                                value={removalReason} 
                                onChange={(e) => setRemovalReason(e.target.value as any)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                                <option value="relocation">Relocation</option>
                                <option value="death">Death</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {removalReason === 'death' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Death Certificate <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setDeathCertificate(e.target.files?.[0] || null)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Upload death certificate (PDF or image)</p>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                            <textarea
                                value={removalComments}
                                onChange={(e) => setRemovalComments(e.target.value)}
                                placeholder="Additional details about the removal..."
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-20 resize-none"
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowRemoveModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                disabled={removing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveCitizen}
                                disabled={removing || (removalReason === 'death' && !deathCertificate)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {removing ? 'Removing...' : 'Remove Citizen'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
    </div>
);
};

const WardComplaints: React.FC = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState<{[id: string]: string | undefined}>({});
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    useEffect(() => {
        const fetchWardComplaints = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}/../grievances/community`.replace('/users/..',''), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    const mapped = (data.grievances || []).filter((g: any) => g.status !== 'resolved').map((g: any) => ({
                        id: g.id,
                        userId: g.userId,
                        userName: g.userName,
                        userEmail: g.userEmail,
                        ward: g.ward,
                        imageURL: g.imageURL,
                        issueType: g.issueType,
                        description: g.description,
                        location: g.location,
                        priorityScore: g.priorityScore,
                        credibilityScore: g.credibilityScore,
                        status: g.status as ComplaintStatus,
                        source: g.source,
                        createdAt: g.createdAt,
                        duplicateGroupId: g.duplicateGroupId,
                        duplicateCount: g.duplicateCount,
                        attachments: g.attachments || []
                    }));
                    mapped.sort((a: any, b: any) => (b.priorityScore - a.priorityScore) || ((b.duplicateCount||0) - (a.duplicateCount||0)) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                    setComplaints(mapped);
                } else {
                    setComplaints([]);
                }
            } catch (e) {
                console.error('Failed to fetch ward complaints', e);
                setComplaints([]);
            } finally {
                setLoading(false);
            }
        };
        fetchWardComplaints();
    }, [user?.ward]);

    const updateStatus = async (id: string, status: 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected') => {
        try {
            setActing(prev => ({ ...prev, [id]: status }));
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3002/api/grievances/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, remarks: `Set to ${status} by councillor` })
            });
            if (res.ok) {
                setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: status as any } : c));
            }
        } catch (e) {
            // no-op
        } finally {
            setActing(prev => ({ ...prev, [id]: undefined }));
        }
    };

    const autoVerify = async (id: string) => {
        try {
            setActing(prev => ({ ...prev, [id]: 'auto' }));
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3002/api/grievances/${id}/verify/auto`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Refresh that complaint from API or optimistically mark Under Review
                setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'Under Review' as any } : c));
            }
        } catch (_) {
        } finally {
            setActing(prev => ({ ...prev, [id]: undefined }));
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-gray-800">Pending Complaints in Your Ward</h3>
            </div>
            <div className="space-y-4">
                {loading ? (
                    <div className="text-gray-600 text-sm">Loading complaints...</div>
                ) : complaints.length === 0 ? (
                    <div className="text-gray-600 text-sm">No active complaints in your ward.</div>
                ) : (
                    complaints.map(c => (
                        <div key={c.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => setSelectedComplaint(c)}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-3">
                                            Priority {c.priorityScore}
                                        </span>
                                        {c.duplicateCount ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 mr-3">
                                                <i className="fas fa-arrow-up mr-1"></i>{c.duplicateCount} upvotes
                                            </span>
                                        ) : null}
                                        <span className="text-sm text-gray-500">
                                            <i className="fas fa-clock mr-1"></i>
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-gray-800 mb-2">{c.issueType}</h4>
                                    <p className="text-gray-600 mb-3">{c.description}</p>
                                    <div className="flex items-center text-sm text-gray-500 flex-wrap gap-2">
                                        <i className="fas fa-user mr-2"></i>
                                        <span>Reported by: {c.userName}</span>
                                        <span className="mx-2">•</span>
                                        <i className="fas fa-map-marker-alt mr-2"></i>
                                        <span>
                                            {c.location?.address || `${c.location?.lat?.toFixed?.(6)}, ${c.location?.lng?.toFixed?.(6)}`} {c.location?.lat !== undefined && c.location?.lng !== undefined ? `(${c.location.lat.toFixed(6)}, ${c.location.lng.toFixed(6)})` : ''}
                                        </span>
                                        <span className="mx-2">•</span>
                                        <span>Ward {c.ward}</span>
                                    </div>
                                </div>
                                <div className="ml-4 flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                                    <div className="flex flex-wrap gap-2 justify-end">
                                        <button onClick={() => autoVerify(c.id)} disabled={!!acting[c.id]} className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white disabled:opacity-50">
                                            {acting[c.id] ? 'Processing…' : 'Auto Verify'}
                                        </button>
                                        <button onClick={() => updateStatus(c.id, 'In Progress')} disabled={!!acting[c.id]} className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white disabled:opacity-50">In Progress</button>
                                        <button onClick={() => updateStatus(c.id, 'Resolved')} disabled={!!acting[c.id]} className="px-3 py-1.5 text-xs rounded-md bg-green-600 text-white disabled:opacity-50">Resolve</button>
                                        <button onClick={() => updateStatus(c.id, 'Rejected')} disabled={!!acting[c.id]} className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white disabled:opacity-50">Reject</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Complaint Details Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h4 className="text-lg font-semibold">Complaint Details</h4>
                            <button onClick={() => setSelectedComplaint(null)} className="px-3 py-1 rounded-md border hover:bg-gray-50">Close</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <img src={selectedComplaint.imageURL} alt={selectedComplaint.issueType} className="w-full h-48 object-cover rounded-lg border" />
                                <div className="mt-3 text-sm text-gray-600 space-y-1">
                                    <div><span className="font-semibold text-gray-700">Issue:</span> {selectedComplaint.issueType}</div>
                                    <div><span className="font-semibold text-gray-700">Description:</span> {selectedComplaint.description}</div>
                                    <div><span className="font-semibold text-gray-700">Reporter:</span> {selectedComplaint.userName}</div>
                                    <div><span className="font-semibold text-gray-700">Upvotes:</span> {selectedComplaint.duplicateCount || 1}</div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Location:</span> {selectedComplaint.location?.address || ''}
                                        {selectedComplaint.location ? (
                                            <span> ({selectedComplaint.location.lat.toFixed(6)}, {selectedComplaint.location.lng.toFixed(6)})</span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            <div>
                                {selectedComplaint.location && (
                                    <div className="h-56 rounded-lg overflow-hidden border">
                                        <MapView center={[selectedComplaint.location.lat, selectedComplaint.location.lng]} marker={{ position: [selectedComplaint.location.lat, selectedComplaint.location.lng], popupText: selectedComplaint.location.address || selectedComplaint.issueType }} />
                                    </div>
                                )}
                                <div className="mt-4 flex flex-col gap-2">
                                    <a href={selectedComplaint.userEmail ? `mailto:${selectedComplaint.userEmail}?subject=Regarding your complaint&body=Please provide more details.` : undefined} target="_blank" rel="noreferrer" className={`px-3 py-2 rounded-md text-sm font-medium text-white ${selectedComplaint.userEmail ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed pointer-events-none'}`}>
                                        <i className="fas fa-envelope mr-2"></i>
                                        Contact Reporter
                                    </a>
                                    <button className="px-3 py-2 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white text-left" onClick={() => alert('Request sent: Please upload an additional video evidencing the issue.') }>
                                        <i className="fas fa-video mr-2"></i>
                                        Request Extra Video Evidence
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const WelfareQueue: React.FC = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState<WelfareApplication[]>([]);
    const [loadingScores, setLoadingScores] = useState<{[key: string]: boolean}>({});
    const [schemes, setSchemes] = useState<{ id: string; title: string }[]>([]);
    const [selectedSchemeId, setSelectedSchemeId] = useState<string>('all');
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [verifying, setVerifying] = useState<{[key: string]: boolean}>({});
    const [verificationInfo, setVerificationInfo] = useState<{[key: string]: { status: string; score?: number; remarks?: string }}>({});
    const [selectedApplication, setSelectedApplication] = useState<any>(null);
    const [showVerificationModal, setShowVerificationModal] = useState(false);

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
                    const mapped: WelfareApplication[] = (data.applications || [])
                        .filter((a: any) => a && a._id) // Filter out null/undefined applications
                        .map((a: any) => ({
                        id: a._id,
                        schemeId: a.schemeId && typeof a.schemeId === 'object' ? a.schemeId._id || a.schemeId.id : a.schemeId,
                        schemeTitle: a.schemeTitle || (a.schemeId && typeof a.schemeId === 'object' ? a.schemeId.title : ''),
                        userId: a.userId && typeof a.userId === 'object' ? a.userId._id || a.userId.id : a.userId,
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
                        documents: a.documents || [],
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
            // Call ML service directly
            const resp = await fetch(`http://localhost:8001/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(app) // Send the full application data
            });
            
            if (resp.ok) {
                const data = await resp.json();
                console.log('ML Score received:', data);
                
                // Update the application with the score
                setApplications(prev => prev.map(a => 
                    a.id === appId ? { 
                        ...a, 
                        score: Math.round(data.score),
                        justification: data.justification,
                        priority: data.priority
                    } : a
                ));
            } else {
                console.error('ML service error:', resp.status);
                // Fallback scoring
                const fallbackScore = Math.floor(Math.random() * 100);
                setApplications(prev => prev.map(a => 
                    a.id === appId ? { 
                        ...a, 
                        score: fallbackScore,
                        justification: `⚠️ ML Service Not Running - Please start ML service: cd ml && python welfare_scoring_service.py`
                    } : a
                ));
            }
        } catch (error) {
            console.error("Failed to get score", error);
            // Fallback scoring
            const fallbackScore = Math.floor(Math.random() * 100);
            setApplications(prev => prev.map(a => 
                a.id === appId ? { 
                    ...a, 
                    score: fallbackScore,
                    justification: `⚠️ ML Service Not Running - Please start ML service: cd ml && python welfare_scoring_service.py`
                } : a
            ));
        } finally {
            setLoadingScores(prev => ({ ...prev, [appId]: false }));
        }
    };

    const openVerificationModal = (appId: string) => {
        const application = applications.find(app => app.id === appId);
        if (application) {
            // Convert to the expected format for VerificationModal
            const modalApplication = {
                _id: application.id,
                schemeId: { _id: application.schemeId, title: application.schemeTitle, scope: 'ward' as const },
                schemeTitle: application.schemeTitle,
                userId: { _id: application.userId, name: application.userName, email: '' },
                userName: application.userName,
                userEmail: '',
                userWard: application.ward,
                personalDetails: {
                    address: application.address,
                    phoneNumber: application.phoneNumber,
                    rationCardNumber: application.rationCardNumber,
                    aadharNumber: application.aadharNumber,
                    familyIncome: application.familyIncome,
                    dependents: application.dependents,
                    isHandicapped: application.isHandicapped,
                    isSingleWoman: application.isSingleWoman
                },
                reason: application.reason,
                status: application.status.toLowerCase() as any,
                appliedAt: application.createdAt,
                verification: application.score ? { autoScore: application.score / 100 } : undefined,
                documents: application.documents || []
            } as any;
            setSelectedApplication(modalApplication);
            setShowVerificationModal(true);
        }
    };

    const handleVerification = async (appId: string, approve: boolean, remarks: string) => {
        try {
            setVerifying(prev => ({ ...prev, [appId]: true }));
            const token = localStorage.getItem('token');
            const resp = await fetch(`http://localhost:3002/api/welfare/applications/${appId}/manual-verify`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: approve ? 'Verified-Manual' : 'Rejected', remarks })
            });
            if (resp.ok) {
                const data = await resp.json();
                const a = data?.application;
                setVerificationInfo(prev => ({
                    ...prev,
                    [appId]: {
                        status: a?.verificationStatus || (approve ? 'Verified-Manual' : 'Rejected'),
                        score: a?.verification?.autoScore,
                        remarks: a?.verification?.remarks || remarks
                    }
                }));
                // Refresh applications list
                const fetchApplications = async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`http://localhost:3002/api/welfare/applications?ward=${user?.ward}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            setApplications(data.applications || []);
                        }
                    } catch (e) {
                        console.error('Failed to load applications', e);
                    }
                };
                fetchApplications();
            }
        } catch (e) {
            console.error('Manual verify failed', e);
        } finally {
            setVerifying(prev => ({ ...prev, [appId]: false }));
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
                const a = data?.application;
                setVerificationInfo(prev => ({
                    ...prev,
                    [appId]: {
                        status: a?.verificationStatus || data?.status || 'Pending',
                        score: a?.verification?.autoScore ?? data?.matchScore,
                        remarks: a?.verification?.remarks || data?.remarks
                    }
                }));
            }
        } catch (e) {
            console.error('Auto verify failed', e);
        } finally {
            setVerifying(prev => ({ ...prev, [appId]: false }));
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
            a.status,
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
                                                            <button onClick={() => openVerificationModal(app.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                                                <i className="fas fa-file-signature mr-2"></i>
                                                                Verify Documents
                                                            </button>
                                                            <button onClick={() => autoVerify(app.id)} disabled={!!verifying[app.id]} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-60">
                                                                <i className="fas fa-robot mr-2"></i>
                                                                {verifying[app.id] ? 'AI Checking...' : 'Auto Verify'}
                                                            </button>
                                                            <button onClick={() => handleVerification(app.id, true, '')} disabled={!!verifying[app.id]} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-60">
                                                                <i className="fas fa-check mr-2"></i>
                                                                Approve
                                                            </button>
                                                            <button onClick={() => handleVerification(app.id, false, '')} disabled={!!verifying[app.id]} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-60">
                                                                <i className="fas fa-times mr-2"></i>
                                                                Reject
                                                            </button>
                                                        </div>
                                                        {verificationInfo[app.id] && (
                                                            <div className="text-xs text-gray-600 text-right">
                                                                <div><span className="font-semibold">Verification:</span> {verificationInfo[app.id].status}</div>
                                                                {verificationInfo[app.id].score !== undefined && (
                                                                    <div><span className="font-semibold">AI Score:</span> {Math.round((verificationInfo[app.id].score || 0) * 100)}%</div>
                                                                )}
                                                                {verificationInfo[app.id].remarks && (
                                                                    <div className="text-gray-500">{verificationInfo[app.id].remarks}</div>
                                                                )}
                                                            </div>
                                                        )}
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
                                            <button onClick={() => openVerificationModal(app.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                                <i className="fas fa-file-signature mr-2"></i>
                                                Verify Documents
                                            </button>
                                            <button onClick={() => autoVerify(app.id)} disabled={!!verifying[app.id]} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-60">
                                                <i className="fas fa-robot mr-2"></i>
                                                {verifying[app.id] ? 'AI Checking...' : 'Auto Verify'}
                                            </button>
                                            <button onClick={() => handleVerification(app.id, true, '')} disabled={!!verifying[app.id]} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-60">
                                                <i className="fas fa-check mr-2"></i>
                                                Approve
                                            </button>
                                            <button onClick={() => handleVerification(app.id, false, '')} disabled={!!verifying[app.id]} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-60">
                                                <i className="fas fa-times mr-2"></i>
                                                Reject
                                            </button>
                            </div>
                                        {verificationInfo[app.id] && (
                                            <div className="text-xs text-gray-600 text-right">
                                                <div><span className="font-semibold">Verification:</span> {verificationInfo[app.id].status}</div>
                                                {verificationInfo[app.id].score !== undefined && (
                                                    <div><span className="font-semibold">AI Score:</span> {Math.round((verificationInfo[app.id].score || 0) * 100)}%</div>
                                                )}
                                                {verificationInfo[app.id].remarks && (
                                                    <div className="text-gray-500">{verificationInfo[app.id].remarks}</div>
                                                )}
                        </div>
                                        )}
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
                                {appAnalytics.top.map((a: any, i: number) => (
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
            
            {/* Verification Modal */}
            <VerificationModal
                application={selectedApplication}
                isOpen={showVerificationModal}
                onClose={() => {
                    setShowVerificationModal(false);
                    setSelectedApplication(null);
                }}
                onVerify={handleVerification}
                verifying={selectedApplication ? verifying[selectedApplication._id as string] || false : false}
            />
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
        requiredDocuments: [''],
        totalSlots: '',
        applicationDeadline: '',
        startDate: '',
        endDate: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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

        // Required documents validation
        const ALLOWED = [
            'Aadhar Card','Ration Card','Voter ID','Driving License','PAN Card','Passport','Disability Certificate','Income Certificate','Caste Certificate','Residence Certificate','BPL Card','Senior Citizen ID','Widow Certificate','Death Certificate'
        ];
        const docs = (values.requiredDocuments || []).map(d => trim(d)).filter(Boolean);
        if (docs.length === 0) errs.requiredDocuments = 'At least one required document is mandatory.';
        if (docs.some(d => !ALLOWED.includes(d))) errs.requiredDocuments = 'Select valid Indian document types only.';

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
        // mark all fields as touched to show errors
        setTouched({
            title: true,
            category: true,
            description: true,
            eligibilityCriteria: true,
            benefits: true,
            requiredDocuments: true,
            totalSlots: true,
            applicationDeadline: true,
            startDate: true,
            endDate: true
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
                requiredDocuments: (formData.requiredDocuments || [])
                    .map(d => (d || '').trim())
                    .filter(Boolean)
                    .map(name => ({ name, type: 'file', formats: [] })),
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
                    requiredDocuments: [''],
                    totalSlots: '',
                    applicationDeadline: '',
                    startDate: '',
                    endDate: '',
                });
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

                {/* Required Documents */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Required Documents
                    </label>
                    {(formData.requiredDocuments || []).map((doc: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 mb-3">
                            <select
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={doc}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData(prev => {
                                        const next: any = { ...prev };
                                        const list = [...(next.requiredDocuments || [])];
                                        list[idx] = value;
                                        next.requiredDocuments = list;
                                        return next;
                                    });
                                }}
                            >
                                <option value="">Select document type</option>
                                <option value="Aadhar Card">Aadhar Card</option>
                                <option value="Ration Card">Ration Card</option>
                                <option value="Voter ID">Voter ID</option>
                                <option value="Driving License">Driving License</option>
                                <option value="PAN Card">PAN Card</option>
                                <option value="Passport">Passport</option>
                                <option value="Disability Certificate">Disability Certificate</option>
                                <option value="Income Certificate">Income Certificate</option>
                                <option value="Caste Certificate">Caste Certificate</option>
                                <option value="Residence Certificate">Residence Certificate</option>
                                <option value="BPL Card">BPL Card</option>
                                <option value="Senior Citizen ID">Senior Citizen ID</option>
                                <option value="Widow Certificate">Widow Certificate</option>
                                <option value="Death Certificate">Death Certificate</option>
                            </select>
                            {(formData.requiredDocuments || []).length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => {
                                        const next: any = { ...prev };
                                        next.requiredDocuments = (next.requiredDocuments || []).filter((_: any, i: number) => i !== idx);
                                        return next;
                                    })}
                                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                    <div className="flex justify-between items-center">
                        {touched.requiredDocuments && fieldErrors.requiredDocuments && (
                            <p className="text-sm text-red-600">{fieldErrors.requiredDocuments}</p>
                        )}
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                                ...(prev as any),
                                requiredDocuments: [
                                    ...((prev as any).requiredDocuments || []),
                                    ''
                                ]
                            }))}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                            + Add Document
                        </button>
                    </div>
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

                {/* Removed Additional Details field as requested */}

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => setFormData({
                            title: '',
                            description: '',
                            category: '',
                            eligibilityCriteria: '',
                            benefits: '',
                            requiredDocuments: [''],
                            totalSlots: '',
                            applicationDeadline: '',
                            startDate: '',
                            endDate: ''
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
        (scheme.status === 'active' || scheme.status === 'draft') && scheme.endDate && new Date(scheme.endDate) >= now
    );
    
    const completedSchemes = schemes.filter(scheme => 
        scheme.status === 'completed' || scheme.status === 'expired' || (scheme.endDate && new Date(scheme.endDate) < now)
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
            status: scheme.status || 'active',
            requiredDocuments: (scheme.requiredDocuments || []).map((d: any) => d?.name || '').filter(Boolean)
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
                status: editingScheme.status,
                requiredDocuments: (editingScheme.requiredDocuments || [])
                    .map((n: string) => (n || '').trim())
                    .filter((n: string) => !!n)
                    .map((name: string) => ({ name, type: 'file', formats: [] }))
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
                if (sch.status !== 'completed' && sch.status !== 'expired' && sch.endDate && new Date(sch.endDate) < nowLocal) {
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
        const active = schemes.filter(s => (s.status === 'active' || s.status === 'draft') && s.endDate && new Date(s.endDate) >= now).length;
        const completed = schemes.filter(s => s.status === 'completed' || s.status === 'expired' || (s.endDate && new Date(s.endDate) < now)).length;
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
                    currentSchemes.map((scheme) => (
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
                            {/* Required Documents Editor */}
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-600 mb-2">Required Documents</label>
                                {(editingScheme?.requiredDocuments || ['']).map((doc: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 mb-2">
                                        <select
                                            className="flex-1 border rounded-md px-3 py-2"
                                            value={doc}
                                            onChange={e => setEditingScheme({
                                                ...editingScheme,
                                                requiredDocuments: (
                                                    (editingScheme?.requiredDocuments as string[] | undefined) || []
                                                ).map((d: string, i: number) => (i === idx ? e.target.value : d))
                                            })}
                                        >
                                            <option value="">Select document type</option>
                                            <option value="Aadhar Card">Aadhar Card</option>
                                            <option value="Ration Card">Ration Card</option>
                                            <option value="Voter ID">Voter ID</option>
                                            <option value="Driving License">Driving License</option>
                                            <option value="PAN Card">PAN Card</option>
                                            <option value="Passport">Passport</option>
                                            <option value="Disability Certificate">Disability Certificate</option>
                                            <option value="Income Certificate">Income Certificate</option>
                                            <option value="Caste Certificate">Caste Certificate</option>
                                            <option value="Residence Certificate">Residence Certificate</option>
                                            <option value="BPL Card">BPL Card</option>
                                            <option value="Senior Citizen ID">Senior Citizen ID</option>
                                            <option value="Widow Certificate">Widow Certificate</option>
                                            <option value="Death Certificate">Death Certificate</option>
                                        </select>
                                        {(editingScheme?.requiredDocuments?.length || 0) > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setEditingScheme({
                                                    ...editingScheme,
                                                    requiredDocuments: (editingScheme?.requiredDocuments || []).filter((_: any, i: number) => i !== idx)
                                                })}
                                                className="px-3 py-2 bg-red-500 text-white rounded-md"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setEditingScheme({
                                            ...editingScheme,
                                            requiredDocuments: [
                                                ...((editingScheme?.requiredDocuments as string[] | undefined) || []),
                                                ''
                                            ]
                                        })}
                                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md"
                                    >
                                        + Add Document
                                    </button>
                                </div>
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