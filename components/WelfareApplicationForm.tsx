import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { config } from '../src/config/config';

interface WelfareApplicationFormProps {
  schemeId: string;
  schemeTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  // Basic Information
  address: string;
  phoneNumber: string;
  houseNumber: string;
  
  // Social Information
  caste: 'general' | 'sc' | 'st' | '';
  
  // Membership & Participation
  isKudumbasreeMember: boolean;
  paysHarithakarmasenaFee: boolean;
  
  // Family Employment & Benefits
  hasFamilyMemberWithGovtJob: boolean;
  hasDisabledPersonInHouse: boolean;
  hasFamilyMemberWithPension: boolean;
  
  // Financial Information
  totalIncome: number;
  incomeCategory: 'apl' | 'bpl' | '';
  
  // Land Ownership
  ownsLand: boolean;
  landDetails: {
    villageName: string;
    surveyNumber: string;
    area: string;
  };
  
  // Utilities
  drinkingWaterSource: 'own_well' | 'public_well' | 'tap' | 'public_tap' | '';
  hasToilet: boolean;
}

const WelfareApplicationForm: React.FC<WelfareApplicationFormProps> = ({
  schemeId,
  schemeTitle,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [requiredDocuments, setRequiredDocuments] = useState<{ name: string; formats?: string[] }[]>([]);
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});

  // Fetch scheme to know required documents
  useEffect(() => {
    const loadScheme = async () => {
      try {
        const res = await fetch(`${config.API_BASE_URL}/api/welfare/schemes/${schemeId}`);
        const data = await res.json();
        if (res.ok && data?.scheme) {
          // Support both new structured requiredDocuments and legacy documentsRequired (string array)
          let docs: { name: string; formats?: string[] }[] = [];
          if (Array.isArray(data.scheme.requiredDocuments) && data.scheme.requiredDocuments.length) {
            docs = data.scheme.requiredDocuments.map((d: any) => (
              typeof d === 'string' ? { name: d } : { name: d.name, formats: d.formats || [] }
            ));
          } else if (Array.isArray(data.scheme.documentsRequired) && data.scheme.documentsRequired.length) {
            docs = data.scheme.documentsRequired.map((name: string) => ({ name }));
          }
          setRequiredDocuments(docs);
        }
      } catch (_) {}
    };
    loadScheme();
  }, [schemeId]);

  const [formData, setFormData] = useState<FormData>({
    // Basic Information
    address: '',
    phoneNumber: '',
    houseNumber: '',
    
    // Social Information
    caste: '',
    
    // Membership & Participation
    isKudumbasreeMember: false,
    paysHarithakarmasenaFee: false,
    
    // Family Employment & Benefits
    hasFamilyMemberWithGovtJob: false,
    hasDisabledPersonInHouse: false,
    hasFamilyMemberWithPension: false,
    
    // Financial Information
    totalIncome: 0,
    incomeCategory: '',
    
    // Land Ownership
    ownsLand: false,
    landDetails: {
      villageName: '',
      surveyNumber: '',
      area: ''
    },
    
    // Utilities
    drinkingWaterSource: '',
    hasToilet: false
  });

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setTouched(prev => ({ ...prev, [field]: true }));
    // realtime validation
    const nextValues = { ...formData, [field]: value } as typeof formData;
    setFieldErrors(validate(nextValues));
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(validate());
  };

  const validate = (values = formData) => {
    const errs: Record<string, string> = {};

    const isEmpty = (v: any) => v === undefined || v === null || String(v).trim() === '';
    const isPositiveNumber = (v: any) => Number.isFinite(Number(v)) && Number(v) >= 0;

    // Basic Information
    if (isEmpty(values.address) || String(values.address).trim().length < 10) {
      errs.address = 'Provide a complete address (minimum 10 characters).';
    }
    
    if (!/^\+?\d{10}$/.test(String(values.phoneNumber).replace(/\s|-/g, ''))) {
      errs.phoneNumber = 'Enter a valid 10-digit phone number.';
    }
    
    if (isEmpty(values.houseNumber)) {
      errs.houseNumber = 'House number is required.';
    }

    // Social Information
    if (isEmpty(values.caste)) {
      errs.caste = 'Please select your caste category.';
    }

    // Financial Information
    if (!isPositiveNumber(values.totalIncome)) {
      errs.totalIncome = 'Enter a valid total income amount.';
    }
    
    if (values.totalIncome > 0 && isEmpty(values.incomeCategory)) {
      errs.incomeCategory = 'Please select APL or BPL based on your income.';
    }

    // Utilities
    if (isEmpty(values.drinkingWaterSource)) {
      errs.drinkingWaterSource = 'Please select your drinking water source.';
    }

    // Land Details (if owns land)
    if (values.ownsLand) {
      if (isEmpty(values.landDetails.villageName)) {
        errs.landVillageName = 'Village name is required for land ownership.';
      }
      if (isEmpty(values.landDetails.surveyNumber)) {
        errs.landSurveyNumber = 'Survey number is required for land ownership.';
      }
      if (isEmpty(values.landDetails.area)) {
        errs.landArea = 'Land area is required for land ownership.';
      }
    }

    return errs;
  };

  useEffect(() => {
    // Keep errors up to date on dependent fields
    setFieldErrors(validate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.address, formData.phoneNumber, formData.houseNumber, formData.caste, formData.totalIncome, formData.incomeCategory, formData.drinkingWaterSource, formData.ownsLand, formData.landDetails]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    const errs = validate();
    setFieldErrors(errs);
    
    // Mark all as touched for final submit
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(k => (allTouched[k] = true));
    setTouched(allTouched);
    
    if (Object.keys(errs).length > 0) {
      setLoading(false);
      setError('Please review the highlighted fields.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      
      // New simplified structure
      fd.append('personalDetails', JSON.stringify({
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        houseNumber: formData.houseNumber,
        caste: formData.caste,
        isKudumbasreeMember: formData.isKudumbasreeMember,
        paysHarithakarmasenaFee: formData.paysHarithakarmasenaFee,
        hasFamilyMemberWithGovtJob: formData.hasFamilyMemberWithGovtJob,
        hasDisabledPersonInHouse: formData.hasDisabledPersonInHouse,
        hasFamilyMemberWithPension: formData.hasFamilyMemberWithPension,
        totalIncome: formData.totalIncome,
        incomeCategory: formData.incomeCategory,
        ownsLand: formData.ownsLand,
        landDetails: formData.landDetails,
        drinkingWaterSource: formData.drinkingWaterSource,
        hasToilet: formData.hasToilet
      }));

      // Append required documents with agreed field names: doc_<normalized_name>
      requiredDocuments.forEach(doc => {
        const key = `doc_${doc.name.replace(/\s+/g, '_').toLowerCase()}`;
        const file = docFiles[key];
        if (file) fd.append(key, file);
      });

      const response = await fetch(`${config.API_BASE_URL}/api/welfare/schemes/${schemeId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: fd
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderRequiredDocuments = () => (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-800">Upload Required Documents</h4>
      {requiredDocuments.length === 0 ? (
        <p className="text-xs text-gray-500">No specific documents required for this scheme.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requiredDocuments.map(doc => {
            const key = `doc_${doc.name.replace(/\s+/g, '_').toLowerCase()}`;
            const accept = (doc.formats || []).map(f => `.${f}`).join(',');
            return (
              <div key={key} className="flex flex-col">
                <label className="text-xs font-medium text-gray-700 mb-1">{doc.name} *</label>
                <input
                  type="file"
                  accept={accept || undefined}
                  onChange={(e) => setDocFiles(prev => ({ ...prev, [key]: e.target.files?.[0] || null }))}
                  className="text-xs"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderApplicationForm = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welfare Scheme Application</h2>
        <p className="text-gray-600">Please fill out all required fields accurately</p>
      </div>

      {/* Basic Information Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-user mr-2 text-blue-600"></i>
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={3}
              placeholder="Enter your complete address"
              required
            />
            {touched.address && fieldErrors.address && <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              onBlur={() => handleBlur('phoneNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter 10-digit phone number"
              required
            />
            {touched.phoneNumber && fieldErrors.phoneNumber && <p className="mt-1 text-xs text-red-600">{fieldErrors.phoneNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">House Number *</label>
            <input
              type="text"
              value={formData.houseNumber}
              onChange={(e) => handleInputChange('houseNumber', e.target.value)}
              onBlur={() => handleBlur('houseNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter house number"
              required
            />
            {touched.houseNumber && fieldErrors.houseNumber && <p className="mt-1 text-xs text-red-600">{fieldErrors.houseNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Caste *</label>
            <select
              value={formData.caste}
              onChange={(e) => handleInputChange('caste', e.target.value)}
              onBlur={() => handleBlur('caste')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Caste Category</option>
              <option value="general">General</option>
              <option value="sc">SC (Scheduled Caste)</option>
              <option value="st">ST (Scheduled Tribe)</option>
            </select>
            {touched.caste && fieldErrors.caste && <p className="mt-1 text-xs text-red-600">{fieldErrors.caste}</p>}
          </div>
        </div>
      </div>

      {/* Membership & Participation Section */}
      <div className="bg-green-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-users mr-2 text-green-600"></i>
          Membership & Participation
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isKudumbasreeMember"
              checked={formData.isKudumbasreeMember}
              onChange={(e) => handleInputChange('isKudumbasreeMember', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isKudumbasreeMember" className="text-sm font-medium text-gray-700">
              Kudumbasree Member
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="paysHarithakarmasenaFee"
              checked={formData.paysHarithakarmasenaFee}
              onChange={(e) => handleInputChange('paysHarithakarmasenaFee', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="paysHarithakarmasenaFee" className="text-sm font-medium text-gray-700">
              Pays Harithakarmasena Fee
            </label>
          </div>
        </div>
      </div>

      {/* Family Information Section */}
      <div className="bg-yellow-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-home mr-2 text-yellow-600"></i>
          Family Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="hasFamilyMemberWithGovtJob"
              checked={formData.hasFamilyMemberWithGovtJob}
              onChange={(e) => handleInputChange('hasFamilyMemberWithGovtJob', e.target.checked)}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="hasFamilyMemberWithGovtJob" className="text-sm font-medium text-gray-700">
              Family Member with Government Job
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="hasDisabledPersonInHouse"
              checked={formData.hasDisabledPersonInHouse}
              onChange={(e) => handleInputChange('hasDisabledPersonInHouse', e.target.checked)}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="hasDisabledPersonInHouse" className="text-sm font-medium text-gray-700">
              Disabled Person in House
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="hasFamilyMemberWithPension"
              checked={formData.hasFamilyMemberWithPension}
              onChange={(e) => handleInputChange('hasFamilyMemberWithPension', e.target.checked)}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="hasFamilyMemberWithPension" className="text-sm font-medium text-gray-700">
              Family Member with Pension
            </label>
          </div>
        </div>
      </div>

      {/* Financial Information Section */}
      <div className="bg-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-rupee-sign mr-2 text-purple-600"></i>
          Financial Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Income (Annual) *</label>
            <input
              type="number"
              value={formData.totalIncome}
              onChange={(e) => {
                const income = parseInt(e.target.value) || 0;
                handleInputChange('totalIncome', income);
                // Auto-select APL/BPL based on income
                if (income > 0) {
                  const category = income <= 120000 ? 'bpl' : 'apl'; // BPL if income <= 1.2 lakh
                  handleInputChange('incomeCategory', category);
                }
              }}
              onBlur={() => handleBlur('totalIncome')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter annual income in rupees"
              required
            />
            {touched.totalIncome && fieldErrors.totalIncome && <p className="mt-1 text-xs text-red-600">{fieldErrors.totalIncome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Income Category *</label>
            <select
              value={formData.incomeCategory}
              onChange={(e) => handleInputChange('incomeCategory', e.target.value)}
              onBlur={() => handleBlur('incomeCategory')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select Category</option>
              <option value="apl">APL (Above Poverty Line)</option>
              <option value="bpl">BPL (Below Poverty Line)</option>
            </select>
            {touched.incomeCategory && fieldErrors.incomeCategory && <p className="mt-1 text-xs text-red-600">{fieldErrors.incomeCategory}</p>}
          </div>
        </div>
      </div>

      {/* Land Ownership Section */}
      <div className="bg-orange-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-map mr-2 text-orange-600"></i>
          Land Ownership
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="ownsLand"
              checked={formData.ownsLand}
              onChange={(e) => handleInputChange('ownsLand', e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="ownsLand" className="text-sm font-medium text-gray-700">
              Own Land
            </label>
          </div>

          {formData.ownsLand && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-white rounded-md border border-orange-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Village Name *</label>
                <input
                  type="text"
                  value={formData.landDetails.villageName}
                  onChange={(e) => handleInputChange('landDetails', { ...formData.landDetails, villageName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter village name"
                  required
                />
                {fieldErrors.landVillageName && <p className="mt-1 text-xs text-red-600">{fieldErrors.landVillageName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Survey Number *</label>
                <input
                  type="text"
                  value={formData.landDetails.surveyNumber}
                  onChange={(e) => handleInputChange('landDetails', { ...formData.landDetails, surveyNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter survey number"
                  required
                />
                {fieldErrors.landSurveyNumber && <p className="mt-1 text-xs text-red-600">{fieldErrors.landSurveyNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                <input
                  type="text"
                  value={formData.landDetails.area}
                  onChange={(e) => handleInputChange('landDetails', { ...formData.landDetails, area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., 2 acres, 50 cents"
                  required
                />
                {fieldErrors.landArea && <p className="mt-1 text-xs text-red-600">{fieldErrors.landArea}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Utilities Section */}
      <div className="bg-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-tint mr-2 text-indigo-600"></i>
          Utilities & Amenities
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Drinking Water Source *</label>
            <select
              value={formData.drinkingWaterSource}
              onChange={(e) => handleInputChange('drinkingWaterSource', e.target.value)}
              onBlur={() => handleBlur('drinkingWaterSource')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Water Source</option>
              <option value="own_well">Own Well</option>
              <option value="public_well">Public Well</option>
              <option value="tap">Tap Connection</option>
              <option value="public_tap">Public Tap</option>
            </select>
            {touched.drinkingWaterSource && fieldErrors.drinkingWaterSource && <p className="mt-1 text-xs text-red-600">{fieldErrors.drinkingWaterSource}</p>}
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="hasToilet"
              checked={formData.hasToilet}
              onChange={(e) => handleInputChange('hasToilet', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="hasToilet" className="text-sm font-medium text-gray-700">
              Has Toilet Facility
            </label>
          </div>
        </div>
      </div>

      {/* Required Documents Section */}
      {requiredDocuments.length > 0 && (
        <div className="bg-red-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-file-upload mr-2 text-red-600"></i>
            Required Documents
          </h3>
          {renderRequiredDocuments()}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Welfare Application Form</h2>
              <p className="text-gray-600">Scheme: {schemeTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Form Content */}
          <div className="mb-6">
            {renderApplicationForm()}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-6 py-2 rounded-md ${
                loading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelfareApplicationForm;