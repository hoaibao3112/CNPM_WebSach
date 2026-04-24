import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import api from '../utils/api';
import { jsPDF } from 'jspdf';
import { 
  CalendarOutlined, 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  HistoryOutlined, 
  SaveOutlined, 
  DollarOutlined, 
  FilePdfOutlined,
  WarningOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import { Tooltip, Badge, Avatar, Button, Card, Statistic, Tag, Divider, message, Modal } from 'antd';

const statusColors = {
  Di_lam: 'bg-emerald-500',
  Nghi_phep: 'bg-blue-500',
  Nghi_khong_phep: 'bg-rose-500',
  Lam_them: 'bg-violet-600',
  Di_tre: 'bg-amber-500',
  Chua_cham_cong: 'bg-slate-200',
};

const statusLabels = {
  Di_lam: 'Đi làm',
  Nghi_phep: 'Nghỉ phép',
  Nghi_khong_phep: 'Nghỉ KP',
  Lam_them: 'Tăng ca',
  Di_tre: 'Đi trễ',
  Chua_cham_cong: '',
};

const frontendToApiStatus = {
  'Đi làm': 'Di_lam',
  'Nghỉ phép': 'Nghi_phep',
  'Nghỉ KP': 'Nghi_khong_phep',
  'Tăng ca': 'Lam_them',
  'Đi trễ': 'Di_tre',
};

const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const getWeekday = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  return weekdayLabels[date.getDay()];
};
const isSunday = (year, month, day) => getWeekday(year, month, day) === 'CN';
const roundToHundred = (num) => Math.round(num / 100) * 100;

