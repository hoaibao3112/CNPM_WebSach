async function productSearchActivity(searchText, customerId) {
    try {
        await fetch('http://localhost:5000/api/client/activity/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: searchText,
                makh: customerId // Gửi makh (có thể là null)
            })
        });
        console.log(`Đã log search (makh: ${customerId || 'guest'}): ${searchText}`);
    } catch (error) {
        console.error("Lỗi khi log search:", error);
    }
}

async function productViewActivity(maSanPham, customerId) {
    try {
        await fetch('http://localhost:5000/api/client/activity/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                maSanPham: maSanPham,
                makh: customerId 
            })
        });
        console.log(`Đã log view (makh: ${customerId || 'guest'}) cho sản phẩm: ${maSanPham}`);
    } catch (error) {
        console.error('Lỗi mạng khi log view:', error);
    }
}
