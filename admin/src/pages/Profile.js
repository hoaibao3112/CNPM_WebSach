import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card, Spin, message, Button, Modal, Form, Input, Row, Col, Avatar, Typography, Table, Upload
} from 'antd';
import {
  UserOutlined, LockOutlined, CheckCircleOutlined, LogoutOutlined, DollarCircleOutlined, EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [salaryList, setSalaryList] = useState([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [resignLoading, setResignLoading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  // computed avatar src
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
  const [avatarSrc, setAvatarSrc] = useState(undefined);

  const buildAvatarSrc = (anh) => {
    if (!anh) return undefined;
    if (anh.startsWith('http')) return anh;
    // remove leading slashes
    const clean = anh.replace(/^\/+/, '');
    // if path already contains uploads, use it
    if (clean.startsWith('uploads/')) return `${apiBase}/${clean}`;
    // otherwise assume it's a filename stored in nhanvien and prefix uploads/nhanvien/
    return `${apiBase}/uploads/nhanvien/${clean}`;
  };

  // Chi tiết ngày công
  const [detailModal, setDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [attendanceDetail, setAttendanceDetail] = useState([]);
  const [detailMonth, setDetailMonth] = useState(null);
  const [detailYear, setDetailYear] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userInfoStr = localStorage.getItem('userInfo');
        if (!token || !userInfoStr) {
          message.error('Không tìm thấy thông tin đăng nhập!');
          return;
        }
        const { MaTK } = JSON.parse(userInfoStr);
        const res = await axios.get(`http://localhost:5000/api/users/by-matk/${MaTK}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserInfo(res.data);
        // compute avatar src if present
        const anh = res.data?.Anh;
        setAvatarSrc(buildAvatarSrc(anh));
      } catch (error) {
        message.error('Lỗi khi tải thông tin cá nhân!');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // update avatarSrc whenever userInfo changes (helps when refreshed after upload)
  useEffect(() => {
    if (!userInfo) return;
    console.log('Profile loaded:', userInfo);
    const anh = userInfo?.Anh;
    setAvatarSrc(buildAvatarSrc(anh));
  }, [userInfo]);

  const fetchSalary = async () => {
    setSalaryLoading(true);
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) {
        message.error('Không tìm thấy thông tin đăng nhập!');
        setSalaryLoading(false);
        return;
      }
      const { MaTK } = JSON.parse(userInfoStr);
      const salaryRes = await axios.get(`http://localhost:5000/api/salary/history/${MaTK}`);
      setSalaryList(salaryRes.data);
      setShowSalaryModal(true);
    } catch (error) {
      message.error('Lỗi khi tải thông tin lương!');
    } finally {
      setSalaryLoading(false);
    }
  };

  const handlePwdChange = async (values) => {
    setPwdLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `http://localhost:5000/api/users/change-password`,
        { oldPassword: values.oldPassword, newPassword: values.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Đổi mật khẩu thành công!');
      setShowPwdModal(false);
    } catch (error) {
      message.error(error.response?.data?.error || 'Đổi mật khẩu thất bại!');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setAttendanceLoading(true);
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) {
        message.error('Không tìm thấy thông tin đăng nhập!');
        setAttendanceLoading(false);
        return;
      }
      const { MaTK } = JSON.parse(userInfoStr);
      if (!MaTK) {
        message.error('Không tìm thấy mã tài khoản!');
        setAttendanceLoading(false);
        return;
      }
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const gioVao = now.toTimeString().slice(0, 8);
      await axios.post('http://localhost:5000/api/attendance', {
        MaTK,
        ngay: today,
        gio_vao: gioVao,
        gio_ra: "17:00:00",
        trang_thai: "Di_lam",
        ghi_chu: "Chấm công thành công"
      });
      message.success('Chấm công hôm nay thành công!');
    } catch (error) {
      if (error.response?.data?.error) {
        if (error.response.data.error.includes('đã chấm công')) {
          message.warning('Bạn đã chấm công trong ngày hôm nay rồi!');
        } else {
          message.error(error.response.data.error);
        }
      } else {
        message.error('Chấm công thất bại!');
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleResign = async (values) => {
    setResignLoading(true);
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) {
        message.error('Không tìm thấy thông tin đăng nhập!');
        setResignLoading(false);
        return;
      }
      const { MaTK } = JSON.parse(userInfoStr);
      if (!MaTK) {
        message.error('Không tìm thấy mã tài khoản!');
        setResignLoading(false);
        return;
      }
      await axios.post('http://localhost:5000/api/leave', {
        MaTK,
        ngay_bat_dau: dayjs().format('YYYY-MM-DD'),
        ngay_ket_thuc: dayjs().format('YYYY-MM-DD'),
        ly_do: values.ly_do || 'Xin nghỉ việc'
      });
      message.success('Gửi đơn xin nghỉ việc thành công!');
      setShowResignModal(false);
    } catch (error) {
      message.error('Gửi đơn xin nghỉ việc thất bại!');
    } finally {
      setResignLoading(false);
    }
  };

  // Xem chi tiết ngày công
  const handleShowDetail = async (thang, nam) => {
    setDetailLoading(true);
    setDetailModal(true);
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      const { MaTK } = JSON.parse(userInfoStr);
      const res = await axios.get(`http://localhost:5000/api/attendance/detail/${MaTK}/${thang}/${nam}`);
      setAttendanceDetail(res.data);
      setDetailMonth(thang);
      setDetailYear(nam);
    } catch (error) {
      message.error('Không lấy được chi tiết ngày công!');
      setAttendanceDetail([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // Cột bảng lương (thêm nút xem chi tiết)
  const salaryColumns = [
    { title: 'Tháng', dataIndex: 'thang', responsive: ['xs', 'sm', 'md', 'lg', 'xl'] },
    { title: 'Năm', dataIndex: 'nam', responsive: ['xs', 'sm', 'md', 'lg', 'xl'] },
    { title: 'Lương cơ bản', dataIndex: 'luong_co_ban', render: v => v?.toLocaleString(), responsive: ['md', 'lg', 'xl'] },
    { title: 'Phụ cấp', dataIndex: 'phu_cap', render: v => v?.toLocaleString(), responsive: ['lg', 'xl'] },
    { title: 'Thưởng', dataIndex: 'thuong', render: v => v?.toLocaleString(), responsive: ['lg', 'xl'] },
    { title: 'Phạt', dataIndex: 'phat', render: v => v?.toLocaleString(), responsive: ['lg', 'xl'] },
    { title: 'Tổng lương', dataIndex: 'tong_luong', render: v => v?.toLocaleString(), responsive: ['xs', 'sm', 'md', 'lg', 'xl'] },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      render: v => v === 'Da_tra'
        ? <span style={{ color: 'green' }}>Đã trả</span>
        : <span style={{ color: 'orange' }}>Chưa trả</span>,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl']
    },
    {
      title: 'Chi tiết',
      key: 'detail',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleShowDetail(record.thang, record.nam)}
        >
          Xem chi tiết
        </Button>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl']
    }
  ];

  if (loading) return <Spin tip="Đang tải thông tin..." style={{ width: '100%', marginTop: 100 }} />;
  if (!userInfo) return <div>Không tìm thấy thông tin nhân viên!</div>;

  return (
    <div className="thongke-page">
      <div className="thongke-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>
          <i className="fas fa-user"></i> Thông tin cá nhân
        </h1>
      </div>

      <div className="thongke-content">
        <div className="thongke-table">
          <Row
            justify="center"
            align="middle"
            style={{
              minHeight: '70vh',
              background: '#f4f6fb',
              paddingBottom: 40,
              paddingLeft: 24,
              paddingRight: 24,
            }}
          >
            <Col xs={24} md={20} lg={16} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Card
                bordered={false}
                style={{
                  width: '100%',
                  maxWidth: 700, // Tăng chiều rộng form thông tin nhân viên
                  boxShadow: '0 4px 24px #d1d9e6',
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, #e0e7ff 0%, #fff 100%)',
                  marginTop: 40,
                }}
                actions={[
                  <Button
                    icon={<LockOutlined />}
                    type="primary"
                    onClick={() => setShowPwdModal(true)}
                    key="changepwd"
                    style={{ borderRadius: 8 }}
                  >
                    Đổi mật khẩu
                  </Button>,
                  <Button
                    icon={<CheckCircleOutlined />}
                    type="default"
                    loading={attendanceLoading}
                    onClick={handleCheckIn}
                    key="checkin"
                    style={{ borderRadius: 8, color: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Chấm công hôm nay
                  </Button>,
                  <Button
                    icon={<LogoutOutlined />}
                    danger
                    type="primary"
                    onClick={() => setShowResignModal(true)}
                    key="resign"
                    style={{ borderRadius: 8 }}
                  >
                    Xin nghỉ việc
                  </Button>,
                  <Button
                    icon={<DollarCircleOutlined />}
                    type="dashed"
                    onClick={fetchSalary}
                    key="salary"
                    style={{ borderRadius: 8, color: '#2563eb', borderColor: '#2563eb' }}
                    loading={salaryLoading}
                  >
                    Xem lương cá nhân
                  </Button>
                ]}
              >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Avatar
                    size={96}
                    icon={<UserOutlined />}
                    src={avatarSrc}
                    style={{
                      background: avatarSrc ? undefined : 'linear-gradient(135deg, #6366f1 0%, #60a5fa 100%)',
                      marginBottom: 12,
                      boxShadow: '0 2px 8px #b3bcdf',
                    }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Button size="small" onClick={() => setShowAvatarModal(true)}>Thay ảnh</Button>
                  </div>
                  <Title level={3} style={{ marginBottom: 0, color: '#1e293b' }}>{userInfo.TenNV || userInfo.TenTK}</Title>
                  <Text type="secondary" style={{ fontSize: 16 }}>{userInfo.TenNQ}</Text>
                </div>
                <Row gutter={[16, 8]}>
                  <Col span={12}><Text strong>Mã tài khoản:</Text></Col>
                  <Col span={12}><Text>{userInfo.MaTK}</Text></Col>
                  <Col span={12}><Text strong>Tên tài khoản:</Text></Col>
                  <Col span={12}><Text>{userInfo.TenTK}</Text></Col>
                  <Col span={12}><Text strong>Mã nhân viên:</Text></Col>
                  <Col span={12}><Text>{userInfo.MaNV}</Text></Col>
                  <Col span={12}><Text strong>Số điện thoại:</Text></Col>
                  <Col span={12}><Text>{userInfo.SDT}</Text></Col>
                  <Col span={12}><Text strong>Giới tính:</Text></Col>
                  <Col span={12}><Text>{userInfo.GioiTinh}</Text></Col>
                  <Col span={12}><Text strong>Địa chỉ:</Text></Col>
                  <Col span={12}><Text>{userInfo.DiaChi}</Text></Col>
                  <Col span={12}><Text strong>Email:</Text></Col>
                  <Col span={12}><Text>{userInfo.Email}</Text></Col>
                  <Col span={12}><Text strong>Ngày tạo:</Text></Col>
                  <Col span={12}><Text>{userInfo.NgayTao ? new Date(userInfo.NgayTao).toLocaleDateString('vi-VN') : ''}</Text></Col>
                  <Col span={12}><Text strong>Tình trạng:</Text></Col>
                  <Col span={12}><Text>{userInfo.TinhTrang ? 'Hoạt động' : 'Không hoạt động'}</Text></Col>
                </Row>
              </Card>
            </Col>
            {/* Modal lương cá nhân */}
            {/* Modal thay ảnh đại diện */}
            <Modal
              title="Thay ảnh đại diện"
              open={showAvatarModal}
              onCancel={() => { setShowAvatarModal(false); setAvatarFile(null); }}
              footer={null}
            >
              <div style={{ textAlign: 'center' }}>
                <Upload
                  beforeUpload={(file) => {
                    const isImage = /image\/(jpeg|png|gif|jpg)/.test(file.type);
                    if (!isImage) {
                      message.error('Chỉ cho phép file ảnh!');
                      return Upload.LIST_IGNORE;
                    }
                    setAvatarFile(file);
                    return false; // prevent auto upload
                  }}
                  maxCount={1}
                  showUploadList={{ showPreviewIcon: false }}
                >
                  <Button>Chọn ảnh</Button>
                </Upload>
                <div style={{ marginTop: 12 }}>
                  <Button
                    type="primary"
                    loading={avatarUploading}
                    onClick={async () => {
                      if (!avatarFile) return message.warning('Vui lòng chọn ảnh trước khi tải lên');
                      setAvatarUploading(true);
                      try {
                        const token = localStorage.getItem('authToken');
                        const form = new FormData();
                        // Backend requires TenNV, SDT, Email - include existing values so validation passes
                        form.append('TenNV', userInfo.TenNV || '');
                        form.append('SDT', userInfo.SDT || '');
                        form.append('Email', userInfo.Email || '');
                        form.append('GioiTinh', userInfo.GioiTinh || '');
                        form.append('DiaChi', userInfo.DiaChi || '');
                        form.append('TinhTrang', userInfo.TinhTrang ? '1' : '0');
                        form.append('Anh', avatarFile);

                        const res = await axios.put(
                          `http://localhost:5000/api/users/${userInfo.MaNV}`,
                          form,
                          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
                        );
                        message.success(res.data?.message || 'Cập nhật ảnh thành công');
                        // refresh profile info
                        const tokenStored = localStorage.getItem('authToken');
                        const { MaTK } = JSON.parse(localStorage.getItem('userInfo') || '{}');
                        const profileRes = await axios.get(`http://localhost:5000/api/users/by-matk/${MaTK}`, { headers: { Authorization: `Bearer ${tokenStored}` } });
                        setUserInfo(profileRes.data);
                        setShowAvatarModal(false);
                        setAvatarFile(null);
                      } catch (err) {
                        console.error(err);
                        message.error(err.response?.data?.error || 'Tải ảnh thất bại');
                      } finally {
                        setAvatarUploading(false);
                      }
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    Tải lên
                  </Button>
                </div>
              </div>
            </Modal>
            <Modal
              title="Lịch sử lương cá nhân"
              open={showSalaryModal}
              onCancel={() => setShowSalaryModal(false)}
              footer={null}
              width={800}
    styles={{ body: { borderRadius: 16, padding: 0, overflow: 'hidden' } }}
            >
              <Table
                columns={salaryColumns}
                dataSource={salaryList}
                rowKey={(record, idx) => `${record.nam}-${record.thang}-${idx}`}
                pagination={{ pageSize: 5 }}
                locale={{ emptyText: 'Chưa có dữ liệu lương' }}
                style={{ borderRadius: 16, overflow: 'hidden', fontSize: 13, margin: 0 }}
                bordered
              />
            </Modal>
            {/* Modal chi tiết ngày công */}
            <Modal
              title={`Chi tiết ngày công tháng ${detailMonth}/${detailYear}`}
              open={detailModal}
              onCancel={() => setDetailModal(false)}
              footer={null}
              width={500}
    styles={{ body: { borderRadius: 16, padding: 0, overflow: 'hidden' } }}
            >
              <Spin spinning={detailLoading}>
                <Table
                  columns={[
                    { title: 'Ngày', dataIndex: 'ngay', render: v => dayjs(v).format('DD/MM/YYYY') },
                    {
                      title: 'Trạng thái', dataIndex: 'trang_thai',
                      render: v => {
                        if (v === 'Di_lam') return <span style={{ color: '#52c41a' }}>Đi làm</span>;
                        if (v === 'Nghi_phep') return <span style={{ color: '#1890ff' }}>Nghỉ phép</span>;
                        if (v === 'Nghi_khong_phep') return <span style={{ color: '#f5222d' }}>Nghỉ KP</span>;
                        if (v === 'Lam_them') return <span style={{ color: '#faad14' }}>Tăng ca</span>;
                        if (v === 'Di_tre') return <span style={{ color: '#faad14' }}>Đi trễ</span>;
                        return v;
                      }
                    }
                  ]}
                  dataSource={attendanceDetail}
                  rowKey={(r, idx) => r.ngay + idx}
                  pagination={false}
                  size="small"
                  bordered
                  style={{ margin: 16 }}
                  locale={{ emptyText: 'Không có dữ liệu ngày công' }}
                />
              </Spin>
            </Modal>
            {/* Modal đổi mật khẩu */}
            <Modal
              title="Đổi mật khẩu"
              open={showPwdModal}
              onCancel={() => setShowPwdModal(false)}
              footer={null}
    destroyOnHidden
    styles={{ body: { padding: 24, borderRadius: 12 } }}
            >
              <Form
                layout="vertical"
                onFinish={handlePwdChange}
              >
                <Form.Item
                  name="oldPassword"
                  label="Mật khẩu cũ"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ!' }]}
                >
                  <Input.Password placeholder="Nhập mật khẩu cũ" />
                </Form.Item>
                <Form.Item
                  name="newPassword"
                  label="Mật khẩu mới"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                  ]}
                >
                  <Input.Password placeholder="Nhập mật khẩu mới" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu mới"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Nhập lại mật khẩu mới" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={pwdLoading} block style={{ borderRadius: 8 }}>
                    Đổi mật khẩu
                  </Button>
                </Form.Item>
              </Form>
            </Modal>
            {/* Modal xin nghỉ việc */}
            <Modal
              title="Xin nghỉ việc"
              open={showResignModal}
              onCancel={() => setShowResignModal(false)}
              footer={null}
    destroyOnHidden
    styles={{ body: { padding: 24, borderRadius: 12 } }}
            >
              <Form
                layout="vertical"
                onFinish={handleResign}
              >
                <Form.Item
                  name="ly_do"
                  label="Lý do nghỉ việc"
                  rules={[{ required: true, message: 'Vui lòng nhập lý do nghỉ việc!' }]}
                >
                  <Input.TextArea placeholder="Nhập lý do nghỉ việc..." />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={resignLoading} block style={{ borderRadius: 8 }}>
                    Gửi đơn xin nghỉ việc
                  </Button>
                </Form.Item>
              </Form>
            </Modal>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Profile;