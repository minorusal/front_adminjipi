import { Injectable } from '@angular/core';
import io, { Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Notificacion,
  NotificationDelete,
  NotificationGet,
  NotificationHistory,
  NotificationListParams,
  NotificationSeen,
  NotificationUpdateStatus,
} from './notification.types';
import { getIdsFromToken } from '../../shared/utils/token';
import { getCookie } from '../../shared/utils/cookies';
import { NotificationService } from '../notifications/notification.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket?: Socket;
  notifications$ = new BehaviorSubject<any[]>([]);
  badge$ = new BehaviorSubject<number>(0);
  private lastNotificationReceived = 0; // Timestamp de última notificación recibida

  getCurrentIds() {
    const cookie = getCookie('payload');
    if (cookie) {
      try {
        console.log(cookie)
        return JSON.parse(cookie);
      } catch {
        // ignore parse errors
      }
    }
    const stored = localStorage.getItem('payload');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    const token = localStorage.getItem('sessionToken') || '';
    return getIdsFromToken(token);
  }

  constructor(private notificationService?: NotificationService) {}

  connect(): void {
    const token = localStorage.getItem('sessionToken') || '';
    const currentIds = this.getCurrentIds();
    console.log('SocketService: connecting to', environment.socketUrl);
    console.log('SocketService: usuario conectándose:', currentIds);
    console.log('🔑 TOKEN AL CONECTAR:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenStart: token ? token.substring(0, 20) + '...' : 'NO TOKEN'
    });
    
    this.socket = io(environment.socketUrl, {
      query: { token },
      auth: { token }, // ← AGREGAR TAMBIÉN EN AUTH
      extraHeaders: {
        'Authorization': `Bearer ${token}` // ← Y EN HEADERS
      }
    });
    this.socket.on('connect', () => {
      console.log('SocketService: connected to socket');
      console.log('SocketService: socket ID:', this.socket?.id);
      
      // Configurar usuario después de conectar (NUEVO SISTEMA)
      const currentIds = this.getCurrentIds();
      if (currentIds?.user_id && currentIds?.company_id) {
        console.log('🔧 NUEVO SISTEMA: Configurando usuario con:', currentIds);
        this.socket?.emit('configurar-usuario', {
          usuarioId: currentIds.user_id,
          company_id: currentIds.company_id,  // ← OBLIGATORIO para company room
          // Agregar token también aquí
          token: token,
          sessionToken: token,
          auth: token
        }, (response: any) => {
          console.log('✅ Usuario configurado en company room:', response);
          console.log('✅ ESTRUCTURA RESPUESTA CONFIGURAR-USUARIO:', JSON.stringify(response, null, 2));
          
          // SOLICITAR FORMATO EXTENDIDO DE NOTIFICACIONES
          setTimeout(() => {
            console.log('🔧 SOLICITANDO FORMATO EXTENDIDO DE NOTIFICACIONES...');
            this.requestReadStatusInNotifications();
          }, 1000); // Esperar 1 segundo después de configurar usuario
        });
      } else {
        console.error('❌ No se pudo configurar usuario - IDs no disponibles:', currentIds);
      }
    });
    this.socket.on('connect_error', (err) =>
      console.error('SocketService: connection error', err)
    );
    this.registerHandlers();
  }

  /**
   * Registers all socket listeners. Extracted for easier testing.
   */
  private registerHandlers(): void {
    if (!this.socket) {
      return;
    }
    
    // ESCUCHAR TODOS LOS EVENTOS PARA DEBUG
    const originalEmit = this.socket.emit;
    this.socket.emit = function(event: string, ...args: any[]) {
      console.log('📤 ENVIANDO EVENTO:', event, args);
      return originalEmit.apply(this, [event, ...args]);
    };
    
    // NUEVO SISTEMA: Listeners específicos para notificaciones tipo Facebook
    console.log('📥 NUEVO SISTEMA: Registrando listeners para notificaciones tipo Facebook');

    // 2. Escuchar Nueva Notificación para toda la empresa
    this.socket.on('new-notification', (notification) => {
      console.log('🔔 NUEVA NOTIFICACIÓN PARA EMPRESA:', notification);
      
      // Actualizar contador personal
      const currentIds = this.getCurrentIds();
      if (currentIds?.user_id && currentIds?.company_id) {
        console.log('🔢 Solicitando contador actualizado para user:', currentIds.user_id);
        this.socket?.emit('get-unseen-count', {
          userId: currentIds.user_id,
          companyId: currentIds.company_id
        });
      }
    });

    // 3. Recibir lista de notificaciones personalizada por usuario
    this.socket.on('notifications-list-updated', (data) => {
      console.log('📋 LISTA DE NOTIFICACIONES ACTUALIZADA:', data);
      console.log('📋 Notificaciones:', data?.notifications?.length || 0);
      console.log('📋 No vistas:', data?.notSeen || 0);
      
      const notifications = Array.isArray(data?.notifications) ? data.notifications : [];
      
      // VERIFICAR ESTRUCTURA DE NOTIFICACIONES
      if (notifications.length > 0) {
        console.log('📋 ESTRUCTURA DE LA PRIMERA NOTIFICACIÓN:', notifications[0]);
        console.log('📋 CAMPOS DISPONIBLES:', Object.keys(notifications[0]));
        console.log('📋 TIENE is_read?:', 'is_read' in notifications[0]);
        console.log('📋 TIENE visto?:', 'visto' in notifications[0]);
        console.log('📋 VALOR is_read:', notifications[0].is_read);
        console.log('📋 VALOR visto:', notifications[0].visto);
      }
      
      // NORMALIZAR ESTADO DE LECTURA: convertir 'visto' a 'is_read' si no existe
      const normalizedNotifications = notifications.map(notification => {
        if (notification.is_read === undefined && notification.visto !== undefined) {
          console.log('📋 NORMALIZANDO is_read para:', notification.uuid, 'visto:', notification.visto);
          return {
            ...notification,
            is_read: notification.visto === 1 || notification.visto === true
          };
        }
        return notification;
      });
      
      console.log('📋 NOTIFICACIONES NORMALIZADAS (primera):', normalizedNotifications[0]);
      this.notifications$.next(normalizedNotifications);
      
      if (typeof data?.notSeen === 'number') {
        this.badge$.next(data.notSeen);
      }
    });

    // 4. Confirmación de marcado como leída
    this.socket.on('notification-read-success', (data) => {
      console.log('✅ NOTIFICACIÓN MARCADA COMO LEÍDA:', data);
      console.log('✅ ESTRUCTURA COMPLETA:', JSON.stringify(data, null, 2));
      
      // Actualizar la notificación en la lista local
      const currentNotifications = this.notifications$.value;
      const updatedNotifications = currentNotifications.map(n => {
        if (n.uuid === data.notificationUuid) {
          console.log('✅ ACTUALIZANDO NOTIFICACIÓN:', n.uuid);
          return { 
            ...n, 
            is_read: true, 
            visto: 1, // También mantener compatibilidad
            read_at: data.readAt || new Date().toISOString() 
          };
        }
        return n;
      });
      
      this.notifications$.next(updatedNotifications);
    });

    // 5. Actualización del contador de no leídas
    this.socket.on('unseen-count-updated', (data) => {
      console.log('🔢 CONTADOR ACTUALIZADO:', data);
      console.log('🔢 NUEVO CONTADOR:', data.notSeenCount);
      
      if (typeof data.notSeenCount === 'number') {
        this.badge$.next(data.notSeenCount);
      }
    });

    // 5. Confirmación de marcar todas como leídas
    this.socket.on('all-notifications-read-success', (data) => {
      console.log('✅ TODAS LAS NOTIFICACIONES MARCADAS COMO LEÍDAS:', data);
      // Actualizar todas las notificaciones como leídas
      const currentNotifications = this.notifications$.value;
      const updatedNotifications = currentNotifications.map(n => ({ 
        ...n, 
        is_read: true, 
        read_at: new Date().toISOString() 
      }));
      this.notifications$.next(updatedNotifications);
      this.badge$.next(0);
    });

    // ❌ SISTEMA ANTIGUO ELIMINADO - Ya no usamos notification:list
    this.socket.on('notification:badge', (b) => {
      console.log('🔢 BADGE RECIBIDO - notification:badge:', b);
      console.log('🔢 TIPO DE B:', typeof b);
      console.log('🔢 ESTRUCTURA COMPLETA:', JSON.stringify(b, null, 2));
      const count = typeof b === 'number' ? b : b?.data ?? b?.count ?? 0;
      console.log('🔢 COUNT CALCULADO:', count);
      this.badge$.next(count);
    });

    this.socket.on('notification:list:ack', (resp) => {
      console.log('🔔 RESPUESTA notification:list:ack RECIBIDA:', resp);
      
      // Verificar si acabamos de recibir una notificación nueva (últimos 3 segundos)
      const timeSinceLastNotification = Date.now() - this.lastNotificationReceived;
      console.log('🔔 TIEMPO DESDE ÚLTIMA NOTIFICACIÓN:', timeSinceLastNotification, 'ms');
      
      if (timeSinceLastNotification < 3000) {
        console.log('🔔 ⚠️ IGNORANDO notification:list:ack - ACABAMOS DE RECIBIR UNA NOTIFICACIÓN NUEVA');
        console.log('🔔 ⚠️ ESTO PREVIENE QUE SE SOBRESCRIBA LA LISTA CON DATOS DESACTUALIZADOS');
        return;
      }
      
      if (!resp?.error) {
        console.log('🔔 SIN ERROR, PROCESANDO RESPUESTA ACK');
        console.log('🔔 RESP COMPLETO:', JSON.stringify(resp, null, 2));
        
        const arr = Array.isArray(resp.data)
          ? resp.data
          : Array.isArray(resp?.data?.data?.notifications)
          ? resp.data.data.notifications
          : Array.isArray(resp?.data?.data)
          ? resp.data.data
          : Array.isArray(resp?.data?.results)
          ? resp.data.results
          : Array.isArray(resp?.data?.list)
          ? resp.data.list
          : Array.isArray(resp?.results)
          ? resp.results
          : Array.isArray(resp?.list)
          ? resp.list
          : [];
          
        console.log('🔔 ARRAY EXTRAÍDO DE ACK:', arr);
        console.log('🔔 LONGITUD DEL ARRAY ACK:', arr.length);
        
        this.notifications$.next(arr);
        console.log('🔔 BEHAVIORSUBJECT ACK ACTUALIZADO. VALOR ACTUAL:', this.notifications$.value);
        console.log('🔔 ⚠️ ATENCIÓN: notification:list:ack SOBRESCRIBIÓ LA LISTA CON', arr.length, 'elementos');
        
        // Calcular badge basado en notificaciones no vistas
        const unseenCount = arr.filter(n => n.visto === 0 || n.visto === false || !n.visto).length;
        console.log('🔢 CALCULANDO BADGE DESDE LISTA: total=', arr.length, 'no vistas=', unseenCount);
        this.badge$.next(unseenCount);
      } else {
        console.log('🔔 ERROR EN notification:list:ack:', resp.error);
      }
    });

    this.socket.on('notification:unseen-count:ack', (resp) => {
      console.log('🔢 UNSEEN COUNT ACK RECIBIDO:', resp);
      console.log('🔢 TIPO DE RESP:', typeof resp);
      console.log('🔢 ESTRUCTURA COMPLETA:', JSON.stringify(resp, null, 2));
      if (!resp?.error) {
        const count =
          typeof resp.data === 'number'
            ? resp.data
            : resp?.data?.data ?? resp?.data?.count ?? 0;
        console.log('🔢 COUNT CALCULADO EN UNSEEN-COUNT:', count);
        this.badge$.next(count);
      } else {
        console.log('🔢 ERROR EN UNSEEN-COUNT:', resp.error);
      }
    });

    this.socket.on('notification:new', (resp) => {
      console.log('🆕 NUEVA NOTIFICACIÓN RECIBIDA:', resp);
      console.log('🆕 TIPO DE RESPUESTA:', typeof resp);
      console.log('🆕 TIENE ERROR?:', resp?.error);
      console.log('🆕 TIENE DATA?:', !!resp?.data);
      
      if (!resp?.error && resp?.data) {
        console.log('🆕 AGREGANDO NUEVA NOTIFICACIÓN AL INICIO DE LA LISTA');
        const currentNotifications = this.notifications$.value;
        
        // Completar datos faltantes en la nueva notificación
        const enhancedNotification = {
          ...resp.data,
          uuid: resp.data.uuid || `temp_${Date.now()}`, // UUID temporal si no existe
          created_at: resp.data.created_at || new Date().toISOString(),
          updated_at: resp.data.updated_at || new Date().toISOString(),
          visto: resp.data.visto !== undefined ? resp.data.visto : 0, // Sistema antiguo
          is_read: resp.data.is_read !== undefined ? resp.data.is_read : false, // Sistema nuevo
          status: resp.data.status || 'received'
        };
        
        console.log('🆕 UUID DE LA NOTIFICACIÓN:', enhancedNotification.uuid);
        console.log('🆕 ¿ES TEMPORAL?:', enhancedNotification.uuid.startsWith('temp_'));
        
        const newNotifications = [enhancedNotification, ...currentNotifications];
        console.log('🆕 LISTA ANTERIOR LONGITUD:', currentNotifications.length);
        console.log('🆕 LISTA NUEVA LONGITUD:', newNotifications.length);
        console.log('🆕 NUEVA NOTIFICACIÓN (datos completados):', enhancedNotification);
        console.log('🆕 CAMPOS COMPLETADOS:', Object.keys(enhancedNotification));
        
        this.notifications$.next(newNotifications);
        const currentBadge = typeof this.badge$.value === 'number' ? this.badge$.value : 0;
        this.badge$.next(currentBadge + 1);
        
        // Marcar timestamp de última notificación recibida
        this.lastNotificationReceived = Date.now();
        
        console.log('🆕 BEHAVIORSUBJECT ACTUALIZADO CON NUEVA NOTIFICACIÓN');
        console.log('🆕 VALOR ACTUAL DEL BEHAVIORSUBJECT:', this.notifications$.value);
        console.log('🆕 TIMESTAMP NOTIFICACIÓN:', this.lastNotificationReceived);
        
        // Verificar en 2 segundos si la lista sigue intacta
        setTimeout(() => {
          console.log('🆕 VERIFICACIÓN 2s DESPUÉS - LISTA ACTUAL:', this.notifications$.value.length);
          if (this.notifications$.value.length === 0) {
            console.error('🆕 ❌ LA LISTA SE VACIÓ DESPUÉS DE AGREGAR NOTIFICACIÓN!');
          }
        }, 2000);
      } else {
        console.log('🆕 NO SE AGREGÓ LA NOTIFICACIÓN - ERROR O SIN DATA');
      }
    });

    // ❌ SISTEMA ANTIGUO ELIMINADO - Ya no usamos notification:seen:ack

    this.socket.on('notification:update-status:ack', (resp) => {
      console.log('SocketService: notification:update-status:ack', resp);
      if (!resp?.error) {
        this.notifications$.next(
          this.notifications$.value.map((n) =>
            n.uuid === resp.data.uuid ? { ...n, status: resp.data.status } : n
          )
        );
      }
    });

    this.socket.on('notification:delete:ack', (resp) => {
      console.log('SocketService: notification:delete:ack', resp)
      if (!resp?.error) {
        const uuid = resp.data;
        this.notifications$.next(
          this.notifications$.value.filter((n) => n.uuid !== uuid)
        );
      }
    });

    this.socket.on('notification:deleted', (uuid) => {
      console.log('SocketService: notification:deleted', uuid);
      this.notifications$.next(
        this.notifications$.value.filter((n) => n.uuid !== uuid)
      );
    });

    this.socket.on('notification:get:ack', (resp) => {
      console.log('🔍 notification:get:ack RECIBIDO - DESHABILITADO TEMPORALMENTE');
      console.log('🔍 Evitando duplicados y problemas de matching');
      // DESHABILITADO: Este evento está causando problemas de duplicados
      // Las notificaciones nuevas llegarán via notification:new y las existentes via notification:list:ack
    });

    // LISTENER GENÉRICO para capturar respuestas de estado de lectura
    this.socket.on('get-notification-read-status-response', (data) => {
      console.log('🔍 RESPUESTA get-notification-read-status-response:', data);
      console.log('🔍 ESTRUCTURA:', JSON.stringify(data, null, 2));
    });
    
    this.socket.on('notification-read-status', (data) => {
      console.log('🔍 RESPUESTA notification-read-status:', data);
      console.log('🔍 ESTRUCTURA:', JSON.stringify(data, null, 2));
    });

    // LISTENER para respuesta de marcar como leída (posibles nombres)
    this.socket.on('mark-notification-read-response', (data) => {
      console.log('📤 RESPUESTA mark-notification-read-response:', data);
      console.log('📤 ESTRUCTURA:', JSON.stringify(data, null, 2));
    });
    
    this.socket.on('mark-notification-read-ack', (data) => {
      console.log('📤 RESPUESTA mark-notification-read-ack:', data);
      console.log('📤 ESTRUCTURA:', JSON.stringify(data, null, 2));
    });

    // LISTENER para errores de eventos no reconocidos
    this.socket.on('error', (error) => {
      console.log('❌ ERROR DEL SOCKET:', error);
      console.log('❌ TIPO DE ERROR:', typeof error);
      console.log('❌ ESTRUCTURA COMPLETA:', JSON.stringify(error, null, 2));
    });

    this.socket.on('connect_error', (error) => {
      console.log('❌ CONNECT ERROR:', error);
      console.log('❌ TIPO DE CONNECT ERROR:', typeof error);
    });
  }

  /**
   * Allows injecting a mock socket when running tests.
   */
  setSocketForTesting(socket: Pick<Socket, 'on' | 'emit'>): void {
    this.socket = socket as Socket;
    this.socket.on('connect', () =>
      console.log('SocketService: connected to socket')
    );
    this.socket.on('connect_error', (err) =>
      console.error('SocketService: connection error', err)
    );
    this.registerHandlers();
  }

  // NUEVO SISTEMA: 4. Marcar Como Leída (individual)
  markNotificationRead(notificationUuid: string, userId?: number): void {
    const currentIds = this.getCurrentIds();
    const finalUserId = userId || currentIds?.user_id;
    
    console.log('✅ NUEVO SISTEMA: Marcando como leída:', {
      notificationUuid,
      userId: finalUserId
    });
    
    // SOLO usar el nuevo sistema - payload simplificado
    this.socket?.emit('mark-notification-read', {
      notificationUuid,
      userId: finalUserId
    });
  }

  // NUEVO SISTEMA: 5. Marcar Todas Como Leídas
  markAllNotificationsRead(userId?: number, companyId?: number): void {
    const currentIds = this.getCurrentIds();
    const finalUserId = userId || currentIds?.user_id;
    const finalCompanyId = companyId || currentIds?.company_id;
    
    console.log('✅ NUEVO SISTEMA: Marcando TODAS como leídas:', {
      userId: finalUserId,
      companyId: finalCompanyId
    });
    
    this.socket?.emit('mark-all-notifications-read', {
      userId: finalUserId,
      companyId: finalCompanyId
    });
  }

  // ❌ MÉTODO DEPRECADO - Redirige al nuevo sistema por compatibilidad  
  /** @deprecated Use markNotificationRead() instead */
  markSeen(uuid: string): void {
    console.warn('⚠️ MÉTODO DEPRECADO: markSeen() - Use markNotificationRead() en su lugar');
    this.markNotificationRead(uuid);
  }

  delete(uuid: string): void {
    console.log('SocketService: delete', uuid);
    this.socket?.emit('notification:delete', { uuid } as NotificationDelete);
  }

  createNotification(payload: Notificacion): void {
    const fullPayload = {
      ...payload,
      from_company_id: Number(getCookie('from_company_id')),
      from_user_id: Number(getCookie('from_user_id')),
    };
    console.log('SocketService: createNotification', fullPayload);
    this.socket?.emit('crea-notificacion', fullPayload);
  }

  // NUEVO SISTEMA: 3. Cargar Lista Personal
  requestUserNotifications(userId?: number, companyId?: number, page = 1, limit = 10): void {
    const currentIds = this.getCurrentIds();
    const finalUserId = userId || currentIds?.user_id;
    const finalCompanyId = companyId || currentIds?.company_id;
    
    console.log('📋 NUEVO SISTEMA: Solicitando notificaciones para usuario:', {
      userId: finalUserId,
      companyId: finalCompanyId,
      page,
      limit,
      includeReadStatus: true // ← PEDIMOS EXPLÍCITAMENTE EL ESTADO DE LECTURA
    });
    
    this.socket?.emit('get-notifications-for-user', {
      userId: finalUserId,
      companyId: finalCompanyId,
      page,
      limit,
      includeReadStatus: true // ← NUEVO PARÁMETRO
    }, (response: any) => {
      console.log('📋 RESPUESTA get-notifications-for-user:', response);
      console.log('📋 TIPO DE RESPUESTA:', typeof response);
      console.log('📋 ESTRUCTURA COMPLETA:', JSON.stringify(response, null, 2));
    });
  }

  // ❌ MÉTODO DEPRECADO - Redirige al nuevo sistema por compatibilidad
  /** @deprecated Use requestUserNotifications() instead */
  requestList(params: any = {}): void {
    console.warn('⚠️ MÉTODO DEPRECADO: requestList() - Use requestUserNotifications() en su lugar');
    this.requestUserNotifications();
  }

  requestUnseenCount(to_user_id: number): void {
    console.log('🔢 SOLICITANDO UNSEEN COUNT PARA USER:', to_user_id);
    this.socket?.emit('notification:unseen-count', { to_user_id });
  }

  updateStatus(payload: NotificationUpdateStatus): void {
    this.socket?.emit('notification:update-status', payload);
  }

  history(payload: NotificationHistory): void {
    this.socket?.emit('notification:history', payload);
  }

  getNotification(payload: NotificationGet): void {
    this.socket?.emit('notification:get', payload);
  }

  // MÉTODO DEBUG: Solicitar estado de lectura específico de una notificación
  debugNotificationReadStatus(notificationUuid: string, userId?: number): void {
    const currentIds = this.getCurrentIds();
    const finalUserId = userId || currentIds?.user_id;
    
    console.log('🔍 DEBUG: Solicitando estado de lectura para:', {
      notificationUuid,
      userId: finalUserId
    });
    
    this.socket?.emit('get-notification-read-status', {
      notificationUuid,
      userId: finalUserId
    }, (response: any) => {
      console.log('🔍 DEBUG: Respuesta estado de lectura:', response);
      console.log('🔍 DEBUG: Estructura completa:', JSON.stringify(response, null, 2));
    });
  }

  // MÉTODO: Solicitar al socket que incluya is_read en todas las notificaciones
  requestReadStatusInNotifications(): void {
    const currentIds = this.getCurrentIds();
    
    console.log('🔧 SOLICITANDO AL SOCKET INCLUIR is_read EN NOTIFICACIONES');
    
    this.socket?.emit('configure-notification-format', {
      userId: currentIds?.user_id,
      companyId: currentIds?.company_id,
      includeReadStatus: true,
      includeFields: ['is_read', 'read_at', 'visto']
    }, (response: any) => {
      console.log('🔧 RESPUESTA configure-notification-format:', response);
      console.log('🔧 ESTRUCTURA:', JSON.stringify(response, null, 2));
    });
  }

  // MÉTODO DEBUG: Probar autenticación del socket
  testSocketAuth(): void {
    const currentIds = this.getCurrentIds();
    const token = localStorage.getItem('sessionToken') || '';
    
    console.log('🔐 PROBANDO AUTENTICACIÓN DEL SOCKET...');
    
    this.socket?.emit('test-auth', {
      userId: currentIds?.user_id,
      companyId: currentIds?.company_id,
      token: token,
      sessionToken: token,
      auth: token
    }, (response: any) => {
      console.log('🔐 RESPUESTA test-auth:', response);
      console.log('🔐 ESTRUCTURA:', JSON.stringify(response, null, 2));
    });
  }

  private refresh(): void {
    if (!this.notificationService) {
      return;
    }
    this.notificationService
      .fetchList()
      .subscribe((list) => {
        this.notifications$.next(list as any[]);
      });
    this.notificationService
      .fetchBadge()
      .subscribe((count) => this.badge$.next(Number(count)));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
    this.notifications$.next([]);
    this.badge$.next(0);
  }
}
