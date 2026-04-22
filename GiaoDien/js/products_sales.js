(function () {
    // Inject Styles
    if (!document.getElementById('product-sales-styles')) {
        const style = document.createElement('style');
        style.id = 'product-sales-styles';
        style.textContent = `
            .flash-sale-container { background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eee; margin-bottom: 40px; }
            .flash-sale-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; background: linear-gradient(90deg, #C0392B 0%, #e74c3c 100%); color: white; }
            .flash-sale-left { display: flex; align-items: center; gap: 24px; }
            .flash-sale-left h2 { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: 1px; text-transform: uppercase; }
            .countdown { display: flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif; background: rgba(0,0,0,0.2); padding: 8px 16px; border-radius: 50px; }
            .cd-box { background: #fff; color: #C0392B; padding: 2px 8px; border-radius: 6px; font-weight: 800; min-width: 32px; text-align: center; font-size: 14px; }
            .cd-lbl { font-size: 11px; color: rgba(255,255,255,0.9); font-weight: 600; margin-right: 2px; }
            .flash-products { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 32px; }
            .sale-item { background: #fff; border: 1px solid #eee; border-radius: 20px; overflow: hidden; transition: all 0.3s; display: flex; flex-direction: column; }
            .sale-item:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-color: #C0392B; }
            .sale-item-image-wrapper { width: 100%; aspect-ratio: 3/4; background: #f9f9f9; display: flex; align-items: center; justify-content: center; }
            .sale-item-img { width: 100%; height: 100%; object-fit: contain; }
            .sale-item-info { padding: 20px; flex: 1; display: flex; flex-direction: column; }
            .sale-item-title { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .sale-item-author { font-size: 13px; color: #666; margin-bottom: 4px; }
            .sale-item-year { font-size: 12px; color: #999; margin-bottom: 12px; }
            .sale-item-price { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
            .discount-price { font-size: 18px; font-weight: 800; color: #C0392B; }
            .badge-percent { background: #C0392B; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle; }
            .sale-item-quantity { font-size: 11px; color: #999; text-align: right; }
            .sale-item-actions { display: flex; gap: 8px; margin-top: 16px; }
            .btn-add-cart { flex: 1; background: #C0392B; color: #fff; border: none; padding: 10px; border-radius: 10px; font-weight: 700; cursor: pointer; }
            .btn-detail { flex: 1; background: #fff; color: #555; border: 1px solid #ddd; padding: 10px; border-radius: 10px; font-weight: 700; cursor: pointer; }
            .view-all-btn { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4); padding: 8px 24px; border-radius: 50px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.3s; text-transform: uppercase; }
            .view-all-btn:hover { background: #fff; color: #C0392B; }
            @media (max-width: 1024px) { .flash-products { grid-template-columns: repeat(3, 1fr); } }
            @media (max-width: 768px) { .flash-products { grid-template-columns: repeat(2, 1fr); padding: 20px; } }
            @media (max-width: 640px) { .flash-sale-header { flex-direction: column; gap: 16px; align-items: center; text-align: center; } .flash-sale-left { flex-direction: column; gap: 12px; } }
        `;
        document.head.appendChild(style);
    }
	const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
	const API_URL = `${_apiBase}/api/khuyenmai/active-products`;
		const container = document.getElementById('flash-products');
	const countdownEl = document.getElementById('flash-countdown');
	const CACHE_KEY = 'flash_sale_products_v1';
		// Backend image base (served by server.js at /product-images)
		const IMAGE_BASE = `${_apiBase}/product-images`;

	function formatCurrency(v) {
		return Number(v).toLocaleString('vi-VN') + ' ₫';
	}

	// Escape HTML để tránh XSS
	function escapeHtml(unsafe) {
		if (!unsafe) return '';
		return String(unsafe)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	// Toast notification
	function showToast(message) {
		const toast = document.createElement('div');
		toast.className = 'toast-notification';
		toast.innerHTML = `
			<span>${escapeHtml(message)}</span>
			<button class="toast-close">&times;</button>
		`;
		document.body.appendChild(toast);

		const autoHide = setTimeout(() => {
			toast.classList.add('hide');
			setTimeout(() => toast.remove(), 300);
		}, 3000);

		toast.querySelector('.toast-close').addEventListener('click', () => {
			clearTimeout(autoHide);
			toast.classList.add('hide');
			setTimeout(() => toast.remove(), 300);
		});
	}

	// Hàm thêm sản phẩm vào giỏ hàng (giống book.js)
	async function addToCart(productId, productName, price, image) {
		const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('loggedInUser') || '{}');
		const token = localStorage.getItem('token');

		if (user && (user.makh || user.tenkh) && token) {
			// Nếu đã đăng nhập, sử dụng API
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
					const data = await response.json();
					showToast(`Đã thêm ${productName} vào giỏ hàng!`);
					if (typeof updateCartCount === 'function') {
						updateCartCount(); // Cập nhật UI từ index.js nếu có
					}
					return;
				} else {
					const errorData = await response.json();
					showToast(errorData.error || 'Lỗi khi thêm vào giỏ hàng');
				}
			} catch (error) {
				console.error('Lỗi thêm vào giỏ hàng:', error);
				showToast('Lỗi kết nối. Vui lòng thử lại!');
			}
		} else {
			// Nếu chưa đăng nhập, sử dụng localStorage (fallback)
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
			showToast(`Đã thêm ${productName} vào giỏ hàng! (Vui lòng đăng nhập để lưu vĩnh viễn)`);
			if (typeof updateCartCount === 'function') {
				updateCartCount(); // Cập nhật UI
			}
		}
	}

	function createProductCard(p) {
		const wrapper = document.createElement('div');
		wrapper.className = 'sale-item';

		// Image wrapper (with aspect ratio) - clickable to view detail
		const imageWrapper = document.createElement('div');
		imageWrapper.className = 'sale-item-image-wrapper';
		imageWrapper.style.cursor = 'pointer';

		const img = document.createElement('img');
		img.alt = p.TenSP || 'product';
		img.className = 'sale-item-img';
		// Primary: load from backend static product-images route
		const candidates = [];
		if (p.HinhAnh) {
			candidates.push(`${IMAGE_BASE}/${p.HinhAnh}`); // backend
			candidates.push(`../img/product/${p.HinhAnh}`); // local fallback (relative)
			candidates.push(`img/product/${p.HinhAnh}`); // another local fallback
		}
		candidates.push('../img/logo/no-image.png');

		let tried = 0;
		img.src = candidates[0];
		img.addEventListener('error', () => {
			tried += 1;
			if (tried < candidates.length) {
				img.src = candidates[tried];
			} else {
				img.src = '../img/logo/no-image.png';
			}
		});

		// Discount badge
		// We remove the hardcoded 'KHUYẾN MÃI' badge from imageWrapper
		// because the screenshot shows the percentage next to the price instead!

		imageWrapper.appendChild(img);

		// Click image to view detail
		imageWrapper.addEventListener('click', () => {
			try {
				localStorage.setItem('selectedProductId', String(p.MaSP));
				localStorage.setItem('currentProduct', JSON.stringify(p));
				window.location.href = 'product_detail.html';
			} catch (e) {
				console.error('Error navigating to product detail', e);
				window.location.href = 'product_detail.html';
			}
		});

		// Info section
		const infoDiv = document.createElement('div');
		infoDiv.className = 'sale-item-info';

		const title = document.createElement('div');
		title.className = 'sale-item-title';
		title.textContent = p.TenSP || '';
		title.style.cursor = 'pointer';
		
		// Click title to view detail
		title.addEventListener('click', () => {
			try {
				localStorage.setItem('selectedProductId', String(p.MaSP));
				localStorage.setItem('currentProduct', JSON.stringify(p));
				window.location.href = 'product_detail.html';
			} catch (e) {
				console.error('Error navigating to product detail', e);
				window.location.href = 'product_detail.html';
			}
		});

		const author = document.createElement('div');
		author.className = 'sale-item-author';
		author.textContent = p.TacGia ? `Tác giả: ${p.TacGia}` : '';

		const year = document.createElement('div');
		year.className = 'sale-item-year';
		year.textContent = p.NamXB ? `Năm XB: ${p.NamXB}` : '';

		const priceWrap = document.createElement('div');
		priceWrap.className = 'sale-item-price';

		const priceLeft = document.createElement('div');
		const discounted = document.createElement('span');
		discounted.className = 'discount-price';

		let percentValue = 0;
		if (p.LoaiKM === 'giam_tien_mat') {
			const discount = Number(p.GiaTriGiam) || 0;
			const d = Math.max(0, Number(p.DonGia) - discount);
			discounted.textContent = formatCurrency(d);
			if (p.DonGia > 0) percentValue = Math.round((discount / p.DonGia) * 100);
		} else if (p.LoaiKM === 'giam_phan_tram') {
			const percent = Number(p.GiaTriGiam) || 0;
			const d = Math.round(Number(p.DonGia) * (1 - percent / 100));
			discounted.textContent = formatCurrency(d);
			percentValue = Math.round(percent);
		} else {
			discounted.textContent = formatCurrency(p.DonGia || 0);
		}

		priceLeft.appendChild(discounted);
		priceLeft.appendChild(document.createTextNode(' '));
		
		// Insert percentage badge next to discount price
		if (percentValue > 0) {
			const percentBadge = document.createElement('span');
			percentBadge.className = 'badge-percent';
			percentBadge.textContent = `-${percentValue}%`;
			priceLeft.appendChild(percentBadge);
		}

		const original = document.createElement('div');
		original.className = 'orig-price';
		original.textContent = formatCurrency(p.DonGia || 0);

		const quantity = document.createElement('div');
		quantity.className = 'sale-item-quantity';
		quantity.innerHTML = `<span>Đã bán (0)</span><div class="sold-fill" style="width: 10%"></div>`;

		priceWrap.appendChild(priceLeft);
		priceWrap.appendChild(quantity);

		// Action buttons
		const actionsDiv = document.createElement('div');
		actionsDiv.className = 'sale-item-actions';

		const btnAddCart = document.createElement('button');
		btnAddCart.className = 'btn-add-cart';
		btnAddCart.textContent = 'Thêm vào giỏ';
		btnAddCart.type = 'button'; // Explicitly set type
		// Only disable if no stock
		const hasStock = p.SoLuong && p.SoLuong > 0;
		if (!hasStock) {
			btnAddCart.disabled = true;
		}

		const btnDetail = document.createElement('button');
		btnDetail.className = 'btn-detail';
		btnDetail.textContent = 'Chi tiết';
		btnDetail.type = 'button'; // Explicitly set type

		actionsDiv.appendChild(btnAddCart);
		actionsDiv.appendChild(btnDetail);

		infoDiv.appendChild(title);
		infoDiv.appendChild(author);
		infoDiv.appendChild(year);
		infoDiv.appendChild(priceWrap);
		infoDiv.appendChild(actionsDiv);

		wrapper.appendChild(imageWrapper);
		wrapper.appendChild(infoDiv);

		// Add to cart button action - sử dụng hàm addToCart giống book.js
		btnAddCart.addEventListener('click', (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
			if (!hasStock) {
				showToast('Sản phẩm đã hết hàng!');
				return;
			}
			console.log('Adding to cart:', {
				MaSP: p.MaSP,
				TenSP: p.TenSP,
				DonGia: p.DonGia,
				HinhAnh: p.HinhAnh,
				SoLuong: p.SoLuong
			});
			addToCart(p.MaSP, p.TenSP, p.DonGia, p.HinhAnh || 'default-book.jpg');
		});

		// Detail button action
		btnDetail.addEventListener('click', (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
			try {
				localStorage.setItem('selectedProductId', String(p.MaSP));
				localStorage.setItem('currentProduct', JSON.stringify(p));
				window.location.href = 'product_detail.html';
			} catch (e) {
				console.error('Error navigating to product detail', e);
				window.location.href = 'product_detail.html';
			}
		});

		return wrapper;
	}

		// Render products (chỉ hiển thị đúng 4 sản phẩm)
		function renderProducts(list) {
			container.innerHTML = '';
			if (!list || !list.length) {
				container.innerHTML = '<div class="no-products">Không có sản phẩm khuyến mãi.</div>';
				return;
			}

			// Chỉ lấy tối đa 4 sản phẩm
			const displayList = list.slice(0, 4);

			const trackWrap = document.createElement('div');
			trackWrap.className = 'sale-track-wrap';

			const track = document.createElement('div');
			track.className = 'sale-track';
			
			displayList.forEach(p => track.appendChild(createProductCard(p)));

			trackWrap.appendChild(track);
			container.appendChild(trackWrap);
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


