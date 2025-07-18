# Guía de notificaciones

Este documento resume la comunicación por sockets y HTTP necesaria para utilizar el sistema de notificaciones del backend.

## Eventos de socket
- **notification:list**: se emite al conectarse y contiene la lista inicial.
- **notification:badge**: indica cuántas notificaciones no vistas tiene el usuario.
- **notification:new**: llega cuando el backend genera o confirma una nueva notificación.
- **notification:seen:ack**: respuesta al marcar una notificación como vista.
- **notification:get:ack**: devuelve la notificación solicitada por `uuid`. El
  frontend actualiza la tabla de notificaciones al recibir este evento.

## Crear una notificación
Envíe un `POST` a `/api/notifications` con el mismo cuerpo que se envía por el evento `crea-notificacion`.

```ts
const payload = {
  to_user_id: destinatario,
  to_company_id: null,
  tipo: 10,
  data: { ... }
};

// El backend identifica al emisor usando el token de la conexión,
// por lo que no es necesario enviar IDs del remitente.

this.http.post(`${environment.apiUrl}/api/notifications`, payload).subscribe();
this.socket.emit('crea-notificacion', payload);
```

## Marcar como vista

```ts
this.socket.emit('notification:seen', uuid);
```

Al recibir `notification:seen:ack` se actualiza el contador local.

## Obtener una notificación individual

```ts
socket.emit('notification:get', { uuid: '123' });
// Al recibir `notification:get:ack` el servicio agrega o actualiza la notificación
```
