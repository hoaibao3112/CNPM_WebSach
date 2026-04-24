import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../utils/api';
import { Button, Input, message, Table, Modal, Space, Select, Tooltip, Avatar, Form } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  ExclamationCircleFilled, 
  LockOutlined, 
  UnlockOutlined, 
  SearchOutlined, 
  PlusOutlined, 
  HomeOutlined, 
  PhoneOutlined, 
  CheckCircleOutlined, 
  StopOutlined,
  BusinessOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { confirm } = Modal;

const CompanyManagement = () => {
  const [state, setState] = useState({
    companies: [],
    newCompany: { MaNCC: '', TenNCC: '', SDT: '', DiaChi: '', TinhTrang: '1' },
    editingCompany: null,
    searchTerm: '',
    isModalVisible: false,
    loading: false,
    error: null,
  });

  const { companies, newCompany, editingCompany, searchTerm, isModalVisible, loading } = state;
  const API_URL = '/company';
  const debounceRef = useRef(null);

  const convertStatusIfBuffer = useCallback((company) => {
    let statusValue = company.TinhTrang;
    if (statusValue && typeof statusValue === 'object' && statusValue.type === 'Buffer' && statusValue.data && statusValue.data.length > 0) {
      statusValue = statusValue.data[0].toString();
    }
    return statusValue;
  }, []);

  const fetchCompanies = useCallback(async (keyword = '') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await api.get(keyword ? `${API_URL}/search?keyword=${encodeURIComponent(keyword)}` : API_URL);
      const resData = response.data.data || response.data;
      const companiesData = Array.isArray(resData) ? resData : (resData?.data || []);
      if (Array.isArray(companiesData)) {
        const processed = companiesData.map(c => {
          const statusValue = convertStatusIfBuffer(c);
          return { ...c, TinhTrang: statusValue === '1' ? 'Hoạt động' : 'Ngừng hoạt động', TinhTrangValue: statusValue };
        });
        setState(prev => ({ ...prev, companies: processed }));
      }
    } catch (error) { message.error(`Lỗi tải dữ liệu: ${error.message}`); }
    finally { setState(prev => ({ ...prev, loading: false })); }
  }, [convertStatusIfBuffer]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchCompanies(searchTerm); }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, fetchCompanies]);

  const suggestMaNCC = () => {
    if (companies.length === 0) return '1';
    const maxId = Math.max(...companies.map(c => parseInt(c.MaNCC) || 0));
    return (maxId + 1).toString();
  };

  const handleInputChange = (field, value) => {
    if (editingCompany) {
      setState(prev => ({ ...prev, editingCompany: { ...prev.editingCompany, [field]: value, ...(field === 'TinhTrang' && { TinhTrangValue: value }) } }));
    } else {
      setState(prev => ({ ...prev, newCompany: { ...prev.newCompany, [field]: value } }));
    }
  };

  const validate = (data, isEditing) => {
    if (!data.MaNCC || !data.TenNCC || !data.SDT || !data.DiaChi) return message.error('Vui lòng nhập đầy đủ thông tin!'), false;
    
    // Vietnamese phone number validation (simple check for 10 digits starting with 0)
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test(data.SDT)) {
      message.error('Số điện thoại không hợp lệ (Phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09)!');
      return false;
    }

    if (!isEditing && companies.some(c => c.MaNCC === data.MaNCC)) return message.error('Mã NCC đã tồn tại!'), false;
    return true;
  };

  const handleSave = async () => {
    const data = editingCompany || newCompany;
    if (!validate(data, !!editingCompany)) return;
    try {
      if (editingCompany) await api.put(`${API_URL}/${data.MaNCC}`, data);
      else await api.post(API_URL, data);
      message.success(editingCompany ? 'Cập nhật thành công' : 'Thêm mới thành công');
      fetchCompanies(searchTerm);
      setState(prev => ({ ...prev, isModalVisible: false, editingCompany: null }));
    } catch (error) { message.error(`Lỗi: ${error.message}`); }
  };

  const handleDelete = (MaNCC) => {
    confirm({
      title: 'Xóa nhà cung cấp?',
      okText: 'Xóa',
      okType: 'danger',
      onOk: async () => {
        try { await api.delete(`${API_URL}/${MaNCC}`); fetchCompanies(searchTerm); message.success('Đã xóa thành công'); }
        catch (e) { message.error('Lỗi khi xóa'); }
      }
    });
  };

  const columns = [
    {
      title: 'ĐỐI TÁC',
      key: 'company',
      fixed: 'left',
      width: 300,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar size={44} icon={<HomeOutlined />} className="bg-indigo-50 text-indigo-600 flex-shrink-0 rounded-xl" />
          <div>
            <div className="font-black text-slate-800 leading-tight">{record.TenNCC}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Mã: #{record.MaNCC}</div>
          </div>
        </div>
      )
    },
    {
      title: 'THÔNG TIN LIÊN HỆ',
      key: 'contact',
      width: 250,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><PhoneOutlined className="text-slate-300" /> {record.SDT}</div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 truncate max-w-[200px]" title={record.DiaChi}><HomeOutlined className="text-slate-300" /> {record.DiaChi}</div>
        </div>
      )
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'TinhTrang',
      key: 'status',
      width: 150,
      render: (s) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s === 'Hoạt động' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {s}
        </span>
      )
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Chỉnh sửa">
            <Button className="w-10 h-10 rounded-xl flex items-center justify-center border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-all" icon={<EditOutlined />} onClick={() => setState(prev => ({ ...prev, editingCompany: { ...record, TinhTrang: record.TinhTrangValue }, isModalVisible: true }))} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button danger className="w-10 h-10 rounded-xl flex items-center justify-center" icon={<DeleteOutlined />} onClick={() => handleDelete(record.MaNCC)} />
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="material-icons text-indigo-500">business</span>
            Mạng lưới Nhà cung cấp
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Quản lý các đơn vị đối tác cung ứng hàng hóa</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setState(prev => ({ ...prev, editingCompany: null, newCompany: { MaNCC: suggestMaNCC(), TenNCC: '', SDT: '', DiaChi: '', TinhTrang: '1' }, isModalVisible: true }))}
          className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 border-0 shadow-lg shadow-indigo-100 font-bold flex items-center gap-2"
        >
          Thêm nhà cung cấp
        </Button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
        <div className="relative group max-w-2xl">
          <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <Input 
            placeholder="Tìm theo tên, mã, số điện thoại hoặc địa chỉ..." 
            className="h-12 pl-12 pr-4 w-full rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={companies}
          rowKey="MaNCC"
          loading={loading}
          pagination={{ pageSize: 10, className: "px-8 py-6" }}
          className="modern-table"
          scroll={{ x: 1000 }}
        />
      </div>

      <Modal open={isModalVisible} title={null} onCancel={() => setState(prev => ({ ...prev, isModalVisible: false, editingCompany: null }))} footer={null} width={650} className="modern-modal" centered>
        <div className="mb-8"><h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><span className="material-icons text-indigo-500">{editingCompany ? 'edit' : 'add_business'}</span> {editingCompany ? 'Cập nhật đối tác' : 'Đăng ký nhà cung cấp'}</h2><p className="text-slate-400 text-sm mt-1 font-medium">Thiết lập thông tin định danh và liên hệ chính thức</p></div>
        <Form layout="vertical" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã định danh <span className="text-red-500">*</span></span>} required>
              <Input className="h-11 rounded-xl font-black" value={editingCompany ? editingCompany.MaNCC : newCompany.MaNCC} disabled={!!editingCompany} onChange={(e) => handleInputChange('MaNCC', e.target.value)} />
            </Form.Item>
            <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên nhà cung cấp <span className="text-red-500">*</span></span>} required>
              <Input className="h-11 rounded-xl font-bold" value={editingCompany ? editingCompany.TenNCC : newCompany.TenNCC} onChange={(e) => handleInputChange('TenNCC', e.target.value)} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại <span className="text-red-500">*</span></span>} required>
              <Input prefix={<PhoneOutlined className="text-slate-300" />} className="h-11 rounded-xl font-bold" value={editingCompany ? editingCompany.SDT : newCompany.SDT} onChange={(e) => handleInputChange('SDT', e.target.value)} />
            </Form.Item>
            <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái hợp tác</span>}>
              <Select className="h-11 modern-select" value={editingCompany ? editingCompany.TinhTrang : newCompany.TinhTrang} onChange={(v) => handleInputChange('TinhTrang', v)}>
                <Option value="1">Đang hoạt động</Option>
                <Option value="0">Tạm ngừng</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa chỉ trụ sở <span className="text-red-500">*</span></span>} required>
            <Input.TextArea rows={3} className="rounded-xl font-medium p-4" value={editingCompany ? editingCompany.DiaChi : newCompany.DiaChi} onChange={(e) => handleInputChange('DiaChi', e.target.value)} />
          </Form.Item>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button onClick={() => setState(prev => ({ ...prev, isModalVisible: false, editingCompany: null }))} className="h-12 px-8 rounded-2xl font-bold border-slate-200">Hủy</Button>
            <Button type="primary" onClick={handleSave} className="h-12 px-12 rounded-2xl font-black uppercase tracking-widest text-xs bg-indigo-600 border-0 shadow-lg shadow-indigo-100">{editingCompany ? 'Lưu thay đổi' : 'Xác nhận thêm'}</Button>
          </div>
        </Form>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #94a3b8 !important; font-size: 11px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; padding: 20px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .modern-table .ant-table-tbody > tr > td { padding: 16px 24px !important; border-bottom: 1px solid #f8fafc !important; }
        .modern-modal .ant-modal-content { border-radius: 40px !important; padding: 40px !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important; }
        .modern-select .ant-select-selector { border-radius: 12px !important; height: 44px !important; display: flex !important; align-items: center !important; background: #f8fafc !important; border-color: #f1f5f9 !important; }
      `}} />
    </div>
  );
};

export default CompanyManagement;