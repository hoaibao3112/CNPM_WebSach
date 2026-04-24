import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Button, Input, message, Table, Modal, Space, Select, Tooltip, Tag, Divider } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  ExclamationCircleFilled, 
  PlusOutlined, 
  SearchOutlined,
  CloudUploadOutlined,
  CloseCircleFilled,
  ContainerOutlined
} from '@ant-design/icons';

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

  const fetchAuthors = async () => {
    try {
      const response = await api.get(AUTHORS_API_URL);
      const resData = response.data.data || response.data;
      setAuthors(Array.isArray(resData) ? resData : (resData?.data || []));
    } catch (error) {
      message.error('Lỗi khi tải danh sách tác giả');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get(CATEGORIES_API_URL);
      const resData = response.data.data || response.data;
      setCategories(Array.isArray(resData) ? resData : (resData?.data || []));
    } catch (error) {
      message.error('Lỗi khi tải danh sách thể loại');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get(SUPPLIERS_API_URL);
      const resData = response.data.data || response.data;
      setSuppliers(Array.isArray(resData) ? resData : (resData?.data || []));
    } catch (error) {
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
      }
    } catch (error) {
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

  const handleFileChange = (e, isEditing = false, fieldType = 'primary') => {
    const file = e.target.files[0];
    if (isEditing) {
      if (fieldType === 'primary') {
        if (file) setEditingProduct({ ...editingProduct, HinhAnh: file });
        return;
      }
      if (fieldType === 'extra') {
        const files = Array.from(e.target.files || []);
        setEditingExtraFiles(prev => [...prev, ...files]);
        return;
      }
    }
    if (fieldType === 'primary') {
      if (file) setNewProduct({ ...newProduct, HinhAnhPrimary: file });
      return;
    }
    const files = Array.from(e.target.files || []);
    setNewProduct({ ...newProduct, HinhAnhPhu: [...newProduct.HinhAnhPhu, ...files] });
  };

  const validateForm = (data, isEditing = false) => {
    if (!data.TenSP?.trim()) {
      message.error('Vui lòng nhập tên sản phẩm');
      return false;
    }
    if (!data.MaTL) {
      message.error('Vui lòng chọn thể loại');
      return false;
    }
    if (!data.MaTG) {
      message.error('Vui lòng chọn tác giả');
      return false;
    }
    if (!data.MaNCC) {
      message.error('Vui lòng chọn nhà cung cấp');
      return false;
    }
    
    // Check primary image for new products
    if (!isEditing && !data.HinhAnhPrimary) {
      message.error('Vui lòng chọn ảnh chính cho sản phẩm');
      return false;
    }

    // Numeric validations
    if (data.NamXB && (isNaN(data.NamXB) || data.NamXB < 1000 || data.NamXB > new Date().getFullYear())) {
      message.error('Năm xuất bản không hợp lệ');
      return false;
    }
    if (data.TrongLuong && (isNaN(data.TrongLuong) || data.TrongLuong < 0)) {
      message.error('Trọng lượng phải là số dương');
      return false;
    }
    if (data.SoTrang && (isNaN(data.SoTrang) || data.SoTrang < 0)) {
      message.error('Số trang phải là số dương');
      return false;
    }
    if (data.MinSoLuong !== undefined && (isNaN(data.MinSoLuong) || data.MinSoLuong < 0)) {
      message.error('Ngưỡng tồn tối thiểu phải là số dương');
      return false;
    }

    return true;
  };

  const handleAddProduct = async () => {
    if (!validateForm(newProduct)) return;
    
    try {
      const formData = new FormData();
      Object.keys(newProduct).forEach(key => {
        if (key === 'HinhAnhPrimary' && newProduct[key]) {
          formData.append('HinhAnh', newProduct[key]);
        } else if (key === 'HinhAnhPhu') {
          newProduct[key].forEach(file => formData.append('ExtraImages', file));
        } else if (newProduct[key] !== null && newProduct[key] !== '') {
          formData.append(key, newProduct[key]);
        }
      });
      formData.append('TinhTrang', 0);
      formData.append('DonGia', 0);
      formData.append('SoLuong', 0);

      await api.post(API_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchProducts();
      setIsModalVisible(false);
      message.success('Thêm sản phẩm thành công!');
    } catch (error) {
      message.error(error.response?.data?.error || 'Lỗi khi thêm sản phẩm');
    }
  };

  const handleUpdateProduct = async () => {
    if (!validateForm(editingProduct, true)) return;
    
    try {
      const formData = new FormData();
      Object.keys(editingProduct).forEach(key => {
        if (key === 'HinhAnh') {
          if (editingProduct[key] instanceof File) {
            formData.append('HinhAnh', editingProduct[key]);
          } else {
            const filename = editingProduct[key].replace('/img/products/', '');
            formData.append('HinhAnh', filename);
          }
        } else if (editingProduct[key] !== null && editingProduct[key] !== '') {
          formData.append(key, editingProduct[key]);
        }
      });
      editingExtraFiles.forEach(f => formData.append('ExtraImages', f));

      await api.put(`${API_URL}/${editingProduct.MaSP}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchProducts();
      setIsModalVisible(false);
      message.success('Cập nhật thành công!');
    } catch (error) {
      message.error(error.response?.data?.error || 'Lỗi khi cập nhật');
    }
  };

  const handleDeleteProduct = (id) => {
    confirm({
      title: 'Xác nhận xóa?',
      onOk: async () => {
        try {
          await api.delete(`${API_URL}/${id}`);
          fetchProducts();
          message.success('Đã xóa sản phẩm');
        } catch (e) { message.error('Lỗi khi xóa'); }
      }
    });
  };

  const handleSaveMinStock = async () => {
    try {
      await api.patch(`${API_URL}/${editingProduct.MaSP}/min-stock`, { MinSoLuong: minValue });
      message.success('Đã cập nhật ngưỡng tồn');
      setMinModalVisible(false);
      fetchProducts();
    } catch (e) { message.error('Lỗi'); }
  };

  const filteredProducts = products.filter(p => 
    p.TenSP.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.MaSP.toString().includes(searchTerm)
  );

  const columns = [
    {
      title: 'SẢN PHẨM',
      key: 'product',
      width: 300,
      fixed: 'left',
      render: (_, record) => (
        <div className="flex items-center gap-4">
          <div className="w-16 h-20 shrink-0 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
            <img src={record.HinhAnh} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="font-black text-slate-700 truncate text-sm" title={record.TenSP}>{record.TenSP}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">#{record.MaSP}</span>
              <span className="truncate max-w-[120px]">{record.TacGia || 'Ẩn danh'}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'KHO HÀNG',
      key: 'stock',
      width: 150,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase">Số lượng:</span>
            <span className={`text-sm font-black ${record.SoLuong <= record.MinSoLuong ? 'text-rose-600' : 'text-slate-700'}`}>
              {record.SoLuong}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${record.SoLuong <= record.MinSoLuong ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min((record.SoLuong / (record.MinSoLuong || 100)) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-[9px] font-bold text-slate-400 text-right uppercase">Min: {record.MinSoLuong}</div>
        </div>
      )
    },
    {
      title: 'GIÁ BÁN',
      dataIndex: 'DonGia',
      key: 'price',
      width: 150,
      render: (price) => (
        <div className="text-right">
          <div className="text-sm font-black text-indigo-600">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Giá gốc</div>
        </div>
      )
    },
    {
      title: 'TRẠNG THÁI',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          record.TinhTrang === 'Còn hàng' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
        }`}>
          {record.TinhTrang}
        </span>
      )
    },
    {
      title: 'THAO TÁC',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Chỉnh sửa">
            <Button 
              className="w-10 h-10 rounded-xl flex items-center justify-center border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-all"
              icon={<EditOutlined />} 
              onClick={async () => {
                const res = await api.get(`${API_URL}/${record.MaSP}`);
                setEditingProduct(res.data.data);
                setEditingExtraFiles([]);
                setIsModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Ngưỡng tồn">
            <Button 
              className="w-10 h-10 rounded-xl flex items-center justify-center border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-600 transition-all"
              icon={<ContainerOutlined />} 
              onClick={() => {
                setEditingProduct(record);
                setMinValue(record.MinSoLuong || 0);
                setMinModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button 
              danger
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteProduct(record.MaSP)}
            />
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="material-icons text-indigo-500">inventory_2</span>
            Kho Sản phẩm
          </h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý danh mục sách và tình trạng tồn kho</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
            <Input 
              placeholder="Tìm theo tên hoặc mã..." 
              className="h-12 pl-12 pr-4 w-full sm:w-80 rounded-2xl border-0 shadow-sm bg-white font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProduct(null);
              setNewProduct({
                MaTL: '', TenSP: '', HinhAnhPrimary: null, HinhAnhPhu: [],
                MaTG: '', NamXB: '', TinhTrang: 'Hết hàng', DonGia: 0, SoLuong: 0,
                MoTa: '', MaNCC: '', TrongLuong: '', KichThuoc: '', SoTrang: '',
                HinhThuc: '', MinSoLuong: 0,
              });
              setIsModalVisible(true);
            }}
            className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 border-0 shadow-lg shadow-indigo-100 font-bold flex items-center gap-2"
          >
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[
          { label: 'Tổng số sách', val: products.length, icon: 'book', color: 'indigo' },
          { label: 'Sắp hết hàng', val: products.filter(p => p.SoLuong <= p.MinSoLuong && p.SoLuong > 0).length, icon: 'warning', color: 'orange' },
          { label: 'Hết hàng', val: products.filter(p => p.SoLuong === 0).length, icon: 'error_outline', color: 'rose' },
          { label: 'Doanh số ưu tiên', val: '12%', icon: 'trending_up', color: 'emerald' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-500`}>
                <span className="material-icons text-xl">{stat.icon}</span>
              </div>
              <span className="text-xl md:text-2xl font-black text-slate-800">{stat.val}</span>
            </div>
            <p className="text-slate-400 text-sm font-black uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="MaSP"
          loading={loading}
          pagination={{ pageSize: 8, className: "px-8 py-6" }}
          className="modern-table"
          scroll={{ x: 1000 }}
        />
      </div>

      <Modal
        title={null}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        centered
        className="modern-modal"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="material-icons text-indigo-500">{editingProduct ? 'edit' : 'add_box'}</span>
            {editingProduct ? 'Cập nhật sản phẩm' : 'Đăng ký sản phẩm mới'}
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Hoàn thiện thông tin sách để hiển thị trên cửa hàng</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[70vh] px-2 custom-scrollbar">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên sản phẩm <span className="text-rose-500">*</span></label>
              <Input 
                className="h-11 rounded-xl font-bold"
                value={editingProduct ? editingProduct.TenSP : newProduct.TenSP}
                onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, TenSP: e.target.value}) : setNewProduct({...newProduct, TenSP: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thể loại <span className="text-rose-500">*</span></label>
                <Select 
                  className="w-full h-11"
                  value={editingProduct ? editingProduct.MaTL : newProduct.MaTL}
                  onChange={(v) => editingProduct ? setEditingProduct({...editingProduct, MaTL: v}) : setNewProduct({...newProduct, MaTL: v})}
                >
                  {categories.map(c => <Option key={c.MaTL} value={c.MaTL}>{c.TenTL}</Option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tác giả <span className="text-rose-500">*</span></label>
                <Select 
                  className="w-full h-11"
                  value={editingProduct ? editingProduct.MaTG : newProduct.MaTG}
                  onChange={(v) => editingProduct ? setEditingProduct({...editingProduct, MaTG: v}) : setNewProduct({...newProduct, MaTG: v})}
                >
                  {authors.map(a => <Option key={a.MaTG} value={a.MaTG}>{a.TenTG}</Option>)}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả sản phẩm</label>
              <Input.TextArea 
                rows={4} 
                className="rounded-xl font-medium p-4"
                value={editingProduct ? editingProduct.MoTa : newProduct.MoTa}
                onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, MoTa: e.target.value}) : setNewProduct({...newProduct, MoTa: e.target.value})}
              />
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Ảnh chính (Primary Image)</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-32 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {(editingProduct ? editingProduct.HinhAnh : newProduct.HinhAnhPrimary) ? (
                    <img 
                      src={editingProduct ? (editingProduct.HinhAnh instanceof File ? URL.createObjectURL(editingProduct.HinhAnh) : `/img/products/${editingProduct.HinhAnh.replace('/img/products/', '')}`) : URL.createObjectURL(newProduct.HinhAnhPrimary)} 
                      alt="" className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="material-icons text-slate-200 text-4xl">image</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    <CloudUploadOutlined /> Chọn ảnh
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, !!editingProduct, 'primary')} />
                  </label>
                  <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase">PNG, JPG tối đa 5MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Năm xuất bản</label>
                <Input 
                  className="h-11 rounded-xl"
                  value={editingProduct ? editingProduct.NamXB : newProduct.NamXB}
                  onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, NamXB: e.target.value}) : setNewProduct({...newProduct, NamXB: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kích thước</label>
                <Input 
                  className="h-11 rounded-xl"
                  value={editingProduct ? editingProduct.KichThuoc : newProduct.KichThuoc}
                  onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, KichThuoc: e.target.value}) : setNewProduct({...newProduct, KichThuoc: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số trang</label>
                <Input 
                  className="h-11 rounded-xl"
                  value={editingProduct ? editingProduct.SoTrang : newProduct.SoTrang}
                  onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, SoTrang: e.target.value}) : setNewProduct({...newProduct, SoTrang: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trọng lượng</label>
                <Input 
                  className="h-11 rounded-xl"
                  suffix="g"
                  value={editingProduct ? editingProduct.TrongLuong : newProduct.TrongLuong}
                  onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, TrongLuong: e.target.value}) : setNewProduct({...newProduct, TrongLuong: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Định dạng</label>
                <Input 
                  className="h-11 rounded-xl"
                  placeholder="Bìa mềm..."
                  value={editingProduct ? editingProduct.HinhThuc : newProduct.HinhThuc}
                  onChange={(e) => editingProduct ? setEditingProduct({...editingProduct, HinhThuc: e.target.value}) : setNewProduct({...newProduct, HinhThuc: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhà cung cấp <span className="text-rose-500">*</span></label>
              <Select 
                className="w-full h-11"
                value={editingProduct ? editingProduct.MaNCC : newProduct.MaNCC}
                onChange={(v) => editingProduct ? setEditingProduct({...editingProduct, MaNCC: v}) : setNewProduct({...newProduct, MaNCC: v})}
              >
                {suppliers.map(s => <Option key={s.MaNCC} value={s.MaNCC}>{s.TenNCC}</Option>)}
              </Select>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Ảnh bổ sung (Extra Images)</label>
              <div className="flex flex-wrap gap-3 mb-4">
                {(editingProduct ? editingExtraFiles : newProduct.HinhAnhPhu).map((file, idx) => (
                  <div key={idx} className="w-16 h-20 rounded-lg bg-white border border-slate-200 overflow-hidden relative group">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button 
                      className="absolute -top-1 -right-1 text-rose-500 bg-white rounded-full hidden group-hover:block transition-all"
                      onClick={() => {
                        if (editingProduct) {
                          const updated = [...editingExtraFiles];
                          updated.splice(idx, 1);
                          setEditingExtraFiles(updated);
                        } else {
                          const updated = [...newProduct.HinhAnhPhu];
                          updated.splice(idx, 1);
                          setNewProduct({...newProduct, HinhAnhPhu: updated});
                        }
                      }}
                    >
                      <CloseCircleFilled />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-20 rounded-lg bg-white border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-indigo-400 hover:text-indigo-400 cursor-pointer transition-all">
                  <PlusOutlined />
                  <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleFileChange(e, !!editingProduct, 'extra')} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
          <Button 
            onClick={() => setIsModalVisible(false)}
            className="h-12 px-8 rounded-2xl font-bold border-slate-200"
          >
            Đóng
          </Button>
          <Button 
            type="primary" 
            onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
            className="h-12 px-12 rounded-2xl font-black uppercase tracking-widest text-xs bg-indigo-600 border-0 shadow-lg shadow-indigo-100"
          >
            {editingProduct ? 'Cập nhật' : 'Hoàn tất'}
          </Button>
        </div>
      </Modal>

      <Modal
        title={null}
        open={minModalVisible}
        onCancel={() => setMinModalVisible(false)}
        footer={null}
        width={400}
        centered
        className="modern-modal"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-3xl">inventory</span>
          </div>
          <h2 className="text-xl font-black text-slate-800">Ngưỡng tồn tối thiểu</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Sản phẩm: {editingProduct?.TenSP}</p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số lượng tối thiểu</label>
            <Input 
              type="number" 
              className="h-12 rounded-2xl font-black text-lg text-center"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 font-medium italic text-center">Hệ thống sẽ cảnh báo khi tồn kho thấp hơn ngưỡng này</p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              type="primary" 
              onClick={handleSaveMinStock}
              className="h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 border-0 font-bold"
            >
              Cập nhật ngay
            </Button>
            <Button 
              onClick={() => setMinModalVisible(false)}
              className="h-12 rounded-2xl border-slate-200 font-bold"
            >
              Hủy bỏ
            </Button>
          </div>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #94a3b8 !important;
          font-size: 11px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          padding: 20px 24px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .modern-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
          border-bottom: 1px solid #f8fafc !important;
        }
        .modern-table .ant-table-row:hover > td {
          background: #f8fafc !important;
        }
        .modern-modal .ant-modal-content {
          border-radius: 40px !important;
          padding: 32px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .modern-select.ant-select-single:not(.ant-select-customize-input) .ant-select-selector {
          height: 44px !important;
          border-radius: 12px !important;
          border-color: #f1f5f9 !important;
          background: #f8fafc !important;
          padding: 0 16px !important;
          display: flex;
          align-items: center;
          font-weight: 700;
          color: #334155;
        }
      `}} />
    </div>
  );
};

export default ProductManagement;