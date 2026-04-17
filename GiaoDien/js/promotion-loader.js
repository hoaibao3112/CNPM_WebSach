/**
 * Load Active Promotions for Product Detail Page
 * Lấy danh sách khuyến mãi đang hoạt động từ API
 */

async function loadProductPromotions() {
  console.log('🚀 loadProductPromotions started');
  const promotionsContainer = document.getElementById('promotions-container');
  console.log('📍 promotions-container element:', promotionsContainer);
  
  if (!promotionsContainer) {
    console.error('❌ promotions-container not found!');
    return;
  }
  
  try {
    const baseUrl = window.API_CONFIG?.BASE_URL;
    console.log('🔍 Loading promotions from:', baseUrl);
    
    if (!baseUrl) {
      throw new Error('API_CONFIG.BASE_URL is not configured');
    }
    
    // Lấy danh sách khuyến mãi đang hoạt động
    const url = `${baseUrl}/api/khuyenmai?activeOnly=true`;
    console.log('📡 Fetching:', url);
    
    const response = await fetch(url);
    console.log('📡 API Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 API Data received:', data);
    const promotions = data.data || [];
    console.log('📊 Promotions array:', promotions);
    
    if (!Array.isArray(promotions) || promotions.length === 0) {
      console.warn('⚠️ No active promotions found');
      showNoPromotionsMessage();
      return;
    }
    
    console.log(`✅ Found ${promotions.length} promotions, fetching details...`);
    
    // Fetch chi tiết từng khuyến mãi
    const promotionsWithDetails = await Promise.all(
      promotions.slice(0, 3).map(async (promotion) => {
        try {
          const detailResponse = await fetch(`${baseUrl}/api/khuyenmai/${promotion.MaKM}`);
          if (!detailResponse.ok) throw new Error(`HTTP ${detailResponse.status}`);
          const detailData = await detailResponse.json();
          console.log(`✅ Loaded details for ${promotion.MaKM}:`, detailData);
          return { ...promotion, details: detailData.data || detailData };
        } catch (error) {
          console.warn(`⚠️ Cannot load details for ${promotion.MaKM}`, error);
          return { ...promotion, details: null };
        }
      })
    );
    
    console.log('🎨 About to render promotions:', promotionsWithDetails);
    // Render promotions
    renderProductPromotions(promotionsWithDetails);
    console.log('✅ Promotions rendered!');
    
    // Show promotions section
    const section = document.querySelector('.promotions-section');
    if (section) {
      section.classList.remove('hidden');
      console.log('✅ Promotions section shown');
    }
    
  } catch (error) {
    console.error('❌ Error loading promotions:', error);
    console.log('📍 Showing no promotions message...');
    showNoPromotionsMessage();
  }
}

function showNoPromotionsMessage() {
  console.log('📍 showNoPromotionsMessage called');
  const container = document.getElementById('promotions-container');
  console.log('📍 Container found:', !!container);
  
  if (!container) {
    console.error('❌ Container not found in showNoPromotionsMessage!');
    return;
  }
  
  container.innerHTML = `
    <div style="
      text-align: center;
      padding: 2rem;
      color: #999;
      font-size: 0.95rem;
      background: #F5F5F5;
      border-radius: 8px;
    ">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">✨</div>
      <p style="margin: 0;">Không có khuyến mãi áp dụng cho sản phẩm này lúc này.</p>
    </div>
  `;
  
  console.log('✅ No promotions message shown');
}

