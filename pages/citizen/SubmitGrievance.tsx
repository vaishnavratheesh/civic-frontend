
import React, { useState, useRef } from 'react';
import Spinner from '../../components/Spinner';
import { analyzeGrievance } from '../../services/geminiService';
import { Complaint, ComplaintStatus, Role, User } from '../../types';
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
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [analysisResult, setAnalysisResult] = useState<{title: string, issueType: string, priorityScore: number, summary: string} | null>(null);

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
        if (!description || !imageFile || !user) {
            setError('Please provide a description and an image.');
            return;
        }

        setError('');
        setIsSubmitting(true);
        setAnalysisResult(null);

        try {
            const imageBase64 = await fileToBase64(imageFile);
            const analysis = await analyzeGrievance(description, imageBase64);
            setAnalysisResult(analysis);

            // Now save the full complaint data
            const newGrievanceData: Omit<Complaint, 'id' | 'createdAt' | 'userName'> = {
                userId: user.id,
                ward: user.ward,
                description: description,
                imageURL: imagePreview!, // The preview URL can be used for display
                issueType: analysis.issueType,
                location: { lat: 0, lng: 0 }, // Placeholder for actual location capture
                priorityScore: analysis.priorityScore,
                status: ComplaintStatus.PENDING,
                source: 'user',
            };

            const savedComplaint = await saveGrievance(newGrievanceData);
            onGrievanceSubmitted(savedComplaint);
            // Reset form
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

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Report a New Grievance</h3>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
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