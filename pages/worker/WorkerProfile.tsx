import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Spinner from '../../components/Spinner';

interface Worker {
    id: string;
    name: string;
    email: string;
    workerId: string;
    type: string;
    contact: string;
    ward: string;
    specialization: string;
    experience: number;
    rating: number;
    profilePicture?: string;
    verificationDocument?: {
        type: string;
        fileUrl: string;
        uploadedAt: string;
    };
}

const WorkerProfile: React.FC = () => {
    const [worker, setWorker] = useState<Worker | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedWorker = localStorage.getItem('workerData');
        if (storedWorker) {
            setWorker(JSON.parse(storedWorker));
        }
        setLoading(false);
    }, []);

    const handleUploadDocument = async () => {
        const { value: file } = await Swal.fire({
            title: 'Upload Verification Document',
            text: 'Upload your ID card or certificate',
            input: 'file',
            inputAttributes: { accept: 'image/*,.pdf' },
            showCancelButton: true,
            confirmButtonText: 'Upload',
        });

        if (file) {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('documentType', 'ID Card'); // Defaulting for now

            try {
                const token = localStorage.getItem('workerToken');
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/worker/auth/upload-verification`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (res.ok) {
                    Swal.fire('Success', 'Document uploaded successfully', 'success');
                    // In a real app, we'd refetch profile here
                } else {
                    Swal.fire('Error', 'Upload failed', 'error');
                }
            } catch (err) {
                Swal.fire('Error', 'Something went wrong', 'error');
            }
        }
    };

    if (loading) return <Spinner />;

    if (!worker) return <div>No profile data found.</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="h-32 bg-gradient-to-r from-purple-600 to-blue-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end">
                            <img
                                src={worker.profilePicture ? `${import.meta.env.VITE_BACKEND_URL}${worker.profilePicture}` : `https://ui-avatars.com/api/?name=${worker.name}&background=random&size=128`}
                                alt={worker.name}
                                className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg object-cover bg-white"
                            />
                            <div className="ml-4 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">{worker.name}</h1>
                                <p className="text-gray-500 font-medium">{worker.type.replace('_', ' ').toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100">
                            <i className="fas fa-star text-yellow-400"></i>
                            <span className="font-bold text-yellow-700">{worker.rating || 'New'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <i className="fas fa-user-circle text-purple-600 mr-2"></i>Personal Details
                            </h3>
                            <div className="space-y-4">
                                <ProfileField label="Worker ID" value={worker.workerId} />
                                <ProfileField label="Email" value={worker.email} />
                                <ProfileField label="Contact" value={worker.contact} />
                                <ProfileField label="Ward" value={worker.ward} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <i className="fas fa-briefcase text-blue-600 mr-2"></i>Professional Info
                            </h3>
                            <div className="space-y-4">
                                <ProfileField label="Specialization" value={worker.specialization} />
                                <ProfileField label="Experience" value={`${worker.experience} Years`} />

                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Verification Document</h4>
                                    {worker.verificationDocument ? (
                                        <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100 text-green-700">
                                            <i className="fas fa-file-check mr-2"></i>
                                            <span className="text-sm font-medium">Document Uploaded</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleUploadDocument}
                                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-500 hover:text-purple-600 transition-colors text-sm font-medium"
                                        >
                                            <i className="fas fa-cloud-upload-alt mr-2"></i>Upload Verification ID
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileField = ({ label, value }: { label: string, value: string | number }) => (
    <div className="group">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5 group-hover:text-purple-600 transition-colors">{label}</p>
        <p className="text-gray-800 font-medium">{value || 'N/A'}</p>
    </div>
);

export default WorkerProfile;
