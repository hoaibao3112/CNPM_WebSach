/* === WIDGET ĐỀ XUẤT SẢN PHẨM (VỚI PHÂN TRANG) === */
// cách sử dụng import 2 cái này vô trang nào muốn hiển thị
//  <link rel="stylesheet" href="styles/recommend-widget.css">
// <script src="js/recommend-widget.js"></script>
// imporrt xuống cuối cùng
(function () {
    // --- CÀI ĐẶT ---
    const MOUNT_POINT_ID = 'recommend-widget-container';
    const API_URL = 'http://localhost:5000/api/product/recommendations';
    // const IMAGE_PATH_PREFIX = 'images/'; // Không cần nữa, vì đường dẫn đã có trong <img>
    const PRODUCTS_PER_PAGE = 5;
    // --- KẾT THÚC CÀI ĐẶT ---

    // Biến trạng thái
    let allProducts = [];
    let currentPage = 1;
    let mountPoint = null;

    /**
     * Hàm chạy chính khi file JS được tải
     */
    document.addEventListener('DOMContentLoaded', async () => {
        mountPoint = document.getElementById(MOUNT_POINT_ID);
        if (!mountPoint) {
            console.warn(`Widget Error: Không tìm thấy thẻ div với id="${MOUNT_POINT_ID}".`);
            return;
        }

        let customerId = getCustomerId();
        allProducts = await getRecommendations(customerId);

        if (!allProducts || allProducts.length === 0) {
            console.log("Không có sản phẩm đề xuất.");
            return;
        }

        renderWidget();
    });

    /**
     * Hàm render lại toàn bộ widget
     */
    function renderWidget() {
        const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);
        const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
        const endIndex = startIndex + PRODUCTS_PER_PAGE;
        const productsToShow = allProducts.slice(startIndex, endIndex);

        const productGridHtml = productsToShow.map(createProductCard).join('');
        const paginationHtml = createPaginationHtml(totalPages, currentPage);

        const widgetHtml = `
            <section class="recommend-section">
                <h2>Có thể bạn quan tâm</h2>
                <div class="product-grid" id="widget-product-grid">
                    ${productGridHtml}
                </div>
                <div class="pagination-controls" id="widget-pagination">
                    ${paginationHtml}
                </div>
            </section>
        `;

        mountPoint.innerHTML = widgetHtml;
        addPaginationListeners();
    }

    /**
     * Gắn sự kiện click cho các nút phân trang
     */
    function addPaginationListeners() {
        const paginationContainer = document.getElementById('widget-pagination');
        if (!paginationContainer) return;

        paginationContainer.addEventListener('click', (e) => {
            const targetButton = e.target.closest('.page-btn');
            if (!targetButton || targetButton.disabled || targetButton.classList.contains('active')) {
                return;
            }
            currentPage = parseInt(targetButton.dataset.page, 10);
            renderWidget();
        });
    }

    /**
     * Tạo HTML cho các nút phân trang
     */
    function createPaginationHtml(totalPages, currentPage) {
        if (totalPages <= 1) return '';
        let html = '';

        // Nút "Trang trước"
        html += `<button class="page-btn prev" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>&laquo;</button>`;

        // Nút số trang
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        // Nút "Trang sau"
        html += `<button class="page-btn next" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;

        return html;
    }

    /**
     * Lấy makh từ localStorage
     */
    function getCustomerId() {
        try {
            const userString = localStorage.getItem('user');
            if (userString) {
                return JSON.parse(userString).makh;
            }
        } catch (e) {
            console.error("Lỗi khi đọc user từ localStorage:", e);
        }
        return null;
    }

    /**
     * Hàm gọi API lấy đề xuất
     */
    async function getRecommendations(customerId) {
        if (!customerId) {
            console.warn("Không có customerId, không thể lấy đề xuất.");
            return [];
        }
        try {
            const response = await fetch(`${API_URL}?makh=${customerId}`);
            if (!response.ok) {
                console.error(`Lỗi API: ${response.statusText}`);
                return [];
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Lỗi mạng khi lấy đề xuất:', error);
            return [];
        }
    }


    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    window.viewDetailActivity = async function (productId) {
        let customerId = null;
        try {
            const userString = localStorage.getItem('user');
            if (userString) {
                const userObject = JSON.parse(userString);
                if (userObject && userObject.makh) {
                    customerId = userObject.makh;
                }
            }
        } catch (error) {
            console.error("Lỗi khi đọc 'user' từ localStorage:", error);
        }
        localStorage.setItem('selectedProductId', productId);
        window.location.href = 'product_detail.html';
    }

    function createProductCard(product) {
        const price = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(product.DonGia);

        const imageHtml = `
        <img src="img/product/${product.HinhAnh || 'default-book.jpg'}"
             alt="${escapeHtml(product.TenSP)}"
             onerror="this.src='img/default-book.jpg'"
             loading="lazy">
    `;

        return `
        <a href="javascript:void(0)" onclick="viewDetailActivity(${product.MaSP})" class="product-card" title="${escapeHtml(product.TenSP)}">
            <div class="card-image">
                ${imageHtml}
            </div>
            <div class="card-content">
                <h3 class="card-title">${escapeHtml(product.TenSP)}</h3>
                <p class="card-price">${price}</p>
            </div>
        </a>
    `;
    }

})(); 