import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import PasswordInput from '../../components/PasswordInput';
import { validateName, validatePassword } from '../../utils/formValidation';
import { API_ENDPOINTS } from '../../src/config/config';

interface CouncillorProfileData {
  name: string;
  ward: number;
  appointmentDate: string;
  endDate: string;
  contactNumber: string;
  email: string;
  address: string;
  partyAffiliation: string;
  educationalQualification: string;
  previousExperience: string;
  emergencyContact: string;
  emergencyContactRelation: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  ward?: string;
  appointmentDate?: string;
  endDate?: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  partyAffiliation?: string;
  educationalQualification?: string;
  previousExperience?: string;
  emergencyContact?: string;
  emergencyContactRelation?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const WARD_NUMBERS = Array.from({ length: 23 }, (_, i) => i + 1);

const CompleteCouncillorProfile: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState<CouncillorProfileData>({
    name: '',
    ward: 1,
    appointmentDate: '',
    endDate: '',
    contactNumber: '',
    email: user?.email || '',
    address: '',
    partyAffiliation: '',
    educationalQualification: '',
    previousExperience: '',
    emergencyContact: '',
    emergencyContactRelation: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If user already has a complete profile, redirect to dashboard
    if (user.name && user.ward && user.role === 'councillor') {
      navigate('/councillor/dashboard');
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else {
      const nameValidation = validateName(formData.name);
      if (!nameValidation.isValid) {
        newErrors.name = nameValidation.error;
      }
    }

    // Validate ward
    if (!formData.ward || formData.ward < 1 || formData.ward > 23) {
      newErrors.ward = 'Please select a valid ward (1-23)';
    }

    // Validate appointment date
    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Appointment date is required';
    } else {
      const appointmentDate = new Date(formData.appointmentDate);
      const today = new Date();
      if (appointmentDate > today) {
        newErrors.appointmentDate = 'Appointment date cannot be in the future';
      }
    }

    // Validate end date
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else {
      const endDate = new Date(formData.endDate);
      const appointmentDate = new Date(formData.appointmentDate);
      if (endDate <= appointmentDate) {
        newErrors.endDate = 'End date must be after appointment date';
      }
    }

    // Validate contact number
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid 10-digit mobile number';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate address
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Validate party affiliation
    if (!formData.partyAffiliation.trim()) {
      newErrors.partyAffiliation = 'Party affiliation is required';
    }

    // Validate educational qualification
    if (!formData.educationalQualification.trim()) {
      newErrors.educationalQualification = 'Educational qualification is required';
    }

    // Validate emergency contact
    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = 'Emergency contact is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.emergencyContact)) {
      newErrors.emergencyContact = 'Please enter a valid 10-digit mobile number';
    }

    // Validate emergency contact relation
    if (!formData.emergencyContactRelation.trim()) {
      newErrors.emergencyContactRelation = 'Emergency contact relation is required';
    }

    // Validate password if changing
    if (showPasswordSection) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }

      if (formData.newPassword) {
        const passwordValidation = validatePassword(formData.newPassword);
        if (!passwordValidation.isValid) {
          newErrors.newPassword = passwordValidation.error;
        }
      }

