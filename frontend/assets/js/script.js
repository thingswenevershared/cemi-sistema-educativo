// =====================================================
// script.js — Sistema CEMI conectado al backend Node.js
// =====================================================

const API_URL = window.API_URL || "http://localhost:3000/api";

// =====================================================
// 1️⃣ LOGIN
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Si hay mensaje de bienvenida
  const welcomeMsg = document.getElementById("welcomeMessage");
  if (welcomeMsg && localStorage.getItem("nombre")) {
    welcomeMsg.textContent = `Bienvenido, ${localStorage.getItem("nombre")} 👋`;
  }

  // Detectar qué dashboard estamos y cargar datos
  if (document.body.classList.contains("admin")) initAdminDashboard();
  if (document.body.classList.contains("profesor")) initProfesorDashboard();
  if (document.body.classList.contains("alumno")) initAlumnoDashboard();
});

// -----------------------------------------------------
// Función: Login
// -----------------------------------------------------
async function handleLogin(e) {
  e.preventDefault();
  console.log("🔐 Iniciando proceso de login...");

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("loginMessage");

  console.log("👤 Usuario:", username);

  message.style.color = "gray";
  message.textContent = "Accediendo...";

  try {
    console.log("📡 Enviando petición a:", `${API_URL}/auth/login`);
    const resp = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    console.log("📥 Respuesta recibida - Status:", resp.status);
    const data = await resp.json();
    console.log("📦 Datos recibidos:", data);

    if (resp.ok && data.success) {
        console.log("✅ Login exitoso, guardando datos...");
        localStorage.setItem("rol", data.rol);
        localStorage.setItem("id_usuario", data.id_usuario);
        localStorage.setItem("nombre", data.nombre);
        localStorage.setItem("username", data.username);
        if (data.id_profesor) localStorage.setItem("id_profesor", data.id_profesor);
        if (data.id_alumno) localStorage.setItem("id_alumno", data.id_alumno);
        
      message.style.color = "green";
      message.textContent = "Inicio de sesión exitoso";

      const rol = data.rol.toLowerCase();
      console.log("🎯 Rol detectado:", rol);
      console.log("🔄 Redirigiendo...");
      
      if (rol === "admin" || rol === "administrador") {
        console.log("➡️ Redirigiendo a dashboard_admin.html");
        window.location.href = "dashboard_admin.html";
      } else if (rol === "profesor") {
        console.log("➡️ Redirigiendo a dashboard_profesor.html");
        window.location.href = "dashboard_profesor.html";
      } else if (rol === "alumno") {
        console.log("➡️ Redirigiendo a dashboard_alumno.html");
        window.location.href = "dashboard_alumno.html";
      } else {
        console.log("➡️ Redirigiendo a index.html");
        window.location.href = "index.html";
      }
    } else {
      console.error("❌ Login fallido:", data.message);
      message.style.color = "red";
      message.textContent = data.message || "Usuario o contraseña incorrectos.";
    }
  } catch (err) {
    console.error("💥 Error al conectar:", err);
    message.style.color = "red";
    message.textContent = "No se pudo conectar con el servidor.";
  }
}

// -----------------------------------------------------
// Función: Logout
// -----------------------------------------------------
function handleLogout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// ===== ADMIN DASHBOARD SPA ===== //

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("admin")) {
    initAdminSPA();
  }
});

function initAdminSPA() {
  const buttons = document.querySelectorAll(".sidebar-menu button");
  const mainContent = document.getElementById("mainContent");
  const loader = document.getElementById("loader");

  // Asignar eventos a los botones del sidebar
  buttons.forEach(btn => {
    btn.addEventListener("click", async () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const section = btn.id.replace("btn", "").toLowerCase();
      await loadSection(section);
    });
  });

  // Cargar la primera sección (Cursos) por defecto
  loadSection("cursos");

  async function loadSection(section) {
    // Ocultar el chat container si está visible
    const chatContainer = document.getElementById('adminChatContainer');
    if (chatContainer) {
      chatContainer.style.display = 'none';
    }
    
    mainContent.classList.remove("active");
    loader.classList.remove("hidden");
    mainContent.innerHTML = "";

    try {
      let html = "";
      let endpoint = "";

      switch (section) {
        case "cursos":
          endpoint = `${API_URL}/cursos`;
            html = `<h2>Listado de Cursos</h2>`;
          break;
        case "alumnos":
          endpoint = `${API_URL}/alumnos`;
          html = `<h2>Listado de Alumnos</h2>`;
          break;
        case "profesores":
          endpoint = `${API_URL}/profesores`;
          html = `<h2>Listado de Profesores</h2>`;
          break;
        case "administradores":
          endpoint = `${API_URL}/administradores`;
          html = `<h2>Listado de Administradores</h2>`;
          break;
        case "pagos":
          endpoint = `${API_URL}/pagos`;
          html = `<h2>Listado de Pagos</h2>`;
          break;
        case "aulas":
          endpoint = `${API_URL}/aulas`;
          html = `<h2>Listado de Aulas</h2>`;
          break;
        case "idiomas":
          endpoint = `${API_URL}/idiomas`;
          html = `<h2>Listado de Idiomas</h2>`;
          break;
        case "chatsoporte":
          // Ocultar el mainContent y mostrar el adminChatContainer
          loader.classList.add("hidden");
          mainContent.innerHTML = "";
          mainContent.classList.add("active");
          
          // Mostrar el contenedor del chat
          const chatContainer = document.getElementById('adminChatContainer');
          if (chatContainer) {
            chatContainer.style.display = 'block';
            adminChatManager.renderChatView();
          }
          return; // Salir antes del setTimeout normal
        case "classroom":
          window.location.href = 'classroom-login.html';
          return;
        default:
          endpoint = "";
          html = "<p>Seleccione una sección</p>";
      }

      if (endpoint) {
        const res = await fetch(endpoint);
        const data = await res.json();

        // Para pagos, la respuesta tiene estructura diferente
        if (section === 'pagos') {
          html += generateTable(section, data);
        } else if (section === 'aulas' || section === 'idiomas') {
          html += generateTable(section, data);
        } else if (data && data.length > 0) {
          html += generateTable(section, data);
        } else {
          html += "<p>No hay datos disponibles.</p>";
        }
      }

      setTimeout(() => {
        loader.classList.add("hidden");
        mainContent.innerHTML = html;
        // Si estamos en la sección cursos, hacemos las tarjetas clicables
        if (section === 'cursos') {
          // Reinicializar iconos de Lucide
          lucide.createIcons();
          
          // Hacer las tarjetas clickables
          document.querySelectorAll('.curso-card:not(.alumno-card):not(.profesor-card)').forEach(card => {
            card.addEventListener('click', () => {
              const idCurso = card.getAttribute('data-id');
              openCursoPanel(idCurso);
            });
          });
        }
        // Si estamos en la sección alumnos, configurar filtros y búsqueda
        if (section === 'alumnos') {
          lucide.createIcons();
          setupAlumnoFilters();
        }
        // Si estamos en la sección profesores, configurar filtros y búsqueda
        if (section === 'profesores') {
          lucide.createIcons();
          setupProfesorFilters();
        }
        // Si estamos en la sección administradores, configurar filtros y búsqueda
        if (section === 'administradores') {
          lucide.createIcons();
          setupAdministradorFilters();
        }
        // Si estamos en la sección pagos, cargar datos y configurar filtros
        if (section === 'pagos') {
          lucide.createIcons();
          loadPagosData();
        }
        // Si estamos en aulas o idiomas, inicializar iconos
        if (section === 'aulas' || section === 'idiomas') {
          lucide.createIcons();
        }
        mainContent.classList.add("active");
      }, 400);
    } catch (err) {
      console.error("Error al cargar sección:", err);
      loader.classList.add("hidden");
      mainContent.innerHTML = "<p>Error al cargar los datos.</p>";
      mainContent.classList.add("active");
    }
  }
}

// Función helper para recargar la sección activa
function recargarSeccionActiva() {
  const activeBtn = document.querySelector('.sidebar-menu button.active');
  if (activeBtn) {
    activeBtn.click();
  }
}


