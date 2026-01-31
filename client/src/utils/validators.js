/**
 * Validation utility functions
 */

// Validate email
export const validateEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate Vietnamese phone number
export const validatePhone = (phone) => {
    if (!phone) return false;
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Vietnamese phone numbers: 10 digits starting with 0
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(cleaned);
};

// Validate password strength
export const validatePassword = (password) => {
    if (!password) return false;

    // At least 6 characters
    if (password.length < 6) return false;

    return true;
};

// Validate password match
export const validatePasswordMatch = (password, confirmPassword) => {
    return password === confirmPassword;
};

// Validate required field
export const validateRequired = (value) => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value !== null && value !== undefined && value !== '';
};

// Validate number
export const validateNumber = (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
};

// Validate positive number
export const validatePositiveNumber = (value) => {
    return validateNumber(value) && parseFloat(value) > 0;
};

// Validate integer
export const validateInteger = (value) => {
    return Number.isInteger(Number(value));
};

// Validate min length
export const validateMinLength = (value, minLength) => {
    if (typeof value !== 'string') return false;
    return value.length >= minLength;
};

// Validate max length
export const validateMaxLength = (value, maxLength) => {
    if (typeof value !== 'string') return false;
    return value.length <= maxLength;
};