function renderProductPromotions(promotions) {
  console.log('🎨 renderProductPromotions called with:', promotions);
  const container = document.getElementById('promotions-container');
  console.log('📍 Container found:', !!container);
  
  if (!container) {
    console.error('❌ Container not found in renderProductPromotions!');
    return;
  }
  
  container.innerHTML = '';
  console.log('✅ Container cleared');
  
  promotions.forEach((promotion, index) => {
    console.log(`🔄 Rendering promotion ${index}:`, promotion);
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
      console.warn(`⚠️ Unknown promotion type: ${promotion.LoaiKM}`);
      return; // Skip nếu không nhận diện được loại
    }
    
    // Xác định badge icon
    let badgeIcon = '%';
    let badgeColor = '#FF9800';
    if (promotion.LoaiKM === 'mua_x_tang_y') {
      badgeIcon = '🎁';
      badgeColor = '#4CAF50';
    } else if (chiTiet.DonToiThieu) {
      badgeIcon = '🚚';
      badgeColor = '#2196F3';
    }

    const promotionHTML = `
      <div class="promotion-item">
        <div class="promotion-badge" style="background-color: ${badgeColor};">
          ${badgeIcon}
        </div>
        <div class="promotion-info">
          <div class="promotion-label">${promotion.TenKM || 'Khuyến mãi'}</div>
          <div class="promotion-text">
            ${promotion.MoTa || ''}
          </div>
          <div class="promotion-code-display">${promotion.MaKM || 'N/A'}</div>
          <div class="promotion-details">
            ${discountValue ? `<span>${discountValue}</span>` : ''}
            ${chiTiet.DonToiThieu ? `<span>Đơn: ${formatCurrency(chiTiet.DonToiThieu)}</span>` : ''}
          </div>
        </div>
        <div class="promotion-actions">
          <button class="promotion-btn" type="button" onclick="showPromotionDetails('${promotion.MaKM}')">Chi tiết</button>
          <button class="promotion-btn" type="button" onclick="savePromotionCode('${promotion.MaKM}')">Lưu mã</button>
        </div>
      </div>
    `;
    
    console.log(`✅ Appending HTML for promotion ${index}`);
    container.innerHTML += promotionHTML;
  });
  
  console.log('✅ All promotions rendered!');
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
  console.log('🔍 Opening promotion details for:', maKM);
  const container = document.getElementById('promotions-container');
  const items = container.querySelectorAll('.promotion-item');
  let promotionData = null;
  
  items.forEach(item => {
    const codeDisplay = item.querySelector('.promotion-code-display');
    if (codeDisplay && codeDisplay.textContent.trim() === maKM) {
      promotionData = {
        code: maKM,
        title: item.querySelector('.promotion-label')?.textContent || '',
        description: item.querySelector('.promotion-text')?.textContent || '',
        details: item.querySelector('.promotion-details')?.textContent || ''
      };
    }
  });
  
  if (!promotionData) return;
  
  const modal = document.createElement('div');
  modal.id = 'promotion-detail-modal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000;';
  
  modal.innerHTML = `
    <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="margin: 0; font-size: 1.3rem; color: #333;">${promotionData.title}</h2>
        <button onclick="document.getElementById('promotion-detail-modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999;">✕</button>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <p style="margin: 0 0 1rem 0; color: #666; line-height: 1.6;">${promotionData.description}</p>
        <div style="background: #F5F5F5; padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.9rem; color: #666;">${promotionData.details}</div>
      </div>
      <div style="display: flex; gap: 1rem;">
        <button onclick="savePromotionCode('${promotionData.code}'); document.getElementById('promotion-detail-modal').remove();" style="flex: 1; padding: 0.8rem; background: #333; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Sao chép mã</button>
        <button onclick="document.getElementById('promotion-detail-modal').remove()" style="flex: 1; padding: 0.8rem; background: #F0F0F0; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Đóng</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function savePromotionCode(maKM) {
  console.log('📋 Copying code:', maKM);
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(maKM).then(() => {
      showToast(`✅ Đã sao chép mã "${maKM}"`);
    }).catch(() => {
      fallbackCopyCode(maKM);
    });
  } else {
    fallbackCopyCode(maKM);
  }
}

function fallbackCopyCode(maKM) {
  const textarea = document.createElement('textarea');
  textarea.value = maKM;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  showToast(`✅ Đã sao chép mã "${maKM}"`);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position: fixed; bottom: 2rem; right: 2rem; background: #4CAF50; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 2000;';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 2000);
}

// Auto-load khi DOM ready
document.addEventListener('DOMContentLoaded', function() {
  loadProductPromotions();
});
