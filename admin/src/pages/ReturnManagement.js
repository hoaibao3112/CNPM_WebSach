import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/ReturnManagement.css';


const STATUS_LABELS = {
  da_bao_cao: { text: 'Đã báo cáo', color: 'orange' },
  dang_van_chuyen: { text: 'Đang vận chuyển', color: 'blue' },
  da_nhan: { text: 'Đã nhận', color: 'green' },
  chap_thuan: { text: 'Chấp thuận', color: 'green' },
  da_hoan_tien: { text: 'Đã hoàn tiền', color: 'purple' },
  tu_choi: { text: 'Từ chối', color: 'red' },
  huy: { text: 'Hủy', color: 'gray' },
};

const ReturnManagement = () => {
  const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showReceiveConfirm, setShowReceiveConfirm] = useState(false);
  const [receiveOptions, setReceiveOptions] = useState({ restock: true, so_tien_hoan: '', phuong_thuc_hoan: '' });

  useEffect(() => {
    fetchReturns();
    // eslint-disable-next-line
  }, [currentPage, statusFilter]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, pageSize };
      if (statusFilter !== 'all') params.trang_thai = statusFilter;
  const { data } = await axios.get(`${API}/api/tra-hang`, { params });
      setReturnsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách trả hàng', err?.response?.data || err.message);
      setReturnsList([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id) => {
    try {
      setProcessing(true);
  const { data } = await axios.get(`${API}/api/tra-hang/${id}`);
      // Debug: log raw attachments and normalized attachments so we can see what frontend receives
      console.log('[ReturnManagement] openDetail loaded id=', id, 'raw tep_dinh_kem=', data.tep_dinh_kem);
      try {
        console.log('[ReturnManagement] normalized attachments=', parseAttachments(data));
      } catch (e) {
        console.error('[ReturnManagement] parseAttachments error', e);
      }
      setSelectedReturn(data);
      setShowModal(true);
    } catch (err) {
      alert('Không thể tải chi tiết yêu cầu: ' + (err?.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setSelectedReturn(null);
    setShowModal(false);
  };

  const handleAction = async (id, action, opts = {}) => {
    if (!window.confirm('Bạn có chắc muốn ' + action + ' yêu cầu này?')) return;
    try {
      setProcessing(true);
      const payload = { action, ...opts };
  const { data } = await axios.put(`${API}/api/tra-hang/${id}/action`, payload);
      alert('Cập nhật trạng thái: ' + (data.trang_thai || action));
      // refresh list and detail
      await fetchReturns();
      if (selectedReturn && selectedReturn.id === id) openDetail(id);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái', err?.response?.data || err.message);
      alert('Lỗi: ' + (err?.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const onReceiveClick = () => {
    // open a small confirmation area to choose next steps
    setShowReceiveConfirm(true);
  };

  const submitReceiveMark = async (mode = 'mark') => {
    // mode: 'mark' => just da_nhan; 'approve' => chap_thuan with options
    if (!selectedReturn) return;
    try {
      setProcessing(true);
      if (mode === 'mark') {
        await handleAction(selectedReturn.id, 'da_nhan');
      } else if (mode === 'approve') {
        const opts = {
          restock: !!receiveOptions.restock,
          so_tien_hoan: receiveOptions.so_tien_hoan || null,
          phuong_thuc_hoan: receiveOptions.phuong_thuc_hoan || null,
          ghi_chu: `Đã nhận hàng — ${receiveOptions.phuong_thuc_hoan || ''}`
        };
        await handleAction(selectedReturn.id, 'chap_thuan', opts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
      setShowReceiveConfirm(false);
    }
  };

  const filtered = returnsList.filter((r) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const hay = `${r.id || ''} ${r.ma_don_hang || ''} ${r.nguoi_tao || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // summary
  const summary = returnsList.reduce(
    (acc, r) => {
      acc.total += 1;
      const st = r.trang_thai;
      if (st === 'da_bao_cao' || st === 'dang_van_chuyen') acc.pending += 1;
      if (st === 'chap_thuan' || st === 'da_hoan_tien') acc.approved += 1;
      if (st === 'tu_choi') acc.rejected += 1;
      return acc;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0 }
  );

  const getMatHangCount = (r) => {
    if (!r) return '';
    const arr = parseMatHang(r);
    return Array.isArray(arr) ? arr.length : '';
  };

  // Helper: safely obtain mat_hang as an array from a record
  const parseMatHang = (r) => {
    if (!r) return [];
    const v = r.mat_hang;
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // try to handle single-item JSON-like string (fallback)
        return [];
      }
    }
    return [];
  };

  // Helper: normalize tep_dinh_kem into an array of attachment objects { url, isImage, label }
  const parseAttachments = (r) => {
    if (!r) return [];
    let atts = r.tep_dinh_kem || r.tepDinhKem || r.attachments || null;
    const normalize = (item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        const raw = item.trim();
        const url = raw.startsWith('/') ? `${API}${raw}` : raw;
        const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(raw);
        return { url, isImage, label: raw.split('/').pop() };
      }
      if (typeof item === 'object') {
        // try common fields
        const p = item.path || item.url || item.file || item.link || item.location || item.filepath;
        const name = item.name || item.filename || item.fileName || item.label || '';
        if (p) {
          const raw = ('' + p).trim();
          const url = raw.startsWith('/') ? `${API}${raw}` : raw;
          const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(raw);
          return { url, isImage, label: name || raw.split('/').pop() };
        }
        // fallback: stringify
        return { url: JSON.stringify(item), isImage: false, label: name || 'file' };
      }
      return null;
    };

    if (!atts) return [];
    // If it's already an array
    if (Array.isArray(atts)) {
      return atts.map(normalize).filter(Boolean);
    }
    // If it's an object (single attachment stored as object)
    if (typeof atts === 'object') {
      const a = normalize(atts);
      return a ? [a] : [];
    }
    // If it's a string: try JSON parse, otherwise split by common separators
    if (typeof atts === 'string') {
      const s = atts.trim();
      // Try JSON
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map(normalize).filter(Boolean);
        if (typeof parsed === 'object') {
          const a = normalize(parsed);
          return a ? [a] : [];
        }
      } catch (e) {
        // not JSON, try separators
        const parts = s.split(/[,;|\n]+/).map((p) => p.trim()).filter(Boolean);
        if (parts.length > 1) return parts.map(normalize).filter(Boolean);
        // single token string -- treat as one url/path
        return [normalize(s)].filter(Boolean);
      }
    }
    return [];
  };

  return (
    <div className="return-page">
      <div className="container">
        <div className="return-header">
          <div className="header-content">
            <div className="header-left">
              <h1>Quản lý trả hàng</h1>
              <p className="subtitle">Xem, xử lý và theo dõi các yêu cầu trả hàng từ khách</p>
            </div>
            <div className="header-actions">
              <div className="filter-controls">
                <div className="search-box">
                  <input
                    className="search-input"
                    placeholder="Tìm theo mã đơn / id / người tạo"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">Tất cả trạng thái</option>
                  {Object.keys(STATUS_LABELS).map((k) => (
                    <option key={k} value={k}>{STATUS_LABELS[k].text}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="summary-section">
            <div className="summary-cards">
              <div className="summary-card total-card">
                <div className="card-icon">📦</div>
                <div className="card-content">
                  <h3>{summary.total}</h3>
                  <p>Tổng yêu cầu</p>
                </div>
              </div>
              <div className="summary-card pending-card">
                <div className="card-icon">⏳</div>
                <div className="card-content">
                  <h3>{summary.pending}</h3>
                  <p>Đang chờ xử lý</p>
                </div>
              </div>
              <div className="summary-card success-card">
                <div className="card-icon">✅</div>
                <div className="card-content">
                  <h3>{summary.approved}</h3>
                  <p>Đã chấp thuận</p>
                </div>
              </div>
              <div className="summary-card failed-card">
                <div className="card-icon">❌</div>
                <div className="card-content">
                  <h3>{summary.rejected}</h3>
                  <p>Đã từ chối</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-body">
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <div>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mã đơn</th>
                  <th>Người tạo</th>
                  <th>Số mặt hàng</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice((currentPage-1)*pageSize, currentPage*pageSize).map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.ma_don_hang}</td>
                    <td>{r.nguoi_tao || r.loai_nguoi_tao}</td>
                    <td>{getMatHangCount(r)}</td>
                    <td>
                      <span className={`badge badge-${r.trang_thai || 'unknown'}`} style={{ background: STATUS_LABELS[r.trang_thai]?.color || '#ccc' }}>
                        {STATUS_LABELS[r.trang_thai]?.text || r.trang_thai}
                      </span>
                    </td>
                    <td>{new Date(r.created_at || r.createdAt || Date.now()).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-light" onClick={() => openDetail(r.id)}>Chi tiết</button>
                      {r.trang_thai !== 'chap_thuan' && r.trang_thai !== 'da_hoan_tien' && (
                        <button className="btn btn-accept" onClick={() => handleAction(r.id, 'chap_thuan', { restock: true })} disabled={processing}>Chấp thuận</button>
                      )}
                      {r.trang_thai !== 'tu_choi' && (
                        <button className="btn btn-reject" onClick={() => handleAction(r.id, 'tu_choi')} disabled={processing}>Từ chối</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p-1))} disabled={currentPage===1}>Prev</button>
              <span>Trang {currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>Next</button>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedReturn && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="panel">
              <div className="title-pill">Chi tiết yêu cầu trả hàng #{selectedReturn.id} <button className="close" onClick={closeModal}>×</button></div>
              <div className="modal-header"><h3 /></div>
              <div className="modal-body">
                <div className="content">
                  <p className="meta"><strong>Mã đơn:</strong> {selectedReturn.ma_don_hang}</p>
                  <p className="meta"><strong>Người tạo:</strong> {selectedReturn.nguoi_tao} ({selectedReturn.loai_nguoi_tao})</p>
                  <p className="meta"><strong>Lý do:</strong> {selectedReturn.ly_do}</p>
                  <p className="meta"><strong>Trạng thái:</strong> {STATUS_LABELS[selectedReturn.trang_thai]?.text || selectedReturn.trang_thai}</p>

                  <h4>Danh sách mặt hàng</h4>
                  <ul className="items-list">
                    {parseMatHang(selectedReturn).map((it, idx) => {
                      // determine display name and image
                      const name = it.ten_san_pham || it.TenSP || it.name || it.MaSP || it.productId || 'Sản phẩm không rõ';
                      // HinhAnh or hinh_anh may be a relative path stored like 'img/products/...' or '/img/products/...'
                      let img = it.hinh_anh || it.HinhAnh || it.image || null;
                      if (img) {
                        const raw = ('' + img).trim();
                        if (/^https?:\/\//i.test(raw)) {
                          img = raw; // absolute URL
                        } else if (raw.startsWith('/')) {
                          img = raw; // relative to frontend origin, keep leading slash
                        } else if (raw.toLowerCase().includes('img/products')) {
                          // make sure it starts with a slash
                          img = '/' + raw.replace(/^\/+/, '');
                        } else {
                          // assume filename or partial path stored in DB, point to public products folder
                          img = `/img/products/${raw.split('/').pop()}`;
                        }
                      }

                      return (
                        <li key={idx} className="item-row">
                          <div className="item-thumb">
                            {img ? (
                              <img src={img} alt={name} className="item-thumb-img" />
                            ) : (
                              <div className="item-thumb-placeholder">No Image</div>
                            )}
                          </div>
                          <div className="item-meta">
                            <div className="item-name">{name}</div>
                            <div className="item-qty">SL: {it.so_luong || it.qty || 1}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {(() => {
                    const norm = parseAttachments(selectedReturn);
                    if (Array.isArray(norm) && norm.length > 0) {
                      return (
                        <>
                          <h4>File đính kèm (ảnh khách gửi)</h4>
                          <div className="attachments">
                            <div className="attachment-grid">
                              {norm.map((a, i) => (
                                <div key={i} className="attachment-item">
                                  {a.isImage ? (
                                    <a href={a.url} target="_blank" rel="noreferrer">
                                      <img src={a.url} alt={a.label || `Đính kèm ${i+1}`} className="attachment-thumb" />
                                    </a>
                                  ) : (
                                    <a className="attachment-link" href={a.url} target="_blank" rel="noreferrer">{a.label || `Tệp ${i+1}`}</a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}

                  <h4>Lịch sử</h4>
                  <ul>
                    {(selectedReturn.history || []).map((h) => (
                      <li key={h.id || Math.random()}>{new Date(h.created_at || h.createdAt || Date.now()).toLocaleString()} — {h.trang_thai_cu} → {h.trang_thai_moi} — {h.ghi_chu || ''}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="modal-actions-floating">
                {selectedReturn.trang_thai !== 'chap_thuan' && (
                  <button className="btn btn-accept" onClick={() => handleAction(selectedReturn.id, 'chap_thuan', { restock: true })} disabled={processing}>Chấp thuận & Restock</button>
                )}

                {/* If the package is currently in transit, allow admin to mark as received */}
                {selectedReturn.trang_thai === 'dang_van_chuyen' && (
                  <>
                    <button className="btn btn-light" onClick={onReceiveClick} disabled={processing}>Xác nhận đã nhận</button>
                    {showReceiveConfirm && (
                      <div className="receive-confirm" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="checkbox" checked={receiveOptions.restock} onChange={(e) => setReceiveOptions(s => ({ ...s, restock: e.target.checked }))} /> Restock
                        </label>
                        <input type="number" placeholder="Số tiền hoàn (nếu có)" value={receiveOptions.so_tien_hoan} onChange={(e) => setReceiveOptions(s => ({ ...s, so_tien_hoan: e.target.value }))} style={{ minWidth: 140 }} />
                        <select value={receiveOptions.phuong_thuc_hoan} onChange={(e) => setReceiveOptions(s => ({ ...s, phuong_thuc_hoan: e.target.value }))}>
                          <option value="">Phương thức hoàn</option>
                          <option value="tien_mat">Tiền mặt</option>
                          <option value="chuyen_khoan">Chuyển khoản</option>
                        </select>
                        <button className="btn btn-accept" onClick={() => submitReceiveMark('approve')} disabled={processing}>Chấp thuận (sau nhận)</button>
                        <button className="btn btn-light" onClick={() => submitReceiveMark('mark')} disabled={processing}>Chỉ đánh dấu đã nhận</button>
                      </div>
                    )}
                  </>
                )}
                {selectedReturn.trang_thai !== 'tu_choi' && (
                  <button className="btn btn-reject" onClick={() => handleAction(selectedReturn.id, 'tu_choi')} disabled={processing}>Từ chối</button>
                )}
                <button className="btn btn-light" onClick={closeModal}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default ReturnManagement;
