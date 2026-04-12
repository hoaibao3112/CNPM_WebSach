/**
 * AI Chatbot Implementation for HTML Frontend
 * Manages the floating chatbot widget, API communication, and UI rendering.
 */

let chatbotInitialized = false;

function bootstrapChatbot() {
    if (chatbotInitialized) return;

    // Inject HTML structure if it doesn't exist
    if (!document.getElementById('chatbot-widget-container')) {
        injectChatbotHTML();
    }

    if (initChatbot()) {
        chatbotInitialized = true;
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
    
    // Add CSS link
    if (!document.querySelector('link[href*="chatbot.css"]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'styles/chatbot.css';
        document.head.appendChild(css);
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
        configuredChatbotUrl ? `${configuredChatbotUrl.replace(/\/$/, '')}/chat` : '',
        `${API_BASE.replace(/\/$/, '')}/api/chatbot/chat`,
        'http://127.0.0.1:8002/chat'
    ].filter(Boolean);
    
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

