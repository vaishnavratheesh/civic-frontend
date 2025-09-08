import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import Spinner from '../../components/Spinner';
import PasswordInput from '../../components/PasswordInput';
import { validateName, validatePassword } from '../../utils/formValidation';
import { API_ENDPOINTS } from '../../src/config/config';

interface CouncillorProfileData {
  name: string;
  ward: number;
  appointmentDate: string;
  endDate: string;
  partyAffiliation: string;
  educationalQualification: string;
  previousExperience: string;
  emergencyContact: string;
  emergencyContactRelation: string;
  contactNumber: string;
  address: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const EditCouncillorProfile: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState<CouncillorProfileData>({
    name: user?.name || '',
    ward: user?.ward || 1,
    appointmentDate: '',
    endDate: '',
    partyAffiliation: '',
    educationalQualification: '',
    previousExperience: '',
    emergencyContact: '',
    emergencyContactRelation: '',
    contactNumber: user?.contactNumber || '',
    address: user?.address || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const councillorSidebarItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'fa-tachometer-alt', path: '/councillor' },
    { id: 'complaints', name: 'Complaints', icon: 'fa-exclamation-triangle', path: '/councillor' },
    { id: 'welfare', name: 'Welfare Applications', icon: 'fa-hands-helping', path: '/councillor' },
    { id: 'view-schemes', name: 'View Schemes', icon: 'fa-list-alt', path: '/councillor' },
    { id: 'add-schemes', name: 'Add Schemes', icon: 'fa-plus-circle', path: '/councillor' },
    { id: 'edit-profile', name: 'Edit Profile', icon: 'fa-user-edit', path: '/councillor/edit-profile' },
  ];

  const handleSidebarNavigation = (itemId: string) => {
    if (itemId === 'edit-profile') {
      navigate('/councillor/edit-profile');
    } else {
      navigate('/councillor');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load existing profile data
    loadProfileData();
  }, [user, navigate]);

  const loadProfileData = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.COUNCILLOR_PROFILE, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        const profileData = responseData.councillor || responseData; // Handle both response structures
        
        setFormData(prev => ({
          ...prev,
          name: profileData.name || prev.name,
          ward: profileData.ward || prev.ward,
          contactNumber: profileData.contactNumber || prev.contactNumber,
          address: profileData.address || prev.address,
          partyAffiliation: profileData.partyAffiliation || prev.partyAffiliation,
          educationalQualification: profileData.educationalQualification || prev.educationalQualification,
          previousExperience: profileData.previousExperience || prev.previousExperience,
          emergencyContact: profileData.emergencyContact || prev.emergencyContact,
          emergencyContactRelation: profileData.emergencyContactRelation || prev.emergencyContactRelation,
          appointmentDate: profileData.appointmentDate ? new Date(profileData.appointmentDate).toISOString().split('T')[0] : prev.appointmentDate,
          endDate: profileData.endDate ? new Date(profileData.endDate).toISOString().split('T')[0] : prev.endDate,
          // Keep password fields empty for security
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation errors
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    // Validate name
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error;
    }

    // Validate contact number
    if (!formData.contactNumber || formData.contactNumber.length < 10) {
      errors.contactNumber = 'Please enter a valid contact number';
    }

    // Validate address
    if (!formData.address || formData.address.trim().length < 10) {
      errors.address = 'Please enter a complete address';
    }

    // Validate password change if provided
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required to change password';
      }
      
      if (formData.newPassword) {
        const passwordValidation = validatePassword(formData.newPassword);
        if (!passwordValidation.isValid) {
          errors.newPassword = passwordValidation.error;
        }
      }

      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting form data:', formData);
      console.log('Password fields:', {
        currentPassword: formData.currentPassword ? '***' : 'empty',
        newPassword: formData.newPassword ? '***' : 'empty',
        confirmPassword: formData.confirmPassword ? '***' : 'empty'
      });

      const response = await fetch(API_ENDPOINTS.COUNCILLOR_UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        setMessage('Profile updated successfully!');
        
        // Update local user data
        if (user) {
          const updatedUser = { ...user, ...formData };
          login(updatedUser);
        }
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Sidebar 
        items={councillorSidebarItems}
        onItemClick={handleSidebarNavigation}
        activeTab={'edit-profile'}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Councillor Profile</h1>
              <p className="text-gray-600">Update your councillor profile information</p>
            </div>

            {/* Messages */}
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-3"></i>
                  <p className="text-green-700 font-medium">{message}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <i className="fas fa-user-circle mr-3 text-blue-600"></i>
                  Personal Information
                </h3>

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
                      className={`w-full px-4 py-3 border rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-all duration-200 ${
                        validationErrors.name
                          ? 'border-red-500 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Enter your full name"
                      required
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-xs mt-2">{validationErrors.name}</p>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    >
                      {Array.from({ length: 23 }, (_, i) => i + 1).map(ward => (
                        <option key={ward} value={ward}>Ward {ward}</option>
                      ))}
                    </select>
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
                      className={`w-full px-4 py-3 border rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-all duration-200 ${
                        validationErrors.contactNumber
                          ? 'border-red-500 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Enter your contact number"
                      required
                    />
                    {validationErrors.contactNumber && (
                      <p className="text-red-500 text-xs mt-2">{validationErrors.contactNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 transition-all duration-200 ${
                        validationErrors.address
                          ? 'border-red-500 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Enter your complete address"
                      required
                    />
                    {validationErrors.address && (
                      <p className="text-red-500 text-xs mt-2">{validationErrors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Councillor Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <i className="fas fa-landmark mr-3 text-green-600"></i>
                  Councillor Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      name="appointmentDate"
                      value={formData.appointmentDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Party Affiliation
                    </label>
                    <input
                      type="text"
                      name="partyAffiliation"
                      value={formData.partyAffiliation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your party affiliation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Educational Qualification
                    </label>
                    <input
                      type="text"
                      name="educationalQualification"
                      value={formData.educationalQualification}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your educational qualification"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Previous Experience
                  </label>
                  <textarea
                    name="previousExperience"
                    value={formData.previousExperience}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Describe your previous experience"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <i className="fas fa-phone-alt mr-3 text-orange-600"></i>
                  Emergency Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Emergency Contact Number
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter emergency contact number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergencyContactRelation"
                      value={formData.emergencyContactRelation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>
                </div>
              </div>

              {/* Password Change (Optional) */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <i className="fas fa-lock mr-3 text-purple-600"></i>
                  Change Password (Optional)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password
                    </label>
                    <PasswordInput
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword || ''}
                      onChange={handleInputChange}
                      placeholder="Enter current password"
                      error={validationErrors.currentPassword}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <PasswordInput
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword || ''}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                      error={validationErrors.newPassword}
                      className="w-full"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <PasswordInput
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword || ''}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                      error={validationErrors.confirmPassword}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/councillor')}
                  className="px-8 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 font-semibold rounded-xl transition-all duration-200 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Spinner size="sm" />
                      <span className="ml-2">Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <i className="fas fa-save mr-2"></i>
                      Update Profile
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
};

export default EditCouncillorProfile; 