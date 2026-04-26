/**
 * AI Chatbot Implementation for HTML Frontend
 * Manages the floating chatbot widget, API communication, and UI rendering.
 */

if (typeof window.chatbotInitialized === 'undefined') {
    window.chatbotInitialized = false;
}

function bootstrapChatbot() {
    if (window.chatbotInitialized) return;

    // Inject HTML structure if it doesn't exist
    if (!document.getElementById('chatbot-widget-container')) {
        injectChatbotHTML();
    }

    if (initChatbot()) {
        window.chatbotInitialized = true;
    }
}

document.addEventListener('DOMContentLoaded', bootstrapChatbot);
window.addEventListener('load', bootstrapChatbot);
window.addEventListener('footerLoaded', bootstrapChatbot);

function injectChatbotHTML() {
    const container = document.createElement('div');
    container.id = 'chatbot-widget-container';
    
    const html = `
        <!-- Floating Toggle Button -->
        <button class="chatbot-toggle-btn" id="chatbot-toggle" title="Chat với AI">
            <i class="fas fa-robot"></i>
        </button>

        <!-- Chat Window -->
        <div class="chatbot-window" id="chatbot-window">
            <!-- Header -->
            <div class="chatbot-header">
                <div class="chatbot-header-avatar"><i class="fas fa-robot"></i></div>
                <div class="chatbot-header-info">
                    <h3 class="chatbot-header-title">WebSach AI</h3>
                    <p class="chatbot-header-subtitle">
                        <span class="status-dot"></span> Trực tuyến
                    </p>
                </div>
                <button class="chatbot-header-close" id="chatbot-close" title="Đóng">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Messages Area -->
            <div class="chatbot-messages" id="chatbot-messages">
                <!-- Welcome message will be added here via JS -->
            </div>

            <!-- Quick Actions -->
            <div class="chatbot-quick-actions" id="chatbot-quick-actions">
                <button class="chatbot-quick-btn">📚 Gợi ý sách hay</button>
                <button class="chatbot-quick-btn">🔄 Chính sách đổi trả</button>
                <button class="chatbot-quick-btn">🚚 Phí giao hàng</button>
                <button class="chatbot-quick-btn">📞 Liên hệ hỗ trợ</button>
            </div>

            <!-- Input Area -->
            <form class="chatbot-input-area" id="chatbot-form">
                <div class="chatbot-input-wrapper">
                    <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Nhập câu hỏi của bạn..." autocomplete="off">
                </div>
                <button type="submit" class="chatbot-send-btn" id="chatbot-send" disabled>
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
        </div>
    `;
    
    container.innerHTML = html;
    document.body.appendChild(container);
    
    // Add FontAwesome if missing
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fa);
    }
    
    // Add CSS
    if (!document.getElementById('chatbot-styles')) {
        const style = document.createElement('style');
        style.id = 'chatbot-styles';
        style.textContent = `
            /* Floating Chat Button */
            .chatbot-toggle-btn {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: none;
                background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
                color: white;
                font-size: 28px;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(59, 130, 246, 0.45);
                z-index: 2147483000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                animation: chatbot-pulse 2s infinite;
            }
            .chatbot-toggle-btn:hover { transform: scale(1.1) translateY(-5px); box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6); }
            .chatbot-toggle-btn.active { animation: none; background: linear-gradient(135deg, #ef4444 0%, #f43f5e 100%); transform: rotate(90deg); }
            @keyframes chatbot-pulse { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); } 70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }
            
            /* Chat Window */
            .chatbot-window {
                position: fixed; bottom: 110px; right: 30px; width: 380px; height: 600px;
                max-height: calc(100vh - 140px); border-radius: 24px; overflow: hidden;
                z-index: 2147482999; display: flex; flex-direction: column;
                box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15); background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                opacity: 0; visibility: hidden; transform: translateY(20px) scale(0.95);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: bottom right;
                border: 1px solid rgba(255, 255, 255, 0.8);
            }
            .chatbot-window.visible { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
            
            /* Header */
            .chatbot-header { background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%); color: white; padding: 18px 20px; display: flex; align-items: center; gap: 15px; flex-shrink: 0; position: relative; }
            .chatbot-header-avatar { width: 44px; height: 44px; background: rgba(255, 255, 255, 0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 2px solid rgba(255,255,255,0.5); }
            .chatbot-header-info { flex: 1; }
            .chatbot-header-title { font-weight: 800; font-size: 17px; margin: 0; }
            .chatbot-header-subtitle { font-size: 13px; opacity: 0.9; margin: 3px 0 0 0; display: flex; align-items: center; gap: 5px; }
            .chatbot-header-subtitle .status-dot { width: 8px; height: 8px; background-color: #a7f3d0; border-radius: 50%; box-shadow: 0 0 8px #a7f3d0; }
            .chatbot-header-close { background: rgba(255, 255, 255, 0.2); border: none; color: white; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
            .chatbot-header-close:hover { background: rgba(255, 255, 255, 0.4); transform: scale(1.1); }
            
            /* Messages Area */
            .chatbot-messages { flex: 1; overflow-y: auto; padding: 24px 20px; display: flex; flex-direction: column; gap: 16px; background: #f8fafc; scroll-behavior: smooth; }
            .chatbot-messages::-webkit-scrollbar { width: 6px; }
            .chatbot-messages::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
            
            /* Message Bubbles */
            .chatbot-message { display: flex; gap: 12px; max-width: 90%; animation: chatbot-msg-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            .chatbot-message.user { align-self: flex-end; flex-direction: row-reverse; }
            .chatbot-message.bot { align-self: flex-start; }
            @keyframes chatbot-msg-in { from { opacity: 0; transform: translateY(15px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
            .chatbot-msg-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; margin-top: 6px; }
            .chatbot-message.bot .chatbot-msg-avatar { background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%); color: white; }
            .chatbot-message.user .chatbot-msg-avatar { background: linear-gradient(135deg, #f43f5e 0%, #fb923c 100%); color: white; }
            .chatbot-msg-bubble { padding: 12px 16px; border-radius: 20px; font-size: 14.5px; line-height: 1.6; word-wrap: break-word; white-space: pre-wrap; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
            .chatbot-message.bot .chatbot-msg-bubble { background: white; color: #334155; border: 1px solid #e2e8f0; border-top-left-radius: 4px; }
            .chatbot-message.user .chatbot-msg-bubble { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border-top-right-radius: 4px; }
            
            /* Typing Indicator */
            .chatbot-typing { display: flex; align-items: center; gap: 12px; align-self: flex-start; animation: chatbot-msg-in 0.3s ease; }
            .chatbot-typing-dots { background: white; border: 1px solid #e2e8f0; border-radius: 20px; border-top-left-radius: 4px; padding: 14px 20px; display: flex; gap: 6px; }
            .chatbot-typing-dot { width: 8px; height: 8px; background: #94a3b8; border-radius: 50%; animation: chatbot-bounce 1.4s infinite ease-in-out both; }
            @keyframes chatbot-bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; } 40% { transform: scale(1.2); opacity: 1; } }
            
            /* Quick Actions */
            .chatbot-quick-actions { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 20px 16px; background: #f8fafc; }
            .chatbot-quick-btn { padding: 8px 16px; border: 1px solid #cbd5e1; border-radius: 24px; background: white; color: #3b82f6; font-size: 13.5px; font-weight: 500; cursor: pointer; transition: all 0.25s; white-space: nowrap; }
            .chatbot-quick-btn:hover { background: #eff6ff; color: #2563eb; transform: translateY(-2px); }
            
            /* Input Area */
            .chatbot-input-area { padding: 16px 20px; background: rgba(255, 255, 255, 0.9); border-top: 1px solid #e2e8f0; display: flex; gap: 12px; align-items: center; flex-shrink: 0; }
            .chatbot-input-wrapper { flex: 1; }
            .chatbot-input { width: 100%; padding: 12px 20px; border: 2px solid #e2e8f0; border-radius: 30px; outline: none; font-size: 14.5px; transition: all 0.3s; background: #f8fafc; }
            .chatbot-input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
            .chatbot-send-btn { width: 48px; height: 48px; border-radius: 50%; border: none; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.25s; }
            .chatbot-send-btn:hover:not(:disabled) { transform: scale(1.1); }
            .chatbot-send-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
            
            /* Error */
            .chatbot-error { text-align: center; padding: 12px 16px; color: #e11d48; font-size: 13.5px; background: #ffe4e6; border-radius: 12px; margin: 8px 0; align-self: center; border: 1px solid #fecdd3; }
            
            @media (max-width: 480px) {
                .chatbot-window { width: calc(100vw - 32px); height: calc(100vh - 120px); right: 16px; bottom: 95px; }
                .chatbot-toggle-btn { bottom: 20px; right: 16px; width: 56px; height: 56px; }
            }
        `;
        document.head.appendChild(style);
    }
}

