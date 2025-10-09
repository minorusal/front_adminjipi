import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CronMonitoringFacade } from '../data-access/cron-monitoring.facade';
import { CronMonitoringService } from '../services/cron-monitoring.service';
import { JobMonitoring, ExecutionLog } from '../types/cron.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-cron-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cron-dashboard container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-clock me-2 text-primary"></i>
          Monitoreo de Cron Jobs
        </h2>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select form-select-sm" [(ngModel)]="selectedEnvironment" (change)="onEnvironmentChange()">
            <option value="qa">QA</option>
            <option value="prod">Prod</option>
          </select>
          <button class="btn btn-outline-success btn-sm" (click)="refreshData()">
            <i class="fas fa-sync-alt me-1" [class.fa-spin]="isLoading"></i>
            Actualizar
          </button>
          <div class="form-check form-switch mb-0">
            <input
              class="form-check-input"
              type="checkbox"
              id="autoRefresh"
              [(ngModel)]="autoRefresh"
              (change)="toggleAutoRefresh()">
            <label class="form-check-label" for="autoRefresh">
              Auto-refresh (30s)
            </label>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total de Jobs
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ jobs.length }}
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
                    Jobs Activos
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ getActiveJobsCount() }}
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
                    Tasa Promedio de Éxito
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ getAverageSuccessRate() }}%
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
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Ambiente Actual
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ selectedEnvironment.toUpperCase() }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-server fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading && jobs.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="mt-3">Cargando jobs...</div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger alert-dismissible fade show">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
        <button type="button" class="btn-close" (click)="error = null"></button>
      </div>

      <!-- Jobs List -->
      <div *ngIf="!isLoading || jobs.length > 0" class="row">
        <div class="col-12">
          <div class="card shadow mb-4">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">Lista de Jobs Programados</h6>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>Nombre</th>
                      <th>Estado</th>
                      <th>Tasa de Éxito</th>
                      <th>Última Ejecución</th>
                      <th>Próxima Ejecución</th>
                      <th>Ejecuciones Recientes</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let job of jobs" class="cursor-pointer" (click)="viewJobDetails(job.job_id)">
                      <td><code>{{ job.job_id }}</code></td>
                      <td>
                        <div>{{ job.nombre_job }}</div>
                        <small class="text-muted" *ngIf="job.frecuencia">
                          <i class="fas fa-clock me-1"></i>
                          {{ cronService.parseCronExpression(job.frecuencia) }}
                        </small>
                        <small class="text-muted" *ngIf="!job.frecuencia">
                          <i class="fas fa-clock me-1"></i>
                          Sin programación
                        </small>
                      </td>
                      <td>
                        <span [class]="'badge bg-' + (job.estatus === 'Activo' ? 'success' : 'secondary')">
                          {{ job.estatus }}
                        </span>
                      </td>
                      <td>
                        <div class="d-flex align-items-center" *ngIf="job.success_rate">
                          <div class="progress flex-grow-1 me-2" style="height: 20px;">
                            <div
                              class="progress-bar"
                              [class.bg-success]="parseFloat(job.success_rate) >= 80"
                              [class.bg-warning]="parseFloat(job.success_rate) >= 50 && parseFloat(job.success_rate) < 80"
                              [class.bg-danger]="parseFloat(job.success_rate) < 50"
                              [style.width.%]="job.success_rate">
                              {{ job.success_rate }}%
                            </div>
                          </div>
                        </div>
                        <span *ngIf="!job.success_rate" class="text-muted">N/A</span>
                      </td>
                      <td>
                        <small *ngIf="job.last_execution">
                          {{ cronService.getRelativeTime(job.last_execution) }}
                        </small>
                        <small *ngIf="!job.last_execution" class="text-muted">N/A</small>
                      </td>
                      <td>
                        <small *ngIf="job.next_execution">
                          {{ job.next_execution }}
                        </small>
                        <small *ngIf="!job.next_execution" class="text-muted">N/A</small>
                      </td>
                      <td>
                        <div class="d-flex gap-1" *ngIf="job.recent_executions && job.recent_executions.length > 0">
                          <span
                            *ngFor="let exec of job.recent_executions.slice(0, 5)"
                            [class]="'badge bg-' + cronService.getStatusColor(exec.status)"
                            [title]="exec.status + ' - ' + formatDate(exec.start_time)">
                            <i [class]="'fas ' + cronService.getStatusIcon(exec.status)"></i>
                          </span>
                        </div>
                        <span *ngIf="!job.recent_executions || job.recent_executions.length === 0" class="text-muted">
                          Sin ejecuciones
                        </span>
                      </td>
                      <td>
                        <button
                          class="btn btn-sm btn-primary me-1"
                          (click)="viewJobDetails(job.job_id); $event.stopPropagation()"
                          title="Ver detalles">
                          <i class="fas fa-eye"></i>
                        </button>
                        <button
                          class="btn btn-sm btn-success"
                          (click)="executeJobManually(job); $event.stopPropagation()"
                          [disabled]="isLoading"
                          title="Ejecutar manualmente">
                          <i class="fas fa-play"></i>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="jobs.length === 0 && !isLoading">
                      <td colspan="8" class="text-center text-muted py-4">
                        No hay jobs configurados
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cron-dashboard {
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
    .cursor-pointer {
      cursor: pointer;
    }
    .cursor-pointer:hover {
      background-color: #f8f9fa;
    }
    .progress {
      background-color: #e9ecef;
    }
  `]
})
export class CronDashboardComponent implements OnInit, OnDestroy {
  jobs: JobMonitoring[] = [];
  isLoading = false;
  error: string | null = null;
  autoRefresh = false;

  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  constructor(
    public facade: CronMonitoringFacade,
    public cronService: CronMonitoringService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Leer el ambiente del query parameter
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['env']) {
        this.selectedEnvironment = queryParams['env'] as 'qa' | 'prod';
        console.log('🔧 [DASHBOARD] Ambiente desde URL:', this.selectedEnvironment);
      }
    });

    this.subscribeToFacade();
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.facade.disableAutoRefresh();
  }

  private subscribeToFacade(): void {
    this.facade.isLoading$.subscribe(loading => this.isLoading = loading);
    this.facade.error$.subscribe(error => this.error = error);
    this.facade.jobs$.subscribe(jobs => {
      console.log('📋 [DASHBOARD] Jobs recibidos:', jobs);
      jobs.forEach(job => {
        console.log(`📋 [DASHBOARD] Job ${job.job_id}:`, {
          last_execution: job.last_execution,
          next_execution: job.next_execution,
          success_rate: job.success_rate
        });
      });
      this.jobs = jobs;
    });
  }

  loadJobs(): void {
    const baseUrl = this.getCurrentBaseUrl();
    this.facade.loadJobs(baseUrl);
  }

  refreshData(): void {
    this.loadJobs();
  }

  onEnvironmentChange(): void {
    this.facade.clearState();
    this.loadJobs();

    if (this.autoRefresh) {
      this.facade.disableAutoRefresh();
      this.facade.enableAutoRefresh(this.getCurrentBaseUrl());
    }
  }

  toggleAutoRefresh(): void {
    if (this.autoRefresh) {
      this.facade.enableAutoRefresh(this.getCurrentBaseUrl());
    } else {
      this.facade.disableAutoRefresh();
    }
  }

  getCurrentBaseUrl(): string {
    return this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
  }

  getActiveJobsCount(): number {
    return this.jobs.filter(job => job.estatus === 'Activo').length;
  }

  getAverageSuccessRate(): string {
    if (this.jobs.length === 0) return '0';
    const jobsWithRate = this.jobs.filter(job => job.success_rate);
    if (jobsWithRate.length === 0) return '0';
    const sum = jobsWithRate.reduce((acc, job) => acc + parseFloat(job.success_rate!), 0);
    return (sum / jobsWithRate.length).toFixed(1);
  }

  viewJobDetails(jobId: string): void {
    this.router.navigate(['/cron-monitoring/job', jobId], {
      queryParams: { env: this.selectedEnvironment }
    });
  }

  executeJobManually(job: JobMonitoring): void {
    if (!confirm(`¿Está seguro de que desea ejecutar manualmente el job "${job.nombre_job}"?`)) {
      return;
    }

    const baseUrl = this.getCurrentBaseUrl();
    this.facade.executeJob(job.job_id, baseUrl).subscribe({
      next: (response) => {
        if (response.success) {
          alert(`Job "${job.nombre_job}" ejecutado exitosamente.\nDuración: ${response.duracion_segundos}s`);
          // Recargar después de 2 segundos para ver el resultado
          setTimeout(() => this.loadJobs(), 2000);
        } else {
          alert(`Error: ${response.mensaje}`);
        }
      },
      error: (err) => {
        alert('Error al ejecutar el job');
        console.error(err);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  parseFloat(value: string | undefined): number {
    if (!value) return 0;
    return parseFloat(value);
  }
}
