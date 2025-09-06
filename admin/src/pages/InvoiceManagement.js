import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, Button, Select, message, Table, Tag, Space, Input } from 'antd';
import { ExclamationCircleFilled, EyeOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';

const { confirm } = Modal;
const { Search, TextArea } = Input;

const InvoiceManagement = () => {
  // State declarations moved inside the component
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatVisible, setChatVisible] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const orderStatuses = [
    { value: 'Chờ xử lý', color: 'orange' },
    { value: 'Đã xác nhận', color: 'blue' },
    { value: 'Đang giao hàng', color: 'geekblue' },
    { value: 'Đã giao hàng', color: 'green' },
    { value: 'Đã hủy', color: 'red' }
  ];
  
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/orders/hoadon');
      setInvoices(res.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách hóa đơn:', error);
      message.error('Lỗi khi tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleViewInvoice = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/hoadon/${id}`);
      setSelectedInvoice({
        ...res.data,
        items: res.data.items.map(item => ({
          ...item,
          unitPrice: item.price,
          productImage: item.productImage || 'https://via.placeholder.com/50'
        })),
         // Map lại tên trường cho React dùng
  note: res.data.GhiChu || '', // Thêm dòng này
  status: res.data.tinhtrang   // Thêm dòng này
      });
      setIsModalVisible(true);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết hóa đơn:', error);
      message.error('Lỗi khi tải chi tiết hóa đơn');
    }
  };
  const handleChatWithCustomer = async (customerId) => {
    try {
      // Tạo/truy vấn phòng chat
      const res = await axios.post(
        'http://localhost:5000/api/chat/rooms',
        { customer_id: customerId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Lấy tin nhắn
      const msgRes = await axios.get(`http://localhost:5000/api/chat/rooms/${res.data.room.room_id}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
  
      // Cập nhật state
      setCurrentRoom(res.data.room);
      setMessages(msgRes.data.messages);
      setChatVisible(true);
    } catch (error) {
      message.error(error.response?.data.error || 'Lỗi kết nối chat');
    }
  };
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
  
    try {
      // Gửi tin nhắn
      await axios.post('http://localhost:5000/api/chat/messages', {
        room_id: currentRoom.room_id,
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
  
      // Cập nhật tin nhắn
      const msgRes = await axios.get(`http://localhost:5000/api/chat/rooms/${currentRoom.room_id}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setMessages(msgRes.data.messages);
      setNewMessage('');
    } catch (error) {
      message.error('Gửi tin nhắn thất bại');
    }
  };
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/hoadon/${id}/trangthai`, { 
        trangthai: newStatus 
      });
      message.success('Cập nhật trạng thái thành công');
      fetchInvoices();
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      message.error('Cập nhật trạng thái thất bại');
    }
  };

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
          await axios.put(`http://localhost:5000/api/orders/hoadon/${id}/huy`, {
            lyDo: 'Hủy bởi quản trị viên'
          });
          message.success('Hủy hóa đơn thành công');
          fetchInvoices();
        } catch (error) {
          console.error('Lỗi khi hủy hóa đơn:', error);
          message.error('Hủy hóa đơn thất bại');
        }
      },
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const filteredInvoices = invoices.filter(invoice => 
    invoice.id.toString().includes(searchTerm) ||
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerPhone.includes(searchTerm)
  );

  const columns = [
    {
      title: 'Mã HĐ',
      dataIndex: 'id',
      key: 'id',
      width: 70,
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
      width: 150,
    },
    {
      title: 'Ngày lập',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
      width: 100,
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
      width: 120,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: 140 }}
          onChange={(value) => handleStatusChange(record.id, value)}
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
          />
          <Button 
            size="small"
            type="primary"
            icon={<MessageOutlined />}
            onClick={() => handleChatWithCustomer(record.makh)}
          />
          {record.status !== 'Đã hủy' && (
            <Button 
              size="small"
              danger
              icon={<DeleteOutlined />} 
              onClick={() => handleCancelInvoice(record.id)}
            />
          )}
        </Space>
      ),
      fixed: 'right',
    }
  ];

  return (
    <div className="invoice-management-container">
      <div className="header-section">
        <h1 className="page-title">Quản lý Hóa đơn</h1>
        <div className="search-box">
          <Search
            placeholder="Tìm hóa đơn..."
            allowClear
            enterButton
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredInvoices}
        rowKey="id"
        loading={loading}
        scroll={{ x: 750 }}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: false,
          size: 'small'
        }}
        size="small"
        className="compact-invoice-table"
        style={{ fontSize: '13px' }}
      />
{/* Thêm modal chat vào cuối component */}
<Modal
  title={`Chat với khách hàng #${currentRoom?.customer_id || ''}`}
  open={chatVisible}
  onCancel={() => setChatVisible(false)}
  footer={null}
  width={600}
>
  <div className="chat-container">
    <div className="message-area">
      {messages.map(msg => (
        <div 
          key={msg.message_id} 
          className={`message ${msg.sender_type === 'staff' ? 'staff' : 'customer'}`}
        >
          <div className="message-header">
            <span className="sender">{msg.sender_type === 'staff' ? 'Bạn' : 'Khách hàng'}</span>
            <span className="time">{new Date(msg.created_at).toLocaleTimeString()}</span>
          </div>
          <div className="message-content">{msg.message}</div>
        </div>
      ))}
    </div>
    
    <div className="input-area">
      <TextArea
        rows={3}
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
      />
      <Button 
        type="primary" 
        onClick={handleSendMessage}
        style={{ marginTop: 8 }}
      >
        Gửi
      </Button>
    </div>
  </div>
</Modal>






      {/* Invoice Detail Modal */}
      <Modal
        title={`Chi tiết hóa đơn #${selectedInvoice?.id || ''}`}
        open={isModalVisible} // Đã sửa từ visible thành open
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
        bodyStyle={{ padding: '16px' }}
      >
        {selectedInvoice && (
          <div className="invoice-detail-content">
            {/* Customer Info Section */}
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
                    {selectedInvoice.shippingAddress}, {selectedInvoice.ward}, {selectedInvoice.district}, {selectedInvoice.province}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Info Section */}
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

            {/* Products Section */}
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

      <style jsx>{`
        .invoice-management-container {
          padding: 16px 16px 16px 216px;
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
        .action-btn {
          padding: 0 8px;
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
        .product-cell {
          display: flex;
          align-items: center;
        }
        .product-image {
          width: 32px;
          height: 32px;
          object-fit: cover;
          margin-right: 8px;
          border-radius: 2px;
        }
        .product-name {
          font-size: 13px;
        }
        .text-red {
  color: #ef4444; /* Mã màu đỏ */
}
        .compact-invoice-table :global(.ant-table-thead > tr > th) {
          padding: 8px 12px;
        }
        .compact-invoice-table :global(.ant-table-tbody > tr > td) {
          padding: 8px 12px;
        }
        .chat-container {
    height: 500px;
    display: flex;
    flex-direction: column;
  }
  
  .message-area {
    flex: 1;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 4px;
  }

  .message {
    margin-bottom: 12px;
    padding: 8px;
    border-radius: 4px;
    max-width: 80%;
  }

  .message.staff {
    background: #e6f7ff;
    margin-left: auto;
  }

  .message.customer {
    background: #f5f5f5;
    margin-right: auto;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }

  .message-content {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .input-area {
    border-top: 1px solid #ddd;
    padding-top: 12px;
  }
      `}</style>
    </div>
  );
};

export default InvoiceManagement;