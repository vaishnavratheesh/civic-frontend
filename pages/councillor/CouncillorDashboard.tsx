
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import VerificationModal from '../../components/VerificationModal';
import TokenExpirationWarning from '../../components/TokenExpirationWarning';
import { Complaint, ComplaintStatus, WelfareApplication, ApplicationStatus, WelfareScheme } from '../../types';
import { io } from 'socket.io-client';
// Sabha Meeting Join Button
const SabhaMeetingJoin: React.FC = () => {
    const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
    useEffect(() => {
        let interval: any;
        const fetchMeeting = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.MEETING_PUBLIC);
                const data = await res.json();
                setMeetingUrl(data.url || null);
            } catch { }
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
    const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
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
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/applications/stats`, {
                        headers
                    }),
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/wards/${user.ward}/stats`),
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes`, {
                        headers
                    }),
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/applications?ward=${user.ward}`, {
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
            <TokenExpirationWarning />
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
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'complaints'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <i className="fas fa-exclamation-triangle mr-2"></i>
                                    Ward Complaints
                                </button>
                                <button
                                    onClick={() => setActiveTab('welfare')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'welfare'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <i className="fas fa-hands-helping mr-2"></i>
                                    Welfare Applications
                                </button>
                                <button
                                    onClick={() => setActiveTab('view-schemes')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'view-schemes'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <i className="fas fa-list-alt mr-2"></i>
                                    View Schemes
                                </button>
                                <button
                                    onClick={() => setActiveTab('verification')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'verification'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <i className="fas fa-user-check mr-2"></i>
                                    Verification
                                </button>
                                <button
                                    onClick={() => setActiveTab('add-schemes')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'add-schemes'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <i className="fas fa-plus-circle mr-2"></i>
                                    Add Schemes
                                </button>
                                <button
                                    onClick={() => setActiveTab('announcements')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'announcements'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <i className="fas fa-bullhorn mr-2"></i>
                                    Announcements
                                </button>
                                <button
                                    onClick={() => setActiveTab('events')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'events'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <i className="fas fa-calendar-alt mr-2"></i>
                                    Events
                                </button>
                                <button
                                    onClick={() => setActiveTab('esabha')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'esabha'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <i className="fas fa-video mr-2"></i>
                                    E-Sabha
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
    const [editingId, setEditingId] = useState<string | null>(null);
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
            } catch { }
        })();
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_ANNOUNCEMENTS}/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                if (data.success) setMine(data.items || []);
            } catch { }
        })();
        const socket = io(import.meta.env.VITE_BACKEND_URL, { withCredentials: true });
        socket.on('announcement:new', async () => {
            try {
                const res = await fetch(`${API_ENDPOINTS.PRESIDENT_ANNOUNCEMENTS}?audience=councillors`);
                const data = await res.json();
                if (data.success) setItems(data.items || []);
                Swal.fire({ toast: true, icon: 'info', title: 'New announcement', position: 'top-end', timer: 3000, showConfirmButton: false });
            } catch { }
        });
        return () => { socket.disconnect(); };
    }, []);
    return (
        <div className="space-y-3">
            <div className="border rounded-md p-4 bg-white">
                <div className="font-semibold mb-2">Post Announcement (Citizens only)</div>
                <div className="grid md:grid-cols-3 gap-2">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="border rounded px-3 py-2" />
                    <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="border rounded px-3 py-2 md:col-span-2" />
                </div>
                <div className="mt-2 text-right">
                    <button onClick={async () => {
                        if (!title.trim() || !description.trim()) return;
                        try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(API_ENDPOINTS.COUNCILLOR_ANNOUNCEMENTS, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title, description }) });
                            const data = await res.json();
                            if (res.ok && data.success) {
                                setTitle(''); setDescription('');
                                setMine(prev => [data.item, ...prev]);
                                Swal.fire({ toast: true, icon: 'success', title: 'Announcement posted', timer: 2000, position: 'top-end', showConfirmButton: false });
                            }
                        } catch { }
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
                                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="border rounded px-2 py-1 w-full" />
                                    <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="border rounded px-2 py-1 w-full" />
                                    <div className="text-right space-x-2">
                                        <button onClick={async () => {
                                            const token = localStorage.getItem('token');
                                            const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_ANNOUNCEMENTS}/${m._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: editTitle, description: editDesc }) });
                                            const data = await res.json();
                                            if (res.ok && data.success) {
                                                setMine(prev => prev.map(x => x._id === m._id ? data.item : x));
                                                setEditingId(null);
                                            }
                                        }} className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
                                        <button onClick={() => setEditingId(null)} className="px-3 py-1 border rounded">Cancel</button>
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
                                        <button onClick={() => { setEditingId(m._id); setEditTitle(m.title); setEditDesc(m.description); }} className="px-3 py-1 border rounded">Edit</button>
                                        <button onClick={async () => {
                                            const token = localStorage.getItem('token');
                                            const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_ANNOUNCEMENTS}/${m._id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
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
            } catch { }
        })();
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_EVENTS}/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                if (data.success) setMine(data.items || []);
            } catch { }
        })();
        const socket = io(import.meta.env.VITE_BACKEND_URL, { withCredentials: true });
        socket.on('event:new', async () => {
            try {
                const res = await fetch(`${API_ENDPOINTS.PRESIDENT_EVENTS}?audience=councillors`);
                const data = await res.json();
                if (data.success) setItems(data.items || []);
                Swal.fire({ toast: true, icon: 'info', title: 'New event', position: 'top-end', timer: 3000, showConfirmButton: false });
            } catch { }
        });
        return () => { socket.disconnect(); };
    }, []);
    return (
        <div className="space-y-3">
            <div className="border rounded-md p-4 bg-white">
                <div className="font-semibold mb-2">Create Event (Citizens only)</div>
                <div className="grid md:grid-cols-4 gap-2">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="border rounded px-3 py-2" />
                    <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="border rounded px-3 py-2 md:col-span-2" />
                    <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} className="border rounded px-3 py-2" />
                    <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="border rounded px-3 py-2 md:col-span-3" />
                </div>
                <div className="mt-2 text-right">
                    <button onClick={async () => {
                        if (!title.trim() || !description.trim() || !time.trim()) return;
                        try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(API_ENDPOINTS.COUNCILLOR_EVENTS, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title, description, time, location }) });
                            const data = await res.json();
                            if (res.ok && data.success) {
                                setTitle(''); setDescription(''); setTime(''); setLocation('');
                                setMine(prev => [data.item, ...prev]);
                                Swal.fire({ toast: true, icon: 'success', title: 'Event created', timer: 2000, position: 'top-end', showConfirmButton: false });
                            }
                        } catch { }
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
                                    <button onClick={async () => {
                                        const nt = prompt('New title', e.title) || e.title;
                                        const nd = prompt('New description', e.description) || e.description;
                                        const ntime = prompt('New time (YYYY-MM-DDTHH:mm)', e.time?.slice?.(0, 16) || '') || e.time;
                                        const nloc = prompt('New location', e.location || '') || e.location;
                                        const token = localStorage.getItem('token');
                                        const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_EVENTS}/${e._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: nt, description: nd, time: ntime, location: nloc }) });
                                        const data = await res.json();
                                        if (res.ok && data.success) setMine(prev => prev.map(x => x._id === e._id ? data.item : x));
                                    }} className="px-3 py-1 border rounded">Edit</button>
                                    <button onClick={async () => {
                                        const token = localStorage.getItem('token');
                                        const res = await fetch(`${API_ENDPOINTS.COUNCILLOR_EVENTS}/${e._id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
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
                const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nSUMMARY:${(e.title || 'Event').replace(/\n/g, ' ')}\nDESCRIPTION:${(e.description || '').replace(/\n/g, ' ')}\nLOCATION:${(e.location || '').replace(/\n/g, ' ')}\nEND:VEVENT\nEND:VCALENDAR`;
                const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                return (
                    <div key={e._id} className="border rounded-md p-4 bg-gray-50 flex items-start justify-between">
                        <div>
                            <div className="font-semibold">{e.title} <span className="text-xs text-gray-500">(by {e.createdByRole === 'president' ? 'President' : 'Authority'})</span></div>
                            <div className="text-sm text-gray-700">{e.description}</div>
                            <div className="text-xs text-gray-500 mt-1">{start.toLocaleString()} • {e.location}</div>
                        </div>
                        <a href={url} download={`${e.title || 'event'}.ics`} className="text-blue-600 text-sm underline">Add to Calendar</a>
                    </div>
                );
            })}
            {items.length === 0 && <div className="text-sm text-gray-500">No upcoming events.</div>}
        </div>
    );
};

