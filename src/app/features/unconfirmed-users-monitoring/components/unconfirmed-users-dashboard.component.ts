import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UnconfirmedUsersMonitoringFacade, EmpresaAgrupada } from '../data-access/unconfirmed-users-monitoring.facade';
import { UnconfirmedUsersMonitoringService } from '../services/unconfirmed-users-monitoring.service';
import { UnconfirmedUsersStats, UsuarioNoConfirmado } from '../types/unconfirmed-users.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-unconfirmed-users-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <h2 class="mb-0">
              <i class="fas fa-user-clock me-2"></i>
              Monitoreo de Usuarios No Confirmados
            </h2>
            <div class="d-flex gap-2">
              <select
                class="form-select"
                [(ngModel)]="selectedEnvironment"
                (change)="onEnvironmentChange()"
                style="width: auto;">
                <option value="qa">QA</option>
                <option value="prod">Producción</option>
              </select>
              <button
                class="btn btn-primary"
                (click)="loadData()"
                [disabled]="isLoading">
                <i class="fas fa-sync-alt" [class.fa-spin]="isLoading"></i>
                {{ isLoading ? 'Cargando...' : 'Actualizar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div *ngIf="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>
        {{ error }}
        <button type="button" class="btn-close" (click)="error = null"></button>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3 text-muted">Cargando usuarios no confirmados...</p>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!isLoading && stats">
        <!-- Statistics Cards -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <p class="text-muted mb-1 small">Total No Confirmados</p>
                    <h3 class="mb-0 fw-bold text-primary">{{ stats.total_no_confirmados }}</h3>
                  </div>
                  <div class="bg-primary bg-opacity-10 rounded-3 p-3">
                    <i class="fas fa-users fa-2x text-primary"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <p class="text-muted mb-1 small">Con Empresa</p>
                    <h3 class="mb-0 fw-bold text-success">{{ stats.con_empresa }}</h3>
                  </div>
                  <div class="bg-success bg-opacity-10 rounded-3 p-3">
                    <i class="fas fa-building fa-2x text-success"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <p class="text-muted mb-1 small">Sin Empresa</p>
                    <h3 class="mb-0 fw-bold text-warning">{{ stats.sin_empresa }}</h3>
                  </div>
                  <div class="bg-warning bg-opacity-10 rounded-3 p-3">
                    <i class="fas fa-user-times fa-2x text-warning"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <p class="text-muted mb-1 small">Empresas Afectadas</p>
                    <h3 class="mb-0 fw-bold text-info">{{ totalEmpresasAfectadas }}</h3>
                  </div>
                  <div class="bg-info bg-opacity-10 rounded-3 p-3">
                    <i class="fas fa-briefcase fa-2x text-info"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Date Range Card -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h5 class="card-title mb-3">
                  <i class="fas fa-calendar-alt me-2"></i>
                  Rango de Fechas de Registro
                </h5>
                <div class="row">
                  <div class="col-md-6">
                    <p class="mb-1 text-muted small">Registro Más Antiguo:</p>
                    <p class="mb-0 fw-semibold">
                      {{ unconfirmedUsersService.formatDate(stats.primer_registro) }}
                    </p>
                  </div>
                  <div class="col-md-6">
                    <p class="mb-1 text-muted small">Registro Más Reciente:</p>
                    <p class="mb-0 fw-semibold">
                      {{ unconfirmedUsersService.formatDate(stats.ultimo_registro) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item">
            <a
              class="nav-link"
              [class.active]="activeTab === 'por-empresa'"
              (click)="activeTab = 'por-empresa'"
              style="cursor: pointer;">
              <i class="fas fa-building me-2"></i>
              Usuarios por Empresa ({{ usuariosPorEmpresa.length }})
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              [class.active]="activeTab === 'sin-empresa'"
              (click)="activeTab = 'sin-empresa'"
              style="cursor: pointer;">
              <i class="fas fa-user-times me-2"></i>
              Usuarios sin Empresa ({{ usuariosSinEmpresa.length }})
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              [class.active]="activeTab === 'todos'"
              (click)="activeTab = 'todos'"
              style="cursor: pointer;">
              <i class="fas fa-list me-2"></i>
              Todos los Usuarios ({{ todosLosUsuarios.length }})
            </a>
          </li>
        </ul>

        <!-- Tab: Usuarios por Empresa -->
        <div *ngIf="activeTab === 'por-empresa'" class="tab-content">
          <div *ngIf="usuariosPorEmpresa.length === 0" class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No hay usuarios agrupados por empresa.
          </div>

          <div *ngFor="let grupo of usuariosPorEmpresa" class="card border-0 shadow-sm mb-3">
            <div class="card-header bg-light">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                  <i class="fas fa-building me-2 text-primary"></i>
                  {{ grupo.empresa_nombre || 'Sin nombre' }}
                </h5>
                <span class="badge bg-primary">{{ grupo.total_usuarios }} usuarios</span>
              </div>
              <div class="mt-2 text-muted small">
                <span>{{ grupo.empresa_completa }}</span>
              </div>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Nombre Completo</th>
                      <th>Email</th>
                      <th>Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let usuario of grupo.usuarios">
                      <td>{{ usuario.usu_id }}</td>
                      <td>{{ usuario.nombre_completo }}</td>
                      <td>{{ usuario.email }}</td>
                      <td>{{ unconfirmedUsersService.formatDate(usuario.fecha_registro) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Usuarios sin Empresa -->
        <div *ngIf="activeTab === 'sin-empresa'" class="tab-content">
          <div *ngIf="usuariosSinEmpresa.length === 0" class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No hay usuarios sin empresa asociada.
          </div>

          <div *ngIf="usuariosSinEmpresa.length > 0" class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Nombre Completo</th>
                      <th>Email</th>
                      <th>Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let usuario of usuariosSinEmpresa">
                      <td>{{ usuario.usu_id }}</td>
                      <td>{{ usuario.nombre_completo }}</td>
                      <td>{{ usuario.usu_email }}</td>
                      <td>{{ unconfirmedUsersService.formatDate(usuario.fecha_registro) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Todos los Usuarios -->
        <div *ngIf="activeTab === 'todos'" class="tab-content">
          <div *ngIf="todosLosUsuarios.length === 0" class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No hay usuarios registrados.
          </div>

          <div *ngIf="todosLosUsuarios.length > 0" class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Nombre Completo</th>
                      <th>Email</th>
                      <th>Empresa</th>
                      <th>Denominación Completa</th>
                      <th>Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let usuario of todosLosUsuarios">
                      <td>{{ usuario.usu_id }}</td>
                      <td>{{ usuario.nombre_completo }}</td>
                      <td>{{ usuario.usu_email }}</td>
                      <td>{{ usuario.empresa_nombre || 'N/A' }}</td>
                      <td>{{ usuario.empresa_completa || 'N/A' }}</td>
                      <td>{{ unconfirmedUsersService.formatDate(usuario.fecha_registro) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && !stats && !error" class="text-center py-5">
        <i class="fas fa-inbox fa-4x text-muted mb-3"></i>
        <h5 class="text-muted">No hay datos disponibles</h5>
        <p class="text-muted">Haz clic en "Actualizar" para cargar los usuarios no confirmados</p>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
    }
    .table td, .table th {
      vertical-align: middle;
    }
    .nav-link {
      color: #6c757d;
    }
    .nav-link.active {
      color: #0d6efd;
      border-bottom: 2px solid #0d6efd;
    }
    .tab-content {
      animation: fadeIn 0.3s;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class UnconfirmedUsersDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedEnvironment: 'qa' | 'prod' = 'qa';
  isLoading = false;
  error: string | null = null;

  stats: UnconfirmedUsersStats | null = null;
  usuariosPorEmpresa: EmpresaAgrupada[] = [];
  usuariosSinEmpresa: UsuarioNoConfirmado[] = [];
  totalEmpresasAfectadas = 0;
  todosLosUsuarios: UsuarioNoConfirmado[] = [];

  activeTab: 'por-empresa' | 'sin-empresa' | 'todos' = 'por-empresa';

  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  constructor(
    public facade: UnconfirmedUsersMonitoringFacade,
    public unconfirmedUsersService: UnconfirmedUsersMonitoringService
  ) {}

  ngOnInit(): void {
    this.subscribeToFacade();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.facade.clearState();
  }

  private subscribeToFacade(): void {
    this.facade.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
        console.log('📊 [COMPONENT] Loading state:', loading);
      });

    this.facade.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error = error;
        if (error) {
          console.error('📊 [COMPONENT] Error:', error);
        }
      });

    this.facade.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
        console.log('📊 [COMPONENT] Stats actualizadas:', stats);
      });

    this.facade.usuariosPorEmpresa$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuarios => {
        this.usuariosPorEmpresa = usuarios;
        console.log('📊 [COMPONENT] Usuarios por empresa actualizados:', usuarios.length);
      });

    this.facade.usuariosSinEmpresa$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuarios => {
        this.usuariosSinEmpresa = usuarios;
        console.log('📊 [COMPONENT] Usuarios sin empresa actualizados:', usuarios.length);
      });

    this.facade.totalEmpresasAfectadas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(total => {
        this.totalEmpresasAfectadas = total;
        console.log('📊 [COMPONENT] Total empresas afectadas:', total);
      });

    this.facade.todosLosUsuarios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuarios => {
        this.todosLosUsuarios = usuarios;
        console.log('📊 [COMPONENT] Todos los usuarios actualizados:', usuarios.length);
      });
  }

  onEnvironmentChange(): void {
    console.log('🔧 [COMPONENT] Ambiente cambiado a:', this.selectedEnvironment);
    this.loadData();
  }

  loadData(): void {
    const baseUrl = this.getCurrentBaseUrl();
    console.log('🔄 [COMPONENT] Cargando datos desde:', baseUrl);
    this.facade.loadUnconfirmedUsers(baseUrl);
  }

  private getCurrentBaseUrl(): string {
    return this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
  }
}
