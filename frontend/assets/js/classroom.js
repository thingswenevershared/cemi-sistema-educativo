// =====================================================
// CEMI CLASSROOM - JavaScript Principal
// =====================================================

const API_URL = window.API_URL || "http://localhost:3000/api";

// Variables globales
let userRol = '';
let userId = '';
let userName = '';
let cursoActivo = null; // null = todos los cursos, number = curso específico
let cursosDisponibles = [];
let vistaCalendarioActual = 'mes'; // mes, semana, dia
let perfilUsuario = null; // Almacenar datos del perfil del usuario

// Elementos del DOM
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const userMenuBtn = document.getElementById('userMenuBtn');
const userDropdown = document.getElementById('userDropdown');
const navItems = document.querySelectorAll('.nav-item');
const contentViews = document.querySelectorAll('.content-view');
const logoutBtn = document.getElementById('logoutClassroom');

// =====================================================
// FUNCIÓN: CARGAR AVATAR DEL USUARIO
// =====================================================

async function cargarAvatarUsuario() {
  try {
    // Obtener ID del usuario según el rol
    const idUsuario = localStorage.getItem('id_usuario') || userId;
    
    if (!idUsuario) {
      console.log('⚠️ No se pudo obtener ID de usuario para cargar avatar');
      return;
    }
    
    console.log(`🖼️ Cargando avatar para usuario: ${idUsuario}`);
    
    const response = await fetch(`${API_URL}/classroom/perfil/${idUsuario}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      perfilUsuario = data.perfil; // Guardar en variable global
      
      const userInitialsElement = document.getElementById('userInitials');
      if (userInitialsElement) {
        if (data.perfil.avatar) {
          const BASE_URL = window.BASE_URL || 'http://localhost:3000';
          const avatarUrl = `${BASE_URL}${data.perfil.avatar}`;
          userInitialsElement.innerHTML = `<img src="${avatarUrl}" alt="Avatar">`;
          console.log('✅ Avatar cargado en header:', avatarUrl);
        } else {
          // Si no tiene avatar, mostrar iniciales
          const iniciales = obtenerIniciales(data.perfil.nombre, data.perfil.apellido);
          userInitialsElement.textContent = iniciales;
          console.log('ℹ️ Usuario sin avatar, mostrando iniciales');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error al cargar avatar:', error);
    // Si hay error, simplemente dejamos las iniciales
  }
}

// =====================================================
// FUNCIÓN: RENDERIZAR AVATAR O INICIALES
// =====================================================

function renderAvatarHTML(avatar, nombre, apellido = '', gradiente = 'linear-gradient(135deg, #667eea, #764ba2)') {
  if (avatar) {
    const BASE_URL = window.BASE_URL || 'http://localhost:3000';
    const avatarUrl = `${BASE_URL}${avatar}`;
    return `
      <div class="avatar-circle" style="background: none !important; padding: 0; border: none;">
        <img src="${avatarUrl}" alt="Avatar">
      </div>
    `;
  } else {
    const iniciales = apellido ? obtenerIniciales(nombre, apellido) : obtenerIniciales(nombre);
    return `
      <div class="avatar-circle" style="background: ${gradiente} !important; border: none;">
        <span>${iniciales}</span>
      </div>
    `;
  }
}

// =====================================================
// INICIALIZACIÓN
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación
  if (!verificarAutenticacion()) {
    return;
  }
  
  initClassroom();
  setupEventListeners();
  lucide.createIcons();
});

function verificarAutenticacion() {
  const nombre = localStorage.getItem('nombre');
  const rol = localStorage.getItem('rol');
  
  if (!nombre || !rol) {
    Swal.fire({
      title: 'Acceso Denegado',
      text: 'Debes iniciar sesión para acceder a CEMI Classroom',
      icon: 'warning',
      confirmButtonText: 'Ir a Login',
      confirmButtonColor: '#1976d2'
    }).then(() => {
      window.location.href = 'login.html';
    });
    return false;
  }
  
  return true;
}

function initClassroom() {
  // Obtener datos del usuario desde localStorage
  userName = localStorage.getItem('nombre') || 'Usuario';
  userRol = localStorage.getItem('rol') || 'alumno';
  const idProfesor = localStorage.getItem('id_profesor');
  const idAlumno = localStorage.getItem('id_alumno');
  const isAdminClassroom = localStorage.getItem('admin_classroom') === 'true';

  // Si es admin desde el dashboard, configurar como administrador
  if (isAdminClassroom) {
    userRol = 'administrador';
    userId = localStorage.getItem('id_usuario') || '1'; // ID del admin
    console.log('🔐 Modo Administrador activado - Vista completa del sistema');
  } else {
    // Determinar el ID según el rol
    if (userRol.toLowerCase() === 'profesor') {
      userId = idProfesor;
    } else if (userRol.toLowerCase() === 'alumno') {
      userId = idAlumno;
    }
  }

  // Actualizar UI con datos del usuario
  document.getElementById('userName').textContent = userName;
  
  // Mostrar rol especial para admin
  const rolDisplay = isAdminClassroom ? 'Administrador del Sistema' : userRol.charAt(0).toUpperCase() + userRol.slice(1);
  document.getElementById('userRole').textContent = rolDisplay;
  
  // Generar iniciales
  const iniciales = userName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  const userInitialsElement = document.getElementById('userInitials');
  userInitialsElement.textContent = iniciales;
  
  // Cargar avatar del usuario si existe
  cargarAvatarUsuario();

  // Mostrar menús según el rol
  if (userRol.toLowerCase() === 'profesor') {
    document.getElementById('profesorMenu').style.display = 'block';
    const btnCrearTarea = document.getElementById('btnCrearTarea');
    if (btnCrearTarea) btnCrearTarea.style.display = 'inline-flex';
    
    // Mostrar todos los elementos exclusivos de profesor
    document.querySelectorAll('.profesor-only').forEach(el => {
      el.style.display = el.classList.contains('btn-primary') ? 'inline-flex' : 'block';
    });
  } else if (userRol.toLowerCase() === 'admin' || userRol.toLowerCase() === 'administrador' || userRol.toLowerCase() === 'administrativo') {
    
    if (isAdminClassroom) {
      // MODO ADMINISTRADOR: Ocultar todos los menús excepto Inicio
      
      // Ocultar menús que no necesita el admin
      const menusOcultar = [
        'a[data-view="classes"]',      // Mis Clases
        'a[data-view="tasks"]',         // Tareas
        'a[data-view="calendar"]',      // Calendario
        'a[data-view="create-task"]',   // Crear Tarea
        'a[data-view="announcements"]', // Anuncios
        'a[data-view="analytics"]',     // Estadísticas
        'a[data-view="all-classes"]'    // Supervisión de Cursos
      ];
      
      menusOcultar.forEach(selector => {
        const elemento = document.querySelector(selector);
        if (elemento) elemento.style.display = 'none';
      });
      
      // Ocultar también el contenedor del menú admin
      const adminMenu = document.getElementById('adminMenu');
      if (adminMenu) adminMenu.style.display = 'none';
      
      console.log('🔒 Modo Administrador: Solo vista de Inicio activa');
    } else {
      // Admin normal (no desde dashboard)
      document.getElementById('adminMenu').style.display = 'block';
      document.getElementById('profesorMenu').style.display = 'block';
      
      // Mostrar todos los elementos exclusivos de profesor para admins también
      document.querySelectorAll('.profesor-only').forEach(el => {
        el.style.display = el.classList.contains('btn-primary') ? 'inline-flex' : 'block';
      });
    }
  }

  // Inicializar selector de cursos
  initCourseSelector();

  // Inicializar notificaciones
  initNotifications();

  // Mostrar banner de administrador si corresponde
  if (isAdminClassroom) {
    mostrarBannerAdministrador();
  }

  // Cargar datos iniciales
  loadDashboardData();
}

// Función para mostrar banner de administrador
function mostrarBannerAdministrador() {
  const header = document.querySelector('.classroom-header .header-content');
  if (!header) return;
  
  // Crear banner
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
    color: white;
    padding: 12px 20px;
    text-align: center;
    font-weight: 600;
    font-size: 14px;
    z-index: 999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  `;
  
  banner.innerHTML = `
    <i data-lucide="shield-check" style="width: 20px; height: 20px;"></i>
    <span>MODO ADMINISTRADOR - Vista completa del sistema: Todos los cursos, anuncios, tareas y actividad</span>
    <i data-lucide="eye" style="width: 20px; height: 20px;"></i>
  `;
  
  document.body.insertBefore(banner, document.body.firstChild);
  lucide.createIcons();
  
  // Ajustar padding del contenido principal
  const container = document.querySelector('.classroom-container');
  if (container) {
    container.style.marginTop = '50px';
  }
}

// =====================================================
// SELECTOR DE CURSOS
// =====================================================

async function initCourseSelector() {
  try {
    const isAdminClassroom = localStorage.getItem('admin_classroom') === 'true';
    
    if (isAdminClassroom) {
      // Cargar TODOS los cursos del sistema para el admin
      const res = await fetch(`${API_URL}/classroom/admin/todos-cursos`);
      cursosDisponibles = await res.json();
      console.log(`📚 Admin: ${cursosDisponibles.length} cursos cargados del sistema`);
    } else {
      // Cargar cursos del usuario
      const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
      const res = await fetch(`${API_URL}/classroom/clases/${tipo}/${userId}`);
      cursosDisponibles = await res.json();
    }
    
    if (cursosDisponibles.length > 0) {
      // Mostrar el selector
      const selectorContainer = document.getElementById('courseSelectorContainer');
      if (selectorContainer) {
        selectorContainer.style.display = 'block';
      }
      
      // Configurar el dropdown
      setupCourseSelector();
    }
  } catch (error) {
    console.error('Error al cargar cursos para selector:', error);
  }
}

function setupCourseSelector() {
  const btnSelector = document.getElementById('btnCourseSelector');
  const dropdown = document.getElementById('courseDropdown');
  
  if (!btnSelector || !dropdown) return;
  
  // Click en el botón abre/cierra el dropdown
  btnSelector.onclick = (e) => {
    e.stopPropagation();
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      renderCourseDropdown();
    }
  };
  
  // Click fuera cierra el dropdown
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== btnSelector) {
      dropdown.style.display = 'none';
    }
  });
}

function renderCourseDropdown() {
  const dropdown = document.getElementById('courseDropdown');
  if (!dropdown) return;
  
  const gradientes = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ];
  
  let html = `
    <div onclick="seleccionarCurso(null)" style="padding: 16px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #f0f0f0; ${cursoActivo === null ? 'background: #f8f9ff;' : ''}">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px;">
          📚
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #2c3e50; font-size: 14px;">Todos los cursos</div>
          <div style="font-size: 12px; color: #999;">Ver contenido de todos tus cursos</div>
        </div>
        ${cursoActivo === null ? '<i data-lucide="check" style="width: 20px; height: 20px; color: #667eea;"></i>' : ''}
      </div>
    </div>
  `;
  
  cursosDisponibles.forEach((curso, index) => {
    const isActive = cursoActivo === curso.id_curso;
    html += `
      <div onclick="seleccionarCurso(${curso.id_curso})" style="padding: 16px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #f0f0f0; ${isActive ? 'background: #f8f9ff;' : ''}">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: ${gradientes[index % gradientes.length]}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px;">
            ${curso.nombre_curso.substring(0, 2).toUpperCase()}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #2c3e50; font-size: 14px;">${curso.nombre_curso}</div>
            <div style="font-size: 12px; color: #777;">${curso.nombre_idioma}${curso.nivel ? ' - ' + curso.nivel : ''} • ${curso.total_alumnos || 0} alumnos</div>
          </div>
          ${isActive ? '<i data-lucide="check" style="width: 20px; height: 20px; color: #667eea;"></i>' : ''}
        </div>
      </div>
    `;
  });
  
  dropdown.innerHTML = html;
  lucide.createIcons();
  
  // Agregar hover effects
  const items = dropdown.querySelectorAll('div[onclick]');
  items.forEach(item => {
    item.addEventListener('mouseenter', function() {
      if (!this.style.background.includes('#f8f9ff')) {
        this.style.background = '#f8f9fa';
      }
    });
    item.addEventListener('mouseleave', function() {
      if (!this.style.background.includes('#f8f9ff')) {
        this.style.background = 'transparent';
      }
    });
  });
}

async function seleccionarCurso(idCurso) {
  cursoActivo = idCurso;
  
  // Actualizar el texto del botón
  const btnText = document.getElementById('currentCourseName');
  if (btnText) {
    if (idCurso === null) {
      btnText.textContent = 'Todos los cursos';
    } else {
      const curso = cursosDisponibles.find(c => c.id_curso === idCurso);
      if (curso) {
        btnText.textContent = curso.nombre_curso;
      }
    }
  }
  
  // Cerrar dropdown
  const dropdown = document.getElementById('courseDropdown');
  if (dropdown) {
    dropdown.style.display = 'none';
  }
  
  // Recargar datos de la vista actual
  const vistaActiva = document.querySelector('.nav-item.active');
  if (vistaActiva) {
    const vista = vistaActiva.getAttribute('data-view');
    await loadViewData(vista);
  }
  
  showNotification(
    idCurso === null ? 'Mostrando todos los cursos' : `Filtrando por: ${cursosDisponibles.find(c => c.id_curso === idCurso)?.nombre_curso}`,
    'success'
  );
}

// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {
  // Botón volver al dashboard en sidebar
  const btnBackToDashboard = document.getElementById('btnBackToDashboard');
  if (btnBackToDashboard) {
    btnBackToDashboard.addEventListener('click', (e) => {
      e.preventDefault();
      const rol = localStorage.getItem('rol');
      if (rol === 'profesor') {
        window.location.href = 'dashboard_profesor.html';
      } else if (rol === 'alumno') {
        window.location.href = 'dashboard_alumno.html';
      } else if (rol === 'admin') {
        window.location.href = 'dashboard_admin.html';
      } else {
        window.location.href = 'login.html';
      }
    });
  }

  // Toggle sidebar en móvil
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('show');
    sidebar.classList.toggle('collapsed');
  });

  // Toggle menú de usuario
  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
  });

  // Cerrar menú al hacer click fuera
  document.addEventListener('click', () => {
    userDropdown.classList.remove('show');
  });

  // Navegación entre vistas
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      switchView(view);
      
      // Actualizar clase activa
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Cerrar sidebar en móvil
      if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
        sidebar.classList.remove('show');
      }
    });
  });

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }

  // Filtros de tareas
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      filterTasks(filter);
    });
  });

  // Filtro de cursos en el feed
  const filterCurso = document.getElementById('filterCurso');
  if (filterCurso) {
    filterCurso.addEventListener('change', async (e) => {
      const selectedValue = e.target.value;
      cursoActivo = selectedValue ? parseInt(selectedValue) : null;
      console.log('🔽 Filtro de curso cambiado:', cursoActivo || 'Todas las clases');
      await loadFeed();
    });
    console.log('✅ Event listener de filtro de cursos agregado');
  }
}

// =====================================================
// NAVEGACIÓN DE VISTAS
// =====================================================

function switchView(viewName) {
  // Caso especial: "Crear Tarea" abre el modal directamente
  if (viewName === 'create-task') {
    mostrarFormularioTarea();
    return;
  }

  // Ocultar todas las vistas
  contentViews.forEach(view => {
    view.style.display = 'none';
  });

  // Mostrar la vista seleccionada
  const targetView = document.getElementById(`view${capitalizeFirst(viewName)}`);
  if (targetView) {
    targetView.style.display = 'block';
    lucide.createIcons();
  }

  // Cargar datos específicos de la vista
  loadViewData(viewName);
}

