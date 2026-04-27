import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Modal, Button, Select, message, Table, Tag, Space, Input, Avatar, Badge, Dropdown, Menu, Rate, Tooltip } from 'antd';
import { ExclamationCircleFilled, EyeOutlined, DeleteOutlined, MessageOutlined, StarOutlined, SearchOutlined } from '@ant-design/icons';

const { confirm } = Modal;
const { Search, TextArea } = Input;

// ✅ THÊM HÀM FORMAT ĐỊA CHỈ GIỐNG BÊN CUSTOMER
const addressCache = {
  provinces: new Map(),
  districts: new Map(),
  wards: new Map()
};

// Lấy tên tỉnh/thành phố từ mã
async function getProvinceName(provinceCode) {
  if (!provinceCode) return '';

  if (addressCache.provinces.has(provinceCode)) {
    return addressCache.provinces.get(provinceCode);
  }

  try {
    const response = await fetch('https://provinces.open-api.vn/api/p/');
    const provinces = await response.json();

    provinces.forEach(province => {
      addressCache.provinces.set(province.code.toString(), province.name);
    });

    return addressCache.provinces.get(provinceCode.toString()) || provinceCode;
  } catch (error) {
    console.error('Error fetching province:', error);
    return provinceCode;
  }
}

// Lấy tên quận/huyện từ mã
async function getDistrictName(districtCode, provinceCode) {
  if (!districtCode) return '';

  if (addressCache.districts.has(districtCode)) {
    return addressCache.districts.get(districtCode);
  }

  try {
    const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
    const data = await response.json();

    if (data.districts) {
      data.districts.forEach(district => {
        addressCache.districts.set(district.code.toString(), district.name);
      });
    }

    return addressCache.districts.get(districtCode.toString()) || districtCode;
  } catch (error) {
    console.error('Error fetching district:', error);
    return districtCode;
  }
}

// Lấy tên phường/xã từ mã
async function getWardName(wardCode, districtCode) {
  if (!wardCode) return '';

  if (addressCache.wards.has(wardCode)) {
    return addressCache.wards.get(wardCode);
  }

  try {
    const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    const data = await response.json();

    if (data.wards) {
      data.wards.forEach(ward => {
        addressCache.wards.set(ward.code.toString(), ward.name);
      });
    }

    return addressCache.wards.get(wardCode.toString()) || wardCode;
  } catch (error) {
    console.error('Error fetching ward:', error);
    return wardCode;
  }
}

