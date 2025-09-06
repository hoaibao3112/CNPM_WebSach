import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Spin, message, Button, Modal, Form, Input, Row, Col, Avatar, Typography, Table } from 'antd';
import { UserOutlined, LockOutlined, CheckCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [salaryList, setSalaryList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [resignLoading, setResignLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userInfoStr = localStorage.getItem('userInfo');
        if (!token || !userInfoStr) {
          message.error('Không tìm thấy thông tin đăng nhập!');
          return;
        }
        const { MaTK, MaNV } = JSON.parse(userInfoStr);
        // Lấy thông tin cá nhân
        const res = await axios.get(`http://localhost:5000/api/users/by-matk/${MaTK}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserInfo(res.data);

        // Lấy danh sách lương của nhân viên này
        const salaryRes = await axios.get(`http://localhost:5000/api/salary/by-manv/${MaNV}`);
        setSalaryList(salaryRes.data);
      } catch (error) {
        message.error('Lỗi khi tải thông tin cá nhân hoặc lương!');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
      const today = now.toISOString().slice(0, 10); // yyyy-mm-dd
      const gioVao = now.toTimeString().slice(0, 8); // hh:mm:ss
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

  // Xin nghỉ việc (dùng MaTK)
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

  const salaryColumns = [
    { title: 'Tháng', dataIndex: 'thang' },
    { title: 'Năm', dataIndex: 'nam' },
    { title: 'Lương cơ bản', dataIndex: 'luong_co_ban', render: v => v?.toLocaleString() },
    { title: 'Phụ cấp', dataIndex: 'phu_cap', render: v => v?.toLocaleString() },
    { title: 'Thưởng', dataIndex: 'thuong', render: v => v?.toLocaleString() },
    { title: 'Phạt', dataIndex: 'phat', render: v => v?.toLocaleString() },
    { title: 'Tổng lương', dataIndex: 'tong_luong', render: v => v?.toLocaleString() },
    { 
      title: 'Trạng thái', 
      dataIndex: 'trang_thai', 
      render: v => v === 'Da_tra' 
        ? <span style={{color: 'green'}}>Đã trả</span> 
        : <span style={{color: 'orange'}}>Chưa trả</span> 
    },
  ];

  if (loading) return <Spin tip="Đang tải thông tin..." style={{ width: '100%', marginTop: 100 }} />;

  if (!userInfo) return <div>Không tìm thấy thông tin nhân viên!</div>;

  return (
    <Row justify="center" style={{ marginTop: 40 }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={8}>
        <Card
          bordered={false}
          style={{ boxShadow: '0 2px 16px #e0e0e0', borderRadius: 16 }}
          actions={[
            <Button
              icon={<LockOutlined />}
              type="primary"
              onClick={() => setShowPwdModal(true)}
              key="changepwd"
            >
              Đổi mật khẩu
            </Button>,
            <Button
              icon={<CheckCircleOutlined />}
              type="default"
              loading={attendanceLoading}
              onClick={handleCheckIn}
              key="checkin"
            >
              Chấm công hôm nay
            </Button>,
            <Button
              icon={<LogoutOutlined />}
              danger
              type="primary"
              onClick={() => setShowResignModal(true)}
              key="resign"
            >
              Xin nghỉ việc
            </Button>
          ]}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Avatar
              size={96}
              icon={<UserOutlined />}
              style={{ background: '#1890ff', marginBottom: 12 }}
            />
            <Title level={3} style={{ marginBottom: 0 }}>{userInfo.TenNV}</Title>
            <Text type="secondary">{userInfo.TenNQ}</Text>
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
        {/* Bảng lương của nhân viên */}
        <Card
          title="Lịch sử lương của bạn"
          style={{ marginTop: 24, borderRadius: 16 }}
        >
          <Table
            columns={salaryColumns}
            dataSource={salaryList}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: 'Chưa có dữ liệu lương' }}
          />
        </Card>
      </Col>
      {/* Modal đổi mật khẩu */}
      <Modal
        title="Đổi mật khẩu"
        open={showPwdModal}
        onCancel={() => setShowPwdModal(false)}
        footer={null}
        destroyOnClose
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
            <Button type="primary" htmlType="submit" loading={pwdLoading} block>
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
        destroyOnClose
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
            <Button type="primary" htmlType="submit" loading={resignLoading} block>
              Gửi đơn xin nghỉ việc
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default Profile;