function capitalizeFirst(str) {
  return str.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

// =====================================================
// CARGA DE DATOS
// =====================================================

async function loadDashboardData() {
  showLoader();
  
  try {
    // Cargar datos iniciales según el rol
    await Promise.all([
      loadClases(),
      loadFeed()
    ]);
    
  } catch (error) {
    console.error('Error cargando dashboard:', error);
    showNotification('Error', 'No se pudieron cargar los datos', 'error');
  } finally {
    hideLoader();
  }
}

async function loadClases() {
  try {
    const isAdminClassroom = localStorage.getItem('admin_classroom') === 'true';
    let clases;
    
    if (isAdminClassroom) {
      // Admin: cargar TODOS los cursos del sistema
      const res = await fetch(`${API_URL}/classroom/admin/todos-cursos`);
      clases = await res.json();
      console.log(`📊 Admin: ${clases.length} cursos del sistema cargados`);
    } else {
      // Usuario normal: cargar solo sus cursos
      const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
      const res = await fetch(`${API_URL}/classroom/clases/${tipo}/${userId}`);
      clases = await res.json();
    }
    
    // Actualizar vista de clases
    renderClases(clases);
    
    // Actualizar filtro de cursos
    actualizarFiltroCursos(clases);
    
    return clases;
  } catch (error) {
    console.error('Error al cargar clases:', error);
    return [];
  }
}

function actualizarFiltroCursos(cursos) {
  const filterSelect = document.getElementById('filterCurso');
  if (!filterSelect) return;
  
  filterSelect.innerHTML = '<option value="">Todas las clases</option>';
  
  cursos.forEach(curso => {
    const option = document.createElement('option');
    option.value = curso.id_curso;
    option.textContent = curso.nombre_curso;
    filterSelect.appendChild(option);
  });
}

async function loadFeed() {
  try {
    const isAdminClassroom = localStorage.getItem('admin_classroom') === 'true';
    let anuncios = [];
    
    console.log('🔍 Cargando feed... isAdmin:', isAdminClassroom, 'cursoActivo:', cursoActivo);
    
    if (isAdminClassroom) {
      // Admin: cargar TODOS los anuncios del sistema
      if (cursoActivo !== null) {
        // Si hay un curso activo, filtrar por ese curso
        const res = await fetch(`${API_URL}/classroom/anuncios/curso/${cursoActivo}`);
        const data = await res.json();
        anuncios = Array.isArray(data) ? data : (data.anuncios || []);
        console.log(`📢 Admin: ${anuncios.length} anuncios del curso ${cursoActivo}`);
      } else {
        // Cargar todos los anuncios del sistema
        const res = await fetch(`${API_URL}/classroom/admin/todos-anuncios`);
        const data = await res.json();
        anuncios = Array.isArray(data) ? data : (data.anuncios || []);
        console.log(`📢 Admin: ${anuncios.length} anuncios del sistema cargados`);
      }
    } else {
      // Usuario normal: cargar solo anuncios de sus cursos
      const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
      if (cursoActivo !== null) {
        const res = await fetch(`${API_URL}/classroom/anuncios/curso/${cursoActivo}`);
        const data = await res.json();
        anuncios = Array.isArray(data) ? data : (data.anuncios || []);
      } else {
        const res = await fetch(`${API_URL}/classroom/anuncios/${tipo}/${userId}`);
        const data = await res.json();
        anuncios = Array.isArray(data) ? data : (data.anuncios || []);
      }
    }
    
    console.log('✅ Anuncios obtenidos:', anuncios);
    renderAnuncios(anuncios);
    return anuncios;
  } catch (error) {
    console.error('❌ Error al cargar anuncios:', error);
    renderAnuncios([]);
    return [];
  }
}

function renderAnuncios(anuncios) {
  const container = document.getElementById('activityContainer');
  const isAdminClassroom = localStorage.getItem('admin_classroom') === 'true';
  
  // Asegurar que anuncios sea un array
  if (!Array.isArray(anuncios)) {
    console.warn('⚠️ anuncios no es un array, convirtiendo a array vacío');
    anuncios = [];
  }
  
  console.log('🎨 Renderizando anuncios:', anuncios.length, 'isAdmin:', isAdminClassroom);
  
  if (!container) {
    console.error('❌ No se encontró el contenedor activityContainer');
    return;
  }
  
  if (anuncios.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay anuncios recientes</p>';
    return;
  }
  
  container.innerHTML = anuncios.map(anuncio => {
    const fecha = new Date(anuncio.fecha_creacion);
    const tiempoTranscurrido = calcularTiempoTranscurrido(fecha);
    const importante = anuncio.importante;
    
    // Generar avatar o iniciales
    const avatarHTML = renderAvatarHTML(
      anuncio.profesor_avatar, 
      anuncio.profesor_nombre, 
      '', 
      importante ? 'linear-gradient(135deg, #f59e0b, #dc2626)' : 'linear-gradient(135deg, #667eea, #764ba2)'
    );
    
    // Botón de eliminar solo para admin
    const botonEliminar = isAdminClassroom ? `
      <button class="btn-delete-admin" onclick="event.stopPropagation(); eliminarAnuncioAdmin(${anuncio.id_anuncio})" title="Eliminar anuncio">
        <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
      </button>
    ` : '';
    
    return `
      <div class="activity-card announcement ${importante ? 'importante' : ''}" onclick="abrirAnuncio(${anuncio.id_anuncio})" style="cursor: pointer; position: relative;">
        ${importante ? '<div class="badge-importante"><i data-lucide="alert-circle"></i> Importante</div>' : ''}
        ${botonEliminar}
        <div class="card-header">
          ${avatarHTML}
          <div class="card-info">
            <div class="card-title" style="cursor: pointer; transition: color 0.2s;" 
                 onmouseover="this.style.color='#667eea'" 
                 onmouseout="this.style.color=''" 
                 onclick="event.stopPropagation(); verPerfilProfesor(${anuncio.id_profesor})">${anuncio.profesor_nombre}</div>
            <div class="card-meta">
              <span class="course-name">${anuncio.nombre_curso}</span>
              <span class="separator">•</span>
              <span class="time">${tiempoTranscurrido}</span>
            </div>
          </div>
          <i data-lucide="megaphone" class="card-icon"></i>
        </div>
        <div class="card-content">
          <h4>${anuncio.titulo}</h4>
          <p>${anuncio.contenido}</p>
          ${anuncio.link_url ? `
            <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #667eea;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <i data-lucide="link" style="width: 16px; height: 16px; color: #667eea;"></i>
                <span style="font-size: 12px; font-weight: 600; color: #495057;">Enlace adjunto</span>
              </div>
              <a href="${anuncio.link_url}" target="_blank" style="color: #667eea; text-decoration: none; font-size: 14px; word-break: break-all;" onclick="event.stopPropagation();">
                ${anuncio.link_url}
              </a>
            </div>
          ` : ''}
          ${anuncio.encuesta ? renderPoll(anuncio.encuesta, anuncio.id_anuncio) : ''}
        </div>
        <div class="card-footer">
          <button class="btn-text" onclick="event.stopPropagation();">
            <i data-lucide="message-circle"></i>
            <span id="count-${anuncio.id_anuncio}">${anuncio.total_comentarios || 0}</span> Comentario${(anuncio.total_comentarios || 0) !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  lucide.createIcons();
}

function renderPoll(encuesta, idAnuncio) {
  const totalVotos = encuesta.total_votos || 0;
  const yaVoto = encuesta.ya_voto;
  const votoActual = encuesta.id_opcion_votada; // ID de la opción que votó el alumno
  const esAlumno = userRol.toLowerCase() === 'alumno';
  
  return `
    <div class="poll-container" id="poll-${encuesta.id_encuesta}" style="margin-top: 16px; padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #667eea;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <i data-lucide="bar-chart-2" style="width: 18px; height: 18px; color: #667eea;"></i>
        <span style="font-size: 14px; font-weight: 600; color: #2c3e50;">${encuesta.pregunta}</span>
      </div>
      
      <div class="poll-options" style="display: flex; flex-direction: column; gap: 10px;">
        ${encuesta.opciones.map(opcion => {
          const porcentaje = totalVotos > 0 ? Math.round((opcion.votos_reales / totalVotos) * 100) : 0;
          const esVotoActual = yaVoto && votoActual === opcion.id_opcion;
          
          if (!esAlumno) {
            // Profesores solo ven resultados
            return `
              <div style="position: relative; padding: 12px; background: white; border: 2px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, #667eea15, #764ba215); width: ${porcentaje}%; transition: width 0.3s;"></div>
                <div style="position: relative; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #2c3e50;">${opcion.texto}</span>
                  <span style="font-weight: 600; font-size: 14px; color: #667eea;">${porcentaje}%</span>
                </div>
              </div>
            `;
          } else {
            // Alumnos pueden votar/cambiar voto
            return `
              <button onclick="votarEncuesta(${encuesta.id_encuesta}, ${opcion.id_opcion}, ${idAnuncio})" 
                style="position: relative; padding: 12px; background: ${esVotoActual ? '#667eea' : 'white'}; border: 2px solid ${esVotoActual ? '#667eea' : '#e0e0e0'}; border-radius: 6px; cursor: pointer; text-align: left; font-size: 14px; color: ${esVotoActual ? 'white' : '#2c3e50'}; transition: all 0.2s; overflow: hidden;"
                onmouseover="if (!${esVotoActual}) { this.style.borderColor='#667eea'; this.style.background='#667eea05'; }"
                onmouseout="if (!${esVotoActual}) { this.style.borderColor='#e0e0e0'; this.style.background='white'; }">
                <div style="position: absolute; top: 0; left: 0; height: 100%; background: ${esVotoActual ? 'rgba(255,255,255,0.2)' : 'rgba(102, 126, 234, 0.1)'}; width: ${porcentaje}%; transition: width 0.3s;"></div>
                <div style="position: relative; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    ${esVotoActual ? '<span style="font-size: 16px;">✓</span>' : ''}
                    <span>${opcion.texto}</span>
                  </div>
                  <span style="font-weight: 600; font-size: 13px; opacity: 0.8;">${porcentaje}%</span>
                </div>
              </button>
            `;
          }
        }).join('')}
      </div>
      
      <div style="margin-top: 12px; font-size: 12px; color: #6c757d;">
        <i data-lucide="users" style="width: 14px; height: 14px;"></i>
        ${totalVotos} voto${totalVotos !== 1 ? 's' : ''}
        ${yaVoto ? ' • Has votado' : ''}
      </div>
    </div>
  `;
}

function obtenerIniciales(nombreCompleto) {
  return nombreCompleto
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function calcularTiempoTranscurrido(fecha) {
  const ahora = new Date();
  const diferencia = ahora - fecha;
  
  const minutos = Math.floor(diferencia / 60000);
  const horas = Math.floor(diferencia / 3600000);
  const dias = Math.floor(diferencia / 86400000);
  
  if (minutos < 60) return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
  if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`;
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `Hace ${dias} días`;
  
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

async function loadTareas() {
  try {
    const isAdminClassroom = localStorage.getItem('admin_classroom') === 'true';
    const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
    let tareas;
    
    if (isAdminClassroom) {
      // Admin: cargar TODAS las tareas del sistema
      if (cursoActivo !== null) {
        // Si hay un curso activo, filtrar por ese curso
        const res = await fetch(`${API_URL}/classroom/tareas/curso/${cursoActivo}/${tipo}/${userId}`);
        tareas = await res.json();
      } else {
        // Cargar todas las tareas del sistema
        const res = await fetch(`${API_URL}/classroom/admin/todas-tareas`);
        tareas = await res.json();
        console.log(`📝 Admin: ${tareas.length} tareas del sistema cargadas`);
      }
    } else {
      // Usuario normal: cargar solo tareas de sus cursos
      if (cursoActivo !== null) {
        const res = await fetch(`${API_URL}/classroom/tareas/curso/${cursoActivo}/${tipo}/${userId}`);
        tareas = await res.json();
      } else {
        const res = await fetch(`${API_URL}/classroom/tareas-lista/${tipo}/${userId}`);
        tareas = await res.json();
      }
    }
    
    renderTareas(tareas);
    return tareas;
  } catch (error) {
    console.error('Error al cargar tareas:', error);
    return [];
  }
}

function renderTareas(tareas) {
  const container = document.getElementById('tasksContainer');
  
  if (!container) return;
  
  if (tareas.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay tareas</p>';
    return;
  }
  
  const esProfesor = userRol.toLowerCase() === 'profesor';
  const isAdminClassroom = localStorage.getItem('admin_classroom') === 'true';
  
  container.innerHTML = tareas.map(tarea => {
    const fechaLimite = new Date(tarea.fecha_limite);
    const fechaFormateada = fechaLimite.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let badge = '';
    let statusClass = '';
    
    if (esProfesor || isAdminClassroom) {
      // Vista para profesor o admin
      const porcentajeEntregas = tarea.total_alumnos > 0 
        ? Math.round((tarea.total_entregas / tarea.total_alumnos) * 100) 
        : 0;
      
      // Botón de eliminar
      const botonEliminarAdmin = isAdminClassroom ? `
        <button class="btn-delete-admin-task" onclick="eliminarTareaAdmin(${tarea.id_tarea}, '${tarea.titulo.replace(/'/g, "\\'")}', '${tarea.nombre_curso}')" title="Eliminar tarea">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
          Eliminar
        </button>
      ` : `
        <button class="btn-danger-small" onclick="eliminarTarea(${tarea.id_tarea}, '${tarea.titulo.replace(/'/g, "\\'")}')">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          Eliminar
        </button>
      `;
      
      return `
        <div class="task-item" data-tarea-id="${tarea.id_tarea}" style="position: relative;">
          <div class="task-status-indicator"></div>
          <div class="task-content">
            <div class="task-header">
              <h4>${tarea.titulo}</h4>
              <span class="task-badge">${tarea.total_entregas || 0}/${tarea.total_alumnos || 0} entregas</span>
            </div>
            <p class="task-description">${tarea.descripcion}</p>
            ${tarea.requerimientos ? `
              <div style="margin: 12px 0; padding: 12px; background: #f8f9fa; border-left: 3px solid #667eea; border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-weight: 600; color: #667eea; font-size: 13px;">
                  <i data-lucide="check-square" style="width: 14px; height: 14px;"></i>
                  <span>Requerimientos:</span>
                </div>
                <div style="font-size: 13px; color: #555; white-space: pre-line;">${tarea.requerimientos}</div>
              </div>
            ` : ''}
            <div style="display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap;">
              ${tarea.link_url ? `
                <a href="${tarea.link_url}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: #667eea; text-decoration: none; font-size: 13px; padding: 6px 12px; background: #f0f4ff; border-radius: 6px; transition: all 0.2s;">
                  <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
                  <span>Material de referencia</span>
                </a>
              ` : ''}
              ${tarea.archivo_adjunto ? `
                <a href="${tarea.archivo_adjunto}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: #10b981; text-decoration: none; font-size: 13px; padding: 6px 12px; background: #f0fdf4; border-radius: 6px; transition: all 0.2s;">
                  <i data-lucide="paperclip" style="width: 14px; height: 14px;"></i>
                  <span>Archivo adjunto</span>
                </a>
              ` : ''}
            </div>
            <div class="task-meta">
              <span class="task-course">${tarea.nombre_curso}</span>
              <span class="separator">•</span>
              <span class="task-due">
                <i data-lucide="calendar"></i>
                Límite: ${fechaFormateada}
              </span>
              <span class="separator">•</span>
              <span class="task-points">
                <i data-lucide="star"></i>
                ${tarea.puntos} puntos
              </span>
            </div>
          </div>
          <div class="task-actions">
            <button class="btn-primary-small" onclick="verEntregasTarea(${tarea.id_tarea})">
              Ver Entregas
            </button>
            <button class="btn-danger-small" onclick="eliminarTarea(${tarea.id_tarea}, '${tarea.titulo.replace(/'/g, "\\'")}')">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              Eliminar
            </button>
          </div>
        </div>
      `;
    } else {
      // Vista para alumno
      if (tarea.estado === 'entregada') {
        badge = `<span class="task-badge completed">Entregada</span>`;
        statusClass = 'completed';
      } else if (tarea.estado === 'vencida') {
        badge = `<span class="task-badge overdue">Vencida</span>`;
        statusClass = 'overdue';
      } else {
        badge = `<span class="task-badge due-soon">Pendiente</span>`;
        statusClass = 'pending';
      }
      
      return `
        <div class="task-item ${statusClass}" data-tarea-id="${tarea.id_tarea}">
          <div class="task-status-indicator"></div>
          <div class="task-content">
            <div class="task-header">
              <h4>${tarea.titulo}</h4>
              ${badge}
            </div>
            <p class="task-description">${tarea.descripcion}</p>
            ${tarea.requerimientos ? `
              <div style="margin: 12px 0; padding: 12px; background: #f8f9fa; border-left: 3px solid #667eea; border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-weight: 600; color: #667eea; font-size: 13px;">
                  <i data-lucide="check-square" style="width: 14px; height: 14px;"></i>
                  <span>Requerimientos:</span>
                </div>
                <div style="font-size: 13px; color: #555; white-space: pre-line;">${tarea.requerimientos}</div>
              </div>
            ` : ''}
            <div style="display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap;">
              ${tarea.link_url ? `
                <a href="${tarea.link_url}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: #667eea; text-decoration: none; font-size: 13px; padding: 6px 12px; background: #f0f4ff; border-radius: 6px; transition: all 0.2s;">
                  <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
                  <span>Material de referencia</span>
                </a>
              ` : ''}
              ${tarea.archivo_adjunto ? `
                <a href="${tarea.archivo_adjunto}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: #10b981; text-decoration: none; font-size: 13px; padding: 6px 12px; background: #f0fdf4; border-radius: 6px; transition: all 0.2s;">
                  <i data-lucide="paperclip" style="width: 14px; height: 14px;"></i>
                  <span>Archivo adjunto</span>
                </a>
              ` : ''}
            </div>
            <div class="task-meta">
              <span class="task-course">${tarea.nombre_curso}</span>
              <span class="separator">•</span>
              <span class="task-due">
                <i data-lucide="calendar"></i>
                Vence: ${fechaFormateada}
              </span>
              <span class="separator">•</span>
              <span class="task-points">
                <i data-lucide="star"></i>
                ${tarea.puntos} puntos
              </span>
              ${tarea.calificacion ? `
                <span class="separator">•</span>
                <span class="task-grade">
                  <i data-lucide="check-circle"></i>
                  Calificación: ${tarea.calificacion}
                </span>
              ` : ''}
            </div>
          </div>
          <div class="task-actions">
            ${tarea.estado === 'entregada' 
              ? `<button class="btn-text" onclick="verDetalleEntrega(${tarea.id_tarea}, ${userId})">Ver detalles</button>` 
              : tarea.estado === 'vencida'
                ? `<button class="btn-primary-small" disabled style="opacity: 0.5; cursor: not-allowed;" title="Tarea vencida">Entregar Tarea</button>`
                : `<button class="btn-primary-small" onclick="mostrarFormularioEntrega(${tarea.id_tarea}, '${tarea.titulo.replace(/'/g, "\\'")}')">Entregar Tarea</button>`}
          </div>
        </div>
      `;
    }
  }).join('');
  
  lucide.createIcons();
}

async function loadCalificaciones() {
  try {
    if (userRol.toLowerCase() !== 'alumno') return;
    
    const res = await fetch(`${API_URL}/classroom/calificaciones/alumno/${userId}`);
    const data = await res.json();
    
    // Si hay un curso activo, filtrar las calificaciones
    const dataFiltrada = cursoActivo !== null 
      ? data.filter(cal => cal.id_curso === cursoActivo)
      : data;
    
    renderCalificaciones(dataFiltrada);
    return dataFiltrada;
  } catch (error) {
    console.error('Error al cargar calificaciones:', error);
    return null;
  }
}

async function loadEstadisticas() {
  try {
    if (userRol.toLowerCase() !== 'profesor') return;
    
    const res = await fetch(`${API_URL}/classroom/estadisticas/profesor/${userId}`);
    const stats = await res.json();
    
    console.log('Estadísticas profesor:', stats);
    return stats;
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
    return null;
  }
}

async function loadViewData(viewName) {
  showLoader();
  
  try {
    switch(viewName) {
      case 'home':
        await loadFeed();
        break;
      case 'classes':
        await loadClases();
        break;
      case 'tasks':
        await loadTareas();
        break;
      case 'grades':
        await loadCalificaciones();
        break;
      case 'announcements':
        await loadAnunciosProfesor();
        break;
      case 'calendar':
        await initCalendario();
        break;
      case 'students':
        // Cargar vista de alumnos para profesores
        break;
      default:
        console.log('Vista:', viewName);
    }
  } catch (error) {
    console.error('Error al cargar vista:', error);
  } finally {
    hideLoader();
  }
}

// =====================================================
// FILTROS
// =====================================================

function filterTasks(filter) {
  const taskItems = document.querySelectorAll('.task-item');
  
  taskItems.forEach(task => {
    const isPending = task.classList.contains('pending');
    const isCompleted = task.classList.contains('completed');
    const isOverdue = task.classList.contains('overdue');

    switch(filter) {
      case 'pending':
        task.style.display = isPending ? 'flex' : 'none';
        break;
      case 'completed':
        task.style.display = isCompleted ? 'flex' : 'none';
        break;
      case 'overdue':
        task.style.display = isOverdue ? 'flex' : 'none';
        break;
      default:
        task.style.display = 'flex';
    }
  });
}

// =====================================================
// UTILIDADES
// =====================================================

function handleLogout() {
  Swal.fire({
    title: '¿Cerrar sesión?',
    text: '¿Estás seguro de que quieres salir de CEMI Classroom?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#1976d2',
    cancelButtonColor: '#757575',
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.clear();
      window.location.href = 'classroom-login.html';
    }
  });
}

function showNotification(title, message, type = 'info') {
  Swal.fire({
    title: title,
    text: message,
    icon: type,
    confirmButtonColor: '#1976d2',
    timer: 3000,
    timerProgressBar: true
  });
}

// =====================================================
// FUNCIONES PARA FUTURAS IMPLEMENTACIONES
// =====================================================

// Estado del Course Room activo
let activeCourseRoom = null;

// Renderizar clases con cards clickeables
function renderClases(clases) {
  const container = document.getElementById('classesGrid');
  if (!container) return;
  
  if (!clases || clases.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <i data-lucide="book-open" style="width: 64px; height: 64px; color: #ddd; margin-bottom: 16px;"></i>
        <p style="color: #999; font-size: 16px; margin: 0;">No tienes clases asignadas</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  const gradientes = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];
  
  container.innerHTML = clases.map((clase, index) => `
    <div class="class-card" onclick="verDetalleCurso(${clase.id_curso})" style="cursor: pointer; transition: all 0.3s;">
      <div class="class-card-header" style="background: ${gradientes[index % gradientes.length]}; padding: 24px; border-radius: 12px 12px 0 0; position: relative;">
        <h3 style="margin: 0 0 8px 0; color: white; font-size: 22px; font-weight: 700;">${clase.nombre_curso}</h3>
        <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">${clase.nombre_idioma}${clase.nivel ? ' - ' + clase.nivel : ''}</p>
      </div>
      <div class="class-card-body" style="padding: 20px; background: white; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; color: #555; font-size: 14px;">
            <i data-lucide="user" style="width: 18px; height: 18px; color: #667eea;"></i>
            <span>${clase.profesor_nombre || 'Sin profesor'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; color: #555; font-size: 14px;">
            <i data-lucide="users" style="width: 18px; height: 18px; color: #667eea;"></i>
            <span><strong>${clase.total_alumnos || 0}</strong> ${(clase.total_alumnos || 0) === 1 ? 'alumno' : 'alumnos'}</span>
          </div>
          ${clase.horario ? `
          <div style="display: flex; align-items: center; gap: 12px; color: #555; font-size: 14px;">
            <i data-lucide="clock" style="width: 18px; height: 18px; color: #667eea;"></i>
            <span>${clase.horario}</span>
          </div>
          ` : ''}
          ${clase.nombre_aula ? `
          <div style="display: flex; align-items: center; gap: 12px; color: #555; font-size: 14px;">
            <i data-lucide="map-pin" style="width: 18px; height: 18px; color: #667eea;"></i>
            <span>${clase.nombre_aula}</span>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
  
  // Agregar efectos hover
  const cards = container.querySelectorAll('.class-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-4px)';
      this.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.2)';
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
    });
  });
  
  lucide.createIcons();
}

// Ver detalle completo del curso en panel lateral
async function verDetalleCurso(idCurso) {
  showLoader();
  
  try {
    const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
    
    // Obtener información completa del curso
    const [resCurso, resAlumnos, resTareas] = await Promise.all([
      fetch(`${API_URL}/classroom/clases/${tipo}/${userId}`),
      fetch(`${API_URL}/cursos/${idCurso}/alumnos`),
      fetch(`${API_URL}/classroom/tareas/curso/${idCurso}/${tipo}/${userId}`)
    ]);
    
    const cursos = await resCurso.json();
    const curso = cursos.find(c => c.id_curso === idCurso);
    const alumnos = await resAlumnos.json();
    const tareas = await resTareas.json();
    
    if (!curso) {
      throw new Error('Curso no encontrado');
    }
    
    // Renderizar el panel
    renderPanelCurso(curso, alumnos, tareas);
    
    // Abrir el panel
    const panel = document.getElementById('courseSidePanel');
    panel.classList.add('active');
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
  } catch (error) {
    console.error('Error al cargar detalle del curso:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo cargar la información del curso',
      icon: 'error',
      confirmButtonColor: '#667eea'
    });
  } finally {
    hideLoader();
  }
}

function renderPanelCurso(curso, alumnos, tareas) {
  const panelBody = document.getElementById('coursePanelBody');
  
  const gradiente = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  
  panelBody.innerHTML = `
    <!-- Header del curso -->
    <div class="course-detail-header" style="background: ${gradiente};">
      <h2 class="course-detail-name">${curso.nombre_curso}</h2>
      <p class="course-detail-meta">${curso.nombre_idioma}${curso.nivel ? ' - ' + curso.nivel : ''}</p>
    </div>
    
    <!-- Información General -->
    <div class="course-panel-section">
      <div class="course-panel-title">
        <i data-lucide="info" style="width: 16px; height: 16px;"></i>
        Información General
      </div>
      <div class="course-info-grid">
        <div class="course-info-item">
          <div class="course-info-label">Profesor</div>
          <div class="course-info-value">
            <i data-lucide="user" style="width: 16px; height: 16px; color: #667eea;"></i>
            ${curso.profesor_nombre || 'No asignado'}
          </div>
        </div>
        <div class="course-info-item">
          <div class="course-info-label">Total Alumnos</div>
          <div class="course-info-value">
            <i data-lucide="users" style="width: 16px; height: 16px; color: #667eea;"></i>
            ${curso.total_alumnos || 0}
          </div>
        </div>
        <div class="course-info-item">
          <div class="course-info-label">Horario</div>
          <div class="course-info-value">
            <i data-lucide="clock" style="width: 16px; height: 16px; color: #667eea;"></i>
            ${curso.horario || 'Por definir'}
          </div>
        </div>
        <div class="course-info-item">
          <div class="course-info-label">Aula</div>
          <div class="course-info-value">
            <i data-lucide="map-pin" style="width: 16px; height: 16px; color: #667eea;"></i>
            ${curso.nombre_aula || 'Sin asignar'}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Estadísticas -->
    <div class="course-panel-section">
      <div class="course-panel-title">
        <i data-lucide="bar-chart-2" style="width: 16px; height: 16px;"></i>
        Estadísticas
      </div>
      <div class="course-info-grid">
        <div class="course-info-item" style="border-left-color: #10b981;">
          <div class="course-info-label">Tareas Activas</div>
          <div class="course-info-value">
            <i data-lucide="clipboard-list" style="width: 16px; height: 16px; color: #10b981;"></i>
            ${tareas.length || 0}
          </div>
        </div>
        <div class="course-info-item" style="border-left-color: #f59e0b;">
          <div class="course-info-label">Alumnos Activos</div>
          <div class="course-info-value">
            <i data-lucide="user-check" style="width: 16px; height: 16px; color: #f59e0b;"></i>
            ${alumnos.length || 0}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Lista de Alumnos -->
    <div class="course-panel-section">
      <div class="course-panel-title">
        <i data-lucide="users" style="width: 16px; height: 16px;"></i>
        Alumnos Inscritos (${alumnos.length})
      </div>
      ${alumnos.length > 0 ? `
        <div style="max-height: 400px; overflow-y: auto;">
          ${alumnos.map((alumno, index) => {
            const colores = [
              'linear-gradient(135deg, #667eea, #764ba2)',
              'linear-gradient(135deg, #f093fb, #f5576c)',
              'linear-gradient(135deg, #4facfe, #00f2fe)',
              'linear-gradient(135deg, #43e97b, #38f9d7)',
              'linear-gradient(135deg, #fa709a, #fee140)'
            ];
            
            // Generar avatar o iniciales para alumnos
            let avatarAlumno = '';
            if (alumno.avatar) {
              const BASE_URL = window.BASE_URL || 'http://localhost:3000';
              const avatarUrl = `${BASE_URL}${alumno.avatar}`;
              avatarAlumno = `
                <div class="student-avatar" style="background: none; padding: 0; overflow: hidden;">
                  <img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                </div>
              `;
            } else {
              const iniciales = alumno.nombre.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
              avatarAlumno = `
                <div class="student-avatar" style="background: ${colores[index % colores.length]};">
                  ${iniciales}
                </div>
              `;
            }
            
            return `
              <div class="student-list-item" onclick="verPerfilAlumno(${alumno.id_alumno})" style="cursor: pointer;">
                ${avatarAlumno}
                <div class="student-info">
                  <div class="student-name">${alumno.nombre}</div>
                  <div class="student-email">${alumno.email || 'Sin email'}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <i data-lucide="user-x"></i>
          <p>No hay alumnos inscritos</p>
        </div>
      `}
    </div>
  `;
  
  lucide.createIcons();
}

function cerrarPanelCurso() {
  const panel = document.getElementById('courseSidePanel');
  panel.classList.remove('active');
  document.body.style.overflow = '';
}

// =====================================================
// FUNCIÓN: VER PERFIL DE ALUMNO
// =====================================================
window.verPerfilAlumno = function(idAlumno) {
  // Obtener el ID del usuario actual según el rol
  const idAlumnoActual = localStorage.getItem('id_alumno');
  const idProfesorActual = localStorage.getItem('id_profesor');
  const rolActual = localStorage.getItem('rol');
  
  // Si el usuario es alumno y es el mismo que clickeó, ir a su perfil
  if (rolActual === 'alumno' && idAlumnoActual && parseInt(idAlumnoActual) === parseInt(idAlumno)) {
    // Ir a Mi Perfil
    window.location.href = '/perfil-classroom.html';
  } else {
    // Ver perfil como espectador (redirigir a página de perfil espectador)
    window.location.href = `/perfil-espectador.html?id=${idAlumno}&tipo=alumno`;
  }
};

// =====================================================
// FUNCIÓN: VER PERFIL DE PROFESOR
// =====================================================
window.verPerfilProfesor = function(idProfesor) {
  // Obtener el ID del usuario actual según el rol
  const idProfesorActual = localStorage.getItem('id_profesor');
  const rolActual = localStorage.getItem('rol');
  
  // Si el usuario es profesor y es el mismo, ir a su perfil
  if (rolActual === 'profesor' && idProfesorActual && parseInt(idProfesorActual) === parseInt(idProfesor)) {
    // Ir a Mi Perfil
    window.location.href = '/perfil-classroom.html';
  } else {
    // Ver perfil como espectador
    window.location.href = `/perfil-espectador.html?id=${idProfesor}&tipo=profesor`;
  }
};

// =====================================================
// FUNCIÓN: VER PERFIL DESDE COMENTARIO
// =====================================================
window.verPerfilComentario = function(idUsuario, tipoUsuario) {
  const rolActual = localStorage.getItem('rol');
  
  if (tipoUsuario === 'profesor') {
    const idProfesorActual = localStorage.getItem('id_profesor');
    // Si es el mismo profesor, ir a su perfil
    if (rolActual === 'profesor' && idProfesorActual && parseInt(idProfesorActual) === parseInt(idUsuario)) {
      window.location.href = '/perfil-classroom.html';
    } else {
      window.location.href = `/perfil-espectador.html?id=${idUsuario}&tipo=profesor`;
    }
  } else if (tipoUsuario === 'alumno') {
    const idAlumnoActual = localStorage.getItem('id_alumno');
    // Si es el mismo alumno, ir a su perfil
    if (rolActual === 'alumno' && idAlumnoActual && parseInt(idAlumnoActual) === parseInt(idUsuario)) {
      window.location.href = '/perfil-classroom.html';
    } else {
      window.location.href = `/perfil-espectador.html?id=${idUsuario}&tipo=alumno`;
    }
  }
};

// =====================================================
// FUNCIÓN: ABRIR PERFIL COMO ESPECTADOR
// =====================================================
async function abrirPerfilEspectador(idPersona, tipoUsuario) {
  try {
    // Obtener datos del perfil
    const response = await fetch(`${API_URL}/classroom/perfil/${idPersona}`);
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error('No se pudo cargar el perfil');
    }
    
    const perfil = data.perfil;
    const iniciales = obtenerIniciales(perfil.nombre, perfil.apellido);
    
    // Generar avatar o iniciales
    let avatarHTML = '';
    if (perfil.avatar) {
      const BASE_URL = window.BASE_URL || 'http://localhost:3000';
      const avatarUrl = `${BASE_URL}${perfil.avatar}`;
      avatarHTML = `
        <div class="profile-avatar-modal" style="background: none; padding: 0; overflow: hidden;">
          <img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
        </div>
      `;
    } else {
      avatarHTML = `
        <div class="profile-avatar-modal" style="background: linear-gradient(135deg, #667eea, #764ba2);">
          <span style="font-size: 48px; color: white; font-weight: 700;">${iniciales}</span>
        </div>
      `;
    }
    
    // Crear HTML del modal
    const perfilHTML = `
      <div style="text-align: center;">
        ${avatarHTML}
        <h2 style="margin: 20px 0 8px 0; color: #2c3e50; font-size: 28px;">${perfil.nombre} ${perfil.apellido}</h2>
        <p style="color: #667eea; font-size: 16px; font-weight: 600; margin: 0 0 8px 0; text-transform: capitalize;">${perfil.rol}</p>
        <p style="color: #6c757d; font-size: 14px; margin: 0 0 24px 0;">@${perfil.username}</p>
        
        <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; margin-bottom: 20px; text-align: left;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px; font-weight: 600;">Email</div>
              <div style="color: #2c3e50; font-size: 14px;">
                <i data-lucide="mail" style="width: 14px; height: 14px; margin-right: 6px; color: #667eea;"></i>
                ${perfil.email || 'No disponible'}
              </div>
            </div>
            <div>
              <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px; font-weight: 600;">Teléfono</div>
              <div style="color: #2c3e50; font-size: 14px;">
                <i data-lucide="phone" style="width: 14px; height: 14px; margin-right: 6px; color: #667eea;"></i>
                ${perfil.telefono || 'No disponible'}
              </div>
            </div>
          </div>
          
          ${perfil.biografia ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e9ecef;">
              <div style="font-size: 12px; color: #6c757d; margin-bottom: 8px; font-weight: 600;">Biografía</div>
              <div style="color: #495057; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${perfil.biografia}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Mostrar en SweetAlert2
    Swal.fire({
      html: perfilHTML,
      width: '600px',
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'perfil-modal-popup'
      },
      didRender: () => {
        lucide.createIcons();
      }
    });
    
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo cargar el perfil del usuario'
    });
  }
}

// Abrir Course Room (versión simplificada - solo cambia filtro y vista)
async function abrirCourseRoom(idCurso) {
  // Seleccionar el curso
  await seleccionarCurso(idCurso);
  
  // Cambiar a la vista de inicio para ver los anuncios del curso
  switchView('home');
  
  // Activar el nav item de inicio
  navItems.forEach(item => {
    if (item.getAttribute('data-view') === 'home') {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Ver alumnos del curso
async function verAlumnosCurso(idCurso) {
  try {
    const res = await fetch(`${API_URL}/classroom/curso/${idCurso}/alumnos`);
    const alumnos = await res.json();
    
    const htmlAlumnos = alumnos.length === 0 ? 
      '<p style="text-align: center; color: #999; padding: 20px;">No hay alumnos inscritos</p>' :
      `
        <div style="display: grid; gap: 12px; max-height: 400px; overflow-y: auto;">
          ${alumnos.map(alumno => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">
                ${alumno.nombre.charAt(0)}${alumno.apellido.charAt(0)}
              </div>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #2c3e50;">${alumno.nombre} ${alumno.apellido}</div>
                <div style="font-size: 13px; color: #777;">${alumno.email || 'Sin email'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    
    Swal.fire({
      title: `<div style="display: flex; align-items: center; gap: 12px;"><i data-lucide="users" style="width: 24px; height: 24px; color: #667eea;"></i><span>Alumnos del Curso</span></div>`,
      html: htmlAlumnos,
      showCloseButton: true,
      showConfirmButton: false,
      width: '600px',
      didOpen: () => {
        lucide.createIcons();
      }
    });
  } catch (error) {
    console.error('Error al cargar alumnos:', error);
    showNotification('Error al cargar los alumnos', 'error');
  }
}

// Ver estadísticas del curso
async function verEstadisticasCurso(idCurso) {
  Swal.fire({
    title: 'Estadísticas del Curso',
    html: '<p style="text-align: center; color: #999; padding: 20px;">Próximamente: Gráficos de rendimiento, asistencia y calificaciones</p>',
    icon: 'info',
    confirmButtonColor: '#667eea'
  });
}

// Renderizar calificaciones
function renderCalificaciones(data) {
  const container = document.querySelector('#viewGrades .grades-container');
  if (!container) return;
  
  if (!data || !data.calificaciones) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: #666; font-size: 16px;">No hay calificaciones disponibles</p>
      </div>
    `;
    return;
  }
  
  const { calificaciones, estadisticas } = data;
  
  // Actualizar estadísticas
  const summaryHTML = `
    <div class="grades-summary">
      <div class="summary-card">
        <div class="summary-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">
          <i data-lucide="trending-up"></i>
        </div>
        <div class="summary-content">
          <div class="summary-label">Promedio General</div>
          <div class="summary-value">${estadisticas.promedio_general || '0.0'}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
          <i data-lucide="clipboard-check"></i>
        </div>
        <div class="summary-content">
          <div class="summary-label">Evaluaciones Completadas</div>
          <div class="summary-value">${estadisticas.tareas_completadas}/${estadisticas.tareas_totales}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon" style="background: linear-gradient(135deg, #fa709a, #fee140);">
          <i data-lucide="award"></i>
        </div>
        <div class="summary-content">
          <div class="summary-label">Mejor Nota</div>
          <div class="summary-value">${estadisticas.mejor_nota || '0.0'}</div>
        </div>
      </div>
    </div>
  `;
  
  // Generar tablas por curso
  const gradientes = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)'
  ];
  
  const tablasHTML = calificaciones.map((curso, index) => {
    const promedio = curso.promedio || 0;
    
    return `
      <div class="course-grades">
        <div class="course-grades-header" style="background: ${gradientes[index % gradientes.length]};">
          <h4>${curso.nombre_curso}</h4>
          <span class="course-average">Promedio: ${promedio.toFixed(2)}</span>
        </div>
        <table class="grades-table">
          <thead>
            <tr>
              <th>Evaluación</th>
              <th>Calificación</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            ${curso.parcial1 !== null ? `
            <tr>
              <td>Parcial 1</td>
              <td><span class="grade-badge ${getGradeClass(curso.parcial1)}">${curso.parcial1.toFixed(2)}</span></td>
              <td>${curso.fecha_actualizacion ? new Date(curso.fecha_actualizacion).toLocaleDateString('es-ES') : '-'}</td>
            </tr>
            ` : ''}
            ${curso.parcial2 !== null ? `
            <tr>
              <td>Parcial 2</td>
              <td><span class="grade-badge ${getGradeClass(curso.parcial2)}">${curso.parcial2.toFixed(2)}</span></td>
              <td>${curso.fecha_actualizacion ? new Date(curso.fecha_actualizacion).toLocaleDateString('es-ES') : '-'}</td>
            </tr>
            ` : ''}
            ${curso.final !== null ? `
            <tr>
              <td>Final</td>
              <td><span class="grade-badge ${getGradeClass(curso.final)}">${curso.final.toFixed(2)}</span></td>
              <td>${curso.fecha_actualizacion ? new Date(curso.fecha_actualizacion).toLocaleDateString('es-ES') : '-'}</td>
            </tr>
            ` : ''}
            ${!curso.parcial1 && !curso.parcial2 && !curso.final ? `
            <tr>
              <td colspan="3" style="text-align: center; color: #999;">Sin calificaciones aún</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    `;
  }).join('');
  
  container.innerHTML = summaryHTML + '<div class="grades-table-container"><h3>Calificaciones por Curso</h3>' + tablasHTML + '</div>';
  lucide.createIcons();
}

function getGradeClass(nota) {
  if (nota >= 8) return 'excellent';
  if (nota >= 6) return 'good';
  if (nota >= 4) return 'regular';
  return 'poor';
}

// Ver alumnos de un curso (profesores)
async function verAlumnosCurso(idCurso) {
  try {
    const res = await fetch(`${API_URL}/classroom/curso/${idCurso}/alumnos`);
    const alumnos = await res.json();
    
    let tablaHTML = `
      <table class="grades-table">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Legajo</th>
            <th>Email</th>
            <th>Parcial 1</th>
            <th>Parcial 2</th>
            <th>Final</th>
            <th>Promedio</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    alumnos.forEach(alumno => {
      tablaHTML += `
        <tr>
          <td>${alumno.nombre_completo}</td>
          <td>${alumno.legajo}</td>
          <td>${alumno.mail}</td>
          <td>${alumno.parcial1 !== null ? alumno.parcial1.toFixed(2) : '-'}</td>
          <td>${alumno.parcial2 !== null ? alumno.parcial2.toFixed(2) : '-'}</td>
          <td>${alumno.final !== null ? alumno.final.toFixed(2) : '-'}</td>
          <td>${alumno.promedio > 0 ? alumno.promedio.toFixed(2) : '-'}</td>
        </tr>
      `;
    });
    
    tablaHTML += `
        </tbody>
      </table>
    `;
    
    Swal.fire({
      title: 'Alumnos del Curso',
      html: tablaHTML,
      width: 900,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#1976d2'
    });
  } catch (error) {
    console.error('Error al cargar alumnos:', error);
    showNotification('Error', 'No se pudieron cargar los alumnos', 'error');
  }
}

function verTareasCurso(idCurso) {
  showNotification('En desarrollo', 'Funcionalidad de tareas próximamente', 'info');
}

function showClassMenu(idCurso) {
  console.log('Menú de clase:', idCurso);
}

// Loader helpers
function showLoader() {
  document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
  document.getElementById('loader').classList.add('hidden');
}

// =====================================================
// FUNCIONES PARA FUTURAS IMPLEMENTACIONES
// =====================================================

// Crear nueva clase (solo profesores)
function createClass() {
  Swal.fire({
    title: 'Crear Nueva Clase',
    html: `
      <input type="text" id="className" class="swal2-input" placeholder="Nombre de la clase">
      <input type="text" id="classDescription" class="swal2-input" placeholder="Descripción">
      <select id="classSubject" class="swal2-input">
        <option value="">Seleccionar materia</option>
        <option value="ingles">Inglés</option>
        <option value="frances">Francés</option>
        <option value="aleman">Alemán</option>
        <option value="italiano">Italiano</option>
      </select>
    `,
    confirmButtonText: 'Crear',
    confirmButtonColor: '#1976d2',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const name = document.getElementById('className').value;
      const description = document.getElementById('classDescription').value;
      const subject = document.getElementById('classSubject').value;
      
      if (!name || !subject) {
        Swal.showValidationMessage('Por favor completa todos los campos obligatorios');
        return false;
      }
      
      return { name, description, subject };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      showNotification('¡Clase creada!', 'La clase se creó correctamente', 'success');
      // Aquí harías la llamada al backend
    }
  });
}

// =====================================================
// FUNCIONES PARA TAREAS
// =====================================================

async function mostrarFormularioTarea() {
  // Primero cargar los cursos del profesor
  const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
  const res = await fetch(`${API_URL}/classroom/clases/${tipo}/${userId}`);
  const cursos = await res.json();
  
  if (cursos.length === 0) {
    Swal.fire({
      title: 'Sin cursos',
      text: 'No tienes cursos asignados para crear tareas',
      icon: 'info',
      confirmButtonColor: '#667eea'
    });
    return;
  }
  
  const cursosOptions = cursos.map(c => 
    `<option value="${c.id_curso}" style="color: #2c3e50; background: white;">${c.nombre_curso}</option>`
  ).join('');
  
  // Obtener fecha mínima (hoy)
  const hoy = new Date().toISOString().split('T')[0];
  
  Swal.fire({
    title: '<div style="display: flex; align-items: center; gap: 12px;"><i data-lucide="clipboard-list" style="width: 28px; height: 28px; color: #667eea;"></i><span>Crear Tarea</span></div>',
    html: `
      <div style="text-align: left; padding: 0 8px;">
        <!-- Selector de Curso -->
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">
          <i data-lucide="book-open" style="width: 16px; height: 16px; margin-right: 4px;"></i>
          Curso
        </label>
        <select id="swal-curso-tarea" style="width: 100%; margin: 0 0 20px 0; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #2c3e50; cursor: pointer; appearance: none; background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23667eea%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e'); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px; padding-right: 40px; transition: all 0.2s;"
          onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
          onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';">
          <option value="" style="color: #2c3e50; background: white;">Selecciona un curso</option>
          ${cursosOptions}
        </select>
        
        <!-- Título con contador -->
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">
          <i data-lucide="type" style="width: 16px; height: 16px; margin-right: 4px;"></i>
          Título de la Tarea
          <span id="titulo-tarea-counter" style="float: right; color: #999; font-size: 12px; font-weight: 400;">0/100</span>
        </label>
        <input id="swal-titulo-tarea" placeholder="Ej: Ensayo sobre literatura contemporánea" maxlength="100" 
          style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: all 0.2s;"
          onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
          onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';"
          oninput="document.getElementById('titulo-tarea-counter').textContent = this.value.length + '/100'">
        
        <!-- Descripción con contador -->
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">
          <i data-lucide="align-left" style="width: 16px; height: 16px; margin-right: 4px;"></i>
          Descripción e Instrucciones
          <span id="descripcion-tarea-counter" style="float: right; color: #999; font-size: 12px; font-weight: 400;">0/1000</span>
        </label>
        <textarea id="swal-descripcion-tarea" placeholder="Describe las instrucciones y requerimientos de la tarea..." maxlength="1000"
          style="width: 100%; min-height: 120px; resize: vertical; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; transition: all 0.2s;"
          onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
          onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';"
          oninput="document.getElementById('descripcion-tarea-counter').textContent = this.value.length + '/1000'"></textarea>
        
        <!-- Requerimientos -->
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">
          <i data-lucide="check-square" style="width: 16px; height: 16px; margin-right: 4px;"></i>
          Requerimientos Específicos
          <span style="float: right; color: #999; font-size: 12px; font-weight: 400;">(Opcional)</span>
        </label>
        <textarea id="swal-requerimientos-tarea" placeholder="• Formato PDF&#10;• Mínimo 500 palabras&#10;• Incluir referencias..." maxlength="500"
          style="width: 100%; min-height: 80px; resize: vertical; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; transition: all 0.2s;"
          onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
          onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';"></textarea>
        
        <!-- Fecha y Hora -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">
              <i data-lucide="calendar" style="width: 16px; height: 16px; margin-right: 4px;"></i>
              Fecha Límite
            </label>
            <input type="date" id="swal-fecha-tarea" min="${hoy}" 
              style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: all 0.2s;"
              onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
              onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';">
          </div>
          <div>
            <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">
              <i data-lucide="clock" style="width: 16px; height: 16px; margin-right: 4px;"></i>
              Hora Límite
            </label>
            <input type="time" id="swal-hora-tarea" value="23:59" 
              style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: all 0.2s;"
              onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
              onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';">
          </div>
        </div>
        
        <!-- Puntos -->
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">
          <i data-lucide="award" style="width: 16px; height: 16px; margin-right: 4px;"></i>
          Puntos de la Tarea
        </label>
        <input type="number" id="swal-puntos-tarea" value="100" min="1" max="1000" 
          style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: all 0.2s;"
          onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
          onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';">
        
        <!-- Opciones adicionales -->
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <!-- ENLACE -->
          <div style="margin-bottom: 12px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #495057; padding: 10px; background: white; border-radius: 6px; transition: all 0.2s;">
              <input type="checkbox" id="swal-link-tarea" style="width: 18px; height: 18px; cursor: pointer;">
              <i data-lucide="link" style="width: 16px; height: 16px; color: #667eea;"></i>
              <span style="font-weight: 500;">Agregar enlace de referencia</span>
            </label>
            <div id="link-tarea-container" style="max-height: 0; opacity: 0; overflow: hidden; transition: all 0.3s ease; margin-top: 0;">
              <div style="margin-top: 12px; padding: 12px; background: white; border-radius: 6px; border: 2px solid #667eea; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <i data-lucide="external-link" style="width: 14px; height: 14px; color: #667eea;"></i>
                  <span style="font-size: 12px; font-weight: 600; color: #667eea;">URL de referencia (material de apoyo, documentos, etc.)</span>
                </div>
                <input id="swal-link-url-tarea" type="url" placeholder="https://ejemplo.com/documento" 
                  style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 13px; transition: border-color 0.2s;"
                  onfocus="this.style.borderColor='#667eea';"
                  onblur="this.style.borderColor='#e0e0e0';">
              </div>
            </div>
          </div>
          
          <!-- ARCHIVO ADJUNTO -->
          <div style="margin-bottom: 12px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #495057; padding: 10px; background: white; border-radius: 6px; transition: all 0.2s;">
              <input type="checkbox" id="swal-archivo-tarea" style="width: 18px; height: 18px; cursor: pointer;">
              <i data-lucide="paperclip" style="width: 16px; height: 16px; color: #667eea;"></i>
              <span style="font-weight: 500;">Adjuntar archivo para los alumnos</span>
            </label>
            <div id="archivo-tarea-container" style="max-height: 0; opacity: 0; overflow: hidden; transition: all 0.3s ease; margin-top: 0;">
              <div style="margin-top: 12px; padding: 12px; background: white; border-radius: 6px; border: 2px solid #667eea; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <i data-lucide="file-text" style="width: 14px; height: 14px; color: #667eea;"></i>
                  <span style="font-size: 12px; font-weight: 600; color: #667eea;">Archivo de referencia (guías, plantillas, material de apoyo)</span>
                </div>
                
                <!-- Opciones de archivo: URL o Subir -->
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                  <label style="flex: 1; display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #f0f4ff; border: 2px solid #667eea; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                    <input type="radio" name="tipo-archivo" value="url" checked style="cursor: pointer;">
                    <i data-lucide="link-2" style="width: 14px; height: 14px;"></i>
                    <span style="font-size: 13px; font-weight: 500;">Enlace</span>
                  </label>
                  <label style="flex: 1; display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #f8f9fa; border: 2px solid #e0e0e0; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                    <input type="radio" name="tipo-archivo" value="upload" style="cursor: pointer;">
                    <i data-lucide="upload" style="width: 14px; height: 14px;"></i>
                    <span style="font-size: 13px; font-weight: 500;">Subir archivo</span>
                  </label>
                </div>
                
                <!-- Campo URL -->
                <div id="archivo-url-section" style="display: block;">
                  <input id="swal-archivo-url-tarea" type="url" placeholder="https://drive.google.com/file/..." 
                    style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 13px; transition: border-color 0.2s; box-sizing: border-box;"
                    onfocus="this.style.borderColor='#667eea';"
                    onblur="this.style.borderColor='#e0e0e0';">
                  <div style="margin-top: 6px; padding: 6px; background: #f0f4ff; border-radius: 4px; font-size: 11px; color: #667eea;">
                    <i data-lucide="info" style="width: 12px; height: 12px; margin-right: 4px;"></i>
                    <span>Enlace desde Google Drive, Dropbox, OneDrive, etc.</span>
                  </div>
                </div>
                
                <!-- Campo Upload -->
                <div id="archivo-upload-section" style="display: none;">
                  <div style="position: relative;">
                    <input type="file" id="swal-archivo-file-tarea" 
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar,.txt"
                      style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 13px; cursor: pointer; box-sizing: border-box;">
                  </div>
                  <div id="upload-progress" style="display: none; margin-top: 8px;">
                    <div style="background: #e0e0e0; border-radius: 4px; height: 6px; overflow: hidden;">
                      <div id="upload-progress-bar" style="width: 0%; height: 100%; background: #667eea; transition: width 0.3s;"></div>
                    </div>
                    <span id="upload-status" style="font-size: 11px; color: #667eea; margin-top: 4px; display: block;"></span>
                  </div>
                  <div style="margin-top: 6px; padding: 6px; background: #f0fdf4; border-radius: 4px; font-size: 11px; color: #10b981;">
                    <i data-lucide="info" style="width: 12px; height: 12px; margin-right: 4px;"></i>
                    <span>Máximo 50MB. Formatos: PDF, Word, Excel, PowerPoint, imágenes, ZIP, RAR, TXT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- NOTIFICAR -->
          <div>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #495057; padding: 10px; background: white; border-radius: 6px; transition: all 0.2s;"
              onmouseover="this.style.background='#f0f4ff';"
              onmouseout="this.style.background='white';">
              <input type="checkbox" id="swal-notificar-tarea" checked style="width: 18px; height: 18px; cursor: pointer;">
              <i data-lucide="bell" style="width: 16px; height: 16px; color: #667eea;"></i>
              <span style="font-weight: 500;">Notificar a los alumnos sobre esta tarea</span>
            </label>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i data-lucide="check-circle" style="width: 16px; height: 16px; margin-right: 6px;"></i> Crear Tarea',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#667eea',
    cancelButtonColor: '#6c757d',
    width: '700px',
    customClass: {
      popup: 'animated-popup',
      confirmButton: 'animated-button'
    },
    didOpen: () => {
      // Recrear iconos de Lucide
      lucide.createIcons();
      
      // Event listener para enlace
      const linkCheckbox = document.getElementById('swal-link-tarea');
      const linkContainer = document.getElementById('link-tarea-container');
      const linkInput = document.getElementById('swal-link-url-tarea');
      
      linkCheckbox.addEventListener('change', function() {
        if (this.checked) {
          linkContainer.style.maxHeight = '200px';
          linkContainer.style.opacity = '1';
          linkContainer.style.marginTop = '12px';
          setTimeout(() => {
            linkInput.focus();
          }, 300);
        } else {
          linkContainer.style.maxHeight = '0';
          linkContainer.style.opacity = '0';
          linkContainer.style.marginTop = '0';
          linkInput.value = '';
        }
      });
      
      // Event listener para archivo adjunto
      const archivoCheckbox = document.getElementById('swal-archivo-tarea');
      const archivoContainer = document.getElementById('archivo-tarea-container');
      const archivoUrlInput = document.getElementById('swal-archivo-url-tarea');
      const archivoFileInput = document.getElementById('swal-archivo-file-tarea');
      
      archivoCheckbox.addEventListener('change', function() {
        if (this.checked) {
          archivoContainer.style.maxHeight = '500px';
          archivoContainer.style.opacity = '1';
          archivoContainer.style.marginTop = '12px';
        } else {
          archivoContainer.style.maxHeight = '0';
          archivoContainer.style.opacity = '0';
          archivoContainer.style.marginTop = '0';
          archivoUrlInput.value = '';
          archivoFileInput.value = '';
        }
      });
      
      // Event listeners para radio buttons (URL vs Upload)
      const radioButtons = document.querySelectorAll('input[name="tipo-archivo"]');
      const urlSection = document.getElementById('archivo-url-section');
      const uploadSection = document.getElementById('archivo-upload-section');
      
      radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
          // Actualizar estilos de los labels
          const labels = document.querySelectorAll('label:has(input[name="tipo-archivo"])');
          labels.forEach(label => {
            const input = label.querySelector('input');
            if (input.checked) {
              label.style.background = '#f0f4ff';
              label.style.borderColor = '#667eea';
            } else {
              label.style.background = '#f8f9fa';
              label.style.borderColor = '#e0e0e0';
            }
          });
          
          // Mostrar/ocultar secciones
          if (this.value === 'url') {
            urlSection.style.display = 'block';
            uploadSection.style.display = 'none';
            archivoFileInput.value = '';
          } else {
            urlSection.style.display = 'none';
            uploadSection.style.display = 'block';
            archivoUrlInput.value = '';
          }
          
          // Recrear iconos
          lucide.createIcons();
        });
      });
    },
    preConfirm: async () => {
      const curso = document.getElementById('swal-curso-tarea').value;
      const titulo = document.getElementById('swal-titulo-tarea').value;
      const descripcion = document.getElementById('swal-descripcion-tarea').value;
      const requerimientos = document.getElementById('swal-requerimientos-tarea').value;
      const fecha = document.getElementById('swal-fecha-tarea').value;
      const hora = document.getElementById('swal-hora-tarea').value;
      const puntos = document.getElementById('swal-puntos-tarea').value;
      const linkUrl = document.getElementById('swal-link-tarea').checked ? document.getElementById('swal-link-url-tarea').value : '';
      const notificar = document.getElementById('swal-notificar-tarea').checked;
      
      // Validaciones básicas
      if (!curso || !titulo || !descripcion || !fecha || !hora) {
        Swal.showValidationMessage('El curso, título, descripción, fecha y hora son requeridos');
        return false;
      }
      
      if (linkUrl && !linkUrl.match(/^https?:\/\/.+/)) {
        Swal.showValidationMessage('El enlace debe ser una URL válida (http:// o https://)');
        return false;
      }
      
      // Manejar archivo adjunto
      let archivoUrl = '';
      const archivoCheckbox = document.getElementById('swal-archivo-tarea');
      
      if (archivoCheckbox.checked) {
        const tipoArchivo = document.querySelector('input[name="tipo-archivo"]:checked').value;
        
        if (tipoArchivo === 'url') {
          // Archivo por URL
          archivoUrl = document.getElementById('swal-archivo-url-tarea').value;
          if (archivoUrl && !archivoUrl.match(/^https?:\/\/.+/)) {
            Swal.showValidationMessage('El archivo adjunto debe ser una URL válida (http:// o https://)');
            return false;
          }
        } else {
          // Subir archivo
          const fileInput = document.getElementById('swal-archivo-file-tarea');
          const file = fileInput.files[0];
          
          if (!file) {
            Swal.showValidationMessage('Por favor selecciona un archivo para subir');
            return false;
          }
          
          // Validar tamaño (50MB)
          if (file.size > 50 * 1024 * 1024) {
            Swal.showValidationMessage('El archivo es demasiado grande (máximo 50MB)');
            return false;
          }
          
          // Mostrar progreso
          const progressDiv = document.getElementById('upload-progress');
          const progressBar = document.getElementById('upload-progress-bar');
          const statusText = document.getElementById('upload-status');
          
          progressDiv.style.display = 'block';
          statusText.textContent = 'Subiendo archivo...';
          
          try {
            // Subir archivo
            const formData = new FormData();
            formData.append('archivo', file);
            
            const uploadResponse = await fetch(`${API_URL}/classroom/upload-archivo`, {
              method: 'POST',
              body: formData
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (!uploadResponse.ok) {
              throw new Error(uploadResult.message || 'Error al subir archivo');
            }
            
            archivoUrl = uploadResult.url;
            progressBar.style.width = '100%';
            statusText.textContent = '✓ Archivo subido exitosamente';
            
          } catch (error) {
            progressDiv.style.display = 'none';
            Swal.showValidationMessage('Error al subir archivo: ' + error.message);
            return false;
          }
        }
      }
      
      return { curso, titulo, descripcion, requerimientos, fecha, hora, puntos, linkUrl, archivoUrl, notificar };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      await crearTarea(result.value);
    }
  });
}

async function crearTarea(datos) {
  try {
    // Convertir fecha y hora a formato MySQL datetime
    const fechaLimite = `${datos.fecha} ${datos.hora}:00`;
    
    const response = await fetch(`${API_URL}/classroom/tareas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_curso: datos.curso,
        id_profesor: userId,
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        requerimientos: datos.requerimientos || null,
        fecha_limite: fechaLimite,
        puntos: parseInt(datos.puntos),
        link_url: datos.linkUrl || null,
        archivo_adjunto: datos.archivoUrl || null,
        notificar: datos.notificar ? 1 : 0
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      Swal.fire({
        title: '¡Tarea creada!',
        html: `<div style="text-align: center;">
          <i data-lucide="check-circle" style="width: 48px; height: 48px; color: #10b981; margin-bottom: 12px;"></i>
          <p style="margin: 0; color: #333;">La tarea ha sido asignada exitosamente</p>
          ${datos.notificar ? '<p style="margin: 8px 0 0 0; font-size: 14px; color: #667eea;"><i data-lucide="bell" style="width: 14px; height: 14px;"></i> Los alumnos han sido notificados</p>' : ''}
        </div>`,
        icon: 'success',
        confirmButtonColor: '#667eea',
        didOpen: () => {
          lucide.createIcons();
        }
      });
      
      // Si estamos en la vista de tareas, cambiar al curso de la tarea recién creada y recargar
      const currentView = document.querySelector('.nav-item.active')?.getAttribute('data-view');
      if (currentView === 'tasks') {
        // Seleccionar el curso de la tarea creada
        await seleccionarCurso(parseInt(datos.curso));
      } else {
        // Si no estamos en la vista de tareas, solo desactivar el filtro para que aparezcan todas
        cursoActivo = null;
        const btnCourseSelector = document.getElementById('btnCourseSelector');
        const currentCourseName = document.getElementById('currentCourseName');
        if (btnCourseSelector && currentCourseName) {
          currentCourseName.textContent = 'Todos los cursos';
        }
      }
    } else {
      throw new Error(result.message || 'Error al crear tarea');
    }
  } catch (error) {
    console.error('Error al crear tarea:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo crear la tarea. Intenta de nuevo.',
      icon: 'error',
      confirmButtonColor: '#667eea'
    });
  }
}

async function eliminarTarea(idTarea, titulo) {
  const result = await Swal.fire({
    title: '¿Eliminar tarea?',
    html: `¿Estás seguro de eliminar la tarea "<strong>${titulo}</strong>"?<br><br>
      <span style="color: #dc3545; font-size: 13px;">
        <i data-lucide="alert-triangle" style="width: 14px; height: 14px;"></i>
        Esta acción eliminará todas las entregas asociadas
      </span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    didOpen: () => {
      lucide.createIcons();
    }
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch(`${API_URL}/classroom/tareas/${idTarea}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          title: '¡Eliminada!',
          text: 'La tarea ha sido eliminada exitosamente',
          icon: 'success',
          confirmButtonColor: '#667eea',
          timer: 2000
        });

        // Recargar las tareas
        if (cursoActivo !== null) {
          seleccionarCurso(cursoActivo);
        } else {
          loadTareas();
        }
      } else {
        throw new Error(data.message || 'Error al eliminar tarea');
      }
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar la tarea. Intenta de nuevo.',
        icon: 'error',
        confirmButtonColor: '#667eea'
      });
    }
  }
}

// =====================================================
// ENTREGAR TAREA (ALUMNO)
// =====================================================

async function mostrarFormularioEntrega(idTarea, tituloTarea) {
  const { value: formValues } = await Swal.fire({
    title: '<div style="display: flex; align-items: center; gap: 10px; justify-content: center;"><i data-lucide="send" style="width: 24px; height: 24px; color: #667eea;"></i><span>Entregar Tarea</span></div>',
    html: `
      <div style="text-align: left; padding: 0 8px;">
        <!-- Información de la tarea -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 12px; margin-bottom: 24px; color: white;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <i data-lucide="clipboard-check" style="width: 18px; height: 18px;"></i>
            <strong style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9;">Tarea</strong>
          </div>
          <div style="font-size: 16px; font-weight: 600;">${tituloTarea}</div>
        </div>
        
        <!-- Comentario -->
        <div style="margin-bottom: 20px;">
          <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
            <i data-lucide="message-square" style="width: 16px; height: 16px; color: #667eea;"></i>
            Comentario <span style="font-weight: 400; color: #6c757d; font-size: 12px;">(opcional)</span>
          </label>
          <textarea 
            id="comentarioEntrega" 
            placeholder="Escribe aquí cualquier comentario sobre tu entrega..."
            style="width: 100%; min-height: 110px; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; resize: vertical; font-family: inherit; transition: all 0.2s; box-sizing: border-box;"
            onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
            onblur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none';"
          ></textarea>
        </div>
        
        <!-- Archivo adjunto -->
        <div style="margin-bottom: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
            <i data-lucide="paperclip" style="width: 16px; height: 16px; color: #667eea;"></i>
            Archivo adjunto <span style="font-weight: 400; color: #6c757d; font-size: 12px;">(opcional)</span>
          </label>
          <div style="position: relative;">
            <input 
              type="file" 
              id="archivoEntrega"
              style="width: 100%; padding: 12px; border: 2px dashed #cbd5e0; border-radius: 8px; font-size: 14px; background: #f8f9fa; cursor: pointer; box-sizing: border-box; transition: all 0.2s;"
              onchange="this.style.borderColor='#667eea'; this.style.background='#f0f4ff';"
            />
          </div>
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 8px; padding: 8px 12px; background: #e3f2fd; border-left: 3px solid #2196f3; border-radius: 4px;">
            <i data-lucide="info" style="width: 14px; height: 14px; color: #2196f3;"></i>
            <small style="color: #1976d2; font-size: 12px;">
              Puedes adjuntar documentos, imágenes, PDFs, etc.
            </small>
          </div>
        </div>
      </div>
    `,
    width: '650px',
    padding: '2em',
    showCancelButton: true,
    confirmButtonText: '<i data-lucide="send" style="width: 16px; height: 16px; margin-right: 6px;"></i> Entregar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#667eea',
    cancelButtonColor: '#6c757d',
    customClass: {
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel'
    },
    focusConfirm: false,
    didOpen: () => {
      lucide.createIcons();
    },
    preConfirm: () => {
      const comentario = document.getElementById('comentarioEntrega').value;
      const archivo = document.getElementById('archivoEntrega').files[0];
      
      return { comentario, archivo };
    }
  });

  if (formValues) {
    await entregarTarea(idTarea, formValues.comentario, formValues.archivo);
  }
}

async function entregarTarea(idTarea, comentario, archivo) {
  try {
    showLoader();
    
    // Por ahora, sin upload de archivos real, solo guardamos el comentario
    // En producción, aquí subirías el archivo a un servidor
    let urlArchivo = null;
    
    if (archivo) {
      // Simulación: en producción usarías FormData y subirías a un endpoint
      urlArchivo = `uploads/${archivo.name}`;
    }
    
    const response = await fetch(`${API_URL}/classroom/entregas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_tarea: idTarea,
        id_alumno: userId,
        contenido: comentario || '',
        archivo_url: urlArchivo
      })
    });

    const data = await response.json();

    if (response.ok) {
      Swal.fire({
        title: '¡Entregada!',
        text: 'Tu tarea ha sido entregada exitosamente',
        icon: 'success',
        confirmButtonColor: '#667eea',
        timer: 2000
      });

      // Recargar las tareas
      if (cursoActivo !== null) {
        seleccionarCurso(cursoActivo);
      } else {
        loadTareas();
      }
    } else {
      throw new Error(data.message || 'Error al entregar tarea');
    }
  } catch (error) {
    console.error('Error al entregar tarea:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo entregar la tarea. Intenta de nuevo.',
      icon: 'error',
      confirmButtonColor: '#667eea'
    });
  } finally {
    hideLoader();
  }
}

async function verDetalleEntrega(idTarea, idAlumno) {
  try {
    showLoader();
    
    const response = await fetch(`${API_URL}/classroom/entregas/${idTarea}/alumno/${idAlumno}`);
    const entrega = await response.json();
    
    if (!response.ok) {
      throw new Error(entrega.message || 'Error al obtener detalles');
    }
    
    const fechaEntrega = new Date(entrega.fecha_entrega);
    const fechaFormateada = fechaEntrega.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let estadoHTML = '';
    if (entrega.calificacion) {
      const porcentaje = (entrega.calificacion / entrega.tarea_puntos) * 100;
      const colorCalif = porcentaje >= 70 ? '#10b981' : porcentaje >= 50 ? '#f59e0b' : '#ef4444';
      
      estadoHTML = `
        <div style="background: linear-gradient(135deg, ${colorCalif}, ${colorCalif}dd); padding: 20px; border-radius: 12px; margin-bottom: 24px; color: white; text-align: center;">
          <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; margin-bottom: 8px;">
            <i data-lucide="award" style="width: 16px; height: 16px;"></i> Calificación
          </div>
          <div style="font-size: 42px; font-weight: 700; margin-bottom: 4px;">
            ${entrega.calificacion}
          </div>
          <div style="font-size: 14px; opacity: 0.9;">
            de ${entrega.tarea_puntos} puntos
          </div>
        </div>
      `;
    } else {
      estadoHTML = `
        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 20px; border-radius: 12px; margin-bottom: 24px; color: white; text-align: center;">
          <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; margin-bottom: 8px;">
            <i data-lucide="clock" style="width: 16px; height: 16px;"></i> Estado
          </div>
          <div style="font-size: 24px; font-weight: 600;">
            Pendiente de calificación
          </div>
        </div>
      `;
    }
    
    Swal.fire({
      title: '<div style="display: flex; align-items: center; gap: 10px; justify-content: center;"><i data-lucide="file-check" style="width: 24px; height: 24px; color: #667eea;"></i><span>Detalles de Entrega</span></div>',
      html: `
        <div style="text-align: left; padding: 0 8px;">
          ${estadoHTML}
          
          <!-- Información de la tarea -->
          <div style="background: #f8f9fa; padding: 16px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #667eea;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <i data-lucide="clipboard" style="width: 16px; height: 16px; color: #667eea;"></i>
              <strong style="font-size: 13px; color: #667eea; text-transform: uppercase; letter-spacing: 0.5px;">Tarea</strong>
            </div>
            <div style="font-size: 16px; font-weight: 600; color: #2c3e50; margin-bottom: 8px;">
              ${entrega.tarea_titulo}
            </div>
            <div style="display: flex; align-items: center; gap: 6px; color: #6c757d; font-size: 13px;">
              <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
              <span>Entregado el ${fechaFormateada}</span>
            </div>
          </div>
          
          <!-- Comentario del alumno -->
          ${entrega.contenido ? `
            <div style="margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                <i data-lucide="message-square" style="width: 16px; height: 16px; color: #667eea;"></i>
                Tu comentario
              </div>
              <div style="background: #ffffff; padding: 14px; border-radius: 8px; border: 2px solid #e9ecef; font-size: 14px; color: #495057; line-height: 1.6; white-space: pre-wrap;">
                ${entrega.contenido}
              </div>
            </div>
          ` : ''}
          
          <!-- Archivo adjunto -->
          ${entrega.archivo_url ? `
            <div style="margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                <i data-lucide="paperclip" style="width: 16px; height: 16px; color: #667eea;"></i>
                Archivo adjunto
              </div>
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 16px; background: #e9ecef; border: 2px solid #ced4da; border-radius: 8px; color: #6c757d; font-weight: 600; font-size: 14px; opacity: 0.6; cursor: not-allowed;">
                <i data-lucide="file" style="width: 18px; height: 18px;"></i>
                <span>Archivo entregado</span>
                <i data-lucide="lock" style="width: 14px; height: 14px;"></i>
              </div>
              <div style="font-size: 12px; color: #6c757d; margin-top: 8px; font-style: italic;">
                El archivo no está disponible para visualización
              </div>
            </div>
          ` : ''}
          
          <!-- Comentario del profesor -->
          ${entrega.comentario_profesor ? `
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px; font-weight: 600; color: #92400e; font-size: 14px;">
                <i data-lucide="user-check" style="width: 16px; height: 16px;"></i>
                Comentario del profesor
              </div>
              <div style="font-size: 14px; color: #78350f; line-height: 1.6; white-space: pre-wrap;">
                ${entrega.comentario_profesor}
              </div>
            </div>
          ` : ''}
        </div>
      `,
      width: '650px',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#667eea',
      didOpen: () => {
        lucide.createIcons();
      }
    });
    
  } catch (error) {
    console.error('Error al ver detalles:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudieron cargar los detalles de la entrega',
      icon: 'error',
      confirmButtonColor: '#667eea'
    });
  } finally {
    hideLoader();
  }
}

// Ver entregas de una tarea (Profesor)
async function verEntregasTarea(idTarea) {
  try {
    showLoader();
    
    const response = await fetch(`${API_URL}/classroom/entregas/${idTarea}`);
    const entregas = await response.json();
    
    if (!response.ok) {
      throw new Error('Error al obtener entregas');
    }
    
    if (entregas.length === 0) {
      Swal.fire({
        title: 'Sin entregas',
        text: 'Aún no hay entregas para esta tarea',
        icon: 'info',
        confirmButtonColor: '#667eea'
      });
      return;
    }
    
    // Construir lista de entregas
    const entregasHTML = entregas.map(entrega => {
      const fechaEntrega = new Date(entrega.fecha_entrega);
      const fechaFormateada = fechaEntrega.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const calificado = entrega.calificacion !== null;
      const badgeCalif = calificado 
        ? `<span style="background: #10b981; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${entrega.calificacion} pts</span>`
        : `<span style="background: #f59e0b; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Pendiente</span>`;
      
      return `
        <div style="background: white; border: 2px solid #e9ecef; border-radius: 10px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;" 
             onclick="calificarEntrega(${entrega.id_entrega})"
             onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.15)';"
             onmouseout="this.style.borderColor='#e9ecef'; this.style.boxShadow='none';">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">
                ${entrega.alumno_nombre.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div style="font-weight: 600; color: #2c3e50; font-size: 15px;">${entrega.alumno_nombre}</div>
                <div style="font-size: 12px; color: #6c757d; display: flex; align-items: center; gap: 4px;">
                  <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                  ${fechaFormateada}
                </div>
              </div>
            </div>
            ${badgeCalif}
          </div>
          
          ${entrega.contenido ? `
            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; font-size: 13px; color: #495057; margin-bottom: 8px; border-left: 3px solid #667eea;">
              ${entrega.contenido.length > 100 ? entrega.contenido.substring(0, 100) + '...' : entrega.contenido}
            </div>
          ` : ''}
          
          <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: #6c757d;">
            ${entrega.archivo_url ? `
              <div style="display: flex; align-items: center; gap: 4px;">
                <i data-lucide="paperclip" style="width: 12px; height: 12px;"></i>
                <span>Archivo adjunto</span>
              </div>
            ` : ''}
            ${calificado ? `
              <div style="display: flex; align-items: center; gap: 4px; color: #10b981;">
                <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i>
                <span>Calificada</span>
              </div>
            ` : `
              <div style="display: flex; align-items: center; gap: 4px; color: #f59e0b;">
                <i data-lucide="alert-circle" style="width: 12px; height: 12px;"></i>
                <span>Clic para calificar</span>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
    
    Swal.fire({
      title: `<div style="display: flex; align-items: center; gap: 10px; justify-content: center;">
                <i data-lucide="users" style="width: 24px; height: 24px; color: #667eea;"></i>
                <span>Entregas de la Tarea</span>
              </div>`,
      html: `
        <div style="text-align: left; padding: 0 8px; max-height: 500px; overflow-y: auto;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 16px; border-radius: 10px; margin-bottom: 20px; color: white; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; margin-bottom: 4px;">${entregas.length}</div>
            <div style="font-size: 14px; opacity: 0.9;">Entrega${entregas.length !== 1 ? 's' : ''} recibida${entregas.length !== 1 ? 's' : ''}</div>
          </div>
          ${entregasHTML}
        </div>
      `,
      width: '700px',
      showConfirmButton: true,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#667eea',
      didOpen: () => {
        lucide.createIcons();
      }
    });
    
  } catch (error) {
    console.error('Error al ver entregas:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudieron cargar las entregas',
      icon: 'error',
      confirmButtonColor: '#667eea'
    });
  } finally {
    hideLoader();
  }
}

// Calificar entrega (Profesor)
window.calificarEntrega = async function(idEntrega) {
  try {
    showLoader();
    
    // Obtener detalles completos de la entrega
    const response = await fetch(`${API_URL}/classroom/entrega/${idEntrega}`);

    if (!response.ok) {
      throw new Error('Error al obtener la entrega');
    }

    const entrega = await response.json();
    hideLoader();

    // Formatear fecha de entrega
    const fechaEntrega = new Date(entrega.fecha_entrega);
    const fechaFormateada = fechaEntrega.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const { value: formValues } = await Swal.fire({
      title: `<div style="display: flex; align-items: center; gap: 10px; justify-content: center;">
                <i data-lucide="star" style="width: 24px; height: 24px; color: #f59e0b;"></i>
                <span>Calificar Entrega</span>
              </div>`,
      html: `
        <div style="text-align: left; padding: 0 8px; max-height: 70vh; overflow-y: auto;">
          <!-- Información del alumno -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 10px; margin-bottom: 20px; color: white;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; border: 2px solid white;">
                ${entrega.alumno_nombre.charAt(0).toUpperCase()}
              </div>
              <div style="flex: 1;">
                <div style="font-size: 16px; font-weight: 600;">${entrega.alumno_nombre}</div>
                <div style="font-size: 12px; opacity: 0.9;">${entrega.alumno_email}</div>
                <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">
                  <i data-lucide="clock" style="width: 11px; height: 11px;"></i>
                  Entregado: ${fechaFormateada}
                </div>
              </div>
            </div>
          </div>

          <!-- Tarea -->
          <div style="background: #f8f9fa; padding: 14px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #667eea;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <i data-lucide="file-text" style="width: 14px; height: 14px; color: #667eea;"></i>
              <strong style="font-size: 12px; color: #667eea; text-transform: uppercase; letter-spacing: 0.5px;">Tarea</strong>
            </div>
            <div style="font-size: 14px; font-weight: 600; color: #2c3e50;">${entrega.tarea_titulo}</div>
            <div style="font-size: 12px; color: #6c757d; margin-top: 2px;">Puntos totales: ${entrega.tarea_puntos}</div>
          </div>

          <!-- Comentario del alumno -->
          ${entrega.contenido ? `
            <div style="margin-bottom: 16px;">
              <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 13px;">
                <i data-lucide="message-circle" style="width: 14px; height: 14px; color: #10b981;"></i>
                Comentario del Alumno
              </label>
              <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; font-size: 14px; color: #2c3e50; line-height: 1.5; max-height: 120px; overflow-y: auto;">
                ${entrega.contenido}
              </div>
            </div>
          ` : ''}

          <!-- Archivo adjunto -->
          ${entrega.archivo_url ? `
            <div style="margin-bottom: 20px;">
              <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 13px;">
                <i data-lucide="paperclip" style="width: 14px; height: 14px; color: #3b82f6;"></i>
                Archivo Adjunto
              </label>
              <a href="${entrega.archivo_url}" 
                 download 
                 target="_blank"
                 style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; color: #1e40af; text-decoration: none; font-size: 13px; font-weight: 500; transition: all 0.2s;"
                 onmouseover="this.style.background='#dbeafe'; this.style.borderColor='#60a5fa';"
                 onmouseout="this.style.background='#eff6ff'; this.style.borderColor='#93c5fd';">
                <i data-lucide="download" style="width: 16px; height: 16px;"></i>
                <span>${entrega.archivo_url.split('/').pop()}</span>
              </a>
            </div>
          ` : ''}

          <!-- Divider -->
          <div style="border-top: 2px dashed #e9ecef; margin: 24px 0;"></div>

          <!-- Formulario de calificación -->
          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
              <i data-lucide="award" style="width: 16px; height: 16px; color: #f59e0b;"></i>
              Calificación <span style="color: #dc3545;">*</span>
            </label>
            <input 
              type="number" 
              id="calificacionInput" 
              value="${entrega.calificacion || ''}"
              min="0" 
              max="${entrega.tarea_puntos}" 
              step="0.5"
              placeholder="Ingresa la calificación"
              style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; box-sizing: border-box;"
              onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
              onblur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none';"
            />
            <small style="color: #6c757d; font-size: 12px; display: block; margin-top: 4px;">
              Puntuación de 0 a ${entrega.tarea_puntos}
            </small>
          </div>
          
          <div style="margin-bottom: 8px;">
            <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
              <i data-lucide="message-square" style="width: 16px; height: 16px; color: #667eea;"></i>
              Retroalimentación <span style="font-weight: 400; color: #6c757d; font-size: 12px;">(opcional)</span>
            </label>
            <textarea 
              id="comentarioProfesor" 
              placeholder="Escribe un comentario o retroalimentación para el alumno..."
              style="width: 100%; min-height: 120px; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px; resize: vertical; font-family: inherit; box-sizing: border-box;"
              onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
              onblur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none';"
            >${entrega.comentario_profesor || ''}</textarea>
          </div>
        </div>
      `,
      width: '700px',
      showCancelButton: true,
      confirmButtonText: 'Guardar Calificación',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#6c757d',
      focusConfirm: false,
      didOpen: () => {
        lucide.createIcons();
      },
      preConfirm: () => {
        const calificacion = document.getElementById('calificacionInput').value;
        const comentario = document.getElementById('comentarioProfesor').value;
        
        if (!calificacion || calificacion === '') {
          Swal.showValidationMessage('Debes ingresar una calificación');
          return false;
        }
        
        const calif = parseFloat(calificacion);
        if (calif < 0 || calif > entrega.tarea_puntos) {
          Swal.showValidationMessage(`La calificación debe estar entre 0 y ${entrega.tarea_puntos}`);
          return false;
        }
      
        return { calificacion: calif, comentario };
      }
    });

    if (formValues) {
      await guardarCalificacion(idEntrega, formValues.calificacion, formValues.comentario);
    }
  } catch (error) {
    hideLoader();
    console.error('Error al cargar entrega:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo cargar la información de la entrega',
      confirmButtonColor: '#667eea'
    });
  }
}

async function guardarCalificacion(idEntrega, calificacion, comentario) {
  try {
    showLoader();
    
    const response = await fetch(`${API_URL}/classroom/entregas/${idEntrega}/calificar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        calificacion,
        comentario_profesor: comentario
      })
    });

    const data = await response.json();

    if (response.ok) {
      Swal.fire({
        title: '¡Calificación guardada!',
        text: 'La calificación ha sido registrada y el alumno ha sido notificado',
        icon: 'success',
        confirmButtonColor: '#667eea',
        timer: 2000
      });

      // Recargar las tareas
      if (cursoActivo !== null) {
        seleccionarCurso(cursoActivo);
      } else {
        loadTareas();
      }
    } else {
      throw new Error(data.message || 'Error al guardar calificación');
    }
  } catch (error) {
    console.error('Error al guardar calificación:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo guardar la calificación. Intenta de nuevo.',
      icon: 'error',
      confirmButtonColor: '#667eea'
    });
  } finally {
    hideLoader();
  }
}

// =====================================================
// FUNCIONES PARA ANUNCIOS
// =====================================================

async function mostrarFormularioAnuncio() {
  // Primero cargar los cursos del profesor
  const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
  const res = await fetch(`${API_URL}/classroom/clases/${tipo}/${userId}`);
  const cursos = await res.json();
  
  if (cursos.length === 0) {
    Swal.fire({
      title: 'Sin cursos',
      text: 'No tienes cursos asignados para crear anuncios',
      icon: 'info',
      confirmButtonColor: '#667eea'
    });
    return;
  }
  
  const cursosOptions = cursos.map(c => 
    `<option value="${c.id_curso}" style="color: #2c3e50; background: white;">${c.nombre_curso}</option>`
  ).join('');
  
  Swal.fire({
    title: '<div style="display: flex; align-items: center; gap: 12px;"><i data-lucide="megaphone" style="width: 28px; height: 28px; color: #667eea;"></i><span>Crear Anuncio</span></div>',
    html: `
      <div style="text-align: left; padding: 0 8px;">
        <!-- Selector de Curso -->
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">
          <i data-lucide="book-open" style="width: 16px; height: 16px; margin-right: 4px;"></i>
          Curso
        </label>
        <select id="swal-curso" style="width: 100%; margin: 0 0 20px 0; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; background: white; color: #2c3e50; cursor: pointer; appearance: none; background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23667eea%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e'); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px; padding-right: 40px; transition: all 0.2s;"
          onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
          onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';">
          <option value="" style="color: #2c3e50; background: white;">Selecciona un curso</option>
          ${cursosOptions}
        </select>
        
        <!-- Título con contador -->
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">
          <i data-lucide="type" style="width: 16px; height: 16px; margin-right: 4px;"></i>
          Título
          <span id="titulo-counter" style="float: right; color: #999; font-size: 12px; font-weight: 400;">0/100</span>
        </label>
        <input id="swal-titulo" class="swal2-input" placeholder="Ej: Examen parcial próxima semana" maxlength="100" 
          style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: all 0.2s;"
          onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
          onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';"
          oninput="document.getElementById('titulo-counter').textContent = this.value.length + '/100'">
        
        <!-- Contenido con contador -->
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">
          <i data-lucide="align-left" style="width: 16px; height: 16px; margin-right: 4px;"></i>
          Contenido
          <span id="contenido-counter" style="float: right; color: #999; font-size: 12px; font-weight: 400;">0/500</span>
        </label>
        <textarea id="swal-contenido" placeholder="Escribe tu anuncio aquí..." maxlength="500"
          style="width: 100%; min-height: 120px; resize: vertical; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; transition: all 0.2s;"
          onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
          onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';"
          oninput="document.getElementById('contenido-counter').textContent = this.value.length + '/500'"></textarea>
        
        <!-- Opciones adicionales -->
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <!-- ENLACE -->
          <div style="margin-bottom: 12px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #495057; padding: 10px; background: white; border-radius: 6px; transition: all 0.2s;">
              <input type="checkbox" id="swal-link" style="width: 18px; height: 18px; cursor: pointer;">
              <i data-lucide="link" style="width: 16px; height: 16px; color: #667eea;"></i>
              <span style="font-weight: 500;">Agregar enlace</span>
            </label>
            <div id="link-container" style="max-height: 0; opacity: 0; overflow: hidden; transition: all 0.3s ease; margin-top: 0;">
              <div style="margin-top: 12px; padding: 12px; background: white; border-radius: 6px; border: 2px solid #667eea; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <i data-lucide="external-link" style="width: 14px; height: 14px; color: #667eea;"></i>
                  <span style="font-size: 12px; font-weight: 600; color: #667eea;">URL del enlace</span>
                </div>
                <input id="swal-link-url" type="url" placeholder="https://ejemplo.com/recurso" 
                  style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 13px; transition: border-color 0.2s;"
                  onfocus="this.style.borderColor='#667eea';"
                  onblur="this.style.borderColor='#e0e0e0';">
              </div>
            </div>
          </div>
          
          <!-- ENCUESTA -->
          <div style="margin-bottom: 12px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #495057; padding: 10px; background: white; border-radius: 6px; transition: all 0.2s;">
              <input type="checkbox" id="swal-poll" style="width: 18px; height: 18px; cursor: pointer;">
              <i data-lucide="bar-chart-2" style="width: 16px; height: 16px; color: #667eea;"></i>
              <span style="font-weight: 500;">Agregar encuesta</span>
            </label>
            <div id="poll-container" style="max-height: 0; opacity: 0; overflow: hidden; transition: all 0.3s ease; margin-top: 0;">
              <div style="margin-top: 12px; padding: 16px; background: white; border-radius: 6px; border: 2px solid #667eea; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                  <i data-lucide="help-circle" style="width: 14px; height: 14px; color: #667eea;"></i>
                  <span style="font-size: 12px; font-weight: 600; color: #667eea;">Pregunta de la encuesta</span>
                </div>
                <input id="poll-question" type="text" placeholder="¿Cuál es tu opinión sobre...?" 
                  style="width: 100%; margin-bottom: 12px; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 13px; transition: border-color 0.2s;"
                  onfocus="this.style.borderColor='#667eea';"
                  onblur="this.style.borderColor='#e0e0e0';">
                
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <i data-lucide="list" style="width: 14px; height: 14px; color: #667eea;"></i>
                  <span style="font-size: 12px; font-weight: 600; color: #667eea;">Opciones (mín. 2, máx. 6)</span>
                </div>
                <div id="poll-options-container">
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                    <span style="font-size: 12px; color: #999; min-width: 20px;">1.</span>
                    <input type="text" class="poll-option" placeholder="Primera opción" 
                      style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 13px; transition: all 0.2s;"
                      onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
                      onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';">
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                    <span style="font-size: 12px; color: #999; min-width: 20px;">2.</span>
                    <input type="text" class="poll-option" placeholder="Segunda opción" 
                      style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 13px; transition: all 0.2s;"
                      onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)';"
                      onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';">
                  </div>
                </div>
                <button type="button" onclick="agregarOpcionPoll()" 
                  style="margin-top: 8px; padding: 8px 14px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;"
                  onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';"
                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                  <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i>
                  <span>Agregar opción</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- IMPORTANTE -->
          <div style="margin-bottom: 12px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #495057; padding: 10px; background: white; border-radius: 6px; transition: all 0.2s;"
              onmouseover="this.style.background='#fff9e6';"
              onmouseout="this.style.background='white';">
              <input type="checkbox" id="swal-importante" style="width: 18px; height: 18px; cursor: pointer;">
              <i data-lucide="alert-circle" style="width: 16px; height: 16px; color: #f59e0b;"></i>
              <span style="font-weight: 500;">Marcar como importante</span>
            </label>
          </div>
          
          <!-- NOTIFICAR -->
          <div>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #495057; padding: 10px; background: white; border-radius: 6px; transition: all 0.2s;"
              onmouseover="this.style.background='#f0f4ff';"
              onmouseout="this.style.background='white';">
              <input type="checkbox" id="swal-notificar" checked style="width: 18px; height: 18px; cursor: pointer;">
              <i data-lucide="bell" style="width: 16px; height: 16px; color: #667eea;"></i>
              <span style="font-weight: 500;">Notificar a los alumnos</span>
            </label>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i data-lucide="send" style="width: 16px; height: 16px; margin-right: 6px;"></i> Publicar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#667eea',
    cancelButtonColor: '#6c757d',
    width: '700px',
    customClass: {
      popup: 'animated-popup',
      confirmButton: 'animated-button'
    },
    didOpen: () => {
      // Recrear iconos de Lucide
      lucide.createIcons();
      
      // Event listener para enlace
      const linkCheckbox = document.getElementById('swal-link');
      const linkContainer = document.getElementById('link-container');
      const linkInput = document.getElementById('swal-link-url');
      
      linkCheckbox.addEventListener('change', function() {
        if (this.checked) {
          linkContainer.style.maxHeight = '200px';
          linkContainer.style.opacity = '1';
          linkContainer.style.marginTop = '12px';
          setTimeout(() => {
            linkInput.focus();
          }, 300);
        } else {
          linkContainer.style.maxHeight = '0';
          linkContainer.style.opacity = '0';
          linkContainer.style.marginTop = '0';
          linkInput.value = '';
        }
      });
      
      // Event listener para encuesta
      const pollCheckbox = document.getElementById('swal-poll');
      const pollContainer = document.getElementById('poll-container');
      const pollQuestion = document.getElementById('poll-question');
      
      pollCheckbox.addEventListener('change', function() {
        if (this.checked) {
          pollContainer.style.maxHeight = '600px';
          pollContainer.style.opacity = '1';
          pollContainer.style.marginTop = '12px';
          setTimeout(() => {
            pollQuestion.focus();
          }, 300);
        } else {
          pollContainer.style.maxHeight = '0';
          pollContainer.style.opacity = '0';
          pollContainer.style.marginTop = '0';
          pollQuestion.value = '';
          // Reset opciones
          const options = pollContainer.querySelectorAll('.poll-option');
          options.forEach(opt => opt.value = '');
        }
      });
    },
    preConfirm: () => {
      const curso = document.getElementById('swal-curso').value;
      const titulo = document.getElementById('swal-titulo').value;
      const contenido = document.getElementById('swal-contenido').value;
      const linkUrl = document.getElementById('swal-link').checked ? document.getElementById('swal-link-url').value : '';
      const importante = document.getElementById('swal-importante').checked;
      const notificar = document.getElementById('swal-notificar').checked;
      
      // Poll data
      const hasPoll = document.getElementById('swal-poll').checked;
      let pollData = null;
      
      if (hasPoll) {
        const pollQuestion = document.getElementById('poll-question').value;
        const pollOptions = Array.from(document.querySelectorAll('.poll-option'))
          .map(input => input.value.trim())
          .filter(val => val !== '');
        
        if (!pollQuestion || pollOptions.length < 2) {
          Swal.showValidationMessage('La encuesta debe tener una pregunta y al menos 2 opciones');
          return false;
        }
        
        pollData = {
          question: pollQuestion,
          options: pollOptions
        };
      }
      
      if (!curso || !titulo || !contenido) {
        Swal.showValidationMessage('El curso, título y contenido son requeridos');
        return false;
      }
      
      if (linkUrl && !linkUrl.match(/^https?:\/\/.+/)) {
        Swal.showValidationMessage('El enlace debe ser una URL válida (http:// o https://)');
        return false;
      }
      
      return { curso, titulo, contenido, linkUrl, importante, notificar, pollData };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      await crearAnuncio(result.value);
    }
  });
}

// Función global para agregar opciones a la encuesta
window.agregarOpcionPoll = function() {
  const container = document.getElementById('poll-options-container');
  const optionCount = container.querySelectorAll('.poll-option').length + 1;
  
  if (optionCount > 6) {
    Swal.showValidationMessage('Máximo 6 opciones permitidas');
    return;
  }
  
  // Crear contenedor con numeración
  const optionWrapper = document.createElement('div');
  optionWrapper.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-bottom: 6px;';
  
  const numberLabel = document.createElement('span');
  numberLabel.textContent = `${optionCount}.`;
  numberLabel.style.cssText = 'font-size: 12px; color: #999; min-width: 20px;';
  
  const newOption = document.createElement('input');
  newOption.type = 'text';
  newOption.className = 'poll-option';
  newOption.placeholder = `Opción ${optionCount}`;
  newOption.style.cssText = 'flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 13px; transition: all 0.2s;';
  newOption.onfocus = function() {
    this.style.borderColor = '#667eea';
    this.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
  };
  newOption.onblur = function() {
    this.style.borderColor = '#e0e0e0';
    this.style.boxShadow = 'none';
  };
  
  optionWrapper.appendChild(numberLabel);
  optionWrapper.appendChild(newOption);
  container.appendChild(optionWrapper);
  
  // Animar entrada
  optionWrapper.style.opacity = '0';
  optionWrapper.style.transform = 'translateX(-10px)';
  setTimeout(() => {
    optionWrapper.style.transition = 'all 0.3s ease';
    optionWrapper.style.opacity = '1';
    optionWrapper.style.transform = 'translateX(0)';
  }, 10);
  
  newOption.focus();
  
  // Recrear iconos de Lucide
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Función global para votar en encuestas
window.votarEncuesta = async function(idEncuesta, idOpcion, idAnuncio) {
  try {
    const response = await fetch(`${API_URL}/classroom/encuestas/votar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_encuesta: idEncuesta,
        id_opcion: idOpcion,
        id_alumno: userId
      })
    });

    const result = await response.json();

    if (response.ok) {
      // Obtener los datos actualizados de la encuesta
      const resEncuesta = await fetch(`${API_URL}/classroom/encuestas/${idEncuesta}/${userId}`);
      const encuestaActualizada = await resEncuesta.json();
      
      // Actualizar solo el contenedor de la poll
      const pollContainer = document.getElementById(`poll-${idEncuesta}`);
      
      if (pollContainer) {
        // Actualizar el contenido usando outerHTML para reemplazar completamente el elemento
        const nuevoHTML = renderPoll(encuestaActualizada, idAnuncio);
        pollContainer.outerHTML = nuevoHTML;
        
        // Reinicializar los iconos de lucide
        setTimeout(() => {
          lucide.createIcons();
        }, 100);
      } else {
        console.warn('No se encontró el contenedor de la poll con ID:', `poll-${idEncuesta}`);
      }
      
      // Mostrar mensaje de éxito breve
      const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true
      });
      
      const mensaje = result.cambio ? 'Voto actualizado' : 'Voto registrado';
      Toast.fire({
        icon: 'success',
        title: mensaje
      });
      
    } else {
      throw new Error(result.message || 'Error al votar');
    }
  } catch (error) {
    console.error('Error al votar:', error);
    Swal.fire({
      title: 'Error',
      text: error.message || 'No se pudo registrar tu voto',
      icon: 'error',
      confirmButtonColor: '#667eea'
    });
  }
}

async function crearAnuncio(datos) {
  try {
    const response = await fetch(`${API_URL}/classroom/anuncios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_curso: datos.curso,
        id_profesor: userId,
        titulo: datos.titulo,
        contenido: datos.contenido,
        link_url: datos.linkUrl || null,
        importante: datos.importante || false,
        notificar: datos.notificar || true,
        poll: datos.pollData || null
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      Swal.fire({
        title: '¡Publicado!',
        text: 'Tu anuncio ha sido publicado exitosamente',
        icon: 'success',
        confirmButtonColor: '#667eea'
      });
      
      // Recargar los anuncios según la vista activa
      const vistaActiva = document.querySelector('.content-view:not([style*="display: none"])');
      if (vistaActiva && vistaActiva.id === 'viewAnnouncements') {
        await loadAnunciosProfesor();
      } else {
        await loadFeed();
      }
    } else {
      throw new Error(result.message || 'Error al crear anuncio');
    }
  } catch (error) {
    console.error('Error al crear anuncio:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo publicar el anuncio. Intenta de nuevo.',
      icon: 'error',
      confirmButtonColor: '#667eea'
    });
  }
}

async function loadAnunciosProfesor() {
  try {
    const res = await fetch(`${API_URL}/classroom/anuncios/profesor/${userId}`);
    const anuncios = await res.json();
    renderAnunciosProfesor(anuncios);
  } catch (error) {
    console.error('Error al cargar anuncios del profesor:', error);
  }
}

function renderAnunciosProfesor(anuncios) {
  const container = document.getElementById('anunciosProfesorContainer');
  
  if (!container) return;
  
  if (anuncios.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay anuncios creados</p>';
    return;
  }
  
  container.innerHTML = anuncios.map(anuncio => {
    const fecha = new Date(anuncio.fecha_creacion);
    const tiempoTranscurrido = calcularTiempoTranscurrido(fecha);
    const importante = anuncio.importante;
    
    // Generar avatar o iniciales
    const avatarHTML = renderAvatarHTML(
      anuncio.profesor_avatar, 
      anuncio.profesor_nombre, 
      '', 
      importante ? 'linear-gradient(135deg, #f59e0b, #dc2626)' : 'linear-gradient(135deg, #667eea, #764ba2)'
    );
    
    return `
      <div class="activity-card announcement ${importante ? 'importante' : ''}" onclick="abrirAnuncio(${anuncio.id_anuncio})" style="cursor: pointer;">
        ${importante ? '<div class="badge-importante"><i data-lucide="alert-circle"></i> Importante</div>' : ''}
        <div class="card-header">
          ${avatarHTML}
          <div class="card-info">
            <div class="card-title" style="cursor: pointer; transition: color 0.2s;" 
                 onmouseover="this.style.color='#667eea'" 
                 onmouseout="this.style.color=''" 
                 onclick="event.stopPropagation(); verPerfilProfesor(${anuncio.id_profesor})">${anuncio.profesor_nombre}</div>
            <div class="card-meta">
              <span class="course-name">${anuncio.nombre_curso}</span>
              <span class="separator">•</span>
              <span class="time">${tiempoTranscurrido}</span>
            </div>
          </div>
          <i data-lucide="megaphone" class="card-icon"></i>
        </div>
        <div class="card-content">
          <h4>${anuncio.titulo}</h4>
          <p>${anuncio.contenido}</p>
          ${anuncio.link_url ? `
            <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #667eea;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <i data-lucide="link" style="width: 16px; height: 16px; color: #667eea;"></i>
                <span style="font-size: 12px; font-weight: 600; color: #495057;">Enlace adjunto</span>
              </div>
              <a href="${anuncio.link_url}" target="_blank" style="color: #667eea; text-decoration: none; font-size: 14px; word-break: break-all;" onclick="event.stopPropagation();">
                ${anuncio.link_url}
              </a>
            </div>
          ` : ''}
          ${anuncio.encuesta ? renderPoll(anuncio.encuesta, anuncio.id_anuncio) : ''}
        </div>
        <div class="card-footer">
          <button class="btn-text" onclick="event.stopPropagation();">
            <i data-lucide="message-circle"></i>
            <span id="count-${anuncio.id_anuncio}">${anuncio.total_comentarios || 0}</span> Comentario${(anuncio.total_comentarios || 0) !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  lucide.createIcons();
}

// =====================================================
// ABRIR ANUNCIO COMPLETO CON COMENTARIOS
// =====================================================
window.abrirAnuncio = async function(idAnuncio) {
  try {
    // Obtener datos completos del anuncio
    const resAnuncio = await fetch(`${API_URL}/classroom/anuncio/${idAnuncio}/${userId}`);
    const anuncio = await resAnuncio.json();
    
    console.log('📋 Datos del anuncio:', anuncio);
    console.log('👨‍🏫 ID Profesor:', anuncio.id_profesor);
    
    // Obtener comentarios
    const resComentarios = await fetch(`${API_URL}/classroom/comentarios/${idAnuncio}`);
    const comentarios = await resComentarios.json();
    
    // Construir HTML del anuncio
    const fecha = new Date(anuncio.fecha_creacion);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Generar avatar o iniciales para el modal
    let avatarElement = '';
    if (anuncio.profesor_avatar) {
      const BASE_URL = window.BASE_URL || 'http://localhost:3000';
      const avatarUrl = `${BASE_URL}${anuncio.profesor_avatar}`;
      avatarElement = `
        <div class="avatar-circle" style="width: 48px; height: 48px; min-width: 48px; background: none; padding: 0; overflow: hidden;">
          <img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
      `;
    } else {
      const iniciales = obtenerIniciales(anuncio.profesor_nombre);
      avatarElement = `
        <div class="avatar-circle" style="width: 48px; height: 48px; min-width: 48px; font-size: 16px; background: linear-gradient(135deg, ${anuncio.importante ? '#f59e0b, #dc2626' : '#667eea, #764ba2'});">
          <span>${iniciales}</span>
        </div>
      `;
    }
    
    let anuncioHTML = `
      <div style="text-align: left;">
        <!-- Header del anuncio -->
        <div style="display: flex; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e9ecef;">
          ${avatarElement}
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 16px; color: #2c3e50; margin-bottom: 4px; cursor: pointer; transition: color 0.2s;" 
                 onmouseover="this.style.color='#667eea'" 
                 onmouseout="this.style.color='#2c3e50'" 
                 onclick="verPerfilProfesor(${anuncio.id_profesor})">${anuncio.profesor_nombre}</div>
            <div style="font-size: 13px; color: #6c757d;">
              <span>${anuncio.nombre_curso}</span>
              <span style="margin: 0 6px;">•</span>
              <span>${fechaFormateada}</span>
            </div>
          </div>
          ${anuncio.importante ? '<div style="background: linear-gradient(135deg, #f59e0b, #dc2626); color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; height: fit-content;"><i data-lucide="alert-circle" style="width: 14px; height: 14px; margin-right: 4px;"></i> Importante</div>' : ''}
        </div>
        
        <!-- Contenido del anuncio -->
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 20px; font-weight: 600;">${anuncio.titulo}</h3>
          <p style="margin: 0; color: #495057; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${anuncio.contenido}</p>
          
          ${anuncio.link_url ? `
            <div style="margin-top: 16px; padding: 14px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <i data-lucide="link" style="width: 18px; height: 18px; color: #667eea;"></i>
                <span style="font-size: 13px; font-weight: 600; color: #495057;">Enlace adjunto</span>
              </div>
              <a href="${anuncio.link_url}" target="_blank" style="color: #667eea; text-decoration: none; font-size: 14px; word-break: break-all;">
                ${anuncio.link_url}
              </a>
            </div>
          ` : ''}
          
          ${anuncio.encuesta ? renderPoll(anuncio.encuesta, anuncio.id_anuncio) : ''}
        </div>
        
        <!-- Sección de comentarios -->
        <div style="border-top: 2px solid #e9ecef; padding-top: 20px;">
          <h4 style="margin: 0 0 16px 0; color: #2c3e50; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="message-circle" style="width: 20px; height: 20px; color: #667eea;"></i>
            Comentarios (${comentarios.length})
          </h4>
          
          <div id="comentarios-container" style="max-height: 300px; overflow-y: auto; margin-bottom: 16px;">
            ${comentarios.length > 0 ? comentarios.map(com => {
              const fechaCom = new Date(com.fecha_creacion);
              const tiempo = calcularTiempoTranscurrido(fechaCom);
              
              // Generar avatar o iniciales para comentarios
              let avatarComentario = '';
              if (com.avatar_usuario) {
                const BASE_URL = window.BASE_URL || 'http://localhost:3000';
                const avatarUrl = `${BASE_URL}${com.avatar_usuario}`;
                avatarComentario = `
                  <div class="avatar-circle" style="width: 36px; height: 36px; min-width: 36px; background: none !important; padding: 0; border: none; overflow: hidden;">
                    <img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">
                  </div>
                `;
              } else {
                const inicialesCom = obtenerIniciales(com.nombre_usuario);
                avatarComentario = `
                  <div class="avatar-circle" style="width: 36px; height: 36px; min-width: 36px; font-size: 12px; background: linear-gradient(135deg, #667eea, #764ba2) !important; border: none;">
                    <span>${inicialesCom}</span>
                  </div>
                `;
              }
              
              return `
                <div style="display: flex; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                  ${avatarComentario}
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span style="font-weight: 600; font-size: 14px; color: #2c3e50; cursor: pointer; transition: color 0.2s;" 
                            onmouseover="this.style.color='#667eea'" 
                            onmouseout="this.style.color='#2c3e50'" 
                            onclick="verPerfilComentario(${com.id_usuario}, '${com.tipo_usuario}')">${com.nombre_usuario}</span>
                      <span style="font-size: 12px; color: #6c757d;">${tiempo}</span>
                    </div>
                    <p style="margin: 0; font-size: 14px; color: #495057; line-height: 1.5; white-space: pre-wrap;">${com.contenido}</p>
                  </div>
                </div>
              `;
            }).join('') : '<p style="text-align: center; color: #999; padding: 20px;">Aún no hay comentarios. ¡Sé el primero en comentar!</p>'}
          </div>
          
          <!-- Formulario de comentario -->
          <div style="margin-top: 16px; background: #f8f9fa; padding: 16px; border-radius: 8px;">
            <textarea id="nuevoComentario" placeholder="Escribe un comentario..." 
              style="width: 100%; min-height: 80px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical; font-family: inherit; font-size: 14px; background: white;"
              maxlength="500"></textarea>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
              <span style="font-size: 12px; color: #6c757d;"><i data-lucide="info" style="width: 12px; height: 12px;"></i> Ctrl+Enter para enviar</span>
              <button id="btnEnviarComentario" style="padding: 10px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="send" style="width: 16px; height: 16px;"></i>
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    Swal.fire({
      html: anuncioHTML,
      showCloseButton: true,
      showConfirmButton: false,
      width: '700px',
      customClass: {
        container: 'anuncio-modal'
      },
      didOpen: () => {
        lucide.createIcons();
        
        const btnEnviar = document.getElementById('btnEnviarComentario');
        const textarea = document.getElementById('nuevoComentario');
        
        btnEnviar.onclick = async () => {
          const contenido = textarea.value.trim();
          
          if (!contenido) {
            Swal.showValidationMessage('Escribe algo antes de enviar');
            return;
          }
          
          try {
            const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
            
            const response = await fetch(`${API_URL}/classroom/comentarios`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id_anuncio: idAnuncio,
                id_usuario: userId,
                tipo_usuario: tipo,
                contenido: contenido
              })
            });
            
            const result = await response.json();
            
            if (result.success) {
              // Actualizar contador en el feed
              const countElement = document.getElementById(`count-${idAnuncio}`);
              if (countElement) {
                const currentCount = parseInt(countElement.textContent) || 0;
                countElement.textContent = currentCount + 1;
              }
              
              // Actualizar el título de comentarios
              const tituloComentarios = document.querySelector('h4');
              if (tituloComentarios && tituloComentarios.textContent.includes('Comentarios')) {
                const nuevoTotal = comentarios.length + 1;
                tituloComentarios.innerHTML = `
                  <i data-lucide="message-circle" style="width: 20px; height: 20px; color: #667eea;"></i>
                  Comentarios (${nuevoTotal})
                `;
                lucide.createIcons();
              }
              
              // Agregar el nuevo comentario al contenedor
              const container = document.getElementById('comentarios-container');
              const iniciales = obtenerIniciales(result.comentario.nombre_usuario);
              
              const nuevoComentarioHTML = `
                <div style="display: flex; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                  <div class="avatar-circle" style="width: 36px; height: 36px; min-width: 36px; font-size: 12px; background: linear-gradient(135deg, #667eea, #764ba2);">
                    <span>${iniciales}</span>
                  </div>
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span style="font-weight: 600; font-size: 14px; color: #2c3e50; cursor: pointer; transition: color 0.2s;" 
                            onmouseover="this.style.color='#667eea'" 
                            onmouseout="this.style.color='#2c3e50'" 
                            onclick="verPerfilComentario(${result.comentario.id_usuario}, '${result.comentario.tipo_usuario}')">${result.comentario.nombre_usuario}</span>
                      <span style="font-size: 12px; color: #6c757d;">Ahora</span>
                    </div>
                    <p style="margin: 0; font-size: 14px; color: #495057; line-height: 1.5; white-space: pre-wrap;">${result.comentario.contenido}</p>
                  </div>
                </div>
              `;
              
              // Si no había comentarios, limpiar el mensaje
              if (container.innerHTML.includes('Aún no hay comentarios')) {
                container.innerHTML = '';
              }
              
              container.insertAdjacentHTML('beforeend', nuevoComentarioHTML);
              container.scrollTop = container.scrollHeight;
              
              // Limpiar textarea
              textarea.value = '';
              
              // Mostrar toast de éxito
              const Toast = Swal.mixin({
                toast: true,
                position: 'bottom-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              });
              
              Toast.fire({
                icon: 'success',
                title: 'Comentario publicado'
              });
              
            } else {
              throw new Error(result.message || 'Error al crear comentario');
            }
          } catch (error) {
            console.error('Error al enviar comentario:', error);
            Swal.showValidationMessage('Error al enviar el comentario');
          }
        };
        
        // Permitir enviar con Ctrl+Enter
        textarea.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.key === 'Enter') {
            btnEnviar.click();
          }
        });
      }
    });
    
  } catch (error) {
    console.error('Error al abrir anuncio:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo cargar el anuncio',
      icon: 'error',
      confirmButtonColor: '#667eea'
    });
  }
}

