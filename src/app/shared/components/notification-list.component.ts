import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../core/socket/socket.service';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngFor="let n of notifications$ | async" class="card mb-2">
      <div class="card-body">
        <div class="d-flex justify-content-between">
          <h5 class="card-title mb-1">
            {{ n.title }}
            <span *ngIf="!n.seen" class="badge text-bg-secondary ms-2">no vista</span>
          </h5>
          <small>{{ n.date }}</small>
        </div>
        <p class="card-text">{{ n.body }}</p>
        <button (click)="markSeen(n.uuid)" class="btn btn-sm btn-link me-2">Marcar vista</button>
        <button (click)="delete(n.uuid)" class="btn btn-sm btn-link text-danger">Eliminar</button>
      </div>
    </div>
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
