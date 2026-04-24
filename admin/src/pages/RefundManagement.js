import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';
import { 
  Table, 
  Button, 
  Modal, 
  Input, 
  Select, 
  Tag, 
  Space, 
  Card, 
  Statistic, 
  Tooltip, 
  Divider, 
  message, 
  Badge,
  Avatar
} from 'antd';
import { 
  UndoOutlined, 
  SyncOutlined, 
  DownloadOutlined, 
  SearchOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WalletOutlined, 
  EyeOutlined,
  LoadingOutlined,
  DollarOutlined,
  UserOutlined,
  BankOutlined,
  FileTextOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import moment from 'moment';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
const { Option } = Select;

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState({ total: 0, totalAmount: 0, pending: 0, processing: 0, completed: 0, rejected: 0 });
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [processModal, setProcessModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processForm, setProcessForm] = useState({ action: '', adminReason: '', actualRefundAmount: '', transactionId: '' });

  useEffect(() => {
    fetchRefunds();
  }, [statusFilter]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await api.get('/refunds/admin/list', { params: { status: statusFilter === 'all' ? undefined : statusFilter } });
      if (res.data.success) {
        setRefunds(res.data.data.refunds || []);
        setSummary(res.data.data.summary || summary);
      }
    } catch (error) { message.error('Lỗi tải dữ liệu hoàn tiền'); }
    finally { setLoading(false); }
  };

  const handleProcess = async () => {
    if (!processForm.action) return message.warning('Vui lòng chọn hành động');
    if (processForm.action === 'complete' && !processForm.transactionId) return message.warning('Vui lòng nhập mã giao dịch');
    
    try {
      setProcessing(true);
      const response = await axios.put(
        `${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/orders/refund-requests/${selectedRefund.id}/process`,
        processForm,
        {
          headers: {
            Authorization: `Bearer ${(document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null)}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.success) {
        message.success('Xử lý hoàn tiền thành công');
        setProcessModal(false);
        fetchRefunds();
      }
    } catch (error) { message.error(error.response?.data?.error || 'Lỗi xử lý'); }
    finally { setProcessing(false); }
  };

  const columns = [
    {
      title: 'MÃ YÊU CẦU',
      dataIndex: 'refundRequestId',
      key: 'id',
      fixed: 'left',
      width: 150,
      render: (t) => <span className="font-black text-slate-400">#{t}</span>
    },
    {
      title: 'KHÁCH HÀNG',
      key: 'customer',
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-indigo-50 text-indigo-600 font-bold" icon={<UserOutlined />} />
          <div>
            <div className="font-black text-slate-800 leading-tight truncate max-w-[150px]">{record.customerName}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{record.customerPhone}</div>
          </div>
        </div>
      )
    },
    {
      title: 'ĐƠN HÀNG',
      dataIndex: 'orderId',
      key: 'order',
      width: 120,
      render: (t) => <Tag className="m-0 font-black text-[10px] rounded-lg">ĐƠN #{t}</Tag>
    },
    {
      title: 'SỐ TIỀN HOÀN',
      dataIndex: 'refundAmount',
      key: 'amount',
      width: 150,
      render: (v) => <span className="font-black text-rose-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)}</span>
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (v) => {
        const config = {
          PENDING: { color: 'gold', label: 'CHỜ DUYỆT' },
          PROCESSING: { color: 'blue', label: 'ĐANG XỬ LÝ' },
          COMPLETED: { color: 'green', label: 'HOÀN TẤT' },
          REJECTED: { color: 'red', label: 'TỪ CHỐI' }
        };
        const c = config[v] || { color: 'default', label: v };
        return <Tag color={c.color} className="font-black text-[10px] rounded-full px-3">{c.label}</Tag>;
      }
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Xem chi tiết">
            <Button className="w-10 h-10 rounded-xl flex items-center justify-center border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all" icon={<EyeOutlined />} onClick={() => { setSelectedRefund(record); setDetailModal(true); }} />
          </Tooltip>
          {record.status === 'PENDING' && (
            <div className="flex gap-1">
              <Button type="primary" size="small" className="bg-emerald-600 border-0 rounded-lg font-black text-[10px]" onClick={() => { setSelectedRefund(record); setProcessForm({ action: 'approve', actualRefundAmount: record.refundAmount }); setProcessModal(true); }}>DUYỆT</Button>
              <Button danger size="small" className="rounded-lg font-black text-[10px]" onClick={() => { setSelectedRefund(record); setProcessForm({ action: 'reject' }); setProcessModal(true); }}>HỦY</Button>
            </div>
          )}
          {record.status === 'PROCESSING' && (
            <Button type="primary" size="small" className="bg-indigo-600 border-0 rounded-lg font-black text-[10px]" onClick={() => { setSelectedRefund(record); setProcessForm({ action: 'complete', actualRefundAmount: record.refundAmount }); setProcessModal(true); }}>HOÀN TIỀN</Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <UndoOutlined className="text-indigo-500" />
            Quản lý Hoàn tiền
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-tighter">Xử lý yêu cầu trả hàng & hoàn tiền VNPay</p>
        </div>
        
        <div className="flex gap-3">
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchRefunds} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border-0 shadow-sm text-slate-600" />
          <Button icon={<DownloadOutlined />} className="h-12 px-6 rounded-2xl bg-indigo-600 border-0 shadow-lg shadow-indigo-100 text-white font-bold flex items-center gap-2">Xuất báo cáo</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-[2.5rem] border-0 shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative overflow-hidden">
          <Statistic title={<span className="text-[10px] font-black text-indigo-100 uppercase">Tổng tiền hoàn</span>} value={summary.totalAmount || 0} valueStyle={{ color: 'white', fontWeight: 900 }} prefix={<DollarOutlined />} suffix="đ" />
          <WalletOutlined className="absolute -right-4 -bottom-4 text-8xl text-white/10" />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm">
          <Statistic title={<span className="text-[10px] font-black text-amber-500 uppercase">Đang chờ xử lý</span>} value={summary.pending || 0} valueStyle={{ fontWeight: 900, color: '#f59e0b' }} prefix={<ClockCircleOutlined />} />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm">
          <Statistic title={<span className="text-[10px] font-black text-blue-500 uppercase">Đang thực hiện</span>} value={summary.processing || 0} valueStyle={{ fontWeight: 900, color: '#3b82f6' }} prefix={<LoadingOutlined />} />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm">
          <Statistic title={<span className="text-[10px] font-black text-emerald-500 uppercase">Đã hoàn tất</span>} value={summary.completed || 0} valueStyle={{ fontWeight: 900, color: '#10b981' }} prefix={<CheckCircleOutlined />} />
        </Card>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <Input placeholder="Tìm theo mã đơn, mã yêu cầu hoặc khách hàng..." className="h-12 pl-12 pr-4 w-full rounded-2xl border-slate-100 bg-slate-50 font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="md:col-span-4">
            <Select className="w-full h-12 modern-select" value={statusFilter} onChange={setStatusFilter}>
              <Option value="all">TẤT CẢ TRẠNG THÁI</Option>
              <Option value="PENDING">ĐANG CHỜ DUYỆT</Option>
              <Option value="PROCESSING">ĐANG XỬ LÝ</Option>
              <Option value="COMPLETED">ĐÃ HOÀN TẤT</Option>
              <Option value="REJECTED">ĐÃ TỪ CHỐI</Option>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table columns={columns} dataSource={refunds.filter(r => r.orderId?.toString().includes(searchTerm) || r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()))} rowKey="id" loading={loading} pagination={{ pageSize: 8, className: "px-8 py-6" }} className="modern-table" scroll={{ x: 1000 }} />
      </div>

      <Modal open={detailModal} onCancel={() => setDetailModal(false)} footer={null} width={800} className="modern-modal" centered title={null}>
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><FileTextOutlined /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Chi tiết Yêu cầu Hoàn tiền</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-tight">Mã định danh: #{selectedRefund?.refundRequestId}</p>
          </div>
        </div>
        
        {selectedRefund && (
          <div className="space-y-8">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 grid grid-cols-2 gap-8">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Thông tin tài khoản nhận</span>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><BankOutlined /></div>
                  <div>
                    <div className="font-black text-slate-800">{selectedRefund.bankName}</div>
                    <div className="text-sm font-bold text-slate-600">{selectedRefund.bankAccount}</div>
                    <div className="text-xs font-medium text-slate-400">{selectedRefund.accountHolder}</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Số tiền đề xuất hoàn</span>
                <div className="text-3xl font-black text-rose-500">{formatPrice(selectedRefund.refundAmount)}</div>
                <Tag color="purple" className="mt-2 font-black rounded-lg uppercase text-[9px]">{selectedRefund.refundType === 'full' ? 'HOÀN TOÀN BỘ' : 'HOÀN MỘT PHẦN'}</Tag>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Lý do từ khách hàng</span>
              <p className="text-sm font-medium text-slate-600 italic leading-relaxed">"{selectedRefund.refundReason}"</p>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-8">
              <div className="text-center p-4 bg-slate-50 rounded-2xl">
                <span className="text-[9px] font-black text-slate-400 uppercase block">Mã Đơn hàng</span>
                <span className="font-black text-slate-700">#{selectedRefund.orderId}</span>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-2xl">
                <span className="text-[9px] font-black text-slate-400 uppercase block">Thời gian tạo</span>
                <span className="font-black text-slate-700">{moment(selectedRefund.createdAt).format('DD/MM/YYYY')}</span>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-2xl">
                <span className="text-[9px] font-black text-slate-400 uppercase block">Trạng thái</span>
                <span className="font-black text-indigo-600">{selectedRefund.status}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={processModal} onCancel={() => setProcessModal(false)} footer={null} width={550} className="modern-modal" centered title={null}>
        <div className="mb-8"><h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><ThunderboltOutlined className="text-amber-500" /> Quyết định Xử lý</h2><p className="text-slate-400 text-sm mt-1 font-medium">Hành động này sẽ cập nhật trạng thái yêu cầu của khách hàng</p></div>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Số tiền phê duyệt (VND)</label>
            <Input className="h-12 rounded-xl font-black text-lg text-indigo-600" value={processForm.actualRefundAmount} onChange={e => setProcessForm({...processForm, actualRefundAmount: e.target.value})} disabled={processForm.action === 'reject'} />
          </div>
          {processForm.action === 'complete' && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Mã giao dịch hoàn tiền</label>
              <Input className="h-12 rounded-xl font-black" placeholder="Nhập mã giao dịch VNPay/Ngân hàng" value={processForm.transactionId} onChange={e => setProcessForm({...processForm, transactionId: e.target.value})} />
            </div>
          )}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Ghi chú từ quản trị viên</label>
            <Input.TextArea rows={3} className="rounded-xl p-4 font-medium" placeholder="Lý do phê duyệt hoặc từ chối..." value={processForm.adminReason} onChange={e => setProcessForm({...processForm, adminReason: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button onClick={() => setProcessModal(false)} className="h-12 px-8 rounded-2xl font-bold">Quay lại</Button>
            <Button type="primary" onClick={handleProcess} loading={processing} className={`h-12 px-12 rounded-2xl font-black uppercase tracking-widest text-xs border-0 shadow-lg ${processForm.action === 'reject' ? 'bg-rose-600' : 'bg-indigo-600'}`}>Xác nhận {processForm.action === 'reject' ? 'Từ chối' : 'Phê duyệt'}</Button>
          </div>
        </div>
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

export default RefundManagement;