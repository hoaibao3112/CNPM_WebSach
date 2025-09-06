import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space, Select } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled, LockOutlined, UnlockOutlined } from '@ant-design/icons';

const { Search } = Input;
const { confirm } = Modal;
const { Option } = Select;

const UserManagement = () => {
  const [state, setState] = useState({
    users: [],
    newUser: {
      MaNV: '',
      TenNV: '',
      SDT: '',
      GioiTinh: '',
      DiaChi: '',
      Email: '',
      TinhTrang: 'Active',
    },
    editingUser: null,
    searchTerm: '',
    isModalVisible: false,
    loading: false,
    error: null,
  });

  const { users, newUser, editingUser, searchTerm, isModalVisible, loading } = state;
  const API_URL = 'http://localhost:5000/api/users';

  const fetchUsers = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await axios.get(API_URL);
      
      if (Array.isArray(response.data)) {
        setState(prev => ({ ...prev, users: response.data }));
      } else {
        throw new Error('Dữ liệu người dùng không hợp lệ');
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      message.error(`Lỗi khi tải dữ liệu: ${error.message}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (field, value) => {
    if (editingUser) {
      setState(prev => ({
        ...prev,
        editingUser: {
          ...prev.editingUser,
          [field]: value,
        },
      }));
    } else {
      setState(prev => ({
        ...prev,
        newUser: {
          ...prev.newUser,
          [field]: value,
        },
      }));
    }
  };

  const validateUserData = (userData) => {
    if (!userData.MaNV || !userData.TenNV || !userData.SDT || !userData.Email) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Mã NV, Tên NV, SĐT, Email)!');
      return false;
    }
    if (!/^\d{10,11}$/.test(userData.SDT)) {
      message.error('Số điện thoại phải có 10 hoặc 11 chữ số!');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.Email)) {
      message.error('Email không hợp lệ!');
      return false;
    }
    return true;
  };

  const handleAddUser = async () => {
    if (!validateUserData(newUser)) return;

    try {
      await axios.post(API_URL, newUser);
      await fetchUsers();
      setState(prev => ({
        ...prev,
        newUser: {
          MaNV: '',
          TenNV: '',
          SDT: '',
          GioiTinh: '',
          DiaChi: '',
          Email: '',
          TinhTrang: 'Active',
        },
        isModalVisible: false,
      }));
      message.success('Thêm người dùng thành công!');
    } catch (error) {
      message.error(`Lỗi khi thêm người dùng: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdateUser = async () => {
    if (!validateUserData(editingUser)) return;

    try {
      await axios.put(`${API_URL}/${editingUser.MaNV}`, editingUser);
      await fetchUsers();
      setState(prev => ({
        ...prev,
        editingUser: null,
        isModalVisible: false,
      }));
      message.success('Cập nhật người dùng thành công!');
    } catch (error) {
      message.error(`Lỗi khi cập nhật người dùng: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteUser = (MaNV) => {
    confirm({
      title: 'Bạn có chắc muốn xóa người dùng này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này sẽ không thể hoàn tác',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Thoát',
      async onOk() {
        try {
          await axios.delete(`${API_URL}/${MaNV}`);
          await fetchUsers();
          message.success('Xóa người dùng thành công!');
        } catch (error) {
          message.error(`Lỗi khi xóa người dùng: ${error.message}`);
        }
      },
    });
  };

  const handleToggleStatus = (user) => {
    confirm({
      title: `Bạn có muốn ${user.TinhTrang === 'Active' ? 'tạm ẩn' : 'kích hoạt'} người dùng này?`,
      icon: <ExclamationCircleFilled />,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      async onOk() {
        try {
          await axios.put(`${API_URL}/${user.MaNV}`, {
            ...user,
            TinhTrang: user.TinhTrang === 'Active' ? 'Inactive' : 'Active',
          });
          await fetchUsers();
          message.success('Đổi trạng thái thành công!');
        } catch (error) {
          message.error(`Lỗi khi đổi trạng thái: ${error.message}`);
        }
      },
    });
  };

  const filteredUsers = users.filter(
    user =>
      (user.MaNV || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.TenNV || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.SDT || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.Email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'MaNV',
      key: 'MaNV',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Tên NV',
      dataIndex: 'TenNV',
      key: 'TenNV',
      width: 200,
    },
    {
      title: 'SĐT',
      dataIndex: 'SDT',
      key: 'SDT',
      width: 120,
    },
    {
      title: 'Giới tính',
      dataIndex: 'GioiTinh',
      key: 'GioiTinh',
      width: 100,
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'Email',
      width: 200,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TinhTrang',
      key: 'TinhTrang',
      width: 120,
      render: (status) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setState(prev => ({
                ...prev,
                editingUser: record,
                isModalVisible: true,
              }));
            }}
          />
          <Button
            size="small"
            icon={record.TinhTrang === 'Active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record.MaNV)}
          />
        </Space>
      ),
      fixed: 'right',
      width: 120,
    },
  ];

  return (
    <div className="user-management-container">
      <div className="header-section">
        <h1 className="page-title">Quản lý Người dùng</h1>
        <div className="search-box">
          <Search
            placeholder="Tìm người dùng..."
            allowClear
            enterButton
            size="small"
            value={searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
          />
        </div>
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setState(prev => ({
              ...prev,
              editingUser: null,
              newUser: {
                MaNV: '',
                TenNV: '',
                SDT: '',
                GioiTinh: '',
                DiaChi: '',
                Email: '',
                TinhTrang: 'Active',
              },
              isModalVisible: true,
            }));
          }}
        >
          Thêm người dùng
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="MaNV"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          size: 'small',
        }}
        size="small"
        className="compact-user-table"
        style={{ fontSize: '13px' }}
      />

      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        visible={isModalVisible}
        onCancel={() => {
          setState(prev => ({
            ...prev,
            isModalVisible: false,
            editingUser: null,
          }));
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setState(prev => ({
                ...prev,
                isModalVisible: false,
                editingUser: null,
              }));
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={editingUser ? handleUpdateUser : handleAddUser}
          >
            {editingUser ? 'Lưu' : 'Thêm'}
          </Button>,
        ]}
        width={600}
        bodyStyle={{ padding: '16px' }}
      >
        <div className="info-section">
          <div className="info-grid">
            <div className="info-item">
              <p className="info-label">Mã nhân viên:</p>
              <Input
                size="small"
                value={editingUser ? editingUser.MaNV : newUser.MaNV}
                onChange={(e) => handleInputChange('MaNV', e.target.value)}
                disabled={!!editingUser}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Tên nhân viên:</p>
              <Input
                size="small"
                value={editingUser ? editingUser.TenNV : newUser.TenNV}
                onChange={(e) => handleInputChange('TenNV', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Số điện thoại:</p>
              <Input
                size="small"
                value={editingUser ? editingUser.SDT : newUser.SDT}
                onChange={(e) => handleInputChange('SDT', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Giới tính:</p>
              <Select
                size="small"
                value={editingUser ? editingUser.GioiTinh : newUser.GioiTinh}
                onChange={(value) => handleInputChange('GioiTinh', value)}
                style={{ width: '100%' }}
              >
                <Option value="">Chọn giới tính</Option>
                <Option value="Male">Nam</Option>
                <Option value="Female">Nữ</Option>
                <Option value="Other">Khác</Option>
              </Select>
            </div>
            <div className="info-item">
              <p className="info-label">Địa chỉ:</p>
              <Input
                size="small"
                value={editingUser ? editingUser.DiaChi : newUser.DiaChi}
                onChange={(e) => handleInputChange('DiaChi', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Email:</p>
              <Input
                size="small"
                type="email"
                value={editingUser ? editingUser.Email : newUser.Email}
                onChange={(e) => handleInputChange('Email', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Tình trạng:</p>
              <Select
                size="small"
                value={editingUser ? editingUser.TinhTrang : newUser.TinhTrang}
                onChange={(value) => handleInputChange('TinhTrang', value)}
                style={{ width: '100%' }}
              >
                <Option value="Active">Hoạt động</Option>
                <Option value="Inactive">Không hoạt động</Option>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .user-management-container {
          padding: 16px 16px 16px 216px;
          min-height: 100vh;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .page-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        .search-box {
          width: 250px;
        }
        .info-section {
          background: #f8f8f8;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .info-item {
          margin-bottom: 4px;
        }
        .info-label {
          color: #666;
          font-size: 12px;
          margin: 0;
        }
        .compact-user-table :global(.ant-table-thead > tr > th) {
          padding: 8px 12px;
        }
        .compact-user-table :global(.ant-table-tbody > tr > td) {
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
};

export default UserManagement;