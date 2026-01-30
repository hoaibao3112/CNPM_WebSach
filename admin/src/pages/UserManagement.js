import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Button, Input, message, Table, Modal, Space, Select } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled, LockOutlined, UnlockOutlined } from '@ant-design/icons';

// const { Search } = Input; // Unused for now
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
    statusFilter: '',
    genderFilter: '',
    isModalVisible: false,
    loading: false,
    error: null,
  });

  const { users, newUser, editingUser, searchTerm, statusFilter, genderFilter, isModalVisible, loading } = state;
  const API_URL = '/users';

  const fetchUsers = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await api.get(API_URL);

      const resData = response.data.data || response.data;
      const usersData = Array.isArray(resData) ? resData : (resData?.data || []);

      if (Array.isArray(usersData)) {
        setState(prev => ({ ...prev, users: usersData }));
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
      await api.post(API_URL, newUser);
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
      await api.put(`${API_URL}/${editingUser.MaNV}`, editingUser);
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
          await api.delete(`${API_URL}/${MaNV}`);
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
          await api.put(`${API_URL}/${user.MaNV}`, {
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
      (statusFilter === '' || user.TinhTrang === statusFilter) &&
      (genderFilter === '' || user.GioiTinh === genderFilter) &&
      ((user.MaNV || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.TenNV || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.SDT || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.Email || '').toLowerCase().includes(searchTerm.toLowerCase()))
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
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
    <div className="thongke-page">
      <div className="thongke-header">
        <h1>
          <i className="fas fa-user-friends"></i> Quản lý Người dùng
        </h1>
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

      <div className="thongke-content">
        <div className="thongke-filters">
          <div className="filter-group">
            <label>Tìm kiếm:</label>
            <Input
              placeholder="Tìm người dùng..."
              value={searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              style={{ width: 200, marginRight: 16 }}
            />
          </div>
          <div className="filter-group">
            <label>Trạng thái:</label>
            <Select value={statusFilter} onChange={(value) => setState(prev => ({ ...prev, statusFilter: value }))} style={{ width: 120, marginRight: 8 }}>
              <Select.Option value="">Tất cả</Select.Option>
              <Select.Option value="Active">Hoạt động</Select.Option>
              <Select.Option value="Inactive">Không hoạt động</Select.Option>
            </Select>
          </div>
          <div className="filter-group">
            <label>Giới tính:</label>
            <Select value={genderFilter} onChange={(value) => setState(prev => ({ ...prev, genderFilter: value }))} style={{ width: 120 }}>
              <Select.Option value="">Tất cả</Select.Option>
              <Select.Option value="Nam">Nam</Select.Option>
              <Select.Option value="Nữ">Nữ</Select.Option>
              <Select.Option value="Khác">Khác</Select.Option>
            </Select>
          </div>
        </div>

        <div className="thongke-table">
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
          />
        </div>
      </div>

      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        open={isModalVisible}
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
        styles={{ body: { padding: '16px' } }}
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
                <Option value="Nam">Nam</Option>
                <Option value="Nữ">Nữ</Option>
                <Option value="Khác">Khác</Option>
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

      <style>{`
        .thongke-page {
          min-height: 100vh;
        }
        .thongke-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .thongke-content {
          background: #fff;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .thongke-filters {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .thongke-table {
          margin-top: 16px;
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
      `}</style>
    </div>
  );
};

export default UserManagement;