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

  // Normalize strings: remove diacritics, lowercase, trim
  const normalize = (s) => {
    if (!s && s !== '') return '';
    try {
      return String(s)
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
    } catch (e) {
      // fallback for older environments without Unicode property escapes
      return String(s)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    }
  };

  const hasPermission = (permissionKeyOrFunctionName, action = null) => {
    // New check style: hasPermission('PRODUCT_READ')
    if (!action) {
      const result = permissions.some((perm) => perm.Key === permissionKeyOrFunctionName);
      console.log(`Checking permission (Key): ${permissionKeyOrFunctionName} => ${result}`);
      return result;
    }

    // Legacy check style: hasPermission('Sản phẩm', 'Xem')
    const fnNorm = normalize(permissionKeyOrFunctionName);
    const actNorm = normalize(action);

    const result = permissions.some((perm) => {
      const ten = normalize(perm.TenCN);
      const hanh = normalize(perm.HanhDong);
      return ten === fnNorm && hanh === actNorm;
    });

    console.log(`Checking permission (Legacy): ${permissionKeyOrFunctionName} - ${action} => ${result}`);
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