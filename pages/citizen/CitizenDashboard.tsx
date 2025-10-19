import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import TokenExpirationWarning from '../../components/TokenExpirationWarning';
import { Complaint, ComplaintStatus, WelfareScheme, ApplicationStatus, WelfareApplication } from '../../types';
import { STATUS_COLORS } from '../../constants';
import SubmitGrievance from './SubmitGrievance';
import { useAuth } from '../../hooks/useAuth';
import { askAboutWard } from '../../services/geminiService';
import Spinner from '../../components/Spinner';
import CommunityGrievances from './CommunityGrievances';
import WelfareApplicationForm from '../../components/WelfareApplicationForm';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../src/config/config';
import { notificationService } from '../../services/notificationService';
import jsPDF from 'jspdf';

// No mock data - using real data from backend

const tabs = [
    { id: 'my-ward', name: 'My Ward', icon: 'fa-map-marker-alt' },
    { id: 'my-grievances', name: 'My Grievances', icon: 'fa-bullhorn' },
    { id: 'community-grievances', name: 'Community Grievances', icon: 'fa-users' },
    { id: 'welfare-schemes', name: 'Welfare Schemes', icon: 'fa-hands-helping' },
    { id: 'announcements', name: 'Announcements', icon: 'fa-bullhorn' },
    { id: 'events', name: 'Events', icon: 'fa-calendar-alt' },
    { id: 'esabha', name: 'E-Sabha', icon: 'fa-video' },
];

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

// E-Sabha Tab Component
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
        interval = setInterval(fetchMeeting, 15000); // poll every 15s
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
                                The President has started an E-Sabha meeting. You can join as a viewer to participate in the democratic process.
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

