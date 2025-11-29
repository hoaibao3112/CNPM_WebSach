import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/RefundManagement.css';

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [viewMode, setViewMode] = useState('card');
  const [showModal, setShowModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refundsPerPage] = useState(10);
  const [summary, setSummary] = useState({
    total: 0,
    totalAmount: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    rejected: 0
  });
  const [processForm, setProcessForm] = useState({
    action: '',
    adminReason: '',
    actualRefundAmount: '',
    transactionId: ''
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, [currentPage, statusFilter]);

  // ✅ CẬP NHẬT API CALL - SỬ DỤNG API MỚI
  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/orders/refund-requests/admin', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        params: {
          status: statusFilter,
          page: currentPage,
          limit: refundsPerPage
        }
      });
      
      if (response.data.success) {
        setRefunds(response.data.data);
        setSummary(response.data.summary);
      } else {
        console.error('API response error:', response.data.error);
        setRefunds([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách hoàn tiền:', error);
      setRefunds([]);
      
      // Hiển thị thông báo lỗi chi tiết hơn
      if (error.response?.status === 403) {
        alert('Bạn không có quyền truy cập trang này!');
      } else if (error.response?.status === 401) {
        alert('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!');
        // Có thể redirect về trang login
      } else {
        alert('Lỗi khi tải dữ liệu: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ THÊM FUNCTION XỬ LÝ YÊU CẦU HOÀN TIỀN
  const handleProcessRefund = async () => {
    if (!processForm.action) {
      alert('Vui lòng chọn hành động!');
      return;
    }

    if (processForm.action === 'complete' && !processForm.transactionId) {
      alert('Vui lòng nhập mã giao dịch chuyển tiền!');
      return;
    }

    try {
      setProcessing(true);
      const response = await axios.put(
        `http://localhost:5000/api/orders/refund-requests/${selectedRefund.id}/process`,
        processForm,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(response.data.message);
        setShowProcessModal(false);
        setProcessForm({
          action: '',
          adminReason: '',
          actualRefundAmount: '',
          transactionId: ''
        });
        fetchRefunds(); // Refresh data
      } else {
        alert('Lỗi: ' + response.data.error);
      }
    } catch (error) {
      console.error('Lỗi khi xử lý hoàn tiền:', error);
      alert('Có lỗi xảy ra: ' + (error.response?.data?.error || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (refund) => {
    setSelectedRefund(refund);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRefund(null);
  };

  const openProcessModal = (refund, action) => {
    setSelectedRefund(refund);
    setProcessForm({
      action,
      adminReason: '',
      actualRefundAmount: refund.refundAmount,
      transactionId: ''
    });
    setShowProcessModal(true);
  };

  const closeProcessModal = () => {
    setShowProcessModal(false);
    setSelectedRefund(null);
    setProcessForm({
      action: '',
      adminReason: '',
      actualRefundAmount: '',
      transactionId: ''
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTimeFilter('all');
    setAmountFilter('all');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  const exportReport = () => {
    // Tạo CSV data
    const csvData = refunds.map(refund => ({
      'Mã giao dịch': refund.refundRequestId,
      'Mã đơn hàng': refund.orderId,
      'Khách hàng': refund.customerName,
      'Số điện thoại': refund.customerPhone,
      'Số tiền hoàn': refund.refundAmount,
      'Lý do': refund.refundReason,
      'Trạng thái': refund.statusDisplay,
      'Ngày tạo': formatDate(refund.createdAt),
      'Ngày xử lý': refund.processedAt ? formatDate(refund.processedAt) : 'Chưa xử lý'
    }));

    // Convert to CSV string
    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refund_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter và sort logic - CẬP NHẬT
  const filteredAndSortedRefunds = () => {
    let filtered = refunds.filter(refund => {
      const matchesSearch = searchTerm === '' || 
        refund.orderId?.toString().includes(searchTerm) ||
        refund.refundRequestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.customerPhone?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || refund.status === statusFilter;
      
      const matchesTime = timeFilter === 'all' || (() => {
        const createdDate = new Date(refund.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        
        switch(timeFilter) {
          case '7d': return diffDays <= 7;
          case '30d': return diffDays <= 30;
          case '3m': return diffDays <= 90;
          default: return true;
        }
      })();
      
      const matchesAmount = amountFilter === 'all' || (() => {
        const amount = parseFloat(refund.refundAmount);
        switch(amountFilter) {
          case '0-100k': return amount < 100000;
          case '100k-500k': return amount >= 100000 && amount < 500000;
          case '500k-1m': return amount >= 500000 && amount < 1000000;
          case '1m+': return amount >= 1000000;
          default: return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesTime && matchesAmount;
    });

    // Sort
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'amount-desc':
          return parseFloat(b.refundAmount) - parseFloat(a.refundAmount);
        case 'amount-asc':
          return parseFloat(a.refundAmount) - parseFloat(b.refundAmount);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const paginatedRefunds = () => {
    const filtered = filteredAndSortedRefunds();
    const startIndex = (currentPage - 1) * refundsPerPage;
    return filtered.slice(startIndex, startIndex + refundsPerPage);
  };

  const totalPages = Math.ceil(filteredAndSortedRefunds().length / refundsPerPage);

  // ✅ CẬP NHẬT STATUS MAPPING CHO API MỚI
  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { text: 'Chờ xử lý', class: 'status-pending' },
      'PROCESSING': { text: 'Đang xử lý', class: 'status-processing' },
      'COMPLETED': { text: 'Đã hoàn tiền', class: 'status-success' },
      'REJECTED': { text: 'Từ chối', class: 'status-rejected' },
      'CANCELLED': { text: 'Đã hủy', class: 'status-cancelled' }
    };
    
    const config = statusConfig[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

// ...existing code...

  if (loading) {
    return (
      <div className="refund-management-page">
        <div className="loading-state">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Đang tải danh sách hoàn tiền...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="refund-management-page">
      <div className="container">
        {/* Header Section */}
        <header className="refund-header">
          <div className="header-content">
            <div className="header-left">
              <h1><i className="fas fa-undo"></i> Quản lý hoàn tiền đơn hàng</h1>
              <p className="subtitle">Theo dõi và xử lý tất cả yêu cầu hoàn tiền VNPay</p>
            </div>
            <div className="header-actions">
              <button onClick={fetchRefunds} className="btn btn-outline" disabled={loading}>
                <i className="fas fa-sync-alt"></i> Làm mới
              </button>
              <button onClick={exportReport} className="btn btn-primary" disabled={refunds.length === 0}>
                <i className="fas fa-download"></i> Xuất báo cáo
              </button>
            </div>
          </div>
        </header>

        {/* Summary Cards - CẬP NHẬT */}
        <div className="summary-section">
          <div className="summary-cards">
            <div className="summary-card total-card">
              <div className="card-icon">
                <i className="fas fa-coins"></i>
              </div>
              <div className="card-content">
                <h3>{formatCurrency(summary.totalAmount || 0)}</h3>
                <p>Tổng tiền hoàn</p>
                <span className="card-trend info">
                  <i className="fas fa-chart-line"></i> {summary.total || 0} giao dịch
                </span>
              </div>
            </div>

            <div className="summary-card pending-card">
              <div className="card-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="card-content">
                <h3>{summary.pending || 0}</h3>
                <p>Chờ xử lý</p>
                <span className="card-trend warning">
                  <i className="fas fa-hourglass-half"></i> Cần duyệt
                </span>
              </div>
            </div>

            <div className="summary-card processing-card">
              <div className="card-icon">
                <i className="fas fa-spinner"></i>
              </div>
              <div className="card-content">
                <h3>{summary.processing || 0}</h3>
                <p>Đang xử lý</p>
                <span className="card-trend info">
                  <i className="fas fa-cogs"></i> Đang thực hiện
                </span>
              </div>
            </div>

            <div className="summary-card success-card">
              <div className="card-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="card-content">
                <h3>{summary.completed || 0}</h3>
                <p>Đã hoàn thành</p>
                <span className="card-trend success">
                  <i className="fas fa-check"></i> Thành công
                </span>
              </div>
            </div>

            <div className="summary-card rejected-card">
              <div className="card-icon">
                <i className="fas fa-times-circle"></i>
              </div>
              <div className="card-content">
                <h3>{summary.rejected || 0}</h3>
                <p>Từ chối</p>
                <span className="card-trend error">
                  <i className="fas fa-ban"></i> Không duyệt
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - CẬP NHẬT STATUS OPTIONS */}
        <div className="filter-section">
          <div className="filter-controls">
            <div className="filter-group">
              <label>Trạng thái:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                <option value="all">Tất cả</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="PROCESSING">Đang xử lý</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="REJECTED">Từ chối</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Thời gian:</label>
              <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="filter-select">
                <option value="all">Tất cả thời gian</option>
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
                <option value="3m">3 tháng qua</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Số tiền:</label>
              <select value={amountFilter} onChange={(e) => setAmountFilter(e.target.value)} className="filter-select">
                <option value="all">Tất cả</option>
                <option value="0-100k">Dưới 100.000đ</option>
                <option value="100k-500k">100.000đ - 500.000đ</option>
                <option value="500k-1m">500.000đ - 1.000.000đ</option>
                <option value="1m+">Trên 1.000.000đ</option>
              </select>
            </div>

            <div className="search-group">
              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="Tìm theo mã đơn hàng, mã giao dịch hoặc khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button><i className="fas fa-search"></i></button>
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="btn btn-light">
              <i className="fas fa-times"></i> Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Refund List */}
        <div className="refund-list-section">
          <div className="section-header">
            <h2>Danh sách yêu cầu hoàn tiền ({filteredAndSortedRefunds().length})</h2>
            <div className="list-controls">
              <div className="view-toggle">
                <button 
                  className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                  onClick={() => setViewMode('card')}
                >
                  <i className="fas fa-th-large"></i>
                </button>
                <button 
                  className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
              <div className="sort-controls">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="date-desc">Mới nhất</option>
                  <option value="date-asc">Cũ nhất</option>
                  <option value="amount-desc">Số tiền cao</option>
                  <option value="amount-asc">Số tiền thấp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card View */}
          {viewMode === 'card' && (
            <div className="refund-list card-view">
              {paginatedRefunds().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-inbox"></i>
                  </div>
                  <h3>Chưa có yêu cầu hoàn tiền</h3>
                  <p>Chưa có yêu cầu hoàn tiền nào được tạo hoặc không khớp với bộ lọc.</p>
                </div>
              ) : (
                paginatedRefunds().map((refund) => (
                  <div key={refund.id} className="refund-card">
                    <div className="refund-card-header">
                      <div className="refund-id">
                        <strong>#{refund.refundRequestId}</strong>
                        <small>Đơn hàng: #{refund.orderId}</small>
                      </div>
                      <div className="refund-date">{formatDate(refund.createdAt)}</div>
                    </div>
                    
                    <div className="refund-amount-section">
                      <div className="refund-amount">{formatCurrency(refund.refundAmount)}</div>
                      {refund.refundType && (
                        <span className="refund-type">
                          {refund.refundType === 'full' ? 'Hoàn toàn bộ' : 'Hoàn một phần'}
                        </span>
                      )}
                    </div>
                    
                    <div className="customer-info">
                      <p><strong>Khách hàng:</strong> {refund.customerName}</p>
                      <p><strong>SĐT:</strong> {refund.customerPhone}</p>
                      {refund.customerEmail && (
                        <p><strong>Email:</strong> {refund.customerEmail}</p>
                      )}
                    </div>

                    <div className="bank-info">
                      <p><strong>Ngân hàng:</strong> {refund.bankName}</p>
                      <p><strong>Chủ TK:</strong> {refund.accountHolder}</p>
                      <p><strong>Số TK:</strong> ****{refund.bankAccount?.slice(-4)}</p>
                    </div>
                    
                    <div className="refund-reason">
                      <strong>Lý do:</strong> {refund.refundReason}
                    </div>
                    
                    <div className="refund-card-footer">
                      {getStatusBadge(refund.status)}
                      <div className="refund-actions">
                        <button 
                          className="action-btn view-btn" 
                          onClick={() => openModal(refund)}
                          title="Xem chi tiết"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        
                        {refund.status === 'PENDING' && (
                          <>
                            <button 
                              className="action-btn approve-btn" 
                              onClick={() => openProcessModal(refund, 'approve')}
                              title="Duyệt hoàn tiền"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button 
                              className="action-btn reject-btn" 
                              onClick={() => openProcessModal(refund, 'reject')}
                              title="Từ chối hoàn tiền"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        )}
                        
                        {refund.status === 'PROCESSING' && (
                          <button 
                            className="action-btn complete-btn" 
                            onClick={() => openProcessModal(refund, 'complete')}
                            title="Hoàn thành chuyển tiền"
                          >
                            <i className="fas fa-money-bill-wave"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Table View - CẬP NHẬT */}
          {viewMode === 'table' && (
            <div className="refund-table-container">
              <table className="refund-table">
                <thead>
                  <tr>
                    <th>Mã giao dịch</th>
                    <th>Đơn hàng</th>
                    <th>Khách hàng</th>
                    <th>Ngân hàng</th>
                    <th>Ngày tạo</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRefunds().map((refund) => (
                    <tr key={refund.id}>
                      <td><span className="monospace">{refund.refundRequestId}</span></td>
                      <td><span className="monospace">#{refund.orderId}</span></td>
                      <td>
                        <div>
                          <strong>{refund.customerName}</strong>
                          <br />
                          <small>{refund.customerPhone}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{refund.bankName}</strong>
                          <br />
                          <small>****{refund.bankAccount?.slice(-4)}</small>
                        </div>
                      </td>
                      <td>{formatDate(refund.createdAt)}</td>
                      <td><strong>{formatCurrency(refund.refundAmount)}</strong></td>
                      <td>{getStatusBadge(refund.status)}</td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="action-btn view-btn" 
                            onClick={() => openModal(refund)}
                            title="Xem chi tiết"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          {refund.status === 'PENDING' && (
                            <>
                              <button 
                                className="action-btn approve-btn" 
                                onClick={() => openProcessModal(refund, 'approve')}
                                title="Duyệt"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button 
                                className="action-btn reject-btn" 
                                onClick={() => openProcessModal(refund, 'reject')}
                                title="Từ chối"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </>
                          )}
                          
                          {refund.status === 'PROCESSING' && (
                            <button 
                              className="action-btn complete-btn" 
                              onClick={() => openProcessModal(refund, 'complete')}
                              title="Hoàn thành"
                            >
                              <i className="fas fa-money-bill-wave"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-section">
            <div className="pagination-info">
              <span>
                Hiển thị <strong>{((currentPage - 1) * refundsPerPage) + 1}-{Math.min(currentPage * refundsPerPage, filteredAndSortedRefunds().length)}</strong> của <strong>{filteredAndSortedRefunds().length}</strong> yêu cầu
              </span>
            </div>
            <div className="pagination-controls">
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              <div className="pagination-numbers">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                  return (
                    <button
                      key={page}
                      className={`page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* Detail Modal - CẬP NHẬT */}
        {showModal && selectedRefund && (
          <div
            className="modal portal-modal"
            style={{
              display: 'block',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(6px)'
            }}
          >
            <div className="modal-content refund-detail-content">
              <div className="modal-header">
                <h2><i className="fas fa-receipt"></i> Chi tiết yêu cầu hoàn tiền</h2>
                <button className="close-btn" onClick={closeModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="modal-body">
                {/* Transaction Info */}
                <div className="detail-section">
                  <h3><i className="fas fa-info-circle"></i> Thông tin giao dịch</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Mã yêu cầu:</label>
                      <span className="monospace">{selectedRefund.refundRequestId}</span>
                    </div>
                    <div className="detail-item">
                      <label>Mã đơn hàng:</label>
                      <span className="monospace">#{selectedRefund.orderId}</span>
                    </div>
                    <div className="detail-item">
                      <label>Loại hoàn tiền:</label>
                      <span>{selectedRefund.refundType === 'full' ? 'Hoàn toàn bộ' : 'Hoàn một phần'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Ngày tạo:</label>
                      <span>{formatDate(selectedRefund.createdAt)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Ngày xử lý:</label>
                      <span>{selectedRefund.processedAt ? formatDate(selectedRefund.processedAt) : 'Chưa xử lý'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Trạng thái:</label>
                      {getStatusBadge(selectedRefund.status)}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="detail-section">
                  <h3><i className="fas fa-user"></i> Thông tin khách hàng</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Tên khách hàng:</label>
                      <span>{selectedRefund.customerName}</span>
                    </div>
                    <div className="detail-item">
                      <label>Số điện thoại:</label>
                      <span>{selectedRefund.customerPhone}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{selectedRefund.customerEmail || 'Không có'}</span>
                    </div>
                  </div>
                </div>

                {/* Bank Info */}
                <div className="detail-section">
                  <h3><i className="fas fa-university"></i> Thông tin tài khoản nhận</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Tên ngân hàng:</label>
                      <span>{selectedRefund.bankName}</span>
                    </div>
                    <div className="detail-item">
                      <label>Số tài khoản:</label>
                      <span className="monospace">{selectedRefund.bankAccount}</span>
                    </div>
                    <div className="detail-item">
                      <label>Chủ tài khoản:</label>
                      <span>{selectedRefund.accountHolder}</span>
                    </div>
                    {selectedRefund.bankBranch && (
                      <div className="detail-item">
                        <label>Chi nhánh:</label>
                        <span>{selectedRefund.bankBranch}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Info */}
                <div className="detail-section">
                  <h3><i className="fas fa-coins"></i> Thông tin số tiền</h3>
                  <div className="amount-breakdown">
                    <div className="amount-item">
                      <span className="amount-label">Tổng đơn hàng:</span>
                      <span className="amount-value">{formatCurrency(selectedRefund.orderAmount)}</span>
                    </div>
                    <div className="amount-item">
                      <span className="amount-label">Số tiền yêu cầu hoàn:</span>
                      <span className="amount-value highlight">{formatCurrency(selectedRefund.refundAmount)}</span>
                    </div>
                    {selectedRefund.actualRefundAmount && selectedRefund.actualRefundAmount !== selectedRefund.refundAmount && (
                      <div className="amount-item">
                        <span className="amount-label">Số tiền thực hoàn:</span>
                        <span className="amount-value success">{formatCurrency(selectedRefund.actualRefundAmount)}</span>
                      </div>
                    )}
                    {selectedRefund.transactionId && (
                      <div className="amount-item">
                        <span className="amount-label">Mã GD chuyển tiền:</span>
                        <span className="amount-value monospace">{selectedRefund.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason & Notes */}
                <div className="detail-section">
                  <h3><i className="fas fa-comment"></i> Lý do và ghi chú</h3>
                  <div className="detail-grid">
                    <div className="detail-item full-width">
                      <label>Lý do hoàn tiền từ khách hàng:</label>
                      <p className="reason-text">{selectedRefund.refundReason}</p>
                    </div>
                    {selectedRefund.adminReason && (
                      <div className="detail-item full-width">
                        <label>Ghi chú từ admin:</label>
                        <p className="reason-text admin-note">{selectedRefund.adminReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={closeModal}>
                  <i className="fas fa-times"></i> Đóng
                </button>
                
                {selectedRefund.status === 'PENDING' && (
                  <>
                    <button 
                      className="btn btn-success"
                      onClick={() => {
                        closeModal();
                        openProcessModal(selectedRefund, 'approve');
                      }}
                    >
                      <i className="fas fa-check"></i> Duyệt hoàn tiền
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => {
                        closeModal();
                        openProcessModal(selectedRefund, 'reject');
                      }}
                    >
                      <i className="fas fa-times"></i> Từ chối
                    </button>
                  </>
                )}
                
                {selectedRefund.status === 'PROCESSING' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      closeModal();
                      openProcessModal(selectedRefund, 'complete');
                    }}
                  >
                    <i className="fas fa-money-bill-wave"></i> Hoàn thành chuyển tiền
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Process Modal - THÊM MỚI */}
        {showProcessModal && selectedRefund && (
          <div
            className="modal portal-modal"
            style={{
              display: 'block',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(6px)'
            }}
          >
            <div className="modal-content process-modal-content">
              <div className="modal-header">
                <h2>
                  <i className={`fas ${
                    processForm.action === 'approve' ? 'fa-check-circle' :
                    processForm.action === 'reject' ? 'fa-times-circle' :
                    'fa-money-bill-wave'
                  }`}></i>
                  {processForm.action === 'approve' ? 'Duyệt yêu cầu hoàn tiền' :
                   processForm.action === 'reject' ? 'Từ chối yêu cầu hoàn tiền' :
                   'Hoàn thành chuyển tiền'}
                </h2>
                <button className="close-btn" onClick={closeProcessModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="modal-body">
                <div className="process-info">
                  <div className="info-row">
                    <span>Mã yêu cầu:</span>
                    <strong>{selectedRefund.refundRequestId}</strong>
                  </div>
                  <div className="info-row">
                    <span>Khách hàng:</span>
                    <strong>{selectedRefund.customerName}</strong>
                  </div>
                  <div className="info-row">
                    <span>Số tiền:</span>
                    <strong className="amount">{formatCurrency(selectedRefund.refundAmount)}</strong>
                  </div>
                  <div className="info-row">
                    <span>Tài khoản nhận:</span>
                    <strong>{selectedRefund.bankName} - {selectedRefund.accountHolder}</strong>
                  </div>
                </div>

                <div className="process-form">
                  {processForm.action === 'complete' && (
                    <>
                      <div className="form-group">
                        <label>Số tiền thực hoàn <span className="required">*</span></label>
                        <input
                          type="number"
                          value={processForm.actualRefundAmount}
                          onChange={(e) => setProcessForm({...processForm, actualRefundAmount: e.target.value})}
                          placeholder="Nhập số tiền thực tế đã chuyển"
                          min="0"
                          max={selectedRefund.refundAmount}
                        />
                      </div>
                      <div className="form-group">
                        <label>Mã giao dịch chuyển tiền <span className="required">*</span></label>
                        <input
                          type="text"
                          value={processForm.transactionId}
                          onChange={(e) => setProcessForm({...processForm, transactionId: e.target.value})}
                          placeholder="Nhập mã giao dịch từ ngân hàng"
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Ghi chú {processForm.action === 'complete' ? '(tùy chọn)' : ''}</label>
                    <textarea
                      value={processForm.adminReason}
                      onChange={(e) => setProcessForm({...processForm, adminReason: e.target.value})}
                      placeholder={
                        processForm.action === 'approve' ? 'Nhập lý do duyệt (tùy chọn)' :
                        processForm.action === 'reject' ? 'Nhập lý do từ chối' :
                        'Nhập ghi chú về việc chuyển tiền (tùy chọn)'
                      }
                      rows="4"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={closeProcessModal} disabled={processing}>
                  <i className="fas fa-times"></i> Hủy
                </button>
                <button 
                  className={`btn ${
                    processForm.action === 'approve' ? 'btn-success' :
                    processForm.action === 'reject' ? 'btn-danger' :
                    'btn-primary'
                  }`}
                  onClick={handleProcessRefund}
                  disabled={processing}
                >
                  {processing ? (
                    <><i className="fas fa-spinner fa-spin"></i> Đang xử lý...</>
                  ) : (
                    <>
                      <i className={`fas ${
                        processForm.action === 'approve' ? 'fa-check' :
                        processForm.action === 'reject' ? 'fa-times' :
                        'fa-money-bill-wave'
                      }`}></i>
                      {processForm.action === 'approve' ? 'Duyệt yêu cầu' :
                       processForm.action === 'reject' ? 'Từ chối yêu cầu' :
                       'Hoàn thành chuyển tiền'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

};

export default RefundManagement;