// Event listener para botón de crear clase
const btnCreateClass = document.getElementById('btnCreateClass');
if (btnCreateClass) {
  btnCreateClass.addEventListener('click', createClass);
}

// =====================================================
// CALENDARIO
// =====================================================

let calendarioActual = {
  mes: new Date().getMonth() + 1,
  año: new Date().getFullYear()
};

let eventosDelMes = [];
let tareasDelMes = [];
let notasDelMes = [];

async function initCalendario() {
  // Cargar vista guardada
  const vistaGuardada = localStorage.getItem('vistaCalendario') || 'mes';
  vistaCalendarioActual = vistaGuardada;
  
  // Mostrar botón de crear evento solo para profesores
  const btnCrearEvento = document.getElementById('btnCrearEvento');
  if (btnCrearEvento && userRol.toLowerCase() === 'profesor') {
    btnCrearEvento.style.display = 'flex';
    btnCrearEvento.onclick = mostrarFormularioEvento;
  }
  
  // Event listeners para botones de vista
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const vista = this.getAttribute('data-calendar-view');
      cambiarVistaCalendario(vista);
    });
  });
  
  // Aplicar vista guardada a los botones
  actualizarBotonesVista();
  
  // Event listeners para navegación
  const btnMesAnterior = document.getElementById('btnMesAnterior');
  const btnMesSiguiente = document.getElementById('btnMesSiguiente');
  const btnHoy = document.getElementById('btnHoy');
  
  if (btnMesAnterior) {
    btnMesAnterior.onclick = () => cambiarMes(-1);
  }
  
  if (btnMesSiguiente) {
    btnMesSiguiente.onclick = () => cambiarMes(1);
  }
  
  if (btnHoy) {
    btnHoy.onclick = () => {
      const hoy = new Date();
      calendarioActual.mes = hoy.getMonth() + 1;
      calendarioActual.año = hoy.getFullYear();
      cargarCalendario();
    };
  }
  
  // Cargar calendario del mes actual
  await cargarCalendario();
}

