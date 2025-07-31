
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { WelfareScheme, WelfareApplication, ApplicationStatus } from '../../types';
import Spinner from '../../components/Spinner';

// This would be in a service file in a real app
const saveWelfareApplication = async (applicationData: Omit<WelfareApplication, 'id' | 'createdAt' | 'score' | 'justification'>): Promise<WelfareApplication> => {
    console.log("Saving application:", applicationData);
    return new Promise(resolve => {
        setTimeout(() => {
            const newApplication: WelfareApplication = {
                ...applicationData,
                id: `app-${Date.now()}`,
                createdAt: new Date().toISOString(),
            };
            resolve(newApplication);
        }, 1500);
    });
};

interface WelfareApplicationFormProps {
    scheme: WelfareScheme;
    onClose: () => void;
    onSubmit: (application: WelfareApplication) => void;
}

const FormInput: React.FC<{id: string, label: string, type?: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean, placeholder?: string, name: string}> = 
({ id, label, type = 'text', value, onChange, required = false, placeholder, name }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
);

const FormCheckbox: React.FC<{id: string, label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, name: string}> =
({ id, label, checked, onChange, name}) => (
     <div className="flex items-center">
        <input
            id={id}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor={id} className="ml-2 block text-sm text-gray-900">{label}</label>
    </div>
);


const WelfareApplicationForm: React.FC<WelfareApplicationFormProps> = ({ scheme, onClose, onSubmit }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        address: '',
        phoneNumber: '',
        rationCardNumber: '',
        aadharNumber: '',
        reason: '',
        familyIncome: '',
        dependents: '',
        isHandicapped: false,
        isSingleWoman: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError("You must be logged in to apply.");
            return;
        }
        setLoading(true);
        setError('');

        try {
            const applicationData: Omit<WelfareApplication, 'id' | 'createdAt' | 'score' | 'justification'> = {
                schemeId: scheme.id,
                schemeTitle: scheme.title,
                userId: user.id,
                userName: user.name,
                ward: user.ward,
                status: ApplicationStatus.PENDING,
                address: formData.address,
                phoneNumber: formData.phoneNumber,
                rationCardNumber: formData.rationCardNumber,
                aadharNumber: formData.aadharNumber,
                reason: formData.reason,
                familyIncome: Number(formData.familyIncome),
                dependents: Number(formData.dependents),
                isHandicapped: formData.isHandicapped,
                isSingleWoman: formData.isSingleWoman,
            };

            const newApplication = await saveWelfareApplication(applicationData);
            onSubmit(newApplication);
        } catch (err: any) {
            setError(err.message || "Failed to submit application.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 sm:p-8 sticky top-0 bg-white border-b">
                        <h3 className="text-2xl font-bold text-gray-800">Apply for: {scheme.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Please fill in your details accurately.</p>
                         <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <i className="fas fa-times text-2xl"></i>
                        </button>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{error}</div>}

                        {/* Personal Information */}
                        <fieldset className="space-y-4 p-4 border rounded-md">
                            <legend className="font-semibold text-lg text-gray-700 px-2">Personal Information</legend>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormInput id="name" name="name" label="Full Name" value={user?.name || ''} onChange={() => {}} required placeholder="Your full name" />
                                <FormInput id="ward" name="ward" label="Ward Number" value={`Ward ${user?.ward}` || ''} onChange={() => {}} required placeholder="Your ward number" />
                            </div>
                            <FormInput id="address" name="address" label="Full Residential Address" value={formData.address} onChange={handleChange} required placeholder="Your complete address" />
                             <FormInput id="phoneNumber" name="phoneNumber" label="Phone Number" type="tel" value={formData.phoneNumber} onChange={handleChange} required placeholder="10-digit mobile number" />
                        </fieldset>

                        {/* Identification */}
                        <fieldset className="space-y-4 p-4 border rounded-md">
                            <legend className="font-semibold text-lg text-gray-700 px-2">Identification</legend>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormInput id="aadharNumber" name="aadharNumber" label="Aadhar Card Number" value={formData.aadharNumber} onChange={handleChange} required placeholder="xxxx-xxxx-xxxx" />
                                <FormInput id="rationCardNumber" name="rationCardNumber" label="Ration Card Number" value={formData.rationCardNumber} onChange={handleChange} required placeholder="Ration card number" />
                            </div>
                        </fieldset>

                        {/* Reason for Application */}
                        <fieldset className="space-y-4 p-4 border rounded-md">
                            <legend className="font-semibold text-lg text-gray-700 px-2">Reason for Application</legend>
                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                                    Please briefly explain why you are applying for this scheme.
                                </label>
                                <textarea
                                    id="reason"
                                    name="reason"
                                    rows={4}
                                    value={formData.reason}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., I am a single mother and need support for my children's education."
                                    className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </fieldset>
                        
                        {/* Financial & Eligibility */}
                         <fieldset className="space-y-4 p-4 border rounded-md">
                            <legend className="font-semibold text-lg text-gray-700 px-2">Financial & Eligibility Details</legend>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormInput id="familyIncome" name="familyIncome" label="Total Annual Family Income (₹)" type="number" value={formData.familyIncome} onChange={handleChange} required placeholder="e.g., 150000" />
                                <FormInput id="dependents" name="dependents" label="Number of Dependents" type="number" value={formData.dependents} onChange={handleChange} required placeholder="e.g., 4" />
                            </div>
                            <div className="space-y-2 pt-2">
                                <FormCheckbox id="isHandicapped" name="isHandicapped" label="Are you differently-abled (handicapped)?" checked={formData.isHandicapped} onChange={handleChange} />
                                <FormCheckbox id="isSingleWoman" name="isSingleWoman" label="Are you a single woman (widowed)?" checked={formData.isSingleWoman} onChange={handleChange} />
                            </div>
                        </fieldset>
                    </div>

                    <div className="p-6 flex justify-end space-x-4 sticky bottom-0 bg-gray-50 border-t">
                        <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-blue-300 flex items-center">
                            {loading ? <><Spinner size="sm" /> <span className="ml-2">Submitting...</span></> : "Submit Application"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WelfareApplicationForm;