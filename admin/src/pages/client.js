import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space, Tag, Select, Badge } from 'antd';

// Create an axios instance that auto-attaches Authorization from localStorage.
// If your backend uses cookie-based httpOnly tokens, set withCredentials:true and configure CORS accordingly.
const api = axios.create({ baseURL: 'http://localhost:5000', withCredentials: false });

const TOKEN_KEYS = ['adminToken', 'token', 'accessToken', 'auth_token', 'jwt', 'authToken', 'wn_token'];

api.interceptors.request.use((config) => {
  let token = null;
  let keyFound = null;
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) { token = v; keyFound = k; break; }
  }
  // If token not in localStorage, try cookies (useful if login saved token as a cookie)
  if (!token && typeof document !== 'undefined' && document.cookie) {
    const cookies = document.cookie.split(';').map(c => c.trim());
    for (const k of TOKEN_KEYS) {
      const found = cookies.find(c => c.startsWith(k + '='));
      if (found) {
        token = decodeURIComponent(found.split('=')[1]);
        keyFound = k;
        break;
      }
    }
  }
  config.headers = config.headers || {};
  if (token) {
    config.headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    config.headers['X-Auth-Key'] = keyFound; // debug only
    try { console.debug('api attach token (masked):', token.substring(0,10) + '...', 'key=', keyFound); } catch(e){}
  } else {
    delete config.headers['Authorization'];
    delete config.headers['X-Auth-Key'];
  }
  return config;
});