function generateTable(section, data) {
  switch (section) {
    case "cursos":
      return `
        <div class="cursos-header" style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 25px;">
          <button class="btn-primary" onclick="openNuevoCursoModal()">
            <i data-lucide="plus"></i>
            Nuevo Curso
          </button>
        </div>
        <div class="cursos-grid">
          ${data.map(c => {
            const cuposMax = c.cupo_maximo || 30;
            const inscritos = c.alumnos_inscritos || 0;
            const porcentaje = (inscritos / cuposMax) * 100;
            let barClass = '';
            if (porcentaje >= 90) barClass = 'danger';
            else if (porcentaje >= 70) barClass = 'warning';

            return `
            <div class="curso-card" data-id="${c.id_curso}" data-name="${c.nombre_curso}">
              <div class="curso-card-header">
                <div class="curso-icon">
                  <i data-lucide="book-open"></i>
                </div>
                <div class="curso-card-title">
                  <h3>${c.nombre_curso}</h3>
                  <div class="idioma">${c.nombre_idioma || "Sin idioma"}</div>
                  <span class="curso-badge">${c.nivel || "Nivel no especificado"}</span>
                </div>
              </div>
              
              <div class="curso-card-info">
                <div class="info-row">
                  <i data-lucide="user"></i>
                  <span>${c.profesor || "Sin profesor asignado"}</span>
                </div>
                <div class="info-row">
                  <i data-lucide="clock"></i>
                  <span>${c.horario || "Horario por definir"}</span>
                </div>
                <div class="info-row">
                  <i data-lucide="map-pin"></i>
                  <span>${c.nombre_aula || "Sin aula asignada"}</span>
                </div>
              </div>
              
              <div class="curso-card-footer">
                <div class="cupos-info">
                  <div class="cupos-text">${inscritos} / ${cuposMax} alumnos</div>
                  <div class="cupos-bar">
                    <div class="cupos-bar-fill ${barClass}" style="width: ${Math.min(porcentaje, 100)}%"></div>
                  </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <button class="btn-icon-success" onclick="event.stopPropagation(); asignarProfesorACurso(${c.id_curso}, '${c.nombre_curso}')" title="Asignar Profesor">
                    <i data-lucide="user-check"></i>
                  </button>
                  <button class="btn-icon-primary" onclick="event.stopPropagation(); openCursoPanel(${c.id_curso})" title="Ver detalles">
                    <i data-lucide="eye"></i>
                  </button>
                  <button class="btn-icon-edit" onclick="event.stopPropagation(); editarCurso(${c.id_curso})" title="Editar">
                    <i data-lucide="edit-2"></i>
                  </button>
                  <button class="btn-icon-danger" onclick="event.stopPropagation(); eliminarCurso(${c.id_curso}, '${c.nombre_curso}')" title="Eliminar">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </div>
            </div>
          `}).join('')}
        </div>`;
    case "alumnos":
      return `
        <div class="alumnos-header">
          <div class="alumnos-search-filter">
            <div style="position: relative; flex: 1;">
              <i data-lucide="search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #999; width: 18px; height: 18px;"></i>
              <input type="text" id="alumnosSearch" placeholder="Buscar por nombre, legajo o email..." style="width: 100%;">
            </div>
            <select id="alumnosEstadoFilter">
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            <button class="btn-primary" onclick="openNuevoAlumnoModal()">
              <i data-lucide="user-plus"></i>
              Nuevo Alumno
            </button>
          </div>
        </div>
        <div class="cursos-grid" id="alumnosGrid">
          ${data.map(a => {
            const estado = a.estado || 'activo';
            const cursos = a.cursos_inscritos || 0;
            const iniciales = `${a.nombre.charAt(0)}${a.apellido.charAt(0)}`.toUpperCase();
            
            return `
            <div class="curso-card alumno-card" data-id="${a.id_alumno}">
              <div class="curso-card-header">
                <div class="curso-icon" style="background: linear-gradient(135deg, #1976d2, #42a5f5);">
                  <span style="font-size: 18px; font-weight: 700; color: white;">${iniciales}</span>
                </div>
                <div class="curso-card-title">
                  <h3>${a.nombre} ${a.apellido}</h3>
                  <div class="idioma">Legajo: ${a.legajo}</div>
                  <span class="alumno-estado-badge ${estado}">${estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
                </div>
              </div>
              
              <div class="curso-card-info">
                <div class="info-row">
                  <i data-lucide="mail"></i>
                  <span>${a.mail}</span>
                </div>
                ${a.telefono ? `
                <div class="info-row">
                  <i data-lucide="phone"></i>
                  <span>${a.telefono}</span>
                </div>` : ''}
                <div class="info-row">
                  <i data-lucide="calendar"></i>
                  <span>Registro: ${a.fecha_registro ? new Date(a.fecha_registro).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
              
              <div class="curso-card-footer" style="justify-content: space-between;">
                <span class="cursos-badge">
                  <i data-lucide="book-open" style="width: 14px; height: 14px;"></i>
                  ${cursos} ${cursos === 1 ? 'curso' : 'cursos'}
                </span>
                <div style="display: flex; gap: 8px;">
                  <button class="btn-icon-primary" onclick="event.stopPropagation(); openAlumnoPanel(${a.id_alumno})" title="Ver detalles">
                    <i data-lucide="eye"></i>
                  </button>
                  <button class="btn-icon-edit" onclick="event.stopPropagation(); editarAlumno(${a.id_alumno})" title="Editar">
                    <i data-lucide="edit-2"></i>
                  </button>
                  <button class="btn-icon-danger" onclick="event.stopPropagation(); eliminarAlumno(${a.id_alumno}, '${a.nombre} ${a.apellido}')" title="Eliminar">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </div>
            </div>
          `}).join('')}
        </div>`;

    case "profesores":
      return `
        <div class="profesores-header">
          <div class="profesores-search-filter">
            <div style="position: relative; flex: 1;">
              <i data-lucide="search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #999; width: 18px; height: 18px;"></i>
              <input type="text" id="profesoresSearch" placeholder="Buscar por nombre, especialidad o idioma..." style="width: 100%;">
            </div>
            <select id="profesoresEstadoFilter">
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="licencia">En Licencia</option>
            </select>
            <select id="profesoresIdiomaFilter">
              <option value="">Todos los idiomas</option>
            </select>
            <button class="btn-primary" onclick="openNuevoProfesorModal()">
              <i data-lucide="user-plus"></i>
              Nuevo Profesor
            </button>
          </div>
        </div>
        <div class="cursos-grid" id="profesoresGrid">
          ${data.map(p => {
            const estado = p.estado || 'activo';
            const cursos = p.total_cursos || 0;
            const iniciales = `${p.nombre.charAt(0)}${p.apellido.charAt(0)}`.toUpperCase();
            const idiomas = p.idiomas || 'Sin idiomas';
            
            return `
            <div class="curso-card profesor-card" data-id="${p.id_profesor}" data-idioma="${idiomas}">
              <div class="curso-card-header">
                <div class="curso-icon" style="background: linear-gradient(135deg, #6a1b9a, #8e24aa);">
                  <span style="font-size: 18px; font-weight: 700; color: white;">${iniciales}</span>
                </div>
                <div class="curso-card-title">
                  <h3>${p.nombre} ${p.apellido}</h3>
                  <div class="idioma">${p.especialidad || 'Sin especialidad'}</div>
                  <span class="profesor-estado-badge ${estado}">${estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
                </div>
              </div>
              
              <div class="curso-card-info">
                <div class="info-row">
                  <i data-lucide="mail"></i>
                  <span>${p.mail}</span>
                </div>
                ${p.telefono ? `
                <div class="info-row">
                  <i data-lucide="phone"></i>
                  <span>${p.telefono}</span>
                </div>` : ''}
                <div class="info-row">
                  <i data-lucide="languages"></i>
                  <span>${idiomas}</span>
                </div>
              </div>
              
              <div class="curso-card-footer" style="justify-content: space-between;">
                <span class="cursos-badge">
                  <i data-lucide="book-open" style="width: 14px; height: 14px;"></i>
                  ${cursos} ${cursos === 1 ? 'curso' : 'cursos'}
                </span>
                <div style="display: flex; gap: 8px;">
                  <button class="btn-icon-primary" onclick="event.stopPropagation(); openProfesorPanel(${p.id_profesor})" title="Ver detalles">
                    <i data-lucide="eye"></i>
                  </button>
                  <button class="btn-icon-edit" onclick="event.stopPropagation(); editarProfesor(${p.id_profesor})" title="Editar">
                    <i data-lucide="edit-2"></i>
                  </button>
                  <button class="btn-icon-danger" onclick="event.stopPropagation(); eliminarProfesor(${p.id_profesor}, '${p.nombre} ${p.apellido}')" title="Eliminar">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </div>
            </div>
          `}).join('')}
        </div>`;

    case "administradores":
      return `
        <div class="profesores-header">
          <div class="profesores-search-filter">
            <div style="position: relative; flex: 1;">
              <i data-lucide="search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #999; width: 18px; height: 18px;"></i>
              <input type="text" id="administradoresSearch" placeholder="Buscar por nombre, email o DNI..." style="width: 100%;">
            </div>
            <button class="btn-primary" onclick="openNuevoAdministradorModal()">
              <i data-lucide="user-plus"></i>
              Nuevo Administrador
            </button>
          </div>
        </div>
        <div class="cursos-grid" id="administradoresGrid">
          ${data.map(admin => {
            const iniciales = `${admin.nombre.charAt(0)}${admin.apellido.charAt(0)}`.toUpperCase();
            const estado = admin.estado || 'activo';
            
            return `
            <div class="curso-card profesor-card" data-id="${admin.id_persona}">
              <div class="curso-card-header">
                <div class="curso-icon" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6);">
                  <span style="font-size: 18px; font-weight: 700; color: white;">${iniciales}</span>
                </div>
                <div class="curso-card-title">
                  <h3>${admin.nombre} ${admin.apellido}</h3>
                  <div class="idioma">Administrador</div>
                  <span class="profesor-estado-badge ${estado}">${estado === 'activo' ? 'Activo' : 'Sin acceso'}</span>
                </div>
              </div>
              
              <div class="curso-card-info">
                <div class="info-row">
                  <i data-lucide="mail"></i>
                  <span>${admin.mail}</span>
                </div>
                ${admin.telefono ? `
                <div class="info-row">
                  <i data-lucide="phone"></i>
                  <span>${admin.telefono}</span>
                </div>` : ''}
                ${admin.dni ? `
                <div class="info-row">
                  <i data-lucide="credit-card"></i>
                  <span>DNI: ${admin.dni}</span>
                </div>` : ''}
                <div class="info-row">
                  <i data-lucide="user"></i>
                  <span>@${admin.username || 'Sin usuario'}</span>
                </div>
              </div>
              
              <div class="curso-card-footer" style="justify-content: flex-end;">
                <div style="display: flex; gap: 8px;">
                  <button class="btn-icon-edit" onclick="event.stopPropagation(); editarAdministrador(${admin.id_persona})" title="Editar">
                    <i data-lucide="edit-2"></i>
                  </button>
                  <button class="btn-icon-warning" onclick="event.stopPropagation(); abrirModalCredencialesAdministrador(${admin.id_persona})" title="Editar Credenciales">
                    <i data-lucide="key"></i>
                  </button>
                  <button class="btn-icon-danger" onclick="event.stopPropagation(); eliminarAdministrador(${admin.id_persona}, '${admin.nombre} ${admin.apellido}')" title="Eliminar">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </div>
            </div>
          `}).join('')}
        </div>`;

case "pagos":
  return `
    <div class="pagos-metrics">
      <div class="metric-card">
        <div class="metric-card-header">
          <div class="metric-card-title">Total Recaudado (Mes)</div>
          <div class="metric-card-icon success">
            <i data-lucide="dollar-sign"></i>
          </div>
        </div>
        <div class="metric-card-value">$<span id="metricTotalMes">0</span></div>
        <div class="metric-card-subtitle">Noviembre 2025</div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <div class="metric-card-title">Cuotas Cobradas</div>
          <div class="metric-card-icon info">
            <i data-lucide="check-circle"></i>
          </div>
        </div>
        <div class="metric-card-value" id="metricCobradas">0</div>
        <div class="metric-card-subtitle"><span id="metricPendientes">0</span> pendientes</div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <div class="metric-card-title">Alumnos en Mora</div>
          <div class="metric-card-icon danger">
            <i data-lucide="alert-triangle"></i>
          </div>
        </div>
        <div class="metric-card-value" id="metricMora">0</div>
        <div class="metric-card-subtitle">Requieren seguimiento</div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <div class="metric-card-title">Promedio por Pago</div>
          <div class="metric-card-icon warning">
            <i data-lucide="trending-up"></i>
          </div>
        </div>
        <div class="metric-card-value">$<span id="metricPromedio">0</span></div>
        <div class="metric-card-subtitle">Histórico</div>
      </div>
    </div>

    <div class="pagos-filters">
      <div class="filter-group">
        <label>Buscar alumno</label>
        <input type="text" id="pagoSearchAlumno" placeholder="Nombre, legajo o email...">
      </div>
      <div class="filter-group">
        <label>Medio de Pago</label>
        <select id="pagoFilterMedio">
          <option value="">Todos</option>
        </select>
      </div>
      <div>
        <button class="btn-add-pago" onclick="openRegistrarPagoModal()">
          <i data-lucide="plus"></i>
          Registrar Pago
        </button>
      </div>
    </div>

    <div class="pagos-table-container">
      <table class="pagos-table">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Concepto</th>
            <th>Periodo</th>
            <th>Monto</th>
            <th>Fecha Pago</th>
            <th>Medio</th>
            <th>Estado</th>
            <th style="width: 80px; text-align: center;">Acciones</th>
          </tr>
        </thead>
        <tbody id="pagosTableBody">
          <tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">Cargando pagos...</td></tr>
        </tbody>
      </table>
    </div>
  `;
  
    case "inscripciones":
      return `
        <div class="inscripciones-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <div></div>
          <button class="btn-primary" onclick="openNuevaInscripcionModal()">
            <i data-lucide="user-plus"></i>
            Nueva Inscripción
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Alumno</th>
              <th>Curso</th>
              <th>Fecha Inscripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${data.length > 0 ? data.map(i => `
              <tr>
                <td>${i.id_inscripcion}</td>
                <td>${i.alumno}</td>
                <td>${i.nombre_curso}</td>
                <td>${new Date(i.fecha_inscripcion).toLocaleDateString()}</td>
                <td><span class="badge ${i.estado === 'activo' ? 'success' : 'inactive'}">${i.estado}</span></td>
                <td>
                  <button class="btn-icon-danger" onclick="eliminarInscripcion(${i.id_inscripcion}, '${i.alumno}', '${i.nombre_curso}')" title="Eliminar">
                    <i data-lucide="trash-2"></i>
                  </button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="6" style="text-align: center; padding: 40px;">No hay inscripciones registradas</td></tr>'}
          </tbody>
        </table>
      `;
    
    case "aulas":
      return `
        <div class="aulas-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <div>
            <h2 style="color: #1e3c72; margin: 0 0 5px 0;">Gestión de Aulas</h2>
            <p style="color: #666; margin: 0; font-size: 14px;">${data.length} aula${data.length !== 1 ? 's' : ''} disponible${data.length !== 1 ? 's' : ''}</p>
          </div>
          <button class="btn-primary" onclick="openNuevaAulaModal()">
            <i data-lucide="plus"></i>
            Nueva Aula
          </button>
        </div>
        <div class="aulas-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
          ${data.length > 0 ? data.map(a => {
            const capacidadColor = a.capacidad >= 40 ? '#2e7d32' : a.capacidad >= 25 ? '#ed6c02' : '#1976d2';
            const capacidadIcon = a.capacidad >= 40 ? 'users' : a.capacidad >= 25 ? 'user-check' : 'user';
            
            return `
            <div class="aula-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s ease; border-left: 4px solid ${capacidadColor};" onmouseenter="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'; this.style.transform='translateY(-2px)';" onmouseleave="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'; this.style.transform='translateY(0)';">
              <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                <div style="width: 50px; height: 50px; border-radius: 10px; background: linear-gradient(135deg, ${capacidadColor}20, ${capacidadColor}40); display: flex; align-items: center; justify-content: center;">
                  <i data-lucide="door-open" style="width: 24px; height: 24px; color: ${capacidadColor};"></i>
                </div>
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 5px 0; color: #1e3c72; font-size: 18px;">${a.nombre_aula}</h3>
                  <p style="margin: 0; color: #666; font-size: 13px;">Aula ${a.id_aula}</p>
                </div>
              </div>
              
              <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 35px; height: 35px; border-radius: 8px; background: ${capacidadColor}20; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${capacidadIcon}" style="width: 18px; height: 18px; color: ${capacidadColor};"></i>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: 700; color: ${capacidadColor};">${a.capacidad}</div>
                    <div style="font-size: 12px; color: #666;">Capacidad máxima</div>
                  </div>
                </div>
              </div>
              
              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="btn-icon-edit" onclick="editarAula(${a.id_aula}, '${a.nombre_aula}', ${a.capacidad})" title="Editar">
                  <i data-lucide="edit-2"></i>
                </button>
                <button class="btn-icon-danger" onclick="eliminarAula(${a.id_aula}, '${a.nombre_aula}')" title="Eliminar">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          `}).join('') : '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><i data-lucide="inbox" style="width: 48px; height: 48px; color: #ccc; margin-bottom: 15px;"></i><p style="color: #999; font-size: 16px;">No hay aulas registradas</p><p style="color: #ccc; font-size: 14px;">Comienza agregando una nueva aula</p></div>'}
        </div>
      `;
    
    case "idiomas":
      // Calcular estadísticas de idiomas
      const idiomasStats = {
        total: data.length,
        populares: ['Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués']
      };
      
      return `
        <div class="idiomas-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <div>
            <h2 style="color: #1e3c72; margin: 0 0 5px 0;">Gestión de Idiomas</h2>
            <p style="color: #666; margin: 0; font-size: 14px;">${data.length} idioma${data.length !== 1 ? 's' : ''} disponible${data.length !== 1 ? 's' : ''}</p>
          </div>
          <button class="btn-primary" onclick="openNuevoIdiomaModal()">
            <i data-lucide="plus"></i>
            Nuevo Idioma
          </button>
        </div>
        <div class="idiomas-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
          ${data.length > 0 ? data.map((idioma, index) => {
            // Colores variados para cada idioma
            const colors = [
              { bg: '#1976d2', light: '#42a5f5', icon: 'globe-2' },
              { bg: '#7b1fa2', light: '#ba68c8', icon: 'book-open' },
              { bg: '#0097a7', light: '#4dd0e1', icon: 'message-circle' },
              { bg: '#d84315', light: '#ff7043', icon: 'volume-2' },
              { bg: '#388e3c', light: '#66bb6a', icon: 'award' },
              { bg: '#f57c00', light: '#ffb74d', icon: 'flag' }
            ];
            const colorScheme = colors[index % colors.length];
            const isPopular = idiomasStats.populares.includes(idioma.nombre_idioma);
            
            return `
            <div class="idioma-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s ease; position: relative; overflow: hidden;" onmouseenter="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'; this.style.transform='translateY(-2px)';" onmouseleave="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'; this.style.transform='translateY(0)';">
              ${isPopular ? '<div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #ffd700, #ffed4e); color: #f57c00; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 12px; display: flex; align-items: center; gap: 4px;"><i data-lucide="star" style="width: 12px; height: 12px;"></i> Popular</div>' : ''}
              
              <div style="background: linear-gradient(135deg, ${colorScheme.bg}, ${colorScheme.light}); border-radius: 10px; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <i data-lucide="${colorScheme.icon}" style="width: 30px; height: 30px; color: white;"></i>
              </div>
              
              <h3 style="margin: 0 0 8px 0; color: #1e3c72; font-size: 20px; font-weight: 600;">${idioma.nombre_idioma}</h3>
              <p style="margin: 0 0 15px 0; color: #999; font-size: 13px;">ID: ${idioma.id_idioma}</p>
              
              <div style="height: 1px; background: #e0e0e0; margin: 15px 0;"></div>
              
              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="btn-icon-edit" onclick="editarIdioma(${idioma.id_idioma}, '${idioma.nombre_idioma}')" title="Editar">
                  <i data-lucide="edit-2"></i>
                </button>
                <button class="btn-icon-danger" onclick="eliminarIdioma(${idioma.id_idioma}, '${idioma.nombre_idioma}')" title="Eliminar">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          `}).join('') : '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><i data-lucide="languages" style="width: 48px; height: 48px; color: #ccc; margin-bottom: 15px;"></i><p style="color: #999; font-size: 16px;">No hay idiomas registrados</p><p style="color: #ccc; font-size: 14px;">Comienza agregando un nuevo idioma</p></div>'}
        </div>
      `;
      
    default:
      return "<p>Sección no disponible.</p>";
  }
}

// ===== DASHBOARD HOME ===== //
async function generateDashboardHome() {
  try {
    // Cargar estadísticas generales
    const [statsRes, registrosRes, pagosRes] = await Promise.all([
      fetch(`${API_URL}/stats/general`),
      fetch(`${API_URL}/stats/ultimos-registros`),
      fetch(`${API_URL}/stats/ultimos-pagos`)
    ]);

    const stats = await statsRes.json();
    const registros = await registrosRes.json();
    const pagos = await pagosRes.json();

    return `
      <h2 style="margin-bottom: 30px;">Dashboard Administrativo</h2>
      
      <!-- Cards de Estadísticas -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="stat-info">
              <h3>Total Alumnos</h3>
              <p class="stat-number">${stats.totalAlumnos}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon purple">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            </div>
            <div class="stat-info">
              <h3>Total Profesores</h3>
              <p class="stat-number">${stats.totalProfesores}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon green">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </div>
            <div class="stat-info">
              <h3>Total Cursos</h3>
              <p class="stat-number">${stats.totalCursos}</p>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <div class="stat-info">
              <h3>Ingresos del Mes</h3>
              <p class="stat-number">$${stats.ingresosMes.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tablas de resumen -->
      <div class="dashboard-tables">
        <!-- Últimos Registros -->
        <div class="dashboard-table-card">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
            Últimos Registros
          </h3>
          ${registros.length > 0 ? `
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                ${registros.map(r => `
                  <tr>
                    <td>${r.nombre} ${r.apellido}</td>
                    <td><span class="badge-tipo ${r.tipo.toLowerCase()}">${r.tipo}</span></td>
                    <td>${new Date(r.fecha).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state">No hay registros recientes</div>'}
        </div>

        <!-- Últimos Pagos -->
        <div class="dashboard-table-card">
          <h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            Últimos Pagos
          </h3>
          ${pagos.length > 0 ? `
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${pagos.map(p => `
                  <tr>
                    <td>${p.alumno}</td>
                    <td>$${parseFloat(p.monto).toLocaleString()}</td>
                    <td><span class="badge ${p.estado === 'pagado' ? 'success' : 'warning'}">${p.estado}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state">No hay pagos recientes</div>'}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
    return '<p>Error al cargar el dashboard</p>';
  }
}

// ----------------------------
// Modal: inscribir alumnos
// ----------------------------
function ensureInscribirModal() {
  if (document.getElementById('modalInscribir')) return;

  const modalHtml = `
    <div id="modalInscribir" class="modal">
      <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
        <div class="modal-header">
          <h3 id="modalInscribirTitle">Gestión de Alumnos</h3>
          <button type="button" class="close-modal" aria-label="Cerrar">&times;</button>
        </div>
        
        <div class="tabs-container">
          <button class="tab-btn active" data-tab="inscritos">
            <i data-lucide="users"></i>
            Alumnos Inscritos
            <span class="tab-badge" id="badgeInscritos">0</span>
          </button>
          <button class="tab-btn" data-tab="inscribir">
            <i data-lucide="user-plus"></i>
            Inscribir Nuevos
            <span class="tab-badge" id="badgeDisponibles">0</span>
          </button>
        </div>
        
        <div class="tab-content active" id="tabInscritos">
          <div id="alumnosInscritosList"></div>
        </div>
        
        <div class="tab-content" id="tabInscribir">
          <div class="search-box-wrapper">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" id="searchAlumnos" placeholder="Buscar por nombre, apellido o email..." class="search-input-with-icon">
          </div>
          <div id="alumnosDisponiblesList"></div>
        </div>
        
        <div class="modal-footer-actions" id="footerInscribir" style="display: none;">
          <span class="selected-count" id="selectedCount">0 alumnos seleccionados</span>
          <button type="button" id="btnConfirmInscribir" class="btn-primary">
            <i data-lucide="check"></i> Inscribir Seleccionados
          </button>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('modalInscribir');

  // Cerrar modal
  modal.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => {
    modal.classList.remove('active');
    // Recargar la sección activa después de cerrar el modal
    recargarSeccionActiva();
  }));
  modal.addEventListener('click', e => { 
    if (e.target === modal) {
      modal.classList.remove('active');
      // Recargar la sección activa después de cerrar el modal
      recargarSeccionActiva();
    }
  });

  // Manejo de tabs
  modal.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // Cambiar tabs activas
      modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).classList.add('active');
      
      // Mostrar/ocultar footer según tab
      document.getElementById('footerInscribir').style.display = tabId === 'inscribir' ? 'flex' : 'none';
      
      lucide.createIcons();
    });
  });
}

async function openInscribirModal(idCurso, nombre) {
  ensureInscribirModal();
  const modal = document.getElementById('modalInscribir');
  document.getElementById('modalInscribirTitle').textContent = `Gestión de Alumnos - ${nombre}`;
  modal.dataset.idCurso = idCurso;
  modal.classList.add('active');

  // Cargar ambas listas
  await Promise.all([
    cargarAlumnosInscritos(idCurso),
    cargarAlumnosDisponibles(idCurso)
  ]);

  lucide.createIcons();
}

// Función para cargar alumnos inscritos
async function cargarAlumnosInscritos(idCurso) {
  const container = document.getElementById('alumnosInscritosList');
  container.innerHTML = '<p style="text-align:center;padding:20px;">Cargando...</p>';

  try {
    const res = await fetch(`${API_URL}/inscripciones/curso/${idCurso}`);
    const inscritos = await res.json();

    document.getElementById('badgeInscritos').textContent = inscritos.length;

    if (inscritos.length === 0) {
      container.innerHTML = '<div class="empty-state"><i data-lucide="users"></i><p>No hay alumnos inscritos en este curso</p></div>';
      lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="alumnos-grid">
        ${inscritos.map(a => {
          const iniciales = `${(a.nombre || 'A')[0]}${(a.apellido || 'A')[0]}`.toUpperCase();
          return `
            <div class="alumno-card">
              <div class="alumno-card-header">
                <div class="alumno-card-avatar">${iniciales}</div>
                <div class="alumno-card-info">
                  <h4>${a.nombre} ${a.apellido}</h4>
                </div>
              </div>
              <div class="alumno-card-email">
                <i data-lucide="mail"></i>
                ${a.mail || 'Sin email'}
              </div>
              <div class="alumno-card-actions">
                <button class="btn-small btn-baja" onclick="darDeBajaAlumno(${idCurso}, ${a.id_alumno}, '${a.nombre} ${a.apellido}')">
                  <i data-lucide="user-minus"></i> Dar de Baja
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    lucide.createIcons();
  } catch (error) {
    console.error('Error al cargar inscritos:', error);
    container.innerHTML = '<p style="color:red;text-align:center;">Error al cargar alumnos inscritos</p>';
  }
}

// Función para cargar alumnos disponibles (no inscritos)
async function cargarAlumnosDisponibles(idCurso) {
  const container = document.getElementById('alumnosDisponiblesList');
  container.innerHTML = '<p style="text-align:center;padding:20px;">Cargando...</p>';

  try {
    const [resAlumnos, resInscritos] = await Promise.all([
      fetch(`${API_URL}/alumnos`),
      fetch(`${API_URL}/inscripciones/curso/${idCurso}`)
    ]);

    const todosAlumnos = await resAlumnos.json();
    const inscritos = await resInscritos.json();

    // Filtrar solo los NO inscritos
    const inscritosIds = inscritos.map(i => i.id_alumno);
    const disponibles = todosAlumnos.filter(a => !inscritosIds.includes(a.id_alumno));

    document.getElementById('badgeDisponibles').textContent = disponibles.length;

    if (disponibles.length === 0) {
      container.innerHTML = '<div class="empty-state"><i data-lucide="user-check"></i><p>Todos los alumnos ya están inscritos</p></div>';
      lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="alumnos-grid" id="alumnosGridDisponibles">
        ${disponibles.map(a => {
          const iniciales = `${(a.nombre || 'A')[0]}${(a.apellido || 'A')[0]}`.toUpperCase();
          return `
            <div class="alumno-card" data-alumno-id="${a.id_alumno}" data-search="${(a.nombre + ' ' + a.apellido + ' ' + (a.mail || '')).toLowerCase()}" onclick="toggleSelectAlumno(this)">
              <input type="checkbox" class="checkbox-card" value="${a.id_alumno}" onclick="event.stopPropagation(); toggleSelectAlumno(this.parentElement)">
              <div class="alumno-card-header">
                <div class="alumno-card-avatar">${iniciales}</div>
                <div class="alumno-card-info">
                  <h4>${a.nombre} ${a.apellido}</h4>
                  <span class="legajo">${a.legajo || 'Sin legajo'}</span>
                </div>
              </div>
              <div class="alumno-card-email">
                <i data-lucide="mail"></i>
                ${a.mail || 'Sin email'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    lucide.createIcons();

    // Configurar búsqueda
    document.getElementById('searchAlumnos').oninput = (e) => {
      const search = e.target.value.toLowerCase();
      document.querySelectorAll('#alumnosGridDisponibles .alumno-card').forEach(card => {
        const searchText = card.dataset.search;
        card.style.display = searchText.includes(search) ? 'block' : 'none';
      });
    };

    // Configurar botón de inscribir
    document.getElementById('btnConfirmInscribir').onclick = async () => {
      const seleccionados = Array.from(document.querySelectorAll('#alumnosGridDisponibles .alumno-card.selected'))
        .map(card => card.dataset.alumnoId);

      if (seleccionados.length === 0) {
        showToast('Selecciona al menos un alumno', 'error');
        return;
      }

      try {
        const resp = await fetch(`${API_URL}/inscripciones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_curso: idCurso, alumnos: seleccionados })
        });

        const data = await resp.json();

        if (resp.ok) {
          showToast(`${seleccionados.length} alumno(s) inscrito(s) correctamente`, 'success');
          // Recargar ambas listas
          await Promise.all([
            cargarAlumnosInscritos(idCurso),
            cargarAlumnosDisponibles(idCurso)
          ]);
          // Reiniciar contador
          updateSelectedCount();
        } else {
          showToast(data.message || 'Error al inscribir', 'error');
        }
      } catch (error) {
        console.error('Error al inscribir:', error);
        showToast('Error al inscribir alumnos', 'error');
      }
    };

  } catch (error) {
    console.error('Error al cargar disponibles:', error);
    container.innerHTML = '<p style="color:red;text-align:center;">Error al cargar alumnos disponibles</p>';
  }
}

// Función para seleccionar/deseleccionar alumno
function toggleSelectAlumno(card) {
  card.classList.toggle('selected');
  const checkbox = card.querySelector('.checkbox-card');
  if (checkbox) checkbox.checked = card.classList.contains('selected');
  updateSelectedCount();
}

// Actualizar contador de seleccionados
function updateSelectedCount() {
  const count = document.querySelectorAll('#alumnosGridDisponibles .alumno-card.selected').length;
  document.getElementById('selectedCount').textContent = `${count} alumno(s) seleccionado(s)`;
}

// Función para dar de baja un alumno
async function darDeBajaAlumno(idCurso, idAlumno, nombreAlumno) {
  if (!confirm(`¿Estás seguro de dar de baja a ${nombreAlumno}?`)) return;

  try {
    const resp = await fetch(`${API_URL}/inscripciones/${idCurso}/${idAlumno}`, {
      method: 'DELETE'
    });

    const data = await resp.json();

    if (resp.ok && data.success) {
      showToast(`${nombreAlumno} dado de baja correctamente`, 'success');
      // Obtener el ID del curso del modal
      const modal = document.getElementById('modalInscribir');
      const cursoId = modal.dataset.idCurso;
      // Recargar ambas listas
      await Promise.all([
        cargarAlumnosInscritos(cursoId),
        cargarAlumnosDisponibles(cursoId)
      ]);
    } else {
      showToast(data.message || 'Error al dar de baja', 'error');
    }
  } catch (error) {
    console.error('Error al dar de baja:', error);
    showToast('Error al dar de baja al alumno', 'error');
  }
}

// Función para mostrar toast
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ----------------------------
// Panel lateral: detalle de curso
// ----------------------------
function ensureCursoPanel() {
  if (document.getElementById('cursoPanelOverlay')) return;

  const panelHtml = `
    <div id="cursoPanelOverlay" class="curso-panel-overlay"></div>
    <div id="cursoPanel" class="curso-panel">
      <div class="curso-panel-header">
        <h2 id="cursoPanelTitle">Detalle del Curso</h2>
        <button class="close-panel" aria-label="Cerrar">×</button>
      </div>
      
      <div class="curso-panel-content">
        <div class="panel-section">
          <h3><i data-lucide="info"></i> Información del Curso</h3>
          <div class="curso-stats-grid" id="cursoStats"></div>
        </div>
        
        <div class="panel-section">
          <h3><i data-lucide="users"></i> Alumnos Inscritos</h3>
          <div id="alumnosInscritos" class="alumnos-inscritos-list"></div>
        </div>
      </div>
      
      <div class="panel-actions">
        <button class="panel-btn primary" id="btnInscribirPanel">
          <i data-lucide="user-plus"></i> Inscribir Alumnos
        </button>
        <button class="panel-btn secondary" id="btnEditarCurso">
          <i data-lucide="edit"></i> Editar
        </button>
        <button class="panel-btn danger" id="btnEliminarCurso">
          <i data-lucide="trash-2"></i> Eliminar
        </button>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', panelHtml);

  const panel = document.getElementById('cursoPanel');
  const overlay = document.getElementById('cursoPanelOverlay');

  // Cerrar panel
  const closePanel = () => {
    panel.classList.remove('active');
    overlay.classList.remove('active');
  };

  panel.querySelector('.close-panel').addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
}

async function openCursoPanel(idCurso) {
  ensureCursoPanel();
  
  const panel = document.getElementById('cursoPanel');
  const overlay = document.getElementById('cursoPanelOverlay');
  
  panel.classList.add('active');
  overlay.classList.add('active');

  // Cargar datos del curso
  try {
    const [resCurso, resInscritos] = await Promise.all([
      fetch(`${API_URL}/cursos/${idCurso}`),
      fetch(`${API_URL}/inscripciones/curso/${idCurso}`)
    ]);

    const curso = await resCurso.json();
    const inscritos = await resInscritos.json();

    // Actualizar título
    document.getElementById('cursoPanelTitle').textContent = curso.nombre_curso || 'Detalle del Curso';

    // Información del curso (datos reales)
    const cuposMax = curso.cupo_maximo || 30;
    const cuposDisponibles = cuposMax - inscritos.length;

    document.getElementById('cursoStats').innerHTML = `
      <div class="stat-card info">
        <div class="stat-label">Idioma</div>
        <div class="stat-value" style="font-size: 20px;">${curso.nombre_idioma || 'N/A'}</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">Nivel</div>
        <div class="stat-value" style="font-size: 20px;">${curso.nivel || 'N/A'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Profesor</div>
        <div class="stat-value" style="font-size: 16px;">${curso.profesor || 'Sin asignar'}</div>
      </div>
      <div class="stat-card info">
        <div class="stat-label">Horario</div>
        <div class="stat-value" style="font-size: 16px;">${curso.horario || 'Por definir'}</div>
      </div>
      <div class="stat-card ${cuposDisponibles <= 5 ? 'warning' : 'success'}">
        <div class="stat-label">Aula</div>
        <div class="stat-value" style="font-size: 18px;">${curso.nombre_aula || 'Sin asignar'}</div>
      </div>
      <div class="stat-card info">
        <div class="stat-label">Cupos</div>
        <div class="stat-value">${inscritos.length} / ${cuposMax}</div>
      </div>
    `;

    // Lista de alumnos inscritos
    if (inscritos.length === 0) {
      document.getElementById('alumnosInscritos').innerHTML = `
        <div class="empty-state">
          <i data-lucide="users"></i>
          <p>No hay alumnos inscritos en este curso</p>
        </div>`;
    } else {
      document.getElementById('alumnosInscritos').innerHTML = inscritos.map(a => {
        const iniciales = `${(a.nombre || 'A')[0]}${(a.apellido || 'A')[0]}`.toUpperCase();
        return `
          <div class="alumno-item">
            <div class="alumno-avatar">${iniciales}</div>
            <div class="alumno-info">
              <div class="alumno-nombre">${a.nombre} ${a.apellido}</div>
              <div class="alumno-email">${a.mail || 'Sin email'}</div>
            </div>
          </div>`;
      }).join('');
    }

    // Reinicializar iconos
    lucide.createIcons();

    // Botón inscribir desde el panel
    document.getElementById('btnInscribirPanel').onclick = () => {
      panel.classList.remove('active');
      overlay.classList.remove('active');
      openInscribirModal(idCurso, curso.nombre_curso);
    };

    // Botón editar (placeholder por ahora)
    document.getElementById('btnEditarCurso').onclick = () => {
      panel.classList.remove('active');
      overlay.classList.remove('active');
      openEditarCursoModal(curso);
    };

    // Botón eliminar (placeholder por ahora)
    document.getElementById('btnEliminarCurso').onclick = () => {
      if (confirm(`¿Estás seguro de eliminar el curso "${curso.nombre_curso}"?`)) {
        alert('Funcionalidad de eliminar curso próximamente');
      }
    };

  } catch (err) {
    console.error('Error al cargar detalles del curso:', err);
    document.getElementById('cursoStats').innerHTML = '<p>Error al cargar estadísticas</p>';
    document.getElementById('alumnosInscritos').innerHTML = '<p>Error al cargar alumnos</p>';
  }
}

// ----------------------------
// Modal: editar curso
// ----------------------------
function ensureEditarCursoModal() {
  if (document.getElementById('modalEditarCurso')) return;

  const modalHtml = `
    <div id="modalEditarCurso" class="modal">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3>Editar Curso</h3>
          <button type="button" class="close-modal" aria-label="Cerrar">&times;</button>
        </div>
        <form id="formEditarCurso" style="padding: 24px;">
          <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
            <div>
              <label for="editNombreCurso">Nombre del Curso:</label>
              <input type="text" id="editNombreCurso" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <label for="editIdioma">Idioma:</label>
                <select id="editIdioma" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="">Seleccione...</option>
                </select>
              </div>
              
              <div>
                <label for="editNivel">Nivel:</label>
                <select id="editNivel" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="">Seleccione...</option>
                </select>
              </div>
            </div>
            
            <div>
              <label for="editProfesor">Profesor:</label>
              <select id="editProfesor" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">Seleccione...</option>
              </select>
            </div>
            
            <div>
              <label for="editHorario">Horario:</label>
              <input type="text" id="editHorario" placeholder="Ej: Lunes y Miércoles 18:00-20:00" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <label for="editAula">Aula:</label>
                <select id="editAula" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="">Sin aula</option>
                </select>
              </div>
              
              <div>
                <label for="editCupo">Cupo Máximo:</label>
                <input type="number" id="editCupo" min="1" max="100" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            </div>
          </div>
          
          <div class="form-actions" style="margin-top: 24px;">
            <button type="button" class="close-modal">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('modalEditarCurso');
  modal.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => modal.classList.remove('active')));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
}

async function openEditarCursoModal(curso) {
  ensureEditarCursoModal();
  const modal = document.getElementById('modalEditarCurso');

  try {
    // Obtener datos completos del curso
    const resCursoCompleto = await fetch(`${API_URL}/cursos/${curso.id_curso}`);
    const cursoCompleto = await resCursoCompleto.json();

    // Cargar opciones para los selects
    const [resIdiomas, resProfesores] = await Promise.all([
      fetch(`${API_URL}/idiomas`),
      fetch(`${API_URL}/profesores`)
    ]);

    const idiomas = await resIdiomas.json();
    const profesores = await resProfesores.json();

    // Llenar select de idiomas
    document.getElementById('editIdioma').innerHTML = `
      <option value="">Seleccione...</option>
      ${idiomas.map(i => `<option value="${i.id_idioma}" ${i.id_idioma === cursoCompleto.id_idioma ? 'selected' : ''}>${i.nombre_idioma}</option>`).join('')}
    `;

    // Llenar select de niveles
    document.getElementById('editNivel').innerHTML = `
      <option value="">Seleccione...</option>
      <option value="1" ${cursoCompleto.id_nivel === 1 ? 'selected' : ''}>A1</option>
      <option value="2" ${cursoCompleto.id_nivel === 2 ? 'selected' : ''}>A2</option>
      <option value="3" ${cursoCompleto.id_nivel === 3 ? 'selected' : ''}>B1</option>
      <option value="4" ${cursoCompleto.id_nivel === 4 ? 'selected' : ''}>B2</option>
      <option value="5" ${cursoCompleto.id_nivel === 5 ? 'selected' : ''}>C1</option>
      <option value="6" ${cursoCompleto.id_nivel === 6 ? 'selected' : ''}>C2</option>
    `;

    // Llenar select de profesores
    document.getElementById('editProfesor').innerHTML = `
      <option value="">Seleccione...</option>
      ${profesores.map(p => `<option value="${p.id_profesor}" ${p.id_profesor === cursoCompleto.id_profesor ? 'selected' : ''}>${p.nombre_completo}</option>`).join('')}
    `;

    // Llenar select de aulas
    document.getElementById('editAula').innerHTML = `
      <option value="">Sin aula</option>
      <option value="1" ${cursoCompleto.id_aula === 1 ? 'selected' : ''}>Aula 101</option>
      <option value="2" ${cursoCompleto.id_aula === 2 ? 'selected' : ''}>Aula 102</option>
    `;

    // Llenar el formulario con los datos actuales
    document.getElementById('editNombreCurso').value = cursoCompleto.nombre_curso || '';
    document.getElementById('editHorario').value = cursoCompleto.horario || '';
    document.getElementById('editCupo').value = cursoCompleto.cupo_maximo || 30;

    modal.classList.add('active');

    // Manejar submit del formulario
    document.getElementById('formEditarCurso').onsubmit = async (e) => {
      e.preventDefault();

      const datosActualizados = {
        nombre_curso: document.getElementById('editNombreCurso').value,
        horario: document.getElementById('editHorario').value,
        cupo_maximo: parseInt(document.getElementById('editCupo').value),
        id_aula: document.getElementById('editAula').value || null,
        id_idioma: parseInt(document.getElementById('editIdioma').value),
        id_nivel: parseInt(document.getElementById('editNivel').value),
        id_profesor: parseInt(document.getElementById('editProfesor').value)
      };

      try {
        const resp = await fetch(`${API_URL}/cursos/${curso.id_curso}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosActualizados)
        });

        const data = await resp.json();

        if (resp.ok && data.success) {
          alert('Curso actualizado correctamente');
          modal.classList.remove('active');
          // Recargar la sección de cursos
          document.getElementById('btnCursos').click();
        } else {
          alert(data.message || 'Error al actualizar el curso');
        }
      } catch (error) {
        console.error('Error al actualizar curso:', error);
        alert('Error al actualizar el curso');
      }
    };

  } catch (error) {
    console.error('Error al cargar datos para editar:', error);
    alert('Error al cargar los datos del curso');
  }
}


// =====================================================
// 2️⃣ DASHBOARD ADMIN
// =====================================================
async function initAdminDashboard() {
  console.log("👑 Dashboard ADMIN cargado");
  // El dashboard admin ya está implementado en dashboard_admin.html
  // Esta función es solo para evitar el error de referencia
}


// =====================================================
// 3️⃣ DASHBOARD PROFESOR
// =====================================================
async function initProfesorDashboard() {
  console.log("🧑‍🏫 Dashboard PROFESOR cargado");

  const loader = document.getElementById("loader");
  const mainContent = document.getElementById("mainContent");
  const botones = document.querySelectorAll(".sidebar-menu button");

  // Mostrar saludo con nombre (temporal)
  const nombreProfesor = localStorage.getItem("nombre") || "Profesor";
  const idProfesor = localStorage.getItem("id_profesor");
  document.getElementById("welcomeMessage").textContent = `Bienvenido, ${nombreProfesor} 👋`;

  // Secciones SPA dinámicas
  const sections = {
    btnCursos: async () => {
      loader.classList.remove("hidden");
      try {
        const res = await fetch(`${API_URL}/cursos?id_profesor=${idProfesor}`);
        const data = await res.json();
        loader.classList.add("hidden");

        if (!data.length) {
          mainContent.innerHTML = `<p>No tienes cursos asignados actualmente.</p>`;
          return;
        }

        mainContent.innerHTML = `
          <h2>Mis Cursos</h2>
          <table>
            <tr>
              <th>ID</th>
              <th>Curso</th>
              <th>Idioma</th>
              <th>Nivel</th>
            </tr>
            ${data.map(c => `
              <tr>
                <td>${c.id_curso}</td>
                <td>${c.nombre_curso}</td>
                <td>${c.nombre_idioma || "-"}</td>
                <td>${c.nivel || "-"}</td>
              </tr>`).join("")}
          </table>`;
      } catch (error) {
        loader.classList.add("hidden");
        mainContent.innerHTML = `<p>Error al cargar los cursos.</p>`;
        console.error(error);
      }
    },

    btnCalificaciones: async () => {
      loader.classList.remove("hidden");
      mainContent.classList.remove("active");
      try {
        const resCursos = await fetch(`${API_URL}/cursos?id_profesor=${idProfesor}`);
        const cursos = await resCursos.json();
        
        mainContent.innerHTML = `
          <h2>Calificaciones</h2>
          <div class="calificaciones-container">
            <div class="actions-header">
              <div class="curso-selector">
                <label for="selectCurso">Seleccionar Curso:</label>
                <select id="selectCurso">
                  <option value="">Seleccione un curso...</option>
                  ${cursos.map(c => `
                    <option value="${c.id_curso}">${c.nombre_curso} - ${c.nombre_idioma} (${c.nivel || '-'})</option>
                  `).join('')}
                </select>
              </div>
            </div>
            
            <div id="tablaCalificaciones" class="calificaciones-table">
              <table>
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Parcial 1</th>
                    <th>Parcial 2</th>
                    <th>Final</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="calificacionesBody">
                  <tr>
                    <td colspan="5">Seleccione un curso para ver las calificaciones</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;

        // Evento para cambio de curso en la tabla principal
        document.getElementById('selectCurso').addEventListener('change', async (e) => {
          const cursoId = e.target.value;
          if (!cursoId) {
            document.getElementById('calificacionesBody').innerHTML = `
              <tr><td colspan="5">Seleccione un curso para ver las calificaciones</td></tr>
            `;
            return;
          }

          try {
            const res = await fetch(`${API_URL}/calificaciones/curso/${cursoId}`);
            const alumnos = await res.json();
            
            document.getElementById('calificacionesBody').innerHTML = alumnos.map(alumno => `
              <tr data-alumno-id="${alumno.id_alumno}">
                <td>${alumno.nombre} ${alumno.apellido}</td>
                <td>${alumno.parcial1 || '-'}</td>
                <td>${alumno.parcial2 || '-'}</td>
                <td>${alumno.final || '-'}</td>
                <td>
                  <button class="btn-primary">
                    Editar
                  </button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="5">No hay alumnos inscritos en este curso</td></tr>';

          } catch (error) {
            console.error('Error al cargar alumnos:', error);
            document.getElementById('calificacionesBody').innerHTML = `
              <tr><td colspan="5">Error al cargar los alumnos</td></tr>
            `;
          }
        });

      } catch (error) {
        console.error('Error:', error);
        mainContent.innerHTML = `
          <h2>Calificaciones</h2>
          <p class="error">Error al cargar las calificaciones. Por favor, intente nuevamente.</p>
        `;
      }
      
      loader.classList.add("hidden");
      setTimeout(() => mainContent.classList.add("active"), 100);
    },

    btnAsistencias: async () => {
      mainContent.innerHTML = `
        <h2>Asistencias</h2>
        <p>En desarrollo...</p>`;
    },

    btnMensajes: async () => {
      mainContent.innerHTML = `
        <h2>Mensajes</h2>
        <div class="message-list">
          <div class="message-item">
            <i data-lucide="mail"></i>
            <div><h3>Coordinación Académica</h3><p>Reunión el jueves a las 14hs</p></div>
          </div>
          <div class="message-item">
            <i data-lucide="mail"></i>
            <div><h3>Administración</h3><p>Por favor enviar lista de asistencia</p></div>
          </div>
        </div>`;
      lucide.createIcons();
    }
  };

  // Control SPA de botones con transición y loader
  botones.forEach(btn => {
    btn.addEventListener("click", async () => {
      botones.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      mainContent.classList.remove("active");
      loader.classList.remove("hidden");

      setTimeout(async () => {
        await sections[btn.id]?.();
        loader.classList.add("hidden");
        mainContent.classList.add("active");
      }, 300);
    });
  });

  // Cargar sección por defecto (Mis Cursos)
  document.getElementById("btnCursos").click();
}

// =====================================================
// 4️⃣ DASHBOARD ALUMNO
// =====================================================
async function initAlumnoDashboard() {
  console.log("🎓 Dashboard ALUMNO cargado");
  document.getElementById("btnMisInscripciones")?.addEventListener("click", verMisInscripciones);
  document.getElementById("btnMisPagos")?.addEventListener("click", verMisPagos);
}

async function verMisInscripciones() {
  const table = document.getElementById("tablaMisInscripciones");
  table.innerHTML = "<tr><td>Cargando inscripciones...</td></tr>";
  try {
    const res = await fetch(`${API_URL}/inscripciones`);
    const data = await res.json();
    table.innerHTML = `
      <tr><th>ID</th><th>Curso</th><th>Fecha</th><th>Estado</th></tr>
      ${data.map(i => `
        <tr>
          <td>${i.id_inscripcion}</td>
          <td>${i.id_curso}</td>
          <td>${i.fecha_inscripcion}</td>
          <td>${i.estado}</td>
        </tr>`).join("")}
    `;
  } catch (err) {
    console.error("Error al obtener inscripciones:", err);
    table.innerHTML = "<tr><td>Error al cargar inscripciones</td></tr>";
  }
}

async function verMisPagos() {
  const table = document.getElementById("tablaMisPagos");
  table.innerHTML = "<tr><td>Cargando pagos...</td></tr>";
  try {
    const res = await fetch(`${API_URL}/pagos`);
    const data = await res.json();
    const nombreAlumno = localStorage.getItem("nombre");
    const propios = data.filter(p => p.alumno?.includes(nombreAlumno));
    table.innerHTML = `
      <tr><th>ID</th><th>Concepto</th><th>Monto</th><th>Fecha</th><th>Medio</th></tr>
      ${propios.map(p => `
        <tr>
          <td>${p.id_pago}</td>
          <td>${p.concepto}</td>
          <td>${p.monto}</td>
          <td>${p.fecha_pago}</td>
          <td>${p.medio_pago}</td>
        </tr>`).join("")}
    `;
  } catch (err) {
    console.error("Error al obtener pagos del alumno:", err);
    table.innerHTML = "<tr><td>Error al cargar pagos</td></tr>";
  }
}

// =====================================================
// 5️⃣ PANEL DE ALUMNO
// =====================================================
function ensureAlumnoPanel() {
  if (document.getElementById('alumnoPanel')) return;

  const panelHtml = `
    <div id="alumnoPanelOverlay" class="curso-panel-overlay"></div>
    <div id="alumnoPanel" class="alumno-panel">
      <div class="alumno-panel-header">
        <button class="close-panel" aria-label="Cerrar">×</button>
        <div class="alumno-panel-header-content">
          <div class="alumno-panel-avatar" id="panelAlumnoAvatar">AA</div>
          <div class="alumno-panel-info">
            <h2 id="panelAlumnoNombre">Cargando...</h2>
            <div class="legajo-info">
              <span id="panelAlumnoLegajo"></span> • 
              <span id="panelAlumnoEstado" class="alumno-estado-badge activo">Activo</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="alumno-panel-content" id="panelAlumnoContent">
        <div style="text-align: center; padding: 40px; color: #999;">
          <i data-lucide="loader" style="width: 32px; height: 32px; animation: spin 1s linear infinite;"></i>
          <p>Cargando información...</p>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', panelHtml);
  
  // Configurar cierre
  const panel = document.getElementById('alumnoPanel');
  const overlay = document.getElementById('alumnoPanelOverlay');
  
  const closePanel = () => {
    panel.classList.remove('active');
    overlay.classList.remove('active');
  };

  panel.querySelector('.close-panel').addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
  
  // Cerrar al hacer click fuera del panel
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('active') && !panel.contains(e.target) && !e.target.closest('.alumno-card')) {
      closePanel();
    }
  });
  
  // Cerrar al quitar el mouse del panel
  let mouseLeaveTimeout;
  panel.addEventListener('mouseleave', () => {
    mouseLeaveTimeout = setTimeout(() => {
      closePanel();
    }, 500);
  });
  
  panel.addEventListener('mouseenter', () => {
    clearTimeout(mouseLeaveTimeout);
  });
}

async function openAlumnoPanel(idAlumno) {
  ensureAlumnoPanel();
  const panel = document.getElementById('alumnoPanel');
  const overlay = document.getElementById('alumnoPanelOverlay');
  
  panel.classList.add('active');
  overlay.classList.add('active');

  try {
    // Obtener datos del alumno con estadísticas
    const resAlumno = await fetch(`${API_URL}/alumnos/${idAlumno}`);
    const alumno = await resAlumno.json();

    // Actualizar encabezado
    const iniciales = `${alumno.nombre.charAt(0)}${alumno.apellido.charAt(0)}`.toUpperCase();
    document.getElementById('panelAlumnoAvatar').textContent = iniciales;
    document.getElementById('panelAlumnoNombre').textContent = `${alumno.nombre} ${alumno.apellido}`;
    document.getElementById('panelAlumnoLegajo').textContent = `Legajo: ${alumno.legajo}`;
    
    const estadoBadge = document.getElementById('panelAlumnoEstado');
    estadoBadge.textContent = (alumno.estado || 'activo').charAt(0).toUpperCase() + (alumno.estado || 'activo').slice(1);
    estadoBadge.className = `alumno-estado-badge ${alumno.estado || 'activo'}`;

    // Construir contenido del panel
    const content = document.getElementById('panelAlumnoContent');
    content.innerHTML = `
      <!-- Información Personal -->
      <div class="info-section">
        <h3><i data-lucide="user"></i> Información Personal</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-item-label">Email</div>
            <div class="info-item-value">${alumno.mail}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">Teléfono</div>
            <div class="info-item-value">${alumno.telefono || 'No registrado'}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">Fecha de Registro</div>
            <div class="info-item-value">${alumno.fecha_registro ? new Date(alumno.fecha_registro).toLocaleDateString('es-AR') : 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">Estado</div>
            <div class="info-item-value">
              <span class="alumno-estado-badge ${alumno.estado || 'activo'}">${(alumno.estado || 'activo').charAt(0).toUpperCase() + (alumno.estado || 'activo').slice(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas Académicas -->
      <div class="info-section">
        <h3><i data-lucide="bar-chart-2"></i> Estadísticas Académicas</h3>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-number">${alumno.cursos_activos || 0}</div>
            <div class="stat-label">Cursos Activos</div>
          </div>
          <div class="stat-box success">
            <div class="stat-number">${alumno.promedio_general || '0.0'}</div>
            <div class="stat-label">Promedio General</div>
            <div class="progress-bar">
              <div class="progress-bar-fill ${alumno.promedio_general >= 7 ? 'success' : alumno.promedio_general >= 4 ? 'warning' : 'danger'}" 
                   style="width: ${Math.min((alumno.promedio_general / 10) * 100, 100)}%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cursos Inscritos -->
      <div class="info-section">
        <h3><i data-lucide="book-open"></i> Cursos Inscritos (${alumno.cursos?.length || 0})</h3>
        ${alumno.cursos && alumno.cursos.length > 0 ? `
          <div class="cursos-list">
            ${alumno.cursos.map(c => `
              <div class="curso-item">
                <div class="curso-item-info">
                  <h4>${c.nombre_curso}</h4>
                  <p>${c.nombre_idioma} - ${c.nivel} ${c.horario ? `• ${c.horario}` : ''}</p>
                </div>
                <div class="curso-item-calificacion">
                  ${c.promedio !== null ? `
                    <div class="promedio">${parseFloat(c.promedio).toFixed(1)}</div>
                    <div class="label">Promedio</div>
                  ` : '<div class="label" style="font-size: 13px; color: #999;">Sin calificaciones</div>'}
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p style="color: #999; text-align: center; padding: 20px;">No está inscrito en ningún curso actualmente</p>'}
      </div>

      <!-- Resumen de Pagos -->
      <div class="info-section">
        <h3><i data-lucide="dollar-sign"></i> Resumen de Pagos</h3>
        <div class="pagos-summary">
          <h4>Total Pagado</h4>
          <div class="pagos-total">$${alumno.total_pagado ? parseFloat(alumno.total_pagado).toLocaleString('es-AR', {minimumFractionDigits: 2}) : '0.00'}</div>
          ${alumno.ultimo_pago ? `<div class="pagos-ultimo">Último pago: ${new Date(alumno.ultimo_pago).toLocaleDateString('es-AR')}</div>` : '<div class="pagos-ultimo">Sin pagos registrados</div>'}
        </div>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-number">${alumno.total_pagos || 0}</div>
            <div class="stat-label">Pagos Realizados</div>
          </div>
          <div class="stat-box warning">
            <div class="stat-number">$${alumno.promedio_pago ? parseFloat(alumno.promedio_pago).toLocaleString('es-AR', {minimumFractionDigits: 0}) : '0'}</div>
            <div class="stat-label">Promedio por Pago</div>
          </div>
        </div>
      </div>
    `;

    // Reinicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (err) {
    console.error('Error al cargar panel de alumno:', err);
    document.getElementById('panelAlumnoContent').innerHTML = `
      <div style="text-align: center; padding: 40px; color: #f44336;">
        <i data-lucide="alert-circle" style="width: 32px; height: 32px;"></i>
        <p>Error al cargar la información del alumno</p>
      </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

// Filtros y búsqueda para alumnos
function setupAlumnoFilters() {
  const searchInput = document.getElementById('alumnosSearch');
  const estadoFilter = document.getElementById('alumnosEstadoFilter');

  if (searchInput) {
    searchInput.addEventListener('input', filterAlumnos);
  }
  
  if (estadoFilter) {
    estadoFilter.addEventListener('change', filterAlumnos);
  }
}

function filterAlumnos() {
  const searchTerm = document.getElementById('alumnosSearch')?.value.toLowerCase() || '';
  const estadoFilter = document.getElementById('alumnosEstadoFilter')?.value || '';
  
  const cards = document.querySelectorAll('.alumno-card');
  
  cards.forEach(card => {
    const cardText = card.textContent.toLowerCase();
    const cardEstado = card.querySelector('.alumno-estado-badge')?.textContent.toLowerCase() || '';
    
    const matchesSearch = cardText.includes(searchTerm);
    const matchesEstado = !estadoFilter || cardEstado.includes(estadoFilter);
    
    if (matchesSearch && matchesEstado) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

// =====================================================
// 6️⃣ PANEL DE PROFESOR
// =====================================================
function ensureProfesorPanel() {
  if (document.getElementById('profesorPanel')) return;

  const panelHtml = `
    <div id="profesorPanelOverlay" class="curso-panel-overlay"></div>
    <div id="profesorPanel" class="profesor-panel">
      <div class="profesor-panel-header">
        <button class="close-panel" aria-label="Cerrar">×</button>
        <div class="profesor-panel-header-content">
          <div class="profesor-panel-avatar" id="panelProfesorAvatar">PP</div>
          <div class="profesor-panel-info">
            <h2 id="panelProfesorNombre">Cargando...</h2>
            <div class="especialidad-info">
              <i data-lucide="award"></i>
              <span id="panelProfesorEspecialidad"></span> • 
              <span id="panelProfesorEstado" class="profesor-estado-badge activo">Activo</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="profesor-panel-content" id="panelProfesorContent">
        <div style="text-align: center; padding: 40px; color: #999;">
          <i data-lucide="loader" style="width: 32px; height: 32px; animation: spin 1s linear infinite;"></i>
          <p>Cargando información...</p>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', panelHtml);
  
  // Configurar cierre
  const panel = document.getElementById('profesorPanel');
  const overlay = document.getElementById('profesorPanelOverlay');
  
  const closePanel = () => {
    panel.classList.remove('active');
    overlay.classList.remove('active');
  };

  panel.querySelector('.close-panel').addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
  
  // Cerrar al hacer click fuera del panel
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('active') && !panel.contains(e.target) && !e.target.closest('.profesor-card')) {
      closePanel();
    }
  });
  
  // Cerrar al quitar el mouse del panel
  let mouseLeaveTimeout;
  panel.addEventListener('mouseleave', () => {
    mouseLeaveTimeout = setTimeout(() => {
      closePanel();
    }, 500);
  });
  
  panel.addEventListener('mouseenter', () => {
    clearTimeout(mouseLeaveTimeout);
  });
}

async function openProfesorPanel(idProfesor) {
  ensureProfesorPanel();
  const panel = document.getElementById('profesorPanel');
  const overlay = document.getElementById('profesorPanelOverlay');
  
  panel.classList.add('active');
  overlay.classList.add('active');

  try {
    const resProfesor = await fetch(`${API_URL}/profesores/${idProfesor}`);
    const profesor = await resProfesor.json();

    // Actualizar encabezado
    const iniciales = `${profesor.nombre.charAt(0)}${profesor.apellido.charAt(0)}`.toUpperCase();
    document.getElementById('panelProfesorAvatar').textContent = iniciales;
    document.getElementById('panelProfesorNombre').textContent = `${profesor.nombre} ${profesor.apellido}`;
    document.getElementById('panelProfesorEspecialidad').textContent = profesor.especialidad || 'Sin especialidad';
    
    const estadoBadge = document.getElementById('panelProfesorEstado');
    estadoBadge.textContent = (profesor.estado || 'activo').charAt(0).toUpperCase() + (profesor.estado || 'activo').slice(1);
    estadoBadge.className = `profesor-estado-badge ${profesor.estado || 'activo'}`;

    // Calcular carga horaria
    const horasPorCurso = 3; // Estimación promedio
    const horasTotales = profesor.total_cursos * horasPorCurso;
    const horasMaximas = 40;
    const porcentajeCarga = (horasTotales / horasMaximas) * 100;
    let claseCarga = 'baja';
    if (porcentajeCarga >= 80) claseCarga = 'alta';
    else if (porcentajeCarga >= 50) claseCarga = 'media';

    // Construir contenido del panel
    const content = document.getElementById('panelProfesorContent');
    content.innerHTML = `
      <!-- Información Personal -->
      <div class="info-section">
        <h3><i data-lucide="user"></i> Información Personal</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-item-label">Email</div>
            <div class="info-item-value">${profesor.mail}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">Teléfono</div>
            <div class="info-item-value">${profesor.telefono || 'No registrado'}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">Fecha de Ingreso</div>
            <div class="info-item-value">${profesor.fecha_ingreso ? new Date(profesor.fecha_ingreso).toLocaleDateString('es-AR') : 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-item-label">Antigüedad</div>
            <div class="info-item-value">${profesor.antiguedad_anos} ${profesor.antiguedad_anos === 1 ? 'año' : 'años'}</div>
          </div>
        </div>
      </div>

      <!-- Carga Horaria -->
      <div class="info-section">
        <h3><i data-lucide="clock"></i> Carga Horaria</h3>
        <div class="carga-horaria-chart">
          <div class="carga-bar-container">
            <div class="carga-bar-label">Horas semanales</div>
            <div class="carga-bar-track">
              <div class="carga-bar-fill ${claseCarga}" style="width: ${Math.min(porcentajeCarga, 100)}%">
                ${horasTotales}h / ${horasMaximas}h
              </div>
            </div>
          </div>
          <div class="carga-bar-container">
            <div class="carga-bar-label">Cursos activos</div>
            <div class="carga-bar-track">
              <div class="carga-bar-fill" style="width: ${Math.min((profesor.total_cursos / 10) * 100, 100)}%">
                ${profesor.total_cursos} cursos
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas de Alumnos -->
      <div class="info-section">
        <h3><i data-lucide="users"></i> Estadísticas de Alumnos</h3>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-number">${profesor.total_alumnos || 0}</div>
            <div class="stat-label">Alumnos Activos</div>
          </div>
          <div class="stat-box success">
            <div class="stat-number">${profesor.promedio_general || 'N/A'}</div>
            <div class="stat-label">Promedio General</div>
            ${profesor.promedio_general ? `
            <div class="progress-bar">
              <div class="progress-bar-fill ${profesor.promedio_general >= 7 ? 'success' : profesor.promedio_general >= 4 ? 'warning' : 'danger'}" 
                   style="width: ${Math.min((profesor.promedio_general / 10) * 100, 100)}%"></div>
            </div>` : ''}
          </div>
          <div class="stat-box">
            <div class="stat-number">${profesor.total_cursos || 0}</div>
            <div class="stat-label">Cursos Dictando</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${profesor.idiomas?.length || 0}</div>
            <div class="stat-label">Idiomas</div>
          </div>
        </div>
      </div>

      <!-- Cursos que Dicta -->
      <div class="info-section">
        <h3><i data-lucide="book-open"></i> Cursos que Dicta (${profesor.cursos?.length || 0})</h3>
        ${profesor.cursos && profesor.cursos.length > 0 ? `
          <div class="profesor-cursos-list">
            ${profesor.cursos.map(c => `
              <div class="profesor-curso-item">
                <div class="profesor-curso-info">
                  <h4>${c.nombre_curso}</h4>
                  <p>${c.nombre_idioma} - ${c.nivel || 'Sin nivel'} ${c.horario ? `• ${c.horario}` : ''} ${c.nombre_aula ? `• ${c.nombre_aula}` : ''}</p>
                </div>
                <div class="profesor-curso-stats">
                  <div class="numero">${c.total_alumnos || 0}</div>
                  <div class="label">Alumnos</div>
                  ${c.promedio_curso ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">Prom: ${parseFloat(c.promedio_curso).toFixed(1)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p style="color: #999; text-align: center; padding: 20px;">No está dictando cursos actualmente</p>'}
      </div>

      <!-- Idiomas que Enseña -->
      <div class="info-section">
        <h3><i data-lucide="languages"></i> Idiomas que Enseña</h3>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${profesor.idiomas && profesor.idiomas.length > 0 ? 
            profesor.idiomas.map(idioma => `
              <span style="background: #e3f2fd; color: #1976d2; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                ${idioma}
              </span>
            `).join('') :
            '<p style="color: #999;">Sin idiomas asignados</p>'
          }
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="panel-actions">
        <button class="btn-danger" onclick="darDeBajaProfesor(${idProfesor}, '${profesor.nombre} ${profesor.apellido}')">
          <i data-lucide="user-x"></i>
          Dar de Baja
        </button>
      </div>
    `;

    // Reinicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (err) {
    console.error('Error al cargar panel de profesor:', err);
    document.getElementById('panelProfesorContent').innerHTML = `
      <div style="text-align: center; padding: 40px; color: #f44336;">
        <i data-lucide="alert-circle" style="width: 32px; height: 32px;"></i>
        <p>Error al cargar la información del profesor</p>
      </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

// Filtros y búsqueda para profesores
function setupProfesorFilters() {
  const searchInput = document.getElementById('profesoresSearch');
  const estadoFilter = document.getElementById('profesoresEstadoFilter');
  const idiomaFilter = document.getElementById('profesoresIdiomaFilter');

  // Poblar filtro de idiomas
  const cards = document.querySelectorAll('.profesor-card');
  const idiomasSet = new Set();
  cards.forEach(card => {
    const idiomas = card.getAttribute('data-idioma');
    if (idiomas && idiomas !== 'Sin idiomas') {
      idiomas.split(', ').forEach(i => idiomasSet.add(i.trim()));
    }
  });
  
  idiomaFilter.innerHTML = '<option value="">Todos los idiomas</option>' +
    Array.from(idiomasSet).sort().map(i => `<option value="${i}">${i}</option>`).join('');

  if (searchInput) {
    searchInput.addEventListener('input', filterProfesores);
  }
  
  if (estadoFilter) {
    estadoFilter.addEventListener('change', filterProfesores);
  }

  if (idiomaFilter) {
    idiomaFilter.addEventListener('change', filterProfesores);
  }
}

function filterProfesores() {
  const searchTerm = document.getElementById('profesoresSearch')?.value.toLowerCase() || '';
  const estadoFilter = document.getElementById('profesoresEstadoFilter')?.value || '';
  const idiomaFilter = document.getElementById('profesoresIdiomaFilter')?.value || '';
  
  const cards = document.querySelectorAll('.profesor-card');
  
  cards.forEach(card => {
    const cardText = card.textContent.toLowerCase();
    const cardEstado = card.querySelector('.profesor-estado-badge')?.textContent.toLowerCase() || '';
    const cardIdiomas = card.getAttribute('data-idioma') || '';
    
    const matchesSearch = cardText.includes(searchTerm);
    const matchesEstado = !estadoFilter || cardEstado.includes(estadoFilter);
    const matchesIdioma = !idiomaFilter || cardIdiomas.includes(idiomaFilter);
    
    if (matchesSearch && matchesEstado && matchesIdioma) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

// =====================================================
// 7️⃣ FUNCIONES ADMINISTRATIVAS DE PROFESORES
// =====================================================

// Modal para editar profesor
function ensureEditarProfesorModal() {
  // Eliminar modal existente si existe
  const existingModal = document.getElementById('modalEditarProfesor');
  if (existingModal) {
    console.log('🔴 Removiendo modal viejo de profesor');
    existingModal.remove();
  }

  console.log('🟢 Creando nuevo modal de profesor con botón de credenciales');

  const modalHtml = `
    <div id="modalEditarProfesor" class="modal" style="z-index: 3000;">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>Editar Profesor</h2>
          <button class="close-modal">&times;</button>
        </div>
        
        <div style="padding: 24px;">
          <form id="formEditarProfesor">
            <input type="hidden" id="editProfesorId">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label for="editProfesorNombre">Nombre:</label>
                <input type="text" id="editProfesorNombre" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              
              <div>
                <label for="editProfesorApellido">Apellido:</label>
                <input type="text" id="editProfesorApellido" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            </div>
            
            <div style="margin-bottom: 16px;">
              <label for="editProfesorMail">Email:</label>
              <input type="email" id="editProfesorMail" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="margin-bottom: 16px;">
              <label for="editProfesorEspecialidad">Especialidad:</label>
              <input type="text" id="editProfesorEspecialidad" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <label for="editProfesorTelefono">Teléfono:</label>
                <input type="text" id="editProfesorTelefono" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              
              <div>
                <label for="editProfesorEstado">Estado:</label>
                <select id="editProfesorEstado" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="licencia">En Licencia</option>
                </select>
              </div>
            </div>
            
            <div class="form-actions" style="margin-top: 24px; display: flex; gap: 10px; justify-content: space-between;">
              <button type="button" id="btnEditarCredencialesProfesor" class="btn-secondary" style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="key" style="width: 16px; height: 16px;"></i>
                Editar Credenciales
              </button>
              <div style="display: flex; gap: 10px;">
                <button type="button" class="close-modal">Cancelar</button>
                <button type="submit" class="btn-primary">Guardar Cambios</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('modalEditarProfesor');
  
  // Cerrar modal
  modal.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => modal.classList.remove('active')));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

  // Botón Editar Credenciales
  const btnCredenciales = document.getElementById('btnEditarCredencialesProfesor');
  btnCredenciales.addEventListener('click', () => {
    const idProfesor = document.getElementById('editProfesorId').value;
    abrirModalCredencialesProfesor(idProfesor);
  });

  // Form submit
  document.getElementById('formEditarProfesor').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const idProfesor = document.getElementById('editProfesorId').value;
    const data = {
      nombre: document.getElementById('editProfesorNombre').value,
      apellido: document.getElementById('editProfesorApellido').value,
      mail: document.getElementById('editProfesorMail').value,
      especialidad: document.getElementById('editProfesorEspecialidad').value,
      telefono: document.getElementById('editProfesorTelefono').value,
      estado: document.getElementById('editProfesorEstado').value
    };

    try {
      const resp = await fetch(`${API_URL}/profesores/${idProfesor}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await resp.json();

      if (resp.ok) {
        showToast('Profesor actualizado correctamente', 'success');
        modal.classList.remove('active');
        
        // Recargar datos
        const section = document.querySelector('.sidebar-menu button.active').id.replace('btn', '').toLowerCase();
        if (section === 'profesores') {
          document.getElementById('btnProfesores').click();
        }
        
        // Recargar panel si está abierto
        if (document.getElementById('profesorPanel').classList.contains('active')) {
          openProfesorPanel(idProfesor);
        }
      } else {
        showToast(result.message || 'Error al actualizar', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar profesor:', error);
      showToast('Error al actualizar profesor', 'error');
    }
  });
}

async function openEditarProfesorModal(idProfesor) {
  ensureEditarProfesorModal();
  const modal = document.getElementById('modalEditarProfesor');

  try {
    const resp = await fetch(`${API_URL}/profesores/${idProfesor}`);
    const profesor = await resp.json();

    document.getElementById('editProfesorId').value = idProfesor;
    document.getElementById('editProfesorNombre').value = profesor.nombre;
    document.getElementById('editProfesorApellido').value = profesor.apellido;
    document.getElementById('editProfesorMail').value = profesor.mail;
    document.getElementById('editProfesorEspecialidad').value = profesor.especialidad || '';
    document.getElementById('editProfesorTelefono').value = profesor.telefono || '';
    document.getElementById('editProfesorEstado').value = profesor.estado || 'activo';

    modal.classList.add('active');
    setTimeout(() => lucide.createIcons(), 10);
  } catch (error) {
    console.error('Error al cargar datos del profesor:', error);
    showToast('Error al cargar datos', 'error');
  }
}

// Modal de credenciales del profesor (unificadas Dashboard y Classroom)
async function abrirModalCredencialesProfesor(idProfesor) {
  try {
    const resp = await fetch(`${API_URL}/profesores/${idProfesor}`);
    const profesor = await resp.json();
    
    // Obtener usuario desde la tabla usuarios
    let usuarioActual = '';
    let passwordActual = '';
    let tienePassword = false;
    try {
      const respUsuario = await fetch(`${API_URL}/auth/usuario-classroom/${profesor.id_persona}`);
      if (respUsuario.ok) {
        const usuario = await respUsuario.json();
        usuarioActual = usuario.username || '';
        passwordActual = usuario.password_plain || '';
        tienePassword = usuario.password_plain ? true : false;
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }

    const result = await Swal.fire({
      title: 'Editar Credenciales',
      html: `
        <div style="text-align: left;">
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-size: 13px; color: #1e40af;">
              Estas credenciales se usan para <strong>Dashboard y Classroom</strong>
            </p>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">
              Usuario <span style="color: #9ca3af; font-weight: 400;">(actual: ${usuarioActual})</span>
            </label>
            <input type="text" id="usuarioProfesor" value="${usuarioActual}" 
                   onfocus="if(this.value === '${usuarioActual}') this.value = '';"
                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 14px; color: #9ca3af;">
          </div>
          
          <div style="margin-bottom: 8px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">
              Contraseña <span style="color: #9ca3af; font-weight: 400;">(actual: ${passwordActual || 'sin configurar'})</span>
            </label>
            <div style="position: relative;">
              <input type="text" id="passwordProfesor" value="${passwordActual}"
                     onfocus="if(this.value === '${passwordActual}') this.value = '';"
                     style="width: 100%; padding: 10px 40px 10px 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 14px; color: #9ca3af;">
              <button type="button" id="togglePasswordProfesor" 
                      style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 4px;">
                <i data-lucide="eye" style="width: 20px; height: 20px; color: #6b7280;"></i>
              </button>
            </div>
            <p style="font-size: 11px; color: #6b7280; margin-top: 4px;">
              Dejá vacío para mantener la contraseña actual
            </p>
          </div>
        </div>
      `,
      width: '500px',
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e3c72',
      didOpen: () => {
        lucide.createIcons();
        
        // Efecto de placeholder al hacer focus/blur en usuario
        const inputUsuario = document.getElementById('usuarioProfesor');
        inputUsuario.addEventListener('blur', () => {
          if (inputUsuario.value.trim() === '') {
            inputUsuario.value = '${usuarioActual}';
            inputUsuario.style.color = '#9ca3af';
          } else {
            inputUsuario.style.color = '#111827';
          }
        });
        
        // Efecto de placeholder al hacer focus/blur en password
        const inputPassword = document.getElementById('passwordProfesor');
        inputPassword.addEventListener('blur', () => {
          if (inputPassword.value.trim() === '') {
            inputPassword.value = '${passwordActual}';
            inputPassword.style.color = '#9ca3af';
          } else {
            inputPassword.style.color = '#111827';
          }
        });
        
        // Toggle password visibility
        const toggleBtn = document.getElementById('togglePasswordProfesor');
        toggleBtn.addEventListener('click', () => {
          const isPassword = inputPassword.type === 'password';
          inputPassword.type = isPassword ? 'text' : 'password';
          
          // Cambiar el ícono actualizando el HTML del botón
          const iconHtml = isPassword ? '<i data-lucide="eye-off" style="width: 20px; height: 20px; color: #6b7280;"></i>' : '<i data-lucide="eye" style="width: 20px; height: 20px; color: #6b7280;"></i>';
          toggleBtn.innerHTML = iconHtml;
          lucide.createIcons();
        });
      },
      preConfirm: async () => {
        const usuario = document.getElementById('usuarioProfesor').value.trim();
        const password = document.getElementById('passwordProfesor').value.trim();
        
        // Si el usuario está vacío o es el mismo que el actual, usar el actual
        const nuevoUsuario = (usuario === '' || usuario === '${usuarioActual}') ? '${usuarioActual}' : usuario;
        
        // Si el password está vacío o es el mismo que el actual, no actualizar
        const nuevoPassword = (password === '' || password === '${passwordActual}') ? '' : password;
        
        if (!nuevoUsuario) {
          Swal.showValidationMessage('El usuario es obligatorio');
          return false;
        }
        
        return { usuario: nuevoUsuario, password: nuevoPassword };
      }
    });

    // Si confirmó, procesar los cambios
    if (result.isConfirmed && result.value) {
      const { usuario, password } = result.value;

      try {
        // Preparar el body con usuario y opcionalmente contraseña
        const bodyData = {
          id_persona: profesor.id_persona,
          username: usuario
        };
        
        // Solo incluir password si se ingresó algo
        if (password && password.trim().length > 0) {
          bodyData.password = password;
        }
        
        const response = await fetch(`${API_URL}/auth/admin-cambiar-password-classroom`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
        
        if (response.ok) {
          const mensaje = password ? 'Usuario y contraseña actualizados correctamente' : 'Usuario actualizado correctamente';
          Swal.fire('¡Actualizado!', mensaje, 'success');
        } else {
          const data = await response.json();
          Swal.fire('Error', data.message || 'Error al actualizar credenciales', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire('Error', 'No se pudieron cargar las credenciales', 'error');
  }
}

// Cambiar estado del profesor
async function cambiarEstadoProfesor(idProfesor, estadoActual) {
  const estados = {
    'activo': { siguiente: 'licencia', label: 'En Licencia', icon: 'pause-circle', color: 'warning' },
    'licencia': { siguiente: 'activo', label: 'Activo', icon: 'check-circle', color: 'success' },
    'inactivo': { siguiente: 'activo', label: 'Activo', icon: 'check-circle', color: 'success' }
  };

  const cambio = estados[estadoActual];
  if (!cambio) return;

  const confirmed = await showConfirm(
    '¿Cambiar estado del profesor?',
    `Se cambiará el estado a: <strong>${cambio.label}</strong>`,
    cambio.icon
  );

  if (!confirmed) return;

  try {
    const resp = await fetch(`${API_URL}/profesores/${idProfesor}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: cambio.siguiente })
    });

    const result = await resp.json();

    if (resp.ok) {
      showToast(`Estado cambiado a ${cambio.label}`, 'success');
      
      // Recargar lista
      document.getElementById('btnProfesores').click();
      
      // Recargar panel
      if (document.getElementById('profesorPanel').classList.contains('active')) {
        openProfesorPanel(idProfesor);
      }
    } else {
      showToast(result.message || 'Error al cambiar estado', 'error');
    }
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    showToast('Error al cambiar estado', 'error');
  }
}

// Cambiar contraseña del Dashboard - Profesor
async function cambiarPasswordProfesorDashboard(idProfesor) {
  const { value: formValues } = await Swal.fire({
    title: 'Cambiar Contraseña del Dashboard',
    html: `
      <div style="text-align: left;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Nueva Contraseña:</label>
        <input id="swal-password" type="password" class="swal2-input" placeholder="Mínimo 6 caracteres" style="margin: 0 0 16px 0;">
        
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Confirmar Contraseña:</label>
        <input id="swal-password-confirm" type="password" class="swal2-input" placeholder="Repetir contraseña" style="margin: 0;">
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Cambiar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const password = document.getElementById('swal-password').value;
      const confirm = document.getElementById('swal-password-confirm').value;
      
      if (!password || !confirm) {
        Swal.showValidationMessage('Por favor complete ambos campos');
        return false;
      }
      
      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
      
      if (password !== confirm) {
        Swal.showValidationMessage('Las contraseñas no coinciden');
        return false;
      }
      
      return { password };
    }
  });

  if (!formValues) return;

  try {
    const resp = await fetch(`${API_URL}/profesores/${idProfesor}/cambiar-password-dashboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: formValues.password })
    });

    const result = await resp.json();

    if (resp.ok) {
      Swal.fire('¡Éxito!', 'Contraseña del Dashboard actualizada correctamente', 'success');
    } else {
      Swal.fire('Error', result.message || 'No se pudo cambiar la contraseña', 'error');
    }
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    Swal.fire('Error', 'Ocurrió un error al cambiar la contraseña', 'error');
  }
}

// Cambiar contraseña del Classroom - Profesor
async function cambiarPasswordProfesorClassroom(idProfesor) {
  // Primero obtener el id_persona del profesor
  let idPersona;
  try {
    const resp = await fetch(`${API_URL}/profesores/${idProfesor}`);
    const profesor = await resp.json();
    idPersona = profesor.id_persona;
  } catch (error) {
    Swal.fire('Error', 'No se pudo obtener la información del profesor', 'error');
    return;
  }

  const { value: formValues } = await Swal.fire({
    title: 'Cambiar Contraseña del Classroom',
    html: `
      <div style="text-align: left;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Nueva Contraseña:</label>
        <input id="swal-password-class" type="password" class="swal2-input" placeholder="Mínimo 6 caracteres" style="margin: 0 0 16px 0;">
        
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Confirmar Contraseña:</label>
        <input id="swal-password-class-confirm" type="password" class="swal2-input" placeholder="Repetir contraseña" style="margin: 0;">
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Cambiar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const password = document.getElementById('swal-password-class').value;
      const confirm = document.getElementById('swal-password-class-confirm').value;
      
      if (!password || !confirm) {
        Swal.showValidationMessage('Por favor complete ambos campos');
        return false;
      }
      
      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
      
      if (password !== confirm) {
        Swal.showValidationMessage('Las contraseñas no coinciden');
        return false;
      }
      
      return { password };
    }
  });

  if (!formValues) return;

  try {
    const resp = await fetch(`${API_URL}/auth/admin-cambiar-password-classroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id_persona: idPersona,
        password: formValues.password 
      })
    });

    const result = await resp.json();

    if (resp.ok) {
      Swal.fire('¡Éxito!', 'Contraseña del Classroom actualizada correctamente', 'success');
    } else {
      Swal.fire('Error', result.message || 'No se pudo cambiar la contraseña', 'error');
    }
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    Swal.fire('Error', 'Ocurrió un error al cambiar la contraseña', 'error');
  }
}

