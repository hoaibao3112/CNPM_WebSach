import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Button, Input, message, Table, Modal, Space, Select, Form, Tag, Tooltip } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  ExclamationCircleFilled, 
  PlusOutlined, 
  SearchOutlined,
  SafetyOutlined,
  SettingOutlined,
  CloseCircleFilled
} from '@ant-design/icons';

const { confirm } = Modal;
const { Option } = Select;

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [newRole, setNewRole] = useState({
    TenNQ: '',
    MoTa: '',
    TinhTrang: 1,
    chiTietQuyen: [{ MaCN: '', HanhDong: '' }],
  });
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const API_URL = '/roles';

  const fetchRoles = async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoading(true);
      const response = await api.get(API_URL, { params: { page, pageSize, search } });
      const resData = response.data;
      if (resData.success) {
        setRoles(resData.data.items);
        setPagination({
          current: resData.data.pagination.page,
          pageSize: resData.data.pagination.pageSize,
          total: resData.data.pagination.total,
        });
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách nhóm quyền');
    } finally {
      setLoading(false);
    }
  };

  const fetchFunctions = async () => {
    try {
      const response = await api.get(`${API_URL}/functions`);
      const resData = response.data.data || response.data;
      if (Array.isArray(resData)) setFunctions(resData);
    } catch (error) {
      message.error('Lỗi khi tải danh sách chức năng');
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchFunctions();
  }, []);

  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchRoles(1, pagination.pageSize, value);
  };

  const handleAddRole = async () => {
    if (!newRole.TenNQ || newRole.chiTietQuyen.some(p => !p.MaCN || !p.HanhDong)) {
      message.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    try {
      await api.post(API_URL, {
        TenNQ: newRole.TenNQ.trim(),
        MoTa: newRole.MoTa.trim(),
        chitietquyen: newRole.chiTietQuyen.filter(p => p.MaCN && p.HanhDong),
      });
      fetchRoles();
      setIsModalVisible(false);
      message.success('Thêm nhóm quyền thành công!');
    } catch (error) {
      message.error(error.response?.data?.error || 'Lỗi khi thêm');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole.TenNQ || editingRole.chiTietQuyen.some(p => !p.MaCN || !p.HanhDong)) {
      message.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    try {
      await api.put(`${API_URL}/${editingRole.MaNQ}`, {
        TenNQ: editingRole.TenNQ.trim(),
        MoTa: editingRole.MoTa.trim(),
        TinhTrang: editingRole.TinhTrang,
        chitietquyen: editingRole.chiTietQuyen.filter(p => p.MaCN && p.HanhDong),
      });
      fetchRoles();
      setIsModalVisible(false);
      message.success('Cập nhật thành công!');
    } catch (error) {
      message.error(error.response?.data?.error || 'Lỗi khi cập nhật');
    }
  };

  const handleDeleteRole = (MaNQ) => {
    confirm({
      title: 'Xóa nhóm quyền này?',
      icon: <ExclamationCircleFilled />,
      content: 'Tài khoản thuộc nhóm này có thể bị ảnh hưởng.',
      okText: 'Xóa',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`${API_URL}/${MaNQ}`);
          fetchRoles();
          message.success('Đã xóa nhóm quyền');
        } catch (e) { message.error('Xóa thất bại'); }
      }
    });
  };

  const addPermissionRow = () => {
    const setter = editingRole ? setEditingRole : setNewRole;
    setter(prev => ({ ...prev, chiTietQuyen: [...prev.chiTietQuyen, { MaCN: '', HanhDong: '' }] }));
  };

  const removePermissionRow = (index) => {
    const setter = editingRole ? setEditingRole : setNewRole;
    setter(prev => ({ ...prev, chiTietQuyen: prev.chiTietQuyen.filter((_, i) => i !== index) }));
  };

  const columns = [
    {
      title: 'NHÓM QUYỀN',
      key: 'role',
      fixed: 'left',
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
            <SafetyOutlined />
          </div>
          <div>
            <div className="font-bold text-slate-700">{record.TenNQ}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Mã: #{record.MaNQ}</div>
          </div>
        </div>
      )
    },
    {
      title: 'MÔ TẢ',
      dataIndex: 'MoTa',
      key: 'MoTa',
      width: 300,
      render: (text) => <span className="text-slate-500 text-sm italic">{text || 'Không có mô tả'}</span>
    },
    {
      title: 'NHÂN SỰ',
      dataIndex: 'SoNguoiDung',
      key: 'SoNguoiDung',
      width: 120,
      align: 'center',
      render: (val) => (
        <div className="flex flex-col items-center">
          <span className="text-sm font-black text-slate-700">{val}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase">Thành viên</span>
        </div>
      )
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'TinhTrang',
      key: 'TinhTrang',
      width: 150,
      render: (status) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          status === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
        }`}>
          {status === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
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
            <Button 
              className="w-10 h-10 rounded-xl flex items-center justify-center border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-all"
              icon={<EditOutlined />} 
              onClick={async () => {
                const response = await api.get(`${API_URL}/${record.MaNQ}`);
                setEditingRole({
                  ...response.data.data,
                  chiTietQuyen: response.data.data.chiTietQuyen.length > 0 ? response.data.data.chiTietQuyen : [{ MaCN: '', HanhDong: '' }]
                });
                setIsModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button 
              danger
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteRole(record.MaNQ)}
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
            <span className="material-icons text-indigo-500">security</span>
            Phân quyền Hệ thống
          </h1>
          <p className="text-slate-400 text-sm mt-1">Thiết lập nhóm quyền và quyền hạn chức năng</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
            <Input 
              placeholder="Tìm tên nhóm quyền..." 
              className="h-12 pl-12 pr-4 w-full sm:w-64 rounded-2xl border-0 shadow-sm bg-white font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRole(null);
              setNewRole({ TenNQ: '', MoTa: '', TinhTrang: 1, chiTietQuyen: [{ MaCN: '', HanhDong: '' }] });
              setIsModalVisible(true);
            }}
            className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 border-0 shadow-lg shadow-indigo-100 font-bold flex items-center gap-2"
          >
            Thêm nhóm quyền
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="MaNQ"
          loading={loading}
          pagination={pagination}
          onChange={(p) => fetchRoles(p.current, p.pageSize, searchTerm)}
          className="modern-table"
          scroll={{ x: 1000 }}
        />
      </div>

      <Modal
        title={null}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={850}
        centered
        className="modern-modal"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="material-icons text-indigo-500">{editingRole ? 'admin_panel_settings' : 'verified_user'}</span>
            {editingRole ? 'Cấu hình nhóm quyền' : 'Tạo nhóm quyền mới'}
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Xác định các quyền hạn cụ thể cho nhóm này</p>
        </div>

        <Form layout="vertical" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên nhóm quyền <span className="text-rose-500">*</span></label>
                <Input 
                  className="h-11 rounded-xl font-bold"
                  value={editingRole ? editingRole.TenNQ : newRole.TenNQ}
                  onChange={(e) => editingRole ? setEditingRole({...editingRole, TenNQ: e.target.value}) : setNewRole({...newRole, TenNQ: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả chi tiết</label>
                <Input.TextArea 
                  rows={3}
                  className="rounded-xl font-medium p-3"
                  value={editingRole ? editingRole.MoTa : newRole.MoTa}
                  onChange={(e) => editingRole ? setEditingRole({...editingRole, MoTa: e.target.value}) : setNewRole({...newRole, MoTa: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái</label>
                <Select 
                  className="w-full h-11"
                  value={editingRole ? editingRole.TinhTrang : newRole.TinhTrang}
                  onChange={(v) => editingRole ? setEditingRole({...editingRole, TinhTrang: v}) : setNewRole({...newRole, TinhTrang: v})}
                >
                  <Option value={1}>Hoạt động</Option>
                  <Option value={0}>Ngừng hoạt động</Option>
                </Select>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Danh sách quyền chi tiết</h4>
                <Button 
                  type="link" 
                  icon={<PlusOutlined />} 
                  onClick={addPermissionRow}
                  className="font-bold text-xs text-indigo-600 p-0"
                >
                  Thêm dòng
                </Button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen).map((perm, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-end gap-3 relative group">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Chức năng</label>
                      <Select
                        className="w-full h-9"
                        value={perm.MaCN}
                        onChange={(v) => {
                          const updated = [...(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen)];
                          updated[idx].MaCN = v;
                          editingRole ? setEditingRole({...editingRole, chiTietQuyen: updated}) : setNewRole({...newRole, chiTietQuyen: updated});
                        }}
                      >
                        {functions.map(f => <Option key={f.MaCN} value={f.MaCN}>{f.TenCN}</Option>)}
                      </Select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Hành động</label>
                      <Select
                        className="w-full h-9"
                        value={perm.HanhDong}
                        onChange={(v) => {
                          const updated = [...(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen)];
                          updated[idx].HanhDong = v;
                          editingRole ? setEditingRole({...editingRole, chiTietQuyen: updated}) : setNewRole({...newRole, chiTietQuyen: updated});
                        }}
                      >
                        {['Đọc', 'Thêm', 'Xóa', 'Sửa'].map(a => <Option key={a} value={a}>{a}</Option>)}
                      </Select>
                    </div>
                    <Button 
                      danger type="text" shape="circle" size="small" 
                      className="absolute -top-2 -right-2 bg-white shadow-sm border border-slate-100 hidden group-hover:flex items-center justify-center"
                      icon={<CloseCircleFilled />} 
                      onClick={() => removePermissionRow(idx)}
                      disabled={(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen).length === 1}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-8">
            <Button 
              onClick={() => setIsModalVisible(false)}
              className="h-12 px-8 rounded-2xl font-bold border-slate-200"
            >
              Hủy bỏ
            </Button>
            <Button 
              type="primary" 
              onClick={editingRole ? handleUpdateRole : handleAddRole}
              className="h-12 px-12 rounded-2xl font-black uppercase tracking-widest text-xs bg-indigo-600 border-0 shadow-lg shadow-indigo-100"
            >
              {editingRole ? 'Lưu thay đổi' : 'Tạo nhóm mới'}
            </Button>
          </div>
        </Form>
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
          padding: 40px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default RoleManagement;