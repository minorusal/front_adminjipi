import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
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

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket?: Socket;
  notifications$ = new BehaviorSubject<any[]>([]);
  badge$ = new BehaviorSubject<number>(0);

  constructor() {}

  connect(): void {
    const token = localStorage.getItem('sessionToken') || '';
    this.socket = io(environment.socketUrl, {
      query: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
    });
    this.registerHandlers();
  }

  /**
   * Registers all socket listeners. Extracted for easier testing.
   */
  private registerHandlers(): void {
    if (!this.socket) {
      return;
    }

    this.socket.on('notification:list', (list) => this.notifications$.next(list));
    this.socket.on('notification:badge', (b) => this.badge$.next(b));

    this.socket.on('notification:list:ack', (resp) => {
      if (!resp?.error) {
        this.notifications$.next(resp.data);
      }
    });

    this.socket.on('notification:unseen-count:ack', (resp) => {
      if (!resp?.error) {
        this.badge$.next(resp.data);
      }
    });

    this.socket.on('notificacion-creada', (resp) => {
      if (!resp?.error && resp?.data) {
        this.notifications$.next([resp.data, ...this.notifications$.value]);
        this.badge$.next(this.badge$.value + 1);
      }
    });

    this.socket.on('notification:seen:ack', (resp) => {
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
      if (!resp?.error) {
        this.notifications$.next(
          this.notifications$.value.map((n) =>
            n.uuid === resp.data.uuid ? { ...n, status: resp.data.status } : n
          )
        );
      }
    });

    this.socket.on('notification:delete:ack', (resp) => {
      if (!resp?.error) {
        const uuid = resp.data;
        this.notifications$.next(
          this.notifications$.value.filter((n) => n.uuid !== uuid)
        );
      }
    });

    this.socket.on('notification:deleted', (uuid) => {
      this.notifications$.next(
        this.notifications$.value.filter((n) => n.uuid !== uuid)
      );
    });

    this.socket.on('notification:get:ack', (resp) => {
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
    this.registerHandlers();
  }

  markSeen(uuid: string): void {
    this.socket?.emit('notification:seen', { uuid } as NotificationSeen);
  }

  delete(uuid: string): void {
    this.socket?.emit('notification:delete', { uuid } as NotificationDelete);
  }

  createNotification(payload: Notificacion): void {
    this.socket?.emit('crea-notificacion', payload);
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
}