// Dar de baja profesor
async function darDeBajaProfesor(idProfesor, nombre) {
  const confirmed = await showConfirm(
    '¿Dar de baja al profesor?',
    `¿Estás seguro de dar de baja a <strong>${nombre}</strong>?<br>El profesor será marcado como inactivo.`,
    'user-x',
    true
  );

  if (!confirmed) return;

  try {
    const resp = await fetch(`${API_URL}/profesores/${idProfesor}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'inactivo' })
    });

    const result = await resp.json();

    if (resp.ok) {
      showToast('Profesor dado de baja correctamente', 'success');
      
      // Cerrar panel
      document.getElementById('profesorPanel').classList.remove('active');
      
      // Recargar lista
      document.getElementById('btnProfesores').click();
    } else {
      showToast(result.message || 'Error al dar de baja', 'error');
    }
  } catch (error) {
    console.error('Error al dar de baja:', error);
    showToast('Error al dar de baja', 'error');
  }
}

// Modal de confirmación genérico
function showConfirm(title, message, icon = 'alert-circle', isDanger = false) {
  return new Promise((resolve) => {
    // Eliminar modal anterior si existe
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) existingModal.remove();

    const modalHtml = `
      <div id="confirmModal" class="confirm-modal">
        <div class="confirm-modal-content">
          <div class="confirm-modal-icon ${isDanger ? 'danger' : ''}">
            <i data-lucide="${icon}" style="width: 32px; height: 32px;"></i>
          </div>
          <h3>${title}</h3>
          <p>${message}</p>
          <div class="confirm-modal-actions">
            <button class="btn-cancel" onclick="document.getElementById('confirmModal').remove()">Cancelar</button>
            <button class="btn-confirm ${isDanger ? 'danger' : ''}" id="btnConfirmAction">Confirmar</button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('confirmModal');
    setTimeout(() => modal.classList.add('active'), 10);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    document.getElementById('btnConfirmAction').onclick = () => {
      modal.remove();
      resolve(true);
    };

    modal.querySelector('.btn-cancel').onclick = () => {
      modal.remove();
      resolve(false);
    };

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        resolve(false);
      }
    });
  });
}

