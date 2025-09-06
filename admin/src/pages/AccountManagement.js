import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import '../styles/AccountManagement.css';
import { Button, Input, message, Table, Modal, Space, Select } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { PermissionContext } from '../components/PermissionContext';

const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

const AccountManagement = () => {
  const { hasPermission } = useContext(PermissionContext);
  const [state, setState] = useState({
    accounts: [],
    newAccount: {
      TenTK: '',
      MatKhau: '',
      MaQuyen: undefined,
      NgayTao: new Date().toISOString().split('T')[0],
      TinhTrang: '1',
    },
    editingAccount: null,
    searchTerm: '',
    isModalVisible: false,
    loading: false,
    error: null,
    quyenList: [],
  });

  const {
    accounts,
    newAccount,
    editingAccount,
    searchTerm,
    isModalVisible,
    loading,
    error,
    quyenList,
  } = state;

  const API_URL = 'http://localhost:5000/api/accounts';

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const [accountsResp, rolesResp] = await Promise.all([
        axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/api/roles/list/active', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setState(prev => ({
        ...prev,
        accounts: accountsResp.data.map(account => ({
          ...account,
          TinhTrang: account.TinhTrang === 1 ? 'Hoạt động' : 'Bị khóa',
          TinhTrangValue: account.TinhTrang,
        })),
        quyenList: rolesResp.data.data || [],
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      message.error(`Lỗi khi tải dữ liệu: ${error.response?.data?.error || error.message}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (hasPermission('Tài khoản', 'Đọc')) {
      fetchData();
    } else {
      message.error('Bạn không có quyền xem danh sách tài khoản!');
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [hasPermission]);

  const handleInputChange = (field, value) => {
    const updatedValue = field === 'MaQuyen' ? parseInt(value) : value;
    if (editingAccount) {
      setState(prev => ({
        ...prev,
        editingAccount: {
          ...prev.editingAccount,
          [field]: updatedValue,
          ...(field === 'TinhTrang' && { TinhTrangValue: parseInt(value) }),
        },
      }));
    } else {
      setState(prev => ({
        ...prev,
        newAccount: {
          ...prev.newAccount,
          [field]: updatedValue,
        },
      }));
    }
  };

  const validateAccountData = (accountData) => {
    if (!accountData.TenTK || !accountData.MatKhau || !accountData.MaQuyen) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Tên TK, Mật khẩu, Quyền)!');
      return false;
    }
    return true;
  };

  const handleAddAccount = async () => {
    if (!hasPermission('Tài khoản', 'Thêm')) {
      message.error('Bạn không có quyền thêm tài khoản!');
      return;
    }
    if (!validateAccountData(newAccount)) return;

    const payload = {
      TenTK: newAccount.TenTK,
      MatKhau: newAccount.MatKhau,
      MaQuyen: newAccount.MaQuyen,
      NgayTao: newAccount.NgayTao,
      TinhTrang: parseInt(newAccount.TinhTrang),
    };
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
      setState(prev => ({
        ...prev,
        newAccount: {
          TenTK: '',
          MatKhau: '',
          MaQuyen: undefined,
          NgayTao: new Date().toISOString().split('T')[0],
          TinhTrang: '1',
        },
        isModalVisible: false,
      }));
      message.success('Thêm tài khoản thành công!');
    } catch (error) {
      message.error(`Lỗi khi thêm tài khoản: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdateAccount = async () => {
    if (!hasPermission('Tài khoản', 'Sửa')) {
      message.error('Bạn không có quyền sửa tài khoản!');
      return;
    }
    if (!validateAccountData(editingAccount)) return;

    const payload = {
      TenTK: editingAccount.TenTK,
      MatKhau: editingAccount.MatKhau,
      MaQuyen: editingAccount.MaQuyen,
      TinhTrang: parseInt(editingAccount.TinhTrang),
    };
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`${API_URL}/${editingAccount.MaTK}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
      setState(prev => ({
        ...prev,
        editingAccount: null,
        isModalVisible: false,
      }));
      message.success('Cập nhật tài khoản thành công!');
    } catch (error) {
      message.error(`Lỗi khi cập nhật tài khoản: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteAccount = (MaTK) => {
    if (!hasPermission('Tài khoản', 'Xóa')) {
      message.error('Bạn không có quyền xóa tài khoản!');
      return;
    }
    confirm({
      title: 'Bạn có chắc muốn xóa tài khoản này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này sẽ không thể hoàn tác',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Thoát',
      async onOk() {
        try {
          const token = localStorage.getItem('authToken');
          await axios.delete(`${API_URL}/${MaTK}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchData();
          message.success('Xóa tài khoản thành công!');
        } catch (error) {
          message.error(`Lỗi khi xóa tài khoản: ${error.response?.data?.error || error.message}`);
        }
      },
    });
  };

  const handleToggleStatus = (account) => {
    if (!hasPermission('Tài khoản', 'Sửa')) {
      message.error('Bạn không có quyền thay đổi trạng thái tài khoản!');
      return;
    }
    confirm({
      title: `Bạn có muốn ${account.TinhTrang === 'Hoạt động' ? 'tạm ẩn' : 'kích hoạt'} tài khoản này?`,
      icon: <ExclamationCircleFilled />,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      async onOk() {
        try {
          const token = localStorage.getItem('authToken');
          const newStatus = account.TinhTrangValue === 1 ? 0 : 1;
          await axios.put(`${API_URL}/${account.MaTK}`, { TinhTrang: newStatus }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchData();
          message.success(`Đã ${newStatus === 1 ? 'kích hoạt' : 'tạm ẩn'} tài khoản!`);
        } catch (error) {
          message.error(`Lỗi khi đổi trạng thái: ${error.response?.data?.error || error.message}`);
        }
      },
    });
  };

  const filteredAccounts = accounts.filter(
    account =>
      account.TenTK.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.MaTK.toString().includes(searchTerm)
  );

  const columns = [
    { title: 'Mã TK', dataIndex: 'MaTK', key: 'MaTK', width: 100, fixed: 'left' },
    { title: 'Tên tài khoản', dataIndex: 'TenTK', key: 'TenTK', width: 200 },
    {
      title: 'Quyền',
      dataIndex: 'MaQuyen',
      key: 'MaQuyen',
      width: 120,
      render: (value) => quyenList.find(q => q.MaNQ === value)?.TenNQ || 'Chưa xác định',
    },
    { title: 'Ngày tạo', dataIndex: 'NgayTao', key: 'NgayTao', width: 120 },
    {
      title: 'Trạng thái',
      dataIndex: 'TinhTrang',
      key: 'TinhTrang',
      width: 120,
      render: (status) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            status === 'Hoạt động' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {hasPermission('Tài khoản', 'Sửa') && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setState(prev => ({
                  ...prev,
                  editingAccount: { ...record, TinhTrang: record.TinhTrangValue.toString() },
                  isModalVisible: true,
                }));
              }}
            />
          )}
          {hasPermission('Tài khoản', 'Sửa') && (
            <Button
              size="small"
              icon={record.TinhTrang === 'Hoạt động' ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleToggleStatus(record)}
            />
          )}
          {hasPermission('Tài khoản', 'Xóa') && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteAccount(record.MaTK)}
            />
          )}
        </Space>
      ),
      fixed: 'right',
      width: 120,
    },
  ];

  if (!hasPermission('Tài khoản', 'Đọc')) {
    return <div>Bạn không có quyền truy cập trang này!</div>;
  }

  return (
    <div className="account-management-container">
      <div className="header-section">
        <h1 className="page-title">Quản lý Tài khoản</h1>
        <div className="search-box">
          <Search
            placeholder="Tìm tài khoản..."
            allowClear
            enterButton
            size="small"
            value={searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
          />
        </div>
        {hasPermission('Tài khoản', 'Thêm') && (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setState(prev => ({
                ...prev,
                editingAccount: null,
                newAccount: {
                  TenTK: '',
                  MatKhau: '',
                  MaQuyen: undefined,
                  NgayTao: new Date().toISOString().split('T')[0],
                  TinhTrang: '1',
                },
                isModalVisible: true,
              }));
            }}
          >
            Thêm tài khoản
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={filteredAccounts}
        rowKey="MaTK"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 10, showSizeChanger: false, size: 'small' }}
        size="small"
        className="compact-account-table"
        style={{ fontSize: '13px' }}
        locale={{
          emptyText: 'Không tìm thấy tài khoản',
        }}
      />

      <Modal
        title={editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
        open={isModalVisible}
        onCancel={() => setState(prev => ({ ...prev, isModalVisible: false, editingAccount: null }))}
        footer={[
          <Button
            key="cancel"
            onClick={() => setState(prev => ({ ...prev, isModalVisible: false, editingAccount: null }))}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={editingAccount ? handleUpdateAccount : handleAddAccount}
          >
            {editingAccount ? 'Lưu' : 'Thêm'}
          </Button>,
        ]}
        width={600}
        bodyStyle={{ padding: '16px' }}
      >
        <div className="info-section">
          <div className="info-grid">
            {editingAccount && (
              <div className="info-item">
                <p className="info-label">Mã tài khoản:</p>
                <Input size="small" value={editingAccount.MaTK} disabled />
              </div>
            )}
            <div className="info-item">
              <p className="info-label">Tên tài khoản <span style={{ color: 'red' }}>*</span></p>
              <Input
                size="small"
                value={editingAccount ? editingAccount.TenTK : newAccount.TenTK}
                onChange={(e) => handleInputChange('TenTK', e.target.value)}
                required
              />
            </div>
            <div className="info-item">
              <p className="info-label">Mật khẩu <span style={{ color: 'red' }}>*</span></p>
              <Input.Password
                size="small"
                value={editingAccount ? editingAccount.MatKhau : newAccount.MatKhau}
                onChange={(e) => handleInputChange('MatKhau', e.target.value)}
                required
              />
            </div>
            <div className="info-item">
              <p className="info-label">Quyền <span style={{ color: 'red' }}>*</span></p>
              <Select
                size="small"
                value={editingAccount ? editingAccount.MaQuyen : newAccount.MaQuyen}
                onChange={(value) => handleInputChange('MaQuyen', value)}
                style={{ width: '100%' }}
              >
                {quyenList.map(quyen => (
                  <Option key={quyen.MaNQ} value={quyen.MaNQ}>
                    {quyen.TenNQ}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="info-item">
              <p className="info-label">Ngày tạo:</p>
              <Input
                size="small"
                type="date"
                value={editingAccount ? editingAccount.NgayTao : newAccount.NgayTao}
                onChange={(e) => handleInputChange('NgayTao', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Trạng thái <span style={{ color: 'red' }}>*</span></p>
              <Select
                size="small"
                value={editingAccount ? editingAccount.TinhTrang : newAccount.TinhTrang}
                onChange={(value) => handleInputChange('TinhTrang', value)}
                style={{ width: '100%' }}
              >
                <Option value="1">Hoạt động</Option>
                <Option value="0">Bị khóa</Option>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

  
    </div>
  );
};

export default AccountManagement;