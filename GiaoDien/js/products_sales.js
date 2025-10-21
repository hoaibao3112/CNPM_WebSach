// products_sales.js
// API-first implementation to load active promotion products into the product_sales component.
// No hard-coded sample data. If the API can't be reached the UI shows a retry button and (optionally) uses a cached response from localStorage.

(function () {
	const API_URL = 'http://localhost:5000/api/khuyenmai/active-products';
		const container = document.getElementById('flash-products');
	const countdownEl = document.getElementById('flash-countdown');
	const CACHE_KEY = 'flash_sale_products_v1';
		// Backend image base (served by server.js at /product-images)
		const IMAGE_BASE = 'http://localhost:5000/product-images';

	function formatCurrency(v) {
		return Number(v).toLocaleString('vi-VN') + ' ₫';
	}

	function createProductCard(p) {
		const wrapper = document.createElement('div');
		wrapper.className = 'sale-item';

		const link = document.createElement('a');
		// Use navigation via localStorage so the target page can read the selected product
		link.href = `giamgia1.html`;
		link.className = 'sale-item-link';

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

		const title = document.createElement('div');
		title.className = 'sale-item-title';
		title.textContent = p.TenSP || '';

		const priceWrap = document.createElement('div');
		priceWrap.className = 'sale-item-price';

		const discounted = document.createElement('span');
		discounted.className = 'discount-price';

		// Calculate discounted price depending on LoaiKM
		if (p.LoaiKM === 'giam_tien_mat') {
			const discount = Number(p.GiaTriGiam) || 0;
			const d = Math.max(0, Number(p.DonGia) - discount);
			discounted.textContent = formatCurrency(d);
		} else if (p.LoaiKM === 'giam_phan_tram') {
			const percent = Number(p.GiaTriGiam) || 0;
			const d = Math.round(Number(p.DonGia) * (1 - percent / 100));
			discounted.textContent = formatCurrency(d);
		} else {
			discounted.textContent = formatCurrency(p.DonGia || 0);
		}

		const original = document.createElement('span');
		original.className = 'orig-price';
		original.textContent = formatCurrency(p.DonGia || 0);

		priceWrap.appendChild(discounted);
		priceWrap.appendChild(original);

		link.appendChild(img);
		link.appendChild(title);
		link.appendChild(priceWrap);

		// When the user clicks any part of the card, persist selection and navigate
		link.addEventListener('click', (ev) => {
			ev.preventDefault();
			try {
				localStorage.setItem('selectedProductId', String(p.MaSP));
				localStorage.setItem('currentProduct', JSON.stringify(p));
				window.location.href = link.href;
			} catch (e) {
				console.error('Error navigating to product detail', e);
				// fallback: still navigate
				window.location.href = link.href;
			}
		});
		wrapper.appendChild(link);

		return wrapper;
	}

		// Render products into a sliding track with paging (5 items per view)
		function renderProducts(list) {
			container.innerHTML = '';
			if (!list || !list.length) {
				container.innerHTML = '<div class="no-products">Không có sản phẩm khuyến mãi.</div>';
				return;
			}

			const trackWrap = document.createElement('div');
			trackWrap.className = 'sale-track-wrap';

			const track = document.createElement('div');
			track.className = 'sale-track';
			list.forEach(p => track.appendChild(createProductCard(p)));

			trackWrap.appendChild(track);
			container.appendChild(trackWrap);

			// paging controls
			const itemsPerPage = 5;
			let currentPage = 0;
			const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));

			// create nav only if more than one page
			if (totalPages > 1) {
				const prev = document.createElement('button');
				prev.className = 'nav-btn nav-prev';
				prev.innerHTML = '&lt;';
				prev.title = 'Xem trước';
				prev.disabled = true;

				const next = document.createElement('button');
				next.className = 'nav-btn nav-next';
				next.innerHTML = '&gt;';
				next.title = 'Xem thêm';

				function updateNav() {
					// compute translate based on container width
					const step = trackWrap.clientWidth;
					track.style.transform = `translateX(${-currentPage * step}px)`;
					prev.disabled = currentPage === 0;
					next.disabled = currentPage >= totalPages - 1;
				}

				prev.addEventListener('click', () => {
					if (currentPage > 0) {
						currentPage -= 1;
						updateNav();
					}
				});

				next.addEventListener('click', () => {
					if (currentPage < totalPages - 1) {
						currentPage += 1;
						updateNav();
					}
				});

				// Recompute on resize
				window.addEventListener('resize', () => {
					updateNav();
				});

				// Add nav buttons into the track wrapper so top:50% centers them correctly
				trackWrap.appendChild(prev);
				trackWrap.appendChild(next);

				// initial layout: ensure each item width equals trackWrap width / itemsPerPage
				function layoutItems() {
					const wrapWidth = trackWrap.clientWidth;
					const itemWidth = Math.floor((wrapWidth - (itemsPerPage - 1) * 18) / itemsPerPage);
					const children = track.children;
					for (let i = 0; i < children.length; i++) {
						children[i].style.flex = `0 0 ${itemWidth}px`;
					}
				}

				// run layout and updateNav after appended to DOM
				setTimeout(() => {
					layoutItems();
					updateNav();
				}, 50);
			} else {
				// single page: make items flexible (fit 5 columns)
				setTimeout(() => {
					const wrapWidth = track.clientWidth;
					const itemWidth = Math.floor((wrapWidth - (5 - 1) * 18) / 5);
					const children = track.children;
					for (let i = 0; i < children.length; i++) {
						children[i].style.flex = `0 0 ${itemWidth}px`;
					}
				}, 50);
			}
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
			countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
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

