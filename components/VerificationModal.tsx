import React, { useState } from 'react';

interface Document {
  url: string;
  name: string;
  type?: string;
}

interface PersonalDetails {
  // Identity & Contact (from schema)
  address?: string;
  phoneNumber?: string;
  houseNumber?: string;
  caste?: string;
  // Membership & Participation
  isKudumbasreeMember?: boolean;
  paysHarithakarmasenaFee?: boolean;
  // Family
  hasFamilyMemberWithGovtJob?: boolean;
  hasDisabledPersonInHouse?: boolean;
  hasFamilyMemberWithPension?: boolean;
  // Financial
  totalIncome?: number;
  // Land
  ownsLand?: boolean;
  landDetails?: { villageName?: string; surveyNumber?: string; area?: string };
  // Utilities
  drinkingWaterSource?: string;
  hasToilet?: boolean;
}

interface WelfareApplication {
  _id: string;
  schemeId?: { _id: string; title: string; scope?: string; ward?: number };
  schemeTitle?: string;
  userId?: { _id: string; name: string; email: string };
  userName?: string;
  userEmail?: string;
  userWard?: number;
  personalDetails?: PersonalDetails;
  reason?: string;
  documents?: Document[];
  status?: string;
  appliedAt?: string;
  score?: number;
  justification?: string;
  detailedAnalysis?: any[];
  verificationStatus?: string;
  verification?: { mode?: string; autoScore?: number; remarks?: string };
}

