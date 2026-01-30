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
  Spin,
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
  QuestionCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import '../styles/DiscountManagement.css';

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
          trangThai: values.TrangThai
        });
        message.success('Tạo coupon thành công!');
      } else {
        await api.put(`/coupons/admin/${values.MaPhieu}`, {
          moTa: values.MoTa,
          loaiGiamGia: values.LoaiGiamGia,
          giaTriGiam: values.GiaTriGiam,
          ngayHetHan: values.NgayHetHan,
          soLanSuDungToiDa: values.SoLanSuDungToiDa,
          trangThai: values.TrangThai
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
      title: 'Xác nhận xóa',
      content: 'Bạn chắc chắn muốn xóa coupon này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.delete(`/coupons/admin/${code}`);
          message.success('Xóa coupon thành công!');
          fetchCoupons();
        } catch (error) {
          message.error('Lỗi khi xóa coupon');
        }
      }
    });
  };

  const handleShowIssueModal = (coupon) => {
    setSelectedCoupon(coupon);
    setShowIssueModal(true);
  };

  const handleIssueCoupon = async (values) => {
    try {
      const payload = values.issueToAll
        ? { issueToAll: true }
        : { makhList: values.makhList };

      await api.post(
        `/coupons/admin/${selectedCoupon.MaPhieu}/issue`,
        payload
      );

      message.success('Phát coupon thành công!');
      setShowIssueModal(false);
      fetchCoupons();
    } catch (error) {
      message.error('Lỗi khi phát coupon');
    }
  };

  const couponColumns = [
    { title: 'Mã Phiếu', dataIndex: 'MaPhieu', key: 'MaPhieu', width: 120 },
    {
      title: 'Mô tả',
      dataIndex: 'MoTa',
      key: 'MoTa',
      ellipsis: true
    },
    {
      title: 'Loại',
      dataIndex: 'LoaiGiamGia',
      key: 'LoaiGiamGia',
      width: 120,
      render: (type) => {
        const colors = {
          FREESHIP: 'orange',
          PERCENT: 'blue',
          AMOUNT: 'green'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      }
    },
    {
      title: 'Giá trị',
      dataIndex: 'GiaTriGiam',
      key: 'GiaTriGiam',
      width: 100,
      render: (val, record) => {
        if (record.LoaiGiamGia === 'FREESHIP') return 'Free';
        if (record.LoaiGiamGia === 'PERCENT') return `${val}%`;
        return `${val?.toLocaleString('vi-VN')}đ`;
      }
    },
    {
      title: 'Thống kê',
      key: 'stats',
      width: 150,
      render: (_, record) => (
        <div>
          <Text type="secondary">Phát: {record.TongPhatHanh || 0}</Text><br />
          <Text type="success">Dùng: {record.DaSuDung || 0}</Text>
        </div>
      )
    },
    {
      title: 'Hết hạn',
      dataIndex: 'NgayHetHan',
      key: 'NgayHetHan',
      width: 120,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'Không giới hạn'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThai',
      key: 'TrangThai',
      width: 100,
      render: (status) => (
        <Tag color={status ? 'success' : 'default'}>
          {status ? 'Hoạt động' : 'Tắt'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Phát coupon">
            <Button
              icon={<SendOutlined />}
              size="small"
              type="primary"
              onClick={() => handleShowIssueModal(record)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleShowForm('edit', record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDelete(record.MaPhieu)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng Coupon"
              value={coupons.length}
              prefix={<TagsOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={coupons.filter(c => c.TrangThai === 1).length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Đã phát hành"
              value={coupons.reduce((sum, c) => sum + (c.TongPhatHanh || 0), 0)}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleShowForm('add')}
        >
          Tạo Coupon mới
        </Button>
      </div>

      <Table
        columns={couponColumns}
        dataSource={coupons}
        rowKey="MaPhieu"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal Tạo/Sửa Coupon */}
      <Modal
        open={showForm}
        title={formType === 'add' ? 'Tạo Coupon mới' : 'Sửa Coupon'}
        onCancel={() => setShowForm(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Mã Phiếu"
            name="MaPhieu"
            rules={[{ required: true, message: 'Vui lòng nhập mã phiếu' }]}
          >
            <Input placeholder="VD: FREESHIP2025" disabled={formType === 'edit'} />
          </Form.Item>

          <Form.Item label="Mô tả" name="MoTa">
            <Input.TextArea rows={2} placeholder="Mô tả về coupon" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Loại giảm giá"
                name="LoaiGiamGia"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn loại">
                  <Option value="FREESHIP">Freeship</Option>
                  <Option value="PERCENT">Giảm %</Option>
                  <Option value="AMOUNT">Giảm tiền</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Giá trị giảm"
                name="GiaTriGiam"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="VD: 10 hoặc 50000"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ngày hết hạn" name="NgayHetHan">
                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Chọn ngày hết hạn"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Số lần dùng tối đa"
                name="SoLanSuDungToiDa"
                initialValue={1}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Trạng thái"
            name="TrangThai"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Phát Coupon */}
      <Modal
        open={showIssueModal}
        title={`Phát coupon: ${selectedCoupon?.MaPhieu}`}
        onCancel={() => setShowIssueModal(false)}
        footer={null}
        width={500}
      >
        <Form onFinish={handleIssueCoupon} layout="vertical">
          <Form.Item label="Chọn khách hàng" name="issueToAll" valuePropName="checked">
            <Switch
              checkedChildren="Tất cả"
              unCheckedChildren="Chọn cụ thể"
              onChange={(checked) => {
                if (checked) {
                  form.setFieldsValue({ makhList: undefined });
                }
              }}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) => {
              const issueToAll = getFieldValue('issueToAll');
              return !issueToAll ? (
                <Form.Item
                  label="Khách hàng"
                  name="makhList"
                  rules={[{ required: true, message: 'Chọn ít nhất 1 khách hàng' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="Chọn khách hàng"
                    showSearch
                    optionFilterProp="label"
                    options={customers.map(c => ({
                      label: `${c.tenkh} - ${c.email}`,
                      value: c.makh
                    }))}
                  />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block icon={<SendOutlined />}>
              Phát Coupon
            </Button>
          </Form.Item>
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

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/preferences/admin/forms');
      setForms(response.data.data || []);
    } catch (error) {
      message.error('Lỗi khi tải danh sách form');
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (formId) => {
    try {
      const response = await api.get(
        `/preferences/admin/forms/${formId}/responses`
      );
      setResponses(response.data.data || []);
    } catch (error) {
      message.error('Lỗi khi tải phản hồi');
    }
  };

  const handleShowDetail = async (form) => {
    setSelectedForm(form);
    setShowDetail(true);
    fetchResponses(form.MaForm);
  };

  const handleToggleStatus = async (formId, currentStatus) => {
    try {
      await api.put(
        `/preferences/admin/forms/${formId}`,
        { trangThai: currentStatus === 1 ? 0 : 1 }
      );
      message.success('Cập nhật trạng thái thành công!');
      fetchForms();
    } catch (error) {
      message.error('Lỗi khi cập nhật');
    }
  };

  const formColumns = [
    { title: 'ID', dataIndex: 'MaForm', key: 'MaForm', width: 60 },
    {
      title: 'Tên Form',
      dataIndex: 'TenForm',
      key: 'TenForm',
      ellipsis: true
    },
    {
      title: 'Số câu hỏi',
      dataIndex: 'SoCauHoi',
      key: 'SoCauHoi',
      width: 120,
      render: (num) => <Badge count={num || 0} showZero />
    },
    {
      title: 'Phản hồi',
      dataIndex: 'SoPhanHoi',
      key: 'SoPhanHoi',
      width: 100,
      render: (num) => <Text type="success">{num || 0}</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThai',
      key: 'TrangThai',
      width: 120,
      render: (status) => (
        <Tag color={status ? 'success' : 'default'}>
          {status ? 'Đang hoạt động' : 'Tạm dừng'}
        </Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'NgayTao',
      key: 'NgayTao',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleShowDetail(record)}
            />
          </Tooltip>
          <Tooltip title={record.TrangThai ? 'Tắt' : 'Bật'}>
            <Button
              icon={<EditOutlined />}
              size="small"
              type={record.TrangThai ? 'default' : 'primary'}
              onClick={() => handleToggleStatus(record.MaForm, record.TrangThai)}
            >
              {record.TrangThai ? 'Tắt' : 'Bật'}
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  const responseColumns = [
    {
      title: 'Khách hàng',
      dataIndex: 'tenkh',
      key: 'tenkh'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Ngày phản hồi',
      dataIndex: 'NgayPhanHoi',
      key: 'NgayPhanHoi',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    }
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng Form"
              value={forms.length}
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Form hoạt động"
              value={forms.filter(f => f.TrangThai === 1).length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng phản hồi"
              value={forms.reduce((sum, f) => sum + (f.SoPhanHoi || 0), 0)}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={formColumns}
        dataSource={forms}
        rowKey="MaForm"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal Chi tiết Form */}
      <Modal
        open={showDetail}
        title={`Chi tiết: ${selectedForm?.TenForm}`}
        onCancel={() => setShowDetail(false)}
        footer={null}
        width={800}
      >
        {selectedForm && (
          <div>
            <Title level={5}>Thông tin Form</Title>
            <p><Text strong>Mô tả:</Text> {selectedForm.MoTa}</p>
            <p><Text strong>Số câu hỏi:</Text> {selectedForm.SoCauHoi || 0}</p>
            <p><Text strong>Số phản hồi:</Text> {selectedForm.SoPhanHoi || 0}</p>

            <Divider />

            <Title level={5}>Danh sách phản hồi</Title>
            <Table
              columns={responseColumns}
              dataSource={responses}
              rowKey="MaPhanHoi"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

/**
 * =====================================================
 * COMPONENT CHÍNH
 * =====================================================
 */
const PromotionManagementTabs = () => {
  const [activeTab, setActiveTab] = useState('coupons');

  return (
    <div className="discount-management-container">
      <Title level={2} style={{ marginBottom: 24 }}>
        <GiftOutlined /> Quản lý Khuyến mãi & Coupon
      </Title>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane
            tab={
              <span>
                <TagsOutlined />
                Quản lý Coupon
              </span>
            }
            key="coupons"
          >
            <CouponManagement />
          </TabPane>

          <TabPane
            tab={
              <span>
                <FormOutlined />
                Form Sở thích
              </span>
            }
            key="preferences"
          >
            <PreferenceFormManagement />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default PromotionManagementTabs;
