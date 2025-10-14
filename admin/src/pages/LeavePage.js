import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, message, Tag, Space } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';

const LeavePage = () => {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Lấy danh sách đơn nghỉ phép
  const fetchLeave = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/leave');
      setData(res.data);
    } catch {
      message.error('Lỗi khi tải dữ liệu nghỉ phép');
    }
  };

  useEffect(() => { fetchLeave(); }, []);

  // Duyệt đơn nghỉ phép
  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await axios.put(`http://localhost:5000/api/leave/${id}/approve`, {
        nguoi_duyet: localStorage.getItem('username') || 'admin'
      });
      message.success('Đã duyệt đơn nghỉ phép');
      fetchLeave();
    } catch {
      message.error('Duyệt đơn thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  // Từ chối đơn nghỉ phép
  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await axios.put(`http://localhost:5000/api/leave/${id}/reject`, {
        nguoi_duyet: localStorage.getItem('username') || 'admin'
      });
      message.success('Đã từ chối đơn nghỉ phép');
      fetchLeave();
    } catch {
      message.error('Từ chối đơn thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  // Cột bảng
  const columns = [
    { title: 'Mã TK', dataIndex: 'MaTK', width: 80, fixed: 'left' },
    { title: 'Tên TK', dataIndex: 'TenTK', width: 140 },
    { title: 'Từ ngày', dataIndex: 'ngay_bat_dau', render: d => moment(d).format('DD/MM/YYYY'), width: 110 },
    { title: 'Đến ngày', dataIndex: 'ngay_ket_thuc', render: d => moment(d).format('DD/MM/YYYY'), width: 110 },
    { title: 'Lý do', dataIndex: 'ly_do', width: 160 },
    { 
      title: 'Trạng thái', 
      dataIndex: 'trang_thai',
      render: v => v === 'Da_duyet'
        ? <Tag color="green">Đã duyệt</Tag>
        : v === 'Tu_choi'
        ? <Tag color="red">Từ chối</Tag>
        : <Tag color="orange">Chờ duyệt</Tag>,
      width: 110
    },
    { title: 'Người duyệt', dataIndex: 'nguoi_duyet', width: 110 },
    { title: 'Ngày duyệt', dataIndex: 'ngay_duyet', render: d => d ? moment(d).format('DD/MM/YYYY HH:mm') : '', width: 140 },
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) =>
        record.trang_thai === 'Cho_duyet' ? (
          <Space>
            <Button
              icon={<CheckCircleOutlined />}
              type="primary"
              size="small"
              loading={processingId === record.id}
              onClick={() => handleApprove(record.id)}
            >
              Duyệt
            </Button>
            <Button
              icon={<CloseCircleOutlined />}
              danger
              size="small"
              loading={processingId === record.id}
              onClick={() => handleReject(record.id)}
            >
              Từ chối
            </Button>
          </Space>
        ) : null,
    },
  ];

  // Gửi đơn nghỉ phép
  const onFinish = async (values) => {
    try {
      // Lấy MaTK từ localStorage (giả sử đã lưu khi đăng nhập)
      const userInfoStr = localStorage.getItem('userInfo');
      const MaTK = userInfoStr ? JSON.parse(userInfoStr).MaTK : null;
      if (!MaTK) {
        message.error('Không tìm thấy mã tài khoản!');
        return;
      }
      await axios.post('http://localhost:5000/api/leave', {
        MaTK,
        ngay_bat_dau: values.ngay_bat_dau.format('YYYY-MM-DD'),
        ngay_ket_thuc: values.ngay_ket_thuc.format('YYYY-MM-DD'),
        ly_do: values.ly_do,
      });
      message.success('Gửi đơn nghỉ phép thành công');
      setOpen(false);
      fetchLeave();
    } catch {
      message.error('Lỗi khi gửi đơn nghỉ phép');
    }
  };

  return (
    <div className="leave-management-container">
      <div className="header-section">
        <h1 className="page-title"><PlusOutlined /> Quản lý nghỉ phép</h1>
        <Button type="primary" onClick={() => setOpen(true)}>
          Gửi đơn nghỉ phép
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        style={{ fontSize: '13px', background: '#fff', borderRadius: 8 }}
        pagination={{ pageSize: 8, showSizeChanger: false, size: 'small' }}
        size="small"
        scroll={{ x: 950 }}
        className="compact-leave-table"
      />
  <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="Xin nghỉ phép" destroyOnHidden>
        <Form layout="vertical" onFinish={onFinish}>
          {/* Không cho nhập MaTK, tự động lấy từ localStorage */}
          <Form.Item name="ngay_bat_dau" label="Từ ngày" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="ngay_ket_thuc" label="Đến ngày" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="ly_do" label="Lý do" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Gửi đơn
          </Button>
        </Form>
      </Modal>
  <style>{`
        .leave-management-container {
    
          min-height: 100vh;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .page-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        .compact-leave-table :global(.ant-table-thead > tr > th) {
          padding: 8px 12px;
        }
        .compact-leave-table :global(.ant-table-tbody > tr > td) {
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
};

export default LeavePage;