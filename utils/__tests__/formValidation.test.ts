import { 
    validateEmail, 
    validatePassword, 
    validateConfirmPassword, 
    validateName, 
    validatePanchayath, 
    validateWard 
} from '../formValidation';

describe('Form Validation Tests', () => {
    describe('validateEmail', () => {
        test('should validate correct email addresses', () => {
            const validEmails = [
                'test@example.com',
                'user.name@domain.co.uk',
                'user+tag@example.org',
                'user123@test-domain.com',
                'a@b.co'
            ];

            validEmails.forEach(email => {
                const result = validateEmail(email);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeUndefined();
            });
        });

        test('should reject invalid email addresses', () => {
            const invalidEmails = [
                '',
                'invalid-email',
                '@domain.com',
                'user@',
                'user@domain',
                'user..name@domain.com',
                'user@domain..com',
                'user@.domain.com',
                'user@domain.com.',
                'user@-domain.com',
                'user@domain-.com',
                'a'.repeat(65) + '@domain.com', // Local part too long
                'user@' + 'a'.repeat(250) + '.com' // Total too long
            ];

            invalidEmails.forEach(email => {
                const result = validateEmail(email);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });

    describe('validatePassword', () => {
        test('should validate strong passwords', () => {
            const validPasswords = [
                'password123',
                'myPass1',
                'StrongP4ss',
                'test123456'
            ];

            validPasswords.forEach(password => {
                const result = validatePassword(password);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeUndefined();
            });
        });

        test('should reject weak passwords', () => {
            const invalidPasswords = [
                '',
                '12345', // Too short
                'password', // No numbers
                '123456', // No letters
                'a'.repeat(129) // Too long
            ];

            invalidPasswords.forEach(password => {
                const result = validatePassword(password);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });

    describe('validateConfirmPassword', () => {
        test('should validate matching passwords', () => {
            const result = validateConfirmPassword('password123', 'password123');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        test('should reject non-matching passwords', () => {
            const result = validateConfirmPassword('password123', 'different123');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Passwords do not match');
        });

        test('should reject empty confirm password', () => {
            const result = validateConfirmPassword('password123', '');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Please confirm your password');
        });
    });

    describe('validateName', () => {
        test('should validate correct names', () => {
            const validNames = [
                'John Doe',
                'Mary Jane',
                "O'Connor",
                'Jean-Pierre',
                'A B',
                'SingleName'
            ];

            validNames.forEach(name => {
                const result = validateName(name);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeUndefined();
            });
        });

        test('should reject invalid names', () => {
            const invalidNames = [
                '',
                'A', // Too short
                'John123', // Contains numbers
                'John@Doe', // Contains special characters
                'a'.repeat(101), // Too long
                '   ', // Only spaces
                '123' // Only numbers
            ];

            invalidNames.forEach(name => {
                const result = validateName(name);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });

    describe('validatePanchayath', () => {
        test('should validate selected panchayath', () => {
            const result = validatePanchayath('Some Panchayath');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        test('should reject empty panchayath', () => {
            const result = validatePanchayath('');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Please select a Panchayath/Municipality');
        });
    });

    describe('validateWard', () => {
        test('should validate correct ward selection', () => {
            const availableWards = [1, 2, 3, 4, 5];
            const result = validateWard(3, availableWards);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        test('should reject invalid ward selection', () => {
            const availableWards = [1, 2, 3, 4, 5];
            const result = validateWard(10, availableWards);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Please select a valid ward for the selected Panchayath');
        });

        test('should reject empty ward', () => {
            const availableWards = [1, 2, 3, 4, 5];
            const result = validateWard(0, availableWards);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Please select a ward');
        });
    });
});
