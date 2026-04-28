// Trong hàm DOMContentLoaded, thêm:

document.addEventListener('DOMContentLoaded', function() {
    const productInfo = getProductInfoFromSources();
    
    if (!productInfo) {
        showError('Không tìm thấy sản phẩm');
        return;
    }

    if (productInfo.fullData) {
        console.log('Product data from localStorage:', productInfo.data);


        displayProductDetail(productInfo.data);
        fetchRelatedProducts(productInfo.data.MaSP);
        fetchRatings(productInfo.data.MaSP);
        // THÊM: Check promotions
        checkAndDisplayPromotions(productInfo.data.MaSP);
        
        if (productInfo.data.MaTG && productInfo.data.MaTG !== 'null' && productInfo.data.MaTG !== '') {
            fetchRelatedAuthor(productInfo.data.MaTG);
        }
    } else {
        fetchProductDetail(productInfo.data);
    }

    setupEventListeners();
    setupQuantitySelector();
    setupRatingSection(productInfo.data.MaSP || productInfo.data);


    const container = document.getElementById('promotions-container');
    container.addEventListener('wheel', function(e) {
    if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY * 4; // Tăng hệ số để cuộn nhanh hơn
    }
});
});

/**
 * Lấy thông tin sản phẩm từ nhiều nguồn theo thứ tự ưu tiên
 */
function getProductInfoFromSources() {
    
    const urlParams = new URLSearchParams(window.location.search);
    const productIdFromUrl = urlParams.get('id');
    if (productIdFromUrl) {
        return { fullData: false, data: productIdFromUrl };
    }

    // const storedProduct = localStorage.getItem('currentProduct');
    // if (storedProduct) {
    //     try {
    //         const product = JSON.parse(storedProduct);
    //         if (isValidProduct(product)) {
    //             localStorage.removeItem('currentProduct');
    //             return { fullData: true, data: product };
    //         }
    //     } catch (e) {
    //         console.error('Lỗi phân tích dữ liệu từ localStorage', e);
    //     }
    // }
  
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

    // Author click handler
    const authorEl = document.getElementById('product-author');
    if (authorEl) {
        authorEl.addEventListener('click', () => {
            const currentProduct = JSON.parse(localStorage.getItem('currentProduct') || '{}');
            const maTG = currentProduct.MaTG || currentProduct.matg;
            if (maTG) viewAuthorDetail(maTG);
        });
    }

    // Tab switching logic
    const tabInfoBtn = document.getElementById('tab-info-btn');
    const tabShippingBtn = document.getElementById('tab-shipping-btn');
    const tabInfoContent = document.getElementById('tab-info-content');
    const tabShippingContent = document.getElementById('tab-shipping-content');

    if (tabInfoBtn && tabShippingBtn && tabInfoContent && tabShippingContent) {
        tabInfoBtn.addEventListener('click', () => {
            // Update buttons
            tabInfoBtn.classList.add('text-primary', 'border-b-4', 'border-primary');
            tabInfoBtn.classList.remove('text-text-light');
            tabShippingBtn.classList.remove('text-primary', 'border-b-4', 'border-primary');
            tabShippingBtn.classList.add('text-text-light');
            
            // Update content
            tabInfoContent.classList.remove('hidden');
            tabShippingContent.classList.add('hidden');
        });

        tabShippingBtn.addEventListener('click', () => {
            // Update buttons
            tabShippingBtn.classList.add('text-primary', 'border-b-4', 'border-primary');
            tabShippingBtn.classList.remove('text-text-light');
            tabInfoBtn.classList.remove('text-primary', 'border-b-4', 'border-primary');
            tabInfoBtn.classList.add('text-text-light');
            
            // Update content
            tabShippingContent.classList.remove('hidden');
            tabInfoContent.classList.add('hidden');
        });
    }
}

/**
 * Thiết lập bộ chọn số lượng
 */
function setupQuantitySelector() {
    const minusBtn = document.getElementById('qty-minus');
    const plusBtn = document.getElementById('qty-plus');
    const qtyInput = document.getElementById('qty-input');

    if (!minusBtn || !plusBtn || !qtyInput) return;

    // Xóa sự kiện cũ (nếu có) để tránh bị lặp (double-bound)
    const newMinusBtn = minusBtn.cloneNode(true);
    const newPlusBtn = plusBtn.cloneNode(true);
    minusBtn.parentNode.replaceChild(newMinusBtn, minusBtn);
    plusBtn.parentNode.replaceChild(newPlusBtn, plusBtn);

    newMinusBtn.addEventListener('click', () => {
        let val = parseInt(qtyInput.value) || 1;
        if (val > 1) qtyInput.value = val - 1;
        qtyInput.dispatchEvent(new Event('change')); // Kích hoạt sự kiện change để đồng bộ
    });

    newPlusBtn.addEventListener('click', () => {
        let val = parseInt(qtyInput.value) || 1;
        if (val < 99) qtyInput.value = val + 1;
        qtyInput.dispatchEvent(new Event('change')); // Kích hoạt sự kiện change để đồng bộ
    });

    qtyInput.addEventListener('change', () => {
        let val = parseInt(qtyInput.value) || 1;
        if (val < 1) qtyInput.value = 1;
        if (val > 99) qtyInput.value = 99;
    });
}

/**
 * Thiết lập phần đánh giá
 */
