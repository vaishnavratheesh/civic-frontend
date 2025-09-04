import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';

interface WelfareSchemeForm {
  title: string;
  description: string;
  category: string;
  eligibilityCriteria: string;
  benefits: string;
  documentsRequired: string[];
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
    eligibilityCriteria: '',
    benefits: '',
    documentsRequired: [],
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
      [name]: value
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
    const newDocuments = [...formData.documentsRequired];
    newDocuments[index] = value;
    setFormData(prev => ({
      ...prev,
      documentsRequired: newDocuments
    }));
  };

  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      documentsRequired: [...prev.documentsRequired, '']
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documentsRequired: prev.documentsRequired.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<WelfareSchemeForm> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.eligibilityCriteria.trim()) newErrors.eligibilityCriteria = 'Eligibility criteria is required';
    if (!formData.benefits.trim()) newErrors.benefits = 'Benefits are required';
    if (formData.totalSlots < 1) newErrors.totalSlots = 'Total slots must be at least 1';
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
      newErrors.ward = 'Ward number is required for ward-specific schemes';
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
        body: JSON.stringify(formData)
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

          {/* Scheme Details */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-cogs mr-3 text-green-600"></i>
              Scheme Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Eligibility Criteria *
                </label>
                <textarea
                  name="eligibilityCriteria"
                  value={formData.eligibilityCriteria}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.eligibilityCriteria ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Who is eligible for this scheme?"
                  required
                />
                {errors.eligibilityCriteria && (
                  <p className="text-red-600 text-sm mt-1">{errors.eligibilityCriteria}</p>
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

          {/* Documents Required */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-file-alt mr-3 text-yellow-600"></i>
              Documents Required
            </h3>
            
            <div className="space-y-4">
              {formData.documentsRequired.map((doc, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={doc}
                    onChange={(e) => handleDocumentChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Aadhar Card, Income Certificate"
                  />
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="px-3 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addDocument}
                className="px-4 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-medium"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Document Requirement
              </button>
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