import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space, Tag, Select } from 'antd';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Promo modal
  const [isPromoModalVisible, setIsPromoModalVisible] = useState(false);
  const [promoUsage, setPromoUsage] = useState({ makh: null, usedCount: 0, totalClaimed: 0 });
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

  // fetchPromoUsage removed because not referenced; use fetchPromoList which also sets promoUsage and opens modal

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
    (statusFilter === '' || c.tinhtrang === statusFilter) &&
    (c.tenkh?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.makh?.toString().includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.sdt?.toString().includes(searchTerm))
  ));

  const columns = [
    { title: 'Mã KH', dataIndex: 'makh', key: 'makh', width: 50, fixed: 'left' },
    { title: 'Tên khách hàng', dataIndex: 'tenkh', key: 'tenkh', width: 100 },
    { title: 'SĐT', dataIndex: 'sdt', key: 'sdt', width: 100 },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (t) => t || 'N/A', width: 150 },
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
    <div className="thongke-page">
      <div className="thongke-header">
        <h1>
          <i className="fas fa-users"></i> Quản lý Khách hàng
        </h1>
        <Button type="default" size="small" onClick={() => fetchCustomers()}>Làm mới</Button>
      </div>

      <div className="thongke-content">
        <div className="thongke-filters">
          <div className="filter-group">
            <label>Tìm kiếm:</label>
            <Input
              placeholder="Tìm khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200, marginRight: 16 }}
            />
          </div>
          <div className="filter-group">
            <label>Trạng thái:</label>
            <Select value={statusFilter} onChange={(value) => setStatusFilter(value)} style={{ width: 120 }}>
              <Select.Option value="">Tất cả</Select.Option>
              <Select.Option value="Hoạt động">Hoạt động</Select.Option>
              <Select.Option value="Ngừng hoạt động">Ngừng hoạt động</Select.Option>
            </Select>
          </div>
        </div>

        <div className="thongke-table">
          <Table
            columns={columns}
            dataSource={filteredCustomers}
            rowKey="makh"
            loading={loading}
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 10, showSizeChanger: false, size: 'small' }}
            size="small"
            locale={{ emptyText: 'Không tìm thấy khách hàng' }}
          />
        </div>
      </div>

      <Modal
        title={promoUsage.makh ? `Mã khuyến mãi - KH ${promoUsage.makh}` : 'Mã khuyến mãi'}
  open={isPromoModalVisible}
        onCancel={() => setIsPromoModalVisible(false)}
        footer={null}
        width={800}
        centered
    confirmLoading={promoListLoading}
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
      `}</style>
    </div>
  );
};

export default CustomerManagement;