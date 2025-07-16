import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../core/socket/socket.service';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ul>
      <li *ngFor="let n of notifications$ | async">
        <span [class.fw-bold]="!n.seen">{{ n.title }} - {{ n.date }}</span>
        <button (click)="markSeen(n.uuid)" class="btn btn-sm btn-link">Marcar vista</button>
        <button (click)="delete(n.uuid)" class="btn btn-sm btn-link text-danger">Eliminar</button>
      </li>
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationListComponent {
  readonly notifications$ = this.socketService.notifications$;
  constructor(private socketService: SocketService) {}

  markSeen(uuid: string): void {
    this.socketService.markSeen(uuid);
  }

  delete(uuid: string): void {
    this.socketService.delete(uuid);
  }
}
