import React, { useEffect, useState, useCallback } from 'react';
import { Card, message, Button, Modal, Form, Input, Avatar, Table, Upload, Tag } from 'antd';
import api from '../utils/api';
import { 
  UserOutlined, 
  LockOutlined, 
  CheckCircleOutlined, 
  DollarCircleOutlined, 
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  CameraOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [salaryList, setSalaryList] = useState([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  const apiBase = process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com';
  const [avatarSrc, setAvatarSrc] = useState(undefined);

  const buildAvatarSrc = useCallback((anh) => {
    if (!anh) return undefined;
    if (anh.startsWith('http')) return anh;
    const clean = anh.replace(/^\/+/, '');
    if (clean.startsWith('uploads/')) return `${apiBase}/${clean}`;
    return `${apiBase}/uploads/nhanvien/${clean}`;
  }, [apiBase]);

  const fetchProfile = useCallback(async () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) return;
      const { MaTK } = JSON.parse(userInfoStr);
      const res = await api.get(`/users/by-matk/${MaTK}`);
      setUserInfo(res.data);
      setAvatarSrc(buildAvatarSrc(res.data?.Anh));
    } catch (error) { message.error('Lỗi khi tải thông tin!'); }
  }, [buildAvatarSrc]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleCheckIn = async () => {
    setAttendanceLoading(true);
    try {
      const { MaTK } = JSON.parse(localStorage.getItem('userInfo'));
      const now = new Date();
      await api.post('/attendance', {
        MaTK, ngay: now.toISOString().slice(0, 10), gio_vao: now.toTimeString().slice(0, 8), gio_ra: "17:00:00",
        trang_thai: "Di_lam", ghi_chu: "Chấm công qua Profile"
      });
      message.success('Chấm công thành công!');
    } catch (error) { message.error(error.response?.data?.error || 'Chấm công thất bại!'); }
    finally { setAttendanceLoading(false); }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="relative group/avatar">
              <Avatar size={160} src={avatarSrc} icon={<UserOutlined />} className="shadow-2xl border-4 border-white bg-indigo-100 text-indigo-600 font-black text-4xl" />
              <div 
                className="absolute bottom-2 right-2 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-110 transition-transform"
                onClick={() => setShowAvatarModal(true)}
              >
                <CameraOutlined className="text-xl" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <Tag className="bg-indigo-50 text-indigo-600 border-0 rounded-full font-black text-[10px] uppercase tracking-widest px-4 py-1 mb-2">
                  {userInfo?.TenNQ}
                </Tag>
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter">{userInfo?.TenNV || userInfo?.TenTK}</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">ID NHÂN VIÊN: #{userInfo?.MaNV}</p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Button type="primary" icon={<CheckCircleOutlined />} loading={attendanceLoading} onClick={handleCheckIn} className="h-12 px-8 rounded-2xl bg-emerald-600 border-0 shadow-lg shadow-emerald-100 font-black text-[11px] uppercase tracking-widest">Chấm công nhanh</Button>
                <Button icon={<LockOutlined />} onClick={() => setShowPwdModal(true)} className="h-12 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest border-slate-200">Đổi mật khẩu</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="rounded-[2.5rem] border-0 shadow-sm p-4 md:col-span-2">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3"><SafetyCertificateOutlined className="text-indigo-500" /> Thông tin hồ sơ</h2>
              <Tag color={userInfo?.TinhTrang ? 'green' : 'red'} className="rounded-full font-black px-4">{userInfo?.TinhTrang ? 'ĐANG LÀM VIỆC' : 'ĐÃ NGHỈ'}</Tag>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><MailOutlined /></div>
                  <div><span className="text-[10px] font-black text-slate-400 uppercase block">Email cá nhân</span><span className="text-sm font-bold text-slate-700">{userInfo?.Email || 'Chưa cập nhật'}</span></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><PhoneOutlined /></div>
                  <div><span className="text-[10px] font-black text-slate-400 uppercase block">Số điện thoại</span><span className="text-sm font-bold text-slate-700">{userInfo?.SDT || 'Chưa cập nhật'}</span></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><UserOutlined /></div>
                  <div><span className="text-[10px] font-black text-slate-400 uppercase block">Giới tính</span><span className="text-sm font-bold text-slate-700">{userInfo?.GioiTinh || 'Không rõ'}</span></div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><EnvironmentOutlined /></div>
                  <div><span className="text-[10px] font-black text-slate-400 uppercase block">Địa chỉ liên hệ</span><span className="text-sm font-bold text-slate-700">{userInfo?.DiaChi || 'Chưa cập nhật'}</span></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><CalendarOutlined /></div>
                  <div><span className="text-[10px] font-black text-slate-400 uppercase block">Ngày gia nhập</span><span className="text-sm font-bold text-slate-700">{dayjs(userInfo?.NgayTao).format('DD/MM/YYYY')}</span></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><HomeOutlined /></div>
                  <div><span className="text-[10px] font-black text-slate-400 uppercase block">Mã tài khoản</span><span className="text-sm font-bold text-slate-700">ACC-{userInfo?.MaTK}</span></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-0 shadow-sm p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
            <DollarCircleOutlined className="absolute -right-8 -bottom-8 text-[12rem] text-white/5" />
            <div className="relative z-10 h-full flex flex-col">
              <h2 className="text-xl font-black text-white flex items-center gap-3 mb-8"><DollarCircleOutlined className="text-indigo-400" /> Tiền lương</h2>
              <div className="flex-1 flex flex-col justify-center text-center space-y-4">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Thu nhập dự tính</p>
                <div className="text-4xl font-black text-indigo-400 tracking-tighter">LIÊN HỆ HR</div>
                <p className="text-xs text-slate-500 font-medium">Bảo mật thông tin thu nhập cá nhân</p>
              </div>
              <Button type="primary" icon={<EyeOutlined />} onClick={() => { setShowSalaryModal(true); fetchSalary(); }} className="mt-8 h-12 rounded-2xl bg-indigo-600 border-0 font-black text-[11px] uppercase tracking-widest">Chi tiết lịch sử lương</Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={showSalaryModal} onCancel={() => setShowSalaryModal(false)} footer={null} width={850} className="modern-modal" centered title={null}>
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><DollarCircleOutlined /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Lịch sử thu nhập</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">Dữ liệu quyết toán các tháng gần nhất</p>
          </div>
        </div>
        <Table
          columns={[
            { title: 'THỜI GIAN', key: 'time', render: (_, r) => <span className="font-bold text-slate-700">T{r.thang}/{r.nam}</span> },
            { title: 'TỔNG LƯƠNG', dataIndex: 'tong_luong', render: v => <span className="font-black text-indigo-600">{v?.toLocaleString()}đ</span> },
            { title: 'TRẠNG THÁI', dataIndex: 'trang_thai', render: v => <Tag color={v === 'Da_tra' ? 'green' : 'orange'} className="font-black text-[10px] rounded-full px-3">{v === 'Da_tra' ? 'HOÀN TẤT' : 'CHỜ XỬ LÝ'}</Tag> },
            { title: 'HÀNH ĐỘNG', key: 'op', render: (_, r) => <Button size="small" icon={<EyeOutlined />} onClick={() => { fetchAttendanceDetail(r.thang, r.nam); }} className="rounded-lg font-bold">CHI TIẾT CÔNG</Button> }
          ]}
          dataSource={salaryList}
          loading={salaryLoading}
          rowKey={(r, i) => i}
          pagination={{ pageSize: 5 }}
          className="modern-table"
        />
      </Modal>

      <Modal open={showAvatarModal} onCancel={() => setShowAvatarModal(false)} footer={null} className="modern-modal" centered title="Thay ảnh hồ sơ">
        <div className="p-8 text-center space-y-6">
          <Upload 
            beforeUpload={f => { setAvatarFile(f); return false; }} 
            maxCount={1}
            showUploadList={{ showRemoveIcon: true }}
            className="avatar-uploader"
          >
            <div className="w-full h-40 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer">
              <CameraOutlined className="text-4xl text-slate-300 mb-2" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chọn tệp hình ảnh</span>
            </div>
          </Upload>
          <Button 
            type="primary" 
            block 
            size="large" 
            loading={avatarUploading} 
            onClick={async () => {
              if (!avatarFile) return message.warning('Vui lòng chọn ảnh');
              setAvatarUploading(true);
              try {
                const form = new FormData();
                form.append('TenNV', userInfo.TenNV || '');
                form.append('SDT', userInfo.SDT || '');
                form.append('Email', userInfo.Email || '');
                form.append('GioiTinh', userInfo.GioiTinh || '');
                form.append('DiaChi', userInfo.DiaChi || '');
                form.append('TinhTrang', userInfo.TinhTrang ? '1' : '0');
                form.append('Anh', avatarFile);
                await api.put(`/users/${userInfo.MaNV}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
                message.success('Cập nhật ảnh thành công!');
                fetchProfile(); setShowAvatarModal(false);
              } catch { message.error('Lỗi khi tải ảnh'); }
              finally { setAvatarUploading(false); }
            }}
            className="h-12 rounded-2xl bg-indigo-600 border-0 font-black"
          >
            Lưu thay đổi
          </Button>
        </div>
      </Modal>

      <Modal open={showPwdModal} onCancel={() => setShowPwdModal(false)} footer={null} className="modern-modal" centered title="Bảo mật tài khoản">
        <Form layout="vertical" onFinish={async v => {
          setPwdLoading(true);
          try {
            await api.put(`/users/change-password`, { oldPassword: v.oldPassword, newPassword: v.newPassword });
            message.success('Đổi mật khẩu thành công!'); setShowPwdModal(false);
          } catch (e) { message.error(e.response?.data?.error || 'Lỗi xử lý'); }
          finally { setPwdLoading(false); }
        }} className="p-4 space-y-4">
          <Form.Item name="oldPassword" label={<span className="text-[10px] font-black text-slate-400 uppercase">Mật khẩu hiện tại</span>} rules={[{ required: true }]}><Input.Password className="h-12 rounded-xl" /></Form.Item>
          <Form.Item name="newPassword" label={<span className="text-[10px] font-black text-slate-400 uppercase">Mật khẩu mới</span>} rules={[{ required: true, min: 6 }]}><Input.Password className="h-12 rounded-xl" /></Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={pwdLoading} className="h-12 rounded-2xl bg-indigo-600 border-0 font-black">Xác nhận thay đổi</Button>
        </Form>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #94a3b8 !important; font-size: 11px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; padding: 20px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .modern-table .ant-table-tbody > tr > td { padding: 16px 24px !important; border-bottom: 1px solid #f8fafc !important; }
        .modern-modal .ant-modal-content { border-radius: 40px !important; padding: 40px !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important; }
        .avatar-uploader .ant-upload { width: 100% !important; }
      `}} />
    </div>
  );

  async function fetchSalary() {
    setSalaryLoading(true);
    try {
      const { MaTK } = JSON.parse(localStorage.getItem('userInfo'));
      const res = await api.get(`/salary/history/${MaTK}`);
      setSalaryList(res.data.data || res.data);
    } catch { message.error('Lỗi tải dữ liệu lương'); }
    finally { setSalaryLoading(false); }
  }

  async function fetchAttendanceDetail(thang, nam) {
    try {
      const { MaTK } = JSON.parse(localStorage.getItem('userInfo'));
      const res = await api.get(`/attendance/detail/${MaTK}/${thang}/${nam}`);
      // Dữ liệu chi tiết hiện chưa có Modal để hiển thị, log ra console hoặc thông báo
      console.log('Attendance detail:', res.data.data || res.data);
      message.info('Tính năng hiển thị chi tiết công đang được cập nhật');
    } catch { message.error('Không lấy được chi tiết'); }
  }
};

export default Profile;