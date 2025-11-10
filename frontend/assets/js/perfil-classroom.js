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
      
      // Cargar datos académicos según el rol
      // Primero intentar con los IDs del perfil, luego con localStorage
      const idAlumno = userData.id_alumno || localStorage.getItem('id_alumno');
      const idProfesor = userData.id_profesor || localStorage.getItem('id_profesor');
      
      console.log('🎯 IDs para cargar datos académicos:', { idAlumno, idProfesor, userRol });
      
      if (userRol === 'alumno' || idAlumno) {
        await cargarDatosAcademicosAlumno(idAlumno);
      } else if (userRol === 'profesor' || idProfesor) {
        await cargarDatosAcademicosProfesor(idProfesor);
      }
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
// DATOS ACADÉMICOS - ALUMNO
// =====================================================

async function cargarDatosAcademicosAlumno(idAlumno = null) {
  document.getElementById('alumnoAcademico').style.display = 'block';
  document.getElementById('profesorAcademico').style.display = 'none';
  document.getElementById('academicSubtitle').textContent = 'Tus cursos y progreso académico';
  
  // Usar el idAlumno pasado como parámetro o intentar obtenerlo del localStorage
  const id = idAlumno || localStorage.getItem('id_alumno');
  
  console.log('🎓 Cargando datos académicos del alumno:', { idAlumno, id, localStorage: localStorage.getItem('id_alumno') });
  
  if (!id) {
    console.error('❌ No se pudo obtener id_alumno');
    document.getElementById('totalCursos').textContent = '0';
    document.getElementById('promedioGeneral').textContent = '0.0';
    document.getElementById('tareasCompletadas').textContent = '0/0';
    document.getElementById('asistenciaGeneral').textContent = '0%';
    return;
  }
  
  console.log(`📚 Cargando datos académicos para alumno: ${id}`);
  
  try {
    // Obtener inscripciones del alumno
    const response = await fetch(`${API_URL}/inscripciones/alumno/${id}`);
    const data = await response.json();
    
    console.log('📦 Inscripciones recibidas:', data);
    
    if (response.ok && data.success) {
      const inscripciones = data.inscripciones || [];
      document.getElementById('totalCursos').textContent = inscripciones.length;
      
      // Calcular promedio
      let sumaNotas = 0;
      let totalConNota = 0;
      inscripciones.forEach(insc => {
        if (insc.nota_final) {
          sumaNotas += parseFloat(insc.nota_final);
          totalConNota++;
        }
      });
      const promedio = totalConNota > 0 ? (sumaNotas / totalConNota).toFixed(1) : '0.0';
      document.getElementById('promedioGeneral').textContent = promedio;
      
      console.log(`✓ Total cursos: ${inscripciones.length}, Promedio: ${promedio}`);
      
      // Mostrar cursos
      mostrarCursosAlumno(inscripciones);
      
      // Cargar tareas y asistencias
      await cargarTareasAlumno(id);
      await cargarAsistenciaAlumno(id);
    } else {
      console.warn('⚠️ No se pudieron cargar las inscripciones:', data.message);
      document.getElementById('totalCursos').textContent = '0';
      document.getElementById('promedioGeneral').textContent = '0.0';
    }
  } catch (error) {
    console.error('❌ Error al cargar datos académicos:', error);
    document.getElementById('totalCursos').textContent = '0';
    document.getElementById('promedioGeneral').textContent = '0.0';
  }
}

