import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { 
  Table, 
  Button, 
  Modal, 
  Input, 
  Select, 
  Tag, 
  Avatar, 
  Card, 
  Statistic, 
  Tooltip, 
  message, 
  Timeline
} from 'antd';
import { 
  InboxOutlined, 
  SyncOutlined, 
  SearchOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  CarOutlined, 
  EyeOutlined,
  HistoryOutlined,
  DollarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;

const STATUS_LABELS = {
  da_bao_cao: { text: 'Đã báo cáo', color: 'orange', icon: <HistoryOutlined /> },
  dang_van_chuyen: { text: 'Đang vận chuyển', color: 'blue', icon: <CarOutlined /> },
  da_nhan: { text: 'Đã nhận', color: 'green', icon: <CheckCircleOutlined /> },
  chap_thuan: { text: 'Chấp thuận', color: 'green', icon: <CheckCircleOutlined /> },
  da_hoan_tien: { text: 'Đã hoàn tiền', color: 'purple', icon: <DollarOutlined /> },
  tu_choi: { text: 'Từ chối', color: 'red', icon: <CloseCircleOutlined /> },
  huy: { text: 'Hủy', color: 'gray', icon: <CloseCircleOutlined /> },
};

const ReturnManagement = () => {
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [detailModal, setDetailModal] = useState(false);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const params = { trang_thai: statusFilter === 'all' ? undefined : statusFilter };
      const { data } = await api.get(`/tra-hang`, { params });
      setReturnsList(Array.isArray(data) ? data : []);
    } catch (err) { message.error('Lỗi tải danh sách trả hàng'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/tra-hang/${id}`);
      setSelectedReturn(data);
      setDetailModal(true);
    } catch (err) { message.error('Không thể tải chi tiết'); }
  };

  const handleAction = async (id, action, opts = {}) => {
    try {
      const payload = { action, ...opts };
      await api.put(`/tra-hang/${id}/action`, payload);
      message.success('Đã cập nhật trạng thái');
      fetchReturns();
      if (selectedReturn) openDetail(id);
    } catch (err) { message.error(err.response?.data?.error || 'Lỗi xử lý'); }
  };

  const columns = [
    {
      title: 'YÊU CẦU',
      dataIndex: 'id',
      key: 'id',
      fixed: 'left',
      width: 150,
      render: (id) => <span className="font-black text-slate-400">#RTN{String(id).padStart(3, '0')}</span>
    },
    {
      title: 'ĐƠN HÀNG',
      dataIndex: 'ma_don_hang',
      key: 'order',
      width: 120,
      render: (t) => <Tag className="m-0 font-black text-[10px] rounded-lg">ĐƠN #{t}</Tag>
    },
    {
      title: 'NGƯỜI TẠO',
      dataIndex: 'nguoi_tao',
      key: 'creator',
      width: 200,
      render: (t, r) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700">{t || r.loai_nguoi_tao}</span>
          <span className="text-[9px] font-black text-slate-400 uppercase">{r.loai_nguoi_tao}</span>
        </div>
      )
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'trang_thai',
      key: 'status',
      width: 150,
      render: (v) => {
        const c = STATUS_LABELS[v] || { text: v, color: 'default' };
        return <Tag color={c.color} icon={c.icon} className="font-black text-[10px] rounded-full px-3">{c.text.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'NGÀY TẠO',
      dataIndex: 'created_at',
      key: 'date',
      width: 150,
      render: (v) => <span className="text-xs font-bold text-slate-500 uppercase">{moment(v).format('DD/MM/YYYY')}</span>
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Chi tiết">
            <Button className="w-10 h-10 rounded-xl flex items-center justify-center border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all" icon={<EyeOutlined />} onClick={() => openDetail(record.id)} />
          </Tooltip>
          {['da_bao_cao', 'dang_van_chuyen'].includes(record.trang_thai) && (
            <Tooltip title="Phê duyệt">
              <Button type="primary" className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 border-0" icon={<CheckCircleOutlined />} onClick={() => handleAction(record.id, 'chap_thuan', { restock: true })} />
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <InboxOutlined className="text-indigo-500" />
            Quản lý Trả hàng
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-tighter">Tiếp nhận và xử lý hàng lỗi/hoàn trả</p>
        </div>
        
        <div className="flex gap-3">
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchReturns} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border-0 shadow-sm text-slate-600" />
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
            <SearchOutlined className="text-slate-400 ml-2" />
            <Input placeholder="Tìm kiếm nhanh..." className="border-0 shadow-none font-bold w-48" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-[2.5rem] border-0 shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative overflow-hidden">
          <Statistic title={<span className="text-[10px] font-black text-indigo-100 uppercase">Tổng yêu cầu</span>} value={returnsList.length} valueStyle={{ color: 'white', fontWeight: 900 }} prefix={<InboxOutlined />} />
          <InboxOutlined className="absolute -right-4 -bottom-4 text-8xl text-white/10" />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm">
          <Statistic title={<span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Đang chờ xử lý</span>} value={returnsList.filter(r => r.trang_thai === 'da_bao_cao').length} valueStyle={{ fontWeight: 900, color: '#f59e0b' }} prefix={<ClockCircleOutlined />} />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm">
          <Statistic title={<span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Đang vận chuyển</span>} value={returnsList.filter(r => r.trang_thai === 'dang_van_chuyen').length} valueStyle={{ fontWeight: 900, color: '#3b82f6' }} prefix={<CarOutlined />} />
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-sm">
          <Statistic title={<span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Đã chấp thuận</span>} value={returnsList.filter(r => ['chap_thuan', 'da_hoan_tien'].includes(r.trang_thai)).length} valueStyle={{ fontWeight: 900, color: '#10b981' }} prefix={<CheckCircleOutlined />} />
        </Card>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bộ lọc trạng thái:</span>
            <Select className="w-48 modern-select border-0 shadow-none bg-transparent" value={statusFilter} onChange={setStatusFilter}>
              <Option value="all">TẤT CẢ PHIẾU</Option>
              {Object.keys(STATUS_LABELS).map(k => <Option key={k} value={k}>{STATUS_LABELS[k].text.toUpperCase()}</Option>)}
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table columns={columns} dataSource={returnsList.filter(r => r.ma_don_hang?.toString().includes(searchTerm) || r.nguoi_tao?.toLowerCase().includes(searchTerm.toLowerCase()))} rowKey="id" loading={loading} pagination={{ pageSize: 8, className: "px-8 py-6" }} className="modern-table" scroll={{ x: 1000 }} />
      </div>

      <Modal open={detailModal} onCancel={() => setDetailModal(false)} footer={null} width={900} className="modern-modal" centered title={null}>
        {selectedReturn && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><InboxOutlined /></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Chi tiết Yêu cầu Trả hàng</h2>
                  <p className="text-slate-400 text-sm mt-1 font-medium uppercase tracking-tight">Mã phiếu: #RTN{selectedReturn.id} • Đơn hàng: #{selectedReturn.ma_don_hang}</p>
                </div>
              </div>
              <Tag color={STATUS_LABELS[selectedReturn.trang_thai]?.color} className="font-black px-4 py-1 rounded-full">{STATUS_LABELS[selectedReturn.trang_thai]?.text.toUpperCase()}</Tag>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Lý do từ khách hàng</span>
                  <div className="flex items-start gap-3">
                    <HistoryOutlined className="text-slate-300 mt-1" />
                    <p className="text-sm font-medium text-slate-600 italic">"{selectedReturn.ly_do}"</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 ml-1">Danh sách mặt hàng hoàn trả</span>
                  <div className="space-y-3">
                    {(() => {
                      const items = Array.isArray(selectedReturn.mat_hang) ? selectedReturn.mat_hang : (typeof selectedReturn.mat_hang === 'string' ? JSON.parse(selectedReturn.mat_hang) : []);
                      return items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-4">
                            <Avatar size={50} src={it.hinh_anh || it.HinhAnh} className="rounded-xl border border-slate-50" icon={<InboxOutlined />} />
                            <div>
                              <div className="font-black text-slate-800 text-sm">{it.ten_san_pham || it.TenSP}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SL: {it.so_luong || 1}</div>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-6">Lịch sử xử lý</span>
                  <Timeline 
                    mode="left"
                    items={(selectedReturn.history || []).map(h => ({
                      color: 'indigo',
                      children: (
                        <div className="pb-4">
                          <div className="text-[10px] font-black text-indigo-600 uppercase mb-1">{moment(h.created_at).format('DD/MM/YYYY HH:mm')}</div>
                          <div className="text-xs font-bold text-slate-700">{h.trang_thai_moi === 'chap_thuan' ? 'ĐÃ CHẤP THUẬN' : h.trang_thai_moi.toUpperCase()}</div>
                          {h.ghi_chu && <div className="text-[10px] text-slate-400 font-medium italic mt-1">{h.ghi_chu}</div>}
                        </div>
                      )
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
              <Button onClick={() => setDetailModal(false)} className="h-12 px-8 rounded-2xl font-bold border-slate-200">Đóng</Button>
              {['da_bao_cao', 'dang_van_chuyen'].includes(selectedReturn.trang_thai) && (
                <>
                  <Button danger className="h-12 px-8 rounded-2xl font-black text-xs uppercase" onClick={() => handleAction(selectedReturn.id, 'tu_choi')}>Từ chối</Button>
                  <Button type="primary" className="h-12 px-12 rounded-2xl font-black text-xs uppercase bg-emerald-600 border-0 shadow-lg" onClick={() => handleAction(selectedReturn.id, 'chap_thuan', { restock: true })}>Chấp thuận & Nhập kho</Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #94a3b8 !important; font-size: 11px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; padding: 20px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .modern-table .ant-table-tbody > tr > td { padding: 16px 24px !important; border-bottom: 1px solid #f8fafc !important; }
        .modern-modal .ant-modal-content { border-radius: 40px !important; padding: 40px !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important; }
        .modern-select .ant-select-selector { border-radius: 12px !important; border: 0 !important; box-shadow: none !important; font-weight: 900 !important; text-transform: uppercase !important; font-size: 10px !important; }
      `}} />
    </div>
  );
};

export default ReturnManagement;
