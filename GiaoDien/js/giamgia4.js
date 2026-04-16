document.addEventListener('DOMContentLoaded', () => {
    const categoryUl = document.querySelector('.category');
    const productRow = document.querySelector('.product-row');

    // ===== Hàm render sản phẩm =====
    // Render up to `limit` products (default 5)
    function renderProducts(products, limit = 5) {
        productRow.innerHTML = '';
        if (!products || products.length === 0) {
            productRow.innerHTML = '<p>Không có sản phẩm nào.</p>';
            return;
        }

        // Only show first `limit` products to avoid repeated long lists
        const slice = products.slice(0, limit);

        slice.forEach(p => {
            const div = document.createElement('div');
            div.classList.add('product-item');

            div.addEventListener('click', () => {
                localStorage.setItem('selectedProductId', p.MaSP);
                window.location.href = 'product_detail.html';
            });

            const imgSrc = p.HinhAnh ? `img/product/${p.HinhAnh}` : 'img/product/default-book.jpg';

            div.innerHTML = `
                <img src="${imgSrc}" loading="lazy" onerror="this.src='img/product/default-book.jpg'" />
                <div class="item-new-name">
                    <span class="new">Mới</span>
                    <span class="name">${p.TenSP}</span>
                </div>
                <div class="item-price">
                    <span class="price">${Number(p.DonGia).toLocaleString()}</span>
                    <span class="unit">đ</span>
                </div>
            `;
            productRow.appendChild(div);
        });
    }

    // ===== Lấy danh sách category và gán sự kiện =====
    fetch(`${window.API_CONFIG.BASE_URL}/api/product/categories`)
        .then(res => {
            // ✅ FIX: Check response.ok trước khi gọi .json()
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
        })
        .then(categories => {
            // ✅ FIX: API trả về { data: [...] } hoặc array trực tiếp - handle cả hai
            let categoryList = categories;
            if (!Array.isArray(categories)) {
                // Nếu response là object, lấy data field
                if (categories && categories.data && Array.isArray(categories.data)) {
                    categoryList = categories.data;
                } else {
                    console.warn('⚠️ API response structure không hợp lệ:', categories);
                    categoryList = [];
                }
            }
            
            // Clear existing list first
            categoryUl.innerHTML = '';

            // Always add "Tất cả" first
            const allLi = document.createElement('li');
            allLi.textContent = 'Tất cả';
            allLi.dataset.id = 'all';
            allLi.classList.add('active');
            categoryUl.appendChild(allLi);

            // Deduplicate categories based on MaTL
            const seen = new Set();
            categoryList.forEach(cat => {
                const id = String(cat.MaTL);
                if (seen.has(id)) return; // skip duplicate
                seen.add(id);

                const li = document.createElement('li');
                li.textContent = cat.TenTL;
                li.dataset.id = id;
                categoryUl.appendChild(li);
            });

            // Load products for a given category. Render only up to 5 items.
            function loadProducts(categoryId) {
                // ✅ FIX: Sử dụng endpoint đúng /api/product/category/:id
                // Nếu categoryId='all', lấy tất cả sản phẩm từ /api/product
                const url = categoryId === 'all' 
                    ? `${window.API_CONFIG.BASE_URL}/api/product`
                    : `${window.API_CONFIG.BASE_URL}/api/product/category/${categoryId}`;
                fetch(url)
                    .then(res => {
                        // ✅ FIX: Validate response
                        if (!res.ok) {
                            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                        }
                        return res.json();
                    })
                    .then(response => {
                        // ✅ FIX: Handle both array and { data: [...] } responses
                        const products = Array.isArray(response) ? response : (response.data || []);
                        if (!Array.isArray(products)) {
                            throw new Error('Invalid response format: products is not an array');
                        }
                        renderProducts(products, 5);
                    })
                    .catch(err => {
                        console.error('❌ Lỗi khi load sản phẩm:', err);
                        productRow.innerHTML = `<p>Lỗi tải sản phẩm: ${err.message}</p>`;
                    });
            }

            loadProducts('all');

            // Use event delegation to avoid attaching multiple listeners
            categoryUl.addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (!li) return;
                categoryUl.querySelectorAll('li').forEach(x => x.classList.remove('active'));
                li.classList.add('active');
                loadProducts(li.dataset.id);
            });
        })
        .catch(err => console.error('Lỗi khi lấy danh sách thể loại:', err));

    // ===== Slider kéo ngang =====
    const slider = document.querySelector('.wrapper > .category');
    let isDown = false, startX, scrollLeft;

    slider.addEventListener('mousedown', e => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('active'); });
    slider.addEventListener('mouseup', () => { isDown = false; slider.classList.remove('active'); });

    slider.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        slider.scrollLeft = scrollLeft - (x - startX) * 2;
    });

    slider.addEventListener('dragstart', e => e.preventDefault());
});

