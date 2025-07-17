import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SocketService } from '../../core/socket/socket.service';
import { Notificacion } from '../../core/socket/notification.types';
import { NotificationBadgeComponent } from '../../shared/components/notification-badge.component';
import { NotificationTableComponent } from '../../shared/components/notification-table.component';
import { AuthFacade } from '../auth/data-access/auth.facade';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NotificationBadgeComponent,
    NotificationTableComponent,
  ],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Dashboard</h2>
      <button class="btn btn-outline-secondary" (click)="logout()">Logout</button>
    </div>
    <div class="d-flex align-items-start mb-3">
      <button class="btn btn-primary me-3" (click)="createSample()">Crear Notificación</button>
      <app-notification-table></app-notification-table>
    </div>
    <app-notification-badge></app-notification-badge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  constructor(
    private socketService: SocketService,
    private router: Router,
    private authFacade: AuthFacade
  ) {}

  ngOnInit(): void {
    this.socketService.connect();
    this.socketService.requestList();
    this.socketService.requestUnseenCount();
  }

  createSample(): void {
    console.log('DashboardComponent: createSample clicked');
    const payload: Notificacion = {
      from_company_id: 66,
      from_user_id: 84,
      to_company_id: 83,
      to_user_id: 102,
      title: 'Título de la notificación',
      body: 'Cuerpo del mensaje',
      payload: {},
      channel: 'email',
    };
    this.socketService.createNotification(payload);
  }

  logout(): void {
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }
}