const AttendancePage = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [otHours, setOtHours] = useState(1);
  const [pendingChanges, setPendingChanges] = useState({});
  const [salaryInfo, setSalaryInfo] = useState(null);
  const [loadingSalary, setLoadingSalary] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
  const years = Array.from({ length: 5 }, (_, i) => ({ value: 2024 + i, label: `Năm ${2024 + i}` }));
  const daysInMonth = new Date(year, month, 0).getDate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/attendance_admin/monthly?month=${month}&year=${year}`);
        const data = res.data.data || res.data;
        setEmployees(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedEmployee) setSelectedEmployee(data[0]);
        setPendingChanges({});
      } catch (err) { setEmployees([]); }
    };
    fetchData();
  }, [month, year]);

  const handleDayClick = (day) => {
    if (isSunday(year, month, day) || !selectedEmployee || !selectedStatus) return;
    const ngay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setPendingChanges(prev => ({
      ...prev,
      [ngay]: {
        trang_thai: frontendToApiStatus[selectedStatus],
        ghi_chu: selectedStatus === 'Tăng ca' ? `Tăng ca ${otHours} giờ` : '',
      }
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const updates = Object.entries(pendingChanges).map(([ngay, data]) => ({ MaTK: selectedEmployee.MaNV, ngay, trang_thai: data.trang_thai, ghi_chu: data.ghi_chu }));
      await Promise.all(updates.map(u => api.put('/attendance_admin/update', u)));
      message.success('Đã lưu chấm công');
      setPendingChanges({});
      const res = await api.get(`/attendance_admin/monthly?month=${month}&year=${year}`);
      setEmployees(res.data.data || []);
    } catch (err) { message.error('Lỗi khi lưu'); }
  };

  const fetchSalary = async () => {
    setLoadingSalary(true);
    try {
      const res = await api.get(`/salary/monthly?month=${month}&year=${year}`);
      const list = res.data.data || [];
      const info = list.find(s => s.MaNV === selectedEmployee.MaNV);
      setSalaryInfo(info || null);
    } catch (err) { message.error('Lỗi tính lương'); }
    setLoadingSalary(false);
  };

  const getTongLuong = () => {
    if (!salaryInfo) return 0;
    return roundToHundred((salaryInfo.luong_co_ban || 0) + (salaryInfo.phu_cap || 0) + (salaryInfo.thuong || 0) - (salaryInfo.phat || 0));
  };

  const handlePaySalary = async () => {
    try {
      const tong_luong = getTongLuong();
      await api.put('/salary/update', { ...salaryInfo, thang: month, nam: year, tong_luong, trang_thai: 'Da_tra' });
      setSalaryInfo(prev => ({ ...prev, trang_thai: 'Da_tra' }));
      message.success('Đã xác nhận thanh toán');
    } catch (err) { message.error('Thanh toán thất bại'); }
  };

  const handleDownloadPdf = async () => {
    // Basic PDF implementation to keep logic consistent
    const doc = new jsPDF();
    doc.text(`PHIEU LUONG THANG ${month}/${year}`, 10, 10);
    doc.text(`Nhan vien: ${salaryInfo.TenNV}`, 10, 20);
    doc.text(`Tong luong: ${getTongLuong().toLocaleString()} đ`, 10, 30);
    doc.save(`Payslip_${selectedEmployee.MaNV}.pdf`);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <CalendarOutlined className="text-indigo-500" />
            Hệ thống Chấm công & Lương
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-tighter">Quản lý hiệu suất và chi trả nhân sự</p>
        </div>
        
        <div className="flex gap-4">
          <div className="w-40">
            <Select options={months} value={months.find(m => m.value === month)} onChange={v => setMonth(v.value)} className="modern-select" />
          </div>
          <div className="w-40">
            <Select options={years} value={years.find(y => y.value === year)} onChange={v => setYear(v.value)} className="modern-select" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-fit">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <UserOutlined /> Đội ngũ nhân sự
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {employees.map(nv => (
                <div 
                  key={nv.MaNV} 
                  onClick={() => { setSelectedEmployee(nv); setPendingChanges({}); setSalaryInfo(null); }}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedEmployee?.MaNV === nv.MaNV ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="bg-white text-indigo-500 font-bold" icon={<UserOutlined />} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-slate-700 truncate">{nv.TenNV}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Mã: {nv.MaNV}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-9 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><CalendarOutlined /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Lịch Chấm công</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tháng {month} / {year} - {selectedEmployee?.TenNV}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={handleSaveChanges} 
                  disabled={Object.keys(pendingChanges).length === 0}
                  className="h-10 px-6 rounded-xl bg-indigo-600 border-0 font-bold"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-8">
              {weekdayLabels.map(w => <div key={w} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{w}</div>)}
              {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => <div key={`empty-${i}`} className="h-20" />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const isSun = isSunday(year, month, day);
                const ngay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const data = pendingChanges[ngay] || selectedEmployee?.days?.[day];
                const status = data?.trang_thai || (isSun ? 'Nghi_CN' : 'Chua_cham_cong');
                
                return (
                  <div 
                    key={day} 
                    onClick={() => handleDayClick(day)}
                    className={`h-24 p-3 rounded-2xl border flex flex-col transition-all cursor-pointer relative group ${isSun ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-indigo-300'}`}
                  >
                    <span className="text-xs font-black text-slate-400">{day}</span>
                    {status && status !== 'Chua_cham_cong' && status !== 'Nghi_CN' && (
                      <div className={`mt-auto px-2 py-1 rounded-lg text-[9px] font-black text-white uppercase text-center ${statusColors[status]}`}>
                        {statusLabels[status]}
                      </div>
                    )}
                    {isSun && <div className="mt-auto text-[9px] font-black text-slate-300 uppercase text-center">Nghỉ CN</div>}
                    {pendingChanges[ngay] && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />}
                  </div>
                );
              })}
            </div>

            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-wrap items-center gap-4 justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Chọn trạng thái để đánh dấu:</span>
              {Object.keys(frontendToApiStatus).map(label => (
                <Button 
                  key={label}
                  onClick={() => setSelectedStatus(label)}
                  className={`h-10 px-6 rounded-xl font-bold transition-all ${selectedStatus === label ? 'bg-indigo-600 text-white border-0' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                >
                  {label}
                </Button>
              ))}
              {selectedStatus === 'Tăng ca' && (
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Số giờ:</span>
                  <Select options={[1,2,3,4].map(h => ({ value: h, label: `${h}h` }))} value={{ value: otHours, label: `${otHours}h` }} onChange={v => setOtHours(v.value)} className="w-20" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><DollarOutlined /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Quyết toán Lương</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tính toán thu nhập và phụ cấp</p>
                </div>
              </div>
              <Button type="primary" size="large" icon={<HistoryOutlined />} onClick={fetchSalary} className="h-12 px-8 rounded-2xl bg-slate-800 border-0 font-bold">Tính lương tháng này</Button>
            </div>

            {loadingSalary ? (
              <div className="py-20 text-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" /> <p className="text-slate-400 font-bold">Đang xử lý dữ liệu tài chính...</p></div>
            ) : salaryInfo ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-slate-50 border-0 rounded-2xl"><Statistic title={<span className="text-[9px] font-black text-slate-400 uppercase">Ngày công</span>} value={salaryInfo.soNgayLam} valueStyle={{ fontWeight: 900 }} suffix={<span className="text-xs text-slate-300">/ 26</span>} /></Card>
                  <Card className="bg-slate-50 border-0 rounded-2xl"><Statistic title={<span className="text-[9px] font-black text-slate-400 uppercase">Tăng ca</span>} value={salaryInfo.soGioTangCa} valueStyle={{ fontWeight: 900 }} suffix={<span className="text-xs text-slate-300">giờ</span>} /></Card>
                  <Card className="bg-slate-50 border-0 rounded-2xl"><Statistic title={<span className="text-[9px] font-black text-slate-400 uppercase">Nghỉ KP</span>} value={salaryInfo.soNgayNghiKhongPhep} valueStyle={{ fontWeight: 900, color: '#f43f5e' }} /></Card>
                  <Card className="bg-slate-50 border-0 rounded-2xl"><Statistic title={<span className="text-[9px] font-black text-slate-400 uppercase">Đi trễ</span>} value={salaryInfo.soNgayDiTre} valueStyle={{ fontWeight: 900, color: '#f59e0b' }} /></Card>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2"><span className="text-sm font-bold text-slate-500">Lương cơ bản định kỳ</span><span className="font-black text-slate-800">{salaryInfo.luong_co_ban?.toLocaleString()} đ</span></div>
                    <div className="flex justify-between items-center py-2 border-t border-slate-200/50"><span className="text-sm font-bold text-slate-500">Phụ cấp công việc</span><span className="font-black text-slate-800">{salaryInfo.phu_cap?.toLocaleString()} đ</span></div>
                    <div className="flex justify-between items-center py-2 border-t border-slate-200/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-500">Thưởng chuyên cần</span>
                        {!salaryInfo.duDieuKienThuong && <Tooltip title="Có nghỉ không phép hoặc đi trễ"><WarningOutlined className="text-rose-500" /></Tooltip>}
                      </div>
                      <span className={`font-black ${salaryInfo.duDieuKienThuong ? 'text-emerald-600' : 'text-slate-300'}`}>{salaryInfo.thuong?.toLocaleString()} đ</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-slate-200/50"><span className="text-sm font-bold text-slate-500">Các khoản khấu trừ (Phạt)</span><span className="font-black text-rose-500">-{salaryInfo.phat?.toLocaleString()} đ</span></div>
                    <Divider className="my-2 border-slate-300" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-black text-slate-800 uppercase tracking-tighter">Thực lĩnh dự kiến</span>
                      <span className="text-2xl font-black text-indigo-600 underline decoration-indigo-200 decoration-4 underline-offset-4">{getTongLuong().toLocaleString()} đ</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Tag color={salaryInfo.trang_thai === 'Da_tra' ? 'success' : 'warning'} className="px-4 py-1 rounded-full font-black uppercase text-[10px] tracking-widest">
                    {salaryInfo.trang_thai === 'Da_tra' ? 'Đã thanh toán' : 'Chờ đối soát'}
                  </Tag>
                  <div className="flex gap-3">
                    <Button icon={<FilePdfOutlined />} onClick={handleDownloadPdf} className="h-12 px-6 rounded-2xl font-bold flex items-center gap-2">Xuất phiếu lương</Button>
                    {salaryInfo.trang_thai !== 'Da_tra' && (
                      <Button type="primary" icon={<CheckCircleOutlined />} onClick={handlePaySalary} className="h-12 px-8 rounded-2xl bg-emerald-600 border-0 font-bold flex items-center gap-2">Xác nhận chi trả</Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                <div className="text-slate-200 text-6xl material-icons mb-4">payments</div>
                <p className="text-slate-400 font-bold">Chưa có dữ liệu tính toán cho nhân sự này</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-select { border-radius: 12px !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .salary-info-table th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 900; text-transform: uppercase; font-size: 11px; color: #94a3b8; }
        .salary-info-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
      `}} />
    </div>
  );
};

export default AttendancePage;