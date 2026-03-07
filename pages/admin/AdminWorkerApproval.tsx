import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Spinner from '../../components/Spinner';
import axios from 'axios';

interface Worker {
    _id: string;
    name: string;
    email: string;
    type: string;
    contact: string;
    ward: string;
    specialization?: string;
    experience?: number;
    workerId?: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    emailVerified: boolean;
    registrationSource: 'self' | 'admin' | 'councillor';
    verificationDocument?: {
        type: string;
        fileUrl: string;
        uploadedAt: Date;
    };
    idProof?: {
        type: string;
        fileUrl: string;
        uploadedAt: Date;
    };
    rejectionReason?: string;
    createdAt: Date;
}

interface Statistics {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    selfRegistered: number;
    adminCreated: number;
}

const AdminWorkerApproval: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [showModal, setShowModal] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchWorkers();
        fetchStatistics();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [filter, workers]);

    const fetchWorkers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/workers`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            setWorkers(response.data.workers);
        } catch (error) {
            console.error('Fetch workers error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load workers'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/workers/statistics`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            setStatistics(response.data.statistics);
        } catch (error) {
            console.error('Fetch statistics error:', error);
        }
    };

    const applyFilter = () => {
        let filtered = workers;
        
        if (filter === 'pending') {
            filtered = workers.filter(w => w.approvalStatus === 'pending');
        } else if (filter === 'approved') {
            filtered = workers.filter(w => w.approvalStatus === 'approved');
        } else if (filter === 'rejected') {
            filtered = workers.filter(w => w.approvalStatus === 'rejected');
        }
        
        setFilteredWorkers(filtered);
    };

    const handleApprove = async (workerId: string) => {
        const result = await Swal.fire({
            title: 'Approve Worker Registration?',
            text: 'This will activate the worker account and send approval email',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Approve',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/admin/workers/${workerId}/approve`,
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                await Swal.fire({
                    icon: 'success',
                    title: 'Approved!',
                    html: `Worker has been approved successfully.<br><strong>Worker ID:</strong> ${response.data.worker.workerId}`,
                    timer: 3000
                });

                fetchWorkers();
                fetchStatistics();
                setShowModal(false);
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Approval Failed',
                    text: error.response?.data?.error || 'Failed to approve worker'
                });
            }
        }
    };

    const handleReject = async (workerId: string) => {
        const { value: reason } = await Swal.fire({
            title: 'Reject Worker Registration',
            input: 'textarea',
            inputLabel: 'Reason for rejection',
            inputPlaceholder: 'Enter the reason for rejection...',
            inputAttributes: {
                'aria-label': 'Reason for rejection'
            },
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value) {
                    return 'You must provide a reason for rejection';
                }
            }
        });

        if (reason) {
            try {
                await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/admin/workers/${workerId}/reject`,
                    { reason },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                await Swal.fire({
                    icon: 'success',
                    title: 'Rejected',
                    text: 'Worker registration has been rejected',
                    timer: 2000
                });

                fetchWorkers();
                fetchStatistics();
                setShowModal(false);
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Rejection Failed',
                    text: error.response?.data?.error || 'Failed to reject worker'
                });
            }
        }
    };

    const openWorkerDetails = (worker: Worker) => {
        setSelectedWorker(worker);
        setShowModal(true);
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
    };

    const getWorkerTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            harithakarmasena: 'Haritha Karma Sena',
            plumber: 'Plumber',
            electrician: 'Electrician',
            water_authority: 'Water Authority',
            sanitation_worker: 'Sanitation Worker',
            road_contractor: 'Road Contractor',
            civil_engineer: 'Civil Engineer',
            mason: 'Mason',
            kseb_technician: 'KSEB Technician',
            drainage_worker: 'Drainage Worker',
            maintenance_worker: 'Maintenance Worker',
            supervisor: 'Supervisor',
            pipe_fitter: 'Pipe Fitter',
            police: 'Police',
            municipal_inspector: 'Municipal Inspector',
            general_worker: 'General Worker'
        };
        return labels[type] || type;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/admin')}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back to Dashboard
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                <i className="fas fa-user-shield mr-2"></i>
                                {user?.name}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">
                            <i className="fas fa-users-cog mr-3 text-purple-600"></i>
                            Worker Management
                        </h1>
                        <p className="text-gray-600 mt-2">Review and approve worker registrations</p>
                    </div>

                    {/* Statistics Cards */}
                    {statistics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm">Total Workers</p>
                                        <p className="text-2xl font-bold text-gray-800">{statistics.total}</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <i className="fas fa-users text-blue-600 text-xl"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm">Pending Approval</p>
                                        <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
                                    </div>
                                    <div className="bg-yellow-100 p-3 rounded-full">
                                        <i className="fas fa-clock text-yellow-600 text-xl"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm">Approved</p>
                                        <p className="text-2xl font-bold text-green-600">{statistics.approved}</p>
                                    </div>
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <i className="fas fa-check-circle text-green-600 text-xl"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm">Rejected</p>
                                        <p className="text-2xl font-bold text-red-600">{statistics.rejected}</p>
                                    </div>
                                    <div className="bg-red-100 p-3 rounded-full">
                                        <i className="fas fa-times-circle text-red-600 text-xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filter === 'all'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All ({workers.length})
                            </button>
                            <button
                                onClick={() => setFilter('pending')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filter === 'pending'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Pending ({statistics?.pending || 0})
                            </button>
                            <button
                                onClick={() => setFilter('approved')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filter === 'approved'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Approved ({statistics?.approved || 0})
                            </button>
                            <button
                                onClick={() => setFilter('rejected')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filter === 'rejected'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Rejected ({statistics?.rejected || 0})
                            </button>
                        </div>
                    </div>

                    {/* Workers List */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Spinner />
                            <span className="ml-3 text-gray-600">Loading workers...</span>
                        </div>
                    ) : filteredWorkers.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <i className="fas fa-inbox text-gray-300 text-5xl mb-4"></i>
                            <p className="text-gray-500 text-lg">No workers found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredWorkers.map((worker) => (
                                <div
                                    key={worker._id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => openWorkerDetails(worker)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">{worker.name}</h3>
                                            <p className="text-sm text-gray-600">{worker.email}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(worker.approvalStatus)}`}>
                                            {worker.approvalStatus.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Type</p>
                                            <p className="font-medium text-gray-800">{getWorkerTypeLabel(worker.type)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Ward</p>
                                            <p className="font-medium text-gray-800">Ward {worker.ward}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Contact</p>
                                            <p className="font-medium text-gray-800">{worker.contact}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Experience</p>
                                            <p className="font-medium text-gray-800">{worker.experience || 0} years</p>
                                        </div>
                                    </div>

                                    {worker.specialization && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-xs text-gray-500">Specialization</p>
                                            <p className="text-sm text-gray-700">{worker.specialization}</p>
                                        </div>
                                    )}

                                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                        <span>
                                            <i className="fas fa-calendar mr-1"></i>
                                            {new Date(worker.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-purple-600 hover:text-purple-800">
                                            View Details <i className="fas fa-arrow-right ml-1"></i>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>

            {/* Worker Details Modal */}
            {showModal && selectedWorker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">Worker Details</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-white hover:text-gray-200"
                                >
                                    <i className="fas fa-times text-2xl"></i>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="text-center">
                                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(selectedWorker.approvalStatus)}`}>
                                    {selectedWorker.approvalStatus.toUpperCase()}
                                </span>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500">Full Name</label>
                                    <p className="font-semibold text-gray-800">{selectedWorker.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Worker ID</label>
                                    <p className="font-semibold text-gray-800">{selectedWorker.workerId || 'Not Assigned'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Email</label>
                                    <p className="font-semibold text-gray-800">{selectedWorker.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Contact</label>
                                    <p className="font-semibold text-gray-800">{selectedWorker.contact}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Worker Type</label>
                                    <p className="font-semibold text-gray-800">{getWorkerTypeLabel(selectedWorker.type)}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Ward</label>
                                    <p className="font-semibold text-gray-800">Ward {selectedWorker.ward}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Experience</label>
                                    <p className="font-semibold text-gray-800">{selectedWorker.experience || 0} years</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Email Verified</label>
                                    <p className="font-semibold text-gray-800">
                                        {selectedWorker.emailVerified ? (
                                            <span className="text-green-600"><i className="fas fa-check-circle"></i> Yes</span>
                                        ) : (
                                            <span className="text-red-600"><i className="fas fa-times-circle"></i> No</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {selectedWorker.specialization && (
                                <div>
                                    <label className="text-sm text-gray-500">Specialization</label>
                                    <p className="font-semibold text-gray-800">{selectedWorker.specialization}</p>
                                </div>
                            )}

                            {selectedWorker.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <label className="text-sm text-red-700 font-semibold">Rejection Reason</label>
                                    <p className="text-red-800 mt-1">{selectedWorker.rejectionReason}</p>
                                </div>
                            )}

                            {/* Actions */}
                            {selectedWorker.approvalStatus === 'pending' && (
                                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleApprove(selectedWorker._id)}
                                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
                                    >
                                        <i className="fas fa-check-circle mr-2"></i>
                                        Approve Worker
                                    </button>
                                    <button
                                        onClick={() => handleReject(selectedWorker._id)}
                                        className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all"
                                    >
                                        <i className="fas fa-times-circle mr-2"></i>
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWorkerApproval;
