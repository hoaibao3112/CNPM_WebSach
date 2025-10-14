import React, { useEffect, useState, useCallback, useContext } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space, DatePicker } from 'antd';
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

  const API_URL = 'http://localhost:5000/api/author';
  const IMAGE_BASE_PATH = '/img/author/';

  const fetchAuthors = useCallback(async () => {
    console.log('[DEBUG] Fetching authors...');
    console.log('[DEBUG] Has Read Permission:', hasPermission('Tác Giả', 'Đọc'));
    if (!hasPermission('Tác Giả', 'Đọc')) {
      message.error('Bạn không có quyền xem danh sách tác giả!');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      console.log('[DEBUG] Auth Token:', token);
      if (!token) throw new Error('Không tìm thấy token xác thực');

      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: 100, search: searchTerm },
      });
      console.log('[DEBUG] API Response:', response.data);

      if (Array.isArray(response.data.data)) {
        const processedAuthors = response.data.data.map((author) => {
          const imageUrl = author.AnhTG && author.AnhTG !== 'null'
            ? `${IMAGE_BASE_PATH}${author.AnhTG}`
            : 'https://via.placeholder.com/50';
          console.log(`[DEBUG] URL ảnh cho tác giả ${author.MaTG}: ${imageUrl}`);

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
        console.log('[DEBUG] Set Authors:', processedAuthors);
      } else {
        throw new Error('Dữ liệu tác giả không hợp lệ');
      }
    } catch (error) {
      console.error('[ERROR] Lỗi khi lấy danh sách tác giả:', error.response || error);
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

  const handleAddAuthor = async () => {
    if (!hasPermission('Tác Giả', 'Thêm')) {
      message.error('Bạn không có quyền thêm tác giả!');
      return;
    }

    const tenTG = newAuthor.TenTG.trim();
    if (!tenTG) {
      message.error('Tên tác giả là bắt buộc!');
      return;
    }
    if (newAuthor.QuocTich && newAuthor.QuocTich.length > 100) {
      message.error('Quốc tịch không được vượt quá 100 ký tự!');
      return;
    }
    if (newAuthor.NgaySinh) {
      const date = new Date(newAuthor.NgaySinh);
      if (isNaN(date.getTime()) || date > new Date()) {
        message.error('Ngày sinh không hợp lệ!');
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('TenTG', tenTG);
      if (newAuthor.NgaySinh) {
        formData.append('NgaySinh', newAuthor.NgaySinh);
      }
      formData.append('QuocTich', newAuthor.QuocTich?.trim() || '');
      formData.append('TieuSu', newAuthor.TieuSu?.trim() || '');
      if (newAuthor.AnhTG instanceof File) {
        formData.append('AnhTG', newAuthor.AnhTG.name);
      }

      const token = localStorage.getItem('authToken');
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
      console.error('[ERROR] Lỗi khi thêm tác giả:', error.response || error);
      message.error(error.response?.data?.error || 'Lỗi khi thêm tác giả!');
    }
  };

  const handleUpdateAuthor = async () => {
    if (!hasPermission('Tác Giả', 'Sửa')) {
      message.error('Bạn không có quyền sửa tác giả!');
      return;
    }

    const tenTG = editingAuthor.TenTG.trim();
    if (!tenTG) {
      message.error('Tên tác giả là bắt buộc!');
      return;
    }
    if (editingAuthor.QuocTich && editingAuthor.QuocTich.length > 100) {
      message.error('Quốc tịch không được vượt quá 100 ký tự!');
      return;
    }
    if (editingAuthor.NgaySinh) {
      const date = new Date(editingAuthor.NgaySinh);
      if (isNaN(date.getTime()) || date > new Date()) {
        message.error('Ngày sinh không hợp lệ!');
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('TenTG', tenTG);
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

      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/${editingAuthor.MaTG}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchAuthors();
      setEditingAuthor(null);
      setIsModalVisible(false);
      message.success(response.data.message || 'Sửa tác giả thành công!');
    } catch (error) {
      console.error('[ERROR] Lỗi khi sửa tác giả:', error.response || error);
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
          const token = localStorage.getItem('authToken');
          const response = await axios.delete(`${API_URL}/${MaTG}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchAuthors();
          message.success(response.data.message || 'Xóa tác giả thành công!');
        } catch (error) {
          console.error('[ERROR] Lỗi khi xóa tác giả:', error.response || error);
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
  console.log('[DEBUG] Filtered Authors:', filteredAuthors);

  const columns = [
    {
      title: 'Mã TG',
      dataIndex: 'MaTG',
      key: 'MaTG',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Tên tác giả',
      dataIndex: 'TenTG',
      key: 'TenTG',
      width: 200,
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'NgaySinh',
      key: 'NgaySinh',
      width: 120,
    },
    {
      title: 'Quốc tịch',
      dataIndex: 'QuocTich',
      key: 'QuocTich',
      width: 150,
    },
    {
      title: 'Tiểu sử',
      dataIndex: 'TieuSu',
      key: 'TieuSu',
      width: 300,
    },
    {
      title: 'Ảnh',
      dataIndex: 'AnhTG',
      key: 'AnhTG',
      render: (text) => (
        <img
          src={text}
          alt="author"
          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2 }}
          onError={(e) => {
            console.log(`[ERROR] Lỗi tải ảnh: ${text}`);
            e.target.src = 'https://via.placeholder.com/50';
          }}
        />
      ),
      width: 80,
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
            />
          )}
          {hasPermission('Tác Giả', 'Xóa') && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteAuthor(record.MaTG)}
            />
          )}
        </Space>
      ),
      fixed: 'right',
      width: 100,
    },
  ];

  if (!hasPermission('Tác Giả', 'Đọc')) {
    return <div className="author-management-container">Bạn không có quyền truy cập trang này!</div>;
  }

  return (
    <div className="author-management-container">
      <div className="header-section">
        <h1 className="page-title">Quản lý Tác giả</h1>
        <div className="search-box">
          <Search
            placeholder="Tìm tác giả..."
            allowClear
            enterButton
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {hasPermission('Tác Giả', 'Thêm') && (
          <Button
            type="primary"
            size="small"
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
          >
            Thêm tác giả
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={filteredAuthors}
        rowKey="MaTG"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          size: 'small',
        }}
        size="small"
        className="compact-author-table"
        style={{ fontSize: '13px' }}
        locale={{
          emptyText: 'Không tìm thấy tác giả',
        }}
      />

      <Modal
        title={editingAuthor ? 'Chỉnh sửa tác giả' : 'Thêm tác giả mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingAuthor(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              setEditingAuthor(null);
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={editingAuthor ? handleUpdateAuthor : handleAddAuthor}
          >
            {editingAuthor ? 'Lưu' : 'Thêm'}
          </Button>,
        ]}
        width={600}
  styles={{ body: { padding: '16px' } }}
      >
        <div className="info-section">
          <div className="info-grid">
            {editingAuthor && (
              <div className="info-item">
                <p className="info-label">Mã tác giả:</p>
                <Input size="small" value={editingAuthor.MaTG} disabled />
              </div>
            )}
            <div className="info-item">
              <p className="info-label">Tên tác giả <span style={{ color: 'red' }}>*</span></p>
              <Input
                size="small"
                value={editingAuthor ? editingAuthor.TenTG : newAuthor.TenTG}
                onChange={(e) =>
                  editingAuthor
                    ? setEditingAuthor({ ...editingAuthor, TenTG: e.target.value })
                    : setNewAuthor({ ...newAuthor, TenTG: e.target.value })
                }
                required
              />
            </div>
            <div className="info-item">
              <p className="info-label">Ngày sinh:</p>
              <DatePicker
                size="small"
                value={
                  editingAuthor
                    ? editingAuthor.NgaySinh
                      ? moment(editingAuthor.NgaySinh)
                      : null
                    : newAuthor.NgaySinh
                    ? moment(newAuthor.NgaySinh)
                    : null
                }
                onChange={(date, dateString) =>
                  editingAuthor
                    ? setEditingAuthor({ ...editingAuthor, NgaySinh: dateString })
                    : setNewAuthor({ ...newAuthor, NgaySinh: dateString })
                }
                format="YYYY-MM-DD"
                style={{ width: '100%' }}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Quốc tịch:</p>
              <Input
                size="small"
                value={editingAuthor ? editingAuthor.QuocTich : newAuthor.QuocTich}
                onChange={(e) =>
                  editingAuthor
                    ? setEditingAuthor({ ...editingAuthor, QuocTich: e.target.value })
                    : setNewAuthor({ ...newAuthor, QuocTich: e.target.value })
                }
              />
            </div>
            <div className="info-item">
              <p className="info-label">Tiểu sử:</p>
              <Input.TextArea
                size="small"
                value={editingAuthor ? editingAuthor.TieuSu : newAuthor.TieuSu}
                onChange={(e) =>
                  editingAuthor
                    ? setEditingAuthor({ ...editingAuthor, TieuSu: e.target.value })
                    : setNewAuthor({ ...newAuthor, TieuSu: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Hình ảnh:</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, !!editingAuthor)}
              />
              {(editingAuthor && editingAuthor.AnhTG && !(editingAuthor.AnhTG instanceof File)) && (
                <img
                  src={editingAuthor.AnhTG}
                  alt="preview"
                  style={{ width: 50, height: 50, marginTop: 8 }}
                />
              )}
            </div>
          </div>
        </div>
      </Modal>

  <style>{`
        .author-management-container {
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
  .compact-author-table .ant-table-thead > tr > th {
          padding: 8px 12px;
        }
  .compact-author-table .ant-table-tbody > tr > td {
          padding: 8px 12px;
        }
        input[type="file"] {
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default AuthorManagement;