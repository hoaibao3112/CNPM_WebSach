import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatbotWidget from '../Chatbot/ChatbotWidget';
import './Layout.css';

const Layout = () => {
    return (
        <div className="app-layout">
            <Header />
            <main className="main-content">
                <Outlet />
            </main>
            <Footer />
            <ChatbotWidget />
        </div>
    );
};

export default Layout;
