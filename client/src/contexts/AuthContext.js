import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUser, setUser as saveUser, getToken, setToken as saveToken, getCustomerId, setCustomerId as saveCustomerId, clearAuth } from '../utils/storage';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [customerId, setCustomerId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user data from localStorage on mount
    useEffect(() => {
        const storedUser = getUser();
        const storedToken = getToken();
        const storedCustomerId = getCustomerId();

        if (storedUser && storedToken) {
            setUser(storedUser);
            setToken(storedToken);
            setCustomerId(storedCustomerId);
        }
        setLoading(false);
    }, []);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        setCustomerId(userData.makh || userData.MaKH);

        saveUser(userData);
        saveToken(authToken);
        saveCustomerId(userData.makh || userData.MaKH);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setCustomerId(null);
        clearAuth();
    };

    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
        saveUser(updatedUserData);
    };

    const isAuthenticated = () => {
        return !!(user && token);
    };

    const value = {
        user,
        token,
        customerId,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
