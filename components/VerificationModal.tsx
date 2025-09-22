import React, { useState } from 'react';

interface Document {
  url: string;
  name: string;
  type?: string;
}

interface PersonalDetails {
  address: string;
  phoneNumber: string;
  rationCardNumber?: string;
  aadharNumber?: string;
  familyIncome: number;
  dependents: number;
  isHandicapped: boolean;
  isSingleWoman: boolean;
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Application Verification</h2>
                <p className="text-blue-100 mt-1">
                  Review application details and documents before making a decision
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Application Details */}
              <div className="space-y-6">
                {/* Scheme Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <i className="fas fa-clipboard-list text-blue-600 mr-2"></i>
                    Scheme Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-600">Scheme:</span>
                      <span className="ml-2 text-gray-800">{application.schemeTitle}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Scope:</span>
                      <span className="ml-2 text-gray-800 capitalize">{application.schemeId.scope}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Applied On:</span>
                      <span className="ml-2 text-gray-800">
                        {new Date(application.appliedAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Applicant Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <i className="fas fa-user text-green-600 mr-2"></i>
                    Applicant Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-600">Name:</span>
                      <span className="ml-2 text-gray-800">{application.userName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <span className="ml-2 text-gray-800">{application.userEmail}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Ward:</span>
                      <span className="ml-2 text-gray-800">Ward {application.userWard}</span>
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <i className="fas fa-id-card text-purple-600 mr-2"></i>
                    Personal Details
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-600">Address:</span>
                      <span className="ml-2 text-gray-800">{application.personalDetails.address}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span className="ml-2 text-gray-800">{application.personalDetails.phoneNumber}</span>
                    </div>
                    {application.personalDetails.aadharNumber && (
                      <div>
                        <span className="font-medium text-gray-600">Aadhar:</span>
                        <span className="ml-2 text-gray-800">{application.personalDetails.aadharNumber}</span>
                      </div>
                    )}
                    {application.personalDetails.rationCardNumber && (
                      <div>
                        <span className="font-medium text-gray-600">Ration Card:</span>
                        <span className="ml-2 text-gray-800">{application.personalDetails.rationCardNumber}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-600">Family Income:</span>
                      <span className="ml-2 text-gray-800">{formatCurrency(application.personalDetails.familyIncome)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Dependents:</span>
                      <span className="ml-2 text-gray-800">{application.personalDetails.dependents}</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600">Handicapped:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          application.personalDetails.isHandicapped 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {application.personalDetails.isHandicapped ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600">Single Woman:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          application.personalDetails.isSingleWoman 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {application.personalDetails.isSingleWoman ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assessment Details */}
                {application.assessment && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <i className="fas fa-chart-line text-orange-600 mr-2"></i>
                      Assessment Details
                    </h3>
                    <div className="space-y-2">
                      {application.assessment.age && (
                        <div>
                          <span className="font-medium text-gray-600">Age:</span>
                          <span className="ml-2 text-gray-800">{application.assessment.age} years</span>
                        </div>
                      )}
                      {application.assessment.educationLevel && (
                        <div>
                          <span className="font-medium text-gray-600">Education:</span>
                          <span className="ml-2 text-gray-800 capitalize">{application.assessment.educationLevel}</span>
                        </div>
                      )}
                      {application.assessment.employmentStatus && (
                        <div>
                          <span className="font-medium text-gray-600">Employment:</span>
                          <span className="ml-2 text-gray-800 capitalize">{application.assessment.employmentStatus}</span>
                        </div>
                      )}
                      {application.assessment.houseOwnership && (
                        <div>
                          <span className="font-medium text-gray-600">House Ownership:</span>
                          <span className="ml-2 text-gray-800 capitalize">{application.assessment.houseOwnership}</span>
                        </div>
                      )}
                      {application.assessment.monthlyIncome && (
                        <div>
                          <span className="font-medium text-gray-600">Monthly Income:</span>
                          <span className="ml-2 text-gray-800">{formatCurrency(application.assessment.monthlyIncome)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <i className="fas fa-comment-alt text-indigo-600 mr-2"></i>
                    Application Reason
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{application.reason}</p>
                </div>
              </div>

              {/* Right Column - Documents and Verification */}
              <div className="space-y-6">
                {/* Documents */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <i className="fas fa-file-alt text-red-600 mr-2"></i>
                    Uploaded Documents
                  </h3>
                  {application.documents && application.documents.length > 0 ? (
                    <div className="space-y-2">
                      {application.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                          onClick={() => openDocumentViewer(doc)}
                        >
                          <div className="flex items-center">
                            <i className={`fas ${getDocumentIcon(doc.type, doc.url)} text-blue-600 mr-3`}></i>
                            <div>
                              <p className="font-medium text-gray-800">{doc.name}</p>
                              <p className="text-sm text-gray-500">{doc.type || 'Document'}</p>
                            </div>
                          </div>
                          <i className="fas fa-eye text-gray-400"></i>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No documents uploaded</p>
                  )}
                </div>

                {/* Current Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <i className="fas fa-info-circle text-yellow-600 mr-2"></i>
                    Current Status
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        application.status === 'approved' ? 'bg-green-100 text-green-800' :
                        application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {application.status}
                      </span>
                    </div>
                    {application.verificationStatus && (
                      <div>
                        <span className="font-medium text-gray-600">Verification:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          application.verificationStatus === 'Verified-Manual' || application.verificationStatus === 'Verified-Auto' 
                            ? 'bg-green-100 text-green-800' :
                          application.verificationStatus === 'Rejected' 
                            ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                          {application.verificationStatus}
                        </span>
                      </div>
                    )}
                    {application.verification?.autoScore && (
                      <div>
                        <span className="font-medium text-gray-600">AI Score:</span>
                        <span className="ml-2 text-gray-800">{Math.round(application.verification.autoScore * 100)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Remarks */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <i className="fas fa-edit text-teal-600 mr-2"></i>
                    Verification Remarks
                  </h3>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter your verification remarks here..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer: only Close inside modal; Approve/Reject are outside on the list */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentViewer && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{selectedDocument.name}</h3>
              <button
                onClick={() => setShowDocumentViewer(false)}
                className="text-white hover:text-gray-300 text-xl"
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