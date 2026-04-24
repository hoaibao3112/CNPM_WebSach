import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { PermissionContext } from '../components/PermissionContext';
import { Button, Input, message, Table, Modal, Select, Form, Checkbox, Tooltip } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SearchOutlined,
  CloseCircleFilled
} from '@ant-design/icons';

const { confirm } = Modal;
const { Option } = Select;

const PermissionManagement = () => {
  const [roles, setRoles] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [newRole, setNewRole] = useState({
    TenNQ: '',
    MoTa: '',
    chiTietQuyen: [{ MaCN: '', HanhDong: [] }],
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

  const { refreshPermissions } = useContext(PermissionContext);

  const fetchRoles = async (page = 1, pageSize = 10, search = '') => {
    try {
      setLoading(true);
      const response = await api.get('/roles', { params: { page, pageSize, search } });
      let rolesData = [];
      if (response.data.success && response.data.data) {
        rolesData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        rolesData = response.data;
      }
      setRoles(rolesData);
      setPagination({ current: page, pageSize: pageSize, total: rolesData.length });
    } catch (error) {
      message.error('Lỗi khi tải danh sách nhóm quyền');
    } finally {
      setLoading(false);
    }
  };

  const fetchFunctions = async () => {
    try {
      const response = await api.get('/roles/functions');
      if (Array.isArray(response.data)) setFunctions(response.data);
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
    if (!newRole.TenNQ) {
      message.error('Vui lòng nhập tên nhóm quyền!');
      return;
    }
    const validPermissions = newRole.chiTietQuyen.filter((p) => p.MaCN && p.HanhDong && p.HanhDong.length > 0);
    if (validPermissions.length === 0) {
      message.error('Vui lòng chọn ít nhất một chức năng và hành động!');
      return;
    }
    const expandedPermissions = [];
    validPermissions.forEach((p) => {
      p.HanhDong.forEach((action) => {
        expandedPermissions.push({ MaCN: p.MaCN, HanhDong: action });
      });
    });

    try {
      const response = await api.post('/roles', {
        TenNQ: newRole.TenNQ.trim(),
        MoTa: newRole.MoTa.trim(),
        chitietquyen: expandedPermissions,
      });
      if (response.data.success) {
        fetchRoles();
        refreshPermissions();
        setNewRole({ TenNQ: '', MoTa: '', chiTietQuyen: [{ MaCN: '', HanhDong: [] }] });
        setIsModalVisible(false);
        message.success('Thêm nhóm quyền thành công!');
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Lỗi khi thêm');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole.TenNQ) {
      message.error('Vui lòng nhập tên nhóm quyền!');
      return;
    }
    const validPermissions = editingRole.chiTietQuyen.filter((p) => p.MaCN && p.HanhDong && p.HanhDong.length > 0);
    const expandedPermissions = [];
    validPermissions.forEach((p) => {
      p.HanhDong.forEach((action) => {
        expandedPermissions.push({ MaCN: p.MaCN, HanhDong: action });
      });
    });

    try {
      const response = await api.put(`/roles/${editingRole.MaNQ}`, {
        TenNQ: editingRole.TenNQ.trim(),
        MoTa: editingRole.MoTa.trim(),
        TinhTrang: editingRole.TinhTrang ? 1 : 0,
        chitietquyen: expandedPermissions,
      });
      if (response.data.success) {
        fetchRoles();
        refreshPermissions();
        setIsModalVisible(false);
        message.success('Cập nhật thành công!');
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Lỗi khi cập nhật');
    }
  };

  const handleDeleteRole = (MaNQ) => {
    confirm({
      title: 'Xác nhận xóa?',
      onOk: async () => {
        try {
          const response = await api.delete(`/roles/${MaNQ}`);
          if (response.data.success) {
            fetchRoles();
            refreshPermissions();
            message.success('Đã xóa nhóm quyền');
          }
        } catch (e) { message.error('Xóa thất bại'); }
      }
    });
  };

  const addPermissionRow = () => {
    const setter = editingRole ? setEditingRole : setNewRole;
    setter(prev => ({ ...prev, chiTietQuyen: [...prev.chiTietQuyen, { MaCN: '', HanhDong: [] }] }));
  };

  const removePermissionRow = (index) => {
    const setter = editingRole ? setEditingRole : setNewRole;
    setter(prev => ({ ...prev, chiTietQuyen: prev.chiTietQuyen.filter((_, i) => i !== index) }));
  };

  const columns = [
    {
      title: 'NHÓM QUYỀN',
      key: 'role',
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
            {record.TenNQ.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-700">{record.TenNQ}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">ID: NQ{String(record.MaNQ).padStart(2, '0')}</div>
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
      title: 'THAO TÁC',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <div className="flex justify-center gap-2">
          <Tooltip title="Chỉnh sửa">
            <Button 
              className="w-10 h-10 rounded-xl flex items-center justify-center border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-all"
              icon={<EditOutlined />} 
              onClick={async () => {
                const response = await api.get(`/roles/${record.MaNQ}`);
                if (response.data.success) {
                  const grouped = {};
                  response.data.data.chiTietQuyen.forEach((p) => {
                    if (!grouped[p.MaCN]) grouped[p.MaCN] = { MaCN: p.MaCN, HanhDong: [] };
                    if (!grouped[p.MaCN].HanhDong.includes(p.HanhDong)) grouped[p.MaCN].HanhDong.push(p.HanhDong);
                  });
                  setEditingRole({
                    ...response.data.data,
                    chiTietQuyen: Object.values(grouped).length > 0 ? Object.values(grouped) : [{ MaCN: '', HanhDong: [] }]
                  });
                  setIsModalVisible(true);
                }
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
            <span className="material-icons text-indigo-500">lock_open</span>
            Phân quyền Truy cập
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Thiết lập chi tiết quyền hạn cho các nhóm nhân sự</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
            <Input 
              placeholder="Tìm tên nhóm..." 
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
              setNewRole({ TenNQ: '', MoTa: '', chiTietQuyen: [{ MaCN: '', HanhDong: [] }] });
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
            <span className="material-icons text-indigo-500">{editingRole ? 'verified_user' : 'security'}</span>
            {editingRole ? 'Chỉnh sửa Quyền hạn' : 'Đăng ký Nhóm quyền'}
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Thiết lập chi tiết các hành động được phép cho từng chức năng</p>
        </div>

        <Form layout="vertical" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên nhóm quyền <span className="text-rose-500">*</span></label>
                <Input 
                  className="h-11 rounded-xl font-bold"
                  placeholder="Ví dụ: Quản lý kho"
                  value={editingRole ? editingRole.TenNQ : newRole.TenNQ}
                  onChange={(e) => editingRole ? setEditingRole({...editingRole, TenNQ: e.target.value}) : setNewRole({...newRole, TenNQ: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả nhóm</label>
                <Input.TextArea 
                  rows={3}
                  className="rounded-xl font-medium p-3"
                  placeholder="Nhập mô tả vai trò..."
                  value={editingRole ? editingRole.MoTa : newRole.MoTa}
                  onChange={(e) => editingRole ? setEditingRole({...editingRole, MoTa: e.target.value}) : setNewRole({...newRole, MoTa: e.target.value})}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Phân bổ chức năng</h4>
                <Button 
                  type="link" 
                  icon={<PlusOutlined />} 
                  onClick={addPermissionRow}
                  className="font-bold text-xs text-indigo-600 p-0"
                >
                  Thêm chức năng
                </Button>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                {(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen).map((perm, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative group">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Chức năng hệ thống</label>
                        <Select
                          placeholder="Chọn chức năng"
                          className="w-full h-10"
                          value={perm.MaCN || undefined}
                          onChange={(v) => {
                            const updated = [...(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen)];
                            updated[idx].MaCN = v;
                            editingRole ? setEditingRole({...editingRole, chiTietQuyen: updated}) : setNewRole({...newRole, chiTietQuyen: updated});
                          }}
                        >
                          {functions.map(f => <Option key={f.MaCN} value={f.MaCN}>{f.TenCN}</Option>)}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Hành động được phép</label>
                        <Checkbox.Group
                          className="w-full grid grid-cols-2 gap-2"
                          value={perm.HanhDong || []}
                          onChange={(vals) => {
                            const updated = [...(editingRole ? editingRole.chiTietQuyen : newRole.chiTietQuyen)];
                            updated[idx].HanhDong = vals;
                            editingRole ? setEditingRole({...editingRole, chiTietQuyen: updated}) : setNewRole({...newRole, chiTietQuyen: updated});
                          }}
                        >
                          {['Đọc', 'Thêm', 'Sửa', 'Xóa'].map(a => (
                            <Checkbox key={a} value={a} className="modern-checkbox text-[11px] font-bold text-slate-600">{a}</Checkbox>
                          ))}
                        </Checkbox.Group>
                      </div>
                    </div>
                    <Button 
                      danger type="text" shape="circle" size="small" 
                      className="absolute top-2 right-2 hidden group-hover:flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
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
              Đóng
            </Button>
            <Button 
              type="primary" 
              onClick={editingRole ? handleUpdateRole : handleAddRole}
              className="h-12 px-12 rounded-2xl font-black uppercase tracking-widest text-xs bg-indigo-600 border-0 shadow-lg shadow-indigo-100"
            >
              {editingRole ? 'Lưu cấu hình' : 'Tạo nhóm quyền'}
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
        .modern-checkbox .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #4f46e5 !important;
          border-color: #4f46e5 !important;
        }
      `}} />
    </div>
  );
};

export default PermissionManagement;