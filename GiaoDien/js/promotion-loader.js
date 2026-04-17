/**
 * Load Active Promotions for Product Detail Page
 * Lấy danh sách khuyến mãi đang hoạt động từ API
 */

async function loadProductPromotions() {
  const promotionsContainer = document.getElementById('promotions-container');
  
  if (!promotionsContainer) {
    console.warn('⚠️ promotions-container not found');
    return;
  }
  
  try {
    const baseUrl = window.API_CONFIG?.BASE_URL;
    if (!baseUrl) {
      throw new Error('API_CONFIG.BASE_URL is not configured');
    }
    
    // Lấy danh sách khuyến mãi đang hoạt động
    const response = await fetch(`${baseUrl}/api/khuyenmai?activeOnly=true`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const promotions = data.data || [];
    
    if (!Array.isArray(promotions) || promotions.length === 0) {
      // Nếu không có khuyến mãi, ẩn section
      const section = document.querySelector('.promotions-section');
      if (section) {
        section.classList.add('hidden');
      }
      return;
    }
    
    // Fetch chi tiết từng khuyến mãi
    const promotionsWithDetails = await Promise.all(
      promotions.slice(0, 3).map(async (promotion) => {
        try {
          const detailResponse = await fetch(`${baseUrl}/api/khuyenmai/${promotion.MaKM}`);
          if (!detailResponse.ok) throw new Error(`HTTP ${detailResponse.status}`);
          const detailData = await detailResponse.json();
          return { ...promotion, details: detailData.data || detailData };
        } catch (error) {
          console.warn(`⚠️ Cannot load details for ${promotion.MaKM}`, error);
          return { ...promotion, details: null };
        }
      })
    );
    
    // Render promotions
    renderProductPromotions(promotionsWithDetails);
    
    // Show promotions section
    const section = document.querySelector('.promotions-section');
    if (section) {
      section.classList.remove('hidden');
    }
    
  } catch (error) {
    console.error('❌ Error loading promotions:', error);
    const section = document.querySelector('.promotions-section');
    if (section) {
      section.classList.add('hidden');
    }
  }
}

function renderProductPromotions(promotions) {
  const container = document.getElementById('promotions-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  promotions.forEach(promotion => {
    const details = promotion.details || {};
    const chiTiet = details.chi_tiet || {};
    
    let discountInfo = '';
    let discountValue = '';
    
    // Xác định loại khuyến mãi
    if (promotion.LoaiKM === 'giam_phan_tram' && chiTiet.PhanTramGiam) {
      discountValue = `-${chiTiet.PhanTramGiam}%`;
      discountInfo = `Giảm <strong style="color: #E53935;">${chiTiet.PhanTramGiam}%</strong>`;
      if (chiTiet.GiamToiDa) {
        discountInfo += ` (tối đa <strong>${formatCurrency(chiTiet.GiamToiDa)}</strong>)`;
      }
    } else if (promotion.LoaiKM === 'giam_tien_mat' && chiTiet.SoTienGiam) {
      discountValue = `-${formatCurrency(chiTiet.SoTienGiam)}`;
      discountInfo = `Giảm <strong style="color: #E53935;">${formatCurrency(chiTiet.SoTienGiam)}</strong>`;
    } else if (promotion.LoaiKM === 'mua_x_tang_y') {
      discountValue = `Mua ${chiTiet.SoLuongMua || 0} tặng ${chiTiet.SoLuongTang || 0}`;
      discountInfo = discountValue;
    } else {
      return; // Skip nếu không nhận diện được loại
    }
    
    const promotionHTML = `
      <div class="promotion-item">
        <div class="promotion-info">
          <div class="promotion-label">% Giảm %</div>
          <div class="promotion-text">Đang áp dụng</div>
          <div class="promotion-text" style="font-weight: 600; margin-top: 0.5rem;">
            ${promotion.TenKM || 'Khuyến mãi'}
          </div>
          <div class="promotion-text">
            ${promotion.MoTa || ''}
          </div>
          <div class="promotion-discount">${discountValue}</div>
          ${chiTiet.GiamToiDa ? `<div style="color: var(--text-color); font-size: 0.9rem; margin-top: 0.5rem;">Tối đa ${formatCurrency(chiTiet.GiamToiDa)}</div>` : ''}
          ${chiTiet.DonToiThieu ? `<div style="color: var(--text-color); font-size: 0.9rem; margin-top: 0.5rem;">Đơn tối thiểu: <strong>${formatCurrency(chiTiet.DonToiThieu)}</strong></div>` : ''}
        </div>
        <div class="promotion-code">${promotion.MaKM || 'N/A'}</div>
        <div class="promotion-actions">
          <button class="promotion-btn" type="button" onclick="showPromotionDetails('${promotion.MaKM}')">Chi tiết</button>
          <button class="promotion-btn" type="button" onclick="savePromotionCode('${promotion.MaKM}')">Lưu mã</button>
        </div>
      </div>
    `;
    
    container.innerHTML += promotionHTML;
  });
}

function formatCurrency(value) {
  if (!value) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('₫', 'đ');
}

function showPromotionDetails(maKM) {
  // Mở modal hoặc trang chi tiết khuyến mãi
  console.log('Chi tiết khuyến mãi:', maKM);
  // TODO: Implement modal hoặc navigate to promotion detail page
}

function savePromotionCode(maKM) {
  // Lưu mã khuyến mãi vào clipboard hoặc localStorage
  console.log('Saved code:', maKM);
  // TODO: Copy to clipboard
  alert(`Mã khuyến mãi "${maKM}" đã được sao chép!`);
}

// Auto-load khi DOM ready
document.addEventListener('DOMContentLoaded', function() {
  loadProductPromotions();
});
