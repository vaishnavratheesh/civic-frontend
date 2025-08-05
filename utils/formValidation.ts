import axios from 'axios';

// Validation result interface
export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

// Form validation errors interface
export interface ValidationErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    panchayath?: string;
    ward?: string;
}

// Professional email validation utility
export const validateEmail = (email: string): ValidationResult => {
    if (!email) {
        return { isValid: false, error: 'Email is required' };
    }

    // Remove whitespace
    email = email.trim();

    // Basic format validation with comprehensive regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    // Split email into local and domain parts
    const [localPart, domain] = email.split('@');
    
    if (!localPart || !domain) {
        return { isValid: false, error: 'Invalid email format' };
    }

    // Validate local part (before @)
    if (localPart.length > 64) {
        return { isValid: false, error: 'Email address is too long' };
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
        return { isValid: false, error: 'Email cannot start or end with a dot' };
    }

    if (localPart.includes('..')) {
        return { isValid: false, error: 'Email cannot contain consecutive dots' };
    }

    // Validate domain part (after @)
    if (domain.length < 4) {
        return { isValid: false, error: 'Email domain is too short' };
    }

    if (domain.includes('..')) {
        return { isValid: false, error: 'Invalid email domain format - consecutive dots not allowed' };
    }
    
    if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) {
        return { isValid: false, error: 'Invalid email domain format' };
    }

    // Check for valid TLD (top-level domain)
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) {
        return { isValid: false, error: 'Invalid email domain extension' };
    }

    // Check total email length
    if (email.length > 254) {
        return { isValid: false, error: 'Email address is too long' };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
        /\.{2,}/, // Multiple consecutive dots
        /@{2,}/, // Multiple @ symbols
        /^[.-]/, // Starting with dot or dash
        /[.-]$/, // Ending with dot or dash
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(email)) {
            return { isValid: false, error: 'Invalid email format detected' };
        }
    }

    return { isValid: true };
};

// Password validation utility
export const validatePassword = (password: string): ValidationResult => {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 6) {
        return { isValid: false, error: 'Password must be at least 6 characters long' };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'Password is too long (maximum 128 characters)' };
    }

    // Check for at least one letter and one number for stronger passwords
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasLetter || !hasNumber) {
        return { 
            isValid: false, 
            error: 'Password should contain at least one letter and one number for better security' 
        };
    }

    return { isValid: true };
};

// Confirm password validation
export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
    if (!confirmPassword) {
        return { isValid: false, error: 'Please confirm your password' };
    }

    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }

    return { isValid: true };
};

// Name validation utility
export const validateName = (name: string): ValidationResult => {
    if (!name) {
        return { isValid: false, error: 'Full name is required' };
    }

    name = name.trim();

    if (name.length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters long' };
    }

    if (name.length > 100) {
        return { isValid: false, error: 'Name is too long (maximum 100 characters)' };
    }

    // Check for valid name characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name)) {
        return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    // Check for reasonable name format (at least one letter)
    if (!/[a-zA-Z]/.test(name)) {
        return { isValid: false, error: 'Name must contain at least one letter' };
    }

    return { isValid: true };
};

// Panchayath validation
export const validatePanchayath = (panchayath: string): ValidationResult => {
    if (!panchayath) {
        return { isValid: false, error: 'Please select a Panchayath/Municipality' };
    }

    return { isValid: true };
};

// Ward validation
export const validateWard = (ward: number, availableWards: number[]): ValidationResult => {
    if (!ward) {
        return { isValid: false, error: 'Please select a ward' };
    }

    if (!availableWards.includes(ward)) {
        return { isValid: false, error: 'Please select a valid ward for the selected Panchayath' };
    }

    return { isValid: true };
};

// Check if email exists (for registration context)
export const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
        const response = await axios.post('http://localhost:3001/api/check-email', { email });
        return response.data.exists;
    } catch (error) {
        console.error('Error checking email:', error);
        return false;
    }
};

// Comprehensive email validation for registration (includes existence check)
export const validateEmailForRegistration = async (email: string): Promise<ValidationResult> => {
    // First, do basic validation
    const basicValidation = validateEmail(email);
    if (!basicValidation.isValid) {
        return basicValidation;
    }

    // Then check if email already exists
    try {
        const exists = await checkEmailExists(email);
        if (exists) {
            return { 
                isValid: false, 
                error: 'An account with this email already exists. Please use a different email or try logging in.' 
            };
        }
    } catch (error) {
        console.error('Error during email validation:', error);
        // Don't block registration if the check fails
    }

    return { isValid: true };
};

// Utility to check if there are any actual validation errors
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
    return Object.values(errors).some(error => error && error.trim() !== '');
};

// Utility to get user-friendly error messages
export const getFieldErrorMessage = (field: string, error: string): string => {
    const fieldNames: { [key: string]: string } = {
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        name: 'Full Name',
        panchayath: 'Panchayath/Municipality',
        ward: 'Ward'
    };

    const fieldName = fieldNames[field] || field;
    return `${fieldName}: ${error}`;
};