const VerificationTab: React.FC = () => {
    const [citizens, setCitizens] = useState<any[]>([]);
    const [pastMembers, setPastMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showPastMembers, setShowPastMembers] = useState(false);
    const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
    const [removalReason, setRemovalReason] = useState<'death' | 'relocation' | 'other'>('relocation');
    const [removalComments, setRemovalComments] = useState('');
    const [deathCertificate, setDeathCertificate] = useState<File | null>(null);
    const [removing, setRemoving] = useState(false);
    const [loadingPastMembers, setLoadingPastMembers] = useState(false);

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
            const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}/../councillors/ward/citizens?${params.toString()}`.replace('/users/..', ''), {
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

    const fetchPastMembers = async () => {
        setLoadingPastMembers(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}/../councillors/ward/past-members`.replace('/users/..', ''), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setPastMembers(data.pastMembers || []);
            } else {
                setPastMembers([]);
            }
        } catch (e) {
            console.error('Failed to fetch past members', e);
            setPastMembers([]);
        } finally {
            setLoadingPastMembers(false);
        }
    };

    const verifyCitizen = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}/../councillors/ward/citizens/${id}/verify`.replace('/users/..', ''), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                setCitizens(prev => prev.map(c => c._id === id ? { ...c, isVerified: true } : c));
                Swal.fire({
                    icon: 'success',
                    title: 'Verified!',
                    text: 'Citizen has been successfully verified.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                const error = await res.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Verification Failed',
                    text: error.error || 'Failed to verify citizen',
                    confirmButtonText: 'OK'
                });
            }
        } catch (e) {
            console.error('Verify failed', e);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to verify citizen. Please try again.',
                confirmButtonText: 'OK'
            });
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

        // Show confirmation dialog
        const confirmResult = await Swal.fire({
            title: 'Confirm Removal',
            html: `
                <div class="text-left">
                    <p class="mb-3">Are you sure you want to remove <strong>${selectedCitizen.name}</strong>?</p>
                    <p class="mb-2"><strong>Reason:</strong> ${removalReason.charAt(0).toUpperCase() + removalReason.slice(1)}</p>
                    ${removalComments ? `<p class="mb-2"><strong>Comments:</strong> ${removalComments}</p>` : ''}
                    <p class="text-sm text-gray-600 mt-3">This action cannot be undone. The citizen will be moved to past members.</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Remove Citizen',
            cancelButtonText: 'Cancel',
            width: '500px'
        });

        if (!confirmResult.isConfirmed) {
            return;
        }

        setRemoving(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('removalReason', removalReason);
            formData.append('removalComments', removalComments);

            if (deathCertificate) {
                formData.append('deathCertificate', deathCertificate);
            }

            const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}/../councillors/ward/citizens/${selectedCitizen._id}`.replace('/users/..', ''), {
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

                Swal.fire({
                    icon: 'success',
                    title: 'Citizen Removed',
                    text: `${selectedCitizen.name} has been successfully removed and moved to past members.`,
                    timer: 3000,
                    showConfirmButton: false
                });
            } else {
                const error = await res.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Removal Failed',
                    text: error.error || 'Failed to remove citizen',
                    confirmButtonText: 'OK'
                });
            }
        } catch (e) {
            console.error('Remove failed', e);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to remove citizen. Please try again.',
                confirmButtonText: 'OK'
            });
        } finally {
            setRemoving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <h3 className="font-bold text-xl text-gray-800">
                        {showPastMembers ? 'Past Members' : 'Citizen Verification'}
                    </h3>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => {
                                setShowPastMembers(false);
                                setPage(1);
                                fetchCitizens();
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!showPastMembers
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Current Citizens
                        </button>
                        <button
                            onClick={() => {
                                setShowPastMembers(true);
                                fetchPastMembers();
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${showPastMembers
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Past Members
                        </button>
                    </div>
                </div>
                {!showPastMembers && (
                    <div className="flex space-x-2">
                        <select value={filter} onChange={e => { setFilter(e.target.value as any); setPage(1); }} className="border rounded-md px-3 py-2 text-sm">
                            <option value="all">All</option>
                            <option value="unverified">Unverified</option>
                            <option value="verified">Verified</option>
                        </select>
                        <div className="relative">
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name/email/address" className="border rounded-md px-3 py-2 text-sm w-64" />
                        </div>
                        <button onClick={() => { setPage(1); fetchCitizens(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Search</button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            {showPastMembers ? (
                                <>
                                    <th className="px-4 py-3 text-left">Name</th>
                                    <th className="px-4 py-3 text-left">Email</th>
                                    <th className="px-4 py-3 text-left">Address</th>
                                    <th className="px-4 py-3 text-left">Removal Reason</th>
                                    <th className="px-4 py-3 text-left">Removed Date</th>
                                    <th className="px-4 py-3 text-left">Death Certificate</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-4 py-3 text-left">Name</th>
                                    <th className="px-4 py-3 text-left">Email</th>
                                    <th className="px-4 py-3 text-left">Address</th>
                                    <th className="px-4 py-3 text-left">Ward</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">ID Proof</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {showPastMembers ? (
                            loadingPastMembers ? (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Loading past members...</td></tr>
                            ) : pastMembers.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No past members found.</td></tr>
                            ) : (
                                pastMembers.map(member => (
                                    <tr key={member._id}>
                                        <td className="px-4 py-3 font-medium text-gray-800">{member.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{member.email}</td>
                                        <td className="px-4 py-3 text-gray-600">{member.address || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${member.removalReason === 'death' ? 'bg-red-100 text-red-700' :
                                                member.removalReason === 'relocation' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {member.removalReason.charAt(0).toUpperCase() + member.removalReason.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {new Date(member.removedAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {member.deathCertificateUrl ? (
                                                <button
                                                    onClick={() => window.open(member.deathCertificateUrl, '_blank')}
                                                    className="text-blue-600 hover:underline text-xs"
                                                >
                                                    View Certificate
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-500">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'Member Details',
                                                        html: `
                                                            <div class="text-left">
                                                                <p><strong>Name:</strong> ${member.name}</p>
                                                                <p><strong>Email:</strong> ${member.email}</p>
                                                                <p><strong>Phone:</strong> ${member.phone || 'Not provided'}</p>
                                                                <p><strong>Address:</strong> ${member.address || 'Not provided'}</p>
                                                                <p><strong>Ward:</strong> ${member.ward}</p>
                                                                <p><strong>Panchayath:</strong> ${member.panchayath}</p>
                                                                <p><strong>Removal Reason:</strong> ${member.removalReason.charAt(0).toUpperCase() + member.removalReason.slice(1)}</p>
                                                                <p><strong>Removed By:</strong> ${member.removedBy.councillorName}</p>
                                                                <p><strong>Removed Date:</strong> ${new Date(member.removedAt).toLocaleString('en-IN')}</p>
                                                                <p><strong>Original Registration:</strong> ${new Date(member.originalRegistrationDate).toLocaleDateString('en-IN')}</p>
                                                                ${member.removalComments ? `<p><strong>Comments:</strong> ${member.removalComments}</p>` : ''}
                                                            </div>
                                                        `,
                                                        width: '600px',
                                                        confirmButtonText: 'Close'
                                                    });
                                                }}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )
                        ) : (
                            loading ? (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Loading citizens...</td></tr>
                            ) : citizens.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No citizens found.</td></tr>
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
                                                    Verify
                                                </button>
                                            )}
                                            <button onClick={() => openRemoveModal(c)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium">
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {!showPastMembers && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
                    <div className="space-x-2">
                        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50">Previous</button>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50">Next</button>
                    </div>
                </div>
            )}

            {/* Enhanced Removal Modal */}
            {showRemoveModal && selectedCitizen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 border-2 border-gray-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">Remove Citizen</h3>
                                    <p className="text-red-100 text-sm mt-1">This action will move the citizen to past members</p>
                                </div>
                                <button
                                    onClick={() => setShowRemoveModal(false)}
                                    className="text-white hover:text-red-200 text-xl bg-red-500 hover:bg-red-600 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                                <p className="text-sm text-gray-600 mb-1">Removing Citizen:</p>
                                <p className="font-semibold text-gray-800">{selectedCitizen.name}</p>
                                <p className="text-sm text-gray-600">{selectedCitizen.email}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason for Removal
                                </label>
                                <select
                                    value={removalReason}
                                    onChange={(e) => setRemovalReason(e.target.value as any)}
                                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                >
                                    <option value="relocation">Relocation</option>
                                    <option value="death">Death</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {removalReason === 'death' && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <label className="block text-sm font-semibold text-red-700 mb-2">
                                        Death Certificate <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setDeathCertificate(e.target.files?.[0] || null)}
                                        className="w-full border-2 border-red-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                        required
                                    />
                                    <p className="text-xs text-red-600 mt-2">
                                        Upload death certificate (PDF or image). This is required for death cases.
                                    </p>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Additional Comments (Optional)
                                </label>
                                <textarea
                                    value={removalComments}
                                    onChange={(e) => setRemovalComments(e.target.value)}
                                    placeholder="Provide additional details about the removal..."
                                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm h-24 resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowRemoveModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                    disabled={removing}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRemoveCitizen}
                                    disabled={removing || (removalReason === 'death' && !deathCertificate)}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {removing ? 'Removing...' : 'Remove Citizen'}
                                </button>
                            </div>
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
    const [acting, setActing] = useState<{ [id: string]: string | undefined }>({});
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    const fetchWardComplaints = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}/../grievances/community`.replace('/users/..', ''), {
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
                    attachments: g.attachments || [],
                    videoProofRequests: (g.videoProofRequests || []).map((req: any) => ({
                        id: req._id?.toString() || req.id,
                        requestedBy: req.requestedBy,
                        requestedByName: req.requestedByName,
                        requestedAt: req.requestedAt,
                        message: req.message,
                        status: req.status,
                        videoUrl: req.videoUrl,
                        uploadedAt: req.uploadedAt,
                        rejectionReason: req.rejectionReason
                    }))
                }));
                mapped.sort((a: any, b: any) => (b.priorityScore - a.priorityScore) || ((b.duplicateCount || 0) - (a.duplicateCount || 0)) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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

    useEffect(() => {
        fetchWardComplaints();
    }, [user?.ward]);

    const updateStatus = async (id: string, status: 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected') => {
        try {
            setActing(prev => ({ ...prev, [id]: status }));
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/grievances/${id}/status`, {
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
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/grievances/${id}/verify/auto`, {
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

    const handleRequestVideoProof = async (complaintId: string) => {
        try {
            const result = await Swal.fire({
                title: 'Request Video Evidence',
                text: 'Enter a message for the citizen explaining why additional video evidence is needed:',
                input: 'textarea',
                inputPlaceholder: 'Please provide additional video evidence to help us better understand and resolve this issue...',
                inputValue: 'Please provide additional video evidence to help us better understand and resolve this issue.',
                showCancelButton: true,
                confirmButtonText: 'Send Request',
                confirmButtonColor: '#7c3aed',
                cancelButtonText: 'Cancel',
                inputValidator: (value) => {
                    if (!value || value.trim().length < 10) {
                        return 'Please enter a message with at least 10 characters';
                    }
                }
            });

            if (result.isConfirmed && result.value) {
                setActing(prev => ({ ...prev, [complaintId]: 'requesting' }));

                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/grievances/${complaintId}/request-video-proof`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: result.value.trim() })
                });

                if (response.ok) {
                    await Swal.fire({
                        title: 'Request Sent!',
                        text: 'The citizen has been notified and will receive your request for additional video evidence.',
                        icon: 'success',
                        confirmButtonColor: '#7c3aed'
                    });

                    // Refresh complaints to show the new request
                    fetchWardComplaints();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to send request');
                }
            }
        } catch (error) {
            console.error('Error requesting video proof:', error);
            await Swal.fire({
                title: 'Error',
                text: error instanceof Error ? error.message : 'Failed to send video proof request. Please try again.',
                icon: 'error',
                confirmButtonColor: '#7c3aed'
            });
        } finally {
            setActing(prev => ({ ...prev, [complaintId]: undefined }));
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
                                        {c.videoProofRequests && c.videoProofRequests.length > 0 && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-3">
                                                <i className="fas fa-video mr-1"></i>
                                                {c.videoProofRequests.filter(req => req.status === 'uploaded').length > 0 ? (
                                                    <>
                                                        <i className="fas fa-check-circle mr-1"></i>
                                                        {c.videoProofRequests.filter(req => req.status === 'uploaded').length} video{c.videoProofRequests.filter(req => req.status === 'uploaded').length > 1 ? 's' : ''}
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-clock mr-1"></i>
                                                        {c.videoProofRequests.filter(req => req.status === 'pending').length} pending
                                                    </>
                                                )}
                                            </span>
                                        )}
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
                                    <button className="px-3 py-2 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white text-left" onClick={() => handleRequestVideoProof(selectedComplaint.id)}>
                                        <i className="fas fa-video mr-2"></i>
                                        Request Extra Video Evidence
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Video Proof Requests Section */}
                        {selectedComplaint.videoProofRequests && selectedComplaint.videoProofRequests.length > 0 && (
                            <div className="mt-6 border-t pt-6">
                                <h5 className="text-lg font-semibold mb-4 flex items-center">
                                    <i className="fas fa-video mr-2 text-purple-600"></i>
                                    Video Evidence Requests ({selectedComplaint.videoProofRequests.length})
                                </h5>
                                <div className="space-y-4">
                                    {selectedComplaint.videoProofRequests.map((request, index) => (
                                        <div key={request.id || index} className="bg-gray-50 rounded-lg p-4 border">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center text-sm text-gray-600 mb-2">
                                                        <span className="font-medium">Requested by: {request.requestedByName}</span>
                                                        <span className="mx-2">•</span>
                                                        <span>{new Date(request.requestedAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mb-2">
                                                        <strong>Message:</strong> {request.message}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    request.status === 'uploaded' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    <i className={`fas ${request.status === 'pending' ? 'fa-clock' :
                                                        request.status === 'uploaded' ? 'fa-check-circle' :
                                                            'fa-times-circle'
                                                        } mr-1`}></i>
                                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                </span>
                                            </div>

                                            {request.status === 'uploaded' && request.videoUrl && (
                                                <div className="bg-white rounded-md p-3 border border-green-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center text-green-700">
                                                            <i className="fas fa-video mr-2"></i>
                                                            <span className="font-medium">Video Evidence Uploaded</span>
                                                            {request.uploadedAt && (
                                                                <span className="ml-2 text-sm text-green-600">
                                                                    on {new Date(request.uploadedAt).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <a
                                                                href={request.videoUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                                                            >
                                                                <i className="fas fa-play mr-1"></i>
                                                                View Video
                                                            </a>
                                                            <a
                                                                href={request.videoUrl}
                                                                download
                                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                                                            >
                                                                <i className="fas fa-download mr-1"></i>
                                                                Download
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {request.status === 'pending' && (
                                                <div className="bg-yellow-50 rounded-md p-3 border border-yellow-200">
                                                    <div className="flex items-center text-yellow-700">
                                                        <i className="fas fa-clock mr-2"></i>
                                                        <span className="text-sm">Waiting for citizen to upload video evidence...</span>
                                                    </div>
                                                </div>
                                            )}

                                            {request.status === 'rejected' && request.rejectionReason && (
                                                <div className="bg-red-50 rounded-md p-3 border border-red-200">
                                                    <div className="flex items-center text-red-700">
                                                        <i className="fas fa-times-circle mr-2"></i>
                                                        <span className="text-sm">
                                                            <strong>Rejected:</strong> {request.rejectionReason}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const WelfareQueue: React.FC = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState<WelfareApplication[]>([]);
    const [loadingScores, setLoadingScores] = useState<{ [key: string]: boolean }>({});
    const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
    const [selectedScheme, setSelectedScheme] = useState<WelfareScheme | null>(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [verifying, setVerifying] = useState<{ [key: string]: boolean }>({});
    const [verificationInfo, setVerificationInfo] = useState<{ [key: string]: { status: string; score?: number; remarks?: string } }>({});
    const [selectedApplication, setSelectedApplication] = useState<any>(null);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [loadingSchemes, setLoadingSchemes] = useState(true);
    const [loadingApplications, setLoadingApplications] = useState(false);

    // Load ongoing schemes (active and not expired)
    useEffect(() => {
        const fetchOngoingSchemes = async () => {
            try {
                setLoadingSchemes(true);
                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes?status=active`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('Schemes API response:', data);
                    const now = new Date();
                    // Filter for ongoing schemes (active status and not expired)
                    const ongoingSchemes = (data.schemes || []).filter((s: any) => {
                        if (!s.applicationDeadline || !s.endDate) return false;
                        const deadline = new Date(s.applicationDeadline);
                        const endDate = new Date(s.endDate);
                        return s.status === 'active' && deadline > now && endDate > now;
                    }).map((s: any) => ({
                        ...s,
                        id: s._id || s.id // Ensure id field exists
                    }));
                    setSchemes(ongoingSchemes);
                }
            } catch (e) {
                console.error('Failed to load ongoing schemes', e);
            } finally {
                setLoadingSchemes(false);
            }
        };
        fetchOngoingSchemes();
    }, [user?.id]);

    // Fetch applications for selected scheme
    useEffect(() => {
        const fetchApplications = async () => {
            if (!selectedScheme) {
                setApplications([]);
                return;
            }

            try {
                setLoadingApplications(true);
                const token = localStorage.getItem('token');
                console.log('User info:', user);
                console.log('Token exists:', !!token);
                const params = new URLSearchParams();
                if (user?.ward) params.append('ward', String(user.ward));
                const schemeId = selectedScheme.id || (selectedScheme as any)._id;
                params.append('schemeId', schemeId);
                const url = `${import.meta.env.VITE_BACKEND_URL}/api/welfare/applications?${params.toString()}`;
                console.log('Fetching applications from:', url);
                console.log('Selected scheme:', selectedScheme);
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Applications API response:', data);
                    const statusMap: Record<string, ApplicationStatus> = {
                        pending: ApplicationStatus.PENDING,
                        under_review: ApplicationStatus.UNDER_REVIEW,
                        approved: ApplicationStatus.APPROVED,
                        rejected: ApplicationStatus.REJECTED,
                        completed: ApplicationStatus.COMPLETED,
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
                            caste: a.personalDetails?.caste || '',
                            incomeCategory: a.personalDetails?.incomeCategory || '',
                            ownsLand: !!a.personalDetails?.ownsLand,
                            status: statusMap[(a.status || 'pending').toLowerCase()] || ApplicationStatus.PENDING,
                            createdAt: a.appliedAt,
                            score: a.score,
                            justification: a.justification,
                            documents: a.documents || [],
                        }));
                    console.log('Mapped applications:', mapped);
                    setApplications(mapped);
                } else {
                    console.error('Failed to fetch applications:', response.status, response.statusText);
                    const errorData = await response.text();
                    console.error('Error response:', errorData);
                    setApplications([]);
                }
            } catch (err) {
                console.error('Error fetching applications:', err);
                setApplications([]);
            } finally {
                setLoadingApplications(false);
            }
        };

        fetchApplications();
    }, [user?.id, user?.ward, selectedScheme]);

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

    const handleVerification = async (appId: string, approve: boolean, remarks: string = '') => {
        // Show confirmation dialog
        const result = await Swal.fire({
            title: approve ? 'Approve Application?' : 'Reject Application?',
            text: approve
                ? 'Are you sure you want to approve this application? This action cannot be undone.'
                : 'Are you sure you want to reject this application? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: approve ? '#10b981' : '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: approve ? 'Yes, Approve!' : 'Yes, Reject!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            setVerifying(prev => ({ ...prev, [appId]: true }));
            const token = localStorage.getItem('token');

            // Use the review endpoint to approve/reject applications
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/applications/${appId}/review`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: approve ? 'approved' : 'rejected',
                    reviewComments: remarks || (approve ? 'Application approved by councillor' : 'Application rejected by councillor')
                })
            });

            if (resp.ok) {
                const data = await resp.json();
                console.log('Application review response:', data);

                // Update the application status in the local state
                setApplications(prev => prev.map(app =>
                    app.id === appId
                        ? {
                            ...app,
                            status: approve ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED
                        }
                        : app
                ));

                // Show success message
                const message = approve ? 'Application approved successfully!' : 'Application rejected successfully!';
                console.log(message);

                // Show success notification
                Swal.fire({
                    icon: 'success',
                    title: approve ? 'Approved!' : 'Rejected!',
                    text: message,
                    timer: 2000,
                    showConfirmButton: false
                });

            } else {
                console.error('Failed to review application:', resp.status, resp.statusText);
                const errorData = await resp.text();
                console.error('Error response:', errorData);

                // Show error notification
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to process application. Please try again.',
                    confirmButtonText: 'OK'
                });
            }
        } catch (e) {
            console.error('Application review failed', e);

            // Show error notification
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'An error occurred while processing the application. Please try again.',
                confirmButtonText: 'OK'
            });
        } finally {
            setVerifying(prev => ({ ...prev, [appId]: false }));
        }
    };

    const autoVerify = async (appId: string) => {
        try {
            setVerifying(prev => ({ ...prev, [appId]: true }));
            const token = localStorage.getItem('token');
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/applications/${appId}/auto-verify`, {
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

    const exportApplicationsCSV = () => {
        const headers = ['Scheme', 'Applicant', 'Income', 'Dependents', 'Status', 'Score', 'Applied At'];
        const rows = sortedApplications.map(a => [
            a.schemeTitle,
            a.userName,
            a.familyIncome || 0,
            a.dependents || 0,
            a.status,
            a.score ?? '',
            a.createdAt ? new Date(a.createdAt).toLocaleString() : ''
        ]);
        const csv = [headers, ...rows].map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = selectedScheme ? `applications_${selectedScheme.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv` : 'applications.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const appAnalytics = (() => {
        const total = sortedApplications.length;
        const withScores = sortedApplications.filter(a => a.score !== undefined);
        const avgScore = withScores.length ? (withScores.reduce((s, a) => s + (a.score as number), 0) / withScores.length) : 0;
        const approved = sortedApplications.filter(a => a.status === ApplicationStatus.APPROVED).length;
        const rejected = sortedApplications.filter(a => a.status === ApplicationStatus.REJECTED).length;
        const pending = sortedApplications.filter(a => a.status === ApplicationStatus.PENDING).length;
        // top by score
        const top = [...withScores].sort((a, b) => (b.score as number) - (a.score as number)).slice(0, 5);
        return { total, avgScore, approved, rejected, pending, top };
    })();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">
                            <i className="fas fa-hands-helping mr-3"></i>
                            Welfare Application Management
                        </h3>
                        <p className="text-blue-100">Manage applications for ongoing welfare schemes</p>
                    </div>
                    <div className="flex space-x-3">
                        {selectedScheme && (
                            <>
                                <button
                                    onClick={exportApplicationsCSV}
                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm"
                                >
                                    <i className="fas fa-download mr-2"></i>
                                    Export Applications
                                </button>
                                <button
                                    onClick={() => setShowAnalytics(true)}
                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm"
                                >
                                    <i className="fas fa-chart-bar mr-2"></i>
                                    View Analytics
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Scheme Selection or Application Management */}
            {!selectedScheme ? (
                // Scheme Selection View
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <i className="fas fa-list-alt mr-3 text-blue-600"></i>
                            Select a Welfare Scheme
                        </h4>
                        <p className="text-gray-600 text-sm mt-1">Choose a scheme to view and manage its applications</p>
                    </div>

                    <div className="p-6">
                        {loadingSchemes ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-gray-600">Loading ongoing schemes...</span>
                            </div>
                        ) : schemes.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">
                                    <i className="fas fa-inbox"></i>
                                </div>
                                <h5 className="text-lg font-medium text-gray-600 mb-2">No Ongoing Schemes</h5>
                                <p className="text-gray-500">There are currently no active welfare schemes with open applications.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {schemes.map((scheme) => (
                                    <div
                                        key={scheme.id}
                                        onClick={() => setSelectedScheme(scheme)}
                                        className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h5 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                                                    {scheme.title}
                                                </h5>
                                                <p className="text-sm text-gray-500 mt-1 capitalize">
                                                    {scheme.category} • {scheme.scope}
                                                </p>
                                            </div>
                                            <div className="ml-3">
                                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                                                    <i className="fas fa-hands-helping text-blue-600 text-lg"></i>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {scheme.description}
                                        </p>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Age Range:</span>
                                                <span className="font-medium text-gray-700">{scheme.minAge} - {scheme.maxAge} years</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Total Slots:</span>
                                                <span className="font-medium text-gray-700">{scheme.totalSlots}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Deadline:</span>
                                                <span className="font-medium text-gray-700">
                                                    {scheme.applicationDeadline ? new Date(scheme.applicationDeadline).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                                                <span>View Applications</span>
                                                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform duration-200"></i>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Application Management View
                <div className="space-y-6">
                    {/* Selected Scheme Header */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setSelectedScheme(null)}
                                        className="mr-4 p-2 hover:bg-white rounded-lg transition-colors duration-200"
                                    >
                                        <i className="fas fa-arrow-left text-gray-600"></i>
                                    </button>
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-800">{selectedScheme.title}</h4>
                                        <p className="text-gray-600 text-sm">{selectedScheme.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 text-sm">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{selectedScheme.totalSlots}</div>
                                        <div className="text-gray-500">Total Slots</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{applications.length}</div>
                                        <div className="text-gray-500">Applications</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Applications List */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                            <h5 className="text-lg font-semibold text-gray-800 flex items-center">
                                <i className="fas fa-users mr-3 text-blue-600"></i>
                                Applications ({applications.length})
                            </h5>
                        </div>

                        <div className="p-6">
                            {loadingApplications ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="ml-3 text-gray-600">Loading applications...</span>
                                </div>
                            ) : applications.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-6xl mb-4">
                                        <i className="fas fa-file-alt"></i>
                                    </div>
                                    <h5 className="text-lg font-medium text-gray-600 mb-2">No Applications Yet</h5>
                                    <p className="text-gray-500">No applications have been submitted for this scheme yet.</p>
                                </div>
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
                                                    <div className="text-xs text-gray-500 mb-3">
                                                        Applied on: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-500">Income:</span>
                                                            <span className="font-medium ml-1">₹{(app.familyIncome || 0).toLocaleString()}/yr</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Caste:</span>
                                                            <span className="font-medium ml-1 capitalize">{app.caste || 'N/A'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Phone:</span>
                                                            <span className="font-medium ml-1">{app.phoneNumber}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Income Category:</span>
                                                            <span className="font-medium ml-1 uppercase">{app.incomeCategory || 'N/A'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Land Owner:</span>
                                                            <span className="font-medium ml-1">{app.ownsLand ? 'Yes' : 'No'}</span>
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
                                                    {/* Application Status */}
                                                    <div className="text-center">
                                                        <p className="text-sm text-gray-500 mb-1">Status</p>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${app.status === ApplicationStatus.APPROVED
                                                            ? 'bg-green-100 text-green-800'
                                                            : app.status === ApplicationStatus.REJECTED
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {app.status === ApplicationStatus.APPROVED ? 'Approved' :
                                                                app.status === ApplicationStatus.REJECTED ? 'Rejected' : 'Pending'}
                                                        </span>
                                                    </div>

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
                                                        <button
                                                            onClick={() => handleVerification(app.id, true, '')}
                                                            disabled={!!verifying[app.id] || app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.REJECTED}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-60"
                                                        >
                                                            <i className="fas fa-check mr-2"></i>
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerification(app.id, false, '')}
                                                            disabled={!!verifying[app.id] || app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.REJECTED}
                                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-60"
                                                        >
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
                    </div>
                </div>
            )}

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
                                        <div className="h-full bg-green-500" style={{ width: `${pct(appAnalytics.approved)}%` }} title={`Approved ${appAnalytics.approved}`}></div>
                                        <div className="h-full bg-red-500" style={{ width: `${pct(appAnalytics.rejected)}%` }} title={`Rejected ${appAnalytics.rejected}`}></div>
                                        <div className="h-full bg-yellow-500" style={{ width: `${pct(appAnalytics.pending)}%` }} title={`Pending ${appAnalytics.pending}`}></div>
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
                                        <div className="w-6 text-sm text-gray-500">{i + 1}</div>
                                        <div className="flex-1">
                                            <div className="truncate text-sm">{a.userName} — <span className="text-gray-500">{a.schemeTitle}</span></div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${Math.min((a.score ?? 0) * 10, 100)}%` }}></div>
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
        minAge: '',
        maxAge: '',
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

        // Age validation
        const minAge = asInt(String(values.minAge));
        const maxAge = asInt(String(values.maxAge));
        if (!Number.isFinite(minAge) || minAge < 0 || minAge > 120) errs.minAge = 'Minimum age must be between 0 and 120.';
        if (!Number.isFinite(maxAge) || maxAge < 0 || maxAge > 120) errs.maxAge = 'Maximum age must be between 0 and 120.';
        if (Number.isFinite(minAge) && Number.isFinite(maxAge) && minAge > maxAge) errs.maxAge = 'Maximum age must be greater than or equal to minimum age.';

        if (trim(values.benefits).length < 10) errs.benefits = 'Describe key benefits (min 10 chars).';

        // Required documents validation
        const ALLOWED = [
            'Aadhar Card', 'Ration Card', 'Voter ID', 'Driving License', 'PAN Card', 'Passport', 'Disability Certificate', 'Income Certificate', 'Caste Certificate', 'Residence Certificate', 'BPL Card', 'Senior Citizen ID', 'Widow Certificate', 'Death Certificate'
        ];
        const docs = (values.requiredDocuments || []).map(d => trim(d)).filter(Boolean);
        if (docs.length === 0) errs.requiredDocuments = 'At least one required document is mandatory.';
        if (docs.some(d => !ALLOWED.includes(d))) errs.requiredDocuments = 'Select valid Indian document types only.';

        const slots = asInt(String(values.totalSlots));
        if (!Number.isFinite(slots) || slots < 1) errs.totalSlots = 'Total slots must be a positive integer.';

        const today = new Date(); today.setHours(0, 0, 0, 0);
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
    }, [formData.startDate, formData.endDate, formData.applicationDeadline, formData.totalSlots, formData.minAge, formData.maxAge]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // mark all fields as touched to show errors
        setTouched({
            title: true,
            category: true,
            description: true,
            minAge: true,
            maxAge: true,
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
                minAge: parseInt(formData.minAge),
                maxAge: parseInt(formData.maxAge),
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

            console.log('Sending request to:', `${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes`);
            console.log('Request data:', requestData);

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes`, {
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
                    minAge: '',
                    maxAge: '',
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
        <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mb-8 text-white">
                <div className="flex items-center mb-4">
                    <div className="bg-white/20 rounded-full p-3 mr-4">
                        <i className="fas fa-plus-circle text-2xl"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl mb-1">Create New Welfare Scheme</h3>
                        <p className="text-blue-100">Design a comprehensive welfare program for your ward residents</p>
                    </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center text-sm">
                        <i className="fas fa-info-circle mr-2"></i>
                        <span>Once created, you can review and publish the scheme to make it visible to citizens</span>
                    </div>
                </div>
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

            {/* Form Container */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                        <i className="fas fa-clipboard-list text-blue-600 mr-3"></i>
                        Scheme Details
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">Fill in the comprehensive details for your welfare scheme</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
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
                    {/* Basic Information Section */}
                    <div className="space-y-6">
                        <div className="flex items-center mb-4">
                            <div className="bg-blue-100 rounded-full p-2 mr-3">
                                <i className="fas fa-info-circle text-blue-600"></i>
                            </div>
                            <h5 className="text-lg font-semibold text-gray-800">Basic Information</h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <i className="fas fa-tag text-gray-400 mr-2"></i>
                                    Scheme Title *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        required
                                        disabled={!tokenValid}
                                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                                        placeholder="e.g., Free Sewing Machines for Women"
                                    />
                                    <i className="fas fa-edit absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                </div>
                                {touched.title && fieldErrors.title && <p className="mt-1 text-sm text-red-600 flex items-center"><i className="fas fa-exclamation-circle mr-1"></i>{fieldErrors.title}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <i className="fas fa-layer-group text-gray-400 mr-2"></i>
                                    Category *
                                </label>
                                <div className="relative">
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        required
                                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
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
                                    <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                    <i className="fas fa-folder absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                </div>
                                {touched.category && fieldErrors.category && <p className="mt-1 text-sm text-red-600 flex items-center"><i className="fas fa-exclamation-circle mr-1"></i>{fieldErrors.category}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 flex items-center">
                            <i className="fas fa-align-left text-gray-400 mr-2"></i>
                            Description *
                        </label>
                        <div className="relative">
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                required
                                rows={4}
                                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                placeholder="Provide a detailed description of the welfare scheme, including its objectives and scope..."
                            />
                            <i className="fas fa-file-alt absolute left-3 top-4 text-gray-400"></i>
                        </div>
                        {touched.description && fieldErrors.description && <p className="mt-1 text-sm text-red-600 flex items-center"><i className="fas fa-exclamation-circle mr-1"></i>{fieldErrors.description}</p>}
                    </div>

                    {/* Eligibility Section */}
                    <div className="space-y-6">
                        <div className="flex items-center mb-4">
                            <div className="bg-green-100 rounded-full p-2 mr-3">
                                <i className="fas fa-user-check text-green-600"></i>
                            </div>
                            <h5 className="text-lg font-semibold text-gray-800">Eligibility Criteria</h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <i className="fas fa-arrow-up text-gray-400 mr-2"></i>
                                    Minimum Age *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="minAge"
                                        value={formData.minAge}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        required
                                        min="0"
                                        max="120"
                                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="e.g., 18"
                                    />
                                    <i className="fas fa-calendar-plus absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                </div>
                                {touched.minAge && fieldErrors.minAge && <p className="mt-1 text-sm text-red-600 flex items-center"><i className="fas fa-exclamation-circle mr-1"></i>{fieldErrors.minAge}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <i className="fas fa-arrow-down text-gray-400 mr-2"></i>
                                    Maximum Age *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="maxAge"
                                        value={formData.maxAge}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        required
                                        min="0"
                                        max="120"
                                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="e.g., 65"
                                    />
                                    <i className="fas fa-calendar-minus absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                </div>
                                {touched.maxAge && fieldErrors.maxAge && <p className="mt-1 text-sm text-red-600 flex items-center"><i className="fas fa-exclamation-circle mr-1"></i>{fieldErrors.maxAge}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Benefits Section */}
                    <div className="space-y-6">
                        <div className="flex items-center mb-4">
                            <div className="bg-purple-100 rounded-full p-2 mr-3">
                                <i className="fas fa-gift text-purple-600"></i>
                            </div>
                            <h5 className="text-lg font-semibold text-gray-800">Benefits & Rewards</h5>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                <i className="fas fa-star text-gray-400 mr-2"></i>
                                Benefits *
                            </label>
                            <div className="relative">
                                <textarea
                                    name="benefits"
                                    value={formData.benefits}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                    placeholder="Describe the specific benefits, rewards, or assistance that recipients will receive from this scheme..."
                                />
                                <i className="fas fa-heart absolute left-3 top-4 text-gray-400"></i>
                            </div>
                            {touched.benefits && fieldErrors.benefits && <p className="mt-1 text-sm text-red-600 flex items-center"><i className="fas fa-exclamation-circle mr-1"></i>{fieldErrors.benefits}</p>}
                        </div>
                    </div>

                    {/* Required Documents Section */}
                    <div className="space-y-6">
                        <div className="flex items-center mb-4">
                            <div className="bg-orange-100 rounded-full p-2 mr-3">
                                <i className="fas fa-file-alt text-orange-600"></i>
                            </div>
                            <h5 className="text-lg font-semibold text-gray-800">Required Documents</h5>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                <i className="fas fa-clipboard-list text-gray-400 mr-2"></i>
                                Document Requirements
                            </label>

                            <div className="space-y-3">
                                {(formData.requiredDocuments || []).map((doc: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex-1 relative">
                                            <select
                                                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
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
                                            <i className="fas fa-file absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                            <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                        </div>
                                        {(formData.requiredDocuments || []).length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => {
                                                    const next: any = { ...prev };
                                                    next.requiredDocuments = (next.requiredDocuments || []).filter((_: any, i: number) => i !== idx);
                                                    return next;
                                                })}
                                                className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200 flex items-center"
                                            >
                                                <i className="fas fa-trash mr-2"></i>
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center">
                                {touched.requiredDocuments && fieldErrors.requiredDocuments && (
                                    <p className="text-sm text-red-600 flex items-center"><i className="fas fa-exclamation-circle mr-1"></i>{fieldErrors.requiredDocuments}</p>
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
                                    className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors duration-200 flex items-center font-medium"
                                >
                                    <i className="fas fa-plus mr-2"></i>
                                    Add Document
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Scheme Configuration Section */}
                    <div className="space-y-6">
                        <div className="flex items-center mb-4">
                            <div className="bg-indigo-100 rounded-full p-2 mr-3">
                                <i className="fas fa-cogs text-indigo-600"></i>
                            </div>
                            <h5 className="text-lg font-semibold text-gray-800">Scheme Configuration</h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <i className="fas fa-users text-gray-400 mr-2"></i>
                                    Total Slots *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="totalSlots"
                                        value={formData.totalSlots}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        required
                                        min="1"
                                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="e.g., 50"
                                    />
                                    <i className="fas fa-hashtag absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                </div>
                                {touched.totalSlots && fieldErrors.totalSlots && <p className="mt-1 text-sm text-red-600 flex items-center"><i className="fas fa-exclamation-circle mr-1"></i>{fieldErrors.totalSlots}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <i className="fas fa-calendar-times text-gray-400 mr-2"></i>
                                    Application Deadline *
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="applicationDeadline"
                                        value={formData.applicationDeadline}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        required
                                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                    <i className="fas fa-calendar-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                </div>
                                {touched.applicationDeadline && fieldErrors.applicationDeadline && <p className="mt-1 text-sm text-red-600 flex items-center"><i className="fas fa-exclamation-circle mr-1"></i>{fieldErrors.applicationDeadline}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <i className="fas fa-play-circle text-gray-400 mr-2"></i>
                                    Start Date *
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        required
                                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                    <i className="fas fa-calendar-plus absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                </div>
                                {touched.startDate && fieldErrors.startDate && <p className="mt-1 text-sm text-red-600 flex items-center"><i className="fas fa-exclamation-circle mr-1"></i>{fieldErrors.startDate}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <i className="fas fa-stop-circle text-gray-400 mr-2"></i>
                                    End Date *
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        onBlur={handleBlur}
                                        required
                                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                    <i className="fas fa-calendar-minus absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                </div>
                                {touched.endDate && fieldErrors.endDate && <p className="mt-1 text-sm text-red-600 flex items-center"><i className="fas fa-exclamation-circle mr-1"></i>{fieldErrors.endDate}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <div className="text-sm text-gray-600 flex items-center">
                                <i className="fas fa-info-circle mr-2"></i>
                                <span>All fields marked with * are required</span>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({
                                        title: '',
                                        description: '',
                                        category: '',
                                        minAge: '',
                                        maxAge: '',
                                        benefits: '',
                                        requiredDocuments: [''],
                                        totalSlots: '',
                                        applicationDeadline: '',
                                        startDate: '',
                                        endDate: ''
                                    })}
                                    className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium flex items-center shadow-lg hover:shadow-xl"
                                >
                                    <i className="fas fa-eraser mr-2"></i>
                                    Clear Form
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !tokenValid}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <Spinner size="sm" />
                                            <span className="ml-2">Creating Scheme...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <i className="fas fa-rocket mr-2"></i>
                                            Create Scheme
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ViewSchemes: React.FC = () => {
    const { user } = useAuth();
    const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
    const [applicationCounts, setApplicationCounts] = useState<{ [key: string]: number }>({});
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

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes`, {
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
                const counts: { [key: string]: number } = {};

                // Fetch application counts for each scheme
                for (const scheme of schemes) {
                    const schemeKey = (scheme as any).id || (scheme as any)._id;
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/applications?schemeId=${schemeKey}&ward=${user?.ward}`, {
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
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes/${schemeId}`, {
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
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes/${schemeId}`, {
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
            applicationDeadline: scheme.applicationDeadline ? new Date(scheme.applicationDeadline).toISOString().slice(0, 10) : '',
            startDate: scheme.startDate ? new Date(scheme.startDate).toISOString().slice(0, 10) : '',
            endDate: scheme.endDate ? new Date(scheme.endDate).toISOString().slice(0, 10) : '',
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
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes/${editingScheme.id}`, {
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
                        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/welfare/schemes/${(sch as any).id}`, {
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
        const headers = ['Title', 'Description', 'Ward', 'Scope', 'Status', 'Total Slots', 'Applications', 'Start Date', 'End Date'];
        const rows = currentSchemes.map(s => [
            s.title,
            (s as any).description || '',
            s.ward ?? '',
            (s as any).scope || '',
            s.status,
            s.totalSlots,
            applicationCounts[(s as any).id] || 0,
            (s as any).startDate ? new Date((s as any).startDate).toLocaleDateString() : 'N/A',
            (s as any).endDate ? new Date((s as any).endDate).toLocaleDateString() : 'N/A'
        ]);
        const csv = [headers, ...rows].map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
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
        const totalApplications = Object.values(applicationCounts).reduce((a, b) => a + (b || 0), 0);
        // applications per scheme (sorted desc, top 7)
        const perScheme = schemes
            .map(s => ({ title: s.title, count: applicationCounts[(s as any).id] || 0 }))
            .sort((a, b) => b.count - a.count)
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
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'active'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <i className="fas fa-play-circle mr-2"></i>
                        Active Schemes ({activeSchemes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'completed'
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
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scheme.status === 'active'
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
                                            <span className="font-medium ml-1">{scheme.createdAt ? new Date(scheme.createdAt).toLocaleDateString() : 'N/A'}</span>
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
                                                <text x="110" y="115" textAnchor="middle" className="fill-gray-800" style={{ fontSize: '28px', fontWeight: 700 }}>{Math.round(activePct * 100)}%</text>
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