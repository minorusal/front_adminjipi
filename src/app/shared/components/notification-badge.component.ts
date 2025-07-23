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
        {{ getBadgeNumber(badge) }}
      </span>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBadgeComponent {
  readonly badge$ = this.socketService.badge$;
  constructor(private socketService: SocketService) {}

  getBadgeNumber(badge: any): number {
    console.log('🔴 BADGE RECIBIDO EN COMPONENTE:', badge, 'TIPO:', typeof badge);
    
    if (typeof badge === 'number') {
      return badge;
    }
    
    if (typeof badge === 'string') {
      const parsed = parseInt(badge, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    if (typeof badge === 'object' && badge !== null) {
      console.warn('🔴 BADGE ES OBJETO:', badge);
      // Intentar extraer número del objeto
      return badge?.count || badge?.data || badge?.value || 0;
    }
    
    return 0;
  }
}
