/**
 * shipping-calculator.js
 * Logic for the dynamic shipping fee calculator on the Shipping Policy page.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const provinceSelect = document.getElementById('calc-province');
    const weightInput = document.getElementById('calc-weight');
    const calculateBtn = document.getElementById('btn-calculate');
    const tierButtons = document.querySelectorAll('.tier-btn');
    const resultSection = document.getElementById('calc-result');
    
    // Result elements
    const resOriginal = document.getElementById('res-original');
    const resDiscount = document.getElementById('res-discount');
    const resDiscountLabel = document.getElementById('res-discount-label');
    const resTotal = document.getElementById('res-total');
    const resMsgText = document.getElementById('res-msg-text');

    let selectedTier = 'Đồng';

    // 1. Load Provinces
    async function loadProvinces() {
        try {
            const apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';
            const response = await fetch(`${apiBase}/api/address/cities`);
            if (!response.ok) throw new Error('Failed to fetch cities');
            
            const cities = await response.json();
            provinceSelect.innerHTML = '<option value="">Chọn tỉnh thành...</option>';
            
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.city_name; // We use name for logic matching
                option.textContent = city.city_name;
                provinceSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading provinces:', error);
            provinceSelect.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        }
    }

    // 2. Handle Tier Selection
    tierButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tierButtons.forEach(b => {
                b.classList.remove('active', 'border-primary', 'bg-primary/5', 'text-primary');
                b.classList.add('border-border', 'bg-white', 'text-text-light');
            });
            
            btn.classList.add('active', 'border-primary', 'bg-primary/5', 'text-primary');
            btn.classList.remove('border-border', 'bg-white', 'text-text-light');
            
            selectedTier = btn.dataset.tier;
        });
    });

    // 3. Pre-select user tier if logged in
    const storedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('loggedInUser') || '{}');
    if (storedUser && storedUser.loyalty_tier) {
        const tier = storedUser.loyalty_tier;
        const targetBtn = document.querySelector(`.tier-btn[data-tier="${tier}"]`);
        if (targetBtn) targetBtn.click();
    }

    // 4. Calculation Logic
    function calculate() {
        const province = provinceSelect.value;
        const weight = parseInt(weightInput.value);

        if (!province || !weight || weight <= 0) {
            resultSection.classList.remove('hidden');
            resOriginal.style.display = 'none';
            resDiscount.parentElement.style.display = 'none';
            resTotal.textContent = '--';
            resMsgText.innerHTML = `<span class="text-red-500">Vui lòng chọn tỉnh thành và nhập khối lượng hợp lệ để tính phí.</span>`;
            return;
        }

        const provinceLower = province.toLowerCase().trim();
        const isHCM = provinceLower.includes('hồ chí minh') || 
                      provinceLower.includes('hcm') || 
                      provinceLower.includes('tp.hcm');

        let originalFee = 0;
        let discountAmount = 0;
        let tierPct = 0;

        if (isHCM) {
            originalFee = 0;
            discountAmount = 0;
        } else {
            const units = Math.ceil(weight / 500);
            originalFee = units * 15000;

            if (selectedTier === 'Bạc') tierPct = 0.2;
            else if (selectedTier === 'Vàng') tierPct = 0.5;

            discountAmount = Math.round(originalFee * tierPct);
        }

        const finalFee = originalFee - discountAmount;

        // Update UI
        resOriginal.textContent = originalFee.toLocaleString('vi-VN') + 'đ';
        resDiscount.textContent = '-' + discountAmount.toLocaleString('vi-VN') + 'đ';
        resDiscountLabel.textContent = `Ưu đãi thành viên (${selectedTier}):`;
        resTotal.textContent = finalFee.toLocaleString('vi-VN') + 'đ';

        if (isHCM) {
            resOriginal.style.display = 'none';
            resDiscount.parentElement.style.display = 'none';
            resMsgText.textContent = "Chúc mừng! Bạn thuộc khu vực ưu tiên Miễn phí vận chuyển 0đ.";
            resTotal.classList.add('text-green-600');
            resTotal.classList.remove('text-primary');
        } else {
            resOriginal.style.display = 'block';
            resDiscount.parentElement.style.display = 'flex';
            resTotal.classList.remove('text-green-600');
            resTotal.classList.add('text-primary');
            
            if (tierPct > 0) {
                resMsgText.textContent = `Bạn đã tiết kiệm được ${discountAmount.toLocaleString()}đ nhờ hạng ${selectedTier}!`;
            } else {
                resMsgText.textContent = "Mẹo: Lên hạng Bạc hoặc Vàng để được giảm tới 50% phí ship.";
            }
        }

        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    calculateBtn.addEventListener('click', calculate);

    // Initial load
    await loadProvinces();
});
