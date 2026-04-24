import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space, Tag, Select, Badge, Tooltip, Avatar, Statistic, Card, Divider } from 'antd';
import { 
  UserOutlined, 
  SearchOutlined, 
  SyncOutlined, 
  SafetyCertificateOutlined, 
  StarOutlined, 
  GiftOutlined, 
  StopOutlined, 
  CheckCircleOutlined,
  FilterOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined
} from '@ant-design/icons';

const { Option } = Select;
const api = axios.create({ baseURL: (process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com') + '', withCredentials: false });

const TOKEN_KEYS = ['adminToken', 'token', 'accessToken', 'auth_token', 'jwt', 'authToken', 'wn_token'];

api.interceptors.request.use((config) => {
  let token = null;
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) { token = v; break; }
  }
  if (!token && typeof document !== 'undefined' && document.cookie) {
    const cookies = document.cookie.split(';').map(c => c.trim());
    for (const k of TOKEN_KEYS) {
      const found = cookies.find(c => c.startsWith(k + '='));
      if (found) { token = decodeURIComponent(found.split('=')[1]); break; }
    }
  }
  if (token) config.headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  return config;
});

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [isPromoModalVisible, setIsPromoModalVisible] = useState(false);
  const [promoUsage, setPromoUsage] = useState({ makh: null, usedCount: 0, totalClaimed: 0 });
  const [promoList, setPromoList] = useState([]);
  const [promoListLoading, setPromoListLoading] = useState(false);

  const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);
  const [pendingList, setPendingList] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const API_URL = '/api/client';
  const RATINGS_API = '/api/ratings';

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_URL);
      setCustomers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) { message.error('Lỗi khi tải danh sách khách hàng'); }
    finally { setLoading(false); }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await api.get(`${RATINGS_API}/pending/list`);
      setPendingCount(Array.isArray(res.data?.data) ? res.data.data.length : 0);
    } catch (err) {}
  };

  useEffect(() => {
    fetchCustomers();
    fetchPendingCount();
    const iv = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(iv);
  }, []);

  const handleToggleStatus = async (customer) => {
    try {
      const newStatus = customer.tinhtrang === 'Hoạt động' ? 'Ngừng hoạt động' : 'Hoạt động';
      await api.patch(`${API_URL}/${customer.makh}/toggle-status`, { tinhtrang: newStatus });
      message.success('Cập nhật trạng thái thành công');
      fetchCustomers();
    } catch (err) { message.error(err.response?.data?.error || 'Lỗi hệ thống'); }
  };

  const fetchPromoList = async (makh) => {
    try {
      setPromoListLoading(true);
      const res = await api.get(`${API_URL}/${makh}/promo-list`);
      if (res.data && Array.isArray(res.data.data)) {
        setPromoList(res.data.data);
        setPromoUsage({ makh, usedCount: res.data.data.filter(x => x.claim_trang_thai !== 'Chua_su_dung').length, totalClaimed: res.data.data.length });
        setIsPromoModalVisible(true);
      }
    } catch (err) { message.error('Lỗi khi lấy danh sách mã KM'); }
    finally { setPromoListLoading(false); }
  };

  const fetchPendingList = async () => {
    try {
      setPendingLoading(true);
      const res = await api.get(`${RATINGS_API}/pending/list`);
      setPendingList(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) { message.error('Lỗi khi tải danh sách chờ duyệt'); }
    finally { setPendingLoading(false); }
  };

  const approvePending = async (id) => {
    try {
      await api.post(`${RATINGS_API}/pending/${id}/approve`);
      message.success('Đã duyệt đánh giá');
      fetchPendingList();
      fetchPendingCount();
    } catch (err) { message.error('Lỗi phê duyệt'); }
  };

  const rejectPending = async (id) => {
    try {
      await api.delete(`${RATINGS_API}/pending/${id}`);
      message.success('Đã từ chối');
      fetchPendingList();
      fetchPendingCount();
    } catch (err) { message.error('Lỗi từ chối'); }
  };

  const filteredCustomers = customers.filter((c) => (
    (statusFilter === '' || c.tinhtrang === statusFilter) &&
    (tierFilter === '' || c.loyalty_tier === tierFilter) &&
    (c.tenkh?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.makh?.toString().includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.sdt?.toString().includes(searchTerm))
  ));

  const columns = [
    {
      title: 'KHÁCH HÀNG',
      key: 'customer',
      fixed: 'left',
      width: 280,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar size={44} icon={<UserOutlined />} className="bg-indigo-100 text-indigo-600 flex-shrink-0" />
          <div className="truncate">
            <div className="font-black text-slate-800 leading-tight truncate">{record.tenkh}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">ID: #{record.makh}</div>
          </div>
        </div>
      )
    },
    {
      title: 'LIÊN HỆ',
      key: 'contact',
      width: 250,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><MailOutlined className="text-slate-300" /> {record.email || 'N/A'}</div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><PhoneOutlined className="text-slate-300" /> {record.sdt || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'HẠNG THÀNH VIÊN',
      dataIndex: 'loyalty_tier',
      key: 'tier',
      width: 150,
      render: (tier) => {
        const tiers = {
          dong: { color: 'text-orange-700', bg: 'bg-orange-50', label: 'Đồng' },
          bac: { color: 'text-slate-500', bg: 'bg-slate-100', label: 'Bạc' },
          vang: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Vàng' },
          bachkim: { color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Bạch Kim' }
        };
        const config = tiers[tier] || tiers.dong;
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.color}`}>{config.label}</span>;
      }
    },
    {
      title: 'TÍCH LŨY',
      dataIndex: 'loyalty_points',
      key: 'points',
      width: 120,
      align: 'center',
      render: (v) => <div className="font-black text-indigo-600">{(v || 0).toLocaleString()} <span className="text-[9px] text-slate-400 uppercase ml-1">đm</span></div>
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'tinhtrang',
      key: 'status',
      width: 150,
      render: (s) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s === 'Hoạt động' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {s}
        </span>
      )
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Mã ưu đãi">
            <Button className="w-10 h-10 rounded-xl flex items-center justify-center border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-all" icon={<GiftOutlined />} onClick={() => fetchPromoList(record.makh)} />
          </Tooltip>
          <Tooltip title={record.tinhtrang === 'Hoạt động' ? 'Vô hiệu hóa' : 'Kích hoạt'}>
            <Button 
              danger={record.tinhtrang === 'Hoạt động'}
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.tinhtrang !== 'Hoạt động' ? 'border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300' : ''}`}
              icon={record.tinhtrang === 'Hoạt động' ? <StopOutlined /> : <CheckCircleOutlined />} 
              onClick={() => handleToggleStatus(record)} 
            />
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="material-icons text-indigo-500">group</span>
            Cộng đồng Khách hàng
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Quản lý định danh, thứ hạng và phản hồi từ người dùng</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge count={pendingCount} overflowCount={99}>
            <Button 
              type="primary" 
              icon={<StarOutlined />} 
              onClick={() => { setIsPendingModalVisible(true); fetchPendingList(); }}
              className="h-12 px-6 rounded-2xl bg-indigo-600 border-0 shadow-lg shadow-indigo-100 font-bold flex items-center gap-2"
            >
              Phê duyệt đánh giá
            </Button>
          </Badge>
          <Button icon={<SyncOutlined />} onClick={fetchCustomers} className="h-12 w-12 rounded-2xl border-0 bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 relative group">
            <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <Input 
              placeholder="Tên, Email hoặc SĐT..." 
              className="h-12 pl-12 pr-4 w-full rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <Select 
              className="w-full h-12 modern-select" 
              placeholder="Trạng thái" 
              value={statusFilter || undefined} 
              onChange={setStatusFilter}
              allowClear
            >
              <Option value="Hoạt động">Đang hoạt động</Option>
              <Option value="Ngừng hoạt động">Đã vô hiệu</Option>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Select 
              className="w-full h-12 modern-select" 
              placeholder="Phân hạng" 
              value={tierFilter || undefined} 
              onChange={setTierFilter}
              allowClear
            >
              <Option value="dong">Hạng Đồng</Option>
              <Option value="bac">Hạng Bạc</Option>
              <Option value="vang">Hạng Vàng</Option>
              <Option value="bachkim">Bạch Kim</Option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button block className="h-12 rounded-2xl font-black bg-slate-800 text-white border-0 hover:bg-slate-900 transition-all uppercase text-[10px] tracking-widest">Lọc kết quả</Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="makh"
          loading={loading}
          pagination={{ pageSize: 10, className: "px-8 py-6" }}
          className="modern-table"
          scroll={{ x: 1200 }}
        />
      </div>

      <Modal open={isPromoModalVisible} title={null} onCancel={() => setIsPromoModalVisible(false)} footer={null} width={850} className="modern-modal" centered>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><GiftOutlined className="text-indigo-500" /> Kho ưu đãi cá nhân</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-tight">Khách hàng ID: #{promoUsage.makh}</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <span className="text-[9px] font-black text-slate-400 uppercase block">Đã dùng</span>
              <span className="font-black text-slate-800">{promoUsage.usedCount}</span>
            </div>
            <Divider type="vertical" className="h-8 border-slate-200" />
            <div className="text-right">
              <span className="text-[9px] font-black text-slate-400 uppercase block">Tổng sở hữu</span>
              <span className="font-black text-slate-800">{promoUsage.totalClaimed}</span>
            </div>
          </div>
        </div>
        <Table
          dataSource={promoList}
          loading={promoListLoading}
          rowKey={(r) => `${r.makm}_${r.ngay_lay}`}
          pagination={{ pageSize: 5 }}
          className="modern-table"
          columns={[
            { title: 'MÃ CODE', dataIndex: 'Code', key: 'code', render: (t) => <span className="font-black text-indigo-600">{t}</span> },
            { title: 'CHIẾN DỊCH', dataIndex: 'TenKM', key: 'name', render: (t) => <span className="font-bold text-slate-700">{t}</span> },
            { title: 'NGÀY NHẬN', dataIndex: 'ngay_lay', key: 'date', render: (t) => <span className="text-xs text-slate-400 font-medium">{t}</span> },
            { title: 'TRẠNG THÁI', dataIndex: 'claim_trang_thai', key: 'status', render: (t) => <Tag color={t === 'Chua_su_dung' ? 'green' : 'red'} className="font-black m-0">{t === 'Chua_su_dung' ? 'SẴN SÀNG' : 'ĐÃ DÙNG'}</Tag> }
          ]}
        />
      </Modal>

      <Modal open={isPendingModalVisible} title={null} onCancel={() => setIsPendingModalVisible(false)} footer={null} width={950} className="modern-modal" centered>
        <div className="mb-8"><h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><StarOutlined className="text-indigo-500" /> Kiểm duyệt Đánh giá</h2><p className="text-slate-400 text-sm mt-1 font-medium">Xác thực nội dung phản hồi từ cộng đồng trước khi hiển thị</p></div>
        <Table
          dataSource={pendingList}
          loading={pendingLoading}
          rowKey="MaPDG"
          pagination={{ pageSize: 5 }}
          className="modern-table"
          columns={[
            { title: 'ĐỐI TƯỢNG', key: 'target', render: (_, r) => <div className="space-y-0.5"><div className="text-xs font-black text-slate-400 uppercase">SP: #{r.MaSP}</div><div className="text-xs font-black text-slate-800">KH: #{r.MaKH}</div></div> },
            { title: 'XẾP HẠNG', dataIndex: 'SoSao', key: 'stars', render: (s) => <div className="flex gap-0.5 text-yellow-400">{Array(s).fill(0).map((_, i) => <StarOutlined key={i} />)}</div> },
            { title: 'NỘI DUNG', dataIndex: 'NhanXet', key: 'comment', render: (t) => <p className="text-xs text-slate-600 font-medium italic max-w-[300px] truncate">{t || 'Không có nhận xét'}</p> },
            { title: 'THỜI GIAN', dataIndex: 'NgayDanhGia', key: 'time', render: (t) => <span className="text-[10px] font-bold text-slate-400 uppercase">{t}</span> },
            { title: 'XỬ LÝ', key: 'action', render: (_, r) => <div className="flex gap-2"><Button type="primary" size="small" className="bg-indigo-600 border-0 rounded-lg font-black text-[10px] uppercase" onClick={() => approvePending(r.MaPDG)}>Duyệt</Button><Button danger size="small" className="rounded-lg font-black text-[10px] uppercase" onClick={() => rejectPending(r.MaPDG)}>Từ chối</Button></div> }
          ]}
        />
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #94a3b8 !important; font-size: 11px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; padding: 20px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .modern-table .ant-table-tbody > tr > td { padding: 16px 24px !important; border-bottom: 1px solid #f8fafc !important; }
        .modern-modal .ant-modal-content { border-radius: 40px !important; padding: 40px !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important; }
        .modern-select .ant-select-selector { border-radius: 12px !important; height: 48px !important; display: flex !important; align-items: center !important; background: #f8fafc !important; border-color: #f1f5f9 !important; font-weight: 700 !important; }
      `}} />
    </div>
  );
};

export default CustomerManagement;