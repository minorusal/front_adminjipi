import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DashboardAdminFacade } from '../data-access/dashboard-admin.facade';
import { DashboardAdminService } from '../services/dashboard-admin.service';
import { ErroresAlertas } from '../types/dashboard.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-alertas-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="alertas-dashboard container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button class="btn btn-outline-secondary btn-sm mb-2" (click)="goBack()">
            <i class="fas fa-arrow-left me-1"></i> Volver
          </button>
          <h2 class="mb-0">
            <i class="fas fa-exclamation-triangle me-2 text-warning"></i>
            Errores y Alertas
          </h2>
        </div>
        <div class="d-flex gap-2 align-items-center">
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

      <!-- Loading State -->
      <div *ngIf="isLoading && !alertas" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="mt-3">Cargando alertas...</div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger alert-dismissible fade show">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
        <button type="button" class="btn-close" (click)="error = null"></button>
      </div>

      <!-- Resumen de Alertas -->
      <div class="row mb-4" *ngIf="alertas">
        <div class="col-xl-2 col-md-4 col-sm-6 mb-3">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                Total Alertas
              </div>
              <div class="h5 mb-0 font-weight-bold text-gray-800">
                {{ alertas.resumen.total_alertas }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-2 col-md-4 col-sm-6 mb-3">
          <div class="card border-left-danger shadow h-100 py-2">
            <div class="card-body">
              <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                Pagos Fallidos (7d)
              </div>
              <div class="h5 mb-0 font-weight-bold text-gray-800">
                {{ alertas.resumen.pagos_fallidos_7d }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-2 col-md-4 col-sm-6 mb-3">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                Tarjetas Expiradas
              </div>
              <div class="h5 mb-0 font-weight-bold text-gray-800">
                {{ alertas.resumen.tarjetas_expiradas }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-2 col-md-4 col-sm-6 mb-3">
          <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
              <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                Pagos Pendientes
              </div>
              <div class="h5 mb-0 font-weight-bold text-gray-800">
                {{ alertas.resumen.pagos_pendientes_24h }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-2 col-md-4 col-sm-6 mb-3">
          <div class="card border-left-danger shadow h-100 py-2">
            <div class="card-body">
              <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                Cobros Fallidos
              </div>
              <div class="h5 mb-0 font-weight-bold text-gray-800">
                {{ alertas.resumen.cobros_recurrentes_fallidos_mes }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-2 col-md-4 col-sm-6 mb-3">
          <div class="card border-left-danger shadow h-100 py-2">
            <div class="card-body">
              <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                Sin Método de Pago
              </div>
              <div class="h5 mb-0 font-weight-bold text-gray-800">
                {{ alertas.resumen.pruebas_sin_metodo_pago }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tarjetas de Secciones -->
      <div class="row" *ngIf="alertas">
        <!-- Pruebas sin método de pago (CRÍTICO) -->
        <div class="col-lg-6 mb-4" *ngIf="alertas.verificacion.pruebas_sin_metodo_pago.length > 0">
          <div class="card shadow border-danger">
            <div class="card-header bg-danger text-white">
              <h6 class="m-0 font-weight-bold">
                <i class="fas fa-exclamation-circle me-2"></i>
                Pruebas sin Método de Pago (CRÍTICO)
              </h6>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Paquete</th>
                      <th>Días Restantes</th>
                      <th>Vence</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let prueba of alertas.verificacion.pruebas_sin_metodo_pago">
                      <td><code>{{ prueba.emp_id }}</code></td>
                      <td>{{ prueba.nombre_paquete }}</td>
                      <td>
                        <span class="badge bg-danger">
                          {{ prueba.dias_restantes }} días
                        </span>
                      </td>
                      <td><small>{{ prueba.vence_formatted }}</small></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagos Fallidos Recientes -->
        <div class="col-lg-6 mb-4" *ngIf="alertas.pagos_fallidos.length > 0">
          <div class="card shadow">
            <div class="card-header">
              <h6 class="m-0 font-weight-bold text-danger">
                <i class="fas fa-times-circle me-2"></i>
                Pagos Fallidos (Últimos 7 días)
              </h6>
            </div>
            <div class="card-body" style="max-height: 400px; overflow-y: auto;">
              <div class="list-group">
                <div class="list-group-item" *ngFor="let pago of alertas.pagos_fallidos">
                  <div class="d-flex justify-content-between">
                    <h6 class="mb-1">{{ pago.descripcion }}</h6>
                    <small>{{ pago.fecha_formatted }}</small>
                  </div>
                  <p class="mb-1">
                    <strong>Empresa:</strong> {{ pago.id_empresa }} |
                    <strong>Monto:</strong> {{ dashboardService.formatCurrency(pago.monto) }}
                  </p>
                  <small class="text-danger">
                    <i class="fas fa-exclamation-triangle me-1"></i>
                    {{ pago.estatus_stripe }}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjetas Expiradas -->
        <div class="col-lg-6 mb-4" *ngIf="alertas.tarjetas_expiradas.length > 0">
          <div class="card shadow">
            <div class="card-header">
              <h6 class="m-0 font-weight-bold text-warning">
                <i class="fas fa-credit-card me-2"></i>
                Tarjetas Expiradas o Por Expirar
              </h6>
            </div>
            <div class="card-body" style="max-height: 400px; overflow-y: auto;">
              <div class="table-responsive">
                <table class="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Tarjeta</th>
                      <th>Expira</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let tarjeta of alertas.tarjetas_expiradas">
                      <td><code>{{ tarjeta.emp_id }}</code></td>
                      <td>
                        <i [class]="'fab fa-cc-' + tarjeta.card_brand"></i>
                        **** {{ tarjeta.card_last4 }}
                      </td>
                      <td>{{ tarjeta.expira_en }}</td>
                      <td>
                        <span [class]="'badge ' + (tarjeta.ya_expirada ? 'bg-danger' : 'bg-warning')">
                          {{ tarjeta.ya_expirada ? 'Expirada' : 'Por Expirar' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagos Pendientes -->
        <div class="col-lg-6 mb-4" *ngIf="(alertas.pagos_pendientes.reportes.length + alertas.pagos_pendientes.monitoreo.length + alertas.pagos_pendientes.verificacion.length) > 0">
          <div class="card shadow">
            <div class="card-header">
              <h6 class="m-0 font-weight-bold text-info">
                <i class="fas fa-clock me-2"></i>
                Pagos Pendientes (>24h)
              </h6>
            </div>
            <div class="card-body" style="max-height: 400px; overflow-y: auto;">
              <div *ngIf="alertas.pagos_pendientes.reportes.length > 0" class="mb-3">
                <h6 class="text-primary">Reportes</h6>
                <div class="list-group">
                  <div class="list-group-item list-group-item-action" *ngFor="let pago of alertas.pagos_pendientes.reportes">
                    <div class="d-flex justify-content-between">
                      <span>{{ pago.paquete }}</span>
                      <span class="badge bg-info">{{ pago.horas_pendiente }}h</span>
                    </div>
                    <small>
                      Empresa: {{ pago.id_empresa }} |
                      Monto: {{ dashboardService.formatCurrency(pago.monto) }}
                    </small>
                  </div>
                </div>
              </div>

              <div *ngIf="alertas.pagos_pendientes.monitoreo.length > 0" class="mb-3">
                <h6 class="text-info">Monitoreo</h6>
                <div class="list-group">
                  <div class="list-group-item list-group-item-action" *ngFor="let pago of alertas.pagos_pendientes.monitoreo">
                    <div class="d-flex justify-content-between">
                      <span>{{ pago.paquete }}</span>
                      <span class="badge bg-info">{{ pago.horas_pendiente }}h</span>
                    </div>
                    <small>
                      Empresa: {{ pago.id_empresa }} |
                      Monto: {{ dashboardService.formatCurrency(pago.monto) }}
                    </small>
                  </div>
                </div>
              </div>

              <div *ngIf="alertas.pagos_pendientes.verificacion.length > 0">
                <h6 class="text-success">Verificación</h6>
                <div class="list-group">
                  <div class="list-group-item list-group-item-action" *ngFor="let pago of alertas.pagos_pendientes.verificacion">
                    <div class="d-flex justify-content-between">
                      <span>{{ pago.paquete }}</span>
                      <span class="badge bg-info">{{ pago.horas_pendiente }}h</span>
                    </div>
                    <small>
                      Empresa: {{ pago.id_empresa }} |
                      Monto: {{ dashboardService.formatCurrency(pago.monto) }}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
    .border-left-danger {
      border-left: 0.25rem solid #e74a3b !important;
    }
    .text-xs {
      font-size: 0.7rem;
    }
  `]
})
export class AlertasDashboardComponent implements OnInit, OnDestroy {
  alertas: ErroresAlertas | null = null;
  isLoading = false;
  error: string | null = null;

  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  constructor(
    public facade: DashboardAdminFacade,
    public dashboardService: DashboardAdminService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['env']) {
        this.selectedEnvironment = queryParams['env'] as 'qa' | 'prod';
      }
    });

    this.subscribeToFacade();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.facade.disableAutoRefresh();
  }

  private subscribeToFacade(): void {
    this.facade.isLoading$.subscribe(loading => this.isLoading = loading);
    this.facade.error$.subscribe(error => this.error = error);
    this.facade.erroresAlertas$.subscribe(alertas => {
      this.alertas = alertas;
    });
  }

  loadData(): void {
    const baseUrl = this.getCurrentBaseUrl();
    this.facade.loadErroresAlertas(baseUrl);
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

  goBack(): void {
    this.router.navigate(['/dashboard-admin'], {
      queryParams: { env: this.selectedEnvironment }
    });
  }
}