      if (formData.newPassword && !formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your new password';
      } else if (formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
              const response = await fetch(API_ENDPOINTS.COUNCILLOR_COMPLETE_PROFILE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          ...formData,
          currentPassword: showPasswordSection ? formData.currentPassword : undefined,
          newPassword: showPasswordSection ? formData.newPassword : undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profile completed successfully! Redirecting to dashboard...');
        
        // Update user data in context
        const updatedUser = {
          ...user,
          name: formData.name,
          ward: formData.ward,
          role: 'councillor' as const
        };
        login(updatedUser);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/councillor/dashboard');
        }, 2000);
      } else {
        setErrors({ general: data.error || 'Failed to complete profile' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setErrors({ general: 'Please fill all password fields' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      setErrors({ newPassword: passwordValidation.error });
      return;
    }

    setLoading(true);
    try {
              const response = await fetch(API_ENDPOINTS.COUNCILLOR_CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password changed successfully!');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setShowPasswordSection(false);
      } else {
        setErrors({ currentPassword: data.error || 'Failed to change password' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="fas fa-user-tie text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Complete Your Councillor Profile</h1>
            <p className="text-gray-600">Please provide your complete information to access the councillor dashboard</p>
          </div>

          {/* Messages */}
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
              <i className="fas fa-check-circle mr-2"></i>
              {message}
            </div>
          )}

          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {errors.general}
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-user mr-3 text-blue-600"></i>
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ward Number *
                    </label>
                    <select
                      name="ward"
                      value={formData.ward}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.ward ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Ward</option>
                      {WARD_NUMBERS.map(ward => (
                        <option key={ward} value={ward}>Ward {ward}</option>
                      ))}
                    </select>
                    {errors.ward && (
                      <p className="text-red-600 text-sm mt-1">{errors.ward}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.contactNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your mobile number"
                    />
                    {errors.contactNumber && (
                      <p className="text-red-600 text-sm mt-1">{errors.contactNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.address ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your complete address"
                    />
                    {errors.address && (
                      <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Councillor Information Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-award mr-3 text-green-600"></i>
                  Councillor Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date Appointed as Ward Member *
                    </label>
                    <input
                      type="date"
                      name="appointmentDate"
                      value={formData.appointmentDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.appointmentDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.appointmentDate && (
                      <p className="text-red-600 text-sm mt-1">{errors.appointmentDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date of Term *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.endDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.endDate && (
                      <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Party Affiliation *
                    </label>
                    <input
                      type="text"
                      name="partyAffiliation"
                      value={formData.partyAffiliation}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.partyAffiliation ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your party affiliation"
                    />
                    {errors.partyAffiliation && (
                      <p className="text-red-600 text-sm mt-1">{errors.partyAffiliation}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Educational Qualification *
                    </label>
                    <input
                      type="text"
                      name="educationalQualification"
                      value={formData.educationalQualification}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.educationalQualification ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Bachelor's Degree, Master's Degree"
                    />
                    {errors.educationalQualification && (
                      <p className="text-red-600 text-sm mt-1">{errors.educationalQualification}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Previous Experience
                    </label>
                    <textarea
                      name="previousExperience"
                      value={formData.previousExperience}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.previousExperience ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Describe your previous experience in public service or community work"
                    />
                    {errors.previousExperience && (
                      <p className="text-red-600 text-sm mt-1">{errors.previousExperience}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-phone-alt mr-3 text-red-600"></i>
                  Emergency Contact
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Emergency Contact Number *
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.emergencyContact ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter emergency contact number"
                    />
                    {errors.emergencyContact && (
                      <p className="text-red-600 text-sm mt-1">{errors.emergencyContact}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Relation to Emergency Contact *
                    </label>
                    <input
                      type="text"
                      name="emergencyContactRelation"
                      value={formData.emergencyContactRelation}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.emergencyContactRelation ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                    {errors.emergencyContactRelation && (
                      <p className="text-red-600 text-sm mt-1">{errors.emergencyContactRelation}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Change Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <i className="fas fa-lock mr-3 text-yellow-600"></i>
                    Change Password (Optional)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showPasswordSection ? 'Cancel' : 'Change Password'}
                  </button>
                </div>

                {showPasswordSection && (
                  <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Password *
                      </label>
                      <PasswordInput
                        id="currentPassword"
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange({ ...e, target: { ...e.target, name: 'currentPassword' } })}
                        placeholder="Enter your current password"
                        error={errors.currentPassword}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        New Password *
                      </label>
                      <PasswordInput
                        id="newPassword"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange({ ...e, target: { ...e.target, name: 'newPassword' } })}
                        placeholder="Enter your new password"
                        error={errors.newPassword}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <PasswordInput
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange({ ...e, target: { ...e.target, name: 'confirmPassword' } })}
                        placeholder="Confirm your new password"
                        error={errors.confirmPassword}
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handlePasswordChange}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <Spinner size="sm" />
                            <span className="ml-2">Updating...</span>
                          </div>
                        ) : (
                          'Update Password'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-blue-500/25"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Spinner size="sm" />
                      <span className="ml-2">Completing Profile...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <i className="fas fa-check mr-2"></i>
                      Complete Profile
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteCouncillorProfile; 