function cambiarMes(delta) {
  calendarioActual.mes += delta;
  
  if (calendarioActual.mes > 12) {
    calendarioActual.mes = 1;
    calendarioActual.año++;
  } else if (calendarioActual.mes < 1) {
    calendarioActual.mes = 12;
    calendarioActual.año--;
  }
  
  cargarCalendario();
}

async function cargarCalendario() {
  try {
    const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
    
    // Cargar eventos y tareas
    const resCalendario = await fetch(`${API_URL}/classroom/calendario/${tipo}/${userId}/${calendarioActual.año}/${calendarioActual.mes}`);
    const dataCalendario = await resCalendario.json();
    
    // Filtrar por curso activo si está seleccionado
    eventosDelMes = cursoActivo !== null
      ? (dataCalendario.eventos || []).filter(evento => evento.id_curso === cursoActivo)
      : (dataCalendario.eventos || []);
    
    tareasDelMes = cursoActivo !== null
      ? (dataCalendario.tareas || []).filter(tarea => tarea.id_curso === cursoActivo)
      : (dataCalendario.tareas || []);
    
    // Cargar notas personales
    const resNotas = await fetch(`${API_URL}/classroom/notas/${tipo}/${userId}/${calendarioActual.año}/${calendarioActual.mes}`);
    notasDelMes = await resNotas.json();
    
    renderizarCalendario();
  } catch (error) {
    console.error('Error al cargar calendario:', error);
  }
}

