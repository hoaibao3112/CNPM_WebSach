import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Select, message } from 'antd';
import axios from 'axios';

const SalaryPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salaryData, setSalaryData] = useState([]);
  const [detailModal, setDetailModal] = useState(false);
  const [detailData, setDetailData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  const fetchSalary = async () => {
    try {
      const res = await axios.post(`http://localhost:5000/api/salary/compute/${selectedYear}/${selectedMonth}`);
      setSalaryData(res.data.data);
    } catch (error) {
      message.error('Lỗi khi tính lương');
    }
  };

  useEffect(() => { fetchSalary(); }, [selectedMonth, selectedYear]);

  const showDetail = async (record) => {
    setSelectedEmployee(record);
    try {
      const res = await axios.get(`http://localhost:5000/api/attendance/detail/${record.MaNV}/${selectedMonth}/${selectedYear}`);
      setDetailData(res.data);
      setDetailModal(true);
    } catch {
      message.error('Lỗi khi lấy chi tiết ngày công');
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
  const years = Array.from({ length: 10 }, (_, i) => ({ value: new Date().getFullYear() - 5 + i, label: `${new Date().getFullYear() - 5 + i}` }));

  const columns = [
    { title: 'Mã NV', dataIndex: 'MaNV', width: 80 },
    { title: 'Tên NV', dataIndex: 'TenNV', width: 150 },
    { title: 'Số ngày làm', dataIndex: 'soNgayLam', width: 100 },
    { title: 'Giờ tăng ca', dataIndex: 'soGioTangCa', width: 100 },
    { title: 'Lương cơ bản', dataIndex: 'luong_co_ban', render: v => formatPrice(v), width: 120 },
    { title: 'Phụ cấp', dataIndex: 'phu_cap', render: v => formatPrice(v), width: 100 },
    { title: 'Thưởng', dataIndex: 'thuong', render: v => formatPrice(v), width: 100 },
    { title: 'Phạt', dataIndex: 'phat', render: v => formatPrice(v), width: 100 },
    { title: 'Tổng lương', dataIndex: 'tong_luong', render: v => formatPrice(v), width: 120 },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      width: 120,
      render: v => (
        <span style={{ 
          color: v === 'Da_tra' ? '#52c41a' : '#fa8c16',
          fontWeight: 600 
        }}>
          {v === 'Da_tra' ? '✓ Đã chi trả' : '○ Chưa chi trả'}
        </span>
      )
    },
    {
      title: 'Chi tiết',
      render: (_, record) => (
        <Button size="small" onClick={() => showDetail(record)}>
          Xem chi tiết
        </Button>
      ),
      width: 100
    }
  ];

  return (
    <div className="thongke-page">
      <div className="thongke-header">
        <h1>
          <i className="fas fa-money-bill-wave"></i> Tính lương nhân viên
        </h1>
      </div>

      <div className="thongke-content">
        <div className="thongke-filters">
          <div className="filter-group">
            <label>Tháng:</label>
            <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 120, marginRight: 8 }}>
              {months.map(m => <Select.Option key={m.value} value={m.value}>{m.label}</Select.Option>)}
            </Select>
          </div>
          <div className="filter-group">
            <label>Năm:</label>
            <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 120 }}>
              {years.map(y => <Select.Option key={y.value} value={y.value}>{y.label}</Select.Option>)}
            </Select>
          </div>
        </div>

        <div className="thongke-table">
          <Table
            columns={columns}
            dataSource={salaryData}
            rowKey="MaNV"
            scroll={{ x: 1000 }}
            pagination={false}
          />
        </div>
      </div>

      <Modal
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        title={`Chi tiết ngày công của ${selectedEmployee?.TenNV} tháng ${selectedMonth}/${selectedYear}`}
        width={600}
      >
        <Table
          columns={[
            { title: 'Ngày', dataIndex: 'ngay', render: d => new Date(d).toLocaleDateString('vi-VN'), width: 120 },
            { 
              title: 'Trạng thái', 
              dataIndex: 'trang_thai',
              render: v => {
                switch(v) {
                  case 'Di_lam': return <span style={{ color: 'green' }}>Đi làm</span>;
                  case 'Lam_them': return <span style={{ color: 'blue' }}>Làm thêm</span>;
                  case 'Nghi_phep': return <span style={{ color: 'orange' }}>Nghỉ phép</span>;
                  case 'Nghi_khong_phep': return <span style={{ color: 'red' }}>Nghỉ không phép</span>;
                  case 'Di_tre': return <span style={{ color: 'purple' }}>Đi trễ</span>;
                  default: return v;
                }
              },
              width: 150
            }
          ]}
          dataSource={detailData}
          rowKey="ngay"
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default SalaryPage;