interface VerificationModalProps {
  application: WelfareApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (appId: string, approve: boolean, remarks: string) => Promise<void>;
  verifying: boolean;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  application, isOpen, onClose, onVerify, verifying
}) => {
  const [remarks, setRemarks] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  if (!isOpen || !application) return null;

  // Safe accessor — never crashes even if personalDetails is null
  const pd = application.personalDetails || {};

  // DEBUG: Log the application data
  console.log('[VerificationModal] Rendering with application:', {
    id: application._id,
    personalDetailsKeys: Object.keys(pd),
    personalDetails: pd
  });

  const handleVerify = async (approve: boolean) => {
    await onVerify(application._id, approve, remarks);
    setRemarks('');
    onClose();
  };

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount || 0);

  const yesNo = (val?: boolean) =>
    val ? <span className="text-green-700 font-bold">✓ Yes</span>
        : <span className="text-red-600 font-bold">✗ No</span>;

  const formatWaterSource = (src?: string) => {
    if (!src) return 'Not Provided';
    return src.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 75) return 'text-green-700';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score?: number) => {
    if (!score) return 'bg-gray-100 border-gray-300';
    if (score >= 75) return 'bg-green-50 border-green-400';
    if (score >= 50) return 'bg-yellow-50 border-yellow-400';
    return 'bg-red-50 border-red-400';
  };

  const getDocumentIcon = (type?: string, url?: string) => {
    if (type?.includes('image') || ['jpg','jpeg','png','gif','webp'].includes(url?.split('.').pop()?.toLowerCase() || '')) return 'fa-image';
    if (type?.includes('pdf') || url?.toLowerCase().endsWith('.pdf')) return 'fa-file-pdf';
    return 'fa-file-alt';
  };

  const isImageFile = (type?: string, url?: string) => {
    if (type?.includes('image')) return true;
    return ['jpg','jpeg','png','gif','bmp','webp'].includes(url?.split('.').pop()?.toLowerCase() || '');
  };

  const DataRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-start py-2 border-b border-gray-200 last:border-0">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-semibold text-right flex-1">{value ?? <span className="text-gray-400 italic">Not Provided</span>}</span>
    </div>
  );

  const SectionHeader = ({ icon, title, bg = 'bg-slate-800' }: { icon: string; title: string; bg?: string }) => (
    <div className={`${bg} text-white px-4 py-3 flex items-center gap-3`}>
      <i className={`fas ${icon} text-sm`}></i>
      <h3 className="text-sm font-bold uppercase tracking-widest">{title}</h3>
    </div>
  );

  return (
    <>
      {/* ── Main Modal ─────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
        <div className="bg-white shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-gray-300 overflow-hidden">

          {/* ── Government Header ─────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-[#1a2e5a] to-[#0f1f3d] text-white flex-shrink-0">
            {/* Top stripe */}
            <div className="flex" style={{ height: '6px' }}>
              <div className="flex-1 bg-[#f77f00]" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-green-600" />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Emblem placeholder */}
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow">
                  <i className="fas fa-landmark text-[#1a2e5a] text-2xl"></i>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-yellow-300 uppercase">Government of Kerala</p>
                  <h1 className="text-xl font-bold tracking-wide">Local Self Government Department</h1>
                  <p className="text-xs text-blue-200 mt-0.5">Civic+ Welfare Application Verification</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-200">Application Ref.</p>
                <p className="font-mono text-base font-bold text-yellow-300 tracking-widest">
                  #{application._id.slice(-10).toUpperCase()}
                </p>
                <p className="text-xs text-blue-200 mt-1">
                  Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button onClick={onClose}
                className="ml-4 text-white hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center transition-colors border border-white/20">
                <i className="fas fa-times"></i>
              </button>
            </div>
            {/* Document title bar */}
            <div className="bg-[#0f1f3d]/60 border-t border-white/10 px-6 py-2 text-center">
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-blue-100">
                Welfare Scheme Application Verification Report
              </span>
            </div>
          </div>

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <div className="overflow-y-auto flex-1 p-6 bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* ── Column 1: Scheme + Applicant + Personal ─────────────── */}
              <div className="lg:col-span-2 space-y-4">

                {/* Scheme + applicant summary banner */}
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-[#1a2e5a] text-white px-4 py-2 flex items-center gap-2">
                    <i className="fas fa-file-contract text-sm text-yellow-300"></i>
                    <span className="text-xs font-bold tracking-widest uppercase">Scheme &amp; Applicant</span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-100">
                    <div className="p-4 space-y-1">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Scheme Name</p>
                      <p className="text-sm font-bold text-gray-900">{application.schemeTitle || application.schemeId?.title || '—'}</p>
                      <p className="text-xs text-gray-400 mt-2 uppercase tracking-wide font-semibold">Applied On</p>
                      <p className="text-sm text-gray-700">{application.appliedAt
                        ? new Date(application.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                        : '—'}</p>
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Applicant Name</p>
                      <p className="text-sm font-bold text-gray-900">{application.userName || application.userId?.name || '—'}</p>
                      <p className="text-xs text-gray-400 mt-2 uppercase tracking-wide font-semibold">Ward / Email</p>
                      <p className="text-sm text-gray-700">
                        Ward {application.userWard ?? '—'} &nbsp;|&nbsp; {application.userEmail || application.userId?.email || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                  <SectionHeader icon="fa-id-card" title="Personal Details" />
                  {Object.keys(pd).length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      <i className="fas fa-exclamation-triangle text-2xl mb-2 text-yellow-400"></i>
                      <p className="text-sm font-semibold">Personal details not available for this application.</p>
                    </div>
                  ) : (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      {/* Identity */}
                      <div>
                        <p className="text-xs font-bold text-[#1a2e5a] uppercase tracking-widest mb-2 border-b pb-1">Identity &amp; Contact</p>
                        <DataRow label="Contact Number" value={pd.phoneNumber} />
                        <DataRow label="House Number" value={pd.houseNumber} />
                        <DataRow label="Address" value={pd.address} />
                        <DataRow label="Caste Category" value={pd.caste ? pd.caste.toUpperCase() : undefined} />
                      </div>
                      {/* Economic */}
                      <div>
                        <p className="text-xs font-bold text-[#1a2e5a] uppercase tracking-widest mb-2 border-b pb-1">Economic Status</p>
                        <DataRow label="Annual Income" value={formatCurrency(pd.totalIncome)} />
                        <DataRow label="Land Ownership" value={yesNo(pd.ownsLand)} />
                        {pd.ownsLand && pd.landDetails && (
                          <>
                            {pd.landDetails.villageName && <DataRow label="Village" value={pd.landDetails.villageName} />}
                            {pd.landDetails.surveyNumber && <DataRow label="Survey No." value={pd.landDetails.surveyNumber} />}
                            {pd.landDetails.area && <DataRow label="Extent" value={pd.landDetails.area} />}
                          </>
                        )}
                      </div>
                      {/* Household */}
                      <div className="mt-3">
                        <p className="text-xs font-bold text-[#1a2e5a] uppercase tracking-widest mb-2 border-b pb-1">Household Amenities</p>
                        <DataRow label="Toilet Facility" value={yesNo(pd.hasToilet)} />
                        <DataRow label="Drinking Water Source" value={formatWaterSource(pd.drinkingWaterSource)} />
                      </div>
                      {/* Civic */}
                      <div className="mt-3">
                        <p className="text-xs font-bold text-[#1a2e5a] uppercase tracking-widest mb-2 border-b pb-1">Civic Participation</p>
                        <DataRow label="Kudumbasree Member" value={yesNo(pd.isKudumbasreeMember)} />
                        <DataRow label="Harithakarma Sena" value={yesNo(pd.paysHarithakarmasenaFee)} />
                        <DataRow label="Govt. Job in Family" value={yesNo(pd.hasFamilyMemberWithGovtJob)} />
                        <DataRow label="Disabled in Household" value={yesNo(pd.hasDisabledPersonInHouse)} />
                        <DataRow label="Pension Recipient" value={yesNo(pd.hasFamilyMemberWithPension)} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Reason for Application */}
                {application.reason && (
                  <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <SectionHeader icon="fa-comment-alt" title="Reason for Application" />
                    <div className="p-4">
                      <p className="text-sm text-gray-700 leading-relaxed italic border-l-4 border-blue-200 pl-4">
                        "{application.reason}"
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Column 2: AI Score + Documents + Status + Action ─────── */}
              <div className="space-y-4">

                {/* AI Score Card */}
                {application.score != null && (
                  <div className={`bg-white border-2 shadow-sm overflow-hidden ${getScoreBg(application.score)}`}>
                    <SectionHeader icon="fa-brain" title="AI Welfare Score" bg="bg-indigo-700" />
                    <div className="p-5 text-center">
                      <div className={`text-5xl font-black mb-1 ${getScoreColor(application.score)}`}>
                        {application.score}
                      </div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">out of 100</p>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            application.score >= 75 ? 'bg-green-500' :
                            application.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${application.score}%` }}
                        />
                      </div>
                      {application.justification && (
                        <p className="text-xs text-gray-500 mt-3 leading-relaxed text-left italic border-t pt-3">
                          {application.justification}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Detailed Analysis */}
                {application.detailedAnalysis && application.detailedAnalysis.length > 0 && (
                  <div className="bg-white border border-indigo-200 shadow-sm overflow-hidden">
                    <SectionHeader icon="fa-chart-bar" title="AI Factor Breakdown" bg="bg-indigo-700" />
                    <div className="p-3 max-h-64 overflow-y-auto space-y-2">
                      {application.detailedAnalysis.map((item: any, i: number) => {
                        const pos = item.impact > 0;
                        const neg = item.impact < 0;
                        return (
                          <div key={i} className={`flex items-center gap-3 p-2 rounded border ${pos ? 'border-green-200 bg-green-50' : neg ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${pos ? 'bg-green-500' : neg ? 'bg-red-500' : 'bg-gray-400'}`}>
                              <i className={`fas ${pos ? 'fa-arrow-up' : neg ? 'fa-arrow-down' : 'fa-minus'}`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-700 capitalize">{item.factor?.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-gray-500 truncate">{item.description}</p>
                            </div>
                            <span className={`text-xs font-black shrink-0 ${pos ? 'text-green-700' : neg ? 'text-red-600' : 'text-gray-500'}`}>
                              {item.impact > 0 ? '+' : ''}{item.impact}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Current Status */}
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                  <SectionHeader icon="fa-tasks" title="Application Status" />
                  <div className="p-4 space-y-2">
                    <DataRow label="Status" value={
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        application.status === 'approved' ? 'bg-green-100 text-green-800' :
                        application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>{application.status}</span>
                    } />
                    {application.verificationStatus && (
                      <DataRow label="Verification" value={
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          ['Verified-Manual','Verified-Auto'].includes(application.verificationStatus) ? 'bg-green-100 text-green-800' :
                          application.verificationStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>{application.verificationStatus}</span>
                      } />
                    )}
                  </div>
                </div>

                {/* Supporting Documents */}
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                  <SectionHeader icon="fa-paperclip" title="Supporting Documents" />
                  <div className="p-3">
                    {application.documents && application.documents.length > 0 ? (
                      <div className="space-y-2">
                        {application.documents.map((doc, i) => (
                          <button key={i} onClick={() => { setSelectedDocument(doc); setShowDocumentViewer(true); }}
                            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all text-left rounded">
                            <i className={`fas ${getDocumentIcon(doc.type, doc.url)} text-red-600 text-lg`}></i>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">{doc.name}</p>
                              <p className="text-xs text-gray-400">{doc.type || 'Document'}</p>
                            </div>
                            <i className="fas fa-eye text-blue-400 text-xs"></i>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        <i className="fas fa-folder-open text-3xl mb-2"></i>
                        <p className="text-xs font-semibold">No documents uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Action */}
                <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                  <SectionHeader icon="fa-stamp" title="Official Verification" bg="bg-[#1a2e5a]" />
                  <div className="p-4">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                      Remarks / Observations
                    </label>
                    <textarea
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Enter official verification remarks..."
                      className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-xs bg-gray-50"
                      rows={4}
                    />
                    <div className="flex gap-3 mt-3">
                      <button
                        disabled={verifying}
                        onClick={() => handleVerify(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold uppercase tracking-wide py-3 rounded transition-colors disabled:opacity-50"
                      >
                        <i className="fas fa-check"></i> Approve
                      </button>
                      <button
                        disabled={verifying}
                        onClick={() => handleVerify(false)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wide py-3 rounded transition-colors disabled:opacity-50"
                      >
                        <i className="fas fa-times"></i> Reject
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <div className="flex-shrink-0 bg-[#1a2e5a] text-white px-6 py-3 flex justify-between items-center">
            <div className="text-xs text-blue-200">
              <p className="font-bold">Government of Kerala — Civic+ Welfare System</p>
              <p>Document ID: {application._id.slice(-14).toUpperCase()} | {new Date().toLocaleString('en-IN')}</p>
            </div>
            <button onClick={onClose}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wide rounded transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ── Document Viewer Modal ──────────────────────────────────────────── */}
      {showDocumentViewer && selectedDocument && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1100] p-4">
          <div className="bg-white shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-300">
            <div className="bg-[#1a2e5a] text-white px-5 py-3 flex justify-between items-center border-b-4 border-[#f77f00]">
              <div>
                <h3 className="font-bold uppercase tracking-wide">{selectedDocument.name}</h3>
                <p className="text-xs text-blue-200">Official Document Viewer — Government of Kerala</p>
              </div>
              <div className="flex items-center gap-3">
                <a href={selectedDocument.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded flex items-center gap-2 border border-white/20">
                  <i className="fas fa-external-link-alt"></i> Open
                </a>
                <button onClick={() => setShowDocumentViewer(false)}
                  className="text-white hover:bg-white/10 rounded-full w-9 h-9 flex items-center justify-center border border-white/20">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
              {isImageFile(selectedDocument.type, selectedDocument.url) ? (
                <img src={selectedDocument.url} alt={selectedDocument.name}
                  className="max-w-full max-h-[75vh] object-contain shadow-lg border-2 border-gray-200" />
              ) : selectedDocument.url.toLowerCase().endsWith('.pdf') ? (
                <iframe title="PDF Preview" src={selectedDocument.url} className="w-full h-[75vh] border-0" />
              ) : (
                <div className="text-center p-10">
                  <i className="fas fa-file text-6xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <a href={selectedDocument.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-800">
                    <i className="fas fa-download"></i> Download Document
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