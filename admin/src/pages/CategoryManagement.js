import React, { useEffect, useState } from 'react';
import api from '../utils/api';
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
  const API_URL = '/category';

  const fetchCategories = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await api.get(API_URL);

      const categoriesData = response.data.data;
      if (Array.isArray(categoriesData)) {
        const processedCategories = categoriesData.map(item => ({
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
      await api.post(API_URL, newCategory);
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
      await api.put(`${API_URL}/${editingCategory.MaTL}`, {
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
          await api.delete(`${API_URL}/${MaTL}`);
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
          await api.put(`${API_URL}/${category.MaTL}`, {
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
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status === 'Hoạt động' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
    <div className="p-4 md:p-6 min-h-screen bg-slate-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
          <span className="material-icons text-indigo-500">category</span>
          Quản lý Thể loại
        </h1>
        <Button
          type="primary"
          icon={<span className="material-icons text-sm">add</span>}
          onClick={() => {
            setState(prev => ({
              ...prev,
              editingCategory: null,
              newCategory: { TenTL: '', TinhTrang: 1 },
              isModalVisible: true,
            }));
          }}
          className="h-10 px-6 rounded-lg shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          Thêm thể loại
        </Button>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Tìm kiếm</label>
            <Input
              placeholder="Tìm theo mã hoặc tên..."
              value={searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              prefix={<span className="material-icons text-slate-400 text-sm">search</span>}
              className="rounded-lg h-10"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Trạng thái</label>
            <Select 
              value={statusFilter} 
              onChange={(value) => setState(prev => ({ ...prev, statusFilter: value }))} 
              className="w-full h-10"
            >
              <Select.Option value="">Tất cả</Select.Option>
              <Select.Option value="1">Hoạt động</Select.Option>
              <Select.Option value="0">Không hoạt động</Select.Option>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100">
          <Table
            columns={columns}
            dataSource={filteredCategories}
            rowKey="MaTL"
            loading={loading}
            scroll={{ x: 800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              size: 'small',
              className: 'px-4'
            }}
            className="modern-table"
          />
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <span className="material-icons text-indigo-500">
              {editingCategory ? 'edit' : 'add_circle'}
            </span>
            {editingCategory ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
          </div>
        }
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
            className="rounded-lg h-10 px-6"
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
            className="rounded-lg h-10 px-8 bg-indigo-600 shadow-md shadow-indigo-100"
          >
            {editingCategory ? 'Lưu thay đổi' : 'Tạo mới'}
          </Button>,
        ]}
        width={500}
        centered
      >
        <div className="py-4 space-y-4">
          {editingCategory && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mã thể loại</label>
              <Input
                value={editingCategory.MaTL}
                disabled
                className="rounded-lg bg-slate-50 border-slate-200"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tên thể loại</label>
            <Input
              placeholder="Nhập tên thể loại..."
              value={editingCategory ? editingCategory.TenTL : newCategory.TenTL}
              onChange={(e) => handleInputChange('TenTL', e.target.value)}
              className="rounded-lg h-10"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tình trạng</label>
            <Select
              value={editingCategory ? editingCategory.TinhTrang : newCategory.TinhTrang}
              onChange={(value) => handleInputChange('TinhTrang', value)}
              className="w-full h-10 rounded-lg"
            >
              <Option value={1}>Hoạt động</Option>
              <Option value={0}>Không hoạt động</Option>
            </Select>
          </div>
        </div>
      </Modal>

      <style>{`
        .modern-table .ant-table-thead > tr > th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f1f5f9;
        }
        .modern-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
          padding: 12px 16px;
        }
        .modern-table .ant-table-tbody > tr:hover > td {
          background: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
};

export default CategoryManagement;