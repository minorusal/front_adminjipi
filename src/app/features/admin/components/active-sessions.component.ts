import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionsService } from '../../../core/services/sessions.service';
import { ActiveSession, SessionFilters, PaginationInfo } from '../../../shared/types/session.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-active-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-users-cog me-2"></i>
          Sesiones Activas
        </h2>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select form-select-sm" [(ngModel)]="selectedEnvironment" (change)="onEnvironmentChange()">
            <option value="qa">QA</option>
            <option value="prod">Prod</option>
          </select>
          <select class="form-select form-select-sm ms-2" [(ngModel)]="pageSize" (change)="onPageSizeChange()">
            <option value="10">10 por página</option>
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
            <option value="100">100 por página</option>
          </select>
          <button class="btn btn-outline-primary btn-sm ms-2" (click)="refreshSessions()">
            <i class="fas fa-sync-alt me-1"></i>
            Actualizar
          </button>
          <span class="badge bg-primary fs-6 ms-2">
            Total: {{ pagination?.totalItems || 0 }}
          </span>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="fas fa-filter me-2"></i>
            Filtros
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-4">
              <label for="userFilter" class="form-label">Filtrar por Usuario ID:</label>
              <input
                type="number"
                id="userFilter"
                class="form-control"
                [(ngModel)]="filters.user_id"
                placeholder="Ingrese ID de usuario">
            </div>
            <div class="col-md-4">
              <label for="companyFilter" class="form-label">Filtrar por Empresa ID:</label>
              <input
                type="number"
                id="companyFilter"
                class="form-control"
                [(ngModel)]="filters.company_id"
                placeholder="Ingrese ID de empresa">
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <button class="btn btn-primary me-2" (click)="applyFilters()">
                <i class="fas fa-search me-1"></i>
                Aplicar Filtros
              </button>
              <button class="btn btn-secondary" (click)="clearFilters()">
                <i class="fas fa-times me-1"></i>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <!-- Pagination Info -->
      <div *ngIf="!loading && !error && pagination" class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span class="text-muted">
            Mostrando {{ pagination.itemsOnCurrentPage }} de {{ pagination.totalItems }} resultados
            (Página {{ pagination.currentPage }} de {{ pagination.totalPages }})
          </span>
        </div>
      </div>

      <!-- Sessions Table -->
      <div *ngIf="!loading && !error" class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            <i class="fas fa-table me-2"></i>
            Lista de Sesiones Activas
          </h5>
          <div class="d-flex align-items-center gap-3">
            <!-- Quick pagination in header -->
            <div *ngIf="pagination && pagination.totalPages > 1" class="d-flex align-items-center gap-2">
              <small class="text-muted">Página:</small>
              <div class="btn-group btn-group-sm" role="group">
                <button type="button" 
                        class="btn btn-outline-secondary"
                        (click)="goToPage(pagination.currentPage - 1)" 
                        [disabled]="pagination.currentPage === 1"
                        title="Página anterior">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button type="button" class="btn btn-outline-secondary disabled">
                  {{ pagination.currentPage }} / {{ pagination.totalPages }}
                </button>
                <button type="button" 
                        class="btn btn-outline-secondary"
                        (click)="goToPage(pagination.currentPage + 1)" 
                        [disabled]="pagination.currentPage === pagination.totalPages"
                        title="Página siguiente">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
            <span class="badge bg-primary fs-6" *ngIf="pagination">
              Total: {{ pagination.totalItems }}
            </span>
          </div>
        </div>
        <div class="card-body">
          <div *ngIf="sessions.length === 0" class="text-center py-4">
            <i class="fas fa-info-circle fa-2x text-muted mb-3"></i>
            <p class="text-muted">No se encontraron sesiones activas con los filtros aplicados.</p>
          </div>

          <div *ngIf="sessions.length > 0" class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-dark">
                <tr>
                  <th>Usuario</th>
                  <th>Empresa</th>
                  <th>Rol</th>
                  <th>Sesión Iniciada</th>
                  <th>Última Actividad</th>
                  <th>Login ID</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let session of sessions; trackBy: trackByLoginId">
                  <td>
                    <div>
                      <strong>{{ session.user.nombre }} {{ session.user.apellidoPaterno }} {{ session.user.apellidoMaterno }}</strong>
                    </div>
                    <small class="text-muted">{{ session.user.email }}</small>
                    <br>
                    <small class="text-muted">ID: {{ session.user.id }}</small>
                  </td>
                  <td>
                    <div>
                      <strong>{{ session.company.nombre }}</strong>
                    </div>
                    <small class="text-muted">RFC: {{ session.company.rfc }}</small>
                    <br>
                    <small class="text-muted">ID: {{ session.company.id }}</small>
                  </td>
                  <td>
                    <span class="badge bg-info">
                      {{ session.role.nombre }}
                    </span>
                    <br>
                    <small class="text-muted">ID: {{ session.role.id }}</small>
                  </td>
                  <td>
                    <div>{{ session.sessionInfo.createdAt | date:'dd/MM/yyyy' }}</div>
                    <small class="text-muted">{{ session.sessionInfo.createdAt | date:'HH:mm:ss' }}</small>
                  </td>
                  <td>
                    <div>{{ session.sessionInfo.lastActivity | date:'dd/MM/yyyy' }}</div>
                    <small class="text-muted">{{ session.sessionInfo.lastActivity | date:'HH:mm:ss' }}</small>
                    <div class="mt-1">
                      <span 
                        class="badge"
                        [class.bg-success]="isRecentActivity(session.sessionInfo.lastActivity)"
                        [class.bg-warning]="!isRecentActivity(session.sessionInfo.lastActivity)">
                        {{ getActivityStatus(session.sessionInfo.lastActivity) }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <small class="font-monospace text-break">
                      {{ session.sessionInfo.loginId }}
                    </small>
                  </td>
                  <td>
                    <div class="d-flex gap-2">
                      <button 
                        class="btn btn-outline-info btn-sm"
                        (click)="viewSessionDetails(session)"
                        title="Ver detalles de la sesión">
                        <i class="fas fa-eye me-1"></i>
                        Ver Detalles
                      </button>
                      <button
                        class="btn btn-outline-danger btn-sm"
                        (click)="logoutSession(session)"
                        title="Cerrar sesión del usuario">
                        <i class="fas fa-sign-out-alt me-1"></i>
                        Cerrar Sesión
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div *ngIf="!loading && !error && pagination && pagination.totalPages > 1" class="d-flex justify-content-center mt-4">
        <nav>
          <ul class="pagination">
            <li class="page-item" [class.disabled]="!pagination.hasPreviousPage">
              <button class="page-link" (click)="goToPage(1)" [disabled]="!pagination.hasPreviousPage">
                <i class="fas fa-angle-double-left"></i>
              </button>
            </li>
            <li class="page-item" [class.disabled]="!pagination.hasPreviousPage">
              <button class="page-link" (click)="goToPage(pagination.currentPage - 1)" [disabled]="!pagination.hasPreviousPage">
                <i class="fas fa-angle-left"></i>
              </button>
            </li>
            
            <li *ngFor="let page of getVisiblePages()" 
                class="page-item" 
                [class.active]="page === pagination.currentPage">
              <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
            </li>
            
            <li class="page-item" [class.disabled]="!pagination.hasNextPage">
              <button class="page-link" (click)="goToPage(pagination.currentPage + 1)" [disabled]="!pagination.hasNextPage">
                <i class="fas fa-angle-right"></i>
              </button>
            </li>
            <li class="page-item" [class.disabled]="!pagination.hasNextPage">
              <button class="page-link" (click)="goToPage(pagination.totalPages)" [disabled]="!pagination.hasNextPage">
                <i class="fas fa-angle-double-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <!-- Session Details Modal -->
      <div *ngIf="selectedSession" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-info-circle me-2"></i>
                Detalles de la Sesión
              </h5>
              <button type="button" class="btn-close" (click)="closeSessionDetails()"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Información de Sesión</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>Login ID:</strong></td>
                      <td class="font-monospace">{{ selectedSession.sessionInfo.loginId }}</td>
                    </tr>
                    <tr>
                      <td><strong>Token de Sesión:</strong></td>
                      <td class="font-monospace text-break">{{ selectedSession.sessionInfo.sessionTokenId }}</td>
                    </tr>
                    <tr>
                      <td><strong>Token de Refresco:</strong></td>
                      <td class="font-monospace text-break">{{ selectedSession.sessionInfo.refreshTokenId }}</td>
                    </tr>
                    <tr>
                      <td><strong>Creada:</strong></td>
                      <td>{{ selectedSession.sessionInfo.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    </tr>
                    <tr>
                      <td><strong>Última Actividad:</strong></td>
                      <td>{{ selectedSession.sessionInfo.lastActivity | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>Información del Usuario</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>Nombre:</strong></td>
                      <td>{{ selectedSession.user.nombre }} {{ selectedSession.user.apellidoPaterno }} {{ selectedSession.user.apellidoMaterno }}</td>
                    </tr>
                    <tr>
                      <td><strong>Email:</strong></td>
                      <td>{{ selectedSession.user.email }}</td>
                    </tr>
                    <tr>
                      <td><strong>ID:</strong></td>
                      <td>{{ selectedSession.user.id }}</td>
                    </tr>
                  </table>
                  
                  <h6 class="mt-3">Información de la Empresa</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>Nombre:</strong></td>
                      <td>{{ selectedSession.company.nombre }}</td>
                    </tr>
                    <tr>
                      <td><strong>RFC:</strong></td>
                      <td>{{ selectedSession.company.rfc }}</td>
                    </tr>
                    <tr>
                      <td><strong>ID:</strong></td>
                      <td>{{ selectedSession.company.id }}</td>
                    </tr>
                  </table>
                  
                  <h6 class="mt-3">Rol</h6>
                  <span class="badge bg-info fs-6">{{ selectedSession.role.nombre }} (ID: {{ selectedSession.role.id }})</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeSessionDetails()">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table th {
      border-top: none;
    }
    
    .font-monospace {
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
    }
    
    .text-break {
      word-break: break-all;
    }
    
    .modal.show {
      display: block;
    }
    
    .card {
      border: none;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    
    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ActiveSessionsComponent implements OnInit {
  sessions: ActiveSession[] = [];
  pagination: PaginationInfo | null = null;
  loading = false;
  error: string | null = null;
  selectedSession: ActiveSession | null = null;
  
  filters: SessionFilters = {};
  currentPage = 1;
  pageSize = 10;
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  constructor(
    private sessionsService: SessionsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadSessions();
  }

  logoutSession(session: ActiveSession) {
    if (confirm(`¿Está seguro de que desea cerrar la sesión para el usuario ${session.user.nombre}?`)) {
      const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
      
      this.authService.logoutUserSession(session.sessionInfo.sessionToken, baseUrl).subscribe({
        next: () => {
          this.refreshSessions();
        },
        error: (err) => {
          this.error = 'Error al cerrar la sesión. Por favor intente nuevamente.';
          console.error('Error logging out session:', err);
        }
      });
    }
  }

  loadSessions() {
    this.loading = true;
    this.error = null;

    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    const filtersWithPagination = {
      ...this.filters,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.sessionsService.getActiveSessions(filtersWithPagination, baseUrl).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.error) {
          this.error = response.message;
        } else {
          this.sessions = response.data.sessions;
          this.pagination = response.data.pagination;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar las sesiones activas. Por favor intente nuevamente.';
        console.error('Error loading sessions:', err);
      }
    });
  }

  onEnvironmentChange() {
    this.currentPage = 1;
    this.loadSessions();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadSessions();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= (this.pagination?.totalPages || 1)) {
      this.currentPage = page;
      this.loadSessions();
    }
  }

  getVisiblePages(): number[] {
    if (!this.pagination) return [];
    
    const totalPages = this.pagination.totalPages;
    const current = this.pagination.currentPage;
    const pages: number[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1, totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1, -1);
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1, -1);
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1, totalPages);
      }
    }
    
    return pages.filter(p => p !== -1);
  }

  refreshSessions() {
    this.loadSessions();
  }

  applyFilters() {
    if (!this.filters.user_id || this.filters.user_id === 0) {
      delete this.filters.user_id;
    }
    if (!this.filters.company_id || this.filters.company_id === 0) {
      delete this.filters.company_id;
    }
    
    this.currentPage = 1;
    this.loadSessions();
  }

  clearFilters() {
    this.filters = {};
    this.currentPage = 1;
    this.loadSessions();
  }

  viewSessionDetails(session: ActiveSession) {
    this.selectedSession = session;
  }

  closeSessionDetails() {
    this.selectedSession = null;
  }

  trackByLoginId(index: number, session: ActiveSession): string {
    return session.sessionInfo.loginId;
  }

  isRecentActivity(lastActivity: string): boolean {
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffMinutes = (now.getTime() - activityDate.getTime()) / (1000 * 60);
    return diffMinutes <= 30; // Considera reciente si es menor a 30 minutos
  }

  getActivityStatus(lastActivity: string): string {
    return this.isRecentActivity(lastActivity) ? 'Activo' : 'Inactivo';
  }
}