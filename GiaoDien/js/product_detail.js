document.addEventListener('DOMContentLoaded', function() {
    // 1. Lấy thông tin sản phẩm từ các nguồn
    const productInfo = getProductInfoFromSources();
    
    // 2. Xử lý hiển thị theo dữ liệu nhận được
    if (!productInfo) {
        showError('Không tìm thấy sản phẩm');
        return;
    }
  
    if (productInfo.fullData) {
        console.log('Product data from localStorage:', productInfo.data);
        displayProductDetail(productInfo.data);
        fetchRelatedProducts(productInfo.data.MaSP);
        if (productInfo.data.MaTG && productInfo.data.MaTG !== 'null' && productInfo.data.MaTG !== '') {
            fetchRelatedAuthor(productInfo.data.MaTG);
        } else {
            console.warn('No valid MaTG found for product:', productInfo.data.MaSP);
            document.getElementById('related-authors').innerHTML = '<p>Không có thông tin tác giả</p>';
        }
    } else {
        fetchProductDetail(productInfo.data);
    }
  
    // 3. Thiết lập các sự kiện
    setupEventListeners();
    setupCommentSection(productInfo.data.MaSP || productInfo.data);
});

/**
 * Lấy thông tin sản phẩm từ nhiều nguồn theo thứ tự ưu tiên
 */
function getProductInfoFromSources() {
    const storedProduct = localStorage.getItem('currentProduct');
    if (storedProduct) {
        try {
            const product = JSON.parse(storedProduct);
            if (isValidProduct(product)) {
                localStorage.removeItem('currentProduct');
                return { fullData: true, data: product };
            }
        } catch (e) {
            console.error('Lỗi phân tích dữ liệu từ localStorage', e);
        }
    }
  
    const urlParams = new URLSearchParams(window.location.search);
    const productIdFromUrl = urlParams.get('id');
    if (productIdFromUrl) {
        return { fullData: false, data: productIdFromUrl };
    }
  
    const storedId = localStorage.getItem('selectedProductId');
    if (storedId) {
        localStorage.removeItem('selectedProductId');
        return { fullData: false, data: storedId };
    }
  
    return null;
}

/**
 * Kiểm tra đối tượng sản phẩm hợp lệ
 */
function isValidProduct(product) {
    return product?.MaSP && product?.TenSP && product?.DonGia !== undefined;
}

/**
 * Thiết lập sự kiện cho nút bấm
 */
function setupEventListeners() {
    const addToCartBtn = document.getElementById('add-to-cart');
    const buyNowBtn = document.getElementById('buy-now');
    const addToWishlistBtn = document.getElementById('add-to-wishlist');

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCart);
    } else {
        console.error('Error: add-to-cart button not found');
    }

    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', buyNow);
    } else {
        console.error('Error: buy-now button not found');
    }

    if (addToWishlistBtn) {
        addToWishlistBtn.addEventListener('click', addToWishlist);
    } else {
        console.error('Error: add-to-wishlist button not found');
    }
}

/**
 * Thiết lập phần bình luận
 */
function setupCommentSection(productId) {
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment-input');
    const submitCommentBtn = document.getElementById('submit-comment');
    const commentMessage = document.getElementById('comment-message');
    const charCount = document.getElementById('comment-char-count');

    // Kiểm tra trạng thái đăng nhập
    const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('loggedInUser'));
    const token = localStorage.getItem('token');
    if (!user || !token) {
        commentInput.disabled = true;
        submitCommentBtn.disabled = true;
        commentMessage.textContent = 'Vui lòng đăng nhập để gửi bình luận.';
        commentMessage.classList.add('error');
        return;
    }

    // Kích hoạt input và nút gửi
    commentInput.disabled = false;
    submitCommentBtn.disabled = true;

    // Cập nhật bộ đếm ký tự
    const updateCharCount = () => {
        const length = commentInput.value.length;
        charCount.textContent = `${length}/500`;
        charCount.classList.toggle('warning', length > 450);
        submitCommentBtn.disabled = length === 0;
    };
    commentInput.addEventListener('input', updateCharCount);
    updateCharCount();

    // Tải và hiển thị bình luận
    displayComments(productId);

    // Sự kiện gửi bình luận
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const commentText = commentInput.value.trim();
        if (!commentText) {
            commentMessage.textContent = 'Vui lòng nhập nội dung bình luận.';
            commentMessage.classList.add('error');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ masp: productId, noidung: commentText })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.errors?.[0] || 'Lỗi khi gửi bình luận');
            }

            commentInput.value = '';
            updateCharCount();
            commentMessage.textContent = 'Bình luận đã được gửi!';
            commentMessage.classList.remove('error');
            commentMessage.classList.add('success');
            displayComments(productId);
        } catch (error) {
            commentMessage.textContent = error.message;
            commentMessage.classList.add('error');
        }
    });

    // Xóa thông báo khi nhập lại
    commentInput.addEventListener('input', () => {
        commentMessage.textContent = '';
        commentMessage.classList.remove('error', 'success');
    });
}

