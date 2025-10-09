import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EncuestasMonitoringFacade } from '../data-access/encuestas-monitoring.facade';
import { EncuestasMonitoringService } from '../services/encuestas-monitoring.service';
import { Encuesta, EncuestasStats, EncuestasFilters, UsuarioSinEncuesta, ErrorAnalysis } from '../types/encuestas.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-encuestas-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="encuestas-dashboard container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-poll me-2 text-primary"></i>
          Monitoreo de Encuestas
        </h2>
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm" [(ngModel)]="selectedEnvironment" (change)="onEnvironmentChange()">
            <option value="qa">QA</option>
            <option value="prod">Prod</option>
          </select>
          <button class="btn btn-outline-success btn-sm" (click)="refreshData()">
            <i class="fas fa-sync-alt me-1" [class.fa-spin]="isLoading"></i>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'encuestas'" (click)="activeTab = 'encuestas'">
            <i class="fas fa-clipboard-list me-1"></i>
            Encuestas
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'usuarios-sin-encuestas'" (click)="switchToErrorsTab()">
            <i class="fas fa-user-times me-1"></i>
            Usuarios Sin Encuestas
          </a>
        </li>
      </ul>

      <!-- Stats Cards (Tab Encuestas) -->
      <div *ngIf="activeTab === 'encuestas'">
      <div class="row mb-4" *ngIf="stats">
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Encuestas
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ stats.total_encuestas }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-clipboard-list fa-2x text-gray-300"></i>
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
                    Con Errores
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ stats.encuestas_con_errores }}
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
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    % Errores
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ stats.porcentaje_errores }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-percentage fa-2x text-gray-300"></i>
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
                    Sin Errores
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ stats.total_encuestas - stats.encuestas_con_errores }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">Filtros de Búsqueda</h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <label class="form-label">Estado</label>
              <select class="form-select form-select-sm" [(ngModel)]="filters.hasErrors" (change)="applyFilters()">
                <option [ngValue]="undefined">Todas</option>
                <option [ngValue]="true">Solo con errores</option>
                <option [ngValue]="false">Sin errores</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha Inicio</label>
              <input
                type="date"
                class="form-control form-control-sm"
                [(ngModel)]="startDate"
                (change)="applyFilters()">
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha Fin</label>
              <input
                type="date"
                class="form-control form-control-sm"
                [(ngModel)]="endDate"
                (change)="applyFilters()">
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <button class="btn btn-sm btn-secondary" (click)="clearFilters()">
                <i class="fas fa-times me-1"></i> Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading && encuestas.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="mt-3">Cargando encuestas...</div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger alert-dismissible fade show">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
        <button type="button" class="btn-close" (click)="error = null"></button>
      </div>

      <!-- Encuestas Table -->
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">
            Listado de Encuestas
            <span class="badge bg-secondary ms-2">{{ totalRecords }} registros</span>
          </h6>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Empresa</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Teléfonos</th>
                  <th>Estado</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let encuesta of encuestas">
                  <td><code>{{ encuesta.id_encuesta }}</code></td>
                  <td>
                    <small>{{ encuesta.empresa || 'N/A' }}</small>
                  </td>
                  <td>
                    <small>{{ encuesta.nombre || 'N/A' }}</small>
                  </td>
                  <td>
                    <small>{{ encuesta.correo_contacto || 'N/A' }}</small>
                  </td>
                  <td>
                    <small *ngIf="encuesta.telefono_empresa || encuesta.telefono_personal">
                      <div *ngIf="encuesta.telefono_empresa">
                        <i class="fas fa-building me-1"></i>{{ encuesta.telefono_empresa }}
                      </div>
                      <div *ngIf="encuesta.telefono_personal">
                        <i class="fas fa-user me-1"></i>{{ encuesta.telefono_personal }}
                      </div>
                    </small>
                    <small *ngIf="!encuesta.telefono_empresa && !encuesta.telefono_personal" class="text-muted">N/A</small>
                  </td>
                  <td>
                    <span [class]="'badge bg-' + encuestasService.getStatusColor(encuesta.tiene_errores)">
                      <i [class]="'fas ' + encuestasService.getStatusIcon(encuesta.tiene_errores)"></i>
                      {{ encuesta.tiene_errores ? 'Con Errores' : 'OK' }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn btn-sm btn-outline-primary"
                      (click)="toggleEncuestaDetails(encuesta)"
                      [class.active]="expandedEncuesta?.id_encuesta === encuesta.id_encuesta">
                      <i class="fas fa-chevron-down"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="expandedEncuesta" class="encuesta-details">
                  <td colspan="7">
                    <div class="card mb-0">
                      <div class="card-body">
                        <h6 class="card-title">Detalles de Encuesta #{{ expandedEncuesta.id_encuesta }}</h6>
                        <div class="row">
                          <div class="col-md-6">
                            <h6 class="text-primary mt-2">Información de Contacto</h6>
                            <p><strong>Empresa:</strong> {{ expandedEncuesta.empresa || 'N/A' }}</p>
                            <p><strong>Nombre:</strong> {{ expandedEncuesta.nombre || 'N/A' }}</p>
                            <p><strong>Correo:</strong> {{ expandedEncuesta.correo_contacto || 'N/A' }}</p>
                            <p><strong>Teléfono empresa:</strong> {{ expandedEncuesta.telefono_empresa || 'N/A' }}</p>
                            <p><strong>Teléfono personal:</strong> {{ expandedEncuesta.telefono_personal || 'N/A' }}</p>
                          </div>
                          <div class="col-md-6">
                            <h6 class="text-primary mt-2">Información de la Encuesta</h6>
                            <p><strong>A la empresa le gustaría:</strong> {{ expandedEncuesta.a_la_empresa_le_gustaria || 'N/A' }}</p>
                            <p><strong>Número de clientes a crédito:</strong> {{ expandedEncuesta.numero_clientes_credito || 'N/A' }}</p>
                            <p><strong>Rango de ventas a crédito mensual:</strong> {{ expandedEncuesta.rango_ventas_credito_mensual || 'N/A' }}</p>
                          </div>
                        </div>
                        <div *ngIf="expandedEncuesta.errores_detectados && expandedEncuesta.errores_detectados.length > 0" class="mt-3">
                          <h6 class="text-danger">Errores Detectados:</h6>
                          <ul class="list-group">
                            <li *ngFor="let error of expandedEncuesta.errores_detectados" class="list-group-item list-group-item-danger">
                              <i class="fas fa-exclamation-circle me-2"></i>{{ error }}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="encuestas.length === 0 && !isLoading">
                  <td colspan="7" class="text-center text-muted py-4">
                    No se encontraron encuestas
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="d-flex justify-content-between align-items-center mt-3" *ngIf="totalRecords > filters.limit">
            <div>
              Mostrando {{ filters.offset + 1 }} - {{ Math.min(filters.offset + filters.limit, totalRecords) }} de {{ totalRecords }}
            </div>
            <div class="btn-group">
              <button
                class="btn btn-sm btn-outline-primary"
                [disabled]="filters.offset === 0"
                (click)="previousPage()">
                <i class="fas fa-chevron-left"></i> Anterior
              </button>
              <button
                class="btn btn-sm btn-outline-primary"
                [disabled]="filters.offset + filters.limit >= totalRecords"
                (click)="nextPage()">
                Siguiente <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
      <!-- End Tab Encuestas -->

      <!-- Tab Usuarios Sin Encuestas -->
      <div *ngIf="activeTab === 'usuarios-sin-encuestas'">
        <!-- Analysis Card -->
        <div class="row mb-4" *ngIf="errorAnalysis">
          <div class="col-12">
            <div class="card shadow">
              <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">
                  <i class="fas fa-chart-line me-2"></i>
                  Análisis de Errores
                </h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-3">
                    <div class="text-center">
                      <div class="text-xs font-weight-bold text-uppercase mb-1">Tasa de Error</div>
                      <div class="h4 mb-0 font-weight-bold" [class]="getSeverityClass(errorAnalysis.severity)">
                        {{ errorAnalysis.error_rate }}%
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="text-center">
                      <div class="text-xs font-weight-bold text-uppercase mb-1">Severidad</div>
                      <span class="badge" [class]="getSeverityBadgeClass(errorAnalysis.severity)">
                        {{ getSeverityText(errorAnalysis.severity) }}
                      </span>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="text-xs font-weight-bold text-uppercase mb-2">Recomendaciones</div>
                    <ul class="small mb-0">
                      <li *ngFor="let rec of errorAnalysis.recommendations">{{ rec }}</li>
                    </ul>
                  </div>
                </div>
                <div class="row mt-3" *ngIf="errorAnalysis.log_search_terms.length > 0">
                  <div class="col-12">
                    <div class="text-xs font-weight-bold text-uppercase mb-2">Términos de Búsqueda para Logs</div>
                    <div class="d-flex flex-wrap gap-2">
                      <span *ngFor="let term of errorAnalysis.log_search_terms" class="badge bg-info">
                        {{ term }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Usuarios Sin Encuestas Table -->
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-danger">
              <i class="fas fa-user-times me-2"></i>
              Usuarios Sin Encuestas
              <span class="badge bg-danger ms-2">{{ usuariosSinEncuestas.length }} usuarios</span>
            </h6>
          </div>
          <div class="card-body">
            <div *ngIf="isLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="mt-3">Cargando usuarios...</div>
            </div>

            <div *ngIf="!isLoading && usuariosSinEncuestas.length > 0" class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>ID Usuario</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Empresa</th>
                    <th>Fecha Registro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let usuario of usuariosSinEncuestas">
                    <td><code>{{ usuario.id_usuario }}</code></td>
                    <td>{{ usuario.nombre || 'N/A' }}</td>
                    <td><small>{{ usuario.email || 'N/A' }}</small></td>
                    <td><small>{{ usuario.empresa || 'N/A' }}</small></td>
                    <td><small>{{ encuestasService.formatDate(usuario.fecha_registro) }}</small></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div *ngIf="!isLoading && usuariosSinEncuestas.length === 0" class="text-center py-5">
              <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
              <h5 class="text-success">¡Excelente!</h5>
              <p class="text-muted">Todos los usuarios tienen encuestas registradas.</p>
            </div>
          </div>
        </div>
      </div>
      <!-- End Tab Usuarios Sin Encuestas -->

    </div>
  `,
  styles: [`
    .encuestas-dashboard {
      position: relative;
      z-index: 1;
    }

    .border-left-primary {
      border-left: 0.25rem solid #4e73df !important;
    }
    .border-left-success {
      border-left: 0.25rem solid #1cc88a !important;
    }
    .border-left-warning {
      border-left: 0.25rem solid #f6c23e !important;
    }
    .border-left-danger {
      border-left: 0.25rem solid #e74a3b !important;
    }
    .text-xs {
      font-size: 0.7rem;
    }
    .encuesta-details {
      background-color: #f8f9fa;
    }
  `]
})
export class EncuestasDashboardComponent implements OnInit, OnDestroy {
  encuestas: Encuesta[] = [];
  stats: EncuestasStats | null = null;
  expandedEncuesta: Encuesta | null = null;
  isLoading = false;
  error: string | null = null;
  totalRecords = 0;

  // Para el tab de usuarios sin encuestas
  usuariosSinEncuestas: UsuarioSinEncuesta[] = [];
  errorAnalysis: ErrorAnalysis | null = null;
  activeTab: 'encuestas' | 'usuarios-sin-encuestas' = 'encuestas';

  filters: EncuestasFilters = {
    limit: 50,
    offset: 0
  };

  startDate: string = '';
  endDate: string = '';

  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public facade: EncuestasMonitoringFacade,
    public encuestasService: EncuestasMonitoringService
  ) {}

  ngOnInit(): void {
    // Leer el ambiente del query parameter
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['env']) {
        this.selectedEnvironment = queryParams['env'] as 'qa' | 'prod';
        console.log('🔧 [ENCUESTAS] Ambiente desde URL:', this.selectedEnvironment);
      }
    });

    this.subscribeToFacade();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.facade.clearState();
  }

  private subscribeToFacade(): void {
    this.facade.isLoading$.subscribe(loading => this.isLoading = loading);
    this.facade.error$.subscribe(error => this.error = error);
    this.facade.encuestas$.subscribe(encuestas => {
      console.log('📋 [ENCUESTAS] Encuestas recibidas:', encuestas);
      this.encuestas = encuestas;
    });
    this.facade.stats$.subscribe(stats => this.stats = stats);
    this.facade.totalRecords$.subscribe(total => this.totalRecords = total);
    this.facade.usuariosSinEncuestas$.subscribe(usuarios => {
      console.log('📋 [ENCUESTAS] Usuarios sin encuestas recibidos:', usuarios);
      this.usuariosSinEncuestas = usuarios;
    });
    this.facade.errorAnalysis$.subscribe(analysis => {
      console.log('📋 [ENCUESTAS] Error analysis recibido:', analysis);
      this.errorAnalysis = analysis;
    });
  }

  loadData(): void {
    const baseUrl = this.getCurrentBaseUrl();
    console.log('📊 [ENCUESTAS] Cargando datos');
    console.log('📊 [ENCUESTAS] Ambiente:', this.selectedEnvironment);
    console.log('📊 [ENCUESTAS] Base URL:', baseUrl);
    console.log('📊 [ENCUESTAS] Filtros:', this.filters);

    this.facade.loadEncuestas(this.filters, baseUrl);
  }

  refreshData(): void {
    this.loadData();
  }

  onEnvironmentChange(): void {
    this.facade.clearState();
    this.loadData();
  }

  getCurrentBaseUrl(): string {
    return this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
  }

  applyFilters(): void {
    this.filters.offset = 0;

    if (this.startDate && this.endDate) {
      this.filters.startDate = this.startDate;
      this.filters.endDate = this.endDate;
    } else {
      delete this.filters.startDate;
      delete this.filters.endDate;
    }

    this.loadData();
  }

  clearFilters(): void {
    this.filters = {
      limit: 50,
      offset: 0
    };
    this.startDate = '';
    this.endDate = '';
    this.loadData();
  }

  toggleEncuestaDetails(encuesta: Encuesta): void {
    if (this.expandedEncuesta?.id_encuesta === encuesta.id_encuesta) {
      this.expandedEncuesta = null;
    } else {
      this.expandedEncuesta = encuesta;
    }
  }

  switchToErrorsTab(): void {
    this.activeTab = 'usuarios-sin-encuestas';
    if (this.usuariosSinEncuestas.length === 0) {
      const baseUrl = this.getCurrentBaseUrl();
      this.facade.loadSurveyErrors(baseUrl);
    }
  }

  getSeverityClass(severity: string): string {
    const classes: Record<string, string> = {
      'low': 'text-success',
      'medium': 'text-warning',
      'high': 'text-danger',
      'critical': 'text-danger fw-bold'
    };
    return classes[severity] || 'text-secondary';
  }

  getSeverityBadgeClass(severity: string): string {
    const classes: Record<string, string> = {
      'low': 'bg-success',
      'medium': 'bg-warning',
      'high': 'bg-danger',
      'critical': 'bg-dark'
    };
    return classes[severity] || 'bg-secondary';
  }

  getSeverityText(severity: string): string {
    const texts: Record<string, string> = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'critical': 'Crítica'
    };
    return texts[severity] || severity;
  }

  nextPage(): void {
    this.filters.offset += this.filters.limit;
    this.loadData();
  }

  previousPage(): void {
    this.filters.offset = Math.max(0, this.filters.offset - this.filters.limit);
    this.loadData();
  }
}