api.interceptors.response.use(
  r => r,
  (error) => {
    if (error?.response?.status === 401) {
      const msg = error.response.data?.error || '';
      if (/Không tìm thấy token|hết hạn|Token đã hết hạn/i.test(msg)) {
        for (const k of TOKEN_KEYS) localStorage.removeItem(k);
      }
      message.error(msg || 'Phiên không hợp lệ. Vui lòng đăng nhập lại.');
    }
    return Promise.reject(error);
  }
);

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

  // Pending ratings (admin moderation)
  const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);
  const [pendingList, setPendingList] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Auth status for debug: shows if token exists and decoded payload (client-side only)
  const [authInfo, setAuthInfo] = useState({ present: false, tokenKey: null, payload: null });

  const decodeJwt = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (err) {
      return null;
    }
  };

  // Initialize authInfo from localStorage on mount and when storage changes
  useEffect(() => {
    const refreshAuthInfo = () => {
      let token = null;
      let keyFound = null;
      for (const k of TOKEN_KEYS) {
        const v = localStorage.getItem(k);
        if (v) { token = v; keyFound = k; break; }
      }
      if (token) setAuthInfo({ present: true, tokenKey: keyFound, payload: decodeJwt(token) });
      else setAuthInfo({ present: false, tokenKey: null, payload: null });
    };
    refreshAuthInfo();
    window.addEventListener('storage', refreshAuthInfo);
    return () => window.removeEventListener('storage', refreshAuthInfo);
  }, []);

  // We'll use a dedicated axios instance so every request automatically attaches the token from localStorage.
  // ⚠️ If your backend uses httpOnly cookies for auth, set withCredentials: true and ensure CORS allows credentials.
  // For Bearer token header flow (Postman style), keep withCredentials: false.
  
  const API_URL = '/api/client';
  const RATINGS_API = '/api/ratings';

  const fetchCustomers = async () => {
    try {
      setLoading(true);
  const res = await api.get(API_URL);
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

  // Poll pending ratings count every 20s so admin sees notifications
  useEffect(() => {
    let mounted = true;
    const fetchPendingCount = async () => {
      try {
  const res = await api.get(`${RATINGS_API}/pending/list`);
        if (!mounted) return;
        const count = Array.isArray(res.data?.data) ? res.data.data.length : 0;
        setPendingCount(count);
      } catch (err) {
        // Improved logging so we can see why the request was rejected (401/403/etc.)
        if (err.response) {
          console.error('Error fetching pending count:', err.response.status, err.response.data);
        } else {
          console.error('Error fetching pending count:', err.message || err);
        }
      }
    };

    fetchPendingCount();
    const iv = setInterval(fetchPendingCount, 20000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  // delete functionality removed per request

  const handleToggleStatus = async (customer) => {
    try {
      const newStatus = customer.tinhtrang === 'Hoạt động' ? 'Ngừng hoạt động' : 'Hoạt động';
  await api.patch(`${API_URL}/${customer.makh}/toggle-status`, { tinhtrang: newStatus });
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
  const res = await api.get(`${API_URL}/${makh}/promo-list`);
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

  // ----- Pending ratings moderation API calls -----
  const fetchPendingList = async () => {
    try {
      setPendingLoading(true);
  const res = await api.get(`${RATINGS_API}/pending/list`);
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      setPendingList(rows);
      setPendingCount(rows.length);
    } catch (err) {
      console.error('Error fetching pending list:', err);
      message.error(err.response?.data?.error || 'Không thể lấy danh sách đánh giá chờ duyệt');
    } finally {
      setPendingLoading(false);
    }
  };

  const approvePending = async (id) => {
    try {
  await api.post(`${RATINGS_API}/pending/${id}/approve`);
      message.success('Đã duyệt đánh giá');
      // refresh pending
      await fetchPendingList();
      // update the badge count
      setPendingCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error approving pending:', err);
      message.error(err.response?.data?.error || 'Lỗi khi duyệt đánh giá');
    }
  };

  const rejectPending = async (id) => {
    try {
  await api.delete(`${RATINGS_API}/pending/${id}`);
      message.success('Đã từ chối đánh giá');
      await fetchPendingList();
      setPendingCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error rejecting pending:', err);
      message.error(err.response?.data?.error || 'Lỗi khi từ chối đánh giá');
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button type="default" size="small" onClick={() => fetchCustomers()}>Làm mới</Button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Auth status debug */}
              <div style={{ fontSize: 12, color: authInfo.present ? '#138000' : '#a00', marginRight: 8 }} title={authInfo.payload ? JSON.stringify(authInfo.payload) : (authInfo.present ? 'Token present' : 'No token') }>
                Auth: {authInfo.present ? 'OK' : 'No token'}
              </div>
              <Badge count={pendingCount} offset={[6, 0]}>
                <Button type="primary" size="small" onClick={() => { setIsPendingModalVisible(true); fetchPendingList(); }}>
                  Duyệt đánh giá
                </Button>
              </Badge>
            </div>
          </div>
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

      {/* Pending ratings moderation modal */}
      <Modal
        title={`Đánh giá chờ duyệt (${pendingCount})`}
        open={isPendingModalVisible}
        onCancel={() => setIsPendingModalVisible(false)}
        footer={null}
        width={900}
        centered
      >
        <div style={{ padding: 12 }}>
          <Table
            dataSource={pendingList}
            loading={pendingLoading}
            rowKey={(r) => r.MaPDG}
            pagination={{ pageSize: 8 }}
            size="small"
            columns={[
              { title: 'ID', dataIndex: 'MaPDG', key: 'MaPDG', width: 60 },
              { title: 'Mã SP', dataIndex: 'MaSP', key: 'MaSP', width: 80 },
              { title: 'Mã KH', dataIndex: 'MaKH', key: 'MaKH', width: 80 },
              { title: 'Số sao', dataIndex: 'SoSao', key: 'SoSao', width: 80 },
              { title: 'Nhận xét', dataIndex: 'NhanXet', key: 'NhanXet', render: (t) => t || '-', ellipsis: true },
              { title: 'Ngày gửi', dataIndex: 'NgayDanhGia', key: 'NgayDanhGia', width: 160 },
              {
                title: 'Hành động', key: 'action', width: 180,
                render: (_, record) => (
                  <Space size="small">
                    <Button type="primary" size="small" onClick={() => approvePending(record.MaPDG)}>Duyệt</Button>
                    <Button danger size="small" onClick={() => rejectPending(record.MaPDG)}>Từ chối</Button>
                  </Space>
                )
              }
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