// =====================================================
// 7️⃣ GESTIÓN DE PAGOS
// =====================================================

let allPagos = [];
let pagosStats = {};

async function loadPagosData() {
  try {
    console.log('Cargando datos de pagos...');
    const resp = await fetch(`${API_URL}/pagos`);
    console.log('Response status:', resp.status);
    
    const data = await resp.json();
    console.log('Datos recibidos:', data);
    
    allPagos = data.pagos || [];
    pagosStats = data.estadisticas || {};

    console.log('Pagos:', allPagos.length, 'Stats:', pagosStats);

    // Actualizar métricas
    document.getElementById('metricTotalMes').textContent = parseFloat(pagosStats.total_mes || 0).toLocaleString('es-AR', {minimumFractionDigits: 2});
    document.getElementById('metricCobradas').textContent = pagosStats.cuotas_cobradas || 0;
    document.getElementById('metricPendientes').textContent = pagosStats.cuotas_pendientes || 0;
    document.getElementById('metricMora').textContent = pagosStats.alumnos_mora || 0;
    document.getElementById('metricPromedio').textContent = parseFloat(pagosStats.promedio_pago || 0).toLocaleString('es-AR', {minimumFractionDigits: 0});

    // Poblar filtro de medios de pago
    const mediosPago = [...new Set(allPagos.map(p => p.medio_pago))];
    const selectMedio = document.getElementById('pagoFilterMedio');
    selectMedio.innerHTML = '<option value="">Todos</option>' + 
      mediosPago.map(m => `<option value="${m}">${m}</option>`).join('');

    // Renderizar tabla
    renderPagosTable(allPagos);

    // Configurar filtros
    setupPagosFilters();

  } catch (error) {
    console.error('Error al cargar pagos:', error);
    document.getElementById('pagosTableBody').innerHTML = `
      <tr><td colspan="7" style="text-align: center; padding: 40px; color: #f44336;">
        Error al cargar los pagos
      </td></tr>`;
  }
}

