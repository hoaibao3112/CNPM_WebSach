import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Select, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';

const { Search } = Input;
const { confirm } = Modal;
const { Option } = Select;

const CustomerManagement = () => {
  // State management
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    makh: '',
    tenkh: '',
    sdt: '',
    email: '',
    diachi: '',
    tinhtrang: 'Hoạt động',
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api/client';

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      if (response.data && Array.isArray(response.data.data)) {
        setCustomers(response.data.data);
      } else {
        throw new Error('Invalid customer data format');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Validate customer data
  const validateCustomerData = (customerData) => {
    if (!customerData.tenkh?.trim() || !customerData.sdt?.trim()) {
      message.warning('Vui lòng nhập tên và số điện thoại');
      return false;
    }
    if (!/^\d{10,11}$/.test(customerData.sdt)) {
      message.warning('Số điện thoại phải có 10-11 chữ số');
      return false;
    }
    if (customerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      message.warning('Email không hợp lệ');
      return false;
    }
    return true;
  };

  // Handle add customer
  const handleAddCustomer = async () => {
    if (!validateCustomerData(newCustomer)) return;
    try {
      await axios.post(API_URL, newCustomer);
      message.success('Thêm khách hàng thành công!');
      await fetchCustomers();
      setNewCustomer({
        makh: '',
        tenkh: '',
        sdt: '',
        email: '',
        diachi: '',
        tinhtrang: 'Hoạt động',
      });
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error adding customer:', error);
      message.error(error.response?.data?.error || 'Lỗi khi thêm khách hàng');
    }
  };

  // Handle update customer
  const handleUpdateCustomer = async () => {
    if (!validateCustomerData(editingCustomer)) return;
    try {
      await axios.put(`${API_URL}/${editingCustomer.makh}`, editingCustomer);
      message.success('Cập nhật khách hàng thành công!');
      await fetchCustomers();
      setEditingCustomer(null);
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      message.error(error.response?.data?.error || 'Lỗi khi cập nhật khách hàng');
    }
  };

  // Handle delete customer
  const handleDeleteCustomer = (makh) => {
    confirm({
      title: 'Bạn có chắc muốn xóa khách hàng này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này sẽ không thể hoàn tác',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Thoát',
      async onOk() {
        try {
          await axios.delete(`${API_URL}/${makh}`);
          message.success('Xóa khách hàng thành công!');
          await fetchCustomers();
        } catch (error) {
          console.error('Error deleting customer:', error);
          message.error(error.response?.data?.error || 'Lỗi khi xóa khách hàng');
        }
      },
    });
  };

  // Handle toggle status
  const handleToggleStatus = async (customer) => {
    try {
      const newStatus = customer.tinhtrang === 'Hoạt động' ? 'Ngừng hoạt động' : 'Hoạt động';
      await axios.patch(`${API_URL}/${customer.makh}/toggle-status`, {
        tinhtrang: newStatus,
      });
      message.success('Đổi trạng thái thành công!');
      await fetchCustomers();
    } catch (error) {
      console.error('Error toggling status:', error);
      message.error(error.response?.data?.error || 'Lỗi khi đổi trạng thái');
    }
  };

  // Filtered customers
  const filteredCustomers = customers.filter((customer) =>
    (
      customer.tenkh?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.makh?.toString().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.sdt?.toString().includes(searchTerm)
    )
  );

  // Table columns
  const columns = [
    {
      title: 'Mã KH',
      dataIndex: 'makh',
      key: 'makh',
      width: 80,
      fixed: 'left',
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'tenkh',
      key: 'tenkh',
      width: 150,
    },
    {
      title: 'SĐT',
      dataIndex: 'sdt',
      key: 'sdt',
      width: 120,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || 'N/A',
      width: 200,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'diachi',
      key: 'diachi',
      render: (text) => text || 'N/A',
      width: 250,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'tinhtrang',
      key: 'tinhtrang',
      render: (status) => (
        <Tag color={status === 'Hoạt động' ? 'green' : 'red'}>{status}</Tag>
      ),
      width: 120,
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
              setEditingCustomer(record);
              setIsModalVisible(true);
            }}
          />
          <Button
            size="small"
            type="primary"
            onClick={() => handleToggleStatus(record)}
          >
            {record.tinhtrang === 'Hoạt động' ? 'Vô hiệu' : 'Kích hoạt'}
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCustomer(record.makh)}
          />
        </Space>
      ),
      fixed: 'right',
      width: 150,
    },
  ];

  return (
    <div className="customer-management-container">
      <div className="header-section">
        <h1 className="page-title">Quản lý Khách hàng</h1>
        <div className="search-box">
          <Search
            placeholder="Tìm khách hàng..."
            allowClear
            enterButton
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setEditingCustomer(null);
            setNewCustomer({
              makh: '',
              tenkh: '',
              sdt: '',
              email: '',
              diachi: '',
              tinhtrang: 'Hoạt động',
            });
            setIsModalVisible(true);
          }}
        >
          Thêm khách hàng
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredCustomers}
        rowKey="makh"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          size: 'small',
        }}
        size="small"
        className="compact-customer-table"
        style={{ fontSize: '13px' }}
        locale={{
          emptyText: 'Không tìm thấy khách hàng',
        }}
      />

      {/* Add/Edit Customer Modal */}
      <Modal
        title={editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingCustomer(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              setEditingCustomer(null);
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
          >
            {editingCustomer ? 'Cập nhật' : 'Thêm'}
          </Button>,
        ]}
        width={600}
        bodyStyle={{ padding: '16px' }}
      >
        <div className="info-section">
          <div className="info-grid">
            <div className="info-item">
              <p className="info-label">Mã khách hàng:</p>
              <Input
                size="small"
                value={editingCustomer ? editingCustomer.makh : newCustomer.makh}
                onChange={(e) =>
                  !editingCustomer &&
                  setNewCustomer({ ...newCustomer, makh: e.target.value })
                }
                disabled={!!editingCustomer}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Tên khách hàng:</p>
              <Input
                size="small"
                value={editingCustomer ? editingCustomer.tenkh : newCustomer.tenkh}
                onChange={(e) =>
                  editingCustomer
                    ? setEditingCustomer({ ...editingCustomer, tenkh: e.target.value })
                    : setNewCustomer({ ...newCustomer, tenkh: e.target.value })
                }
              />
            </div>
            <div className="info-item">
              <p className="info-label">Số điện thoại:</p>
              <Input
                size="small"
                value={editingCustomer ? editingCustomer.sdt : newCustomer.sdt}
                onChange={(e) =>
                  editingCustomer
                    ? setEditingCustomer({ ...editingCustomer, sdt: e.target.value })
                    : setNewCustomer({ ...newCustomer, sdt: e.target.value })
                }
              />
            </div>
            <div className="info-item">
              <p className="info-label">Email:</p>
              <Input
                size="small"
                value={editingCustomer ? editingCustomer.email : newCustomer.email}
                onChange={(e) =>
                  editingCustomer
                    ? setEditingCustomer({ ...editingCustomer, email: e.target.value })
                    : setNewCustomer({ ...newCustomer, email: e.target.value })
                }
              />
            </div>
            <div className="info-item full-width">
              <p className="info-label">Địa chỉ:</p>
              <Input
                size="small"
                value={editingCustomer ? editingCustomer.diachi : newCustomer.diachi}
                onChange={(e) =>
                  editingCustomer
                    ? setEditingCustomer({ ...editingCustomer, diachi: e.target.value })
                    : setNewCustomer({ ...newCustomer, diachi: e.target.value })
                }
              />
            </div>
            <div className="info-item">
              <p className="info-label">Trạng thái:</p>
              <Select
                size="small"
                value={
                  editingCustomer ? editingCustomer.tinhtrang : newCustomer.tinhtrang
                }
                onChange={(value) =>
                  editingCustomer
                    ? setEditingCustomer({ ...editingCustomer, tinhtrang: value })
                    : setNewCustomer({ ...newCustomer, tinhtrang: value })
                }
                style={{ width: '100%' }}
              >
                <Option value="Hoạt động">Hoạt động</Option>
                <Option value="Ngừng hoạt động">Ngừng hoạt động</Option>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .customer-management-container {
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
        .full-width {
          grid-column: 1 / -1;
        }
        .info-label {
          color: #666;
          font-size: 12px;
          margin: 0;
        }
        .compact-customer-table :global(.ant-table-thead > tr > th) {
          padding: 8px 12px;
        }
        .compact-customer-table :global(.ant-table-tbody > tr > td) {
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
};

export default CustomerManagement;