import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Table, Button, Modal, Form, Select, Input, notification, DatePicker, Alert, Tag, InputNumber } from 'antd';
import { PlusOutlined, EyeOutlined, SyncOutlined, SearchOutlined, CarOutlined, UserOutlined, FileTextOutlined, CloseCircleFilled } from '@ant-design/icons';

const { Column } = Table;
const { Option } = Select;
const { RangePicker } = DatePicker;

const NhapHang = () => {
  const [phieuNhap, setPhieuNhap] = useState([]);
  const [nhaCungCap, setNhaCungCap] = useState([]);
  const [sanPham, setSanPham] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [chiTietVisible, setChiTietVisible] = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [form] = Form.useForm();

  const [searchParams, setSearchParams] = useState({ MaNCC: '', TenNCC: '', fromDate: '', toDate: '' });
  const [lowStock, setLowStock] = useState([]);
  const [showLowStockBanner, setShowLowStockBanner] = useState(false);
  const [showLowStockDetails, setShowLowStockDetails] = useState(false);
  const [tyLeLoi, setTyLeLoi] = useState(10);
  const [formItems, setFormItems] = useState([]);

  useEffect(() => {
    fetchPhieuNhap();
    fetchNhaCungCap();
    fetchSanPham();
    fetchLowStock(true);
  }, []);

  const fetchPhieuNhap = async () => {
    try {
      const res = await api.get('/receipt');
      setPhieuNhap(res.data.data || []);
    } catch (error) { notification.error({ message: 'Lỗi tải dữ liệu phiếu nhập' }); }
  };

  const fetchNhaCungCap = async () => {
    try {
      const res = await api.get('/company');
      const resData = res.data.data || res.data;
      setNhaCungCap(Array.isArray(resData) ? resData : (resData?.data || []));
    } catch (error) { notification.error({ message: 'Lỗi tải nhà cung cấp' }); }
  };

  const fetchSanPham = async () => {
    try {
      const res = await api.get('/product');
      const resData = res.data.data || res.data;
      setSanPham(Array.isArray(resData) ? resData : (resData?.data || []));
    } catch (error) { setSanPham([]); }
  };

  const fetchLowStock = async (askConfirm = false) => {
    try {
      const res = await api.get('/product/low-stock', { params: { defaultThreshold: 5, buffer: 5, limit: 200 } });
      const items = Array.isArray(res.data.data) ? res.data.data : [];
      setLowStock(items);
      setShowLowStockBanner(items.length > 0);
      if (askConfirm && items.length > 0) {
        Modal.confirm({
          title: `Phát hiện ${items.length} mặt hàng sắp hết`,
          content: 'Hệ thống đề xuất tạo phiếu nhập ngay. Bạn có muốn thực hiện?',
          okText: 'Tạo ngay',
          cancelText: 'Để sau',
          onOk: () => createReceiptFromLowStock(items)
        });
      }
    } catch (error) {}
  };

  const calculateTotalNhap = (items) => (items || []).reduce((t, it) => t + (Number(it?.DonGiaNhap || 0) * Number(it?.SoLuong || 0)), 0);
  const calculateGiaBan = (donGiaNhap, tyLe) => Math.round(Number(donGiaNhap || 0) * (1 + Number(tyLe || 0) / 100));
  const calculateTotalBan = (items, tyLe) => (items || []).reduce((t, it) => t + (calculateGiaBan(it?.DonGiaNhap, tyLe) * Number(it?.SoLuong || 0)), 0);

  const resolveSuggestedQty = (sp) => {
    const s = Number(sp?.SuggestedOrder);
    if (s > 0) return s;
    const n = Number(sp?.Needed);
    if (n > 0) return n;
    return 1;
  };

  const createReceiptFromLowStock = (items) => {
    const source = Array.isArray(items) ? items : lowStock;
    const itemsPrefill = source.map(sp => ({ MaSP: sp.MaSP, TenSP: sp.TenSP, SoLuong: resolveSuggestedQty(sp), DonGiaNhap: Number(sp.DonGia || 0) }));
    form.setFieldsValue({ items: itemsPrefill });
    setFormItems(itemsPrefill);
    setTyLeLoi(10);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const validItems = (values.items || []).filter(it => it.MaSP && it.SoLuong > 0 && it.DonGiaNhap > 0).map(it => ({ MaSP: it.MaSP, SoLuong: Number(it.SoLuong), DonGiaNhap: Number(it.DonGiaNhap) }));
      if (!validItems.length) return notification.warning({ message: 'Thêm ít nhất 1 sản phẩm' });
      await api.post('/receipt', { MaNCC: values.MaNCC, TenTK: values.TenTK, TyLeLoi: tyLeLoi, items: validItems });
      notification.success({ message: 'Tạo phiếu nhập thành công' });
      setModalVisible(false);
      form.resetFields();
      setFormItems([]);
      fetchPhieuNhap();
      fetchLowStock(false);
    } catch (error) { notification.error({ message: 'Lỗi', description: error.response?.data?.error || 'Lỗi khi tạo' }); }
  };

  const columns = [
    {
      title: 'MÃ PHIẾU',
      dataIndex: 'MaPN',
      key: 'id',
      width: 100,
      render: (id) => <span className="font-black text-slate-400">#PN{String(id).padStart(3, '0')}</span>
    },
    {
      title: 'THÔNG TIN NHẬP',
      key: 'info',
      render: (_, record) => (
        <div className="space-y-1">
          <div className="font-bold text-slate-700 truncate max-w-[200px]" title={record.TenSPDisplay}>{record.TenSPDisplay}</div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Tag className="m-0 text-[9px] font-black">{record.TheLoaiDisplay}</Tag>
            <span>SL: {record.SoLuongDisplay}</span>
          </div>
        </div>
      )
    },
    {
      title: 'NHÀ CUNG CẤP',
      dataIndex: 'TenNCC',
      key: 'ncc',
      render: (ncc) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><CarOutlined style={{ fontSize: '14px' }} /></div>
          <span className="text-sm font-bold text-slate-600">{ncc}</span>
        </div>
      )
    },
    {
      title: 'TỔNG TIỀN',
      dataIndex: 'TongTien',
      key: 'total',
      align: 'right',
      render: (total) => (
        <div className="text-right">
          <div className="font-black text-indigo-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total || 0)}</div>
          <div className="text-[9px] text-slate-400 font-bold uppercase">Giá trị nhập</div>
        </div>
      )
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Button 
          icon={<EyeOutlined />} 
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:text-indigo-600 hover:border-indigo-600 transition-all"
          onClick={async () => {
            const res = await api.get(`/receipt/${record.MaPN}`);
            setSelectedPhieu(res.data.data);
            setChiTietVisible(true);
          }}
        />
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="material-icons text-indigo-500">inventory</span>
            Quản lý Nhập hàng
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Theo dõi lịch sử và tạo phiếu nhập kho mới</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
          className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 border-0 shadow-lg shadow-indigo-100 font-bold flex items-center gap-2"
        >
          Tạo phiếu nhập
        </Button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhà cung cấp</label>
            <Select 
              className="w-full h-11 modern-select" 
              placeholder="Tất cả NCC" 
              allowClear
              value={searchParams.MaNCC || undefined}
              onChange={(v) => setSearchParams({...searchParams, MaNCC: v || ''})}
            >
              {nhaCungCap.map(ncc => <Option key={ncc.MaNCC} value={ncc.MaNCC}>{ncc.TenNCC}</Option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khoảng thời gian</label>
            <RangePicker className="w-full h-11 rounded-xl" onChange={(d) => setSearchParams({...searchParams, fromDate: d ? d[0].format('YYYY-MM-DD') : '', toDate: d ? d[1].format('YYYY-MM-DD') : ''})} />
          </div>
          <div className="md:col-span-2 flex items-end gap-3">
            <Button icon={<SearchOutlined />} onClick={async () => {
              const params = new URLSearchParams();
              Object.keys(searchParams).forEach(k => searchParams[k] && params.append(k, searchParams[k]));
              const res = await api.get(`/receipt/search?${params.toString()}`);
              setPhieuNhap(res.data.data || []);
            }} className="h-11 px-6 rounded-xl font-bold bg-slate-800 text-white border-0 hover:bg-slate-900 transition-all flex items-center gap-2">Tìm kiếm</Button>
            <Button icon={<SyncOutlined />} onClick={fetchPhieuNhap} className="h-11 px-6 rounded-xl font-bold text-slate-600 hover:text-indigo-600 transition-all flex items-center gap-2">Làm mới</Button>
          </div>
        </div>
      </div>

      {showLowStockBanner && (
        <div className="mb-8">
          <Alert
            className="rounded-[1.5rem] border-orange-100 bg-orange-50 p-4"
            message={<span className="text-sm font-black text-orange-800 uppercase tracking-tight">Cảnh báo tồn kho thấp</span>}
            description={
              <div className="mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-xs font-medium text-orange-700">Có {lowStock.length} mặt hàng đã chạm ngưỡng tối thiểu. Cần bổ sung ngay để duy trì hoạt động kinh doanh.</p>
                <div className="flex gap-2">
                  <Button size="small" className="rounded-lg font-bold border-orange-200 text-orange-700" onClick={() => setShowLowStockDetails(!showLowStockDetails)}>{showLowStockDetails ? 'Ẩn bớt' : 'Xem chi tiết'}</Button>
                  <Button type="primary" size="small" className="rounded-lg bg-orange-500 border-0 font-bold" onClick={() => createReceiptFromLowStock(lowStock)}>Nhập hàng ngay</Button>
                </div>
              </div>
            }
          />
          {showLowStockDetails && (
            <div className="mt-4 bg-white rounded-2xl border border-orange-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <Table dataSource={lowStock} rowKey="MaSP" pagination={false} size="small" className="modern-table">
                <Column title="ID" dataIndex="MaSP" width={80} render={v => <span className="font-bold text-slate-400">#{v}</span>} />
                <Column title="TÊN SẢN PHẨM" dataIndex="TenSP" render={t => <span className="font-bold text-slate-700">{t}</span>} />
                <Column title="TỒN KHO" dataIndex="SoLuong" align="center" render={s => <Tag color="orange" className="font-black m-0">{s}</Tag>} />
                <Column title="ĐỀ XUẤT NHẬP" align="center" render={(_, r) => <span className="font-black text-indigo-600">{resolveSuggestedQty(r)}</span>} />
              </Table>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table columns={columns} dataSource={phieuNhap} rowKey="MaPN" pagination={{ pageSize: 8, className: "px-8 py-6" }} className="modern-table" scroll={{ x: 800 }} />
      </div>

      <Modal open={modalVisible} title={null} onCancel={() => setModalVisible(false)} footer={null} width={1000} className="modern-modal" centered destroyOnClose>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><FileTextOutlined className="text-indigo-500" /> Lập phiếu nhập kho</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">Thiết lập thông tin nhà cung cấp và danh mục hàng nhập</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ngày lập</span>
            <span className="font-bold text-slate-700">{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={(_, all) => setFormItems(all.items || [])} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhà cung cấp đối tác</span>} name="MaNCC" rules={[{ required: true }]}>
              <Select className="h-11 modern-select" placeholder="Chọn nhà cung cấp">
                {nhaCungCap.map(ncc => <Option key={ncc.MaNCC} value={ncc.MaNCC}>{ncc.TenNCC}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Người lập phiếu</span>} name="TenTK" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined className="text-slate-400" />} className="h-11 rounded-xl font-bold" />
            </Form.Item>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Danh mục hàng hóa</h4>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase">Lợi nhuận mục tiêu:</span>
                <div className="flex items-center gap-2">
                  <InputNumber min={0} max={100} value={tyLeLoi} onChange={setTyLeLoi} className="w-16 border-0 shadow-none font-black text-indigo-600" />
                  <span className="text-xs font-black text-indigo-600">%</span>
                </div>
              </div>
            </div>

            <Form.List name="items" initialValue={[{}]}>
              {(fields, { add, remove }) => (
                <div className="space-y-4">
                  {fields.map(({ key, name, ...rest }) => (
                    <div key={key} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group animate-in zoom-in-95 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-4">
                          <Form.Item {...rest} name={[name, 'MaSP']} label={<span className="text-[9px] font-black text-slate-400 uppercase">Sản phẩm</span>} rules={[{ required: true }]} className="m-0">
                            <Select showSearch className="h-10" placeholder="Chọn SP" onChange={(v) => {
                              const sp = sanPham.find(s => s.MaSP === v);
                              const items = form.getFieldValue('items');
                              items[name] = { ...items[name], TenSP: sp?.TenSP || '', DonGiaNhap: Number(sp?.DonGia || 0) };
                              form.setFieldsValue({ items });
                            }}>
                              {sanPham.map(s => <Option key={s.MaSP} value={s.MaSP}>{s.MaSP} - {s.TenSP}</Option>)}
                            </Select>
                          </Form.Item>
                        </div>
                        <div className="md:col-span-2">
                          <Form.Item {...rest} name={[name, 'SoLuong']} label={<span className="text-[9px] font-black text-slate-400 uppercase">Số lượng</span>} rules={[{ required: true }]} className="m-0">
                            <InputNumber min={1} className="w-full h-10 rounded-lg flex items-center font-bold" />
                          </Form.Item>
                        </div>
                        <div className="md:col-span-3">
                          <Form.Item {...rest} name={[name, 'DonGiaNhap']} label={<span className="text-[9px] font-black text-slate-400 uppercase">Giá nhập gốc</span>} rules={[{ required: true }]} className="m-0">
                            <InputNumber min={0} className="w-full h-10 rounded-lg flex items-center font-bold" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                          </Form.Item>
                        </div>
                        <div className="md:col-span-2">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Giá bán dự kiến</span>
                            <div className="h-10 px-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center font-black text-emerald-600 text-sm">
                              {calculateGiaBan(formItems[name]?.DonGiaNhap, tyLeLoi).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <Button danger type="text" shape="circle" icon={<CloseCircleFilled />} onClick={() => remove(name)} disabled={fields.length === 1} className="opacity-40 hover:opacity-100" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add({})} block className="h-12 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:text-indigo-500 hover:border-indigo-500 font-bold flex items-center justify-center gap-2"><PlusOutlined /> Thêm sản phẩm nhập</Button>
                </div>
              )}
            </Form.List>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Tổng tiền nhập</span>
                <span className="text-xl font-black text-rose-500">{calculateTotalNhap(formItems).toLocaleString()} đ</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Doanh thu dự kiến</span>
                <span className="text-xl font-black text-emerald-500">{calculateTotalBan(formItems, tyLeLoi).toLocaleString()} đ</span>
              </div>
              <div className="bg-indigo-600 p-5 rounded-2xl shadow-lg shadow-indigo-100">
                <span className="text-[10px] font-black text-indigo-200 uppercase block mb-1">Lợi nhuận gộp (+{tyLeLoi}%)</span>
                <span className="text-xl font-black text-white">{(calculateTotalBan(formItems, tyLeLoi) - calculateTotalNhap(formItems)).toLocaleString()} đ</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-8">
            <Button onClick={() => setModalVisible(false)} className="h-12 px-8 rounded-2xl font-bold border-slate-200">Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" className="h-12 px-12 rounded-2xl font-black uppercase tracking-widest text-xs bg-indigo-600 border-0 shadow-lg shadow-indigo-100">Xác nhận nhập kho</Button>
          </div>
        </Form>
      </Modal>

      <Modal title={null} open={chiTietVisible} onCancel={() => setChiTietVisible(false)} footer={null} width={850} className="modern-modal" centered destroyOnClose>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><span className="material-icons text-indigo-500">receipt_long</span> Chi tiết phiếu nhập</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">Mã phiếu: #PN{String(selectedPhieu?.MaPN).padStart(3, '0')}</p>
          </div>
          <Tag color="indigo" className="m-0 px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest">Đã hoàn thành</Tag>
        </div>

        {selectedPhieu && (
          <div className="space-y-8">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm"><CarOutlined /></div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhà cung cấp</h4>
                  <p className="text-lg font-black text-slate-800 mt-0.5">{selectedPhieu.TenNCC}</p>
                  <p className="text-xs text-slate-500 font-medium">{selectedPhieu.DiaChi}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm"><UserOutlined /></div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Người tiếp nhận</h4>
                  <p className="text-lg font-black text-slate-800 mt-0.5">{selectedPhieu.TenNV || 'Hệ thống'}</p>
                  <p className="text-xs text-slate-500 font-medium">Mã NV: {selectedPhieu.MaNV || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden">
              <Table dataSource={selectedPhieu.items} rowKey="MaSP" pagination={false} size="small" className="modern-table">
                <Column title="SẢN PHẨM" key="name" render={(_, r) => (
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{r.TenSP}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: #{r.MaSP}</span>
                  </div>
                )} />
                <Column title="SL" dataIndex="SoLuong" align="center" render={v => <span className="font-black text-slate-700">{v}</span>} />
                <Column title="GIÁ NHẬP" dataIndex="DonGiaNhap" align="right" render={v => <span className="font-black text-slate-700">{Number(v).toLocaleString()} đ</span>} />
                <Column title="THÀNH TIỀN" align="right" render={(_, r) => <span className="font-black text-indigo-600">{(Number(r.SoLuong) * Number(r.DonGiaNhap)).toLocaleString()} đ</span>} />
              </Table>
            </div>

            <div className="flex justify-end p-8 bg-indigo-600 rounded-[2.5rem] text-white">
              <div className="text-right">
                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Tổng giá trị phiếu nhập</span>
                <div className="text-4xl font-black mt-1">{Number(selectedPhieu.TongTien).toLocaleString()} <span className="text-xl">đ</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #94a3b8 !important; font-size: 11px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; padding: 20px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .modern-table .ant-table-tbody > tr > td { padding: 16px 24px !important; border-bottom: 1px solid #f8fafc !important; }
        .modern-modal .ant-modal-content { border-radius: 40px !important; padding: 40px !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important; }
        .modern-select .ant-select-selector { border-radius: 12px !important; height: 44px !important; display: flex !important; align-items: center !important; background: #f8fafc !important; border-color: #f1f5f9 !important; }
      `}} />
    </div>
  );
};

export default NhapHang;
