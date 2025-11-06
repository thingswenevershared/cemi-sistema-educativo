// =====================================================
// PERFIL ESPECTADOR - CLASSROOM
// =====================================================

const API_URL = window.API_URL || 'http://localhost:3000/api';
let perfilData = null;
let userId = null;
let userType = null;

// =====================================================
// INICIALIZACIÓN
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Obtener parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  userId = urlParams.get('id');
  userType = urlParams.get('tipo'); // 'alumno' o 'profesor'
  
  if (!userId || !userType) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se especificó el usuario a visualizar'
    }).then(() => {
      window.location.href = '/classroom.html';
    });
    return;
  }
  
  // Cargar perfil
  await cargarPerfil();
  
  // Inicializar iconos
  lucide.createIcons();
  
  // Cargar tema guardado
  cargarTema();
});

// =====================================================
// CARGAR PERFIL
// =====================================================

async function cargarPerfil() {
  try {
    // Pasar el parámetro tipo en la query string
    const response = await fetch(`${API_URL}/classroom/perfil/${userId}?tipo=${userType}`);
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al cargar el perfil');
    }
    
    perfilData = data.perfil;
    mostrarDatosEnUI();
    
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo cargar el perfil del usuario'
    }).then(() => {
      window.location.href = '/classroom.html';
    });
  }
}

// =====================================================
// MOSTRAR DATOS EN UI
// =====================================================

function mostrarDatosEnUI() {
  if (!perfilData) return;
  
  // Header del perfil
  const iniciales = obtenerIniciales(perfilData.nombre, perfilData.apellido);
  const avatarContainer = document.getElementById('profileAvatar');
  const avatarInitials = document.getElementById('avatarInitials');
  
  // Mostrar avatar o iniciales
  if (perfilData.avatar) {
    const BASE_URL = window.BASE_URL || 'http://localhost:3000';
    const avatarUrl = `${BASE_URL}${perfilData.avatar}`;
    if (avatarContainer) {
      avatarContainer.style.backgroundImage = `url(${avatarUrl})`;
      avatarContainer.style.backgroundSize = 'cover';
      avatarContainer.style.backgroundPosition = 'center';
    }
    if (avatarInitials) {
      avatarInitials.style.display = 'none';
    }
  } else {
    if (avatarContainer) {
      avatarContainer.style.backgroundImage = 'none';
    }
    if (avatarInitials) {
      avatarInitials.style.display = 'flex';
      avatarInitials.textContent = iniciales;
    }
  }
  
  updateElement('profileName', `${perfilData.nombre} ${perfilData.apellido}`);
  updateElement('profileRole', capitalizar(perfilData.rol));
  updateElement('profileUsername', perfilData.username);
  
  const fechaRegistro = perfilData.fecha_creacion ? new Date(perfilData.fecha_creacion).getFullYear() : '2025';
  updateElement('profileMemberSince', `Miembro desde ${fechaRegistro}`);
  
  // Info Cards
  updateElement('infoEmail', perfilData.email || 'No especificado');
  updateElement('infoTelefono', perfilData.telefono || 'No especificado');
  updateElement('infoFechaNacimiento', formatearFecha(perfilData.fecha_nacimiento) || 'No especificado');
  updateElement('infoDireccion', perfilData.direccion || 'No especificado');
  updateElement('biografiaDisplay', perfilData.biografia || 'Sin biografía');
  
  // Datos Personales
  updateElement('dataNombreCompleto', `${perfilData.nombre} ${perfilData.apellido}`);
  updateElement('dataEmail', perfilData.email || 'No especificado');
  updateElement('dataTelefono', perfilData.telefono || 'No especificado');
  updateElement('dataFechaNacimiento', formatearFecha(perfilData.fecha_nacimiento) || 'No especificado');
  updateElement('dataDireccion', perfilData.direccion || 'No especificado');
  updateElement('dataBiografia', perfilData.biografia || 'Sin biografía');
  
  lucide.createIcons();
}

// =====================================================
// NAVEGACIÓN
// =====================================================

function cambiarSeccion(seccionId) {
  // Ocultar todas las secciones
  const secciones = document.querySelectorAll('.perfil-section');
  secciones.forEach(seccion => {
    seccion.classList.remove('active');
  });
  
  // Mostrar la sección seleccionada
  const seccionActual = document.getElementById(seccionId);
  if (seccionActual) {
    seccionActual.classList.add('active');
  }
  
  // Actualizar botones de navegación
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-section') === seccionId) {
      item.classList.add('active');
    }
  });
}

// =====================================================
// UTILIDADES
// =====================================================

function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function obtenerIniciales(nombre, apellido) {
  const inicialesNombre = nombre ? nombre.charAt(0).toUpperCase() : '';
  const inicialesApellido = apellido ? apellido.charAt(0).toUpperCase() : '';
  return inicialesNombre + inicialesApellido;
}

function formatearFecha(fecha) {
  if (!fecha) return null;
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function volverAlClassroom() {
  window.location.href = '/classroom.html';
}

// =====================================================
// TEMA
// =====================================================

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  lucide.createIcons();
}

function cargarTema() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  }
  lucide.createIcons();
}
