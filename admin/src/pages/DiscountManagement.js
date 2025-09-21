import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Modal, Form, Select, Tag, Space, message, DatePicker } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;

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

  // Lấy danh sách khuyến mãi
  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/khuyenmai?search=${encodeURIComponent(search)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      })
      .then((res) => {
        setPromotions(res.data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Không thể tải danh sách khuyến mãi');
        setLoading(false);
      });
  }, [reload, search]);

  // Lấy danh sách sản phẩm khi mở form
  useEffect(() => {
    if (showForm) {
      axios
        .get('http://localhost:5000/api/product', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        })
        .then((res) => {
          setProductOptions(
            (res.data || []).map((sp) => ({
              label: `${sp.TenSP} (ID: ${sp.MaSP})`,
              value: sp.MaSP,
            }))
          );
        })
        .catch(() => setProductOptions([]));
    }
  }, [showForm]);

  // Xem chi tiết
  const handleShowDetail = async (id) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/khuyenmai/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setDetail(res.data);
    } catch {
      setDetail({ error: 'Không thể tải chi tiết khuyến mãi' });
    }
    setDetailLoading(false);
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
      setFormError(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Lỗi khi lưu khuyến mãi');
    }
  };

  // Xóa khuyến mãi
  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Bạn chắc chắn muốn xóa khuyến mãi này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        setDeleteId(id);
        setDeleteLoading(true);
        try {
          await axios.delete(`http://localhost:5000/api/khuyenmai/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          });
          setReload(r => !r);
          message.success('Đã xóa khuyến mãi!');
        } catch {
          message.error('Lỗi khi xóa khuyến mãi');
        }
        setDeleteId(null);
        setDeleteLoading(false);
      },
    });
  };

  // Đổi trạng thái
  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/khuyenmai/${id}/trangthai`, { trangThai: 1 }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setReload(r => !r);
      message.success('Đã đổi trạng thái!');
    } catch {
      message.error('Lỗi khi đổi trạng thái!');
    }
  };

  const columns = [
    { title: '#', dataIndex: 'MaKM', key: 'MaKM', width: 60, render: (_, __, idx) => idx + 1 },
    { title: 'Tên KM', dataIndex: 'TenKM', key: 'TenKM' },
    { title: 'Loại KM', dataIndex: 'LoaiKM', key: 'LoaiKM' },
    { title: 'Mã code', dataIndex: 'Code', key: 'Code' },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, r) => (
        <span>
          {r.NgayBatDau?.slice(0, 10)} - {r.NgayKetThuc?.slice(0, 10)}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThai',
      key: 'TrangThai',
      render: (active) =>
        active ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="default">Ngừng</Tag>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} size="small" style={{ padding: '0 6px', fontSize: 13 }} onClick={() => handleShowDetail(record.MaKM)}>
            Xem
          </Button>
          <Button icon={<EditOutlined />} size="small" style={{ padding: '0 6px', fontSize: 13 }} onClick={() => handleShowForm('edit', record)}>
            Sửa
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            style={{ padding: '0 6px', fontSize: 13 }}
            loading={deleteLoading && deleteId === record.MaKM}
            onClick={() => handleDelete(record.MaKM)}
          >
            Xóa
          </Button>
          <Button
            icon={<SyncOutlined />}
            size="small"
            style={{ padding: '0 6px', fontSize: 13 }}
            onClick={() => handleToggleStatus(record.MaKM)}
          >
            Đổi
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="discount-management-container">
      <div className="header-section">
        <h1 className="page-title">Quản lý khuyến mãi</h1>
        <div className="search-box">
          <Input.Search
            placeholder="Tìm kiếm tên khuyến mãi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 260 }}
            allowClear
            size="small"
          />
        </div>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleShowForm('add')}
        >
          Thêm khuyến mãi
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={promotions}
        rowKey="MaKM"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: false, size: 'small' }}
        locale={{ emptyText: error || 'Không có khuyến mãi nào' }}
        style={{ background: '#fff', fontSize: 13, minWidth: 900, marginLeft: 'auto' }}
        scroll={{ x: 900 }}
        size="small"
        className="compact-discount-table"
      />

  <Modal
  open={!!detail}
  title="Chi tiết khuyến mãi"
  onCancel={() => setDetail(null)}
  footer={null}
  width={500}
