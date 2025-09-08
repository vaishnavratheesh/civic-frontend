import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface WelfareApplicationFormProps {
  schemeId: string;
  schemeTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  // Personal Details
  address: string;
  phoneNumber: string;
  rationCardNumber: string;
  aadharNumber: string;
  familyIncome: number;
  dependents: number;
  isHandicapped: boolean;
  isSingleWoman: boolean;

  // Assessment Details
  familyMembers: number;
  childrenCount: number;
  elderlyCount: number;
  disabledMembers: number;
  monthlyIncome: number;
  incomeSource: string;
  hasOtherIncome: boolean;
  otherIncomeAmount: number;
  houseOwnership: string;
  houseType: string;
  hasElectricity: boolean;
  hasWaterConnection: boolean;
  hasToilet: boolean;
  educationLevel: string;
  childrenEducation: string;
  hasHealthInsurance: boolean;
  chronicIllness: boolean;
  illnessDetails: string;
  hasDisability: boolean;
  disabilityType: string;
  employmentStatus: string;
  jobStability: string;
  hasBankAccount: boolean;
  hasVehicle: boolean;
  vehicleType: string;
  hasLand: boolean;
  landArea: number;
  caste: string;
  religion: string;
  isWidow: boolean;
  isOrphan: boolean;
  isSeniorCitizen: boolean;
  hasEmergencyFund: boolean;
  emergencyContact: string;
  emergencyRelation: string;
  previousApplications: number;
  previousSchemes: string[];
  additionalNeeds: string;
  specialCircumstances: string;
  reason: string;
}