// Obtener colores según el modo oscuro
function getCalendarColors() {
  const isDark = document.body.classList.contains('dark-mode');
  return {
    bgDay: isDark ? '#2d3748' : 'white',
    bgEmpty: 'transparent',
    borderNormal: isDark ? 'rgba(203, 213, 224, 0.15)' : '#e8eaf0',
    borderToday: isDark ? '#7a9bbd' : '#667eea',
    textDay: isDark ? '#e4e7eb' : '#2c3e50',
    textToday: isDark ? '#9ab8d6' : '#667eea',
    accent: isDark ? '#7a9bbd' : '#667eea',
    shadowNormal: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
    shadowHover: isDark ? '0 4px 16px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(102, 126, 234, 0.15)',
    shadowToday: isDark ? '0 0 0 2px rgba(122, 155, 189, 0.3)' : '0 0 0 2px rgba(102, 126, 234, 0.2)',
    itemText: isDark ? '#cbd5e0' : '#2c3e50',
    moreText: isDark ? '#9ab8d6' : '#667eea'
  };
}

function renderizarCalendario() {
  // Actualizar título del mes
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mesActualEl = document.getElementById('mesActual');
  if (mesActualEl) {
    mesActualEl.textContent = `${meses[calendarioActual.mes - 1]} ${calendarioActual.año}`;
  }
  
  // Generar cuadrícula de días
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  // Obtener colores según modo oscuro
  const colors = getCalendarColors();
  
  // Calcular primer día del mes y días totales
  const primerDia = new Date(calendarioActual.año, calendarioActual.mes - 1, 1);
  const ultimoDia = new Date(calendarioActual.año, calendarioActual.mes, 0);
  const diasEnMes = ultimoDia.getDate();
  const primerDiaSemana = primerDia.getDay();
  
  // Fecha de hoy
  const hoy = new Date();
  const esHoy = (dia) => {
    return dia === hoy.getDate() && 
           calendarioActual.mes === (hoy.getMonth() + 1) && 
           calendarioActual.año === hoy.getFullYear();
  };
  
  // Agregar días vacíos al inicio
  for (let i = 0; i < primerDiaSemana; i++) {
    const diaVacio = document.createElement('div');
    diaVacio.style.cssText = `background: ${colors.bgEmpty}; min-height: 120px;`;
    grid.appendChild(diaVacio);
  }
  
  // Agregar días del mes
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaActual = `${calendarioActual.año}-${String(calendarioActual.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    
    // Buscar datos de este día
    const eventosDelDia = eventosDelMes.filter(e => e.fecha_inicio.startsWith(fechaActual));
    const tareasDelDia = tareasDelMes.filter(t => t.fecha_limite.startsWith(fechaActual));
    const notasDelDia = notasDelMes.filter(n => n.fecha.startsWith(fechaActual));
    
    const tieneItems = eventosDelDia.length > 0 || tareasDelDia.length > 0 || notasDelDia.length > 0;
    const esHoyDia = esHoy(dia);
    
    // Crear celda del día
    const diaElement = document.createElement('div');
    const esProfesor = userRol.toLowerCase() === 'profesor';
    
    diaElement.style.cssText = `
      background: ${colors.bgDay};
      border: 2px solid ${esHoyDia ? colors.borderToday : colors.borderNormal};
      border-radius: 8px;
      padding: 8px;
      min-height: 120px;
      cursor: ${esProfesor ? 'pointer' : 'default'};
      transition: all 0.2s;
      position: relative;
      display: flex;
      flex-direction: column;
      box-shadow: ${esHoyDia ? colors.shadowToday : colors.shadowNormal};
    `;
    
    // Solo permitir interacción a profesores
    if (esProfesor) {
      diaElement.onmouseenter = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = colors.shadowHover;
      };
      diaElement.onmouseleave = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = esHoyDia ? colors.shadowToday : colors.shadowNormal;
      };
      diaElement.onclick = () => mostrarDetallesDia(dia, fechaActual, eventosDelDia, tareasDelDia, notasDelDia);
    }
    
    // Número del día
    const numeroDiv = document.createElement('div');
    numeroDiv.style.cssText = `
      font-weight: ${esHoyDia ? '700' : '600'};
      color: ${esHoyDia ? colors.textToday : colors.textDay};
      font-size: 16px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    numeroDiv.innerHTML = `
      <span>${dia}</span>
      ${tieneItems ? `<span style="color: ${colors.accent}; font-size: 12px;">📌</span>` : ''}
    `;
    diaElement.appendChild(numeroDiv);
    
    // Contenedor de items (máximo 3 visibles)
    const itemsContainer = document.createElement('div');
    itemsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 4px; flex: 1; overflow: hidden;';
    
    const todosLosItems = [
      ...notasDelDia.map(n => ({ tipo: 'nota', ...n })),
      ...eventosDelDia.map(e => ({ tipo: 'evento', ...e })),
      ...tareasDelDia.map(t => ({ tipo: 'tarea', ...t }))
    ].slice(0, 3);
    
    todosLosItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = `
        padding: 4px 6px;
        background: ${item.color}20;
        border-left: 3px solid ${item.color};
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        color: ${colors.itemText};
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `;
      
      if (item.tipo === 'nota') {
        itemDiv.textContent = `📝 ${item.titulo || 'Nota'}`;
      } else if (item.tipo === 'evento') {
        itemDiv.textContent = `🎯 ${item.titulo}`;
      } else {
        itemDiv.textContent = `📋 ${item.titulo}`;
      }
      
      itemsContainer.appendChild(itemDiv);
    });
    
    // Indicador de más items
    const totalItems = notasDelDia.length + eventosDelDia.length + tareasDelDia.length;
    if (totalItems > 3) {
      const masDiv = document.createElement('div');
      masDiv.style.cssText = `
        font-size: 10px;
        color: ${colors.moreText};
        font-weight: 600;
        margin-top: 2px;
        text-align: center;
      `;
      masDiv.textContent = `+${totalItems - 3} más`;
      itemsContainer.appendChild(masDiv);
    }
    
    diaElement.appendChild(itemsContainer);
    grid.appendChild(diaElement);
  }
  
  lucide.createIcons();
}

