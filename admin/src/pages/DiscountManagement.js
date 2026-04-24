import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Modal, 
  Form, 
  Select, 
  Tag, 
  Space, 
  message, 
  DatePicker, 
  Card, 
  Row, 
  Col, 
  Tooltip, 
  Typography, 
  Divider, 
  Spin, 
  Tabs, 
  Switch, 
  Statistic,
  Avatar,
  Badge,
  Timeline
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  SyncOutlined, 
  SearchOutlined, 
  GiftOutlined, 
  CalendarOutlined, 
  PercentageOutlined, 
  DollarOutlined, 
  TagOutlined, 
  TagsOutlined, 
  FormOutlined, 
  BarChartOutlined, 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  DownloadOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  SolutionOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text } = Typography;

const DiscountManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // API Config
  const apiBase = process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com';
  const getAuthHeader = () => ({ Authorization: `Bearer ${(document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null)}` });

  useEffect(() => {
    fetchPromotions();
  }, [searchTerm]);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBase}/api/khuyenmai?search=${encodeURIComponent(searchTerm)}`, { headers: getAuthHeader() });
      let data = response.data?.data?.data || response.data?.data || response.data || [];
      if (typeof data === 'object' && !Array.isArray(data) && data.data) data = data.data;
      const list = Array.isArray(data) ? data : [];
      setPromotions(list);
      setStats({
        total: list.length,
        active: list.filter(p => Number(p.TrangThai) === 1).length,
        inactive: list.filter(p => Number(p.TrangThai) === 0).length
      });
    } catch (err) { message.error('Lỗi tải dữ liệu'); }
    finally { setLoading(false); }
  };

  const columns = [
    {
      title: 'KHUYẾN MÃI',
      key: 'promo',
      fixed: 'left',
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <GiftOutlined className="text-xl" />
          </div>
          <div className="truncate">
            <div className="font-black text-slate-800 leading-tight truncate">{record.TenKM}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Mã: {record.Code}</div>
          </div>
        </div>
      )
    },
    {
      title: 'HÌNH THỨC',
      dataIndex: 'LoaiKM',
      key: 'type',
      width: 150,
      render: (v) => <Tag className="rounded-full px-3 font-black text-[10px] uppercase tracking-widest border-0 bg-slate-100 text-slate-600">{v}</Tag>
    },
    {
      title: 'GIÁ TRỊ',
      key: 'value',
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-black text-indigo-600 text-base">-{record.GiaTriGiam?.toLocaleString()}{record.LoaiKM === 'PHAN_TRAM' ? '%' : 'đ'}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase">Tối đa {record.GiamToiDa?.toLocaleString()}đ</span>
        </div>
      )
    },
    {
      title: 'THỜI HẠN',
      key: 'period',
      width: 200,
      render: (_, record) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter"><CalendarOutlined /> {dayjs(record.NgayBatDau).format('DD/MM/YYYY')}</div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400 uppercase tracking-tighter"><CalendarOutlined /> {dayjs(record.NgayKetThuc).format('DD/MM/YYYY')}</div>
        </div>
      )
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'TrangThai',
      key: 'status',
      width: 150,
      render: (v) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${Number(v) === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
          {Number(v) === 1 ? 'ĐANG CHẠY' : 'TẠM NGỪNG'}
        </span>
      )
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Chi tiết">
            <Button className="w-10 h-10 rounded-xl flex items-center justify-center border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 border-0 hover:bg-indigo-100 transition-all" icon={<EditOutlined />} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 border-0 hover:bg-rose-100 transition-all" icon={<DeleteOutlined />} />
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
            <TagsOutlined className="text-indigo-500" />
            Chiến dịch Ưu đãi
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-tighter">Quản lý khuyến mãi, Coupons và Khảo sát khách hàng</p>
        </div>
        
        <div className="flex gap-3">
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchPromotions} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border-0 shadow-sm text-slate-600" />
          <Button type="primary" icon={<PlusOutlined />} className="h-12 px-8 rounded-2xl bg-indigo-600 border-0 shadow-lg shadow-indigo-100 font-bold flex items-center gap-2 uppercase text-xs tracking-widest">Tạo mới</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-[2.5rem] border-0 shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative overflow-hidden">
          <Statistic title={<span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Tổng chiến dịch</span>} value={stats.total} valueStyle={{ color: 'white', fontWeight: 900 }} prefix={<TagsOutlined />} />
          <TagsOutlined className="absolute -right-4 -bottom-4 text-8xl text-white/10" />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm">
          <Statistic title={<span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Đang hoạt động</span>} value={stats.active} valueStyle={{ fontWeight: 900, color: '#10b981' }} prefix={<CheckCircleOutlined />} />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm">
          <Statistic title={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngừng kích hoạt</span>} value={stats.inactive} valueStyle={{ fontWeight: 900, color: '#94a3b8' }} prefix={<CloseCircleOutlined />} />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm bg-amber-50">
          <Statistic title={<span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Coupon phát hành</span>} value={1250} valueStyle={{ fontWeight: 900, color: '#d97706' }} prefix={<GiftOutlined />} />
        </Card>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          className="modern-tabs px-8 pt-4"
          items={[
            { key: '1', label: <span className="px-4 py-2 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><PercentageOutlined /> Khuyến mãi</span> },
            { key: '2', label: <span className="px-4 py-2 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><GiftOutlined /> Coupons</span> },
            { key: '3', label: <span className="px-4 py-2 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><FormOutlined /> Khảo sát</span> },
            { key: '4', label: <span className="px-4 py-2 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><UserOutlined /> Phản hồi</span> }
          ]}
        />
        
        <div className="p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
              <Input 
                placeholder="Tìm kiếm ưu đãi, mã giảm giá..." 
                className="h-12 pl-12 rounded-2xl bg-slate-50 border-0 font-bold" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="flex gap-2">
              <Button icon={<DownloadOutlined />} className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest border-slate-100">Xuất báo cáo</Button>
            </div>
          </div>

          <Table columns={columns} dataSource={promotions} rowKey="MaKM" loading={loading} pagination={{ pageSize: 8 }} className="modern-table" scroll={{ x: 1000 }} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #94a3b8 !important; font-size: 11px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; padding: 20px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .modern-table .ant-table-tbody > tr > td { padding: 16px 24px !important; border-bottom: 1px solid #f8fafc !important; }
        .modern-tabs .ant-tabs-nav::before { border-bottom: 1px solid #f1f5f9 !important; }
        .modern-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #4f46e5 !important; }
        .modern-tabs .ant-tabs-ink-bar { background: #4f46e5 !important; height: 3px !important; border-radius: 3px 3px 0 0 !important; }
      `}} />
    </div>
  );
};

export default DiscountManagement;