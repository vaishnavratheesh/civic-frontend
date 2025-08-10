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
    ward?: string;
}

// Professional email validation utility
export const validateEmail = (email: string): ValidationResult => {
    if (!email) {
        return { isValid: false, error: 'Email is required' };
    }

    // No leading/trailing spaces
    if (email !== email.trim()) {
        return { isValid: false, error: 'Email cannot have leading or trailing spaces' };
    }
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
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1]; // Get the last part
    
    // For multi-level TLDs like .co.in, .ac.in, etc.
    let fullTLD = '';
    if (domainParts.length >= 2) {
        // Check for common multi-level TLDs
        const lastTwo = domainParts.slice(-2).join('.');
        const lastThree = domainParts.length >= 3 ? domainParts.slice(-3).join('.') : '';
        
        if (['co.in', 'ac.in', 'org.in', 'net.in', 'gov.in', 'edu.in', 'mil.in', 'nic.in'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'nhs.uk', 'sch.uk'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.au', 'org.au', 'net.au', 'edu.au', 'gov.au'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.br', 'org.br', 'net.br', 'gov.br', 'edu.br'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.mx', 'org.mx', 'net.mx', 'gov.mx', 'edu.mx'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.sg', 'org.sg', 'net.sg', 'gov.sg', 'edu.sg'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.my', 'org.my', 'net.my', 'gov.my', 'edu.my'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.ph', 'org.ph', 'net.ph', 'gov.ph', 'edu.ph'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.pk', 'org.pk', 'net.pk', 'gov.pk', 'edu.pk'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.bd', 'org.bd', 'net.bd', 'gov.bd', 'edu.bd'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.lk', 'org.lk', 'net.lk', 'gov.lk', 'edu.lk'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.np', 'org.np', 'net.np', 'gov.np', 'edu.np'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.za', 'org.za', 'net.za', 'gov.za', 'edu.za'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.ng', 'org.ng', 'net.ng', 'gov.ng', 'edu.ng'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.gh', 'org.gh', 'net.gh', 'gov.gh', 'edu.gh'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.ke', 'org.ke', 'net.ke', 'gov.ke', 'edu.ke'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.tz', 'org.tz', 'net.tz', 'gov.tz', 'edu.tz'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.ug', 'org.ug', 'net.ug', 'gov.ug', 'edu.ug'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.zm', 'org.zm', 'net.zm', 'gov.zm', 'edu.zm'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.zw', 'org.zw', 'net.zw', 'gov.zw', 'edu.zw'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.mu', 'org.mu', 'net.mu', 'gov.mu', 'edu.mu'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.sn', 'org.sn', 'net.sn', 'gov.sn', 'edu.sn'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.ci', 'org.ci', 'net.ci', 'gov.ci', 'edu.ci'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.cm', 'org.cm', 'net.cm', 'gov.cm', 'edu.cm'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.mg', 'org.mg', 'net.mg', 'gov.mg', 'edu.mg'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.re', 'org.re', 'net.re', 'gov.re', 'edu.re'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.yt', 'org.yt', 'net.yt', 'gov.yt', 'edu.yt'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.pm', 'org.pm', 'net.pm', 'gov.pm', 'edu.pm'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.wf', 'org.wf', 'net.wf', 'gov.wf', 'edu.wf'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.tf', 'org.tf', 'net.tf', 'gov.tf', 'edu.tf'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.gp', 'org.gp', 'net.gp', 'gov.gp', 'edu.gp'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.mq', 'org.mq', 'net.mq', 'gov.mq', 'edu.mq'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.bl', 'org.bl', 'net.bl', 'gov.bl', 'edu.bl'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.mf', 'org.mf', 'net.mf', 'gov.mf', 'edu.mf'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.nc', 'org.nc', 'net.nc', 'gov.nc', 'edu.nc'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.pf', 'org.pf', 'net.pf', 'gov.pf', 'edu.pf'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.vg', 'org.vg', 'net.vg', 'gov.vg', 'edu.vg'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.vi', 'org.vi', 'net.vi', 'gov.vi', 'edu.vi'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.sx', 'org.sx', 'net.sx', 'gov.sx', 'edu.sx'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.cw', 'org.cw', 'net.cw', 'gov.cw', 'edu.cw'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.bq', 'org.bq', 'net.bq', 'gov.bq', 'edu.bq'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.aw', 'org.aw', 'net.aw', 'gov.aw', 'edu.aw'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.an', 'org.an', 'net.an', 'gov.an', 'edu.an'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.ai', 'org.ai', 'net.ai', 'gov.ai', 'edu.ai'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.ag', 'org.ag', 'net.ag', 'gov.ag', 'edu.ag'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.bs', 'org.bs', 'net.bs', 'gov.bs', 'edu.bs'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.bb', 'org.bb', 'net.bb', 'gov.bb', 'edu.bb'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.bm', 'org.bm', 'net.bm', 'gov.bm', 'edu.bm'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.ky', 'org.ky', 'net.ky', 'gov.ky', 'edu.ky'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.dm', 'org.dm', 'net.dm', 'gov.dm', 'edu.dm'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.gd', 'org.gd', 'net.gd', 'gov.gd', 'edu.gd'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.jm', 'org.jm', 'net.jm', 'gov.jm', 'edu.jm'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.ms', 'org.ms', 'net.ms', 'gov.ms', 'edu.ms'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.pr', 'org.pr', 'net.pr', 'gov.pr', 'edu.pr'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.kn', 'org.kn', 'net.kn', 'gov.kn', 'edu.kn'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.lc', 'org.lc', 'net.lc', 'gov.lc', 'edu.lc'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.vc', 'org.vc', 'net.vc', 'gov.vc', 'edu.vc'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.tt', 'org.tt', 'net.tt', 'gov.tt', 'edu.tt'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.tc', 'org.tc', 'net.tc', 'gov.tc', 'edu.tc'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.fk', 'org.fk', 'net.fk', 'gov.fk', 'edu.fk'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.gs', 'org.gs', 'net.gs', 'gov.gs', 'edu.gs'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.aq', 'org.aq', 'net.aq', 'gov.aq', 'edu.aq'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.bv', 'org.bv', 'net.bv', 'gov.bv', 'edu.bv'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.hm', 'org.hm', 'net.hm', 'gov.hm', 'edu.hm'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.sj', 'org.sj', 'net.sj', 'gov.sj', 'edu.sj'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.tf', 'org.tf', 'net.tf', 'gov.tf', 'edu.tf'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.um', 'org.um', 'net.um', 'gov.um', 'edu.um'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.wf', 'org.wf', 'net.wf', 'gov.wf', 'edu.wf'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else if (['com.yt', 'org.yt', 'net.yt', 'gov.yt', 'edu.yt'].includes(lastTwo)) {
            fullTLD = lastTwo;
        } else {
            // Single-level TLD
            fullTLD = tld;
        }
    } else {
        fullTLD = tld;
    }

    const validTLDs = [
        'com', 'in', 'org', 'net', 'edu', 'gov', 'co.in', 'ac.in', 'org.in', 'net.in', 'gov.in', 'edu.in', 'mil.in', 'nic.in',
        'info', 'io', 'ai', 'co', 'us', 'uk', 'me', 'biz', 'dev', 'app', 'tech', 'pro', 'xyz', 'id', 'ca', 'au', 'my', 'sg', 'za',
        'ph', 'pk', 'bd', 'lk', 'np', 'int', 'mil', 'museum', 'name', 'jobs', 'mobi', 'travel', 'asia', 'cat', 'coop', 'aero',
        'post', 'tel', 'tv', 'cc', 'ws', 'eu', 'ru', 'cn', 'jp', 'kr', 'br', 'mx', 'es', 'fr', 'de', 'it', 'nl', 'se', 'no',
        'fi', 'dk', 'pl', 'cz', 'sk', 'hu', 'ro', 'tr', 'gr', 'bg', 'lt', 'lv', 'ee', 'hr', 'si', 'rs', 'ua', 'by', 'kz', 'ge',
        'il', 'sa', 'ae', 'qa', 'kw', 'om', 'bh', 'eg', 'ma', 'tn', 'dz', 'ng', 'gh', 'ke', 'tz', 'ug', 'zm', 'zw', 'mu', 'sn',
        'ci', 'cm', 'mg', 're', 'yt', 'pm', 'wf', 'tf', 'gp', 'mq', 'bl', 'mf', 'nc', 'pf', 'vg', 'vi', 'sx', 'cw', 'bq', 'aw',
        'an', 'ag', 'bs', 'bb', 'bm', 'ky', 'dm', 'gd', 'jm', 'ms', 'pr', 'kn', 'lc', 'vc', 'tt', 'tc', 'fk', 'gs', 'aq', 'bv',
        'hm', 'sj', 'um', 'xxx'
    ];

    if (!fullTLD || !validTLDs.includes(fullTLD.toLowerCase())) {
        return { isValid: false, error: 'Email must end with a valid domain extension (e.g., .com, .in, .org, .net, .co.in, etc.)' };
    }

    // Check total email length
    if (email.length > 254) {
        return { isValid: false, error: 'Email address is too long' };
    }

    return { isValid: true };
};

// Password validation with enhanced security requirements
export const validatePassword = (password: string): ValidationResult => {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }

    // No leading/trailing spaces
    if (password !== password.trim()) {
        return { isValid: false, error: 'Password cannot have leading or trailing spaces' };
    }
    password = password.trim();

    // No spaces anywhere in password
    if (password.includes(' ')) {
        return { isValid: false, error: 'Password cannot contain spaces' };
    }

    if (password.length < 8) {
        return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'Password is too long (maximum 128 characters)' };
    }

    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one number' };
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

