// Admin Chat Manager - Basado en UserChatManager
class AdminChatManager {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.conversations = [];
    this.activeConversation = null;
    this.adminInfo = null;
    this.audioContext = null;
    this.audioInitialized = false;
    this.WS_URL = window.WS_URL || 'ws://localhost:3000';
    
    this.initMessageSound();
  }
  
  init() {
    this.loadAdminInfo();
    this.connectWebSocket();
    
    // Inicializar AudioContext con el primer clic del usuario
    document.addEventListener('click', () => {
      this.initAudioContext();
    }, { once: true });
  }
  
  initMessageSound() {
    this.audioContext = null;
    this.audioInitialized = false;
  }
  
  initAudioContext() {
    if (!this.audioInitialized) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioInitialized = true;
        console.log('✅ AudioContext inicializado (Admin)');
      } catch (error) {
        console.error('Error al inicializar AudioContext:', error);
      }
    }
  }
  
  playMessageSound() {
    if (!this.audioInitialized) {
      this.initAudioContext();
    }
    
    try {
      if (!this.audioContext) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = 900;
      oscillator.type = 'sine';
      
      const currentTime = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.3, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.3);
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  }
  
  showNotification(title, message) {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones de escritorio');
      return;
    }
    
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message.substring(0, 100),
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        tag: 'chat-message',
        requireInteraction: false
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body: message.substring(0, 100),
            icon: '/images/logo.png',
            badge: '/images/logo.png',
            tag: 'chat-message',
            requireInteraction: false
          });
        }
      });
    }
  }
  
  updateNotificationBadge(count) {
    const badge = document.getElementById('chatNotificationBadge');
    if (!badge) {
      console.error('❌ No se encontró el elemento chatNotificationBadge');
      return;
    }
    
    console.log('🔔 Admin badge actualizado con count:', count);
    
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
  
  clearNotificationBadge() {
    this.updateNotificationBadge(0);
  }
  
  loadAdminInfo() {
    this.adminInfo = {
      id_usuario: localStorage.getItem('id_usuario'),
      nombre: localStorage.getItem('nombre') || 'Admin',
      tipo: 'admin'
    };
  }
  
  connectWebSocket() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('⚠️ WebSocket ya está conectado o conectándose');
      return;
    }
    
    console.log('🔌 Conectando WebSocket del admin chat...');
    this.ws = new WebSocket(`${this.WS_URL}/chat`);
    
    this.ws.onopen = () => {
      console.log('✅ Admin Chat WebSocket conectado');
      this.isConnected = true;
      this.authenticate();
      this.loadConversations();
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleWebSocketMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('🔴 Admin Chat WebSocket desconectado');
      this.isConnected = false;
      setTimeout(() => this.connectWebSocket(), 3000);
    };
    
    this.ws.onerror = (error) => {
      console.error('❌ Error en WebSocket:', error);
    };
  }
  
  authenticate() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    this.ws.send(JSON.stringify({
      type: 'auth',
      data: {
        tipo: 'admin',
        id_usuario: this.adminInfo.id_usuario,
        nombre: this.adminInfo.nombre,
        id_conversacion: null
      }
    }));
  }
  
  handleWebSocketMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'authenticated':
        console.log('✅ Admin autenticado');
        break;
        
      case 'new_message':
        this.handleNewMessage(data);
        break;
        
      case 'typing':
        this.handleTyping(data);
        break;
        
      case 'conversation_closed':
        this.handleConversationClosed();
        break;
        
      case 'joined_conversation':
        console.log('✅ Admin confirmó unión a conversación:', data);
        break;
        
      default:
        console.log('📨 Mensaje no manejado:', type, data);
    }
  }
  
  handleNewMessage(data) {
    console.log('📨 Admin recibió mensaje:', data);
    
    // Verificar si es mensaje propio del admin
    const esMensajePropio = data.tipo_remitente === 'admin';
    
    // Si es mensaje propio, NO hacer nada (ya se agregó con optimistic update)
    if (esMensajePropio) {
      console.log('⏭️ Mensaje propio, ignorando (ya está en UI)');
      return;
    }
    
    // Reproducir sonido y notificación para mensajes recibidos
    this.playMessageSound();
    const nombreRemitente = data.nombre_remitente || data.nombre_usuario || 'Usuario';
    this.showNotification(`Nuevo mensaje de ${nombreRemitente}`, data.mensaje);
    
    // Verificar si el chat está visible en pantalla
    const chatContainer = document.getElementById('adminChatContainer');
    const isChatVisible = chatContainer && chatContainer.offsetParent !== null;
    
    console.log('🖥️ Chat visible:', isChatVisible);
    console.log('📝 Conversación activa:', this.activeConversation?.id_conversacion);
    
    // Si el chat está visible Y es la conversación activa, actualizar UI
    if (isChatVisible && this.activeConversation && this.activeConversation.id_conversacion === data.id_conversacion) {
      console.log('✅ Agregando mensaje a conversación activa');
      this.addMessageToUI(data);
      this.scrollToBottom();
      
      // Actualizar el preview en la lista de conversaciones
      const conv = this.conversations.find(c => c.id_conversacion === data.id_conversacion);
      if (conv) {
        conv.ultimo_mensaje = data.mensaje;
        conv.fecha_ultimo_mensaje = data.fecha_envio || new Date().toISOString();
        this.renderConversationsList();
      }
      
      // Si estamos viendo el chat, marcar como leído automáticamente
      if (!esMensajePropio) {
        this.markAsRead(data.id_conversacion);
      }
    } else {
      // Si el chat NO está visible o no hay conversación activa
      console.log('🔔 Mensaje recibido (chat no visible), actualizando badge desde BD');
      
      // Recargar conversaciones para actualizar badge desde BD
      this.loadConversations();
    }
  }
  
  handleTyping(data) {
    if (this.activeConversation && this.activeConversation.id_conversacion === data.id_conversacion) {
      this.showTypingIndicator(data.nombre, data.isTyping);
    }
  }
  
  handleConversationClosed() {
    Swal.fire({
      icon: 'info',
      title: 'Conversación cerrada',
      text: 'Esta conversación ha sido cerrada.'
    });
    this.activeConversation = null;
    this.loadConversations();
    this.renderMessages();
  }
  
  async loadConversations() {
    try {
      const API_URL = window.API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/chat/conversaciones`);
      const result = await response.json();
      
      if (result.success) {
        this.conversations = result.data;
        
        console.log('✅ Conversaciones cargadas:', this.conversations.length);
        
        // Calcular total de mensajes no leídos por el admin
        const totalNoLeidos = this.conversations.reduce((sum, conv) => {
          return sum + (conv.mensajes_no_leidos_admin || 0);
        }, 0);
        
        console.log('📊 Total mensajes no leídos por admin:', totalNoLeidos);
        this.updateNotificationBadge(totalNoLeidos);
        
        // Unirse a TODAS las conversaciones automáticamente para recibir notificaciones
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.conversations.forEach(conv => {
            console.log('🔌 Admin uniéndose a conversación:', conv.id_conversacion);
            this.ws.send(JSON.stringify({
              type: 'join_conversation',
              data: { id_conversacion: conv.id_conversacion }
            }));
          });
        }
        
        this.renderConversationsList();
      } else {
        console.log('ℹ️ No hay conversaciones');
        this.conversations = [];
        this.updateNotificationBadge(0);
        this.renderConversationsList();
      }
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  }
  
  renderConversationsList() {
    const container = document.getElementById('adminChatConversationsList');
    if (!container) return;
    
    if (this.conversations.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: #9ca3af;">
          <i data-lucide="inbox" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5;"></i>
          <p>No hay conversaciones activas</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }
    
    container.innerHTML = this.conversations.map(conv => {
      const nombre = conv.nombre_completo_usuario || conv.nombre_invitado || 'Usuario';
      const iniciales = nombre.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
      const tiempo = this.formatTime(conv.fecha_ultimo_mensaje || conv.fecha_inicio);
      const preview = conv.ultimo_mensaje || 'Sin mensajes';
      const noLeidos = conv.mensajes_no_leidos_admin || 0;
      const tipoLabel = conv.tipo_usuario === 'profesor' ? 'Profesor' : conv.tipo_usuario === 'alumno' ? 'Alumno' : 'Usuario';
      
      return `
        <div class="user-chat-conversation-item ${this.activeConversation && this.activeConversation.id_conversacion === conv.id_conversacion ? 'active' : ''}" 
             onclick="adminChatManager.selectConversation(${conv.id_conversacion})">
          <div class="user-chat-conv-avatar">${iniciales}</div>
          <div class="user-chat-conv-info">
            <div class="user-chat-conv-header">
              <span class="user-chat-conv-name">${nombre}</span>
              <span class="user-chat-conv-time">${tiempo}</span>
            </div>
            <div class="user-chat-conv-preview">
              <span class="user-chat-conv-tipo">${tipoLabel}</span>
              <span class="user-chat-conv-message">${preview}</span>
            </div>
          </div>
          ${noLeidos > 0 ? `<div class="user-chat-unread-badge">${noLeidos}</div>` : ''}
        </div>
      `;
    }).join('');
    
    lucide.createIcons();
  }
  
  async selectConversation(id) {
    console.log('📍 Admin seleccionando conversación:', id, 'tipo:', typeof id);
    
    // Convertir id a número para comparación
    const idNum = parseInt(id);
    const conv = this.conversations.find(c => c.id_conversacion == idNum); // usar == para comparación flexible
    
    if (!conv) {
      console.error('❌ No se encontró conversación con ID:', id);
      console.error('📋 Conversaciones disponibles:', this.conversations.map(c => ({id: c.id_conversacion, nombre: c.nombre_completo_usuario})));
      return;
    }
    
    console.log('✅ Conversación encontrada:', conv.nombre_completo_usuario || conv.nombre_invitado);
    this.activeConversation = conv;
    this.renderConversationsList();
    
    // Mostrar header y área de input cuando se selecciona una conversación
    const header = document.getElementById('adminChatHeader');
    const inputArea = document.getElementById('adminChatInputArea');
    if (header) {
      header.style.display = 'flex';
      // Actualizar el nombre en el header
      const headerTitle = header.querySelector('h3');
      if (headerTitle) {
        headerTitle.textContent = conv.nombre_completo_usuario || conv.nombre_invitado || 'Usuario';
      }
      // Recrear los iconos de Lucide después de actualizar
      lucide.createIcons();
    }
    if (inputArea) inputArea.style.display = 'flex';
    
    // Unirse a la conversación vía WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔌 Admin uniéndose a conversación vía WebSocket:', id);
      this.ws.send(JSON.stringify({
        type: 'join_conversation',
        data: { id_conversacion: id }
      }));
    }
    
    // Cargar mensajes
    await this.loadMessages(id);
    this.markAsRead(id);
  }
  
  async loadMessages(id) {
    try {
      const API_URL = window.API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/chat/conversacion/${id}`);
      const result = await response.json();
      
      if (result.success) {
        if (this.activeConversation) {
          this.activeConversation.mensajes = result.data?.mensajes || [];
          console.log(`📨 Mensajes cargados para conversación ${id}:`, this.activeConversation.mensajes.length);
          this.renderMessages();
        }
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  }
  
  renderMessages() {
    const container = document.getElementById('adminChatMessagesContainer');
    if (!container) return;
    
    if (!this.activeConversation) {
      container.innerHTML = `
        <div class="user-chat-empty">
          <i data-lucide="message-square" style="width: 64px; height: 64px;"></i>
          <p>Selecciona una conversación</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }
    
    const mensajes = this.activeConversation.mensajes || [];
    
    if (mensajes.length === 0) {
      container.innerHTML = `
        <div class="user-chat-empty">
          <i data-lucide="message-circle" style="width: 64px; height: 64px;"></i>
          <p>No hay mensajes aún</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }
    
    container.innerHTML = mensajes.map(msg => {
      const isAdmin = msg.es_admin === 1 || msg.tipo_remitente === 'admin';
      const time = new Date(msg.fecha_envio).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      let nombreMostrar = '';
      let tipoUsuario = '';
      
      if (isAdmin) {
        nombreMostrar = msg.nombre_remitente || 'Admin';
        tipoUsuario = '';
      } else {
        nombreMostrar = msg.nombre_remitente || 'Usuario';
        // Determinar tipo de usuario desde la conversación activa o del mensaje
        const tipo = msg.tipo_remitente || this.activeConversation?.tipo_usuario || '';
        if (tipo === 'profesor') {
          tipoUsuario = ' (Profesor)';
        } else if (tipo === 'alumno') {
          tipoUsuario = ' (Alumno)';
        }
      }
      
      const inicial = nombreMostrar.charAt(0).toUpperCase();
      
      // Renderizar contenido del mensaje (texto o archivo)
      let mensajeContent = '';
      if (msg.archivo_adjunto) {
        // Es un archivo adjunto
        if (msg.tipo_archivo === 'image') {
          // Mostrar imagen
          mensajeContent = `
            <div class="chat-file-attachment">
              <img src="${msg.archivo_adjunto}" alt="Imagen adjunta" class="chat-image-preview" onclick="window.open('${msg.archivo_adjunto}', '_blank')" />
            </div>
          `;
        } else if (msg.tipo_archivo === 'pdf') {
          // Mostrar enlace a PDF
          const nombreArchivo = msg.archivo_adjunto.split('/').pop();
          mensajeContent = `
            <div class="chat-file-attachment pdf">
              <div class="chat-pdf-icon">
                <i data-lucide="file-text" style="width: 32px; height: 32px; color: #e53935;"></i>
              </div>
              <div class="chat-pdf-info">
                <div class="chat-pdf-name">${nombreArchivo}</div>
                <div class="chat-pdf-type">Documento PDF</div>
              </div>
              <a href="${msg.archivo_adjunto}" download class="chat-pdf-download" title="Descargar PDF">
                <i data-lucide="download" style="width: 20px; height: 20px;"></i>
              </a>
            </div>
          `;
        }
      } else {
        // Mensaje de texto normal
        mensajeContent = `<div class="user-chat-message-bubble">${this.escapeHtml(msg.mensaje)}</div>`;
      }
      
      return `
        <div class="user-chat-message ${isAdmin ? 'sent' : 'received'}">
          <div class="user-chat-message-avatar">${inicial}</div>
          <div class="user-chat-message-content">
            <div class="user-chat-message-header">
              <span class="user-chat-message-sender">${nombreMostrar}${tipoUsuario}</span>
              <span class="user-chat-message-time">${time}</span>
            </div>
            ${mensajeContent}
          </div>
        </div>
      `;
    }).join('');
    
    this.scrollToBottom();
  }
  
  addMessageToUI(data) {
    const container = document.getElementById('adminChatMessagesContainer');
    if (!container) return;
    
    const isAdmin = data.tipo_remitente === 'admin';
    const time = new Date(data.fecha_envio || new Date()).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let nombreMostrar = '';
    let tipoUsuario = '';
    
    if (isAdmin) {
      nombreMostrar = data.nombre_remitente || 'Admin';
      tipoUsuario = '';
    } else {
      nombreMostrar = data.nombre_remitente || 'Usuario';
      // Determinar tipo de usuario
      const tipo = data.tipo_remitente || this.activeConversation?.tipo_usuario || '';
      if (tipo === 'profesor') {
        tipoUsuario = ' (Profesor)';
      } else if (tipo === 'alumno') {
        tipoUsuario = ' (Alumno)';
      }
    }
    
    const inicial = nombreMostrar.charAt(0).toUpperCase();
    
    const messageHTML = `
      <div class="user-chat-message ${isAdmin ? 'sent' : 'received'}">
        <div class="user-chat-message-avatar">${inicial}</div>
        <div class="user-chat-message-content">
          <div class="user-chat-message-header">
            <span class="user-chat-message-sender">${nombreMostrar}${tipoUsuario}</span>
            <span class="user-chat-message-time">${time}</span>
          </div>
          <div class="user-chat-message-bubble">${this.escapeHtml(data.mensaje)}</div>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', messageHTML);
    this.scrollToBottom();
  }
  
  async sendMessage() {
    const input = document.getElementById('adminChatMessageInput');
    const mensaje = input?.value.trim();
    
    if (!mensaje || !this.activeConversation) return;
    
    // Enviar via WebSocket para actualización en tiempo real
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        data: {
          id_conversacion: this.activeConversation.id_conversacion,
          mensaje: mensaje
        }
      }));
      
      input.value = '';
      console.log('✅ Mensaje enviado via WebSocket');
      
      // Agregar mensaje inmediatamente a la UI (optimistic update)
      const messageData = {
        id_conversacion: this.activeConversation.id_conversacion,
        mensaje: mensaje,
        tipo_remitente: 'admin',
        nombre_remitente: this.adminInfo.nombre,
        fecha_envio: new Date().toISOString(),
        es_admin: 1
      };
      
      this.addMessageToUI(messageData);
      
    } else {
      console.error('❌ WebSocket no conectado');
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo enviar el mensaje. Intenta de nuevo.'
      });
    }
  }
  
  // Manejar selección de archivo
  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo muy grande',
        text: 'El archivo no debe superar los 5MB'
      });
      event.target.value = '';
      return;
    }
    
    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Tipo de archivo no válido',
        text: 'Solo se permiten imágenes (JPG, PNG, WEBP) y archivos PDF'
      });
      event.target.value = '';
      return;
    }
    
    // Mostrar loading
    Swal.fire({
      title: 'Subiendo archivo...',
      text: file.name,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    // Subir archivo
    await this.uploadFile(file);
    
    // Limpiar input
    event.target.value = '';
  }
  
  // Subir archivo al servidor
  async uploadFile(file) {
    try {
      if (!this.activeConversation) {
        throw new Error('No hay conversación activa');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('id_conversacion', this.activeConversation.id_conversacion);
      formData.append('tipo_remitente', 'admin');
      formData.append('id_remitente', this.adminInfo.id_admin || '');
      formData.append('nombre_remitente', this.adminInfo.nombre);
      
      const API_URL = window.API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/chat/upload`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Archivo enviado',
          text: 'El archivo se ha enviado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Recargar mensajes para mostrar el archivo
        await this.loadConversationMessages(this.activeConversation.id_conversacion);
      } else {
        throw new Error(result.message || 'Error al subir archivo');
      }
      
    } catch (error) {
      console.error('❌ Error al subir archivo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo subir el archivo'
      });
    }
  }
  
  async markAsRead(id) {
    try {
      const API_URL = window.API_URL || 'http://localhost:3000/api';
      await fetch(`${API_URL}/chat/conversacion/${id}/leer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo_lector: 'admin' })
      });
      
      // Recargar conversaciones para actualizar badge desde BD
      await this.loadConversations();
      console.log('✅ Mensajes marcados como leídos, badge actualizado desde BD');
    } catch (error) {
      console.error('Error al marcar como leído:', error);
    }
  }
  
  async closeConversation() {
    if (!this.activeConversation) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'No hay conversación activa seleccionada'
      });
      return;
    }
    
    const nombreUsuario = this.activeConversation.nombre_completo_usuario || 
                         this.activeConversation.nombre_invitado || 
                         'Usuario';
    
    // Solicitar confirmación
    const result = await Swal.fire({
      title: '¿Cerrar conversación?',
      html: `
        <p>¿Estás seguro de cerrar la conversación con <strong>${nombreUsuario}</strong>?</p>
        <p class="text-warning" style="font-size: 0.9em; margin-top: 10px;">
          ⚠️ Esta acción eliminará la conversación permanentemente para ambos usuarios.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cerrar conversación',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const idConversacion = this.activeConversation.id_conversacion;
      const tipoUsuario = this.activeConversation.tipo_usuario;
      const idUsuario = this.activeConversation.id_usuario;
      
      // Llamar al endpoint para eliminar
      const API_URL = window.API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/chat/conversacion/${idConversacion}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_admin: this.adminInfo.id_usuario 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Notificar al usuario vía WebSocket
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'close_conversation',
            data: {
              id_conversacion: idConversacion,
              tipo_usuario: tipoUsuario,
              id_usuario: idUsuario
            }
          }));
        }
        
        Swal.fire({
          icon: 'success',
          title: 'Conversación cerrada',
          text: 'La conversación ha sido eliminada correctamente',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Limpiar conversación activa y recargar lista
        this.activeConversation = null;
        const header = document.getElementById('adminChatHeader');
        const inputArea = document.getElementById('adminChatInputArea');
        if (header) header.style.display = 'none';
        if (inputArea) inputArea.style.display = 'none';
        
        this.renderMessages();
        await this.loadConversations();
        
      } else {
        throw new Error(result.message || 'Error al cerrar conversación');
      }
      
    } catch (error) {
      console.error('❌ Error al cerrar conversación:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cerrar la conversación. Intenta de nuevo.'
      });
    }
  }
  
  scrollToBottom() {
    const container = document.getElementById('adminChatMessagesContainer');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
  
  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  showTypingIndicator(nombre, isTyping) {
    const container = document.getElementById('adminChatMessagesContainer');
    if (!container) return;
    
    const existingIndicator = document.getElementById('adminTypingIndicator');
    
    if (!isTyping) {
      if (existingIndicator) existingIndicator.remove();
      return;
    }
    
    if (!existingIndicator) {
      const indicator = document.createElement('div');
      indicator.id = 'adminTypingIndicator';
      indicator.className = 'user-chat-typing';
      indicator.innerHTML = `
        <span>${nombre} está escribiendo</span>
        <div class="user-chat-typing-dots">
          <div class="user-chat-typing-dot"></div>
          <div class="user-chat-typing-dot"></div>
          <div class="user-chat-typing-dot"></div>
        </div>
      `;
      container.appendChild(indicator);
      this.scrollToBottom();
    }
  }
  
  renderChatView() {
    const container = document.getElementById('adminChatContainer');
    container.innerHTML = `
      <div class="user-chat-full-container">
        <!-- Panel Izquierdo: Lista de Conversaciones -->
        <div class="user-chat-conversations-panel">
          <div class="user-chat-conversations-header">
            <h3>
              <i data-lucide="message-circle"></i>
              Todas las Conversaciones
            </h3>
          </div>
          <div class="user-chat-conversations-list" id="adminChatConversationsList">
            <div style="padding: 40px 20px; text-align: center; color: #9ca3af;">
              <p>Cargando...</p>
            </div>
          </div>
        </div>
        
        <!-- Panel Derecho: Chat Activo -->
        <div class="user-chat-messages-panel">
          <div class="user-chat-header" style="display: none;" id="adminChatHeader">
            <i data-lucide="message-square" style="width: 24px; height: 24px;"></i>
            <div style="flex: 1;">
              <h3>${this.activeConversation ? (this.activeConversation.nombre_completo_usuario || this.activeConversation.nombre_invitado || 'Usuario') : 'Chat de Soporte'}</h3>
              <div class="user-chat-status">
                <div class="user-chat-status-dot"></div>
                <span>En línea</span>
              </div>
            </div>
            <button 
              class="chat-close-conversation-btn" 
              onclick="adminChatManager.closeConversation()" 
              title="Cerrar y eliminar conversación">
              <i data-lucide="x-circle" style="width: 18px; height: 18px;"></i>
              <span>Cerrar Conversación</span>
            </button>
          </div>
          
          <div class="user-chat-messages" id="adminChatMessagesContainer">
            <div class="user-chat-empty">
              <i data-lucide="message-square" style="width: 64px; height: 64px;"></i>
              <p>Selecciona una conversación</p>
            </div>
          </div>
          
          <div class="user-chat-input-area" style="display: none;" id="adminChatInputArea">
            <input 
              type="file" 
              id="adminChatFileInput" 
              accept="image/*,.pdf"
              style="display: none;"
              onchange="adminChatManager.handleFileSelect(event)"
            >
            <button class="user-chat-attach-btn" onclick="document.getElementById('adminChatFileInput').click()" title="Adjuntar archivo">
              <i data-lucide="paperclip" style="width: 20px; height: 20px;"></i>
            </button>
            <input 
              type="text" 
              id="adminChatMessageInput" 
              class="user-chat-input" 
              placeholder="Escribe tu mensaje..."
              onkeypress="if(event.key === 'Enter') adminChatManager.sendMessage()"
              maxlength="1000"
            >
            <button class="user-chat-send-btn" onclick="adminChatManager.sendMessage()">
              <i data-lucide="send" style="width: 20px; height: 20px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
    
    // Cargar conversaciones después de renderizar la vista
    this.loadConversations();
  }
}
