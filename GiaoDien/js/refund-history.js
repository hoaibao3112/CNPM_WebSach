// ===== GLOBAL VARIABLES =====
let refundData = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentView = 'card';
let currentSort = 'date-desc';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Refund History Page...');
    
    if (!checkAuth()) {
        return;
    }

    initializeEventListeners();
    loadRefundHistory();
    setupViewToggle();
    setupFilters();
});

// ===== AUTHENTICATION =====
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user || !user.makh) {
        console.error('❌ User not authenticated');
        showErrorToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

function getToken() {
    return localStorage.getItem('token');
}

function getCustomerId() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.makh || null;
}

// ===== UTILITY FUNCTIONS =====
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price || 0);
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function showErrorToast(message) {
    // Tạo toast notification
    const toast = document.createElement('div');
    toast.className = 'toast error-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    // Show animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    toast.innerHTML = `
        <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    console.log('🔗 Setting up event listeners...');

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadRefundHistory);
    }
    
    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportRefundData);
    }
    
    // Search
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
    
    // Clear filters
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }
    
    // Pagination
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('refund-detail-modal');
        if (e.target === modal) {
            closeRefundDetailModal();
        }
    });
}

function setupViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
            
            // Update active state
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function setupFilters() {
    const filters = ['status-filter', 'time-filter', 'amount-filter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
}

// ===== DATA LOADING =====
async function loadRefundHistory() {
    const customerId = getCustomerId();
    if (!customerId) return;

    console.log('📦 Loading refund history for customer:', customerId);
    
    showLoadingState();
    
    try {
        const response = await fetch(`http://localhost:5000/api/orders/customer-refunds/${customerId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📦 Refund history response:', result);

        if (result.success) {
            refundData = result.data || [];
            
            // Update summary
            updateSummaryCards(result.summary);
            
            // Apply current filters
            applyFilters();
            
            console.log(`✅ Loaded ${refundData.length} refund records`);
            showSuccessToast(`Đã tải ${refundData.length} giao dịch hoàn tiền`);
        } else {
            throw new Error(result.error || 'Không thể tải dữ liệu hoàn tiền');
        }

    } catch (error) {
        console.error('❌ Error loading refund history:', error);
        showErrorState(error.message);
        showErrorToast(error.message || 'Không thể tải lịch sử hoàn tiền');
    }
}

// ===== UI STATE MANAGEMENT =====
function showLoadingState() {
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const errorState = document.getElementById('error-state');
    const refundList = document.getElementById('refund-list');
    const paginationSection = document.getElementById('pagination-section');

    if (loadingState) loadingState.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    if (paginationSection) paginationSection.style.display = 'none';
    
    // Clear existing content
    const existingCards = refundList?.querySelectorAll('.refund-card');
    existingCards?.forEach(card => card.remove());
}

function showEmptyState() {
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const errorState = document.getElementById('error-state');
    const paginationSection = document.getElementById('pagination-section');

    if (loadingState) loadingState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    if (errorState) errorState.style.display = 'none';
    if (paginationSection) paginationSection.style.display = 'none';
}

function showErrorState(message) {
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const paginationSection = document.getElementById('pagination-section');

    if (loadingState) loadingState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'block';
    if (errorMessage) errorMessage.textContent = message;
    if (paginationSection) paginationSection.style.display = 'none';
}

function hideAllStates() {
    const states = ['loading-state', 'empty-state', 'error-state'];
    states.forEach(stateId => {
        const element = document.getElementById(stateId);
        if (element) element.style.display = 'none';
    });
}

// ===== SUMMARY CARDS =====
function updateSummaryCards(summary) {
    if (!summary) {
        console.log('⚠️ No summary data provided');
        return;
    }

    console.log('📊 Updating summary cards:', summary);

    // Update total amount
    const totalElement = document.getElementById('total-refund-amount');
    if (totalElement) {
        totalElement.textContent = formatPrice(summary.totalAmount || 0);
    }

    // Update counts
    const successElement = document.getElementById('success-count');
    if (successElement) {
        successElement.textContent = summary.successCount || 0;
    }

    const pendingElement = document.getElementById('pending-count');
    if (pendingElement) {
        pendingElement.textContent = summary.pendingCount || 0;
    }

    const failedElement = document.getElementById('failed-count');
    if (failedElement) {
        failedElement.textContent = summary.failedCount || 0;
    }
}

// ===== FILTERING & SORTING =====
function applyFilters() {
    console.log('🔍 Applying filters...');

    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const timeFilter = document.getElementById('time-filter')?.value || 'all';
    const amountFilter = document.getElementById('amount-filter')?.value || 'all';
    const searchQuery = document.getElementById('search-input')?.value?.trim().toLowerCase() || '';

    filteredData = refundData.filter(item => {
        // Status filter
        if (statusFilter !== 'all' && item.status !== statusFilter) {
            return false;
        }

        // Time filter
        if (timeFilter !== 'all') {
            const itemDate = new Date(item.createdAt);
            const now = new Date();
            let cutoffDate;

            switch (timeFilter) {
                case '7d':
                    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '3m':
                    cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                    break;
                case '6m':
                    cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                    break;
                case '1y':
                    cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    break;
                default:
                    cutoffDate = new Date(0);
            }

            if (itemDate < cutoffDate) {
                return false;
            }
        }

        // Amount filter
        if (amountFilter !== 'all') {
            const amount = parseFloat(item.refundAmount) || 0;

            switch (amountFilter) {
                case '0-100k':
                    if (amount >= 100000) return false;
                    break;
                case '100k-500k':
                    if (amount < 100000 || amount >= 500000) return false;
                    break;
                case '500k-1m':
                    if (amount < 500000 || amount >= 1000000) return false;
                    break;
                case '1m+':
                    if (amount < 1000000) return false;
                    break;
            }
        }

        // Search filter
        if (searchQuery) {
            const searchFields = [
                item.refundRequestId?.toLowerCase(),
                item.orderId?.toString().toLowerCase(),
                item.refundReason?.toLowerCase()
            ];

            const matchFound = searchFields.some(field => 
                field && field.includes(searchQuery)
            );

            if (!matchFound) return false;
        }

        return true;
    });

    // Sort data
    sortData();

    // Reset pagination
    currentPage = 1;

    // Render results
    renderRefundList();
}

function sortData() {
    filteredData.sort((a, b) => {
        switch (currentSort) {
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
}

function handleSearch() {
    applyFilters();
}

function handleSortChange(e) {
    currentSort = e.target.value;
    sortData();
    renderRefundList();
}

function clearFilters() {
    // Reset filter controls
    const filters = ['status-filter', 'time-filter', 'amount-filter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) filter.value = 'all';
    });

    // Clear search
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    // Reapply filters (which will now show all data)
    applyFilters();
    
    showSuccessToast('Đã xóa tất cả bộ lọc');
}

// ===== VIEW SWITCHING =====
function switchView(view) {
    currentView = view;
    renderRefundList();
}

// ===== RENDERING =====
function renderRefundList() {
    console.log(`🎨 Rendering ${filteredData.length} refund items in ${currentView} view`);

    hideAllStates();

    if (filteredData.length === 0) {
        showEmptyState();
        return;
    }

    // Calculate pagination
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageData = filteredData.slice(startIndex, endIndex);

    // Render based on current view
    if (currentView === 'card') {
        renderCardView(pageData);
    } else {
        renderTableView(pageData);
    }

    // Update pagination
    updatePagination(totalItems, totalPages);
}

function renderCardView(data) {
    const refundList = document.getElementById('refund-list');
    const tableContainer = document.getElementById('refund-table-container');

    if (!refundList) return;

    // Show card view, hide table view
    refundList.style.display = 'grid';
    if (tableContainer) tableContainer.style.display = 'none';

    // Clear existing cards (except state elements)
    const existingCards = refundList.querySelectorAll('.refund-card');
    existingCards.forEach(card => card.remove());

    // Render cards
    data.forEach((item, index) => {
        const card = createRefundCard(item);
        refundList.appendChild(card);

        // Add stagger animation
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

function renderTableView(data) {
    const refundList = document.getElementById('refund-list');
    const tableContainer = document.getElementById('refund-table-container');
    const tableBody = document.getElementById('refund-table-body');

    if (!tableContainer || !tableBody) return;

    // Show table view, hide card view
    refundList.style.display = 'none';
    tableContainer.style.display = 'block';

    // Clear existing rows
    tableBody.innerHTML = '';

    // Render rows
    data.forEach(item => {
        const row = createRefundTableRow(item);
        tableBody.appendChild(row);
    });
}

function createRefundCard(item) {
    const card = document.createElement('div');
    card.className = 'refund-card';
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';

    const statusClass = getStatusClass(item.status);
    const statusText = getStatusText(item.status);

    card.innerHTML = `
        <div class="refund-card-header">
            <div class="refund-id">
                <i class="fas fa-receipt"></i>
                ${item.refundRequestId || 'N/A'}
            </div>
            <div class="refund-date">${formatDate(item.createdAt)}</div>
        </div>

        <div class="refund-amount">${formatPrice(item.refundAmount)}</div>

        <div class="refund-details">
            <p><span>Đơn hàng:</span> <span>#${item.orderId || 'N/A'}</span></p>
            <p><span>Khách hàng:</span> <span>${item.customerName || 'N/A'}</span></p>
            <p><span>Ngày xử lý:</span> <span>${formatDate(item.processedAt)}</span></p>
        </div>

        <div class="refund-reason">
            <i class="fas fa-comment-alt"></i>
            ${item.refundReason || 'Không có lý do cụ thể'}
        </div>

        <div class="refund-card-footer">
            <span class="status-badge ${statusClass}">${statusText}</span>
            <div class="refund-actions">
                <button class="action-btn" onclick="showRefundDetail(${item.id})" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="downloadRefundReceipt(${item.id})" title="Tải biên lai">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        </div>
    `;

    // Add click event to show detail
    card.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if (!e.target.closest('.action-btn')) {
            showRefundDetail(item);
        }
    });

    return card;
}

function createRefundTableRow(item) {
    const row = document.createElement('tr');
    
    const statusClass = getStatusClass(item.status);
    const statusText = getStatusText(item.status);

    row.innerHTML = `
        <td>
            <span class="monospace">${item.refundRequestId || 'N/A'}</span>
        </td>
        <td>
            <span class="monospace">#${item.orderId || 'N/A'}</span>
        </td>
        <td>${formatDateTime(item.createdAt)}</td>
        <td class="text-success font-weight-bold">${formatPrice(item.refundAmount)}</td>
        <td>
            <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
                 title="${item.refundReason || 'Không có lý do'}">
                ${item.refundReason || 'Không có lý do'}
            </div>
        </td>
        <td>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td>
            <div class="refund-actions">
                <button class="action-btn" onclick="showRefundDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="downloadRefundReceipt(${item.id})" title="Tải biên lai">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        </td>
    `;

    return row;
}

// ===== STATUS HELPERS =====
function getStatusClass(status) {
    switch (status) {
        case 'THANH_CONG':
            return 'status-success';
        case 'DANG_XL':
            return 'status-pending';
        case 'THAT_BAI':
            return 'status-failed';
        default:
            return 'status-pending';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'THANH_CONG':
            return 'Thành công';
        case 'DANG_XL':
            return 'Đang xử lý';
        case 'THAT_BAI':
            return 'Thất bại';
        default:
            return 'Không xác định';
    }
}

// ===== PAGINATION =====
function updatePagination(totalItems, totalPages) {
    const paginationSection = document.getElementById('pagination-section');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationNumbers = document.getElementById('pagination-numbers');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (!paginationSection) return;

    if (totalPages <= 1) {
        paginationSection.style.display = 'none';
        return;
    }

    paginationSection.style.display = 'flex';

    // Update info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    if (paginationInfo) {
        paginationInfo.innerHTML = `Hiển thị <strong>${startItem}-${endItem}</strong> của <strong>${totalItems}</strong> giao dịch`;
    }

    // Update buttons
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }

    // Update page numbers
    if (paginationNumbers) {
        paginationNumbers.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => changePage(i));
            paginationNumbers.appendChild(pageBtn);
        }
    }
}

function changePage(page) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderRefundList();
}

// ===== MODAL FUNCTIONS =====
function showRefundDetail(item) {
    if (typeof item === 'string') {
        try {
            item = JSON.parse(item);
        } catch (e) {
            console.error('Error parsing item data:', e);
            return;
        }
    }

    console.log('📋 Showing refund detail for:', item);

    const modal = document.getElementById('refund-detail-modal');
    if (!modal) return;

    // Fill modal data
    fillRefundDetailModal(item);

    // Show modal
    modal.style.display = 'block';
}

function fillRefundDetailModal(item) {
    // Transaction info
    const detailTransactionId = document.getElementById('detail-transaction-id');
    if (detailTransactionId) {
        detailTransactionId.textContent = item.refundRequestId || 'N/A';
    }

    const detailOrderId = document.getElementById('detail-order-id');
    if (detailOrderId) {
        detailOrderId.textContent = `#${item.orderId || 'N/A'}`;
    }

    const detailCreatedDate = document.getElementById('detail-created-date');
    if (detailCreatedDate) {
        detailCreatedDate.textContent = formatDateTime(item.createdAt);
    }

    const detailProcessedDate = document.getElementById('detail-processed-date');
    if (detailProcessedDate) {
        detailProcessedDate.textContent = item.processedAt ? formatDateTime(item.processedAt) : 'Chưa xử lý';
    }

    // Amount info
    const detailRefundAmount = document.getElementById('detail-refund-amount');
    if (detailRefundAmount) {
        detailRefundAmount.textContent = formatPrice(item.refundAmount);
    }

    const detailNetAmount = document.getElementById('detail-net-amount');
    if (detailNetAmount) {
        detailNetAmount.textContent = formatPrice(item.refundAmount); // Assuming no fees for now
    }

    // Status and reason
    const detailStatus = document.getElementById('detail-status');
    if (detailStatus) {
        const statusClass = getStatusClass(item.status);
        const statusText = getStatusText(item.status);
        detailStatus.className = `status-badge ${statusClass}`;
        detailStatus.textContent = statusText;
    }

    const detailReason = document.getElementById('detail-reason');
    if (detailReason) {
        detailReason.textContent = item.refundReason || 'Không có lý do cụ thể';
    }

    // Timeline
    createRefundTimeline(item);
}

function createRefundTimeline(item) {
    const timeline = document.getElementById('refund-timeline');
    if (!timeline) return;

    timeline.innerHTML = '';

    const timelineData = [
        {
            title: 'Yêu cầu hoàn tiền được tạo',
            time: item.createdAt,
            completed: true,
            content: 'Yêu cầu hoàn tiền đã được gửi và đang chờ xử lý'
        }
    ];

    if (item.processedAt) {
        timelineData.push({
            title: item.status === 'THANH_CONG' ? 'Hoàn tiền thành công' : 'Hoàn tiền thất bại',
            time: item.processedAt,
            completed: item.status === 'THANH_CONG',
            failed: item.status === 'THAT_BAI',
            content: item.status === 'THANH_CONG' 
                ? 'Tiền đã được hoàn về tài khoản của bạn'
                : 'Có lỗi xảy ra trong quá trình hoàn tiền'
        });
    }

    timelineData.forEach(timelineItem => {
        const timelineElement = document.createElement('div');
        timelineElement.className = `timeline-item ${timelineItem.completed ? 'completed' : ''} ${timelineItem.failed ? 'failed' : ''}`;
        
        timelineElement.innerHTML = `
            <div class="timeline-header">
                <div class="timeline-title">${timelineItem.title}</div>
                <div class="timeline-time">${formatDateTime(timelineItem.time)}</div>
            </div>
            <div class="timeline-content">${timelineItem.content}</div>
        `;

        timeline.appendChild(timelineElement);
    });
}

function closeRefundDetailModal() {
    const modal = document.getElementById('refund-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ===== EXPORT FUNCTIONS =====
function exportRefundData() {
    console.log('📊 Exporting refund data...');
    
    if (filteredData.length === 0) {
        showErrorToast('Không có dữ liệu để xuất');
        return;
    }

    try {
        // Create CSV content
        const headers = ['Mã giao dịch', 'Mã đơn hàng', 'Ngày tạo', 'Số tiền hoàn', 'Trạng thái', 'Lý do'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(item => [
                item.refundRequestId || '',
                item.orderId || '',
                formatDateTime(item.createdAt),
                item.refundAmount || '0',
                getStatusText(item.status),
                `"${(item.refundReason || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `lich-su-hoan-tien-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccessToast('Đã xuất dữ liệu thành công');
    } catch (error) {
        console.error('Export error:', error);
        showErrorToast('Có lỗi khi xuất dữ liệu');
    }
}

function downloadRefundReceipt(refundId) {
    console.log('📄 Downloading refund receipt for ID:', refundId);
    
    // Mock function - in real app, this would call an API to generate PDF
    showSuccessToast('Tính năng tải biên lai đang được phát triển');
}

function printRefundDetail() {
    console.log('🖨️ Printing refund detail...');
    
    // Get modal content
    const modalBody = document.querySelector('#refund-detail-modal .modal-body');
    if (!modalBody) return;

    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Chi tiết hoàn tiền</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .detail-section { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .detail-item { margin-bottom: 10px; }
                .detail-item label { font-weight: bold; }
                .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .status-success { background: #d4edda; color: #155724; }
                .status-pending { background: #fff3cd; color: #856404; }
                .status-failed { background: #f8d7da; color: #721c24; }
                .timeline-item { margin-bottom: 15px; padding: 10px; border-left: 3px solid #ddd; }
                .timeline-header { font-weight: bold; margin-bottom: 5px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <h1>Chi tiết hoàn tiền - BookStore</h1>
            ${modalBody.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
    
    showSuccessToast('Đang chuẩn bị in...');
}

// ===== GLOBAL FUNCTIONS FOR HTML ONCLICK =====
window.showRefundDetail = showRefundDetail;
window.closeRefundDetailModal = closeRefundDetailModal;
window.downloadRefundReceipt = downloadRefundReceipt;
window.printRefundDetail = printRefundDetail;
window.loadRefundHistory = loadRefundHistory;

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showErrorToast('Có lỗi xảy ra. Vui lòng tải lại trang.');
});

// ===== READY STATE =====
console.log('✅ Refund History JS loaded successfully');