function setupRatingSection(productId) {
    const ratingForm = document.getElementById('rating-form');
    if (!ratingForm) return; // Nếu không có form đánh giá

    const ratingInput = document.getElementById('rating-comment');
    const submitRatingBtn = document.getElementById('submit-rating');
    const ratingMessage = document.getElementById('rating-message');
    const charCount = document.getElementById('rating-char-count');
    const starInputs = document.querySelectorAll('#star-input i');

    // Kiểm tra trạng thái đăng nhập
    const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('loggedInUser'));
    const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);

    if (!user || !token) {
        ratingInput.disabled = true;
        submitRatingBtn.disabled = true;
        ratingMessage.textContent = 'Vui lòng đăng nhập để gửi đánh giá.';
        ratingMessage.classList.add('error');
        return;
    }

    ratingInput.disabled = false;
    submitRatingBtn.disabled = true;

    let selectedStars = 0;
    let isEditing = false;
    let editingRatingId = null;

    // Xử lý chọn sao
    starInputs.forEach(star => {
        star.addEventListener('click', () => {
            selectedStars = parseInt(star.dataset.value);
            starInputs.forEach(s => {
                s.classList.toggle('fas', parseInt(s.dataset.value) <= selectedStars);
                s.classList.toggle('far', parseInt(s.dataset.value) > selectedStars);
            });
            submitRatingBtn.disabled = selectedStars === 0;
        });
    });

    // Đếm ký tự nhận xét
    const updateCharCount = () => {
        const length = ratingInput.value.length;
        charCount.textContent = `${length}/500`;
        charCount.classList.toggle('warning', length > 450);
        submitRatingBtn.disabled = selectedStars === 0;
    };
    ratingInput.addEventListener('input', updateCharCount);
    updateCharCount();

    // Xử lý submit form đánh giá
    ratingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (selectedStars === 0) {
            showAlert('Vui lòng chọn số sao!', 'error');
            return;
        }

        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${_apiBase}/api/ratings/${editingRatingId}` : `${_apiBase}/api/ratings`;
        const body = {
            masp: productId,
            sosao: selectedStars,
            nhanxet: ratingInput.value.trim() || null
        };

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();
            if (response.ok) {
                showAlert(result.message, 'success');
                // Reset form
                ratingInput.value = '';
                selectedStars = 0;
                starInputs.forEach(s => s.classList.replace('fas', 'far'));
                submitRatingBtn.disabled = true;
                submitRatingBtn.textContent = 'Gửi đánh giá';
                submitRatingBtn.dataset.ratingId = '';
                isEditing = false;
                editingRatingId = null;
                // Reload đánh giá
                fetchRatings(productId);
            } else {
                showAlert(result.error || 'Lỗi khi gửi đánh giá', 'error');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            showAlert('Lỗi khi gửi đánh giá', 'error');
        }
    });
}

/**
 * Lấy danh sách đánh giá từ API
 */
async function fetchRatings(productId) {
    try {
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
        const response = await fetch(`${_apiBase}/api/ratings/${productId}`);
        if (response.ok) {
            const responseData = await response.json();
            const result = responseData.data || responseData;
            displayRatings(result.ratings || [], result.averageRating || 0, result.totalRatings || 0, productId);
        } else {
            const result = await response.json();
            showAlert(result.error || 'Lỗi khi tải đánh giá', 'error');
        }
    } catch (error) {
        console.error('Error fetching ratings:', error);
        showAlert('Lỗi khi tải đánh giá', 'error');
    }
}

/**
 * Hiển thị danh sách đánh giá
 */
function displayRatings(ratings, averageRating, totalRatings, productId) {
    const ratingsList = document.getElementById('ratings-list');
    const averageRatingEl = document.getElementById('average-rating');
    const totalRatingsEl = document.getElementById('total-ratings');
    const starDisplay = document.getElementById('star-display');
    const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('loggedInUser'));
    const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);

    if (!ratingsList || !averageRatingEl || !totalRatingsEl || !starDisplay) return;

    averageRatingEl.textContent = averageRating.toFixed(1);
    totalRatingsEl.textContent = `(${totalRatings} đánh giá)`;
    starDisplay.innerHTML = generateStarDisplay(averageRating);

    if (ratings.length === 0) {
        ratingsList.innerHTML = '<p>Chưa có đánh giá nào.</p>';
        return;
    }

    ratingsList.innerHTML = ratings.map(rating => {
        const isOwnRating = user && user.makh === rating.MaKH;
        return `
            <div class="rating-item">
                <div class="rating-header">
                    <span class="rating-user">${escapeHtml(rating.TenKH)}</span>
                    <span class="rating-stars">${generateStarDisplay(rating.SoSao)}</span>
                    <span class="rating-date">${formatDate(rating.NgayDanhGia)}</span>
                </div>
                <p class="rating-comment">${rating.NhanXet ? escapeHtml(rating.NhanXet) : 'Không có nhận xét'}</p>
                ${isOwnRating ? `
                    <div class="rating-actions">
                        <button class="edit-rating" data-id="${rating.MaDG}" data-stars="${rating.SoSao}" data-comment="${escapeHtml(rating.NhanXet || '')}">Chỉnh sửa</button>
                        <button class="delete-rating" data-id="${rating.MaDG}">Xóa</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    // Xử lý nút chỉnh sửa
    document.querySelectorAll('.edit-rating').forEach(btn => {
        btn.addEventListener('click', () => {
            const ratingId = btn.dataset.id;
            const stars = parseInt(btn.dataset.stars);
            const comment = btn.dataset.comment;
            const starInputs = document.querySelectorAll('#star-input i');
            const submitRatingBtn = document.getElementById('submit-rating');

            // Điền sao
            starInputs.forEach(s => {
                s.classList.toggle('fas', parseInt(s.dataset.value) <= stars);
                s.classList.toggle('far', parseInt(s.dataset.value) > stars);
            });

            // Điền nhận xét
            document.getElementById('rating-comment').value = comment;

            // Chuyển sang chế độ chỉnh sửa
            submitRatingBtn.textContent = 'Cập nhật đánh giá';
            submitRatingBtn.dataset.ratingId = ratingId;
            document.getElementById('rating-form').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Xử lý nút xóa
    document.querySelectorAll('.delete-rating').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

            const ratingId = btn.dataset.id;
            try {
                const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
                const response = await fetch(`${_apiBase}/api/ratings/${ratingId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const result = await response.json();
                if (response.ok) {
                    showAlert(result.message, 'success');
                    fetchRatings(productId);
                } else {
                    showAlert(result.error || 'Lỗi khi xóa đánh giá', 'error');
                }
            } catch (error) {
                console.error('Error deleting rating:', error);
                showAlert('Lỗi khi xóa đánh giá', 'error');
            }
        });
    });
}

