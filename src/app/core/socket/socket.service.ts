import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket?: Socket;
  notifications$ = new BehaviorSubject<any[]>([]);
  badge$ = new BehaviorSubject<number>(0);

  connect(): void {
    const token = localStorage.getItem('sessionToken');
    this.socket = io('<URL SERVIDOR SOCKET>', {
      auth: { token },
    });

    this.socket.on('notification:list', (list) => this.notifications$.next(list));
    this.socket.on('notification:new', (n) => {
      this.notifications$.next([n, ...this.notifications$.value]);
    });
    this.socket.on('notification:badge', (b) => this.badge$.next(b));
    this.socket.on('notification:seen:ack', (uuid) => {
      this.notifications$.next(
        this.notifications$.value.map((n) =>
          n.uuid === uuid ? { ...n, seen: true } : n
        )
      );
      this.badge$.next(this.badge$.value - 1);
    });
    this.socket.on('notification:deleted', (uuid) => {
      this.notifications$.next(
        this.notifications$.value.filter((n) => n.uuid !== uuid)
      );
    });
  }

  markSeen(uuid: string): void {
    this.socket?.emit('notification:seen', uuid);
  }

  delete(uuid: string): void {
    this.socket?.emit('notification:delete', uuid);
  }
}
