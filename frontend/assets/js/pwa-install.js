// Registro del Service Worker y lógica de instalación PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Verificar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              console.log('🔄 Nueva versión disponible');
              
              // Opcional: Mostrar notificación al usuario
              if (window.Swal) {
                Swal.fire({
                  title: 'Actualización Disponible',
                  text: '¿Deseas actualizar a la nueva versión?',
                  icon: 'info',
                  showCancelButton: true,
                  confirmButtonText: 'Actualizar',
                  cancelButtonText: 'Más tarde'
                }).then((result) => {
                  if (result.isConfirmed) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                });
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('❌ Error al registrar Service Worker:', error);
      });
  });
}

// Detectar si la app ya está instalada
let deferredPrompt;
const installButton = document.getElementById('installButton');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenir el prompt automático
  e.preventDefault();
  deferredPrompt = e;
  
  // Mostrar botón de instalación si existe
  if (installButton) {
    installButton.style.display = 'block';
  } else {
    // Si no hay botón dedicado, crear uno temporal
    showInstallBanner();
  }
});

// Detectar si es Android
function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

// Función para descargar APK con cache busting
async function downloadAPK() {
  const timestamp = new Date().getTime();
  const apkUrl = `/downloads/cemi-app-v3.apk?v=${timestamp}`;
  
  try {
    // Mostrar mensaje de descarga
    if (window.Swal) {
      Swal.fire({
        title: 'Descargando APK',
        html: '<strong>Versión 3.0</strong><br>Espera un momento...',
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false
      });
    }
    
    // Descargar como blob para evitar que Chrome lo interprete como PWA
    const response = await fetch(apkUrl);
    const blob = await response.blob();
    
    // Crear URL temporal del blob
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Crear link de descarga
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `CEMI-v3.0-${timestamp}.apk`;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Forzar descarga
    link.click();
    
    // Limpiar
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      if (window.Swal) {
        Swal.fire({
          title: '¡APK Descargado!',
          html: '<strong>Versión 3.0</strong><br>Desinstala la versión anterior antes de instalar',
          icon: 'success',
          timer: 4000,
          showConfirmButton: false
        });
      }
    }, 100);
    
  } catch (error) {
    console.error('Error descargando APK:', error);
    if (window.Swal) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo descargar el APK. Intenta desde el enlace directo.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }
}

// Función para mostrar banner de instalación
function showInstallBanner() {
  const isAndroidDevice = isAndroid();
  
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      padding: 15px 25px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 15px;
      max-width: 90%;
      animation: slideUp 0.3s ease;
    ">
      <div style="flex: 1;">
        <strong style="display: block; margin-bottom: 5px;">📱 Instalar CEMI</strong>
        <span style="font-size: 13px; opacity: 0.9;">Accede más rápido instalando la app</span>
      </div>
      ${isAndroidDevice ? `
        <button id="pwa-apk-download-btn" style="
          background: white;
          color: #1e3c72;
          border: none;
          padding: 8px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        ">APK v3.0</button>
      ` : `
        <button id="pwa-install-btn" style="
          background: white;
          color: #1e3c72;
          border: none;
          padding: 8px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        ">Instalar</button>
      `}
      <button id="pwa-dismiss-btn" style="
        background: transparent;
        color: white;
        border: none;
        padding: 8px;
        cursor: pointer;
        opacity: 0.8;
        font-size: 20px;
      ">×</button>
    </div>
  `;
  
  document.body.appendChild(banner);
  
  // Botón de descargar APK (solo Android)
  const apkBtn = document.getElementById('pwa-apk-download-btn');
  if (apkBtn) {
    apkBtn.addEventListener('click', downloadAPK);
  }
  
  // Botón de instalar PWA (solo otros dispositivos)
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', installPWA);
  }
  
  // Botón de cerrar
  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
    localStorage.setItem('pwa-dismissed', 'true');
  });
  
  // Agregar animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

// Función para instalar la PWA
async function installPWA() {
  if (!deferredPrompt) {
    console.log('No hay prompt de instalación disponible');
    return;
  }
  
  // Mostrar el prompt de instalación
  deferredPrompt.prompt();
  
  // Esperar a que el usuario responda
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
  
  if (outcome === 'accepted') {
    // Remover banner
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
    
    if (window.Swal) {
      Swal.fire({
        title: '¡Instalado!',
        text: 'La app se ha instalado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }
  
  // Limpiar el prompt
  deferredPrompt = null;
  
  // Ocultar botón si existe
  if (installButton) {
    installButton.style.display = 'none';
  }
}

// Detectar cuando la app fue instalada
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA instalada exitosamente');
  deferredPrompt = null;
  
  // Remover banner si existe
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.remove();
});

// Mostrar banner solo si no fue cerrado previamente
window.addEventListener('load', () => {
  const dismissed = localStorage.getItem('pwa-dismissed');
  const isAndroidDevice = isAndroid();
  
  // Si el usuario ya instaló o cerró el banner, no mostrar
  if (dismissed !== 'true' && !window.matchMedia('(display-mode: standalone)').matches) {
    // En Android, mostrar siempre el banner con opción de APK
    if (isAndroidDevice) {
      setTimeout(() => {
        showInstallBanner();
      }, 2000);
    } else {
      // En otros dispositivos, esperar el evento beforeinstallprompt
      setTimeout(() => {
        if (deferredPrompt) {
          // El evento ya se disparó, mostrar banner
          return;
        }
      }, 3000);
    }
  }
});

// Detectar si la app se está ejecutando como PWA instalada
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('✅ App ejecutándose como PWA instalada');
  // Opcional: Agregar clase al body para estilos específicos de PWA
  document.body.classList.add('pwa-mode');
}
