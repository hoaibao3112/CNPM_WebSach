// ===== GLOBAL VARIABLES =====
let refundData = [];
let filteredData = [];
let currentItem = null;
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
    const toast = document.createElement('div');
    toast.className = 'fixed top-6 right-6 bg-white border-l-4 border-red-500 shadow-lg p-4 rounded-xl flex items-center gap-4 z-[10000] animate-in slide-in-from-right duration-300';
    toast.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <i class="fas fa-exclamation-circle"></i>
        </div>
        <div>
            <p class="text-xs font-black text-gray-800 uppercase tracking-widest">Lỗi hệ thống</p>
            <p class="text-[11px] text-gray-500 italic">${message}</p>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-6 right-6 bg-white border-l-4 border-green-500 shadow-lg p-4 rounded-xl flex items-center gap-4 z-[10000] animate-in slide-in-from-right duration-300';
    toast.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
            <i class="fas fa-check-circle"></i>
        </div>
        <div>
            <p class="text-xs font-black text-gray-800 uppercase tracking-widest">Thành công</p>
            <p class="text-[11px] text-gray-500 italic">${message}</p>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right');
        setTimeout(() => toast.remove(), 300);
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
    
    // Export button removed from UI
    
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
        const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-refunds/${customerId}`, {
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
            // Handle both nested object { refunds, summary } and flat array structure
            if (result.data && result.data.refunds && Array.isArray(result.data.refunds)) {
                refundData = result.data.refunds;
                // Optional: Store summary if needed in the future
                window.refundSummary = result.data.summary;
            } else {
                refundData = Array.isArray(result.data) ? result.data : [];
            }

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
// summary cards removed — no DOM updates needed

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
    card.className = 'refund-card bg-white rounded-3xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer';
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';

    const statusClass = getStatusClass(item.status);
    const statusText = getStatusText(item.status);

    card.innerHTML = `
        <div class="p-6 space-y-5">
            <div class="flex justify-between items-start">
                <div class="space-y-1">
                    <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                        <i class="fas fa-receipt"></i>
                        <span>${item.refundRequestId || 'N/A'}</span>
                    </div>
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${formatDate(item.createdAt)}</div>
                </div>
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${statusClass}">
                    ${statusText}
                </span>
            </div>

            <div class="space-y-1">
                <div class="text-2xl font-black text-gray-800 tracking-tighter">${formatPrice(item.refundAmount)}</div>
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Số tiền hoàn trả</div>
            </div>

            <div class="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                <div class="space-y-1">
                    <span class="text-[9px] font-black text-gray-300 uppercase tracking-widest block">Đơn hàng</span>
                    <span class="text-xs font-bold text-gray-600">#${item.orderId || 'N/A'}</span>
                </div>
                <div class="space-y-1">
                    <span class="text-[9px] font-black text-gray-300 uppercase tracking-widest block">Ngày xử lý</span>
                    <span class="text-xs font-bold text-gray-600 italic">${item.processedAt ? formatDate(item.processedAt) : '---'}</span>
                </div>
            </div>

            <div class="space-y-2">
                <span class="text-[9px] font-black text-gray-300 uppercase tracking-widest block">Lý do hoàn tiền</span>
                <p class="text-xs text-gray-500 italic line-clamp-2 leading-relaxed">
                    <i class="fas fa-quote-left text-[8px] mr-1 opacity-30"></i>
                    ${item.refundReason || 'Không có lý do cụ thể'}
                </p>
            </div>
        </div>

        <div class="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-[10px] font-black text-gray-400">
                    ${(item.customerName || 'N').charAt(0)}
                </div>
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate max-w-[120px]">
                    ${item.customerName || 'Khách hàng'}
                </span>
            </div>
            <div class="flex items-center gap-2">
                <button class="w-8 h-8 flex items-center justify-center bg-white border border-border text-gray-400 hover:text-primary hover:border-primary rounded-lg transition-all active:scale-95 shadow-sm" 
                        onclick="event.stopPropagation(); showRefundDetail('${JSON.stringify(item).replace(/'/g, "\\'")}')" title="Xem chi tiết">
                    <i class="fas fa-eye text-xs"></i>
                </button>
                <button class="w-8 h-8 flex items-center justify-center bg-gray-800 text-white hover:bg-black rounded-lg transition-all active:scale-95 shadow-sm" 
                        onclick="event.stopPropagation(); downloadRefundReceipt(${item.id})" title="Tải biên lai">
                    <i class="fas fa-download text-xs"></i>
                </button>
            </div>
        </div>
    `;

    // Add click event to show detail
    card.addEventListener('click', () => {
        showRefundDetail(item);
    });

    return card;
}

function createRefundTableRow(item) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50/50 transition-colors cursor-pointer group';
    
    const statusClass = getStatusClass(item.status);
    const statusText = getStatusText(item.status);

    row.innerHTML = `
        <td class="px-6 py-4">
            <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-primary/20 flex items-center justify-center">
                    <div class="w-1 h-1 rounded-full bg-primary"></div>
                </div>
                <span class="text-[11px] font-black text-gray-800 tracking-tighter font-mono">${item.refundRequestId || 'N/A'}</span>
            </div>
        </td>
        <td class="px-6 py-4">
            <span class="text-xs font-bold text-gray-600">#${item.orderId || 'N/A'}</span>
        </td>
        <td class="px-6 py-4 text-xs text-gray-500 font-medium">${formatDateTime(item.createdAt)}</td>
        <td class="px-6 py-4">
            <span class="text-sm font-black text-gray-800 tracking-tighter">${formatPrice(item.refundAmount)}</span>
        </td>
        <td class="px-6 py-4">
            <div class="max-w-[180px] text-[11px] text-gray-500 italic truncate" title="${item.refundReason || 'Không có lý do'}">
                ${item.refundReason || 'Không có lý do'}
            </div>
        </td>
        <td class="px-6 py-4">
            <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${statusClass}">
                ${statusText}
            </span>
        </td>
        <td class="px-6 py-4 text-right">
            <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="w-8 h-8 flex items-center justify-center bg-white border border-border text-gray-400 hover:text-primary hover:border-primary rounded-lg transition-all active:scale-95 shadow-sm" 
                        onclick="event.stopPropagation(); showRefundDetail('${JSON.stringify(item).replace(/'/g, "\\'")}')" title="Xem chi tiết">
                    <i class="fas fa-eye text-xs"></i>
                </button>
                <button class="w-8 h-8 flex items-center justify-center bg-gray-800 text-white hover:bg-black rounded-lg transition-all active:scale-95 shadow-sm" 
                        onclick="event.stopPropagation(); downloadRefundReceipt(${item.id})" title="Tải biên lai">
                    <i class="fas fa-download text-xs"></i>
                </button>
            </div>
        </td>
    `;

    row.addEventListener('click', () => showRefundDetail(item));

    return row;
}

// ===== STATUS HELPERS =====
function getStatusClass(status) {
    switch (status) {
        case 'THANH_CONG':
            return 'bg-green-50 text-green-600 border-green-100';
        case 'DANG_XL':
            return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'THAT_BAI':
            return 'bg-red-50 text-red-600 border-red-100';
        default:
            return 'bg-gray-50 text-gray-500 border-gray-100';
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
    currentItem = item; // Store for print/download

    const modal = document.getElementById('refund-detail-modal');
    if (!modal) return;

    // Fill modal data
    fillRefundDetailModal(item);

    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
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
            icon: 'fa-paper-plane',
            content: 'Yêu cầu hoàn tiền đã được gửi và đang chờ xử lý'
        }
    ];

    if (item.processedAt) {
        timelineData.push({
            title: item.status === 'THANH_CONG' ? 'Hoàn tiền thành công' : 'Hoàn tiền thất bại',
            time: item.processedAt,
            completed: item.status === 'THANH_CONG',
            failed: item.status === 'THAT_BAI',
            icon: item.status === 'THANH_CONG' ? 'fa-check-circle' : 'fa-times-circle',
            content: item.status === 'THANH_CONG' 
                ? 'Tiền đã được hoàn về tài khoản của bạn'
                : 'Có lỗi xảy ra trong quá trình hoàn tiền. Vui lòng liên hệ hỗ trợ.'
        });
    } else {
        timelineData.push({
            title: 'Đang xử lý',
            time: null,
            completed: false,
            icon: 'fa-clock',
            content: 'Hệ thống đang kiểm tra và xử lý yêu cầu của bạn'
        });
    }

    timelineData.forEach((timelineItem, idx) => {
        const isLast = idx === timelineData.length - 1;
        const timelineElement = document.createElement('div');
        timelineElement.className = 'flex gap-4 group';
        
        const dotClass = timelineItem.failed ? 'bg-red-500 shadow-red-200' : (timelineItem.completed ? 'bg-primary shadow-primary/20' : 'bg-gray-200');
        
        timelineElement.innerHTML = `
            <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-xl ${dotClass} flex items-center justify-center text-white shadow-lg z-10">
                    <i class="fas ${timelineItem.icon} text-[10px]"></i>
                </div>
                ${!isLast ? '<div class="w-0.5 flex-1 bg-gray-100 my-1"></div>' : ''}
            </div>
            <div class="pb-8 flex-1">
                <div class="flex items-center justify-between gap-2 mb-1">
                    <h4 class="text-xs font-black text-gray-800 uppercase tracking-widest">${timelineItem.title}</h4>
                    ${timelineItem.time ? `<span class="text-[9px] font-bold text-gray-400 italic">${formatDateTime(timelineItem.time)}</span>` : ''}
                </div>
                <p class="text-xs text-gray-500 font-medium italic leading-relaxed">${timelineItem.content}</p>
            </div>
        `;

        timeline.appendChild(timelineElement);
    });
}

function closeRefundDetailModal() {
    const modal = document.getElementById('refund-detail-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
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

function downloadRefundReceipt() {
    if (!currentItem) {
        showErrorToast('Không có dữ liệu để tải về');
        return;
    }

    console.log('📄 Generating PDF for:', currentItem.refundRequestId);
    showSuccessToast('Đang tạo PDF, vui lòng đợi...');

    const element = document.querySelector('.refund-detail-content');
    const options = {
        margin: [10, 10, 10, 10],
        filename: `bien-lai-hoan-tien-${currentItem.refundRequestId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Temporarily hide buttons for PDF
    const footer = element.querySelector('.modal-footer');
    if (footer) footer.style.display = 'none';

    html2pdf().set(options).from(element).save().then(() => {
        if (footer) footer.style.display = 'flex';
        showSuccessToast('Đã tải biên lai thành công');
    }).catch(err => {
        console.error('PDF Generation Error:', err);
        if (footer) footer.style.display = 'flex';
        showErrorToast('Lỗi khi tạo PDF');
    });
}

function printRefundDetail() {
    if (!currentItem) return;
    console.log('🖨️ Printing refund detail...');
    
    // Create a temporary print stylesheet
    const printStyle = document.createElement('style');
    printStyle.innerHTML = `
        @media print {
            body * { visibility: hidden; }
            .refund-detail-content, .refund-detail-content * { visibility: visible; }
            .refund-detail-content { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .modal-footer, .close-btn, .action-btn { display: none !important; }
            .status-badge { border: 1px solid #ccc; -webkit-print-color-adjust: exact; }
        }
    `;
    document.head.appendChild(printStyle);
    
    window.print();
    
    document.head.removeChild(printStyle);
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
