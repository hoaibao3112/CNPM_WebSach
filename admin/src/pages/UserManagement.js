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
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="material-icons text-indigo-500">badge</span>
            Quản lý Nhân viên
          </h1>
          <p className="text-slate-400 text-sm mt-1">Danh sách và thông tin nhân viên hệ thống</p>
        </div>
        <Button
          type="primary"
          icon={<span className="material-icons text-sm">person_add</span>}
          onClick={() => {
            setState(prev => ({
              ...prev,
              editingUser: null,
              newUser: {
                MaNV: '', TenNV: '', SDT: '', GioiTinh: '', DiaChi: '', Email: '', TinhTrang: 'Active',
              },
              isModalVisible: true,
            }));
          }}
          className="h-12 px-6 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center gap-2 border-none font-bold self-start md:self-center"
        >
          Thêm nhân viên
        </Button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 transition-all duration-300">
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Tìm kiếm</label>
            <Input
              placeholder="Mã, tên, SĐT hoặc email..."
              value={searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              prefix={<span className="material-icons text-slate-400 text-sm">search</span>}
              className="rounded-xl h-12 border-slate-200"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Trạng thái</label>
              <Select 
                value={statusFilter} 
                onChange={(value) => setState(prev => ({ ...prev, statusFilter: value }))} 
                className="w-full h-12 modern-select"
              >
                <Select.Option value="">Tất cả trạng thái</Select.Option>
                <Select.Option value="Active">Hoạt động</Select.Option>
                <Select.Option value="Inactive">Không hoạt động</Select.Option>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Giới tính</label>
              <Select 
                value={genderFilter} 
                onChange={(value) => setState(prev => ({ ...prev, genderFilter: value }))} 
                className="w-full h-12 modern-select"
              >
                <Select.Option value="">Tất cả giới tính</Select.Option>
                <Select.Option value="Nam">Nam</Select.Option>
                <Select.Option value="Nữ">Nữ</Select.Option>
                <Select.Option value="Khác">Khác</Select.Option>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="MaNV"
            loading={loading}
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              className: 'px-6 py-4'
            }}
            className="modern-table"
          />
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3 text-xl font-black text-slate-800">
            <div className={`p-2 rounded-lg bg-indigo-50 text-indigo-600`}>
              <span className="material-icons leading-none">
                {editingUser ? 'edit' : 'person_add'}
              </span>
            </div>
            {editingUser ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setState(prev => ({ ...prev, isModalVisible: false, editingUser: null }));
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => setState(prev => ({ ...prev, isModalVisible: false, editingUser: null }))}
            className="h-12 px-8 rounded-xl font-bold border-slate-200"
          >
            Hủy bỏ
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={editingUser ? handleUpdateUser : handleAddUser}
            className="h-12 px-10 rounded-xl font-bold bg-indigo-600 border-none shadow-lg shadow-indigo-200"
          >
            {editingUser ? 'Lưu thay đổi' : 'Tạo mới'}
          </Button>,
        ]}
        width={700}
        centered
        className="modern-modal"
      >
        <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mã nhân viên <span className="text-red-500">*</span></label>
            <Input
              placeholder="Ví dụ: NV001"
              value={editingUser ? editingUser.MaNV : newUser.MaNV}
              onChange={(e) => handleInputChange('MaNV', e.target.value)}
              disabled={!!editingUser}
              className="h-12 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tên nhân viên <span className="text-red-500">*</span></label>
            <Input
              placeholder="Nhập họ và tên..."
              value={editingUser ? editingUser.TenNV : newUser.TenNV}
              onChange={(e) => handleInputChange('TenNV', e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Số điện thoại <span className="text-red-500">*</span></label>
            <Input
              placeholder="Nhập số điện thoại..."
              value={editingUser ? editingUser.SDT : newUser.SDT}
              onChange={(e) => handleInputChange('SDT', e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Giới tính</label>
            <Select
              value={editingUser ? editingUser.GioiTinh : newUser.GioiTinh}
              onChange={(value) => handleInputChange('GioiTinh', value)}
              className="w-full h-12"
            >
              <Option value="">Chọn giới tính</Option>
              <Option value="Nam">Nam</Option>
              <Option value="Nữ">Nữ</Option>
              <Option value="Khác">Khác</Option>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Địa chỉ</label>
            <Input
              placeholder="Nhập địa chỉ cư trú..."
              value={editingUser ? editingUser.DiaChi : newUser.DiaChi}
              onChange={(e) => handleInputChange('DiaChi', e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email <span className="text-red-500">*</span></label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={editingUser ? editingUser.Email : newUser.Email}
              onChange={(e) => handleInputChange('Email', e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tình trạng</label>
            <Select
              value={editingUser ? editingUser.TinhTrang : newUser.TinhTrang}
              onChange={(value) => handleInputChange('TinhTrang', value)}
              className="w-full h-12"
            >
              <Option value="Active">Hoạt động</Option>
              <Option value="Inactive">Tạm khóa</Option>
            </Select>
          </div>
        </div>
      </Modal>

      <style>{`
        .modern-table .ant-table-thead > tr > th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f1f5f9;
        }
        .modern-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
          padding: 16px;
        }
        .modern-table .ant-table-tbody > tr:hover > td {
          background: #f1f5f9 !important;
        }
        .modern-modal .ant-modal-content {
          border-radius: 24px !important;
          padding: 12px !important;
        }
        .modern-select .ant-select-selector {
          border-radius: 12px !important;
          height: 48px !important;
          display: flex !important;
          align-items: center !important;
          border-color: #e2e8f0 !important;
        }
      `}</style>
    </div>
  );
};

export default UserManagement;