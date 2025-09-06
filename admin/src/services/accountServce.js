import axios from 'axios';

export const fetchAccounts = async () => {
  try {
    const response = await axios.get('/api/accounts1'); // Đảm bảo endpoint này tồn tại
    return response.data; // Trả về dữ liệu từ API
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tài khoản:', error);
    return []; // Trả về mảng rỗng nếu có lỗi
  }
};