>
  {detailLoading ? (
    <div>Đang tải chi tiết...</div>
  ) : detail?.error ? (
    <div style={{ color: 'red' }}>{detail.error}</div>
  ) : detail ? (
    <div>
      <h3 style={{ fontWeight: 600 }}>{detail.TenKM}</h3>
      <div>
        <b>Mã code:</b>{' '}
        <span style={{ color: '#1677ff', fontWeight: 600 }}>{detail.Code}</span>
      </div>
      <div><b>Mô tả:</b> {detail.MoTa}</div>
      <div><b>Loại:</b> {detail.LoaiKM}</div>
      <div><b>Ngày bắt đầu:</b> {detail.NgayBatDau?.slice(0, 10)}</div>
      <div><b>Ngày kết thúc:</b> {detail.NgayKetThuc?.slice(0, 10)}</div>
      <div><b>Trạng thái:</b> {detail.TrangThai ? 'Đang hoạt động' : 'Ngừng'}</div>
      <div style={{ marginTop: 8 }}>
        <b>Giá trị giảm:</b> {detail.GiaTriGiam}
      </div>
      <div>
        <b>Giá trị đơn tối thiểu:</b> {detail.GiaTriDonToiThieu}
      </div>
      <div>
        <b>Giảm tối đa:</b> {detail.GiamToiDa}
      </div>
      <div>
        <b>Số lượng tối thiểu:</b> {detail.SoLuongToiThieu}
      </div>
      <div style={{ marginTop: 8 }}>
        <b>Sản phẩm áp dụng:</b>
        <ul>
          {(detail.SanPhamApDung || []).length === 0 && <li>Áp dụng cho tất cả sản phẩm</li>}
          {(detail.SanPhamApDung || []).map((sp) =>
            <li key={sp.MaSP || sp}>
              {sp.TenSP
                ? `${sp.TenSP} (ID: ${sp.MaSP})`
                : sp.MaSP || sp}
            </li>
          )}
        </ul>
      </div>
    </div>
  ) : null}
</Modal>
      {/* Modal thêm/sửa */}
      <Modal
        open={showForm}
        title={formType === 'add' ? 'Thêm khuyến mãi' : 'Sửa khuyến mãi'}
        onCancel={() => setShowForm(false)}
        onOk={handleSubmitForm}
        okText={formType === 'add' ? 'Thêm' : 'Cập nhật'}
        width={500}
      >
        {formError && <div style={{ color: 'red', marginBottom: 8 }}>{formError}</div>}
        <Form
          form={form}
          layout="vertical"
          initialValues={defaultForm}
        >
          <Form.Item label="Tên khuyến mãi" name="TenKM" rules={[{ required: true, message: 'Nhập tên khuyến mãi' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Mô tả" name="MoTa">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Ngày bắt đầu" name="NgayBatDau" rules={[{ required: true, message: 'Chọn ngày bắt đầu' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Ngày kết thúc" name="NgayKetThuc" rules={[{ required: true, message: 'Chọn ngày kết thúc' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Loại khuyến mãi" name="LoaiKM" rules={[{ required: true, message: 'Chọn loại khuyến mãi' }]}>
            <Select>
              <Option value="giam_phan_tram">Giảm %</Option>
              <Option value="giam_tien_mat">Giảm tiền</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Mã code" name="Code">
            <Input
              addonAfter={
                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={() => form.setFieldsValue({ Code: generateRandomCode(8) })}
                >
                  Tạo ngẫu nhiên
                </Button>
              }
            />
          </Form.Item>
          <Form.Item label="Giá trị giảm (%) hoặc số tiền" name="GiaTriGiam">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Giá trị đơn tối thiểu" name="GiaTriDonToiThieu">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Giảm tối đa" name="GiamToiDa">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Số lượng tối thiểu (áp dụng cho giảm tiền)" name="SoLuongToiThieu">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Danh sách sản phẩm áp dụng" name="SanPhamApDung">
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn sản phẩm áp dụng"
              options={productOptions}
              optionFilterProp="label"
              showSearch
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .discount-management-container {
          padding: 16px 16px 16px 216px;
          min-height: 100vh;
        }
        .header-section {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .page-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 16px 0 0;
        }
        .search-box {
          width: 260px;
        }
        .compact-discount-table :global(.ant-table-thead > tr > th) {
          padding: 8px 12px;
        }
        .compact-discount-table :global(.ant-table-tbody > tr > td) {
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
};

export default DiscountManagement;