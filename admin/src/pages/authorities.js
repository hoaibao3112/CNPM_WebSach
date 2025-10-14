import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space, Select } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled, LockOutlined, UnlockOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

const PermissionManagement = () => {
  // State declarations
  const [state, setState] = useState({
    permissions: [],
    roles: [],
    features: [],
    newPermission: {
      MaCTQ: '',
      MaQuyen: '',
      MaCN: '',
      HanhDong: '',
      TinhTrang: '1',
    },
    editingPermission: null,
    searchTerm: '',
    isModalVisible: false,
    loading: false,
    error: null,
  });

  // Destructure state
  const { permissions, roles, features, newPermission, editingPermission, searchTerm, isModalVisible, loading } = state;

  // API endpoint
  const API_URL = 'http://localhost:5000/api/permissions';

  // Fetch permissions with error handling
  const fetchPermissions = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await axios.get(API_URL);

      if (Array.isArray(response.data)) {
        const processedPermissions = response.data.map(permission => ({
          ...permission,
          TinhTrang: permission.TinhTrang === '1' ? 'Hoạt động' : 'Ngừng hoạt động',
          TinhTrangValue: permission.TinhTrang,
        }));
        setState(prev => ({ ...prev, permissions: processedPermissions }));
      } else {
        throw new Error('Dữ liệu quyền không hợp lệ');
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      message.error(`Lỗi khi tải dữ liệu: ${error.message}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch roles and features
  const fetchRolesAndFeatures = async () => {
    try {
      const [rolesRes, featuresRes] = await Promise.all([
        axios.get('http://localhost:5000/api/permissions/roles'),
        axios.get('http://localhost:5000/api/permissions/features'),
      ]);
      setState(prev => ({
        ...prev,
        roles: rolesRes.data || [],
        features: featuresRes.data || [],
      }));
    } catch (error) {
      message.error('Lỗi tải dữ liệu tham chiếu');
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchRolesAndFeatures();
  }, []);

  // Handle input changes
  const handleInputChange = (field, value) => {
    if (editingPermission) {
      setState(prev => ({
        ...prev,
        editingPermission: {
          ...prev.editingPermission,
          [field]: value,
          ...(field === 'TinhTrang' && { TinhTrangValue: value }),
        },
      }));
    } else {
      setState(prev => ({
        ...prev,
        newPermission: {
          ...prev.newPermission,
          [field]: value,
        },
      }));
    }
  };

  // Validate permission data
  const validatePermissionData = (data) => {
    if (!data.MaQuyen || !data.MaCN || !data.HanhDong) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Nhóm quyền, Chức năng, Hành động)!');
      return false;
    }
    return true;
  };

  // Handle add permission
  const handleAddPermission = async () => {
    if (!validatePermissionData(newPermission)) return;

    try {
      const payload = {
        ...newPermission,
        TinhTrang: newPermission.TinhTrang,
      };

      await axios.post(API_URL, payload);
      await fetchPermissions();
      setState(prev => ({
        ...prev,
        newPermission: {
          MaCTQ: '',
          MaQuyen: '',
          MaCN: '',
          HanhDong: '',
          TinhTrang: '1',
        },
        isModalVisible: false,
      }));
      message.success('Thêm quyền thành công!');
    } catch (error) {
      message.error(`Lỗi khi thêm quyền: ${error.response?.data?.error || error.message}`);
    }
  };

  // Handle update permission
  const handleUpdatePermission = async () => {
    if (!validatePermissionData(editingPermission)) return;

    try {
      const payload = {
        ...editingPermission,
        TinhTrang: editingPermission.TinhTrang,
      };

      await axios.put(`${API_URL}/${editingPermission.MaCTQ}`, payload);
      await fetchPermissions();
      setState(prev => ({
        ...prev,
        editingPermission: null,
        isModalVisible: false,
      }));
      message.success('Cập nhật quyền thành công!');
    } catch (error) {
      message.error(`Lỗi khi cập nhật quyền: ${error.response?.data?.error || error.message}`);
    }
  };

  // Handle delete permission
  const handleDelete = (MaCTQ) => {
    confirm({
      title: 'Bạn có chắc muốn xóa quyền này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này sẽ không thể hoàn tác',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Thoát',
      async onOk() {
        try {
          await axios.delete(`${API_URL}/${MaCTQ}`);
          await fetchPermissions();
          message.success('Xóa quyền thành công!');
        } catch (error) {
          message.error(`Lỗi khi xóa: ${error.message}`);
        }
      },
    });
  };

  // Handle toggle permission status
  const handleToggleStatus = (permission) => {
    confirm({
      title: `Bạn có muốn ${permission.TinhTrang === 'Hoạt động' ? 'tạm ẩn' : 'kích hoạt'} quyền này?`,
      icon: <ExclamationCircleFilled />,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      async onOk() {
        try {
          const newStatus = permission.TinhTrangValue === '1' ? '0' : '1';
          await axios.put(`${API_URL}/${permission.MaCTQ}`, {
            ...permission,
            TinhTrang: newStatus,
          });
          await fetchPermissions();
          message.success(`Đã ${newStatus === '1' ? 'kích hoạt' : 'tạm ẩn'} quyền!`);
        } catch (error) {
          message.error(`Lỗi khi đổi trạng thái: ${error.message}`);
        }
      },
    });
  };

  // Filtered permissions
  const filteredPermissions = permissions.filter(
    permission =>
      (permission.TenNQ && permission.TenNQ.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (permission.TenCN && permission.TenCN.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (permission.HanhDong && permission.HanhDong.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (permission.MaCTQ && permission.MaCTQ.toString().includes(searchTerm))
  );

  // Table columns
  const columns = [
    {
      title: 'Mã CTQ',
      dataIndex: 'MaCTQ',
      key: 'MaCTQ',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Nhóm quyền',
      dataIndex: 'TenNQ',
      key: 'TenNQ',
      width: 200,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Chức năng',
      dataIndex: 'TenCN',
      key: 'TenCN',
      width: 200,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Hành động',
      dataIndex: 'HanhDong',
      key: 'HanhDong',
      width: 150,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TinhTrang',
      key: 'TinhTrang',
      width: 120,
      render: (status) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setState(prev => ({
                ...prev,
                editingPermission: {
                  ...record,
                  TinhTrang: record.TinhTrangValue,
                },
                isModalVisible: true,
              }));
            }}
          />
          <Button
            size="small"
            icon={record.TinhTrang === 'Hoạt động' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.MaCTQ)}
          />
        </Space>
      ),
      fixed: 'right',
      width: 120,
    },
  ];

  return (
    <div className="permission-management-container">
      <div className="header-section">
        <h1 className="page-title">Quản lý Phân quyền</h1>
        <div className="search-box">
          <Search
            placeholder="Tìm quyền..."
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
              editingPermission: null,
              newPermission: {
                MaCTQ: '',
                MaQuyen: '',
                MaCN: '',
                HanhDong: '',
                TinhTrang: '1',
              },
              isModalVisible: true,
            }));
          }}
        >
          Thêm quyền
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredPermissions}
        rowKey="MaCTQ"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          size: 'small',
        }}
        size="small"
        className="compact-permission-table"
        style={{ fontSize: '13px' }}
      />

      {/* Add/Edit Permission Modal */}
      <Modal
        title={editingPermission ? 'Chỉnh sửa quyền' : 'Thêm quyền mới'}
  open={isModalVisible}
        onCancel={() => {
          setState(prev => ({
            ...prev,
            isModalVisible: false,
            editingPermission: null,
          }));
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setState(prev => ({
                ...prev,
                isModalVisible: false,
                editingPermission: null,
              }));
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={editingPermission ? handleUpdatePermission : handleAddPermission}
          >
            {editingPermission ? 'Lưu' : 'Thêm'}
          </Button>,
        ]}
        width={600}
  styles={{ body: { padding: '16px' } }}
      >
        <div className="info-section">
          <div className="info-grid">
            <div className="info-item">
              <p className="info-label">Mã quyền:</p>
              <Input
                size="small"
                value={editingPermission ? editingPermission.MaCTQ : newPermission.MaCTQ}
                onChange={(e) => handleInputChange('MaCTQ', e.target.value)}
                disabled={!!editingPermission}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Nhóm quyền:</p>
              <Select
                size="small"
                value={editingPermission ? editingPermission.MaQuyen : newPermission.MaQuyen}
                onChange={(value) => handleInputChange('MaQuyen', value)}
                style={{ width: '100%' }}
              >
                <Option value="">Chọn nhóm quyền</Option>
                {roles.map(role => (
                  <Option key={role.MaNQ} value={role.MaNQ}>
                    {role.TenNQ}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="info-item">
              <p className="info-label">Chức năng:</p>
              <Select
                size="small"
                value={editingPermission ? editingPermission.MaCN : newPermission.MaCN}
                onChange={(value) => handleInputChange('MaCN', value)}
                style={{ width: '100%' }}
              >
                <Option value="">Chọn chức năng</Option>
                {features.map(feature => (
                  <Option key={feature.MaCN} value={feature.MaCN}>
                    {feature.TenCN}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="info-item">
              <p className="info-label">Hành động:</p>
              <Input
                size="small"
                value={editingPermission ? editingPermission.HanhDong : newPermission.HanhDong}
                onChange={(e) => handleInputChange('HanhDong', e.target.value)}
                placeholder="VD: create, read, update, delete"
              />
            </div>
            <div className="info-item">
              <p className="info-label">Trạng thái:</p>
              <Select
                size="small"
                value={editingPermission ? editingPermission.TinhTrang : newPermission.TinhTrang}
                onChange={(value) => handleInputChange('TinhTrang', value)}
                style={{ width: '100%' }}
              >
                <Option value="1">Hoạt động</Option>
                <Option value="0">Ngừng hoạt động</Option>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

  <style>{`
        .permission-management-container {
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
  .compact-permission-table .ant-table-thead > tr > th {
          padding: 8px 12px;
        }
  .compact-permission-table .ant-table-tbody > tr > td {
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
};

export default PermissionManagement;