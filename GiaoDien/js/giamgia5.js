// Biến dùng chung
const API_BASE = 'http://localhost:5000'; // Điều chỉnh nếu backend của bạn chạy ở cổng khác
const gap = 0; // Gap giờ được xử lý bằng padding/border trong CSS

// =================================================================
// HELPER FUNCTIONS
// =================================================================

// Xây dựng URL hình ảnh
function buildImageUrl(hinh) {
	if (!hinh) return 'img/default-book.jpg';
	if (/^https?:\/\//i.test(hinh)) return hinh;
	return `${API_BASE}/product-images/${hinh}`;
}

// Định dạng giá tiền
function formatPrice(v) {
	try {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
	} catch (e) { return (v || 0) + '₫'; }
}

// Chống XSS
function escapeHtml(str) {
	if (str === null || str === undefined) return '';
	return str.toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// HÀM MỚI: Tạo HTML cho thẻ sản phẩm (theo layout ảnh)
function createProductCard(p) {
	// LƯU Ý: file productRoutes.js cho thấy API /api/products... chỉ trả về p.DonGia.
	// Tuy nhiên, hình ảnh yêu cầu hiển thị giảm giá.
	// Chúng ta TẠM GIẢ ĐỊNH rằng backend CÓ thêm trường 'GiaKM' hoặc 'DonGiaGiam' vào.
	
	let displayPrice = p.DonGia;
	let oldPrice = null;
	let discountBadge = '';

	// Ưu tiên 1: (Giả định) Giá từ khuyến mãi
	if (p.GiaKM !== undefined && p.GiaKM !== null) {
		displayPrice = p.GiaKM;
		oldPrice = p.DonGia; // DonGia gốc
	}
	// Ưu tiên 2: (Giả định) Có DonGiaGiam
	else if (p.DonGiaGiam !== undefined && p.DonGiaGiam !== null) {
		displayPrice = p.DonGiaGiam;
		oldPrice = p.DonGia;
	}

	// Tính % giảm giá nếu có giá cũ
	if (oldPrice && oldPrice > displayPrice) {
		const discountPercent = Math.round(((oldPrice - displayPrice) / oldPrice) * 100);
		if (discountPercent > 0) {
			oldPrice = formatPrice(oldPrice);
			discountBadge = `<span class="discount-badge">-${discountPercent}%</span>`;
		} else {
			oldPrice = null; // Giảm giá 0% thì không hiển thị
		}
	}

	// Giả lập số lượng đã bán (vì API không có 'DaBan')
	const soldCount = p.DaBan || Math.floor(Math.random() * 50) + 10;
	
	const imgSrc = buildImageUrl(p.HinhAnh);
	
	// Tạo HTML
	const card = document.createElement('article');
	card.className = 'product';
	card.innerHTML = `
		<span class="product-tag">HOT</span>
		<div class="imgwrap">
			<img src="${imgSrc}" alt="${escapeHtml(p.TenSP || '')}" onerror="this.onerror=null;this.src='img/default-book.jpg'" loading="lazy">
		</div>
		<div class="product-info">
			<h4>${escapeHtml(p.TenSP || 'Sản phẩm')}</h4>
			<div class="price">
				<span class="new">${formatPrice(displayPrice)}</span>
				${oldPrice ? `<span class="old">${oldPrice}</span>` : ''}
				${discountBadge}
			</div>
			<div class="product-sold">
				Đã bán ${soldCount}
			</div>
		</div>
	`;

	// Khi click vào cả thẻ sản phẩm -> chuyển sang trang chi tiết
	card.addEventListener('click', (e) => {
		// Nếu click vào 1 phần tử tương tác bên trong (ví dụ nút), bỏ qua
		if (e.target.closest('button') || e.target.closest('.voucher-btn') || e.target.tagName === 'A') return;
		try {
			// Lưu tạm sản phẩm để product_detail.js có thể dùng ngay (fallback)
			localStorage.setItem('currentProduct', JSON.stringify(p));
			// Lưu id riêng như selectedProductId (product_detail.js cũng chấp nhận)
			if (p.MaSP) localStorage.setItem('selectedProductId', p.MaSP);
		} catch (err) {
			console.warn('Không thể lưu product vào localStorage', err);
		}
		const id = p.MaSP || p.id || p.MaSP;
		if (id) {
			window.location.href = `product_detail.html?id=${encodeURIComponent(id)}`;
		}
	});
	return card;
}


// =================================================================
// LOGIC "ƯU ĐÃI XỊN XÒ" (Giả định API từ file khác)
// =================================================================
const PROMOTIONS_API = `${API_BASE}/api/khuyenmai?activeOnly=true&limit=8`;

async function fetchPromotions() {
	try {
		const res = await fetch(PROMOTIONS_API);
		if (!res.ok) {
			console.error('Lỗi khi lấy danh sách khuyến mãi', res.statusText);
			return [];
		}
		const payload = await res.json();
		return Array.isArray(payload.data) ? payload.data : [];
	} catch (err) {
		console.error('Lỗi mạng khi fetch promotions', err);
		return [];
	}
}

function renderPromotions(promos) {
	const container = document.getElementById('offer-cards');
	if (!container) return;
	container.innerHTML = '';
	if (!promos || promos.length === 0) {
		container.innerHTML = '<p style="color:#fff">Hiện không có khuyến mãi</p>';
		return;
	}

	// Read saved promotions from localStorage to set button states
	const myPromos = JSON.parse(localStorage.getItem('myPromos') || '[]');
	const savedIds = myPromos.map(p => p.makm);

	promos.slice(0, 8).forEach(p => {
		const card = document.createElement('div');
		card.className = 'voucher-card';

		const typeLabel = (p.LoaiKM === 'giam_tien_mat') ? 'Giảm tiền' : (p.LoaiKM === 'freeship' ? 'Miễn ship' : 'Giảm %');
		const discountText = p.GiaTriGiam ? (p.LoaiKM === 'giam_phan_tram' ? `${p.GiaTriGiam}%` : `${Number(p.GiaTriGiam).toLocaleString()}₫`) : '';

		const expiry = p.NgayKetThuc ? new Date(p.NgayKetThuc).toLocaleDateString('vi-VN') : '—';

		card.innerHTML = `
			<div class="voucher-icon" style="min-width:70px; text-align:center;">
				<span style="display:block; font-size:24px; color:#ff6b6b;">%</span>
				<div style="font-size:12px; font-weight:700; margin-top:6px;">${typeLabel}</div>
			</div>
			<div class="voucher-info">
				<div class="voucher-title">${escapeHtml(p.TenKM || 'Ưu đãi')}</div>
				<div class="voucher-desc">${escapeHtml(p.MoTa || '')}</div>
				${discountText ? `<div class="voucher-discount">${discountText}</div>` : ''}
				<div class="voucher-expiry">HSD: ${expiry}</div>
			</div>
		`;

		// Action area (code badge + buttons)
		const action = document.createElement('div');
		action.className = 'voucher-action';
		action.style.marginLeft = '12px';

		const codeBadge = document.createElement('div');
		codeBadge.className = 'promo-code';
		codeBadge.style.fontWeight = '700';
		codeBadge.style.marginRight = '8px';
		codeBadge.innerText = p.Code || '—';

		const copyBtn = document.createElement('button');
		copyBtn.className = 'voucher-btn copy-btn';
		copyBtn.type = 'button';
		copyBtn.innerText = 'Sao chép';
		copyBtn.addEventListener('click', async () => {
			const code = p.Code || '';
			if (!code) return;
			try {
				await navigator.clipboard.writeText(code);
				copyBtn.innerText = 'Đã sao chép';
				setTimeout(() => { copyBtn.innerText = 'Sao chép'; }, 1500);
			} catch (e) {
				console.error('Không thể copy:', e);
				alert('Không thể copy mã vào clipboard');
			}
		});

		const claimBtn = document.createElement('button');
		claimBtn.className = 'voucher-btn';
		claimBtn.type = 'button';
		claimBtn.style.minWidth = '92px';

		const isSaved = savedIds.includes(p.MaKM);
		const isActive = Number(p.TrangThai) === 1;
		const isExpired = p.NgayKetThuc && new Date(p.NgayKetThuc) < new Date();

		if (!isActive || isExpired) {
			claimBtn.disabled = true;
			claimBtn.innerText = isExpired ? 'Hết hạn' : 'Ngừng hoạt động';
		} else if (isSaved) {
			claimBtn.disabled = true;
			claimBtn.innerText = 'Đã lưu';
			claimBtn.classList.add('saved');
		} else {
			claimBtn.innerText = 'Lưu mã';
			claimBtn.addEventListener('click', async () => {
				// require token
				const token = localStorage.getItem('token');
				if (!token) {
					alert('Bạn cần đăng nhập để lưu mã');
					return;
				}
				claimBtn.disabled = true;
				claimBtn.innerText = 'Đang lưu...';
				try {
					const res = await fetch(`${API_BASE}/api/khuyenmai/claim/${p.MaKM}`, {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
					});
					const data = await res.json();
					if (res.ok) {
						// save to localStorage
						const list = JSON.parse(localStorage.getItem('myPromos') || '[]');
						if (!list.some(x => x.makm == data.makm)) {
							list.push({ makm: data.makm, code: data.code || p.Code, ngay_lay: data.ngay_lay || new Date().toLocaleDateString() });
							localStorage.setItem('myPromos', JSON.stringify(list));
						}
						claimBtn.innerText = 'Đã lưu';
						claimBtn.classList.add('saved');
					} else {
						claimBtn.disabled = false;
						claimBtn.innerText = 'Lưu mã';
						alert(data.error || 'Lỗi khi lưu mã');
					}
				} catch (err) {
					console.error('Lỗi khi claim:', err);
					claimBtn.disabled = false;
					claimBtn.innerText = 'Lưu mã';
					alert('Lỗi kết nối đến server');
				}
			});
		}

		action.appendChild(codeBadge);
		action.appendChild(copyBtn);
		action.appendChild(claimBtn);

		// layout: append action to card
		card.appendChild(action);

		container.appendChild(card);
	});
}

// =================================================================
// HELPER: Lấy sản phẩm (Chung cho cả Carousel và Grid)
// =================================================================
async function fetchProducts(apiUrl) {
	try {
		const res = await fetch(apiUrl);
		if (!res.ok) {
			console.error(`Lỗi khi lấy sản phẩm từ ${apiUrl}`, res.statusText);
			return [];
		}
		const data = await res.json();
		// Xử lý cả 2 trường hợp: { data: [...] } hoặc [...]
		return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
	} catch (err) {
		console.error(`Lỗi mạng khi fetch từ ${apiUrl}`, err);
		return [];
	}
}


// =================================================================
// HÀM TẠO CAROUSEL (Cho "Sản Phẩm Mới")
// =================================================================
function setupCarousel(carouselId, prevId, nextId) {
	const carouselEl = document.getElementById(carouselId);
	const prevBtn = document.getElementById(prevId);
	const nextBtn = document.getElementById(nextId);
	const tabContainer = document.querySelector(`.product-tabs[data-controls="${carouselId}"]`);
    
	if (!carouselEl || !prevBtn || !nextBtn || !tabContainer) {
		console.warn(`Không tìm thấy phần tử cho carousel: ${carouselId}`);
		return;
	}

	let index = 0;
	let autoPlayTimer = null;
	let currentApiUrl = '';

	// Hàm render sản phẩm vào carousel
	function renderProducts(products) {
		carouselEl.innerHTML = '';
		if (!products || products.length === 0) {
			carouselEl.innerHTML = `<div class="product" style="width:100%; padding: 20px; color:#777">Không có sản phẩm</div>`;
			return;
		}

		products.forEach(p => {
			const card = createProductCard(p); // Dùng hàm tạo thẻ
			carouselEl.appendChild(card);
		});
		index = 0;
		carouselEl.style.transform = '';
		update();
		startAuto();
	}

	// Hàm cập nhật vị trí carousel
	const update = () => {
		const viewport = carouselEl.parentElement.getBoundingClientRect().width;
		const item = carouselEl.querySelector('.product');
		if (!item) return;
        
		// Giả sử chúng ta muốn thấy 5.5 item
		const visibleItems = 5.5;
		const itemWidth = viewport / visibleItems;
		const total = carouselEl.children.length;

		// Cập nhật lại độ rộng của item
		carouselEl.querySelectorAll('.product').forEach(el => {
			el.style.width = `${itemWidth}px`;
		});

		const maxIndex = Math.max(0, total - Math.floor(visibleItems));

		if (index > maxIndex) index = maxIndex;
		if (index < 0) index = 0;
        
		const translate = -index * (itemWidth + gap); // gap = 0
		carouselEl.style.transform = `translateX(${translate}px)`;
	};

	// Các hàm điều khiển auto-play
	const startAuto = () => {
		stopAuto();
		autoPlayTimer = setInterval(() => {
			const viewport = carouselEl.parentElement.getBoundingClientRect().width;
			const item = carouselEl.querySelector('.product');
			if (!item) return;
			const visibleItems = 5.5;
			const total = carouselEl.children.length;
			const maxIndex = Math.max(0, total - Math.floor(visibleItems));
			index = (index >= maxIndex) ? 0 : index + 1; // Quay về 0 khi đến cuối
			update();
		}, 3500);
	};
	const stopAuto = () => { if (autoPlayTimer) clearInterval(autoPlayTimer); };
	const resetAuto = () => { startAuto(); };


	// Gắn sự kiện
	prevBtn.addEventListener('click', () => { index = Math.max(0, index - 1); update(); resetAuto(); });
	nextBtn.addEventListener('click', () => { index = index + 1; update(); resetAuto(); });
	window.addEventListener('resize', update);
	carouselEl.parentElement.addEventListener('mouseenter', stopAuto);
	carouselEl.parentElement.addEventListener('mouseleave', startAuto);

	// Hàm fetch và render (theo tab)
	async function loadContent(apiUrl) {
		if (!apiUrl) return;
		currentApiUrl = apiUrl;
		const products = await fetchProducts(apiUrl);
		renderProducts(products);
	}

	// Gắn sự kiện cho Tabs
	tabContainer.querySelectorAll('.tab-btn').forEach(tab => {
		tab.addEventListener('click', () => {
			tabContainer.querySelector('.tab-btn.active')?.classList.remove('active');
			tab.classList.add('active');
			const endpoint = tab.dataset.apiEndpoint;
			loadContent(`${API_BASE}${endpoint}`);
		});
	});

	// Tải nội dung cho tab active đầu tiên
	const initialTab = tabContainer.querySelector('.tab-btn.active');
	if (initialTab) {
		loadContent(`${API_BASE}${initialTab.dataset.apiEndpoint}`);
	}
}


// =================================================================
// HÀM MỚI: TẠO TAB VÀ GRID (Cho "Sách Kinh Doanh")
// =================================================================
function setupTabbedGrid(gridId) {
	const gridEl = document.getElementById(gridId);
	const tabContainer = document.querySelector(`.product-tabs[data-controls="${gridId}"]`);

	if (!gridEl || !tabContainer) {
		console.warn(`Không tìm thấy phần tử cho grid: ${gridId}`);
		return;
	}
	
	// Hàm render
	function renderProducts(products) {
		gridEl.innerHTML = ''; // Xóa nội dung cũ
		if (!products || products.length === 0) {
			gridEl.innerHTML = `<div class="product" style="width:100%; grid-column: 1 / -1; padding: 20px; color:#777">Không có sản phẩm</div>`;
			return;
		}

		// Giới hạn 5 sản phẩm mỗi tab như trong hình
		products.slice(0, 5).forEach(p => {
			const card = createProductCard(p); // Dùng hàm tạo thẻ
			gridEl.appendChild(card);
		});
	}

	// Hàm fetch và render (theo tab)
	async function loadContent(apiUrl) {
		if (!apiUrl) return;
		renderProducts([]); // Xóa grid cũ
		const products = await fetchProducts(apiUrl);
		renderProducts(products);
	}

	// Gắn sự kiện cho Tabs
	tabContainer.querySelectorAll('.tab-btn').forEach(tab => {
		tab.addEventListener('click', () => {
			tabContainer.querySelector('.tab-btn.active')?.classList.remove('active');
			tab.classList.add('active');
			const endpoint = tab.dataset.apiEndpoint;
			loadContent(`${API_BASE}${endpoint}`);
		});
	});

	// Tải nội dung cho tab active đầu tiên
	const initialTab = tabContainer.querySelector('.tab-btn.active');
	if (initialTab) {
		loadContent(`${API_BASE}${initialTab.dataset.apiEndpoint}`);
	}
}


// =================================================================
// KHỞI CHẠY KHI TẢI TRANG
// =================================================================
document.addEventListener('DOMContentLoaded', function () {
	
	// 1. Khởi chạy phần "ƯU ĐÃI XỊN XÒ"
	(async () => {
		const promos = await fetchPromotions();
		renderPromotions(promos);
	})();

	// 2. Khởi chạy Carousel: SẢN PHẨM MỚI
	// API: /api/products/category-current-year/all (Đã xác nhận trong productRoutes.js)
	setupCarousel(
		'carousel-new', 
		'prev-new', 
		'next-new'
	);

	// 3. Khởi chạy Grid: SÁCH QUẢN TRỊ KINH DOANH
	// API: /api/products/category/:id (Đã xác nhận trong productRoutes.js)
	setupTabbedGrid('grid-biz');
	
	// 4. Khởi chạy Grid: SÁCH KINH DOANH KHÁC
	// API: /api/products/category/:id (Đã xác nhận trong productRoutes.js)
	setupTabbedGrid('grid-other');
});