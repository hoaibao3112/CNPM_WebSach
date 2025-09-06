import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Select, Input, notification, Space } from 'antd';
import { PlusOutlined, EyeOutlined, SyncOutlined } from '@ant-design/icons';

const { Column } = Table;
const { Option } = Select;

const NhapHang = () => {
  const [phiếuNhập, setPhiếuNhập] = useState([]);
  const [nhàCungCấp, setNhàCungCấp] = useState([]);
  const [sảnPhẩm, setSảnPhẩm] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [chiTiếtVisible, setChiTiếtVisible] = useState(false);
  const [selectedPhiếu, setSelectedPhiếu] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPhiếuNhập();
    fetchNhàCungCấp();
    fetchSảnPhẩm();
  }, []);

  const fetchPhiếuNhập = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/receipt');
      setPhiếuNhập(res.data);
    } catch (error) {
      notification.error({ message: 'Lỗi tải dữ liệu' });
    }
  };

  const fetchNhàCungCấp = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/company');
      setNhàCungCấp(res.data);
    } catch (error) {
      notification.error({ message: 'Lỗi tải danh sách nhà cung cấp' });
    }
  };

  const fetchSảnPhẩm = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/product');
      setSảnPhẩm(res.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
      notification.error({ message: 'Không thể tải danh sách sản phẩm. Vui lòng kiểm tra server.' });
      setSảnPhẩm([]); // Đặt giá trị mặc định là mảng rỗng
    }
  };

  const handleSubmit = async (values) => {
    try {
      await axios.post('http://localhost:5000/api/receipt', {
        ...values,
        items: values.items.filter(item => item.MaSP && item.SoLuong && item.DonGiaNhap),
      });
      notification.success({ message: 'Tạo phiếu nhập thành công' });
      setModalVisible(false);
      fetchPhiếuNhập();
      form.resetFields();
    } catch (error) {
      notification.error({ message: 'Lỗi khi tạo phiếu nhập' });
    }
  };

  const xemChiTiết = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/receipt/${id}`);
      setSelectedPhiếu(res.data);
      setChiTiếtVisible(true);
    } catch (error) {
      notification.error({ message: 'Lỗi khi lấy chi tiết phiếu nhập' });
    }
  };

  const calculateTotal = (items) => {
    return (items || []).reduce((total, item) => total + ((item?.SoLuong || 0) * (item?.DonGiaNhap || 0)), 0);
  };

  const applyProfitPercentage = (percentage) => {
    const items = form.getFieldValue('items') || [];
    const updatedItems = items.map(item => ({
      ...item,
      DonGiaNhap: item.DonGiaNhap ? item.DonGiaNhap * (1 + percentage / 100) : 0,
    }));
    form.setFieldsValue({ items: updatedItems });
  };

  const handleRefresh = () => {
    fetchPhiếuNhập();
    notification.info({ message: 'Danh sách đã được làm mới' });
  };

  return (
    <div style={{ padding: '16px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Button 
          icon={<SyncOutlined />} 
          onClick={handleRefresh}
        >
          Làm mới
        </Button>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setModalVisible(true)}
        >
          Tạo phiếu nhập
        </Button>
      </div>

      <div style={{ 
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: 12,
        maxWidth: '1280px',
        marginLeft: 'auto',
        overflowX: 'auto'
      }}>
        <Table 
          dataSource={phiếuNhập} 
          rowKey="MaPN" 
          pagination={{ pageSize: 5 }}
          bordered
          size="small"
          scroll={{ x: 600 }}
        >
          <Column 
            title="ID Phiếu nhập" 
            dataIndex="MaPN" 
            width={80}
            align="center"
          />
          <Column 
            title="Tên sản phẩm" 
            dataIndex="TenSPDisplay" 
            width={150}
            ellipsis
          />
          <Column 
            title="Tên tác giả" 
            dataIndex="TacGiaDisplay" 
            width={120}
            align="center"
          />
          <Column 
            title="Thể loại" 
            dataIndex="TheLoaiDisplay" 
            width={100}
            align="center"
          />
          <Column 
            title="Số lượng" 
            dataIndex="SoLuongDisplay" 
            width={80}
            align="center"
          />
          <Column 
            title="Đơn giá" 
            dataIndex="DonGiaDisplay" 
            width={100}
            align="right"
            render={(value) => (value ? value.toLocaleString() : 0) + ' đ'}
          />
          <Column 
            title="Nhà cung cấp" 
            dataIndex="TenNCC" 
            width={120}
            align="center"
          />
          <Column
            title="Ghi chú"
            dataIndex="GhiChu"
            width={100}
            align="center"
          />
          <Column
            title="Chi tiết"
            width={100}
            align="center"
            render={(_, record) => (
              <Button 
                icon={<EyeOutlined />} 
                onClick={() => xemChiTiết(record.MaPN)}
                type="link"
              >
                Xem chi tiết
              </Button>
            )}
          />
          <Column
            title="Tổng tiền"
            width={120}
            align="right"
            render={(_, record) => (record.TongTien ? record.TongTien.toLocaleString() : 0) + ' đ'}
          />
        </Table>
      </div>

      <Modal
        title="Tạo phiếu nhập hàng"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="MaNCC" label="Nhà cung cấp" rules={[{ required: true, message: 'Vui lòng chọn nhà cung cấp' }]}>
            <Select showSearch optionFilterProp="children">
              {nhàCungCấp.map(ncc => (
                <Option key={ncc.MaNCC} value={ncc.MaNCC}>
                  {ncc.TenNCC}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="TenTK" label="Tên tài khoản" rules={[{ required: true, message: 'Vui lòng nhập tên tài khoản' }]}>
            <Input />
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'MaSP']}
                      label="ID Sản phẩm"
                      rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
                    >
                      <Select 
                        style={{ width: 150 }} 
                        onChange={(value) => {
                          const product = sảnPhẩm.find(sp => sp.MaSP === value);
                          form.setFieldsValue({
                            items: form.getFieldValue('items').map((item, index) =>
                              index === name
                                ? { ...item, TenSP: product?.TenSP || '' }
                                : item
                            ),
                          });
                        }}
                      >
                        {sảnPhẩm.map(sp => (
                          <Option key={sp.MaSP} value={sp.MaSP}>
                            {sp.MaSP}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'TenSP']}
                      label="Tên sản phẩm"
                    >
                      <Input disabled style={{ width: 200 }} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'SoLuong']}
                      label="Số lượng"
                      rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                    >
                      <Input 
                        type="number" 
                        style={{ width: 100 }} 
                        min={1}
                        onChange={() => form.setFieldsValue({ items: form.getFieldValue('items') })}
                      />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'DonGiaNhap']}
                      label="Đơn giá nhập"
                      rules={[{ required: true, message: 'Vui lòng nhập đơn giá' }]}
                    >
                      <Input 
                        type="number" 
                        style={{ width: 150 }} 
                        min={0}
                        onChange={() => form.setFieldsValue({ items: form.getFieldValue('items') })}
                      />
                    </Form.Item>

                    <Button type="danger" onClick={() => remove(name)}>Xóa</Button>
                  </div>
                ))}
                <Button 
                  type="dashed" 
                  onClick={() => add()} 
                  block
                  style={{ marginBottom: 16 }}
                >
                  Thêm sản phẩm
                </Button>

                <Space style={{ marginBottom: 16 }}>
                  <span>Áp dụng lợi nhuận:</span>
                  <Button onClick={() => applyProfitPercentage(5)}>5%</Button>
                  <Button onClick={() => applyProfitPercentage(10)}>10%</Button>
                  <Button onClick={() => applyProfitPercentage(15)}>15%</Button>
                  <Button onClick={() => applyProfitPercentage(20)}>20%</Button>
                  <Input
                    type="number"
                    placeholder="Tùy chỉnh %"
                    style={{ width: 120 }}
                    min={0}
                    onPressEnter={(e) => applyProfitPercentage(Number(e.target.value))}
                    addonAfter="%"
                  />
                </Space>
              </>
            )}
          </Form.List>

          <Form.Item label="Tổng tiền">
            <Input 
              value={calculateTotal(form.getFieldValue('items')).toLocaleString() + ' đ'} 
              disabled 
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ marginTop: 16 }}
            >
              Lưu phiếu nhập
            </Button>
            <Button 
              onClick={() => setModalVisible(false)} 
              style={{ marginTop: 16 }}
            >
              Hủy
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết phiếu nhập"
        open={chiTiếtVisible}
        onCancel={() => setChiTiếtVisible(false)}
        footer={null}
        width={800}
      >
        {selectedPhiếu && (
          <div>
            <h3>Nhà cung cấp: {selectedPhiếu.TenNCC || 'Không có'}</h3>
            <p>Địa chỉ: {selectedPhiếu.DiaChi || 'Không có'}</p>
            <p>SĐT: {selectedPhiếu.SDT || 'Không có'}</p>
            
            <Table 
              dataSource={selectedPhiếu.items} 
              rowKey="MaSP"
              pagination={false}
            >
              <Column title="ID Sản phẩm" dataIndex="MaSP" />
              <Column title="Tên sản phẩm" dataIndex="TenSP" />
              <Column title="Tên tác giả" dataIndex="TacGia" />
              <Column title="Thể loại" dataIndex="TheLoai" />
              <Column title="Số lượng" dataIndex="SoLuong" />
              <Column title="Đơn giá nhập" dataIndex="DonGiaNhap" render={v => `${(v || 0).toLocaleString()} đ`} />
              <Column title="Thành tiền" render={(_, r) => ((r.SoLuong || 0) * (r.DonGiaNhap || 0)).toLocaleString() + ' đ'} />
            </Table>

            <h4 style={{ marginTop: 16 }}>
              Tổng tiền: {(selectedPhiếu.TongTien || 0).toLocaleString()} đ
            </h4>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .ant-table-thead > tr > th {
          background: #e6f7ff !important;
          font-weight: 600;
          font-size: 14px !important; /* Tăng kích thước chữ lên 14px */
        }
        .ant-table-tbody > tr > td {
          font-size: 14px !important; /* Tăng kích thước chữ lên 14px */
        }
        .ant-table-row:hover {
          background: #fafafa !important;
        }
      `}</style>
    </div>
  );
};

export default NhapHang;