/**
 * Hiển thị danh sách bình luận
 */
async function displayComments(productId) {
    const commentsList = document.getElementById('comments-list');
    try {
        const response = await fetch(`http://localhost:5000/api/comments/product/${productId}`);
        if (!response.ok) throw new Error('Lỗi khi tải bình luận');
        const { data: comments } = await response.json();

        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">Chưa có bình luận nào.</p>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-avatar">${escapeHtml(comment.tenkh[0].toUpperCase())}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-user">${escapeHtml(comment.tenkh)}</span>
                        <span class="comment-date">${formatDate(comment.ngaybinhluan)}</span>
                    </div>
                    <p class="comment-text">${escapeHtml(comment.noidung)}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        commentsList.innerHTML = '<p class="error">Lỗi khi tải bình luận.</p>';
    }
}

/**
 * Gọi API lấy chi tiết sản phẩm
 */
async function fetchProductDetail(productId) {
    try {
        showLoadingState();
        const response = await fetch(`http://localhost:5000/api/product/${productId}`);
        
        if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
        
        const product = await response.json();
        console.log('Product data from API:', product);
        localStorage.setItem('currentProduct', JSON.stringify(product));
        displayProductDetail(product);
        fetchRelatedProducts(product.MaSP);
        if (product.MaTG && product.MaTG !== 'null' && product.MaTG !== '') {
            fetchRelatedAuthor(product.MaTG);
        } else {
            console.warn('No valid MaTG found for product:', product.MaSP);
            document.getElementById('related-authors').innerHTML = '<p>Không có thông tin tác giả</p>';
        }
    } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error);
        showError('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
    }
}

/**
 * Lấy thông tin tác giả liên quan
 */
async function fetchRelatedAuthor(authorId) {
    try {
        console.log(`Fetching author with MaTG: ${authorId}`);
        const response = await fetch(`http://localhost:5000/api/author/${authorId}`);
        if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);
        
        const author = await response.json();
        console.log('Author data:', author);
        displayRelatedAuthor(author);
    } catch (error) {
        console.error('Lỗi khi tải tác giả liên quan:', error);
        document.getElementById('related-authors').innerHTML = `
            <p class="error">Không thể tải thông tin tác giả: ${error.message}</p>
        `;
    }
}

/**
 * Hiển thị thông tin tác giả liên quan
 */
function displayRelatedAuthor(author) {
    const container = document.getElementById('related-authors');
    if (!author || !author.MaTG || author.MaTG === 'null' || !author.TenTG) {
        container.innerHTML = '<p>Không có thông tin tác giả</p>';
        return;
    }
  
    const imageSrc = author.AnhTG ? `img/author/${author.AnhTG}` : `img/author/tg${author.MaTG}.jpg`;
    const fallbackSrc = `img/author/tg${author.MaTG}.png`;
  
    container.innerHTML = `
        <div class="author-card">
            <img src="${imageSrc}" alt="${escapeHtml(author.TenTG)}" 
                 onerror="this.src='${fallbackSrc}'; this.onerror=() => this.src='https://via.placeholder.com/200?text=Author'">
            <h3>${escapeHtml(author.TenTG)}</h3>
            <p>Quốc tịch: ${escapeHtml(author.QuocTich || 'Không rõ')}</p>
            <p>Ngày sinh: ${author.NgaySinh ? new Date(author.NgaySinh).toLocaleDateString('vi-VN') : 'Không rõ'}</p>
            <p class="author-bio">${escapeHtml(author.TieuSu || 'Không có tiểu sử')}</p>
            <button class="view-author-detail-btn" onclick="viewAuthorDetail('${author.MaTG}')">Xem chi tiết</button>
        </div>
    `;
}

