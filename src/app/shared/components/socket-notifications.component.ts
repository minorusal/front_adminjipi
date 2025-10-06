import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SocketService } from '../../core/socket/socket.service';
import { Notificacion } from '../../core/socket/notification.types';
import { NotificationBadgeComponent } from './notification-badge.component';
import { NotificationListComponent } from './notification-list.component';
import { NotificationService } from '../../core/notifications/notification.service';
import { AuthFacade } from '../../features/auth/data-access/auth.facade';

@Component({
  selector: 'app-socket-notifications',
  standalone: true,
  imports: [
    CommonModule,
    NotificationBadgeComponent,
    NotificationListComponent,
  ],
  template: `
    <div class="notifications-container">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">Sistema de Notificaciones</h2>
        <div class="d-flex align-items-center gap-3">
          <app-notification-badge></app-notification-badge>
          <button class="btn btn-outline-secondary" (click)="logout()">
            <i class="fas fa-sign-out-alt me-2"></i>Logout
          </button>
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <div class="d-flex align-items-center mb-3">
            <button class="btn btn-success" (click)="createSample()">
              <i class="fas fa-plus me-2"></i>Crear Notificación
            </button>
          </div>
          <app-notification-list></app-notification-list>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 20px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SocketNotificationsComponent implements OnInit {
  private readonly to_user_id = 102;

  constructor(
    private socketService: SocketService,
    private notificationService: NotificationService,
    private router: Router,
    private authFacade: AuthFacade
  ) { }

  ngOnInit(): void {
    this.socketService.connect();
    
    // Dar tiempo para que se establezca la conexión
    setTimeout(() => {
      // SOLO NUEVO SISTEMA: Solicitar notificaciones personalizadas por usuario
      console.log('🚀 SOCKET NOTIFICATIONS: Iniciando con NUEVO SISTEMA de notificaciones');
      this.socketService.requestUserNotifications(); // Usa IDs actuales automáticamente
    }, 500);
  }

  createSample(): void {
    console.log('SocketNotificationsComponent: createSample clicked')
    const payload: Notificacion = {
      to_company_id: 636,
      to_user_id: 699,
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