// Hàm format địa chỉ hoàn chỉnh
async function formatFullAddress(invoice) {
  try {
    console.log('🏠 Formatting address for invoice:', invoice);

    const [provinceName, districtName, wardName] = await Promise.all([
      getProvinceName(invoice.province),
      getDistrictName(invoice.district, invoice.province),
      getWardName(invoice.ward, invoice.district)
    ]);

    const addressParts = [
      invoice.shippingAddress,
      wardName,
      districtName,
      provinceName
    ].filter(part => part && part.trim() && part !== 'null' && part !== 'undefined');

    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Chưa có địa chỉ';

    console.log('✅ Formatted address:', fullAddress);
    return fullAddress;
  } catch (error) {
    console.error('Error formatting address:', error);
    return 'Không thể hiển thị địa chỉ';
  }
}
const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatVisible, setChatVisible] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // ✨ THÊM CÁC STATE CHO THÔNG BÁO
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadRooms, setUnreadRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationPolling, setNotificationPolling] = useState(null);
  const [notificationSearchTerm, setNotificationSearchTerm] = useState('');
  const [isSearchingAll, setIsSearchingAll] = useState(false);

  // Ref cho auto scroll
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const orderStatuses = [
    { value: 'Chờ xử lý', color: 'orange' },
    { value: 'Đã xác nhận', color: 'blue' },
    { value: 'Đang giao hàng', color: 'geekblue' },
    { value: 'Đã giao hàng', color: 'green' },
    { value: 'Đã hủy', color: 'red' }
  ];

  // ✅ Hàm lấy Token thông minh
  const getAuthToken = useCallback(() => {
    // 1. Thử lấy từ Cookies
    const cookieToken = (document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1]) || 
                       (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]);
    
    if (cookieToken) return cookieToken;

    // 2. Thử lấy từ LocalStorage
    const localToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (localToken) return localToken;

    return null;
  }, []);

  // ✅ Hàm lấy TẤT CẢ phòng chat để tìm kiếm
  const fetchAllRooms = useCallback(async () => {
    try {
      setIsSearchingAll(true);
      const token = getAuthToken();
      const res = await axios.get((process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com') + '/api/chat/admin/all-rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAllRooms(res.data.rooms || []);
      }
    } catch (error) {
      console.error('❌ Fetch all rooms error:', error);
    } finally {
      setIsSearchingAll(false);
    }
  }, [getAuthToken]);

  // ✅ Fetch invoices from API
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await axios.get((process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com') + '/api/orders/hoadon', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📦 Invoices API response:', response.data);

      // Handle different response structures
      const invoicesData = response.data.data || response.data.invoices || response.data;

      if (Array.isArray(invoicesData)) {
        setInvoices(invoicesData);
      } else if (typeof invoicesData === 'object' && invoicesData !== null) {
        // If it's an object, convert to array or extract the array
        const invoiceArray = Object.values(invoicesData);
        setInvoices(Array.isArray(invoiceArray) ? invoiceArray : []);
      } else {
        console.error('❌ Invalid invoices data:', invoicesData);
        setInvoices([]);
      }
    } catch (error) {
      console.error('❌ Fetch invoices error:', error);
      message.error('Không thể tải danh sách hóa đơn');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  // ✨ THÊM CÁC FUNCTION CHO THÔNG BÁO
  const loadUnreadNotifications = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const [countRes, roomsRes] = await Promise.all([
        axios.get((process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com') + '/api/chat/admin/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get((process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com') + '/api/chat/admin/unread-rooms', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (countRes.data.success) {
        const newCount = countRes.data.unread_count;

        // Phát âm thanh khi có tin nhắn mới
        if (newCount > unreadCount && unreadCount > 0) {
          playNotificationSound();
        }

        setUnreadCount(newCount);
      }

      if (roomsRes.data.success) {
        setUnreadRooms(roomsRes.data.unread_rooms || []);
      }

    } catch (error) {
      console.error('❌ Load notifications error:', error);
    }
  }, [getAuthToken, unreadCount]);


  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Tạo 3 tiếng beep liên tục CỰC TO
      for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 7000 + (i * 500); // 7000, 7500, 8000Hz
        oscillator.type = 'sawtooth'; // Âm thanh răng cưa, rất sắc

        const startTime = audioContext.currentTime + (i * 0.4);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.8, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.35);
      }

      console.log('🚨🚨🚨 TRIPLE ALARM SIREN ACTIVATED!');
    } catch (error) {
      console.log('❌ Could not play alarm:', error);
    }
  };

  // ✅ START NOTIFICATION POLLING - Re-enabled after backend implementation
  const startNotificationPolling = useCallback(() => {
    if (notificationPolling) return;
    const interval = setInterval(loadUnreadNotifications, 5000);
    setNotificationPolling(interval);
    loadUnreadNotifications();
  }, [loadUnreadNotifications, notificationPolling]);

  const stopNotificationPolling = useCallback(() => {
    if (notificationPolling) {
      clearInterval(notificationPolling);
      setNotificationPolling(null);
    }
  }, [notificationPolling]);

  const markRoomAsRead = async (roomId) => {
    try {
      const token = getAuthToken();
      await axios.patch(`${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/chat/admin/mark-read/${roomId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      loadUnreadNotifications();
    } catch (error) {
      console.error('❌ Mark read error:', error);
    }
  };

  // Auto scroll to bottom khi có tin nhắn mới
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // Scroll to bottom khi messages thay đổi
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom]);

  // ✨ START NOTIFICATION POLLING KHI COMPONENT MOUNT - Re-enabled
  useEffect(() => {
    startNotificationPolling();
    return () => stopNotificationPolling();
  }, [startNotificationPolling, stopNotificationPolling]);

  // ✅ Load messages function
  const loadMessages = useCallback(async (roomId) => {
    try {
      console.log('📨 Loading messages for room:', roomId);

      const token = getAuthToken();
      const msgRes = await axios.get(
        `${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/chat/rooms/${roomId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('📨 Messages API response:', msgRes.data);

      if (msgRes.data.success && Array.isArray(msgRes.data.messages)) {
        // Filter duplicates by ID
        const uniqueMessages = msgRes.data.messages.filter((msg, index, self) =>
          index === self.findIndex(m => m.id === msg.id)
        );

        const formattedMessages = uniqueMessages.map(msg => ({
          ...msg,
          content: msg.message || msg.content || '',
          sender_name: msg.sender_name || (msg.sender_type === 'staff' ? 'Admin' : 'Khách hàng')
        }));

        // Sort by time
        formattedMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        console.log('✅ Formatted messages:', formattedMessages.length);
        setMessages(formattedMessages);
      } else {
        console.error('❌ Invalid messages response:', msgRes.data);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Load messages error:', error.response?.data || error.message);
      message.error('Không thể tải tin nhắn');
      setMessages([]);
    }
  }, [getAuthToken]);


  // WebSocket logic for Admin
  const socketRef = useRef(null);

  const connectWebSocket = useCallback((roomId) => {
    if (socketRef.current) {
        socketRef.current.close();
    }

    const token = getAuthToken();
    const apiBase = process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com';
    const wsUrl = `${apiBase.replace(/^http/, 'ws')}/?token=${token}&room_id=${roomId}`;

    console.log('🔌 Admin connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.action === 'new_message') {
                const msg = data.message;
                const formattedMsg = {
                    ...msg,
                    content: msg.message || msg.content || '',
                    sender_name: msg.sender_name || (msg.sender_type === 'staff' ? 'Admin' : 'Khách hàng')
                };
                setMessages(prev => {
                    if (prev.some(m => m.id === formattedMsg.id)) return prev;
                    return [...prev, formattedMsg].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                });
                if (msg.sender_type === 'customer') {
                    // Play sound if needed
                }
            } else if (data.action === 'chat_history') {
                const formattedHistory = (data.messages || []).map(msg => ({
                    ...msg,
                    content: msg.message || msg.content || '',
                    sender_name: msg.sender_name || (msg.sender_type === 'staff' ? 'Admin' : 'Khách hàng')
                }));
                setMessages(formattedHistory.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
            }
        } catch (e) {
            console.error('❌ WS Parse error:', e);
        }
    };

    ws.onclose = () => {
        console.log('ℹ️ Admin WebSocket closed');
        if (chatVisible) {
            setTimeout(() => connectWebSocket(roomId), 5000);
        }
    };

    return ws;
  }, [chatVisible, getAuthToken]);

  useEffect(() => {
    if (chatVisible && currentRoom) {
      connectWebSocket(currentRoom.room_id);
    } else if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [chatVisible, currentRoom, connectWebSocket]);

  // THAY THẾ HÀM handleViewInvoice (khoảng dòng 350) BẰNG:

  const handleViewInvoice = async (id) => {
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // SỬA ĐƯỜNG DẪN ĐÚNG (Fix 404)
      const res = await axios.get(`${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/orders/${id}`, { headers });

      // ✅ XỬ LÝ LẤY DATA TỪ RESPONSE WRAPPER
      const orderData = res.data.data || res.data;

      // ✅ FORMAT ĐỊA CHỈ TRƯỚC KHI SET STATE
      const formattedAddress = await formatFullAddress(orderData);

      setSelectedInvoice({
        ...orderData,
        items: (orderData.items || []).map(item => ({
          ...item,
          unitPrice: item.price,
          productImage: item.productImage || 'https://via.placeholder.com/50'
        })),
        note: orderData.GhiChu || '',
        status: orderData.tinhtrang,
        // ✅ THÊM TRƯỜNG ĐỊA CHỈ ĐÃ FORMAT
        formattedAddress: formattedAddress
      });
      setIsModalVisible(true);
    } catch (error) {
      console.error('❌ View invoice error:', error);
      message.error('Lỗi khi tải chi tiết hóa đơn');
    }
  };

  // View review for an order (admin can view any order's review because server allows admin)
  const handleViewReview = async (orderId) => {
    try {
      setReviewLoading(true);
      const token = (document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null) || (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
      console.log('🔒 handleViewReview - token preview:', token ? (token.substring(0, 30) + '...') : '<no-token>');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      console.log('🔎 handleViewReview - headers:', headers);
      const res = await axios.get(`${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/orderreview/${orderId}`, { headers });
      console.log('🔎 handleViewReview - API response:', res && res.data ? res.data : res);
      if (res && res.data) {
        setReviewData(res.data.review || null);
        setReviewModalVisible(true);
      } else {
        message.info('Không có đánh giá cho đơn hàng này');
      }
    } catch (error) {
      console.error('❌ Fetch review error:', error.response?.data || error.message);
      message.error('Không thể tải đánh giá');
    } finally {
      setReviewLoading(false);
    }
  };

  // ✅ Start chat with customer - CẬP NHẬT ĐỂ ĐÁNH DẤU ĐÃ ĐỌC
  const handleChatWithCustomer = async (customerId) => {
    console.log('🚀 Starting chat with customer:', customerId);

    if (!customerId) {
      message.error('Mã khách hàng không hợp lệ');
      return;
    }

    // Reset chat state
    setMessages([]);
    setCurrentRoom(null);
    setCustomerInfo(null);
    setNewMessage('');

    setChatLoading(true);
    try {
      const token = getAuthToken();
      console.log('🔑 Admin Chat Token:', token ? (token.substring(0, 15) + '...') : 'NOT FOUND ❌');

      if (!token) {
        message.error('Không tìm thấy mã xác thực. Vui lòng đăng nhập lại.');
        return;
      }

      console.log('🔑 Token:', token.substring(0, 20) + '...');

      // 1. Get customer info - SỬA ĐƯỜNG DẪN ĐÚNG (Fix 404)
      console.log('👤 Fetching customer info...');
      try {
        const customerRes = await axios.get(
          `${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/client/khachhang/${customerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Customer info:', customerRes.data);
        setCustomerInfo(customerRes.data);
      } catch (error) {
        console.error('❌ Customer fetch error:', error.response?.data || error.message);
        setCustomerInfo({ tenkh: 'Khách hàng', makh: customerId });
      }

      // 2. Create or get chat room
      console.log('🏠 Creating/getting chat room...');
      const roomRes = await axios.post(
        (process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com') + '/api/chat/rooms',
        { customer_id: customerId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Room response:', roomRes.data);

      if (roomRes.data.success && roomRes.data.room) {
        setCurrentRoom(roomRes.data.room);

        // 3. Đánh dấu tin nhắn đã đọc
        await markRoomAsRead(roomRes.data.room.room_id);

        // 4. Load messages với delay
        await new Promise(resolve => setTimeout(resolve, 300));
        await loadMessages(roomRes.data.room.room_id, token);

        // 5. Open chat
        setChatVisible(true);
        console.log('✅ Chat opened successfully');
      } else {
        throw new Error('Invalid room response');
      }

    } catch (error) {
      console.error('❌ Chat initiation error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Lỗi kết nối chat';
      message.error(`Không thể mở chat: ${errorMsg}`);
    } finally {
      setChatLoading(false);
    }
  };

  // ✅ Send message
  const handleSendMessage = async () => {
    const messageText = newMessage.trim();
    if (!messageText) {
      message.warning('Vui lòng nhập tin nhắn');
      return;
    }

    if (!currentRoom) {
      message.error('Không tìm thấy phòng chat');
      return;
    }

    // Ưu tiên gửi qua WebSocket nếu đã kết nối
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const payload = {
            action: 'send_message',
            message: {
                room_id: currentRoom.room_id,
                message: messageText
            }
        };
        socketRef.current.send(JSON.stringify(payload));
        
        // Optimistic update - hiển thị message ngay cho Admin đỡ chờ
        const tempMessage = {
            id: `temp-${Date.now()}`,
            content: messageText,
            sender_type: 'staff',
            sender_name: 'Admin',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        return;
    }

    if (sendingMessage) return;
    setSendingMessage(true);

    try {
      const token = getAuthToken();
      
      await axios.post(
        (process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com') + '/api/chat/messages',
        { room_id: currentRoom.room_id, message: messageText },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setNewMessage('');
    } catch (error) {
      console.error('❌ Send message error:', error);
      message.error('Gửi tin nhắn thất bại');
    } finally {
      setSendingMessage(false);
    }
  };

  // ✅ Handle status change
  // Wrapper that optionally confirms revert actions and forwards an optional note
  const onStatusSelect = async (id, newStatus, prevStatus) => {
    try {
      const prevIndex = orderStatuses.findIndex(s => s.value === prevStatus);
      const newIndex = orderStatuses.findIndex(s => s.value === newStatus);

      // If moving backwards (reverting) ask for confirmation
      if (newIndex >= 0 && prevIndex >= 0 && newIndex < prevIndex) {
        return confirm({
          title: `Xác nhận hoàn tác trạng thái`,
          icon: <ExclamationCircleFilled />,
          content: `Bạn sắp chuyển trạng thái từ "${prevStatus}" về "${newStatus}". Hành động này có thể ảnh hưởng đến quy trình xử lý. Bạn có chắc muốn tiếp tục?`,
          okText: 'Xác nhận',
          cancelText: 'Hủy',
          async onOk() {
            // optional note could be collected here in future; for now send a force flag
            await handleStatusChange(id, newStatus, 'Chuyển trạng thái (hoàn tác) bởi quản trị viên', true);
          }
        });
      }

      // Normal forward change
      await handleStatusChange(id, newStatus);
    } catch (error) {
      console.error('❌ onStatusSelect error:', error);
      message.error('Không thể cập nhật trạng thái');
    }
  };

  const handleStatusChange = async (id, newStatus, ghichu = null, force = false) => {
    try {
      const token = (document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null);
      await axios.put(`${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/orders/hoadon/${id}/trangthai`, {
        trangthai: newStatus,
        ghichu: ghichu,
        force: force
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Cập nhật trạng thái thành công');
      fetchInvoices();
    } catch (error) {
      console.error('❌ Status change error:', error);
      const errMsg = error.response?.data?.error || 'Cập nhật trạng thái thất bại';
      message.error(errMsg);
    }
  };

  // ✅ Cancel invoice
  const handleCancelInvoice = (id) => {
    confirm({
      title: 'Bạn có chắc muốn hủy hóa đơn này?',
      icon: <ExclamationCircleFilled />,
      content: 'Hành động này sẽ không thể hoàn tác',
      okText: 'Hủy đơn',
      okType: 'danger',
      cancelText: 'Thoát',
      async onOk() {
        try {
          const token = (document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null);
          await axios.put(`${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/orders/customer-orders/cancel/${id}`, {
            lyDo: 'Hủy bởi quản trị viên'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          message.success('Hủy hóa đơn thành công');
          fetchInvoices();
        } catch (error) {
          console.error('❌ Cancel invoice error:', error);
          message.error('Hủy hóa đơn thất bại');
        }
      },
    });
  };

  // ✅ Close chat
  const handleCloseChat = () => {
    setChatVisible(false);
    setCurrentRoom(null);
    setMessages([]);
    setCustomerInfo(null);
    setNewMessage('');
  };



  // ✅ Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.id.toString().includes(searchTerm) ||
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerPhone.includes(searchTerm)
  );

  // ✨ NOTIFICATION MENU - THIẾT KẾ LẠI CỰC ĐẸP VỚI TAILWIND + TÌM KIẾM
  const notificationMenu = (
    <Menu className="notification-menu !p-0 !rounded-xl !overflow-hidden !border-none !shadow-2xl !w-[350px]">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white font-bold text-lg">Tin nhắn mới</span>
          <Badge count={unreadCount} overflowCount={99} className="!bg-white !text-blue-600 font-bold border-none" />
        </div>
        
        {/* Thanh tìm kiếm trong Menu */}
        <Input 
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Tìm tên khách hàng..."
          variant="borderless"
          className="!bg-white/20 !text-white placeholder:!text-white/60 !rounded-lg !py-1.5 focus:!bg-white/30 transition-all"
          onChange={(e) => {
            const val = e.target.value;
            setNotificationSearchTerm(val);
            if (val.length > 0) fetchAllRooms(); // Tự động lấy tất cả khi bắt đầu tìm
          }}
          value={notificationSearchTerm}
          onClick={(e) => e.stopPropagation()} 
        />
      </div>
      
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-white">
        {(() => {
          // Logic tìm kiếm: Ưu tiên chưa đọc, nếu có search term thì tìm cả list 'allRooms'
          const displayRooms = notificationSearchTerm 
            ? allRooms.filter(room => room.customer_name?.toLowerCase().includes(notificationSearchTerm.toLowerCase()))
            : unreadRooms;

          if (displayRooms.length === 0) {
            return (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                  <MessageOutlined className="text-3xl text-gray-300" />
                </div>
                <p className="text-gray-400">{notificationSearchTerm ? (isSearchingAll ? 'Đang tìm...' : 'Không tìm thấy kết quả') : 'Không có tin nhắn mới'}</p>
              </div>
            );
          }

          return displayRooms.map((room, index) => (
            <Menu.Item
              key={room.room_id}
              onClick={() => {
                handleChatWithCustomer(room.customer_id);
                setNotificationVisible(false);
                setNotificationSearchTerm(''); 
              }}
              className="!p-0 !m-0 hover:!bg-blue-50 transition-colors border-b border-gray-50 last:border-none"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="relative">
                  <Avatar 
                    size={48} 
                    className={`!flex !items-center !justify-center font-bold text-lg shadow-sm ${
                      room.unread_count > 0 ? 'border-2 border-blue-500' : ''
                    } ${
                      ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-green-500'][index % 5]
                    }`}
                  >
                    {room.customer_name?.charAt(0).toUpperCase() || 'K'}
                  </Avatar>
                  {room.unread_count > 0 && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-bold text-gray-800 m-0 truncate text-sm leading-tight ${room.unread_count > 0 ? 'text-blue-600' : ''}`}>
                      {room.customer_name}
                    </h4>
                    <span className="text-[11px] text-gray-400 font-medium ml-2 shrink-0">
                      {room.last_message_time ? formatTime(room.last_message_time) : ''}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className={`text-gray-500 text-xs m-0 truncate pr-4 ${room.unread_count > 0 ? 'font-bold text-gray-700' : 'italic'}`}>
                      {room.last_message || 'Chưa có tin nhắn...'}
                    </p>
                    {room.unread_count > 0 && (
                      <div className="bg-blue-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">
                        {room.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Menu.Item>
          ));
        })()}
      </div>
      
      {unreadRooms.length > 0 && (
        <div className="p-2 bg-gray-50 text-center border-t border-gray-100">
          <button 
            className="text-blue-600 hover:text-blue-700 text-xs font-semibold py-1 transition-all"
            onClick={() => {/* Load all chats logic */}}
          >
            Xem tất cả tin nhắn
          </button>
        </div>
      )}
    </Menu>
  );

  // ✅ Table columns
  const columns = [
    {
      title: 'Mã HĐ',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div className="flex flex-col">
          <div className="font-bold text-slate-700">{record.customerName}</div>
          <div className="text-slate-400 text-xs">{record.customerPhone}</div>
        </div>
      ),
      width: 180,
    },
    {
      title: 'Ngày lập',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <span className="text-slate-500 font-medium">{formatDate(date)}</span>,
      width: 150,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => (
        <div className="font-black text-slate-800 text-right">
          {formatCurrency(amount)}
        </div>
      ),
      width: 150,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          className="w-full modern-select"
          onChange={(value) => onStatusSelect(record.id, value, record.status)}
          size="small"
        >
          {orderStatuses.map((item) => (
            <Select.Option key={item.value} value={item.value}>
              <Tag color={item.color} className="rounded-full px-3 font-bold border-0">{item.value}</Tag>
            </Select.Option>
          ))}
        </Select>
      ),
      width: 160,
    },
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewInvoice(record.id)}
              className="rounded-lg"
            />
          </Tooltip>
          <Tooltip title="Xem đánh giá">
            <Button
              size="small"
              icon={<StarOutlined />}
              onClick={() => handleViewReview(record.id)}
              loading={reviewLoading}
              className="rounded-lg"
            />
          </Tooltip>
          <Tooltip title="Chat với khách hàng">
            <Button
              size="small"
              type="primary"
              icon={<MessageOutlined />}
              onClick={() => handleChatWithCustomer(record.makh)}
              loading={chatLoading}
              className="rounded-lg shadow-sm"
            />
          </Tooltip>
          {record.status !== 'Đã hủy' && (
            <Tooltip title="Hủy đơn hàng">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleCancelInvoice(record.id)}
                className="rounded-lg"
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 180,
    },
  ];

  // Auto load invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);



  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="material-icons text-indigo-500">receipt_long</span>
            Quản lý Hóa đơn
          </h1>
          <p className="text-slate-400 text-sm mt-1">Theo dõi đơn hàng và tương tác khách hàng</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={fetchInvoices} 
            loading={loading}
            icon={<span className="material-icons text-sm">refresh</span>}
            className="h-11 px-6 rounded-xl flex items-center gap-2 font-bold border-slate-200"
          >
            Tải lại
          </Button>
          
          <Dropdown
            overlay={notificationMenu}
            trigger={['click']}
            open={notificationVisible}
            onVisibleChange={setNotificationVisible}
            placement="bottomRight"
          >
            <Badge count={unreadCount} size="small">
              <button className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                <span className="material-icons">notifications</span>
              </button>
            </Badge>
          </Dropdown>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 transition-all duration-300">
        <div className="max-w-md mb-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Tìm kiếm hóa đơn</label>
          <Search
            placeholder="Tìm theo mã HĐ, tên KH hoặc SĐT..."
            onSearch={(v) => setSearchTerm(v)}
            allowClear
            size="large"
            className="modern-search"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <Table
            columns={columns}
            dataSource={filteredInvoices}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000 }}
            pagination={{ 
              pageSize: 10,
              className: 'px-6 py-4'
            }}
            className="modern-table"
          />
        </div>
      </div>

      {/* Modal chi tiết hóa đơn */}
      <Modal
        title={
          <div className="flex items-center gap-3 text-xl font-black text-slate-800">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <span className="material-icons leading-none">description</span>
            </div>
            Chi tiết hóa đơn #{selectedInvoice?.id || ''}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)} className="h-11 px-8 rounded-xl font-bold">
            Đóng
          </Button>,
        ]}
        width={800}
        centered
        className="modern-modal"
      >
        {selectedInvoice && (
          <div className="py-4 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-icons text-sm">person</span>
                  Thông tin khách hàng
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Tên khách hàng</p>
                    <p className="font-bold text-slate-800">{selectedInvoice.customerName}</p>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Số điện thoại</p>
                      <p className="font-bold text-slate-800">{selectedInvoice.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Email</p>
                      <p className="font-bold text-slate-800">{selectedInvoice.customerEmail || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Địa chỉ giao hàng</p>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                      {selectedInvoice.formattedAddress || 'Đang tải địa chỉ...'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-icons text-sm">info</span>
                  Thông tin đơn hàng
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">Ngày tạo</p>
                    <p className="font-bold text-slate-800">{formatDate(selectedInvoice.NgayTao)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">Tổng tiền</p>
                    <p className="text-lg font-black text-indigo-600">
                      {selectedInvoice?.TongTien !== undefined ? formatCurrency(selectedInvoice.TongTien) : 'N/A'}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">Trạng thái</p>
                    <Tag className="rounded-full px-4 border-none font-bold" color={orderStatuses.find(s => s.value === selectedInvoice.status)?.color || 'default'}>
                      {selectedInvoice.status}
                    </Tag>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Ghi chú</p>
                    <p className="text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 min-h-[60px]">
                      {selectedInvoice.note || 'Không có ghi chú'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Danh sách sản phẩm</h3>
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <Table
                  columns={[
                    {
                      title: 'Sản phẩm',
                      dataIndex: 'productName',
                      key: 'productName',
                      render: (text, record) => (
                        <div className="flex items-center gap-4">
                          <img
                            src={`/img/products/${record.productImage}`}
                            alt={text}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/50'; }}
                          />
                          <span className="font-bold text-slate-700">{text}</span>
                        </div>
                      ),
                    },
                    {
                      title: 'Đơn giá',
                      dataIndex: 'unitPrice',
                      key: 'unitPrice',
                      render: (price) => formatCurrency(price),
                      align: 'right',
                    },
                    {
                      title: 'Số lượng',
                      dataIndex: 'quantity',
                      key: 'quantity',
                      align: 'center',
                    },
                    {
                      title: 'Thành tiền',
                      key: 'total',
                      render: (_, record) => (
                        <span className="font-bold text-slate-900">{formatCurrency(record.unitPrice * record.quantity)}</span>
                      ),
                      align: 'right',
                    },
                  ]}
                  dataSource={selectedInvoice.items || []}
                  rowKey="productId"
                  pagination={false}
                  size="small"
                  className="modern-table"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Xem đánh giá */}
      <Modal
        title={null}
        open={reviewModalVisible}
        onCancel={() => { setReviewModalVisible(false); setReviewData(null); }}
        footer={[
          <Button key="close-review" onClick={() => { setReviewModalVisible(false); setReviewData(null); }} className="h-11 px-8 rounded-xl font-bold">
            Đóng
          </Button>
        ]}
        width={550}
        centered
        className="modern-modal"
      >
        {reviewLoading ? (
          <div className="py-10 text-center">
            <span className="material-icons animate-spin text-indigo-500 text-3xl">refresh</span>
            <p className="mt-2 text-slate-400 font-medium">Đang tải đánh giá...</p>
          </div>
        ) : reviewData ? (
          <div className="py-4">
            <div className="flex items-center gap-4 mb-6">
              <Avatar size={64} className="bg-indigo-600 text-xl font-black">
                {reviewData.customerName ? reviewData.customerName[0].toUpperCase() : 'C'}
              </Avatar>
              <div>
                <h4 className="text-xl font-black text-slate-800">{reviewData.customerName || 'Khách hàng'}</h4>
                <p className="text-sm text-slate-400">{reviewData.NgayDanhGia ? new Date(reviewData.NgayDanhGia).toLocaleString('vi-VN') : ''}</p>
              </div>
              <div className="ml-auto">
                <Rate allowHalf value={Number(reviewData.SoSao || 0)} disabled className="text-amber-400" />
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nhận xét của khách hàng</p>
              <p className="text-slate-700 leading-relaxed italic">
                "{reviewData.NhanXet || reviewData.comment || 'Khách hàng không để lại nhận xét.'}"
              </p>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400">Không có dữ liệu đánh giá.</div>
        )}
      </Modal>

      {/* Chat Modal */}
      <Modal
        title={null}
        open={chatVisible}
        onCancel={handleCloseChat}
        footer={null}
        width={700}
        centered
        className="chat-modal-tailwind"
        maskClosable={false}
      >
        <div className="flex flex-col h-[700px] bg-white rounded-[2rem] overflow-hidden">
          {/* Chat Header */}
          <div className="bg-indigo-600 p-6 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar size={48} className="bg-white/20 border border-white/30" icon={<span className="material-icons">person</span>} />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-indigo-600 rounded-full animate-pulse"></span>
              </div>
              <div>
                <h4 className="font-black text-lg m-0">{customerInfo?.tenkh || 'Khách hàng'}</h4>
                <p className="text-xs text-indigo-100 m-0 opacity-80">Đang trực tuyến</p>
              </div>
            </div>
            <button onClick={handleCloseChat} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4" ref={messagesContainerRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <span className="material-icons text-6xl mb-4">forum</span>
                <p className="font-bold">Chưa có tin nhắn</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'staff' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                      msg.sender_type === 'staff' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                    }`}>
                      <p className="m-0 leading-relaxed text-[15px]">{msg.content}</p>
                      <p className={`text-[10px] mt-2 mb-0 opacity-60 ${msg.sender_type === 'staff' ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-100">
            <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:bg-white transition-all">
              <TextArea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey && !sendingMessage) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="bg-transparent border-none shadow-none focus:ring-0 text-slate-700 placeholder:text-slate-400 p-2"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md ${
                  newMessage.trim() && !sendingMessage 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className="material-icons">send</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        .modern-table .ant-table-thead > tr > th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f1f5f9;
        }
        .modern-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
          padding: 16px;
        }
        .modern-table .ant-table-tbody > tr:hover > td {
          background: #f1f5f9 !important;
        }
        .modern-modal .ant-modal-content {
          border-radius: 2rem !important;
          padding: 1.5rem !important;
        }

        .review-date {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
        }

        .review-rating {
          margin-left: 12px;
          display: flex;
          align-items: center;
        }

        .review-comment-box {
          margin-top: 8px;
          padding: 14px;
          border-radius: 8px;
          background: #fafafa;
          border: 1px solid rgba(0,0,0,0.04);
        }

        .comment-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
        }

        .comment-content {
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

export default InvoiceManagement;