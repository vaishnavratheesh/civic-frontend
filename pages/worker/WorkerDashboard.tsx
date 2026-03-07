import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';
import Spinner from '../../components/Spinner';
import { Complaint, ComplaintStatus } from '../../types';

interface Stats {
    tasks: {
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        completionRate: number;
    };
    performance: {
        avgCompletionTimeHours: number;
    };
}

const WorkerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [myTasks, setMyTasks] = useState<Complaint[]>([]);
    const [wardComplaints, setWardComplaints] = useState<Complaint[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeFeedTab, setActiveFeedTab] = useState<'ward' | 'mine'>('mine');

    const workerDataRaw = localStorage.getItem('workerData');
    const workerData = workerDataRaw ? JSON.parse(workerDataRaw) : {};
    const workerName = workerData.name?.split(' ')[0] || 'Worker';
    const workerWard = workerData.ward || 'N/A';

    useEffect(() => {
        fetchData();

        const socket = io(import.meta.env.VITE_BACKEND_URL, { withCredentials: true });
        
        socket.on('connect', () => {
            console.log('Worker Dashboard connected to socket');
            if (workerWard !== 'N/A') {
                socket.emit('join', { ward: workerWard, role: 'worker' });
            }
        });

        socket.on('complaint:update', (data) => {
            console.log('Real-time update received:', data);
            fetchData(); // Refresh all data for consistency
            
            if (data.action === 'Resolved') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `Task Resolved: ${data.complaintId.slice(-6).toUpperCase()}`,
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        });

        socket.on('complaint:progress', (data) => {
            console.log('Progress photo uploaded:', data);
            fetchData();
        });

        return () => {
            socket.disconnect();
        };
    }, [workerWard]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('workerToken');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const [tasksRes, wardRes, statsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_BACKEND_URL}/api/worker/tasks`, { headers }),
                fetch(`${import.meta.env.VITE_BACKEND_URL}/api/worker/ward-complaints`, { headers }),
                fetch(`${import.meta.env.VITE_BACKEND_URL}/api/worker/tasks/stats`, { headers })
            ]);

            if (tasksRes.ok) {
                const data = await tasksRes.json();
                setMyTasks(data.tasks || []);
            }

            if (wardRes.ok) {
                const data = await wardRes.json();
                setWardComplaints(data.complaints || []);
            }

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center">
                <Spinner />
                <p className="text-gray-500 mt-4 animate-pulse">Synchronizing Ward Data...</p>
            </div>
        );
    }

    const pendingMyTasks = myTasks.filter(t => t.status === ComplaintStatus.ASSIGNED || t.status === ComplaintStatus.PENDING);
    const inProgressMyTasks = myTasks.filter(t => t.status === ComplaintStatus.IN_PROGRESS || (t.status as string) === 'InProgress');

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Premium Header */}
            <header className="relative overflow-hidden bg-gradient-to-r from-purple-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-purple-200">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center space-x-2 text-purple-200 text-sm font-medium mb-2">
                            <i className="fas fa-calendar-alt"></i>
                            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Namaste, {workerName}! 👋
                        </h1>
                        <p className="text-purple-100 mt-2 text-lg opacity-90">
                            Service Hub for <span className="font-bold underline decoration-purple-400">Ward {workerWard}</span> • Erumeli Panchayath
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => navigate('/worker/tasks')}
                            className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center shadow-lg"
                        >
                            <i className="fas fa-tasks mr-2"></i> My Schedule
                        </button>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -transtype-x-12 -transtype-y-12 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 transtype-x-12 transtype-y-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl"></div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatMetric 
                    label="Jobs Assigned" 
                    value={stats?.tasks.total || 0} 
                    icon="fas fa-toolbox" 
                    color="purple" 
                    trend={`${stats?.tasks.pending || 0} New`}
                />
                <StatMetric 
                    label="Active Jobs" 
                    value={inProgressMyTasks.length} 
                    icon="fas fa-running" 
                    color="blue" 
                    trend="Working Now"
                />
                <StatMetric 
                    label="Resolved" 
                    value={stats?.tasks.completed || 0} 
                    icon="fas fa-check-double" 
                    color="green" 
                    trend={`${stats?.tasks.completionRate || 0}% Rate`}
                />
                <StatMetric 
                    label="Avg. Time" 
                    value={`${stats?.performance.avgCompletionTimeHours || 0}h`} 
                    icon="fas fa-bolt" 
                    color="orange" 
                    trend="Efficiency"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area - Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-1 bg-gray-50 flex items-center">
                            <button 
                                onClick={() => setActiveFeedTab('mine')}
                                className={`flex-1 py-4 text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${activeFeedTab === 'mine' ? 'bg-white text-purple-700 shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <i className="fas fa-user-circle"></i> My Assignments
                                {pendingMyTasks.length > 0 && <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center ml-1">{pendingMyTasks.length}</span>}
                            </button>
                            <button 
                                onClick={() => setActiveFeedTab('ward')}
                                className={`flex-1 py-4 text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${activeFeedTab === 'ward' ? 'bg-white text-purple-700 shadow-sm ring-1 ring-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <i className="fas fa-broadcast-tower"></i> Live Ward Feed
                                <span className="relative flex h-2 w-2 ml-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                {(activeFeedTab === 'mine' ? myTasks : wardComplaints).slice(0, 10).map((complaint) => (
                                    <ComplaintFeedItem 
                                        key={complaint.id} 
                                        complaint={complaint} 
                                        isMyTask={myTasks.some(t => t.id === complaint.id)}
                                        onClick={() => navigate('/worker/tasks')}
                                    />
                                ))}

                                {(activeFeedTab === 'mine' ? myTasks : wardComplaints).length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <i className="fas fa-file-invoice text-3xl text-gray-200"></i>
                                        </div>
                                        <p className="text-gray-400 font-medium">No activity to show in this section yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - councillor & Updates */}
                <div className="space-y-6">
                    {/* councillor Instructions */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -transtype-x-8 -transtype-y-8"></div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                           <i className="fas fa-comment-dots mr-2 text-yellow-500"></i> councillor Insights
                        </h3>
                        <div className="space-y-4">
                            {myTasks.filter(t => t.assignedTo?.assignmentNotes).slice(0, 3).map((task) => (
                                <div key={task.id} className="p-4 bg-yellow-50/50 rounded-2xl border border-yellow-100 hover:bg-yellow-50 transition-colors">
                                    <p className="text-xs font-bold text-yellow-700 mb-1">{task.assignedTo?.assignedByName || 'Councillor'}</p>
                                    <p className="text-sm text-gray-700 italic">"{task.assignedTo?.assignmentNotes}"</p>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Re: {task.issueType}</p>
                                </div>
                            ))}
                            {myTasks.filter(t => t.assignedTo?.assignmentNotes).length === 0 && (
                                <p className="text-sm text-gray-400 py-2 italic text-center">No specific instructions from the councillor yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Ward Status Card */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl shadow-xl p-6 text-white overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                           <i className="fas fa-shield-alt text-9xl -rotate-12 transtype-x-12 transtype-y-12"></i>
                        </div>
                        <h3 className="text-lg font-bold mb-4 relative z-10">Ward Status</h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-medium">Community Trust</span>
                                <span className="text-green-400 font-bold">Excellent</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full">
                                <div className="bg-green-500 h-full rounded-full w-[85%] shadow-lg shadow-green-500/20"></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                You are among the top workers in Ward {workerWard}. Keep up the great service for our citizens!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatMetric = ({ label, value, icon, color, trend }: any) => {
    const colors = {
        purple: 'bg-purple-50 text-purple-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600',
    };
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
            <div className={`w-14 h-14 rounded-2xl ${(colors as any)[color]} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                <i className={icon}></i>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <div className="flex items-center justify-end space-x-2 mt-1">
                   <p className="text-2xl font-black text-gray-800 tracking-tight">{value}</p>
                </div>
                <p className="text-[10px] font-bold text-purple-500 mt-1">{trend}</p>
            </div>
        </div>
    );
};

const ComplaintFeedItem = ({ complaint, isMyTask, onClick }: { complaint: Complaint, isMyTask: boolean, onClick: () => void }) => {
    const statusMap: any = {
        'Assigned': { color: 'bg-blue-100 text-blue-700', label: 'Allocated' },
        'Pending': { color: 'bg-amber-100 text-amber-700', label: 'Incoming' },
        'In Progress': { color: 'bg-purple-100 text-purple-700', label: 'Processing' },
        'InProgress': { color: 'bg-purple-100 text-purple-700', label: 'Processing' },
        'Resolved': { color: 'bg-green-100 text-green-700', label: 'Success' },
        'Rejected': { color: 'bg-red-100 text-red-700', label: 'Closed' }
    };

    const statusStyle = statusMap[complaint.status] || { color: 'bg-gray-100 text-gray-600', label: complaint.status };

    return (
        <div 
            onClick={onClick}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group ${isMyTask ? 'bg-purple-50/30 border-purple-100 hover:border-purple-200' : 'bg-white border-gray-50 hover:border-gray-200 hover:shadow-sm'}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${statusStyle.color}`}>
                            {statusStyle.label}
                        </span>
                        {isMyTask && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-600 text-white flex items-center gap-1">
                               <i className="fas fa-thumbtack"></i> Mine
                            </span>
                        )}
                        <span className="text-xs text-gray-400 font-medium">#{complaint.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm md:text-base group-hover:text-purple-700 transition-colors line-clamp-1">
                        {complaint.title || complaint.issueType}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{complaint.description}</p>
                    
                    <div className="flex flex-wrap items-center mt-3 gap-3">
                        <div className="flex items-center text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                           <i className="fas fa-map-marker-alt mr-1.5 text-red-400"></i> {complaint.location.address?.split(',')[0] || 'Unknown'}
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                           <i className="fas fa-user-edit mr-1.5 text-blue-400"></i> {complaint.userName}
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg ml-auto">
                           <i className="fas fa-clock mr-1.5 opacity-50"></i> {new Date(complaint.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkerDashboard;