function renderPagosTable(pagos) {
  const tbody = document.getElementById('pagosTableBody');
  
  if (pagos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No hay pagos para mostrar</td></tr>`;
    return;
  }

  tbody.innerHTML = pagos.map(p => {
    const estadoMap = {
      'pagado': 'Pagado',
      'mora': 'En Mora',
      'proximo_vencimiento': 'Próx. Venc.',
      'al_dia': 'Al Día'
    };

    return `
      <tr>
        <td onclick="openPagoPanel(${p.id_alumno})" style="cursor: pointer;">
          <div style="font-weight: 600;">${p.alumno}</div>
          <div style="font-size: 12px; color: #999;">Legajo: ${p.legajo}</div>
        </td>
        <td onclick="openPagoPanel(${p.id_alumno})" style="cursor: pointer;">${p.concepto}</td>
        <td onclick="openPagoPanel(${p.id_alumno})" style="cursor: pointer;">${p.periodo || '-'}</td>
        <td onclick="openPagoPanel(${p.id_alumno})" style="cursor: pointer; font-weight: 600; color: #4caf50;">$${parseFloat(p.monto).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
        <td onclick="openPagoPanel(${p.id_alumno})" style="cursor: pointer;">${p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-AR') : '-'}</td>
        <td onclick="openPagoPanel(${p.id_alumno})" style="cursor: pointer;">${p.medio_pago}</td>
        <td onclick="openPagoPanel(${p.id_alumno})" style="cursor: pointer;">
          <span class="estado-badge ${p.estado_visual}">
            ${estadoMap[p.estado_visual] || 'Desconocido'}
          </span>
        </td>
        <td style="text-align: center;">
          <button 
            class="btn-delete-pago" 
            onclick="event.stopPropagation(); eliminarPago(${p.id_pago}, '${p.alumno}', '${p.concepto}')"
            title="Eliminar pago">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function setupPagosFilters() {
  const searchInput = document.getElementById('pagoSearchAlumno');
  const medioFilter = document.getElementById('pagoFilterMedio');

  if (searchInput) searchInput.addEventListener('input', filterPagos);
  if (medioFilter) medioFilter.addEventListener('change', filterPagos);
}

function filterPagos() {
  const searchTerm = document.getElementById('pagoSearchAlumno')?.value.toLowerCase() || '';
  const medioFilter = document.getElementById('pagoFilterMedio')?.value || '';

  const filtered = allPagos.filter(p => {
    const matchesSearch = 
      p.alumno.toLowerCase().includes(searchTerm) ||
      p.legajo.toLowerCase().includes(searchTerm) ||
      (p.concepto && p.concepto.toLowerCase().includes(searchTerm));
    
    const matchesMedio = !medioFilter || p.medio_pago === medioFilter;

    return matchesSearch && matchesMedio;
  });

  renderPagosTable(filtered);
}

// Panel lateral de historial de pagos
function ensurePagoPanel() {
  if (document.getElementById('pagoPanel')) return;

  const panelHtml = `
    <div id="pagoPanel" class="pago-panel">
      <div class="pago-panel-header">
        <div class="pago-panel-alumno-info">
          <div class="pago-panel-avatar" id="pagoPanelAvatar">AA</div>
          <div class="pago-panel-details">
            <h2 id="pagoPanelNombre">Cargando...</h2>
            <p id="pagoPanelLegajo">Legajo: ---</p>
          </div>
        </div>
      </div>
      <div class="pago-panel-content" id="pagoPanelContent">
        <div style="text-align: center; padding: 40px; color: #999;">
          <i data-lucide="loader" style="width: 32px; height: 32px; animation: spin 1s linear infinite;"></i>
          <p>Cargando historial...</p>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', panelHtml);

  // Configurar cierre automático
  const panel = document.getElementById('pagoPanel');
  
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('active') && !panel.contains(e.target) && !e.target.closest('.pagos-table tbody tr')) {
      panel.classList.remove('active');
    }
  });
  
  let mouseLeaveTimeout;
  panel.addEventListener('mouseleave', () => {
    mouseLeaveTimeout = setTimeout(() => {
      panel.classList.remove('active');
    }, 500);
  });
  
  panel.addEventListener('mouseenter', () => {
    clearTimeout(mouseLeaveTimeout);
  });
}

async function openPagoPanel(idAlumno) {
  ensurePagoPanel();
  const panel = document.getElementById('pagoPanel');
  panel.classList.add('active');

  try {
    // Obtener info del alumno y pagos en paralelo
    const [alumnoResp, pagosResp] = await Promise.all([
      fetch(`${API_URL}/alumnos/${idAlumno}`),
      fetch(`${API_URL}/pagos/alumno/${idAlumno}`)
    ]);
    
    const alumno = await alumnoResp.json();
    const pagosData = await pagosResp.json();

    // Adaptar estructura de datos
    const historial = pagosData.pagos_realizados || [];
    const estado_cuenta = {
      total_pagado: pagosData.estadisticas?.total_pagado || 0,
      total_pagos: pagosData.estadisticas?.cantidad_pagos || 0,
      pagos_vencidos: pagosData.pagos_pendientes?.filter(p => p.estado === 'vencido').length || 0,
      ultimo_pago: historial.length > 0 ? historial[0].fecha_pago : null
    };

    // Actualizar header
    const nombreCompleto = `${alumno.nombre} ${alumno.apellido}`;
    const iniciales = nombreCompleto.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
    document.getElementById('pagoPanelAvatar').textContent = iniciales;
    document.getElementById('pagoPanelNombre').textContent = nombreCompleto;
    document.getElementById('pagoPanelLegajo').textContent = `Legajo: ${alumno.legajo} • ${alumno.mail}`;

    // Renderizar contenido
    const content = document.getElementById('pagoPanelContent');
    content.innerHTML = `
      <!-- Estado de Cuenta -->
      <div class="pago-section">
        <h3><i data-lucide="credit-card"></i> Estado de Cuenta</h3>
        <div class="estado-cuenta-grid">
          <div class="estado-cuenta-card highlight">
            <div class="estado-cuenta-label">Total Pagado</div>
            <div class="estado-cuenta-value">$${parseFloat(estado_cuenta.total_pagado || 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}</div>
          </div>
          <div class="estado-cuenta-card">
            <div class="estado-cuenta-label">Pagos Realizados</div>
            <div class="estado-cuenta-value">${estado_cuenta.total_pagos || 0}</div>
          </div>
          <div class="estado-cuenta-card ${estado_cuenta.pagos_vencidos > 0 ? 'danger' : ''}">
            <div class="estado-cuenta-label">Pagos Vencidos</div>
            <div class="estado-cuenta-value">${estado_cuenta.pagos_vencidos || 0}</div>
          </div>
        </div>
        ${estado_cuenta.ultimo_pago ? `
          <p style="font-size: 13px; color: #666; margin-top: 12px;">
            Último pago: ${new Date(estado_cuenta.ultimo_pago).toLocaleDateString('es-AR', {year: 'numeric', month: 'long', day: 'numeric'})}
          </p>
        ` : '<p style="font-size: 13px; color: #999; margin-top: 12px;">Sin pagos registrados</p>'}
      </div>

      <!-- Historial de Pagos -->
      <div class="pago-section">
        <h3><i data-lucide="history"></i> Historial de Pagos (${historial.length})</h3>
        ${historial.length > 0 ? `
          <div class="historial-timeline">
            ${historial.map(h => `
              <div class="historial-item">
                <div class="historial-item-header">
                  <div class="historial-item-title">${h.concepto}</div>
                  <div class="historial-item-monto">$${parseFloat(h.monto).toLocaleString('es-AR', {minimumFractionDigits: 2})}</div>
                </div>
                <div class="historial-item-details">
                  <div class="historial-item-detail">
                    <i data-lucide="calendar"></i>
                    <span>${h.periodo || 'Sin periodo'}</span>
                  </div>
                  <div class="historial-item-detail">
                    <i data-lucide="credit-card"></i>
                    <span>${h.medio_pago}</span>
                  </div>
                  <div class="historial-item-detail">
                    <i data-lucide="check-circle"></i>
                    <span>${h.fecha_pago ? new Date(h.fecha_pago).toLocaleDateString('es-AR') : 'Pendiente'}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p style="text-align: center; color: #999; padding: 40px;">No hay historial de pagos</p>'}
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

  } catch (error) {
    console.error('Error al cargar panel de pago:', error);
    document.getElementById('pagoPanelContent').innerHTML = `
      <div style="text-align: center; padding: 40px; color: #f44336;">
        <i data-lucide="alert-circle" style="width: 32px; height: 32px;"></i>
        <p>Error al cargar el historial de pagos</p>
      </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

// Eliminar pago
async function eliminarPago(idPago, nombreAlumno, concepto) {
  const confirmed = await showConfirm(
    '¿Eliminar pago?',
    `¿Estás seguro de eliminar el pago de <strong>${nombreAlumno}</strong>?<br>Concepto: ${concepto}`,
    'trash-2',
    true
  );

  if (!confirmed) return;

  try {
    const resp = await fetch(`${API_URL}/pagos/${idPago}`, {
      method: 'DELETE'
    });

    const result = await resp.json();

    if (resp.ok && result.success) {
      showToast('Pago eliminado correctamente', 'success');
      // Recargar los datos de pagos
      await loadPagosData();
    } else {
      showToast(result.message || 'Error al eliminar pago', 'error');
    }
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    showToast('Error al eliminar pago', 'error');
  }
}

// Modal de registrar pago
async function openRegistrarPagoModal() {
  try {
    // Obtener lista de alumnos con inscripciones activas
    const responseInscripciones = await fetch(`${API_URL}/inscripciones`);
    const todasInscripciones = await responseInscripciones.json();
    
    if (!todasInscripciones || todasInscripciones.length === 0) {
      showToast('No hay alumnos con cursos activos', 'warning');
      return;
    }

    // Filtrar alumnos únicos con inscripciones activas
    const alumnosConCursos = [...new Map(
      todasInscripciones
        .filter(insc => insc.estado === 'activo')
        .map(insc => [insc.id_alumno, insc.alumno])
    ).entries()].map(([id, nombre]) => ({ id_alumno: id, nombre_completo: nombre }));

    if (alumnosConCursos.length === 0) {
      showToast('No hay alumnos con cursos activos', 'warning');
      return;
    }

    // Crear opciones de alumnos (solo los que tienen cursos)
    const alumnosOptions = alumnosConCursos.map(alumno => 
      `<option value="${alumno.id_alumno}">${alumno.nombre_completo}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      title: '<div style="display: flex; align-items: center; gap: 12px;"><i class="lucide-credit-card" style="width: 28px; height: 28px; color: #1976d2;"></i> Registrar Pago Manual</div>',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
              <i class="lucide-user" style="width: 16px; height: 16px;"></i> Alumno
            </label>
            <select id="swal-alumno" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="">Seleccionar alumno...</option>
              ${alumnosOptions}
            </select>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
              <i class="lucide-book-open" style="width: 16px; height: 16px;"></i> Curso
            </label>
            <select id="swal-curso" class="swal2-input" style="width: 100%; margin: 0;" disabled>
              <option value="">Primero selecciona un alumno</option>
            </select>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
              <i class="lucide-calendar" style="width: 16px; height: 16px;"></i> Mes de Cuota
            </label>
            <select id="swal-mes" class="swal2-input" style="width: 100%; margin: 0;" disabled>
              <option value="">Primero selecciona un curso</option>
            </select>
            <div id="meses-pagados-info" style="margin-top: 8px; font-size: 12px;"></div>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
              <i class="lucide-dollar-sign" style="width: 16px; height: 16px;"></i> Monto
            </label>
            <input id="swal-monto" type="number" class="swal2-input" placeholder="Ej: 15000" style="width: 100%; margin: 0;" step="0.01">
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
              <i class="lucide-wallet" style="width: 16px; height: 16px;"></i> Medio de Pago
            </label>
            <select id="swal-medio-pago" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
              <option value="Tarjeta de Débito">Tarjeta de Débito</option>
            </select>
          </div>

          <div style="background: #e3f2fd; border-left: 4px solid #1976d2; padding: 12px; border-radius: 4px; margin-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #1565c0;">
              <i class="lucide-info" style="width: 14px; height: 14px;"></i> 
              Este pago se registrará como pagado en la fecha actual
            </p>
          </div>
        </div>
      `,
      width: '600px',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '<i class="lucide-check" style="width: 16px; height: 16px;"></i> Registrar Pago',
      cancelButtonText: '<i class="lucide-x" style="width: 16px; height: 16px;"></i> Cancelar',
      confirmButtonColor: '#1976d2',
      cancelButtonColor: '#757575',
      didOpen: () => {
        // Inicializar Lucide icons en el modal
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }

        const alumnoSelect = document.getElementById('swal-alumno');
        const cursoSelect = document.getElementById('swal-curso');
        const mesSelect = document.getElementById('swal-mes');
        const montoInput = document.getElementById('swal-monto');
        const mesesPagadosInfo = document.getElementById('meses-pagados-info');

        let pagosPorCurso = {}; // Guardar pagos ya realizados por curso

        // Evento cuando cambia el alumno
        alumnoSelect.addEventListener('change', async (e) => {
          const idAlumno = e.target.value;
          
          if (!idAlumno) {
            cursoSelect.innerHTML = '<option value="">Primero selecciona un alumno</option>';
            cursoSelect.disabled = true;
            mesSelect.innerHTML = '<option value="">Primero selecciona un curso</option>';
            mesSelect.disabled = true;
            montoInput.value = '';
            mesesPagadosInfo.innerHTML = '';
            return;
          }

          try {
            cursoSelect.innerHTML = '<option value="">Cargando cursos...</option>';
            cursoSelect.disabled = true;

            // Obtener cursos del alumno (solo sus inscripciones activas)
            const response = await fetch(`${API_URL}/inscripciones/alumno/${idAlumno}`);
            const inscripciones = await response.json();

            if (!inscripciones || inscripciones.length === 0) {
              cursoSelect.innerHTML = '<option value="">Este alumno no tiene cursos</option>';
              cursoSelect.disabled = true;
              return;
            }

            // Filtrar solo cursos activos
            const cursosActivos = inscripciones.filter(i => i.estado === 'activo');

            if (cursosActivos.length === 0) {
              cursoSelect.innerHTML = '<option value="">No hay cursos activos</option>';
              cursoSelect.disabled = true;
              return;
            }

            // Obtener pagos del alumno para verificar cuotas pagadas
            const responsePagos = await fetch(`${API_URL}/pagos/alumno/${idAlumno}`);
            const datosPagos = await responsePagos.json();

            // Organizar pagos por curso
            pagosPorCurso = {};
            if (datosPagos.cursos) {
              datosPagos.cursos.forEach(curso => {
                const mesesPagados = curso.meses
                  .filter(m => m.estado === 'pagado')
                  .map(m => m.mes);
                pagosPorCurso[curso.id_curso] = mesesPagados;
                console.log(`Curso ${curso.id_curso} - Meses pagados:`, mesesPagados);
              });
            }

            cursoSelect.innerHTML = '<option value="">Seleccionar curso...</option>' + 
              cursosActivos.map(insc => 
                `<option value="${insc.id_curso}" data-monto="${insc.costo_mensual}">
                  ${insc.idioma} ${insc.nivel}
                </option>`
              ).join('');
            cursoSelect.disabled = false;

          } catch (error) {
            console.error('Error al cargar cursos:', error);
            cursoSelect.innerHTML = '<option value="">Error al cargar cursos</option>';
          }
        });

        // Evento cuando cambia el curso
        cursoSelect.addEventListener('change', (e) => {
          const idCurso = e.target.value;
          const selectedOption = e.target.options[e.target.selectedIndex];
          const monto = selectedOption.dataset.monto;
          
          if (!idCurso) {
            mesSelect.innerHTML = '<option value="">Primero selecciona un curso</option>';
            mesSelect.disabled = true;
            mesesPagadosInfo.innerHTML = '';
            montoInput.value = '';
            return;
          }

          // Obtener meses ya pagados para este curso
          const mesesPagados = pagosPorCurso[idCurso] || [];
          console.log(`Curso seleccionado: ${idCurso}, Meses pagados:`, mesesPagados);
          
          // Todos los meses académicos (incluyendo Matrícula)
          const todosMeses = ['Matricula', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'];
          
          // Crear opciones de meses (solo disponibles)
          const mesesDisponibles = todosMeses.filter(mes => !mesesPagados.includes(mes));
          console.log('Meses disponibles para pagar:', mesesDisponibles);
          
          if (mesesDisponibles.length === 0) {
            mesSelect.innerHTML = '<option value="">Todas las cuotas están pagadas</option>';
            mesSelect.disabled = true;
            mesesPagadosInfo.innerHTML = '<div style="color: #43a047; background: #e8f5e9; padding: 8px; border-radius: 4px;"><i class="lucide-check-circle" style="width: 14px; height: 14px;"></i> ✓ Todas las cuotas de este curso están pagadas (incluyendo matrícula)</div>';
          } else {
            mesSelect.innerHTML = '<option value="">Seleccionar mes...</option>' + 
              mesesDisponibles.map(mes => `<option value="${mes}">${mes}</option>`).join('');
            mesSelect.disabled = false;
            
            // Mostrar información de meses pagados
            if (mesesPagados.length > 0) {
              mesesPagadosInfo.innerHTML = `<div style="color: #1565c0; background: #e3f2fd; padding: 8px; border-radius: 4px;">
                <i class="lucide-info" style="width: 14px; height: 14px;"></i> Ya pagado: ${mesesPagados.join(', ')}
              </div>`;
            } else {
              mesesPagadosInfo.innerHTML = '<div style="color: #757575;">No hay cuotas pagadas aún (ni matrícula)</div>';
            }
          }

          // Auto-completar monto
          if (monto) {
            montoInput.value = monto;
          }

          // Re-inicializar iconos
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        });
      },
      preConfirm: () => {
        const idAlumno = document.getElementById('swal-alumno').value;
        const idCurso = document.getElementById('swal-curso').value;
        const mesCuota = document.getElementById('swal-mes').value;
        const monto = document.getElementById('swal-monto').value;
        const medioPago = document.getElementById('swal-medio-pago').value;

        if (!idAlumno) {
          Swal.showValidationMessage('Selecciona un alumno');
          return false;
        }
        if (!idCurso) {
          Swal.showValidationMessage('Selecciona un curso');
          return false;
        }
        if (!mesCuota) {
          Swal.showValidationMessage('Selecciona el mes de cuota');
          return false;
        }
        if (!monto || parseFloat(monto) <= 0) {
          Swal.showValidationMessage('Ingresa un monto válido');
          return false;
        }
        if (!medioPago) {
          Swal.showValidationMessage('Selecciona un medio de pago');
          return false;
        }

        return {
          id_alumno: parseInt(idAlumno),
          id_curso: parseInt(idCurso),
          mes_cuota: mesCuota,
          monto: parseFloat(monto),
          medio_pago: medioPago
        };
      }
    });

    if (formValues) {
      try {
        // Mostrar loader
        Swal.fire({
          title: 'Registrando pago...',
          html: '<i class="lucide-loader" style="width: 48px; height: 48px; animation: spin 1s linear infinite;"></i>',
          showConfirmButton: false,
          allowOutsideClick: false
        });

        const response = await fetch(`${API_URL}/pagos/realizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formValues)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          await Swal.fire({
            icon: 'success',
            title: '¡Pago Registrado!',
            html: `
              <div style="text-align: left; padding: 20px;">
                <p style="margin: 0 0 12px 0;"><strong>Comprobante:</strong> ${data.comprobante.numero}</p>
                <p style="margin: 0 0 12px 0;"><strong>Monto:</strong> $${parseFloat(data.comprobante.monto).toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
                <p style="margin: 0 0 12px 0;"><strong>Detalle:</strong> ${data.comprobante.detalle}</p>
                <p style="margin: 0 0 12px 0;"><strong>Mes:</strong> ${data.comprobante.mes_cuota}</p>
                <p style="margin: 0;"><strong>Fecha:</strong> ${new Date(data.comprobante.fecha).toLocaleDateString('es-ES')}</p>
              </div>
            `,
            confirmButtonColor: '#1976d2'
          });

          // Recargar tabla de pagos
          await loadPagosData();
        } else {
          throw new Error(data.message || 'Error al registrar el pago');
        }
      } catch (error) {
        console.error('Error al registrar pago:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo registrar el pago',
          confirmButtonColor: '#1976d2'
        });
      }
    }
  } catch (error) {
    console.error('Error al abrir modal:', error);
    showToast('Error al cargar datos', 'error');
  }
}

