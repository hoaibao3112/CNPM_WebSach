import React, { useEffect, useState, useContext } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, message, Tag, Space, Select, Avatar, Card, Statistic, Divider, Tooltip } from 'antd';
import api from '../utils/api';
import moment from 'moment';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  PlusOutlined, 
  CalendarOutlined, 
  FilterOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { PermissionContext } from '../components/PermissionContext';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const LeavePage = () => {
  const { hasPermission } = useContext(PermissionContext);
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchLeave = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leave');
      const list = Array.isArray(res.data.data) ? res.data.data : (res.data || []);
      setData(list.sort((a, b) => b.id - a.id));
    } catch { message.error('Lỗi khi tải dữ liệu nghỉ phép'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (hasPermission('Nghĩ Phép', 'Đọc')) fetchLeave();
  }, [hasPermission]);

  const handleAction = async (id, action) => {
    if (!hasPermission('Nghĩ Phép', 'Sửa')) return message.error('Không có quyền!');
    setProcessingId(id);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      await api.put(`/leave/${id}/${action}`, { nguoi_duyet: userInfo.TenTK || 'admin' });
      message.success(`Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} đơn`);
      fetchLeave();
    } catch { message.error('Thao tác thất bại'); }
    finally { setProcessingId(null); }
  };

  const columns = [
    {
      title: 'NHÂN VIÊN',
      key: 'employee',
      fixed: 'left',
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-indigo-100 text-indigo-600 font-bold" icon={<UserOutlined />} />
          <div className="truncate">
            <div className="font-black text-slate-800 leading-tight truncate">{record.TenTK}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">ID: #{record.MaTK}</div>
          </div>
        </div>
      )
    },
    {
      title: 'THỜI GIAN',
      key: 'period',
      width: 280,
      render: (_, record) => {
        const days = moment(record.ngay_ket_thuc).diff(moment(record.ngay_bat_dau), 'days') + 1;
        return (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase">Từ {moment(record.ngay_bat_dau).format('DD/MM/YYYY')}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase">Đến {moment(record.ngay_ket_thuc).format('DD/MM/YYYY')}</span>
            </div>
            <Tag color="purple" className="m-0 px-3 py-0.5 rounded-full font-black text-[10px]">{days} NGÀY</Tag>
          </div>
        );
      }
    },
    {
      title: 'LÝ DO',
      dataIndex: 'ly_do',
      key: 'reason',
      width: 200,
      ellipsis: true,
      render: (t) => <span className="text-sm font-medium text-slate-600">{t}</span>
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'trang_thai',
      key: 'status',
      width: 150,
      render: (v) => {
        const config = {
          Da_duyet: { color: 'bg-emerald-100 text-emerald-600', label: 'ĐÃ DUYỆT', icon: <CheckCircleOutlined /> },
          Tu_choi: { color: 'bg-rose-100 text-rose-600', label: 'TỪ CHỐI', icon: <CloseCircleOutlined /> },
          Cho_duyet: { color: 'bg-amber-100 text-amber-600', label: 'CHỜ DUYỆT', icon: <ClockCircleOutlined /> }
        };
        const c = config[v] || config.Cho_duyet;
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 w-fit ${c.color}`}>{c.icon} {c.label}</span>;
      }
    },
    {
      title: 'PHÊ DUYỆT BỞI',
      key: 'approver',
      width: 200,
      render: (_, record) => record.nguoi_duyet ? (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-700">{record.nguoi_duyet}</span>
          <span className="text-[9px] font-black text-slate-400 uppercase">{moment(record.ngay_duyet).format('DD/MM/YYYY HH:mm')}</span>
        </div>
      ) : <span className="text-slate-300">---</span>
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => record.trang_thai === 'Cho_duyet' && (
        <div className="flex gap-2">
          <Tooltip title="Chấp thuận">
            <Button className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 transition-all" icon={<CheckCircleOutlined />} onClick={() => handleAction(record.id, 'approve')} loading={processingId === record.id} />
          </Tooltip>
          <Tooltip title="Từ chối">
            <Button className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 transition-all" icon={<CloseCircleOutlined />} onClick={() => handleAction(record.id, 'reject')} loading={processingId === record.id} />
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
            <CalendarOutlined className="text-indigo-500" />
            Đơn xin nghỉ phép
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-tighter">Quản lý và phê duyệt thời gian vắng mặt</p>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setOpen(true)}
          className="h-12 px-8 rounded-2xl bg-indigo-600 border-0 shadow-lg shadow-indigo-100 font-bold flex items-center gap-2"
        >
          Gửi đơn mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="rounded-[2rem] border-0 shadow-sm bg-amber-50/50 overflow-hidden relative">
          <div className="relative z-10">
            <Statistic title={<span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Đang chờ duyệt</span>} value={data.filter(d => d.trang_thai === 'Cho_duyet').length} valueStyle={{ fontWeight: 900, color: '#d97706' }} prefix={<ClockCircleOutlined className="mr-2" />} />
          </div>
          <ClockCircleOutlined className="absolute -right-4 -bottom-4 text-8xl text-amber-500/10" />
        </Card>
        <Card className="rounded-[2rem] border-0 shadow-sm bg-emerald-50/50 overflow-hidden relative">
          <div className="relative z-10">
            <Statistic title={<span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Đã chấp thuận</span>} value={data.filter(d => d.trang_thai === 'Da_duyet').length} valueStyle={{ fontWeight: 900, color: '#059669' }} prefix={<CheckCircleOutlined className="mr-2" />} />
          </div>
          <CheckCircleOutlined className="absolute -right-4 -bottom-4 text-8xl text-emerald-500/10" />
        </Card>
        <Card className="rounded-[2rem] border-0 shadow-sm bg-rose-50/50 overflow-hidden relative">
          <div className="relative z-10">
            <Statistic title={<span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Đã từ chối</span>} value={data.filter(d => d.trang_thai === 'Tu_choi').length} valueStyle={{ fontWeight: 900, color: '#e11d48' }} prefix={<CloseCircleOutlined className="mr-2" />} />
          </div>
          <CloseCircleOutlined className="absolute -right-4 -bottom-4 text-8xl text-rose-500/10" />
        </Card>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <FilterOutlined className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lọc theo:</span>
            <Select 
              className="w-44 modern-select border-0 shadow-none bg-transparent" 
              value={filterStatus} 
              onChange={setFilterStatus} 
              placeholder="Tất cả đơn" 
              allowClear
            >
              <Option value="Cho_duyet">Đang chờ</Option>
              <Option value="Da_duyet">Thành công</Option>
              <Option value="Tu_choi">Từ chối</Option>
            </Select>
          </div>
          <Button icon={<HistoryOutlined />} onClick={fetchLeave} className="h-10 px-6 rounded-xl font-bold border-slate-200">Làm mới dữ liệu</Button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table columns={columns} dataSource={filterStatus ? data.filter(d => d.trang_thai === filterStatus) : data} rowKey="id" loading={loading} pagination={{ pageSize: 8, className: "px-8 py-6" }} className="modern-table" scroll={{ x: 1200 }} />
      </div>

      <Modal open={open} onCancel={() => { setOpen(false); form.resetFields(); }} footer={null} title={null} width={600} className="modern-modal" centered>
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><SolutionOutlined /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Tạo đơn nghỉ phép</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">Cung cấp lý do và thời gian dự kiến</p>
          </div>
        </div>
        <Form form={form} layout="vertical" onFinish={async (v) => {
          try {
            const tk = JSON.parse(localStorage.getItem('userInfo')).MaTK;
            await api.post('/leave', { MaTK: tk, ngay_bat_dau: v.date_range[0].format('YYYY-MM-DD'), ngay_ket_thuc: v.date_range[1].format('YYYY-MM-DD'), ly_do: v.ly_do });
            message.success('Đã gửi đơn thành công');
            setOpen(false); fetchLeave(); form.resetFields();
          } catch { message.error('Lỗi khi gửi đơn'); }
        }} className="space-y-6">
          <Form.Item name="date_range" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khoảng thời gian nghỉ</span>} rules={[{ required: true }]}>
            <RangePicker className="w-full h-12 rounded-xl" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="ly_do" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lý do cụ thể</span>} rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Nhập lý do xin nghỉ..." className="rounded-xl p-4 font-medium" />
          </Form.Item>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button onClick={() => setOpen(false)} className="h-12 px-8 rounded-2xl font-bold border-slate-200">Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" className="h-12 px-12 rounded-2xl font-black uppercase tracking-widest text-xs bg-indigo-600 border-0 shadow-lg shadow-indigo-100">Gửi đơn phê duyệt</Button>
          </div>
        </Form>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #94a3b8 !important; font-size: 11px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; padding: 20px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .modern-table .ant-table-tbody > tr > td { padding: 16px 24px !important; border-bottom: 1px solid #f8fafc !important; }
        .modern-modal .ant-modal-content { border-radius: 40px !important; padding: 40px !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important; }
        .modern-select .ant-select-selector { border-radius: 12px !important; display: flex !important; align-items: center !important; }
      `}} />
    </div>
  );
};

export default LeavePage;