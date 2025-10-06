import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BitacoraService } from '../services/bitacora.service';
import { SecurityMetricsComponent } from './security-metrics.component';
import { SessionJourneyComponent } from './session-journey.component';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';
import {
  DashboardMetrics,
  ErrorMetrics,
  TopEndpoint,
  TemporalMetrics,
  BitacoraRecord,
  BitacoraFilters,
  SystemOverview,
  EndpointUsageMetrics,
  PerformanceMetrics,
  SlowRequest,
  ErrorAnalysis,
  SecurityMetrics
} from '../types/bitacora.types';

@Component({
  selector: 'app-bitacora-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SecurityMetricsComponent, SessionJourneyComponent],
  template: `
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-chart-line me-2 text-primary"></i>
          Bitácora de Endpoints
        </h2>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select form-select-sm" [(ngModel)]="selectedEnvironment" (change)="onEnvironmentChange()">
            <option value="qa">QA</option>
            <option value="prod">Prod</option>
          </select>
          <button class="btn btn-outline-success btn-sm" (click)="refreshDashboard()">
            <i class="fas fa-sync-alt me-1"></i>
            Actualizar
          </button>
          <button class="btn btn-success btn-sm" (click)="exportData()">
            <i class="fas fa-download me-1"></i>
            Exportar
          </button>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <ul class="nav nav-tabs mb-4" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link" 
                  [class.active]="activeTab === 'dashboard'"
                  (click)="setActiveTab('dashboard')">
            <i class="fas fa-tachometer-alt me-2"></i>Dashboard
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" 
                  [class.active]="activeTab === 'logs'"
                  (click)="setActiveTab('logs')">
            <i class="fas fa-list me-2"></i>Logs Detallados
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" 
                  [class.active]="activeTab === 'performance'"
                  (click)="setActiveTab('performance')">
            <i class="fas fa-tachometer-alt me-2"></i>Rendimiento
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" 
                  [class.active]="activeTab === 'security'"
                  (click)="setActiveTab('security')">
            <i class="fas fa-shield-alt me-2"></i>Seguridad
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" 
                  [class.active]="activeTab === 'journey'"
                  (click)="setActiveTab('journey')">
            <i class="fas fa-route me-2"></i>Journey
          </button>
        </li>
      </ul>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="mt-3">Cargando datos de bitácora...</div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <!-- Dashboard Tab -->
      <div *ngIf="activeTab === 'dashboard' && !loading" class="tab-content">
        <!-- Enhanced Metrics Cards -->
        <div class="row mb-4" *ngIf="systemOverview">
          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-primary shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                      Total Requests
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                      {{ systemOverview.total_requests | number }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <i class="fas fa-globe fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-danger shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                      Error Rate
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                      {{ systemOverview.error_rate | number:'1.2-2' }}%
                    </div>
                  </div>
                  <div class="col-auto">
                    <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-info shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                      Avg Response Time
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                      {{ systemOverview.avg_response_time | number:'1.0-0' }}ms
                    </div>
                  </div>
                  <div class="col-auto">
                    <i class="fas fa-clock fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-success shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                      Active Users 24h
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                      {{ systemOverview.active_users_24h | number }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <i class="fas fa-users fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Session Analytics Row -->
        <div class="row mb-4" *ngIf="sessionAnalytics && hasValidSessionData()">
          <div class="col-12">
            <div class="card shadow">
              <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">
                  <i class="fas fa-users me-2"></i>
                  Analíticas de Sesión y Algoritmo
                  <span class="badge bg-info ms-2" *ngIf="selectedEnvironment === 'prod'">Disponible en Prod</span>
                </h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-3">
                    <div class="text-center">
                      <div class="h4 font-weight-bold text-primary">{{ (sessionAnalytics.total_sessions || 0) | number }}</div>
                      <div class="text-xs text-uppercase text-muted">Total Sesiones</div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="text-center">
                      <div class="h4 font-weight-bold text-success">{{ (sessionAnalytics.active_sessions || 0) | number }}</div>
                      <div class="text-xs text-uppercase text-muted">Sesiones Activas</div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="text-center">
                      <div class="h4 font-weight-bold text-info">{{ formatDurationSafe(sessionAnalytics.average_session_duration) }}</div>
                      <div class="text-xs text-uppercase text-muted">Duración Promedio</div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="text-center">
                      <div class="h4 font-weight-bold text-warning">{{ (sessionAnalytics.algorithm_usage_rate || 0) | number:'1.1-1' }}%</div>
                      <div class="text-xs text-uppercase text-muted">Uso del Algoritmo</div>
                    </div>
                  </div>
                </div>
                
                <hr>
                
                <!-- Top Failure Reasons -->
                <div class="row" *ngIf="sessionAnalytics.top_failure_reasons?.length > 0">
                  <div class="col-12">
                    <h6 class="text-muted mb-3">Principales Razones de Fallo:</h6>
                    <div class="row">
                      <div *ngFor="let reason of sessionAnalytics.top_failure_reasons.slice(0, 3)" class="col-md-4">
                        <div class="small">
                          <strong>{{ getFailureReasonLabel(reason.razon_fallo) }}</strong>
                          <div class="progress mt-1" style="height: 6px;">
                            <div class="progress-bar bg-danger" [style.width.%]="reason.percentage"></div>
                          </div>
                          <div class="text-muted small">{{ reason.count }} casos ({{ reason.percentage | number:'1.1-1' }}%)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Session Analytics Not Available Notice -->
        <div class="row mb-4" *ngIf="!sessionAnalytics && selectedEnvironment === 'qa' && systemOverview">
          <div class="col-12">
            <div class="card border-warning">
              <div class="card-body text-center">
                <i class="fas fa-info-circle fa-2x text-warning mb-2"></i>
                <h6 class="text-warning">Analíticas de Sesión no disponibles en QA</h6>
                <p class="text-muted mb-0">
                  Las analíticas avanzadas de sesión están disponibles únicamente en el ambiente de Producción.
                  <br>Cambie a "Prod" para ver estas métricas.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="row">
          <!-- Top Endpoints -->
          <div class="col-xl-6 col-lg-7">
            <div class="card shadow mb-4">
              <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                <h6 class="m-0 font-weight-bold text-primary">Top Endpoints</h6>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Endpoint</th>
                        <th>Método</th>
                        <th>Calls</th>
                        <th>Avg Time</th>
                        <th>Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let endpoint of endpointUsageMetrics">
                        <td>
                          <small class="text-muted">{{ endpoint.endpoint_url | slice:0:30 }}...</small>
                        </td>
                        <td>
                          <span class="badge" [ngClass]="{
                            'bg-success': endpoint.method === 'GET',
                            'bg-primary': endpoint.method === 'POST',
                            'bg-warning': endpoint.method === 'PUT',
                            'bg-danger': endpoint.method === 'DELETE'
                          }">{{ endpoint.method }}</span>
                        </td>
                        <td>{{ endpoint.total_requests | number }}</td>
                        <td>{{ endpoint.avg_response_time | number:'1.0-0' }}ms</td>
                        <td>
                          <span class="text-danger" *ngIf="endpoint.error_count > 0">
                            {{ endpoint.error_count }}
                          </span>
                          <span class="text-success" *ngIf="endpoint.error_count === 0">0</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Activity Timeline -->
          <div class="col-xl-6 col-lg-5">
            <div class="card shadow mb-4">
              <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Actividad por Hora</h6>
              </div>
              <div class="card-body">
                <div class="hourly-chart">
                  <div *ngFor="let hour of dashboardMetrics?.time_based_metrics?.hourly" 
                       class="hour-bar mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                      <small class="text-muted">{{ hour.hour_of_day }}:00</small>
                      <div class="progress flex-grow-1 mx-2" style="height: 20px;">
                        <div class="progress-bar bg-primary" 
                             [style.width.%]="getProgressPercentage(hour.total_requests)"
                             [title]="hour.total_requests + ' requests'">
                        </div>
                      </div>
                      <small class="text-muted">{{ hour.total_requests }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Logs Tab -->
      <div *ngIf="activeTab === 'logs' && !loading" class="tab-content">
        <!-- Filters -->
        <div class="card mb-4">
          <div class="card-header">
            <h6 class="m-0">Filtros de Búsqueda</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <label class="form-label">Usuario Email</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="filters.usuario_email"
                       (input)="onFilterChange()"
                       placeholder="usuario@ejemplo.com">
              </div>
              <div class="col-md-3">
                <label class="form-label">Endpoint</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="filters.endpoint_url"
                       (input)="onFilterChange()"
                       placeholder="/api/auth">
              </div>
              <div class="col-md-2">
                <label class="form-label">Método HTTP</label>
                <select class="form-select" 
                        [(ngModel)]="filters.metodo_http"
                        (change)="onFilterChange()">
                  <option value="">Todos</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">Código Respuesta</label>
                <input type="number" class="form-control" 
                       [(ngModel)]="filters.codigo_respuesta"
                       (input)="onFilterChange()"
                       placeholder="200">
              </div>
              <div class="col-md-2">
                <div class="form-check mt-4">
                  <input class="form-check-input" type="checkbox" 
                         [(ngModel)]="filters.has_error"
                         (change)="onFilterChange()"
                         id="hasErrorCheck">
                  <label class="form-check-label" for="hasErrorCheck">
                    Solo errores
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Logs Table -->
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-list-alt me-2"></i>
              Bitácora de Endpoints
            </h5>
            <div class="d-flex align-items-center gap-3">
              <!-- Quick pagination in header -->
              <div *ngIf="pagination && pagination.totalPages > 1" class="d-flex align-items-center gap-2">
                <small class="text-muted">Página:</small>
                <div class="btn-group btn-group-sm" role="group">
                  <button type="button" 
                          class="btn btn-outline-secondary"
                          (click)="goToPage(pagination.page - 1)" 
                          [disabled]="pagination.page === 1"
                          title="Página anterior">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <button type="button" class="btn btn-outline-secondary disabled">
                    {{ pagination.page }} / {{ pagination.totalPages }}
                  </button>
                  <button type="button" 
                          class="btn btn-outline-secondary"
                          (click)="goToPage(pagination.page + 1)" 
                          [disabled]="pagination.page === pagination.totalPages"
                          title="Página siguiente">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              <span class="badge bg-primary fs-6" *ngIf="pagination">
                Total: {{ pagination.total }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Endpoint</th>
                    <th>Método</th>
                    <th>Respuesta</th>
                    <th>Duración</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let log of bitacoraRecords">
                    <td>
                      <small>{{ log.fecha_ejecucion | date:'short' }}</small>
                    </td>
                    <td>
                      <div>
                        <strong>{{ log.usuario_nombre }}</strong>
                        <br><small class="text-muted">{{ log.usuario_email }}</small>
                      </div>
                    </td>
                    <td>
                      <code class="text-primary">{{ log.endpoint_url }}</code>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'bg-success': log.metodo_http === 'GET',
                        'bg-primary': log.metodo_http === 'POST',
                        'bg-warning': log.metodo_http === 'PUT',
                        'bg-danger': log.metodo_http === 'DELETE'
                      }">{{ log.metodo_http }}</span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'bg-success': log.codigo_respuesta >= 200 && log.codigo_respuesta < 300,
                        'bg-warning': log.codigo_respuesta >= 400 && log.codigo_respuesta < 500,
                        'bg-danger': log.codigo_respuesta >= 500
                      }">{{ log.codigo_respuesta }}</span>
                    </td>
                    <td>
                      <span [class]="getDurationClass(log.duracion_ms)">
                        {{ log.duracion_ms }}ms
                      </span>
                    </td>
                    <td>
                      <small class="text-muted">{{ log.ip_cliente }}</small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <nav *ngIf="pagination" class="mt-3">
              <ul class="pagination justify-content-center">
                <li class="page-item" [class.disabled]="!pagination.hasPrevPage">
                  <button class="page-link" (click)="goToPage(pagination.page - 1)">
                    Anterior
                  </button>
                </li>
                <li class="page-item" 
                    *ngFor="let page of getPageNumbers()" 
                    [class.active]="page === pagination.page">
                  <button class="page-link" (click)="goToPage(page)">
                    {{ page }}
                  </button>
                </li>
                <li class="page-item" [class.disabled]="!pagination.hasNextPage">
                  <button class="page-link" (click)="goToPage(pagination.page + 1)">
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <!-- Performance Tab -->
      <div *ngIf="activeTab === 'performance' && !loading" class="tab-content">
        <div class="row">
          <!-- Performance Metrics -->
          <div class="col-xl-8">
            <div class="card shadow mb-4">
              <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Métricas de Rendimiento por Endpoint</h6>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Endpoint</th>
                        <th>Método</th>
                        <th>Requests</th>
                        <th>Promedio</th>
                        <th>P90</th>
                        <th>P99</th>
                        <th>Lentos</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let metric of performanceMetrics">
                        <td>
                          <small>{{ metric.endpoint_url | slice:0:30 }}...</small>
                        </td>
                        <td>
                          <span class="badge" [ngClass]="{
                            'bg-success': metric.method === 'GET',
                            'bg-primary': metric.method === 'POST',
                            'bg-warning': metric.method === 'PUT',
                            'bg-danger': metric.method === 'DELETE'
                          }">{{ metric.method }}</span>
                        </td>
                        <td>{{ metric.total_requests | number }}</td>
                        <td>
                          <span [class]="getDurationClass(metric.avg_response_time)">
                            {{ metric.avg_response_time | number:'1.0-0' }}ms
                          </span>
                        </td>
                        <td>{{ metric.p90_response_time | number:'1.0-0' }}ms</td>
                        <td>{{ metric.p99_response_time | number:'1.0-0' }}ms</td>
                        <td>
                          <span class="text-danger" *ngIf="metric.slow_requests_count > 0">
                            {{ metric.slow_requests_count }} ({{ metric.slow_requests_percentage | number:'1.1-1' }}%)
                          </span>
                          <span class="text-success" *ngIf="metric.slow_requests_count === 0">0</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Slow Requests -->
          <div class="col-xl-4">
            <div class="card shadow mb-4">
              <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Requests Más Lentos</h6>
              </div>
              <div class="card-body">
                <div *ngFor="let request of slowRequests" class="mb-3 pb-3 border-bottom">
                  <div class="d-flex justify-content-between">
                    <small class="text-muted">{{ request.metodo_http }}</small>
                    <span class="badge bg-danger">{{ request.duracion_ms }}ms</span>
                  </div>
                  <div class="small text-truncate">
                    <code>{{ request.endpoint_url }}</code>
                  </div>
                  <div class="small text-muted">
                    {{ request.usuario_email || 'Usuario no identificado' }} - {{ request.fecha_ejecucion | date:'short' }}
                  </div>
                  <div class="small">
                    <span class="badge" [ngClass]="{
                      'bg-success': request.codigo_respuesta >= 200 && request.codigo_respuesta < 300,
                      'bg-warning': request.codigo_respuesta >= 400 && request.codigo_respuesta < 500,
                      'bg-danger': request.codigo_respuesta >= 500
                    }">{{ request.codigo_respuesta }}</span>
                    <small class="text-muted ms-2">IP: {{ request.ip_cliente }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Tab -->
      <div *ngIf="activeTab === 'security' && !loading" class="tab-content">
        <app-security-metrics [apiUrl]="getCurrentApiUrl()"></app-security-metrics>
      </div>

      <!-- Journey Tab -->
      <div *ngIf="activeTab === 'journey' && !loading" class="tab-content">
        <app-session-journey [apiUrl]="getCurrentApiUrl()"></app-session-journey>
      </div>
    </div>
  `,
  styles: [`
    .border-left-primary {
      border-left: 0.25rem solid #4e73df !important;
    }
    .border-left-danger {
      border-left: 0.25rem solid #e74a3b !important;
    }
    .border-left-info {
      border-left: 0.25rem solid #36b9cc !important;
    }
    .border-left-warning {
      border-left: 0.25rem solid #f6c23e !important;
    }
    .text-xs {
      font-size: 0.7rem;
    }
    .hour-bar {
      font-size: 0.9rem;
    }
    .progress {
      background-color: #f8f9fc;
    }
    .nav-tabs .nav-link {
      border: none;
      border-bottom: 2px solid transparent;
    }
    .nav-tabs .nav-link.active {
      border-bottom: 2px solid #4e73df;
      background: none;
    }
    code {
      font-size: 0.8rem;
    }
    .table td {
      vertical-align: middle;
    }
  `]
})
export class BitacoraDashboardComponent implements OnInit {
  activeTab = 'dashboard';
  loading = false;
  error: string | null = null;
  
