// JavaScript Vanilla: todas las tareas asíncronas usan promesas (.then/.catch/.finally).
const video = document.getElementById('visor-camara');
const placeholder = document.getElementById('placeholder');
const statusText = document.getElementById('status');
const btnAbrir = document.getElementById('btn-preparar-camara');
const btnCambiar = document.getElementById('btn-alternar-camara');
const btnCerrar = document.getElementById('btn-apagar-camara');
const modal = document.getElementById('aviso-permiso');
const btnAceptar = document.getElementById('btn-confirmar-permiso');
const btnCancelar = document.getElementById('btn-cancelar');
const btnInstalar = document.getElementById('btn-instalar');
const installMessage = document.getElementById('install-message');

let streamActual = null;
let modoCamaraActual = 'environment'; // environment = trasera, user = frontal
let eventoInstalacionDiferido = null;
let ocupada = false;
let solicitudId = 0;

function actualizarMensajeEstado(mensaje) {
  statusText.textContent = mensaje;
}

function actualizarBotones() {
  btnAbrir.disabled = ocupada || Boolean(streamActual);
  btnCambiar.disabled = ocupada || !streamActual;
  btnCerrar.disabled = !streamActual && !ocupada;
}

function detenerCamaraActiva() {
  // Invalida solicitudes pendientes (por ejemplo, si el usuario sale de la PWA).
  solicitudId += 1;
  if (streamActual) {
    streamActual.getTracks().forEach(function (track) {
      track.stop();
    });
    streamActual = null;
  }
  video.pause();
  video.srcObject = null;
  video.hidden = true;
  placeholder.hidden = false;
  actualizarBotones();
}

function iniciarCamara(modo) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    actualizarMensajeEstado('Cámara no disponible. Se necesita HTTPS o localhost y un navegador compatible.');
    return Promise.resolve(false);
  }

  detenerCamaraActiva(); // Libera el lente anterior antes de pedir el siguiente.
  const estaSolicitud = solicitudId;
  ocupada = true;
  actualizarBotones();
  actualizarMensajeEstado('Solicitando acceso a la cámara…');

  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: modo } }
  }).then(function (nuevoStream) {
    // Si la solicitud ya no es válida, nunca se conserva el sensor abierto.
    if (estaSolicitud !== solicitudId || document.hidden) {
      nuevoStream.getTracks().forEach(function (track) { track.stop(); });
      return false;
    }

    streamActual = nuevoStream;
    modoCamaraActual = modo;
    video.srcObject = nuevoStream;
    video.hidden = false;
    placeholder.hidden = true;
    return video.play().then(function () {
      actualizarMensajeEstado('Cámara activa. Lente solicitado: ' +
        (modo === 'environment' ? 'trasero' : 'frontal') + '.');
      return true;
    });
  }).catch(function (error) {
    if (estaSolicitud !== solicitudId) return false;
    detenerCamaraActiva();
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      actualizarMensajeEstado('Permiso denegado. Revisa los ajustes de la cámara en el navegador.');
    } else if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
      actualizarMensajeEstado('No se encontró una cámara compatible en el dispositivo.');
    } else {
      actualizarMensajeEstado('Error al abrir la cámara: ' + (error.name || 'desconocido') + '.');
    }
    return false;
  }).finally(function () {
    if (estaSolicitud === solicitudId || !streamActual) {
      ocupada = false;
    }
    actualizarBotones();
  });
}

// Primer clic: consentimiento informativo propio (sin activar hardware).
btnAbrir.addEventListener('click', function () {
  modal.hidden = false;
  btnAceptar.focus();
});
btnCancelar.addEventListener('click', function () {
  modal.hidden = true;
  btnAbrir.focus();
  actualizarMensajeEstado('No se solicitó acceso a la cámara.');
});
// Segundo clic: ahora sí se solicita el permiso nativo.
btnAceptar.addEventListener('click', function () {
  modal.hidden = true;
  iniciarCamara(modoCamaraActual);
});
btnCambiar.addEventListener('click', function () {
  const siguiente = modoCamaraActual === 'environment' ? 'user' : 'environment';
  iniciarCamara(siguiente);
});
btnCerrar.addEventListener('click', function () {
  detenerCamaraActiva();
  ocupada = false;
  actualizarBotones();
  actualizarMensajeEstado('Cámara apagada. Pistas multimedia detenidas.');
});
document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    if (streamActual || ocupada) {
      detenerCamaraActiva();
      actualizarMensajeEstado('Cámara detenida al salir de la aplicación.');
    }
  }
});
window.addEventListener('pagehide', function () {
  detenerCamaraActiva();
});

const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const instalada = window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

if (instalada) {
  installMessage.textContent = 'Ya estás usando la aplicación instalada.';
} else if (esIOS) {
  installMessage.textContent = 'En iPhone: abre esta página en Safari → Compartir → Agregar a inicio.';
} else {
  installMessage.textContent = 'En Android/Chrome, utiliza Instalar aplicación cuando esté disponible.';
}

window.addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  eventoInstalacionDiferido = event;
  if (!instalada) btnInstalar.hidden = false;
});
btnInstalar.addEventListener('click', function () {
  if (!eventoInstalacionDiferido) return;
  const prompt = eventoInstalacionDiferido;
  eventoInstalacionDiferido = null;
  btnInstalar.hidden = true;
  prompt.prompt();
  prompt.userChoice.then(function (resultado) {
    installMessage.textContent = resultado.outcome === 'accepted'
      ? 'Instalación aceptada.'
      : 'Puedes instalarla después desde el menú del navegador.';
  }).catch(function () {
    installMessage.textContent = 'No se pudo mostrar la instalación. Intenta desde el menú del navegador.';
  });
});
window.addEventListener('appinstalled', function () {
  btnInstalar.hidden = true;
  installMessage.textContent = 'Aplicación instalada.';
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function (error) {
      console.warn('No se pudo registrar el Service Worker:', error);
    });
  });
}
