// products_sales.js
// API-first implementation to load active promotion products into the product_sales component.
// No hard-coded sample data. If the API can't be reached the UI shows a retry button and (optionally) uses a cached response from localStorage.

(function () {
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
		return json && json.data ? json.data : [];
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


