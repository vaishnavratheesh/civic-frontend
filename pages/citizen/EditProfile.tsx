/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import LocationPicker from '../../components/LocationPicker';
import PasswordInput from '../../components/PasswordInput';
import { useNavigate } from 'react-router-dom';
import { validateName, validatePassword } from '../../utils/formValidation';
import { WARD_NUMBERS, PANCHAYATH_NAMES } from '../../constants';
import Spinner from '../../components/Spinner';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  ward: number;
  panchayath: string;
  address: string;
  contactNumber: string;
  location: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
  } | null;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  ward?: string;
  panchayath?: string;
  address?: string;
  contactNumber?: string;
  location?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

const EditProfile: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    ward: 1,
    panchayath: 'Erumeli Panchayath',
    address: '',
    contactNumber: '',
    location: null,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'my-ward', name: 'My Ward', icon: 'fa-map-marker-alt', path: '/citizen' },
    { id: 'my-grievances', name: 'My Grievances', icon: 'fa-bullhorn', path: '/citizen' },
    { id: 'community-grievances', name: 'Community Grievances', icon: 'fa-users', path: '/citizen' },
    { id: 'welfare-schemes', name: 'Welfare Schemes', icon: 'fa-hands-helping', path: '/citizen' },
    { id: 'help', name: 'Help', icon: 'fa-question-circle', path: '/citizen/help' },
  ];

  useEffect(() => {
    if (user) {
      // Split full name into first and last name
      const nameParts = user.name?.split(' ') || ['', ''];
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        ward: user.ward || 1,
        panchayath: user.panchayath || 'Erumeli Panchayath',
        address: user.address || '',
        contactNumber: user.contactNumber || '',
        location: user.location || null,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setProfilePicture(user.profilePicture || null);
    }
  }, [user]);

  const handleSidebarNavigation = (itemId: string) => {
    if (itemId === 'help') {
      navigate('/citizen/help');
    } else {
      navigate('/citizen');
    }
  };

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    const nameValidation = validateName(formData.firstName);
    if (!nameValidation.isValid) {
      newErrors.firstName = nameValidation.error;
    }

    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.error;
    }

    // Email cannot be changed, so no validation needed

    // Validate ward
    if (!formData.ward || formData.ward < 1 || formData.ward > 23) {
      newErrors.ward = 'Please select a valid ward (1-23)';
    }

    // Validate panchayath
    if (!formData.panchayath) {
      newErrors.panchayath = 'Please select a panchayath';
    }

    // Validate contact number
    if (formData.contactNumber && !/^[0-9]{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid 10-digit phone number';
    }

    // Validate password if user wants to change it
    if (showPasswordSection) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      
      if (formData.newPassword) {
        const passwordValidation = validatePassword(formData.newPassword);
        if (!passwordValidation.isValid) {
          newErrors.newPassword = passwordValidation.error;
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch(`http://localhost:3002/api/users/${user?.id}/profile-picture`, {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setProfilePicture(data.profilePicture);
        setMessage('Profile picture updated successfully!');
        // Update local user data
        if (user) {
          login({
            ...user,
            profilePicture: data.profilePicture
          });
        }
      } else {
        setErrors({ general: data.error || 'Failed to upload image' });
      }
    } catch (err) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ general: 'Please select an image file' });
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ general: 'Image size should be less than 5MB' });
        return;
      }

      handleImageUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrors({});

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        ward: formData.ward,
        panchayath: formData.panchayath,
        address: formData.address,
        contactNumber: formData.contactNumber,
        location: formData.location,
      };

      // Add password if user wants to change it
      if (showPasswordSection && formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const response = await fetch(`http://localhost:3002/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profile updated successfully!');
        
        // Update local user data
        if (user) {
          login({
            ...user,
            ...data.user
          });
        }
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setShowPasswordSection(false);
      } else {
        setErrors({ general: data.error || 'Failed to update profile' });
      }
    } catch (err) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; formattedAddress: string }) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
    
    // Clear location error if exists
    if (errors.location) {
      setErrors(prev => ({
        ...prev,
        location: undefined
      }));
    }
  };

  const handlePasswordChange = async () => {
    if (!formData.currentPassword || !formData.newPassword) {
      setErrors({ currentPassword: 'Both current and new password are required' });
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
      const response = await fetch(`http://localhost:3002/api/users/${user?.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
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
    } catch (err) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <Sidebar
        items={sidebarItems}
        onItemClick={handleSidebarNavigation}
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {/* Navbar */}
        <Navbar onMenuClick={handleMenuClick} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
                <p className="text-gray-600">Update your personal information and preferences</p>
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

              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center">
                    <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
                    <p className="text-red-700 font-medium">{errors.general}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Profile Picture Section */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                      {uploadingImage ? (
                        <div className="flex items-center justify-center">
                          <Spinner size="sm" />
                        </div>
                      ) : profilePicture ? (
                        <img
                          src={profilePicture}
                          alt={user?.name || 'Profile'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <i className="fas fa-user text-4xl text-gray-400"></i>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50"
                    >
                      <i className="fas fa-camera text-sm"></i>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <i className="fas fa-user-circle mr-3 text-blue-600"></i>
                    Personal Information
                  </h3>

                {/* First Name and Last Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.firstName ? 'border-red-300' : 'border-gray-300'
                        }`}
                      required
                    />
                      {errors.firstName && (
                        <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                      )}
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.lastName ? 'border-red-300' : 'border-gray-300'
                        }`}
                      required
                    />
                      {errors.lastName && (
                        <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                      )}
                    </div>
                </div>

                  {/* Email (Read-only) */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                      disabled
                  />
                    <p className="text-gray-500 text-sm mt-1">
                      <i className="fas fa-info-circle mr-1"></i>
                      Email address cannot be changed once created
                    </p>
                </div>

                {/* Contact Number */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.contactNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.contactNumber && (
                      <p className="text-red-600 text-sm mt-1">{errors.contactNumber}</p>
                    )}
                  </div>
                </div>

                {/* Location Information Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <i className="fas fa-map-marker-alt mr-3 text-green-600"></i>
                    Location Information
                  </h3>

                  {/* Ward and Panchayath */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Panchayath *
                      </label>
                      <select
                        name="panchayath"
                        value={formData.panchayath}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                          errors.panchayath ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                      >
                        {PANCHAYATH_NAMES.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      {errors.panchayath && (
                        <p className="text-red-600 text-sm mt-1">{errors.panchayath}</p>
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
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                          errors.ward ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                      >
                        {WARD_NUMBERS.map(ward => (
                          <option key={ward} value={ward}>Ward {ward}</option>
                        ))}
                      </select>
                      {errors.ward && (
                        <p className="text-red-600 text-sm mt-1">{errors.ward}</p>
                      )}
                    </div>
                </div>

                {/* Address */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                      placeholder="Enter your complete address"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                        errors.address ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.address && (
                      <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>

                  {/* Location Picker */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location on Map
                    </label>
                    <LocationPicker
                      onLocationSelect={handleLocationSelect}
                      initialLocation={formData.location}
                      className="w-full"
                    />
                    {errors.location && (
                      <p className="text-red-600 text-sm mt-1">{errors.location}</p>
                    )}
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <i className="fas fa-lock mr-3 text-yellow-600"></i>
                      Change Password
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 font-medium"
                    >
                      {showPasswordSection ? 'Cancel' : 'Change Password'}
                    </button>
                  </div>

                  {showPasswordSection && (
                    <div className="space-y-6">
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

                {/* Save Button */}
                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-blue-500/25"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <Spinner size="sm" />
                        <span className="ml-2">Saving Changes...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <i className="fas fa-save mr-2"></i>
                        Save Changes
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

export default EditProfile;