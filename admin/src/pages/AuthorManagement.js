import React, { useEffect, useState, useCallback, useContext } from 'react';
import api from '../utils/api';
import { Button, Input, message, Table, Modal, Space, DatePicker, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { PermissionContext } from '../components/PermissionContext';
import moment from 'moment';

const { Search } = Input;
const { confirm } = Modal;

const AuthorManagement = () => {
  const { hasPermission } = useContext(PermissionContext);
  const [authors, setAuthors] = useState([]);
  const [newAuthor, setNewAuthor] = useState({
    TenTG: '',
    NgaySinh: null,
    QuocTich: '',
    TieuSu: '',
    AnhTG: null,
  });
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = '/author';
  const IMAGE_BASE_PATH = '/img/author/';

  const fetchAuthors = useCallback(async () => {
    if (!hasPermission('Tác Giả', 'Đọc')) {
      message.error('Bạn không có quyền xem danh sách tác giả!');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(API_URL, {
        params: { page: 1, limit: 100, search: searchTerm },
      });

      const resData = response.data.data;
      const authorsData = Array.isArray(resData) ? resData : (resData?.data || []);

      if (Array.isArray(authorsData)) {
        const processedAuthors = authorsData.map((author) => {
          const imageUrl = author.AnhTG && author.AnhTG !== 'null'
            ? `${IMAGE_BASE_PATH}${author.AnhTG}`
            : 'https://via.placeholder.com/50';

          return {
            ...author,
            TenTG: author.TenTG?.trim() || '',
            QuocTich: author.QuocTich || '',
            NgaySinh: author.NgaySinh ? moment(author.NgaySinh).format('YYYY-MM-DD') : null,
            TieuSu: author.TieuSu || '',
            AnhTG: imageUrl,
          };
        });
        setAuthors(processedAuthors);
      } else {
        throw new Error('Dữ liệu tác giả không hợp lệ');
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Lỗi khi tải danh sách tác giả');
    } finally {
      setLoading(false);
    }
  }, [hasPermission, searchTerm]);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

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
        setEditingAuthor({ ...editingAuthor, AnhTG: file });
      } else {
        setNewAuthor({ ...newAuthor, AnhTG: file });
      }
    }
  };

  const validateAuthorData = (data) => {
    if (!data.TenTG?.trim()) {
      message.error('Tên tác giả là bắt buộc!');
      return false;
    }
    if (!data.QuocTich?.trim()) {
      message.error('Quốc tịch là bắt buộc!');
      return false;
    }
    if (data.NgaySinh && moment(data.NgaySinh).isAfter(moment())) {
      message.error('Ngày sinh không được ở tương lai!');
      return false;
    }
    return true;
  };

  const handleAddAuthor = async () => {
    if (!hasPermission('Tác Giả', 'Thêm')) {
      message.error('Bạn không có quyền thêm tác giả!');
      return;
    }

    if (!validateAuthorData(newAuthor)) return;

    try {
      const formData = new FormData();
      formData.append('TenTG', newAuthor.TenTG.trim());
      if (newAuthor.NgaySinh) {
        formData.append('NgaySinh', newAuthor.NgaySinh);
      }
      formData.append('QuocTich', newAuthor.QuocTich?.trim() || '');
      formData.append('TieuSu', newAuthor.TieuSu?.trim() || '');
      if (newAuthor.AnhTG instanceof File) {
        formData.append('AnhTG', newAuthor.AnhTG.name);
      }

      const response = await api.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchAuthors();
      setNewAuthor({
        TenTG: '',
        NgaySinh: null,
        QuocTich: '',
        TieuSu: '',
        AnhTG: null,
      });
      setIsModalVisible(false);
      message.success(response.data.message || 'Thêm tác giả thành công!');
    } catch (error) {
      message.error(error.response?.data?.error || 'Lỗi khi thêm tác giả!');
    }
  };

  const handleUpdateAuthor = async () => {
    if (!hasPermission('Tác Giả', 'Sửa')) {
      message.error('Bạn không có quyền sửa tác giả!');
      return;
    }

    if (!validateAuthorData(editingAuthor)) return;

    try {
      const formData = new FormData();
      formData.append('TenTG', editingAuthor.TenTG.trim());
      if (editingAuthor.NgaySinh) {
        formData.append('NgaySinh', editingAuthor.NgaySinh);
      }
      formData.append('QuocTich', editingAuthor.QuocTich?.trim() || '');
      formData.append('TieuSu', editingAuthor.TieuSu?.trim() || '');
      if (editingAuthor.AnhTG instanceof File) {
        formData.append('AnhTG', editingAuthor.AnhTG.name);
      } else if (editingAuthor.AnhTG) {
        formData.append('AnhTG', editingAuthor.AnhTG.replace(IMAGE_BASE_PATH, ''));
      }

      const response = await api.put(`${API_URL}/${editingAuthor.MaTG}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchAuthors();
      setEditingAuthor(null);
      setIsModalVisible(false);
      message.success(response.data.message || 'Sửa tác giả thành công!');
    } catch (error) {
      message.error(error.response?.data?.error || 'Lỗi khi sửa tác giả!');
    }
  };

  const handleDeleteAuthor = (MaTG) => {
    if (!hasPermission('Tác Giả', 'Xóa')) {
      message.error('Bạn không có quyền xóa tác giả!');
      return;
    }
    confirm({
      title: 'Bạn có chắc muốn xóa tác giả này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này sẽ không thể hoàn tác',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Thoát',
      async onOk() {
        try {
          const response = await api.delete(`${API_URL}/${MaTG}`);
          await fetchAuthors();
          message.success(response.data.message || 'Xóa tác giả thành công!');
        } catch (error) {
          message.error(error.response?.data?.error || 'Xóa tác giả thất bại!');
        }
      },
    });
  };

  const filteredAuthors = authors.filter(
    (author) =>
      (author.TenTG || '').toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      (author.QuocTich || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const columns = [
    {
      title: 'Tác giả',
      key: 'author',
      render: (_, record) => (
        <div className="flex items-center gap-4">
          <Avatar 
            src={record.AnhTG} 
            size={44} 
            className="border border-slate-100 shadow-sm rounded-xl"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/50'; }}
          />
          <div>
            <div className="font-bold text-slate-800">{record.TenTG}</div>
            <div className="text-slate-400 text-xs">ID: {record.MaTG}</div>
          </div>
        </div>
      ),
      width: 250,
      fixed: 'left',
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'NgaySinh',
      key: 'NgaySinh',
      width: 140,
    },
    {
      title: 'Quốc tịch',
      dataIndex: 'QuocTich',
      key: 'QuocTich',
      width: 150,
      render: (text) => <span className="font-medium text-slate-600">{text || 'N/A'}</span>
    },
    {
      title: 'Tiểu sử',
      dataIndex: 'TieuSu',
      key: 'TieuSu',
      width: 350,
      render: (text) => <div className="truncate max-w-[300px] text-slate-500 italic">{text || 'Chưa cập nhật'}</div>
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {hasPermission('Tác Giả', 'Sửa') && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingAuthor(record);
                setIsModalVisible(true);
              }}
              className="rounded-lg hover:text-indigo-600 hover:border-indigo-400"
            />
          )}
          {hasPermission('Tác Giả', 'Xóa') && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteAuthor(record.MaTG)}
              className="rounded-lg"
            />
          )}
        </Space>
      ),
      fixed: 'right',
      width: 120,
    },
  ];

  if (!hasPermission('Tác Giả', 'Đọc')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border border-slate-100 shadow-sm p-12">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <span className="material-icons text-4xl">lock</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Quyền truy cập bị từ chối</h2>
        <p className="text-slate-500 text-center max-w-md">
          Bạn không có quyền xem danh sách tác giả. Vui lòng liên hệ quản trị viên để được cấp quyền.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="material-icons text-indigo-500">person_search</span>
            Quản lý Tác giả
          </h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý danh sách và thông tin chi tiết các tác giả</p>
        </div>
        
        {hasPermission('Tác Giả', 'Thêm') && (
          <Button
            type="primary"
            onClick={() => {
              setEditingAuthor(null);
              setNewAuthor({
                TenTG: '',
                NgaySinh: null,
                QuocTich: '',
                TieuSu: '',
                AnhTG: null,
              });
              setIsModalVisible(true);
            }}
            icon={<span className="material-icons text-sm font-bold">add</span>}
            className="h-11 px-6 rounded-xl flex items-center gap-2 font-bold bg-indigo-600 hover:bg-indigo-700 border-none shadow-lg shadow-indigo-100 transition-all"
          >
            Thêm tác giả
          </Button>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 transition-all duration-300">
        <div className="max-w-md mb-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Tìm kiếm tác giả</label>
          <Search
            placeholder="Tìm theo tên hoặc quốc tịch..."
            onSearch={(v) => setSearchTerm(v)}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            size="large"
            className="modern-search"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <Table
            columns={columns}
            dataSource={filteredAuthors}
            rowKey="MaTG"
            loading={loading}
            scroll={{ x: 1000 }}
            pagination={{ 
              pageSize: 10,
              className: 'px-6 py-4',
              size: 'small'
            }}
            className="modern-table"
          />
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3 text-xl font-black text-slate-800">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <span className="material-icons leading-none">{editingAuthor ? 'edit' : 'person_add'}</span>
            </div>
            {editingAuthor ? 'Cập nhật Tác giả' : 'Thêm Tác giả mới'}
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingAuthor(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)} className="h-11 px-6 rounded-xl font-bold border-slate-200">
            Hủy
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={editingAuthor ? handleUpdateAuthor : handleAddAuthor}
            className="h-11 px-8 rounded-xl font-bold bg-indigo-600 shadow-md shadow-indigo-100 border-none"
          >
            {editingAuthor ? 'Cập nhật' : 'Thêm mới'}
          </Button>,
        ]}
        width={700}
        centered
        className="modern-modal"
      >
        <div className="py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Tên tác giả <span className="text-red-500">*</span></label>
              <Input
                placeholder="Nhập tên tác giả..."
                value={editingAuthor ? editingAuthor.TenTG : newAuthor.TenTG}
                onChange={(e) =>
                  editingAuthor
                    ? setEditingAuthor({ ...editingAuthor, TenTG: e.target.value })
                    : setNewAuthor({ ...newAuthor, TenTG: e.target.value })
                }
                className="h-11 rounded-xl border-slate-200 focus:border-indigo-400 shadow-none"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Quốc tịch <span className="text-red-500">*</span></label>
              <Input
                placeholder="Nhập quốc tịch..."
                value={editingAuthor ? editingAuthor.QuocTich : newAuthor.QuocTich}
                onChange={(e) =>
                  editingAuthor
                    ? setEditingAuthor({ ...editingAuthor, QuocTich: e.target.value })
                    : setNewAuthor({ ...newAuthor, QuocTich: e.target.value })
                }
                className="h-11 rounded-xl border-slate-200 focus:border-indigo-400 shadow-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Ngày sinh</label>
              <DatePicker
                placeholder="Chọn ngày sinh"
                value={
                  editingAuthor
                    ? editingAuthor.NgaySinh ? moment(editingAuthor.NgaySinh) : null
                    : newAuthor.NgaySinh ? moment(newAuthor.NgaySinh) : null
                }
                onChange={(date, dateString) =>
                  editingAuthor
                    ? setEditingAuthor({ ...editingAuthor, NgaySinh: dateString })
                    : setNewAuthor({ ...newAuthor, NgaySinh: dateString })
                }
                format="YYYY-MM-DD"
                className="h-11 w-full rounded-xl border-slate-200 focus:border-indigo-400 shadow-none"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Ảnh đại diện</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer flex items-center justify-center h-11 px-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all flex-1">
                  <span className="material-icons text-sm mr-2">upload_file</span>
                  <span className="text-xs font-bold uppercase truncate max-w-[150px]">
                    {(editingAuthor?.AnhTG instanceof File) ? editingAuthor.AnhTG.name : (newAuthor.AnhTG instanceof File) ? newAuthor.AnhTG.name : 'Chọn ảnh'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, !!editingAuthor)}
                    className="hidden"
                  />
                </label>
                {(editingAuthor?.AnhTG || newAuthor.AnhTG) && (
                  <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-100 shadow-sm flex-shrink-0 bg-slate-50">
                    <img 
                      src={(editingAuthor?.AnhTG instanceof File) ? URL.createObjectURL(editingAuthor.AnhTG) : (newAuthor.AnhTG instanceof File) ? URL.createObjectURL(newAuthor.AnhTG) : (editingAuthor?.AnhTG || 'https://via.placeholder.com/50')} 
                      alt="preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/50'; }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Tiểu sử</label>
            <Input.TextArea
              placeholder="Nhập tóm tắt tiểu sử tác giả..."
              value={editingAuthor ? editingAuthor.TieuSu : newAuthor.TieuSu}
              onChange={(e) =>
                editingAuthor
                  ? setEditingAuthor({ ...editingAuthor, TieuSu: e.target.value })
                  : setNewAuthor({ ...newAuthor, TieuSu: e.target.value })
              }
              rows={5}
              className="rounded-2xl border-slate-200 focus:border-indigo-400 p-4 shadow-none"
            />
          </div>
        </div>
      </Modal>

      <style>{`
        .modern-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .modern-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 16px !important;
          font-size: 14px !important;
        }
        .modern-table .ant-table-tbody > tr:hover > td {
          background: #f1f5f9 !important;
        }
        .modern-modal .ant-modal-content {
          border-radius: 2rem !important;
          padding: 1.5rem !important;
        }
        .modern-search .ant-input-wrapper {
          border-radius: 1rem;
          overflow: hidden;
        }
        .modern-search .ant-input {
          height: 48px;
          border-radius: 1rem 0 0 1rem;
        }
        .modern-search .ant-input-search-button {
          height: 48px;
          width: 56px;
          border-radius: 0 1rem 1rem 0;
          background: #4f46e5;
          border-color: #4f46e5;
        }
      `}</style>
    </div>
  );
};

export default AuthorManagement;