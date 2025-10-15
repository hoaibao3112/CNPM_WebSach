import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space, Select, Form, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';

const { Search } = Input;
const { confirm } = Modal;
const { Option } = Select;

const RoleManagement = () => {
  // State declarations
  const [roles, setRoles] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [newRole, setNewRole] = useState({
    TenNQ: '',
    MoTa: '',
    TinhTrang: 1,
    chiTietQuyen: [{ MaCN: '', HanhDong: '' }],
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

  const API_URL = 'http://localhost:5000/api/roles';

  // Fetch roles
  const fetchRoles = async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL, {
        params: { page, pageSize, search },
      });
      if (response.data.success) {
        setRoles(response.data.data.items);
        setPagination({
          current: response.data.data.pagination.page,
          pageSize: response.data.data.pagination.pageSize,
          total: response.data.data.pagination.total,
        });
      } else {
        throw new Error('Dữ liệu nhóm quyền không hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách nhóm quyền:', error);
      message.error('Lỗi khi tải danh sách nhóm quyền');
    } finally {
      setLoading(false);
    }
  };

  // Fetch functions (chucnang)
  const fetchFunctions = async () => {
    try {
      const response = await axios.get(`${API_URL}/functions`);
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
    if (!newRole.TenNQ || newRole.chiTietQuyen.some((p) => !p.MaCN || !p.HanhDong)) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Tên nhóm quyền và ít nhất một quyền)!');
      return;
    }

    try {
      const roleToAdd = {
        TenNQ: newRole.TenNQ.trim(),
        MoTa: newRole.MoTa.trim(),
        chitietquyen: newRole.chiTietQuyen.filter((p) => p.MaCN && p.HanhDong),
      };

      const response = await axios.post(API_URL, roleToAdd);
      if (response.data.success) {
        await fetchRoles(pagination.current, pagination.pageSize, searchTerm);
        setNewRole({
          TenNQ: '',
          MoTa: '',
          TinhTrang: 1,
          chiTietQuyen: [{ MaCN: '', HanhDong: '' }],
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
    if (!editingRole.TenNQ || editingRole.chiTietQuyen.some((p) => !p.MaCN || !p.HanhDong)) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Tên nhóm quyền và ít nhất một quyền)!');
      return;
    }

    try {
      const roleToUpdate = {
        TenNQ: editingRole.TenNQ.trim(),
        MoTa: editingRole.MoTa.trim(),
        TinhTrang: editingRole.TinhTrang,
        chitietquyen: editingRole.chiTietQuyen.filter((p) => p.MaCN && p.HanhDong),
      };

      const response = await axios.put(`${API_URL}/${editingRole.MaNQ}`, roleToUpdate);
      if (response.data.success) {
        await fetchRoles(pagination.current, pagination.pageSize, searchTerm);
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
          const response = await axios.delete(`${API_URL}/${MaNQ}`);
          if (response.data.success) {
            await fetchRoles(pagination.current, pagination.pageSize, searchTerm);
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
        chiTietQuyen: [...prev.chiTietQuyen, { MaCN: '', HanhDong: '' }],
      }));
    } else {
      setNewRole((prev) => ({
        ...prev,
        chiTietQuyen: [...prev.chiTietQuyen, { MaCN: '', HanhDong: '' }],
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

  // Table columns
  const columns = [
    {
      title: 'Mã nhóm quyền',
      dataIndex: 'MaNQ',
      key: 'MaNQ',
      width: 120,
      fixed: 'left',
    },
    {
      title: 'Tên nhóm quyền',
      dataIndex: 'TenNQ',
      key: 'TenNQ',
      width: 200,
    },
    {
      title: 'Mô tả',
      dataIndex: 'MoTa',
      key: 'MoTa',
      width: 300,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Số người dùng',
      dataIndex: 'SoNguoiDung',
      key: 'SoNguoiDung',
      width: 120,
      align: 'center',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TinhTrang',
      key: 'TinhTrang',
      width: 120,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
        </Tag>
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
            onClick={async () => {
              try {
                const response = await axios.get(`${API_URL}/${record.MaNQ}`);
                if (response.data.success) {
                  setEditingRole({
                    ...response.data.data,
                    TinhTrang: response.data.data.TinhTrang,
                    chiTietQuyen: response.data.data.chiTietQuyen.length > 0
                      ? response.data.data.chiTietQuyen
                      : [{ MaCN: '', HanhDong: '' }],
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
      fixed: 'right',
      width: 150,
    },
  ];

  return (
    <div className="thongke-page">
      <div className="thongke-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>
          <i className="fas fa-users"></i> Quản lý Nhóm Quyền
        </h1>
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setEditingRole(null);
            setNewRole({
              TenNQ: '',
              MoTa: '',
              TinhTrang: 1,
              chiTietQuyen: [{ MaCN: '', HanhDong: '' }],
            });
            setIsModalVisible(true);
          }}
        >
          Thêm nhóm quyền
        </Button>
      </div>

      <div className="thongke-content">
        <div className="thongke-filters">
          <div className="filter-group">
            <label>Tìm kiếm:</label>
            <Input
              placeholder="Tìm nhóm quyền..."
              allowClear
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={() => handleSearch(searchTerm)}
              style={{ width: 250 }}
            />
          </div>
        </div>

        <div className="thongke-table">
          <Table
            columns={columns}
            dataSource={roles}
            rowKey="MaNQ"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="small"
            locale={{
              emptyText: 'Không tìm thấy nhóm quyền',
            }}
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
        width={800}
  styles={{ body: { padding: '16px' } }}
      >
        <Form layout="vertical">
          <div className="info-section">
            <div className="info-grid">
              <Form.Item label="Tên nhóm quyền" required>
                <Input
                  size="small"
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
                  rows={3}
                  value={editingRole ? editingRole.MoTa : newRole.MoTa}
                  onChange={(e) =>
                    editingRole
                      ? setEditingRole({ ...editingRole, MoTa: e.target.value })
                      : setNewRole({ ...newRole, MoTa: e.target.value })
                  }
                />
              </Form.Item>
              <Form.Item label="Trạng thái" required>
                <Select
                  size="small"
                  value={editingRole ? editingRole.TinhTrang : newRole.TinhTrang}
                  onChange={(value) =>
                    editingRole
                      ? setEditingRole({ ...editingRole, TinhTrang: value })
                      : setNewRole({ ...newRole, TinhTrang: value })
                  }
                  style={{ width: '100%' }}
                >
                  <Option value={1}>Hoạt động</Option>
                  <Option value={0}>Ngừng hoạt động</Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          <div className="permission-section">
            <h4>Chi tiết quyền</h4>
            {(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen).map((perm, index) => (
              <div key={index} className="permission-row">
                <Form.Item label="Chức năng" required style={{ flex: 1 }}>
                  <Select
                    size="small"
                    value={perm.MaCN}
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
                  >
                    {functions.map((func) => (
                      <Option key={func.MaCN} value={func.MaCN}>
                        {func.TenCN}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Hành động" required style={{ flex: 1 }}>
                  <Select
                    size="small"
                    value={perm.HanhDong}
                    onChange={(value) => {
                      const updatedPermissions = [...(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen)];
                      updatedPermissions[index].HanhDong = value;
                      if (editingRole) {
                        setEditingRole({ ...editingRole, chiTietQuyen: updatedPermissions });
                      } else {
                        setNewRole({ ...newRole, chiTietQuyen: updatedPermissions });
                      }
                    }}
                    placeholder="Chọn hành động"
                  >
                    {['Đọc', 'Thêm', 'Xóa', 'Sửa'].map((action) => (
                      <Option key={action} value={action}>
                        {action}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Button
                  size="small"
                  danger
                  onClick={() => removePermissionRow(index)}
                  disabled={(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen).length === 1}
                >
                  Xóa
                </Button>
              </div>
            ))}
            <Button type="dashed" onClick={addPermissionRow} style={{ width: '100%', marginTop: '8px' }}>
              Thêm quyền
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagement;