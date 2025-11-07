import React, { useEffect, useState } from 'react';
import { 
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
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SyncOutlined,
  SearchOutlined,
  GiftOutlined,
  CalendarOutlined,
  PercentageOutlined,
  DollarOutlined,
  TagOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import '../styles/DiscountManagement.css';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const defaultForm = {
  TenKM: '',
  MoTa: '',
  NgayBatDau: '',
  NgayKetThuc: '',
  LoaiKM: '',
  Code: '',
  GiaTriGiam: null,
  GiaTriDonToiThieu: null,
  GiamToiDa: null,
  SoLuongToiThieu: null,
  SanPhamApDung: [],
};

const generateRandomCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const DiscountManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('add');
  const [formError, setFormError] = useState('');
  const [form] = Form.useForm();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [toggleStatusLoading, setToggleStatusLoading] = useState({});
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  // Lấy danh sách khuyến mãi
  useEffect(() => {
    fetchPromotions();
  }, [reload, search]);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/khuyenmai?search=${encodeURIComponent(search)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      
      const data = response.data.data || [];
      setPromotions(data);
      
      // Tính thống kê
      const totalPromotions = data.length;
      const activePromotions = data.filter(p => Number(p.TrangThai) === 1).length;
      const inactivePromotions = totalPromotions - activePromotions;
      
      setStats({
        total: totalPromotions,
        active: activePromotions,
        inactive: inactivePromotions
      });
      
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách khuyến mãi');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách sản phẩm khi mở form
  useEffect(() => {
    if (showForm) {
      fetchProducts();
    }
  }, [showForm]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/product', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      setProductOptions(
        (response.data || []).map((sp) => ({
          label: `${sp.TenSP} (ID: ${sp.MaSP})`,
          value: sp.MaSP,
        }))
      );
    } catch (err) {
      console.error('Error fetching products:', err);
      setProductOptions([]);
    }
  };

  // Xem chi tiết
  const handleShowDetail = async (id) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/khuyenmai/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setDetail(response.data);
    } catch (err) {
      setDetail({ error: 'Không thể tải chi tiết khuyến mãi' });
      console.error('Detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Hiện form thêm/sửa
  const handleShowForm = (type, data) => {
    setFormType(type);
    setFormError('');
    
    if (type === 'edit' && data) {
      form.setFieldsValue({
        TenKM: data.TenKM,
        MoTa: data.MoTa,
        NgayBatDau: data.NgayBatDau ? dayjs(data.NgayBatDau) : null,
        NgayKetThuc: data.NgayKetThuc ? dayjs(data.NgayKetThuc) : null,
        LoaiKM: data.LoaiKM,
        Code: data.Code,
        GiaTriGiam: data.GiaTriGiam,
        GiaTriDonToiThieu: data.GiaTriDonToiThieu,
        GiamToiDa: data.GiamToiDa,
        SoLuongToiThieu: data.SoLuongToiThieu,
        SanPhamApDung: data.SanPhamApDung || [],
        MaKM: data.MaKM,
      });
    } else {
      form.setFieldsValue(defaultForm);
    }
    setShowForm(true);
  };

  // Thêm/sửa khuyến mãi
  const handleSubmitForm = async () => {
    try {
      const values = await form.validateFields();
      setFormError('');
      
      // Chuyển ngày về string
      values.NgayBatDau = values.NgayBatDau ? values.NgayBatDau.format('YYYY-MM-DD') : '';
      values.NgayKetThuc = values.NgayKetThuc ? values.NgayKetThuc.format('YYYY-MM-DD') : '';
      
      if (formType === 'add') {
        await axios.post('http://localhost:5000/api/khuyenmai', values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        message.success('Thêm khuyến mãi thành công!');
      } else {
        await axios.put(`http://localhost:5000/api/khuyenmai/${values.MaKM}`, values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        message.success('Cập nhật khuyến mãi thành công!');
      }
      
      setShowForm(false);
      setReload(r => !r);
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0] || 
                      err.response?.data?.error || 
                      'Lỗi khi lưu khuyến mãi';
      setFormError(errorMsg);
      message.error(errorMsg);
    }
  };

  // Xóa khuyến mãi
  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn chắc chắn muốn xóa khuyến mãi này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      onOk: async () => {
        setDeleteId(id);
        setDeleteLoading(true);
        try {
          await axios.delete(`http://localhost:5000/api/khuyenmai/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          });
          message.success('Đã xóa khuyến mãi thành công!');
          setReload(r => !r);
        } catch (err) {
          message.error('Lỗi khi xóa khuyến mãi');
          console.error('Delete error:', err);
        } finally {
          setDeleteId(null);
          setDeleteLoading(false);
        }
      },
    });
  };

 // Sửa function handleToggleStatus - ĐÃ SỬA LOGIC
const handleToggleStatus = async (id, currentStatus) => {
  // Logic đúng: 1 = hoạt động, 0 = ngừng hoạt động
  const currentStatusNum = Number(currentStatus);
  const newStatus = currentStatusNum === 1 ? 0 : 1;
  
  setToggleStatusLoading(prev => ({ ...prev, [id]: true }));
  
  try {
    await axios.patch(`http://localhost:5000/api/khuyenmai/${id}/trangthai`, 
      { trangThai: newStatus }, 
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );
      
      // Cập nhật state ngay lập tức
    setPromotions(prevPromotions => 
      prevPromotions.map(promotion => 
        promotion.MaKM === id 
          ? { ...promotion, TrangThai: newStatus }
          : promotion
      )
    );
    
    // Cập nhật detail nếu đang xem chi tiết
    if (detail && detail.MaKM === id) {
      setDetail(prev => ({ ...prev, TrangThai: newStatus }));
    }
    
    // Cập nhật stats
    setStats(prevStats => {
      const diff = newStatus === 1 ? 1 : -1;
      return {
        ...prevStats,
        active: prevStats.active + diff,
        inactive: prevStats.inactive - diff
      };
    });
    
    // Message đúng logic
    message.success(`Đã ${newStatus === 1 ? 'kích hoạt' : 'tắt'} khuyến mãi thành công!`);
  } catch (error) {
    message.error('Lỗi khi đổi trạng thái khuyến mãi!');
    console.error('Toggle status error:', error);
  } finally {
    setToggleStatusLoading(prev => ({ ...prev, [id]: false }));
  }
};

  // Render status với logic đã sửa
  const renderStatus = (trangThai) => {
  // Logic đúng: 1 = hoạt động, 0 = ngừng hoạt động
  const isActive = Number(trangThai) === 1;
  return (
    <Tag 
      color={isActive ? 'success' : 'default'} 
      icon={isActive ? <SyncOutlined /> : null}
    >
      {isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
    </Tag>
  );
};

  // Render loại khuyến mãi
  const renderPromotionType = (loaiKM) => {
    if (loaiKM === 'giam_phan_tram') {
      return (
        <Tag color="blue" icon={<PercentageOutlined />}>
          Giảm %
        </Tag>
      );
    } else if (loaiKM === 'giam_tien_mat') {
      return (
        <Tag color="green" icon={<DollarOutlined />}>
          Giảm tiền
        </Tag>
      );
    } else if (loaiKM === 'free_ship') {
      return (
        <Tag color="orange" icon={<GiftOutlined />}>
          Free Ship
        </Tag>
      );
    }
    return <Tag>{loaiKM}</Tag>;
  };

  const columns = [
    { 
      title: '#', 
      dataIndex: 'MaKM', 
      key: 'MaKM', 
      width: 60, 
      render: (_, __, idx) => (
        <Text strong style={{ color: '#1890ff' }}>
          {idx + 1}
        </Text>
      )
    },
    { 
      title: 'Tên khuyến mãi', 
      dataIndex: 'TenKM', 
      key: 'TenKM',
      ellipsis: {
        showTitle: false,
      },
      render: (tenKM) => (
        <Tooltip placement="topLeft" title={tenKM}>
          <Text strong>{tenKM}</Text>
        </Tooltip>
      ),
    },
    { 
      title: 'Loại KM', 
      dataIndex: 'LoaiKM', 
      key: 'LoaiKM',
      width: 120,
      render: renderPromotionType
    },
    { 
      title: 'Mã code', 
      dataIndex: 'Code', 
      key: 'Code',
      width: 120,
      render: (code) => (
        <Tag icon={<TagOutlined />} color="purple">
          {code}
        </Tag>
      )
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <CalendarOutlined /> Từ: {record.NgayBatDau?.slice(0, 10)}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <CalendarOutlined /> Đến: {record.NgayKetThuc?.slice(0, 10)}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThai',
      key: 'TrangThai',
      width: 130,
      render: renderStatus,
    },
    {
      title: 'Thao tác',
    key: 'action',
    width: 200,
    render: (_, record) => {
      // Logic đúng: 1 = hoạt động, 0 = ngừng hoạt động
      const isActive = Number(record.TrangThai) === 1;
      return (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<EyeOutlined />} 
              size="small" 
              onClick={() => handleShowDetail(record.MaKM)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              type="primary"
              onClick={() => handleShowForm('edit', record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              loading={deleteLoading && deleteId === record.MaKM}
              onClick={() => handleDelete(record.MaKM)}
            />
          </Tooltip>
          <Tooltip title={isActive ? 'Tắt khuyến mãi' : 'Bật khuyến mãi'}>
            <Button
              icon={<SyncOutlined />}
              size="small"
              type={isActive ? 'default' : 'primary'}
              loading={toggleStatusLoading[record.MaKM] || false}
              onClick={() => handleToggleStatus(record.MaKM, record.TrangThai)}
            >
              {isActive ? 'Tắt' : 'Bật'}
            </Button>
          </Tooltip>
        </Space>
      );
    },
  },
];

  return (
    <div className="discount-management-container">
      <div className="header-section">
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          <GiftOutlined /> Quản lý khuyến mãi
        </Title>
        
        {/* Statistics Cards */}
        <Row gutter={16} style={{ margin: '16px 0' }}>
          <Col span={8}>
            <Card size="small" className="stat-card">
              <div className="stat-content">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Tổng khuyến mãi</div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="stat-card success">
              <div className="stat-content">
                <div className="stat-number">{stats.active}</div>
                <div className="stat-label">Đang hoạt động</div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="stat-card warning">
              <div className="stat-content">
                <div className="stat-number">{stats.inactive}</div>
                <div className="stat-label">Ngừng hoạt động</div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Controls */}
        <div className="controls-section">
          <Input.Search
            placeholder="Tìm kiếm tên khuyến mãi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleShowForm('add')}
            size="large"
          >
            Thêm khuyến mãi
          </Button>
        </div>
      </div>

      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={promotions}
          rowKey="MaKM"
          loading={loading}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} khuyến mãi`
          }}
          locale={{ emptyText: error || 'Không có khuyến mãi nào' }}
          scroll={{ x: 1000 }}
          size="small"
          className="promotion-table"
        />
      </Card>

      {/* Modal chi tiết */}
      <Modal
        open={!!detail}
        title={
          <div>
            <GiftOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Chi tiết khuyến mãi
          </div>
        }
        onCancel={() => setDetail(null)}
        footer={null}
        width={600}
        className="detail-modal"
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Đang tải chi tiết...</div>
          </div>
        ) : detail?.error ? (
          <div style={{ color: 'red', textAlign: 'center', padding: '40px' }}>
            {detail.error}
          </div>
        ) : detail ? (
          <div className="detail-content">
            <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>
              {detail.TenKM}
            </Title>
            
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text strong>Mã code:</Text>
                <div>
                  <Tag color="purple" style={{ marginTop: 4 }}>
                    {detail.Code}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <Text strong>Loại khuyến mãi:</Text>
                <div style={{ marginTop: 4 }}>
                  {renderPromotionType(detail.LoaiKM)}
                </div>
              </Col>
              <Col span={24}>
                <Text strong>Mô tả:</Text>
                <div style={{ marginTop: 4 }}>{detail.MoTa || 'Không có mô tả'}</div>
              </Col>
              <Col span={12}>
                <Text strong>Ngày bắt đầu:</Text>
                <div style={{ marginTop: 4 }}>{detail.NgayBatDau?.slice(0, 10)}</div>
              </Col>
              <Col span={12}>
                <Text strong>Ngày kết thúc:</Text>
                <div style={{ marginTop: 4 }}>{detail.NgayKetThuc?.slice(0, 10)}</div>
              </Col>
              <Col span={12}>
                <Text strong>Trạng thái:</Text>
                <div style={{ marginTop: 4 }}>
                  {renderStatus(detail.TrangThai)}
                </div>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Thông tin chi tiết</Title>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text strong>Giá trị giảm:</Text>
                <div>{detail.GiaTriGiam}</div>
              </Col>
              <Col span={12}>
                <Text strong>Giá trị đơn tối thiểu:</Text>
                <div>{detail.GiaTriDonToiThieu}</div>
              </Col>
              <Col span={12}>
                <Text strong>Giảm tối đa:</Text>
                <div>{detail.GiamToiDa}</div>
              </Col>
              <Col span={12}>
                <Text strong>Số lượng tối thiểu:</Text>
                <div>{detail.SoLuongToiThieu}</div>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Sản phẩm áp dụng</Title>
            {(detail.SanPhamApDung || []).length === 0 ? (
              <Tag color="blue">Áp dụng cho tất cả sản phẩm</Tag>
            ) : (
              <div>
                {(detail.SanPhamApDung || []).map((sp, index) => (
                  <Tag key={index} style={{ margin: '2px' }}>
                    {sp.TenSP ? `${sp.TenSP} (ID: ${sp.MaSP})` : sp.MaSP || sp}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Modal thêm/sửa */}
      <Modal
        open={showForm}
        title={
          <div>
            {formType === 'add' ? <PlusOutlined /> : <EditOutlined />}
            <span style={{ marginLeft: 8 }}>
              {formType === 'add' ? 'Thêm khuyến mãi' : 'Sửa khuyến mãi'}
            </span>
          </div>
        }
        onCancel={() => setShowForm(false)}
        onOk={handleSubmitForm}
        okText={formType === 'add' ? 'Thêm' : 'Cập nhật'}
        cancelText="Hủy"
        width={800}
        className="form-modal"
      >
        {formError && (
          <div className="error-message">
            {formError}
          </div>
        )}
        
        <Form
          form={form}
          layout="vertical"
          initialValues={defaultForm}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Tên khuyến mãi" 
                name="TenKM" 
                rules={[{ required: true, message: 'Vui lòng nhập tên khuyến mãi' }]}
              >
                <Input placeholder="Nhập tên khuyến mãi" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Loại khuyến mãi" 
                name="LoaiKM" 
                rules={[{ required: true, message: 'Vui lòng chọn loại khuyến mãi' }]}
              >
                <Select placeholder="Chọn loại khuyến mãi">
                  <Option value="giam_phan_tram">
                    <PercentageOutlined /> Giảm theo phần trăm
                  </Option>
                  <Option value="giam_tien_mat">
                    <DollarOutlined /> Giảm tiền mặt
                  </Option>
                  <Option value="free_ship">
                    <GiftOutlined /> Miễn phí vận chuyển (Free Ship)
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Mô tả" name="MoTa">
            <Input.TextArea rows={3} placeholder="Nhập mô tả khuyến mãi" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Ngày bắt đầu" 
                name="NgayBatDau" 
                rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="Chọn ngày bắt đầu"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Ngày kết thúc" 
                name="NgayKetThuc" 
                rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="Chọn ngày kết thúc"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Mã code" name="Code">
            <Input
              placeholder="Nhập mã code hoặc tạo ngẫu nhiên"
              addonAfter={
                <Button
                  type="link"
                  onClick={() => form.setFieldsValue({ Code: generateRandomCode(8) })}
                  style={{ border: 'none', padding: '0 8px' }}
                >
                  Tạo ngẫu nhiên
                </Button>
              }
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.LoaiKM !== currentValues.LoaiKM}>
            {({ getFieldValue }) => {
              const loaiKM = getFieldValue('LoaiKM');
              const isFreeShip = loaiKM === 'free_ship';
              const isPercent = loaiKM === 'giam_phan_tram';
              const isFixed = loaiKM === 'giam_tien_mat';

              return (
                <>
                  {/* Chỉ hiện Giá trị giảm khi KHÔNG phải Free Ship */}
                  {!isFreeShip && (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item 
                          label="Giá trị giảm" 
                          name="GiaTriGiam"
                          tooltip="Nhập % (ví dụ: 10) hoặc số tiền (ví dụ: 50000)"
                        >
                          <Input 
                            type="number" 
                            placeholder="Ví dụ: 10 hoặc 50000"
                            addonAfter={isPercent ? '%' : 'VND'}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          label="Giá trị đơn tối thiểu" 
                          name="GiaTriDonToiThieu"
                          tooltip="Đơn hàng phải có giá trị tối thiểu để áp dụng"
                        >
                          <Input 
                            type="number" 
                            placeholder="Ví dụ: 100000"
                            addonAfter="VND"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}

                  {/* Giá trị đơn tối thiểu cho Free Ship */}
                  {isFreeShip && (
                    <Form.Item 
                      label="Giá trị đơn tối thiểu" 
                      name="GiaTriDonToiThieu"
                      tooltip="Đơn hàng phải có giá trị tối thiểu để được miễn phí ship"
                    >
                      <Input 
                        type="number" 
                        placeholder="Ví dụ: 200000"
                        addonAfter="VND"
                      />
                    </Form.Item>
                  )}

                  {/* Chỉ hiện với giảm phần trăm hoặc giảm tiền */}
                  {!isFreeShip && (
                    <Row gutter={16}>
                      {isPercent && (
                        <Col span={12}>
                          <Form.Item 
                            label="Giảm tối đa" 
                            name="GiamToiDa"
                            tooltip="Số tiền giảm tối đa cho khuyến mãi phần trăm"
                          >
                            <Input 
                              type="number" 
                              placeholder="Ví dụ: 200000"
                              addonAfter="VND"
                            />
                          </Form.Item>
                        </Col>
                      )}
                      {isFixed && (
                        <Col span={12}>
                          <Form.Item 
                            label="Số lượng tối thiểu" 
                            name="SoLuongToiThieu"
                            tooltip="Áp dụng cho khuyến mãi giảm tiền"
                          >
                            <Input 
                              type="number" 
                              placeholder="Ví dụ: 2"
                              addonAfter="sản phẩm"
                            />
                          </Form.Item>
                        </Col>
                      )}
                    </Row>
                  )}

                  {/* Sản phẩm áp dụng - ẩn với Free Ship vì áp dụng toàn bộ đơn hàng */}
                  {!isFreeShip && (
                    <Form.Item 
                      label="Sản phẩm áp dụng" 
                      name="SanPhamApDung"
                      tooltip="Để trống nếu áp dụng cho tất cả sản phẩm"
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Chọn sản phẩm hoặc để trống để áp dụng tất cả"
                        options={productOptions}
                        optionFilterProp="label"
                        showSearch
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  )}
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DiscountManagement;