  dashboardMetrics: DashboardMetrics | null = null;
  bitacoraRecords: BitacoraRecord[] = [];
  pagination: any = null;
  
  // New metrics data
  systemOverview: SystemOverview | null = null;
  endpointUsageMetrics: EndpointUsageMetrics[] = [];
  performanceMetrics: PerformanceMetrics[] = [];
  slowRequests: SlowRequest[] = [];
  errorAnalysis: ErrorAnalysis[] = [];
  securityMetrics: SecurityMetrics | null = null;
  sessionAnalytics: any = null;
  
  filters: BitacoraFilters = {
    page: 1,
    limit: 50
  };

  // Environment selector
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  private filterTimeout: any;

  constructor(private bitacoraService: BitacoraService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  private getCurrentApiUrl(): string {
    return this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
  }

  onEnvironmentChange() {
    // Reset data and reload
    this.systemOverview = null;
    this.dashboardMetrics = null;
    this.endpointUsageMetrics = [];
    this.performanceMetrics = [];
    this.slowRequests = [];
    this.bitacoraRecords = [];
    this.pagination = null;
    this.sessionAnalytics = null;
    
    // Reload current tab data
    if (this.activeTab === 'dashboard') {
      this.loadDashboard();
    } else if (this.activeTab === 'logs') {
      this.loadLogs();
    } else if (this.activeTab === 'performance') {
      this.loadPerformanceMetrics();
    } else if (this.activeTab === 'journey') {
      // Journey component will automatically reload with new apiUrl
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    
    if (tab === 'dashboard') {
      this.loadDashboard();
    } else if (tab === 'logs') {
      this.loadLogs();
    } else if (tab === 'performance') {
      this.loadPerformanceMetrics();
    } else if (tab === 'security') {
      // Security metrics are handled by the SecurityMetricsComponent
    } else if (tab === 'journey') {
      // Journey component handles its own data loading
    }
  }

  loadDashboard() {
    if (this.activeTab !== 'dashboard') return;
    
    this.loading = true;
    this.error = null;
    
    // Load enhanced dashboard with new metrics
    const apiUrl = this.getCurrentApiUrl();
    
    // Core metrics (should always be available)
    const coreRequests = {
      overview: this.bitacoraService.getSystemOverview({}, apiUrl),
      endpointUsage: this.bitacoraService.getEndpointUsageMetrics({ limit: 10 }, apiUrl),
      legacy: this.bitacoraService.getDashboardMetrics(apiUrl)
    };

    // Optional metrics (may not be available in all environments)
    const optionalRequests = {
      sessionAnalytics: this.bitacoraService.getSessionAnalytics({ period: '24h' }, apiUrl)
    };

    // Load core metrics first
    forkJoin(coreRequests).subscribe({
      next: (responses) => {
        this.loading = false;
        if (responses.overview.ok) {
          this.systemOverview = responses.overview.data;
        }
        if (responses.endpointUsage.ok) {
          this.endpointUsageMetrics = responses.endpointUsage.data;
        }
        if (responses.legacy.ok) {
          this.dashboardMetrics = responses.legacy.data;
        }
        
        // Try to load optional session analytics separately
        this.loadSessionAnalytics(apiUrl);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar el dashboard';
        console.error('Dashboard error:', err);
      }
    });
  }

  private loadSessionAnalytics(apiUrl: string) {
    // Try to load session analytics, but don't fail if endpoint doesn't exist
    this.bitacoraService.getSessionAnalytics({ period: '24h' }, apiUrl).subscribe({
      next: (response) => {
        if (response.ok) {
          this.sessionAnalytics = response.data;
        }
      },
      error: (err) => {
        // Silently handle 404 errors (endpoint not implemented in this environment)
        if (err.status === 404) {
          console.warn('Session analytics endpoint not available in this environment');
          this.sessionAnalytics = null;
        } else {
          console.error('Error loading session analytics:', err);
          // Don't set this.error here as it would show error to user for optional feature
        }
      }
    });
  }

  loadLogs() {
    if (this.activeTab !== 'logs') return;
    
    this.loading = true;
    this.error = null;
    
    const apiUrl = this.getCurrentApiUrl();
    this.bitacoraService.getBitacoraRecords(this.filters, apiUrl).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.ok) {
          this.bitacoraRecords = response.data;
          this.pagination = response.pagination;
        } else {
          this.error = response.message;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar los logs';
        console.error('Logs error:', err);
      }
    });
  }

  onFilterChange() {
    // Debounce the filter changes
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    
    this.filterTimeout = setTimeout(() => {
      this.filters.page = 1; // Reset to first page
      this.loadLogs();
    }, 500);
  }

  goToPage(page: number) {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) {
      return;
    }
    
    this.filters.page = page;
    this.loadLogs();
  }

  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    
    const total = this.pagination.totalPages;
    const current = this.pagination.page;
    const pages: number[] = [];
    
    // Show max 5 pages
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getProgressPercentage(value: number): number {
    if (!this.dashboardMetrics?.time_based_metrics?.hourly) return 0;
    
    const max = Math.max(...this.dashboardMetrics.time_based_metrics.hourly.map(h => h.total_requests));
    return max > 0 ? (value / max) * 100 : 0;
  }

  getDurationClass(duration: number): string {
    if (duration > 3000) return 'text-danger fw-bold';
    if (duration > 1000) return 'text-warning';
    return 'text-success';
  }

  refreshDashboard() {
    if (this.activeTab === 'dashboard') {
      this.loadDashboard();
    } else if (this.activeTab === 'logs') {
      this.loadLogs();
    } else if (this.activeTab === 'performance') {
      this.loadPerformanceMetrics();
    }
  }

  getFailureReasonLabel(razonFallo: string): string {
    const labels: { [key: string]: string } = {
      'incomplete_initial_information': 'Información Inicial Incompleta',
      'certification_not_found': 'Certificación No Encontrada',
      'incomplete_algorithm_information': 'Información del Algoritmo Incompleta',
      'algorithm_execution_error': 'Error en Ejecución del Algoritmo',
      'session_expired': 'Sesión Expirada',
      'invalid_token': 'Token Inválido'
    };
    return labels[razonFallo] || razonFallo;
  }

  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  formatDurationSafe(milliseconds: number | null | undefined): string {
    if (milliseconds === null || milliseconds === undefined || isNaN(milliseconds)) {
      return '0s';
    }
    return this.formatDuration(milliseconds);
  }

  hasValidSessionData(): boolean {
    if (!this.sessionAnalytics) return false;
    
    // Check if at least some meaningful data exists
    return (this.sessionAnalytics.total_sessions !== null && 
            this.sessionAnalytics.total_sessions !== undefined &&
            !isNaN(this.sessionAnalytics.total_sessions)) ||
           (this.sessionAnalytics.active_sessions !== null && 
            this.sessionAnalytics.active_sessions !== undefined &&
            !isNaN(this.sessionAnalytics.active_sessions));
  }

  loadPerformanceMetrics() {
    if (this.activeTab !== 'performance') return;
    
    this.loading = true;
    this.error = null;
    
    const apiUrl = this.getCurrentApiUrl();
    forkJoin({
      performance: this.bitacoraService.getPerformanceMetrics({ limit: 20 }, apiUrl),
      slowRequests: this.bitacoraService.getSlowRequests({ limit: 10, min_duration: 2000 }, apiUrl)
    }).subscribe({
      next: (responses) => {
        this.loading = false;
        if (responses.performance.ok) {
          this.performanceMetrics = responses.performance.data;
        }
        if (responses.slowRequests.ok) {
          this.slowRequests = responses.slowRequests.data;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar métricas de rendimiento';
        console.error('Performance metrics error:', err);
      }
    });
  }

  exportData() {
    // Use the new raw logs export for more comprehensive data
    const apiUrl = this.getCurrentApiUrl();
    this.bitacoraService.exportRawLogs({
      format: 'csv',
      max_records: 10000,
      start_date: this.filters.fecha_inicio,
      end_date: this.filters.fecha_fin,
      endpoint_url: this.filters.endpoint_url,
      method: this.filters.metodo_http
    }, apiUrl).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bitacora-endpoints-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Export error:', err);
        this.error = 'Error al exportar los datos';
      }
    });
  }
}