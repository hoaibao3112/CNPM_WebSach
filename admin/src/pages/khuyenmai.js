import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Tag, 
  Form,
  DatePicker,
  InputNumber,
  Modal,
  message 
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const PromotionManager = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ 
    page: 1, 
    limit: 10, 
    total: 0 
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form] = Form.useForm();
  const [editMode, setEditMode] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Cấu hình cột cho bảng
  const columns = [
    { title: 'Tên KM', dataIndex: 'TenKM', key: 'TenKM' },
    {
      title: 'Loại KM',
      dataIndex: 'LoaiKM',
      key: 'LoaiKM',
      render: (text) => ({
        giam_phan_tram: 'Giảm %',
        giam_tien_mat: 'Giảm tiền',
        mua_x_tang_y: 'Mua X tặng Y',
        qua_tang: 'Quà tặng',
        combo: 'Combo'
      }[text])
    },
    {
      title: 'Thời gian',
      key: 'date',
      render: (_, record) => (
        `${new Date(record.NgayBatDau).toLocaleDateString()} - 
         ${new Date(record.NgayKetThuc).toLocaleDateString()}`
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThai',
      key: 'status',
      render: status => (
        <Tag color={status ? 'green' : 'red'}>
          {status ? 'Hoạt động' : 'Vô hiệu'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <div className="actions">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Button 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleToggleStatus(record.MaKM)}
          />
        </div>
      )
    }
  ];

  // Fetch data
  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/khuyenmai', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search,
          activeOnly: statusFilter === 'active'
        }
      });

      setPromotions(res.data.data);
      setPagination(prev => ({ 
        ...prev, 
        total: res.data.pagination.total 
      }));
    } catch (error) {
      message.error('Lỗi tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // Xử lý thay đổi trạng thái
  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/khuyenmai/${id}/toggle-status`
      );
      message.success('Cập nhật trạng thái thành công');
      fetchPromotions();
    } catch (error) {
      message.error('Thao tác thất bại');
    }
  };

  // Xử lý chỉnh sửa khuyến mãi
  const handleEdit = (promotion) => {
    showForm(promotion);
  };

  // Form handling
  const showForm = (promotion = null) => {
    setSelectedPromotion(promotion);
    setEditMode(!!promotion);
    form.resetFields();
    
    if(promotion) {
      form.setFieldsValue({
        ...promotion,
        dateRange: [
            dayjs(promotion.NgayBatDau),
            dayjs(promotion.NgayKetThuc)
        ]
      });
    }
    
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        NgayBatDau: values.dateRange[0].format('YYYY-MM-DD'),
        NgayKetThuc: values.dateRange[1].format('YYYY-MM-DD'),
      };

      const url = editMode 
        ? `http://localhost:5000/api/khuyenmai/${selectedPromotion.MaKM}`
        : 'http://localhost:5000/api/khuyenmai';

      const method = editMode ? 'put' : 'post';

      await axios[method](url, data);

      message.success(editMode ? 'Cập nhật thành công' : 'Tạo mới thành công');
      setModalVisible(false);
      fetchPromotions();
    } catch (error) {
      message.error(error.response?.data?.error || 'Lỗi hệ thống');
    }
  };

  return (
    <div className="promotion-manager">
      {/* Toolbar */}
      <div className="toolbar">
        <Input.Search
          placeholder="Tìm kiếm khuyến mãi..."
          onSearch={value => setSearch(value)}
          style={{ width: 300 }}
        />
        
        <Select
          value={statusFilter}
          onChange={value => setStatusFilter(value)}
          style={{ width: 150, marginLeft: 16 }}
        >
          <Option value="all">Tất cả</Option>
          <Option value="active">Đang hoạt động</Option>
        </Select>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showForm()}
          style={{ float: 'right' }}
        >
          Thêm mới
        </Button>
      </div>

      {/* Bảng dữ liệu */}
      <Table
  columns={columns}
  dataSource={promotions}
  loading={loading}
  pagination={{
    current: pagination.page,
    pageSize: pagination.limit,
    total: pagination.total,
    onChange: page => setPagination(prev => ({ ...prev, page }))
  }}
  rowKey="MaKM"
  style={{ 
    marginTop: 20,
    width: '90%',          // Giảm độ rộng bảng
    marginLeft: 'auto',    // Đẩy bảng sang phải
    marginRight: 20,       // Khoảng cách lề phải
    maxWidth: 1200         // Giới hạn kích thước tối đa
  }}
/>

      {/* Modal form */}
      <Modal
        title={`${editMode ? 'Chỉnh sửa' : 'Tạo mới'} khuyến mãi`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ LoaiKM: 'giam_phan_tram' }}
        >
          <Form.Item
            label="Tên khuyến mãi"
            name="TenKM"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Thời gian áp dụng"
            name="dateRange"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
          >
            <RangePicker format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="Loại khuyến mãi"
            name="LoaiKM"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="giam_phan_tram">Giảm phần trăm</Option>
              <Option value="giam_tien_mat">Giảm tiền mặt</Option>
              <Option value="mua_x_tang_y">Mua X tặng Y</Option>
              <Option value="qua_tang">Quà tặng</Option>
              <Option value="combo">Combo</Option>
            </Select>
          </Form.Item>

          {/* Các trường động theo loại KM */}
          {form.getFieldValue('LoaiKM') === 'giam_phan_tram' && (
            <Form.Item
              label="Phần trăm giảm"
              name={['ChiTiet', 'PhanTramGiam']}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={100} addonAfter="%" />
            </Form.Item>
          )}

          {form.getFieldValue('LoaiKM') === 'giam_tien_mat' && (
            <>
              <Form.Item
                label="Số tiền giảm"
                name={['ChiTiet', 'SoTienGiam']}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} formatter={v => `₫${v}`} />
              </Form.Item>

              <Form.Item
                label="Đơn tối thiểu"
                name={['ChiTiet', 'GiaTriDonToiThieu']}
              >
                <InputNumber min={0} formatter={v => `₫${v}`} />
              </Form.Item>
            </>
          )}

          {form.getFieldValue('LoaiKM') === 'mua_x_tang_y' && (
            <>
              <Form.Item
                label="Số lượng mua"
                name={['ChiTiet', 'SoLuongMua']}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} />
              </Form.Item>

              <Form.Item
                label="Số lượng tặng"
                name={['ChiTiet', 'SoLuongTang']}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editMode ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionManager;