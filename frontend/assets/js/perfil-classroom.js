// =====================================================
// PERFIL CLASSROOM - JavaScript
// =====================================================

const API_URL = window.API_URL || "http://localhost:3000/api";

// Variables globales
let userId = null;
let userRol = null;
let userData = null;

// =====================================================
// INICIALIZACIÓN
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM cargado, iniciando perfil...');
  
  // Verificar sesión
  const sesionValida = verificarSesion();
  
  if (!sesionValida) {
    console.error('❌ Sesión no válida, redirigiendo...');
    return;
  }
  
  // Inicializar tema
  inicializarTema();
  
  // Event listeners con verificación
  const formDatos = document.getElementById('formDatosPersonales');
  if (formDatos) {
    formDatos.addEventListener('submit', guardarDatosPersonales);
    console.log('✓ Event listener del formulario agregado');
  } else {
    console.warn('⚠️ No se encontró formDatosPersonales');
  }
  
  const btnTheme = document.getElementById('toggleTheme');
  if (btnTheme) {
    btnTheme.addEventListener('click', toggleTema);
    console.log('✓ Event listener del tema agregado');
  } else {
    console.warn('⚠️ No se encontró toggleTheme');
  }
  
  // Inicializar Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
    console.log('✓ Lucide icons inicializados');
  }
  
  // Cargar datos del perfil
  if (userId) {
    console.log(`✓ Cargando perfil para userId: ${userId}`);
    cargarPerfilCompleto();
  } else {
    console.error('❌ No se pudo obtener userId');
  }
});

// =====================================================
// VERIFICAR SESIÓN
// =====================================================

function verificarSesion() {
  userRol = localStorage.getItem('rol');
  
  // SIEMPRE usar id_usuario para la API
  userId = localStorage.getItem('id_usuario');
  
  console.log('🔍 Verificando sesión:', {
    userId: userId,
    userRol: userRol,
    id_alumno: localStorage.getItem('id_alumno'),
    id_profesor: localStorage.getItem('id_profesor')
  });
  
  if (!userId || !userRol) {
    Swal.fire({
      icon: 'warning',
      title: 'Sesión no encontrada',
      text: 'Por favor inicia sesión primero',
      confirmButtonText: 'Ir al Login'
    }).then(() => {
      window.location.href = 'classroom-login.html';
    });
    return false;
  }
  
  console.log(`📋 Perfil cargando para: userId=${userId}, rol=${userRol}`);
  return true;
}

// =====================================================
// TEMA (DARK MODE)
// =====================================================

