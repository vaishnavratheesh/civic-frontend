import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';

interface WelfareSchemeForm {
  title: string;
  description: string;
  category: string;
  minAge: number;
  maxAge: number;
  benefits: string;
  documentsRequired: string[]; // legacy, still sent for backward-compat
  requiredDocuments?: { name: string; formats?: string[] }[];
  totalSlots: number;
  applicationDeadline: string;
  startDate: string;
  endDate: string;
  scope: 'panchayath' | 'ward';
  ward?: number;
}

interface CreateWelfareSchemeProps {
  onSchemeCreated: () => void;
  onClose: () => void;
}

const CATEGORIES = [
  'Education',
  'Healthcare',
  'Housing',
  'Employment',
  'Agriculture',
  'Social Welfare',
  'Infrastructure',
  'Other'
];

const WARD_NUMBERS = Array.from({ length: 23 }, (_, i) => i + 1);

const CreateWelfareScheme: React.FC<CreateWelfareSchemeProps> = ({ onSchemeCreated, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<WelfareSchemeForm>({
    title: '',
    description: '',
    category: '',
    minAge: 0,
    maxAge: 120,
    benefits: '',
    documentsRequired: [],
    requiredDocuments: [{ name: '', formats: [] }],
    totalSlots: 1,
    applicationDeadline: '',
    startDate: '',
    endDate: '',
    scope: 'panchayath'
  });

  const [errors, setErrors] = useState<Partial<WelfareSchemeForm>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Set default scope based on user role
  useEffect(() => {
    if (user?.role === 'councillor') {
      setFormData(prev => ({ ...prev, scope: 'ward', ward: user.ward }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'minAge' || name === 'maxAge' || name === 'totalSlots' ? parseInt(value) || 0 : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof WelfareSchemeForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleDocumentChange = (index: number, value: string) => {
    const newDocuments = [...(formData.requiredDocuments || [])];
    if (!newDocuments[index]) {
      newDocuments[index] = { name: '', formats: [] };
    }
    newDocuments[index].name = value;
    setFormData(prev => ({
      ...prev,
      requiredDocuments: newDocuments
    }));
  };

  // Allowed Indian documents (must match backend ALLOWED_INDIAN_DOCUMENTS)
  const ALLOWED_INDIAN_DOCUMENTS = [
    'Aadhar Card',
    'Ration Card',
    'Voter ID',
    'Driving License',
    'PAN Card',
    'Passport',
    'Disability Certificate',
    'Income Certificate',
    'Caste Certificate',
    'Residence Certificate',
    'BPL Card',
    'Senior Citizen ID',
    'Widow Certificate',
    'Death Certificate'
  ];

  // New: dynamic requiredDocuments handlers
  const addRequiredDocument = () => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: [...(prev.requiredDocuments || []), { name: '', formats: [] }]
    }));
  };

  const removeRequiredDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: (prev.requiredDocuments || []).filter((_, i) => i !== index)
    }));
  };

  const updateRequiredDocument = (index: number, key: 'name' | 'formats', value: string) => {
    const list = [...(formData.requiredDocuments || [])];
    if (key === 'name') {
      list[index].name = value;
    } else {
      list[index].formats = value
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
    }
    setFormData(prev => ({ ...prev, requiredDocuments: list }));
  };

  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: [...(prev.requiredDocuments || []), { name: '', formats: [] }]
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: (prev.requiredDocuments || []).filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<WelfareSchemeForm> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.minAge < 0 || formData.minAge > 120) (newErrors as any).minAge = 'Minimum age must be between 0 and 120';
    if (formData.maxAge < 0 || formData.maxAge > 120) (newErrors as any).maxAge = 'Maximum age must be between 0 and 120';
    if (formData.minAge > formData.maxAge) (newErrors as any).maxAge = 'Maximum age must be greater than or equal to minimum age';
    if (!formData.benefits.trim()) newErrors.benefits = 'Benefits are required';
    if (formData.totalSlots < 1) (newErrors as any).totalSlots = 'Total slots must be at least 1';
    if (!formData.applicationDeadline) newErrors.applicationDeadline = 'Application deadline is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';

    // Validate dates
    const today = new Date();
    const deadline = new Date(formData.applicationDeadline);
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (deadline <= today) {
      newErrors.applicationDeadline = 'Application deadline must be in the future';
    }
    if (start <= today) {
      newErrors.startDate = 'Start date must be in the future';
    }
    if (end <= start) {
      newErrors.endDate = 'End date must be after start date';
    }

    // Validate ward-specific requirements
    if (formData.scope === 'ward' && !formData.ward) {
      (newErrors as any).ward = 'Ward number is required for ward-specific schemes';
    }

    // Validate required documents: must have at least one, and each name in allowed list
    const reqDocs = (formData.requiredDocuments || []).filter(d => d.name && d.name.trim());
    if (reqDocs.length === 0) {
      (newErrors as any).requiredDocuments = 'At least one required document is mandatory';
    } else if (reqDocs.some(d => !ALLOWED_INDIAN_DOCUMENTS.includes(d.name))) {
      (newErrors as any).requiredDocuments = 'Select valid Indian document types only';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3002/api/welfare/schemes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          // ensure backend receives requiredDocuments
          requiredDocuments: (formData.requiredDocuments || [])
            .filter(d => d.name && d.name.trim().length > 0)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Welfare scheme created successfully!');
        setTimeout(() => {
          onSchemeCreated();
          onClose();
        }, 1500);
      } else {
        setMessage(data.message || 'Failed to create scheme');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create Welfare Scheme</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-xl ${
              message.includes('successfully') 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <div className="flex items-center">
                <i className={`fas ${message.includes('successfully') ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-3`}></i>
                <span className="font-medium">{message}</span>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-info-circle mr-3 text-blue-600"></i>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Scheme Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter scheme title"
                  required
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe the welfare scheme in detail"
                required
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Required Documents (Dynamic) */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-file-upload mr-3 text-amber-600"></i>
              Required Documents (Dynamic)
            </h3>

            <p className="text-sm text-gray-600 mb-4">Add the documents applicants must upload (e.g., Aadhar Card, Ration Card). Optionally restrict allowed formats (e.g., pdf,jpg,png).</p>

            {(formData.requiredDocuments || []).map((doc, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Document Name *</label>
                  <select
                    value={doc.name}
                    onChange={(e) => updateRequiredDocument(idx, 'name', e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select document</option>
                    {ALLOWED_INDIAN_DOCUMENTS.map(dn => (
                      <option key={dn} value={dn}>{dn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Allowed Formats (comma separated)</label>
                  <input
                    type="text"
                    value={(doc.formats || []).join(',')}
                    onChange={(e) => updateRequiredDocument(idx, 'formats', e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="pdf,jpg,png"
                  />
                </div>
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => removeRequiredDocument(idx)}
                    className="h-10 mt-auto px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addRequiredDocument}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700"
            >
              Add Document
            </button>

            {errors as any && (errors as any).requiredDocuments && (
              <p className="mt-2 text-sm text-red-600">{(errors as any).requiredDocuments}</p>
            )}
          </div>

          {/* Scheme Details */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-cogs mr-3 text-green-600"></i>
              Scheme Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Age to Apply *
                </label>
                <input
                  type="number"
                  name="minAge"
                  value={formData.minAge}
                  onChange={handleInputChange}
                  min="0"
                  max="120"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    (errors as any).minAge ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 18"
                  required
                />
                {(errors as any).minAge && (
                  <p className="text-red-600 text-sm mt-1">{(errors as any).minAge}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Maximum Age to Apply *
                </label>
                <input
                  type="number"
                  name="maxAge"
                  value={formData.maxAge}
                  onChange={handleInputChange}
                  min="0"
                  max="120"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    (errors as any).maxAge ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 60"
                  required
                />
                {(errors as any).maxAge && (
                  <p className="text-red-600 text-sm mt-1">{(errors as any).maxAge}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Benefits *
                </label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.benefits ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="What benefits will recipients receive?"
                  required
                />
                {errors.benefits && (
                  <p className="text-red-600 text-sm mt-1">{errors.benefits}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Slots *
                </label>
                <input
                  type="number"
                  name="totalSlots"
                  value={formData.totalSlots}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.totalSlots ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.totalSlots && (
                  <p className="text-red-600 text-sm mt-1">{errors.totalSlots}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Scope *
                </label>
                <select
                  name="scope"
                  value={formData.scope}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  disabled={user?.role === 'councillor'}
                >
                  <option value="panchayath">Panchayath-wide</option>
                  <option value="ward">Ward-specific</option>
                </select>
              </div>

              {formData.scope === 'ward' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ward Number *
                  </label>
                  <select
                    name="ward"
                    value={formData.ward || ''}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.ward ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select ward</option>
                    {WARD_NUMBERS.map(ward => (
                      <option key={ward} value={ward}>Ward {ward}</option>
                    ))}
                  </select>
                  {errors.ward && (
                    <p className="text-red-600 text-sm mt-1">{errors.ward}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Required Documents */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-file-alt mr-3 text-orange-600"></i>
              Required Documents
            </h3>
            
            <div className="space-y-4">
              {(formData.requiredDocuments || []).map((doc, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <select
                    value={doc.name || ''}
                    onChange={(e) => handleDocumentChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select document type</option>
                    <option value="Aadhar Card">Aadhar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                    <option value="Ration Card">Ration Card</option>
                    <option value="Income Certificate">Income Certificate</option>
                    <option value="Caste Certificate">Caste Certificate</option>
                    <option value="Disability Certificate">Disability Certificate</option>
                    <option value="Bank Passbook">Bank Passbook</option>
                    <option value="Property Documents">Property Documents</option>
                    <option value="Educational Certificates">Educational Certificates</option>
                    <option value="Employment Certificate">Employment Certificate</option>
                    <option value="Medical Certificate">Medical Certificate</option>
                    <option value="Death Certificate">Death Certificate</option>
                    <option value="Birth Certificate">Birth Certificate</option>
                    <option value="Marriage Certificate">Marriage Certificate</option>
                    <option value="Divorce Certificate">Divorce Certificate</option>
                    <option value="Land Records">Land Records</option>
                    <option value="Electricity Bill">Electricity Bill</option>
                    <option value="Water Bill">Water Bill</option>
                    <option value="Gas Bill">Gas Bill</option>
                    <option value="Telephone Bill">Telephone Bill</option>
                    <option value="Insurance Policy">Insurance Policy</option>
                    <option value="Other">Other</option>
                  </select>
                  
                  {(formData.requiredDocuments || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addDocument}
                className="w-full py-3 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 hover:border-orange-400 hover:text-orange-700 transition-colors flex items-center justify-center"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Required Document
              </button>
              
              {(errors as any).requiredDocuments && (
                <p className="text-red-600 text-sm mt-2">{(errors as any).requiredDocuments}</p>
              )}
            </div>
          </div>

          {/* Important Dates */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-calendar-alt mr-3 text-purple-600"></i>
              Important Dates
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Application Deadline *
                </label>
                <input
                  type="datetime-local"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                    errors.applicationDeadline ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.applicationDeadline && (
                  <p className="text-red-600 text-sm mt-1">{errors.applicationDeadline}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                    errors.startDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.startDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                    errors.endDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.endDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <div className="flex items-center">
                  <Spinner size="sm" />
                  <span className="ml-2">Creating...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <i className="fas fa-plus mr-2"></i>
                  Create Scheme
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWelfareScheme; 