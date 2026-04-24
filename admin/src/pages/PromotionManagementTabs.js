import React, { useEffect, useState } from 'react';
import {
  Tabs,
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
  Badge,
  InputNumber,
  Switch,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  GiftOutlined,
  SendOutlined,
  UserOutlined,
  TagsOutlined,
  FormOutlined,
  BarChartOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text } = Typography;

/**
 * =====================================================
 * TAB 1: QUẢN LÝ COUPON (PHIẾU GIẢM GIÁ)
 * =====================================================
 */
const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('add');
  const [form] = Form.useForm();
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchCoupons();
    fetchCustomers();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await api.get('/coupons/admin/all');
      setCoupons(response.data.data || []);
    } catch (error) {
      message.error('Lỗi khi tải danh sách coupon');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/client/customers');
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleShowForm = (type, data = null) => {
    setFormType(type);
    if (type === 'edit' && data) {
      form.setFieldsValue({
        ...data,
        NgayHetHan: data.NgayHetHan ? dayjs(data.NgayHetHan) : null
      });
    } else {
      form.resetFields();
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.NgayHetHan = values.NgayHetHan ? values.NgayHetHan.format('YYYY-MM-DD HH:mm:ss') : null;

      if (formType === 'add') {
        await api.post('/coupons/admin/create', {
          maPhieu: values.MaPhieu,
          moTa: values.MoTa,
          loaiGiamGia: values.LoaiGiamGia,
          giaTriGiam: values.GiaTriGiam,
          ngayHetHan: values.NgayHetHan,
          soLanSuDungToiDa: values.SoLanSuDungToiDa,
          trangThai: values.TrangThai ? 1 : 0
        });
        message.success('Tạo coupon thành công!');
      } else {
        await api.put(`/coupons/admin/${values.MaPhieu}`, {
          moTa: values.MoTa,
          loaiGiamGia: values.LoaiGiamGia,
          giaTriGiam: values.GiaTriGiam,
          ngayHetHan: values.NgayHetHan,
          soLanSuDungToiDa: values.SoLanSuDungToiDa,
          trangThai: values.TrangThai ? 1 : 0
        });
        message.success('Cập nhật coupon thành công!');
      }

      setShowForm(false);
      fetchCoupons();
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = (code) => {
    Modal.confirm({
      title: 'Xác nhận xóa coupon?',
      icon: <ExclamationCircleFilled />,
      content: 'Dữ liệu phát hành sẽ bị ảnh hưởng.',
      okText: 'Xóa ngay',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/coupons/admin/${code}`);
          fetchCoupons();
          message.success('Đã xóa coupon');
        } catch (e) { message.error('Lỗi'); }
      }
    });
  };

  const handleIssueCoupon = async (values) => {
    try {
      const payload = values.issueToAll ? { issueToAll: true } : { makhList: values.makhList };
      await api.post(`/coupons/admin/${selectedCoupon.MaPhieu}/issue`, payload);
      message.success('Phát coupon thành công!');
      setShowIssueModal(false);
      fetchCoupons();
    } catch (error) { message.error('Lỗi khi phát coupon'); }
  };

  const couponColumns = [
    {
      title: 'MÃ PHIẾU',
      key: 'code',
      width: 150,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px]">
            %
          </div>
          <span className="font-black text-slate-700 tracking-tight">{record.MaPhieu}</span>
        </div>
      )
    },
    {
      title: 'LOẠI GIẢM GIÁ',
      dataIndex: 'LoaiGiamGia',
      key: 'type',
      width: 150,
      render: (type) => {
        const colors = { FREESHIP: 'bg-orange-100 text-orange-600', PERCENT: 'bg-blue-100 text-blue-600', AMOUNT: 'bg-emerald-100 text-emerald-600' };
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[type] || 'bg-slate-100'}`}>{type}</span>;
      }
    },
    {
      title: 'GIÁ TRỊ',
      key: 'value',
      width: 120,
      render: (_, record) => {
        let val = '';
        if (record.LoaiGiamGia === 'FREESHIP') val = 'FREE';
        else if (record.LoaiGiamGia === 'PERCENT') val = `${record.GiaTriGiam}%`;
        else val = `${record.GiaTriGiam?.toLocaleString()}đ`;
        return <span className="font-black text-slate-800">{val}</span>;
      }
    },
    {
      title: 'TÌNH TRẠNG',
      key: 'stats',
      width: 180,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>ĐÃ DÙNG</span>
            <span>{record.DaSuDung || 0} / {record.TongPhatHanh || 0}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${Math.min(((record.DaSuDung || 0) / (record.TongPhatHanh || 1)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      title: 'HẾT HẠN',
      dataIndex: 'NgayHetHan',
      key: 'expiry',
      width: 150,
      render: (date) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-600">{date ? dayjs(date).format('DD/MM/YYYY') : 'Vô thời hạn'}</span>
          <span className="text-[9px] text-slate-400 font-black uppercase">{date ? dayjs(date).format('HH:mm') : '-'}</span>
        </div>
      )
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Phát hành">
            <Button size="small" className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-600 text-white border-0" icon={<SendOutlined />} onClick={() => handleShowIssueModal(record)} />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button size="small" className="w-8 h-8 rounded-lg flex items-center justify-center" icon={<EditOutlined />} onClick={() => handleShowForm('edit', record)} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button size="small" danger className="w-8 h-8 rounded-lg flex items-center justify-center" icon={<DeleteOutlined />} onClick={() => handleDelete(record.MaPhieu)} />
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 text-slate-50 text-8xl material-icons">local_offer</div>
          <Statistic title={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng số Coupon</span>} value={coupons.length} valueStyle={{ fontWeight: 900 }} />
        </Card>
        <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 text-emerald-50 text-8xl material-icons">check_circle</div>
          <Statistic title={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang kích hoạt</span>} value={coupons.filter(c => c.TrangThai === 1).length} valueStyle={{ fontWeight: 900, color: '#10b981' }} />
        </Card>
        <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 text-indigo-50 text-8xl material-icons">send</div>
          <Statistic title={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lượt phát hành</span>} value={coupons.reduce((sum, c) => sum + (c.TongPhatHanh || 0), 0)} valueStyle={{ fontWeight: 900, color: '#6366f1' }} />
        </Card>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            Danh sách chiến dịch
          </h3>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleShowForm('add')} className="h-10 px-6 rounded-xl bg-indigo-600 border-0 font-bold">Tạo Coupon</Button>
        </div>
        <Table columns={couponColumns} dataSource={coupons} rowKey="MaPhieu" loading={loading} className="modern-table" pagination={{ pageSize: 5 }} />
      </div>

      <Modal open={showForm} title={null} onCancel={() => setShowForm(false)} onOk={handleSubmit} width={600} className="modern-modal" centered>
        <div className="mb-6"><h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><GiftOutlined className="text-indigo-500" /> {formType === 'add' ? 'Thiết lập Coupon mới' : 'Cập nhật Coupon'}</h2></div>
        <Form form={form} layout="vertical" className="space-y-4">
          <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã định danh</span>} name="MaPhieu" rules={[{ required: true }]}>
            <Input className="h-11 rounded-xl font-black" placeholder="VD: SUMMERSALE2025" disabled={formType === 'edit'} />
          </Form.Item>
          <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả chương trình</span>} name="MoTa"><Input.TextArea rows={2} className="rounded-xl" /></Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại ưu đãi</span>} name="LoaiGiamGia" rules={[{ required: true }]}>
              <Select className="h-11 modern-select"><Option value="FREESHIP">Freeship</Option><Option value="PERCENT">Giảm phần trăm</Option><Option value="AMOUNT">Giảm trực tiếp</Option></Select>
            </Form.Item>
            <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá trị</span>} name="GiaTriGiam" rules={[{ required: true }]}><InputNumber className="w-full h-11 rounded-xl flex items-center" min={0} /></Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời hạn</span>} name="NgayHetHan"><DatePicker className="w-full h-11 rounded-xl" showTime format="DD/MM/YYYY HH:mm" /></Form.Item>
            <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giới hạn sử dụng</span>} name="SoLanSuDungToiDa" initialValue={1}><InputNumber className="w-full h-11 rounded-xl flex items-center" min={1} /></Form.Item>
          </div>
          <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kích hoạt</span>} name="TrangThai" valuePropName="checked" initialValue={true}><Switch /></Form.Item>
        </Form>
      </Modal>

      <Modal open={showIssueModal} title={null} onCancel={() => setShowIssueModal(false)} footer={null} width={500} className="modern-modal" centered>
        <div className="mb-6"><h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><SendOutlined className="text-indigo-500" /> Phát hành Coupon</h2><p className="text-slate-400 text-xs font-medium uppercase mt-1">Mã: {selectedCoupon?.MaPhieu}</p></div>
        <Form onFinish={handleIssueCoupon} layout="vertical" className="space-y-6">
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
            <div><h4 className="text-sm font-black text-slate-800">Gửi cho toàn bộ khách hàng?</h4><p className="text-[10px] text-slate-400 font-bold uppercase">Tự động áp dụng cho tất cả tài khoản</p></div>
            <Form.Item name="issueToAll" valuePropName="checked" noStyle><Switch /></Form.Item>
          </div>
          <Form.Item noStyle shouldUpdate>{({ getFieldValue }) => !getFieldValue('issueToAll') && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Danh sách khách hàng mục tiêu</label>
              <Form.Item name="makhList" rules={[{ required: true, message: 'Chọn ít nhất 1 khách hàng' }]} noStyle>
                <Select mode="multiple" className="w-full modern-select" placeholder="Chọn khách hàng..." options={customers.map(c => ({ label: `${c.tenkh} - ${c.email}`, value: c.makh }))} />
              </Form.Item>
            </div>
          )}</Form.Item>
          <Button type="primary" htmlType="submit" block className="h-12 rounded-2xl bg-indigo-600 border-0 font-black uppercase tracking-widest text-xs">Xác nhận phát hành</Button>
        </Form>
      </Modal>
    </div>
  );
};