function inicializarTema() {
  const temaGuardado = localStorage.getItem('tema') || 'light';
  const btnTheme = document.getElementById('toggleTheme');
  
  if (!btnTheme) {
    console.warn('⚠️ Botón de tema no encontrado');
    return;
  }
  
  const iconoTema = btnTheme.querySelector('i');
  
  if (temaGuardado === 'dark') {
    document.body.classList.add('dark-mode');
    if (iconoTema) iconoTema.setAttribute('data-lucide', 'moon');
  } else {
    document.body.classList.remove('dark-mode');
    if (iconoTema) iconoTema.setAttribute('data-lucide', 'sun');
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log(`✓ Tema inicializado: ${temaGuardado}`);
}

function toggleTema() {
  const isDark = document.body.classList.toggle('dark-mode');
  const btnTheme = document.getElementById('toggleTheme');
  
  if (!btnTheme) return;
  
  const iconoTema = btnTheme.querySelector('i');
  
  if (isDark) {
    localStorage.setItem('tema', 'dark');
    if (iconoTema) iconoTema.setAttribute('data-lucide', 'moon');
  } else {
    localStorage.setItem('tema', 'light');
    if (iconoTema) iconoTema.setAttribute('data-lucide', 'sun');
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log(`✓ Tema cambiado a: ${isDark ? 'dark' : 'light'}`);
}

// =====================================================
// NAVEGACIÓN ENTRE SECCIONES
// =====================================================

function cambiarSeccion(seccionId) {
  console.log(`🔄 Cambiando a sección: ${seccionId}`);
  
  // Remover active de todas las secciones y nav items
  document.querySelectorAll('.perfil-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  
  // Activar la sección seleccionada
  const seccion = document.getElementById(seccionId);
  const navItem = document.querySelector(`[data-section="${seccionId}"]`);
  
  if (seccion) {
    seccion.classList.add('active');
    console.log(`✓ Sección activada: ${seccionId}`);
  } else {
    console.warn(`⚠️ Sección no encontrada: ${seccionId}`);
  }
  
  if (navItem) {
    navItem.classList.add('active');
  } else {
    console.warn(`⚠️ Nav item no encontrado para: ${seccionId}`);
  }
}

// =====================================================
// CARGAR DATOS DEL PERFIL
// =====================================================

async function cargarPerfilCompleto() {
  try {
    console.log(`🔄 Cargando perfil para userId: ${userId}`);
    const response = await fetch(`${API_URL}/classroom/perfil/${userId}`);
    const data = await response.json();
    
    console.log('📦 Respuesta del servidor:', data);
    
    if (response.ok && data.success) {
      userData = data.perfil;
      console.log('✅ Datos del perfil cargados:', userData);
      
      // Guardar id_alumno o id_profesor si vienen en la respuesta
      if (userData.id_alumno) {
        localStorage.setItem('id_alumno', userData.id_alumno);
        console.log('✓ id_alumno guardado en localStorage:', userData.id_alumno);
      }
      if (userData.id_profesor) {
        localStorage.setItem('id_profesor', userData.id_profesor);
        console.log('✓ id_profesor guardado en localStorage:', userData.id_profesor);
      }
      
      mostrarDatosEnUI(userData);
      
    } else {
      throw new Error(data.message || 'Error al cargar el perfil');
    }
  } catch (error) {
    console.error('❌ Error al cargar perfil:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `No se pudo cargar la información del perfil: ${error.message}`
    });
  }
}

function mostrarDatosEnUI(perfil) {
  console.log('🎨 Mostrando datos en UI:', perfil);
  
  // Helper para actualizar elemento de forma segura
  const updateElement = (id, value, prop = 'textContent') => {
    const el = document.getElementById(id);
    if (el) {
      el[prop] = value;
      return true;
    }
    console.warn(`⚠️ Elemento no encontrado: ${id}`);
    return false;
  };
  
  // Header del perfil
  const iniciales = obtenerIniciales(perfil.nombre, perfil.apellido);
  const avatarContainer = document.getElementById('profileAvatar');
  const avatarInitials = document.getElementById('avatarInitials');
  
  // Mostrar avatar o iniciales
  if (perfil.avatar) {
    // Si tiene avatar, mostrar la imagen
    const BASE_URL = window.BASE_URL || 'http://localhost:3000';
    const avatarUrl = `${BASE_URL}${perfil.avatar}`;
    
    if (avatarContainer) {
      avatarContainer.style.backgroundImage = `url(${avatarUrl})`;
      avatarContainer.style.backgroundSize = 'cover';
      avatarContainer.style.backgroundPosition = 'center';
      console.log('✓ Avatar cargado como background:', avatarUrl);
    }
    
    if (avatarInitials) {
      avatarInitials.style.display = 'none'; // Ocultar iniciales
    }
  } else {
    // Si no tiene avatar, mostrar iniciales
    if (avatarContainer) {
      avatarContainer.style.backgroundImage = 'none';
    }
    
    if (avatarInitials) {
      avatarInitials.style.display = 'flex';
      avatarInitials.textContent = iniciales;
      console.log('✓ Mostrando iniciales:', iniciales);
    }
  }
  
  updateElement('profileName', `${perfil.nombre} ${perfil.apellido}`);
  updateElement('profileRole', capitalizar(perfil.rol));
  updateElement('profileUsername', perfil.username);
  
  const fechaRegistro = perfil.fecha_creacion ? new Date(perfil.fecha_creacion).getFullYear() : '2025';
  updateElement('profileJoined', fechaRegistro);
  console.log('✓ Header actualizado');
  
  // Info cards
  updateElement('infoEmail', perfil.email || 'No especificado');
  updateElement('infoTelefono', perfil.telefono || 'No especificado');
  updateElement('infoFechaNac', perfil.fecha_nacimiento ? formatearFecha(perfil.fecha_nacimiento) : 'No especificado');
  updateElement('infoDireccion', perfil.direccion || 'No especificado');
  console.log('✓ Info cards actualizadas');
  
  // Biografía (mostrar en la sección de información general)
  updateElement('biografiaDisplay', perfil.biografia || 'Sin biografía');
  console.log('✓ Biografía actualizada');
  
  // Formulario editable
  updateElement('inputNombre', perfil.nombre || '', 'value');
  updateElement('inputApellido', perfil.apellido || '', 'value');
  updateElement('inputEmail', perfil.email || '', 'value');
  updateElement('inputTelefono', perfil.telefono || '', 'value');
  updateElement('inputFechaNac', perfil.fecha_nacimiento || '', 'value');
  updateElement('inputDireccion', perfil.direccion || '', 'value');
  updateElement('inputBiografia', perfil.biografia || '', 'value');
  console.log('✓ Formulario actualizado');
  
  // Estadísticas
  updateElement('ultimaActividad', 'Hoy');
  updateElement('ultimaActividadDetalle', 'Hace pocos minutos');
  
  console.log('✅ UI completamente actualizada');
}

// =====================================================
// GUARDAR DATOS PERSONALES
// =====================================================

async function guardarDatosPersonales(e) {
  e.preventDefault();
  console.log('💾 Guardando datos personales...');
  
  const datosActualizados = {
    nombre: document.getElementById('inputNombre').value.trim(),
    apellido: document.getElementById('inputApellido').value.trim(),
    email: document.getElementById('inputEmail').value.trim(),
    telefono: document.getElementById('inputTelefono').value.trim(),
    fecha_nacimiento: document.getElementById('inputFechaNac').value,
    direccion: document.getElementById('inputDireccion').value.trim()
  };
  
  console.log('📤 Datos a enviar:', datosActualizados);
  
  // Validaciones
  if (!datosActualizados.nombre || !datosActualizados.apellido) {
    console.warn('⚠️ Validación fallida: nombre y apellido requeridos');
    Swal.fire({
      icon: 'warning',
      title: 'Campos requeridos',
      text: 'Nombre y apellido son obligatorios'
    });
    return;
  }
  
  try {
    console.log(`🌐 PUT request a: ${API_URL}/classroom/perfil/${userId}`);
    const response = await fetch(`${API_URL}/classroom/perfil/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosActualizados)
    });
    
    const data = await response.json();
    console.log('📦 Respuesta del servidor:', data);
    
    if (response.ok && data.success) {
      console.log('✅ Datos guardados exitosamente');
      Swal.fire({
        icon: 'success',
        title: '¡Datos actualizados!',
        text: 'Tu información ha sido guardada correctamente',
        timer: 2000
      });
      
      // Actualizar localStorage
      localStorage.setItem('nombre', `${datosActualizados.nombre} ${datosActualizados.apellido}`);
      
      // Recargar perfil
      cargarPerfilCompleto();
    } else {
      throw new Error(data.message || 'Error al guardar');
    }
  } catch (error) {
    console.error('❌ Error al guardar datos:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `No se pudieron guardar los cambios: ${error.message}`
    });
  }
}

function cancelarEdicion() {
  // Recargar los datos originales
  if (userData) {
    document.getElementById('inputNombre').value = userData.nombre || '';
    document.getElementById('inputApellido').value = userData.apellido || '';
    document.getElementById('inputEmail').value = userData.email || '';
    document.getElementById('inputTelefono').value = userData.telefono || '';
    document.getElementById('inputFechaNac').value = userData.fecha_nacimiento || '';
    document.getElementById('inputDireccion').value = userData.direccion || '';
  }
  
  Swal.fire({
    icon: 'info',
    title: 'Cambios cancelados',
    timer: 1500,
    showConfirmButton: false
  });
}

// =====================================================
// CAMBIAR AVATAR
// =====================================================

async function cambiarAvatar(event) {
  const file = event.target.files[0];
  
  if (!file) return;
  
  // Validar tipo de archivo
  if (!file.type.startsWith('image/')) {
    Swal.fire({
      icon: 'error',
      title: 'Archivo inválido',
      text: 'Por favor selecciona una imagen'
    });
    return;
  }
  
  // Validar tamaño (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    Swal.fire({
      icon: 'error',
      title: 'Archivo muy grande',
      text: 'La imagen debe pesar menos de 2MB'
    });
    return;
  }
  
  const formData = new FormData();
  formData.append('avatar', file);
  
  console.log('📤 Subiendo avatar...');
  
  try {
    const response = await fetch(`${API_URL}/classroom/perfil/${userId}/avatar`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Avatar subido exitosamente:', data.avatar);
      
      // Actualizar el avatar en la UI inmediatamente
      const avatarContainer = document.getElementById('profileAvatar');
      const avatarInitials = document.getElementById('avatarInitials');
      const BASE_URL = window.BASE_URL || 'http://localhost:3000';
      const avatarUrl = `${BASE_URL}${data.avatar}`;
      
      if (avatarContainer) {
        avatarContainer.style.backgroundImage = `url(${avatarUrl})`;
        avatarContainer.style.backgroundSize = 'cover';
        avatarContainer.style.backgroundPosition = 'center';
        console.log('✓ Avatar actualizado en UI');
      }
      
      if (avatarInitials) {
        avatarInitials.style.display = 'none'; // Ocultar iniciales
      }
      
      // Actualizar también userData para que persista
      if (userData) {
        userData.avatar = data.avatar;
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Avatar actualizado!',
        text: 'Tu foto de perfil se ha actualizado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      throw new Error(data.message || 'Error al subir avatar');
    }
  } catch (error) {
    console.error('Error al cambiar avatar:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo actualizar el avatar'
    });
  }
}

// =====================================================
// GUARDAR BIOGRAFÍA
// =====================================================

async function guardarBiografia() {
  const biografia = document.getElementById('inputBiografia').value.trim();
  
  console.log('💾 Guardando biografía...');
  
  try {
    const response = await fetch(`${API_URL}/classroom/perfil/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ biografia })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Actualizar también el elemento de visualización
      const biografiaDisplay = document.getElementById('biografiaDisplay');
      if (biografiaDisplay) {
        biografiaDisplay.textContent = biografia || 'Sin biografía';
      }
      
      console.log('✅ Biografía guardada y actualizada');
      
      Swal.fire({
        icon: 'success',
        title: '¡Biografía guardada!',
        text: 'Tu biografía se ha actualizado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Recargar perfil completo para asegurar sincronización
      cargarPerfilCompleto();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Error al guardar biografía:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo guardar la biografía'
    });
  }
}

// =====================================================
// ACCIONES RÁPIDAS
// =====================================================

function irAlDashboard() {
  const rol = userRol.toLowerCase();
  window.location.href = `dashboard_${rol}.html`;
}

async function exportarMisDatos() {
  try {
    Swal.fire({
      title: 'Generando exportación...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    // Simular exportación (aquí podrías generar un PDF o JSON)
    setTimeout(() => {
      const datosExportar = {
        perfil: userData,
        fecha_exportacion: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(datosExportar, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mi_perfil_${userId}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      Swal.fire({
        icon: 'success',
        title: '¡Datos exportados!',
        text: 'Tu archivo se ha descargado',
        timer: 2000
      });
    }, 1500);
  } catch (error) {
    console.error('Error al exportar datos:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron exportar los datos'
    });
  }
}

// =====================================================
// UTILIDADES
// =====================================================

function obtenerIniciales(nombre, apellido) {
  const n = (nombre || '').charAt(0).toUpperCase();
  const a = (apellido || '').charAt(0).toUpperCase();
  return n + a || 'US';
}

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatearFecha(fecha) {
  if (!fecha) return 'No especificado';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-AR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
