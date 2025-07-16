import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../core/socket/socket.service';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="position-relative">
      <i class="bi bi-bell"></i>
      <span *ngIf="badge$ | async as badge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
        {{ badge }}
      </span>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBadgeComponent {
  readonly badge$ = this.socketService.badge$;
  constructor(private socketService: SocketService) {}
}
