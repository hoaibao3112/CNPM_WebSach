import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Button, Input, message, Table, Modal, Space, Select } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import '../styles/ProductManagement.css';

const { Search } = Input;
const { confirm } = Modal;
const { Option } = Select;

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [newProduct, setNewProduct] = useState({
    MaTL: '',
    TenSP: '',
    HinhAnhPrimary: null,
    HinhAnhPhu: [],
    MaTG: '',
    NamXB: '',
    TinhTrang: 'Hết hàng',
    DonGia: 0,
    SoLuong: 0,
    MoTa: '',
    MaNCC: '',
    TrongLuong: '',
    KichThuoc: '',
    SoTrang: '',
    HinhThuc: '',
    MinSoLuong: 0,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingExtraFiles, setEditingExtraFiles] = useState([]);
  const [minModalVisible, setMinModalVisible] = useState(false);
  const [minValue, setMinValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = '/product';
  const AUTHORS_API_URL = '/product/authors';
  const CATEGORIES_API_URL = '/product/categories';
  const SUPPLIERS_API_URL = '/product/suppliers';

  // Fetch danh sách tác giả
  const fetchAuthors = async () => {
    try {
      const response = await api.get(AUTHORS_API_URL);
      // Handle wrapped paginated response { data: { data: [], ... } } or simple { data: [] }
      const resData = response.data.data || response.data;
      setAuthors(Array.isArray(resData) ? resData : (resData?.data || []));
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tác giả:', error);
      message.error('Lỗi khi tải danh sách tác giả');
    }
  };

  // Fetch danh sách thể loại
  const fetchCategories = async () => {
    try {
      const response = await api.get(CATEGORIES_API_URL);
      const resData = response.data.data || response.data;
      setCategories(Array.isArray(resData) ? resData : (resData?.data || []));
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thể loại:', error);
      message.error('Lỗi khi tải danh sách thể loại');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get(SUPPLIERS_API_URL);
      const resData = response.data.data || response.data;
      setSuppliers(Array.isArray(resData) ? resData : (resData?.data || []));
    } catch (error) {
      console.error('Lỗi khi lấy danh sách nhà cung cấp:', error);
      message.error('Lỗi khi tải danh sách nhà cung cấp');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_URL);
      const productsData = response.data.data;
      if (Array.isArray(productsData)) {
        const processedProducts = productsData.map((product) => ({
          ...product,
          HinhAnh: product.HinhAnh && product.HinhAnh !== 'null'
            ? `/img/products/${product.HinhAnh}`
            : 'https://via.placeholder.com/50',
          // ✅ SỬA LOGIC: Nếu SoLuong > 0 thì "Còn hàng", ngược lại "Hết hàng"
          TinhTrang: (product.SoLuong && product.SoLuong > 0) ? 'Còn hàng' : 'Hết hàng',
          MinSoLuong: product.MinSoLuong || 0,
          MoTa: product.MoTa || null,
          MaNCC: product.MaNCC || null,
          NhaCungCap: product.NhaCungCap || null,
          TrongLuong: product.TrongLuong == null ? null : Number(product.TrongLuong),
          KichThuoc: product.KichThuoc || null,
          SoTrang: product.SoTrang == null ? null : Number(product.SoTrang),
          HinhThuc: product.HinhThuc || null,
        }));
        setProducts(processedProducts);
      } else {
        throw new Error('Dữ liệu sản phẩm không hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
      message.error('Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchAuthors();
    fetchCategories();
    fetchSuppliers();
  }, []);

  // Xử lý thay đổi file
  // Xử lý thay đổi file
  // fieldType: 'primary' | 'secondary'
  const handleFileChange = (e, isEditing = false, fieldType = 'primary') => {
    if (isEditing) {
      // editing primary image
      if (fieldType === 'primary') {
        const file = e.target.files[0];
        if (file) {
          if (!file.type.startsWith('image/')) {
            message.error('Vui lòng chọn một file hình ảnh!');
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            message.error('File hình ảnh quá lớn! Vui lòng chọn file dưới 5MB.');
            return;
          }
          setEditingProduct({ ...editingProduct, HinhAnh: file });
        }
        return;
      }

      // editing extra images (add files to editingExtraFiles)
      if (fieldType === 'extra') {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const valid = [];
        for (const file of files) {
          if (!file.type.startsWith('image/')) {
            message.error(`${file.name} không phải là hình ảnh. Bỏ qua.`);
            continue;
          }
          if (file.size > 5 * 1024 * 1024) {
            message.error(`${file.name} quá lớn (>5MB). Bỏ qua.`);
            continue;
          }
          valid.push(file);
        }
        if (valid.length === 0) return;
        setEditingExtraFiles(prev => [...prev, ...valid]);
        return;
      }
    }

    if (fieldType === 'primary') {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        message.error('Vui lòng chọn một file hình ảnh cho ảnh chính!');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        message.error('Ảnh chính quá lớn (>5MB).');
        return;
      }
      setNewProduct({ ...newProduct, HinhAnhPrimary: file });
      return;
    }

    // secondary images (multiple)
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        message.error(`${file.name} không phải là hình ảnh. Bỏ qua.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        message.error(`${file.name} quá lớn (>5MB). Bỏ qua.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;
    setNewProduct({ ...newProduct, HinhAnhPhu: [...newProduct.HinhAnhPhu, ...validFiles] });
  };

  const handleRemoveEditingExtraFile = (index) => {
    const updated = [...editingExtraFiles];
    updated.splice(index, 1);
    setEditingExtraFiles(updated);
  };

  const removeNewProductSecondaryImage = (index) => {
    const updated = [...newProduct.HinhAnhPhu];
    updated.splice(index, 1);
    setNewProduct({ ...newProduct, HinhAnhPhu: updated });
    // optional: revoke object URL if used elsewhere
  };

  // Thêm sản phẩm - SỬA XỬ LÝ NAMXB
  const handleAddProduct = async () => {
    const maTL = newProduct.MaTL;
    const tenSP = newProduct.TenSP.trim();
    const maTG = newProduct.MaTG;
    const namXB = newProduct.NamXB; // ✅ Bỏ .trim() vì có thể là số

    if (!maTL || !tenSP) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Thể loại, Tên SP)!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('MaTL', maTL);
      formData.append('TenSP', tenSP);
      // Backend expects fields: 'HinhAnh' (primary, single) and 'ExtraImages' (secondary, multiple)
      if (newProduct.HinhAnhPrimary) {
        formData.append('HinhAnh', newProduct.HinhAnhPrimary);
      }
      if (Array.isArray(newProduct.HinhAnhPhu) && newProduct.HinhAnhPhu.length > 0) {
        newProduct.HinhAnhPhu.forEach((file) => formData.append('ExtraImages', file));
      }
      if (maTG) {
        formData.append('MaTG', maTG);
      }
      if (newProduct.MoTa) formData.append('MoTa', newProduct.MoTa);
      if (newProduct.MaNCC) formData.append('MaNCC', newProduct.MaNCC);
      if (newProduct.TrongLuong) formData.append('TrongLuong', newProduct.TrongLuong);
      if (newProduct.KichThuoc) formData.append('KichThuoc', newProduct.KichThuoc);
      if (newProduct.SoTrang) formData.append('SoTrang', newProduct.SoTrang);
      if (newProduct.HinhThuc) formData.append('HinhThuc', newProduct.HinhThuc);
      if (newProduct.MinSoLuong) formData.append('MinSoLuong', newProduct.MinSoLuong);
      // ✅ SỬA: Kiểm tra namXB khác null/undefined và là số hợp lệ
      if (namXB && namXB.toString().trim() && !isNaN(parseInt(namXB))) {
        formData.append('NamXB', parseInt(namXB));
      }
      formData.append('TinhTrang', 0);
      formData.append('DonGia', 0);
      formData.append('SoLuong', 0);

      const response = await api.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchProducts();
      setNewProduct({
        MaTL: '',
        TenSP: '',
        HinhAnhPrimary: null,
        HinhAnhPhu: [],
        MaTG: '',
        NamXB: '',
        TinhTrang: 'Hết hàng',
        DonGia: 0,
        SoLuong: 0,
        MoTa: '',
        MaNCC: '',
        TrongLuong: '',
        KichThuoc: '',
        SoTrang: '',
        HinhThuc: '',
        MinSoLuong: 0,
      });
      setIsModalVisible(false);
      message.success(response.data.message || 'Thêm sản phẩm thành công!');
    } catch (error) {
      console.error('❌ Lỗi khi thêm sản phẩm:', error.response || error);

      if (error.response?.status === 401) {
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        localStorage.removeItem('authToken');
        window.location.href = '/admin/login';
        return;
      }

      if (error.response?.status === 403) {
        message.error(`Không có quyền! ${error.response.data?.error || 'Cần tài khoản admin/staff/NV004/NV007'}`);
        return;
      }

      const errorMessage = error.response?.data?.error || error.message || 'Lỗi khi thêm sản phẩm!';
      message.error(errorMessage);
    }
  };


  // Cập nhật sản phẩm - SỬA XỬ LÝ NAMXB
  const handleUpdateProduct = async () => {
    const maTL = editingProduct.MaTL;
    const tenSP = editingProduct.TenSP.trim();
    const maTG = editingProduct.MaTG;
    const namXB = editingProduct.NamXB; // ✅ Bỏ .trim() vì có thể là số

    if (!maTL || !tenSP) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Thể loại, Tên SP)!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('MaTL', maTL);
      formData.append('TenSP', tenSP);
      // If user selected a new primary file, append it; otherwise, keep existing HinhAnh value (filename string)
      if (editingProduct.HinhAnh instanceof File) {
        formData.append('HinhAnh', editingProduct.HinhAnh);
      } else if (editingProduct.HinhAnh) {
        // editingProduct.HinhAnh might be '/img/products/<filename>' or a filename
        const possible = editingProduct.HinhAnh.toString();
        const filenameOnly = possible.includes('/img/products/') ? possible.replace('/img/products/', '') : possible;
        formData.append('HinhAnh', filenameOnly);
      }

      // If there are newly added extra images while editing, append them
      if (Array.isArray(editingExtraFiles) && editingExtraFiles.length > 0) {
        editingExtraFiles.forEach(f => formData.append('ExtraImages', f));
      }
      if (maTG) {
        formData.append('MaTG', maTG);
      }
      // New fields for update
      if (editingProduct.MoTa !== undefined) formData.append('MoTa', editingProduct.MoTa);
      if (editingProduct.MaNCC !== undefined) formData.append('MaNCC', editingProduct.MaNCC);
      if (editingProduct.TrongLuong !== undefined) formData.append('TrongLuong', editingProduct.TrongLuong);
      if (editingProduct.KichThuoc !== undefined) formData.append('KichThuoc', editingProduct.KichThuoc);
      if (editingProduct.SoTrang !== undefined) formData.append('SoTrang', editingProduct.SoTrang);
      if (editingProduct.HinhThuc !== undefined) formData.append('HinhThuc', editingProduct.HinhThuc);
      if (editingProduct.MinSoLuong !== undefined) formData.append('MinSoLuong', editingProduct.MinSoLuong);
      // ✅ SỬA: Kiểm tra namXB khác null/undefined và là số hợp lệ
      if (namXB && namXB.toString().trim() && !isNaN(parseInt(namXB))) {
        formData.append('NamXB', parseInt(namXB));
      }
      formData.append('TinhTrang', 0);
      formData.append('DonGia', 0);
      formData.append('SoLuong', 0);

      const response = await api.put(`${API_URL}/${editingProduct.MaSP}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchProducts();
      setEditingProduct(null);
      setEditingExtraFiles([]);
      setIsModalVisible(false);
      message.success(response.data.message || 'Cập nhật sản phẩm thành công!');
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật sản phẩm:', error.response || error);

      if (error.response?.status === 403) {
        message.error('Bạn không có quyền thực hiện thao tác này!');
        return;
      }

      const errorMessage = error.response?.data?.error || error.message || 'Lỗi khi cập nhật sản phẩm!';
      message.error(errorMessage);
    }
  };

  // Xóa sản phẩm
  const handleDeleteProduct = (productId) => {
    confirm({
      title: 'Xác nhận xóa sản phẩm',
      icon: <ExclamationCircleFilled />,
      content: 'Bạn có chắc chắn muốn xóa sản phẩm này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.delete(`${API_URL}/${productId}`);
          message.success('Xóa sản phẩm thành công!');
          fetchProducts();
        } catch (error) {
          console.error('Lỗi khi xóa sản phẩm:', error);
          if (error.response?.status === 403) {
            message.error('Bạn không có quyền thực hiện thao tác này!');
          } else {
            message.error(error.response?.data?.error || 'Lỗi khi xóa sản phẩm!');
          }
        }
      },
    });
  };

  // Open modal to edit MinSoLuong
  const openEditMinModal = (product) => {
    setEditingProduct(product);
    setMinValue(product.MinSoLuong || 0);
    setMinModalVisible(true);
  };

  const handleSaveMinStock = async () => {
    if (!editingProduct) return;
    try {
      const res = await api.patch(`${API_URL}/${editingProduct.MaSP}/min-stock`, { MinSoLuong: minValue });
      message.success(res.data.message || 'Cập nhật ngưỡng tồn thành công');
      setMinModalVisible(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Lỗi khi cập nhật MinSoLuong:', error.response || error);
      message.error(error.response?.data?.error || 'Lỗi khi cập nhật ngưỡng tồn');
    }
  };

  // Format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  // Lọc sản phẩm theo tìm kiếm
  const filteredProducts = products.filter(
    (product) =>
      (product.TenSP || '').toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      (product.MaSP || '').toString().includes(searchTerm.trim())
  );

  // Cột của bảng
  const columns = [
    {
      title: 'Mã SP',
      dataIndex: 'MaSP',
      key: 'MaSP',
      width: 80,
      align: 'center',
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'HinhAnh',
      key: 'HinhAnh',
      width: 80,
      align: 'center',
      render: (text) => (
        <img
          src={text}
          alt="Product"
          style={{
            width: 40,
            height: 40,
            objectFit: 'cover',
            borderRadius: 4,
            border: '1px solid #d9d9d9'
          }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/40';
          }}
        />
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'TenSP',
      key: 'TenSP',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Tác giả',
      dataIndex: 'TacGia',
      key: 'TacGia',
      width: 120,
      ellipsis: true,
      render: (text) => text || 'Chưa có',
    },
    {
      title: 'Năm XB',
      dataIndex: 'NamXB',
      key: 'NamXB',
      width: 80,
      align: 'center',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Tình trạng',
      dataIndex: 'TinhTrang',
      key: 'TinhTrang',
      width: 100,
      align: 'center',
      render: (status) => (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: '12px',
            backgroundColor: status === 'Còn hàng' ? '#f6ffed' : '#fff2f0',
            color: status === 'Còn hàng' ? '#52c41a' : '#ff4d4f',
            border: `1px solid ${status === 'Còn hàng' ? '#b7eb8f' : '#ffccc7'}`,
          }}
        >
          {status}
        </span>
      ),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'DonGia',
      key: 'DonGia',
      width: 100,
      align: 'right',
      render: (price) => formatCurrency(price),
    },
    {
      title: 'Số lượng',
      dataIndex: 'SoLuong',
      key: 'SoLuong',
      width: 80,
      align: 'center',
    },
    {
      title: 'Ngưỡng tối thiểu',
      dataIndex: 'MinSoLuong',
      key: 'MinSoLuong',
      width: 80,
      align: 'center',
      render: (v) => v || 0,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={async () => {
              // fetch full product details (including images) before opening modal
              try {
                const res = await api.get(`${API_URL}/${record.MaSP}`);
                setEditingProduct(res.data.data);
                setEditingExtraFiles([]);
                setIsModalVisible(true);
              } catch (err) {
                console.error('Lỗi khi lấy chi tiết sản phẩm để sửa:', err);
                message.error('Không thể tải chi tiết sản phẩm. Vui lòng thử lại.');
              }
            }}
            style={{ padding: 0 }}
          />
          <Button
            type="link"
            size="small"
            onClick={() => openEditMinModal(record)}
            style={{ padding: 0, color: '#1890ff' }}
          >
            Sửa ngưỡng
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProduct(record.MaSP)}
            style={{ padding: 0, color: '#ff4d4f' }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="product-management-container">
      {/* Header */}
      <div className="header-section">
        <h1 className="page-title">Quản lý Sản phẩm</h1>
        <div className="header-actions">
          <div className="search-box">
            <Search
              placeholder="Tìm kiếm sản phẩm..."
              allowClear
              enterButton
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setEditingProduct(null);
              setNewProduct({
                MaTL: '',
                TenSP: '',
                HinhAnhPrimary: null,
                HinhAnhPhu: [],
                MaTG: '',
                NamXB: '',
                TinhTrang: 'Hết hàng',
                DonGia: 0,
                SoLuong: 0,
              });
              setIsModalVisible(true);
            }}
          >
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Thông tin tóm tắt */}
      <div className="info-section">
        <div className="info-grid">
          <div className="info-item">
            <p className="info-label">Tổng sản phẩm:</p>
            <p className="info-value">{products.length}</p>
          </div>
          <div className="info-item">
            <p className="info-label">Còn hàng:</p>
            <p className="info-value" style={{ color: '#52c41a' }}>
              {products.filter(p => p.TinhTrang === 'Còn hàng').length}
            </p>
          </div>
          <div className="info-item">
            <p className="info-label">Hết hàng:</p>
            <p className="info-value" style={{ color: '#ff4d4f' }}>
              {products.filter(p => p.TinhTrang === 'Hết hàng').length}
            </p>
          </div>
          <div className="info-item">
            <p className="info-label">Kết quả tìm kiếm:</p>
            <p className="info-value">{filteredProducts.length}</p>
          </div>
        </div>
      </div>

      {/* Bảng sản phẩm */}
      <div className="table-section">
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="MaSP"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
          }}
          size="small"
          scroll={{ x: 800 }}
        />
      </div>

      {/* Modal thêm/sửa sản phẩm */}
      <Modal
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingProduct(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              setEditingProduct(null);
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
          >
            {editingProduct ? 'Cập nhật' : 'Thêm mới'}
          </Button>,
        ]}
        width={700}
        styles={{ body: { padding: '16px' } }}
      >
        <div className="info-section">
          <div className="info-grid">
            {editingProduct && (
              <div className="info-item">
                <p className="info-label">Mã sản phẩm:</p>
                <Input size="small" value={editingProduct.MaSP} disabled />
              </div>
            )}

            {/* Dropdown chọn thể loại */}
            <div className="info-item">
              <p className="info-label">Thể loại <span style={{ color: 'red' }}>*</span></p>
              <Select
                size="small"
                placeholder="Chọn thể loại"
                value={editingProduct ? editingProduct.MaTL : newProduct.MaTL}
                onChange={(value) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, MaTL: value })
                    : setNewProduct({ ...newProduct, MaTL: value })
                }
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children || "").toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {categories.map(category => (
                  <Option key={category.MaTL} value={category.MaTL}>
                    {category.TenTL}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="info-item">
              <p className="info-label">Tên sản phẩm <span style={{ color: 'red' }}>*</span></p>
              <Input
                size="small"
                value={editingProduct ? editingProduct.TenSP : newProduct.TenSP}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, TenSP: e.target.value })
                    : setNewProduct({ ...newProduct, TenSP: e.target.value })
                }
                required
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div className="info-item">
              <p className="info-label">Ảnh chính:</p>
              {!editingProduct ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, false, 'primary')}
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                  {newProduct.HinhAnhPrimary && (
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={URL.createObjectURL(newProduct.HinhAnhPrimary)}
                        alt={newProduct.HinhAnhPrimary.name}
                        style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid #d9d9d9', borderRadius: 4 }}
                      />
                    </div>
                  )}
                  <div style={{ height: 8 }} />
                  <p className="info-label">Ảnh phụ (có thể chọn nhiều):</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, false, 'secondary')}
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                  {Array.isArray(newProduct.HinhAnhPhu) && newProduct.HinhAnhPhu.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {newProduct.HinhAnhPhu.map((file, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={{ width: 60, height: 60, objectFit: 'cover', border: '1px solid #d9d9d9', borderRadius: 4 }}
                          />
                          <button
                            type="button"
                            onClick={() => removeNewProductSecondaryImage(idx)}
                            style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', padding: 0, lineHeight: '18px', textAlign: 'center' }}
                            aria-label={`Xóa ${file.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, true, 'primary')}
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                  {/* show current primary image (could be URL string) */}
                  {editingProduct && editingProduct.HinhAnh && !(editingProduct.HinhAnh instanceof File) && (
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={editingProduct.HinhAnh}
                        alt="preview"
                        style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid #d9d9d9', borderRadius: 4 }}
                      />
                    </div>
                  )}

                  <div style={{ height: 8 }} />
                  <p className="info-label">Ảnh phụ hiện có:</p>
                  {/* Existing images from product.images when editing */}
                  {editingProduct && Array.isArray(editingProduct.images) && editingProduct.images.length > 0 ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {editingProduct.images.map((img, idx) => (
                        <div key={img.id || `${img.filename}-${idx}`} style={{ position: 'relative', textAlign: 'center' }}>
                          <img
                            src={img.url}
                            alt={img.filename}
                            style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid #d9d9d9', borderRadius: 4 }}
                          />
                          <div style={{ marginTop: 4, display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={async () => {
                                // set this image as primary (update sanpham.HinhAnh)
                                try {
                                  const fd = new FormData();
                                  // send filename only
                                  const filenameOnly = img.filename;
                                  fd.append('HinhAnh', filenameOnly);
                                  await api.put(`${API_URL}/${editingProduct.MaSP}`, fd, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                  });
                                  // refresh product
                                  const refreshed = await api.get(`${API_URL}/${editingProduct.MaSP}`);
                                  setEditingProduct(refreshed.data);
                                  message.success('Đã đặt ảnh này làm ảnh chính');
                                } catch (err) {
                                  console.error('Lỗi khi đặt ảnh chính:', err);
                                  message.error('Không thể đặt ảnh làm ảnh chính');
                                }
                              }}
                              style={{ padding: '2px 6px', fontSize: 12 }}
                            >
                              Đặt làm chính
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                // delete this image
                                try {
                                  await api.delete(`${API_URL}/images/${img.id}`);
                                  const refreshed = await api.get(`${API_URL}/${editingProduct.MaSP}`);
                                  setEditingProduct(refreshed.data.data);
                                  message.success('Xóa ảnh thành công');
                                } catch (err) {
                                  console.error('Lỗi khi xóa ảnh:', err);
                                  message.error('Không thể xóa ảnh');
                                }
                              }}
                              style={{ padding: '2px 6px', fontSize: 12, background: '#fff', border: '1px solid #f5222d', color: '#f5222d' }}
                            >
                              × Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, color: '#888' }}>Không có ảnh phụ</div>
                  )}

                  <div style={{ height: 8 }} />
                  <p className="info-label">Thêm ảnh phụ (có thể chọn nhiều):</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, true, 'extra')}
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                  {Array.isArray(editingExtraFiles) && editingExtraFiles.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {editingExtraFiles.map((file, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={{ width: 60, height: 60, objectFit: 'cover', border: '1px solid #d9d9d9', borderRadius: 4 }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEditingExtraFile(idx)}
                            style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', padding: 0, lineHeight: '18px', textAlign: 'center' }}
                            aria-label={`Xóa ${file.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Dropdown chọn tác giả */}
            <div className="info-item">
              <p className="info-label">Tác giả:</p>
              <Select
                size="small"
                placeholder="Chọn tác giả"
                value={editingProduct ? editingProduct.MaTG : newProduct.MaTG}
                onChange={(value) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, MaTG: value })
                    : setNewProduct({ ...newProduct, MaTG: value })
                }
                style={{ width: '100%' }}
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children || "").toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {authors.map(author => (
                  <Option key={author.MaTG} value={author.MaTG}>
                    {author.TenTG}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="info-item">
              <p className="info-label">Năm xuất bản:</p>
              <Input
                size="small"
                type="number"
                value={editingProduct ? editingProduct.NamXB : newProduct.NamXB}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, NamXB: e.target.value })
                    : setNewProduct({ ...newProduct, NamXB: e.target.value })
                }
                placeholder="Nhập năm xuất bản (1900-2024)"
              />
            </div>
            <div className="info-item">
              <p className="info-label">Mô tả:</p>
              <Input.TextArea
                rows={3}
                value={editingProduct ? editingProduct.MoTa : newProduct.MoTa}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, MoTa: e.target.value })
                    : setNewProduct({ ...newProduct, MoTa: e.target.value })
                }
                placeholder="Mô tả ngắn về sản phẩm"
              />
            </div>

            <div className="info-item">
              <p className="info-label">Nhà cung cấp:</p>
              <Select
                size="small"
                placeholder="Chọn nhà cung cấp"
                value={editingProduct ? editingProduct.MaNCC : newProduct.MaNCC}
                onChange={(value) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, MaNCC: value })
                    : setNewProduct({ ...newProduct, MaNCC: value })
                }
                style={{ width: '100%' }}
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children || "").toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {suppliers.map(s => (
                  <Option key={s.MaNCC} value={s.MaNCC}>{s.TenNCC}</Option>
                ))}
              </Select>
            </div>

            <div className="info-item">
              <p className="info-label">Trọng lượng (g):</p>
              <Input
                size="small"
                type="number"
                value={editingProduct ? editingProduct.TrongLuong : newProduct.TrongLuong}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, TrongLuong: e.target.value })
                    : setNewProduct({ ...newProduct, TrongLuong: e.target.value })
                }
                placeholder="Trọng lượng (gram)"
              />
            </div>

            <div className="info-item">
              <p className="info-label">Kích thước:</p>
              <Input
                size="small"
                value={editingProduct ? editingProduct.KichThuoc : newProduct.KichThuoc}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, KichThuoc: e.target.value })
                    : setNewProduct({ ...newProduct, KichThuoc: e.target.value })
                }
                placeholder="Ví dụ: 20x13x2 cm"
              />
            </div>

            <div className="info-item">
              <p className="info-label">Số trang:</p>
              <Input
                size="small"
                type="number"
                value={editingProduct ? editingProduct.SoTrang : newProduct.SoTrang}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, SoTrang: e.target.value })
                    : setNewProduct({ ...newProduct, SoTrang: e.target.value })
                }
                placeholder="Số trang"
              />
            </div>

            <div className="info-item">
              <p className="info-label">Hình thức:</p>
              <Input
                size="small"
                value={editingProduct ? editingProduct.HinhThuc : newProduct.HinhThuc}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, HinhThuc: e.target.value })
                    : setNewProduct({ ...newProduct, HinhThuc: e.target.value })
                }
                placeholder="Ví dụ: Bìa mềm / Bìa cứng"
              />
            </div>

            <div className="info-item">
              <p className="info-label">Ngưỡng tối thiểu (MinSoLuong):</p>
              <Input
                size="small"
                type="number"
                min={0}
                value={editingProduct ? editingProduct.MinSoLuong : newProduct.MinSoLuong}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, MinSoLuong: Number(e.target.value) })
                    : setNewProduct({ ...newProduct, MinSoLuong: Number(e.target.value) })
                }
                placeholder="Ngưỡng tồn tối thiểu"
              />
            </div>
            <div className="info-item">
              <p className="info-label">Tình trạng:</p>
              <Input size="small" value="Hết hàng (mặc định)" disabled />
            </div>
            <div className="info-item">
              <p className="info-label">Đơn giá:</p>
              <Input size="small" value="0 VND (mặc định)" disabled />
            </div>
            <div className="info-item">
              <p className="info-label">Số lượng:</p>
              <Input size="small" value="0 (mặc định)" disabled />
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal chỉnh ngưỡng tối thiểu (MinSoLuong) */}
      <Modal
        title={`Cập nhật ngưỡng tồn cho sản phẩm ${editingProduct ? editingProduct.MaSP : ''}`}
        open={minModalVisible}
        onCancel={() => { setMinModalVisible(false); setEditingProduct(null); }}
        onOk={handleSaveMinStock}
        okText="Lưu"
        cancelText="Hủy"
        width={420}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            type="number"
            min={0}
            value={minValue}
            onChange={(e) => setMinValue(Number(e.target.value))}
          />
          <span>cái</span>
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagement;