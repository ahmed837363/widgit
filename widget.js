/**
 * AI Chatbot Widget for E-commerce Stores
 * Standalone Vanilla JS Widget - No Dependencies Required
 * 
 * Usage:
 * <script src="widget.js" 
 *   data-function-url="YOUR_APPWRITE_FUNCTION_URL" 
 *   data-client-id="YOUR_CLIENT_ID">
 * </script>
 * 
 * Or configure via JavaScript:
 * window.ChatbotConfig = {
 *   functionUrl: 'YOUR_APPWRITE_FUNCTION_URL',
 *   clientId: 'YOUR_CLIENT_ID',
 *   position: 'right', // 'left' or 'right'
 *   primaryColor: '#6366f1',
 *   welcomeMessage: 'مرحباً! كيف يمكنني مساعدتك؟'
 * };
 */

(function () {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  
  // Get configuration from script tag data attributes or global config
  const scriptTag = document.currentScript;
  const globalConfig = window.ChatbotConfig || {};

  const CONFIG = {
    functionUrl: scriptTag?.dataset?.functionUrl || globalConfig.functionUrl || '',
    clientId: scriptTag?.dataset?.clientId || globalConfig.clientId || '',
    position: scriptTag?.dataset?.position || globalConfig.position || 'right',
    primaryColor: scriptTag?.dataset?.primaryColor || globalConfig.primaryColor || '#6366f1',
    welcomeMessage: scriptTag?.dataset?.welcomeMessage || globalConfig.welcomeMessage || 'مرحباً! كيف يمكنني مساعدتك اليوم؟ 👋',
    placeholderText: scriptTag?.dataset?.placeholderText || globalConfig.placeholderText || 'اكتب رسالتك هنا...',
    headerTitle: scriptTag?.dataset?.headerTitle || globalConfig.headerTitle || 'المساعد الذكي',
    zIndex: parseInt(scriptTag?.dataset?.zIndex || globalConfig.zIndex || '999999'),
  };

  // Validate required configuration
  if (!CONFIG.functionUrl || !CONFIG.clientId) {
    console.error('[Chatbot Widget] Missing required configuration: functionUrl and clientId are required.');
    return;
  }

  // ============================================
  // STATE
  // ============================================
  
  let isOpen = false;
  let isLoading = false;
  let chatHistory = [];
  let sessionId = generateSessionId();

  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // ============================================
  // STYLES
  // ============================================
  
  const styles = `
    /* CSS Reset for Widget */
    .chatbot-widget * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    /* Chat Bubble Button */
    .chatbot-bubble {
      position: fixed;
      bottom: 20px;
      ${CONFIG.position}: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${CONFIG.primaryColor};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: ${CONFIG.zIndex};
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .chatbot-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.35);
    }

    .chatbot-bubble svg {
      width: 28px;
      height: 28px;
      fill: white;
      transition: transform 0.3s ease;
    }

    .chatbot-bubble.open svg {
      transform: rotate(180deg);
    }

    /* Chat Window */
    .chatbot-window {
      position: fixed;
      bottom: 90px;
      ${CONFIG.position}: 20px;
      width: 380px;
      max-width: calc(100vw - 40px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: ${CONFIG.zIndex};
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px) scale(0.95);
      transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
    }

    .chatbot-window.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    /* Header */
    .chatbot-header {
      background: ${CONFIG.primaryColor};
      color: white;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .chatbot-header-title {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chatbot-header-title svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    .chatbot-close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    }

    .chatbot-close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .chatbot-close-btn svg {
      width: 16px;
      height: 16px;
      fill: white;
    }

    /* Messages Container */
    .chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
    }

    .chatbot-messages::-webkit-scrollbar {
      width: 6px;
    }

    .chatbot-messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .chatbot-messages::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    /* Message Bubble */
    .chatbot-message {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      animation: messageSlide 0.3s ease;
    }

    @keyframes messageSlide {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .chatbot-message.user {
      background: ${CONFIG.primaryColor};
      color: white;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }

    .chatbot-message.assistant {
      background: white;
      color: #1e293b;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Typing Indicator */
    .chatbot-typing {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: white;
      border-radius: 16px;
      border-bottom-right-radius: 4px;
      align-self: flex-end;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .chatbot-typing span {
      width: 8px;
      height: 8px;
      background: #94a3b8;
      border-radius: 50%;
      animation: typingBounce 1.4s infinite ease-in-out;
    }

    .chatbot-typing span:nth-child(1) { animation-delay: 0s; }
    .chatbot-typing span:nth-child(2) { animation-delay: 0.2s; }
    .chatbot-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typingBounce {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Input Container */
    .chatbot-input-container {
      padding: 16px;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 10px;
      flex-shrink: 0;
    }

    .chatbot-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      direction: rtl;
    }

    .chatbot-input:focus {
      border-color: ${CONFIG.primaryColor};
      box-shadow: 0 0 0 3px ${CONFIG.primaryColor}20;
    }

    .chatbot-input::placeholder {
      color: #94a3b8;
    }

    .chatbot-send-btn {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background: ${CONFIG.primaryColor};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease, transform 0.2s ease;
    }

    .chatbot-send-btn:hover:not(:disabled) {
      background: ${adjustColor(CONFIG.primaryColor, -20)};
      transform: scale(1.05);
    }

    .chatbot-send-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .chatbot-send-btn svg {
      width: 20px;
      height: 20px;
      fill: white;
      transform: rotate(180deg);
    }

    /* Error Message */
    .chatbot-error {
      background: #fee2e2 !important;
      color: #dc2626 !important;
      border: 1px solid #fecaca;
    }

    /* Mobile Responsive */
    @media (max-width: 480px) {
      .chatbot-window {
        width: calc(100vw - 20px);
        height: calc(100vh - 100px);
        bottom: 80px;
        ${CONFIG.position}: 10px;
        border-radius: 12px;
      }

      .chatbot-bubble {
        width: 54px;
        height: 54px;
        bottom: 15px;
        ${CONFIG.position}: 15px;
      }
    }

    /* RTL Support */
    .chatbot-widget[dir="rtl"] .chatbot-send-btn svg {
      transform: rotate(0deg);
    }
  `;

  // Helper function to adjust color brightness
  function adjustColor(color, amount) {
    const clamp = (num) => Math.min(255, Math.max(0, num));
    
    // Remove # if present
    color = color.replace('#', '');
    
    // Parse the color
    const num = parseInt(color, 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ============================================
  // HTML TEMPLATES
  // ============================================
  
  const chatIcon = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`;
  const closeIcon = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
  const sendIcon = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
  const botIcon = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;

  // ============================================
  // DOM CREATION
  // ============================================
  
  function createWidget() {
    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Create widget container
    const widget = document.createElement('div');
    widget.className = 'chatbot-widget';
    widget.dir = 'rtl';

    // Create chat bubble
    const bubble = document.createElement('button');
    bubble.className = 'chatbot-bubble';
    bubble.innerHTML = chatIcon;
    bubble.setAttribute('aria-label', 'فتح المحادثة');
    bubble.onclick = toggleChat;

    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chatbot-window';
    chatWindow.innerHTML = `
      <div class="chatbot-header">
        <div class="chatbot-header-title">
          ${botIcon}
          <span>${CONFIG.headerTitle}</span>
        </div>
        <button class="chatbot-close-btn" aria-label="إغلاق">
          ${closeIcon}
        </button>
      </div>
      <div class="chatbot-messages" id="chatbot-messages"></div>
      <div class="chatbot-input-container">
        <input type="text" class="chatbot-input" placeholder="${CONFIG.placeholderText}" id="chatbot-input">
        <button class="chatbot-send-btn" id="chatbot-send" aria-label="إرسال">
          ${sendIcon}
        </button>
      </div>
    `;

    // Append elements
    widget.appendChild(bubble);
    widget.appendChild(chatWindow);
    document.body.appendChild(widget);

    // Setup event listeners
    setupEventListeners(widget);

    // Add welcome message
    addMessage('assistant', CONFIG.welcomeMessage);
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  function setupEventListeners(widget) {
    const closeBtn = widget.querySelector('.chatbot-close-btn');
    const input = widget.querySelector('#chatbot-input');
    const sendBtn = widget.querySelector('#chatbot-send');

    closeBtn.onclick = toggleChat;
    sendBtn.onclick = handleSend;

    input.onkeypress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };
  }

  function toggleChat() {
    isOpen = !isOpen;
    const bubble = document.querySelector('.chatbot-bubble');
    const chatWindow = document.querySelector('.chatbot-window');

    bubble.classList.toggle('open', isOpen);
    chatWindow.classList.toggle('open', isOpen);
    bubble.innerHTML = isOpen ? closeIcon : chatIcon;

    if (isOpen) {
      const input = document.querySelector('#chatbot-input');
      setTimeout(() => input?.focus(), 300);
    }
  }

  async function handleSend() {
    const input = document.querySelector('#chatbot-input');
    const message = input.value.trim();

    if (!message || isLoading) return;

    input.value = '';
    addMessage('user', message);
    
    // Add to history
    chatHistory.push({ role: 'user', content: message });

    // Show typing indicator
    showTyping();

    try {
      const response = await sendMessage(message);
      hideTyping();

      if (response.success) {
        addMessage('assistant', response.response);
        chatHistory.push({ role: 'assistant', content: response.response });
      } else {
        addMessage('assistant', response.error || 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.', true);
      }
    } catch (error) {
      hideTyping();
      console.error('[Chatbot Widget] Error:', error);
      addMessage('assistant', 'عذراً، لم نتمكن من الاتصال بالخادم. يرجى المحاولة لاحقاً.', true);
    }
  }

  // ============================================
  // API COMMUNICATION
  // ============================================
  
  async function sendMessage(message) {
    isLoading = true;
    updateSendButton();

    try {
      const response = await fetch(CONFIG.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          history: chatHistory.slice(-10), // Send last 10 messages
          clientId: CONFIG.clientId,
          sessionId: sessionId,
          pageUrl: window.location.href,
        }),
      });

      const data = await response.json();
      return data;
    } finally {
      isLoading = false;
      updateSendButton();
    }
  }

  // ============================================
  // UI HELPERS
  // ============================================
  
  function addMessage(role, content, isError = false) {
    const messagesContainer = document.querySelector('#chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${role}${isError ? ' chatbot-error' : ''}`;
    
    // Simple markdown-like formatting
    let formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = formattedContent;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
  }

  function showTyping() {
    const messagesContainer = document.querySelector('#chatbot-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-typing';
    typingDiv.id = 'chatbot-typing';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
  }

  function hideTyping() {
    const typing = document.querySelector('#chatbot-typing');
    if (typing) typing.remove();
  }

  function scrollToBottom() {
    const messagesContainer = document.querySelector('#chatbot-messages');
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  }

  function updateSendButton() {
    const sendBtn = document.querySelector('#chatbot-send');
    if (sendBtn) {
      sendBtn.disabled = isLoading;
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

  // Expose API for external control
  window.ChatbotWidget = {
    open: () => { if (!isOpen) toggleChat(); },
    close: () => { if (isOpen) toggleChat(); },
    toggle: toggleChat,
    sendMessage: (msg) => {
      const input = document.querySelector('#chatbot-input');
      if (input) {
        input.value = msg;
        handleSend();
      }
    },
    clearHistory: () => {
      chatHistory = [];
      sessionId = generateSessionId();
      const messagesContainer = document.querySelector('#chatbot-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
        addMessage('assistant', CONFIG.welcomeMessage);
      }
    },
  };

})();
