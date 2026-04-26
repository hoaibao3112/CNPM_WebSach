const randomModal = document.getElementById('randomBooksModal');
const randomModalContent = document.getElementById('randomBooksModalContent');
const randomGrid = document.getElementById('randomBooksGrid');
let allProductsCache = null;

function openRandomBooksModal(title, iconClass) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalIcon').className = `${iconClass} text-xl`;
  
  randomModal.classList.remove('hidden');
  // Trigger reflow
  void randomModal.offsetWidth;
  randomModal.classList.remove('opacity-0');
  randomModalContent.classList.remove('scale-95');

  loadRandomBooks();
}

function closeRandomBooksModal() {
  randomModal.classList.add('opacity-0');
  randomModalContent.classList.add('scale-95');
  setTimeout(() => {
    randomModal.classList.add('hidden');
  }, 300);
}

async function loadRandomBooks() {
  randomGrid.innerHTML = `
    <div class="col-span-full py-20 flex flex-col items-center justify-center text-primary gap-4">
      <i class="fas fa-circle-notch fa-spin text-4xl"></i>
      <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Đang tìm sách hay...</p>
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

    randomGrid.innerHTML = selected.map(p => {
      const image = p.HinhAnh || p.image || 'default-book.jpg';
      const priceStr = Number(p.DonGia || 0).toLocaleString('vi-VN');
      const isSale = p.GiamGia > 0;
      const imgUrl = image.startsWith('http') ? image : `${window.API_CONFIG.BASE_URL}/product-images/${image}`;
      
      return `
        <div onclick="localStorage.setItem('selectedProductId', ${p.MaSP}); window.location.href='product_detail.html'" 
             class="bg-white border border-gray-100 rounded-2xl p-3 cursor-pointer group hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col h-full relative overflow-hidden">
          
          ${isSale ? `<div class="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-bl-xl z-10">-${p.GiamGia}%</div>` : ''}
          
          <div class="aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-gray-50 relative">
            <img src="${imgUrl}" 
                 onerror="this.src='img/product/default-book.jpg'"
                 class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
          </div>
          
          <div class="flex-1 flex flex-col">
            <h3 class="text-[13px] font-bold text-gray-800 line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">${p.TenSP}</h3>
            <div class="mt-auto">
              <p class="text-primary font-black">${priceStr}đ</p>
              ${isSale ? `<p class="text-[10px] text-gray-400 line-through font-medium">${Number(p.GiaGoc || 0).toLocaleString('vi-VN')}đ</p>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Lỗi load sách ngẫu nhiên:', err);
    randomGrid.innerHTML = `
      <div class="col-span-full py-12 text-center">
        <i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
        <p class="text-sm text-gray-500">Không thể tải sách lúc này</p>
      </div>
    `;
  }
}

// Đóng modal khi click ra ngoài
randomModal.addEventListener('click', (e) => {
  if (e.target === randomModal) closeRandomBooksModal();
});
