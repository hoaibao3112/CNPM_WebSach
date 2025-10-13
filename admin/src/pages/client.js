import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space, Tag } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

const { Search } = Input;
const { confirm } = Modal;

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Promo modal
  const [isPromoModalVisible, setIsPromoModalVisible] = useState(false);
  const [promoUsage, setPromoUsage] = useState({ makh: null, usedCount: 0, totalClaimed: 0 });
  const [promoLoading, setPromoLoading] = useState(false);
  // Detailed promo list
  const [promoList, setPromoList] = useState([]);
  const [promoListLoading, setPromoListLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api/client';

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      if (res.data && Array.isArray(res.data.data)) setCustomers(res.data.data);
      else setCustomers([]);
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // delete functionality removed per request

  const handleToggleStatus = async (customer) => {
    try {
      const newStatus = customer.tinhtrang === 'Hoạt động' ? 'Ngừng hoạt động' : 'Hoạt động';
      await axios.patch(`${API_URL}/${customer.makh}/toggle-status`, { tinhtrang: newStatus });
      message.success('Đổi trạng thái thành công');
      fetchCustomers();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || 'Lỗi khi đổi trạng thái');
    }
  };

  const fetchPromoUsage = async (makh) => {
    try {
      setPromoLoading(true);
      const res = await axios.get(`${API_URL}/${makh}/promo-usage`);
      if (res.data) {
        setPromoUsage({ makh: res.data.makh, usedCount: res.data.usedCount || 0, totalClaimed: res.data.totalClaimed || 0 });
        setIsPromoModalVisible(true);
      } else {
        message.error('Không lấy được thông tin mã khuyến mãi');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || 'Lỗi khi lấy thông tin mã khuyến mãi');
    } finally {
      setPromoLoading(false);
    }
  };

  // Fetch detailed promo list for customer
  const fetchPromoList = async (makh) => {
    try {
      setPromoListLoading(true);
      const res = await axios.get(`${API_URL}/${makh}/promo-list`);
      if (res.data && Array.isArray(res.data.data)) {
        setPromoList(res.data.data);
        setPromoUsage((p) => ({ ...p, makh }));
        setIsPromoModalVisible(true);
      } else {
        setPromoList([]);
        message.error('Không lấy được danh sách chi tiết mã khuyến mãi');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || 'Lỗi khi lấy danh sách mã khuyến mãi');
    } finally {
      setPromoListLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => (
    c.tenkh?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.makh?.toString().includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.sdt?.toString().includes(searchTerm)
  ));

  const columns = [
    { title: 'Mã KH', dataIndex: 'makh', key: 'makh', width: 80, fixed: 'left' },
    { title: 'Tên khách hàng', dataIndex: 'tenkh', key: 'tenkh', width: 150 },
    { title: 'SĐT', dataIndex: 'sdt', key: 'sdt', width: 120 },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (t) => t || 'N/A', width: 200 },
    { title: 'Địa chỉ', dataIndex: 'diachi', key: 'diachi', render: (t) => t || 'N/A', width: 250 },
    { title: 'Trạng thái', dataIndex: 'tinhtrang', key: 'tinhtrang', render: (s) => <Tag color={s === 'Hoạt động' ? 'green' : 'red'}>{s}</Tag>, width: 120 },
    {
      title: 'Thao tác', key: 'action', fixed: 'right', width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => fetchPromoList(record.makh)}>Xem mã KM</Button>
          <Button size="small" type="primary" onClick={() => handleToggleStatus(record)}>{record.tinhtrang === 'Hoạt động' ? 'Vô hiệu' : 'Kích hoạt'}</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="customer-management-container">
      <div className="header-section">
        <h1 className="page-title">Quản lý Khách hàng</h1>
        <div className="search-box">
          <Search placeholder="Tìm khách hàng..." allowClear enterButton size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button type="default" size="small" onClick={() => fetchCustomers()}>Làm mới</Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredCustomers}
        rowKey="makh"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 10, showSizeChanger: false, size: 'small' }}
        size="small"
        className="compact-customer-table"
        style={{ fontSize: '13px' }}
        locale={{ emptyText: 'Không tìm thấy khách hàng' }}
      />

      <Modal
        title={promoUsage.makh ? `Mã khuyến mãi - KH ${promoUsage.makh}` : 'Mã khuyến mãi'}
        visible={isPromoModalVisible}
        onCancel={() => setIsPromoModalVisible(false)}
        footer={null}
        width={800}
        centered
        confirmLoading={promoLoading || promoListLoading}
      >
        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, color: '#666' }}>Đã sử dụng: <strong>{promoUsage.usedCount}</strong></div>
              <div style={{ fontSize: 14, color: '#666' }}>Tổng đã lưu/claim: <strong>{promoUsage.totalClaimed}</strong></div>
            </div>
            <div>
              <Button onClick={() => setIsPromoModalVisible(false)}>Đóng</Button>
            </div>
          </div>

          <Table
            dataSource={promoList}
            loading={promoListLoading}
            rowKey={(r) => `${r.makm}_${r.ngay_lay}`}
            pagination={false}
            size="small"
            columns={[
              { title: 'Mã KM', dataIndex: 'Code', key: 'Code', width: 120 },
              { title: 'Tên khuyến mãi', dataIndex: 'TenKM', key: 'TenKM', width: 220 },
              { title: 'Ngày claim', dataIndex: 'ngay_lay', key: 'ngay_lay', width: 160 },
              { title: 'Trạng thái', dataIndex: 'claim_trang_thai', key: 'claim_trang_thai', width: 120, render: (t) => <Tag color={t === 'Chua_su_dung' ? 'green' : 'red'}>{t}</Tag> },
              { title: 'Sản phẩm áp dụng', dataIndex: 'products', key: 'products', render: (p) => p && p.length ? p.map(x => x.TenSP).join(', ') : 'Toàn bộ' },
            ]}
          />
        </div>
      </Modal>

      <style jsx>{`
        .customer-management-container { padding: 16px 16px 16px 216px; min-height: 100vh; }
        .header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 16px; }
        .page-title { font-size: 18px; font-weight: 600; margin: 0; }
        .search-box { width: 250px; }
        .compact-customer-table :global(.ant-table-thead > tr > th) { padding: 8px 12px; }
        .compact-customer-table :global(.ant-table-tbody > tr > td) { padding: 8px 12px; }

        /* Prevent images from overflowing and hiding text */
        .compact-customer-table :global(img) {
          max-width: 80px;
          max-height: 60px;
          width: auto;
          height: auto;
          object-fit: cover;
          display: block;
          border-radius: 4px;
        }

        /* Ensure cell text remains readable and truncated when necessary */
        .compact-customer-table :global(.ant-table-cell) {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: middle;
        }

        /* Make fixed action column sit above other cells to avoid overlap */
        .compact-customer-table :global(.ant-table-fixed-right) {
          z-index: 5;
        }

        /* If you prefer images to sit in their own narrow column, set a small cell width */
        .compact-customer-table :global(.img-cell) {
          width: 90px;
        }
      `}</style>
    </div>
  );
};

export default CustomerManagement;