// Cambiar vista del calendario
function cambiarVistaCalendario(vista) {
  console.log('Cambiando vista del calendario a:', vista);
  vistaCalendarioActual = vista;
  localStorage.setItem('vistaCalendario', vista);
  
  // Actualizar botones
  actualizarBotonesVista();
  
  // Renderizar según la vista
  switch(vista) {
    case 'mes':
      renderizarCalendarioMes();
      break;
    case 'semana':
      renderizarCalendarioSemana();
      break;
    case 'dia':
      renderizarCalendarioDia();
      break;
  }
  
  Swal.fire({
    icon: 'success',
    title: 'Vista cambiada',
    text: `Vista de ${vista} activada`,
    timer: 1500,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
}

// Actualizar estilos de los botones de vista
function actualizarBotonesVista() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    const vista = btn.getAttribute('data-calendar-view');
    if (vista === vistaCalendarioActual) {
      btn.style.background = '#667eea';
      btn.style.color = 'white';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = '#667eea';
    }
  });
}

// Renderizar vista de mes (la actual)
function renderizarCalendarioMes() {
  renderizarCalendario();
}

// Renderizar vista de semana
function renderizarCalendarioSemana() {
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  // Obtener la semana actual
  const hoy = new Date(calendarioActual.año, calendarioActual.mes - 1, 1);
  const primerDiaSemana = hoy.getDate() - hoy.getDay();
  
  // Cambiar a layout de semana
  grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
  grid.style.gap = '8px';
  
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  // Generar 7 días de la semana
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(calendarioActual.año, calendarioActual.mes - 1, primerDiaSemana + i);
    const dia = fecha.getDate();
    const mes = fecha.getMonth();
    const año = fecha.getFullYear();
    
    const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    
    // Buscar eventos del día
    const eventosDelDia = eventosDelMes.filter(e => e.fecha_inicio.startsWith(fechaStr));
    const tareasDelDia = tareasDelMes.filter(t => t.fecha_limite.startsWith(fechaStr));
    const notasDelDia = notasDelMes.filter(n => n.fecha.startsWith(fechaStr));
    
    const esHoy = dia === new Date().getDate() && 
                  mes === new Date().getMonth() && 
                  año === new Date().getFullYear();
    
    const diaElement = document.createElement('div');
    diaElement.style.cssText = `
      background: ${esHoy ? '#f0f4ff' : 'white'};
      border: 2px solid ${esHoy ? '#667eea' : '#e9ecef'};
      border-radius: 8px;
      padding: 16px;
      min-height: 300px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    diaElement.innerHTML = `
      <div style="font-weight: 700; color: ${esHoy ? '#667eea' : '#2c3e50'}; font-size: 20px; margin-bottom: 12px;">
        ${dia} ${meses[mes]}
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${eventosDelDia.map(e => `
          <div style="background: #e3f2fd; padding: 8px; border-radius: 6px; font-size: 13px; color: #1976d2; border-left: 3px solid #1976d2;">
            📅 ${e.titulo}
          </div>
        `).join('')}
        ${tareasDelDia.map(t => `
          <div style="background: #fff3e0; padding: 8px; border-radius: 6px; font-size: 13px; color: #f57c00; border-left: 3px solid #f57c00;">
            📝 ${t.titulo}
          </div>
        `).join('')}
        ${notasDelDia.map(n => `
          <div style="background: #f3e5f5; padding: 8px; border-radius: 6px; font-size: 13px; color: #7b1fa2; border-left: 3px solid #7b1fa2;">
            📌 ${n.titulo}
          </div>
        `).join('')}
      </div>
    `;
    
    grid.appendChild(diaElement);
  }
  
  lucide.createIcons();
}

// Renderizar vista de día
function renderizarCalendarioDia() {
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  // Cambiar a layout de día
  grid.style.gridTemplateColumns = '1fr';
  grid.style.gap = '16px';
  
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth();
  const año = hoy.getFullYear();
  
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  
  // Buscar eventos del día
  const eventosDelDia = eventosDelMes.filter(e => e.fecha_inicio.startsWith(fechaStr));
  const tareasDelDia = tareasDelMes.filter(t => t.fecha_limite.startsWith(fechaStr));
  const notasDelDia = notasDelMes.filter(n => n.fecha.startsWith(fechaStr));
  
  const diaElement = document.createElement('div');
  diaElement.style.cssText = `
    background: white;
    border: 2px solid #667eea;
    border-radius: 12px;
    padding: 24px;
  `;
  
  diaElement.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2 style="color: #667eea; margin: 0 0 8px 0; font-size: 32px; font-weight: 700;">
        ${dia} de ${meses[mes]} de ${año}
      </h2>
      <p style="color: #6c757d; margin: 0; font-size: 16px;">
        ${['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][hoy.getDay()]}
      </p>
    </div>
    
    ${eventosDelDia.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #2c3e50; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="calendar" style="width: 20px; height: 20px; color: #1976d2;"></i>
          Eventos (${eventosDelDia.length})
        </h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${eventosDelDia.map(e => `
            <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; border-left: 4px solid #1976d2;">
              <div style="font-weight: 600; color: #1976d2; font-size: 16px; margin-bottom: 4px;">${e.titulo}</div>
              <div style="color: #455a64; font-size: 14px;">${e.descripcion || 'Sin descripción'}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    ${tareasDelDia.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #2c3e50; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="clipboard" style="width: 20px; height: 20px; color: #f57c00;"></i>
          Tareas (${tareasDelDia.length})
        </h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${tareasDelDia.map(t => `
            <div style="background: #fff3e0; padding: 16px; border-radius: 8px; border-left: 4px solid #f57c00;">
              <div style="font-weight: 600; color: #f57c00; font-size: 16px; margin-bottom: 4px;">${t.titulo}</div>
              <div style="color: #455a64; font-size: 14px;">${t.descripcion || 'Sin descripción'}</div>
              <div style="color: #6c757d; font-size: 12px; margin-top: 8px;">Puntos: ${t.puntos || 0}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    ${notasDelDia.length > 0 ? `
      <div>
        <h3 style="color: #2c3e50; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="sticky-note" style="width: 20px; height: 20px; color: #7b1fa2;"></i>
          Notas (${notasDelDia.length})
        </h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${notasDelDia.map(n => `
            <div style="background: #f3e5f5; padding: 16px; border-radius: 8px; border-left: 4px solid #7b1fa2;">
              <div style="font-weight: 600; color: #7b1fa2; font-size: 16px; margin-bottom: 4px;">${n.titulo}</div>
              <div style="color: #455a64; font-size: 14px;">${n.contenido || 'Sin contenido'}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    ${eventosDelDia.length === 0 && tareasDelDia.length === 0 && notasDelDia.length === 0 ? `
      <div style="text-align: center; padding: 48px; color: #6c757d;">
        <i data-lucide="calendar-x" style="width: 64px; height: 64px; margin-bottom: 16px; opacity: 0.3;"></i>
        <p style="margin: 0; font-size: 18px;">No hay eventos programados para hoy</p>
      </div>
    ` : ''}
  `;
  
  grid.appendChild(diaElement);
  lucide.createIcons();
}

function mostrarDetallesDia(dia, fecha, eventos, tareas, notas) {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const esProfesor = userRol.toLowerCase() === 'profesor';
  
  let htmlContent = `
    <div style="text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="color: #667eea; margin: 0; font-size: 20px; display: flex; align-items: center; gap: 10px;">
          <i data-lucide="calendar" style="width: 24px; height: 24px;"></i>
          ${dia} de ${meses[calendarioActual.mes - 1]}
        </h3>
        ${esProfesor ? `
          <button id="btnAgregarNota" style="padding: 8px 16px; background: #FFD700; color: #2c3e50; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">📌</span>
            Agregar Pin
          </button>
        ` : ''}
      </div>
  `;
  
  // Mostrar notas personales
  if (notas.length > 0) {
    htmlContent += '<div style="margin-bottom: 20px;"><h4 style="color: #2c3e50; font-size: 15px; margin: 0 0 12px 0; font-weight: 700;">📝 Mis Notas</h4>';
    notas.forEach(nota => {
      htmlContent += `
        <div style="padding: 12px; background: ${nota.color}30; border-left: 4px solid ${nota.color}; border-radius: 8px; margin-bottom: 10px; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              ${nota.titulo ? `<div style="font-weight: 700; color: #2c3e50; margin-bottom: 6px; font-size: 14px;">${nota.titulo}</div>` : ''}
              ${nota.contenido ? `<div style="font-size: 13px; color: #555; line-height: 1.5;">${nota.contenido}</div>` : ''}
            </div>
            ${esProfesor ? `
              <div style="display: flex; gap: 6px; margin-left: 12px;">
                <button onclick="editarNota(${nota.id_nota}, '${fecha}')" style="background: #667eea; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;">✏️</button>
                <button onclick="eliminarNota(${nota.id_nota})" style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;">🗑️</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
    htmlContent += '</div>';
  }
  
  // Mostrar eventos
  if (eventos.length > 0) {
    htmlContent += '<div style="margin-bottom: 20px;"><h4 style="color: #2c3e50; font-size: 15px; margin: 0 0 12px 0; font-weight: 700;">🎯 Eventos</h4>';
    eventos.forEach(evento => {
      const hora = new Date(evento.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      
      htmlContent += `
        <div style="padding: 12px; background: #f8f9fa; border-left: 4px solid ${evento.color}; border-radius: 8px; margin-bottom: 10px;">
          <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px; font-size: 14px;">${evento.titulo}</div>
          <div style="font-size: 13px; color: #666; margin-bottom: 4px;">${evento.nombre_curso}</div>
          ${evento.descripcion ? `<div style="font-size: 12px; color: #777;">${evento.descripcion}</div>` : ''}
          <div style="font-size: 12px; color: #667eea; margin-top: 6px;">
            <i data-lucide="clock" style="width: 12px; height: 12px;"></i> ${hora}
          </div>
        </div>
      `;
    });
    htmlContent += '</div>';
  }
  
  // Mostrar tareas
  if (tareas.length > 0) {
    htmlContent += '<div><h4 style="color: #2c3e50; font-size: 15px; margin: 0 0 12px 0; font-weight: 700;">📋 Tareas</h4>';
    tareas.forEach(tarea => {
      const hora = new Date(tarea.fecha_limite).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      
      htmlContent += `
        <div style="padding: 12px; background: #f8f9fa; border-left: 4px solid ${tarea.color}; border-radius: 8px; margin-bottom: 10px;">
          <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px; font-size: 14px;">${tarea.titulo}</div>
          <div style="font-size: 13px; color: #666; margin-bottom: 4px;">${tarea.nombre_curso}</div>
          <div style="font-size: 12px; color: #667eea;">
            <i data-lucide="clock" style="width: 12px; height: 12px;"></i> Límite: ${hora} • ${tarea.puntos} puntos
          </div>
        </div>
      `;
    });
    htmlContent += '</div>';
  }
  
  if (eventos.length === 0 && tareas.length === 0 && notas.length === 0) {
    htmlContent += `
      <div style="text-align: center; padding: 40px 20px; color: #999;">
        <div style="font-size: 48px; margin-bottom: 12px;">📌</div>
        <p style="margin: 0; font-size: 14px;">No hay nada programado para este día</p>
        ${esProfesor ? '<p style="margin: 8px 0 0 0; font-size: 13px;">Haz clic en "Agregar Pin" para crear una nota</p>' : ''}
      </div>
    `;
  }
  
  htmlContent += '</div>';
  
  Swal.fire({
    html: htmlContent,
    showCloseButton: true,
    showConfirmButton: false,
    width: '600px',
    didOpen: () => {
      lucide.createIcons();
      
      const btnAgregarNota = document.getElementById('btnAgregarNota');
      if (btnAgregarNota) {
        btnAgregarNota.onclick = () => {
          Swal.close();
          mostrarFormularioNota(fecha);
        };
      }
    }
  });
}

async function mostrarFormularioNota(fecha = null) {
  const fechaDefault = fecha || new Date().toISOString().split('T')[0];
  
  Swal.fire({
    title: '<div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 28px;">📌</span><span>Crear Pin / Nota</span></div>',
    html: `
      <div style="text-align: left; padding: 0 8px;">
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Fecha</label>
        <input type="date" id="swal-fecha-nota" value="${fechaDefault}" 
          style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box;">
        
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Título (opcional)</label>
        <input id="swal-titulo-nota" placeholder="Ej: Recordatorio importante" maxlength="100" 
          style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box;">
        
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Nota</label>
        <textarea id="swal-contenido-nota" placeholder="Escribe tu nota aquí..." rows="4"
          style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box; font-family: inherit; resize: vertical;"></textarea>
        
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Color del Pin</label>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 16px;">
          <div onclick="document.getElementById('swal-color-nota').value='#FFD700'" style="width: 100%; height: 40px; background: #FFD700; border-radius: 8px; cursor: pointer; border: 3px solid #FFD700; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>
          <div onclick="document.getElementById('swal-color-nota').value='#FF6B6B'" style="width: 100%; height: 40px; background: #FF6B6B; border-radius: 8px; cursor: pointer; border: 3px solid #FF6B6B; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>
          <div onclick="document.getElementById('swal-color-nota').value='#4ECDC4'" style="width: 100%; height: 40px; background: #4ECDC4; border-radius: 8px; cursor: pointer; border: 3px solid #4ECDC4; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>
          <div onclick="document.getElementById('swal-color-nota').value='#95E1D3'" style="width: 100%; height: 40px; background: #95E1D3; border-radius: 8px; cursor: pointer; border: 3px solid #95E1D3; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>
          <div onclick="document.getElementById('swal-color-nota').value='#A8E6CF'" style="width: 100%; height: 40px; background: #A8E6CF; border-radius: 8px; cursor: pointer; border: 3px solid #A8E6CF; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>
          <div onclick="document.getElementById('swal-color-nota').value='#FFB6D9'" style="width: 100%; height: 40px; background: #FFB6D9; border-radius: 8px; cursor: pointer; border: 3px solid #FFB6D9; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>
        </div>
        <input type="hidden" id="swal-color-nota" value="#FFD700">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '📌 Crear Pin',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#667eea',
    width: '550px',
    preConfirm: () => {
      const fecha = document.getElementById('swal-fecha-nota').value;
      const titulo = document.getElementById('swal-titulo-nota').value;
      const contenido = document.getElementById('swal-contenido-nota').value;
      const color = document.getElementById('swal-color-nota').value;
      
      if (!fecha) {
        Swal.showValidationMessage('La fecha es requerida');
        return false;
      }
      
      if (!titulo && !contenido) {
        Swal.showValidationMessage('Debes agregar un título o contenido');
        return false;
      }
      
      return { fecha, titulo, contenido, color };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      await crearNota(result.value);
    }
  });
}

async function crearNota(datos) {
  try {
    const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
    
    console.log('Creando nota con datos:', {
      id_usuario: userId,
      tipo_usuario: tipo,
      fecha: datos.fecha,
      titulo: datos.titulo,
      contenido: datos.contenido,
      color: datos.color
    });
    
    const response = await fetch(`${API_URL}/classroom/notas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_usuario: userId,
        tipo_usuario: tipo,
        fecha: datos.fecha,
        titulo: datos.titulo,
        contenido: datos.contenido,
        color: datos.color
      })
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);
    
    if (response.ok) {
      // Recargar calendario inmediatamente
      await cargarCalendario();
      
      Swal.fire({
        title: '¡Pin creado!',
        text: 'Tu nota ha sido agregada al calendario',
        icon: 'success',
        confirmButtonColor: '#667eea',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      throw new Error(result.message || 'Error al crear nota');
    }
  } catch (error) {
    console.error('Error completo:', error);
    
    // Mensaje más específico según el tipo de error
    let mensajeError = 'No se pudo crear la nota';
    if (error.message.includes('Failed to fetch')) {
      mensajeError = 'No se puede conectar con el servidor. Asegúrate de que el servidor esté corriendo.';
    } else {
      mensajeError = error.message;
    }
    
    Swal.fire({
      title: 'Error',
      text: mensajeError,
      icon: 'error',
      confirmButtonColor: '#667eea'
    });
  }
}

async function editarNota(idNota, fecha) {
  try {
    // Obtener datos actuales de la nota
    const notaActual = notasDelMes.find(n => n.id_nota === idNota);
    if (!notaActual) return;
    
    Swal.fire({
      title: '<div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 28px;">✏️</span><span>Editar Pin</span></div>',
      html: `
        <div style="text-align: left; padding: 0 8px;">
          <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Título</label>
          <input id="swal-titulo-nota-edit" value="${notaActual.titulo || ''}" maxlength="100" 
            style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box;">
          
          <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Nota</label>
          <textarea id="swal-contenido-nota-edit" rows="4"
            style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box; font-family: inherit; resize: vertical;">${notaActual.contenido || ''}</textarea>
          
          <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Color</label>
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px;">
            <div onclick="document.getElementById('swal-color-nota-edit').value='#FFD700'" style="width: 100%; height: 40px; background: #FFD700; border-radius: 8px; cursor: pointer; border: 3px solid ${notaActual.color === '#FFD700' ? '#2c3e50' : '#FFD700'};"></div>
            <div onclick="document.getElementById('swal-color-nota-edit').value='#FF6B6B'" style="width: 100%; height: 40px; background: #FF6B6B; border-radius: 8px; cursor: pointer; border: 3px solid ${notaActual.color === '#FF6B6B' ? '#2c3e50' : '#FF6B6B'};"></div>
            <div onclick="document.getElementById('swal-color-nota-edit').value='#4ECDC4'" style="width: 100%; height: 40px; background: #4ECDC4; border-radius: 8px; cursor: pointer; border: 3px solid ${notaActual.color === '#4ECDC4' ? '#2c3e50' : '#4ECDC4'};"></div>
            <div onclick="document.getElementById('swal-color-nota-edit').value='#95E1D3'" style="width: 100%; height: 40px; background: #95E1D3; border-radius: 8px; cursor: pointer; border: 3px solid ${notaActual.color === '#95E1D3' ? '#2c3e50' : '#95E1D3'};"></div>
            <div onclick="document.getElementById('swal-color-nota-edit').value='#A8E6CF'" style="width: 100%; height: 40px; background: #A8E6CF; border-radius: 8px; cursor: pointer; border: 3px solid ${notaActual.color === '#A8E6CF' ? '#2c3e50' : '#A8E6CF'};"></div>
            <div onclick="document.getElementById('swal-color-nota-edit').value='#FFB6D9'" style="width: 100%; height: 40px; background: #FFB6D9; border-radius: 8px; cursor: pointer; border: 3px solid ${notaActual.color === '#FFB6D9' ? '#2c3e50' : '#FFB6D9'};"></div>
          </div>
          <input type="hidden" id="swal-color-nota-edit" value="${notaActual.color}">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '💾 Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#667eea',
      width: '550px',
      preConfirm: () => {
        const titulo = document.getElementById('swal-titulo-nota-edit').value;
        const contenido = document.getElementById('swal-contenido-nota-edit').value;
        const color = document.getElementById('swal-color-nota-edit').value;
        
        if (!titulo && !contenido) {
          Swal.showValidationMessage('Debes tener un título o contenido');
          return false;
        }
        
        return { titulo, contenido, color };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const response = await fetch(`${API_URL}/classroom/notas/${idNota}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.value)
        });
        
        if (response.ok) {
          Swal.fire({
            title: '¡Actualizado!',
            text: 'Pin actualizado exitosamente',
            icon: 'success',
            confirmButtonColor: '#667eea',
            timer: 2000
          });
          await cargarCalendario();
        }
      }
    });
  } catch (error) {
    console.error('Error al editar nota:', error);
  }
}

async function eliminarNota(idNota) {
  Swal.fire({
    title: '¿Eliminar este pin?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#95a5a6'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/classroom/notas/${idNota}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          Swal.fire({
            title: '¡Eliminado!',
            text: 'Pin eliminado exitosamente',
            icon: 'success',
            confirmButtonColor: '#667eea',
            timer: 2000
          });
          await cargarCalendario();
        }
      } catch (error) {
        console.error('Error al eliminar nota:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el pin',
          icon: 'error',
          confirmButtonColor: '#667eea'
        });
      }
    }
  });
}