/**
 * Chuyển hướng đến trang author.html
 */
window.viewAuthorDetail = (authorId) => {
    localStorage.setItem('selectedAuthorId', authorId);
    window.location.href = 'author.html';
};

/**
 * Hiển thị chi tiết sản phẩm
 */
function displayProductDetail(product) {
    document.getElementById('product-title').textContent = product.TenSP || 'Không có tiêu đề';
    document.getElementById('product-title-breadcrumb').textContent = product.TenSP || 'Chi tiết sản phẩm';
    document.getElementById('product-author').textContent = product.TenTG || 'Không rõ tác giả';
    document.getElementById('product-publisher').textContent = product.TenNXB || 'Không rõ NXB';
    
    const mainImage = document.getElementById('main-product-image');
    mainImage.src = `img/product/${product.HinhAnh || 'default-book.jpg'}`;
    mainImage.alt = escapeHtml(product.TenSP);
    mainImage.onerror = () => mainImage.src = 'https://via.placeholder.com/300x400?text=Book';
    
    updatePriceDisplay(product);
    document.getElementById('product-description').innerHTML = product.MoTa || 'Không có mô tả';
    
    document.getElementById('add-to-cart').dataset.product = JSON.stringify({
        id: product.MaSP,
        name: product.TenSP,
        price: product.DonGia,
        image: product.HinhAnh || 'default-book.jpg'
    });
}

/**
 * Cập nhật hiển thị giá và khuyến mãi
 */
function updatePriceDisplay(product) {
    const priceElement = document.getElementById('product-price');
    const originalPriceElement = document.getElementById('product-original-price');
    const discountElement = document.getElementById('product-discount');
  
    priceElement.textContent = formatPrice(product.DonGia);
  
    if (product.GiaBia > product.DonGia) {
        originalPriceElement.textContent = formatPrice(product.GiaBia);
        originalPriceElement.style.display = 'inline';
        const discount = Math.round((1 - product.DonGia / product.GiaBia) * 100);
        const discountAmount = product.GiaBia - product.DonGia;
        discountElement.textContent = `Tiết kiệm: ${formatPrice(discountAmount)} (${discount}%)`;
        discountElement.style.display = 'block';
    } else {
        originalPriceElement.style.display = 'none';
        discountElement.style.display = 'none';
    }
}

/**
 * Lấy sản phẩm liên quan
 */
async function fetchRelatedProducts(currentProductId) {
    try {
        const response = await fetch('http://localhost:5000/api/product');
        if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);
        
        const allProducts = await response.json();
        if (!Array.isArray(allProducts)) throw new Error('Dữ liệu không phải mảng');
  
        const relatedProducts = allProducts
            .filter(product => product.MaSP !== currentProductId)
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);
  
        if (relatedProducts.length > 0) {
            displayRelatedProducts(relatedProducts);
        } else {
            document.getElementById('related-products').innerHTML = '<p>Không có sản phẩm liên quan</p>';
        }
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm liên quan:', error);
        document.getElementById('related-products').innerHTML = `
            <p class="error">Không thể tải sản phẩm liên quan</p>
        `;
    }
}

/**
 * Hiển thị sản phẩm liên quan
 */
