import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CronMonitoringFacade } from '../data-access/cron-monitoring.facade';
import { CronMonitoringService } from '../services/cron-monitoring.service';
import { JobExecutionStats, ExecutionLog, ExecutionFilters } from '../types/cron.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="job-details container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button class="btn btn-outline-secondary btn-sm mb-2" (click)="goBack()">
            <i class="fas fa-arrow-left me-1"></i> Volver
          </button>
          <h2 class="mb-0">
            <i class="fas fa-cog me-2 text-primary"></i>
            Detalles del Job: <code>{{ jobId }}</code>
          </h2>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select form-select-sm" [(ngModel)]="selectedEnvironment" (change)="onEnvironmentChange()">
            <option value="qa">QA</option>
            <option value="prod">Prod</option>
          </select>
          <button class="btn btn-success btn-sm" (click)="executeJobManually()" [disabled]="isLoading">
            <i class="fas fa-play me-1"></i>
            Ejecutar Manualmente
          </button>
          <button class="btn btn-outline-success btn-sm" (click)="refreshData()">
            <i class="fas fa-sync-alt me-1" [class.fa-spin]="isLoading"></i>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Job Info Card -->
      <div class="card shadow mb-4" *ngIf="jobInfo">
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p class="mb-2"><strong>Nombre:</strong> {{ jobInfo.job_name }}</p>
              <p class="mb-2"><strong>Frecuencia:</strong> <code>{{ jobInfo.frecuencia }}</code></p>
              <p class="mb-2"><strong>Horario:</strong> {{ jobInfo.horario_programado }}</p>
            </div>
            <div class="col-md-6">
              <p class="mb-2"><strong>Estado:</strong>
                <span [class]="'badge bg-' + (jobInfo.estatus === 'Activo' ? 'success' : 'secondary')">
                  {{ jobInfo.estatus }}
                </span>
              </p>
              <p class="mb-2"><strong>Próxima Ejecución:</strong>
                <span *ngIf="jobInfo.proxima_ejecucion">{{ jobInfo.proxima_ejecucion }}</span>
                <span *ngIf="!jobInfo.proxima_ejecucion" class="text-muted">No programada</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4" *ngIf="stats">
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Ejecuciones
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ stats.total_executions }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-tasks fa-2x text-gray-300"></i>
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
                    Tasa de Éxito
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ formatSuccessRate(stats.success_rate) }}%
                  </div>
                  <div class="progress mt-2" style="height: 4px;">
                    <div
                      class="progress-bar bg-success"
                      [style.width.%]="getSuccessRateValue(stats.success_rate)">
                    </div>
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-circle fa-2x text-gray-300"></i>
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
                    Duración Promedio
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ cronService.formatDuration(stats.avg_duration_ms) }}
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
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Última Ejecución
                  </div>
                  <div class="small mb-0 font-weight-bold text-gray-800">
                    <span *ngIf="stats && stats.last_execution">
                      {{ cronService.getRelativeTime(stats.last_execution) }}
                    </span>
                    <span *ngIf="!stats || !stats.last_execution" class="text-muted">Sin ejecuciones</span>
                  </div>
                  <div *ngIf="stats && stats.last_execution" class="mt-1">
                    <small class="text-muted">
                      {{ formatDate(stats.last_execution) }}
                    </small>
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-history fa-2x text-gray-300"></i>
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
              <select class="form-select form-select-sm" [(ngModel)]="filters.status" (change)="applyFilters()">
                <option [ngValue]="undefined">Todos</option>
                <option value="SUCCESS">Exitoso</option>
                <option value="ERROR">Error</option>
                <option value="STARTED">En proceso</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Tipo de Ejecución</label>
              <select class="form-select form-select-sm" [(ngModel)]="filters.executionType" (change)="applyFilters()">
                <option [ngValue]="undefined">Todos</option>
                <option value="AUTO">Automática</option>
                <option value="MANUAL">Manual</option>
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
          </div>
          <div class="row mt-3">
            <div class="col-12">
              <button class="btn btn-sm btn-secondary" (click)="clearFilters()">
                <i class="fas fa-times me-1"></i> Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading && executions.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="mt-3">Cargando ejecuciones...</div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger alert-dismissible fade show">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
        <button type="button" class="btn-close" (click)="error = null"></button>
      </div>

      <!-- Executions Table -->
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">
            Historial de Ejecuciones
            <span class="badge bg-secondary ms-2">{{ totalRecords }} registros</span>
          </h6>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Inicio</th>
                  <th>Duración</th>
                  <th>Memoria</th>
                  <th>Registros</th>
                  <th>Email</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let exec of executions">
                  <td><code>{{ exec.id || exec.log_id }}</code></td>
                  <td>
                    <span [class]="'badge bg-' + (exec.execution_type === 'MANUAL' ? 'info' : 'secondary')">
                      {{ exec.execution_type }}
                    </span>
                  </td>
                  <td>
                    <span [class]="'badge bg-' + cronService.getStatusColor(exec.status)">
                      <i [class]="'fas ' + cronService.getStatusIcon(exec.status)"></i>
                      {{ exec.status }}
                    </span>
                  </td>
                  <td>
                    <small>{{ formatDate(exec.start_time) }}</small>
                  </td>
                  <td>{{ cronService.formatDuration(exec.duration_ms) }}</td>
                  <td>{{ cronService.formatMemory(exec.memory_usage_mb) }}</td>
                  <td>{{ exec.records_processed || 'N/A' }}</td>
                  <td>
                    <span *ngIf="exec.email_sent" class="text-success">
                      <i class="fas fa-check"></i>
                    </span>
                    <span *ngIf="!exec.email_sent" class="text-muted">
                      <i class="fas fa-times"></i>
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn btn-sm btn-outline-primary"
                      (click)="toggleExecutionDetails(exec)"
                      [class.active]="(expandedExecution?.id || expandedExecution?.log_id) === (exec.id || exec.log_id)">
                      <i class="fas fa-chevron-down"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="expandedExecution" class="execution-details">
                  <td colspan="9">
                    <div class="card mb-0">
                      <div class="card-body">
                        <h6 class="card-title">Detalles de Ejecución #{{ expandedExecution.id || expandedExecution.log_id }}</h6>
                        <div class="row">
                          <div class="col-md-6">
                            <p><strong>Origen:</strong> {{ expandedExecution.trigger_source }}</p>
                            <p><strong>Inicio:</strong> {{ formatDate(expandedExecution.start_time) }}</p>
                            <p><strong>Fin:</strong> {{ expandedExecution.end_time ? formatDate(expandedExecution.end_time) : 'N/A' }}</p>
                            <p><strong>Próxima ejecución:</strong> {{ expandedExecution.next_scheduled_run ? formatDate(expandedExecution.next_scheduled_run) : 'N/A' }}</p>
                          </div>
                          <div class="col-md-6">
                            <p><strong>Email enviado:</strong> {{ expandedExecution.email_sent ? 'Sí' : 'No' }}</p>
                            <p *ngIf="expandedExecution.email_recipients">
                              <strong>Destinatarios:</strong> {{ expandedExecution.email_recipients }}
                            </p>
                          </div>
                        </div>
                        <div *ngIf="expandedExecution.error_message" class="mt-3">
                          <h6 class="text-danger">Mensaje de Error:</h6>
                          <pre class="bg-light p-3 rounded">{{ expandedExecution.error_message }}</pre>
                        </div>
                        <div *ngIf="expandedExecution.stack_trace" class="mt-3">
                          <h6 class="text-danger">Stack Trace:</h6>
                          <pre class="bg-light p-3 rounded" style="max-height: 300px; overflow-y: auto;">{{ expandedExecution.stack_trace }}</pre>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="executions.length === 0 && !isLoading">
                  <td colspan="9" class="text-center text-muted py-4">
                    No se encontraron ejecuciones
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
  `,
  styles: [`
    .job-details {
      position: relative;
      z-index: 1;
    }

    .border-left-primary {
      border-left: 0.25rem solid #4e73df !important;
    }
    .border-left-success {
      border-left: 0.25rem solid #1cc88a !important;
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
    .execution-details {
      background-color: #f8f9fa;
    }
    pre {
      font-size: 0.875rem;
    }
  `]
})
export class JobDetailsComponent implements OnInit, OnDestroy {
  jobId: string = '';
  stats: JobExecutionStats | null = null;
  jobInfo: any = null;  // Información del job (nombre, frecuencia, próxima ejecución, etc.)
  executions: ExecutionLog[] = [];
  expandedExecution: ExecutionLog | null = null;
  isLoading = false;
  error: string | null = null;
  totalRecords = 0;

  filters: ExecutionFilters = {
    limit: 20,
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
    public facade: CronMonitoringFacade,
    public cronService: CronMonitoringService
  ) {}

  ngOnInit(): void {
    // Leer el ambiente del query parameter
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['env']) {
        this.selectedEnvironment = queryParams['env'] as 'qa' | 'prod';
        console.log('🔧 [JOB-DETAILS] Ambiente desde URL:', this.selectedEnvironment);
      }
    });

    this.route.params.subscribe(params => {
      this.jobId = params['jobId'];
      this.filters.jobId = this.jobId;
      this.subscribeToFacade();
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.facade.disableAutoRefresh();
  }

  private subscribeToFacade(): void {
    this.facade.isLoading$.subscribe(loading => {
      console.log('📊 [JOB-DETAILS] Loading state cambió a:', loading);
      this.isLoading = loading;
    });

    this.facade.error$.subscribe(error => {
      console.log('📊 [JOB-DETAILS] Error state cambió a:', error);
      this.error = error;
    });

    this.facade.jobStats$.subscribe((response: any) => {
      console.log('📊 [JOB-DETAILS] Stats response recibida:', response);
      console.log('📊 [JOB-DETAILS] response.proxima_ejecucion:', response?.proxima_ejecucion);
      console.log('📊 [JOB-DETAILS] response.horario_programado:', response?.horario_programado);
      console.log('📊 [JOB-DETAILS] response.stats:', response?.stats);
      console.log('📊 [JOB-DETAILS] response.stats.last_execution:', response?.stats?.last_execution);

      // Separar la información del job de las estadísticas
      if (response) {
        this.jobInfo = {
          job_id: response.job_id,
          job_name: response.job_name,
          frecuencia: response.frecuencia,
          estatus: response.estatus,
          horario_programado: response.horario_programado,
          proxima_ejecucion: response.proxima_ejecucion,
          proxima_ejecucion_timestamp: response.proxima_ejecucion_timestamp
        };
        this.stats = response.stats;

        console.log('📊 [JOB-DETAILS] Job Info creado:', this.jobInfo);
        console.log('📊 [JOB-DETAILS] jobInfo.proxima_ejecucion:', this.jobInfo.proxima_ejecucion);
        console.log('📊 [JOB-DETAILS] Stats asignadas:', this.stats);
        console.log('📊 [JOB-DETAILS] stats.last_execution:', this.stats?.last_execution);
      }
    });

    this.facade.executionLogs$.subscribe(executions => {
      console.log('📊 [JOB-DETAILS] Executions recibidas:', executions);
      console.log('📊 [JOB-DETAILS] Número de ejecuciones:', executions.length);
      this.executions = executions;
    });

    this.facade.totalRecords$.subscribe(total => {
      console.log('📊 [JOB-DETAILS] Total de registros:', total);
      this.totalRecords = total;
    });
  }

  loadData(): void {
    const baseUrl = this.getCurrentBaseUrl();
    console.log('📊 [JOB-DETAILS] Cargando datos para job:', this.jobId);
    console.log('📊 [JOB-DETAILS] Ambiente:', this.selectedEnvironment);
    console.log('📊 [JOB-DETAILS] Base URL:', baseUrl);
    console.log('📊 [JOB-DETAILS] Filtros:', this.filters);

    this.facade.loadJobStats(this.jobId, baseUrl);
    this.facade.loadExecutionLogs(this.filters, baseUrl);
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
      this.filters.dateRange = {
        startDate: this.startDate,
        endDate: this.endDate
      };
    } else {
      delete this.filters.dateRange;
    }

    const baseUrl = this.getCurrentBaseUrl();
    this.facade.loadExecutionLogs(this.filters, baseUrl);
  }

  clearFilters(): void {
    this.filters = {
      jobId: this.jobId,
      limit: 20,
      offset: 0
    };
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  toggleExecutionDetails(execution: ExecutionLog): void {
    const execId = execution.id || execution.log_id;
    const expandedId = this.expandedExecution?.id || this.expandedExecution?.log_id;

    if (expandedId === execId) {
      this.expandedExecution = null;
    } else {
      this.expandedExecution = execution;
    }
  }

  executeJobManually(): void {
    if (!confirm(`¿Está seguro de que desea ejecutar manualmente el job "${this.jobId}"?`)) {
      return;
    }

    const baseUrl = this.getCurrentBaseUrl();
    console.log('🚀 [JOB-DETAILS] Ejecutando job manualmente...');

    this.facade.executeJob(this.jobId, baseUrl).subscribe({
      next: (response) => {
        console.log('✅ [JOB-DETAILS] Respuesta recibida:', response);

        if (response.success) {
          console.log('✅ [JOB-DETAILS] Job ejecutado exitosamente. Esperando 3 segundos antes de recargar...');
          alert(`Job ejecutado exitosamente\nDuración: ${response.duracion_segundos}s\n\n⚠️ Esperando 3 segundos para recargar datos...`);

          setTimeout(() => {
            console.log('🔄 [JOB-DETAILS] Recargando datos después de ejecución manual...');
            this.loadData();
          }, 3000);
        } else {
          console.error('❌ [JOB-DETAILS] Error en la ejecución:', response.mensaje);
          alert(`Error: ${response.mensaje}`);
        }
      },
      error: (err) => {
        console.error('❌ [JOB-DETAILS] Error al ejecutar job:', err);
        alert('Error al ejecutar el job');
      }
    });
  }

  nextPage(): void {
    this.filters.offset += this.filters.limit;
    this.applyFilters();
  }

  previousPage(): void {
    this.filters.offset = Math.max(0, this.filters.offset - this.filters.limit);
    this.applyFilters();
  }

  goBack(): void {
    this.router.navigate(['/cron-monitoring']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatSuccessRate(rate: number | string): string {
    if (typeof rate === 'string') {
      return rate;
    }
    return rate.toFixed(1);
  }

  getSuccessRateValue(rate: number | string): number {
    if (typeof rate === 'string') {
      return parseFloat(rate);
    }
    return rate;
  }
}
