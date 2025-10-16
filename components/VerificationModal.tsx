import React, { useState } from 'react';

interface Document {
  url: string;
  name: string;
  type?: string;
}

interface PersonalDetails {
  address: string;
  phoneNumber: string;
  houseNumber: string;
  caste: string;
  isKudumbasreeMember: boolean;
  paysHarithakarmasenaFee: boolean;
  hasFamilyMemberWithGovtJob: boolean;
  hasDisabledPersonInHouse: boolean;
  hasFamilyMemberWithPension: boolean;
  totalIncome: number;
  familyIncome?: number; // Keep for backward compatibility
  incomeCategory: string;
  ownsLand: boolean;
  landDetails?: {
    villageName?: string;
    surveyNumber?: string;
    area?: string;
  };
  drinkingWaterSource: string;
  hasToilet: boolean;
  // Legacy fields for backward compatibility
  rationCardNumber?: string;
  aadharNumber?: string;
  dependents?: number;
  isHandicapped?: boolean;
  isSingleWoman?: boolean;
}

interface Assessment {
  age?: number;
  educationLevel?: string;
  employmentStatus?: string;
  houseOwnership?: string;
  familyMembers?: number;
  disabledMembers?: number;
  previousApplications?: number;
  monthlyIncome?: number;
}

interface WelfareApplication {
  _id: string;
  schemeId: {
    _id: string;
    title: string;
    scope: 'panchayath' | 'ward';
    ward?: number;
  };
  schemeTitle: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  userName: string;
  userEmail: string;
  userWard: number;
  personalDetails: PersonalDetails;
  assessment?: Assessment;
  reason: string;
  documents?: Document[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed';
  appliedAt: string;
  verification?: {
    mode?: 'none' | 'manual' | 'auto';
    autoScore?: number;
    remarks?: string;
  };
  verificationStatus?: 'Pending' | 'Verified-Manual' | 'Verified-Auto' | 'Rejected';
}

interface VerificationModalProps {
  application: WelfareApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (appId: string, approve: boolean, remarks: string) => Promise<void>;
  verifying: boolean;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  application,
  isOpen,
  onClose,
  onVerify,
  verifying
}) => {
  const [remarks, setRemarks] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  if (!isOpen || !application) return null;

  const handleVerify = async (approve: boolean) => {
    await onVerify(application._id, approve, remarks);
    setRemarks('');
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDocumentIcon = (type?: string, url?: string) => {
    if (!type && url) {
      const extension = url.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'fa-image';
      if (extension === 'pdf') return 'fa-file-pdf';
      if (['doc', 'docx'].includes(extension || '')) return 'fa-file-word';
      return 'fa-file';
    }
    if (!type) return 'fa-file';
    if (type.includes('image')) return 'fa-image';
    if (type.includes('pdf')) return 'fa-file-pdf';
    if (type.includes('word')) return 'fa-file-word';
    return 'fa-file';
  };

  const isImageFile = (type?: string, url?: string) => {
    if (type && type.includes('image')) return true;
    if (url) {
      const extension = url.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '');
    }
    return false;
  };

  const openDocumentViewer = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDocumentViewer(true);
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4">
        <div className="bg-white shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border-2 border-gray-300">
          {/* Government Document Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 border-b-4 border-red-600">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                    <i className="fas fa-landmark text-slate-800 text-xl"></i>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-wide">GOVERNMENT OF KERALA</h1>
                    <h2 className="text-lg font-semibold text-gray-200">WELFARE APPLICATION VERIFICATION</h2>
                  </div>
                </div>
                <div className="text-sm text-gray-300 mt-2">
                  <p>Application ID: {application._id.slice(-8).toUpperCase()}</p>
                  <p>Verification Date: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 text-2xl bg-red-600 hover:bg-red-700 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)] bg-gray-50">
            {/* Official Document Body */}
            <div className="bg-white border-2 border-gray-400 shadow-lg">
              <div className="p-8">
                {/* Document Header */}
                <div className="text-center border-b-2 border-gray-300 pb-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                    WELFARE SCHEME APPLICATION VERIFICATION REPORT
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">Official Government Document</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Application Details */}
                  <div className="space-y-6">
                    {/* Scheme Information */}
                    <div className="border border-gray-400 bg-gray-50">
                      <div className="bg-slate-700 text-white p-3 border-b border-gray-400">
                        <h3 className="text-lg font-bold uppercase tracking-wide flex items-center">
                          <i className="fas fa-clipboard-list mr-3"></i>
                          SCHEME DETAILS
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="border-b border-gray-300 pb-2">
                          <span className="font-bold text-gray-700 uppercase text-sm">Scheme Name:</span>
                          <p className="text-gray-900 font-semibold mt-1">{application.schemeTitle}</p>
                        </div>
                        <div className="border-b border-gray-300 pb-2">
                          <span className="font-bold text-gray-700 uppercase text-sm">Application Date:</span>
                          <p className="text-gray-900 font-semibold mt-1">
                            {new Date(application.appliedAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Applicant Information */}
                    <div className="border border-gray-400 bg-gray-50">
                      <div className="bg-slate-700 text-white p-3 border-b border-gray-400">
                        <h3 className="text-lg font-bold uppercase tracking-wide flex items-center">
                          <i className="fas fa-user mr-3"></i>
                          APPLICANT INFORMATION
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Full Name:</span>
                            <p className="text-gray-900 font-semibold mt-1">{application.userName}</p>
                          </div>
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Ward Number:</span>
                            <p className="text-gray-900 font-semibold mt-1">Ward {application.userWard}</p>
                          </div>
                        </div>
                        <div className="border-b border-gray-300 pb-2">
                          <span className="font-bold text-gray-700 uppercase text-sm">Email Address:</span>
                          <p className="text-gray-900 font-semibold mt-1">{application.userEmail || 'Not Provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Personal Details */}
                    <div className="border border-gray-400 bg-gray-50">
                      <div className="bg-slate-700 text-white p-3 border-b border-gray-400">
                        <h3 className="text-lg font-bold uppercase tracking-wide flex items-center">
                          <i className="fas fa-id-card mr-3"></i>
                          PERSONAL DETAILS
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Contact Number:</span>
                            <p className="text-gray-900 font-semibold mt-1">{application.personalDetails.phoneNumber}</p>
                          </div>
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">House Number:</span>
                            <p className="text-gray-900 font-semibold mt-1">{application.personalDetails.houseNumber || 'Not Provided'}</p>
                          </div>
                        </div>
                        <div className="border-b border-gray-300 pb-2">
                          <span className="font-bold text-gray-700 uppercase text-sm">Residential Address:</span>
                          <p className="text-gray-900 font-semibold mt-1">{application.personalDetails.address}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Caste Category:</span>
                            <p className="text-gray-900 font-semibold mt-1 uppercase">{application.personalDetails.caste || 'Not Provided'}</p>
                          </div>
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Income Category:</span>
                            <p className="text-gray-900 font-semibold mt-1 uppercase">{application.personalDetails.incomeCategory || 'Not Provided'}</p>
                          </div>
                        </div>
                        <div className="border-b border-gray-300 pb-2">
                          <span className="font-bold text-gray-700 uppercase text-sm">Total Annual Income:</span>
                          <p className="text-gray-900 font-semibold mt-1">{formatCurrency(application.personalDetails.totalIncome || application.personalDetails.familyIncome || 0)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Land Ownership:</span>
                            <p className="text-gray-900 font-semibold mt-1">{application.personalDetails.ownsLand ? 'Yes' : 'No'}</p>
                          </div>
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Toilet Facility:</span>
                            <p className="text-gray-900 font-semibold mt-1">{application.personalDetails.hasToilet ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                        <div className="border-b border-gray-300 pb-2">
                          <span className="font-bold text-gray-700 uppercase text-sm">Drinking Water Source:</span>
                          <p className="text-gray-900 font-semibold mt-1 capitalize">{(application.personalDetails.drinkingWaterSource || 'Not Provided').replace('_', ' ')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Kudumbasree Member:</span>
                            <p className="text-gray-900 font-semibold mt-1">{application.personalDetails.isKudumbasreeMember ? 'Yes' : 'No'}</p>
                          </div>
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Harithakarmasena Fee:</span>
                            <p className="text-gray-900 font-semibold mt-1">{application.personalDetails.paysHarithakarmasenaFee ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Govt. Job in Family:</span>
                            <p className="text-gray-900 font-semibold mt-1">{application.personalDetails.hasFamilyMemberWithGovtJob ? 'Yes' : 'No'}</p>
                          </div>
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Disabled Person:</span>
                            <p className="text-gray-900 font-semibold mt-1">{application.personalDetails.hasDisabledPersonInHouse ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                        <div className="border-b border-gray-300 pb-2">
                          <span className="font-bold text-gray-700 uppercase text-sm">Family Member with Pension:</span>
                          <p className="text-gray-900 font-semibold mt-1">{application.personalDetails.hasFamilyMemberWithPension ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column - Documents and Verification */}
                  <div className="space-y-6">
                    {/* Documents */}
                    <div className="border border-gray-400 bg-gray-50">
                      <div className="bg-slate-700 text-white p-3 border-b border-gray-400">
                        <h3 className="text-lg font-bold uppercase tracking-wide flex items-center">
                          <i className="fas fa-file-alt mr-3"></i>
                          SUPPORTING DOCUMENTS
                        </h3>
                      </div>
                      <div className="p-4">
                        {application.documents && application.documents.length > 0 ? (
                          <div className="space-y-3">
                            {application.documents.map((doc, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => openDocumentViewer(doc)}
                              >
                                <div className="flex items-center">
                                  <i className={`fas ${getDocumentIcon(doc.type, doc.url)} text-red-600 mr-3 text-lg`}></i>
                                  <div>
                                    <p className="font-bold text-gray-800 uppercase text-sm">{doc.name}</p>
                                    <p className="text-xs text-gray-500">{doc.type || 'Document'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center text-gray-500">
                                  <span className="text-xs mr-2">VIEW</span>
                                  <i className="fas fa-eye"></i>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <i className="fas fa-file-alt text-4xl text-gray-400 mb-3"></i>
                            <p className="text-gray-500 font-semibold">No supporting documents uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current Status */}
                    <div className="border border-gray-400 bg-gray-50">
                      <div className="bg-slate-700 text-white p-3 border-b border-gray-400">
                        <h3 className="text-lg font-bold uppercase tracking-wide flex items-center">
                          <i className="fas fa-info-circle mr-3"></i>
                          APPLICATION STATUS
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="border-b border-gray-300 pb-2">
                          <span className="font-bold text-gray-700 uppercase text-sm">Current Status:</span>
                          <div className="mt-2">
                            <span className={`inline-block px-3 py-1 rounded text-sm font-bold uppercase ${
                              application.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-300' :
                              application.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-300' :
                              'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            }`}>
                              {application.status}
                            </span>
                          </div>
                        </div>
                        {application.verificationStatus && (
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">Verification Status:</span>
                            <div className="mt-2">
                              <span className={`inline-block px-3 py-1 rounded text-sm font-bold uppercase ${
                                application.verificationStatus === 'Verified-Manual' || application.verificationStatus === 'Verified-Auto' 
                                  ? 'bg-green-100 text-green-800 border border-green-300' :
                                application.verificationStatus === 'Rejected' 
                                  ? 'bg-red-100 text-red-800 border border-red-300' :
                                  'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              }`}>
                                {application.verificationStatus}
                              </span>
                            </div>
                          </div>
                        )}
                        {application.verification?.autoScore && (
                          <div className="border-b border-gray-300 pb-2">
                            <span className="font-bold text-gray-700 uppercase text-sm">AI Assessment Score:</span>
                            <p className="text-gray-900 font-bold text-lg mt-1">{Math.round(application.verification.autoScore * 100)}%</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Remarks */}
                    <div className="border border-gray-400 bg-gray-50">
                      <div className="bg-slate-700 text-white p-3 border-b border-gray-400">
                        <h3 className="text-lg font-bold uppercase tracking-wide flex items-center">
                          <i className="fas fa-edit mr-3"></i>
                          VERIFICATION REMARKS
                        </h3>
                      </div>
                      <div className="p-4">
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Enter official verification remarks and observations..."
                          className="w-full p-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                          rows={6}
                        />
                        <p className="text-xs text-gray-500 mt-2 italic">
                          * Official remarks will be recorded in the government database
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Government Document Footer */}
          <div className="bg-slate-800 text-white p-4 border-t-4 border-red-600">
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <p className="font-semibold">GOVERNMENT OF KERALA - WELFARE DEPARTMENT</p>
                <p className="text-gray-300">Official Verification Document - Confidential</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wide rounded border-2 border-red-500 transition-colors"
                >
                  Close Document
                </button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-600 text-xs text-gray-300 text-center">
              <p>This document is generated by the official Government of Kerala Welfare Management System</p>
              <p>Document ID: {application._id.slice(-12).toUpperCase()} | Generated: {new Date().toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Government Document Viewer Modal */}
      {showDocumentViewer && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1100] p-4">
          <div className="bg-white shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border-2 border-gray-400">
            <div className="bg-slate-800 text-white p-4 border-b-2 border-red-600 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wide">{selectedDocument.name}</h3>
                <p className="text-sm text-gray-300">Official Government Document Viewer</p>
              </div>
              <button
                onClick={() => setShowDocumentViewer(false)}
                className="text-white hover:text-gray-300 text-xl bg-red-600 hover:bg-red-700 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4">
              {isImageFile(selectedDocument.type, selectedDocument.url) ? (
                <img
                  src={selectedDocument.url}
                  alt={selectedDocument.name}
                  className="max-w-full max-h-[70vh] mx-auto"
                />
              ) : selectedDocument.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  title="PDF Preview"
                  src={selectedDocument.url}
                  className="w-full h-[70vh]"
                />
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-file text-6xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600 mb-4">Document preview not available</p>
                  <a
                    href={selectedDocument.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Download Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VerificationModal;