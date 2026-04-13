import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Modal, Button, Select, message, Table, Tag, Space, Input, Avatar, Badge, Dropdown, Menu, Rate, Divider } from 'antd';
import { ExclamationCircleFilled, EyeOutlined, DeleteOutlined, MessageOutlined, SendOutlined, UserOutlined, CustomerServiceOutlined, CloseOutlined, BellOutlined, StarOutlined } from '@ant-design/icons';

const { confirm } = Modal;
const { Search, TextArea } = Input;
// THÊM VÀO SAU DÒNG const { confirm } = Modal; (sau dòng 6)

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
  const [displayedMessageIds, setDisplayedMessageIds] = useState(new Set());
  const [sendingMessage, setSendingMessage] = useState(false);
  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // ✨ THÊM CÁC STATE CHO THÔNG BÁO
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadRooms, setUnreadRooms] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationPolling, setNotificationPolling] = useState(null);

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

  // ✅ Fetch invoices from API
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
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
  };

  // ✨ THÊM CÁC FUNCTION CHO THÔNG BÁO
  const loadUnreadNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
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
  }, [unreadCount]);

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
      const token = localStorage.getItem('authToken');
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
  const loadMessages = useCallback(async (roomId, token) => {
    try {
      console.log('📨 Loading messages for room:', roomId);

      const msgRes = await axios.get(
        `${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/chat/rooms/${roomId}/messages`,
        { headers: { Authorization: `Bearer ${token || localStorage.getItem('authToken')}` } }
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

        // Update displayed IDs
        const messageIds = new Set(formattedMessages.map(m => m.id));
        setDisplayedMessageIds(messageIds);
      } else {
        console.error('❌ Invalid messages response:', msgRes.data);
        setMessages([]);
        setDisplayedMessageIds(new Set());
      }
    } catch (error) {
      console.error('❌ Load messages error:', error.response?.data || error.message);
      message.error('Không thể tải tin nhắn');
      setMessages([]);
      setDisplayedMessageIds(new Set());
    }
  }, []);

  // ✅ Refresh messages function
  const refreshMessages = useCallback(async () => {
    if (!currentRoom) return;

    try {
      const token = localStorage.getItem('authToken');

      const msgRes = await axios.get(
        `${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/chat/rooms/${currentRoom.room_id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (msgRes.data.success && Array.isArray(msgRes.data.messages)) {
        // Tìm messages mới
        const newMessages = msgRes.data.messages.filter(msg =>
          !displayedMessageIds.has(msg.id)
        );

        if (newMessages.length > 0) {
          console.log('🆕 New messages found:', newMessages.length);

          const formattedNewMessages = newMessages.map(msg => ({
            ...msg,
            content: msg.message || msg.content || '',
            sender_name: msg.sender_name || (msg.sender_type === 'staff' ? 'Admin' : 'Khách hàng')
          }));

          // Append new messages
          setMessages(prevMessages => {
            const allMessages = [...prevMessages, ...formattedNewMessages];
            // Remove duplicates và sort
            const uniqueMessages = allMessages.filter((msg, index, self) =>
              index === self.findIndex(m => m.id === msg.id)
            );
            return uniqueMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          });

          // Update displayed IDs
          setDisplayedMessageIds(prev => {
            const newSet = new Set(prev);
            formattedNewMessages.forEach(msg => newSet.add(msg.id));
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('❌ Refresh messages error:', error);
    }
  }, [currentRoom, displayedMessageIds]);

  // ✅ Auto refresh messages
  useEffect(() => {
    let interval;
    if (chatVisible && currentRoom) {
      interval = setInterval(refreshMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [chatVisible, currentRoom, refreshMessages]);

  // THAY THẾ HÀM handleViewInvoice (khoảng dòng 350) BẰNG:

  const handleViewInvoice = async (id) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/orders/hoadon/${id}`);

      // ✅ FORMAT ĐỊA CHỈ TRƯỚC KHI SET STATE
      const formattedAddress = await formatFullAddress(res.data);

      setSelectedInvoice({
        ...res.data,
        items: res.data.items.map(item => ({
          ...item,
          unitPrice: item.price,
          productImage: item.productImage || 'https://via.placeholder.com/50'
        })),
        note: res.data.GhiChu || '',
        status: res.data.tinhtrang,
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
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
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
    setDisplayedMessageIds(new Set());
    setCurrentRoom(null);
    setCustomerInfo(null);
    setNewMessage('');

    setChatLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      console.log('🔑 Token:', token.substring(0, 20) + '...');

      // 1. Get customer info
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

    if (sendingMessage) return; // Prevent double send

    setSendingMessage(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        message.error('Phiên đăng nhập hết hạn');
        return;
      }

      console.log('📤 Sending message:', messageText);

      // Optimistic update - hiển thị message ngay
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content: messageText,
        sender_type: 'staff',
        sender_name: 'Admin',
        created_at: new Date().toISOString(),
        isTemporary: true
      };

      setMessages(prev => [...prev, tempMessage]);
      setDisplayedMessageIds(prev => new Set([...prev, tempMessage.id]));

      // Clear input
      setNewMessage('');

      const response = await axios.post(
        (process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com') + '/api/chat/messages',
        {
          room_id: currentRoom.room_id,
          message: messageText
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Message sent:', response.data);

      // Remove temporary message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setDisplayedMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempMessage.id);
        return newSet;
      });

      // Reload messages sau 500ms
      setTimeout(() => {
        loadMessages(currentRoom.room_id, token);
      }, 500);

    } catch (error) {
      console.error('❌ Send message error:', error.response?.data || error.message);

      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => !msg.isTemporary));
      setDisplayedMessageIds(prev => {
        const newSet = new Set([...prev].filter(id => !id.toString().startsWith('temp-')));
        return newSet;
      });

      const errorMsg = error.response?.data?.error || error.message || 'Gửi tin nhắn thất bại';
      message.error(errorMsg);
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
      const token = localStorage.getItem('authToken');
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
          const token = localStorage.getItem('authToken');
          await axios.put(`${process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com'}/api/orders/hoadon/${id}/huy`, {
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
    setDisplayedMessageIds(new Set());
    setCustomerInfo(null);
    setNewMessage('');
  };

  // ✅ Render unique messages
  const renderMessages = () => {
    const uniqueMessages = messages.filter((msg, index, self) =>
      index === self.findIndex(m => m.id === msg.id)
    );

    return uniqueMessages.map((msg) => (
      <div
        key={`${msg.id}-${msg.created_at}`}
        className={`message-wrapper ${msg.sender_type === 'staff' ? 'staff-message' : 'customer-message'}`}
      >
        <div className={`message-bubble ${msg.sender_type === 'staff' ? 'staff' : 'customer'} ${msg.isTemporary ? 'temporary' : ''}`}>
          <div className="message-content">{msg.content}</div>
          <div className="message-time">
            {formatTime(msg.created_at)}
            {msg.isTemporary && <span className="sending-indicator"> ⏳</span>}
          </div>
        </div>
      </div>
    ));
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

  // ✨ NOTIFICATION MENU
  const notificationMenu = (
    <Menu className="notification-menu">
      <Menu.Item key="header" disabled className="notification-header">
        <div style={{ padding: '8px 0', fontWeight: 600, color: '#1890ff' }}>
          Tin nhắn mới ({unreadCount})
        </div>
      </Menu.Item>
      <Menu.Divider />
      {unreadRooms.length === 0 ? (
        <Menu.Item key="empty" disabled>
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#999' }}>
            Không có tin nhắn mới
          </div>
        </Menu.Item>
      ) : (
        unreadRooms.map((room) => (
          <Menu.Item
            key={room.room_id}
            onClick={() => {
              handleChatWithCustomer(room.customer_id);
              setNotificationVisible(false);
            }}
            className="notification-item"
          >
            <div className="notification-content">
              <div className="notification-customer">
                <Avatar size={32} icon={<UserOutlined />} />
                <div className="notification-info">
                  <div className="customer-name">{room.customer_name}</div>
                  <div className="last-message">{room.last_message?.substring(0, 50)}...</div>
                </div>
              </div>
              <div className="notification-meta">
                <Badge count={room.unread_count} size="small" />
                <div className="notification-time">
                  {formatTime(room.last_message_time)}
                </div>
              </div>
            </div>
          </Menu.Item>
        ))
      )}
      {unreadRooms.length > 0 && (
        <>
          <Menu.Divider />
          <Menu.Item key="mark-all" onClick={() => {
            unreadRooms.forEach(room => markRoomAsRead(room.room_id));
            setNotificationVisible(false);
          }}>
            <div style={{ textAlign: 'center', color: '#1890ff', fontWeight: 500 }}>
              Đánh dấu tất cả đã đọc
            </div>
          </Menu.Item>
        </>
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
        <div className="customer-cell">
          <div className="font-medium truncate">{record.customerName}</div>
          <div className="text-gray-500 text-xs">{record.customerPhone}</div>
        </div>
      ),
      width: 180,
    },
    {
      title: 'Ngày lập',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
      width: 150,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => (
        <div className="text-right">
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
          style={{ width: 140 }}
          onChange={(value) => onStatusSelect(record.id, value, record.status)}
          dropdownMatchSelectWidth={false}
          size="small"
        >
          {orderStatuses.map((item) => (
            <Select.Option key={item.value} value={item.value}>
              <Tag color={item.color} style={{ fontSize: '12px' }}>{item.value}</Tag>
            </Select.Option>
          ))}
        </Select>
      ),
      width: 160,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewInvoice(record.id)}
            title="Xem chi tiết"
          />
          <Button
            size="small"
            icon={<StarOutlined />}
            onClick={() => handleViewReview(record.id)}
            loading={reviewLoading}
            title="Xem đánh giá"
          />
          <Button
            size="small"
            type="primary"
            icon={<MessageOutlined />}
            onClick={() => {
              console.log('🎯 Chat button clicked for customer:', record.makh);
              handleChatWithCustomer(record.makh);
            }}
            loading={chatLoading}
            title="Chat với khách hàng"
          />
          {record.status !== 'Đã hủy' && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCancelInvoice(record.id)}
              title="Hủy đơn hàng"
            />
          )}
        </Space>
      ),
      width: 200,
    },
  ];

  // Auto load invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  return (
    <div className="thongke-page">
      <div className="thongke-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>
          <i className="fas fa-file-invoice-dollar"></i> Quản lý Hóa đơn
        </h1>
      </div>

      <div className="thongke-content">
        <div className="thongke-filters">
          <div className="filter-group" style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flex: 1, maxWidth: '400px' }}>
              <label style={{ margin: 0, whiteSpace: 'nowrap', fontWeight: 500, color: '#666' }}>Tìm kiếm:</label>
              <Search
                placeholder="Tìm kiếm theo mã HĐ, tên KH hoặc SĐT"
                onSearch={handleSearch}
                style={{ flex: 1 }}
                allowClear
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginLeft: 'auto' }}>
              <Button onClick={fetchInvoices} loading={loading}>
                Tải lại
              </Button>
              {/* ✨ NOTIFICATION BELL */}
              <Dropdown
                overlay={notificationMenu}
                trigger={['click']}
                open={notificationVisible}
                onVisibleChange={setNotificationVisible}
                placement="bottomRight"
                overlayClassName="notification-dropdown"
              >
                <Button
                  type="text"
                  className="notification-bell"
                  icon={
                    <Badge count={unreadCount} size="small" offset={[0, 0]}>
                      <BellOutlined style={{ fontSize: '18px' }} />
                    </Badge>
                  }
                />
              </Dropdown>
            </div>
          </div>
        </div>

        <div className="thongke-table">
          <Table
            columns={columns}
            dataSource={filteredInvoices}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 10 }}
            className="compact-invoice-table"
          />
        </div>
      </div>

      {/* Modal chi tiết hóa đơn */}
      <Modal
        title={`Chi tiết hóa đơn #${selectedInvoice?.id || ''}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
        styles={{ body: { padding: '16px' } }}
      >
        {selectedInvoice && (
          <div className="invoice-detail-content">
            <div className="info-section">
              <h3 className="section-title">Thông tin khách hàng</h3>
              <div className="info-grid">
                <div className="info-item">
                  <p className="info-label">Tên khách hàng:</p>
                  <p className="info-value">{selectedInvoice.customerName}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">Số điện thoại:</p>
                  <p className="info-value">{selectedInvoice.customerPhone}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">Email:</p>
                  <p className="info-value">{selectedInvoice.customerEmail || 'Không có'}</p>
                </div>
                <div className="info-item">
                  <p className="info-label">Người nhận:</p>
                  <p className="info-value">{selectedInvoice.recipientName} - {selectedInvoice.recipientPhone}</p>
                </div>
                <div className="info-item full-width">
                  <p className="info-label">Địa chỉ giao hàng:</p>
                  <p className="info-value">
                    {selectedInvoice.formattedAddress || 'Đang tải địa chỉ...'}
                  </p>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3 className="section-title">Thông tin hóa đơn</h3>
              <div className="info-grid">
                <div>
                  <p className="text-gray-600 text-sm">Ngày tạo:</p>
                  <p className="font-medium">{formatDate(selectedInvoice.NgayTao)}</p>
                </div>
                <div className="info-item">
                  <p className="text-gray-600 text-sm">Tổng tiền:</p>
                  <p className="font-medium">
                    {selectedInvoice?.TongTien !== undefined
                      ? formatCurrency(selectedInvoice.TongTien)
                      : 'Chưa có dữ liệu'}
                  </p>
                </div>
                <div className="info-item">
                  <p className="info-label">Phương thức TT:</p>
                  <p className="info-value">COD</p>
                </div>
                <div className="info-item">
                  <p className="info-label">Trạng thái:</p>
                  <Tag color={orderStatuses.find(s => s.value === selectedInvoice.status)?.color || 'default'}>
                    {selectedInvoice.status}
                  </Tag>
                </div>
                <div className="info-item full-width">
                  <p className="info-label">Ghi chú:</p>
                  <p className="info-value">{selectedInvoice.note || 'Không có ghi chú'}</p>
                </div>
              </div>
            </div>

            <div className="products-section">
              <h3 className="section-title">Danh sách sản phẩm</h3>
              <Table
                columns={[
                  {
                    title: 'Sản phẩm',
                    dataIndex: 'productName',
                    key: 'productName',
                    render: (text, record) => (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img
                          src={`/img/products/${record.productImage}`}
                          alt={text}
                          style={{
                            width: 32,
                            height: 32,
                            objectFit: 'cover',
                            marginRight: 8,
                            borderRadius: 2
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/50';
                          }}
                        />
                        <span>{text}</span>
                      </div>
                    ),
                    width: 200,
                  },
                  {
                    title: 'Đơn giá',
                    dataIndex: 'unitPrice',
                    key: 'unitPrice',
                    render: (price) => formatCurrency(price),
                    align: 'right',
                    width: 120,
                  },
                  {
                    title: 'Số lượng',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    align: 'center',
                    width: 80,
                  },
                  {
                    title: 'Thành tiền',
                    key: 'total',
                    render: (_, record) => formatCurrency(record.unitPrice * record.quantity),
                    align: 'right',
                    width: 120,
                  },
                ]}
                dataSource={selectedInvoice.items || []}
                rowKey="productId"
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 400 }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xem đánh giá (giao diện mới đẹp hơn) */}
      <Modal
        title={null}
        open={reviewModalVisible}
        onCancel={() => { setReviewModalVisible(false); setReviewData(null); }}
        footer={[
          <Button key="close-review" onClick={() => { setReviewModalVisible(false); setReviewData(null); }}>
            Đóng
          </Button>
        ]}
        width={640}
        bodyStyle={{ padding: 0 }}
      >
        {reviewLoading ? (
          <div style={{ padding: 24 }}>Đang tải...</div>
        ) : reviewData ? (
          <div className="review-modal-root">
            <div className="review-modal-header">
              <div className="review-title">Đánh giá đơn hàng #{selectedInvoice?.id || ''}</div>
            </div>

            <div className="review-modal-body">
              <div className="review-top">
                <Avatar size={56} style={{ backgroundColor: '#7265e6', marginRight: 12 }} icon={<UserOutlined />}>
                  {reviewData.customerName ? reviewData.customerName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : ''}
                </Avatar>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="review-customer-name">{reviewData.customerName || `Khách hàng ${reviewData.MaKH || ''}`}</div>
                      <div className="review-date">{reviewData.NgayDanhGia ? new Date(reviewData.NgayDanhGia).toLocaleString('vi-VN') : ''}</div>
                    </div>
                    <div className="review-rating">
                      <Rate allowHalf value={Number(reviewData.SoSao || reviewData.rating || reviewData.so_diem || 0)} disabled />
                    </div>
                  </div>
                </div>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div className="review-comment-box">
                <div className="comment-label">Nhận xét</div>
                <div className="comment-content">{reviewData.NhanXet || reviewData.comment || reviewData.noi_dung || <i>Chưa có nhận xét</i>}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 24 }}>Không có đánh giá cho đơn hàng này.</div>
        )}
      </Modal>

      {/* ✨ CHAT MODAL HOÀN TOÀN MỚI */}
      <Modal
        title={null}
        open={chatVisible}
        onCancel={handleCloseChat}
        footer={null}
        width={650}
        styles={{ body: { padding: 0, height: '650px' } }}
        className="modern-chat-modal"
        maskClosable={false}
        destroyOnHidden={true}
      >
        <div className="chat-container">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <Avatar
                size={44}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <div className="chat-customer-info">
                <h4>{customerInfo?.tenkh || 'Khách hàng'}</h4>
                <span className="customer-status">
                  <span className="online-dot"></span>
                  Đang hoạt động
                </span>
              </div>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={handleCloseChat}
              className="chat-close-btn"
            />
          </div>

          {/* Messages Area với Custom Scrollbar */}
          <div
            className="messages-container"
            ref={messagesContainerRef}
          >
            {messages.length === 0 ? (
              <div className="empty-chat">
                <CustomerServiceOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: '16px' }} />
                <h3 style={{ color: '#8c8c8c', marginBottom: '8px' }}>Chưa có tin nhắn nào</h3>
                <p style={{ color: '#bfbfbf', fontSize: '14px', margin: 0 }}>
                  Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện
                </p>
              </div>
            ) : (
              <>
                {renderMessages()}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="chat-input-container">
            <div className="chat-input-wrapper">
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
                disabled={sendingMessage}
                className="chat-input"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                loading={sendingMessage}
                className="send-button"
              >
                {sendingMessage ? 'Đang gửi...' : 'Gửi'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        .invoice-management-container {
     
          min-height: 100vh;
        }
        
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        /* ✨ THÊM STYLES CHO HEADER ACTIONS VÀ NOTIFICATION */
        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .notification-bell {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .notification-bell:hover {
          background: #f0f2ff !important;
          transform: scale(1.05);
        }
        
        .notification-bell .ant-badge {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .notification-dropdown {
          margin-top: 8px;
        }
        
        .notification-dropdown .ant-dropdown-menu {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          max-width: 400px;
          min-width: 320px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .notification-header {
          background: #f0f2ff;
          margin: 0;
          border-radius: 8px 8px 0 0;
        }
        
        .notification-item {
          padding: 0;
          height: auto;
          line-height: normal;
        }
        
        .notification-item:hover {
          background: #f8f9fa;
        }
        
        .notification-content {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        
        .notification-customer {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        
        .notification-info {
          flex: 1;
          min-width: 0;
        }
        
        .customer-name {
          font-weight: 600;
          font-size: 14px;
          color: #262626;
          margin-bottom: 4px;
        }
        
        .last-message {
          font-size: 12px;
          color: #8c8c8c;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .notification-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }
        
        .notification-time {
          font-size: 11px;
          color: #bfbfbf;
        }
        
        /* Animation cho notification bell */
        @keyframes ring {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(5deg); }
          60% { transform: rotate(-5deg); }
          70% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        
        .notification-bell.has-unread {
          animation: ring 2s ease-in-out infinite;
        }
        
        /* Pulse effect cho badge */
        .ant-badge-count {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 77, 79, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
          }
        }
        
        .page-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        
        .search-box {
          width: 250px;
        }
        
        .customer-cell {
          min-width: 120px;
        }
        
        .info-section {
          background: #f8f8f8;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }
        
        .section-title {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 12px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        
        .info-item {
          margin-bottom: 4px;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
        
        .info-label {
          color: #666;
          font-size: 12px;
          margin: 0;
        }
        
        .info-value {
          font-weight: 500;
          margin: 4px 0 0 0;
          font-size: 13px;
        }
        
        .compact-invoice-table :global(.ant-table-thead > tr > th) {
          padding: 8px 12px;
        }
        
        .compact-invoice-table :global(.ant-table-tbody > tr > td) {
          padding: 8px 12px;
        }

        /* ✨ MODERN CHAT STYLES */
        .chat-container {
          height: 650px;
          display: flex;
          flex-direction: column;
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .chat-customer-info h4 {
          margin: 0 0 4px 0;
          font-size: 17px;
          font-weight: 600;
          color: white;
        }

        .customer-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          opacity: 0.9;
          color: rgba(255, 255, 255, 0.9);
        }

        .online-dot {
          width: 10px;
          height: 10px;
          background: #52c41a;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(82, 196, 26, 0); }
          100% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); }
        }

        .chat-close-btn {
          color: white !important;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .chat-close-btn:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          transform: scale(1.05);
          transition: all 0.2s ease;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: linear-gradient(180deg, #f0f2ff 0%, #f8f9fa 100%);
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
        }

        /* Custom Scrollbar */
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
          margin: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #1890ff, #40a9ff);
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #0050b3, #1890ff);
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
        }

        /* Firefox scrollbar */
        .messages-container {
          scrollbar-width: thin;
          scrollbar-color: #1890ff rgba(0, 0, 0, 0.05);
        }

        .empty-chat {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 16px;
          padding: 40px 20px;
          border: 2px dashed #d9d9d9;
        }

        .message-wrapper {
          display: flex;
          margin-bottom: 16px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .staff-message {
          justify-content: flex-end;
        }

        .customer-message {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 75%;
          min-width: 80px;
          padding: 14px 18px;
          border-radius: 20px;
          position: relative;
          word-wrap: break-word;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }

        .message-bubble:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .message-bubble.staff {
          background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
          color: white;
          border-bottom-right-radius: 8px;
          position: relative;
        }

        .message-bubble.staff::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 20px;
          border-bottom-right-radius: 8px;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          pointer-events: none;
        }

        .message-bubble.customer {
          background: rgba(255, 255, 255, 0.95);
          color: #333;
          border: 1px solid rgba(217, 217, 217, 0.3);
          border-bottom-left-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .message-bubble.temporary {
          opacity: 0.8;
          background: linear-gradient(135deg, #40a9ff 0%, #69c0ff 100%);
        }

        .message-content {
          font-size: 15px;
          line-height: 1.5;
          margin-bottom: 8px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .message-time {
          font-size: 11px;
          opacity: 0.8;
          text-align: right;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }

        .message-bubble.staff .message-time {
          color: rgba(255, 255, 255, 0.9);
        }

        .message-bubble.customer .message-time {
          color: #999;
        }

        .sending-indicator {
          font-size: 10px;
          opacity: 0.9;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 0.9; }
          51%, 100% { opacity: 0.4; }
        }

        .chat-input-container {
          padding: 20px 24px;
          background: white;
          border-top: 1px solid #f0f0f0;
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
        }

        .chat-input-wrapper {
          display: flex;
          gap: 16px;
          align-items: flex-end;
        }

        .chat-input {
          flex: 1;
          border-radius: 24px !important;
          padding: 12px 20px !important;
          font-size: 15px;
          border: 2px solid #f0f0f0 !important;
          background: #fafafa;
          transition: all 0.3s ease;
        }

        .chat-input:focus {
          border-color: #1890ff !important;
          box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1) !important;
          background: white;
        }

        .chat-input:disabled {
          background: #f5f5f5;
          opacity: 0.7;
        }

        .send-button {
          border-radius: 24px !important;
          height: auto !important;
          min-height: 44px;
          padding: 0 24px !important;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          background: linear-gradient(135deg, #1890ff, #40a9ff) !important;
          border: none !important;
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
          transition: all 0.3s ease;
        }

        .send-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4) !important;
          background: linear-gradient(135deg, #0050b3, #1890ff) !important;
        }

        .send-button:disabled {
          opacity: 0.6;
          transform: none;
          box-shadow: none;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .invoice-management-container {
            padding: 16px;
          }
          
          :global(.modern-chat-modal .ant-modal) {
            max-width: 95vw !important;
            margin: 10px auto;
          }
          
          .chat-container {
            height: 80vh;
          }
          
          .chat-header {
            padding: 16px 20px;
          }
          
          .messages-container {
            padding: 16px;
          }
          
          .chat-input-container {
            padding: 16px 20px;
          }
        }
        /* Review modal styles */
        .review-modal-root {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
        }

        .review-modal-header {
          background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
          padding: 18px 24px;
          color: #ffffff;
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
        }

        .review-title {
          font-weight: 700;
          font-size: 16px;
        }

        .review-modal-body {
          padding: 20px 24px 24px 24px;
          background: #fff;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
        }

        .review-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .review-customer-name {
          font-size: 15px;
          font-weight: 700;
          color: #222;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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