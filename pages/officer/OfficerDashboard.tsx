import React, { useState } from 'react';
import Header from '../../components/Header';
import { Complaint, ComplaintStatus } from '../../types';
import { STATUS_COLORS } from '../../constants';
import Spinner from '../../components/Spinner';

const mockAssignedComplaints: Complaint[] = [
    { id: 'comp-1', userId: 'user-citizen', userName: 'John Doe', ward: 3, imageURL: 'https://picsum.photos/400/300?random=1', issueType: 'Road Repair', description: 'Large pothole causing traffic issues.', location: { lat: 12.9716, lng: 77.5946 }, priorityScore: 4, status: ComplaintStatus.ASSIGNED, assignedTo: 'officer-1', officerName: 'Officer Smith', source: 'user', createdAt: '2023-10-26T10:00:00Z' },
    { id: 'comp-4', userId: 'iot-sensor-123', userName: 'IoT Sensor', ward: 5, imageURL: 'https://picsum.photos/400/300?random=4', issueType: 'Waste Management', description: 'Garbage level reached 95% at city park bin #4.', location: { lat: 12.9716, lng: 77.5946 }, priorityScore: 5, status: ComplaintStatus.IN_PROGRESS, assignedTo: 'officer-1', officerName: 'Officer Smith', source: 'iot', createdAt: '2023-10-28T08:00:00Z', beforeImageUrl: 'https://picsum.photos/400/300?random=5' },
];

const OfficerDashboard: React.FC = () => {
    const [complaints, setComplaints] = useState<Complaint[]>(mockAssignedComplaints);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    const handleUpdateStatus = (complaintId: string, newStatus: ComplaintStatus) => {
        // Mock API call simulation
        setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <main className="container mx-auto p-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">My Assigned Tasks</h2>
                <div className="bg-white rounded-xl shadow-lg">
                    <ul className="divide-y divide-gray-200">
                        {complaints.map(c => (
                            <li key={c.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-blue-600">{c.issueType} <span className="text-xs text-gray-500 ml-2">(Priority: {c.priorityScore})</span></p>
                                        <p className="text-lg font-bold text-gray-800">{c.description}</p>
                                        <p className="text-sm text-gray-500 mt-1">Reported by: {c.userName} on {new Date(c.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                                        <button onClick={() => setSelectedComplaint(c)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
                                            Update
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
            {selectedComplaint && (
                <UpdateModal 
                    complaint={selectedComplaint} 
                    onClose={() => setSelectedComplaint(null)} 
                    onUpdate={handleUpdateStatus}
                />
            )}
        </div>
    );
};


interface UpdateModalProps {
    complaint: Complaint;
    onClose: () => void;
    onUpdate: (complaintId: string, status: ComplaintStatus) => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ complaint, onClose, onUpdate }) => {
    const [status, setStatus] = useState(complaint.status);
    const [image, setImage] = useState<File | null>(null);
    const [imageType, setImageType] = useState<'before' | 'after' | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate upload and update
        setTimeout(() => {
            onUpdate(complaint.id, status);
            setLoading(false);
            onClose();
        }, 1500);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
                <h3 className="text-2xl font-bold mb-4">Update Task: {complaint.issueType}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="font-semibold">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as ComplaintStatus)} className="w-full mt-1 p-2 border rounded-lg">
                            <option value={ComplaintStatus.IN_PROGRESS}>In Progress</option>
                            <option value={ComplaintStatus.RESOLVED}>Resolved</option>
                        </select>
                    </div>
                    <div>
                        <label className="font-semibold">Upload Image</label>
                        <div className="flex space-x-2 mt-1">
                             <button type="button" onClick={() => setImageType('before')} className={`py-2 px-4 rounded-lg ${imageType === 'before' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Before Photo</button>
                             <button type="button" onClick={() => setImageType('after')} className={`py-2 px-4 rounded-lg ${imageType === 'after' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>After Photo</button>
                        </div>
                        {imageType && <input type="file" className="mt-2 w-full" />}
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-green-300">
                            {loading ? <Spinner size="sm" /> : "Save Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OfficerDashboard;