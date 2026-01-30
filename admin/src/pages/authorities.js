import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { PermissionContext } from '../components/PermissionContext';
import { Button, Input, message, Table, Modal, Space, Select, Form, Checkbox } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled, PlusOutlined } from '@ant-design/icons';

const { Search } = Input;
const { confirm } = Modal;
const { Option } = Select;

const PermissionManagement = () => {
  // State declarations
  const [roles, setRoles] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [newRole, setNewRole] = useState({
    TenNQ: '',
    MoTa: '',
    chiTietQuyen: [{ MaCN: '', HanhDong: [] }],
  });
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const { refreshPermissions } = useContext(PermissionContext);

  // Fetch roles (nhóm quyền)
  const fetchRoles = async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoading(true);
      const response = await api.get('/roles', {
        params: { page, pageSize, search },
      });

      // Handle response - backend returns simple array in response.data.data
      let rolesData = [];
      if (response.data.success && response.data.data) {
        rolesData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        rolesData = response.data;
      }

      setRoles(rolesData);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: rolesData.length,
      });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách nhóm quyền:', error);
      message.error('Lỗi khi tải danh sách nhóm quyền');
      setRoles([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch functions (chức năng)
  const fetchFunctions = async () => {
    try {
      const response = await api.get('/roles/functions');
      if (Array.isArray(response.data)) {
        setFunctions(response.data);
      } else {
        throw new Error('Dữ liệu chức năng không hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách chức năng:', error);
      message.error('Lỗi khi tải danh sách chức năng');
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchFunctions();
  }, []);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchRoles(1, pagination.pageSize, value);
  };

  // Handle pagination change
  const handleTableChange = (newPagination) => {
    fetchRoles(newPagination.current, newPagination.pageSize, searchTerm);
  };

  // Handle add role
  const handleAddRole = async () => {
    if (!newRole.TenNQ) {
      message.error('Vui lòng nhập tên nhóm quyền!');
      return;
    }

    // Filter out empty permissions and expand multiple actions
    const validPermissions = newRole.chiTietQuyen.filter((p) => p.MaCN && p.HanhDong && p.HanhDong.length > 0);
    if (validPermissions.length === 0) {
      message.error('Vui lòng chọn ít nhất một chức năng và hành động!');
      return;
    }

    // Expand multiple actions into separate entries
    const expandedPermissions = [];
    validPermissions.forEach((p) => {
      p.HanhDong.forEach((action) => {
        expandedPermissions.push({ MaCN: p.MaCN, HanhDong: action });
      });
    });

    try {
      const roleToAdd = {
        TenNQ: newRole.TenNQ.trim(),
        MoTa: newRole.MoTa.trim(),
        chitietquyen: expandedPermissions,
      };

      const response = await api.post('/roles', roleToAdd);
      if (response.data.success) {
        await fetchRoles(pagination.current, pagination.pageSize, searchTerm);
        try {
          await refreshPermissions();
        } catch (err) {
          console.warn('refreshPermissions failed after add:', err);
        }
        setNewRole({
          TenNQ: '',
          MoTa: '',
          chiTietQuyen: [{ MaCN: '', HanhDong: [] }],
        });
        setIsModalVisible(false);
        message.success('Thêm nhóm quyền thành công!');
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Lỗi khi thêm nhóm quyền:', error.response || error);
      message.error(error.response?.data?.error || 'Lỗi khi thêm nhóm quyền!');
    }
  };

  // Handle update role
  const handleUpdateRole = async () => {
    if (!editingRole.TenNQ) {
      message.error('Vui lòng nhập tên nhóm quyền!');
      return;
    }

    const validPermissions = editingRole.chiTietQuyen.filter((p) => p.MaCN && p.HanhDong && p.HanhDong.length > 0);
    if (validPermissions.length === 0) {
      message.error('Vui lòng chọn ít nhất một chức năng và hành động!');
      return;
    }

    // Expand multiple actions into separate entries
    const expandedPermissions = [];
    validPermissions.forEach((p) => {
      p.HanhDong.forEach((action) => {
        expandedPermissions.push({ MaCN: p.MaCN, HanhDong: action });
      });
    });

    try {
      const roleToUpdate = {
        TenNQ: editingRole.TenNQ.trim(),
        MoTa: editingRole.MoTa.trim(),
        TinhTrang: editingRole.TinhTrang !== undefined ? (editingRole.TinhTrang ? 1 : 0) : 1,
        chitietquyen: expandedPermissions,
      };

      console.log('Sending update:', roleToUpdate);

      const response = await api.put(`/roles/${editingRole.MaNQ}`, roleToUpdate);
      if (response.data.success) {
        await fetchRoles(pagination.current, pagination.pageSize, searchTerm);
        try {
          await refreshPermissions();
        } catch (err) {
          console.warn('refreshPermissions failed after update:', err);
        }
        setEditingRole(null);
        setIsModalVisible(false);
        message.success('Cập nhật nhóm quyền thành công!');
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật nhóm quyền:', error.response || error);
      message.error(error.response?.data?.error || 'Lỗi khi cập nhật nhóm quyền!');
    }
  };

  // Handle delete role
  const handleDeleteRole = (MaNQ) => {
    confirm({
      title: 'Bạn có chắc muốn xóa nhóm quyền này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này sẽ không thể hoàn tác',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Thoát',
      async onOk() {
        try {
          const response = await api.delete(`/roles/${MaNQ}`);
          if (response.data.success) {
            await fetchRoles(pagination.current, pagination.pageSize, searchTerm);
            try {
              await refreshPermissions();
            } catch (err) {
              console.warn('refreshPermissions failed after delete:', err);
            }
            message.success('Xóa nhóm quyền thành công!');
          } else {
            throw new Error(response.data.error);
          }
        } catch (error) {
          console.error('Lỗi khi xóa nhóm quyền:', error.response || error);
          message.error(error.response?.data?.error || 'Xóa nhóm quyền thất bại!');
        }
      },
    });
  };

  // Add new permission row
  const addPermissionRow = () => {
    if (editingRole) {
      setEditingRole((prev) => ({
        ...prev,
        chiTietQuyen: [...prev.chiTietQuyen, { MaCN: '', HanhDong: [] }],
      }));
    } else {
      setNewRole((prev) => ({
        ...prev,
        chiTietQuyen: [...prev.chiTietQuyen, { MaCN: '', HanhDong: [] }],
      }));
    }
  };

  // Remove permission row
  const removePermissionRow = (index) => {
    if (editingRole) {
      setEditingRole((prev) => ({
        ...prev,
        chiTietQuyen: prev.chiTietQuyen.filter((_, i) => i !== index),
      }));
    } else {
      setNewRole((prev) => ({
        ...prev,
        chiTietQuyen: prev.chiTietQuyen.filter((_, i) => i !== index),
      }));
    }
  };

  // Table columns - matching the image layout
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'ID Nhóm quyền',
      dataIndex: 'MaNQ',
      key: 'MaNQ',
      width: 120,
      align: 'center',
      render: (value) => {
        // Format as NQ01, NQ02, etc.
        return `NQ${String(value).padStart(2, '0')}`;
      },
    },
    {
      title: 'Tên nhóm quyền',
      dataIndex: 'TenNQ',
      key: 'TenNQ',
      width: 250,
      align: 'center',
    },
    {
      title: 'Mô tả',
      dataIndex: 'MoTa',
      key: 'MoTa',
      width: 300,
      align: 'center',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={async () => {
              try {
                const response = await api.get(`/roles/${record.MaNQ}`);
                if (response.data.success) {
                  // Group permissions by MaCN and combine actions
                  const groupedPermissions = {};
                  response.data.data.chiTietQuyen.forEach((p) => {
                    if (!groupedPermissions[p.MaCN]) {
                      groupedPermissions[p.MaCN] = { MaCN: p.MaCN, HanhDong: [] };
                    }
                    if (!groupedPermissions[p.MaCN].HanhDong.includes(p.HanhDong)) {
                      groupedPermissions[p.MaCN].HanhDong.push(p.HanhDong);
                    }
                  });
                  const combinedPermissions = Object.values(groupedPermissions);

                  setEditingRole({
                    ...response.data.data,
                    TinhTrang: response.data.data.TinhTrang,
                    chiTietQuyen: combinedPermissions.length > 0
                      ? combinedPermissions
                      : [{ MaCN: '', HanhDong: [] }],
                  });
                  setIsModalVisible(true);
                } else {
                  throw new Error(response.data.error);
                }
              } catch (error) {
                message.error('Lỗi khi tải thông tin nhóm quyền!');
              }
            }}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRole(record.MaNQ)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="thongke-page">
      <div className="thongke-header">
        <h1 className="page-title">Quản lý Phân quyền</h1>
        <div className="header-actions">
          <Search
            placeholder="Tìm nhóm quyền..."
            allowClear
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 250, marginRight: 16 }}
          />
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRole(null);
              setNewRole({
                TenNQ: '',
                MoTa: '',
                chiTietQuyen: [{ MaCN: '', HanhDong: [] }],
              });
              setIsModalVisible(true);
            }}
          >
            Thêm quyền
          </Button>
        </div>
      </div>

      <div className="thongke-content">
        <div className="thongke-table">
          <Table
            columns={columns}
            dataSource={roles}
            rowKey="MaNQ"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 800 }}
            size="small"
            bordered
            locale={{
              emptyText: 'Không tìm thấy nhóm quyền',
            }}
            rowClassName={(_, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
          />
        </div>
      </div>

      {/* Add/Edit Role Modal */}
      <Modal
        title={editingRole ? 'Chỉnh sửa nhóm quyền' : 'Thêm nhóm quyền mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRole(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              setEditingRole(null);
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={editingRole ? handleUpdateRole : handleAddRole}
          >
            {editingRole ? 'Lưu' : 'Thêm'}
          </Button>,
        ]}
        width={700}
        styles={{ body: { padding: '16px' } }}
      >
        <Form layout="vertical">
          <div className="info-section">
            <Form.Item label="Tên nhóm quyền" required>
              <Input
                size="small"
                placeholder="Nhập tên nhóm quyền"
                value={editingRole ? editingRole.TenNQ : newRole.TenNQ}
                onChange={(e) =>
                  editingRole
                    ? setEditingRole({ ...editingRole, TenNQ: e.target.value })
                    : setNewRole({ ...newRole, TenNQ: e.target.value })
                }
              />
            </Form.Item>
            <Form.Item label="Mô tả">
              <Input.TextArea
                size="small"
                rows={2}
                placeholder="Nhập mô tả cho nhóm quyền"
                value={editingRole ? editingRole.MoTa : newRole.MoTa}
                onChange={(e) =>
                  editingRole
                    ? setEditingRole({ ...editingRole, MoTa: e.target.value })
                    : setNewRole({ ...newRole, MoTa: e.target.value })
                }
              />
            </Form.Item>
          </div>

          <div className="permission-section">
            <h4 style={{ marginBottom: 12, color: '#1890ff' }}>Chức năng và Hành động</h4>
            {(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen).map((perm, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #e8e8e8' }}>
                <Select
                  size="small"
                  value={perm.MaCN || undefined}
                  onChange={(value) => {
                    const updatedPermissions = [...(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen)];
                    updatedPermissions[index].MaCN = value;
                    if (editingRole) {
                      setEditingRole({ ...editingRole, chiTietQuyen: updatedPermissions });
                    } else {
                      setNewRole({ ...newRole, chiTietQuyen: updatedPermissions });
                    }
                  }}
                  placeholder="Chọn chức năng"
                  style={{ width: 200 }}
                >
                  {functions.map((func) => (
                    <Option key={func.MaCN} value={func.MaCN}>
                      {func.TenCN}
                    </Option>
                  ))}
                </Select>
                <Checkbox.Group
                  value={perm.HanhDong || []}
                  onChange={(values) => {
                    const updatedPermissions = [...(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen)];
                    updatedPermissions[index].HanhDong = values;
                    if (editingRole) {
                      setEditingRole({ ...editingRole, chiTietQuyen: updatedPermissions });
                    } else {
                      setNewRole({ ...newRole, chiTietQuyen: updatedPermissions });
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  <Space>
                    <Checkbox value="Đọc">Đọc</Checkbox>
                    <Checkbox value="Thêm">Thêm</Checkbox>
                    <Checkbox value="Sửa">Sửa</Checkbox>
                    <Checkbox value="Xóa">Xóa</Checkbox>
                  </Space>
                </Checkbox.Group>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removePermissionRow(index)}
                  disabled={(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen).length === 1}
                />
              </div>
            ))}
            <Button
              type="dashed"
              onClick={addPermissionRow}
              style={{ width: '100%', marginTop: 8 }}
              icon={<PlusOutlined />}
            >
              Thêm chức năng
            </Button>
          </div>
        </Form>
      </Modal>

      <style>{`
        .thongke-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .header-actions {
          display: flex;
          align-items: center;
        }
        .page-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          color: #333;
        }
        .info-section {
          background: #fafafa;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .permission-section {
          background: #f0f5ff;
          padding: 16px;
          border-radius: 8px;
        }
        .table-row-light {
          background: #ffffff;
        }
        .table-row-dark {
          background: #e8f4fc;
        }
        .ant-table-thead > tr > th {
          background: #5dade2 !important;
          color: white !important;
          text-align: center !important;
          font-weight: 600 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: #d4edfc !important;
        }
      `}</style>
    </div>
  );
};

export default PermissionManagement;