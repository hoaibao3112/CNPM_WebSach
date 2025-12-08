import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Select, Input, notification, DatePicker, Alert } from 'antd';
import { PlusOutlined, EyeOutlined, SyncOutlined, SearchOutlined } from '@ant-design/icons';
import '../styles/ReceiptManagement.css';

const { Column } = Table;
const { Option } = Select;
const { RangePicker } = DatePicker;

const NhapHang = () => {
  // ----- States -----
  const [phieuNhap, setPhieuNhap] = useState([]);
  const [nhaCungCap, setNhaCungCap] = useState([]);
  const [sanPham, setSanPham] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [chiTietVisible, setChiTietVisible] = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [form] = Form.useForm();

  const [searchParams, setSearchParams] = useState({
    MaNCC: '',
    TenNCC: '',
    fromDate: '',
    toDate: ''
  });

  // Low-stock
  const [lowStock, setLowStock] = useState([]);
  const [showLowStockBanner, setShowLowStockBanner] = useState(false);
  const [showLowStockDetails, setShowLowStockDetails] = useState(false);
  
  // Tỷ lệ lợi nhuận chung (%) - dùng để tính giá bán
  const [tyLeLoi, setTyLeLoi] = useState(10); // Mặc định 10%
  
  // State để theo dõi items trong form (dùng để tính tổng tiền realtime)
  const [formItems, setFormItems] = useState([]);

  // ----- Effects -----
  useEffect(() => {
    fetchPhieuNhap();
    fetchNhaCungCap();
    fetchSanPham();
    fetchLowStock(true); // hỏi auto tạo phiếu nếu có thiếu hàng
  }, []);

  // ----- Fetchers -----
  const fetchPhieuNhap = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/receipt');
      setPhieuNhap(res.data);
    } catch (error) {
      notification.error({ message: 'Lỗi tải dữ liệu phiếu nhập' });
    }
  };

  const fetchNhaCungCap = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/company');
      setNhaCungCap(res.data);
    } catch (error) {
      notification.error({ message: 'Lỗi tải danh sách nhà cung cấp' });
    }
  };

  const fetchSanPham = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/product');
      setSanPham(res.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
      notification.error({ message: 'Không thể tải danh sách sản phẩm. Vui lòng kiểm tra server.' });
      setSanPham([]);
    }
  };

  // Gọi API low-stock; nếu askConfirm=true sẽ confirm tạo phiếu luôn khi có thiếu hàng
  const fetchLowStock = async (askConfirm = false) => {
    try {
      const res = await axios.get('http://localhost:5000/api/product/low-stock', {
        params: { defaultThreshold: 5, buffer: 5, limit: 200 }
      });
      const items = Array.isArray(res.data) ? res.data : [];
      setLowStock(items);
      const hasLow = items.length > 0;
      setShowLowStockBanner(hasLow);

      if (askConfirm && hasLow) {
        Modal.confirm({
          title: `Có ${items.length} sản phẩm dưới/bằng ngưỡng`,
          content: 'Bạn có muốn tạo phiếu nhập ngay từ danh sách này không?',
          okText: 'Tạo phiếu',
          cancelText: 'Để sau',
          onOk: () => createReceiptFromLowStock(items)
        });
      }
    } catch (error) {
      console.error('Lỗi khi lấy low-stock:', error);
    }
  };

  // ----- Helpers -----
  // Tính tổng tiền NHẬP = Σ(Giá nhập × Số lượng)
  const calculateTotalNhap = (items) => {
    return (items || []).reduce((total, item) => {
      if (!item) return total;
      const donGiaNhap = Number(item.DonGiaNhap || 0);
      const soLuong = Number(item.SoLuong || 0);
      return total + (donGiaNhap * soLuong);
    }, 0);
  };

  // Tính giá bán dự kiến = Giá nhập × (1 + Tỷ lệ lợi nhuận / 100)
  const calculateGiaBan = (donGiaNhap, tyLe) => {
    return Math.round(Number(donGiaNhap || 0) * (1 + Number(tyLe || 0) / 100));
  };

  // Tính tổng tiền BÁN dự kiến = Σ(Giá bán × Số lượng)
  const calculateTotalBan = (items, tyLe) => {
    return (items || []).reduce((total, item) => {
      if (!item) return total;
      const giaBan = calculateGiaBan(item.DonGiaNhap, tyLe);
      const soLuong = Number(item.SoLuong || 0);
      return total + (giaBan * soLuong);
    }, 0);
  };

  // Lấy số lượng đề xuất: ưu tiên SuggestedOrder, fallback Needed (>0), cuối cùng = 1
  const resolveSuggestedQty = (sp) => {
    const s = Number(sp?.SuggestedOrder);
    if (Number.isFinite(s) && s > 0) return s;
    const n = Number(sp?.Needed);
    if (Number.isFinite(n) && n > 0) return n;
    return 1;
    // Trường hợp bằng ngưỡng: Needed có thể = 0 ⇒ vẫn nhập tối thiểu 1 theo SuggestedOrder đã + buffer từ API
  };

  // Tạo phiếu từ danh sách thiếu hàng (items là mảng từ API low-stock, nếu không truyền sẽ dùng state lowStock)
  const createReceiptFromLowStock = (items) => {
    const source = Array.isArray(items) ? items : lowStock;
    if (!source || source.length === 0) return;

    const itemsPrefill = source.map(sp => ({
      MaSP: sp.MaSP,
      TenSP: sp.TenSP,
      SoLuong: resolveSuggestedQty(sp),
      DonGiaNhap: Number(sp.DonGia || 0) // Giá nhập gốc
    }));

    form.setFieldsValue({
      items: itemsPrefill
    });
    setFormItems(itemsPrefill); // Cập nhật state để tính tổng tiền
    setTyLeLoi(10); // Reset về 10%
    setModalVisible(true);
  };

  // Không cần applyProfitPercentage nữa - tỷ lệ lợi nhuận được áp dụng ở backend
  // Frontend chỉ cần gửi TyLeLoi chung, backend sẽ tính Giá bán = Giá nhập × (1 + TyLeLoi/100)

  // ----- Actions -----
  const handleSubmit = async (values) => {
    try {
      // Lọc và chuẩn hóa items
      const validItems = (values.items || [])
        .filter(it => it.MaSP && it.SoLuong > 0 && it.DonGiaNhap > 0)
        .map(it => ({
          MaSP: it.MaSP,
          SoLuong: Number(it.SoLuong),
          DonGiaNhap: Number(it.DonGiaNhap) // Giá nhập gốc
        }));

      if (validItems.length === 0) {
        notification.warning({ message: 'Vui lòng thêm ít nhất 1 sản phẩm hợp lệ' });
        return;
      }

      const payload = {
        MaNCC: values.MaNCC,
        TenTK: values.TenTK,
        TyLeLoi: tyLeLoi, // Tỷ lệ lợi nhuận chung (%)
        items: validItems
      };

      const response = await axios.post('http://localhost:5000/api/receipt', payload);
      
      // Hiển thị kết quả chi tiết
      const { MaPN, TongTienNhap, items: processedItems } = response.data;
      notification.success({ 
        message: 'Tạo phiếu nhập thành công',
        description: `Mã phiếu: ${MaPN} | Tổng tiền nhập: ${TongTienNhap?.toLocaleString()}đ | Tỷ lệ lời: ${tyLeLoi}%`
      });

      setModalVisible(false);
      form.resetFields();
      setFormItems([]); // Reset formItems
      setTyLeLoi(10); // Reset về mặc định
      await fetchPhieuNhap();
      await fetchLowStock(false);
    } catch (error) {
      console.error('Lỗi tạo phiếu nhập:', error);
      const errorMsg = error.response?.data?.details || error.response?.data?.error || 'Lỗi khi tạo phiếu nhập';
      notification.error({ message: 'Lỗi', description: errorMsg });
    }
  };

  const xemChiTiet = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/receipt/${id}`);
      setSelectedPhieu(res.data);
      setChiTietVisible(true);
    } catch (error) {
      notification.error({ message: 'Lỗi khi lấy chi tiết phiếu nhập' });
    }
  };

  const handleRefresh = async () => {
    await fetchPhieuNhap();
    await fetchLowStock(false);
    notification.info({ message: 'Danh sách đã được làm mới' });
    setSearchParams({ MaNCC: '', TenNCC: '', fromDate: '', toDate: '' });
  };

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (searchParams.MaNCC) params.append('MaNCC', searchParams.MaNCC);
      if (searchParams.TenNCC) params.append('TenNCC', searchParams.TenNCC);
      if (searchParams.fromDate) params.append('fromDate', searchParams.fromDate);
      if (searchParams.toDate) params.append('toDate', searchParams.toDate);

      const res = await axios.get(`http://localhost:5000/api/receipt/search?${params.toString()}`);
      setPhieuNhap(res.data);
    } catch (error) {
      notification.error({ message: 'Lỗi khi tìm kiếm phiếu nhập' });
    }
  };

  const handleDateChange = (dates) => {
    setSearchParams({
      ...searchParams,
      fromDate: dates ? dates[0]?.format('YYYY-MM-DD') : '',
      toDate: dates ? dates[1]?.format('YYYY-MM-DD') : ''
    });
  };

  // ----- Render -----
  return (
    <div className="receipt-management-container">
      <div className="receipt-header">
        <div className="search-section">
          <Select
            placeholder="Chọn nhà cung cấp"
            value={searchParams.MaNCC || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, MaNCC: value || '' })}
            style={{ width: 200 }}
            allowClear
          >
            {nhaCungCap.map(ncc => (
              <Option key={ncc.MaNCC} value={ncc.MaNCC}>
                {ncc.TenNCC}
              </Option>
            ))}
          </Select>

          <Input
            placeholder="Tên nhà cung cấp"
            value={searchParams.TenNCC}
            onChange={(e) => setSearchParams({ ...searchParams, TenNCC: e.target.value })}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />

          <RangePicker
            format="YYYY-MM-DD"
            onChange={handleDateChange}
            style={{ width: 250 }}
          />

          <Button icon={<SearchOutlined />} onClick={handleSearch}>
            Tìm kiếm
          </Button>
          <Button icon={<SyncOutlined />} onClick={handleRefresh}>
            Làm mới
          </Button>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Tạo phiếu nhập
        </Button>
      </div>

      {/* --- Thông báo low-stock: hiển thị khi có sản phẩm dưới/bằng ngưỡng --- */}
      {showLowStockBanner && lowStock.length > 0 && (
        <div style={{ margin: '12px 0' }}>
          <Alert
            type="warning"
            showIcon
            message={`Có ${lowStock.length} sản phẩm dưới/bằng ngưỡng tồn. Vui lòng tạo phiếu nhập.`}
            description={
              <div style={{ marginTop: 8 }}>
                <Button
                  size="small"
                  onClick={() => setShowLowStockDetails(prev => !prev)}
                  style={{ marginRight: 8 }}
                >
                  {showLowStockDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                </Button>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => createReceiptFromLowStock(lowStock)}
                >
                  Tạo phiếu nhập từ thông báo
                </Button>
              </div>
            }
          />
          {showLowStockDetails && (
            <Table
              dataSource={lowStock}
              rowKey="MaSP"
              pagination={false}
              size="small"
              style={{ marginTop: 8, background: '#fff' }}
            >
              <Column title="ID" dataIndex="MaSP" width={80} />
              <Column title="Tên sản phẩm" dataIndex="TenSP" />
              <Column title="Tồn" dataIndex="SoLuong" align="center" width={80} />
              <Column title="Ngưỡng" dataIndex="MinSoLuong" align="center" width={100} />
              <Column
                title="Đề xuất nhập"
                align="center"
                width={130}
                render={(_, r) => resolveSuggestedQty(r)}
              />
            </Table>
          )}
        </div>
      )}

      <div className="table-container">
        <Table
          dataSource={phieuNhap}
          rowKey="MaPN"
          pagination={{ pageSize: 5 }}
          bordered
          size="small"
          scroll={{ x: 600 }}
        >
          <Column title="ID Phiếu nhập" dataIndex="MaPN" width={80} align="center" />
          <Column title="Tên sản phẩm" dataIndex="TenSPDisplay" width={150} ellipsis />
          <Column title="Tên tác giả" dataIndex="TacGiaDisplay" width={120} align="center" />
          <Column title="Thể loại" dataIndex="TheLoaiDisplay" width={100} align="center" />
          <Column title="Số lượng" dataIndex="SoLuongDisplay" width={80} align="center" />
          <Column
            title="Đơn giá"
            dataIndex="DonGiaDisplay"
            width={80}
            align="right"
            render={(value) => ((value ? Number(value) : 0).toLocaleString() + ' đ')}
          />
          <Column title="Nhà cung cấp" dataIndex="TenNCC" width={120} align="center" />
          <Column title="Ghi chú" dataIndex="GhiChu" width={50} align="center" />
          <Column
            title="Chi tiết"
            width={150}
            align="center"
            render={(_, record) => (
              <Button icon={<EyeOutlined />} onClick={() => xemChiTiet(record.MaPN)} type="link">
                Xem chi tiết
              </Button>
            )}
          />
          <Column
            title="Tổng tiền"
            width={120}
            align="right"
            render={(_, record) => ((record.TongTien ? Number(record.TongTien) : 0).toLocaleString() + ' đ')}
          />
        </Table>
      </div>

      {/* Modal tạo phiếu nhập */}
      <Modal
        title="Tạo phiếu nhập hàng"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setTyLeLoi(10); setFormItems([]); }}
        footer={null}
        width={1000}
        destroyOnClose
        className="receipt-modal"
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          onValuesChange={(_, allValues) => {
            // Cập nhật formItems để tính tổng tiền realtime
            setFormItems(allValues.items || []);
          }}
        >
          <Form.Item
            name="MaNCC"
            label="Nhà cung cấp"
            rules={[{ required: true, message: 'Vui lòng chọn nhà cung cấp' }]}
          >
            <Select showSearch optionFilterProp="children" placeholder="Chọn nhà cung cấp">
              {nhaCungCap.map(ncc => (
                <Option key={ncc.MaNCC} value={ncc.MaNCC}>
                  {ncc.TenNCC}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="TenTK"
            label="Tên tài khoản"
            rules={[{ required: true, message: 'Vui lòng nhập tên tài khoản' }]}
          >
            <Input placeholder="Người lập phiếu / tài khoản" />
          </Form.Item>

          {/* Phần tỷ lệ lợi nhuận */}
          <div className="profit-section" style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>⚙️ Tỷ lệ lợi nhuận (%):</strong>
              <span style={{ marginLeft: 8, color: '#666' }}>Giá bán = Giá nhập × (1 + %)</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {[5, 10, 15, 20, 25, 30].map(p => (
                <Button
                  key={p}
                  type={tyLeLoi === p ? 'primary' : 'default'}
                  onClick={() => setTyLeLoi(p)}
                >
                  {p}%
                </Button>
              ))}
              <Input
                type="number"
                value={tyLeLoi}
                onChange={(e) => setTyLeLoi(Number(e.target.value) || 0)}
                style={{ width: 100 }}
                min={0}
                max={100}
                addonAfter="%"
              />
            </div>
          </div>

          <Form.List name="items" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                <div style={{ marginBottom: 8 }}>
                  <strong>📦 Danh sách sản phẩm nhập:</strong>
                </div>
                {fields.map(({ key, name, ...restField }) => {
                  // Dùng formItems state để lấy giá trị realtime
                  const currentItem = formItems[name] || {};
                  const giaBanDuKien = calculateGiaBan(currentItem.DonGiaNhap, tyLeLoi);
                  
                  return (
                    <div key={key} className="form-item-row" style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'MaSP']}
                        label="Sản phẩm"
                        rules={[{ required: true, message: 'Chọn SP' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          style={{ width: 200 }}
                          showSearch
                          optionFilterProp="children"
                          placeholder="Chọn sản phẩm"
                          onChange={(value) => {
                            const product = sanPham.find(sp => sp.MaSP === value);
                            const items = form.getFieldValue('items') || [];
                            const nextItems = items.map((it, idx) =>
                              idx === name
                                ? {
                                    ...it,
                                    TenSP: product?.TenSP || '',
                                    DonGiaNhap: Number(product?.DonGia || 0) // Lấy giá hiện tại làm giá nhập mặc định
                                  }
                                : it
                            );
                            form.setFieldsValue({ items: nextItems, totalNhap: calculateTotalNhap(nextItems) });
                          }}
                        >
                          {sanPham.map(sp => (
                            <Option key={sp.MaSP} value={sp.MaSP}>
                              {sp.MaSP} - {sp.TenSP}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item {...restField} name={[name, 'TenSP']} label="Tên SP" style={{ marginBottom: 0 }}>
                        <Input disabled style={{ width: 150 }} />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'SoLuong']}
                        label="Số lượng"
                        rules={[{ required: true, message: 'Nhập SL' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input type="number" style={{ width: 80 }} min={1} />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'DonGiaNhap']}
                        label="Giá nhập (đ)"
                        rules={[{ required: true, message: 'Nhập giá' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input type="number" style={{ width: 120 }} min={0} />
                      </Form.Item>

                      {/* Hiển thị giá bán dự kiến */}
                      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                        <span style={{ fontSize: 12, color: '#666' }}>Giá bán dự kiến</span>
                        <span style={{ 
                          padding: '4px 11px', 
                          background: '#e6f7ff', 
                          border: '1px solid #91d5ff',
                          borderRadius: 4,
                          fontWeight: 'bold',
                          color: '#1890ff'
                        }}>
                          {giaBanDuKien.toLocaleString()}đ
                        </span>
                      </div>

                      <Button danger onClick={() => remove(name)} style={{ marginBottom: 0 }}>Xóa</Button>
                    </div>
                  );
                })}

                <Button
                  type="dashed"
                  onClick={() => add({})}
                  block
                  style={{ marginBottom: 16 }}
                >
                  + Thêm sản phẩm
                </Button>
              </>
            )}
          </Form.List>

          {/* Hiển thị tổng tiền */}
          <div style={{ marginTop: 16, padding: 12, background: '#f0f5ff', borderRadius: 8, border: '1px solid #adc6ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span><strong>💰 Tổng tiền NHẬP (giá gốc):</strong></span>
              <span style={{ fontSize: 16, fontWeight: 'bold', color: '#fa541c' }}>
                {calculateTotalNhap(formItems).toLocaleString()}đ
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span><strong>📈 Tổng tiền BÁN dự kiến (+{tyLeLoi}%):</strong></span>
              <span style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>
                {calculateTotalBan(formItems, tyLeLoi).toLocaleString()}đ
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>📊 Lợi nhuận dự kiến:</strong></span>
              <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                {(calculateTotalBan(formItems, tyLeLoi) - calculateTotalNhap(formItems)).toLocaleString()}đ
              </span>
            </div>
          </div>

          <Form.Item name="totalNhap" hidden>
            <Input />
          </Form.Item>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button type="primary" htmlType="submit" size="large">
              ✅ Lưu phiếu nhập
            </Button>
            <Button onClick={() => { setModalVisible(false); setTyLeLoi(10); setFormItems([]); }} size="large">
              Hủy
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal chi tiết */}
      <Modal
        title="Chi tiết phiếu nhập"
        open={chiTietVisible}
        onCancel={() => setChiTietVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedPhieu && (
          <div>
            <div className="detail-info">
              <h3>Nhà cung cấp: {selectedPhieu.TenNCC || 'Không có'}</h3>
              <p>Địa chỉ: {selectedPhieu.DiaChi || 'Không có'}</p>
              <p>SĐT: {selectedPhieu.SDT || 'Không có'}</p>
            </div>

            <Table dataSource={selectedPhieu.items} rowKey="MaSP" pagination={false}>
              <Column title="ID Sản phẩm" dataIndex="MaSP" />
              <Column title="Tên sản phẩm" dataIndex="TenSP" />
              <Column title="Tên tác giả" dataIndex="TacGia" />
              <Column title="Thể loại" dataIndex="TheLoai" />
              <Column title="Số lượng" dataIndex="SoLuong" />
              <Column
                title="Đơn giá nhập"
                dataIndex="DonGiaNhap"
                render={(v) => `${(Number(v) || 0).toLocaleString()} đ`}
              />
              <Column
                title="Thành tiền"
                render={(_, r) => ((Number(r.SoLuong) || 0) * (Number(r.DonGiaNhap) || 0)).toLocaleString() + ' đ'}
              />
            </Table>

            <div className="total-amount">
              Tổng tiền: {(Number(selectedPhieu.TongTien) || 0).toLocaleString()} đ
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NhapHang;
