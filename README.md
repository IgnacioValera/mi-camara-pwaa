# Mi Cámara PWA — Práctica Tema 6.1 y 6.2

Proyecto en JavaScript Vanilla, sin librerías y **sin `async/await`**. Las operaciones asíncronas utilizan `.then()`, `.catch()` y `.finally()`.

## Estructura
- `index.html`: interfaz, etiqueta de video y diálogo de pre-permiso.
- `styles.css`: diseño responsivo.
- `app.js`: consentimiento, MediaDevices, alternancia y liberación del sensor, instalación y registro del SW.
- `sw.js`: Cache First; precaché, limpieza de versiones y atención de solicitudes GET.
- `manifest.json`: metadatos de instalación, rutas relativas, standalone, orientación vertical e iconos.
- `icons/`: PNG reales de 192×192 y 512×512 píxeles.

## Ejecución
1. Abre la carpeta en VS Code y utiliza Live Server, o un servidor HTTP local (localhost).
2. Abre la aplicación y pulsa «Abrir cámara»; primero aparece el pre-permiso.
3. Pulsa «Continuar» y acepta el permiso del navegador.
4. Comprueba cambio de lente, apagado y detención al ocultar la página.
5. Sube **el contenido de esta carpeta** a la raíz de un repositorio en GitHub, y configura Settings → Pages → Deploy from a branch → main / (root).
6. Abre la URL HTTPS en tu móvil; en iPhone usa Safari → Compartir → Agregar a inicio.

## Pruebas y observaciones
- En Chrome DevTools → Application → Manifest verifica los iconos y `standalone`.
- En Application → Service Workers revisa si está activado; en Cache Storage busca `mi-camara-pwa-v2`.
- Primero visita la página conectado, después desactiva la red y vuelve a cargar para probar los archivos precacheados.
- **No se toman, guardan ni envían fotos.** La cámara se controla directamente desde `app.js`; `sw.js` no accede al hardware.
- **No hay SyncManager ni evento `sync`:** la práctica no envía publicaciones a ningún backend.
- La selección frontal/trasera depende del hardware y los permisos del navegador.
- Cache First puede mostrar versiones antiguas hasta que se active el SW actualizado. Al sustituir una versión antigua, se cambió de nombre de archivo `service-worker.js` a `sw.js`; para una migración limpia, se recomienda desregistrar el worker anterior desde DevTools → Application → Service Workers y borrar la caché antigua una vez en el navegador de prueba.
