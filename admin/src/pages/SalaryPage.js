import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Drawer } from 'antd';
import axios from 'axios';

const SalaryPage = () => {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNV, setSelectedNV] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());
  const [detailModal, setDetailModal] = useState(false);
  const [detailData, setDetailData] = useState([]);
  const [detailMonth, setDetailMonth] = useState(null);

  const fetchSalary = async () => {
    const res = await axios.get('http://localhost:5000/api/salary');
    setData(res.data);
  };

  useEffect(() => { fetchSalary(); }, []);

  // Khi click vào một nhân viên, mở Drawer và load số ngày công
  const showAttendance = async (record) => {
    setSelectedNV(record);
    setAttendanceYear(record.nam || new Date().getFullYear());
    setDrawerOpen(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/attendance/summary/${record.MaNV}/${record.nam || new Date().getFullYear()}`);
      setAttendanceSummary(res.data);
    } catch {
      message.error('Lỗi khi lấy số ngày công');
      setAttendanceSummary([]);
    }
  };

  // Khi click vào số ngày làm của 1 tháng
  const showDetail = async (thang) => {
    if (!selectedNV) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/attendance/detail/${selectedNV.MaNV}/${thang}/${attendanceYear}`);
      setDetailData(res.data);
      setDetailMonth(thang);
      setDetailModal(true);
    } catch {
      message.error('Lỗi khi lấy chi tiết ngày công');
    }
  };

  const columns = [
    { title: 'Mã NV', dataIndex: 'MaNV' },
    { title: 'Tên NV', dataIndex: 'TenNV' },
    { title: 'Tháng', dataIndex: 'thang' },
    { title: 'Năm', dataIndex: 'nam' },
    { title: 'Lương cơ bản', dataIndex: 'luong_co_ban' },
    { title: 'Phụ cấp', dataIndex: 'phu_cap' },
    { title: 'Thưởng', dataIndex: 'thuong' },
    { title: 'Phạt', dataIndex: 'phat' },
    { title: 'Tổng lương', dataIndex: 'tong_luong' },
    { title: 'Trạng thái', dataIndex: 'trang_thai' },
    {
      title: 'Chi tiết công',
      render: (_, record) => (
        <Button size="small" onClick={() => showAttendance(record)}>
          Xem ngày công
        </Button>
      )
    }
  ];

  const onFinish = async (values) => {
    try {
      await axios.post('http://localhost:5000/api/salary', values);
      message.success('Thêm lương thành công');
      setOpen(false);
      fetchSalary();
    } catch {
      message.error('Lỗi khi thêm lương');
    }
  };

  // Tạo bảng 12 tháng, nếu tháng nào không có thì hiển thị 0
  const renderAttendanceTable = () => {
    const summaryMap = {};
    attendanceSummary.forEach(item => {
      summaryMap[item.thang] = item.so_ngay_lam;
    });
    const rows = [];
    for (let i = 1; i <= 12; i++) {
      rows.push({
        thang: i,
        so_ngay_lam: summaryMap[i] || 0
      });
    }
    return (
      <Table
        columns={[
          { title: 'Tháng', dataIndex: 'thang', width: 80 },
          { 
            title: 'Số ngày làm', 
            dataIndex: 'so_ngay_lam', 
            width: 120,
            render: (val, record) => (
              <Button type="link" onClick={() => showDetail(record.thang)}>
                {val}
              </Button>
            )
          }
        ]}
        dataSource={rows}
        rowKey="thang"
        pagination={false}
        size="small"
      />
    );
  };

  // Bảng chi tiết từng ngày trong tháng
  const renderDetailTable = () => (
    <Table
      columns={[
        { title: 'Ngày', dataIndex: 'ngay', render: d => new Date(d).toLocaleDateString('vi-VN') },
        { 
          title: 'Trạng thái', 
          dataIndex: 'trang_thai',
          render: v => v === 'Di_lam'
            ? <span style={{color: 'green'}}>Đi làm</span>
            : v === 'Nghi_phep'
            ? <span style={{color: 'orange'}}>Nghỉ phép</span>
            : v === 'Nghi_khong_phep'
            ? <span style={{color: 'red'}}>Nghỉ không phép</span>
            : <span>Làm thêm</span>
        }
      ]}
      dataSource={detailData}
      rowKey="ngay"
      pagination={false}
      size="small"
    />
  );

  return (
    <div>
      <Button type="primary" onClick={() => setOpen(true)}>Thêm lương</Button>
      <Table columns={columns} dataSource={data} rowKey="id" style={{ marginTop: 16 }} />
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title="Thêm lương">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="MaNV" label="Mã nhân viên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="thang" label="Tháng" rules={[{ required: true }]}>
            <InputNumber min={1} max={12} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="nam" label="Năm" rules={[{ required: true }]}>
            <InputNumber min={2000} max={2100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="luong_co_ban" label="Lương cơ bản" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="phu_cap" label="Phụ cấp">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="thuong" label="Thưởng">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="phat" label="Phạt">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="tong_luong" label="Tổng lương" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="trang_thai" label="Trạng thái" initialValue="Chua_tra">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Thêm</Button>
        </Form>
      </Modal>
      <Drawer
        title={selectedNV ? `Số ngày làm của ${selectedNV.TenNV} (${attendanceYear})` : ''}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={350}
      >
        {renderAttendanceTable()}
      </Drawer>
      <Modal
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        title={`Chi tiết ngày công tháng ${detailMonth}`}
      >
        {renderDetailTable()}
      </Modal>
    </div>
  );
};

export default SalaryPage;