// ===== GESTIÓN DE AULAS ===== //
async function openNuevaAulaModal() {
  const { value: formValues } = await Swal.fire({
    title: 'Nueva Aula',
    html: `
      <div style="text-align: left;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombre del Aula</label>
          <input id="nombre_aula" class="swal2-input" placeholder="Ej: Aula 101" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Capacidad</label>
          <input id="capacidad" type="number" class="swal2-input" placeholder="Ej: 30" style="width: 100%; margin: 0;">
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1e3c72',
    preConfirm: () => {
      const nombre = document.getElementById('nombre_aula').value;
      const capacidad = document.getElementById('capacidad').value;
      
      if (!nombre) {
        Swal.showValidationMessage('El nombre es obligatorio');
        return false;
      }
      if (!capacidad || capacidad < 1) {
        Swal.showValidationMessage('La capacidad debe ser mayor a 0');
        return false;
      }
      return { nombre, capacidad };
    }
  });

  if (formValues) {
    try {
      const res = await fetch(`${API_URL}/aulas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_aula: formValues.nombre,
          capacidad: formValues.capacidad
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Creada!', 'Aula creada exitosamente', 'success');
        document.getElementById('btnAulas').click();
      } else {
        Swal.fire('Error', data.message || 'Error al crear aula', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

async function editarAula(id, nombre, capacidad) {
  const { value: formValues } = await Swal.fire({
    title: 'Editar Aula',
    html: `
      <div style="text-align: left;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombre del Aula</label>
          <input id="nombre_aula" class="swal2-input" value="${nombre}" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Capacidad</label>
          <input id="capacidad" type="number" class="swal2-input" value="${capacidad}" style="width: 100%; margin: 0;">
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1e3c72',
    preConfirm: () => {
      const nombre = document.getElementById('nombre_aula').value;
      const capacidad = document.getElementById('capacidad').value;
      
      if (!nombre) {
        Swal.showValidationMessage('El nombre es obligatorio');
        return false;
      }
      if (!capacidad || capacidad < 1) {
        Swal.showValidationMessage('La capacidad debe ser mayor a 0');
        return false;
      }
      return { nombre, capacidad };
    }
  });

  if (formValues) {
    try {
      const res = await fetch(`${API_URL}/aulas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_aula: formValues.nombre,
          capacidad: formValues.capacidad
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Actualizada!', 'Aula actualizada exitosamente', 'success');
        document.getElementById('btnAulas').click();
      } else {
        Swal.fire('Error', data.message || 'Error al actualizar aula', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

async function eliminarAula(id, nombre) {
  const result = await Swal.fire({
    title: '¿Eliminar aula?',
    html: `¿Estás seguro de eliminar el aula <strong>${nombre}</strong>?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_URL}/aulas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Eliminada!', 'Aula eliminada exitosamente', 'success');
        document.getElementById('btnAulas').click();
      } else {
        Swal.fire('Error', data.message || 'Error al eliminar aula', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

// ===== GESTIÓN DE IDIOMAS ===== //
async function openNuevoIdiomaModal() {
  const { value: nombre } = await Swal.fire({
    title: 'Nuevo Idioma',
    input: 'text',
    inputLabel: 'Nombre del idioma',
    inputPlaceholder: 'Ej: Inglés',
    showCancelButton: true,
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1e3c72',
    inputValidator: (value) => {
      if (!value) {
        return 'El nombre es obligatorio';
      }
    }
  });

  if (nombre) {
    try {
      const res = await fetch(`${API_URL}/idiomas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_idioma: nombre })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Creado!', 'Idioma creado exitosamente', 'success');
        document.getElementById('btnIdiomas').click();
      } else {
        Swal.fire('Error', data.message || 'Error al crear idioma', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

async function editarIdioma(id, nombreActual) {
  const { value: nombre } = await Swal.fire({
    title: 'Editar Idioma',
    input: 'text',
    inputLabel: 'Nombre del idioma',
    inputValue: nombreActual,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1e3c72',
    inputValidator: (value) => {
      if (!value) {
        return 'El nombre es obligatorio';
      }
    }
  });

  if (nombre) {
    try {
      const res = await fetch(`${API_URL}/idiomas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_idioma: nombre })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Actualizado!', 'Idioma actualizado exitosamente', 'success');
        document.getElementById('btnIdiomas').click();
      } else {
        Swal.fire('Error', data.message || 'Error al actualizar idioma', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

async function eliminarIdioma(id, nombre) {
  const result = await Swal.fire({
    title: '¿Eliminar idioma?',
    html: `¿Estás seguro de eliminar el idioma <strong>${nombre}</strong>?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_URL}/idiomas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Eliminado!', 'Idioma eliminado exitosamente', 'success');
        document.getElementById('btnIdiomas').click();
      } else {
        Swal.fire('Error', data.message || 'Error al eliminar idioma', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

// ===== GESTIÓN DE INSCRIPCIONES ===== //
async function openNuevaInscripcionModal() {
  // Cargar alumnos y cursos
  try {
    const [alumnosRes, cursosRes] = await Promise.all([
      fetch(`${API_URL}/alumnos`),
      fetch(`${API_URL}/cursos`)
    ]);
    
    const alumnos = await alumnosRes.json();
    const cursos = await cursosRes.json();
    
    const { value: formValues } = await Swal.fire({
      title: 'Nueva Inscripción',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Seleccionar Alumno</label>
            <select id="id_alumno" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="">-- Seleccione un alumno --</option>
              ${alumnos.map(a => `<option value="${a.id_alumno}">${a.nombre} ${a.apellido} (${a.legajo})</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Seleccionar Curso</label>
            <select id="id_curso" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="">-- Seleccione un curso --</option>
              ${cursos.map(c => `<option value="${c.id_curso}">${c.nombre_curso} - ${c.nombre_idioma || 'Sin idioma'}</option>`).join('')}
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Inscribir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e3c72',
      preConfirm: () => {
        const id_alumno = document.getElementById('id_alumno').value;
        const id_curso = document.getElementById('id_curso').value;
        
        if (!id_alumno) {
          Swal.showValidationMessage('Debe seleccionar un alumno');
          return false;
        }
        if (!id_curso) {
          Swal.showValidationMessage('Debe seleccionar un curso');
          return false;
        }
        return { id_alumno, id_curso };
      }
    });

    if (formValues) {
      const res = await fetch(`${API_URL}/inscripciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Inscrito!', 'Alumno inscrito exitosamente', 'success');
        document.getElementById('btnInscripciones').click();
      } else {
        Swal.fire('Error', data.message || 'Error al inscribir alumno', 'error');
      }
    }
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
  }
}

async function eliminarInscripcion(id, alumno, curso) {
  const result = await Swal.fire({
    title: '¿Eliminar inscripción?',
    html: `¿Estás seguro de eliminar la inscripción de <strong>${alumno}</strong> al curso <strong>${curso}</strong>?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_URL}/inscripciones/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Eliminada!', 'Inscripción eliminada exitosamente', 'success');
        document.getElementById('btnInscripciones').click();
      } else {
        Swal.fire('Error', data.message || 'Error al eliminar inscripción', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

// ===== GESTIÓN DE ALUMNOS ===== //
async function openNuevoAlumnoModal() {
  const { value: formValues } = await Swal.fire({
    title: 'Nuevo Alumno',
    html: `
      <div style="text-align: left;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombre</label>
          <input id="nombre" class="swal2-input" placeholder="Nombre" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Apellido</label>
          <input id="apellido" class="swal2-input" placeholder="Apellido" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">DNI</label>
          <input id="dni" class="swal2-input" placeholder="Ej: 12345678" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Email</label>
          <input id="mail" type="email" class="swal2-input" placeholder="email@ejemplo.com" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Legajo</label>
          <input id="legajo" class="swal2-input" placeholder="Ej: 12345" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Teléfono (opcional)</label>
          <input id="telefono" class="swal2-input" placeholder="Ej: 1234567890" style="width: 100%; margin: 0;">
        </div>
      </div>
    `,
    width: '500px',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1e3c72',
    preConfirm: () => {
      const nombre = document.getElementById('nombre').value;
      const apellido = document.getElementById('apellido').value;
      const dni = document.getElementById('dni').value;
      const mail = document.getElementById('mail').value;
      const legajo = document.getElementById('legajo').value;
      const telefono = document.getElementById('telefono').value;
      
      if (!nombre) {
        Swal.showValidationMessage('El nombre es obligatorio');
        return false;
      }
      if (!apellido) {
        Swal.showValidationMessage('El apellido es obligatorio');
        return false;
      }
      if (!dni) {
        Swal.showValidationMessage('El DNI es obligatorio');
        return false;
      }
      if (!mail) {
        Swal.showValidationMessage('El email es obligatorio');
        return false;
      }
      if (!legajo) {
        Swal.showValidationMessage('El legajo es obligatorio');
        return false;
      }
      return { nombre, apellido, dni, mail, legajo, telefono };
    }
  });

  if (formValues) {
    try {
      const res = await fetch(`${API_URL}/alumnos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Alumno creado exitosamente, ahora solicitar credenciales
        const idAlumno = data.id_alumno;
        const nombreCompleto = `${formValues.nombre} ${formValues.apellido}`;
        
        await Swal.fire({
          icon: 'success',
          title: '¡Alumno creado!',
          text: `${nombreCompleto} ha sido registrado exitosamente`,
          timer: 1500,
          showConfirmButton: false
        });

        // Abrir modal para crear credenciales
        await crearCredencialesAlumno(idAlumno, nombreCompleto);
        
        document.getElementById('btnAlumnos').click();
      } else {
        Swal.fire('Error', data.message || 'Error al crear alumno', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

// Función para crear credenciales de acceso para alumno
async function crearCredencialesAlumno(idAlumno, nombreCompleto) {
  const { value: credenciales } = await Swal.fire({
    title: 'Crear Credenciales de Acceso',
    html: `
      <div style="text-align: left;">
        <p style="margin-bottom: 20px; color: #666;">
          Crea las credenciales de acceso para <strong>${nombreCompleto}</strong>
        </p>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Usuario</label>
          <input id="username" class="swal2-input" placeholder="Nombre de usuario" style="width: 100%; margin: 0;">
          <small style="color: #999; font-size: 12px;">Este será el usuario para iniciar sesión</small>
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Contraseña</label>
          <input id="password" type="password" class="swal2-input" placeholder="Contraseña" style="width: 100%; margin: 0;">
          <small style="color: #999; font-size: 12px;">Mínimo 6 caracteres</small>
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Confirmar Contraseña</label>
          <input id="password2" type="password" class="swal2-input" placeholder="Confirmar contraseña" style="width: 100%; margin: 0;">
        </div>
      </div>
    `,
    width: '500px',
    focusConfirm: false,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Crear Credenciales',
    denyButtonText: 'Omitir (crear después)',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1e3c72',
    preConfirm: () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const password2 = document.getElementById('password2').value;
      
      if (!username || !password || !password2) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }
      
      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
      
      if (password !== password2) {
        Swal.showValidationMessage('Las contraseñas no coinciden');
        return false;
      }
      
      return { username, password };
    }
  });

  if (credenciales) {
    try {
      // Crear usuario
      const res = await fetch(`${API_URL}/alumnos/${idAlumno}/credenciales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await Swal.fire({
          icon: 'success',
          title: '¡Credenciales creadas!',
          html: `
            <p>Las credenciales de acceso han sido creadas exitosamente.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>Usuario:</strong> ${credenciales.username}</p>
              <p style="margin: 5px 0;"><strong>Contraseña:</strong> ${credenciales.password}</p>
            </div>
            <p style="color: #999; font-size: 13px; margin-top: 15px;">
              ⚠️ Guarda estas credenciales de forma segura
            </p>
          `,
          confirmButtonColor: '#1e3c72'
        });
      } else {
        Swal.fire('Error', data.message || 'Error al crear credenciales', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudieron crear las credenciales', 'error');
    }
  }
}

// Asegurar que existe el modal de editar alumno
function ensureEditarAlumnoModal() {
  // Eliminar modal existente si existe
  const existingModal = document.getElementById('modalEditarAlumno');
  if (existingModal) {
    console.log('🔴 Removiendo modal viejo de alumno');
    existingModal.remove();
  }

  console.log('🟢 Creando nuevo modal de alumno con botón de credenciales');

  const modal = document.createElement('div');
  modal.id = 'modalEditarAlumno';
  modal.className = 'modal';
  modal.style.zIndex = '3000';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2>Editar Alumno</h2>
        <button class="close-modal">&times;</button>
      </div>
      
      <div style="padding: 24px;">
        <form id="formEditarAlumno">
          <input type="hidden" id="editAlumnoId">
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label for="editAlumnoNombre">Nombre:</label>
              <input type="text" id="editAlumnoNombre" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label for="editAlumnoApellido">Apellido:</label>
              <input type="text" id="editAlumnoApellido" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label for="editAlumnoMail">Email:</label>
            <input type="email" id="editAlumnoMail" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label for="editAlumnoLegajo">Legajo:</label>
              <input type="text" id="editAlumnoLegajo" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label for="editAlumnoTelefono">Teléfono:</label>
              <input type="text" id="editAlumnoTelefono" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label for="editAlumnoEstado">Estado:</label>
            <select id="editAlumnoEstado" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          
          <div class="form-actions" style="margin-top: 24px; display: flex; gap: 10px; justify-content: space-between; align-items: center;">
            <button type="button" id="btnEditarCredencialesAlumno" class="btn-secondary" style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="key" style="width: 16px; height: 16px;"></i>
              Editar Credenciales
            </button>
            <div style="display: flex; gap: 10px;">
              <button type="button" class="close-modal">Cancelar</button>
              <button type="submit" class="btn-primary">Guardar Cambios</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Cerrar modal
  modal.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => {
    modal.classList.remove('active');
  }));
  modal.addEventListener('click', e => { 
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Event listener para botón Editar Credenciales
  const btnCredencialesAlumno = document.getElementById('btnEditarCredencialesAlumno');
  btnCredencialesAlumno.addEventListener('click', () => {
    const idAlumno = document.getElementById('editAlumnoId').value;
    modal.classList.remove('active');
    setTimeout(() => {
      abrirModalCredencialesAlumno(idAlumno);
    }, 150);
  });

  // Event listener para submit del formulario
    document.getElementById('formEditarAlumno').addEventListener('submit', async (e) => {
      e.preventDefault();
      const idAlumno = document.getElementById('editAlumnoId').value;
      
      const formData = {
        nombre: document.getElementById('editAlumnoNombre').value,
        apellido: document.getElementById('editAlumnoApellido').value,
        mail: document.getElementById('editAlumnoMail').value,
        legajo: document.getElementById('editAlumnoLegajo').value,
        telefono: document.getElementById('editAlumnoTelefono').value,
        estado: document.getElementById('editAlumnoEstado').value
      };
      
      if (!formData.nombre || !formData.apellido || !formData.mail || !formData.legajo) {
        Swal.fire('Error', 'Nombre, apellido, mail y legajo son obligatorios', 'error');
        return;
      }
      
      try {
        const updateRes = await fetch(`${API_URL}/alumnos/${idAlumno}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const data = await updateRes.json();
        
        if (updateRes.ok && data.success) {
          cerrarModalEditarAlumno();
          Swal.fire('¡Actualizado!', 'Alumno actualizado exitosamente', 'success');
          document.getElementById('btnAlumnos').click();
        } else {
          Swal.fire('Error', data.message || 'Error al actualizar alumno', 'error');
        }
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
      }
    });

  return modal;
}

// Función para cerrar el modal de editar alumno
function cerrarModalEditarAlumno() {
  const modal = document.getElementById('modalEditarAlumno');
  if (modal) {
    modal.classList.remove('active');
  }
}

async function editarAlumno(id) {
  try {
    // Obtener datos del alumno
    const res = await fetch(`${API_URL}/alumnos/${id}`);
    const alumno = await res.json();
    
    // Asegurar que el modal existe
    ensureEditarAlumnoModal();
    const modal = document.getElementById('modalEditarAlumno');
    
    // Guardar ID
    document.getElementById('editAlumnoId').value = id;
    
    // Llenar datos personales
    document.getElementById('editAlumnoNombre').value = alumno.nombre || '';
    document.getElementById('editAlumnoApellido').value = alumno.apellido || '';
    document.getElementById('editAlumnoMail').value = alumno.mail || '';
    document.getElementById('editAlumnoLegajo').value = alumno.legajo || '';
    document.getElementById('editAlumnoTelefono').value = alumno.telefono || '';
    document.getElementById('editAlumnoEstado').value = alumno.estado || 'activo';
    
    // Mostrar modal
    modal.classList.add('active');
    
    // Refrescar iconos Lucide
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 10);
    
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
  }
}

// Modal de credenciales del alumno (unificadas Dashboard y Classroom)
async function abrirModalCredencialesAlumno(idAlumno) {
  try {
    const resp = await fetch(`${API_URL}/alumnos/${idAlumno}`);
    const alumno = await resp.json();
    
    // Obtener usuario desde la tabla usuarios
    let usuarioActual = '';
    let passwordActual = '';
    let tienePassword = false;
    try {
      const respUsuario = await fetch(`${API_URL}/auth/usuario-classroom/${alumno.id_persona}`);
      if (respUsuario.ok) {
        const usuario = await respUsuario.json();
        usuarioActual = usuario.username || '';
        passwordActual = usuario.password_plain || '';
        tienePassword = usuario.password_plain ? true : false;
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }

    const result = await Swal.fire({
      title: 'Editar Credenciales',
      html: `
        <div style="text-align: left;">
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-size: 13px; color: #1e40af;">
              Estas credenciales se usan para <strong>Dashboard y Classroom</strong>
            </p>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">
              Usuario <span style="color: #9ca3af; font-weight: 400;">(actual: ${usuarioActual})</span>
            </label>
            <input type="text" id="usuarioAlumno" value="${usuarioActual}" 
                   onfocus="if(this.value === '${usuarioActual}') this.value = '';"
                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 14px; color: #9ca3af;">
          </div>
          
          <div style="margin-bottom: 8px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">
              Contraseña <span style="color: #9ca3af; font-weight: 400;">(actual: ${passwordActual || 'sin configurar'})</span>
            </label>
            <div style="position: relative;">
              <input type="text" id="passwordAlumno" value="${passwordActual}"
                     onfocus="if(this.value === '${passwordActual}') this.value = '';"
                     style="width: 100%; padding: 10px 40px 10px 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 14px; color: #9ca3af;">
              <button type="button" id="togglePasswordAlumno" 
                      style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 4px;">
                <i data-lucide="eye" style="width: 20px; height: 20px; color: #6b7280;"></i>
              </button>
            </div>
            <p style="font-size: 11px; color: #6b7280; margin-top: 4px;">
              Dejá vacío para mantener la contraseña actual
            </p>
          </div>
        </div>
      `,
      width: '500px',
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e3c72',
      didOpen: () => {
        lucide.createIcons();
        
        // Efecto de placeholder al hacer focus/blur en usuario
        const inputUsuario = document.getElementById('usuarioAlumno');
        inputUsuario.addEventListener('blur', () => {
          if (inputUsuario.value.trim() === '') {
            inputUsuario.value = '${usuarioActual}';
            inputUsuario.style.color = '#9ca3af';
          } else {
            inputUsuario.style.color = '#111827';
          }
        });
        
        // Efecto de placeholder al hacer focus/blur en password
        const inputPassword = document.getElementById('passwordAlumno');
        inputPassword.addEventListener('blur', () => {
          if (inputPassword.value.trim() === '') {
            inputPassword.value = '${passwordActual}';
            inputPassword.style.color = '#9ca3af';
          } else {
            inputPassword.style.color = '#111827';
          }
        });
        
        // Toggle password visibility
        const toggleBtn = document.getElementById('togglePasswordAlumno');
        toggleBtn.addEventListener('click', () => {
          const isPassword = inputPassword.type === 'password';
          inputPassword.type = isPassword ? 'text' : 'password';
          
          // Cambiar el ícono actualizando el HTML del botón
          const iconHtml = isPassword ? '<i data-lucide="eye-off" style="width: 20px; height: 20px; color: #6b7280;"></i>' : '<i data-lucide="eye" style="width: 20px; height: 20px; color: #6b7280;"></i>';
          toggleBtn.innerHTML = iconHtml;
          lucide.createIcons();
        });
      },
      preConfirm: async () => {
        const usuario = document.getElementById('usuarioAlumno').value.trim();
        const password = document.getElementById('passwordAlumno').value.trim();
        
        // Si el usuario está vacío o es el mismo que el actual, usar el actual
        const nuevoUsuario = (usuario === '' || usuario === '${usuarioActual}') ? '${usuarioActual}' : usuario;
        
        // Si el password está vacío o es el mismo que el actual, no actualizar
        const nuevoPassword = (password === '' || password === '${passwordActual}') ? '' : password;
        
        if (!nuevoUsuario) {
          Swal.showValidationMessage('El usuario es obligatorio');
          return false;
        }
        
        return { usuario: nuevoUsuario, password: nuevoPassword };
      }
    });

    // Si confirmó, procesar los cambios
    if (result.isConfirmed && result.value) {
      const { usuario, password } = result.value;

      try {
        // Preparar el body con usuario y opcionalmente contraseña
        const bodyData = {
          id_persona: alumno.id_persona,
          username: usuario
        };
        
        // Solo incluir password si se ingresó algo
        if (password && password.trim().length > 0) {
          bodyData.password = password;
        }
        
        const response = await fetch(`${API_URL}/auth/admin-cambiar-password-classroom`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
        
        if (response.ok) {
          const mensaje = password ? 'Usuario y contraseña actualizados correctamente' : 'Usuario actualizado correctamente';
          Swal.fire('¡Actualizado!', mensaje, 'success');
        } else {
          const data = await response.json();
          Swal.fire('Error', data.message || 'Error al actualizar credenciales', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire('Error', 'No se pudieron cargar las credenciales', 'error');
  }
}

async function eliminarAlumno(id, nombre) {
  const result = await Swal.fire({
    title: '¿Eliminar alumno?',
    html: `¿Estás seguro de eliminar al alumno <strong>${nombre}</strong>?<br><br>
           <span style="color: #d33; font-size: 14px;">Esta acción eliminará también sus calificaciones, asistencias y pagos.</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_URL}/alumnos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Eliminado!', 'Alumno eliminado exitosamente', 'success');
        document.getElementById('btnAlumnos').click();
      } else {
        Swal.fire('Error', data.message || 'Error al eliminar alumno', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

// Función para cambiar password Dashboard del alumno
async function cambiarPasswordAlumnoDashboard(idAlumno) {
  const { value: formValues } = await Swal.fire({
    title: 'Cambiar Contraseña Dashboard',
    html: `
      <div style="text-align: left;">
        <p style="margin-bottom: 15px; color: #666;">Esta contraseña se usa para acceder al Dashboard administrativo.</p>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nueva Contraseña</label>
          <input id="password" type="password" class="swal2-input" placeholder="Mínimo 6 caracteres" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Confirmar Contraseña</label>
          <input id="confirmPassword" type="password" class="swal2-input" placeholder="Repite la contraseña" style="width: 100%; margin: 0;">
        </div>
      </div>
    `,
    width: '450px',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Cambiar Contraseña',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1e3c72',
    preConfirm: () => {
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (!password || !confirmPassword) {
        Swal.showValidationMessage('Ambos campos son obligatorios');
        return false;
      }
      
      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
      
      if (password !== confirmPassword) {
        Swal.showValidationMessage('Las contraseñas no coinciden');
        return false;
      }
      
      return { password };
    }
  });

  if (formValues) {
    try {
      const res = await fetch(`${API_URL}/alumnos/${idAlumno}/cambiar-password-dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Actualizado!', 'Contraseña Dashboard actualizada exitosamente', 'success');
      } else {
        Swal.fire('Error', data.message || 'Error al actualizar contraseña', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

// Función para cambiar password Classroom del alumno
async function cambiarPasswordAlumnoClassroom(idAlumno) {
  const { value: formValues } = await Swal.fire({
    title: 'Cambiar Contraseña Classroom',
    html: `
      <div style="text-align: left;">
        <p style="margin-bottom: 15px; color: #666;">Esta contraseña se usa para acceder a la plataforma educativa Classroom.</p>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nueva Contraseña</label>
          <input id="password" type="password" class="swal2-input" placeholder="Mínimo 6 caracteres" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Confirmar Contraseña</label>
          <input id="confirmPassword" type="password" class="swal2-input" placeholder="Repite la contraseña" style="width: 100%; margin: 0;">
        </div>
      </div>
    `,
    width: '450px',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Cambiar Contraseña',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#2575fc',
    preConfirm: () => {
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (!password || !confirmPassword) {
        Swal.showValidationMessage('Ambos campos son obligatorios');
        return false;
      }
      
      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
      
      if (password !== confirmPassword) {
        Swal.showValidationMessage('Las contraseñas no coinciden');
        return false;
      }
      
      return { password };
    }
  });

  if (formValues) {
    try {
      // Primero obtener id_persona del alumno
      const alumnoRes = await fetch(`${API_URL}/alumnos/${idAlumno}`);
      const alumno = await alumnoRes.json();
      
      const res = await fetch(`${API_URL}/auth/admin-cambiar-password-classroom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_persona: alumno.id_persona,
          password: formValues.password
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Actualizado!', 'Contraseña Classroom actualizada exitosamente', 'success');
      } else {
        Swal.fire('Error', data.message || 'Error al actualizar contraseña', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

// ===== GESTIÓN DE PROFESORES ===== //
async function openNuevoProfesorModal() {
  const { value: formValues } = await Swal.fire({
    title: 'Nuevo Profesor',
    html: `
      <div style="text-align: left;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombre</label>
          <input id="nombre" class="swal2-input" placeholder="Nombre" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Apellido</label>
          <input id="apellido" class="swal2-input" placeholder="Apellido" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">DNI</label>
          <input id="dni" class="swal2-input" placeholder="Ej: 12345678" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Email</label>
          <input id="mail" type="email" class="swal2-input" placeholder="email@ejemplo.com" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Especialidad</label>
          <input id="especialidad" class="swal2-input" placeholder="Ej: Inglés Avanzado" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Teléfono (opcional)</label>
          <input id="telefono" class="swal2-input" placeholder="Ej: 1234567890" style="width: 100%; margin: 0;">
        </div>
      </div>
    `,
    width: '500px',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1e3c72',
    preConfirm: () => {
      const nombre = document.getElementById('nombre').value;
      const apellido = document.getElementById('apellido').value;
      const dni = document.getElementById('dni').value;
      const mail = document.getElementById('mail').value;
      const especialidad = document.getElementById('especialidad').value;
      const telefono = document.getElementById('telefono').value;
      
      if (!nombre) {
        Swal.showValidationMessage('El nombre es obligatorio');
        return false;
      }
      if (!apellido) {
        Swal.showValidationMessage('El apellido es obligatorio');
        return false;
      }
      if (!dni) {
        Swal.showValidationMessage('El DNI es obligatorio');
        return false;
      }
      if (!mail) {
        Swal.showValidationMessage('El email es obligatorio');
        return false;
      }
      if (!especialidad) {
        Swal.showValidationMessage('La especialidad es obligatoria');
        return false;
      }
      return { nombre, apellido, dni, mail, especialidad, telefono };
    }
  });

  if (formValues) {
    try {
      console.log('Enviando datos de profesor:', formValues);
      const res = await fetch(`${API_URL}/profesores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });
      
      console.log('Respuesta del servidor:', res.status, res.statusText);
      const data = await res.json();
      console.log('Datos recibidos:', data);
      
      if (res.ok && data.success) {
        // Profesor creado exitosamente, ahora solicitar credenciales
        const idProfesor = data.id_profesor;
        const nombreCompleto = `${formValues.nombre} ${formValues.apellido}`;
        
        await Swal.fire({
          icon: 'success',
          title: '¡Profesor creado!',
          text: `${nombreCompleto} ha sido registrado exitosamente`,
          timer: 1500,
          showConfirmButton: false
        });

        // Abrir modal para crear credenciales
        await crearCredencialesProfesor(idProfesor, nombreCompleto);
        
        document.getElementById('btnProfesores').click();
      } else {
        console.error('Error del servidor:', data);
        Swal.fire('Error', data.message || 'Error al crear profesor', 'error');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

// Función para crear credenciales de acceso para profesor
async function crearCredencialesProfesor(idProfesor, nombreCompleto) {
  const { value: credenciales } = await Swal.fire({
    title: 'Crear Credenciales de Acceso',
    html: `
      <div style="text-align: left;">
        <p style="margin-bottom: 20px; color: #666;">
          Crea las credenciales de acceso para <strong>${nombreCompleto}</strong>
        </p>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Usuario</label>
          <input id="username" class="swal2-input" placeholder="Nombre de usuario" style="width: 100%; margin: 0;">
          <small style="color: #999; font-size: 12px;">Este será el usuario para iniciar sesión</small>
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Contraseña</label>
          <input id="password" type="password" class="swal2-input" placeholder="Contraseña" style="width: 100%; margin: 0;">
          <small style="color: #999; font-size: 12px;">Mínimo 6 caracteres</small>
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Confirmar Contraseña</label>
          <input id="password2" type="password" class="swal2-input" placeholder="Confirmar contraseña" style="width: 100%; margin: 0;">
        </div>
      </div>
    `,
    width: '500px',
    focusConfirm: false,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Crear Credenciales',
    denyButtonText: 'Omitir (crear después)',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1e3c72',
    preConfirm: () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const password2 = document.getElementById('password2').value;
      
      if (!username || !password || !password2) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }
      
      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
      
      if (password !== password2) {
        Swal.showValidationMessage('Las contraseñas no coinciden');
        return false;
      }
      
      return { username, password };
    }
  });

  if (credenciales) {
    try {
      // Crear usuario
      const res = await fetch(`${API_URL}/profesores/${idProfesor}/credenciales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await Swal.fire({
          icon: 'success',
          title: '¡Credenciales creadas!',
          html: `
            <p>Las credenciales de acceso han sido creadas exitosamente.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>Usuario:</strong> ${credenciales.username}</p>
              <p style="margin: 5px 0;"><strong>Contraseña:</strong> ${credenciales.password}</p>
            </div>
            <p style="color: #999; font-size: 13px; margin-top: 15px;">
              ⚠️ Guarda estas credenciales de forma segura
            </p>
          `,
          confirmButtonColor: '#1e3c72'
        });
      } else {
        Swal.fire('Error', data.message || 'Error al crear credenciales', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudieron crear las credenciales', 'error');
    }
  }
}

async function editarProfesor(id) {
  try {
    // Obtener datos del profesor
    const res = await fetch(`${API_URL}/profesores/${id}`);
    const profesor = await res.json();
    
    const { value: formValues, isDenied } = await Swal.fire({
      title: 'Editar Profesor',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombre</label>
            <input id="nombre" class="swal2-input" value="${profesor.nombre}" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Apellido</label>
            <input id="apellido" class="swal2-input" value="${profesor.apellido}" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Email</label>
            <input id="mail" type="email" class="swal2-input" value="${profesor.mail}" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Especialidad</label>
            <input id="especialidad" class="swal2-input" value="${profesor.especialidad || ''}" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Teléfono</label>
            <input id="telefono" class="swal2-input" value="${profesor.telefono || ''}" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Estado</label>
            <select id="estado" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="activo" ${profesor.estado === 'activo' ? 'selected' : ''}>Activo</option>
              <option value="inactivo" ${profesor.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
              <option value="licencia" ${profesor.estado === 'licencia' ? 'selected' : ''}>En Licencia</option>
            </select>
          </div>
        </div>
      `,
      width: '500px',
      focusConfirm: false,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Guardar',
      denyButtonText: '<i data-lucide="key"></i> Editar Credenciales',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e3c72',
      denyButtonColor: '#6b7280',
      didOpen: () => {
        // Renderizar iconos de Lucide
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      },
      preConfirm: () => {
        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const mail = document.getElementById('mail').value;
        const especialidad = document.getElementById('especialidad').value;
        const telefono = document.getElementById('telefono').value;
        const estado = document.getElementById('estado').value;
        
        if (!nombre || !apellido || !mail || !especialidad) {
          Swal.showValidationMessage('Nombre, apellido, mail y especialidad son obligatorios');
          return false;
        }
        return { nombre, apellido, mail, especialidad, telefono, estado };
      }
    });

    // Si presionó "Editar Credenciales"
    if (isDenied) {
      await abrirModalCredencialesProfesor(id);
      return;
    }

    if (formValues) {
      const updateRes = await fetch(`${API_URL}/profesores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });
      
      const data = await updateRes.json();
      
      if (updateRes.ok && data.success) {
        Swal.fire('¡Actualizado!', 'Profesor actualizado exitosamente', 'success');
        document.getElementById('btnProfesores').click();
      } else {
        Swal.fire('Error', data.message || 'Error al actualizar profesor', 'error');
      }
    }
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
  }
}

async function eliminarProfesor(id, nombre) {
  const result = await Swal.fire({
    title: '¿Eliminar profesor?',
    html: `¿Estás seguro de eliminar al profesor <strong>${nombre}</strong>?<br><br>
           <span style="color: #d33; font-size: 14px;">Los cursos que dicta quedarán sin profesor asignado.</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      console.log('Eliminando profesor ID:', id);
      const res = await fetch(`${API_URL}/profesores/${id}`, { method: 'DELETE' });
      console.log('Respuesta del servidor:', res.status, res.statusText);
      const data = await res.json();
      console.log('Datos recibidos:', data);
      
      if (res.ok && data.success) {
        Swal.fire('¡Eliminado!', 'Profesor eliminado exitosamente', 'success');
        document.getElementById('btnProfesores').click();
      } else {
        console.error('Error del servidor:', data);
        Swal.fire('Error', data.message || 'Error al eliminar profesor', 'error');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

// =====================================================
// 8️⃣ FUNCIONES ADMINISTRATIVAS DE ADMINISTRADORES
// =====================================================

function setupAdministradorFilters() {
  const searchInput = document.getElementById('administradoresSearch');

  if (searchInput) {
    searchInput.addEventListener('input', filterAdministradores);
  }
}

function filterAdministradores() {
  const searchTerm = document.getElementById('administradoresSearch')?.value.toLowerCase() || '';
  const cards = document.querySelectorAll('#administradoresGrid .profesor-card');
  
  cards.forEach(card => {
    const cardText = card.textContent.toLowerCase();
    const matchesSearch = cardText.includes(searchTerm);
    
    if (matchesSearch) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

async function openNuevoAdministradorModal() {
  const { value: formValues } = await Swal.fire({
    title: 'Nuevo Administrador',
    html: `
      <div style="text-align: left;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombre</label>
            <input id="admin_nombre" class="swal2-input" placeholder="Nombre" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Apellido</label>
            <input id="admin_apellido" class="swal2-input" placeholder="Apellido" style="width: 100%; margin: 0;">
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Email</label>
          <input id="admin_mail" type="email" class="swal2-input" placeholder="email@ejemplo.com" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">DNI</label>
          <input id="admin_dni" class="swal2-input" placeholder="12345678" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Teléfono</label>
          <input id="admin_telefono" class="swal2-input" placeholder="+54 9 11 1234-5678" style="width: 100%; margin: 0;">
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <h4 style="margin-bottom: 15px; color: #333;">Credenciales de acceso</h4>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Usuario</label>
          <input id="admin_username" class="swal2-input" placeholder="nombreusuario" style="width: 100%; margin: 0;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Contraseña</label>
          <input id="admin_password" type="password" class="swal2-input" placeholder="Mínimo 6 caracteres" style="width: 100%; margin: 0;">
        </div>
      </div>
    `,
    width: '600px',
    showCancelButton: true,
    confirmButtonText: 'Crear Administrador',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#000',
    preConfirm: () => {
      const nombre = document.getElementById('admin_nombre').value.trim();
      const apellido = document.getElementById('admin_apellido').value.trim();
      const mail = document.getElementById('admin_mail').value.trim();
      const dni = document.getElementById('admin_dni').value.trim();
      const telefono = document.getElementById('admin_telefono').value.trim();
      const username = document.getElementById('admin_username').value.trim();
      const password = document.getElementById('admin_password').value.trim();

      if (!nombre || !apellido || !mail || !username || !password) {
        Swal.showValidationMessage('Por favor complete todos los campos obligatorios');
        return false;
      }

      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }

      return { nombre, apellido, mail, dni, telefono, username, password };
    }
  });

  if (formValues) {
    try {
      const res = await fetch(`${API_URL}/administradores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await Swal.fire({
          icon: 'success',
          title: '¡Administrador creado!',
          html: `
            <p>El administrador <strong>${formValues.nombre} ${formValues.apellido}</strong> ha sido creado correctamente.</p>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>Usuario:</strong> ${formValues.username}</p>
              <p style="margin: 5px 0;"><strong>Contraseña:</strong> ${formValues.password}</p>
            </div>
            <p style="margin-top: 15px; font-size: 13px; color: #666;">Asegúrate de compartir estas credenciales de forma segura.</p>
          `,
          confirmButtonColor: '#000'
        });

        document.getElementById('btnAdministradores').click();
      } else {
        Swal.fire('Error', data.message || 'Error al crear administrador', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

async function editarAdministrador(id) {
  try {
    // Cargar datos del administrador
    const res = await fetch(`${API_URL}/administradores/${id}`);
    const admin = await res.json();

    const { value: formValues, isDenied } = await Swal.fire({
      title: 'Editar Administrador',
      html: `
        <div style="text-align: left;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombre</label>
              <input id="edit_admin_nombre" class="swal2-input" value="${admin.nombre}" style="width: 100%; margin: 0;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: 600;">Apellido</label>
              <input id="edit_admin_apellido" class="swal2-input" value="${admin.apellido}" style="width: 100%; margin: 0;">
            </div>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Email</label>
            <input id="edit_admin_mail" type="email" class="swal2-input" value="${admin.mail}" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">DNI</label>
            <input id="edit_admin_dni" class="swal2-input" value="${admin.dni || ''}" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Teléfono</label>
            <input id="edit_admin_telefono" class="swal2-input" value="${admin.telefono || ''}" style="width: 100%; margin: 0;">
          </div>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Guardar Cambios',
      denyButtonText: '<i data-lucide="key"></i> Editar Credenciales',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#000',
      denyButtonColor: '#6b7280',
      didOpen: () => {
        // Renderizar iconos de Lucide
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      },
      preConfirm: () => {
        const nombre = document.getElementById('edit_admin_nombre').value.trim();
        const apellido = document.getElementById('edit_admin_apellido').value.trim();
        const mail = document.getElementById('edit_admin_mail').value.trim();
        const dni = document.getElementById('edit_admin_dni').value.trim();
        const telefono = document.getElementById('edit_admin_telefono').value.trim();

        if (!nombre || !apellido || !mail) {
          Swal.showValidationMessage('Por favor complete todos los campos obligatorios');
          return false;
        }

        return { nombre, apellido, mail, dni, telefono };
      }
    });

    // Si presionó "Editar Credenciales"
    if (isDenied) {
      await abrirModalCredencialesAdministrador(id);
      return;
    }

    if (formValues) {
      const updateRes = await fetch(`${API_URL}/administradores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });

      const data = await updateRes.json();

      if (updateRes.ok && data.success) {
        Swal.fire('¡Actualizado!', 'Administrador actualizado correctamente', 'success');
        document.getElementById('btnAdministradores').click();
      } else {
        Swal.fire('Error', data.message || 'Error al actualizar administrador', 'error');
      }
    }
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
  }
}

async function abrirModalCredencialesAdministrador(idAdmin) {
  try {
    // Cargar datos del administrador
    const response = await fetch(`${API_URL}/administradores/${idAdmin}`);
    if (!response.ok) throw new Error('Error al cargar datos del administrador');
    const admin = await response.json();

    // Obtener password_plain desde tabla usuarios
    let passwordActual = '';
    try {
      const respUsuario = await fetch(`${API_URL}/auth/usuario-classroom/${admin.id_persona}`);
      if (respUsuario.ok) {
        const usuario = await respUsuario.json();
        passwordActual = usuario.password_plain || '';
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }

    const { value: formValues } = await Swal.fire({
      title: 'Editar Credenciales - Dashboard',
      html: `
        <div style="text-align: left; max-width: 500px; margin: 0 auto;">
          <!-- DASHBOARD -->
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #111827; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="layout-dashboard" style="width: 20px; height: 20px;"></i>
              Dashboard
            </h3>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
                Usuario <span style="color: #9ca3af; font-weight: 400;">(actual: ${admin.usuario || ''})</span>
              </label>
              <input type="text" id="usuarioDashboard" value="${admin.usuario || ''}" 
                     onfocus="if(this.value === '${admin.usuario || ''}') this.value = '';"
                     style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; color: #9ca3af;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
                Contraseña <span style="color: #9ca3af; font-weight: 400;">(actual: ${passwordActual || 'sin configurar'})</span>
              </label>
              <div style="position: relative;">
                <input type="text" id="passwordDashboard" value="${passwordActual}"
                       onfocus="if(this.value === '${passwordActual}') this.value = '';"
                       style="width: 100%; padding: 8px 40px 8px 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; color: #9ca3af;">
                <button type="button" id="togglePasswordDashboard" 
                        style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; color: #6b7280;">
                  <i data-lucide="eye" style="width: 18px; height: 18px;"></i>
                </button>
              </div>
              <small style="color: #6b7280; font-size: 12px;">Dejá vacío para mantener la contraseña actual</small>
            </div>
          </div>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#000',
      didOpen: () => {
        // Renderizar iconos de Lucide
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }

        const usuarioActualAdmin = "${admin.usuario || ''}";
        const passwordActualAdmin = "${passwordActual}";

        // Efecto de placeholder al hacer focus/blur en usuario
        const inputUsuario = document.getElementById('usuarioDashboard');
        inputUsuario.addEventListener('blur', () => {
          if (inputUsuario.value.trim() === '') {
            inputUsuario.value = usuarioActualAdmin;
            inputUsuario.style.color = '#9ca3af';
          } else {
            inputUsuario.style.color = '#111827';
          }
        });

        // Efecto de placeholder al hacer focus/blur en password
        const inputDash = document.getElementById('passwordDashboard');
        inputDash.addEventListener('blur', () => {
          if (inputDash.value.trim() === '') {
            inputDash.value = passwordActualAdmin;
            inputDash.style.color = '#9ca3af';
          } else {
            inputDash.style.color = '#111827';
          }
        });

        // Toggle password visibility - Dashboard
        const toggleDash = document.getElementById('togglePasswordDashboard');
        
        toggleDash.addEventListener('click', () => {
          const isPassword = inputDash.type === 'password';
          inputDash.type = isPassword ? 'text' : 'password';
          const icon = toggleDash.querySelector('i');
          icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
          lucide.createIcons();
        });
      },
      preConfirm: () => {
        const usuarioDash = document.getElementById('usuarioDashboard').value.trim();
        const passwordDash = document.getElementById('passwordDashboard').value.trim();

        const usuarioActualAdmin = "${admin.usuario || ''}";
        const passwordActualAdmin = "${passwordActual}";

        // Si el usuario está vacío o es el mismo que el actual, usar el actual
        const nuevoUsuario = (usuarioDash === '' || usuarioDash === usuarioActualAdmin) ? usuarioActualAdmin : usuarioDash;
        
        // Si el password está vacío o es el mismo que el actual, no actualizar
        const nuevoPassword = (passwordDash === '' || passwordDash === passwordActualAdmin) ? '' : passwordDash;

        if (!nuevoUsuario) {
          Swal.showValidationMessage('El usuario del Dashboard es obligatorio');
          return false;
        }

        return {
          usuarioDashboard: nuevoUsuario,
          passwordDashboard: nuevoPassword
        };
      }
    });

    if (formValues) {
      const { usuarioDashboard, passwordDashboard } = formValues;

      // 1. Actualizar usuario del Dashboard
      try {
        const responseUsuario = await fetch(`${API_URL}/administradores/${idAdmin}/usuario`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario: usuarioDashboard })
        });

        const dataUsuario = await responseUsuario.json();
        
        if (!responseUsuario.ok) {
          Swal.fire('Error', dataUsuario.message || 'Error al actualizar usuario', 'error');
          return;
        }
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
        return;
      }

      // 2. Actualizar contraseña del Dashboard (solo si se ingresó algo)
      if (passwordDashboard && passwordDashboard.length > 0) {
        try {
          const responsePassword = await fetch(`${API_URL}/administradores/${idAdmin}/cambiar-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: passwordDashboard })
          });

          const dataPassword = await responsePassword.json();
          
          if (!responsePassword.ok) {
            Swal.fire('Error', dataPassword.message || 'Error al actualizar contraseña', 'error');
            return;
          }
        } catch (error) {
          console.error(error);
          Swal.fire('Error', 'No se pudo actualizar la contraseña', 'error');
          return;
        }
      }

      Swal.fire('¡Éxito!', 'Credenciales actualizadas correctamente', 'success');
    }
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudo cargar los datos del administrador', 'error');
  }
}

async function cambiarPasswordAdministrador(id, nombre) {
  const { value: password } = await Swal.fire({
    title: 'Cambiar Contraseña',
    html: `
      <p>Ingresa la nueva contraseña para <strong>${nombre}</strong></p>
      <input id="nueva_password" type="password" class="swal2-input" placeholder="Nueva contraseña (mín. 6 caracteres)" style="width: 90%;">
      <input id="confirmar_password" type="password" class="swal2-input" placeholder="Confirmar contraseña" style="width: 90%; margin-top: 10px;">
    `,
    showCancelButton: true,
    confirmButtonText: 'Cambiar Contraseña',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#000',
    preConfirm: () => {
      const pass = document.getElementById('nueva_password').value;
      const confirm = document.getElementById('confirmar_password').value;

      if (!pass || pass.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }

      if (pass !== confirm) {
        Swal.showValidationMessage('Las contraseñas no coinciden');
        return false;
      }

      return pass;
    }
  });

  if (password) {
    try {
      const res = await fetch(`${API_URL}/administradores/${id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Contraseña actualizada',
          html: `
            <p>La contraseña de <strong>${nombre}</strong> ha sido actualizada.</p>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>Nueva contraseña:</strong> ${password}</p>
            </div>
            <p style="margin-top: 15px; font-size: 13px; color: #666;">Asegúrate de compartir esta información de forma segura.</p>
          `,
          confirmButtonColor: '#000'
        });
      } else {
        Swal.fire('Error', data.message || 'Error al cambiar contraseña', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

async function eliminarAdministrador(id, nombre) {
  const result = await Swal.fire({
    title: '¿Eliminar administrador?',
    html: `¿Estás seguro de eliminar al administrador <strong>${nombre}</strong>?<br><br>
           <span style="color: #d33; font-size: 14px;">Esta acción no se puede deshacer.</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_URL}/administradores/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Eliminado!', 'Administrador eliminado exitosamente', 'success');
        document.getElementById('btnAdministradores').click();
      } else {
        Swal.fire('Error', data.message || 'Error al eliminar administrador', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

// ===== GESTIÓN DE CURSOS ===== //
async function openNuevoCursoModal() {
  try {
    // Cargar idiomas, niveles, profesores y aulas
    const [idiomasRes, nivelesRes, profesoresRes, aulasRes] = await Promise.all([
      fetch(`${API_URL}/idiomas`),
      fetch(`${API_URL}/niveles`),
      fetch(`${API_URL}/profesores`),
      fetch(`${API_URL}/aulas`)
    ]);

    const idiomas = await idiomasRes.json();
    const niveles = await nivelesRes.json();
    const profesores = await profesoresRes.json();
    const aulas = await aulasRes.json();

    const { value: formValues } = await Swal.fire({
      title: 'Nuevo Curso',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombre del Curso</label>
            <input id="nombre_curso" class="swal2-input" placeholder="Ej: Inglés Básico A1" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Idioma</label>
            <select id="id_idioma" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="">Seleccionar idioma</option>
              ${idiomas.map(i => `<option value="${i.id_idioma}">${i.nombre_idioma}</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nivel (opcional)</label>
            <select id="id_nivel" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="">Sin nivel</option>
              ${niveles.map(n => `<option value="${n.id_nivel}">${n.descripcion}</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Profesor</label>
            <select id="id_profesor" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="">Seleccionar profesor</option>
              ${profesores.map(p => `<option value="${p.id_profesor}">${p.nombre} ${p.apellido}</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Horario (opcional)</label>
            <input id="horario" class="swal2-input" placeholder="Ej: Lun-Mie 18:00-20:00" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Cupo Máximo</label>
            <input id="cupo_maximo" type="number" class="swal2-input" value="30" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Aula (opcional)</label>
            <select id="id_aula" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="">Sin aula asignada</option>
              ${aulas.map(a => `<option value="${a.id_aula}">${a.nombre_aula} (${a.capacidad} personas)</option>`).join('')}
            </select>
          </div>
        </div>
      `,
      width: '600px',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e3c72',
      preConfirm: () => {
        const nombre_curso = document.getElementById('nombre_curso').value;
        const id_idioma = document.getElementById('id_idioma').value;
        const id_nivel = document.getElementById('id_nivel').value;
        const id_profesor = document.getElementById('id_profesor').value;
        const horario = document.getElementById('horario').value;
        const cupo_maximo = document.getElementById('cupo_maximo').value;
        const id_aula = document.getElementById('id_aula').value;
        
        if (!nombre_curso) {
          Swal.showValidationMessage('El nombre del curso es obligatorio');
          return false;
        }
        if (!id_idioma) {
          Swal.showValidationMessage('Debe seleccionar un idioma');
          return false;
        }
        if (!id_profesor) {
          Swal.showValidationMessage('Debe seleccionar un profesor');
          return false;
        }
        return { nombre_curso, id_idioma, id_nivel, id_profesor, horario, cupo_maximo, id_aula };
      }
    });

    if (formValues) {
      const res = await fetch(`${API_URL}/cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Creado!', 'Curso creado exitosamente', 'success');
        document.getElementById('btnCursos').click();
      } else {
        Swal.fire('Error', data.message || 'Error al crear curso', 'error');
      }
    }
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
  }
}

async function editarCurso(id) {
  try {
    // Cargar datos del curso y opciones
    const [cursoRes, idiomasRes, nivelesRes, profesoresRes, aulasRes] = await Promise.all([
      fetch(`${API_URL}/cursos/${id}`),
      fetch(`${API_URL}/idiomas`),
      fetch(`${API_URL}/niveles`),
      fetch(`${API_URL}/profesores`),
      fetch(`${API_URL}/aulas`)
    ]);

    const curso = await cursoRes.json();
    const idiomas = await idiomasRes.json();
    const niveles = await nivelesRes.json();
    const profesores = await profesoresRes.json();
    const aulas = await aulasRes.json();

    const { value: formValues } = await Swal.fire({
      title: 'Editar Curso',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombre del Curso</label>
            <input id="nombre_curso" class="swal2-input" value="${curso.nombre_curso}" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Idioma</label>
            <select id="id_idioma" class="swal2-input" style="width: 100%; margin: 0;">
              ${idiomas.map(i => `<option value="${i.id_idioma}" ${curso.id_idioma == i.id_idioma ? 'selected' : ''}>${i.nombre_idioma}</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nivel</label>
            <select id="id_nivel" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="">Sin nivel</option>
              ${niveles.map(n => `<option value="${n.id_nivel}" ${curso.id_nivel == n.id_nivel ? 'selected' : ''}>${n.descripcion}</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Profesor</label>
            <select id="id_profesor" class="swal2-input" style="width: 100%; margin: 0;">
              ${profesores.map(p => `<option value="${p.id_profesor}" ${curso.id_profesor == p.id_profesor ? 'selected' : ''}>${p.nombre} ${p.apellido}</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Horario</label>
            <input id="horario" class="swal2-input" value="${curso.horario || ''}" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Cupo Máximo</label>
            <input id="cupo_maximo" type="number" class="swal2-input" value="${curso.cupo_maximo}" style="width: 100%; margin: 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Aula</label>
            <select id="id_aula" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="">Sin aula asignada</option>
              ${aulas.map(a => `<option value="${a.id_aula}" ${curso.id_aula == a.id_aula ? 'selected' : ''}>${a.nombre_aula} (${a.capacidad} personas)</option>`).join('')}
            </select>
          </div>
        </div>
      `,
      width: '600px',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e3c72',
      preConfirm: () => {
        const nombre_curso = document.getElementById('nombre_curso').value;
        const id_idioma = document.getElementById('id_idioma').value;
        const id_nivel = document.getElementById('id_nivel').value;
        const id_profesor = document.getElementById('id_profesor').value;
        const horario = document.getElementById('horario').value;
        const cupo_maximo = document.getElementById('cupo_maximo').value;
        const id_aula = document.getElementById('id_aula').value;
        
        if (!nombre_curso || !id_idioma || !id_profesor) {
          Swal.showValidationMessage('Nombre del curso, idioma y profesor son obligatorios');
          return false;
        }
        return { nombre_curso, id_idioma, id_nivel, id_profesor, horario, cupo_maximo, id_aula };
      }
    });

    if (formValues) {
      const updateRes = await fetch(`${API_URL}/cursos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues)
      });
      
      const data = await updateRes.json();
      
      if (updateRes.ok && data.success) {
        Swal.fire('¡Actualizado!', 'Curso actualizado exitosamente', 'success');
        document.getElementById('btnCursos').click();
      } else {
        Swal.fire('Error', data.message || 'Error al actualizar curso', 'error');
      }
    }
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
  }
}

async function eliminarCurso(id, nombre) {
  const result = await Swal.fire({
    title: '¿Eliminar curso?',
    html: `¿Estás seguro de eliminar el curso <strong>${nombre}</strong>?<br><br>
           <span style="color: #d33; font-size: 14px;">Se eliminarán todas las calificaciones, asistencias e inscripciones asociadas.</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_URL}/cursos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire('¡Eliminado!', 'Curso eliminado exitosamente', 'success');
        document.getElementById('btnCursos').click();
      } else {
        Swal.fire('Error', data.message || 'Error al eliminar curso', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }
}

// =====================================================
// ASIGNAR PROFESOR A CURSO
// =====================================================
async function asignarProfesorACurso(idCurso, nombreCurso) {
  try {
    // Cargar lista de profesores activos
    const res = await fetch(`${API_URL}/profesores`);
    const profesores = await res.json();
    
    if (!profesores || profesores.length === 0) {
      Swal.fire('Sin profesores', 'No hay profesores disponibles para asignar', 'info');
      return;
    }

    // Filtrar solo profesores activos
    const profesoresActivos = profesores.filter(p => p.estado === 'activo');
    
    if (profesoresActivos.length === 0) {
      Swal.fire('Sin profesores activos', 'No hay profesores activos disponibles', 'info');
      return;
    }

    // Crear opciones para el select
    const opcionesHTML = profesoresActivos.map(p => 
      `<option value="${p.id_profesor}">${p.nombre} ${p.apellido} - ${p.especialidad || 'Sin especialidad'}</option>`
    ).join('');

    const { value: idProfesor } = await Swal.fire({
      title: 'Asignar Profesor',
      html: `
        <p style="margin-bottom: 15px;">Curso: <strong>${nombreCurso}</strong></p>
        <label style="display: block; text-align: left; margin-bottom: 8px; font-weight: 500;">
          Seleccione el profesor:
        </label>
        <select id="swal-profesor-select" class="swal2-input" style="width: 100%; padding: 10px; font-size: 14px;">
          <option value="">-- Seleccione un profesor --</option>
          ${opcionesHTML}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Asignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1976d2',
      preConfirm: () => {
        const select = document.getElementById('swal-profesor-select');
        if (!select.value) {
          Swal.showValidationMessage('Debe seleccionar un profesor');
          return false;
        }
        return select.value;
      }
    });

    if (idProfesor) {
      // Realizar la asignación
      const updateRes = await fetch(`${API_URL}/cursos/${idCurso}/profesor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_profesor: idProfesor })
      });

      const data = await updateRes.json();

      if (updateRes.ok && data.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Asignado!',
          text: 'Profesor asignado correctamente al curso',
          timer: 2000,
          showConfirmButton: false
        });
        // Recargar la lista de cursos
        document.getElementById('btnCursos').click();
      } else {
        Swal.fire('Error', data.message || 'Error al asignar profesor', 'error');
      }
    }
  } catch (error) {
    console.error('Error al asignar profesor:', error);
    Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
  }
}

// =====================================================
// 🎨 ANIMACIONES PARA INDEX.HTML
// =====================================================

// Intersection Observer para animaciones on scroll
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
  document.addEventListener('DOMContentLoaded', () => {
    // Observer para elementos que aparecen al hacer scroll (estilo Apple - se repiten)
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.classList.remove('hidden');
        } else {
          entry.target.classList.remove('visible');
          entry.target.classList.add('hidden');
        }
      });
    }, observerOptions);

    // Observar secciones
    const sections = document.querySelectorAll('.section-content, .about-content, .stats-grid, .faq-item');
    sections.forEach(section => {
      section.classList.add('scroll-animate');
      observer.observe(section);
    });

    // Observar cards (feature, role, module)
    const cards = document.querySelectorAll('.feature-card, .role-card, .module-card');
    cards.forEach(card => {
      observer.observe(card);
    });

    // Observer para imágenes con fade-in (se repiten)
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.classList.remove('hidden');
        } else {
          entry.target.classList.remove('visible');
          entry.target.classList.add('hidden');
        }
      });
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    const images = document.querySelectorAll('.animate-on-scroll');
    images.forEach(img => {
      img.classList.add('scroll-animate-img');
      imageObserver.observe(img);
    });

    // Efecto parallax suave (solo en el hero principal)
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          const heroImage = document.querySelector('.hero-main .hero-image');
          if (heroImage && scrolled < 800) {
            heroImage.style.transform = `translateY(${scrolled * 0.3}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    });

    // Animación de números en stats
    const animateNumber = (element, target) => {
      const duration = 2000;
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          element.textContent = target + '+';
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(current) + '+';
        }
      }, 16);
    };

    // Observer para stats (se repiten cada vez)
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('animated');
          setTimeout(() => {
            entry.target.classList.add('animated');
            const number = parseInt(entry.target.dataset.number);
            if (number) animateNumber(entry.target, number);
          }, 100);
        } else {
          const number = parseInt(entry.target.dataset.number);
          entry.target.textContent = '0+';
        }
      });
    }, { threshold: 0.3 });

    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
      const number = parseInt(stat.textContent);
      stat.dataset.number = number;
      stat.textContent = '0+';
      statsObserver.observe(stat);
    });
  });
}

// CSS para elementos visibles (animaciones repetibles estilo Apple)
const style = document.createElement('style');
style.textContent = `
  .scroll-animate {
    opacity: 0;
    transform: translateY(40px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .scroll-animate.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .scroll-animate.hidden {
    opacity: 0;
    transform: translateY(40px);
  }
  
  .scroll-animate-img {
    opacity: 0 !important;
    transform: scale(0.9) translateY(30px) !important;
    transition: opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1), 
                transform 1.8s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  .scroll-animate-img.visible {
    opacity: 1 !important;
    transform: scale(1) translateY(0) !important;
  }
  
  .scroll-animate-img.hidden {
    opacity: 0 !important;
    transform: scale(0.9) translateY(30px) !important;
  }
`;
document.head.appendChild(style);

// =====================================================
// 🎯 SMOOTH SCROLL MEJORADO
// =====================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// =====================================================
// ✨ RIPPLE EFFECT EN BOTONES
// =====================================================
function createRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  ripple.style.top = `${event.clientY - button.offsetTop - radius}px`;
  ripple.classList.add('ripple-effect');

  const existingRipple = button.getElementsByClassName('ripple-effect')[0];
  if (existingRipple) {
    existingRipple.remove();
  }

  button.appendChild(ripple);
}

const buttons = document.querySelectorAll('.cta-btn, .cta-btn-secondary, .login-btn');
buttons.forEach(button => {
  button.addEventListener('click', createRipple);
});

// CSS para ripple effect
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  button {
    position: relative;
    overflow: hidden;
  }
  
  .ripple-effect {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(rippleStyle);
