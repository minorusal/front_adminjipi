# Validación manual (QA)

Este checklist resume los pasos para verificar la funcionalidad de inicio de sesión y notificaciones.

1. **Iniciar servicios**
   - Levantar la API en `http://localhost:3000`.
   - Levantar el servidor de sockets en `http://localhost:8000`.

2. **Servir la aplicación**
   - Ejecutar `ng serve` usando el `proxy.conf.json` incluido en el proyecto.

3. **Autenticación**
   - Iniciar sesión con un usuario de prueba.
   - Al autenticarse correctamente, la app debe redirigir al *dashboard*.

4. **Notificaciones iniciales**
   - La bandeja de notificaciones y el contador (*badge*) deben cargarse de inmediato.

5. **Notificación externa**
   - Enviar un `POST` a `/api/notifications` con Postman.
   - La tarjeta aparece instantáneamente y el *badge* incrementa.

6. **Marcar como vista**
   - Al hacer clic en una tarjeta se emite el evento de "vista" y el *badge* disminuye.

7. **Eliminar notificación**
   - El botón eliminar remueve la tarjeta.
   - Si la notificación no había sido vista, el contador también disminuye.

8. **Persistencia**
   - Al recargar el navegador la lista y el *badge* se reconstruyen sin demora.
