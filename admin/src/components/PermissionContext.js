import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No authToken found');
        setPermissions([]);
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/roles/user/permissions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        console.log('Permissions fetched:', response.data.data);
        setPermissions(response.data.data);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error.response?.data || error.message);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchPermissions();
  // eslint-disable-next-line
}, []);

  const hasPermission = (functionName, action) => {
    const result = permissions.some(
      (perm) => perm.TenCN === functionName && perm.HanhDong === action
    );
    console.log(`Checking permission: ${functionName} - ${action} => ${result}`, 'Permissions:', permissions);
    return result;
  };

  const refreshPermissions = async () => {
    setLoading(true);
    await fetchPermissions();
  };

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <PermissionContext.Provider
      value={{ permissions, setPermissions, hasPermission, loading, refreshPermissions }}
    >
      {children}
    </PermissionContext.Provider>
  );
};