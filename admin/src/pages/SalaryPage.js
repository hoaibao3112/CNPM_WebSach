import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Select, message, Tag, Space, Avatar, Statistic, Card, Divider } from 'antd';
import api from '../utils/api';
import { 
  DollarOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  EyeOutlined, 
  HistoryOutlined,
  ArrowUpOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const SalaryPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salaryData, setSalaryData] = useState([]);
  const [detailModal, setDetailModal] = useState(false);
  const [detailData, setDetailData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

  useEffect(() => {
    const fetchSalary = async () => {
      setLoading(true);
      try {
        const res = await api.post(`/salary/compute/${selectedYear}/${selectedMonth}`);
        const data = Array.isArray(res.data.data) ? res.data.data : (res.data || []);
        setSalaryData(data);
      } catch (error) { message.error('Lỗi khi tính lương'); }
      finally { setLoading(false); }
    };
    fetchSalary();
  }, [selectedMonth, selectedYear]);

  const showDetail = async (record) => {
    setSelectedEmployee(record);
    try {
      const res = await api.get(`/attendance/detail/${record.MaNV}/${selectedMonth}/${selectedYear}`);
      setDetailData(Array.isArray(res.data.data) ? res.data.data : (res.data || []));
      setDetailModal(true);
    } catch { message.error('Lỗi khi lấy chi tiết ngày công'); }
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
          <div>
            <div className="font-black text-slate-800 leading-tight">{record.TenNV}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">ID: #{record.MaNV}</div>
          </div>
        </div>
      )
    },
    {
      title: 'NGÀY CÔNG',
      key: 'workdays',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div className="flex flex-col items-center">
          <span className="font-black text-slate-700">{record.soNgayLam}</span>
          <span className="text-[9px] font-black text-slate-400 uppercase">Ngày</span>
        </div>
      )
    },
    {
      title: 'TĂNG CA',
      key: 'ot',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div className="flex flex-col items-center">
          <span className="font-black text-violet-600">{record.soGioTangCa}</span>
          <span className="text-[9px] font-black text-slate-400 uppercase">Giờ</span>
        </div>
      )
    },
    {
      title: 'CẤU THÀNH LƯƠNG',
      key: 'composition',
      width: 200,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400">Gốc:</span> <span className="text-slate-600">{formatPrice(record.luong_co_ban)}</span></div>
          <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400">Phụ cấp:</span> <span className="text-emerald-600">+{formatPrice(record.phu_cap)}</span></div>
        </div>
      )
    },
    {
      title: 'TỔNG LƯƠNG',
      dataIndex: 'tong_luong',
      key: 'total',
      width: 150,
      render: (v) => <span className="font-black text-indigo-600 text-base">{formatPrice(v)}</span>
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'trang_thai',
      key: 'status',
      width: 150,
      render: (v) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${v === 'Da_tra' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
          {v === 'Da_tra' ? 'Đã chi trả' : 'Chờ xử lý'}
        </span>
      )
    },
    {
      title: 'CHI TIẾT',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button className="w-10 h-10 rounded-xl flex items-center justify-center border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all" icon={<EyeOutlined />} onClick={() => showDetail(record)} />
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <DollarOutlined className="text-indigo-500" />
            Quyết toán Tiền lương
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-tighter">Tính toán thu nhập dựa trên dữ liệu chấm công</p>
        </div>
        
        <div className="flex gap-3 p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
          <Select 
            className="w-32 modern-select" 
            value={selectedMonth} 
            onChange={setSelectedMonth} 
            options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))} 
          />
          <Select 
            className="w-32 modern-select" 
            value={selectedYear} 
            onChange={setSelectedYear} 
            options={Array.from({ length: 5 }, (_, i) => ({ value: 2024 + i, label: `Năm ${2024 + i}` }))} 
          />
          <Button icon={<HistoryOutlined />} onClick={() => message.info('Đang cập nhật dữ liệu...')} className="h-10 w-10 flex items-center justify-center rounded-xl border-slate-100 text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-[2.5rem] border-0 shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
          <Statistic title={<span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Tổng quỹ lương</span>} value={salaryData.reduce((t, s) => t + (s.tong_luong || 0), 0)} valueStyle={{ color: 'white', fontWeight: 900 }} prefix={<DollarOutlined />} formatter={v => formatPrice(v)} />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm">
          <Statistic title={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trung bình/NV</span>} value={salaryData.length ? Math.round(salaryData.reduce((t, s) => t + (s.tong_luong || 0), 0) / salaryData.length) : 0} valueStyle={{ fontWeight: 900 }} prefix={<ThunderboltOutlined className="text-amber-500" />} formatter={v => formatPrice(v)} />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm">
          <Statistic title={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân sự quyết toán</span>} value={salaryData.length} valueStyle={{ fontWeight: 900 }} prefix={<UserOutlined className="text-indigo-500" />} />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm">
          <Statistic title={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã giải ngân</span>} value={salaryData.filter(s => s.trang_thai === 'Da_tra').length} valueStyle={{ fontWeight: 900, color: '#10b981' }} prefix={<CheckCircleOutlined />} suffix={<span className="text-xs text-slate-300 ml-1">/ {salaryData.length}</span>} />
        </Card>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table columns={columns} dataSource={salaryData} rowKey="MaNV" loading={loading} pagination={false} className="modern-table" scroll={{ x: 1000 }} />
      </div>

      <Modal open={detailModal} onCancel={() => setDetailModal(false)} footer={null} title={null} width={650} className="modern-modal" centered>
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><CalendarOutlined /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Bảng công chi tiết</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-tight">{selectedEmployee?.TenNV} • Tháng {selectedMonth}/{selectedYear}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Đi làm</span>
              <span className="text-xl font-black text-indigo-600">{detailData.filter(d => d.trang_thai === 'Di_lam' || d.trang_thai === 'Lam_them').length} ngày</span>
            </div>
            <div className="text-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Nghỉ/Trễ</span>
              <span className="text-xl font-black text-rose-500">{detailData.filter(d => ['Nghi_khong_phep', 'Di_tre'].includes(d.trang_thai)).length} lượt</span>
            </div>
          </div>
        </div>
        <Table
          columns={[
            { title: 'NGÀY', dataIndex: 'ngay', render: d => <span className="font-bold text-slate-600">{new Date(d).toLocaleDateString('vi-VN')}</span>, width: 150 },
            {
              title: 'TRẠNG THÁI GHI NHẬN',
              dataIndex: 'trang_thai',
              render: v => {
                const map = {
                  Di_lam: { color: 'green', label: 'Đi làm' },
                  Lam_them: { color: 'blue', label: 'Làm thêm' },
                  Nghi_phep: { color: 'orange', label: 'Nghỉ phép' },
                  Nghi_khong_phep: { color: 'red', label: 'Nghỉ KP' },
                  Di_tre: { color: 'purple', label: 'Đi trễ' }
                };
                const c = map[v] || { color: 'default', label: v };
                return <Tag color={c.color} className="font-black m-0 px-3">{c.label.toUpperCase()}</Tag>;
              }
            }
          ]}
          dataSource={detailData}
          rowKey="ngay"
          pagination={{ pageSize: 8 }}
          size="small"
          className="modern-table"
        />
        <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
          <Button onClick={() => setDetailModal(false)} className="h-12 px-8 rounded-2xl font-bold border-slate-200 bg-slate-50">Đóng cửa sổ</Button>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #94a3b8 !important; font-size: 11px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; padding: 20px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .modern-table .ant-table-tbody > tr > td { padding: 16px 24px !important; border-bottom: 1px solid #f8fafc !important; }
        .modern-modal .ant-modal-content { border-radius: 40px !important; padding: 40px !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important; }
        .modern-select .ant-select-selector { border-radius: 12px !important; border: 0 !important; box-shadow: none !important; font-weight: 900 !important; text-transform: uppercase !important; font-size: 10px !important; letter-spacing: 0.05em !important; }
      `}} />
    </div>
  );
};

export default SalaryPage;