import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space, Select } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled, LockOutlined, UnlockOutlined } from '@ant-design/icons';

const { Search: SearchInput } = Input;
const { confirm } = Modal;
const { Option } = Select;

const CompanyManagement = () => {
  const [state, setState] = useState({
    companies: [],
    newCompany: {
      MaNCC: '',
      TenNCC: '',
      SDT: '',
      DiaChi: '',
      TinhTrang: '1',
    },
    editingCompany: null,
    searchTerm: '',
    isModalVisible: false,
    loading: false,
    error: null,
  });

  const { companies, newCompany, editingCompany, searchTerm, isModalVisible, loading } = state;
  const API_URL = 'http://localhost:5000/api/company';
  const debounceRef = useRef(null); // Để debounce search

  // Helper để convert Buffer to string nếu cần (fallback)
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
      let url = API_URL;
      if (keyword) {
        url = `${API_URL}/search?keyword=${encodeURIComponent(keyword)}`;
      }
      const response = await axios.get(url);
      
      if (Array.isArray(response.data)) {
        const processedCompanies = response.data.map(company => {
          const statusValue = convertStatusIfBuffer(company);
          return {
            ...company,
            TinhTrang: statusValue === '1' ? 'Hoạt động' : 'Ngừng hoạt động',
            TinhTrangValue: statusValue,
          };
        });
        setState(prev => ({ ...prev, companies: processedCompanies }));
      } else {
        throw new Error('Dữ liệu nhà cung cấp không hợp lệ');
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      message.error(`Lỗi khi tải dữ liệu: ${error.message}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [convertStatusIfBuffer]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Debounce search khi type
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchCompanies(searchTerm);
    }, 500); // Delay 500ms sau khi ngừng type

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, fetchCompanies]);

  // Gợi ý MaNCC tự động khi thêm mới (max +1, giả sử MaNCC là số)
  const suggestMaNCC = () => {
    if (companies.length === 0) return '1';
    const maxId = Math.max(...companies.map(c => parseInt(c.MaNCC) || 0));
    return (maxId + 1).toString();
  };

  const handleSearchChange = (e) => {
    setState(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const onSearch = (value) => {
    setState(prev => ({ ...prev, searchTerm: value }));
    fetchCompanies(value); // Gọi ngay khi nhấn Enter/button
  };

  const handleInputChange = (field, value) => {
    if (editingCompany) {
      setState(prev => ({
        ...prev,
        editingCompany: {
          ...prev.editingCompany,
          [field]: value,
          ...(field === 'TinhTrang' && { TinhTrangValue: value }),
        },
      }));
    } else {
      setState(prev => ({
        ...prev,
        newCompany: {
          ...prev.newCompany,
          [field]: value,
        },
      }));
    }
  };

  const validateCompanyData = (data, isEditing = false) => {
    if (!data.MaNCC || !data.TenNCC || !data.SDT || !data.DiaChi) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Mã NCC, Tên NCC, SĐT, Địa chỉ)!');
      return false;
    }
    if (!/^\d{1,10}$/.test(data.MaNCC)) { // Giả sử MaNCC là số, điều chỉnh nếu cần
      message.error('Mã NCC không hợp lệ (chỉ số)!');
      return false;
    }
    if (!isEditing) {
      // Kiểm tra duplicate client-side
      const exists = companies.some(c => c.MaNCC === data.MaNCC);
      if (exists) {
        message.error('Mã NCC đã tồn tại! Vui lòng chọn mã khác.');
        return false;
      }
    }
    if (!/^\d{10,11}$/.test(data.SDT)) {
      message.error('Số điện thoại không hợp lệ (10-11 số)!');
      return false;
    }
    if (!['1', '0'].includes(data.TinhTrang)) {
      message.error('Trạng thái không hợp lệ!');
      return false;
    }
    return true;
  };

  const handleAddCompany = async () => {
    if (!validateCompanyData(newCompany, false)) return;

    try {
      const payload = {
        ...newCompany,
        TinhTrang: newCompany.TinhTrang, // Đảm bảo là string '1' or '0'
      };

      await axios.post(API_URL, payload);
      await fetchCompanies(searchTerm); // Giữ nguyên search term sau khi thêm
      setState(prev => ({
        ...prev,
        newCompany: {
          MaNCC: suggestMaNCC(), // Reset với gợi ý mới
          TenNCC: '',
          SDT: '',
          DiaChi: '',
          TinhTrang: '1',
        },
        isModalVisible: false,
      }));
      message.success('Thêm nhà cung cấp thành công!');
    } catch (error) {
      console.error('Add error:', error); // Log để debug
      const errorMsg = error.response?.data?.error || error.message;
      message.error(`Lỗi khi thêm nhà cung cấp: ${errorMsg}`);
    }
  };

  const handleUpdateCompany = async () => {
    if (!validateCompanyData(editingCompany, true)) return;

    try {
      const payload = {
        ...editingCompany,
        TinhTrang: editingCompany.TinhTrang, // Đảm bảo là string '1' or '0'
      };

      await axios.put(`${API_URL}/${editingCompany.MaNCC}`, payload);
      await fetchCompanies(searchTerm); // Giữ nguyên search term sau khi cập nhật
      setState(prev => ({
        ...prev,
        editingCompany: null,
        isModalVisible: false,
      }));
      message.success('Cập nhật nhà cung cấp thành công!');
    } catch (error) {
      console.error('Update error:', error); // Log để debug
      const errorMsg = error.response?.data?.error || error.message;
      message.error(`Lỗi khi cập nhật nhà cung cấp: ${errorMsg}`);
    }
  };

  const handleDeleteCompany = (MaNCC) => {
    confirm({
      title: 'Bạn có chắc muốn xóa nhà cung cấp này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này sẽ không thể hoàn tác',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Thoát',
      async onOk() {
        try {
          await axios.delete(`${API_URL}/${MaNCC}`);
          await fetchCompanies(searchTerm); // Giữ nguyên search term sau khi xóa
          message.success('Xóa nhà cung cấp thành công!');
        } catch (error) {
          console.error('Delete error:', error); // Log để debug
          const errorMsg = error.response?.data?.error || error.message;
          message.error(`Lỗi khi xóa nhà cung cấp: ${errorMsg}`);
        }
      },
    });
  };

  const handleToggleStatus = (company) => {
    confirm({
      title: `Bạn có muốn ${company.TinhTrang === 'Hoạt động' ? 'ngừng' : 'kích hoạt'} nhà cung cấp này?`,
      icon: <ExclamationCircleFilled />,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      async onOk() {
        try {
          const newStatus = company.TinhTrangValue === '1' ? '0' : '1';
          await axios.put(`${API_URL}/${company.MaNCC}`, {
            ...company,
            TinhTrang: newStatus,
          });
          await fetchCompanies(searchTerm); // Giữ nguyên search term sau khi toggle
          message.success(`Đã ${newStatus === '1' ? 'kích hoạt' : 'ngừng'} nhà cung cấp!`);
        } catch (error) {
          console.error('Toggle error:', error); // Log để debug
          const errorMsg = error.response?.data?.error || error.message;
          message.error(`Lỗi khi đổi trạng thái: ${errorMsg}`);
        }
      },
    });
  };

  const columns = [
    {
      title: 'Mã NCC',
      dataIndex: 'MaNCC',
      key: 'MaNCC',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Tên NCC',
      dataIndex: 'TenNCC',
      key: 'TenNCC',
      width: 200,
    },
    {
      title: 'SĐT',
      dataIndex: 'SDT',
      key: 'SDT',
      width: 120,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'DiaChi',
      key: 'DiaChi',
      width: 250,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TinhTrang',
      key: 'TinhTrang',
      width: 150,
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
                editingCompany: {
                  ...record,
                  TinhTrang: record.TinhTrangValue, // Đảm bảo dùng value string
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
            onClick={() => handleDeleteCompany(record.MaNCC)}
          />
        </Space>
      ),
      fixed: 'right',
      width: 120,
    },
  ];

  // Current form data cho modal
  const currentCompany = editingCompany || newCompany;
  const isEditing = !!editingCompany;

  return (
    <div className="thongke-page">
      <div className="thongke-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>
          <i className="fas fa-building"></i> Quản lý Nhà Cung Cấp
        </h1>
        <Button
          type="primary"
          size="small"
          onClick={() => {
            const suggestedId = suggestMaNCC();
            setState(prev => ({
              ...prev,
              editingCompany: null,
              newCompany: {
                MaNCC: suggestedId, // Gợi ý MaNCC tự động
                TenNCC: '',
                SDT: '',
                DiaChi: '',
                TinhTrang: '1',
              },
              isModalVisible: true,
            }));
          }}
        >
          Thêm nhà cung cấp
        </Button>
      </div>

      <div className="thongke-content">
        <div className="thongke-filters">
          <div className="filter-group" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <label style={{ margin: 0, whiteSpace: 'nowrap', fontWeight: 500, color: '#666' }}>Tìm kiếm:</label>
            <SearchInput
              placeholder="Tìm nhà cung cấp theo tên, mã, SĐT hoặc địa chỉ..."
              allowClear
              enterButton
              size="small"
              value={searchTerm}
              onChange={handleSearchChange} // Thêm onChange để input responsive
              onSearch={onSearch} // Giữ onSearch cho Enter/button
              style={{ width: 400 }}
            />
          </div>
        </div>

        <div className="thongke-table">
          <Table
            columns={columns}
            dataSource={companies}
            rowKey="MaNCC"
            loading={loading}
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              size: 'small',
            }}
            size="small"
            className="compact-company-table"
            style={{ fontSize: '13px' }}
          />
        </div>
      </div>

      <Modal
        title={isEditing ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
        open={isModalVisible}
        onCancel={() => {
          setState(prev => ({
            ...prev,
            isModalVisible: false,
            editingCompany: null,
          }));
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setState(prev => (prev, {
                isModalVisible: false,
                editingCompany: null,
              }));
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={isEditing ? handleUpdateCompany : handleAddCompany}
          >
            {isEditing ? 'Lưu' : 'Thêm'}
          </Button>,
        ]}
        width={600}
        styles={{ body: { padding: '16px' } }}
      >
        <div className="info-section">
          <div className="info-grid">
            <div className="info-item">
              <p className="info-label">Mã NCC:</p>
              <Input
                size="small"
                value={currentCompany.MaNCC}
                onChange={(e) => handleInputChange('MaNCC', e.target.value)}
                disabled={isEditing}
                placeholder={isEditing ? '' : `Gợi ý: ${suggestMaNCC()}`}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Tên NCC:</p>
              <Input
                size="small"
                value={currentCompany.TenNCC}
                onChange={(e) => handleInputChange('TenNCC', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">SĐT:</p>
              <Input
                size="small"
                value={currentCompany.SDT}
                onChange={(e) => handleInputChange('SDT', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Địa chỉ:</p>
              <Input
                size="small"
                value={currentCompany.DiaChi}
                onChange={(e) => handleInputChange('DiaChi', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Trạng thái:</p>
              <Select
                size="small"
                value={currentCompany.TinhTrang}
                onChange={(value) => handleInputChange('TinhTrang', value)}
                style={{ width: '100%' }}
              >
                <Option value="1">Hoạt động</Option>
                <Option value="0">Ngừng hoạt động</Option>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
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
          margin: 0 0 4px 0;
        }
        .compact-company-table .ant-table-thead > tr > th {
          padding: 8px 12px;
        }
        .compact-company-table .ant-table-tbody > tr > td {
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
};

export default CompanyManagement;