/**
 * Tạo HTML hiển thị sao
 */
function generateStarDisplay(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            html += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(rating) && rating % 1 >= 0.5) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

/**
 * Thiết lập phần bình luận
 */
// Comment functionality removed: setupCommentSection and related handlers were intentionally removed

/**
 * Hiển thị danh sách bình luận (hỗ trợ phân cấp replies và like_count)
 */
// displayComments removed along with comment rendering

/**
 * Render một comment (recursive cho replies)
 */
// renderComment removed

/**
 * Gọi API lấy chi tiết sản phẩm
 */
async function fetchProductDetail(productId) {
    try {
        showLoadingState();
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
        const response = await fetch(`${_apiBase}/api/product/${productId}`);
        
        if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
        
        const responseData = await response.json();
        const product = responseData.data || responseData;
        
        console.log('Product data from API:', product);
        localStorage.setItem('currentProduct', JSON.stringify(product));
        displayProductDetail(product);
        fetchRelatedProducts(product.MaSP);
        fetchRatings(product.MaSP); // Thêm gọi API đánh giá
        checkAndDisplayPromotions(product.MaSP); // THÊM: Check promotions khi fetch API
        
        const maTG = product.MaTG || product.matg;
        if (maTG && maTG !== 'null' && maTG !== '') {
            fetchRelatedAuthor(maTG);
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
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
        const response = await fetch(`${_apiBase}/api/author/${authorId}`);
        if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);
        
        const responseData = await response.json();
        const author = responseData.data || responseData;
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
        container.innerHTML = '<p class="text-xs text-text-light italic">Không có thông tin tác giả</p>';
        return;
    }
  
    const imageSrc = author.AnhTG ? `img/author/${author.AnhTG}` : `img/author/tg${author.MaTG}.jpg`;
    const fallbackSrc = `img/author/tg${author.MaTG}.png`;
  
    container.innerHTML = `
        <div class="group w-full space-y-6 bg-white rounded-3xl overflow-hidden transition-all duration-300">
            <div class="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-border bg-gray-50">
                <img src="${imageSrc}" alt="${escapeHtml(author.TenTG)}" 
                     class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     onerror="this.src='${fallbackSrc}'; this.onerror=() => this.src='https://via.placeholder.com/200?text=Author'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            
            <div class="space-y-4 px-1">
                <div class="space-y-2">
                    <h3 class="text-lg font-black text-text uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors">${escapeHtml(author.TenTG)}</h3>
                    <div class="flex flex-wrap gap-x-4 gap-y-2">
                        <div class="flex items-center gap-2 text-[9px] font-black text-text-light uppercase tracking-widest">
                            <i class="fas fa-globe text-primary opacity-70"></i>
                            <span>${escapeHtml(author.QuocTich || 'Không rõ')}</span>
                        </div>
                        <div class="flex items-center gap-2 text-[9px] font-black text-text-light uppercase tracking-widest">
                            <i class="fas fa-calendar-alt text-primary opacity-70"></i>
                            <span>${author.NgaySinh ? new Date(author.NgaySinh).toLocaleDateString('vi-VN') : 'Không rõ'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="relative border-l-2 border-primary/20 pl-4 py-1">
                    <p class="text-xs text-text-muted italic leading-relaxed line-clamp-4">
                        ${escapeHtml(author.TieuSu || 'Không có tiểu sử hiện dụng cho tác giả này.')}
                    </p>
                </div>
                
                <button onclick="viewAuthorDetail('${author.MaTG}')" 
                        class="w-full py-3.5 bg-gray-50 hover:bg-primary hover:text-white text-text font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border border-border flex items-center justify-center gap-2 group/btn active:scale-95 shadow-sm">
                    Thông tin tác giả <i class="fas fa-arrow-right text-[8px] group-hover/btn:translate-x-1 transition-transform"></i>
                </button>
            </div>
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
    const apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
    // Debug chi tiết hơn
    console.log('🔍 =====PRODUCT DEBUG=====');
    console.log('🔍 Raw product object:', product);
    console.log('🔍 Object keys:', Object.keys(product));
    console.log('🔍 MaTG value:', product.MaTG, typeof product.MaTG);
    console.log('🔍 TacGia value:', product.TacGia, typeof product.TacGia);
    console.log('🔍 TenTG value:', product.TenTG, typeof product.TenTG);
    console.log('🔍 ========================');
    
    // Cập nhật tiêu đề sản phẩm
    document.getElementById('product-title').textContent = product.TenSP || 'Không có tiêu đề';
    document.getElementById('product-title-breadcrumb').textContent = product.TenSP || 'Chi tiết sản phẩm';
    
    // XỬ LÝ TÁC GIẢ - SỬA LẠI LOGIC
    const authorElement = document.getElementById('product-author');
    if (authorElement) {
        let authorName = 'Đang cập nhật';
        
        // Kiểm tra các field có thể chứa tên tác giả
        if (product.TacGia && product.TacGia.trim() !== '') {
            authorName = product.TacGia.trim();
            console.log('✅ Using TacGia field:', authorName);
        } else if (product.TenTG && product.TenTG.trim() !== '') {
            authorName = product.TenTG.trim();
            console.log('✅ Using TenTG field:', authorName);
        } else {
            console.log('⚠️ No valid author name found, using default');
        }
        
        // Kiểm tra xem có phải là số (mã tác giả) không
        if (!isNaN(authorName) && authorName.toString().trim() !== '') {
            console.log('⚠️ Author name appears to be a number (ID):', authorName);
            authorName = 'Đang cập nhật';
        }
        
        authorElement.textContent = authorName;
        console.log('🔍 Final author displayed:', authorName);
    }

    const yearElement = document.getElementById('product-year');
    if (yearElement) {
        yearElement.textContent = product.NamXB || 'Đang cập nhật';
    }

    // Hiển thị Nhà xuất bản (nhiều API/DB có thể dùng trường khác nhau)
    const publisherElement = document.getElementById('product-publisher');
    if (publisherElement) {
        const publisherCandidates = [
            product.NhaXuatBan,
            product.NhaSanXuat,
            product.NXB,
            product.NhaXB,
            product.Publisher,
            product.NhaXuatBan_Ten
        ];
        const publisher = publisherCandidates.find(p => p !== undefined && p !== null && String(p).trim() !== '');
        publisherElement.textContent = publisher ? String(publisher).trim() : 'Đang cập nhật';
    }

    // Cập nhật hình ảnh sản phẩm
    const mainImage = document.getElementById('main-product-image');
    if (mainImage) {
        // If API provides an images array, use it; otherwise fallback to HinhAnh
        const buildSrcFromFilename = (filename) => {
            if (!filename) return 'https://via.placeholder.com/300x400?text=Book';
            if (window.API_CONFIG && window.API_CONFIG.resolveImageUrl) return window.API_CONFIG.resolveImageUrl(filename);
            // if filename looks like a url, use it
            if (/^https?:\/\//i.test(filename)) return filename;
            // prefer backend static route, then fallback to local client folders
            return `${apiBase}/product-images/${filename}`;
        };

        const buildFallbackCandidates = (filename) => {
            if (!filename) return ['https://via.placeholder.com/300x400?text=Book'];
            if (/^https?:\/\//i.test(filename)) return [filename];
            
            const cleanName = filename.replace(/^\/img\/products\//, '');
            const serverUrl = 'https://cnpm-websach-2.onrender.com';
            
            // If it's a new upload (has timestamp), prioritize the direct server upload path
            if (/^\d{13,}-/.test(cleanName)) {
                return [
                    `${serverUrl}/uploads/products/${cleanName}`,
                    `${serverUrl}/product-images/${cleanName}`,
                    'img/default-book.jpg'
                ];
            }

            return [
                `${serverUrl}/uploads/products/${cleanName}`,
                `${serverUrl}/product-images/${cleanName}`,
                `img/product/${cleanName}`,
                'img/default-book.jpg'
            ];
        };

        const applyImageFallback = (imgEl, candidates) => {
            let index = 0;
            imgEl.src = candidates[index] || 'https://via.placeholder.com/300x400?text=Book';
            imgEl.onerror = () => {
                index += 1;
                if (index < candidates.length) {
                    imgEl.src = candidates[index];
                } else {
                    imgEl.onerror = null;
                    imgEl.src = 'https://via.placeholder.com/300x400?text=Book';
                }
            };
        };

        let images = [];
        if (Array.isArray(product.images) && product.images.length > 0) {
            images = product.images.map(img => {
                if (img.url || img.path) return { url: img.url || img.path, id: img.id };
                if (img.filename) return { url: buildSrcFromFilename(img.filename), filename: img.filename, id: img.id };
                // if it's a plain string
                if (typeof img === 'string') return { url: buildSrcFromFilename(img) };
                return null;
            }).filter(Boolean);
        } else if (product.HinhAnh) {
            images = [{ url: buildSrcFromFilename(product.HinhAnh) }];
        } else {
            images = [{ url: 'https://via.placeholder.com/300x400?text=Book' }];
        }

        // set main image to first image
        const firstName = images[0].filename || images[0].url;
        applyImageFallback(mainImage, buildFallbackCandidates(firstName));
        mainImage.alt = escapeHtml(product.TenSP);

        // build thumbnails
        const thumbsContainer = document.getElementById('product-thumbs');
        if (thumbsContainer) {
            thumbsContainer.innerHTML = '';
            const maxVisible = 5;
            const total = images.length;
            const visible = images.slice(0, maxVisible);

            visible.forEach((imgObj, idx) => {
                const imgEl = document.createElement('img');
                const thumbName = imgObj.filename || imgObj.url;
                applyImageFallback(imgEl, buildFallbackCandidates(thumbName));
                imgEl.alt = escapeHtml(product.TenSP) + (idx === 0 ? ' - chính' : ` - ảnh ${idx+1}`);
                if (idx === 0) imgEl.classList.add('active');
                imgEl.addEventListener('click', () => {
                    // swap main image
                    applyImageFallback(mainImage, buildFallbackCandidates(thumbName));
                    // update active class
                    thumbsContainer.querySelectorAll('img').forEach(i => i.classList.remove('active'));
                    imgEl.classList.add('active');
                });
                thumbsContainer.appendChild(imgEl);
            });

            if (total > maxVisible) {
                const moreCount = total - maxVisible;
                const moreEl = document.createElement('div');
                moreEl.className = 'thumb-more';
                moreEl.textContent = `+${moreCount}`;
                // clicking opens full gallery in new tab (if server path known try to open first image folder)
                moreEl.addEventListener('click', () => {
                    // open product gallery: if product has gallery url, try that; otherwise open product page itself
                    // For now we simply open the main image in a new tab as a simple gallery behaviour
                    window.open(images[0].url, '_blank');
                });
                thumbsContainer.appendChild(moreEl);
            }
        }
    }

    // Cập nhật giá sản phẩm
    updatePriceDisplay(product);

    // Cập nhật mô tả sản phẩm
    const descriptionElement = document.getElementById('product-description');
    if (descriptionElement) {
        descriptionElement.innerHTML = product.MoTa || 'Không có mô tả';
    }

    // Tạo thông tin chi tiết dùng data của product đã có sẵn
    try {
        const info = product;
        const nxb = info.NhaXuatBan || info.NhaXB || info.NhaSanXuat || '';
        const nhaCungCap = info.NhaCungCap || info.TenNCC || '';
        const tacGia = info.TacGia || info.TenTG || '';

        const detailsGrid = document.getElementById('product-details-grid');
        if (detailsGrid) {
            detailsGrid.innerHTML = `
                ${nhaCungCap ? `<div class="flex flex-col gap-1"><span class="text-[10px] font-black text-text-light uppercase tracking-widest">Nhà cung cấp</span><span class="text-sm font-bold text-text">${escapeHtml(nhaCungCap)}</span></div>` : ''}
                ${nxb ? `<div class="flex flex-col gap-1"><span class="text-[10px] font-black text-text-light uppercase tracking-widest">Nhà xuất bản</span><span class="text-sm font-bold text-text">${escapeHtml(nxb)}</span></div>` : ''}
                ${tacGia ? `<div class="flex flex-col gap-1"><span class="text-[10px] font-black text-text-light uppercase tracking-widest">Tác giả</span><span class="text-sm font-bold text-text">${escapeHtml(tacGia)}</span></div>` : ''}
                ${info.NamXB ? `<div class="flex flex-col gap-1"><span class="text-[10px] font-black text-text-light uppercase tracking-widest">Năm XB</span><span class="text-sm font-bold text-text">${escapeHtml(String(info.NamXB))}</span></div>` : ''}
                ${info.TrongLuong ? `<div class="flex flex-col gap-1"><span class="text-[10px] font-black text-text-light uppercase tracking-widest">Trọng lượng</span><span class="text-sm font-bold text-text">${escapeHtml(String(info.TrongLuong))} g</span></div>` : ''}
                ${info.KichThuoc ? `<div class="flex flex-col gap-1"><span class="text-[10px] font-black text-text-light uppercase tracking-widest">Kích thước</span><span class="text-sm font-bold text-text">${escapeHtml(info.KichThuoc)}</span></div>` : ''}
                ${info.SoTrang ? `<div class="flex flex-col gap-1"><span class="text-[10px] font-black text-text-light uppercase tracking-widest">Số trang</span><span class="text-sm font-bold text-text">${escapeHtml(String(info.SoTrang))}</span></div>` : ''}
                ${info.HinhThuc ? `<div class="flex flex-col gap-1"><span class="text-[10px] font-black text-text-light uppercase tracking-widest">Hình thức</span><span class="text-sm font-bold text-text">${escapeHtml(info.HinhThuc)}</span></div>` : ''}
            `;
        }
    } catch (err) {
        console.error('Lỗi khi tải thông tin bổ sung sản phẩm:', err);
    }

    // Kiểm tra và hiển thị khuyến mãi
    checkAndDisplayPromotions(product.MaSP);

    // Cập nhật dữ liệu cho nút thêm vào giỏ hàng
    const addToCartButton = document.getElementById('add-to-cart');
    if (addToCartButton) {
        addToCartButton.dataset.product = JSON.stringify({
            id: product.MaSP,
            name: product.TenSP,
            price: product.DonGia,
            image: product.HinhAnh || 'default-book.jpg'
        });
    }

    // Log để kiểm tra sau khi cập nhật
    console.log('✅ Product detail display completed');
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
        originalPriceElement.classList.remove('hidden');
        const discount = Math.round((1 - product.DonGia / product.GiaBia) * 100);
        const discountAmount = product.GiaBia - product.DonGia;
        discountElement.textContent = `Tiết kiệm: ${formatPrice(discountAmount)} (${discount}%)`;
        discountElement.classList.remove('hidden');
    } else {
        originalPriceElement.classList.add('hidden');
        discountElement.classList.add('hidden');
    }
}

// ========================================
// PHẦN MỚI: KHUYẾN MÃI
// ========================================

/**
 * Kiểm tra và hiển thị khuyến mãi cho sản phẩm
 */
async function checkAndDisplayPromotions(productId) {
    console.log('🔍 Checking promotions for product:', productId);
    
    try {
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
        const response = await fetch(`${_apiBase}/api/khuyenmai/product/${productId}`);
        console.log('📡 Product Promotion API response status:', response.status);
        
        if (!response.ok) {
            console.error('❌ Failed to fetch product promotions:', response.status);
            displayPromotions([]);
            return;
        }

        const data = await response.json();
        const promotions = data.data || [];
        console.log('🎯 Found applicable promotions:', promotions.length);
        
        displayPromotions(promotions);

    } catch (error) {
        console.error('❌ Error in checkAndDisplayPromotions:', error);
        displayPromotions([]);
    }
}

/**
 * Hiển thị danh sách khuyến mãi với UI đẹp
 */
function displayPromotions(promotions) {
    const promotionSection = document.getElementById('product-promotions');
    const promotionContainer = document.getElementById('promotions-container');

    if (!promotionSection || !promotionContainer) {
        console.warn('⚠️ Promotion elements not found in DOM');
        return;
    }

    if (!promotions || promotions.length === 0) {
        promotionSection.classList.add('hidden');
        return;
    }

    promotionSection.classList.remove('hidden');

    // load saved promos from localStorage so we can mark saved buttons
    const myPromosCache = JSON.parse(localStorage.getItem('myPromos') || '[]');
    const savedLocalCache = JSON.parse(localStorage.getItem('savedPromotions') || '[]');

    const myPromoIds = myPromosCache.map(p => String(p.MaKM || p.id || ''));
    const myPromoCodes = myPromosCache.map(p => String(p.code || p.MaPhieu || ''));
    const savedLocalIds = savedLocalCache.map(p => String(p.id || ''));
    const savedLocalCodes = savedLocalCache.map(p => String(p.code || ''));

    promotionContainer.innerHTML = promotions.map(promotion => {
        const now = new Date();
        const endDate = new Date(promotion.NgayKetThuc);
        const isExpired = endDate < now;

        // Discount value formatting
        let discountVal = '';
        let discountLbl = '';
        
        if (promotion.LoaiKM === 'giam_phan_tram') {
            discountVal = `${promotion.GiaTriGiam}%`;
            discountLbl = 'GIẢM GIÁ';
        } else if (promotion.LoaiKM === 'giam_tien_mat') {
            const val = promotion.GiaTriGiam;
            if (val >= 1000) {
                discountVal = `${Math.round(val/1000)}K`;
            } else {
                discountVal = val;
            }
            discountLbl = 'GIẢM TIỀN';
        }

        const promoIdStr = String(promotion.MaKM || promotion.MaPhieu || '');
        const promoCodeStr = String(promotion.Code || promotion.MaPhieu || '');
        const isSaved = myPromoIds.includes(promoIdStr) || myPromoCodes.includes(promoCodeStr) || savedLocalIds.includes(promoIdStr) || savedLocalCodes.includes(promoCodeStr);

        const expiryDate = endDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

        return `
            <div class="promotion-card ${isExpired ? 'opacity-50 grayscale' : ''}" data-promotion-id="${promotion.MaKM}">
                <div class="promotion-left">
                    <div class="promotion-discount-val">${discountVal}</div>
                    <div class="promotion-discount-lbl">${discountLbl}</div>
                </div>
                
                <div class="promotion-right">
                    <div class="promotion-info">
                        <div class="promotion-title">${escapeHtml(promotion.TenKM)}</div>
                        <div class="promotion-desc">${promotion.MoTa ? escapeHtml(promotion.MoTa) : 'Ưu đãi đặc biệt khi mua hàng'}</div>
                    </div>
                    
                    <div class="promotion-footer">
                        <div class="flex flex-col">
                            <span class="promotion-expiry">HSD: ${expiryDate}</span>
                            ${promotion.Code ? `
                                <div class="promotion-code-tag mt-1" onclick="copyPromotionCode('${promotion.Code}')" title="Click để sao chép">
                                    ${promotion.Code} <i class="far fa-copy ml-1 opacity-50"></i>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${!isExpired ? `
                            <button class="promotion-save-btn ${isSaved ? 'saved' : ''}" 
                                    onclick="${isSaved ? '' : `savePromotion('${promotion.Code || ''}', ${promotion.MaKM})`}"
                                    title="${isSaved ? 'Đã lưu' : 'Lưu mã'}">
                                <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Thêm animation cho các card
    const cards = promotionContainer.querySelectorAll('.promotion-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150);
    });
}

