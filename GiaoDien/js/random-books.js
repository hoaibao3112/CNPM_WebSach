const randomModal = document.getElementById('randomBooksModal');
const randomBackdrop = document.getElementById('randomBooksBackdrop');
const randomGrid = document.getElementById('randomBooksGrid');
let allProductsCache = null;

function openRandomBooksModal(title, iconClass) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalIcon').className = `${iconClass} md:text-lg`;
  
  // Hiển thị backdrop
  randomBackdrop.classList.remove('hidden');
  void randomBackdrop.offsetWidth; // trigger reflow
  randomBackdrop.classList.remove('opacity-0');

  // Trượt drawer vào
  randomModal.classList.remove('translate-x-full');

  loadRandomBooks();
}

function closeRandomBooksModal() {
  // Ẩn backdrop
  randomBackdrop.classList.add('opacity-0');
  
  // Trượt drawer ra
  randomModal.classList.add('translate-x-full');

  setTimeout(() => {
    randomBackdrop.classList.add('hidden');
  }, 300);
}

async function loadRandomBooks() {
  randomGrid.innerHTML = `
    <div class="py-20 flex flex-col items-center justify-center text-primary gap-4">
      <i class="fas fa-circle-notch fa-spin text-4xl"></i>
      <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Đang tìm sách hay...</p>
    </div>
  `;

  try {
    if (!allProductsCache) {
      const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/product`);
      const data = await res.json();
      allProductsCache = Array.isArray(data) ? data : (data.data || []);
    }

    if (allProductsCache.length === 0) throw new Error("Không có sản phẩm");

    // Shuffle and pick 10
    const shuffled = [...allProductsCache].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    // Chuyển sang layout lưới 2 cột cho sidebar
    randomGrid.className = "grid grid-cols-2 gap-3";

    randomGrid.innerHTML = selected.map(p => {
      const image = p.HinhAnh || p.image || 'default-book.jpg';
      const priceStr = Number(p.DonGia || 0).toLocaleString('vi-VN');
      const isSale = p.GiamGia > 0;
      const imgUrl = window.API_CONFIG ? window.API_CONFIG.resolveImageUrl(image) : image;
      
      return `
        <div onclick="localStorage.setItem('selectedProductId', ${p.MaSP}); window.location.href='product_detail.html'" 
             class="bg-white border border-gray-100 rounded-xl p-2 cursor-pointer group hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col h-full relative overflow-hidden">
          
          ${isSale ? `<div class="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg z-10">-${p.GiamGia}%</div>` : ''}
          
          <div class="aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-gray-50 relative">
            <img src="${imgUrl}" 
                 onerror="this.src='img/product/default-book.jpg'"
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          </div>
          
          <div class="flex-1 flex flex-col">
            <h3 class="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight mb-1.5 group-hover:text-primary transition-colors">${p.TenSP}</h3>
            <div class="mt-auto">
              <p class="text-primary font-black text-sm">${priceStr}đ</p>
              ${isSale ? `<p class="text-[9px] text-gray-400 line-through font-medium">${Number(p.GiaGoc || 0).toLocaleString('vi-VN')}đ</p>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Lỗi load sách ngẫu nhiên:', err);
    randomGrid.className = "flex flex-col";
    randomGrid.innerHTML = `
      <div class="py-12 text-center">
        <i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
        <p class="text-xs text-gray-500">Không thể tải sách lúc này</p>
      </div>
    `;
  }
}
