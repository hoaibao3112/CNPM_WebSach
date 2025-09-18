import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import '../styles/AccountManagement.css';
import { Button, Input, message, Table, Modal, Space, Select, Tabs, Form } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  LockOutlined,
  UnlockOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PermissionContext } from '../components/PermissionContext';

const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;
const { TabPane } = Tabs;

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
    permissions: [], // Danh sách quyền của nhóm quyền hiện tại
    features: [], // Danh sách chức năng (cho việc thêm quyền)
    newPermission: { MaCN: undefined, HanhDong: '', TinhTrang: '1' }, // Form thêm quyền mới
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
    permissions,
    features,
    newPermission,
  } = state;

  const API_URL = 'http://localhost:5000/api/accounts';
  const PERMISSION_API = 'http://localhost:5000/api/permissions';

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const [accountsResp, rolesResp, featuresResp] = await Promise.all([
        axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/roles/list/active', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${PERMISSION_API}/features`, { headers: { Authorization: `Bearer ${token}` } }), // Lấy danh sách chức năng
      ]);

      setState(prev => ({
        ...prev,
        accounts: accountsResp.data.map(account => {
          const tinhTrangValue = Number(account.TinhTrang);
          return {
            ...account,
            TinhTrang: tinhTrangValue === 1 ? 'Hoạt động' : 'Bị khóa',
            TinhTrangValue: tinhTrangValue,
          };
        }),
        quyenList: rolesResp.data.data || [],
        features: featuresResp.data || [],
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

  // Fetch quyền khi mở modal edit
  const fetchPermissions = async (maQuyen) => {
    try {
      const token = localStorage.getItem('authToken');
      const resp = await axios.get(`${PERMISSION_API}/roles/${maQuyen}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setState(prev => ({ ...prev, permissions: resp.data }));
    } catch (error) {
      message.error(`Lỗi khi tải quyền: ${error.response?.data?.error || error.message}`);
    }
  };

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

  // Thêm quyền mới cho nhóm quyền
  const handleAddPermission = async () => {
    if (!hasPermission('Phân quyền', 'Thêm')) {
      message.error('Bạn không có quyền thêm quyền!');
      return;
    }
    if (!newPermission.MaCN || !newPermission.HanhDong) {
      message.error('Vui lòng nhập đầy đủ chức năng và hành động!');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(PERMISSION_API, {
        MaQuyen: editingAccount.MaQuyen,
        MaCN: newPermission.MaCN,
        HanhDong: newPermission.HanhDong,
        TinhTrang: parseInt(newPermission.TinhTrang),
      }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchPermissions(editingAccount.MaQuyen);
      setState(prev => ({ ...prev, newPermission: { MaCN: undefined, HanhDong: '', TinhTrang: '1' } }));
      message.success('Thêm quyền thành công!');
    } catch (error) {
      message.error(`Lỗi khi thêm quyền: ${error.response?.data?.error || error.message}`);
    }
  };

  // Xóa quyền
  const handleDeletePermission = (maCTQ) => {
    if (!hasPermission('Phân quyền', 'Xóa')) {
      message.error('Bạn không có quyền xóa quyền!');
      return;
    }
    confirm({
      title: 'Bạn có chắc muốn xóa quyền này?',
      icon: <ExclamationCircleFilled />,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      async onOk() {
        try {
          const token = localStorage.getItem('authToken');
          await axios.delete(`${PERMISSION_API}/${maCTQ}`, { headers: { Authorization: `Bearer ${token}` } });
          await fetchPermissions(editingAccount.MaQuyen);
          message.success('Xóa quyền thành công!');
        } catch (error) {
          message.error(`Lỗi khi xóa quyền: ${error.response?.data?.error || error.message}`);
        }
      },
    });
  };

  // Sửa quyền - Để đầy đủ, thêm chức năng edit (sử dụng modal con hoặc inline, ở đây dùng state editingPermission)
  const [editingPermission, setEditingPermission] = useState(null);

  const handleEditPermission = (permission) => {
    if (!hasPermission('Phân quyền', 'Sửa')) {
      message.error('Bạn không có quyền sửa quyền!');
      return;
    }
    setEditingPermission(permission);
  };

  const handleUpdatePermission = async () => {
    if (!editingPermission) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`${PERMISSION_API}/${editingPermission.MaCTQ}`, {
        MaQuyen: editingAccount.MaQuyen, // Giữ nguyên nhóm
        MaCN: editingPermission.MaCN,
        HanhDong: editingPermission.HanhDong,
        TinhTrang: editingPermission.TinhTrang,
      }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchPermissions(editingAccount.MaQuyen);
      setEditingPermission(null);
      message.success('Cập nhật quyền thành công!');
    } catch (error) {
      message.error(`Lỗi khi cập nhật quyền: ${error.response?.data?.error || error.message}`);
    }
  };

  const handlePermissionInputChange = (field, value) => {
    setEditingPermission(prev => ({ ...prev, [field]: value }));
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
                fetchPermissions(record.MaQuyen);
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

  const permissionColumns = [
    { title: 'Mã CTQ', dataIndex: 'MaCTQ', key: 'MaCTQ' },
    { title: 'Chức năng', dataIndex: 'TenCN', key: 'TenCN' },
    { title: 'Hành động', dataIndex: 'HanhDong', key: 'HanhDong' },
    {
      title: 'Trạng thái',
      dataIndex: 'TinhTrang',
      key: 'TinhTrang',
      render: (status) => (status === 1 ? 'Hoạt động' : 'Bị khóa'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          {hasPermission('Phân quyền', 'Sửa') && (
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEditPermission(record)} />
          )}
          {hasPermission('Phân quyền', 'Xóa') && (
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeletePermission(record.MaCTQ)} />
          )}
        </Space>
      ),
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
        onCancel={() => setState(prev => ({ ...prev, isModalVisible: false, editingAccount: null, permissions: [] }))}
        footer={null}
        width={800}
        bodyStyle={{ padding: '16px' }}
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Thông tin tài khoản" key="1">
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
            <Button type="primary" onClick={editingAccount ? handleUpdateAccount : handleAddAccount} style={{ marginTop: 16 }}>
              {editingAccount ? 'Lưu' : 'Thêm'}
            </Button>
          </TabPane>
          {editingAccount && (
            <TabPane tab="Quyền của nhóm" key="2">
              <h3>Quyền của nhóm {quyenList.find(q => q.MaNQ === editingAccount?.MaQuyen)?.TenNQ}</h3>
              <Table
                columns={permissionColumns}
                dataSource={permissions}
                rowKey="MaCTQ"
                pagination={false}
                size="small"
              />
              {hasPermission('Phân quyền', 'Thêm') && (
                <div style={{ marginTop: 16 }}>
                  <h4>Thêm quyền mới</h4>
                  <Form layout="inline">
                    <Form.Item label="Chức năng">
                      <Select
                        value={newPermission.MaCN}
                        onChange={(v) => setState(prev => ({ ...prev, newPermission: { ...prev.newPermission, MaCN: v } }))}
                        style={{ width: 150 }}
                      >
                        {features.map(f => <Option key={f.MaCN} value={f.MaCN}>{f.TenCN}</Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item label="Hành động">
                      <Input
                        value={newPermission.HanhDong}
                        onChange={(e) => setState(prev => ({ ...prev, newPermission: { ...prev.newPermission, HanhDong: e.target.value } }))}
                        placeholder="e.g. Đọc, Sửa"
                      />
                    </Form.Item>
                    <Form.Item label="Trạng thái">
                      <Select
                        value={newPermission.TinhTrang}
                        onChange={(v) => setState(prev => ({ ...prev, newPermission: { ...prev.newPermission, TinhTrang: v } }))}
                        style={{ width: 120 }}
                      >
                        <Option value="1">Hoạt động</Option>
                        <Option value="0">Bị khóa</Option>
                      </Select>
                    </Form.Item>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPermission}>
                      Thêm
                    </Button>
                  </Form>
                </div>
              )}
            </TabPane>
          )}
        </Tabs>
      </Modal>

      {/* Modal sửa quyền (nếu muốn dùng modal riêng) */}
      <Modal
        title="Sửa quyền"
        open={!!editingPermission}
        onCancel={() => setEditingPermission(null)}
        onOk={handleUpdatePermission}
      >
        {editingPermission && (
          <div>
            <p>Chức năng:</p>
            <Select
              value={editingPermission.MaCN}
              onChange={(v) => handlePermissionInputChange('MaCN', v)}
              style={{ width: '100%' }}
            >
              {features.map(f => <Option key={f.MaCN} value={f.MaCN}>{f.TenCN}</Option>)}
            </Select>
            <p>Hành động:</p>
            <Input
              value={editingPermission.HanhDong}
              onChange={(e) => handlePermissionInputChange('HanhDong', e.target.value)}
            />
            <p>Trạng thái:</p>
            <Select
              value={editingPermission.TinhTrang}
              onChange={(v) => handlePermissionInputChange('TinhTrang', v)}
              style={{ width: '100%' }}
            >
              <Option value={1}>Hoạt động</Option>
              <Option value={0}>Bị khóa</Option>
            </Select>
          </div>
        )}
      </Modal>

      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );
};

export default AccountManagement;