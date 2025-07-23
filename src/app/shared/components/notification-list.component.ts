import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../core/socket/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h6 class="mb-0">
          <i class="fas fa-bell me-2"></i>
          Notificaciones ({{ notifications ? notifications.length : 0 }})
        </h6>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-light" (click)="forceRefresh()">
            <i class="fas fa-sync-alt"></i> Refrescar
          </button>
          <button class="btn btn-sm btn-outline-light" (click)="markAllAsRead()" 
                  *ngIf="hasUnreadNotifications()">
            <i class="fas fa-check-double"></i> Marcar todas
          </button>
        </div>
      </div>
      <div class="card-body p-0">
        <div *ngIf="!hasService" class="p-4 text-center text-danger">
          <i class="fas fa-exclamation-triangle fa-3x mb-3 d-block"></i>
          Error: Servicio de notificaciones no disponible
        </div>
        <div *ngIf="hasService && notifications && notifications.length === 0" class="p-4 text-center text-muted">
          <i class="fas fa-inbox fa-3x mb-3 d-block"></i>
          No hay notificaciones
        </div>
        <div *ngIf="hasService && notifications && notifications.length > 0" class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th scope="col" style="width: 80px;">Estado</th>
                <th scope="col">Título & UUID</th>
                <th scope="col">Mensaje & Detalles</th>
                <th scope="col" style="width: 150px;">Fecha</th>
                <th scope="col" style="width: 120px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let n of (notifications || []); let i = index; trackBy: trackByUuid" 
                  [class.table-warning]="!isRead(n)">
                <td class="text-center">
                  <span *ngIf="!isRead(n)" class="badge bg-warning text-dark" title="No leída">
                    <i class="fas fa-eye-slash"></i>
                  </span>
                  <span *ngIf="isRead(n)" class="badge bg-success" title="Leída">
                    <i class="fas fa-eye"></i>
                  </span>
                </td>
                <td>
                  <strong>{{ getStringValue(n.title || n.titulo) || 'Sin título' }}</strong>
                  <br><small class="text-muted">UUID: {{ getStringValue(n.uuid) || 'Sin UUID' }}</small>
                </td>
                <td>
                  <span>{{ getStringValue(n.body || n.mensaje || n.content) || 'Sin mensaje' }}</span>
                  <br><small class="text-muted">Canal: {{ getStringValue(n.channel) || 'Sin canal' }} | Estado: {{ getStringValue(n.status) || 'Sin estado' }}</small>
                </td>
                <td>
                  <small class="text-muted">{{ formatDate(n.created_at || n.date) }}</small>
                </td>
                <td>
                  <div class="btn-group" role="group">
                    <button *ngIf="!isRead(n)" 
                            (click)="markSeen(n.uuid)" 
                            class="btn btn-sm btn-outline-success" 
                            title="Marcar como leída">
                      <i class="fas fa-check"></i>
                    </button>
                    <button (click)="delete(n.uuid)" 
                            class="btn btn-sm btn-outline-danger" 
                            title="Eliminar">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class NotificationListComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  hasService: boolean = false;
  private subscription?: Subscription;
  
  constructor(private socketService: SocketService, private cdr: ChangeDetectorRef) {
    this.notifications = []; // Inicializar siempre
  }

  ngOnInit() {
    console.log('📋 CONSTRUCTOR: SocketService inyectado:', !!this.socketService);
    console.log('📋 CONSTRUCTOR: notifications$ disponible:', !!this.socketService?.notifications$);
    
    this.hasService = !!(this.socketService && this.socketService.notifications$);
    
    if (!this.hasService) {
      console.error('📋 ERROR: SocketService o notifications$ no disponible');
      this.notifications = [];
      return;
    }
    
    // Suscribirse a los cambios
    this.subscription = this.socketService.notifications$.subscribe({
      next: (notifications) => {
        console.log('📋 COMPONENTE TABLA: notificaciones actualizadas', notifications);
        console.log('📋 CANTIDAD DE NOTIFICACIONES:', notifications?.length || 0);
        console.log('📋 PRIMERA NOTIFICACIÓN (estructura):', notifications?.[0]);
        
        this.notifications = Array.isArray(notifications) ? notifications : [];
        
        if (this.notifications.length > 0) {
          console.log('📋 KEYS DE LA PRIMERA NOTIFICACIÓN:', Object.keys(this.notifications[0]));
        }
        
        // FORZAR DETECCIÓN DE CAMBIOS
        console.log('📋 FORZANDO DETECCIÓN DE CAMBIOS EN LA TABLA');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('📋 ERROR en suscripción:', error);
        this.notifications = [];
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  markSeen(uuid: string): void {
    console.log('📋 ========== INICIANDO PROCESO MARCAR COMO LEÍDA ==========');
    console.log('📋 UUID de la notificación:', uuid);
    console.log('📋 Timestamp de inicio:', new Date().toISOString());
    
    // Buscar la notificación en la lista actual
    const notification = this.notifications.find(n => n.uuid === uuid);
    if (notification) {
      console.log('📋 NOTIFICACIÓN ENCONTRADA EN LISTA LOCAL:', {
        uuid: notification.uuid,
        title: notification.title || notification.titulo,
        is_read: notification.is_read,
        visto: notification.visto
      });
    } else {
      console.warn('📋 ⚠️ NOTIFICACIÓN NO ENCONTRADA EN LISTA LOCAL');
    }
    
    // NUEVO SISTEMA: Usar método específico para marcar como leída
    console.log('📋 EJECUTANDO NUEVO SISTEMA...');
    this.socketService.markNotificationRead(uuid);
    
    // COMPATIBILIDAD: Deshabilitar sistema antiguo temporalmente
    // TODO: Habilitar cuando el backend implemente estados individuales por usuario
    console.log('📋 SISTEMA ANTIGUO DESHABILITADO - Solo usando nuevo sistema');
    console.log('📋 ========== PROCESO INICIADO - ESPERANDO RESPUESTA ==========');
    
    /* 
    if (!uuid.startsWith('temp_')) {
      console.log('📋 Ejecutando también sistema antiguo para UUID real:', uuid);
      this.socketService.markSeen(uuid);
    } else {
      console.log('📋 Saltando sistema antiguo para UUID temporal:', uuid);
    }
    */
  }

  delete(uuid: string): void {
    this.socketService.delete(uuid);
  }

  trackByUuid(index: number, item: any): string {
    return item.uuid || item.id || index;
  }

  formatDate(date: string | Date): string {
    if (!date) return 'Sin fecha';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStringValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'object') {
      console.warn('🔴 OBJETO DETECTADO EN TEMPLATE:', value);
      return JSON.stringify(value);
    }
    return String(value);
  }

  // NUEVO SISTEMA: Método para verificar si una notificación está leída
  isRead(notification: any): boolean {
    // Nuevo sistema: is_read
    if (notification.is_read !== undefined) {
      return notification.is_read === true || notification.is_read === 1;
    }
    // Sistema antiguo: visto
    if (notification.visto !== undefined) {
      return notification.visto === 1 || notification.visto === true;
    }
    // Por defecto, no leída
    return false;
  }

  // NUEVO SISTEMA: Verificar si hay notificaciones no leídas
  hasUnreadNotifications(): boolean {
    if (!this.notifications || this.notifications.length === 0) {
      return false;
    }
    return this.notifications.some(n => !this.isRead(n));
  }

  // NUEVO SISTEMA: Marcar todas como leídas
  markAllAsRead(): void {
    console.log('📋 MARCANDO TODAS LAS NOTIFICACIONES COMO LEÍDAS');
    this.socketService.markAllNotificationsRead();
  }

  forceRefresh(): void {
    console.log('🔄 REFRESCAR MANUAL CLICKEADO');
    console.log('🔄 VALOR ACTUAL DEL BEHAVIORSUBJECT:', this.socketService.notifications$.value);
    console.log('🔄 LONGITUD:', this.socketService.notifications$.value.length);
    this.cdr.detectChanges();
    
    // NUEVO SISTEMA: Re-solicitar notificaciones personalizadas
    console.log('🔄 NUEVO SISTEMA: Re-solicitando notificaciones personalizadas');
    this.socketService.requestUserNotifications();
    
    // COMPATIBILIDAD: También sistema antiguo
    const currentIds = this.socketService.getCurrentIds();
    const currentUserId = currentIds?.user_id;
    const currentCompanyId = currentIds?.company_id;
    
    if (currentUserId) {
      console.log('🔄 SISTEMA ANTIGUO: Re-solicitando para:', currentUserId);
      this.socketService.requestList({ 
        to_user_id: currentUserId,
        to_company_id: currentCompanyId,
        page: 1,
        limit: 10
      });
    }
  }
}