/**
 * Copy mã khuyến mãi
 */
function copyPromotionCode(code) {
    if (!code) return;
    
    navigator.clipboard.writeText(code).then(() => {
        showAlert(`Đã copy mã khuyến mãi: ${code}`, 'success');
    }).catch(err => {
        console.error('Failed to copy code:', err);
        showAlert('Không thể copy mã khuyến mãi', 'error');
    });
}

/**
 * Hiển thị chi tiết khuyến mãi trong modal
 */
async function showPromotionDetail(promotionId) {
    try {
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
        const response = await fetch(`${_apiBase}/api/khuyenmai/${promotionId}`);
        if (!response.ok) throw new Error('Không thể tải chi tiết khuyến mãi');
        
        const responseData = await response.json();
        const promotion = responseData.data || responseData;
        
        const modalHtml = `
            <div class="promotion-detail-modal" id="promotionDetailModal">
                <div class="promotion-detail-content">
                    <div class="promotion-detail-header">
                        <h2><i class="fas fa-gift"></i> ${escapeHtml(promotion.TenKM)}</h2>
                        <button class="promotion-detail-close" onclick="closePromotionDetail()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="promotion-detail-body">
                        <div class="promotion-detail-section">
                            <h4><i class="fas fa-info-circle"></i> Thông tin cơ bản</h4>
                            <div class="promotion-detail-item">
                                <span class="promotion-detail-label">Mã khuyến mãi:</span>
                                <span class="promotion-detail-value">${promotion.Code || 'Không có'}</span>
                            </div>
                            <div class="promotion-detail-item">
                                <span class="promotion-detail-label">Mô tả:</span>
                                <span class="promotion-detail-value">${promotion.MoTa || 'Không có'}</span>
                            </div>
                            <div class="promotion-detail-item">
                                <span class="promotion-detail-label">Loại khuyến mãi:</span>
                                <span class="promotion-detail-value">${promotion.LoaiKM === 'giam_phan_tram' ? 'Giảm theo %' : 'Giảm tiền mặt'}</span>
                            </div>
                        </div>
                        
                        <div class="promotion-detail-section">
                            <h4><i class="fas fa-calendar-alt"></i> Thời gian áp dụng</h4>
                            <div class="promotion-detail-item">
                                <span class="promotion-detail-label">Từ ngày:</span>
                                <span class="promotion-detail-value">${new Date(promotion.NgayBatDau).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div class="promotion-detail-item">
                                <span class="promotion-detail-label">Đến ngày:</span>
                                <span class="promotion-detail-value">${new Date(promotion.NgayKetThuc).toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                        
                        <div class="promotion-detail-section">
                            <h4><i class="fas fa-cogs"></i> Điều kiện và quy định</h4>
                            <div class="promotion-detail-item">
                                <span class="promotion-detail-label">Giá trị giảm:</span>
                                <span class="promotion-detail-value">${promotion.GiaTriGiam}${promotion.LoaiKM === 'giam_phan_tram' ? '%' : ' VND'}</span>
                            </div>
                            <div class="promotion-detail-item">
                                <span class="promotion-detail-label">Đơn hàng tối thiểu:</span>
                                <span class="promotion-detail-value">${promotion.GiaTriDonToiThieu ? formatPrice(promotion.GiaTriDonToiThieu) : 'Không yêu cầu'}</span>
                            </div>
                            <div class="promotion-detail-item">
                                <span class="promotion-detail-label">Số lượng tối thiểu:</span>
                                <span class="promotion-detail-value">${promotion.SoLuongToiThieu || 1} sản phẩm</span>
                            </div>
                            <div class="promotion-detail-item">
                                <span class="promotion-detail-label">Giảm tối đa:</span>
                                <span class="promotion-detail-value">${promotion.GiamToiDa ? formatPrice(promotion.GiamToiDa) : 'Không giới hạn'}</span>
                            </div>
                        </div>
                        
                        <div class="promotion-detail-section">
                            <h4><i class="fas fa-box"></i> Sản phẩm áp dụng</h4>
                            ${(promotion.SanPhamApDung && promotion.SanPhamApDung.length > 0) 
                                ? `<div style="max-height: 200px; overflow-y: auto;">
                                    ${promotion.SanPhamApDung.map(sp => `
                                        <div class="promotion-detail-item">
                                            <span class="promotion-detail-label">${escapeHtml(sp.TenSP)}</span>
                                            <span class="promotion-detail-value">ID: ${sp.MaSP}</span>
                                        </div>
                                    `).join('')}
                                   </div>`
                                : '<p style="text-align: center; color: #28a745; font-style: italic;">Áp dụng cho tất cả sản phẩm</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Xóa modal cũ nếu có
        const existingModal = document.getElementById('promotionDetailModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Thêm modal mới
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('promotionDetailModal');
        modal.style.display = 'flex';
        
        // Đóng modal khi click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePromotionDetail();
            }
        });
        
    } catch (error) {
        console.error('Error loading promotion detail:', error);
        showAlert('Không thể tải chi tiết khuyến mãi', 'error');
    }
}

/**
 * Đóng modal chi tiết khuyến mãi
 */
function closePromotionDetail() {
    const modal = document.getElementById('promotionDetailModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}

/**
 * Áp dụng khuyến mãi
 */
function applyPromotion(code, promotionId) {
    if (!code) {
        showAlert('Mã khuyến mãi không hợp lệ', 'error');
        return;
    }
    
    // Lưu mã khuyến mãi vào localStorage để sử dụng khi thanh toán
    let appliedPromotions = JSON.parse(localStorage.getItem('appliedPromotions') || '[]');
    
    // Kiểm tra xem mã đã được áp dụng chưa
    if (!appliedPromotions.some(p => p.code === code)) {
        appliedPromotions.push({
            id: promotionId,
            code: code,
            appliedAt: new Date().toISOString()
        });
        localStorage.setItem('appliedPromotions', JSON.stringify(appliedPromotions));
        showAlert(`Đã áp dụng mã khuyến mãi: ${code}`, 'success');
    } else {
        showAlert('Mã khuyến mãi đã được áp dụng', 'info');
    }
}

/**
 * Lưu mã khuyến mãi (không áp dụng ngay) — sử dụng để "Lưu mã" từ giao diện chi tiết sản phẩm
 * Mã sẽ được lưu vào localStorage dưới key `savedPromotions` để người dùng có thể áp dụng khi thanh toán.
 */
function savePromotion(code, promotionId) {
    if (!code) {
        showAlert('Mã khuyến mãi không hợp lệ', 'error');
        return;
    }

    // Helper to mark button UI as saved (change text/icon & disable)
    const markButtonSaved = () => {
        try {
            const card = document.querySelector(`.promotion-card[data-promotion-id="${promotionId}"]`);
            const btn = card?.querySelector('.promotion-save-btn') || card?.querySelector('.promotion-detail-btn.save');
            if (!btn) return;

            btn.classList.add('saved');
            btn.setAttribute('aria-pressed', 'true');
            try { btn.disabled = true; } catch (e) {}
            btn.innerHTML = '<i class="fas fa-bookmark"></i> Đã lưu';
        } catch (e) {
            console.error('markButtonSaved error', e);
        }
    };

    // PRIMARY: Save to localStorage (works for everyone, always)
    let saved = JSON.parse(localStorage.getItem('savedPromotions') || '[]');
    const alreadySaved = saved.some(p => p.code === code);
    
    if (!alreadySaved) {
        saved.push({ id: promotionId, code: code, savedAt: new Date().toISOString() });
        localStorage.setItem('savedPromotions', JSON.stringify(saved));
    }

    markButtonSaved();
    showAlert(`✅ Đã lưu mã: ${code}`, 'success');

    // SECONDARY: If logged in, try to also save to server (optional, non-blocking)
    const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
    if (token) {
        (async () => {
            try {
                const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
                const res = await fetch(`${_apiBase}/api/khuyenmai/claim/${promotionId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 5000  // Short timeout, don't wait long for server
                });

                if (res.ok) {
                    const data = await res.json().catch(() => ({}));
                    const myPromos = JSON.parse(localStorage.getItem('myPromos') || '[]');
                    const exists = myPromos.some(p => (p.MaKM && String(p.MaKM) === String(promotionId)) || p.code === code);
                    if (!exists) {
                        myPromos.unshift({ 
                            MaKM: promotionId, 
                            code: code, 
                            ngay_lay: new Date().toISOString(), 
                            status: 'Chua_su_dung' 
                        });
                        localStorage.setItem('myPromos', JSON.stringify(myPromos));
                    }
                }
                // If server save fails (404 or any error), silently ignore - localStorage already saved
            } catch (err) {
                // Server save failed - silently ignore, localStorage already has the code
                console.log('Server save skipped (endpoint may not exist):', err.message);
            }
        })();
    }
}