function mostrarCursosAlumno(inscripciones) {
  const container = document.getElementById('cursosAlumno');
  
  if (!container) {
    console.warn('⚠️ No se encontró el contenedor cursosAlumno');
    return;
  }
  
  container.innerHTML = '';
  
  if (inscripciones.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No estás inscrito en ningún curso</p>';
    return;
  }
  
  console.log(`✓ Mostrando ${inscripciones.length} cursos`);
  
  inscripciones.forEach(insc => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
      <div class="course-header">
        <div class="course-title">${insc.nombre_idioma || 'Idioma'} - ${insc.nombre_nivel || 'Nivel'}</div>
        <div class="course-badge">${insc.nombre_curso || 'Curso'}</div>
      </div>
      <div class="course-info">
        <strong>Profesor:</strong> ${insc.nombre_profesor || 'No asignado'}
      </div>
      <div class="course-info">
        <strong>Nota:</strong> ${insc.nota_final || 'Pendiente'}
      </div>
      <div class="course-info">
        <strong>Aula:</strong> ${insc.nombre_aula || 'No asignada'}
      </div>
    `;
    container.appendChild(card);
  });
}

async function cargarTareasAlumno(idAlumno) {
  console.log(`📝 Cargando tareas para alumno: ${idAlumno}`);
  
  try {
    const response = await fetch(`${API_URL}/classroom/tareas-lista/alumno/${idAlumno}`);
    const data = await response.json();
    
    console.log('📦 Tareas recibidas:', data);
    
    if (response.ok && data.success) {
      const tareas = data.tareas || [];
      const completadas = tareas.filter(t => t.estado === 'entregada').length;
      document.getElementById('tareasCompletadas').textContent = `${completadas}/${tareas.length}`;
      console.log(`✓ Tareas completadas: ${completadas}/${tareas.length}`);
    } else {
      console.warn('⚠️ No se pudieron cargar las tareas:', data.message);
      document.getElementById('tareasCompletadas').textContent = '0/0';
    }
  } catch (error) {
    console.error('❌ Error al cargar tareas:', error);
    document.getElementById('tareasCompletadas').textContent = '0/0';
  }
}

async function cargarAsistenciaAlumno(idAlumno) {
  console.log(`📅 Cargando asistencias para alumno: ${idAlumno}`);
  
  try {
    const response = await fetch(`${API_URL}/asistencias/alumno/${idAlumno}`);
    const data = await response.json();
    
    console.log('📦 Asistencias recibidas:', data);
    
    if (response.ok && data.success) {
      const asistencias = data.asistencias || [];
      const presentes = asistencias.filter(a => a.presente === 1 || a.presente === true).length;
      const porcentaje = asistencias.length > 0 
        ? Math.round((presentes / asistencias.length) * 100) 
        : 0;
      document.getElementById('asistenciaGeneral').textContent = `${porcentaje}%`;
      console.log(`✓ Asistencia: ${porcentaje}% (${presentes}/${asistencias.length})`);
    } else {
      console.warn('⚠️ No se pudieron cargar las asistencias:', data.message);
      document.getElementById('asistenciaGeneral').textContent = '0%';
    }
  } catch (error) {
    console.error('❌ Error al cargar asistencias:', error);
    document.getElementById('asistenciaGeneral').textContent = '0%';
  }
}

// =====================================================
// DATOS ACADÉMICOS - PROFESOR
// =====================================================

// =====================================================
// CARGAR DATOS ACADÉMICOS DE PROFESOR
// =====================================================

async function cargarDatosAcademicosProfesor(idProfesor = null) {
  document.getElementById('alumnoAcademico').style.display = 'none';
  document.getElementById('profesorAcademico').style.display = 'block';
  document.getElementById('academicSubtitle').textContent = 'Cursos que impartes';
  
  // Usar el idProfesor pasado como parámetro o intentar obtenerlo del localStorage
  const id = idProfesor || localStorage.getItem('id_profesor');
  
  if (!id) {
    console.error('❌ No se pudo obtener id_profesor');
    document.getElementById('totalCursosProf').textContent = '0';
    document.getElementById('totalAlumnos').textContent = '0';
    document.getElementById('especialidad').textContent = '-';
    return;
  }
  
  console.log(`👨‍🏫 Cargando datos académicos para profesor: ${id}`);
  
  try {
    const response = await fetch(`${API_URL}/cursos/profesor/${id}`);
    const data = await response.json();
    
    console.log('📦 Cursos del profesor recibidos:', data);
    
    if (response.ok && data.success) {
      const cursos = data.cursos || [];
      document.getElementById('totalCursosProf').textContent = cursos.length;
      
      // Contar total de alumnos
      let totalAlumnos = 0;
      cursos.forEach(curso => {
        totalAlumnos += curso.total_inscritos || 0;
      });
      document.getElementById('totalAlumnos').textContent = totalAlumnos;
      
      // Especialidad (primer idioma de los cursos)
      if (cursos.length > 0) {
        document.getElementById('especialidad').textContent = cursos[0].nombre_idioma || '-';
      } else {
        document.getElementById('especialidad').textContent = '-';
      }
      
      console.log(`✓ Total cursos: ${cursos.length}, Total alumnos: ${totalAlumnos}`);
      
      // Mostrar cursos
      mostrarCursosProfesor(cursos);
    } else {
      console.warn('⚠️ No se pudieron cargar los cursos:', data.message);
      document.getElementById('totalCursosProf').textContent = '0';
      document.getElementById('totalAlumnos').textContent = '0';
      document.getElementById('especialidad').textContent = '-';
    }
  } catch (error) {
    console.error('❌ Error al cargar datos del profesor:', error);
    document.getElementById('totalCursosProf').textContent = '0';
    document.getElementById('totalAlumnos').textContent = '0';
    document.getElementById('especialidad').textContent = '-';
  }
}

function mostrarCursosProfesor(cursos) {
  const container = document.getElementById('cursosProfesor');
  
  if (!container) {
    console.warn('⚠️ No se encontró el contenedor cursosProfesor');
    return;
  }
  
  container.innerHTML = '';
  
  if (cursos.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No tienes cursos asignados</p>';
    return;
  }
  
  console.log(`✓ Mostrando ${cursos.length} cursos del profesor`);
  
  cursos.forEach(curso => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
      <div class="course-header">
        <div class="course-title">${curso.nombre_curso || 'Curso'}</div>
        <div class="course-badge">${curso.nombre_nivel || 'Nivel'}</div>
      </div>
      <div class="course-info">
        <strong>Idioma:</strong> ${curso.nombre_idioma || 'No especificado'}
      </div>
      <div class="course-info">
        <strong>Alumnos:</strong> ${curso.total_inscritos || 0}
      </div>
      <div class="course-info">
        <strong>Aula:</strong> ${curso.nombre_aula || 'No asignada'}
      </div>
    `;
    container.appendChild(card);
  });
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
