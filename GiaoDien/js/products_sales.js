(function () {
    // Inject Styles
    if (!document.getElementById('product-sales-styles')) {
        const style = document.createElement('style');
        style.id = 'product-sales-styles';
        style.textContent = `
            .flash-sale-container { background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.12); border: 1px solid #eee; margin-bottom: 40px; width: 100%; }
            .flash-sale-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; background: linear-gradient(135deg, #B03A2E 0%, #8E2920 100%); color: white; }
            .flash-sale-left { display: flex; align-items: center; gap: 24px; }
            .flash-sale-left h2 { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 950; color: #ffffff; margin: 0; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            .countdown { display: flex; align-items: center; gap: 4px; font-family: 'Inter', sans-serif; background: rgba(0,0,0,0.3); padding: 6px 12px; border-radius: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
            @media (min-width: 768px) { .countdown { gap: 10px; padding: 10px 20px; border-radius: 16px; } }
            .cd-box { background: #fff; color: #B03A2E; padding: 2px 6px; border-radius: 6px; font-weight: 900; min-width: 28px; text-align: center; font-size: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
            @media (min-width: 768px) { .cd-box { padding: 4px 10px; border-radius: 8px; min-width: 38px; font-size: 16px; } }
            .cd-lbl { font-size: 8px; color: rgba(255,255,255,0.8); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
            @media (min-width: 768px) { .cd-lbl { font-size: 10px; } }
            
            .flash-products { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 32px; width: 100%; transition: all 0.3s ease; }
            
            .sale-item { background: #fff; border: 1px solid #eee; border-radius: 20px; overflow: hidden; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; height: 100%; position: relative; min-width: 0; }
            .sale-item:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(176,58,46,0.15); border-color: #B03A2E; }
            .sale-item-image-wrapper { width: 100%; aspect-ratio: 3/4; background: #fcfcfc; display: flex; align-items: center; justify-content: center; overflow: hidden; max-height: 280px; padding: 20px; }
            .sale-item-img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.6s cubic-bezier(0.33, 1, 0.68, 1); filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1)); }
            .sale-item:hover .sale-item-img { transform: scale(1.08) rotate(2deg); }
            .sale-item-info { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
            .sale-item-title { font-size: 14px; font-weight: 900; color: #1e293b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-transform: uppercase; }
            .sale-item-author { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
            .sale-item-price { display: flex; flex-direction: column; gap: 2px; margin-top: auto; }
            .discount-price { font-size: 18px; font-weight: 950; color: #B03A2E; letter-spacing: -1px; }
            .badge-percent { background: #B03A2E; color: #fff; font-size: 10px; font-weight: 900; padding: 3px 10px; border-radius: 8px; box-shadow: 0 4px 10px rgba(176,58,46,0.3); }
            .sale-item-actions { display: flex; gap: 10px; margin-top: 15px; width: 100%; }
            .btn-add-cart { background: #B03A2E; color: #fff; border: none; padding: 12px; border-radius: 14px; font-size: 10px; font-weight: 950; cursor: pointer; text-transform: uppercase; transition: all 0.3s; box-shadow: 0 4px 12px rgba(176,58,46,0.2); flex: 2; }
            .btn-add-cart:hover:not(:disabled) { background: #8E2920; transform: scale(1.05); box-shadow: 0 6px 15px rgba(176,58,46,0.3); }
            .btn-add-cart:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; }
            .btn-detail { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 12px; border-radius: 14px; font-size: 10px; font-weight: 950; cursor: pointer; text-transform: uppercase; transition: all 0.3s; flex: 1; }
            .btn-detail:hover { background: #fff; color: #B03A2E; border-color: #B03A2E; }

            /* Mobile Responsive Styles */
            @media (max-width: 1024px) { 
                .flash-products { grid-template-columns: repeat(3, 1fr); padding: 24px; gap: 20px; } 
            }
            @media (max-width: 768px) { 
                .flash-sale-header { padding: 16px; flex-direction: column; gap: 16px; align-items: flex-start; }
                .flash-sale-left h2 { font-size: 20px; }
                .flash-products { 
                    display: flex; 
                    overflow-x: auto; 
                    scroll-snap-type: x mandatory;
                    padding: 20px; 
                    gap: 16px; 
                    -webkit-overflow-scrolling: touch;
                } 
                .flash-products::-webkit-scrollbar { display: none; }
                .sale-item { 
                    flex: 0 0 240px; 
                    scroll-snap-align: start;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                .sale-item-info { padding: 15px; }
                .discount-price { font-size: 16px; }
            }
            @media (max-width: 480px) { 
                .sale-item { flex: 0 0 200px; }
                .sale-item-image-wrapper { padding: 15px; }
                .sale-item-title { font-size: 12px; }
            }
        `;
        document.head.appendChild(style);
    }
	const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
	const API_URL = `${_apiBase}/api/khuyenmai/active-products`;
	const container = document.getElementById('flash-products');
	const countdownEl = document.getElementById('flash-countdown');
	const CACHE_KEY = 'flash_sale_products_v2';
	const IMAGE_BASE = `${_apiBase}/product-images`;

	function formatCurrency(v) {
		return new Intl.NumberFormat('vi-VN').format(v || 0) + ' ₫';
	}

	// Escape HTML
	function escapeHtml(unsafe) {
		if (!unsafe) return '';
		return String(unsafe).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[m]));
	}

	// Toast notification
	function showToast(message) {
        if (window.showToastNotification) {
            window.showToastNotification(message);
            return;
        }
		const toast = document.createElement('div');
		toast.className = 'fixed bottom-8 right-8 bg-white border-l-4 border-primary p-4 rounded-xl shadow-2xl z-[99999] animate-bounce-in flex items-center gap-4';
		toast.innerHTML = `<span class="text-sm font-bold text-gray-800">${escapeHtml(message)}</span>`;
		document.body.appendChild(toast);
		setTimeout(() => { toast.classList.add('opacity-0'); setTimeout(() => toast.remove(), 500); }, 3000);
	}

	// Add to cart
	async function addToCart(productId, productName, price, image) {
		const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('loggedInUser') || '{}');
		const token = localStorage.getItem('token');

		if (user && (user.makh || user.tenkh) && token) {
			try {
				const response = await fetch(`${_apiBase}/api/client/cart/add`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ productId, quantity: 1 })
				});

				if (response.ok) {
					showToast(`Đã thêm ${productName} vào giỏ hàng!`);
					if (typeof updateCartCount === 'function') updateCartCount();
					return;
				}
			} catch (error) {
				console.error('Lỗi thêm vào giỏ hàng:', error);
			}
		} else {
			// Guest cart fallback
			let cart = JSON.parse(localStorage.getItem('cart') || '[]');
			const existingItem = cart.find(item => item.id === productId);

			if (existingItem) {
				existingItem.quantity += 1;
			} else {
				cart.push({
					id: productId,
					name: productName,
					price: price,
					image: image,
					quantity: 1,
				});
			}

			localStorage.setItem('cart', JSON.stringify(cart));
			showToast(`Đã thêm ${productName} vào giỏ hàng!`);
			if (typeof updateCartCount === 'function') updateCartCount();
		}
	}

	function createProductCard(p) {
		const wrapper = document.createElement('div');
		wrapper.className = 'sale-item group';

		const imageWrapper = document.createElement('div');
		imageWrapper.className = 'sale-item-image-wrapper relative';
		imageWrapper.style.cursor = 'pointer';

		const img = document.createElement('img');
		img.alt = p.TenSP || 'product';
		img.className = 'sale-item-img';
        const imgSrc = p.HinhAnh ? `${IMAGE_BASE}/${p.HinhAnh}` : 'img/product/default-book.jpg';
		img.src = imgSrc;
		img.onerror = () => { img.src = 'img/product/default-book.jpg'; };

		imageWrapper.appendChild(img);
        
        // Add absolute badge for ID
        const idBadge = document.createElement('div');
        idBadge.className = 'absolute top-2 left-2 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity';
        idBadge.textContent = `ID: ${p.MaSP}`;
        imageWrapper.appendChild(idBadge);

		imageWrapper.addEventListener('click', () => {
			localStorage.setItem('selectedProductId', String(p.MaSP));
			window.location.href = 'product_detail.html';
		});

		const infoDiv = document.createElement('div');
		infoDiv.className = 'sale-item-info';

		const title = document.createElement('h3');
		title.className = 'sale-item-title cursor-pointer hover:text-primary transition-colors';
		title.textContent = p.TenSP || '';
		title.addEventListener('click', () => {
			localStorage.setItem('selectedProductId', String(p.MaSP));
			window.location.href = 'product_detail.html';
		});

		const author = document.createElement('div');
		author.className = 'sale-item-author';
		author.textContent = p.TacGia || 'Đang cập nhật';

		const metaDiv = document.createElement('div');
		metaDiv.className = 'flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider';
		metaDiv.innerHTML = `
			<span>Năm: ${p.NamXB || 'N/A'}</span>
			<span>Còn: ${p.SoLuong || 0} cuốn</span>
		`;

		const priceWrap = document.createElement('div');
		priceWrap.className = 'sale-item-price';

		let discountedPrice = p.DonGia;
		let percentValue = 0;
		if (p.LoaiKM === 'giam_tien_mat') {
			discountedPrice = Math.max(0, p.DonGia - (p.GiaTriGiam || 0));
			percentValue = Math.round(((p.DonGia - discountedPrice) / p.DonGia) * 100);
		} else if (p.LoaiKM === 'giam_phan_tram') {
			percentValue = Math.round(p.GiaTriGiam || 0);
			discountedPrice = Math.round(p.DonGia * (1 - percentValue / 100));
		}

		priceWrap.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="discount-price">${formatCurrency(discountedPrice)}</span>
                ${percentValue > 0 ? `<span class="badge-percent">-${percentValue}%</span>` : ''}
            </div>
            ${percentValue > 0 ? `<span class="text-[10px] text-gray-300 line-through italic font-bold">${formatCurrency(p.DonGia)}</span>` : ''}
        `;

		const actionsDiv = document.createElement('div');
		actionsDiv.className = 'sale-item-actions';

		const btnAddCart = document.createElement('button');
		btnAddCart.className = 'btn-add-cart';
		btnAddCart.innerHTML = 'THÊM GIỎ HÀNG';
		const hasStock = p.SoLuong && p.SoLuong > 0;
		if (!hasStock) { btnAddCart.disabled = true; btnAddCart.textContent = 'HẾT HÀNG'; }

		const btnDetail = document.createElement('button');
		btnDetail.className = 'btn-detail';
		btnDetail.textContent = 'CHI TIẾT';

		actionsDiv.appendChild(btnAddCart);
		actionsDiv.appendChild(btnDetail);

		infoDiv.appendChild(title);
		infoDiv.appendChild(author);
		infoDiv.appendChild(metaDiv);
		infoDiv.appendChild(priceWrap);
		infoDiv.appendChild(actionsDiv);

		wrapper.appendChild(imageWrapper);
		wrapper.appendChild(infoDiv);

		btnAddCart.addEventListener('click', (ev) => {
			ev.stopPropagation();
			addToCart(p.MaSP, p.TenSP, discountedPrice, p.HinhAnh);
		});

		btnDetail.addEventListener('click', (ev) => {
			ev.stopPropagation();
			localStorage.setItem('selectedProductId', String(p.MaSP));
			window.location.href = 'product_detail.html';
		});

		return wrapper;
	}

    function renderProducts(list) {
        if (!container) return;
        container.innerHTML = '';
        if (!list || !list.length) {
            container.innerHTML = '<div class="col-span-full py-12 text-center text-gray-400 italic">Không có sản phẩm khuyến mãi nào hiện khả dụng.</div>';
            return;
        }
        const displayList = list.slice(0, 4);
        displayList.forEach(p => container.appendChild(createProductCard(p)));
    }

	let countdownInterval = null;
	function startCountdown(products) {
		if (!countdownEl) return;
		if (!products || !products.length) {
			countdownEl.textContent = '';
			return;
		}
		const ends = products.map(p => new Date(p.NgayKetThuc)).filter(d => !isNaN(d));
		if (!ends.length) {
			countdownEl.textContent = '';
			return;
		}
		const nearest = new Date(Math.min(...ends.map(d => d.getTime())));

		function update() {
			const now = new Date();
			const diff = nearest - now;
			if (diff <= 0) {
				countdownEl.textContent = 'Khuyến mãi đã kết thúc';
				clearInterval(countdownInterval);
				return;
			}
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
			const minutes = Math.floor((diff / (1000 * 60)) % 60);
			const seconds = Math.floor((diff / 1000) % 60);
			
			countdownEl.innerHTML = `
				<span class="cd-box">${days}</span><span class="cd-lbl">ngày</span>
				<span class="cd-box">${hours.toString().padStart(2, '0')}</span><span class="cd-lbl">giờ</span>
				<span class="cd-box">${minutes.toString().padStart(2, '0')}</span><span class="cd-lbl">phút</span>
				<span class="cd-box">${seconds.toString().padStart(2, '0')}</span><span class="cd-lbl">giây</span>
			`;
		}

		update();
		clearInterval(countdownInterval);
		countdownInterval = setInterval(update, 1000);
	}

	function setLoading() {
		container.innerHTML = '<div class="loading">Đang tải khuyến mãi...</div>';
	}

	function setError(message, useCacheAvailable = false) {
		container.innerHTML = '';
		const box = document.createElement('div');
		box.className = 'error-box';
		box.innerHTML = `<div class="error-message">${message}</div>`;

		const retry = document.createElement('button');
		retry.textContent = 'Tải lại';
		retry.className = 'retry-btn';
		retry.addEventListener('click', () => {
			load(true);
		});
		box.appendChild(retry);

		if (useCacheAvailable) {
			const useCached = document.createElement('button');
			useCached.textContent = 'Hiển thị dữ liệu đã lưu (offline)';
			useCached.className = 'use-cache-btn';
			useCached.addEventListener('click', () => {
				const cached = localStorage.getItem(CACHE_KEY);
				if (cached) {
					try {
						const products = JSON.parse(cached);
						renderProducts(products);
						startCountdown(products);
					} catch (e) {
						console.error('Invalid cache', e);
					}
				}
			});
			box.appendChild(useCached);
		}

		container.appendChild(box);
	}

	async function fetchProducts() {
		const res = await fetch(API_URL, { cache: 'no-store' });
		if (!res.ok) throw new Error(`API returned ${res.status}`);
		const json = await res.json();

		// Support both response formats:
		// 1) Standardized: { success: true, data: [...] }
		// 2) Auto-unwrapped by api-patcher.js: [...]
		if (Array.isArray(json)) {
			return json;
		}

		if (json && Array.isArray(json.data)) {
			return json.data;
		}

		return [];
	}

	// load(forceRefresh=false): if forceRefresh is true, always attempt fetch (used by retry)
	async function load(forceRefresh = false) {
		setLoading();
		// If not forcing refresh and cached exists, show cached immediately while also trying to refresh in background
		const cachedRaw = localStorage.getItem(CACHE_KEY);
		if (!forceRefresh && cachedRaw) {
			try {
				const cachedProducts = JSON.parse(cachedRaw);
				renderProducts(cachedProducts);
				startCountdown(cachedProducts);
			} catch (e) {
				console.warn('Invalid cache, will fetch fresh data', e);
			}
		}

		try {
			const products = await fetchProducts();
			if (!products || !products.length) {
				renderProducts([]);
				startCountdown([]);
				localStorage.removeItem(CACHE_KEY);
				return;
			}
			renderProducts(products);
			startCountdown(products);
			try {
				localStorage.setItem(CACHE_KEY, JSON.stringify(products));
			} catch (e) {
				// ignore quota errors
				console.warn('Could not cache products locally', e);
			}
		} catch (err) {
			console.error('Error fetching promotions', err);
			const hasCache = !!localStorage.getItem(CACHE_KEY);
			setError('Không thể tải khuyến mãi từ server. Vui lòng kiểm tra kết nối hoặc thử lại.', hasCache);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => load(false));
	} else {
		load(false);
	}

})();


