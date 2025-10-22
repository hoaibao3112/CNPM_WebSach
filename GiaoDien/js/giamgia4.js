document.addEventListener('DOMContentLoaded', () => {
    const categoryUl = document.querySelector('.category');
    const productRow = document.querySelector('.product-row');

    // ===== Hàm render sản phẩm =====
    function renderProducts(products) {
        productRow.innerHTML = '';
        if (!products || products.length === 0) {
        productRow.innerHTML = '<p>Không có sản phẩm nào.</p>';
        return;
        }

        products.forEach(p => {
        const div = document.createElement('div');
        div.classList.add('product-item');

        div.addEventListener('click', () => {
            localStorage.setItem('selectedProductId', p.MaSP);
            window.location.href = 'product_detail.html';
        });

        div.innerHTML = `
            <img src="../server/backend/product/${p.HinhAnh}" alt="${p.TenSP}">
            <div class="item-new-name">
            <span class="new">Mới</span>
            <span class="name">${p.TenSP}</span>
            </div>
            <div class="item-price">
            <span class="price">${p.DonGia.toLocaleString()}</span>
            <span class="unit">đ</span>
            </div>
        `;
        productRow.appendChild(div);
        });
    }

    // ===== Lấy danh sách category và gán sự kiện =====
    fetch('http://localhost:5000/api/product/categories')
        .then(res => res.json())
        .then(categories => {
        categoryUl.innerHTML = '';

        // "Tất cả" luôn đầu tiên
        const allLi = document.createElement('li');
        allLi.textContent = 'Tất cả';
        allLi.dataset.id = 'all';
        allLi.classList.add('active');
        categoryUl.appendChild(allLi);

        categories.forEach(cat => {
            const li = document.createElement('li');
            li.textContent = cat.TenTL;
            li.dataset.id = cat.MaTL;
            categoryUl.appendChild(li);
        });

        function loadProducts(categoryId) {
            const url = `http://localhost:5000/api/product/category-current-year/${categoryId === 'all' ? 'all' : categoryId}`;
            fetch(url)
            .then(res => res.json())
            .then(renderProducts)
            .catch(err => console.error('Lỗi khi load sản phẩm:', err));
        }

        loadProducts('all');

        categoryUl.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
            categoryUl.querySelectorAll('li').forEach(x => x.classList.remove('active'));
            li.classList.add('active');
            loadProducts(li.dataset.id);
            });
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
