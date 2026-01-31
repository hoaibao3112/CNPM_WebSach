/**
 * LocalStorage utility functions for managing user data
 */

// User management
export const getUser = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return null;
    }
};

export const setUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
};

export const removeUser = () => {
    localStorage.removeItem('user');
};

// Token management
export const getToken = () => {
    return localStorage.getItem('token');
};

export const setToken = (token) => {
    localStorage.setItem('token', token);
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

// Customer ID management
export const getCustomerId = () => {
    return localStorage.getItem('customerId');
};

export const setCustomerId = (customerId) => {
    localStorage.setItem('customerId', customerId);
};

export const removeCustomerId = () => {
    localStorage.removeItem('customerId');
};

// Clear all auth data
export const clearAuth = () => {
    removeUser();
    removeToken();
    removeCustomerId();
};

// Cart management (optional - might use Context instead)
export const getCart = () => {
    try {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        return [];
    }
};

export const setCart = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

export const clearCart = () => {
    localStorage.removeItem('cart');
};
