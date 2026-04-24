import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { Button, Input, message, Table, Modal, Select, Tabs, Tag, Tooltip } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  LockOutlined,
  UnlockOutlined,
  PlusOutlined,
  UserOutlined,
  SafetyOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { PermissionContext } from '../components/PermissionContext';

const { Option } = Select;
const { confirm } = Modal;
const { TabPane } = Tabs;

const AccountManagement = () => {
  const { hasPermission } = useContext(PermissionContext);
  const [state, setState] = useState({
    accounts: [],
    newAccount: {
      TenTK: '',
      MatKhau: '',
      MaQuyen: undefined,
      NgayTao: new Date().toISOString().split('T')[0],
      TinhTrang: '1',
    },
    editingAccount: null,
    searchTerm: '',
    isModalVisible: false,
    loading: false,
    error: null,
    quyenList: [],
    permissions: [],
    features: [],
    newPermission: { MaCN: undefined, HanhDong: [], TinhTrang: '1' },
  });

  const { accounts, newAccount, editingAccount, searchTerm, isModalVisible, loading, quyenList, permissions, features, newPermission } = state;

  const API_URL = '/accounts';
  const PERMISSION_API = '/permissions';

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [accountsResp, rolesResp, featuresResp] = await Promise.all([
        api.get(API_URL),
        api.get('/roles/list/active'),
        api.get(`${PERMISSION_API}/features`),
      ]);

      const accountsData = accountsResp.data.data || [];
      const rolesData = rolesResp.data.data || [];
      const featuresData = featuresResp.data.data || [];

      setState(prev => ({
        ...prev,
        accounts: (Array.isArray(accountsData) ? accountsData : []).map(account => {
          const tinhTrangValue = Number(account.TinhTrang);
          return {
            ...account,
            TinhTrang: tinhTrangValue === 1 ? 'Hoạt động' : 'Bị khóa',
            TinhTrangValue: tinhTrangValue,
          };
        }),
        quyenList: rolesData,
        features: featuresData,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      message.error(`Lỗi khi tải dữ liệu: ${error.response?.data?.error || error.message}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (hasPermission('Tài khoản', 'Đọc')) {
      fetchData();
    }
  }, [hasPermission]);

  const fetchPermissions = async (maQuyen) => {
    try {
      const resp = await api.get(`${PERMISSION_API}/roles/${maQuyen}`);
      setState(prev => ({ ...prev, permissions: resp.data.data || [] }));
    } catch (error) {
      message.error(`Lỗi khi tải quyền: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleInputChange = (field, value) => {
    const updatedValue = field === 'MaQuyen' ? parseInt(value) : value;
    if (editingAccount) {
      setState(prev => ({
        ...prev,
        editingAccount: {
          ...prev.editingAccount,
          [field]: updatedValue,
          ...(field === 'TinhTrang' && { TinhTrangValue: parseInt(value) }),
        },
      }));
    } else {
      setState(prev => ({
        ...prev,
        newAccount: {
          ...prev.newAccount,
          [field]: updatedValue,
        },
      }));
    }
  };

  const handleAddAccount = async () => {
    if (!hasPermission('Tài khoản', 'Thêm')) return;
    if (!newAccount.TenTK || !newAccount.MatKhau || !newAccount.MaQuyen) {
      message.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      await api.post(API_URL, {
        ...newAccount,
        TinhTrang: parseInt(newAccount.TinhTrang),
      });
      fetchData();
      setState(prev => ({
        ...prev,
        isModalVisible: false,
        newAccount: { TenTK: '', MatKhau: '', MaQuyen: undefined, NgayTao: new Date().toISOString().split('T')[0], TinhTrang: '1' }
      }));
      message.success('Thêm tài khoản thành công!');
    } catch (error) {
      message.error(`Lỗi: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdateAccount = async () => {
    if (!hasPermission('Tài khoản', 'Sửa')) return;
    if (!editingAccount.TenTK || !editingAccount.MaQuyen) {
      message.error('Vui lòng nhập tên tài khoản và chọn nhóm quyền!');
      return;
    }
    try {
      await api.put(`${API_URL}/${editingAccount.MaTK}`, {
        TenTK: editingAccount.TenTK,
        MatKhau: editingAccount.MatKhau,
        MaQuyen: editingAccount.MaQuyen,
        TinhTrang: parseInt(editingAccount.TinhTrang),
      });
      fetchData();
      setState(prev => ({ ...prev, isModalVisible: false, editingAccount: null }));
      message.success('Cập nhật thành công!');
    } catch (error) {
      message.error(`Lỗi: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteAccount = (MaTK) => {
    if (!hasPermission('Tài khoản', 'Xóa')) return;
    confirm({
      title: 'Xóa tài khoản này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`${API_URL}/${MaTK}`);
          fetchData();
          message.success('Đã xóa tài khoản');
        } catch (error) {
          message.error('Lỗi khi xóa');
        }
      }
    });
  };

  const handleToggleStatus = (account) => {
    const newStatus = account.TinhTrangValue === 1 ? 0 : 1;
    confirm({
      title: `${newStatus === 1 ? 'Kích hoạt' : 'Khóa'} tài khoản?`,
      onOk: async () => {
        try {
          await api.put(`${API_URL}/${account.MaTK}`, { TinhTrang: newStatus });
          fetchData();
          message.success('Đã cập nhật trạng thái');
        } catch (error) {
          message.error('Lỗi khi cập nhật');
        }
      }
    });
  };

  const handleAddPermission = async () => {
    if (!newPermission.MaCN || !newPermission.HanhDong.length) {
      message.error('Chọn chức năng và hành động!');
      return;
    }
    try {
      const requests = newPermission.HanhDong.map(hd =>
        api.post(PERMISSION_API, {
          MaQuyen: editingAccount.MaQuyen,
          MaCN: newPermission.MaCN,
          HanhDong: hd,
          TinhTrang: 1
        })
      );
      await Promise.all(requests);
      fetchPermissions(editingAccount.MaQuyen);
      setState(prev => ({ ...prev, newPermission: { MaCN: undefined, HanhDong: [], TinhTrang: '1' } }));
      message.success('Thêm quyền thành công!');
    } catch (error) {
      message.error('Lỗi thêm quyền');
    }
  };



  const filteredAccounts = accounts.filter(a => searchTerm === '' || a.TinhTrang === searchTerm);

  const columns = [
    {
      title: 'TÀI KHOẢN',
      key: 'account',
      fixed: 'left',
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
            {record.TenTK.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-700">{record.TenTK}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">ID: #{record.MaTK}</div>
          </div>
        </div>
      )
    },
    {
      title: 'NHÓM QUYỀN',
      key: 'role',
      width: 180,
      render: (_, record) => (
        <Tag color="blue" className="rounded-lg font-bold border-0 px-3 py-1 uppercase text-[10px] tracking-widest">
          {quyenList.find(q => q.MaNQ === record.MaQuyen)?.TenNQ || 'N/A'}
        </Tag>
      )
    },
    {
      title: 'NGÀY TẠO',
      dataIndex: 'NgayTao',
      key: 'NgayTao',
      width: 150,
      render: (date) => <span className="text-slate-500 font-medium">{date}</span>
    },
    {
      title: 'TRẠNG THÁI',
      key: 'status',
      width: 150,
      render: (_, record) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          record.TinhTrangValue === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
        }`}>
          {record.TinhTrang}
        </span>
      )
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Chỉnh sửa">
            <Button 
              className="w-10 h-10 rounded-xl flex items-center justify-center border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-all"
              icon={<EditOutlined />} 
              onClick={() => {
                setState(prev => ({ ...prev, editingAccount: { ...record, TinhTrang: record.TinhTrangValue.toString() }, isModalVisible: true }));
                fetchPermissions(record.MaQuyen);
              }}
            />
          </Tooltip>
          <Tooltip title={record.TinhTrangValue === 1 ? 'Khóa' : 'Mở khóa'}>
            <Button 
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                record.TinhTrangValue === 1 ? 'hover:text-rose-600 hover:border-rose-600' : 'hover:text-emerald-600 hover:border-emerald-600'
              }`}
              icon={record.TinhTrangValue === 1 ? <LockOutlined /> : <UnlockOutlined />} 
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button 
              danger
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteAccount(record.MaTK)}
            />
          </Tooltip>
        </div>
      )
    }
  ];

  if (!hasPermission('Tài khoản', 'Đọc')) return <div className="p-8 text-center font-bold text-slate-400 uppercase tracking-widest">Truy cập bị từ chối</div>;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="material-icons text-indigo-500">manage_accounts</span>
            Quản lý Tài khoản
          </h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý định danh và phân quyền hệ thống</p>
        </div>
        {hasPermission('Tài khoản', 'Thêm') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setState(prev => ({ ...prev, editingAccount: null, isModalVisible: true }))}
            className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 border-0 shadow-lg shadow-indigo-100 font-bold flex items-center gap-2"
          >
            Thêm tài khoản
          </Button>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lọc trạng thái</label>
          <Select
            className="w-full h-11 modern-select"
            value={searchTerm}
            onChange={(v) => setState(prev => ({ ...prev, searchTerm: v }))}
          >
            <Option value="">Tất cả trạng thái</Option>
            <Option value="Hoạt động text-emerald-600">Hoạt động</Option>
            <Option value="Bị khóa text-rose-600">Bị khóa</Option>
          </Select>
        </div>
        <div className="flex-1 flex items-end">
          <div className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <span className="material-icons text-slate-400">info</span>
            <span className="text-xs text-slate-500 font-medium">Tìm thấy {filteredAccounts.length} tài khoản trong hệ thống</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredAccounts}
          rowKey="MaTK"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, className: "px-6 py-4" }}
          className="modern-table"
        />
      </div>

      <Modal
        title={null}
        open={isModalVisible}
        onCancel={() => setState(prev => ({ ...prev, isModalVisible: false, editingAccount: null }))}
        footer={null}
        width={800}
        centered
        className="modern-modal"
      >
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span className="material-icons text-indigo-500">{editingAccount ? 'edit' : 'person_add'}</span>
            {editingAccount ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}
          </h2>
        </div>

        <Tabs defaultActiveKey="1" className="modern-tabs">
          <TabPane tab={<span className="flex items-center gap-2 px-2"><UserOutlined /> Thông tin</span>} key="1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên tài khoản <span className="text-red-500">*</span></label>
                <Input 
                  prefix={<UserOutlined className="text-slate-400" />}
                  className="h-11 rounded-xl"
                  value={editingAccount ? editingAccount.TenTK : newAccount.TenTK}
                  onChange={(e) => handleInputChange('TenTK', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu {!editingAccount && <span className="text-red-500">*</span>}</label>
                <Input.Password 
                  prefix={<KeyOutlined className="text-slate-400" />}
                  className="h-11 rounded-xl"
                  value={editingAccount ? editingAccount.MatKhau : newAccount.MatKhau}
                  onChange={(e) => handleInputChange('MatKhau', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhóm quyền <span className="text-red-500">*</span></label>
                <Select 
                  className="w-full h-11"
                  value={editingAccount ? editingAccount.MaQuyen : newAccount.MaQuyen}
                  onChange={(v) => handleInputChange('MaQuyen', v)}
                >
                  {quyenList.map(q => <Option key={q.MaNQ} value={q.MaNQ}>{q.TenNQ}</Option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái</label>
                <Select 
                  className="w-full h-11"
                  value={editingAccount ? editingAccount.TinhTrang : newAccount.TinhTrang}
                  onChange={(v) => handleInputChange('TinhTrang', v)}
                >
                  <Option value="1">Hoạt động</Option>
                  <Option value="0">Khóa</Option>
                </Select>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
              <Button 
                onClick={() => setState(prev => ({ ...prev, isModalVisible: false }))}
                className="h-11 px-8 rounded-xl font-bold border-slate-200"
              >
                Hủy
              </Button>
              <Button 
                type="primary" 
                onClick={editingAccount ? handleUpdateAccount : handleAddAccount}
                className="h-11 px-8 rounded-xl font-bold bg-indigo-600 border-0"
              >
                {editingAccount ? 'Cập nhật' : 'Tạo ngay'}
              </Button>
            </div>
          </TabPane>

          {editingAccount && (
            <TabPane tab={<span className="flex items-center gap-2 px-2"><SafetyOutlined /> Phân quyền</span>} key="2">
              <div className="pt-4 space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <PlusOutlined /> Thêm quyền trực tiếp
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    <Select
                      placeholder="Chọn chức năng"
                      className="h-11 flex-1 min-w-[200px]"
                      value={newPermission.MaCN}
                      onChange={(v) => setState(prev => ({ ...prev, newPermission: { ...prev.newPermission, MaCN: v } }))}
                    >
                      {features.map(f => <Option key={f.MaCN} value={f.MaCN}>{f.TenCN}</Option>)}
                    </Select>
                    <Select
                      mode="multiple"
                      placeholder="Hành động"
                      className="h-11 flex-1 min-w-[200px]"
                      value={newPermission.HanhDong}
                      onChange={(v) => setState(prev => ({ ...prev, newPermission: { ...prev.newPermission, HanhDong: v } }))}
                    >
                      {['Đọc', 'Thêm', 'Sửa', 'Xóa'].map(v => <Option key={v} value={v}>{v}</Option>)}
                    </Select>
                    <Button 
                      type="primary" 
                      onClick={handleAddPermission}
                      className="h-11 px-6 rounded-xl font-bold bg-slate-800 border-0 hover:bg-slate-900"
                    >
                      Thêm quyền
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <Table
                    columns={[
                      { title: 'CHỨC NĂNG', dataIndex: 'TenCN', key: 'TenCN', render: (t) => <span className="font-bold text-slate-700">{t}</span> },
                      { title: 'HÀNH ĐỘNG', dataIndex: 'HanhDong', key: 'HanhDong', render: (h) => <Tag className="rounded-md font-bold">{h}</Tag> },
                      {
                        title: 'THAO TÁC',
                        key: 'action',
                        width: 100,
                        render: (_, record) => (
                          <Button 
                            danger type="text" size="small" 
                            icon={<DeleteOutlined />} 
                            onClick={async () => {
                              try {
                                await api.delete(`${PERMISSION_API}/${record.MaCTQ}`);
                                fetchPermissions(editingAccount.MaQuyen);
                                message.success('Đã gỡ quyền');
                              } catch(e) { message.error('Lỗi'); }
                            }}
                          />
                        )
                      }
                    ]}
                    dataSource={permissions}
                    rowKey="MaCTQ"
                    pagination={false}
                    size="small"
                  />
                </div>
              </div>
            </TabPane>
          )}
        </Tabs>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #94a3b8 !important;
          font-size: 11px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          padding: 16px 24px !important;
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
          border-radius: 32px !important;
          padding: 32px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important;
        }
        .modern-tabs .ant-tabs-nav::before {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .modern-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #4f46e5 !important;
          font-weight: 900 !important;
        }
        .modern-tabs .ant-tabs-ink-bar {
          background: #4f46e5 !important;
          height: 3px !important;
          border-radius: 3px 3px 0 0 !important;
        }
      `}} />
    </div>
  );
};

export default AccountManagement;