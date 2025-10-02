import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import '../styles/ProductManagement.css';

const { Search } = Input;
const { confirm } = Modal;

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    MaTL: '',
    TenSP: '',
    HinhAnh: null,
    MaTG: '',
    NamXB: '',
    TinhTrang: 'Hết hàng',
    DonGia: 0,
    SoLuong: 0,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api/product';

  // Hàm để lấy token từ localStorage
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  // Hàm để tạo config axios với token
  const getAuthConfig = () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  // Fetch danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      if (Array.isArray(response.data)) {
        const processedProducts = response.data.map((product) => ({
          ...product,
          HinhAnh: product.HinhAnh && product.HinhAnh !== 'null'
            ? `/img/products/${product.HinhAnh}`
            : 'https://via.placeholder.com/50',
          TinhTrang: product.TinhTrang ? (product.TinhTrang === 1 ? 'Còn hàng' : 'Hết hàng') : 'Không xác định',
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
  }, []);

  // Generate MaSP mới
  const generateNewMaSP = () => {
    if (products.length === 0) return 1;
    const maxMaSP = Math.max(...products.map((p) => parseInt(p.MaSP) || 0));
    return maxMaSP + 1;
  };

  // Xử lý thay đổi file
  const handleFileChange = (e, isEditing = false) => {
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
      if (isEditing) {
        setEditingProduct({ ...editingProduct, HinhAnh: file });
      } else {
        setNewProduct({ ...newProduct, HinhAnh: file });
      }
    }
  };

  // Thêm sản phẩm
  const handleAddProduct = async () => {
    // Debug token
    const token = getAuthToken();
    console.log('🔍 Token hiện tại:', token ? 'Có token' : 'Không có token');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 Token payload:', payload);
        console.log('🔍 User:', payload.makh || payload.MaTK);
        console.log('🔍 UserType:', payload.userType);
      } catch (e) {
        console.log('❌ Không decode được token');
      }
    }
    
    const maTL = newProduct.MaTL.trim();
    const tenSP = newProduct.TenSP.trim();
    const maTG = newProduct.MaTG.trim();
    const namXB = newProduct.NamXB.trim();

    // Kiểm tra các trường bắt buộc
    if (!maTL || !tenSP) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Mã TL, Tên SP)!');
      return;
    }
    if (isNaN(parseInt(maTL)) || parseInt(maTL) <= 0) {
      message.error('Mã thể loại phải là số nguyên dương hợp lệ!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('MaTL', parseInt(maTL));
      formData.append('TenSP', tenSP);
      if (newProduct.HinhAnh) {
        formData.append('HinhAnh', newProduct.HinhAnh);
      }
      if (maTG && !isNaN(parseInt(maTG))) {
        formData.append('MaTG', parseInt(maTG));
      }
      if (namXB && !isNaN(parseInt(namXB))) {
        formData.append('NamXB', parseInt(namXB));
      }
      formData.append('TinhTrang', 0);
      formData.append('DonGia', 0);
      formData.append('SoLuong', 0);

      console.log('🚀 Gửi request thêm sản phẩm...');
      const config = getAuthConfig();
      const response = await axios.post(API_URL, formData, config);
      
      await fetchProducts();
      setNewProduct({
        MaTL: '',
        TenSP: '',
        HinhAnh: null,
        MaTG: '',
        NamXB: '',
        TinhTrang: 'Hết hàng',
        DonGia: 0,
        SoLuong: 0,
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
        console.log('❌ 403 Error details:', error.response.data);
        message.error(`Không có quyền! ${error.response.data?.error || 'Cần tài khoản admin/staff/NV004/NV007'}`);
        return;
      }
      
      const errorMessage = error.response?.data?.error || error.message || 'Lỗi khi thêm sản phẩm!';
      message.error(errorMessage);
    }
  };

  // Cập nhật sản phẩm
  const handleUpdateProduct = async () => {
    const maTL = editingProduct.MaTL.trim();
    const tenSP = editingProduct.TenSP.trim();
    const maTG = editingProduct.MaTG.trim();
    const namXB = editingProduct.NamXB.trim();

    if (!maTL || !tenSP) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Mã TL, Tên SP)!');
      return;
    }
    if (isNaN(parseInt(maTL)) || parseInt(maTL) <= 0) {
      message.error('Mã thể loại phải là số nguyên dương hợp lệ!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('MaTL', parseInt(maTL));
      formData.append('TenSP', tenSP);
      if (editingProduct.HinhAnh instanceof File) {
        formData.append('HinhAnh', editingProduct.HinhAnh);
      } else if (editingProduct.HinhAnh) {
        formData.append('HinhAnh', editingProduct.HinhAnh.replace('/img/products/', ''));
      }
      if (maTG && !isNaN(parseInt(maTG))) {
        formData.append('MaTG', parseInt(maTG));
      }
      if (namXB && !isNaN(parseInt(namXB))) {
        formData.append('NamXB', parseInt(namXB));
      }
      formData.append('TinhTrang', 0);
      formData.append('DonGia', 0);
      formData.append('SoLuong', 0);

      console.log('🔄 Cập nhật sản phẩm...');
      const config = getAuthConfig();
      const response = await axios.put(`${API_URL}/${editingProduct.MaSP}`, formData, config);
      
      await fetchProducts();
      setEditingProduct(null);
      setIsModalVisible(false);
      message.success(response.data.message || 'Cập nhật sản phẩm thành công!');
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật sản phẩm:', error.response || error);
      
      if (error.response?.status === 401) {
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        localStorage.removeItem('authToken');
        window.location.href = '/admin/login';
        return;
      }
      
      if (error.response?.status === 403) {
        message.error('Bạn không có quyền thực hiện thao tác này!');
        return;
      }
      
      const errorMessage = error.response?.data?.error || error.message || 'Lỗi khi cập nhật sản phẩm!';
      message.error(errorMessage);
    }
  };

  // Xóa sản phẩm
  const handleDeleteProduct = (MaSP) => {
    confirm({
      title: 'Bạn có chắc muốn xóa sản phẩm này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này sẽ không thể hoàn tác',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      async onOk() {
        try {
          console.log('🗑️ Xóa sản phẩm:', MaSP);
          const config = getAuthConfig();
          const response = await axios.delete(`${API_URL}/${MaSP}`, config);
          await fetchProducts();
          message.success(response.data.message || 'Xóa sản phẩm thành công!');
        } catch (error) {
          console.error('❌ Lỗi khi xóa sản phẩm:', error.response || error);
          
          if (error.response?.status === 401) {
            message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
            localStorage.removeItem('authToken');
            window.location.href = '/admin/login';
            return;
          }
          
          if (error.response?.status === 403) {
            message.error('Bạn không có quyền thực hiện thao tác này!');
            return;
          }
          
          const errorMessage = error.response?.data?.error || error.message || 'Xóa sản phẩm thất bại!';
          message.error(errorMessage);
        }
      },
    });
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

  // Cấu hình cột bảng
  const columns = [
    {
      title: 'Mã SP',
      dataIndex: 'MaSP',
      key: 'MaSP',
      width: 80,
      fixed: 'left',
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'TenSP',
      key: 'TenSP',
      width: 250,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'HinhAnh',
      key: 'HinhAnh',
      render: (text) => (
        <img
          src={text}
          alt="product"
          style={{ 
            width: 40, 
            height: 40, 
            objectFit: 'cover', 
            borderRadius: 4,
            border: '1px solid #d9d9d9'
          }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
          }}
        />
      ),
      width: 80,
    },
    {
      title: 'Mã TL',
      dataIndex: 'MaTL',
      key: 'MaTL',
      width: 80,
    },
    {
      title: 'Tác giả',
      dataIndex: 'TacGia',
      key: 'TacGia',
      render: (text) => text || 'N/A',
      width: 150,
    },
    {
      title: 'Năm XB',
      dataIndex: 'NamXB',
      key: 'NamXB',
      render: (text) => text || 'N/A',
      width: 100,
    },
    {
      title: 'Đơn giá',
      dataIndex: 'DonGia',
      key: 'DonGia',
      render: (price) => <div style={{ textAlign: 'right' }}>{formatCurrency(price)}</div>,
      width: 120,
    },
    {
      title: 'Số lượng',
      dataIndex: 'SoLuong',
      key: 'SoLuong',
      align: 'center',
      width: 100,
    },
    {
      title: 'Tình trạng',
      dataIndex: 'TinhTrang',
      key: 'TinhTrang',
      width: 120,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingProduct({
                ...record,
                HinhAnh: record.HinhAnh !== 'https://via.placeholder.com/50' ? record.HinhAnh : null
              });
              setIsModalVisible(true);
            }}
            title="Chỉnh sửa sản phẩm"
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProduct(record.MaSP)}
            title="Xóa sản phẩm"
          />
        </Space>
      ),
      fixed: 'right',
      width: 100,
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
                HinhAnh: null,
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

      {/* Info section */}
      <div className="info-section">
        <div className="info-grid">
          <div className="info-item">
            <p className="info-label">Tổng sản phẩm:</p>
            <strong>{products.length}</strong>
          </div>
          <div className="info-item">
            <p className="info-label">Sản phẩm hiển thị:</p>
            <strong>{filteredProducts.length}</strong>
          </div>
          <div className="info-item">
            <p className="info-label">Còn hàng:</p>
            <strong>{products.filter(p => p.TinhTrang === 'Còn hàng').length}</strong>
          </div>
          <div className="info-item">
            <p className="info-label">Hết hàng:</p>
            <strong>{products.filter(p => p.TinhTrang === 'Hết hàng').length}</strong>
          </div>
        </div>
      </div>

      {/* Bảng sản phẩm */}
      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="MaSP"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} của ${total} sản phẩm`,
          size: 'small',
        }}
        size="small"
        className="compact-permission-table"
        locale={{
          emptyText: 'Không tìm thấy sản phẩm',
        }}
      />

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
        bodyStyle={{ padding: '16px' }}
      >
        <div className="info-section">
          <div className="info-grid">
            {editingProduct && (
              <div className="info-item">
                <p className="info-label">Mã sản phẩm:</p>
                <Input size="small" value={editingProduct.MaSP} disabled />
              </div>
            )}
            <div className="info-item">
              <p className="info-label">Mã thể loại <span style={{ color: 'red' }}>*</span></p>
              <Input
                size="small"
                type="number"
                value={editingProduct ? editingProduct.MaTL : newProduct.MaTL}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, MaTL: e.target.value })
                    : setNewProduct({ ...newProduct, MaTL: e.target.value })
                }
                required
                placeholder="Nhập mã thể loại"
              />
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
              <p className="info-label">Hình ảnh:</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, !!editingProduct)}
                style={{ width: '100%', fontSize: '12px' }}
              />
              {(editingProduct && editingProduct.HinhAnh && !(editingProduct.HinhAnh instanceof File)) && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={editingProduct.HinhAnh}
                    alt="preview"
                    style={{ 
                      width: 60, 
                      height: 60, 
                      objectFit: 'cover',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4
                    }}
                  />
                </div>
              )}
            </div>
            <div className="info-item">
              <p className="info-label">Mã tác giả:</p>
              <Input
                size="small"
                type="number"
                value={editingProduct ? editingProduct.MaTG : newProduct.MaTG}
                onChange={(e) =>
                  editingProduct
                    ? setEditingProduct({ ...editingProduct, MaTG: e.target.value })
                    : setNewProduct({ ...newProduct, MaTG: e.target.value })
                }
                placeholder="Nhập mã tác giả (tùy chọn)"
              />
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
    </div>
  );
};

export default ProductManagement;