function initChatbot() {
    // DOM Elements
    let toggleBtn = document.getElementById('chatbot-toggle');
    let closeBtn = document.getElementById('chatbot-close');
    let chatWindow = document.getElementById('chatbot-window');
    let messagesContainer = document.getElementById('chatbot-messages');
    let chatForm = document.getElementById('chatbot-form');
    let chatInput = document.getElementById('chatbot-input');
    let sendBtn = document.getElementById('chatbot-send');
    let quickActionContainer = document.getElementById('chatbot-quick-actions');
    let quickActionBtns = document.querySelectorAll('.chatbot-quick-btn');

    // Safety: if elements were not injected yet, inject once and retry lookup.
    if (!toggleBtn || !chatForm || !chatInput || !messagesContainer) {
        injectChatbotHTML();
        toggleBtn = document.getElementById('chatbot-toggle');
        closeBtn = document.getElementById('chatbot-close');
        chatWindow = document.getElementById('chatbot-window');
        messagesContainer = document.getElementById('chatbot-messages');
        chatForm = document.getElementById('chatbot-form');
        chatInput = document.getElementById('chatbot-input');
        sendBtn = document.getElementById('chatbot-send');
        quickActionContainer = document.getElementById('chatbot-quick-actions');
        quickActionBtns = document.querySelectorAll('.chatbot-quick-btn');
    }

    if (!toggleBtn || !closeBtn || !chatWindow || !messagesContainer || !chatForm || !chatInput || !sendBtn) {
        console.warn('[chatbot] Missing required UI elements; widget init skipped.');
        return false;
    }

    // Force visibility so other styles/widgets do not hide the floating button.
    toggleBtn.style.display = 'flex';
    toggleBtn.style.visibility = 'visible';
    toggleBtn.style.pointerEvents = 'auto';
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.right = '30px';
    toggleBtn.style.bottom = '30px';
    toggleBtn.style.zIndex = '2147483000';
    
    // State
    let isOpen = false;
    let sessionId = null;
    let isLoading = false;
    let messageCount = 0;
    
    // API URLs: prefer direct chatbot URL, then backend proxy, then local direct fallback
    const API_BASE = window.API_CONFIG ? window.API_CONFIG.BASE_URL : window.API_CONFIG.BASE_URL;
    const configuredChatbotUrl = window.API_CONFIG ? window.API_CONFIG.CHATBOT_URL : '';
    const chatEndpoints = [
        `${API_BASE.replace(/\/$/, '')}/api/chatbot/chat`
    ];
    
    // Initial welcome message
    addMessage('bot', 'Xin chào! 👋 Tôi là trợ lý AI của WebSach. Tôi có thể giúp bạn tìm sách, tư vấn sản phẩm, hoặc trả lời câu hỏi về cửa hàng. Hãy hỏi tôi bất cứ điều gì!');
    
    // Event Listeners
    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });
    
    chatInput.addEventListener('input', () => {
        sendBtn.disabled = chatInput.value.trim() === '' || isLoading;
    });
    
    // Quick actions
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.textContent;
            sendMessage();
        });
    });
    
    // Functions
    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.add('visible');
            toggleBtn.classList.add('active');
            toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
            setTimeout(() => chatInput.focus(), 300);
            
            // Auto hide quick actions after first message
            if (messageCount > 0 && quickActionContainer) {
                quickActionContainer.style.display = 'none';
            }
        } else {
            chatWindow.classList.remove('visible');
            toggleBtn.classList.remove('active');
            toggleBtn.innerHTML = '<i class="fas fa-robot"></i>';
            chatInput.blur();
        }
    }
    
    function formatText(text) {
        // Simple markdown parsing for bold and lists
        let formatted = text
            // Handle bold **text**
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Handle lists
            .replace(/^- (.*)$/gm, '<li>$1</li>');
            
        // Wrap lists in ul
        if (formatted.includes('<li>')) {
            formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        }
        
        return formatted;
    }
    
    function addMessage(role, content) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chatbot-message ${role}`;
        
        const avatarStr = role === 'bot' 
            ? '<div class="chatbot-msg-avatar"><i class="fas fa-robot"></i></div>'
            : '<div class="chatbot-msg-avatar"><i class="fas fa-user"></i></div>';
            
        // Format the content if it's from the bot
        const formattedContent = role === 'bot' ? formatText(content) : content;
            
        msgDiv.innerHTML = `
            ${avatarStr}
            <div class="chatbot-msg-bubble">${formattedContent}</div>
        `;
        
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
        
        if (role === 'user') {
            messageCount++;
            if (quickActionContainer) {
                quickActionContainer.style.display = 'none';
            }
        }
    }
    
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'chatbot-typing';
        indicator.id = 'chatbot-typing-indicator';
        indicator.innerHTML = `
            <div class="chatbot-msg-avatar"><i class="fas fa-robot"></i></div>
            <div class="chatbot-typing-dots">
                <div class="chatbot-typing-dot"></div>
                <div class="chatbot-typing-dot"></div>
                <div class="chatbot-typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(indicator);
        scrollToBottom();
    }
    
    function removeTypingIndicator() {
        const indicator = document.getElementById('chatbot-typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    function showError(msg) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chatbot-error';
        errorDiv.textContent = msg;
        messagesContainer.appendChild(errorDiv);
        scrollToBottom();
        
        // Remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    function scrollToBottom() {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    async function requestChat(payload) {
        let lastError = null;

        for (const endpoint of chatEndpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                let data = {};
                try {
                    data = await response.json();
                } catch (parseError) {
                    data = {};
                }

                if (!response.ok) {
                    throw new Error(data.error || data.detail || 'Lỗi kết nối tới chatbot');
                }

                return data;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error('Không thể kết nối chatbot.');
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || isLoading) return;
        
        // UI updates
        chatInput.value = '';
        sendBtn.disabled = true;
        chatInput.disabled = true;
        isLoading = true;
        
        addMessage('user', text);
        showTypingIndicator();
        
        try {
            const data = await requestChat({
                message: text,
                session_id: sessionId
            });
            
            removeTypingIndicator();
            
            // Save session
            if (data.session_id) {
                sessionId = data.session_id;
            }
            
            // Add bot response
            addMessage('bot', data.reply || 'Xin lỗi, tôi không thể trả lời lúc này.');
            
        } catch (error) {
            console.error('Chat error:', error);
            removeTypingIndicator();
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                showError('Không thể kết nối với máy chủ. Vui lòng kiểm tra lại mạng hoặc thử lại sau.');
            } else {
                showError(error.message || 'Xin lỗi, đã có lỗi xảy ra. Hãy liên hệ hotline 0374170367 để được hỗ trợ.');
            }
            
            // Fallback message
            addMessage('bot', '⚠️ Rất tiếc, AI đang gặp sự cố gián đoạn. Bạn vui lòng thử lại sau hoặc gọi hotline 0374170367 để chúng tôi hỗ trợ trực tiếp nhé!');
        } finally {
            isLoading = false;
            chatInput.disabled = false;
            setTimeout(() => {
                chatInput.focus();
                sendBtn.disabled = chatInput.value.trim() === '';
            }, 100);
        }
    }

    return true;
}

