import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface Worker {
    _id: string;
    name: string;
    type: string;
    contact: string;
    email?: string;
    ward: string;
    availability: 'available' | 'busy' | 'offline';
    assignedTasks: number;
    specialization?: string;
}

interface AssignComplaintProps {
    complaintId: string;
    complaintCategory: string;
    complaintTitle: string;
    complaintWard?: string; // Add optional ward prop
    isOpen: boolean;
    onClose: () => void;
    onAssignSuccess: () => void;
}

const AssignComplaint: React.FC<AssignComplaintProps> = ({
    complaintId,
    complaintCategory,
    complaintTitle,
    complaintWard,
    isOpen,
    onClose,
    onAssignSuccess
}) => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
    const [assignmentNotes, setAssignmentNotes] = useState('');
    const [filterAvailability, setFilterAvailability] = useState<string>('all');

    // Map complaint categories to worker types
    const getWorkerTypesForCategory = (category: string): string[] => {
        const categoryMap: { [key: string]: string[] } = {
            'Waste Management': ['harithakarmasena', 'sanitation_worker', 'supervisor'],
            'Water Leakage': ['plumber', 'water_authority', 'pipe_fitter'],
            'Road Repair': ['road_contractor', 'civil_engineer', 'mason'],
            'Streetlight Outage': ['electrician', 'kseb_technician', 'maintenance_worker'],
            'Drainage': ['drainage_worker', 'civil_engineer', 'sanitation_worker'],
            'Public Nuisance': ['police', 'municipal_inspector', 'supervisor'],
            'Other': ['general_worker', 'supervisor']
        };

        return categoryMap[category] || categoryMap['Other'];
    };

    // Fetch available workers based on complaint category
    useEffect(() => {
        if (isOpen) {
            fetchWorkers();
        }
    }, [isOpen, complaintCategory]);

    const fetchWorkers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const workerTypes = getWorkerTypesForCategory(complaintCategory);

            // If complaintWard is present, pass it to backend to prioritize workers from that ward
            let url = `${import.meta.env.VITE_BACKEND_URL}/api/workers?types=${workerTypes.join(',')}&availability=${filterAvailability}`;
            if (complaintWard) {
                url += `&ward=${complaintWard}`;
            }

            const response = await fetch(
                url,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setWorkers(data.workers || []);
            } else {
                const error = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to fetch workers',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error fetching workers:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load workers. Please try again.',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedWorker) {
            Swal.fire({
                icon: 'warning',
                title: 'No Worker Selected',
                text: 'Please select a worker to assign this task.',
                confirmButtonText: 'OK'
            });
            return;
        }

        const worker = workers.find(w => w._id === selectedWorker);
        const confirmResult = await Swal.fire({
            title: 'Confirm Assignment',
            html: `
                <div class="text-left">
                    <p class="mb-3">Assign this complaint to:</p>
                    <p class="mb-2"><strong>Worker:</strong> ${worker?.name}</p>
                    <p class="mb-2"><strong>Type:</strong> ${worker?.type.replace('_', ' ').toUpperCase()}</p>
                    <p class="mb-2"><strong>Contact:</strong> ${worker?.contact}</p>
                    ${assignmentNotes ? `<p class="mb-2"><strong>Notes:</strong> ${assignmentNotes}</p>` : ''}
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#7c3aed',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Assign Task',
            cancelButtonText: 'Cancel'
        });

        if (!confirmResult.isConfirmed) {
            return;
        }

        setAssigning(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/grievances/${complaintId}/assign`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        workerId: selectedWorker,
                        assignmentNotes: assignmentNotes || 'Task assigned by councillor'
                    })
                }
            );

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Task Assigned!',
                    text: `Complaint has been assigned to ${worker?.name}`,
                    timer: 2000,
                    showConfirmButton: false
                });
                onAssignSuccess();
                onClose();
            } else {
                const error = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Assignment Failed',
                    text: error.message || 'Failed to assign task',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to assign task. Please try again.',
                confirmButtonText: 'OK'
            });
        } finally {
            setAssigning(false);
        }
    };

    const getAvailabilityBadge = (availability: string) => {
        switch (availability) {
            case 'available':
                return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Available</span>;
            case 'busy':
                return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Busy</span>;
            case 'offline':
                return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Offline</span>;
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Assign Task to Worker</h2>
                            <p className="text-purple-100 text-sm">
                                {complaintTitle}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Category Info */}
                    <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Complaint Category</p>
                                <p className="text-lg font-semibold text-purple-800">{complaintCategory}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Recommended Workers</p>
                                <p className="text-sm text-gray-800">
                                    {getWorkerTypesForCategory(complaintCategory)
                                        .map(t => t.replace('_', ' ').toUpperCase())
                                        .join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">Available Workers</h3>
                        <select
                            value={filterAvailability}
                            onChange={(e) => {
                                setFilterAvailability(e.target.value);
                                fetchWorkers();
                            }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="all">All Workers</option>
                            <option value="available">Available Only</option>
                            <option value="busy">Busy</option>
                        </select>
                    </div>

                    {/* Workers List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <i className="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
                            <p className="text-gray-600">Loading workers...</p>
                        </div>
                    ) : workers.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fas fa-users-slash text-4xl text-gray-400 mb-4"></i>
                            <p className="text-gray-600">No workers available for this category</p>
                            <p className="text-sm text-gray-500 mt-2">Please add workers or try a different filter</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {workers.map((worker) => (
                                <div
                                    key={worker._id}
                                    onClick={() => setSelectedWorker(worker._id)}
                                    className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedWorker === worker._id
                                        ? 'border-purple-600 bg-purple-50 shadow-md'
                                        : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1">
                                            <div className="mt-1">
                                                <input
                                                    type="radio"
                                                    name="worker"
                                                    checked={selectedWorker === worker._id}
                                                    onChange={() => setSelectedWorker(worker._id)}
                                                    className="w-4 h-4 text-purple-600"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <h4 className="font-semibold text-gray-800">{worker.name}</h4>
                                                    {getAvailabilityBadge(worker.availability)}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Type:</span>{' '}
                                                        <span className="font-medium text-gray-800">
                                                            {worker.type.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Contact:</span>{' '}
                                                        <span className="font-medium text-gray-800">{worker.contact}</span>
                                                    </div>
                                                    {worker.email && (
                                                        <div className="col-span-2">
                                                            <span className="text-gray-600">Email:</span>{' '}
                                                            <span className="font-medium text-gray-800">{worker.email}</span>
                                                        </div>
                                                    )}
                                                    {worker.specialization && (
                                                        <div className="col-span-2">
                                                            <span className="text-gray-600">Specialization:</span>{' '}
                                                            <span className="font-medium text-gray-800">{worker.specialization}</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-gray-600">Active Tasks:</span>{' '}
                                                        <span className="font-medium text-gray-800">{worker.assignedTasks || 0}</span>
                                                    </div>
                                                    {/* Show Ward Badge if matches complaint ward */}
                                                    {complaintWard && worker.ward === complaintWard && (
                                                        <div className="col-span-2 mt-1">
                                                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                                Nearby (Ward {worker.ward})
                                                            </span>
                                                        </div>
                                                    )}
                                                    {/* Show Ward for others if complaintWard is set */}
                                                    {complaintWard && worker.ward !== complaintWard && (
                                                        <div className="col-span-2 mt-1">
                                                            <span className="text-xs text-gray-500">
                                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                                Ward {worker.ward}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Assignment Notes */}
                    {workers.length > 0 && (
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assignment Notes (Optional)
                            </label>
                            <textarea
                                value={assignmentNotes}
                                onChange={(e) => setAssignmentNotes(e.target.value)}
                                placeholder="Add any specific instructions or notes for the worker..."
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                {workers.length > 0 && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={assigning}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={!selectedWorker || assigning}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {assigning ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    <span>Assigning...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-user-check"></i>
                                    <span>Assign Task</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignComplaint;
