import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Common/ProtectedRoute';

// Pages
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProductListPage from './pages/Products/ProductListPage';
import ProductDetailPage from './pages/Products/ProductDetailPage';
import CartPage from './pages/Cart/CartPage';
import OrdersPage from './pages/Orders/OrdersPage';
import OrderConfirmationPage from './pages/Orders/OrderConfirmationPage';
import ProfilePage from './pages/Profile/ProfilePage';
import RefundHistoryPage from './pages/Refunds/RefundHistoryPage';
import AuthorPage from './pages/Author/AuthorPage';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />

                {/* Auth routes */}
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />

                {/* Product routes */}
                <Route path="products" element={<ProductListPage />} />
                <Route path="product/:id" element={<ProductDetailPage />} />
                <Route path="author/:id" element={<AuthorPage />} />
                <Route path="cart" element={<CartPage />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="order-confirmation" element={<OrderConfirmationPage />} />
                  <Route path="refund-history" element={<RefundHistoryPage />} />
                </Route>

                {/* 404 fallback */}
                <Route path="*" element={<div style={{ padding: '40px', textAlign: 'center' }}>
                  <h1>404 - Không tìm thấy trang</h1>
                  <p>Trang bạn đang tìm kiếm không tồn tại.</p>
                </div>} />
              </Route>
            </Routes>

            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
