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

  getCurrentIds() {
    const cookie = getCookie('payload');
    if (cookie) {
      try {
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
    console.log('SocketService: connecting to', environment.socketUrl);
    this.socket = io(environment.socketUrl, {
      query: { token },
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

    this.socket.on('notification:list', (payload) => {
      console.log('SocketService: notification:list', payload);
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
      this.notifications$.next(arr);
      const badge =
        typeof payload?.badge === 'number'
          ? payload.badge
          : typeof payload?.data?.badge === 'number'
          ? payload.data.badge
          : undefined;
      if (typeof badge === 'number') {
        this.badge$.next(badge);
      }
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
          : Array.isArray(resp?.data?.results)
          ? resp.data.results
          : Array.isArray(resp?.data?.list)
          ? resp.data.list
          : Array.isArray(resp?.results)
          ? resp.results
          : Array.isArray(resp?.list)
          ? resp.list
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

    this.socket.on('notification:new', (resp) => {
      console.log('SocketService: notification:new', resp);
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
      this.refresh();
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
      this.refresh();
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
    const ids = this.getCurrentIds();
    const fullPayload = {
      ...payload,
      from_user_id: ids.user_id,
      from_company_id: ids.company_id,
    };
    console.log('SocketService: createNotification', fullPayload);
    this.socket?.emit('crea-notificacion', fullPayload);
  }

  requestList(params: NotificationListParams = {}): void {
    this.socket?.emit('notification:list', params);
  }

  requestUnseenCount(to_user_id: number): void {
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
    this.notificationService.fetchList(1, 10).subscribe((list) => {
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
