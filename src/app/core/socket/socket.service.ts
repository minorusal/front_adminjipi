import { Injectable } from '@angular/core';
import io, { Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getCookie } from '../../shared/utils/cookies';
import {
  Notificacion,
  NotificationDelete,
  NotificationGet,
  NotificationHistory,
  NotificationListParams,
  NotificationSeen,
  NotificationUpdateStatus,
} from './notification.types';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket?: Socket;
  notifications$ = new BehaviorSubject<any[]>([]);
  badge$ = new BehaviorSubject<number>(0);

  constructor() {}

  connect(): void {
    const token = localStorage.getItem('sessionToken') || '';
    console.log('SocketService: connecting to', environment.socketUrl);
    this.socket = io(environment.socketUrl, {
      query: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
    });
    this.socket.on('connect', () =>
      console.log('SocketService: connected to socket')
    );
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

    this.socket.on('notification:list', (list) => {
      console.log('SocketService: notification:list', list);
      const arr = Array.isArray(list)
        ? list
        : Array.isArray(list?.data)
        ? list.data
        : [];
      this.notifications$.next(arr);
    });
    this.socket.on('notification:badge', (b) => {
      console.log('SocketService: notification:badge', b);
      const count = typeof b === 'number' ? b : b?.data ?? b?.count ?? 0;
      this.badge$.next(count);
    });

    this.socket.on('notification:list:ack', (resp) => {
      if (!resp?.error) {
        console.log('notification:list:ack', resp)
        const arr = Array.isArray(resp.data)
          ? resp.data
          : Array.isArray(resp?.data?.data)
          ? resp.data.data
          : [];
        this.notifications$.next(arr);
      }
    });

    this.socket.on('notification:unseen-count:ack', (resp) => {
      console.log('SocketService: notification:unseen-count:ack', resp);
      if (!resp?.error) {
        const count =
          typeof resp.data === 'number'
            ? resp.data
            : resp?.data?.data ?? resp?.data?.count ?? 0;
        this.badge$.next(count);
      }
    });

    this.socket.on('notificacion-creada', (resp) => {
      console.log('SocketService: notificacion-creada', resp);
      if (!resp?.error && resp?.data) {
        this.notifications$.next([resp.data, ...this.notifications$.value]);
        this.badge$.next(this.badge$.value + 1);
      }
    });

    this.socket.on('notification:seen:ack', (resp) => {
      console.log('SocketService: notification:seen:ack', resp);
      if (!resp?.error) {
        const uuid = resp.data;
        this.notifications$.next(
          this.notifications$.value.map((n) =>
            n.uuid === uuid ? { ...n, seen: true } : n
          )
        );
        this.badge$.next(Math.max(this.badge$.value - 1, 0));
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
      console.log('SocketService: notification:get:ack', resp);
      if (!resp?.error && resp?.data) {
        const n = resp.data;
        const exists = this.notifications$.value.some((x) => x.uuid === n.uuid);
        if (exists) {
          this.notifications$.next(
            this.notifications$.value.map((x) => (x.uuid === n.uuid ? n : x))
          );
        } else {
          this.notifications$.next([n, ...this.notifications$.value]);
        }
      }
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

  markSeen(uuid: string): void {
    console.log('SocketService: markSeen', uuid);
    this.socket?.emit('notification:seen', { uuid } as NotificationSeen);
  }

  delete(uuid: string): void {
    console.log('SocketService: delete', uuid);
    this.socket?.emit('notification:delete', { uuid } as NotificationDelete);
  }

  createNotification(payload: Notificacion): void {
    const enriched: Notificacion = {
      ...payload,
      from_company_id: Number(getCookie('from_company_id')) || 0,
      from_user_id: Number(getCookie('from_user_id')) || 0,
    };
    console.log('SocketService: createNotification', enriched);
    this.socket?.emit('crea-notificacion', enriched);
  }

  requestList(params: NotificationListParams = {}): void {
    this.socket?.emit('notification:list', params);
  }

  requestUnseenCount(): void {
    this.socket?.emit('notification:unseen-count');
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

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
    this.notifications$.next([]);
    this.badge$.next(0);
  }
}