async function mostrarFormularioEvento() {
  // Cargar cursos del profesor
  const res = await fetch(`${API_URL}/classroom/clases/profesor/${userId}`);
  const cursos = await res.json();
  
  if (cursos.length === 0) {
    Swal.fire({
      title: 'Sin cursos',
      text: 'No tienes cursos asignados',
      icon: 'info',
      confirmButtonColor: '#667eea'
    });
    return;
  }
  
  const cursosOptions = cursos.map(c => 
    `<option value="${c.id_curso}" style="color: #2c3e50; background: white;">${c.nombre_curso}</option>`
  ).join('');
  
  const hoy = new Date().toISOString().split('T')[0];
  
  Swal.fire({
    title: '<div style="display: flex; align-items: center; gap: 12px;"><i data-lucide="calendar-plus" style="width: 28px; height: 28px; color: #667eea;"></i><span>Crear Evento</span></div>',
    html: `
      <div style="text-align: left; padding: 0 8px;">
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Curso</label>
        <select id="swal-curso-evento" style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box; color: #2c3e50;">
          <option value="" style="color: #2c3e50; background: white;">Selecciona un curso</option>
          ${cursosOptions}
        </select>
        
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Título del Evento</label>
        <input id="swal-titulo-evento" placeholder="Ej: Examen Parcial" maxlength="100" 
          style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box;">
        
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Descripción</label>
        <textarea id="swal-descripcion-evento" placeholder="Detalles del evento..." rows="3"
          style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box; font-family: inherit;"></textarea>
        
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Tipo de Evento</label>
        <select id="swal-tipo-evento" style="width: 100%; margin: 0 0 16px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box; color: #2c3e50;">
          <option value="examen" style="color: #2c3e50; background: white;">📝 Examen</option>
          <option value="clase_especial" style="color: #2c3e50; background: white;">🎓 Clase Especial</option>
          <option value="reunion" style="color: #2c3e50; background: white;">👥 Reunión</option>
          <option value="feriado" style="color: #2c3e50; background: white;">🎉 Feriado</option>
          <option value="otro" style="color: #2c3e50; background: white;">📅 Otro</option>
        </select>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Fecha</label>
            <input type="date" id="swal-fecha-evento" min="${hoy}" 
              style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box;">
          </div>
          <div>
            <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Hora</label>
            <input type="time" id="swal-hora-evento" value="10:00" 
              style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box;">
          </div>
        </div>
        
        <label style="display: block; margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 14px;">Color</label>
        <input type="color" id="swal-color-evento" value="#667eea" 
          style="width: 100%; height: 50px; margin: 0 0 16px 0; border: 2px solid #e0e0e0; border-radius: 8px; box-sizing: border-box; cursor: pointer;">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Crear Evento',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#667eea',
    width: '600px',
    didOpen: () => {
      lucide.createIcons();
    },
    preConfirm: () => {
      const curso = document.getElementById('swal-curso-evento').value;
      const titulo = document.getElementById('swal-titulo-evento').value;
      const descripcion = document.getElementById('swal-descripcion-evento').value;
      const tipo = document.getElementById('swal-tipo-evento').value;
      const fecha = document.getElementById('swal-fecha-evento').value;
      const hora = document.getElementById('swal-hora-evento').value;
      const color = document.getElementById('swal-color-evento').value;
      
      if (!curso || !titulo || !fecha) {
        Swal.showValidationMessage('El curso, título y fecha son requeridos');
        return false;
      }
      
      return { curso, titulo, descripcion, tipo, fecha, hora, color };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      await crearEvento(result.value);
    }
  });
}

async function crearEvento(datos) {
  try {
    const fechaInicio = `${datos.fecha} ${datos.hora}:00`;
    
    const response = await fetch(`${API_URL}/classroom/calendario/eventos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_curso: datos.curso,
        id_profesor: userId,
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        tipo: datos.tipo,
        fecha_inicio: fechaInicio,
        color: datos.color,
        notificar: 1
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      Swal.fire({
        title: '¡Evento creado!',
        text: 'El evento ha sido agregado al calendario',
        icon: 'success',
        confirmButtonColor: '#667eea'
      });
      
      // Recargar calendario
      await cargarCalendario();
    } else {
      throw new Error(result.message || 'Error al crear evento');
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo crear el evento',
      icon: 'error',
      confirmButtonColor: '#667eea'
    });
  }
}

// =====================================================
// SISTEMA DE NOTIFICACIONES
// =====================================================

let notificacionesInterval;

async function initNotifications() {
  const btnNotifications = document.getElementById('btnNotifications');
  const dropdown = document.getElementById('notificationsDropdown');
  const btnMarkAllRead = document.getElementById('btnMarkAllRead');
  
  if (!btnNotifications || !dropdown) return;
  
  // Toggle del dropdown
  btnNotifications.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = dropdown.classList.contains('active');
    dropdown.classList.toggle('active');
    
    if (!isActive) {
      cargarNotificaciones();
    }
  });
  
  // Cerrar al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== btnNotifications) {
      dropdown.classList.remove('active');
    }
  });
  
  // Marcar todas como leídas
  if (btnMarkAllRead) {
    btnMarkAllRead.addEventListener('click', async () => {
      await marcarTodasLeidas();
    });
  }
  
  // Cargar notificaciones inicialmente
  await cargarNotificaciones();
  await actualizarContador();
  
  // Polling cada 30 segundos
  notificacionesInterval = setInterval(async () => {
    await actualizarContador();
  }, 30000);
}

async function cargarNotificaciones() {
  try {
    const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
    const res = await fetch(`${API_URL}/notificaciones/${tipo}/${userId}?limit=20`);
    const notificaciones = await res.json();
    
    renderNotificaciones(notificaciones);
    await actualizarContador();
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
  }
}

