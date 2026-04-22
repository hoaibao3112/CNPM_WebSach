(function () {
    // Inject Styles
    if (!document.getElementById('recommend-widget-styles')) {
        const style = document.createElement('style');
        style.id = 'recommend-widget-styles';
        style.textContent = `
            .recommend-section { max-width: 1300px; margin: 40px auto; background: #fff; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); padding: 32px; border: 1px solid #eee; position: relative; }
            .recommend-section h2 { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 800; color: #1a1a1a; text-align: center; margin-bottom: 32px; display: flex; align-items: center; justify-content: center; gap: 12px; }
            .recommend-section h2 .title-icon { color: #C0392B; }
            .widget-empty { text-align: center; padding: 40px; color: #666; font-style: italic; }
            .product-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }
            .product-card { display: flex; flex-direction: column; background: #fff; border: 1px solid #eee; border-radius: 16px; overflow: hidden; transition: all 0.3s; text-decoration: none; }
            .product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-color: #C0392B; }
            .card-image { width: 100%; aspect-ratio: 3/4; overflow: hidden; background: #f9f9f9; display: flex; align-items: center; justify-content: center; }
            .card-image img { width: 100%; height: 100%; object-fit: contain; }
            .card-content { padding: 16px; flex: 1; display: flex; flex-direction: column; }
            .card-title { font-size: 14px; font-weight: 700; color: #333; margin: 0 0 8px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .card-author { font-size: 12px; color: #888; margin-bottom: 4px; }
            .card-meta { font-size: 11px; color: #aaa; margin-bottom: 8px; }
            .card-price { font-size: 16px; font-weight: 800; color: #C0392B; margin-top: auto; }
            .pagination-controls { display: flex; justify-content: center; gap: 8px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee; }
            .page-btn { min-width: 32px; height: 32px; border-radius: 8px; border: 1px solid #ddd; background: #fff; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s; }
            .page-btn:hover:not(:disabled) { border-color: #C0392B; color: #C0392B; }
            .page-btn.active { background: #C0392B; color: #fff; border-color: #C0392B; }
            .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            @media (max-width: 1024px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
            @media (max-width: 640px) { .product-grid { grid-template-columns: repeat(2, 1fr); } .recommend-section { padding: 20px; } }
        `;
        document.head.appendChild(style);
    }
    // --- CÀI ĐẶT ---
    const MOUNT_POINT_ID = 'recommend-widget-container';
    const API_URL = `${window.API_CONFIG.BASE_URL}/api/product/recommendations`;
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
        // If no customerId available (e.g. visiting profile before login),
        // attempt to fetch public/popular recommendations so the widget still shows.
            // pass 'public' when no customerId to let server return popular items
            allProducts = await getRecommendations(customerId || 'public');

        if (!allProducts || allProducts.length === 0) {
            console.log("Không có sản phẩm đề xuất.");
            // still render an empty placeholder so layout is visible to help debugging
            mountPoint.innerHTML = `<section class="recommend-section"><h2><span class="title-icon">✨</span> Có Thể Bạn Quan Tâm <span class="title-icon">✨</span></h2><div class="widget-empty">Chưa có đề xuất</div></section>`;
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
                <h2>
                    <span class="title-icon">✨</span>
                    Có Thể Bạn Quan Tâm
                    <span class="title-icon">✨</span>
                </h2>
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
        // customerId may be 'public' to fetch popular products
        try {
            const response = await fetch(`${API_URL}?makh=${customerId}`);
            if (!response.ok) {
                console.error(`Lỗi API: ${response.statusText}`);
                return [];
            }
            const responseData = await response.json();
            const data = responseData.data || responseData;
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
                    ${product.TacGia ? `<p class="card-author">Tác giả: ${escapeHtml(product.TacGia)}</p>` : ''}
                    <p class="card-meta">
                      ${product.NamXB ? `Năm: ${escapeHtml(String(product.NamXB))}` : ''}
                      ${product.SoLuong !== undefined && product.SoLuong !== null ? ` • Còn: ${escapeHtml(String(product.SoLuong))}` : ''}
                    </p>
                    <p class="card-price">${price}</p>
            </div>
        </a>
    `;
    }

})(); 
