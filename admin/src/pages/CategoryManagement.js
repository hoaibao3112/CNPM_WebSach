import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space, Select } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled, LockOutlined, UnlockOutlined } from '@ant-design/icons';
const { confirm } = Modal;
const { Option } = Select;

const CategoryManagement = () => {
  const [state, setState] = useState({
    categories: [],
    newCategory: { TenTL: '', TinhTrang: 1 },
    editingCategory: null,
    searchTerm: '',
    statusFilter: '',
    isModalVisible: false,
    loading: false,
    error: null,
  });

  const { categories, newCategory, editingCategory, searchTerm, statusFilter, isModalVisible, loading } = state;
  const API_URL = 'http://localhost:5000/api/category';

  const fetchCategories = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await axios.get(API_URL);
      
      if (Array.isArray(response.data)) {
        const processedCategories = response.data.map(item => ({
          ...item,
          TinhTrang: item.TinhTrang === 1 ? 'Hoạt động' : 'Không hoạt động',
          TinhTrangValue: item.TinhTrang,
        }));
        setState(prev => ({ ...prev, categories: processedCategories }));
      } else {
        throw new Error('Dữ liệu thể loại không hợp lệ');
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      message.error(`Lỗi khi tải dữ liệu: ${error.message}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleInputChange = (field, value) => {
    if (editingCategory) {
      setState(prev => ({
        ...prev,
        editingCategory: {
          ...prev.editingCategory,
          [field]: field === 'TinhTrang' ? parseInt(value) : value,
        },
      }));
    } else {
      setState(prev => ({
        ...prev,
        newCategory: {
          ...prev.newCategory,
          [field]: field === 'TinhTrang' ? parseInt(value) : value,
        },
      }));
    }
  };

  const validateCategoryData = (categoryData) => {
    if (!categoryData.TenTL) {
      message.error('Vui lòng nhập tên thể loại!');
      return false;
    }
    return true;
  };

  const handleAddCategory = async () => {
    if (!validateCategoryData(newCategory)) return;

    try {
      await axios.post(API_URL, newCategory);
      await fetchCategories();
      setState(prev => ({
        ...prev,
        newCategory: { TenTL: '', TinhTrang: 1 },
        isModalVisible: false,
      }));
      message.success('Thêm thể loại thành công!');
    } catch (error) {
      message.error(`Lỗi khi thêm thể loại: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdateCategory = async () => {
    if (!validateCategoryData(editingCategory)) return;

    try {
      await axios.put(`${API_URL}/${editingCategory.MaTL}`, {
        TenTL: editingCategory.TenTL,
        TinhTrang: editingCategory.TinhTrang,
      });
      await fetchCategories();
      setState(prev => ({
        ...prev,
        editingCategory: null,
        isModalVisible: false,
      }));
      message.success('Cập nhật thể loại thành công!');
    } catch (error) {
      message.error(`Lỗi khi cập nhật thể loại: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteCategory = (MaTL) => {
    confirm({
      title: 'Bạn có chắc muốn xóa thể loại này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này sẽ không thể hoàn tác',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Thoát',
      async onOk() {
        try {
          await axios.delete(`${API_URL}/${MaTL}`);
          await fetchCategories();
          message.success('Xóa thể loại thành công!');
        } catch (error) {
          message.error(`Lỗi khi xóa thể loại: ${error.message}`);
        }
      },
    });
  };

  const handleToggleStatus = (category) => {
    confirm({
      title: `Bạn có muốn ${category.TinhTrang === 'Hoạt động' ? 'tạm ẩn' : 'kích hoạt'} thể loại này?`,
      icon: <ExclamationCircleFilled />,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      async onOk() {
        try {
          const newStatus = category.TinhTrangValue === 1 ? 0 : 1;
          await axios.put(`${API_URL}/${category.MaTL}`, {
            TenTL: category.TenTL,
            TinhTrang: newStatus,
          });
          await fetchCategories();
          message.success('Đổi trạng thái thành công!');
        } catch (error) {
          message.error(`Lỗi khi đổi trạng thái: ${error.message}`);
        }
      },
    });
  };

  const filteredCategories = categories.filter(
    cat =>
      (statusFilter === '' || cat.TinhTrangValue === parseInt(statusFilter)) &&
      (cat.TenTL.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.MaTL?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    {
      title: 'Mã TL',
      dataIndex: 'MaTL',
      key: 'MaTL',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Tên TL',
      dataIndex: 'TenTL',
      key: 'TenTL',
      width: 400,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TinhTrang',
      key: 'TinhTrang',
      width: 280,
      render: (status) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            status === 'Hoạt động' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {status}
        </span>
      ),
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
              setState(prev => ({
                ...prev,
                editingCategory: {
                  ...record,
                  TinhTrang: record.TinhTrangValue,
                },
                isModalVisible: true,
              }));
            }}
          />
          <Button
            size="small"
            icon={record.TinhTrang === 'Hoạt động' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCategory(record.MaTL)}
          />
        </Space>
      ),
      fixed: 'right',
      width: 200,
    },
  ];

  return (
    <div className="thongke-page">
      <div className="thongke-header">
        <h1>
          <i className="fas fa-tags"></i> Quản lý Thể loại
        </h1>
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setState(prev => ({
              ...prev,
              editingCategory: null,
              newCategory: { TenTL: '', TinhTrang: 1 },
              isModalVisible: true,
            }));
          }}
        >
          Thêm thể loại
        </Button>
      </div>

      <div className="thongke-content">
        <div className="thongke-filters">
          <div className="filter-group">
            <label>Tìm kiếm:</label>
            <Input
              placeholder="Tìm thể loại..."
              value={searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              style={{ width: 200 }}
            />
          </div>
          <div className="filter-group">
            <label>Trạng thái:</label>
            <Select value={statusFilter} onChange={(value) => setState(prev => ({ ...prev, statusFilter: value }))} style={{ width: 120 }}>
              <Select.Option value="">Tất cả</Select.Option>
              <Select.Option value="1">Hoạt động</Select.Option>
              <Select.Option value="0">Không hoạt động</Select.Option>
            </Select>
          </div>
        </div>

        <div className="thongke-table">
          <Table
            columns={columns}
            dataSource={filteredCategories}
            rowKey="MaTL"
            loading={loading}
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              size: 'small',
            }}
            size="small"
          />
        </div>
      </div>

      <Modal
        title={editingCategory ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
  open={isModalVisible}
        onCancel={() => {
          setState(prev => ({
            ...prev,
            isModalVisible: false,
            editingCategory: null,
          }));
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setState(prev => ({
                ...prev,
                isModalVisible: false,
                editingCategory: null,
              }));
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
          >
            {editingCategory ? 'Lưu' : 'Thêm'}
          </Button>,
        ]}
        width={600}
  styles={{ body: { padding: '16px' } }}
      >
        <div className="info-section">
          <div className="info-grid">
            {editingCategory && (
              <div className="info-item">
                <p className="info-label">Mã thể loại:</p>
                <Input
                  size="small"
                  value={editingCategory.MaTL}
                  disabled
                />
              </div>
            )}
            <div className="info-item">
              <p className="info-label">Tên thể loại:</p>
              <Input
                size="small"
                value={editingCategory ? editingCategory.TenTL : newCategory.TenTL}
                onChange={(e) => handleInputChange('TenTL', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Tình trạng:</p>
              <Select
                size="small"
                value={editingCategory ? editingCategory.TinhTrang : newCategory.TinhTrang}
                onChange={(value) => handleInputChange('TinhTrang', value)}
                style={{ width: '100%' }}
              >
                <Option value={1}>Hoạt động</Option>
                <Option value={0}>Không hoạt động</Option>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        .thongke-page {
          min-height: 100vh;
        }
        .thongke-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .thongke-content {
          background: #fff;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .thongke-filters {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .thongke-table {
          margin-top: 16px;
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
      `}</style>
    </div>
  );
};

export default CategoryManagement;