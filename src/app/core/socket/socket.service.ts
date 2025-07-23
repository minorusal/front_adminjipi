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
    this.socket = io(environment.socketUrl, {
      query: { token },
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
          company_id: currentIds.company_id  // ← OBLIGATORIO para company room
        }, (response: any) => {
          console.log('✅ Usuario configurado en company room:', response);
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
      this.notifications$.next(notifications);
      
      if (typeof data?.notSeen === 'number') {
        this.badge$.next(data.notSeen);
      }
    });

    // 4. Confirmación de marcado como leída
    this.socket.on('notification-read-success', (data) => {
      console.log('✅ NOTIFICACIÓN MARCADA COMO LEÍDA:', data);
      console.log('✅ TIPO DE DATA:', typeof data);
      console.log('✅ ESTRUCTURA COMPLETA DE LA RESPUESTA:', JSON.stringify(data, null, 2));
      console.log('✅ UUID DE LA NOTIFICACIÓN MARCADA:', data?.notificationUuid);
      console.log('✅ USUARIO QUE LA MARCÓ:', data?.userId);
      console.log('✅ TIMESTAMP:', data?.timestamp || new Date().toISOString());
      
      // Actualizar la notificación en la lista local
      const currentNotifications = this.notifications$.value;
      console.log('✅ NOTIFICACIONES ANTES DE ACTUALIZAR:', currentNotifications.length);
      
      const updatedNotifications = currentNotifications.map(n => {
        if (n.uuid === data.notificationUuid) {
          console.log('✅ ENCONTRADA NOTIFICACIÓN A ACTUALIZAR:', n.uuid);
          return { ...n, is_read: true, read_at: new Date().toISOString() };
        }
        return n;
      });
      
      console.log('✅ NOTIFICACIONES DESPUÉS DE ACTUALIZAR:', updatedNotifications.length);
      this.notifications$.next(updatedNotifications);
      
      // Actualizar badge
      const unseenCount = updatedNotifications.filter(n => !n.is_read).length;
      console.log('✅ NUEVO CONTADOR DE NO LEÍDAS:', unseenCount);
      this.badge$.next(unseenCount);
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

    // COMPATIBILIDAD: Mantener listeners antiguos por si acaso
    this.socket.on('notification:list', (payload) => {
      console.log('🔔 RESPUESTA notification:list RECIBIDA:', payload);
      console.log('🔔 TIPO DE PAYLOAD:', typeof payload);
      console.log('🔔 ES ARRAY?:', Array.isArray(payload));
      if (payload && typeof payload === 'object') {
        console.log('🔔 KEYS DEL PAYLOAD:', Object.keys(payload));
      }
      
      const arr = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data?.list)
        ? payload.data.list
        : Array.isArray(payload?.list)
        ? payload.list
        : Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload?.data?.results)
        ? payload.data.results
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
        
      console.log('🔔 ARRAY EXTRAÍDO:', arr);
      console.log('🔔 LONGITUD DEL ARRAY:', arr.length);
      
      this.notifications$.next(arr);
      console.log('🔔 BEHAVIORSUBJECT ACTUALIZADO. VALOR ACTUAL:', this.notifications$.value);
      console.log('🔔 ⚠️ ATENCIÓN: notification:list SOBRESCRIBIÓ LA LISTA CON', arr.length, 'elementos');
      const badge =
        typeof payload?.badge === 'number'
          ? payload.badge
          : typeof payload?.data?.badge === 'number'
          ? payload.data.badge
          : undefined;
      if (typeof badge === 'number') {
        console.log('🔔 BADGE ACTUALIZADO A:', badge);
        this.badge$.next(badge);
      }
    });
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

    this.socket.on('notification:seen:ack', (resp) => {
      console.log('📤 SISTEMA ANTIGUO notification:seen:ack:', resp);
      if (!resp?.error) {
        console.log('✅ SISTEMA ANTIGUO: Notificación marcada como vista exitosamente');
        const uuid = resp.data;
        this.notifications$.next(
          this.notifications$.value.map((n) =>
            n.uuid === uuid ? { ...n, seen: true, visto: 1 } : n
          )
        );
        const currentBadge = typeof this.badge$.value === 'number' ? this.badge$.value : 0;
        this.badge$.next(Math.max(currentBadge - 1, 0));
      } else {
        console.warn('⚠️ SISTEMA ANTIGUO: Error al marcar como vista:', resp.error);
        console.warn('⚠️ Esto es normal para notificaciones temporales o del nuevo sistema');
      }
    });

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
    
    // Agregar callback para capturar respuesta inmediata si existe
    this.socket?.emit('mark-notification-read', {
      notificationUuid,
      userId: finalUserId
    }, (response: any) => {
      console.log('📤 RESPUESTA INMEDIATA al marcar como leída:', response);
      console.log('📤 TIPO DE RESPUESTA:', typeof response);
      console.log('📤 ESTRUCTURA COMPLETA:', JSON.stringify(response, null, 2));
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

  // COMPATIBILIDAD: Mantener método antiguo
  markSeen(uuid: string): void {
    console.log('⚠️ SISTEMA ANTIGUO: markSeen', uuid);
    this.socket?.emit('notification:seen', { uuid } as NotificationSeen);
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
      limit
    });
    
    this.socket?.emit('get-notifications-for-user', {
      userId: finalUserId,
      companyId: finalCompanyId,
      page,
      limit
    });
  }

  // COMPATIBILIDAD: Mantener método antiguo
  requestList(params: NotificationListParams = {}): void {
    const defaults: NotificationListParams = {
      from_company_id: Number(getCookie('from_company_id')),
      from_user_id: Number(getCookie('from_user_id')),
    };
    const finalParams = { ...defaults, ...params };
    console.log('⚠️ SISTEMA ANTIGUO: notification:list con:', finalParams);
    this.socket?.emit('notification:list', finalParams);
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