// Video Proof Request Component for individual complaints
const VideoProofRequestSection: React.FC<{ 
    complaint: Complaint, 
    onVideoUploaded?: () => void 
}> = ({ complaint, onVideoUploaded }) => {
    const [uploading, setUploading] = useState<{[key: string]: boolean}>({});

    const handleVideoUpload = async (requestId: string, grievanceId: string) => {
        console.log('Starting video upload - Request ID:', requestId, 'Grievance ID:', grievanceId);
        
        if (!requestId) {
            console.error('Request ID is missing!');
            await Swal.fire({
                title: 'Error',
                text: 'Request ID is missing. Please refresh the page and try again.',
                icon: 'error',
                confirmButtonColor: '#7c3aed'
            });
            return;
        }
        
        try {
            const { value: file } = await Swal.fire({
                title: 'Upload Video Evidence',
                text: 'Please select a video file to upload as additional evidence.',
                input: 'file',
                inputAttributes: {
                    accept: 'video/*',
                    'aria-label': 'Upload video evidence'
                },
                showCancelButton: true,
                confirmButtonText: 'Upload',
                confirmButtonColor: '#7c3aed',
                cancelButtonText: 'Cancel',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Please select a video file';
                    }
                    const maxSize = 50 * 1024 * 1024; // 50MB
                    const file = value instanceof FileList ? value[0] : value;
                    if (file && file.size > maxSize) {
                        return 'Video file must be smaller than 50MB';
                    }
                }
            });

            if (file) {
                setUploading(prev => ({ ...prev, [requestId]: true }));

                const formData = new FormData();
                const videoFile = file instanceof FileList ? file[0] : file;
                formData.append('video', videoFile);
                formData.append('requestId', requestId);

                console.log('Uploading video - File:', videoFile.name, 'Size:', videoFile.size, 'Request ID:', requestId);

                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3002/api/grievances/${grievanceId}/upload-video-proof`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (response.ok) {
                    const responseData = await response.json();
                    console.log('Upload successful:', responseData);
                    
                    await Swal.fire({
                        title: 'Upload Successful!',
                        text: 'Your video evidence has been uploaded successfully. The councillor will review it.',
                        icon: 'success',
                        confirmButtonColor: '#7c3aed'
                    });
                    
                    // Notify parent to refresh data
                    if (onVideoUploaded) onVideoUploaded();
                } else {
                    const errorData = await response.json();
                    console.error('Upload failed:', response.status, errorData);
                    throw new Error(errorData.message || 'Upload failed');
                }
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            await Swal.fire({
                title: 'Upload Failed',
                text: error instanceof Error ? error.message : 'Failed to upload video. Please try again.',
                icon: 'error',
                confirmButtonColor: '#7c3aed'
            });
        } finally {
            setUploading(prev => ({ ...prev, [requestId]: false }));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'uploaded': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return 'fa-clock';
            case 'uploaded': return 'fa-check-circle';
            case 'rejected': return 'fa-times-circle';
            default: return 'fa-question-circle';
        }
    };

    const videoRequests = complaint.videoProofRequests || [];
    
    // Debug logging
    console.log('VideoProofRequestSection - Complaint:', complaint.id, 'Video Requests:', videoRequests);
    console.log('First request structure:', videoRequests[0]);
    
    if (videoRequests.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 space-y-3">
            <div className="flex items-center text-sm font-medium text-purple-700">
                <i className="fas fa-video mr-2"></i>
                Video Evidence Requests ({videoRequests.length})
            </div>
            {videoRequests.map((request, index) => (
                <div key={request.id || `request-${index}`} className={`border rounded-lg p-3 ${getStatusColor(request.status)}`}>
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <div className="flex items-center text-xs text-gray-600 mb-1">
                                <span>Requested by: {request.requestedByName}</span>
                                <span className="mx-2">•</span>
                                <span>{new Date(request.requestedAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                                <strong>Request:</strong> {request.message}
                            </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                            <i className={`fas ${getStatusIcon(request.status)} mr-1`}></i>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                    </div>

                    {request.status === 'pending' && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => handleVideoUpload(request.id, complaint.id)}
                                disabled={uploading[request.id || '']}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-medium rounded transition-colors"
                            >
                                {uploading[request.id || ''] ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-1"></i>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-upload mr-1"></i>
                                        Upload Video
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {request.status === 'uploaded' && request.videoUrl && (
                        <div className="flex items-center justify-between bg-green-50 rounded p-2">
                            <div className="flex items-center text-green-700 text-xs">
                                <i className="fas fa-check-circle mr-1"></i>
                                <span>Video uploaded on {new Date(request.uploadedAt!).toLocaleDateString()}</span>
                            </div>
                            <a
                                href={request.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                                View Video
                            </a>
                        </div>
                    )}

                    {request.status === 'rejected' && request.rejectionReason && (
                        <div className="bg-red-50 rounded p-2">
                            <p className="text-xs text-red-700">
                                <i className="fas fa-times-circle mr-1"></i>
                                <strong>Rejected:</strong> {request.rejectionReason}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};



const CitizenDashboard: React.FC = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('my-ward');
    const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
    const [communityComplaints, setCommunityComplaints] = useState<Complaint[]>([]);
    const [grievancesLoading, setGrievancesLoading] = useState(false);
    const [myApplications, setMyApplications] = useState<WelfareApplication[]>([]);
    const [printingPDF, setPrintingPDF] = useState<string | null>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [pendingVideoRequests, setPendingVideoRequests] = useState<number>(0);

    // PDF Generation function
    const generateApplicationPDF = (application: WelfareApplication) => {
        setPrintingPDF(application.id);
        try {
            const doc = new jsPDF();
            
            // Set page margins
            const margin = 20;
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            
            // Header with official design
            doc.setFillColor(0, 51, 102); // Dark blue background
            doc.rect(0, 0, pageWidth, 40, 'F');
            
            // Official header text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('ERUMELI PANCHAYATH', pageWidth / 2, 20, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Welfare Application Form', pageWidth / 2, 30, { align: 'center' });
            
            // Reset text color
            doc.setTextColor(0, 0, 0);
            
            // Application details box
            doc.setFillColor(240, 248, 255);
            doc.rect(margin, 50, pageWidth - 2 * margin, 25, 'F');
            doc.setDrawColor(0, 51, 102);
            doc.rect(margin, 50, pageWidth - 2 * margin, 25, 'S');
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('APPLICATION FOR WELFARE SCHEME', margin + 5, 65);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Date of Application: ${new Date(application.createdAt).toLocaleDateString('en-IN')}`, margin + 5, 70);
            
            // Scheme Information Section
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('SCHEME DETAILS', margin, 90);
            
            // Draw line under heading
            doc.line(margin, 95, pageWidth - margin, 95);
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Scheme Applied For: ${application.schemeTitle}`, margin, 105);
            doc.text(`Application Status: ${application.status}`, margin, 115);
            
            // Personal Information Section
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('PERSONAL INFORMATION', margin, 135);
            doc.line(margin, 140, pageWidth - margin, 140);
            
            // Create a table-like layout for personal info
            const personalInfo = [
                ['Full Name', application.userName],
                ['Address', application.address || 'N/A'],
                ['Phone Number', application.phoneNumber || 'N/A'],
                ['House Number', (application as any).houseNumber || 'N/A'],
                ['Caste', (application as any).caste || 'N/A']
            ];
            
            let yPos = 150;
            personalInfo.forEach(([label, value]) => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${label}:`, margin, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(value, margin + 60, yPos);
                yPos += 8;
            });
            
            // Financial Information Section
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('FINANCIAL INFORMATION', margin, yPos + 10);
            doc.line(margin, yPos + 15, pageWidth - margin, yPos + 15);
            
            yPos += 25;
            const financialInfo = [
                ['Total Annual Income', `₹${(application as any).totalIncome?.toLocaleString() || 'N/A'}`],
                ['Income Category', (application as any).incomeCategory?.toUpperCase() || 'N/A'],
                ['Kudumbasree Member', (application as any).isKudumbasreeMember ? 'Yes' : 'No'],
                ['Pays Harithakarmasena Fee', (application as any).paysHarithakarmasenaFee ? 'Yes' : 'No']
            ];
            
            financialInfo.forEach(([label, value]) => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${label}:`, margin, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(value, margin + 60, yPos);
                yPos += 8;
            });

            // Family Information Section
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('FAMILY INFORMATION', margin, yPos + 10);
            doc.line(margin, yPos + 15, pageWidth - margin, yPos + 15);
            
            yPos += 25;
            const familyInfo = [
                ['Family Member with Govt Job', (application as any).hasFamilyMemberWithGovtJob ? 'Yes' : 'No'],
                ['Disabled Person in House', (application as any).hasDisabledPersonInHouse ? 'Yes' : 'No'],
                ['Family Member with Pension', (application as any).hasFamilyMemberWithPension ? 'Yes' : 'No']
            ];
            
            familyInfo.forEach(([label, value]) => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${label}:`, margin, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(value, margin + 60, yPos);
                yPos += 8;
            });

            // Utilities Information Section
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('UTILITIES & AMENITIES', margin, yPos + 10);
            doc.line(margin, yPos + 15, pageWidth - margin, yPos + 15);
            
            yPos += 25;
            const utilitiesInfo = [
                ['Drinking Water Source', (application as any).drinkingWaterSource?.replace('_', ' ').toUpperCase() || 'N/A'],
                ['Has Toilet', (application as any).hasToilet ? 'Yes' : 'No']
            ];
            
            utilitiesInfo.forEach(([label, value]) => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${label}:`, margin, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(value, margin + 60, yPos);
                yPos += 8;
            });

            // Land Information Section (if applicable)
            if ((application as any).ownsLand) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('LAND OWNERSHIP', margin, yPos + 10);
                doc.line(margin, yPos + 15, pageWidth - margin, yPos + 15);
                
                yPos += 25;
                const landInfo = [
                    ['Village Name', (application as any).landDetails?.villageName || 'N/A'],
                    ['Survey Number', (application as any).landDetails?.surveyNumber || 'N/A'],
                    ['Area', (application as any).landDetails?.area || 'N/A']
                ];
                
                landInfo.forEach(([label, value]) => {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${label}:`, margin, yPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(value, margin + 60, yPos);
                    yPos += 8;
                });
            }
            
            // Justification Section
            if (application.justification) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('JUSTIFICATION FOR APPLICATION', margin, yPos + 10);
                doc.line(margin, yPos + 15, pageWidth - margin, yPos + 15);
                
                yPos += 25;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const justificationLines = doc.splitTextToSize(application.justification, pageWidth - 2 * margin - 10);
                doc.text(justificationLines, margin + 5, yPos);
                yPos += justificationLines.length * 5 + 10;
            }
            
            // Declaration Section
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('DECLARATION', margin, yPos + 10);
            doc.line(margin, yPos + 15, pageWidth - margin, yPos + 15);
            
            yPos += 25;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const declaration = [
                "I hereby declare that the information provided above is true and correct to the best of my knowledge.",
                "I understand that any false information may result in rejection of my application.",
                "I agree to provide additional documents if required by the authorities."
            ];
            
            declaration.forEach((text, index) => {
                doc.text(`${index + 1}. ${text}`, margin + 5, yPos);
                yPos += 8;
            });
            
            // Signature section
            yPos += 20;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Signature of Applicant:', margin, yPos);
            doc.line(margin + 50, yPos - 2, margin + 120, yPos - 2);
            
            doc.text('Date:', pageWidth - 80, yPos);
            doc.line(pageWidth - 50, yPos - 2, pageWidth - 20, yPos - 2);
            
            // Official footer
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text('This is a computer generated document and does not require signature.', margin, pageHeight - 30);
            doc.text('For official use only - Erumeli Panchayath Welfare Management System', margin, pageHeight - 20);
            doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, margin, pageHeight - 10);
            
            // Generate filename
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `Welfare-Application-${application.schemeTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.pdf`;
            
            // Save the PDF
            doc.save(filename);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setPrintingPDF(null);
        }
    };
    const [availableSchemes, setAvailableSchemes] = useState<WelfareScheme[]>([]);
    const [schemesLoading, setSchemesLoading] = useState(false);
    const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState<WelfareScheme | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isVerified = !!user?.isVerified;
    const restrictedTabIds = ['my-grievances', 'community-grievances', 'welfare-schemes'];

    // Fetch user's applications
    const fetchMyApplications = async () => {
        const TAG = '[APPS]';
        try {
            const token = localStorage.getItem('token');
            console.log(`${TAG} requesting /api/welfare/applications/user`, { hasToken: !!token });
            const response = await fetch('http://localhost:3002/api/welfare/applications/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const status = response.status;
            let bodyText: string | undefined;
            try { bodyText = await response.clone().text(); } catch (_) {}
            console.log(`${TAG} response`, { status, ok: response.ok, bodyText });
            if (response.ok) {
                let data: any = {};
                try { data = await response.json(); } catch (e) { console.error(`${TAG} JSON parse error`, e); }
                const mapped = (data.applications || []).map((a: any) => {
                    const schemeIdRaw = a.schemeId;
                    const schemeIdStr = (
                        (schemeIdRaw && (schemeIdRaw._id || schemeIdRaw.id)) || schemeIdRaw || ''
                    ).toString();
                    return {
                        id: a._id || a.id || `temp-${Date.now()}-${Math.random()}`,
                        schemeId: schemeIdStr,
                        schemeTitle: a.schemeTitle,
                        userId: a.userId,
                        userName: a.userName,
                        address: a.personalDetails?.address || '',
                        phoneNumber: a.personalDetails?.phoneNumber || '',
                        ward: a.userWard,
                        status: (a.status || 'pending') as ApplicationStatus,
                        createdAt: a.appliedAt,
                        score: a.score,
                        justification: a.justification,
                        // New fields
                        houseNumber: a.personalDetails?.houseNumber || '',
                        caste: a.personalDetails?.caste || '',
                        isKudumbasreeMember: a.personalDetails?.isKudumbasreeMember || false,
                        paysHarithakarmasenaFee: a.personalDetails?.paysHarithakarmasenaFee || false,
                        hasFamilyMemberWithGovtJob: a.personalDetails?.hasFamilyMemberWithGovtJob || false,
                        hasDisabledPersonInHouse: a.personalDetails?.hasDisabledPersonInHouse || false,
                        hasFamilyMemberWithPension: a.personalDetails?.hasFamilyMemberWithPension || false,
                        totalIncome: a.personalDetails?.totalIncome || 0,
                        incomeCategory: a.personalDetails?.incomeCategory || '',
                        ownsLand: a.personalDetails?.ownsLand || false,
                        landDetails: a.personalDetails?.landDetails || { villageName: '', surveyNumber: '', area: '' },
                        drinkingWaterSource: a.personalDetails?.drinkingWaterSource || '',
                        hasToilet: a.personalDetails?.hasToilet || false
                    };
                });
                console.log(`${TAG} mapped`, { count: mapped.length, schemeIds: mapped.map((m:any)=>m.schemeId) });
                setMyApplications(mapped);
            } else {
                let details: any = bodyText;
                try { details = JSON.parse(bodyText || '{}'); } catch (_) {}
                console.error(`${TAG} failed`, { status, statusText: response.statusText, details });
                setMyApplications([]);
            }
        } catch (err) {
            console.error('[APPS] exception', err);
            setMyApplications([]);
        }
    };

    // Fetch user's grievances
    const fetchMyGrievances = async () => {
        setGrievancesLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3002/api/grievances/my', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched grievances data:', data);
                const mapped = (data.grievances || []).map((g: any) => ({
                    id: g.id,
                    userId: g.userId,
                    userName: g.userName,
                    ward: g.ward,
                    imageURL: g.imageURL,
                    attachments: g.attachments || [],
                    issueType: g.issueType,
                    title: g.title || '',
                    category: g.category || '',
                    description: g.description,
                    location: g.location,
                    priorityScore: g.priorityScore,
                    credibilityScore: g.credibilityScore,
                    flags: g.flags || [],
                    audit: g.audit || {},
                    status: g.status as ComplaintStatus,
                    assignedTo: g.assignedTo,
                    officerName: g.officerName,
                    source: g.source,
                    createdAt: g.createdAt,
                    resolvedAt: g.resolvedAt,
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
                
                // Calculate pending video requests count
                const pendingCount = mapped.reduce((count: number, complaint: any) => {
                    const pendingRequests = (complaint.videoProofRequests || []).filter((req: any) => req.status === 'pending');
                    return count + pendingRequests.length;
                }, 0);
                setPendingVideoRequests(pendingCount);
                
                setMyComplaints(mapped);
            } else {
                console.error('Failed to fetch my grievances:', response.statusText);
                setMyComplaints([]);
            }
        } catch (err) {
            console.error('Error fetching my grievances:', err);
            setMyComplaints([]);
        } finally {
            setGrievancesLoading(false);
        }
    };

    // Fetch community grievances
    const fetchCommunityGrievances = async () => {
        setGrievancesLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3002/api/grievances/community', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                const mapped = (data.grievances || []).map((g: any) => ({
                    id: g.id,
                    userId: g.userId,
                    userName: g.userName,
                    ward: g.ward,
                    imageURL: g.imageURL,
                    attachments: g.attachments || [],
                    issueType: g.issueType,
                    title: g.title || '',
                    category: g.category || '',
                    description: g.description,
                    location: g.location,
                    priorityScore: g.priorityScore,
                    credibilityScore: g.credibilityScore,
                    flags: g.flags || [],
                    audit: g.audit || {},
                    status: g.status as ComplaintStatus,
                    assignedTo: g.assignedTo,
                    officerName: g.officerName,
                    source: g.source,
                    createdAt: g.createdAt,
                    resolvedAt: g.resolvedAt
                }));
                setCommunityComplaints(mapped);
            } else {
                console.error('Failed to fetch community grievances:', response.statusText);
                setCommunityComplaints([]);
            }
        } catch (err) {
            console.error('Error fetching community grievances:', err);
            setCommunityComplaints([]);
        } finally {
            setGrievancesLoading(false);
        }
    };

    useEffect(() => {
        fetchMyApplications();
        fetchMyGrievances();
        fetchCommunityGrievances();
        // Load president announcements and upcoming events (public endpoints)
        (async () => {
            try {
                const [a, e] = await Promise.all([
                    fetch(`${API_ENDPOINTS.PRESIDENT_ANNOUNCEMENTS}?audience=citizens`),
                    fetch(`${API_ENDPOINTS.PRESIDENT_EVENTS}?audience=citizens`)
                ]);
                const aj = await a.json();
                const ej = await e.json();
                if (aj.success) setAnnouncements(aj.items || []);
                if (ej.success) setEvents(ej.items || []);
            } catch {}
        })();
    }, []);

    // Poll for new video requests when on My Grievances tab
    useEffect(() => {
        if (activeTab !== 'my-grievances') return;
        
        const pollInterval = setInterval(() => {
            fetchMyGrievances();
        }, 30000); // Poll every 30 seconds
        
        return () => clearInterval(pollInterval);
    }, [activeTab]);

    useEffect(() => {
        const socket = io('http://localhost:3002', { withCredentials: true });
        const refreshAnnouncements = async () => {
            try {
                const res = await fetch(`${API_ENDPOINTS.PRESIDENT_ANNOUNCEMENTS}?audience=citizens`);
                const data = await res.json();
                if (data.success) {
                    setAnnouncements(data.items || []);
                    Swal.fire({ toast: true, icon: 'info', title: 'New announcement', position: 'top-end', timer: 3000, showConfirmButton: false });
                }
            } catch {}
        };
        const refreshEvents = async () => {
            try {
                const res = await fetch(`${API_ENDPOINTS.PRESIDENT_EVENTS}?audience=citizens`);
                const data = await res.json();
                if (data.success) {
                    setEvents(data.items || []);
                    Swal.fire({ toast: true, icon: 'info', title: 'New event', position: 'top-end', timer: 3000, showConfirmButton: false });
                }
            } catch {}
        };
        socket.on('announcement:new', refreshAnnouncements);
        socket.on('event:new', refreshEvents);
        return () => { socket.disconnect(); };
    }, []);


    // Refresh user profile to reflect verification changes done by councillor
    useEffect(() => {
        const refreshUserVerification = async () => {
            try {
                if (!user?.id) return;
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:3002/api/users/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    const latest = data?.user;
                    if (latest && typeof latest.isVerified === 'boolean' && latest.isVerified !== user.isVerified) {
                        login({ ...user, isVerified: latest.isVerified });
                    }
                }
            } catch (e) {
                // Non-blocking; ignore refresh errors
            }
        };
        refreshUserVerification();
        // Run once on mount and when user.id changes
    }, [user?.id]);

    // Fetch available welfare schemes for the citizen's ward
    useEffect(() => {
        const fetchAvailableSchemes = async () => {
            if (!user?.ward) return;
            
            setSchemesLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3002/api/welfare/schemes/citizens/${user.ward}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // Map the schemes to include id field
                    const mappedSchemes = data.schemes?.map((s: any) => ({
                        id: s._id,
                        title: s.title,
                        description: s.description,
                        ward: s.ward,
                        scope: s.scope,
                        status: s.status,
                        approved: s.approved,
                        applicationDeadline: s.applicationDeadline,
                        totalSlots: s.totalSlots,
                        availableSlots: s.availableSlots,
                        creatorName: s.creatorName,
                        category: s.category,
                        minAge: s.minAge,
                        maxAge: s.maxAge,
                        benefits: s.benefits,
                        documentsRequired: s.documentsRequired,
                        startDate: s.startDate,
                        endDate: s.endDate,
                        createdAt: s.createdAt
                    })) || [];
                    
                    setAvailableSchemes(mappedSchemes);
                    
                    // Check for new schemes and create notifications
                    await notificationService.checkForNewSchemes(user.id, user.ward);
                } else {
                    console.error('Failed to fetch schemes:', response.statusText);
                    setAvailableSchemes([]);
                }
            } catch (error) {
                console.error('Error fetching schemes:', error);
                setAvailableSchemes([]);
            } finally {
                setSchemesLoading(false);
            }
        };

        fetchAvailableSchemes();
    }, [user?.ward]);

    // Sidebar navigation items
    const sidebarItems = [
        { id: 'my-ward', name: 'My Ward', icon: 'fa-map-marker-alt', path: '/citizen' },
        { id: 'my-grievances', name: 'My Grievances', icon: 'fa-bullhorn', path: '/citizen' },
        { id: 'community-grievances', name: 'Community Grievances', icon: 'fa-users', path: '/citizen' },
        { id: 'welfare-schemes', name: 'Welfare Schemes', icon: 'fa-hands-helping', path: '/citizen' },
        { id: 'edit-profile', name: 'Edit Profile', icon: 'fa-user-edit', path: '/citizen/edit-profile' },
        { id: 'help', name: 'Help', icon: 'fa-question-circle', path: '/citizen/help' },
    ];

    const handleSidebarNavigation = (itemId: string) => {
        if (!isVerified && restrictedTabIds.includes(itemId)) {
            return;
        }
        if (itemId === 'help') {
            navigate('/citizen/help');
        } else if (itemId === 'edit-profile') {
            navigate('/citizen/edit-profile');
        } else {
            setActiveTab(itemId);
        }
    };

    const handleMenuClick = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleSidebarClose = () => {
        setIsSidebarOpen(false);
    };
    
    const handleGrievanceSubmitted = (newComplaint: Complaint) => {
        setMyComplaints(prev => [newComplaint, ...prev]);
        // Refresh both my grievances and community grievances
        fetchMyGrievances();
        fetchCommunityGrievances();
    };
    
    const hasAppliedForScheme = (schemeId: string) => {
        return myApplications.some(app => String(app.schemeId) === String(schemeId));
    };
    
    const handleApplyClick = (scheme: WelfareScheme) => {
        if (!isVerified) {
            return;
        }
        if (hasAppliedForScheme(scheme.id)) {
            // Already applied: keep UI silent and disable button elsewhere
            return;
        }
        setSelectedScheme(scheme);
        setIsApplicationFormOpen(true);
    };

    const handleApplicationSubmitted = () => {
        // Refresh applications list
        fetchMyApplications();
        setIsApplicationFormOpen(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'my-ward':
                return <MyWardInfo />;
            case 'my-grievances':
                return <MyGrievancesTab complaints={myComplaints} onGrievanceSubmitted={handleGrievanceSubmitted} loading={grievancesLoading} onRefreshNeeded={fetchMyGrievances} pendingVideoRequests={pendingVideoRequests} />;
            case 'community-grievances':
                return <CommunityGrievances complaints={communityComplaints} loading={grievancesLoading} />;
            case 'welfare-schemes':
                return <WelfareSchemesTab schemes={availableSchemes} applications={myApplications} onApplyClick={handleApplyClick} loading={schemesLoading} printingPDF={printingPDF} generateApplicationPDF={generateApplicationPDF} disabledActions={!isVerified} />;
            case 'announcements':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Announcements</h3>
                        <div className="space-y-3">
                            {announcements.map(a => (
                                <details key={a._id} className="border rounded-md p-3 group">
                                    <summary className="font-semibold cursor-pointer select-none flex items-center justify-between">
                                        <span>{a.title}</span>
                                        <span className="ml-2 text-xs text-gray-500">by {a.createdByRole === 'councillor' ? 'Councillor' : (a.createdByRole === 'president' ? 'President' : 'Authority')}</span>
                                        <span className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</span>
                                    </summary>
                                    <div className="text-sm text-gray-700 mt-2">{a.description}</div>
                                </details>
                            ))}
                            {announcements.length === 0 && <div className="text-sm text-gray-500">No announcements.</div>}
                        </div>
                    </div>
                );
            case 'events':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Upcoming Events</h3>
                        <div className="space-y-3">
                            {events.map(ev => {
                                const start = new Date(ev.time);
                                const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${start.toISOString().replace(/[-:]/g,'').split('.')[0]}Z\nSUMMARY:${(ev.title||'Event').replace(/\n/g,' ')}\nDESCRIPTION:${(ev.description||'').replace(/\n/g,' ')}\nLOCATION:${(ev.location||'').replace(/\n/g,' ')}\nEND:VEVENT\nEND:VCALENDAR`;
                                const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                return (
                                    <div key={ev._id} className="border rounded-md p-3 flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold">{ev.title}</div>
                                            <div className="text-sm text-gray-700">{ev.description}</div>
                                            <div className="text-xs text-gray-500 mt-1">{start.toLocaleString()} • {ev.location}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a href={url} download={`${ev.title||'event'}.ics`} className="text-blue-600 text-sm underline">Add to Calendar</a>
                                        </div>
                                    </div>
                                );
                            })}
                            {events.length === 0 && <div className="text-sm text-gray-500">No events scheduled.</div>}
                        </div>
                    </div>
                );
            case 'esabha':
                return <ESabhaTab />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <TokenExpirationWarning />
            {/* Sidebar */}
            <Sidebar 
                items={sidebarItems} 
                onItemClick={handleSidebarNavigation} 
                activeTab={activeTab}
                isOpen={isSidebarOpen}
                onClose={handleSidebarClose}
            />

            {/* Main Content */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
                {/* Navbar */}
                <Navbar onMenuClick={handleMenuClick} />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    {/* Header Section */}
                    <div className="mb-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Welcome, <span className="font-semibold">{user?.name}</span> • Ward {user?.ward} • Erumeli Panchayath
                                </div>
                                <div className="hidden md:flex items-center space-x-6 text-sm text-gray-700">
                                    <div className="text-center">
                                        <div className="text-base font-semibold">{myComplaints.length}</div>
                                        <div>My Grievances</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-base font-semibold">{myApplications.length}</div>
                                        <div>Applications</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Verification Status Banner */}
                    {user && !user.isVerified && (
                        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <i className="fas fa-exclamation-triangle text-yellow-600 text-xl mr-3"></i>
                                <div>
                                    <h3 className="text-yellow-800 font-semibold">Account Verification Required</h3>
                                    <p className="text-yellow-700 text-sm mt-1">
                                        Your account is pending verification by your ward councillor. 
                                        Some features may be limited until verification is complete.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Tabs */}
                    <div className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <nav className="flex space-x-1 p-1 bg-gray-50">
                            {tabs.map((tab) => {
                                const disabled = !isVerified && restrictedTabIds.includes(tab.id);
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => { if (!disabled) setActiveTab(tab.id); }}
                                        disabled={disabled}
                                        className={`flex-1 py-2 px-4 rounded-md font-medium text-sm flex items-center justify-center space-x-2 transition-colors relative ${
                                            disabled
                                                ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400'
                                                : activeTab === tab.id
                                                    ? 'bg-gray-200 text-gray-900'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                        aria-current={activeTab === tab.id ? 'page' : undefined}
                                    >
                                        <i className={`fas ${tab.icon} text-base`}></i>
                                        <span>{tab.name}</span>
                                        {tab.id === 'my-grievances' && pendingVideoRequests > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                                {pendingVideoRequests > 9 ? '9+' : pendingVideoRequests}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="animate-fade-in">{renderContent()}</div>
                </main>
            </div>

            {isApplicationFormOpen && selectedScheme && (
                <WelfareApplicationForm
                    schemeId={selectedScheme.id}
                    schemeTitle={selectedScheme.title}
                    onClose={() => setIsApplicationFormOpen(false)}
                    onSuccess={handleApplicationSubmitted}
                />
            )}
        </div>
    );
};

const MyWardInfo: React.FC = () => {
    const { user, login } = useAuth();
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [wardPopulation, setWardPopulation] = useState<number | null>(null);
    const [activeIssues, setActiveIssues] = useState<number>(0);
    const [councillor, setCouncillor] = useState<{ name: string; email?: string; contactNumber?: string; address?: string; profilePicture?: string } | null>(null);
    const [idProofUploading, setIdProofUploading] = useState(false);
    const [idProofType, setIdProofType] = useState<'aadhar' | 'voter_id' | 'driving_license' | 'ration_card' | 'passport'>('aadhar');
    const [idProofFile, setIdProofFile] = useState<File | null>(null);

    const handleAsk = async () => {
        if (!question.trim() || !user) return;
        setIsLoading(true);
        setError('');
        setAnswer('');
        try {
            const result = await askAboutWard(question, user.ward);
            setAnswer(result);
        } catch (e: any) {
            setError('Sorry, something went wrong. Please try again.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchWardStats = async () => {
            if (!user?.ward) return;
            try {
                const res = await fetch(`${API_ENDPOINTS.WARD_STATS}/${user.ward}/stats`);
                const data = await res.json();
                if (res.ok) {
                    const population = (data && data.stats && typeof data.stats.totalUsers === 'number')
                        ? data.stats.totalUsers
                        : 0;
                    setWardPopulation(population);
                } else setWardPopulation(0);
            } catch (e) {
                setWardPopulation(0);
                console.error('Failed to fetch ward stats', e);
            }
        };
        const fetchActiveIssues = async () => {
            if (!user?.ward) return;
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}/grievances/../stats?ward=${user.ward}`.replace('/users/grievances/..','/grievances'), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                if (res.ok && data) {
                    const active = (data.pending || 0) + (data.in_progress || 0);
                    setActiveIssues(active);
                } else {
                    setActiveIssues(0);
                }
            } catch (e) {
                console.error('Failed to fetch active issues', e);
                setActiveIssues(0);
            }
        };
        const fetchCouncillor = async () => {
            if (!user?.ward) return;
            try {
                const res = await fetch(`${API_ENDPOINTS.WARD_COUNCILLOR}/${user.ward}/councillor`);
                const data = await res.json();
                if (res.ok && data?.success && data?.councillor) {
                    setCouncillor(data.councillor);
                } else {
                    setCouncillor(null);
                }
            } catch (e) {
                console.error('Failed to fetch councillor', e);
                setCouncillor(null);
            }
        };
        fetchWardStats();
        fetchActiveIssues();
        fetchCouncillor();
    }, [user?.ward]);

    return (
        <div className="space-y-8">
            {/* Ward Overview Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Ward {user?.ward} Information</h3>
                    <p className="text-gray-600 text-sm">Official government data and services</p>
                </div>
                <div className="p-5">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-md border border-gray-200 bg-gray-50">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i className="fas fa-users text-gray-700"></i>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">Population</h4>
                            <p className="text-lg font-semibold text-gray-800">{wardPopulation !== null ? wardPopulation.toLocaleString() : '0'}</p>
                            <p className="text-gray-600 text-xs">Registered Users</p>
                        </div>
                        <div className="text-center p-4 rounded-md border border-gray-200 bg-gray-50">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i className="fas fa-check-circle text-gray-700"></i>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">Active Issues</h4>
                            <p className="text-lg font-semibold text-gray-800">{activeIssues}</p>
                            <p className="text-gray-600 text-xs">Under Resolution</p>
                        </div>
                        <div className="text-center p-4 rounded-md border border-gray-200 bg-gray-50">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i className="fas fa-star text-gray-700"></i>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">Rating</h4>
                            <p className="text-lg font-semibold text-gray-800">4.2/5</p>
                            <p className="text-gray-600 text-xs">Citizen Satisfaction</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ID Proof Upload Prompt for unverified users */}
            {user && !user.isVerified && (!user.idProof || !user.idProof.fileUrl) && (
                <div className="bg-yellow-50 rounded-lg border border-yellow-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-yellow-200">
                        <h3 className="text-base font-semibold text-yellow-900">Upload ID Proof to Complete Verification</h3>
                        <p className="text-yellow-800 text-sm">Upload any one valid document. Your councillor will review and verify your account.</p>
                    </div>
                    <div className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <select value={idProofType} onChange={e => setIdProofType(e.target.value as any)} className="border rounded-md px-3 py-2 text-sm w-full md:w-48">
                                <option value="aadhar">Aadhar</option>
                                <option value="voter_id">Voter ID</option>
                                <option value="driving_license">Driving License</option>
                                <option value="ration_card">Ration Card</option>
                                <option value="passport">Passport</option>
                            </select>
                            <input type="file" accept="image/*,application/pdf" onChange={e => setIdProofFile(e.target.files?.[0] || null)} className="text-sm" />
                            <button
                                onClick={async () => {
                                    if (!idProofFile || !user) return;
                                    setIdProofUploading(true);
                                    try {
                                        const formData = new FormData();
                                        formData.append('type', idProofType);
                                        formData.append('idProof', idProofFile);
                                        const token = localStorage.getItem('token');
                                        const res = await fetch(`${API_ENDPOINTS.USER_PROFILE}/${user.id}/id-proof`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${token}` },
                                            body: formData
                                        });
                                        if (res.ok) {
                                            const data = await res.json();
                                            login({ ...(user as any), idProof: data.user.idProof });
                                        }
                                    } catch (e) {
                                        console.error('ID proof upload failed', e);
                                    } finally {
                                        setIdProofUploading(false);
                                    }
                                }}
                                disabled={idProofUploading || !idProofFile}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm"
                            >
                                {idProofUploading ? 'Uploading...' : 'Upload Proof'}
                            </button>
                        </div>
                        <p className="text-xs text-yellow-700 mt-2">Accepted: images or PDF. Max 5MB.</p>
                    </div>
                </div>
            )}

            {/* Councillor Information */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Your Ward Representative</h3>
                    <p className="text-gray-600 text-sm">Direct contact with your elected official</p>
                </div>
                <div className="p-5">
                    {councillor ? (
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                                {councillor.profilePicture ? (
                                    <img src={councillor.profilePicture} alt={councillor.name} className="w-full h-full object-cover" />
                                ) : (
                                    <i className="fas fa-user-tie text-gray-700"></i>
                                )}
                        </div>
                        <div className="flex-1">
                                <h4 className="text-base font-semibold text-gray-900">{councillor.name}</h4>
                                <p className="text-gray-600 text-sm mb-2">Ward {user?.ward}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <i className="fas fa-map-marker-alt text-gray-600"></i>
                                        <span>{councillor.address || 'Office details unavailable'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <i className="fas fa-phone text-gray-600"></i>
                                        <span>{councillor.contactNumber || 'N/A'}</span>
                                </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <i className="fas fa-envelope text-gray-600"></i>
                                        <span>{councillor.email}</span>
                                </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <i className="fas fa-clock text-gray-600"></i>
                                        <span>Mon-Fri: 9 AM - 5 PM</span>
                                </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-600">Councillor information is not available for your ward.</div>
                    )}
                </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Government AI Assistant</h3>
                    <p className="text-gray-600 text-sm">Get answers about your ward and services</p>
                </div>
                <div className="p-5">
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g., When is the next garbage collection? What are the current welfare schemes?"
                            className="flex-grow p-2.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                            aria-labelledby="ask-ai-label"
                        />
                        <button 
                            onClick={handleAsk} 
                            disabled={isLoading || !question.trim()} 
                            className="px-4 py-2 bg-gray-800 text-white font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? <Spinner size="sm" /> : (
                                <>
                                    <i className="fas fa-robot mr-2"></i>
                                    Ask AI
                                </>
                            )}
                        </button>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-3" role="alert">
                            <div className="flex items-center">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                <span className="font-medium">{error}</span>
                            </div>
                        </div>
                    )}
                    
                    {isLoading && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
                            <Spinner message="Processing your request..." />
                        </div>
                    )}
                    
                    {answer && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4" aria-live="polite">
                            <div className="flex items-center mb-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                                    <i className="fas fa-robot text-gray-700"></i>
                                </div>
                                <h4 className="font-semibold text-gray-900">Government AI Response</h4>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{answer}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MyGrievancesTab: React.FC<{ 
    complaints: Complaint[], 
    onGrievanceSubmitted: (complaint: Complaint) => void, 
    loading?: boolean,
    onRefreshNeeded?: () => void,
    pendingVideoRequests?: number 
}> = ({ complaints, onGrievanceSubmitted, loading = false, onRefreshNeeded, pendingVideoRequests = 0 }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-800 to-red-900 px-8 py-6 text-white">
                        <h3 className="text-2xl font-bold mb-2">My Submitted Grievances</h3>
                        <p className="text-red-100">Track the status of your civic issue reports</p>
                    </div>
                    {pendingVideoRequests > 0 && (
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-4 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <i className="fas fa-video text-xl mr-3"></i>
                                    <div>
                                        <h4 className="font-semibold">Video Evidence Requested</h4>
                                        <p className="text-purple-100 text-sm">
                                            You have {pendingVideoRequests} pending video evidence request{pendingVideoRequests > 1 ? 's' : ''} from councillors
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                    <span className="font-bold">{pendingVideoRequests}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="p-8">
                        {loading ? (
                            <div className="text-center py-16">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                <p className="mt-2 text-gray-500">Loading grievances...</p>
                            </div>
                        ) : complaints.length > 0 ? (
                            <div className="space-y-6">
                                {complaints.map(c => (
                                    <div key={c.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
                                                        <i className="fas fa-exclamation-triangle text-white"></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-gray-800">{c.issueType}</p>
                                                        <p className="text-sm text-gray-600">Priority Score: {c.priorityScore}/5</p>
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 mb-3 leading-relaxed">{c.description}</p>
                                                <div className="flex items-center space-x-6 text-sm text-gray-500">
                                                    <span className="flex items-center">
                                                        <i className="fas fa-calendar mr-2"></i>
                                                        {new Date(c.createdAt).toLocaleDateString()}
                                                    </span>
                                                    {typeof c.credibilityScore === 'number' && (
                                                        <span className="flex items-center" title="Credibility Score">
                                                            <i className="fas fa-shield-alt mr-2"></i>
                                                            {(c.credibilityScore * 100).toFixed(0)}%
                                                        </span>
                                                    )}
                                                    {c.location && (
                                                        <span className="flex items-center">
                                                            <i className="fas fa-map-marker-alt mr-2"></i>
                                                            <span title={`${c.location?.lat?.toFixed?.(6)}, ${c.location?.lng?.toFixed?.(6)}`}>
                                                                {c.location?.address || `${c.location?.lat?.toFixed?.(6)}, ${c.location?.lng?.toFixed?.(6)}`}
                                                            </span>
                                                        </span>
                                                    )}
                                                    {c.assignedTo && (
                                                        <span className="flex items-center">
                                                            <i className="fas fa-user-tie mr-2"></i>
                                                            {c.officerName}
                                                        </span>
                                                    )}
                                                </div>
                                                {!!(c.flags && c.flags.length) && (
                                                    <div className="mt-2 text-xs text-red-600">
                                                        <i className="fas fa-flag mr-1"></i>
                                                        {c.flags.join(', ')}
                                                    </div>
                                                )}
                                                <VideoProofRequestSection 
                                                    complaint={c} 
                                                    onVideoUploaded={() => {
                                                        if (onRefreshNeeded) {
                                                            onRefreshNeeded();
                                                        }
                                                    }} 
                                                />
                                            </div>
                                            <div className="flex-shrink-0">
                                                <span className={`px-4 py-2 text-sm font-semibold rounded-xl ${STATUS_COLORS[c.status]} shadow-lg`}>
                                                    {c.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <i className="fas fa-inbox text-3xl text-gray-400"></i>
                                </div>
                                <h4 className="text-xl font-bold text-gray-700 mb-2">No Grievances Submitted</h4>
                                <p className="text-gray-500 mb-6">You haven't submitted any civic issues yet.</p>
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                                    <p className="text-blue-800 text-sm">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        Submit your first grievance using the form on the right to get started.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div>
                <SubmitGrievance onGrievanceSubmitted={onGrievanceSubmitted} />
            </div>
        </div>
    );
};

const WelfareSchemesTab: React.FC<{ schemes: WelfareScheme[], applications: WelfareApplication[], onApplyClick: (scheme: WelfareScheme) => void, loading?: boolean, printingPDF: string | null, generateApplicationPDF: (application: WelfareApplication) => void, disabledActions?: boolean }> = ({ schemes, applications, onApplyClick, loading = false, printingPDF, generateApplicationPDF, disabledActions = false }) => {
    const hasAppliedForScheme = (schemeId: string) => {
        return applications.some(app => String(app.schemeId) === String(schemeId));
    };
    
    const [appFilter, setAppFilter] = React.useState<'active' | 'accepted' | 'rejected' | 'old'>('active');

    const filteredApplications = React.useMemo(() => {
        const now = Date.now();
        const isAccepted = (s: string) => ['approved', 'accepted'].includes(String(s || '').toLowerCase());
        const isRejected = (s: string) => String(s || '').toLowerCase() === 'rejected';
        const schemeById = new Map(schemes.map(s => [String(s.id), s]));
        const isSchemeExpired = (schemeId: string) => {
            const s = schemeById.get(String(schemeId));
            if (!s) return false;
            const deadline = s.applicationDeadline || s.endDate;
            if (!deadline) return false;
            const ts = new Date(deadline as any).getTime();
            return Number.isFinite(ts) && ts < now;
        };
        return applications.filter(a => {
            if (appFilter === 'accepted') return isAccepted(a.status as any);
            if (appFilter === 'rejected') return isRejected(a.status as any);
            if (appFilter === 'old') return isSchemeExpired(String(a.schemeId));
            // active: not accepted and not rejected
            return !isAccepted(a.status as any) && !isRejected(a.status as any);
        });
    }, [applications, appFilter, schemes]);
    
    const counts = React.useMemo(() => {
        const now = Date.now();
        const isAccepted = (s: string) => ['approved', 'accepted'].includes(String(s || '').toLowerCase());
        const isRejected = (s: string) => String(s || '').toLowerCase() === 'rejected';
        const schemeById = new Map(schemes.map(s => [String(s.id), s]));
        const isSchemeExpired = (schemeId: string) => {
            const s = schemeById.get(String(schemeId));
            if (!s) return false;
            const deadline = s.applicationDeadline || s.endDate;
            if (!deadline) return false;
            const ts = new Date(deadline as any).getTime();
            return Number.isFinite(ts) && ts < now;
        };
        let accepted = 0, rejected = 0, old = 0, active = 0;
        for (const a of applications) {
            if (isAccepted(a.status as any)) accepted++;
            else if (isRejected(a.status as any)) rejected++;
            else active++;
            if (isSchemeExpired(String(a.schemeId))) old++;
        }
        return { accepted, rejected, active, old };
    }, [applications, schemes]);
    
    return (
    <div className="space-y-6 animate-fade-in">
        <SabhaMeetingJoin />
        {/* Available Schemes */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Available Welfare Schemes</h3>
                <p className="text-gray-600 text-sm">Government assistance programs for eligible citizens</p>
            </div>
            <div className="p-5">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center">
                            <Spinner size="lg" />
                            <span className="ml-3 text-gray-600">Loading available schemes...</span>
                        </div>
                    </div>
                ) : schemes.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {schemes.map(s => (
                            <div key={s.id} className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 text-gray-800">
                                        <i className="fas fa-hands-helping text-gray-700"></i>
                                        <h4 className="font-semibold text-gray-900">{s.title}</h4>
                                    </div>
                                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded">Active</span>
                                </div>
                                <p className="text-gray-700 mb-2 text-sm">{s.description}</p>
                                <div className="flex items-center justify-between mb-3 text-sm text-gray-700">
                                    <span>
                                        <i className="fas fa-building mr-1"></i>
                                        {(s as any).creatorName}
                                    </span>
                                    <span>
                                        <i className="fas fa-users mr-1"></i>
                                        {(s as any).availableSlots} slots
                                    </span>
                                </div>
                                <button 
                                    onClick={() => onApplyClick(s)} 
                                    disabled={hasAppliedForScheme(s.id) || disabledActions}
                                    className={`w-full text-white font-medium py-2.5 px-4 rounded-md flex items-center justify-center ${
                                        hasAppliedForScheme(s.id) || disabledActions ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'
                                    }`}
                                >
                                    <i className="fas fa-edit mr-2"></i>
                                    {hasAppliedForScheme(s.id) ? 'Already Applied' : (disabledActions ? 'Verify to Apply' : 'Apply Now')}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-600 text-sm">No schemes available right now.</div>
                )}
            </div>
        </div>

        {/* My Applications */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">My Applications</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <button
                        onClick={() => setAppFilter('active')}
                        className={`px-3 py-1.5 rounded-md border ${appFilter === 'active' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'}`}
                        aria-current={appFilter === 'active' ? 'page' : undefined}
                    >
                        Active ({counts.active})
                    </button>
                    <button
                        onClick={() => setAppFilter('accepted')}
                        className={`px-3 py-1.5 rounded-md border ${appFilter === 'accepted' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'}`}
                        aria-current={appFilter === 'accepted' ? 'page' : undefined}
                    >
                        Accepted ({counts.accepted})
                    </button>
                    <button
                        onClick={() => setAppFilter('rejected')}
                        className={`px-3 py-1.5 rounded-md border ${appFilter === 'rejected' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'}`}
                        aria-current={appFilter === 'rejected' ? 'page' : undefined}
                    >
                        Rejected ({counts.rejected})
                    </button>
                    <button
                        onClick={() => setAppFilter('old')}
                        className={`px-3 py-1.5 rounded-md border ${appFilter === 'old' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'}`}
                        aria-current={appFilter === 'old' ? 'page' : undefined}
                    >
                        Old ({counts.old})
                    </button>
                </div>
            </div>
            <div className="p-5">
                {filteredApplications.length > 0 ? (
                    <div className="space-y-4">
                        {filteredApplications.map(app => (
                            <div key={app.id} className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <i className="fas fa-file-alt text-gray-700"></i>
                                            </div>
                                            <div>
                                                <h4 className="text-base font-semibold text-gray-900">{app.schemeTitle}</h4>
                                                <p className="text-xs text-gray-600">Score: {app.score}/100</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 mb-2">
                                            <div>
                                                <span className="font-medium">Applied:</span> {new Date(app.createdAt).toLocaleDateString()}
                                            </div>
                                            <div>
                                                <span className="font-medium">Total Income:</span> ₹{(app.totalIncome || 0).toLocaleString()}
                                            </div>
                                            <div>
                                                <span className="font-medium">Income Category:</span> {(app.incomeCategory || 'N/A').toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="font-medium">Address:</span> {app.address}
                                            </div>
                                        </div>
                                        {app.justification && (
                                            <p className="text-gray-700 text-sm">
                                                <span className="font-medium">Justification:</span> {app.justification}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col gap-2">
                                        <span className={`px-3 py-1.5 text-xs font-medium rounded-md ${STATUS_COLORS[app.status]}`}>
                                            {app.status}
                                        </span>
                                        <button
                                            onClick={() => generateApplicationPDF(app)}
                                            disabled={printingPDF === app.id}
                                            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                printingPDF === app.id
                                                    ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                                                    : 'text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100'
                                            }`}
                                        >
                                            {printingPDF === app.id ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-print"></i>
                                                    Print PDF
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-600 text-sm">No applications submitted yet.</div>
                )}
            </div>
        </div>
    </div>
    );
};

export default CitizenDashboard;