const WelfareApplicationForm: React.FC<WelfareApplicationFormProps> = ({
  schemeId,
  schemeTitle,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<FormData>({
    // Personal Details
    address: '',
    phoneNumber: '',
    rationCardNumber: '',
    aadharNumber: '',
    familyIncome: 0,
    dependents: 0,
    isHandicapped: false,
    isSingleWoman: false,

    // Assessment Details
    familyMembers: 0,
    childrenCount: 0,
    elderlyCount: 0,
    disabledMembers: 0,
    monthlyIncome: 0,
    incomeSource: '',
    hasOtherIncome: false,
    otherIncomeAmount: 0,
    houseOwnership: '',
    houseType: '',
    hasElectricity: false,
    hasWaterConnection: false,
    hasToilet: false,
    educationLevel: '',
    childrenEducation: '',
    hasHealthInsurance: false,
    chronicIllness: false,
    illnessDetails: '',
    hasDisability: false,
    disabilityType: '',
    employmentStatus: '',
    jobStability: '',
    hasBankAccount: false,
    hasVehicle: false,
    vehicleType: '',
    hasLand: false,
    landArea: 0,
    caste: '',
    religion: '',
    isWidow: false,
    isOrphan: false,
    isSeniorCitizen: false,
    hasEmergencyFund: false,
    emergencyContact: '',
    emergencyRelation: '',
    previousApplications: 0,
    previousSchemes: [],
    additionalNeeds: '',
    specialCircumstances: '',
    reason: ''
  });

  const totalSteps = 6;

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/welfare/schemes/${schemeId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          personalDetails: {
            address: formData.address,
            phoneNumber: formData.phoneNumber,
            rationCardNumber: formData.rationCardNumber,
            aadharNumber: formData.aadharNumber,
            familyIncome: formData.familyIncome,
            dependents: formData.dependents,
            isHandicapped: formData.isHandicapped,
            isSingleWoman: formData.isSingleWoman
          },
          assessment: {
            familyMembers: formData.familyMembers,
            childrenCount: formData.childrenCount,
            elderlyCount: formData.elderlyCount,
            disabledMembers: formData.disabledMembers,
            monthlyIncome: formData.monthlyIncome,
            incomeSource: formData.incomeSource,
            hasOtherIncome: formData.hasOtherIncome,
            otherIncomeAmount: formData.otherIncomeAmount,
            houseOwnership: formData.houseOwnership,
            houseType: formData.houseType,
            hasElectricity: formData.hasElectricity,
            hasWaterConnection: formData.hasWaterConnection,
            hasToilet: formData.hasToilet,
            educationLevel: formData.educationLevel,
            childrenEducation: formData.childrenEducation,
            hasHealthInsurance: formData.hasHealthInsurance,
            chronicIllness: formData.chronicIllness,
            illnessDetails: formData.illnessDetails,
            hasDisability: formData.hasDisability,
            disabilityType: formData.disabilityType,
            employmentStatus: formData.employmentStatus,
            jobStability: formData.jobStability,
            hasBankAccount: formData.hasBankAccount,
            hasVehicle: formData.hasVehicle,
            vehicleType: formData.vehicleType,
            hasLand: formData.hasLand,
            landArea: formData.landArea,
            caste: formData.caste,
            religion: formData.religion,
            isWidow: formData.isWidow,
            isOrphan: formData.isOrphan,
            isSeniorCitizen: formData.isSeniorCitizen,
            hasEmergencyFund: formData.hasEmergencyFund,
            emergencyContact: formData.emergencyContact,
            emergencyRelation: formData.emergencyRelation,
            previousApplications: formData.previousApplications,
            previousSchemes: formData.previousSchemes,
            additionalNeeds: formData.additionalNeeds,
            specialCircumstances: formData.specialCircumstances
          },
          reason: formData.reason
        })
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

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ration Card Number</label>
          <input
            type="text"
            value={formData.rationCardNumber}
            onChange={(e) => handleInputChange('rationCardNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Number</label>
          <input
            type="text"
            value={formData.aadharNumber}
            onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Family Income (Monthly) *</label>
          <input
            type="number"
            value={formData.familyIncome}
            onChange={(e) => handleInputChange('familyIncome', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Dependents *</label>
          <input
            type="number"
            value={formData.dependents}
            onChange={(e) => handleInputChange('dependents', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isHandicapped"
            checked={formData.isHandicapped}
            onChange={(e) => handleInputChange('isHandicapped', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="isHandicapped" className="text-sm text-gray-700">Are you handicapped?</label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isSingleWoman"
            checked={formData.isSingleWoman}
            onChange={(e) => handleInputChange('isSingleWoman', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="isSingleWoman" className="text-sm text-gray-700">Are you a single woman?</label>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Family & Income Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total Family Members *</label>
          <input
            type="number"
            value={formData.familyMembers}
            onChange={(e) => handleInputChange('familyMembers', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Children *</label>
          <input
            type="number"
            value={formData.childrenCount}
            onChange={(e) => handleInputChange('childrenCount', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Elderly (60+) *</label>
          <input
            type="number"
            value={formData.elderlyCount}
            onChange={(e) => handleInputChange('elderlyCount', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Disabled Members *</label>
          <input
            type="number"
            value={formData.disabledMembers}
            onChange={(e) => handleInputChange('disabledMembers', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income *</label>
          <input
            type="number"
            value={formData.monthlyIncome}
            onChange={(e) => handleInputChange('monthlyIncome', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Income Source *</label>
          <select
            value={formData.incomeSource}
            onChange={(e) => handleInputChange('incomeSource', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Income Source</option>
            <option value="salary">Salary</option>
            <option value="business">Business</option>
            <option value="agriculture">Agriculture</option>
            <option value="daily_wage">Daily Wage</option>
            <option value="pension">Pension</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="hasOtherIncome"
            checked={formData.hasOtherIncome}
            onChange={(e) => handleInputChange('hasOtherIncome', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="hasOtherIncome" className="text-sm text-gray-700">Do you have other sources of income?</label>
        </div>

        {formData.hasOtherIncome && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Other Income Amount</label>
            <input
              type="number"
              value={formData.otherIncomeAmount}
              onChange={(e) => handleInputChange('otherIncomeAmount', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Housing & Education</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">House Ownership *</label>
          <select
            value={formData.houseOwnership}
            onChange={(e) => handleInputChange('houseOwnership', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Ownership</option>
            <option value="owned">Owned</option>
            <option value="rented">Rented</option>
            <option value="government">Government</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">House Type *</label>
          <select
            value={formData.houseType}
            onChange={(e) => handleInputChange('houseType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select House Type</option>
            <option value="concrete">Concrete</option>
            <option value="semi_concrete">Semi Concrete</option>
            <option value="thatched">Thatched</option>
            <option value="temporary">Temporary</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Education Level *</label>
          <select
            value={formData.educationLevel}
            onChange={(e) => handleInputChange('educationLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Education Level</option>
            <option value="illiterate">Illiterate</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="higher_secondary">Higher Secondary</option>
            <option value="graduate">Graduate</option>
            <option value="post_graduate">Post Graduate</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Children Education *</label>
          <select
            value={formData.childrenEducation}
            onChange={(e) => handleInputChange('childrenEducation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Education Type</option>
            <option value="not_applicable">Not Applicable</option>
            <option value="government">Government School</option>
            <option value="private">Private School</option>
            <option value="not_attending">Not Attending</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Basic Amenities</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasElectricity"
              checked={formData.hasElectricity}
              onChange={(e) => handleInputChange('hasElectricity', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasElectricity" className="text-sm text-gray-700">Electricity</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasWaterConnection"
              checked={formData.hasWaterConnection}
              onChange={(e) => handleInputChange('hasWaterConnection', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasWaterConnection" className="text-sm text-gray-700">Water Connection</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasToilet"
              checked={formData.hasToilet}
              onChange={(e) => handleInputChange('hasToilet', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasToilet" className="text-sm text-gray-700">Toilet</label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Health & Employment</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status *</label>
          <select
            value={formData.employmentStatus}
            onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Employment Status</option>
            <option value="employed">Employed</option>
            <option value="unemployed">Unemployed</option>
            <option value="self_employed">Self Employed</option>
            <option value="student">Student</option>
            <option value="retired">Retired</option>
            <option value="homemaker">Homemaker</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Stability *</label>
          <select
            value={formData.jobStability}
            onChange={(e) => handleInputChange('jobStability', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Job Stability</option>
            <option value="permanent">Permanent</option>
            <option value="temporary">Temporary</option>
            <option value="contract">Contract</option>
            <option value="daily_wage">Daily Wage</option>
            <option value="not_applicable">Not Applicable</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Health Information</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasHealthInsurance"
              checked={formData.hasHealthInsurance}
              onChange={(e) => handleInputChange('hasHealthInsurance', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasHealthInsurance" className="text-sm text-gray-700">Do you have health insurance?</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="chronicIllness"
              checked={formData.chronicIllness}
              onChange={(e) => handleInputChange('chronicIllness', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="chronicIllness" className="text-sm text-gray-700">Do you have any chronic illness?</label>
          </div>

          {formData.chronicIllness && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Illness Details</label>
              <textarea
                value={formData.illnessDetails}
                onChange={(e) => handleInputChange('illnessDetails', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasDisability"
              checked={formData.hasDisability}
              onChange={(e) => handleInputChange('hasDisability', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasDisability" className="text-sm text-gray-700">Do you have any disability?</label>
          </div>

          {formData.hasDisability && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Disability Type</label>
              <input
                type="text"
                value={formData.disabilityType}
                onChange={(e) => handleInputChange('disabilityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Assets & Social Status</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Caste *</label>
          <select
            value={formData.caste}
            onChange={(e) => handleInputChange('caste', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Caste</option>
            <option value="general">General</option>
            <option value="obc">OBC</option>
            <option value="sc">SC</option>
            <option value="st">ST</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Religion *</label>
          <select
            value={formData.religion}
            onChange={(e) => handleInputChange('religion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Religion</option>
            <option value="hindu">Hindu</option>
            <option value="muslim">Muslim</option>
            <option value="christian">Christian</option>
            <option value="sikh">Sikh</option>
            <option value="buddhist">Buddhist</option>
            <option value="jain">Jain</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Assets</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasBankAccount"
              checked={formData.hasBankAccount}
              onChange={(e) => handleInputChange('hasBankAccount', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasBankAccount" className="text-sm text-gray-700">Do you have a bank account?</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasVehicle"
              checked={formData.hasVehicle}
              onChange={(e) => handleInputChange('hasVehicle', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasVehicle" className="text-sm text-gray-700">Do you have a vehicle?</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasLand"
              checked={formData.hasLand}
              onChange={(e) => handleInputChange('hasLand', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasLand" className="text-sm text-gray-700">Do you own land?</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasEmergencyFund"
              checked={formData.hasEmergencyFund}
              onChange={(e) => handleInputChange('hasEmergencyFund', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasEmergencyFund" className="text-sm text-gray-700">Do you have emergency funds?</label>
          </div>
        </div>

        {formData.hasVehicle && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
            <input
              type="text"
              value={formData.vehicleType}
              onChange={(e) => handleInputChange('vehicleType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {formData.hasLand && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Land Area (in acres)</label>
            <input
              type="number"
              value={formData.landArea}
              onChange={(e) => handleInputChange('landArea', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Special Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isWidow"
              checked={formData.isWidow}
              onChange={(e) => handleInputChange('isWidow', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isWidow" className="text-sm text-gray-700">Are you a widow?</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isOrphan"
              checked={formData.isOrphan}
              onChange={(e) => handleInputChange('isOrphan', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isOrphan" className="text-sm text-gray-700">Are you an orphan?</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isSeniorCitizen"
              checked={formData.isSeniorCitizen}
              onChange={(e) => handleInputChange('isSeniorCitizen', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isSeniorCitizen" className="text-sm text-gray-700">Are you a senior citizen?</label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency & Additional Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact *</label>
          <input
            type="text"
            value={formData.emergencyContact}
            onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Relation *</label>
          <input
            type="text"
            value={formData.emergencyRelation}
            onChange={(e) => handleInputChange('emergencyRelation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Previous Applications Count</label>
          <input
            type="number"
            value={formData.previousApplications}
            onChange={(e) => handleInputChange('previousApplications', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Application *</label>
        <textarea
          value={formData.reason}
          onChange={(e) => handleInputChange('reason', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Please explain why you need this welfare scheme..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Needs</label>
        <textarea
          value={formData.additionalNeeds}
          onChange={(e) => handleInputChange('additionalNeeds', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Any additional needs or requirements..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Special Circumstances</label>
        <textarea
          value={formData.specialCircumstances}
          onChange={(e) => handleInputChange('specialCircumstances', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Any special circumstances that should be considered..."
        />
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

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

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Form Content */}
          <div className="mb-6">
            {renderCurrentStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-4 py-2 rounded-md ${
                currentStep === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              Previous
            </button>

            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>

              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelfareApplicationForm;