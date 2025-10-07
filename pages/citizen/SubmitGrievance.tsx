
import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import Spinner from '../../components/Spinner';
import { analyzeGrievance } from '../../services/geminiService';
import { Complaint, ComplaintStatus, Role, User } from '../../types';
import LocationPicker from '../../components/LocationPicker';
import { useAuth } from '../../hooks/useAuth';

// Mock function to simulate saving to a backend
const saveGrievance = async (complaint: Omit<Complaint, 'id' | 'createdAt' | 'userName'>): Promise<Complaint> => {
    console.log("Saving grievance:", complaint);
    return new Promise(resolve => {
        setTimeout(() => {
            const newComplaint: Complaint = {
                ...complaint,
                id: `comp-${Date.now()}`,
                createdAt: new Date().toISOString(),
                userName: 'John Doe' // from logged in user
            };
            resolve(newComplaint);
        }, 1000);
    });
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const SubmitGrievance: React.FC<{onGrievanceSubmitted: (complaint: Complaint) => void}> = ({ onGrievanceSubmitted }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [ward, setWard] = useState<number | null>(null);
    const [pickedLocation, setPickedLocation] = useState<{ latitude: number; longitude: number; formattedAddress: string } | null>(null);
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [analysisResult, setAnalysisResult] = useState<{title: string, issueType: string, priorityScore: number, summary: string} | null>(null);
    const [upvoteToast, setUpvoteToast] = useState<{ visible: boolean; message: string }>(() => ({ visible: false, message: '' }));

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setIsCameraOpen(true);
        } catch (err) {
            setError("Could not access the camera. Please check permissions.");
            console.error("Camera access error:", err);
        }
    };

    const takePicture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setImagePreview(dataUrl);
                fetch(dataUrl).then(res => res.blob()).then(blob => {
                    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                    setImageFile(file);
                });
                closeCamera();
            }
        }
    };
    
    const closeCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError('Not authenticated.');
            return;
        }
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }
        if (!description.trim()) {
            setError('Description is required.');
            return;
        }
        if (!pickedLocation) {
            setError('Please select a location on the map.');
            return;
        }
        if (!imageFile) {
            setError('Please attach at least one photo.');
            return;
        }

        setError('');
        setIsSubmitting(true);
        setAnalysisResult(null);

        try {
            const token = localStorage.getItem('token');

            // Quick duplicate preflight (no upload) so we can short-circuit
            try {
                const dupResp = await fetch('http://localhost:3002/api/grievances/check-duplicate', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title,
                        issueType: title,
                        description,
                        location: { lat: pickedLocation.latitude, lng: pickedLocation.longitude }
                    })
                });
                if (dupResp.ok) {
                    const dup = await dupResp.json();
                    if (dup?.duplicate) {
                        if (dup.sameUser || dup.hasUpvoted) {
                            await Swal.fire({ icon: 'info', title: 'Already Submitted', text: 'You’ve already reported this issue. Please check your grievance list for updates.' });
                            setIsSubmitting(false);
                            return;
                        }
                        // Different user -> trigger group upvote endpoint and show success toast
                        if (dup.groupId) {
                            const up = await fetch(`http://localhost:3002/api/grievances/${dup.groupId}/upvote`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const upData = await up.json();
                            if (up.ok) {
                                await Swal.fire({ icon: 'success', title: 'Similar complaint already exists', text: `Thanks for reporting. Your report has increased its priority. Upvotes: ${upData.upvoteCount || dup.upvoteCount + 1 || 2}`, timer: 3000, showConfirmButton: false });
                                setIsSubmitting(false);
                                return;
                            }
                        }
                    }
                }
            } catch (_) { /* best-effort preflight */ }

            const imageBase64 = await fileToBase64(imageFile);
            const analysis = await analyzeGrievance(description, imageBase64);
            setAnalysisResult(analysis);

            // Send multipart to backend
            const form = new FormData();
            form.append('title', title);
            form.append('description', description);
            if (category) form.append('category', category);
            const effectiveWard = ward ?? user.ward;
            form.append('location', JSON.stringify({ ward: effectiveWard, lat: pickedLocation.latitude, lng: pickedLocation.longitude, address: pickedLocation.formattedAddress }));
            form.append('issueType', title); // Use title as issueType to maintain consistency
            form.append('attachments', imageFile);

            const response = await fetch('http://localhost:3002/api/grievances', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: form
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 409) {
                    // Same-user duplicate (backend ensured)
                    try { await Swal.fire({ icon: 'info', title: 'Already Submitted', text: data?.message || 'You’ve already reported this issue. Please check your grievance list for updates.', confirmButtonText: 'OK' }); } catch {}
                    setError('');
                    setIsSubmitting(false);
                    // Do not treat as failure banner
                    return;
                }
                throw new Error(data?.message || 'Submission failed');
            }
            // If backend returns a duplicate upvote without a grievance object, show message and stop
            if (data?.duplicate && !data?.grievance) {
                try {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Similar complaint already exists',
                        text: `Thanks for reporting. Your report has increased its priority. Upvotes: ${data.upvoteCount || 2}`,
                        timer: 3500,
                        timerProgressBar: true,
                        showConfirmButton: false
                    });
                } catch {}
                // Reset form
                setTitle('');
                setCategory('');
                setWard(null);
                setPickedLocation(null);
                setDescription('');
                setImageFile(null);
                setImagePreview(null);
                setAnalysisResult(null);
                return;
            }

            const g = data.grievance;
            const savedComplaint: Complaint = {
                id: g._id || g.id,
                userId: g.userId,
                userName: g.userName,
                ward: g.ward,
                imageURL: (g.attachments && g.attachments[0] && g.attachments[0].url) || '',
                issueType: g.issueType,
                description: g.description,
                location: { lat: g.location?.lat || 0, lng: g.location?.lng || 0 },
                priorityScore: g.priorityScore || 0,
                status: g.status || ComplaintStatus.PENDING,
                source: 'user',
                createdAt: g.createdAt || new Date().toISOString(),
                resolvedAt: g.resolvedAt || undefined,
            };
            onGrievanceSubmitted(savedComplaint);

            if (data?.duplicate) {
                setError('');
                try { 
                    await Swal.fire({ 
                        icon: 'success', 
                        title: 'Similar complaint already exists', 
                        text: `Thanks for reporting. Your report has increased its priority. Upvotes: ${data.upvoteCount || 2}`, 
                        timer: 3500, 
                        timerProgressBar: true,
                        showConfirmButton: false 
                    }); 
                } catch {}
            }
            // Reset form
            setTitle('');
            setCategory('');
            setWard(null);
            setPickedLocation(null);
            setDescription('');
            setImageFile(null);
            setImagePreview(null);
            setAnalysisResult(null);

        } catch (err: any) {
            setError('Failed to submit grievance. ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // When user selects a map location, auto-detect ward from backend and update form
    const handlePickedLocation = async (loc: { latitude: number; longitude: number; formattedAddress: string }) => {
        setPickedLocation(loc);
        try {
            const params = new URLSearchParams({ lat: String(loc.latitude), lng: String(loc.longitude) });
            const token = localStorage.getItem('token');
            const resp = await fetch(`http://localhost:3002/api/grievances/ward-lookup?${params.toString()}` , {
                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
            });
            if (resp.ok) {
                const d = await resp.json();
                if (typeof d?.ward === 'number') setWard(d.ward);
            }
        } catch (_) {
            // best-effort only; leave ward as-is on failure
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg relative">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Report a New Grievance</h3>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            
            {/* Upvote toast */}
            {upvoteToast.visible && (
                <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-md">
                        <i className="fas fa-thumbs-up mt-0.5"></i>
                        <div className="text-sm">
                            <div className="font-semibold">Upvoted</div>
                            <div>{upvoteToast.message}</div>
                        </div>
                        <button type="button" onClick={() => setUpvoteToast({ visible: false, message: '' })} className="ml-2 text-green-700 hover:text-green-900">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Short title for the issue"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Road, Waste, Water"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
                    <input
                        type="number"
                        value={ward ?? user?.ward ?? ''}
                        onChange={(e) => setWard(parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ward number"
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Describe the issue
                    </label>
                    <textarea
                        id="description"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., There is a large pothole on Main Street near the bus stop..."
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Location</label>
                    <LocationPicker onLocationSelect={handlePickedLocation} className="mt-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload an image</label>
                    <div className="mt-2 flex items-center space-x-4">
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                        <label htmlFor="image-upload" className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg inline-flex items-center">
                           <i className="fas fa-upload mr-2"></i> Upload File
                        </label>
                        <button type="button" onClick={openCamera} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center">
                            <i className="fas fa-camera mr-2"></i> Open Camera
                        </button>
                    </div>
                </div>

                {isCameraOpen && (
                    <div className="p-4 border rounded-lg bg-black">
                        <video ref={videoRef} className="w-full rounded-md"></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="mt-4 flex justify-center space-x-4">
                            <button type="button" onClick={takePicture} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full">Take Picture</button>
                            <button type="button" onClick={closeCamera} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full">Close Camera</button>
                        </div>
                    </div>
                )}

                {imagePreview && (
                    <div className="mt-4">
                        <h4 className="font-semibold text-gray-700">Image Preview:</h4>
                        <img src={imagePreview} alt="Grievance preview" className="mt-2 rounded-lg max-h-64 shadow-md" />
                    </div>
                )}
                
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 disabled:bg-blue-400 flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner size="sm"/> 
                                <span className="ml-2">Analyzing & Submitting...</span>
                            </>
                        ) : 'Submit Grievance'}
                    </button>
                </div>
            </form>
            
            {analysisResult && (
                 <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-lg text-green-700">AI Analysis Complete!</h4>
                    <p className="mt-2"><strong className="font-semibold">Title:</strong> {analysisResult.title}</p>
                    <p><strong className="font-semibold">Category:</strong> {analysisResult.issueType}</p>
                    <p><strong className="font-semibold">Priority:</strong> {analysisResult.priorityScore}/5</p>
                    <p><strong className="font-semibold">Summary:</strong> {analysisResult.summary}</p>
                    <p className="text-sm text-gray-500 mt-2">Your grievance has been submitted with this analysis.</p>
                </div>
            )}
        </div>
    );
};

export default SubmitGrievance;

