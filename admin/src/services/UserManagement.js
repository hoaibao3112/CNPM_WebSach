import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/accounts');
        setUsers(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Quản lý người dùng</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Mã TK</th>
            <th className="border border-gray-300 p-2">Tên tài khoản</th>
            <th className="border border-gray-300 p-2">Quyền</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.MaTK}>
              <td className="border border-gray-300 p-2">{user.MaTK}</td>
              <td className="border border-gray-300 p-2">{user.TenTK}</td>
              <td className="border border-gray-300 p-2">{user.MaQuyen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;