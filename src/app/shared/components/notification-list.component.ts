import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../core/socket/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h6 class="mb-0">
          <i class="fas fa-bell me-2"></i>
          Notificaciones ({{ notifications ? notifications.length : 0 }})
        </h6>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-light" (click)="openSelfNotificationModal()">
            <i class="fas fa-user-plus"></i> Autonotificación
          </button>
          <button class="btn btn-sm btn-outline-light" (click)="forceRefresh()">
            <i class="fas fa-sync-alt"></i> Refrescar
          </button>
          <button class="btn btn-sm btn-outline-light" (click)="testAuth()">
            <i class="fas fa-key"></i> Test Auth
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
                  <span *ngIf="isSelfNotification(n)" class="badge bg-info text-white ms-2" title="Autonotificación">
                    <i class="fas fa-user"></i> YO
                  </span>
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
                            [disabled]="isTemporaryUuid(n.uuid)"
                            [title]="isTemporaryUuid(n.uuid) ? 'Esperando UUID del servidor...' : 'Marcar como leída'">
                      <i class="fas fa-check" *ngIf="!isTemporaryUuid(n.uuid)"></i>
                      <i class="fas fa-spinner fa-spin" *ngIf="isTemporaryUuid(n.uuid)"></i>
                    </button>
                    <button (click)="debugReadStatus(n.uuid)" 
                            class="btn btn-sm btn-outline-info" 
                            title="Debug estado de lectura">
                      <i class="fas fa-search"></i>
                    </button>
                    <button (click)="simulateSuccess(n.uuid)" 
                            class="btn btn-sm btn-outline-warning" 
                            title="Simular éxito (testing)">
                      <i class="fas fa-magic"></i>
                    </button>
                    <button (click)="delete(n.uuid)" 
                            class="btn btn-sm btn-outline-danger" 
                            [disabled]="isTemporaryUuid(n.uuid)"
                            [title]="isTemporaryUuid(n.uuid) ? 'No se puede eliminar UUID temporal' : 'Eliminar'">
                      <i class="fas fa-trash" *ngIf="!isTemporaryUuid(n.uuid)"></i>
                      <i class="fas fa-ban" *ngIf="isTemporaryUuid(n.uuid)"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal para crear autonotificación -->
    <div class="modal fade" 
         [class.show]="showSelfNotificationModal" 
         [style.display]="showSelfNotificationModal ? 'block' : 'none'"
         *ngIf="showSelfNotificationModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-user-plus me-2"></i>
              Crear Autonotificación
            </h5>
            <button type="button" class="btn-close" (click)="closeSelfNotificationModal()"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="mb-3">
                <label for="selfNotificationTitle" class="form-label">Título *</label>
                <input type="text" 
                       class="form-control" 
                       id="selfNotificationTitle"
                       placeholder="Ingresa el título de tu notificación"
                       [(ngModel)]="selfNotificationForm.title"
                       name="title"
                       required>
              </div>
              <div class="mb-3">
                <label for="selfNotificationBody" class="form-label">Mensaje *</label>
                <textarea class="form-control" 
                          id="selfNotificationBody"
                          rows="3"
                          placeholder="Ingresa el mensaje de tu notificación"
                          [(ngModel)]="selfNotificationForm.body"
                          name="body"
                          required></textarea>
              </div>
              <div class="mb-3">
                <label for="selfNotificationChannel" class="form-label">Canal</label>
                <select class="form-select" 
                        id="selfNotificationChannel"
                        [(ngModel)]="selfNotificationForm.channel"
                        name="channel">
                  <option value="personal">Personal</option>
                  <option value="recordatorio">Recordatorio</option>
                  <option value="tarea">Tarea</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Esta notificación será visible solo para ti y aparecerá marcada con un distintivo "YO".
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeSelfNotificationModal()">
              Cancelar
            </button>
            <button type="button" 
                    class="btn btn-primary" 
                    (click)="createSelfNotification()"
                    [disabled]="!canCreateSelfNotification()">
              <i class="fas fa-plus me-2"></i>
              Crear Autonotificación
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Backdrop del modal -->
    <div class="modal-backdrop fade show" 
         *ngIf="showSelfNotificationModal"
         (click)="closeSelfNotificationModal()"></div>
  `,
})
export class NotificationListComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  hasService: boolean = false;
  private subscription?: Subscription;
  
  // Propiedades para autonotificaciones
  showSelfNotificationModal = false;
  selfNotificationForm = {
    title: '',
    body: '',
    channel: 'personal'
  };
  
  constructor(private socketService: SocketService, private cdr: ChangeDetectorRef) {
    this.notifications = []; // Inicializar siempre
    
    // Hacer el componente accesible para debugging
    (window as any).notificationListComponent = this;
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
          
          // VERIFICAR AUTONOTIFICACIONES EN LA LISTA
          const currentIds = this.socketService.getCurrentIds();
          const selfNotifications = this.notifications.filter(n => 
            n.from_user_id === currentIds?.user_id && n.to_user_id === currentIds?.user_id
          );
          console.log('🔍 AUTONOTIFICACIONES DETECTADAS EN LA LISTA:', selfNotifications.length);
          
          if (selfNotifications.length > 0) {
            console.log('🔍 PRIMERA AUTONOTIFICACIÓN:', {
              uuid: selfNotifications[0].uuid,
              title: selfNotifications[0].title || selfNotifications[0].titulo,
              from_user_id: selfNotifications[0].from_user_id,
              to_user_id: selfNotifications[0].to_user_id,
              payload: selfNotifications[0].payload
            });
          }
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
        visto: notification.visto,
        to_user_id: notification.to_user_id,
        from_user_id: notification.from_user_id,
        to_company_id: notification.to_company_id,
        from_company_id: notification.from_company_id,
        todos_los_campos: Object.keys(notification)
      });
      
      // Comparar con el usuario actual
      const currentIds = this.socketService.getCurrentIds();
      console.log('📋 COMPARACIÓN DE OWNERSHIP:', {
        currentUserId: currentIds?.user_id,
        currentCompanyId: currentIds?.company_id,
        notificationToUserId: notification.to_user_id,
        notificationToCompanyId: notification.to_company_id,
        userMatch: currentIds?.user_id === notification.to_user_id,
        companyMatch: currentIds?.company_id === notification.to_company_id
      });
    } else {
      console.warn('📋 ⚠️ NOTIFICACIÓN NO ENCONTRADA EN LISTA LOCAL');
    }
    
    // SOLO NUEVO SISTEMA: Usar método específico para marcar como leída
    console.log('📋 EJECUTANDO SOLO NUEVO SISTEMA...');
    this.socketService.markNotificationRead(uuid);
    
    console.log('📋 ========== PROCESO INICIADO - ESPERANDO RESPUESTA notification-read-success ==========');
    
    /* 
    if (!uuid.startsWith('temp_')) {
      console.log('📋 Ejecutando también sistema antiguo para UUID real:', uuid);
      this.socketService.markSeen(uuid);
    } else {
      console.log('📋 Saltando sistema antiguo para UUID temporal:', uuid);
    }
    */
  }

  // Método para eliminar notificación con confirmación
  delete(notificationUuid: string): void {
    // Buscar la notificación para obtener información
    const notification = this.notifications.find(n => n.uuid === notificationUuid);
    const notificationTitle = notification?.title || notification?.titulo || 'Sin título';
    
    // Confirmación opcional
    if (confirm(`¿Estás seguro de que quieres eliminar esta notificación: "${notificationTitle}"?`)) {
      console.log(`🗑️ Usuario confirmó eliminar notificación ${notificationUuid}`);
      
      // Obtener userId actual
      const currentUserId = this.socketService.getCurrentUserId();
      
      if (!currentUserId) {
        console.error('❌ No se pudo obtener el userId actual');
        return;
      }
      
      // Llamar al método de eliminación
      this.socketService.delete(notificationUuid);
    } else {
      console.log('❌ Usuario canceló la eliminación');
    }
  }

  debugReadStatus(uuid: string): void {
    console.log('🔍 ========== INICIANDO DEBUG COMPLETO ==========');
    console.log('🔍 UUID:', uuid);
    
    // 1. Buscar en la lista local
    const localNotification = this.notifications.find(n => n.uuid === uuid);
    if (localNotification) {
      console.log('🔍 NOTIFICACIÓN EN LISTA LOCAL:', {
        uuid: localNotification.uuid,
        title: localNotification.title || localNotification.titulo,
        is_read: localNotification.is_read,
        visto: localNotification.visto,
        read_at: localNotification.read_at,
        campos_completos: Object.keys(localNotification)
      });
    } else {
      console.log('🔍 ❌ NOTIFICACIÓN NO ENCONTRADA EN LISTA LOCAL');
    }
    
    // 2. Solicitar estado específico (nuevo método)
    console.log('🔍 SOLICITANDO ESTADO DE LECTURA...');
    this.socketService.debugNotificationReadStatus(uuid);
    
    // 3. Usar método existente getNotification
    console.log('🔍 SOLICITANDO VÍA getNotification...');
    this.socketService.getNotification({ uuid });
    
    // 4. Mostrar configuración actual del usuario
    const currentIds = this.socketService.getCurrentIds();
    console.log('🔍 IDS DEL USUARIO ACTUAL:', currentIds);
    
    console.log('🔍 ========== FIN DEBUG - ESPERANDO RESPUESTAS ==========');
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
    
    // SOLO NUEVO SISTEMA: Re-solicitar notificaciones personalizadas
    console.log('🔄 NUEVO SISTEMA: Re-solicitando notificaciones personalizadas');
    this.socketService.requestUserNotifications();
  }

  testAuth(): void {
    console.log('🔐 PROBANDO AUTENTICACIÓN...');
    this.socketService.testSocketAuth();
  }


  // Verificar si el UUID es temporal
  isTemporaryUuid(uuid: string): boolean {
    return uuid && uuid.startsWith('temp_');
  }

  // Método para mostrar mensaje de éxito (puedes personalizar según tu UI)
  private showSuccessMessage(message: string): void {
    console.log('✅', message);
    // Aquí puedes agregar tu lógica de notificaciones UI (toast, alert, etc.)
  }

  // Método para mostrar mensaje de error (puedes personalizar según tu UI)
  private showErrorMessage(message: string): void {
    console.error('❌', message);
    // Aquí puedes agregar tu lógica de notificaciones UI (toast, alert, etc.)
  }

  // MÉTODO TEMPORAL: Simular respuesta exitosa para testing
  simulateSuccess(uuid: string): void {
    console.log('🎭 SIMULANDO RESPUESTA EXITOSA PARA:', uuid);
    
    // Simular respuesta del nuevo sistema
    const mockResponse = {
      success: true,
      notificationUuid: uuid,
      userId: 699,
      timestamp: new Date().toISOString()
    };
    
    console.log('🎭 SIMULANDO notification-read-success:', mockResponse);
    
    // Actualizar manualmente como si hubiera llegado la respuesta
    const currentNotifications = this.notifications;
    const updatedNotifications = currentNotifications.map(n => {
      if (n.uuid === uuid) {
        console.log('🎭 ACTUALIZANDO NOTIFICACIÓN SIMULADA:', n.uuid);
        return { ...n, is_read: true, visto: 1, read_at: new Date().toISOString() };
      }
      return n;
    });
    
    // Forzar actualización
    this.notifications = updatedNotifications;
    this.cdr.detectChanges();
    
    console.log('🎭 SIMULACIÓN COMPLETADA - La interfaz debería actualizarse');
  }

  // MÉTODOS PARA AUTONOTIFICACIONES
  
  openSelfNotificationModal(): void {
    console.log('📝 Abriendo modal de autonotificación');
    this.showSelfNotificationModal = true;
    this.resetSelfNotificationForm();
  }

  closeSelfNotificationModal(): void {
    console.log('📝 Cerrando modal de autonotificación');
    this.showSelfNotificationModal = false;
    this.resetSelfNotificationForm();
  }

  resetSelfNotificationForm(): void {
    this.selfNotificationForm = {
      title: '',
      body: '',
      channel: 'personal'
    };
  }

  canCreateSelfNotification(): boolean {
    return this.selfNotificationForm.title.trim() !== '' && 
           this.selfNotificationForm.body.trim() !== '';
  }

  createSelfNotification(): void {
    console.log('🚀 ========== INICIANDO CREACIÓN DE AUTONOTIFICACIÓN ==========');
    
    if (!this.canCreateSelfNotification()) {
      console.error('❌ No se puede crear autonotificación - faltan datos');
      console.log('❌ Form actual:', this.selfNotificationForm);
      return;
    }

    const currentIds = this.socketService.getCurrentIds();
    console.log('🔍 IDs del usuario actual:', currentIds);
    
    if (!currentIds?.user_id || !currentIds?.company_id) {
      console.error('❌ No se pudieron obtener los IDs del usuario actual');
      return;
    }

    console.log('📝 Datos del formulario:', this.selfNotificationForm);

    const autoNotificacion = {
      to_company_id: currentIds.company_id,
      to_user_id: currentIds.user_id,
      from_company_id: currentIds.company_id,
      from_user_id: currentIds.user_id, // Mismo usuario que envía y recibe
      title: this.selfNotificationForm.title.trim(),
      body: this.selfNotificationForm.body.trim(),
      channel: 'in-app',
      payload: {
        type: 'self_notification',
        created_by: currentIds.user_id,
        is_self: true
      }
    };

    console.log('📝 AUTONOTIFICACIÓN CONSTRUIDA:', JSON.stringify(autoNotificacion, null, 2));
    console.log('📝 ¿Es autonotificación? from_user_id === to_user_id:', autoNotificacion.from_user_id === autoNotificacion.to_user_id);
    
    // Verificar estado del socket antes de enviar
    console.log('🔌 Estado del socket conectado:', this.socketService['socket']?.connected);
    console.log('🔌 ID del socket:', this.socketService['socket']?.id);
    
    console.log('📤 ENVIANDO autonotificación vía socketService.createNotification...');
    this.socketService.createNotification(autoNotificacion);
    
    console.log('📤 LLAMADA A createNotification COMPLETADA');
    
    this.closeSelfNotificationModal();
    
    console.log('✅ Modal cerrado - Autonotificación enviada');
    console.log('👀 Observa los logs del socket para ver si llega notification:new');
    console.log('🚀 ========== FIN CREACIÓN DE AUTONOTIFICACIÓN ==========');
  }

  isSelfNotification(notification: any): boolean {
    const currentIds = this.socketService.getCurrentIds();
    const currentUserId = currentIds?.user_id;
    
    const isSelf = notification.from_user_id === currentUserId && 
                   notification.to_user_id === currentUserId;
    
    // Debug solo para las primeras 3 notificaciones para no llenar el log
    if (this.notifications.indexOf(notification) < 3) {
      console.log('🔍 VERIFICANDO SI ES AUTONOTIFICACIÓN:', {
        uuid: notification.uuid,
        title: notification.title || notification.titulo,
        from_user_id: notification.from_user_id,
        to_user_id: notification.to_user_id,
        currentUserId: currentUserId,
        isSelf: isSelf,
        payload_type: notification.payload?.type,
        payload_is_self: notification.payload?.is_self
      });
    }
    
    return isSelf;
  }

  // MÉTODO DEBUG para llamar desde consola del navegador
  debugAutoNotifications(): void {
    console.log('🐛 ========== DEBUG AUTONOTIFICACIONES ==========');
    console.log('🐛 Total notificaciones en la lista:', this.notifications.length);
    
    const currentIds = this.socketService.getCurrentIds();
    console.log('🐛 Usuario actual:', currentIds);
    
    const selfNotifications = this.notifications.filter(n => 
      n.from_user_id === currentIds?.user_id && n.to_user_id === currentIds?.user_id
    );
    
    console.log('🐛 Autonotificaciones encontradas:', selfNotifications.length);
    
    selfNotifications.forEach((notification, index) => {
      console.log(`🐛 Autonotificación ${index + 1}:`, {
        uuid: notification.uuid,
        title: notification.title || notification.titulo,
        body: notification.body || notification.mensaje,
        from_user_id: notification.from_user_id,
        to_user_id: notification.to_user_id,
        channel: notification.channel,
        payload: notification.payload,
        created_at: notification.created_at,
        is_read: notification.is_read,
        visto: notification.visto
      });
    });
    
    // Verificar todas las notificaciones para ver diferencias
    console.log('🐛 TODAS LAS NOTIFICACIONES:');
    this.notifications.forEach((notification, index) => {
      const isSelf = notification.from_user_id === currentIds?.user_id && 
                     notification.to_user_id === currentIds?.user_id;
      console.log(`🐛 Notificación ${index + 1} (isSelf: ${isSelf}):`, {
        uuid: notification.uuid,
        title: notification.title || notification.titulo,
        from_user_id: notification.from_user_id,
        to_user_id: notification.to_user_id,
        currentUserId: currentIds?.user_id
      });
    });
    
    console.log('🐛 ========== FIN DEBUG AUTONOTIFICACIONES ==========');
  }
}