/**
 * =====================================================
 * TAB 2: QUẢN LÝ FORM SỞ THÍCH
 * =====================================================
 */
const PreferenceFormManagement = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [responses, setResponses] = useState([]);

  useEffect(() => { fetchForms(); }, []);
  const fetchForms = async () => { setLoading(true); try { const response = await api.get('/preferences/admin/forms'); setForms(response.data.data || []); } catch (error) { message.error('Lỗi khi tải danh sách form'); } finally { setLoading(false); } };
  const fetchResponses = async (formId) => { try { const response = await api.get(`/preferences/admin/forms/${formId}/responses`); setResponses(response.data.data || []); } catch (error) { message.error('Lỗi khi tải phản hồi'); } };

  const formColumns = [
    { title: 'TÊN CHIẾN DỊCH', dataIndex: 'TenForm', key: 'name', render: (t) => <span className="font-black text-slate-700">{t}</span> },
    { title: 'CÂU HỎI', dataIndex: 'SoCauHoi', key: 'questions', width: 100, align: 'center', render: (n) => <span className="font-bold text-slate-500">{n || 0}</span> },
    { title: 'PHẢN HỒI', dataIndex: 'SoPhanHoi', key: 'responses', width: 100, align: 'center', render: (n) => <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-black">{n || 0}</span> },
    { title: 'TRẠNG THÁI', dataIndex: 'TrangThai', key: 'status', width: 150, render: (s) => <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>{s ? 'Đang mở' : 'Đã đóng'}</span> },
    {
      title: 'THAO TÁC', key: 'action', width: 120, render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" className="w-8 h-8 rounded-lg flex items-center justify-center" icon={<EyeOutlined />} onClick={() => { setSelectedForm(record); setShowDetail(true); fetchResponses(record.MaForm); }} />
          <Button size="small" className={`w-8 h-8 rounded-lg flex items-center justify-center border-0 ${record.TrangThai ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`} icon={<BarChartOutlined />} onClick={async () => {
            try { await api.put(`/preferences/admin/forms/${record.MaForm}`, { trangThai: record.TrangThai ? 0 : 1 }); fetchForms(); message.success('Cập nhật thành công'); } catch (e) { message.error('Lỗi'); }
          }} />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Hiệu suất thu thập</h4>
            <div className="text-4xl font-black mt-2">{forms.reduce((sum, f) => sum + (f.SoPhanHoi || 0), 0)}</div>
            <p className="text-xs font-medium text-indigo-100 mt-1">Tổng số phản hồi từ người dùng</p>
          </div>
          <span className="material-icons absolute -right-6 -bottom-6 text-[12rem] opacity-10">poll</span>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chiến dịch đang chạy</h4><div className="text-4xl font-black text-slate-800 mt-2">{forms.filter(f => f.TrangThai === 1).length}</div></div>
          <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center"><FormOutlined style={{ fontSize: '24px' }} /></div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table columns={formColumns} dataSource={forms} rowKey="MaForm" loading={loading} className="modern-table" pagination={{ pageSize: 5 }} />
      </div>

      <Modal open={showDetail} title={null} onCancel={() => setShowDetail(false)} footer={null} width={800} className="modern-modal" centered>
        <div className="mb-8"><h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><span className="material-icons text-indigo-500">analytics</span> Phân tích Phản hồi</h2><p className="text-slate-400 text-sm font-medium mt-1">Chiến dịch: {selectedForm?.TenForm}</p></div>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="rounded-2xl bg-slate-50 border-0"><Statistic title="Số câu hỏi" value={selectedForm?.SoCauHoi || 0} valueStyle={{ fontWeight: 900 }} /></Card>
            <Card className="rounded-2xl bg-slate-50 border-0"><Statistic title="Số phản hồi" value={selectedForm?.SoPhanHoi || 0} valueStyle={{ fontWeight: 900, color: '#10b981' }} /></Card>
            <Card className="rounded-2xl bg-slate-50 border-0"><Statistic title="Tỷ lệ hoàn thành" value="85%" valueStyle={{ fontWeight: 900, color: '#6366f1' }} /></Card>
          </div>
          <Divider className="my-2" />
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Người dùng tham gia gần đây</h4>
          <Table 
            columns={[{ title: 'KHÁCH HÀNG', dataIndex: 'tenkh', key: 'name', render: (t) => <span className="font-bold text-slate-700">{t}</span> }, { title: 'EMAIL', dataIndex: 'email', key: 'email' }, { title: 'THỜI GIAN', dataIndex: 'NgayPhanHoi', key: 'time', render: (d) => <span className="text-xs text-slate-400 font-medium">{dayjs(d).format('DD/MM/YYYY HH:mm')}</span> }]}
            dataSource={responses} rowKey="MaPhanHoi" pagination={{ pageSize: 5 }} size="small" className="modern-table"
          />
        </div>
      </Modal>
    </div>
  );
};

const PromotionManagementTabs = () => {
  const [activeTab, setActiveTab] = useState('coupons');
  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="mb-8 flex items-center justify-between">
        <div><h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><span className="material-icons text-indigo-500">card_giftcard</span> Marketing & Khuyến mãi</h1><p className="text-slate-400 text-sm mt-1 font-medium">Tối ưu hóa doanh thu và giữ chân khách hàng</p></div>
      </div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="modern-main-tabs" items={[{ key: 'coupons', label: <span className="flex items-center gap-2 px-4 py-2 font-black uppercase text-[10px] tracking-widest"><TagsOutlined /> Coupon & Voucher</span>, children: <CouponManagement /> }, { key: 'preferences', label: <span className="flex items-center gap-2 px-4 py-2 font-black uppercase text-[10px] tracking-widest"><FormOutlined /> Khảo sát sở thích</span>, children: <PreferenceFormManagement /> }]} />
      <style dangerouslySetInnerHTML={{ __html: `
        .modern-main-tabs .ant-tabs-nav::before { border-bottom: 2px solid #f1f5f9 !important; }
        .modern-main-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #4f46e5 !important; }
        .modern-main-tabs .ant-tabs-ink-bar { background: #4f46e5 !important; height: 3px !important; border-radius: 3px 3px 0 0; }
        .modern-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #94a3b8 !important; font-size: 11px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; padding: 16px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .modern-table .ant-table-tbody > tr > td { padding: 16px 24px !important; border-bottom: 1px solid #f8fafc !important; }
        .modern-modal .ant-modal-content { border-radius: 40px !important; padding: 40px !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important; }
        .modern-select .ant-select-selector { border-radius: 12px !important; height: 44px !important; display: flex !important; align-items: center !important; }
      `}} />
    </div>
  );
};

export default PromotionManagementTabs;
