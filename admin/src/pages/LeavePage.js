import React, { useEffect, useState, useContext } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, message, Tag, Space, Select } from 'antd';
import api from '../utils/api';
import moment from 'moment';
import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined, CalendarOutlined, FilterOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { PermissionContext } from '../components/PermissionContext';
import '../styles/LeavePage.css';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const LeavePage = () => {
  const { hasPermission } = useContext(PermissionContext);
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Lấy danh sách đơn nghỉ phép
  const fetchLeave = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leave');
      const resData = res.data.data || res.data;
      const leaveList = Array.isArray(resData) ? resData : (resData?.data || []);
      // Sắp xếp theo id giảm dần (mới nhất trên cùng)
      const sortedData = leaveList.sort((a, b) => b.id - a.id);
      setData(sortedData);
    } catch {
      message.error('Lỗi khi tải dữ liệu nghỉ phép');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('Nghĩ Phép', 'Đọc')) {
      fetchLeave();
    } else {
      message.error('Bạn không có quyền xem danh sách nghỉ phép!');
    }
  }, [hasPermission]);

  // Duyệt đơn nghỉ phép
  const handleApprove = async (id) => {
    if (!hasPermission('Nghĩ Phép', 'Sửa')) {
      message.error('Bạn không có quyền duyệt đơn nghỉ phép!');
      return;
    }
    setProcessingId(id);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      await api.put(`/leave/${id}/approve`, {
        nguoi_duyet: userInfo.TenTK || 'admin'
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
    if (!hasPermission('Nghĩ Phép', 'Sửa')) {
      message.error('Bạn không có quyền từ chối đơn nghỉ phép!');
      return;
    }
    setProcessingId(id);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      await api.put(`/leave/${id}/reject`, {
        nguoi_duyet: userInfo.TenTK || 'admin'
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
    {
      title: 'Mã TK',
      dataIndex: 'MaTK',
      width: 90,
      fixed: 'left',
      render: (text) => <span className="font-semibold text-indigo-600">{text}</span>
    },
    {
      title: 'Tên tài khoản',
      dataIndex: 'TenTK',
      width: 150,
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Từ ngày',
      dataIndex: 'ngay_bat_dau',
      render: d => (
        <span className="flex items-center gap-1">
          <CalendarOutlined className="text-blue-500" />
          {moment(d).format('DD/MM/YYYY')}
        </span>
      ),
      width: 120
    },
    {
      title: 'Đến ngày',
      dataIndex: 'ngay_ket_thuc',
      render: d => (
        <span className="flex items-center gap-1">
          <CalendarOutlined className="text-blue-500" />
          {moment(d).format('DD/MM/YYYY')}
        </span>
      ),
      width: 120
    },
    {
      title: 'Số ngày',
      key: 'so_ngay',
      render: (_, record) => {
        const days = moment(record.ngay_ket_thuc).diff(moment(record.ngay_bat_dau), 'days') + 1;
        return <Tag color="purple">{days} ngày</Tag>;
      },
      width: 90
    },
    {
      title: 'Lý do',
      dataIndex: 'ly_do',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      render: v => {
        if (v === 'Da_duyet') return <Tag color="success" icon={<CheckCircleOutlined />}>Đã duyệt</Tag>;
        if (v === 'Tu_choi') return <Tag color="error" icon={<CloseCircleOutlined />}>Từ chối</Tag>;
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ duyệt</Tag>;
      },
      width: 120
    },
    {
      title: 'Người duyệt',
      dataIndex: 'nguoi_duyet',
      width: 120,
      render: (text) => text || <span className="text-gray-400">-</span>
    },
    {
      title: 'Ngày duyệt',
      dataIndex: 'ngay_duyet',
      render: d => d ? moment(d).format('DD/MM/YYYY HH:mm') : <span className="text-gray-400">-</span>,
      width: 150
    },
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) =>
        record.trang_thai === 'Cho_duyet' && hasPermission('Nghĩ Phép', 'Sửa') ? (
          <Space size="small">
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
    if (!hasPermission('Nghĩ Phép', 'Thêm')) {
      message.error('Bạn không có quyền gửi đơn nghỉ phép!');
      return;
    }
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      const MaTK = userInfoStr ? JSON.parse(userInfoStr).MaTK : null;
      if (!MaTK) {
        message.error('Không tìm thấy mã tài khoản!');
        return;
      }
      await api.post('/leave', {
        MaTK,
        ngay_bat_dau: values.date_range[0].format('YYYY-MM-DD'),
        ngay_ket_thuc: values.date_range[1].format('YYYY-MM-DD'),
        ly_do: values.ly_do,
      });
      message.success('Gửi đơn nghỉ phép thành công');
      setOpen(false);
      form.resetFields();
      fetchLeave();
    } catch {
      message.error('Lỗi khi gửi đơn nghỉ phép');
    }
  };

  // Filter data
  const filteredData = filterStatus
    ? data.filter(item => item.trang_thai === filterStatus)
    : data;

  if (!hasPermission('Nghĩ Phép', 'Đọc')) {
    return <div className="no-permission">Bạn không có quyền truy cập trang này!</div>;
  }

  return (
    <div className="leave-page">
      <div className="leave-header">
        <h1>
          <CalendarOutlined /> Quản lý nghỉ phép
        </h1>
      </div>

      <div className="leave-content">
        <div className="leave-filters">
          <div className="filter-group">
            <label><FilterOutlined /> Lọc theo trạng thái:</label>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 200 }}
              placeholder="Tất cả trạng thái"
              allowClear
            >
              <Select.Option value="">Tất cả</Select.Option>
              <Select.Option value="Cho_duyet">Chờ duyệt</Select.Option>
              <Select.Option value="Da_duyet">Đã duyệt</Select.Option>
              <Select.Option value="Tu_choi">Từ chối</Select.Option>
            </Select>
          </div>
          <div className="stats-summary">
            <div className="stat-card pending">
              <span className="stat-number">{data.filter(d => d.trang_thai === 'Cho_duyet').length}</span>
              <span className="stat-label">Chờ duyệt</span>
            </div>
            <div className="stat-card approved">
              <span className="stat-number">{data.filter(d => d.trang_thai === 'Da_duyet').length}</span>
              <span className="stat-label">Đã duyệt</span>
            </div>
            <div className="stat-card rejected">
              <span className="stat-number">{data.filter(d => d.trang_thai === 'Tu_choi').length}</span>
              <span className="stat-label">Từ chối</span>
            </div>
          </div>
        </div>

        <div className="leave-table">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đơn`,
              pageSizeOptions: ['10', '20', '50']
            }}
            size="middle"
          />
        </div>
      </div>

      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        footer={null}
        title={
          <div className="modal-title">
            <CalendarOutlined /> Gửi đơn xin nghỉ phép
          </div>
        }
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="leave-form"
        >
          <Form.Item
            name="date_range"
            label="Thời gian nghỉ"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian nghỉ!' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Form.Item>
          <Form.Item
            name="ly_do"
            label="Lý do nghỉ"
            rules={[{ required: true, message: 'Vui lòng nhập lý do nghỉ!' }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập lý do xin nghỉ phép..."
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item className="form-actions">
            <Space>
              <Button onClick={() => {
                setOpen(false);
                form.resetFields();
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Gửi đơn
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeavePage;