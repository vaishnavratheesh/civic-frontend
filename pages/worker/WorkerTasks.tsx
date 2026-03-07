import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Spinner from '../../components/Spinner';
import { Complaint, ComplaintStatus } from '../../types';
import { io } from 'socket.io-client';

const WorkerTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'inProgress' | 'completed'>('pending');
    const [selectedTask, setSelectedTask] = useState<Complaint | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const workerDataRaw = localStorage.getItem('workerData');
    const workerData = workerDataRaw ? JSON.parse(workerDataRaw) : {};
    const workerWard = workerData.ward || 'N/A';

    useEffect(() => {
        fetchTasks();

        const socket = io(import.meta.env.VITE_BACKEND_URL, { withCredentials: true });
        
        socket.on('connect', () => {
            if (workerWard !== 'N/A') {
                socket.emit('join', { ward: workerWard, role: 'worker' });
            }
        });

        socket.on('complaint:update', () => {
            fetchTasks(); // Refresh list on any status change in the ward
        });

        socket.on('complaint:progress', () => {
            fetchTasks();
        });

        return () => {
            socket.disconnect();
        };
    }, [workerWard]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('workerToken');
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/worker/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setTasks(data.tasks || []);
            }
        } catch (error) {
            console.error('Fetch tasks error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptTask = async (taskId: string) => {
        const result = await Swal.fire({
            title: 'Accept Task?',
            text: 'Are you ready to start working on this assignment?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#7c3aed',
            confirmButtonText: 'Yes, Start Working'
        });

        if (!result.isConfirmed) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('workerToken');
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/worker/tasks/${taskId}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire({
                    title: 'Task Accepted!',
                    text: 'The status has been updated to In Progress.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                fetchTasks();
                setShowModal(false);
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectTask = async (taskId: string) => {
        const { value: reason } = await Swal.fire({
            title: 'Reject Assignment',
            input: 'textarea',
            inputLabel: 'Reason for rejection',
            inputPlaceholder: 'Please explain why you cannot handle this task...',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Reject Task',
            inputValidator: (value) => {
                if (!value) return 'A reason is required to reject a task.';
            }
        });

        if (!reason) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('workerToken');
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/worker/tasks/${taskId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            if (res.ok) {
                Swal.fire('Returned', 'Task has been sent back to the councillor.', 'info');
                fetchTasks();
                setShowModal(false);
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to reject task.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUploadPhoto = async (taskId: string, photoType: 'progress' | 'completion') => {
        const { value: file } = await Swal.fire({
            title: `Upload ${photoType === 'progress' ? 'Progress' : 'Completion'} Proof`,
            input: 'file',
            inputAttributes: { accept: 'image/*' },
            showCancelButton: true,
            confirmButtonText: 'Upload',
            confirmButtonColor: '#7c3aed'
        });

        if (!file) return;

        setActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);
            formData.append('photoType', photoType);

            const token = localStorage.getItem('workerToken');
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/worker/tasks/${taskId}/upload-photo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                Swal.fire('Success!', 'Photo proof has been updated.', 'success');
                fetchTasks();
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to upload photo.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteTask = async (taskId: string) => {
        const result = await Swal.fire({
            title: 'Complete Assignment',
            html: `
                <div class="text-left">
                    <p class="mb-2 font-bold text-gray-700">Completion Photo (Required)</p>
                    <input type="file" id="completionPhotos" accept="image/*" class="mb-4 w-full cursor-pointer" />
                    <p class="mb-2 font-bold text-gray-700">Resolution Summary</p>
                    <textarea id="completionRemarks" class="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none" rows="3" placeholder="Describe the resolution..."></textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Finalize Task',
            confirmButtonColor: '#10b981',
            preConfirm: () => {
                const photos = (document.getElementById('completionPhotos') as HTMLInputElement).files;
                const remarks = (document.getElementById('completionRemarks') as HTMLTextAreaElement).value;
                if (!photos || photos.length === 0) {
                    Swal.showValidationMessage('Please upload a completion photo as proof');
                    return false;
                }
                return { photos, remarks };
            }
        });

        if (!result.isConfirmed) return;

        setActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('remarks', result.value.remarks);
            Array.from(result.value.photos as FileList).forEach(file => {
                formData.append('photos', file);
            });

            const token = localStorage.getItem('workerToken');
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/worker/tasks/${taskId}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                Swal.fire({
                    title: 'Excellent Work!',
                    text: 'The task has been marked as resolved.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                fetchTasks();
                setShowModal(false);
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to complete task.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (activeTab === 'pending') return t.status === ComplaintStatus.ASSIGNED || t.status === ComplaintStatus.PENDING;
        if (activeTab === 'inProgress') return t.status === ComplaintStatus.IN_PROGRESS || (t.status as string) === 'InProgress';
        return t.status === ComplaintStatus.RESOLVED;
    });

    if (loading) return <div className="flex flex-col justify-center h-[60vh] items-center space-y-4">
        <Spinner />
        <p className="text-gray-400 font-medium">Fetching active assignments...</p>
    </div>;

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Assignment Depot</h1>
                    <p className="text-gray-500 mt-2 font-medium">Manage and resolve your assigned complaints efficiently.</p>
                </div>

                <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex ring-1 ring-gray-100">
                    {(['pending', 'inProgress', 'completed'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                                    : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                                }`}
                        >
                            {tab === 'pending' ? 'Incoming' : tab === 'inProgress' ? 'Ongoing' : 'Resolved'}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 font-black'}`}>
                                {tasks.filter(t => {
                                    if (tab === 'pending') return t.status === ComplaintStatus.ASSIGNED || t.status === ComplaintStatus.PENDING;
                                    if (tab === 'inProgress') return t.status === ComplaintStatus.IN_PROGRESS || (t.status as string) === 'InProgress';
                                    return t.status === ComplaintStatus.RESOLVED;
                                }).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => { setSelectedTask(task); setShowModal(true); }}
                            className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-7 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/50 rounded-full blur-2xl -transtype-x-8 -transtype-y-8"></div>
                            
                            <div className="flex justify-between items-start mb-6 relative">
                                <span className={`px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider ${task.priorityScore > 7 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                    <i className="fas fa-fire mr-1.5"></i> Priority {task.priorityScore}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                    {new Date(task.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">
                                {task.title || task.issueType}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2 font-medium leading-relaxed">{task.description}</p>

                            <div className="border-t border-gray-50 pt-5 flex items-center justify-between relative">
                                <div className="flex items-center text-xs font-bold text-gray-400">
                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                        <i className="fas fa-map-marker-alt"></i>
                                    </div>
                                    <span className="truncate max-w-[150px]">{task.location.address?.split(',')[0] || 'Unknown Location'}</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                    <i className="fas fa-arrow-right text-xs"></i>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-clipboard-check text-4xl text-gray-200"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Workspace Empty</h3>
                        <p className="text-gray-400 font-medium">No tasks found in the <span className="text-purple-600 font-bold capitalize">{activeTab}</span> category.</p>
                    </div>
                )}
            </div>

            {/* Task Detail Modal */}
            {showModal && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-100 px-3 py-1 rounded-full">{selectedTask.issueType}</span>
                                    <span className="text-[10px] font-bold text-gray-400">ID: #{selectedTask.id.slice(-6).toUpperCase()}</span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedTask.title || selectedTask.issueType}</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:rotate-90 transition-all">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 space-y-8">
                            {/* Visual Progress Stepper */}
                            <div className="flex items-center justify-between px-6">
                                <Step icon="fas fa-inbox" label="Assigned" active={true} completed={selectedTask.status !== 'Assigned' && selectedTask.status !== 'Pending'} />
                                <Connector active={selectedTask.status !== 'Assigned' && selectedTask.status !== 'Pending'} />
                                <Step icon="fas fa-hammer" label="Progress" active={selectedTask.status === ComplaintStatus.IN_PROGRESS || (selectedTask.status as string) === 'InProgress'} completed={selectedTask.status === ComplaintStatus.RESOLVED} />
                                <Connector active={selectedTask.status === ComplaintStatus.RESOLVED} />
                                <Step icon="fas fa-check-circle" label="Resolved" active={selectedTask.status === ComplaintStatus.RESOLVED} completed={selectedTask.status === ComplaintStatus.RESOLVED} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoCard icon="fas fa-info-circle" label="Description" content={selectedTask.description} fullWidth />
                                <InfoCard icon="fas fa-map-marker-alt" label="Location" content={selectedTask.location.address || "Coordinates recorded"} />
                                <InfoCard icon="fas fa-user" label="Reporter" content={selectedTask.userName} />
                            </div>

                            {selectedTask.assignedTo?.assignmentNotes && (
                                <div className="bg-yellow-50 p-6 rounded-[2rem] border border-yellow-100 flex gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-yellow-600 shadow-sm border border-yellow-100 flex-shrink-0">
                                        <i className="fas fa-sticky-note text-lg"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-yellow-800 uppercase tracking-widest mb-1">Note from Councillor</h4>
                                        <p className="text-yellow-700 font-medium leading-relaxed">{selectedTask.assignedTo.assignmentNotes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Timeline */}
                            {selectedTask.actionHistory && selectedTask.actionHistory.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Action Timeline</h4>
                                    <div className="space-y-4">
                                        {selectedTask.actionHistory.map((action, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                    {idx !== selectedTask.actionHistory!.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1"></div>}
                                                </div>
                                                <div className="pb-4">
                                                    <p className="text-sm font-bold text-gray-800">{action.action}</p>
                                                    <p className="text-xs text-gray-500 font-medium">{new Date(action.at).toLocaleString()}</p>
                                                    {action.remarks && <p className="text-xs text-gray-500 mt-1 italic">"{action.remarks}"</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                            {/* Dynamic Action Buttons */}
                            {selectedTask.status === 'Assigned' || selectedTask.status === 'Pending' ? (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleAcceptTask(selectedTask.id)}
                                        disabled={actionLoading}
                                        className="flex-[2] bg-purple-600 text-white py-4 rounded-2xl font-black hover:bg-purple-700 active:scale-[0.98] transition-all shadow-xl shadow-purple-200 flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-check-circle"></i> {actionLoading ? 'Initializing...' : 'Accept Assignment'}
                                    </button>
                                    <button
                                        onClick={() => handleRejectTask(selectedTask.id)}
                                        disabled={actionLoading}
                                        className="flex-1 bg-white text-red-500 border border-red-100 py-4 rounded-2xl font-black hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-times"></i> Reject
                                    </button>
                                </div>
                            ) : (selectedTask.status === 'In Progress' || (selectedTask.status as string) === 'InProgress') ? (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleUploadPhoto(selectedTask.id, 'progress')}
                                        disabled={actionLoading}
                                        className="flex-1 bg-white text-purple-600 border border-purple-100 py-4 rounded-2xl font-black hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-camera"></i> Progress Proof
                                    </button>
                                    <button
                                        onClick={() => handleCompleteTask(selectedTask.id)}
                                        disabled={actionLoading}
                                        className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-black hover:shadow-xl hover:shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-check-double"></i> Mark as Resolved
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-4 px-6 bg-emerald-50 text-emerald-700 font-black rounded-2xl border border-emerald-100 gap-3">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <i className="fas fa-check"></i>
                                    </div>
                                    Assignment Fully Resolved
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// UI Components for Modal
const Step = ({ icon, label, active, completed }: any) => (
    <div className="flex flex-col items-center group">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : active ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 ring-4 ring-purple-50' : 'bg-gray-100 text-gray-400'}`}>
            <i className={completed ? 'fas fa-check' : icon}></i>
        </div>
        <span className={`text-[10px] mt-2 font-black uppercase tracking-widest ${active || completed ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
    </div>
);

const Connector = ({ active }: any) => (
    <div className="flex-1 h-1.5 mx-2 -mt-6 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full bg-emerald-500 transition-all duration-1000 ${active ? 'w-full' : 'w-0'}`}></div>
    </div>
);

const InfoCard = ({ icon, label, content, fullWidth }: any) => (
    <div className={`p-6 rounded-[2rem] border border-gray-100 bg-white hover:border-purple-100 transition-all hover:shadow-md ${fullWidth ? 'md:col-span-2' : ''}`}>
        <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                <i className={icon}></i>
            </div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</h4>
        </div>
        <p className="text-gray-800 font-bold leading-relaxed">{content}</p>
    </div>
);

export default WorkerTasks;
