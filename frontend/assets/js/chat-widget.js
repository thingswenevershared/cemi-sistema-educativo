// =====================================================
// WIDGET DE CHAT EN TIEMPO REAL - CEMI
// Cliente WebSocket para soporte
// =====================================================

class ChatWidget {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.conversationId = null;
    this.userInfo = null;
    this.isTyping = false;
    this.typingTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.WS_URL = window.WS_URL || 'ws://localhost:3000';
    this.messageSound = null;
    
    this.init();
  }
  
  init() {
    this.createWidget();
    this.setupEventListeners();
    this.loadUserInfo();
    this.initMessageSound();
  }
  
  // =====================================================
  // CREAR ESTRUCTURA HTML DEL WIDGET
  // =====================================================
  
  createWidget() {
    const widgetHTML = `
      <!-- Botón flotante de Login -->
      <button class="chat-float-button" id="chatFloatButton" onclick="window.location.href='login.html'" title="Iniciar Sesión">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
      </button>
      
      <!-- Widget del chat (oculto, ya no se usa) -->
      <div class="chat-widget-container" id="chatWidgetContainer" style="display: none !important;">
        <!-- Header -->
        <div class="chat-widget-header">
          <div class="chat-widget-header-info">
            <div class="chat-widget-header-avatar">💬</div>
            <div class="chat-widget-header-text">
              <h3>Chat de Soporte</h3>
              <p><span class="status-dot"></span> En línea</p>
            </div>
          </div>
          <button class="chat-widget-close" id="chatWidgetClose">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <!-- Estado de conexión -->
        <div class="chat-connection-status" id="chatConnectionStatus"></div>
        
        <!-- Formulario inicial (para invitados) -->
        <div class="chat-initial-form" id="chatInitialForm">
          <h4>¡Hola! 👋</h4>
          <p>Estamos aquí para ayudarte. Cuéntanos en qué podemos asistirte.</p>
          
          <div class="chat-form-group">
            <label for="chatUserName">Tu nombre</label>
            <input type="text" id="chatUserName" placeholder="Ej: Juan Pérez" required>
          </div>
          
          <div class="chat-form-group">
            <label for="chatInitialMessage">¿En qué podemos ayudarte?</label>
            <textarea id="chatInitialMessage" placeholder="Describe tu consulta..." required></textarea>
          </div>
          
          <button class="chat-start-button" id="chatStartButton">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Iniciar Chat
          </button>
        </div>
        
        <!-- Área de mensajes -->
        <div class="chat-messages-container" id="chatMessagesContainer" style="display: none;"></div>
        
        <!-- Indicador de escritura -->
        <div class="chat-typing-indicator" id="chatTypingIndicator" style="display: none;">
          <span>Escribiendo</span>
          <div class="chat-typing-dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        
        <!-- Input de mensaje -->
        <div class="chat-input-container" id="chatInputContainer" style="display: none;">
          <div class="chat-input-wrapper">
            <input type="text" id="chatMessageInput" placeholder="Escribe un mensaje...">
          </div>
          <button class="chat-send-button" id="chatSendButton">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  }
  
  // =====================================================
  // CONFIGURAR EVENT LISTENERS
  // =====================================================
  
  setupEventListeners() {
    // Abrir/cerrar widget
    document.getElementById('chatFloatButton').addEventListener('click', () => this.toggleWidget());
    document.getElementById('chatWidgetClose').addEventListener('click', () => this.closeWidget());
    
    // Iniciar chat
    document.getElementById('chatStartButton').addEventListener('click', () => this.startChat());
    
    // Enviar mensaje
    document.getElementById('chatSendButton').addEventListener('click', () => this.sendMessage());
    document.getElementById('chatMessageInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    
    // Indicador de escritura
    document.getElementById('chatMessageInput').addEventListener('input', () => this.handleTyping());
  }
  
  // =====================================================
  // CARGAR INFORMACIÓN DEL USUARIO
  // =====================================================
  
  loadUserInfo() {
    const nombre = localStorage.getItem('nombre');
    const rol = localStorage.getItem('rol');
    const id_alumno = localStorage.getItem('id_alumno');
    const id_profesor = localStorage.getItem('id_profesor');
    
    if (nombre && rol) {
      this.userInfo = {
        nombre,
        tipo: rol.toLowerCase(),
        id_usuario: rol === 'alumno' ? id_alumno : id_profesor
      };
      
      // Si está loggeado, saltar el formulario inicial
      document.getElementById('chatInitialForm').style.display = 'none';
      document.getElementById('chatMessagesContainer').style.display = 'flex';
      document.getElementById('chatInputContainer').style.display = 'flex';
      
      // Verificar si tiene conversación activa
      this.checkActiveConversation();
    }
  }
  
  // =====================================================
  // INICIALIZAR SONIDO DE NOTIFICACIÓN
  // =====================================================
  
  initMessageSound() {
    // Crear un beep simple con Web Audio API
    this.messageSound = () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    };
  }
  
  // =====================================================
  // WEBSOCKET - CONEXIÓN
  // =====================================================
  
  connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket ya está conectado');
      return;
    }
    
    this.showConnectionStatus('Conectando...', 'warning');
    
    this.ws = new WebSocket(`${this.WS_URL}/chat`);
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.showConnectionStatus('Conectado', 'success');
      setTimeout(() => this.hideConnectionStatus(), 2000);
      
      // Autenticar
      this.authenticate();
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleWebSocketMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('🔴 WebSocket desconectado');
      this.isConnected = false;
      this.attemptReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('❌ Error en WebSocket:', error);
      this.showConnectionStatus('Error de conexión', 'error');
    };
  }
  
  authenticate() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const authData = {
      tipo: this.userInfo.tipo,
      id_usuario: this.userInfo.id_usuario,
      nombre: this.userInfo.nombre,
      id_conversacion: this.conversationId
    };
    
    this.ws.send(JSON.stringify({
      type: 'auth',
      data: authData
    }));
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.showConnectionStatus('No se pudo reconectar. Recarga la página.', 'error');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
    this.showConnectionStatus(`Reconectando... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'warning');
    
    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }
  
  // =====================================================
  // MANEJAR MENSAJES DEL WEBSOCKET
  // =====================================================
  
  handleWebSocketMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'connected':
      case 'authenticated':
        console.log('✅', message.message);
        break;
        
      case 'new_message':
        this.addMessageToUI(data);
        this.playMessageSound();
        this.scrollToBottom();
        break;
        
      case 'typing':
        if (data.tipo === 'admin') {
          this.showTypingIndicator();
        }
        break;
        
      case 'messages_read':
        console.log('Mensajes marcados como leídos');
        break;
        
      case 'conversation_closed':
      case 'conversation_deleted':
        this.showConnectionStatus('La conversación ha sido cerrada por un administrador', 'warning');
        this.disableChat();
        break;
        
      case 'error':
        console.error('Error del servidor:', message.message);
        break;
    }
  }
  
  // =====================================================
  // INICIAR CHAT
  // =====================================================
  
  async startChat() {
    const nombre = document.getElementById('chatUserName').value.trim();
    const mensaje = document.getElementById('chatInitialMessage').value.trim();
    
    if (!nombre || !mensaje) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    const button = document.getElementById('chatStartButton');
    button.disabled = true;
    button.textContent = 'Iniciando...';
    
    try {
      const API_URL = window.API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/chat/iniciar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_usuario: 'invitado',
          nombre,
          mensaje_inicial: mensaje
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.conversationId = result.data.id_conversacion;
        this.userInfo = {
          tipo: 'invitado',
          nombre,
          id_usuario: null
        };
        
        // Ocultar formulario, mostrar chat
        document.getElementById('chatInitialForm').style.display = 'none';
        document.getElementById('chatMessagesContainer').style.display = 'flex';
        document.getElementById('chatInputContainer').style.display = 'flex';
        
        // Conectar WebSocket
        this.connectWebSocket();
        
        // Cargar mensajes
        await this.loadMessages();
      } else {
        alert('Error al iniciar el chat');
        button.disabled = false;
        button.innerHTML = '<svg>...</svg> Iniciar Chat';
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
      button.disabled = false;
      button.innerHTML = '<svg>...</svg> Iniciar Chat';
    }
  }
  
  // =====================================================
  // VERIFICAR CONVERSACIÓN ACTIVA
  // =====================================================
  
  async checkActiveConversation() {
    if (!this.userInfo || this.userInfo.tipo === 'invitado') return;
    
    try {
      const API_URL = window.API_URL || 'http://localhost:3000/api';
      const response = await fetch(
        `${API_URL}/chat/mi-conversacion?tipo_usuario=${this.userInfo.tipo}&id_usuario=${this.userInfo.id_usuario}`
      );
      
      const result = await response.json();
      
      if (result.success && result.data) {
        this.conversationId = result.data.conversacion.id_conversacion;
        this.connectWebSocket();
        this.loadMessages();
      }
    } catch (error) {
      console.error('Error al verificar conversación:', error);
    }
  }
  
  // =====================================================
  // CARGAR MENSAJES
  // =====================================================
  
  async loadMessages() {
    if (!this.conversationId) return;
    
    try {
      const API_URL = window.API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/chat/conversacion/${this.conversationId}`);
      const result = await response.json();
      
      if (result.success) {
        const container = document.getElementById('chatMessagesContainer');
        container.innerHTML = '';
        
        result.data.mensajes.forEach(msg => {
          this.addMessageToUI(msg, false);
        });
        
        this.scrollToBottom();
        
        // Marcar como leídos
        this.markAsRead();
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  }
  
  // =====================================================
  // ENVIAR MENSAJE
  // =====================================================
  
  sendMessage() {
    const input = document.getElementById('chatMessageInput');
    const mensaje = input.value.trim();
    
    if (!mensaje || !this.isConnected) return;
    
    this.ws.send(JSON.stringify({
      type: 'message',
      data: {
        id_conversacion: this.conversationId,
        mensaje
      }
    }));
    
    input.value = '';
    this.stopTyping();
  }
  
  // =====================================================
  // AGREGAR MENSAJE A LA UI
  // =====================================================
  
  addMessageToUI(messageData, playSound = true) {
    const container = document.getElementById('chatMessagesContainer');
    const isSent = messageData.tipo_remitente === this.userInfo.tipo || 
                   (messageData.nombre_remitente === this.userInfo.nombre && messageData.tipo_remitente === 'invitado');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isSent ? 'sent' : 'received'}`;
    
    const avatar = isSent ? this.userInfo.nombre.charAt(0).toUpperCase() : '👤';
    const time = new Date(messageData.fecha_envio).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
      <div class="chat-message-avatar">${avatar}</div>
      <div class="chat-message-bubble">
        <div class="chat-message-sender">${messageData.nombre_remitente}</div>
        <p class="chat-message-text">${this.escapeHtml(messageData.mensaje)}</p>
        <div class="chat-message-time">${time}</div>
      </div>
    `;
    
    container.appendChild(messageDiv);
    this.scrollToBottom();
    
    if (!isSent && playSound) {
      this.playMessageSound();
      this.updateNotificationBadge();
    }
  }
  
  // =====================================================
  // INDICADOR DE ESCRITURA
  // =====================================================
  
  handleTyping() {
    if (!this.isTyping) {
      this.isTyping = true;
      this.ws.send(JSON.stringify({
        type: 'typing',
        data: {
          id_conversacion: this.conversationId,
          isTyping: true
        }
      }));
    }
    
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  }
  
  stopTyping() {
    if (this.isTyping) {
      this.isTyping = false;
      this.ws.send(JSON.stringify({
        type: 'typing',
        data: {
          id_conversacion: this.conversationId,
          isTyping: false
        }
      }));
    }
  }
  
  showTypingIndicator() {
    const indicator = document.getElementById('chatTypingIndicator');
    indicator.style.display = 'flex';
    
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 3000);
  }
  
  // =====================================================
  // MARCAR COMO LEÍDO
  // =====================================================
  
  async markAsRead() {
    if (!this.conversationId || !this.isConnected) return;
    
    this.ws.send(JSON.stringify({
      type: 'read',
      data: {
        id_conversacion: this.conversationId
      }
    }));
    
    // Resetear badge
    this.updateNotificationBadge(0);
  }
  
  // =====================================================
  // UTILIDADES
  // =====================================================
  
  toggleWidget() {
    const container = document.getElementById('chatWidgetContainer');
    const isActive = container.classList.contains('active');
    
    if (isActive) {
      this.closeWidget();
    } else {
      this.openWidget();
    }
  }
  
  openWidget() {
    document.getElementById('chatWidgetContainer').classList.add('active');
    
    if (this.conversationId && !this.isConnected) {
      this.connectWebSocket();
    }
    
    if (this.conversationId) {
      this.markAsRead();
    }
    
    // Focus en input si está visible
    setTimeout(() => {
      const input = document.getElementById('chatMessageInput');
      if (input.offsetParent !== null) {
        input.focus();
      }
    }, 300);
  }
  
  closeWidget() {
    document.getElementById('chatWidgetContainer').classList.remove('active');
  }
  
  scrollToBottom() {
    const container = document.getElementById('chatMessagesContainer');
    container.scrollTop = container.scrollHeight;
  }
  
  playMessageSound() {
    try {
      this.messageSound();
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  }
  
  updateNotificationBadge(count = null) {
    const badge = document.getElementById('chatNotificationBadge');
    
    if (count === null) {
      const currentCount = parseInt(badge.textContent) || 0;
      count = currentCount + 1;
    }
    
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
  
  showConnectionStatus(message, type = 'warning') {
    const status = document.getElementById('chatConnectionStatus');
    status.textContent = message;
    status.className = `chat-connection-status show ${type}`;
  }
  
  hideConnectionStatus() {
    const status = document.getElementById('chatConnectionStatus');
    status.classList.remove('show');
  }
  
  disableChat() {
    document.getElementById('chatMessageInput').disabled = true;
    document.getElementById('chatSendButton').disabled = true;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// =====================================================
// INICIALIZAR WIDGET AL CARGAR LA PÁGINA
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  window.chatWidget = new ChatWidget();
  console.log('💬 Chat Widget inicializado');
});
