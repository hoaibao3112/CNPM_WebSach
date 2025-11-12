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
  Badge,
  Tabs,
  Statistic,
  Switch,
  InputNumber,
  Rate
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
  TagOutlined,
  TagsOutlined,
  SendOutlined,
  FormOutlined,
  BarChartOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import '../styles/DiscountManagement.css';

const { TabPane } = Tabs;
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
  Audience: 'PUBLIC',
  IsClaimable: 1,
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
  
  // States for Coupon Management Tab
  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponFormType, setCouponFormType] = useState('add');
  const [couponForm] = Form.useForm();
  const [editingCoupon, setEditingCoupon] = useState(null);

  // States for Preference Form Management Tab
  const [preferenceForms, setPreferenceForms] = useState([]);
  const [preferenceLoading, setPreferenceLoading] = useState(false);
  const [showPreferenceForm, setShowPreferenceForm] = useState(false);
  const [preferenceFormType, setPreferenceFormType] = useState('add');
  const [preferenceForm] = Form.useForm();
  const [editingPreferenceForm, setEditingPreferenceForm] = useState(null);
  const [selectedFormDetail, setSelectedFormDetail] = useState(null);
  
  // States for Question Management
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [currentFormForQuestions, setCurrentFormForQuestions] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionForm] = Form.useForm();
  const [optionForm] = Form.useForm();
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddOption, setShowAddOption] = useState(null); // ID của câu hỏi đang thêm option
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  
  // States for Customer Responses Tab
  const [customerResponses, setCustomerResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showResponseDetail, setShowResponseDetail] = useState(false);
  const [responseStats, setResponseStats] = useState({
    totalResponses: 0,
    withConsent: 0,
    uniqueCustomers: 0
  });
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('1');

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

  // ===== COUPON MANAGEMENT FUNCTIONS =====
  const fetchCoupons = async () => {
    setCouponLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/coupons/admin/all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setCoupons(response.data.data || []);
    } catch (err) {
      message.error('Không thể tải danh sách coupon');
      console.error(err);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleAddCoupon = () => {
    setCouponFormType('add');
    setEditingCoupon(null);
    couponForm.resetFields();
    setShowCouponForm(true);
  };

  const handleEditCoupon = (coupon) => {
    setCouponFormType('edit');
    setEditingCoupon(coupon);
    
  // No longer map discount type - backend schema simplified
    // Extract TenPhieu from MoTa (if format is "TenPhieu - MoTa")
    const moTaParts = coupon.MoTa?.split(' - ') || [];
    const tenPhieu = moTaParts.length > 1 ? moTaParts[0] : '';
    const moTa = moTaParts.length > 1 ? moTaParts.slice(1).join(' - ') : coupon.MoTa;

    couponForm.setFieldsValue({
      MaPhieu: coupon.MaPhieu,
      TenPhieu: tenPhieu,
      MoTa: moTa,
      GiaTriDonToiThieu: 0, // DB không có field này (placeholder)
      SoLuongPhatHanh: coupon.SoLanSuDungToiDa,
      MaKM: coupon.MaKM || null,
    });
    setShowCouponForm(true);
  };

  const handleSaveCoupon = async () => {
    try {
      const values = await couponForm.validateFields();

      // Build payload matching backend phieugiamgia columns (simplified schema)
      const moTaCombined = (values.TenPhieu ? values.TenPhieu : '') + (values.MoTa ? (values.TenPhieu ? ' - ' : '') + values.MoTa : '');

      const payload = {
        MaPhieu: values.MaPhieu,
        MoTa: moTaCombined || null,
        SoLanSuDungToiDa: values.SoLuongPhatHanh || 1,
        MaKM: values.MaKM || null
      };

      if (couponFormType === 'add') {
        await axios.post('http://localhost:5000/api/coupons/admin/create', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        message.success('Tạo coupon thành công!');
      } else {
        await axios.put(`http://localhost:5000/api/coupons/admin/${editingCoupon.MaPhieu}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        message.success('Cập nhật coupon thành công!');
      }

      setShowCouponForm(false);
      fetchCoupons();
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
      console.error(err);
    }
  };

  const handleDeleteCoupon = (maPhieu) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa coupon này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/coupons/admin/${maPhieu}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          });
          message.success('Xóa coupon thành công!');
          fetchCoupons();
        } catch (err) {
          message.error('Không thể xóa coupon');
          console.error(err);
        }
      }
    });
  };

  // ===== PREFERENCE FORM MANAGEMENT FUNCTIONS =====
  const fetchPreferenceForms = async () => {
    setPreferenceLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/preferences/admin/forms', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setPreferenceForms(response.data.data || []);
    } catch (err) {
      message.error('Không thể tải danh sách form');
      console.error(err);
    } finally {
      setPreferenceLoading(false);
    }
  };

  const handleAddPreferenceForm = () => {
    setPreferenceFormType('add');
    setEditingPreferenceForm(null);
    preferenceForm.resetFields();
    setShowPreferenceForm(true);
  };

  const handleEditPreferenceForm = (form) => {
    setPreferenceFormType('edit');
    setEditingPreferenceForm(form);
    // Try to pre-select a coupon that links to the form's MaKM (if any)
    const matchedCoupon = coupons.find(c => c.MaKM && form.MaKM && c.MaKM === form.MaKM);
    preferenceForm.setFieldsValue({
      TenForm: form.TenForm,
      MoTa: form.MoTa,
      IsActive: form.TrangThai === 1,  // Map TrangThai to IsActive
      SelectedCoupon: matchedCoupon ? matchedCoupon.MaPhieu : null
    });
    setShowPreferenceForm(true);
  };

  const handleSavePreferenceForm = async () => {
    try {
      const values = await preferenceForm.validateFields();
      // If admin selected a coupon template, derive MaKM from that coupon
      let maKMToSend = null;
      if (values.SelectedCoupon) {
        const sel = coupons.find(c => c.MaPhieu === values.SelectedCoupon);
        maKMToSend = sel?.MaKM || null;
      }

      const payload = {
        TenForm: values.TenForm,
        MoTa: values.MoTa,
        TrangThai: values.IsActive ? 1 : 0, // Map IsActive to TrangThai
        MaKM: maKMToSend
      };

      if (preferenceFormType === 'add') {
        await axios.post('http://localhost:5000/api/preferences/admin/forms', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        message.success('Tạo form thành công!');
      } else {
        await axios.put(`http://localhost:5000/api/preferences/admin/forms/${editingPreferenceForm.MaForm}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        message.success('Cập nhật form thành công!');
      }

      setShowPreferenceForm(false);
      fetchPreferenceForms();
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
      console.error(err);
    }
  };

  const handleDeletePreferenceForm = (formId) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa form này? Các câu hỏi liên quan cũng sẽ bị xóa.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/preferences/admin/forms/${formId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          });
          message.success('Xóa form thành công!');
          fetchPreferenceForms();
        } catch (err) {
          message.error('Không thể xóa form');
          console.error(err);
        }
      }
    });
  };

  const handleViewFormDetail = async (formId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/preferences/admin/forms/${formId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setSelectedFormDetail(response.data.data);
      Modal.info({
        title: 'Chi tiết Form',
        width: 800,
        content: (
          <div>
            <p><strong>Tên:</strong> {response.data.data.TenForm}</p>
            <p><strong>Mô tả:</strong> {response.data.data.MoTa}</p>
            <p><strong>Số câu hỏi:</strong> {response.data.data.questions?.length || 0}</p>
            <Divider />
            {response.data.data.questions?.map((q, idx) => (
              <div key={q.CauHoiID} style={{ marginBottom: 16 }}>
                <Text strong>Câu {idx + 1}: {q.NoiDungCauHoi}</Text>
                <div style={{ marginLeft: 16 }}>
                  <Text type="secondary">Loại: {q.LoaiCauHoi}</Text>
                  <ul>
                    {q.options?.map(opt => (
                      <li key={opt.LuaChonID}>{opt.NoiDung}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )
      });
    } catch (err) {
      message.error('Không thể tải chi tiết form');
      console.error(err);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === '2') {
      fetchCoupons();
    } else if (activeTab === '3') {
      fetchPreferenceForms();
      // Ensure coupon templates are available when managing preference forms
      fetchCoupons();
      fetchCategoriesAndAuthors(); // Load dropdown data
    } else if (activeTab === '4') {
      fetchCustomerResponses();
    }
  }, [activeTab]);

  // Fetch categories and authors for dropdowns
  const fetchCategoriesAndAuthors = async () => {
    try {
      const [catRes, authRes] = await Promise.all([
        axios.get('http://localhost:5000/api/product/categories', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        }),
        axios.get('http://localhost:5000/api/author', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        })
      ]);
      setCategories(catRes.data || []);
      setAuthors(authRes.data || []);
    } catch (err) {
      console.error('Error fetching categories/authors:', err);
    }
  };

  // ===== QUESTION MANAGEMENT FUNCTIONS =====
  const handleManageQuestions = async (formId) => {
    try {
      setCurrentFormForQuestions(formId);
      const response = await axios.get(`http://localhost:5000/api/preferences/admin/forms/${formId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setQuestions(response.data.data.questions || []);
      setShowQuestionManager(true);
    } catch (err) {
      message.error('Không thể tải danh sách câu hỏi');
      console.error(err);
    }
  };

  // ===== CUSTOMER RESPONSES FUNCTIONS =====
  const fetchCustomerResponses = async () => {
    setResponsesLoading(true);
    try {
      // Lấy tất cả form để có thể query responses
      const formsResponse = await axios.get('http://localhost:5000/api/preferences/admin/forms', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      
      const forms = formsResponse.data.data || [];
      
      // Lấy responses từ tất cả forms
      const allResponses = [];
      for (const form of forms) {
        try {
          const responsesRes = await axios.get(
            `http://localhost:5000/api/preferences/admin/forms/${form.MaForm}/responses`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            }
          );
          
          const responses = responsesRes.data.data || [];
          responses.forEach(res => {
            allResponses.push({
              ...res,
              TenForm: form.TenForm,
              MaForm: form.MaForm
            });
          });
        } catch (err) {
          console.error(`Error fetching responses for form ${form.MaForm}:`, err);
        }
      }
      
      setCustomerResponses(allResponses);
      
      // Tính stats
      const totalResponses = allResponses.length;
      const withConsent = allResponses.filter(r => r.DongYSuDung === 1).length;
      const uniqueCustomers = new Set(allResponses.map(r => r.makh)).size;
      
      setResponseStats({
        totalResponses,
        withConsent,
        uniqueCustomers
      });
      
    } catch (err) {
      message.error('Không thể tải danh sách phản hồi');
      console.error(err);
    } finally {
      setResponsesLoading(false);
    }
  };

  const handleViewResponseDetail = async (response) => {
    try {
      // Fetch chi tiết câu trả lời
      const detailRes = await axios.get(
        `http://localhost:5000/api/preferences/admin/forms/${response.MaForm}/responses`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        }
      );
      
      // Tìm response cụ thể
      const fullResponse = (detailRes.data.data || []).find(
        r => r.MaPhanHoi === response.MaPhanHoi
      );
      
      if (fullResponse) {
        setSelectedResponse({
          ...fullResponse,
          TenForm: response.TenForm
        });
        setShowResponseDetail(true);
      } else {
        message.error('Không tìm thấy chi tiết phản hồi');
      }
    } catch (err) {
      message.error('Không thể tải chi tiết phản hồi');
      console.error(err);
    }
  };

  const handleExportResponses = () => {
    // Convert to CSV
    const headers = ['Mã phản hồi', 'Khách hàng', 'Form', 'Ngày trả lời', 'Đồng ý'];
    const rows = customerResponses.map(r => [
      r.MaPhanHoi,
      r.TenKH || r.makh,
      r.TenForm,
      new Date(r.NgayPhanHoi).toLocaleDateString('vi-VN'),
      r.DongYSuDung === 1 ? 'Có' : 'Không'
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customer_responses_${new Date().getTime()}.csv`;
    link.click();
    
    message.success('Đã xuất file CSV thành công!');
  };

  const handleAddQuestion = async () => {
    try {
      const values = await questionForm.validateFields();
      const payload = {
        MaForm: currentFormForQuestions,
        NoiDungCauHoi: values.NoiDungCauHoi,
        LoaiCauHoi: values.LoaiCauHoi,
        BatBuoc: values.BatBuoc ? 1 : 0,
        ThuTu: values.ThuTu || 0
      };

      await axios.post('http://localhost:5000/api/preferences/admin/questions', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      message.success('Thêm câu hỏi thành công!');
      questionForm.resetFields();
      // Reload questions
      handleManageQuestions(currentFormForQuestions);
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
      console.error(err);
    }
  };

  const handleDeleteQuestion = (questionId) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa câu hỏi này? Các lựa chọn liên quan cũng sẽ bị xóa.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/preferences/admin/questions/${questionId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          });
          message.success('Xóa câu hỏi thành công!');
          handleManageQuestions(currentFormForQuestions);
        } catch (err) {
          message.error('Không thể xóa câu hỏi');
          console.error(err);
        }
      }
    });
  };

  const handleAddOption = async (questionId) => {
    try {
      const values = await optionForm.validateFields();
      const payload = {
        MaCauHoi: questionId,
        NoiDungLuaChon: values.NoiDungLuaChon,
        MaTL: values.MaTL || null,
        MaTG: values.MaTG || null,
        HinhThuc: values.HinhThuc || null,
        MaKhoangGia: values.MaKhoangGia || null,
        NamXBTu: values.NamXBTu || null,
        NamXBDen: values.NamXBDen || null,
        SoTrangTu: values.SoTrangTu || null,
        SoTrangDen: values.SoTrangDen || null,
        TrongSo: values.TrongSo || 1.0,
        ThuTu: values.ThuTu || 0
      };

      await axios.post('http://localhost:5000/api/preferences/admin/options', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      message.success('Thêm lựa chọn thành công!');
      optionForm.resetFields();
      setShowAddOption(null);
      // Reload questions
      handleManageQuestions(currentFormForQuestions);
    } catch (err) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
      console.error(err);
    }
  };

  const handleDeleteOption = (optionId) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa lựa chọn này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/preferences/admin/options/${optionId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          });
          message.success('Xóa lựa chọn thành công!');
          handleManageQuestions(currentFormForQuestions);
        } catch (err) {
          message.error('Không thể xóa lựa chọn');
          console.error(err);
        }
      }
    });
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
        Audience: data.Audience || 'PUBLIC',
        IsClaimable: typeof data.IsClaimable !== 'undefined' ? !!data.IsClaimable : true,
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
      // Normalize IsClaimable to integer expected by backend
      if (typeof values.IsClaimable !== 'undefined') {
        values.IsClaimable = values.IsClaimable ? 1 : 0;
      }
      
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
      width: 200, // limit column width to avoid overlapping actions
      ellipsis: {
        showTitle: false,
      },
      render: (tenKM) => (
        <Tooltip placement="topLeft" title={tenKM}>
          <Text strong style={{
            display: 'inline-block',
            maxWidth: 220,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>{tenKM}</Text>
        </Tooltip>
      ),
    },
    { 
      title: 'Loại KM', 
      dataIndex: 'LoaiKM', 
      key: 'LoaiKM',
      width: 100,
      render: renderPromotionType
    },
    { 
      title: 'Mã code', 
      dataIndex: 'Code', 
      key: 'Code',
      width: 100,
      render: (code) => (
        <Tag icon={<TagOutlined />} color="purple">
          {code}
        </Tag>
      )
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 140, // tightened column width
      render: (_, record) => (
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarOutlined style={{ fontSize: 14 }} />
            <span>Từ: {record.NgayBatDau?.slice(0, 10)}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarOutlined style={{ fontSize: 14 }} />
            <span>Đến: {record.NgayKetThuc?.slice(0, 10)}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThai',
      key: 'TrangThai',
      width: 110,
      render: (trangThai) => (
        <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          {renderStatus(trangThai)}
        </div>
      ),
    },
    {
      title: 'Thao tác',
    key: 'action',
    width: 150,
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
          <GiftOutlined /> Quản lý Khuyến mãi & Coupon
        </Title>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" size="large">
        {/* Tab 1: Khuyến mãi hiện tại */}
        <TabPane 
          tab={
            <span>
              <TagOutlined />
              Khuyến mãi
            </span>
          } 
          key="1"
        >
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
            >
              Thêm khuyến mãi
            </Button>
          </div>

          {error && (
            <div className="error-message" style={{ padding: 12, background: '#fff2e8', borderRadius: 4, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <Table
            columns={columns}
            dataSource={promotions}
            rowKey="MaKM"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </TabPane>

        {/* Tab 2: Quản lý Coupon */}
        <TabPane 
          tab={
            <span>
              <TagsOutlined />
              Phiếu giảm giá (Coupon)
            </span>
          } 
          key="2"
        >
          <div className="controls-section" style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCoupon}
            >
              Thêm Coupon
            </Button>
          </div>

          <Table
            loading={couponLoading}
            dataSource={coupons}
            rowKey="MaPhieu"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: 'Mã Phiếu',
                dataIndex: 'MaPhieu',
                key: 'MaPhieu',
                width: 120,
                render: (text) => <Tag color="blue">{text}</Tag>
              },
              {
                title: 'Tên Phiếu',
                dataIndex: 'MoTa',
                key: 'MoTa',
                width: 200,
                ellipsis: true
              },
              {
                title: 'Liên kết KM',
                dataIndex: 'MaKM',
                key: 'MaKM',
                width: 160,
                render: (m) => m ? <Tag color="cyan">{m}</Tag> : '-'
              },
              {
                title: 'Trạng thái',
                dataIndex: 'TrangThai',
                key: 'TrangThai',
                width: 120,
                render: (t) => t === 1 ? <Tag color="green">Hoạt động</Tag> : <Tag color="default">Vô hiệu</Tag>
              },
              {
                title: 'Sử dụng',
                key: 'usage',
                width: 120,
                render: (_, record) => `${record.DaSuDung || 0}/${record.SoLanSuDungToiDa || 0}`
              },
              
              {
                title: 'Thao tác',
                key: 'action',
                width: 150,
                render: (_, record) => (
                  <Space>
                    <Tooltip title="Chỉnh sửa">
                      <Button 
                        icon={<EditOutlined />} 
                        size="small" 
                        type="primary"
                        onClick={() => handleEditCoupon(record)}
                      />
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => handleDeleteCoupon(record.MaPhieu)}
                      />
                    </Tooltip>
                  </Space>
                )
              }
            ]}
          />
        </TabPane>

        {/* Tab 3: Quản lý Form sở thích */}
        <TabPane 
          tab={
            <span>
              <FormOutlined />
              Form sở thích khách hàng
            </span>
          } 
          key="3"
        >
          <div className="controls-section" style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddPreferenceForm}
            >
              Thêm Form
            </Button>
          </div>

          <Table
            loading={preferenceLoading}
            dataSource={preferenceForms}
            rowKey="MaForm"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: 'ID',
                dataIndex: 'MaForm',
                key: 'MaForm',
                width: 80
              },
              {
                title: 'Tên Form',
                dataIndex: 'TenForm',
                key: 'TenForm',
                width: 200
              },
              {
                title: 'Mô tả',
                dataIndex: 'MoTa',
                key: 'MoTa',
                ellipsis: true
              },
              {
                title: 'Trạng thái',
                dataIndex: 'TrangThai',
                key: 'TrangThai',
                width: 120,
                render: (status) => (
                  <Tag color={status === 1 ? 'green' : 'red'}>
                    {status === 1 ? 'Hoạt động' : 'Ngừng'}
                  </Tag>
                )
              },
              {
                title: 'Ngày tạo',
                dataIndex: 'NgayTao',
                key: 'NgayTao',
                width: 120,
                render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
              },
              {
                title: 'Thao tác',
                key: 'action',
                width: 180,
                render: (_, record) => (
                  <Space>
                    <Tooltip title="Quản lý câu hỏi">
                      <Button 
                        icon={<BarChartOutlined />} 
                        size="small"
                        type="default"
                        onClick={() => handleManageQuestions(record.MaForm)}
                      >
                        Câu hỏi ({record.SoCauHoi || 0})
                      </Button>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                      <Button 
                        icon={<EditOutlined />} 
                        size="small" 
                        type="primary"
                        onClick={() => handleEditPreferenceForm(record)}
                      />
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => handleDeletePreferenceForm(record.MaForm)}
                      />
                    </Tooltip>
                  </Space>
                )
              }
            ]}
          />
        </TabPane>

        {/* Tab 4: Phản hồi khách hàng - MỚI */}
        <TabPane 
          tab={
            <span>
              <UserOutlined />
              Phản hồi khách hàng
            </span>
          } 
          key="4"
        >
          {/* Statistics Cards */}
          <Row gutter={16} style={{ margin: '16px 0' }}>
            <Col span={8}>
              <Card size="small" className="stat-card">
                <div className="stat-content">
                  <div className="stat-number">{responseStats.totalResponses}</div>
                  <div className="stat-label">Tổng phản hồi</div>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="stat-card success">
                <div className="stat-content">
                  <div className="stat-number">{responseStats.uniqueCustomers}</div>
                  <div className="stat-label">Khách hàng tham gia</div>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="stat-card warning">
                <div className="stat-content">
                  <div className="stat-number">{responseStats.withConsent}</div>
                  <div className="stat-label">Đồng ý cá nhân hóa</div>
                </div>
              </Card>
            </Col>
          </Row>

          <div className="controls-section" style={{ marginBottom: 16 }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportResponses}
              disabled={customerResponses.length === 0}
            >
              Xuất CSV
            </Button>
          </div>

          <Table
            loading={responsesLoading}
            dataSource={customerResponses}
            rowKey="MaPhanHoi"
            pagination={{ 
              pageSize: 15,
              showTotal: (total) => `Tổng ${total} phản hồi`
            }}
            columns={[
              {
                title: '#',
                dataIndex: 'MaPhanHoi',
                key: 'MaPhanHoi',
                width: 80,
                render: (id) => <Tag color="blue">#{id}</Tag>
              },
              {
                title: 'Khách hàng',
                key: 'customer',
                width: 150,
                render: (_, record) => (
                  <div>
                    <div><strong>ID: {record.makh}</strong></div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {record.TenKH || 'Chưa có tên'}
                    </div>
                  </div>
                )
              },
              {
                title: 'Form',
                dataIndex: 'TenForm',
                key: 'TenForm',
                ellipsis: true,
                render: (text) => (
                  <Tooltip title={text}>
                    <Text>{text}</Text>
                  </Tooltip>
                )
              },
              {
                title: 'Ngày trả lời',
                dataIndex: 'NgayPhanHoi',
                key: 'NgayPhanHoi',
                width: 150,
                sorter: (a, b) => new Date(a.NgayPhanHoi) - new Date(b.NgayPhanHoi),
                render: (date) => (
                  <div>
                    <div>{dayjs(date).format('DD/MM/YYYY')}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {dayjs(date).format('HH:mm:ss')}
                    </div>
                  </div>
                )
              },
              {
                title: 'Số câu trả lời',
                key: 'answerCount',
                width: 120,
                align: 'center',
                render: (_, record) => (
                  <Tag color="purple">
                    {record.answers?.length || 0} câu
                  </Tag>
                )
              },
              {
                title: 'Đồng ý',
                dataIndex: 'DongYSuDung',
                key: 'DongYSuDung',
                width: 100,
                align: 'center',
                filters: [
                  { text: 'Có', value: 1 },
                  { text: 'Không', value: 0 }
                ],
                onFilter: (value, record) => record.DongYSuDung === value,
                render: (consent) => (
                  consent === 1 ? 
                    <Tag color="green" icon={<CheckCircleOutlined />}>Có</Tag> : 
                    <Tag color="default" icon={<CloseCircleOutlined />}>Không</Tag>
                )
              },
              {
                title: 'Thao tác',
                key: 'action',
                width: 120,
                fixed: 'right',
                render: (_, record) => (
                  <Button
                    icon={<EyeOutlined />}
                    size="small"
                    type="primary"
                    onClick={() => handleViewResponseDetail(record)}
                  >
                    Chi tiết
                  </Button>
                )
              }
            ]}
            scroll={{ x: 1200 }}
          />
        </TabPane>
      </Tabs>

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

          {/* Audience & IsClaimable - visible to admin, default depends on LoaiKM */}
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.LoaiKM !== currentValues.LoaiKM}>
            {({ getFieldValue }) => {
              const loaiKM = getFieldValue('LoaiKM');
              const defaultAudience = loaiKM === 'free_ship' ? 'FORM_ONLY' : 'PUBLIC';
              const defaultIsClaimable = loaiKM === 'free_ship' ? 0 : 1;

              return (
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={12}>
                    <Form.Item label="Audience" name="Audience" initialValue={defaultAudience}>
                      <Select>
                        <Option value="PUBLIC">PUBLIC</Option>
                        <Option value="FORM_ONLY">FORM_ONLY</Option>
                        <Option value="PRIVATE">PRIVATE</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="IsClaimable" name="IsClaimable" valuePropName="checked" initialValue={!!defaultIsClaimable}>
                      <Switch checkedChildren="Có" unCheckedChildren="Không" />
                    </Form.Item>
                  </Col>
                </Row>
              );
            }}
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

      {/* Modal Coupon Form */}
      <Modal
        open={showCouponForm}
        title={couponFormType === 'add' ? 'Thêm Coupon mới' : 'Chỉnh sửa Coupon'}
        onCancel={() => setShowCouponForm(false)}
        onOk={handleSaveCoupon}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
      >
        <Form form={couponForm} layout="vertical">
          <Form.Item 
            label="Mã Phiếu" 
            name="MaPhieu"
            rules={[{ required: true, message: 'Vui lòng nhập mã phiếu' }]}
          >
            <Input placeholder="Ví dụ: FREESHIP2025" />
          </Form.Item>

          <Form.Item 
            label="Tên Phiếu" 
            name="TenPhieu"
            rules={[{ required: true, message: 'Vui lòng nhập tên phiếu' }]}
          >
            <Input placeholder="Ví dụ: Miễn phí vận chuyển" />
          </Form.Item>

          <Form.Item label="Mô tả" name="MoTa">
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết về coupon" />
          </Form.Item>

          {/* Loại giảm & Giá trị giảm: hide when MaKM is selected (coupon linked to promotion) */}
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.MaKM !== currentValues.MaKM || prevValues.LoaiGiam !== currentValues.LoaiGiam}>
            {({ getFieldValue }) => {
              const hasMaKM = !!getFieldValue('MaKM');
              const isAdd = couponFormType === 'add';
              const loaiRules = (hasMaKM || isAdd) ? [] : [{ required: true, message: 'Vui lòng chọn loại giảm' }];
              const giaTriRules = (hasMaKM || isAdd) ? [] : [{ required: true, message: 'Vui lòng nhập giá trị' }];

              // Hide these fields when MaKM is present OR when creating a new coupon (add form)
              if (hasMaKM || isAdd) return null;

              return (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      label="Loại giảm" 
                      name="LoaiGiam"
                      rules={loaiRules}
                    >
                      <Select placeholder="Chọn loại">
                        <Option value="percent">Phần trăm (%)</Option>
                        <Option value="fixed">Cố định (VND)</Option>
                        <Option value="freeship">Miễn phí vận chuyển</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      label="Giá trị giảm" 
                      name="GiaTriGiam"
                      rules={giaTriRules}
                    >
                      <InputNumber 
                        style={{ width: '100%' }}
                        min={0}
                        placeholder="Nhập giá trị"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              );
            }}
          </Form.Item>

          <Form.Item
            label="Coupon liên kết (MaKM)"
            name="MaKM"
          >
            <Select placeholder="Chọn MaKM (khuyến mãi free ship)" allowClear showSearch optionFilterProp="children">
              {promotions && promotions
                .filter(p => p.LoaiKM === 'free_ship')
                .map(p => (
                  <Option key={p.MaKM} value={p.MaKM}>
                    {p.TenKM} {p.Code ? `(${p.Code})` : ''}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.MaKM !== currentValues.MaKM}>
            {({ getFieldValue }) => {
              const hasMaKM = !!getFieldValue('MaKM');
              const isAdd = couponFormType === 'add';
              // Hide GiaTriDonToiThieu when MaKM present OR when adding a coupon
              return (
                <Row gutter={16}>
                  <Col span={12}>
                    {!(hasMaKM || isAdd) ? (
                      <Form.Item label="Đơn hàng tối thiểu" name="GiaTriDonToiThieu">
                        <InputNumber 
                          style={{ width: '100%' }}
                          min={0}
                          placeholder="0 = không giới hạn"
                          addonAfter="VND"
                        />
                      </Form.Item>
                    ) : null}
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Số lượng phát hành" name="SoLuongPhatHanh">
                      <InputNumber 
                        style={{ width: '100%' }}
                        min={1}
                        placeholder="Số lượng"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              );
            }}
          </Form.Item>

          {/* Ngày hết hạn đã bị loại bỏ khỏi form theo yêu cầu */}
        </Form>
      </Modal>

      {/* Modal Preference Form */}
      <Modal
        open={showPreferenceForm}
        title={preferenceFormType === 'add' ? 'Thêm Form sở thích mới' : 'Chỉnh sửa Form sở thích'}
        onCancel={() => setShowPreferenceForm(false)}
        onOk={handleSavePreferenceForm}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
      >
        <Form form={preferenceForm} layout="vertical">
          <Form.Item 
            label="Tên Form" 
            name="TenForm"
            rules={[{ required: true, message: 'Vui lòng nhập tên form' }]}
          >
            <Input placeholder="Ví dụ: Khảo sát sở thích đọc sách" />
          </Form.Item>

          <Form.Item 
            label="Mô tả" 
            name="MoTa"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <Input.TextArea rows={4} placeholder="Mô tả mục đích của form" />
          </Form.Item>

          <Form.Item 
            label="Trạng thái" 
            name="IsActive"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
          </Form.Item>

          <Form.Item label="Phiếu giảm giá liên kết" name="SelectedCoupon">
            <Select placeholder="Chọn phiếu giảm giá (coupon template)" allowClear showSearch optionFilterProp="children">
              {coupons && coupons
                // List coupon templates that are linked to a promotion (have MaKM)
                .filter(c => c.MaKM)
                .map(c => (
                  <Option key={c.MaPhieu} value={c.MaPhieu}>
                    {(c.MoTa || c.MaPhieu).slice(0, 60)} ({c.MaPhieu})
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <div style={{ padding: '12px', background: '#e6f7ff', borderRadius: 4, marginTop: 16 }}>
            <Text type="secondary">
              💡 <strong>Lưu ý:</strong> Sau khi tạo form, bạn có thể thêm câu hỏi và lựa chọn thông qua API hoặc script <code>createQuestions.js</code>
            </Text>
          </div>
        </Form>
      </Modal>

      {/* Modal Question Manager */}
      <Modal
        open={showQuestionManager}
        title={
          <div>
            <FormOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Quản lý câu hỏi - Form #{currentFormForQuestions}
          </div>
        }
        onCancel={() => {
          setShowQuestionManager(false);
          setShowAddOption(null);
          questionForm.resetFields();
          optionForm.resetFields();
        }}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Danh sách câu hỏi hiện có */}
          <Card 
            title={`📋 Danh sách câu hỏi (${questions.length})`}
            size="small"
            style={{ marginBottom: 24 }}
          >
            {questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
                <FormOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>Chưa có câu hỏi nào. Hãy thêm câu hỏi mới bên dưới.</div>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {questions.map((q, idx) => (
                  <Card 
                    key={q.MaCauHoi}
                    type="inner"
                    size="small"
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color="blue">#{idx + 1}</Tag>
                        <Text strong>{q.NoiDungCauHoi}</Text>
                        {q.BatBuoc === 1 && <Tag color="red">Bắt buộc</Tag>}
                        <Tag color="purple">{q.LoaiCauHoi}</Tag>
                      </div>
                    }
                    extra={
                      <Space>
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => setShowAddOption(q.MaCauHoi)}
                        >
                          Thêm lựa chọn
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteQuestion(q.MaCauHoi)}
                        />
                      </Space>
                    }
                  >
                    {/* Hiển thị options */}
                    {q.options && q.options.length > 0 ? (
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Lựa chọn ({q.options.length}):
                        </Text>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {q.options.map(opt => (
                            <Tag 
                              key={opt.MaLuaChon}
                              closable
                              onClose={() => handleDeleteOption(opt.MaLuaChon)}
                              color="default"
                            >
                              {opt.NoiDungLuaChon}
                              {opt.MaTL && ` [TL:${opt.MaTL}]`}
                              {opt.MaTG && ` [TG:${opt.MaTG}]`}
                              {opt.TrongSo && ` (${opt.TrongSo}x)`}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Text type="secondary" italic style={{ fontSize: 12 }}>
                        Chưa có lựa chọn. Click "Thêm lựa chọn" để thêm.
                      </Text>
                    )}

                    {/* Form thêm option (hiện khi click) */}
                    {showAddOption === q.MaCauHoi && (
                      <Card 
                        size="small" 
                        style={{ marginTop: 16, background: '#f5f5f5' }}
                        title="➕ Thêm lựa chọn mới"
                        extra={
                          <Button 
                            size="small" 
                            onClick={() => setShowAddOption(null)}
                          >
                            Hủy
                          </Button>
                        }
                      >
                        <Form 
                          form={optionForm} 
                          layout="vertical"
                          onFinish={() => handleAddOption(q.MaCauHoi)}
                        >
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                label="Nội dung lựa chọn"
                                name="NoiDungLuaChon"
                                rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                              >
                                <Input placeholder="VD: Tiểu thuyết" />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item label="Trọng số" name="TrongSo" initialValue={1.0}>
                                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item label="Thứ tự" name="ThuTu" initialValue={0}>
                                <InputNumber style={{ width: '100%' }} min={0} />
                              </Form.Item>
                            </Col>
                          </Row>

                          {/* Conditional fields based on question type */}
                          {q.LoaiCauHoi === 'entity_theloai' && (
                            <Form.Item label="Thể loại" name="MaTL">
                              <Select 
                                placeholder="Chọn thể loại"
                                showSearch
                                filterOption={(input, option) =>
                                  option.children.toLowerCase().includes(input.toLowerCase())
                                }
                              >
                                {categories.map(cat => (
                                  <Option key={cat.MaTL} value={cat.MaTL}>
                                    {cat.TenTL}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          )}

                          {q.LoaiCauHoi === 'entity_tacgia' && (
                            <Form.Item label="Tác giả" name="MaTG">
                              <Select 
                                placeholder="Chọn tác giả"
                                showSearch
                                filterOption={(input, option) =>
                                  option.children.toLowerCase().includes(input.toLowerCase())
                                }
                              >
                                {authors.map(auth => (
                                  <Option key={auth.MaTG} value={auth.MaTG}>
                                    {auth.TenTG}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          )}

                          {q.LoaiCauHoi === 'entity_hinhthuc' && (
                            <Form.Item label="Hình thức" name="HinhThuc">
                              <Select placeholder="Chọn hình thức">
                                <Option value="Bìa cứng">Bìa cứng</Option>
                                <Option value="Bìa mềm">Bìa mềm</Option>
                                <Option value="Bìa gáy xoắn">Bìa gáy xoắn</Option>
                                <Option value="Ebook">Ebook</Option>
                              </Select>
                            </Form.Item>
                          )}

                          {q.LoaiCauHoi === 'entity_khoanggia' && (
                            <Form.Item label="Mã khoảng giá" name="MaKhoangGia">
                              <Input placeholder="VD: LT100, 100-200, GT500" />
                            </Form.Item>
                          )}

                          {q.LoaiCauHoi === 'entity_namxb' && (
                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item label="Năm XB từ" name="NamXBTu">
                                  <InputNumber style={{ width: '100%' }} placeholder="2020" />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item label="Năm XB đến" name="NamXBDen">
                                  <InputNumber style={{ width: '100%' }} placeholder="2025" />
                                </Form.Item>
                              </Col>
                            </Row>
                          )}

                          {q.LoaiCauHoi === 'entity_sotrang' && (
                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item label="Số trang từ" name="SoTrangTu">
                                  <InputNumber style={{ width: '100%' }} placeholder="1" />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item label="Số trang đến" name="SoTrangDen">
                                  <InputNumber style={{ width: '100%' }} placeholder="200" />
                                </Form.Item>
                              </Col>
                            </Row>
                          )}

                          <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                              Thêm lựa chọn
                            </Button>
                          </Form.Item>
                        </Form>
                      </Card>
                    )}
                  </Card>
                ))}
              </Space>
            )}
          </Card>

          <Divider />

          {/* Form thêm câu hỏi mới */}
          <Card 
            title="➕ Thêm câu hỏi mới"
            size="small"
          >
            <Form form={questionForm} layout="vertical" onFinish={handleAddQuestion}>
              <Form.Item
                label="Nội dung câu hỏi"
                name="NoiDungCauHoi"
                rules={[{ required: true, message: 'Vui lòng nhập nội dung câu hỏi' }]}
              >
                <Input.TextArea 
                  rows={2}
                  placeholder="VD: Bạn thích đọc thể loại sách nào?"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Loại câu hỏi"
                    name="LoaiCauHoi"
                    rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
                  >
                    <Select placeholder="Chọn loại câu hỏi">
                      <Option value="single">Single Choice (Chọn 1)</Option>
                      <Option value="multiple_choice">Multiple Choice (Chọn nhiều)</Option>
                      <Option value="entity_theloai">Liên kết Thể loại</Option>
                      <Option value="entity_tacgia">Liên kết Tác giả</Option>
                      <Option value="entity_khoanggia">Liên kết Khoảng giá</Option>
                      <Option value="entity_hinhthuc">Liên kết Hình thức</Option>
                      <Option value="entity_namxb">Liên kết Năm XB</Option>
                      <Option value="entity_sotrang">Liên kết Số trang</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Thứ tự" name="ThuTu" initialValue={0}>
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Bắt buộc" name="BatBuoc" valuePropName="checked">
                    <Switch checkedChildren="Có" unCheckedChildren="Không" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                  Thêm câu hỏi
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </Modal>

      {/* Modal Response Detail - MỚI */}
      <Modal
        open={showResponseDetail}
        title={
          <div>
            <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Chi tiết phản hồi khách hàng
          </div>
        }
        onCancel={() => {
          setShowResponseDetail(false);
          setSelectedResponse(null);
        }}
        footer={null}
        width={900}
      >
        {selectedResponse ? (
          <div>
            {/* Thông tin khách hàng */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>Mã phản hồi:</Text>
                  <div><Tag color="blue">#{selectedResponse.MaPhanHoi}</Tag></div>
                </Col>
                <Col span={8}>
                  <Text strong>Khách hàng:</Text>
                  <div>
                    <UserOutlined /> ID: {selectedResponse.makh}
                    {selectedResponse.TenKH && (
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {selectedResponse.TenKH}
                      </div>
                    )}
                  </div>
                </Col>
                <Col span={8}>
                  <Text strong>Form:</Text>
                  <div>{selectedResponse.TenForm}</div>
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>Ngày trả lời:</Text>
                  <div>{dayjs(selectedResponse.NgayPhanHoi).format('DD/MM/YYYY HH:mm:ss')}</div>
                </Col>
                <Col span={8}>
                  <Text strong>Đồng ý sử dụng:</Text>
                  <div>
                    {selectedResponse.DongYSuDung === 1 ? 
                      <Tag color="green" icon={<CheckCircleOutlined />}>Có</Tag> : 
                      <Tag color="default">Không</Tag>
                    }
                  </div>
                </Col>
                <Col span={8}>
                  <Text strong>Số câu trả lời:</Text>
                  <div>
                    <Tag color="purple">{selectedResponse.answers?.length || 0} câu</Tag>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Danh sách câu trả lời */}
            <Card 
              title={
                <span>
                  <FormOutlined style={{ marginRight: 8 }} />
                  Câu trả lời chi tiết
                </span>
              }
              size="small"
            >
              {selectedResponse.answers && selectedResponse.answers.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {selectedResponse.answers.map((answer, idx) => (
                    <Card 
                      key={answer.MaTraLoi || idx}
                      type="inner"
                      size="small"
                      style={{ background: '#fafafa' }}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <Tag color="blue">Câu {idx + 1}</Tag>
                        <Text strong style={{ fontSize: 15 }}>
                          {answer.NoiDungCauHoi || 'Câu hỏi không xác định'}
                        </Text>
                        {answer.BatBuoc === 1 && (
                          <Tag color="red" style={{ marginLeft: 8 }}>Bắt buộc</Tag>
                        )}
                        <Tag color="purple" style={{ marginLeft: 8 }}>
                          {answer.LoaiCauHoi || 'N/A'}
                        </Tag>
                      </div>

                      <div style={{ paddingLeft: 24 }}>
                        {/* Hiển thị câu trả lời theo loại */}
                        {answer.NoiDungLuaChon && (
                          <div>
                            <Text type="secondary">Lựa chọn: </Text>
                            <Tag color="green" style={{ fontSize: 13 }}>
                              {answer.NoiDungLuaChon}
                            </Tag>
                          </div>
                        )}

                        {answer.VanBan && (
                          <div>
                            <Text type="secondary">Văn bản tự do: </Text>
                            <div style={{ 
                              marginTop: 8, 
                              padding: 12, 
                              background: 'white', 
                              borderRadius: 4,
                              border: '1px solid #e8e8e8'
                            }}>
                              {answer.VanBan}
                            </div>
                          </div>
                        )}

                        {answer.DiemDanhGia && (
                          <div>
                            <Text type="secondary">Đánh giá: </Text>
                            <Rate disabled value={answer.DiemDanhGia} />
                            <Text style={{ marginLeft: 8 }}>({answer.DiemDanhGia}/5)</Text>
                          </div>
                        )}

                        {/* Hiển thị metadata nếu có */}
                        {(answer.MaTL || answer.MaTG || answer.HinhThuc || answer.MaKhoangGia) && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Metadata: 
                              {answer.MaTL && ` Thể loại: ${answer.MaTL}`}
                              {answer.MaTG && ` | Tác giả: ${answer.MaTG}`}
                              {answer.HinhThuc && ` | Hình thức: ${answer.HinhThuc}`}
                              {answer.MaKhoangGia && ` | Khoảng giá: ${answer.MaKhoangGia}`}
                              {answer.TrongSo && ` | Trọng số: ${answer.TrongSo}`}
                            </Text>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </Space>
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
                  <FormOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <div>Không có câu trả lời nào</div>
                </div>
              )}
            </Card>

            {/* Điểm sở thích (nếu có) */}
            {selectedResponse.preferences && selectedResponse.preferences.length > 0 && (
              <Card 
                title={
                  <span>
                    <BarChartOutlined style={{ marginRight: 8 }} />
                    Điểm sở thích
                  </span>
                }
                size="small"
                style={{ marginTop: 16 }}
              >
                <Row gutter={[16, 16]}>
                  {selectedResponse.preferences.map((pref, idx) => (
                    <Col span={8} key={idx}>
                      <Card size="small" style={{ background: '#f0f5ff' }}>
                        <div style={{ textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {pref.LoaiThucThe}
                          </Text>
                          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                            {pref.DiemSo.toFixed(1)}
                          </div>
                          <Text style={{ fontSize: 12 }}>
                            {pref.KhoaThucThe}
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Đang tải chi tiết...</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DiscountManagement;