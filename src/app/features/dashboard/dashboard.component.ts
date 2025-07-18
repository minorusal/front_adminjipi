import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SocketService } from '../../core/socket/socket.service';
import { Notificacion } from '../../core/socket/notification.types';
import { NotificationBadgeComponent } from '../../shared/components/notification-badge.component';
import { NotificationListComponent } from '../../shared/components/notification-list.component';
import { NotificationService } from '../../core/notifications/notification.service';
import { AuthFacade } from '../auth/data-access/auth.facade';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NotificationBadgeComponent,
    NotificationListComponent,
  ],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Dashboard</h2>
      <button class="btn btn-outline-secondary" (click)="logout()">Logout</button>
    </div>
    <div class="d-flex align-items-start mb-3">
      <button class="btn btn-primary me-3" (click)="createSample()">Crear Notificación</button>
      <app-notification-list class="flex-grow-1"></app-notification-list>
    </div>
    <app-notification-badge></app-notification-badge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly to_user_id = 102;

  constructor(
    private socketService: SocketService,
    private notificationService: NotificationService,
    private router: Router,
    private authFacade: AuthFacade
  ) {}

  ngOnInit(): void {
    this.socketService.connect();
    if (this.socketService.notifications$.value.length === 0) {
      this.notificationService
        .fetchList()
        .subscribe((list) => this.socketService.notifications$.next(list));
      this.notificationService
        .fetchBadge()
        .subscribe((resp) =>
          this.socketService.badge$.next(resp?.count ?? resp ?? 0)
        );
    }
  }

  createSample(): void {
    console.log('DashboardComponent: createSample clicked');
    const payload: Notificacion = {
      to_company_id: 83,
      to_user_id: this.to_user_id,
      title: 'Título de la notificación',
      body: 'Cuerpo del mensaje',
      payload: {},
      channel: 'email',
    };
    this.socketService.createNotification(payload);
  }

  logout(): void {
    this.socketService.disconnect();
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }

}
