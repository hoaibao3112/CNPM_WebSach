import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Input, message, Table, Modal, Space } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleFilled, LockOutlined, UnlockOutlined } from '@ant-design/icons';

const { Search } = Input;
const { confirm } = Modal;

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

  const fetchCompanies = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await axios.get(API_URL);
      
      if (Array.isArray(response.data)) {
        const processedCompanies = response.data.map(company => ({
          ...company,
          TinhTrang: company.TinhTrang === '1' ? 'Hoạt động' : 'Ngừng hoạt động',
          TinhTrangValue: company.TinhTrang,
        }));
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
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

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

  const validateCompanyData = (data) => {
    if (!data.MaNCC || !data.TenNCC || !data.SDT || !data.DiaChi) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Mã NCC, Tên NCC, SĐT, Địa chỉ)!');
      return false;
    }
    if (!/^\d{10,11}$/.test(data.SDT)) {
      message.error('Số điện thoại không hợp lệ (10-11 số)!');
      return false;
    }
    return true;
  };

  const handleAddCompany = async () => {
    if (!validateCompanyData(newCompany)) return;

    try {
      const payload = {
        ...newCompany,
        TinhTrang: newCompany.TinhTrang,
      };

      await axios.post(API_URL, payload);
      await fetchCompanies();
      setState(prev => ({
        ...prev,
        newCompany: {
          MaNCC: '',
          TenNCC: '',
          SDT: '',
          DiaChi: '',
          TinhTrang: '1',
        },
        isModalVisible: false,
      }));
      message.success('Thêm nhà cung cấp thành công!');
    } catch (error) {
      message.error(`Lỗi khi thêm nhà cung cấp: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdateCompany = async () => {
    if (!validateCompanyData(editingCompany)) return;

    try {
      const payload = {
        ...editingCompany,
        TinhTrang: editingCompany.TinhTrang,
      };

      await axios.put(`${API_URL}/${editingCompany.MaNCC}`, payload);
      await fetchCompanies();
      setState(prev => ({
        ...prev,
        editingCompany: null,
        isModalVisible: false,
      }));
      message.success('Cập nhật nhà cung cấp thành công!');
    } catch (error) {
      message.error(`Lỗi khi cập nhật nhà cung cấp: ${error.response?.data?.error || error.message}`);
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
          await fetchCompanies();
          message.success('Xóa nhà cung cấp thành công!');
        } catch (error) {
          message.error(`Lỗi khi xóa nhà cung cấp: ${error.message}`);
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
          await fetchCompanies();
          message.success(`Đã ${newStatus === '1' ? 'kích hoạt' : 'ngừng'} nhà cung cấp!`);
        } catch (error) {
          message.error(`Lỗi khi đổi trạng thái: ${error.message}`);
        }
      },
    });
  };

  const filteredCompanies = companies.filter(c =>
    c.TenNCC.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.MaNCC.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      width: 200,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TinhTrang',
      key: 'TinhTrang',
      width: 120,
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
            onClick={() => handleDeleteCompany(record.MaNCC)}
          />
        </Space>
      ),
      fixed: 'right',
      width: 120,
    },
  ];

  return (
    <div className="company-management-container">
      <div className="header-section">
        <h1 className="page-title">Quản lý Nhà Cung Cấp</h1>
        <div className="search-box">
          <Search
            placeholder="Tìm nhà cung cấp..."
            allowClear
            enterButton
            size="small"
            value={searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
          />
        </div>
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setState(prev => ({
              ...prev,
              editingCompany: null,
              newCompany: {
                MaNCC: '',
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

      <Table
        columns={columns}
        dataSource={filteredCompanies}
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

      <Modal
        title={editingCompany ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
        visible={isModalVisible}
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
              setState(prev => ({
                ...prev,
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
            onClick={editingCompany ? handleUpdateCompany : handleAddCompany}
          >
            {editingCompany ? 'Lưu' : 'Thêm'}
          </Button>,
        ]}
        width={600}
        bodyStyle={{ padding: '16px' }}
      >
        <div className="info-section">
          <div className="info-grid">
            <div className="info-item">
              <p className="info-label">Mã NCC:</p>
              <Input
                size="small"
                value={editingCompany ? editingCompany.MaNCC : newCompany.MaNCC}
                onChange={(e) => handleInputChange('MaNCC', e.target.value)}
                disabled={!!editingCompany}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Tên NCC:</p>
              <Input
                size="small"
                value={editingCompany ? editingCompany.TenNCC : newCompany.TenNCC}
                onChange={(e) => handleInputChange('TenNCC', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">SĐT:</p>
              <Input
                size="small"
                value={editingCompany ? editingCompany.SDT : newCompany.SDT}
                onChange={(e) => handleInputChange('SDT', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Địa chỉ:</p>
              <Input
                size="small"
                value={editingCompany ? editingCompany.DiaChi : newCompany.DiaChi}
                onChange={(e) => handleInputChange('DiaChi', e.target.value)}
              />
            </div>
            <div className="info-item">
              <p className="info-label">Trạng thái:</p>
              <Input
                size="small"
                value={editingCompany ? editingCompany.TinhTrang : newCompany.TinhTrang}
                onChange={(e) => handleInputChange('TinhTrang', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .company-management-container {
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
        .compact-company-table :global(.ant-table-thead > tr > th) {
          padding: 8px 12px;
        }
        .compact-company-table :global(.ant-table-tbody > tr > td) {
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
};

export default CompanyManagement;