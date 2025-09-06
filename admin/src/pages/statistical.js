import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert, Empty, Typography } from 'antd';
import { DollarOutlined, ShoppingOutlined, StarOutlined, RiseOutlined } from '@ant-design/icons';
import { Bar, Pie, Column } from '@ant-design/plots';
import axios from 'axios';
import 'dayjs';
import '../styles/thongke.css';

const { Title } = Typography;

const ReportDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, revenueRes, statusRes] = await Promise.all([
          axios.get('http://localhost:5000/api/reports/overview'),
          axios.get('http://localhost:5000/api/reports/revenue-by-month'),
          axios.get('http://localhost:5000/api/reports/order-status'),
        ]);
        
        setOverview(overviewRes.data);
        setRevenueData(revenueRes.data);
        setStatusData(statusRes.data);

        if (!overviewRes.data && !revenueRes.data.length && !statusRes.data.length) {
          setError('Không có dữ liệu thống kê');
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
        setError(err.response?.data?.error || 'Không thể tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND'
  }).format(value || 0);

  const renderChartOrEmpty = (data, ChartComponent, config) => (
    data && data.length ? (
      <ChartComponent {...config} />
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" className="empty-chart" />
    )
  );

  if (loading) {
    return (
      <div className="loading-container">
        <Spin tip="Đang tải dữ liệu thống kê..." size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert 
        message="Lỗi" 
        description={
          <>
            <p>{error}</p>
            <p>Vui lòng kiểm tra:</p>
            <ul>
              <li>Kết nối mạng</li>
              <li>API có đang hoạt động</li>
              <li>Console để xem lỗi chi tiết</li>
            </ul>
          </>
        } 
        type="error" 
        showIcon 
        style={{ margin: 24 }} 
      />
    );
  }

  return (
    <div className="dashboard-container">
      <Title level={2} className="dashboard-title">
        <RiseOutlined style={{ marginRight: 8 }} />
        Báo cáo Thống kê
      </Title>

      <Row gutter={[12, 12]} className="overview-cards">
        <Col xs={24} sm={12} md={8}>
          <Card className="statistic-card revenue-card" hoverable>
            <Statistic
              title="Tổng doanh thu"
              prefix={<DollarOutlined />}
              value={overview?.totalRevenue || 0}
              valueStyle={{ fontSize: 20 }}
              formatter={(value) => formatCurrency(value)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="statistic-card order-card" hoverable>
            <Statistic
              title="Tổng đơn hàng"
              prefix={<ShoppingOutlined />}
              value={overview?.totalOrders || 0}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="statistic-card product-card" hoverable>
            <Statistic
              title="Sản phẩm bán chạy"
              prefix={<StarOutlined />}
              value={overview?.topProducts?.[0]?.TenSP || 'Chưa có dữ liệu'}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card title="Doanh thu theo tháng" className="chart-card" hoverable>
            {renderChartOrEmpty(revenueData, Bar, {
              data: revenueData,
              xField: 'month',
              yField: 'revenue',
              seriesField: 'year',
              isGroup: true,
              legend: { position: 'top-right' },
              yAxis: {
                label: {
                  formatter: (v) => `${formatCurrency(v).replace('₫', '')} ₫`,
                },
              },
              tooltip: {
                formatter: (data) => ({
                  name: `Tháng ${data.month} - ${data.year}`,
                  value: formatCurrency(data.revenue),
                }),
              },
              color: ['#1890ff', '#13c2c2', '#722ed1'],
            })}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Trạng thái đơn hàng" className="chart-card" hoverable>
            {renderChartOrEmpty(statusData, Pie, {
              data: statusData,
              angleField: 'count',
              colorField: 'status',
              label: {
                type: 'inner',
                offset: '-30%',
                formatter: (text, item) => `${item?.data?.status}: ${item?.data?.count}`,
              },
              interactions: [{ type: 'element-active' }],
              tooltip: {
                formatter: (data) => ({
                  name: data.status,
                  value: `${data.count} đơn`,
                }),
              },
              color: ['#52c41a', '#faad14', '#ff4d4f', '#1890ff'],
            })}
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Top 5 sản phẩm bán chạy" className="chart-card" hoverable>
            {renderChartOrEmpty(overview?.topProducts, Column, {
              data: overview?.topProducts || [],
              xField: 'TenSP',
              yField: 'totalSold',
              label: {
                position: 'middle',
                style: { fill: '#FFFFFF', opacity: 0.6 },
              },
              xAxis: { 
                label: { autoHide: true, autoRotate: false, style: { fontSize: 12 } } 
              },
              meta: {
                TenSP: { alias: 'Tên sản phẩm' },
                totalSold: { alias: 'Số lượng bán' },
              },
              color: '#13c2c2',
            })}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportDashboard;