function displayRelatedProducts(products) {
    const container = document.getElementById('related-products');
    if (!products?.length) {
        container.innerHTML = '<p>Không có sản phẩm liên quan</p>';
        return;
    }
  
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <a href="product_detail.html?id=${product.MaSP}" 
               onclick="saveProductBeforeRedirect(${JSON.stringify(product)})">
                <img src="img/product/${product.HinhAnh || 'default-book.jpg'}" 
                     alt="${escapeHtml(product.TenSP)}" 
                     onerror="this.src='https://via.placeholder.com/300x400?text=Book'">
                <h3>${escapeHtml(product.TenSP)}</h3>
                <div class="price-wrapper">
                    <div class="final-price">${formatPrice(product.DonGia)}</div>
                    ${product.GiaBia > product.DonGia ? 
                      `<div class="original-price">${formatPrice(product.GiaBia)}</div>` : ''}
                </div>
            </a>
        </div>
    `).join('');
}

/**
 * Lưu sản phẩm trước khi chuyển trang
 */
window.saveProductBeforeRedirect = (product) => {
    localStorage.setItem('currentProduct', JSON.stringify(product));
};

/**
 * Thêm vào giỏ hàng
 */
function addToCart() {
    const addToCartBtn = document.getElementById('add-to-cart');
    if (!addToCartBtn || !addToCartBtn.dataset.product) {
        console.error('Error: add-to-cart button or dataset.product is not set');
        showAlert('Lỗi: Không thể thêm sản phẩm vào giỏ hàng.', 'error');
        return;
    }

    try {
        const productData = JSON.parse(addToCartBtn.dataset.product);
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        const existingItem = cart.find(item => item.id === productData.id);
        existingItem ? existingItem.quantity++ : cart.push({...productData, quantity: 1});
        
        console.log('Updated cart:', cart);
        localStorage.setItem('cart', JSON.stringify(cart));
        showAlert(`Đã thêm "${productData.name}" vào giỏ hàng!`, 'success');
    } catch (error) {
        console.error('Error in addToCart:', error);
        showAlert('Lỗi: Không thể thêm sản phẩm vào giỏ hàng.', 'error');
    }
}

/**
 * Mua ngay
 */
function buyNow() {
    const addToCartBtn = document.getElementById('add-to-cart');
    if (!addToCartBtn || !addToCartBtn.dataset.product) {
        console.error('Error: add-to-cart button or dataset.product is not set');
        showAlert('Lỗi: Không thể thêm sản phẩm vào giỏ hàng.', 'error');
        return;
    }

    try {
        const productData = JSON.parse(addToCartBtn.dataset.product);
        addToCart();
        showAlert(`Đã thêm "${productData.name}" vào giỏ hàng. Đang chuyển đến giỏ hàng...`, 'success');
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 1000);
    } catch (error) {
        console.error('Error in buyNow:', error);
        showAlert('Lỗi: Không thể thêm sản phẩm vào giỏ hàng.', 'error');
    }
}

/**
 * Thêm vào danh sách yêu thích
 */
function addToWishlist(event) {
    const productData = JSON.parse(document.getElementById('add-to-cart').dataset.product);
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    if (!wishlist.some(item => item.id === productData.id)) {
        wishlist.push(productData);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        event.target.innerHTML = '<i class="fas fa-heart"></i> Đã thêm vào yêu thích';
        showAlert(`Đã thêm "${productData.name}" vào danh sách yêu thích!`, 'success');
    } else {
        showAlert('Sản phẩm đã có trong danh sách yêu thích!', 'info');
    }
}

/**
 * Hàm hỗ trợ
 */
const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + ' đ';

/**
 * Hiển thị thông báo dạng toast
 */
function showAlert(message, type = 'success') {
    // Tạo phần tử toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    // Thêm toast vào container
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.appendChild(toast);
    document.body.appendChild(container);

    // Kích hoạt animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Xóa toast sau 3 giây
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            container.remove();
        }, 300); // Đợi animation hoàn tất
    }, 3000);
}

/**
 * Hiển thị trạng thái tải
 */
function showLoadingState() {
    document.getElementById('product-title').textContent = 'Đang tải...';
    document.getElementById('product-description').textContent = 'Đang tải mô tả sản phẩm...';
    document.getElementById('related-products').innerHTML = '<div class="loading-related">Đang tải sản phẩm...</div>';
    document.getElementById('related-authors').innerHTML = '<div class="loading-authors">Đang tải thông tin tác giả...</div>';
}

/**
 * Hiển thị lỗi
 */
function showError(message) {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <a href="book.html" class="back-button">Quay lại trang sản phẩm</a>
        </div>
    `;
}

/**
 * Chuyển đổi định dạng ngày
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Bảo vệ chống XSS
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}