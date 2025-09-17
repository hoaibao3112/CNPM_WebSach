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

  const generateNewMaSP = () => {
    if (products.length === 0) return 1;
    const maxMaSP = Math.max(...products.map((p) => parseInt(p.MaSP) || 0));
    return maxMaSP + 1;
  };

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

  const handleAddProduct = async () => {
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
      formData.append('MaSP', generateNewMaSP());
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

      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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
      console.error('Lỗi khi thêm sản phẩm:', error.response || error);
      const errorMessage = error.response?.data?.error || 'Lỗi khi thêm sản phẩm!';
      message.error(errorMessage);
    }
  };

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

      const response = await axios.put(`${API_URL}/${editingProduct.MaSP}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProducts();
      setEditingProduct(null);
      setIsModalVisible(false);
      message.success(response.data.message || 'Sửa sản phẩm thành công!');
    } catch (error) {
      console.error('Lỗi khi sửa sản phẩm:', error.response || error);
      const errorMessage = error.response?.data?.error || 'Lỗi khi sửa sản phẩm!';
      message.error(errorMessage);
    }
  };

  const handleDeleteProduct = (MaSP) => {
    confirm({
      title: 'Bạn có chắc muốn xóa sản phẩm này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này sẽ không thể hoàn tác',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Thoát',
      async onOk() {
        try {
          const response = await axios.delete(`${API_URL}/${MaSP}`);
          await fetchProducts();
          message.success(response.data.message || 'Xóa sản phẩm thành công!');
        } catch (error) {
          console.error('Lỗi khi xóa sản phẩm:', error.response || error);
          message.error(error.response?.data?.error || 'Xóa sản phẩm thất bại!');
        }
      },
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const filteredProducts = products.filter(
    (product) =>
      (product.TenSP || '').toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      (product.MaSP || '').toString().includes(searchTerm.trim())
  );

  const columns = [
    {
      title: 'Mã SP',
      dataIndex: 'MaSP',
      key: 'MaSP',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'TenSP',
      key: 'TenSP',
      width: 200,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'HinhAnh',
      key: 'HinhAnh',
      render: (text) => (
        <img
          src={text}
          alt="product"
          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2 }}
          onError={(e) => {
            console.log(`Lỗi tải ảnh: ${text}`);
            e.target.src = 'https://via.placeholder.com/50';
          }}
        />
      ),
      width: 80,
    },
    {
      title: 'Đơn giá',
      dataIndex: 'DonGia',
      key: 'DonGia',
      render: (price) => <div className="text-right">{formatCurrency(price)}</div>,
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
              setEditingProduct(record);
              setIsModalVisible(true);
            }}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProduct(record.MaSP)}
          />
        </Space>
      ),
      fixed: 'right',
      width: 100,
    },
  ];

  return (
    <div className="product-management-container">
      <div className="header-section">
        <h1 className="page-title">Quản lý Sản phẩm</h1>
        <div className="search-box">
          <Search
            placeholder="Tìm sản phẩm..."
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

      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="MaSP"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          size: 'small',
        }}
        size="small"
        className="compact-product-table"
        style={{ fontSize: '13px' }}
        locale={{
          emptyText: 'Không tìm thấy sản phẩm',
        }}
      />

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
            {editingProduct ? 'Lưu' : 'Thêm'}
          </Button>,
        ]}
        width={600}
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
              />
              {(editingProduct && editingProduct.HinhAnh && !(editingProduct.HinhAnh instanceof File)) && (
                <img
                  src={editingProduct.HinhAnh}
                  alt="preview"
                  style={{ width: 50, height: 50, marginTop: 8 }}
                />
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
                placeholder="Nhập năm xuất bản (tùy chọn)"
              />
            </div>
            <div className="info-item">
              <p className="info-label">Tình trạng:</p>
              <Input size="small" value="Hết hàng" disabled />
            </div>
            <div className="info-item">
              <p className="info-label">Đơn giá:</p>
              <Input size="small" value="0 VND" disabled />
            </div>
            <div className="info-item">
              <p className="info-label">Số lượng:</p>
              <Input size="small" value="0" disabled />
            </div>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .product-management-container {
          padding: 16px 16px 16px 216px;
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
        .search-box {
          width: 250px;
        }
        .info-section {
          background: #f8f8f8;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .info-item {
          margin-bottom: 4px;
        }
        .info-label {
          color: #666;
          font-size: 12px;
          margin: 0;
        }
        .compact-product-table :global(.ant-table-thead > tr > th) {
          padding: 8px 12px;
        }
        .compact-product-table :global(.ant-table-tbody > tr > td) {
          padding: 8px 12px;
        }
        input[type="file"] {
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default ProductManagement;