// Name validation with enhanced requirements
export const validateName = (name: string): ValidationResult => {
    if (!name) {
        return { isValid: false, error: 'Name is required' };
    }

    // No leading/trailing spaces
    if (name !== name.trim()) {
        return { isValid: false, error: 'Name cannot have leading or trailing spaces' };
    }
    name = name.trim();

    if (name.length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters long' };
    }

    if (name.length > 50) {
        return { isValid: false, error: 'Name is too long (maximum 50 characters)' };
    }

    // Check for valid characters (letters, spaces, dots, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\.\-']+$/;
    if (!nameRegex.test(name)) {
        return { isValid: false, error: 'Name can only contain letters, spaces, dots, hyphens, and apostrophes' };
    }

    // Check for consecutive spaces
    if (name.includes('  ')) {
        return { isValid: false, error: 'Name cannot contain consecutive spaces' };
    }

    return { isValid: true };
};

// Ward validation for Erumeli Panchayath (23 wards)
export const validateWard = (ward: number): ValidationResult => {
    if (!ward) {
        return { isValid: false, error: 'Ward is required' };
    }

    if (!Number.isInteger(ward) || ward < 1 || ward > 23) {
        return { isValid: false, error: 'Please select a valid ward (1-23)' };
    }

    return { isValid: true };
};

// Check if email already exists in the database
export const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
        const response = await axios.post('http://localhost:3002/api/check-email', { email });
        return response.data.exists;
    } catch (error) {
        console.error('Error checking email existence:', error);
        return false; // Assume email doesn't exist if there's an error
    }
};

// Comprehensive email validation for registration (includes existence check)
export const validateEmailForRegistration = async (email: string): Promise<ValidationResult> => {
    // First, validate email format
    const formatValidation = validateEmail(email);
    if (!formatValidation.isValid) {
        return formatValidation;
    }

    // Then check if email already exists
    const exists = await checkEmailExists(email);
    if (exists) {
        return { isValid: false, error: 'An account with this email already exists' };
    }

    return { isValid: true };
};

// Utility function to check if there are any validation errors
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
    return Object.values(errors).some(error => error !== undefined);
};

// Get field-specific error message
export const getFieldErrorMessage = (field: string, error: string): string => {
    return `${field}: ${error}`;
};