// Export các function để có thể sử dụng từ HTML
window.copyPromotionCode = copyPromotionCode;
window.showPromotionDetail = showPromotionDetail;
window.closePromotionDetail = closePromotionDetail;
window.applyPromotion = applyPromotion;
window.savePromotion = savePromotion;

// ========================================
// HẾT PHẦN MỚI: KHUYẾN MÃI
// ========================================

/**
 * Lấy sản phẩm liên quan
 */
async function fetchRelatedProducts(currentProductId) {
    try {
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
        const response = await fetch(`${_apiBase}/api/product`);
        if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);
        
        const responseData = await response.json();
        const allProducts = responseData.data || responseData;
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
        container.innerHTML = '<p class="text-center py-10 text-text-light italic">Không có sản phẩm liên quan</p>';
        return;
    }
    container.innerHTML = products.map(product => {
        const year = product.NamXB || product.NamXb || product.Nam || product.Year || 'Đang cập nhật';
        const originalPrice = product.GiaBia || (product.DonGia * 1.25);
        const discountPercent = product.PhanTramGiam || (product.GiaBia > product.DonGia ? Math.round((1 - product.DonGia/product.GiaBia)*100) : 0);

        return `
        <div class="group bg-white rounded-2xl border border-border p-4 hover:shadow-lg transition-all duration-300 flex flex-col h-full cursor-pointer" 
             onclick="saveProductBeforeRedirect(${JSON.stringify(product).replace(/"/g, '&quot;')}); window.location.href='product_detail.html?id=${product.MaSP}'">
            <div class="relative aspect-[3/4] mb-4 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-3 group-hover:scale-[1.02] transition-transform duration-500">
                <img src="img/product/${product.HinhAnh || 'sp01.jpg'}" 
                     alt="${escapeHtml(product.TenSP)}" 
                     class="max-w-full max-h-full object-contain drop-shadow-md"
                     onerror="this.src='img/product/sp01.jpg'">
                ${discountPercent ? `<div class="absolute top-2 right-2 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md">-${discountPercent}%</div>` : ''}
            </div>
            <div class="flex-1 flex flex-col">
                <h3 class="text-xs font-bold text-text mb-1 line-clamp-2 min-h-[32px] group-hover:text-primary transition-colors">${escapeHtml(product.TenSP)}</h3>
                <p class="text-[9px] font-bold text-text-light uppercase tracking-tighter mb-3">Năm XB: ${escapeHtml(String(year))}</p>
                <div class="mt-auto">
                    <div class="flex flex-col">
                        <span class="text-sm font-black text-primary">${formatPrice(product.DonGia)}</span>
                        ${product.GiaBia > product.DonGia ? `<span class="text-[9px] text-text-light line-through font-bold">${formatPrice(product.GiaBia)}</span>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

/**
 * Lưu sản phẩm trước khi chuyển trang
 */
window.saveProductBeforeRedirect = (product) => {
    localStorage.removeItem('currentProduct');
    localStorage.setItem('currentProduct', JSON.stringify(product));
};

/**
 * Lấy token từ cookie
 */
function _getAuthToken() {
    return (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
}

/**
 * Kiểm tra đã đăng nhập chưa
 */
function _isLoggedIn() {
    return Boolean(_getAuthToken());
}

/**
 * Thêm vào giỏ hàng
 */
async function addToCart() {
    const addToCartBtn = document.getElementById('add-to-cart');
    if (!addToCartBtn || !addToCartBtn.dataset.product) {
        console.error('Error: add-to-cart button or dataset.product is not set');
        showAlert('Lỗi: Không thể thêm sản phẩm vào giỏ hàng.', 'error');
        return;
    }

    try {
        const productData = JSON.parse(addToCartBtn.dataset.product);
        const qtyInput = document.getElementById('qty-input');
        const quantity = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

        if (_isLoggedIn()) {
            // ✅ Đã đăng nhập: gọi API backend để lưu vào DB
            try {
                const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
                const response = await fetch(`${_apiBase}/api/client/cart/add`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${_getAuthToken()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ productId: Number(productData.id), quantity })
                });

                if (response.ok) {
                    showAlert(`Đã thêm ${quantity} "${productData.name}" vào giỏ hàng!`, 'success');
                    // Cập nhật số lượng giỏ hàng trên header
                    if (typeof window.updateCartCount === 'function') {
                        window.updateCartCount();
                    }
                } else {
                    let errBody = null;
                    try { errBody = await response.json(); } catch (e) { errBody = {}; }
                    console.error('Add to cart API failed:', response.status, errBody);
                    showAlert(errBody?.error || errBody?.message || 'Lỗi khi thêm vào giỏ hàng', 'error');
                }
            } catch (apiError) {
                console.error('Add to cart API error:', apiError);
                showAlert('Lỗi kết nối. Vui lòng thử lại!', 'error');
            }
        } else {
            // Chưa đăng nhập: lưu vào localStorage
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingItem = cart.find(item => item.id === productData.id);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({...productData, quantity: quantity, selected: true});
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            showAlert(`Đã thêm ${quantity} "${productData.name}" vào giỏ hàng! (Đăng nhập để lưu vĩnh viễn)`, 'success');

            // Cập nhật số lượng giỏ hàng trên header
            if (typeof window.updateCartCount === 'function') {
                window.updateCartCount();
            }
        }
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
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    const container = document.createElement('div');
    container.className = 'toast-container';
    container.appendChild(toast);
    document.body.appendChild(container);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            container.remove();
        }, 300);
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
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Lấy thông tin rút gọn sản phẩm từ API
 * Thử gọi relative path first, nếu không có thì gọi full localhost:5000
 */
async function fetchProductInfo(productId) {
    if (!productId) return null;
    const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
    const endpoints = [`${_apiBase}/api/product/${productId}/info` ];
    // We remove the hardcoded relative path /api/... because it fails on Vercel without proxy

    for (const url of endpoints) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                // nếu 404 hoặc khác, tiếp tục thử URL tiếp theo
                console.warn(`fetchProductInfo: non-ok status ${res.status} from ${url}`);
                continue;
            }
            const data = await res.json();
            return data;
        } catch (err) {
            console.warn(`fetchProductInfo: lỗi khi gọi ${url}:`, err.message || err);
            // tiếp tục thử endpoint kế
        }
    }

    return null;
}
