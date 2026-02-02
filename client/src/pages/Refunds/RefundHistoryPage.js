import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import refundService from '../../services/refundService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';
import Loading from '../../components/Common/Loading';
import './RefundHistoryPage.css';

const RefundHistoryPage = () => {
    const { user } = useAuth();
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        timeRange: 'all',
        amountRange: 'all'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

    useEffect(() => {
        if (user) {
            fetchRefunds();
        }
    }, [user, filters]);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const data = await refundService.getRefunds(filters.status !== 'all' ? { status: filters.status } : {});
            setRefunds(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            console.error('Error fetching refunds:', error);
            toast.error('Không thể tải lịch sử hoàn tiền');
            setRefunds([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (refundId) => {
        try {
            const detail = await refundService.getRefundById(refundId);
            setSelectedRefund(detail);
            setShowDetailModal(true);
        } catch (error) {
            toast.error('Không thể tải chi tiết hoàn tiền');
        }
    };

    const getStatusClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('thành công') || s.includes('thanh_cong')) return 'status-success';
        if (s.includes('thất bại') || s.includes('that_bai')) return 'status-failed';
        if (s.includes('đang') || s.includes('dang_xl')) return 'status-processing';
        return 'status-pending';
    };

    const getStatusText = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('thành công') || s.includes('thanh_cong')) return 'Thành công';
        if (s.includes('thất bại') || s.includes('that_bai')) return 'Thất bại';
        if (s.includes('đang') || s.includes('dang_xl')) return 'Đang xử lý';
        return 'Chờ xử lý';
    };

    const filteredRefunds = refunds.filter(refund => {
        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const orderId = String(refund.orderId || refund.MaHD || '').toLowerCase();
            const refundId = String(refund.id || refund.MaHoanTien || '').toLowerCase();
            if (!orderId.includes(search) && !refundId.includes(search)) {
                return false;
            }
        }

        // Time range filter
        if (filters.timeRange !== 'all') {
            const refundDate = new Date(refund.createdAt || refund.NgayTao);
            const now = new Date();
            const daysDiff = Math.floor((now - refundDate) / (1000 * 60 * 60 * 24));

            if (filters.timeRange === '7d' && daysDiff > 7) return false;
            if (filters.timeRange === '30d' && daysDiff > 30) return false;
            if (filters.timeRange === '3m' && daysDiff > 90) return false;
            if (filters.timeRange === '6m' && daysDiff > 180) return false;
            if (filters.timeRange === '1y' && daysDiff > 365) return false;
        }

        // Amount range filter
        if (filters.amountRange !== 'all') {
            const amount = refund.amount || refund.SoTien || 0;
            if (filters.amountRange === '0-100k' && amount >= 100000) return false;
            if (filters.amountRange === '100k-500k' && (amount < 100000 || amount >= 500000)) return false;
            if (filters.amountRange === '500k-1m' && (amount < 500000 || amount >= 1000000)) return false;
            if (filters.amountRange === '1m+' && amount < 1000000) return false;
        }

        return true;
    });

    if (loading && refunds.length === 0) return <Loading />;

    return (
        <div className="refund-history-page">
            <div className="container">
                {/* Header */}
                <header className="refund-header">
                    <div className="header-content">
                        <div className="header-left">
                            <h1><i className="fas fa-history"></i> Lịch sử hoàn tiền</h1>
                            <p className="subtitle">Theo dõi tất cả giao dịch hoàn tiền của bạn</p>
                        </div>
                        <div className="header-actions">
                            <Link to="/orders" className="btn btn-outline">
                                <i className="fas fa-arrow-left"></i> Quay lại đơn hàng
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Filters */}
                <div className="filter-section">
                    <div className="filter-controls">
                        <div className="filter-group">
                            <label>Trạng thái:</label>
                            <select
                                className="filter-select"
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="all">Tất cả</option>
                                <option value="THANH_CONG">Thành công</option>
                                <option value="DANG_XL">Đang xử lý</option>
                                <option value="THAT_BAI">Thất bại</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Thời gian:</label>
                            <select
                                className="filter-select"
                                value={filters.timeRange}
                                onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                            >
                                <option value="all">Tất cả thời gian</option>
                                <option value="7d">7 ngày qua</option>
                                <option value="30d">30 ngày qua</option>
                                <option value="3m">3 tháng qua</option>
                                <option value="6m">6 tháng qua</option>
                                <option value="1y">1 năm qua</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Số tiền:</label>
                            <select
                                className="filter-select"
                                value={filters.amountRange}
                                onChange={(e) => setFilters(prev => ({ ...prev, amountRange: e.target.value }))}
                            >
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
                                    placeholder="Tìm theo mã đơn hàng hoặc mã hoàn tiền..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button><i className="fas fa-search"></i></button>
                            </div>
                        </div>
                    </div>

                    <div className="filter-actions">
                        <button
                            className="btn btn-light"
                            onClick={() => {
                                setFilters({ status: 'all', timeRange: 'all', amountRange: 'all' });
                                setSearchTerm('');
                            }}
                        >
                            <i className="fas fa-times"></i> Xóa bộ lọc
                        </button>
                        <button className="btn btn-outline" onClick={fetchRefunds}>
                            <i className="fas fa-sync-alt"></i> Làm mới
                        </button>
                    </div>
                </div>

                {/* Refund List */}
                <div className="refund-list-section">
                    <div className="section-header">
                        <h2>Danh sách giao dịch hoàn tiền</h2>
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
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>Đang tải lịch sử hoàn tiền...</p>
                        </div>
                    ) : filteredRefunds.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon"><i className="fas fa-inbox"></i></div>
                            <h3>Chưa có giao dịch hoàn tiền</h3>
                            <p>Bạn chưa có giao dịch hoàn tiền nào. Khi bạn hủy đơn hàng VNPay, thông tin sẽ hiển thị ở đây.</p>
                            <Link to="/orders" className="btn btn-primary">
                                <i className="fas fa-shopping-cart"></i> Xem đơn hàng
                            </Link>
                        </div>
                    ) : viewMode === 'card' ? (
                        <div className="refund-list card-view">
                            {filteredRefunds.map(refund => {
                                const id = refund.id || refund.MaHoanTien;
                                const orderId = refund.orderId || refund.MaHD;
                                const amount = refund.amount || refund.SoTien || 0;
                                const status = refund.status || refund.TrangThai;
                                const reason = refund.reason || refund.LyDo;
                                const createdAt = refund.createdAt || refund.NgayTao;

                                return (
                                    <div key={id} className="refund-card">
                                        <div className="card-header">
                                            <div className="refund-id">
                                                <strong>Mã HT:</strong> #{id}
                                            </div>
                                            <span className={`status-badge ${getStatusClass(status)}`}>
                                                {getStatusText(status)}
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            <div className="refund-info">
                                                <p><strong>Đơn hàng:</strong> #{orderId}</p>
                                                <p><strong>Ngày tạo:</strong> {formatDate(createdAt)}</p>
                                                <p><strong>Số tiền:</strong> <span className="amount">{formatCurrency(amount)}</span></p>
                                                {reason && <p><strong>Lý do:</strong> {reason}</p>}
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <button className="btn-view-detail" onClick={() => handleViewDetail(id)}>
                                                <i className="fas fa-eye"></i> Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="refund-table-container">
                            <table className="refund-table">
                                <thead>
                                    <tr>
                                        <th>Mã giao dịch</th>
                                        <th>Đơn hàng</th>
                                        <th>Ngày tạo</th>
                                        <th>Số tiền</th>
                                        <th>Lý do</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRefunds.map(refund => {
                                        const id = refund.id || refund.MaHoanTien;
                                        const orderId = refund.orderId || refund.MaHD;
                                        const amount = refund.amount || refund.SoTien || 0;
                                        const status = refund.status || refund.TrangThai;
                                        const reason = refund.reason || refund.LyDo;
                                        const createdAt = refund.createdAt || refund.NgayTao;

                                        return (
                                            <tr key={id}>
                                                <td>#{id}</td>
                                                <td>#{orderId}</td>
                                                <td>{formatDate(createdAt)}</td>
                                                <td>{formatCurrency(amount)}</td>
                                                <td>{reason || 'N/A'}</td>
                                                <td>
                                                    <span className={`status-badge ${getStatusClass(status)}`}>
                                                        {getStatusText(status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn-icon" onClick={() => handleViewDetail(id)}>
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedRefund && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content refund-detail-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><i className="fas fa-receipt"></i> Chi tiết hoàn tiền</h2>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-section">
                                <h3>Thông tin giao dịch</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Mã giao dịch:</label>
                                        <span className="monospace">#{selectedRefund.id || selectedRefund.MaHoanTien}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Mã đơn hàng:</label>
                                        <span className="monospace">#{selectedRefund.orderId || selectedRefund.MaHD}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Ngày tạo:</label>
                                        <span>{formatDate(selectedRefund.createdAt || selectedRefund.NgayTao)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Trạng thái:</label>
                                        <span className={`status-badge ${getStatusClass(selectedRefund.status || selectedRefund.TrangThai)}`}>
                                            {getStatusText(selectedRefund.status || selectedRefund.TrangThai)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Thông tin số tiền</h3>
                                <div className="amount-breakdown">
                                    <div className="amount-item total">
                                        <span className="amount-label">Số tiền hoàn:</span>
                                        <span className="amount-value">{formatCurrency(selectedRefund.amount || selectedRefund.SoTien || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedRefund.reason && (
                                <div className="detail-section">
                                    <h3>Lý do hoàn tiền</h3>
                                    <p className="reason-text">{selectedRefund.reason || selectedRefund.LyDo}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowDetailModal(false)}>
                                <i className="fas fa-times"></i> Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RefundHistoryPage;