function renderNotificaciones(notificaciones) {
  const container = document.getElementById('notificationsList');
  
  if (!notificaciones || notificaciones.length === 0) {
    container.innerHTML = `
      <div class="empty-notifications">
        <i data-lucide="inbox"></i>
        <p>No tienes notificaciones</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  container.innerHTML = notificaciones.map(notif => {
    const iconClass = notif.tipo_notificacion === 'entrega_tarea' ? 'entrega' :
                      notif.tipo_notificacion === 'nueva_inscripcion' ? 'inscripcion' :
                      notif.tipo_notificacion === 'anuncio_importante' ? 'importante' :
                      notif.tipo_notificacion === 'comentario' ? 'comentario' :
                      notif.tipo_notificacion === 'nueva_tarea' ? 'nueva-tarea' :
                      notif.tipo_notificacion === 'anuncio' ? 'anuncio' : 'calificacion';
    
    const icon = notif.tipo_notificacion === 'entrega_tarea' ? 'file-check' :
                 notif.tipo_notificacion === 'nueva_inscripcion' ? 'user-plus' :
                 notif.tipo_notificacion === 'anuncio_importante' ? 'megaphone' :
                 notif.tipo_notificacion === 'comentario' ? 'message-circle' :
                 notif.tipo_notificacion === 'nueva_tarea' ? 'clipboard-list' :
                 notif.tipo_notificacion === 'anuncio' ? 'bell' : 'star';
    
    const tiempoTranscurrido = calcularTiempoTranscurrido(new Date(notif.fecha_creacion));
    
    return `
      <div class="notification-item ${notif.leida ? '' : 'unread'}" onclick="clickNotificacion(${notif.id_notificacion}, '${notif.tipo_notificacion}', ${notif.id_referencia || 'null'})">
        <div class="notification-icon ${iconClass}">
          <i data-lucide="${icon}" style="width: 18px; height: 18px;"></i>
        </div>
        <div class="notification-title">${notif.titulo}</div>
        <div class="notification-message">${notif.mensaje}</div>
        <div class="notification-time">${tiempoTranscurrido}</div>
      </div>
    `;
  }).join('');
  
  lucide.createIcons();
}

async function actualizarContador() {
  try {
    const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
    const res = await fetch(`${API_URL}/notificaciones/${tipo}/${userId}/sin-leer`);
    const data = await res.json();
    
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      if (data.total > 0) {
        badge.textContent = data.total > 99 ? '99+' : data.total;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error al actualizar contador:', error);
  }
}

async function clickNotificacion(idNotificacion, tipoNotificacion, idReferencia) {
  try {
    // Marcar como leída
    await fetch(`${API_URL}/notificaciones/${idNotificacion}/marcar-leida`, {
      method: 'PUT'
    });
    
    // Actualizar UI
    await cargarNotificaciones();
    
    // Cerrar dropdown
    document.getElementById('notificationsDropdown').classList.remove('active');
    
    // Navegar según el tipo de notificación
    if (idReferencia) {
      switch(tipoNotificacion) {
        case 'comentario':
        case 'anuncio_importante':
        case 'anuncio':
          // Para alumnos, ir al home y abrir el anuncio
          // Para profesores, ir a la vista de anuncios
          if (userRol.toLowerCase() === 'alumno') {
            switchView('home');
          } else {
            switchView('announcements');
          }
          setTimeout(() => {
            abrirAnuncio(idReferencia);
          }, 300);
          break;
        
        case 'nueva_tarea':
        case 'entrega_tarea':
        case 'calificacion':
          // Cambiar a la vista de tareas
          switchView('tasks');
          // Aquí podrías agregar lógica para resaltar la tarea específica
          setTimeout(() => {
            // Scroll hacia la tarea si existe
            const tareaElement = document.querySelector(`[data-tarea-id="${idReferencia}"]`);
            if (tareaElement) {
              tareaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              tareaElement.style.animation = 'highlight-pulse 2s';
            }
          }, 300);
          break;
        
        case 'nueva_inscripcion':
          // Solo para profesores: ir a la vista de cursos
          if (userRol.toLowerCase() === 'profesor') {
            switchView('courses');
          }
          break;
      }
    }
  } catch (error) {
    console.error('Error al marcar notificación:', error);
  }
}

async function marcarTodasLeidas() {
  try {
    const tipo = userRol.toLowerCase() === 'profesor' ? 'profesor' : 'alumno';
    await fetch(`${API_URL}/notificaciones/${tipo}/${userId}/marcar-todas-leidas`, {
      method: 'PUT'
    });
    
    await cargarNotificaciones();
    
    Swal.fire({
      title: '¡Listo!',
      text: 'Todas las notificaciones marcadas como leídas',
      icon: 'success',
      confirmButtonColor: '#667eea',
      timer: 1500,
      showConfirmButton: false
    });
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
  }
}

// Función auxiliar para calcular tiempo transcurrido (ya existe, pero la mejoro)
function calcularTiempoTranscurrido(fecha) {
  const ahora = new Date();
  const diff = ahora - fecha;
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  if (horas < 24) return `Hace ${horas} h`;
  if (dias < 7) return `Hace ${dias} d`;
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// =====================================================
// FUNCIONES DE ELIMINACIÓN PARA ADMINISTRADOR
// =====================================================

async function eliminarAnuncioAdmin(idAnuncio) {
  const result = await Swal.fire({
    title: '¿Eliminar este anuncio?',
    html: `
      <p>Esta acción eliminará permanentemente el anuncio.</p>
      <p class="text-warning" style="font-size: 0.9em; margin-top: 10px; color: #f59e0b;">
        ⚠️ Será eliminado para todos los usuarios (profesores y alumnos).
      </p>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });
  
  if (!result.isConfirmed) return;
  
  try {
    const res = await fetch(`${API_URL}/classroom/anuncio/${idAnuncio}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Anuncio eliminado',
        text: 'El anuncio ha sido eliminado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Recargar feed
      await loadFeed();
    } else {
      throw new Error('Error al eliminar');
    }
  } catch (error) {
    console.error('Error al eliminar anuncio:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo eliminar el anuncio'
    });
  }
}

async function eliminarTareaAdmin(idTarea, titulo, nombreCurso) {
  const result = await Swal.fire({
    title: '¿Eliminar esta tarea?',
    html: `
      <p><strong>${titulo}</strong></p>
      <p style="color: #666; font-size: 0.9em;">Curso: ${nombreCurso}</p>
      <p class="text-warning" style="font-size: 0.9em; margin-top: 10px; color: #f59e0b;">
        ⚠️ Se eliminarán también todas las entregas de los alumnos.
      </p>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });
  
  if (!result.isConfirmed) return;
  
  try {
    const res = await fetch(`${API_URL}/classroom/tarea/${idTarea}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Tarea eliminada',
        text: 'La tarea ha sido eliminada correctamente',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Recargar tareas
      await loadTareas();
    } else {
      throw new Error('Error al eliminar');
    }
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo eliminar la tarea'
    });
  }
}

// ===================================
// PANEL DE CONFIGURACIÓN - FUNCIONES
// ===================================

// Abrir modal de configuración
function abrirConfiguracion() {
  const modal = document.getElementById('modalConfiguracion');
  if (modal) {
    modal.classList.add('active');
    cargarConfiguracionesGuardadas();
    
    // Mostrar sección de exportar solo para alumnos
    const seccionExportar = document.getElementById('seccionExportar');
    if (seccionExportar && userRol && userRol.toLowerCase() === 'alumno') {
      seccionExportar.style.display = 'block';
    } else if (seccionExportar) {
      seccionExportar.style.display = 'none';
    }
    
    // Asegurar que los event listeners estén activos
    agregarEventListenersConfiguracion();
  }
}

// Agregar event listeners a los elementos de configuración
function agregarEventListenersConfiguracion() {
  // Botones de tamaño de fuente
  document.querySelectorAll('.font-size-btn').forEach(btn => {
    // Remover listener anterior si existe para evitar duplicados
    btn.replaceWith(btn.cloneNode(true));
  });
  
  // Volver a seleccionar después de reemplazar
  document.querySelectorAll('.font-size-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Click en botón de fuente:', this.dataset.size);
      cambiarTamañoFuente(this.dataset.size);
    });
  });
}

// Cerrar modal de configuración
function cerrarConfiguracion() {
  const modal = document.getElementById('modalConfiguracion');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Cargar configuraciones guardadas desde localStorage
function cargarConfiguracionesGuardadas() {
  // Cargar notificaciones
  const notificaciones = ['tareas', 'anuncios', 'eventos', 'chat'];
  notificaciones.forEach(tipo => {
    const saved = localStorage.getItem(`notif_${tipo}`);
    const checkbox = document.getElementById(`notif_${tipo}`);
    if (checkbox) {
      checkbox.checked = saved !== 'false';
    }
  });

  // Cargar vista de calendario
  const vistaCalendario = localStorage.getItem('vistaCalendario') || 'mes';
  const selectVista = document.getElementById('config-vista-calendario');
  if (selectVista) {
    selectVista.value = vistaCalendario;
  }

  // Cargar tamaño de fuente
  const tamañoFuente = localStorage.getItem('tamañoFuente') || 'normal';
  document.querySelectorAll('.font-size-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.size === tamañoFuente) {
      btn.classList.add('active');
    }
  });

  // Cargar tema guardado
  const temaGuardado = localStorage.getItem('tema') || 'light';
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.remove('active');
    if (card.dataset.theme === temaGuardado) {
      card.classList.add('active');
    }
  });

  // Cargar privacidad
  const estadoOnline = localStorage.getItem('estadoOnline') !== 'false';
  const perfilPublico = localStorage.getItem('perfilPublico') !== 'false';
  const checkboxEstado = document.getElementById('estadoOnline');
  const checkboxPerfil = document.getElementById('perfilPublico');
  if (checkboxEstado) checkboxEstado.checked = estadoOnline;
  if (checkboxPerfil) checkboxPerfil.checked = perfilPublico;
}

// Cambiar tab activa
function cambiarTab(tabName) {
  console.log('Cambiando a tab:', tabName);
  
  // Desactivar todos los tabs
  document.querySelectorAll('.config-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll('.config-tab-content').forEach(content => {
    content.classList.remove('active');
  });

  // Activar tab seleccionada usando data-tab
  const btnActivo = document.querySelector(`.config-tab-btn[data-tab="${tabName}"]`);
  if (btnActivo) {
    btnActivo.classList.add('active');
  }

  const contentActivo = document.getElementById(`tab-${tabName}`);
  if (contentActivo) {
    contentActivo.classList.add('active');
  }
}

// Cambiar tema
// Aplicar tema (SIN notificación - usado al cargar la página)
function aplicarTema(tema) {
  const body = document.body;
  
  if (tema === 'dark') {
    body.classList.add('dark-mode');
  } else if (tema === 'light') {
    body.classList.remove('dark-mode');
  } else if (tema === 'auto') {
    // Detectar preferencia del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }
  }
}

// Cambiar tema (CON notificación - usado cuando el usuario hace click)
function cambiarTema(tema) {
  console.log('Cambiando tema a:', tema);
  
  // Remover active de todos
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.remove('active');
  });

  // Activar el seleccionado usando data-theme
  const cardSeleccionado = document.querySelector(`.theme-card[data-theme="${tema}"]`);
  if (cardSeleccionado) {
    cardSeleccionado.classList.add('active');
  }

  // Guardar en localStorage
  localStorage.setItem('tema', tema);

  // Aplicar tema usando la función sin notificación
  aplicarTema(tema);
  
  // Mostrar notificación solo cuando el usuario cambia manualmente
  if (tema === 'dark') {
    Swal.fire({
      icon: 'success',
      title: 'Modo Oscuro Activado',
      text: 'El tema oscuro se ha aplicado',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: '#2d3748',
      color: '#e4e7eb'
    });
  } else if (tema === 'light') {
    Swal.fire({
      icon: 'success',
      title: 'Modo Claro Activado',
      text: 'El tema claro se ha aplicado',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  } else if (tema === 'auto') {
    Swal.fire({
      icon: 'success',
      title: 'Modo Automático Activado',
      text: 'El tema se ajustará según tu sistema',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
}

// Cambiar tamaño de fuente
function cambiarTamañoFuente(tamaño) {
  console.log('Cambiando tamaño de fuente a:', tamaño);
  
  // Remover active de todos
  document.querySelectorAll('.font-size-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Activar el seleccionado
  const btnSeleccionado = document.querySelector(`[data-size="${tamaño}"]`);
  if (btnSeleccionado) {
    btnSeleccionado.classList.add('active');
    console.log('Botón activado:', btnSeleccionado);
  } else {
    console.log('No se encontró botón con data-size:', tamaño);
  }

  // Aplicar el tamaño usando la función auxiliar
  aplicarTamañoFuente(tamaño);

  // Guardar en localStorage
  localStorage.setItem('tamañoFuente', tamaño);

  Swal.fire({
    icon: 'success',
    title: 'Tamaño aplicado',
    text: `Fuente configurada en tamaño ${tamaño}`,
    timer: 1500,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
}

// Toggle visibilidad de contraseña
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentElement.querySelector('.toggle-password-btn');
  
  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = '<i data-lucide="eye-off"></i>';
  } else {
    input.type = 'password';
    button.innerHTML = '<i data-lucide="eye"></i>';
  }
  
  // Reinicializar el icono de Lucide
  lucide.createIcons();
}

// Cambiar contraseña
async function cambiarPasswordClassroom(event) {
  event.preventDefault();
  
  const passwordActual = document.getElementById('password-actual').value;
  const passwordNueva = document.getElementById('password-nueva').value;
  const passwordConfirmar = document.getElementById('password-confirmar').value;

  // Validaciones
  if (!passwordActual || !passwordNueva || !passwordConfirmar) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      text: 'Por favor completa todos los campos'
    });
    return;
  }

  if (passwordNueva !== passwordConfirmar) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Las contraseñas nuevas no coinciden'
    });
    return;
  }

  if (passwordNueva.length < 6) {
    Swal.fire({
      icon: 'warning',
      title: 'Contraseña débil',
      text: 'La contraseña debe tener al menos 6 caracteres'
    });
    return;
  }

  try {
    const API_URL = window.API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${API_URL}/auth/cambiar-password-classroom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        passwordActual,
        passwordNueva
      })
    });

    const data = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: 'success',
        title: '¡Contraseña actualizada!',
        text: 'Tu contraseña del Classroom ha sido cambiada exitosamente',
        timer: 2000
      });

      // Limpiar formulario
      event.target.reset();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.message || 'No se pudo cambiar la contraseña'
      });
    }
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar con el servidor'
    });
  }
}

// Toggle estado online
function toggleEstadoOnline() {
  const checkbox = document.getElementById('estadoOnline');
  if (checkbox) {
    localStorage.setItem('estadoOnline', checkbox.checked);
    
    Swal.fire({
      icon: 'success',
      title: 'Guardado',
      text: `Estado en línea ${checkbox.checked ? 'visible' : 'oculto'}`,
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
}

// Toggle perfil público
function togglePerfilPublico() {
  const checkbox = document.getElementById('perfilPublico');
  if (checkbox) {
    localStorage.setItem('perfilPublico', checkbox.checked);
    
    Swal.fire({
      icon: 'success',
      title: 'Guardado',
      text: `Perfil ${checkbox.checked ? 'público' : 'privado'}`,
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
}

// Exportar tareas a PDF
// Exportar tareas a PDF (SOLO ALUMNOS)
async function exportarTareasPDF() {
  // Verificar que el usuario sea alumno
  if (!userRol || userRol.toLowerCase() !== 'alumno') {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso denegado',
      text: 'Esta función es exclusiva para alumnos'
    });
    return;
  }

  try {
    // Obtener el ID del alumno directamente del localStorage
    const idAlumno = localStorage.getItem('id_alumno');
    
    if (!idAlumno) {
      throw new Error('No se pudo obtener el ID del alumno');
    }
    
    console.log('Exportando tareas para idAlumno:', idAlumno);
    
    // Usar el puerto correcto del backend (3000) en lugar del dev-server (8080)
    const API_URL = window.API_URL || 'http://localhost:3000/api';
    const apiUrl = `${API_URL}/classroom/tareas-lista/alumno/${idAlumno}`;
    console.log('URL completa:', apiUrl);
    
    // Usar la ruta correcta para obtener tareas del alumno
    const response = await fetch(apiUrl);
    
    console.log('Response status:', response.status);
    console.log('Response URL:', response.url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al obtener tareas: ${response.status}`);
    }
    
    const tareas = await response.json();
    console.log('Tareas obtenidas:', tareas);

    if (!tareas || tareas.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin documentación',
        text: 'No tienes documentacion disponible aun'
      });
      return;
    }

    // Crear el PDF con jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Cargar y agregar logo CEMI
    const logoImg = new Image();
    logoImg.src = 'images/logo.png';
    
    // Esperar a que cargue el logo
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
    });
    
    // Fondo del encabezado
    doc.setFillColor(30, 60, 114); // #1e3c72
    doc.rect(0, 0, 210, 50, 'F');
    
    // Logo CEMI en esquina superior derecha con fondo blanco
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(168, 8, 28, 28, 2, 2, 'F');
      doc.addImage(logoImg, 'PNG', 170, 10, 24, 24);
    } catch (e) {
      console.warn('No se pudo cargar el logo');
    }
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE DE TAREAS', 20, 22);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('CEMI - Centro de Enseñanza de Múltiples Idiomas', 20, 32);
    
    // Línea decorativa azul
    doc.setDrawColor(103, 126, 234);
    doc.setLineWidth(2);
    doc.line(20, 42, 190, 42);
    
    // Información del estudiante - Diseño limpio
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(20, 58, 170, 22, 2, 2, 'F');
    
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, 58, 170, 22, 2, 2, 'D');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Estudiante:', 25, 66);
    doc.setFont(undefined, 'normal');
    doc.text(userName, 50, 66);
    
    doc.setFont(undefined, 'bold');
    doc.text('Fecha:', 25, 74);
    doc.setFont(undefined, 'normal');
    doc.text(new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }), 50, 74);
    
    let y = 92;
    const pageHeight = doc.internal.pageSize.height;
    
    // Agregar cada tarea con diseño limpio y ordenado
    tareas.forEach((tarea, index) => {
      // Verificar si necesitamos nueva página
      if (y > pageHeight - 60) {
        doc.addPage();
        
        // Repetir header simplificado en nueva página
        doc.setFillColor(30, 60, 114);
        doc.rect(0, 0, 210, 25, 'F');
        
        try {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(168, 5, 28, 15, 2, 2, 'F');
          doc.addImage(logoImg, 'PNG', 170, 6, 24, 13);
        } catch (e) {}
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('REPORTE DE TAREAS - CEMI', 20, 15);
        
        y = 35;
      }
      
      // Tarjeta de tarea con borde
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, y, 170, 10, 3, 3, 'F');
      
      doc.setDrawColor(200, 210, 220);
      doc.setLineWidth(0.8);
      doc.roundedRect(20, y, 170, 10, 3, 3, 'D');
      
      // Número y título de la tarea (centrado verticalmente)
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 60, 114);
      doc.text(`${index + 1}. ${tarea.titulo}`, 25, y + 6);
      
      y += 12;
      
      // Curso y Profesor en línea horizontal
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Curso:', 25, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(tarea.nombre_curso, 38, y);
      
      if (tarea.profesor_nombre) {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text('Profesor:', 110, y);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(tarea.profesor_nombre, 128, y);
      }
      
      y += 6;
      
      // Descripción de la tarea
      if (tarea.descripcion && tarea.descripcion !== 'Sin descripción') {
        doc.setFontSize(8);
        doc.setTextColor(70, 70, 70);
        const descripcionLines = doc.splitTextToSize(tarea.descripcion, 160);
        doc.text(descripcionLines, 28, y);
        y += (descripcionLines.length * 3.5) + 3;
      }
      
      // Separador sutil
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.line(28, y, 185, y);
      y += 4;
      
      // Información estructurada en columnas
      doc.setFontSize(8);
      
      // Columna 1: Fecha límite
      if (tarea.fecha_limite) {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text('Vence:', 28, y);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(new Date(tarea.fecha_limite).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }), 43, y);
      }
      
      // Columna 2: Puntos
      doc.setFont(undefined, 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Puntos:', 90, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(String(tarea.puntos || 0), 105, y);
      
      // Columna 3: Estado
      doc.setFont(undefined, 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Estado:', 125, y);
      doc.setFont(undefined, 'normal');
      
      const estado = tarea.estado || 'Pendiente';
      if (estado === 'entregada') {
        doc.setTextColor(16, 185, 129);
      } else if (estado === 'vencida') {
        doc.setTextColor(239, 68, 68);
      } else {
        doc.setTextColor(251, 146, 60);
      }
      doc.text(estado.charAt(0).toUpperCase() + estado.slice(1), 142, y);
      doc.setTextColor(0, 0, 0);
      
      y += 5;
      
      // Calificación si existe
      if (tarea.calificacion !== null && tarea.calificacion !== undefined) {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text('Calificación:', 28, y);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(9);
        doc.text(String(tarea.calificacion), 52, y);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        y += 5;
      }
      
      y += 8;
    });
    
    // Pie de página en la última página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${totalPages}`, 105, pageHeight - 10, { align: 'center' });
      doc.text('Documento generado por CEMI Classroom', 105, pageHeight - 5, { align: 'center' });
    }
    
    // Guardar el PDF
    const nombreArchivo = `Tareas_${userName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`;
    doc.save(nombreArchivo);
    
    Swal.fire({
      icon: 'success',
      title: 'PDF generado',
      text: 'Tus tareas han sido exportadas exitosamente',
      timer: 2000
    });
    
  } catch (error) {
    console.error('Error completo al exportar tareas:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `No se pudo generar el PDF de tareas: ${error.message}`
    });
  }
}

// Exportar calificaciones a PDF (SOLO ALUMNOS)
async function exportarCalificacionesPDF() {
  // Verificar que el usuario sea alumno
  if (!userRol || userRol.toLowerCase() !== 'alumno') {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso denegado',
      text: 'Esta función es exclusiva para alumnos'
    });
    return;
  }

  try {
    // Obtener el ID del alumno directamente del localStorage
    const idAlumno = localStorage.getItem('id_alumno');
    
    if (!idAlumno) {
      throw new Error('No se pudo obtener el ID del alumno');
    }
    
    console.log('Exportando calificaciones para idAlumno:', idAlumno);
    
    // Usar el puerto correcto del backend (3000) en lugar del dev-server (8080)
    const API_URL = window.API_URL || 'http://localhost:3000/api';
    const apiUrl = `${API_URL}/classroom/calificaciones/alumno/${idAlumno}`;
    console.log('URL completa:', apiUrl);
    
    // Usar la ruta correcta para obtener calificaciones del alumno
    const response = await fetch(apiUrl);
    
    console.log('Response status:', response.status);
    console.log('Response URL:', response.url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error al obtener calificaciones: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Data obtenida:', data);
    
    const calificaciones = data.calificaciones || [];
    console.log('Calificaciones:', calificaciones);

    if (!calificaciones || calificaciones.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin documentación',
        text: 'No tienes documentacion disponible aun'
      });
      return;
    }

    // Crear el PDF con jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Cargar y agregar logo CEMI
    const logoImg = new Image();
    logoImg.src = 'images/logo.png';
    
    // Esperar a que cargue el logo
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
    });
    
    // Fondo del encabezado
    doc.setFillColor(30, 60, 114); // #1e3c72
    doc.rect(0, 0, 210, 50, 'F');
    
    // Logo CEMI en esquina superior derecha con fondo blanco
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(168, 8, 28, 28, 2, 2, 'F');
      doc.addImage(logoImg, 'PNG', 170, 10, 24, 24);
    } catch (e) {
      console.warn('No se pudo cargar el logo');
    }
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE DE CALIFICACIONES', 20, 22);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('CEMI - Centro de Enseñanza de Múltiples Idiomas', 20, 32);
    
    // Línea decorativa azul
    doc.setDrawColor(103, 126, 234);
    doc.setLineWidth(2);
    doc.line(20, 42, 190, 42);
    
    // Información del estudiante - Diseño limpio
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(20, 58, 170, 28, 2, 2, 'F');
    
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, 58, 170, 28, 2, 2, 'D');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Estudiante:', 25, 66);
    doc.setFont(undefined, 'normal');
    doc.text(userName, 50, 66);
    
    doc.setFont(undefined, 'bold');
    doc.text('Fecha:', 25, 74);
    doc.setFont(undefined, 'normal');
    doc.text(new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }), 50, 74);
    
    // Estadísticas si están disponibles
    if (data.estadisticas) {
      doc.setFont(undefined, 'bold');
      doc.text('Promedio General:', 25, 82);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(11);
      doc.text(String(data.estadisticas.promedio_general), 60, 82);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      
      doc.setFont(undefined, 'bold');
      doc.text('Evaluaciones:', 110, 82);
      doc.setFont(undefined, 'normal');
      doc.text(String(data.estadisticas.tareas_completadas), 138, 82);
    }
    
    let y = 98;
    const pageHeight = doc.internal.pageSize.height;
    
    // Agregar cada curso con diseño limpio y organizado
    calificaciones.forEach((cal, index) => {
      // Verificar si necesitamos nueva página
      if (y > pageHeight - 60) {
        doc.addPage();
        
        // Repetir header simplificado en nueva página
        doc.setFillColor(30, 60, 114);
        doc.rect(0, 0, 210, 25, 'F');
        
        try {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(168, 5, 28, 15, 2, 2, 'F');
          doc.addImage(logoImg, 'PNG', 170, 6, 24, 13);
        } catch (e) {}
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('REPORTE DE CALIFICACIONES - CEMI', 20, 15);
        
        y = 35;
      }
      
      // Tarjeta del curso
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, y, 170, 10, 3, 3, 'F');
      
      doc.setDrawColor(200, 210, 220);
      doc.setLineWidth(0.8);
      doc.roundedRect(20, y, 170, 10, 3, 3, 'D');
      
      // Título del curso (centrado verticalmente)
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 60, 114);
      doc.text(`${index + 1}. ${cal.nombre_curso}`, 25, y + 6);
      
      y += 12;
      
      // Idioma y nivel
      const idiomaNivel = `${cal.nombre_idioma || ''}${cal.nivel ? ' - Nivel ' + cal.nivel : ''}`;
      if (idiomaNivel.trim()) {
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text('Idioma:', 25, y);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(70, 70, 70);
        doc.text(idiomaNivel, 40, y);
        doc.setTextColor(0, 0, 0);
        y += 6;
      }
      
      // Tabla de calificaciones - Diseño limpio
      const tableX = 25;
      const colWidth = 36;
      const rowHeight = 7;
      
      // Encabezado de tabla
      doc.setFillColor(103, 126, 234);
      doc.rect(tableX, y, colWidth * 4, rowHeight, 'F');
      
      doc.setDrawColor(103, 126, 234);
      doc.setLineWidth(0.5);
      doc.rect(tableX, y, colWidth * 4, rowHeight, 'D');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text('Parcial 1', tableX + (colWidth / 2), y + 4.5, { align: 'center' });
      doc.text('Parcial 2', tableX + colWidth + (colWidth / 2), y + 4.5, { align: 'center' });
      doc.text('Examen Final', tableX + (colWidth * 2) + (colWidth / 2), y + 4.5, { align: 'center' });
      doc.text('Promedio', tableX + (colWidth * 3) + (colWidth / 2), y + 4.5, { align: 'center' });
      
      y += rowHeight;
      
      // Valores de calificaciones
      doc.setFillColor(255, 255, 255);
      doc.rect(tableX, y, colWidth * 4, rowHeight + 1, 'F');
      
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.rect(tableX, y, colWidth * 4, rowHeight + 1, 'D');
      
      // Líneas verticales de separación
      for (let i = 1; i < 4; i++) {
        doc.line(tableX + (colWidth * i), y, tableX + (colWidth * i), y + rowHeight + 1);
      }
      
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      const p1 = cal.parcial1 !== null && cal.parcial1 !== undefined ? String(cal.parcial1) : '-';
      const p2 = cal.parcial2 !== null && cal.parcial2 !== undefined ? String(cal.parcial2) : '-';
      const final = cal.final !== null && cal.final !== undefined ? String(cal.final) : '-';
      const promedio = cal.promedio !== null && cal.promedio !== undefined && cal.promedio > 0 ? String(cal.promedio) : '-';
      
      doc.text(p1, tableX + (colWidth / 2), y + 5, { align: 'center' });
      doc.text(p2, tableX + colWidth + (colWidth / 2), y + 5, { align: 'center' });
      doc.text(final, tableX + (colWidth * 2) + (colWidth / 2), y + 5, { align: 'center' });
      
      // Promedio con color y destacado
      if (promedio !== '-') {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(10);
      }
      doc.text(promedio, tableX + (colWidth * 3) + (colWidth / 2), y + 5, { align: 'center' });
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      
      y += rowHeight + 4;
      
      // Fecha de actualización
      if (cal.fecha_actualizacion) {
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(`Última actualización: ${new Date(cal.fecha_actualizacion).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}`, 28, y);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        y += 3;
      }
      
      y += 9;
    });
    
    // Pie de página en todas las páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${totalPages}`, 105, pageHeight - 10, { align: 'center' });
      doc.text('Documento generado por CEMI Classroom', 105, pageHeight - 5, { align: 'center' });
    }
    
    // Guardar el PDF
    const nombreArchivo = `Calificaciones_${userName.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`;
    doc.save(nombreArchivo);
    
    Swal.fire({
      icon: 'success',
      title: 'PDF generado',
      text: 'Tus calificaciones han sido exportadas exitosamente',
      timer: 2000
    });
    
  } catch (error) {
    console.error('Error completo al exportar calificaciones:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `No se pudo generar el PDF de calificaciones: ${error.message}`
    });
  }
}


// Guardar vista de calendario
function guardarVistaCalendario() {
  const select = document.getElementById('config-vista-calendario');
  if (select) {
    const vista = select.value;
    localStorage.setItem('vistaCalendario', vista);
    vistaCalendarioActual = vista;
    
    // Si estamos en la vista de calendario, aplicar el cambio
    const viewCalendar = document.getElementById('viewCalendar');
    if (viewCalendar && viewCalendar.style.display !== 'none') {
      cambiarVistaCalendario(vista);
    }
    
    Swal.fire({
      icon: 'success',
      title: 'Vista guardada',
      text: `Vista de calendario: ${vista}`,
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
}

// Guardar todas las configuraciones
function guardarTodasConfiguraciones() {
  // Ya se van guardando automáticamente en localStorage
  // Esta función es para confirmar al usuario
  
  Swal.fire({
    icon: 'success',
    title: '¡Configuración guardada!',
    text: 'Todas tus preferencias han sido guardadas correctamente',
    timer: 2000
  });

  cerrarConfiguracion();
}

// Event listeners cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
  // Botón abrir configuración
  const btnConfig = document.getElementById('openConfiguracion');
  if (btnConfig) {
    btnConfig.addEventListener('click', abrirConfiguracion);
  }

  // Botón cerrar configuración
  const btnCerrar = document.querySelector('.btn-close-config');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', cerrarConfiguracion);
  }

  // Cerrar al hacer click fuera del modal
  const modalOverlay = document.getElementById('modalConfiguracion');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        cerrarConfiguracion();
      }
    });
  }

  // Tabs - Ya tienen onclick en HTML, no agregar event listeners duplicados

  // Botones de tamaño de fuente
  document.querySelectorAll('.font-size-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      cambiarTamañoFuente(this.dataset.size);
    });
  });

  // Botones de tema - Ya tienen onclick en HTML, así que no agregamos event listener duplicado
  // Solo aseguramos que los botones funcionen con data-theme
  
  // Formulario cambiar contraseña
  const formPassword = document.getElementById('formCambiarPassword');
  if (formPassword) {
    formPassword.addEventListener('submit', cambiarPasswordClassroom);
  }

  // Select vista calendario
  const selectVista = document.getElementById('config-vista-calendario');
  if (selectVista) {
    selectVista.addEventListener('change', guardarVistaCalendario);
  }

  // Botones guardar/cancelar
  const btnGuardar = document.getElementById('btnGuardarConfig');
  const btnCancelar = document.getElementById('btnCancelarConfig');
  
  if (btnGuardar) {
    btnGuardar.addEventListener('click', guardarTodasConfiguraciones);
  }
  
  if (btnCancelar) {
    btnCancelar.addEventListener('click', cerrarConfiguracion);
  }

  // Aplicar configuraciones guardadas al cargar
  const tamañoGuardado = localStorage.getItem('tamañoFuente');
  if (tamañoGuardado) {
    // Solo aplicar el tamaño sin buscar botones (que están en el modal)
    aplicarTamañoFuente(tamañoGuardado);
  }

  // Aplicar tema guardado SIN mostrar notificación
  const temaGuardado = localStorage.getItem('tema');
  if (temaGuardado) {
    aplicarTema(temaGuardado); // Usar aplicarTema en lugar de cambiarTema
  } else {
    // Si no hay tema guardado, usar modo claro por defecto
    aplicarTema('light'); // Usar aplicarTema en lugar de cambiarTema
  }
});

// Función auxiliar para solo aplicar el tamaño sin tocar botones
function aplicarTamañoFuente(tamaño) {
  const body = document.body;
  
  // Remover clases anteriores
  body.classList.remove('font-pequeño', 'font-normal', 'font-grande');
  
  // Agregar nueva clase
  body.classList.add(`font-${tamaño}`);
  
  // También aplicar directamente
  switch (tamaño) {
    case 'pequeño':
      body.style.fontSize = '14px';
      break;
    case 'normal':
      body.style.fontSize = '16px';
      break;
    case 'grande':
      body.style.fontSize = '18px';
      break;
  }
}

console.log('CEMI Classroom inicializado correctamente');
