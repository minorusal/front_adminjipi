import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DashboardAdminFacade } from '../data-access/dashboard-admin.facade';
import { DashboardAdminService } from '../services/dashboard-admin.service';
import { MetricasGlobales, ErroresAlertas } from '../types/dashboard.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-dashboard-suscripciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-suscripciones container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-chart-pie me-2 text-primary"></i>
          Dashboard Administrativo - Suscripciones
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
              Auto-refresh (60s)
            </label>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading && !metricas" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="mt-3">Cargando dashboard...</div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger alert-dismissible fade show">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
        <button type="button" class="btn-close" (click)="error = null"></button>
      </div>

      <!-- No Data State -->
      <div *ngIf="!isLoading && !metricas && !error" class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        No se han cargado datos aún. Haz clic en "Actualizar" para cargar los datos.
        <div class="mt-2">
          <small>
            <strong>Debug Info:</strong><br>
            - Loading: {{ isLoading }}<br>
            - Metricas: {{ metricas ? 'Tiene datos' : 'null' }}<br>
            - Error: {{ error || 'ninguno' }}<br>
            - Ambiente: {{ selectedEnvironment }}<br>
            - Base URL: {{ getCurrentBaseUrl() }}
          </small>
        </div>
      </div>


      <!-- Alertas Críticas - Banner de Resumen -->
      <div *ngIf="alertas && alertas.resumen.total_alertas > 0" class="row mb-4">
        <div class="col-12">
          <div class="card shadow-lg border-0">
            <div class="card-body bg-warning-gradient p-4">
              <div class="d-flex align-items-center">
                <div class="alert-icon-container me-4">
                  <i class="fas fa-exclamation-triangle fa-3x text-warning"></i>
                </div>
                <div class="flex-grow-1">
                  <h4 class="alert-heading mb-2 text-dark">
                    <strong>{{ alertas.resumen.total_alertas }}</strong> Situaciones que Requieren Atención Inmediata
                  </h4>
                  <p class="mb-3 text-muted">
                    <i class="fas fa-info-circle me-1"></i>
                    Estas alertas pueden afectar el flujo de ingresos y la retención de clientes. Se recomienda revisar y tomar acción.
                  </p>
                  <div class="row g-2">
                    <div class="col-md-4" *ngIf="alertas.resumen.pagos_fallidos_7d > 0">
                      <div class="alert-badge-container p-2 bg-white rounded">
                        <i class="fas fa-times-circle text-danger me-2"></i>
                        <span class="badge bg-danger">{{ alertas.resumen.pagos_fallidos_7d }}</span>
                        <span class="ms-2 small"><strong>Pagos Fallidos</strong> (últimos 7 días)</span>
                        <small class="d-block text-muted mt-1">Intentos de cobro rechazados por el banco</small>
                      </div>
                    </div>
                    <div class="col-md-4" *ngIf="alertas.resumen.tarjetas_expiradas > 0">
                      <div class="alert-badge-container p-2 bg-white rounded">
                        <i class="fas fa-credit-card text-warning me-2"></i>
                        <span class="badge bg-warning text-dark">{{ alertas.resumen.tarjetas_expiradas }}</span>
                        <span class="ms-2 small"><strong>Tarjetas Expiradas</strong></span>
                        <small class="d-block text-muted mt-1">Clientes deben actualizar método de pago</small>
                      </div>
                    </div>
                    <div class="col-md-4" *ngIf="alertas.resumen.pagos_pendientes_24h > 0">
                      <div class="alert-badge-container p-2 bg-white rounded">
                        <i class="fas fa-clock text-info me-2"></i>
                        <span class="badge bg-info">{{ alertas.resumen.pagos_pendientes_24h }}</span>
                        <span class="ms-2 small"><strong>Pagos Pendientes</strong> (próximas 24h)</span>
                        <small class="d-block text-muted mt-1">Cobros programados para procesarse pronto</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="ms-3">
                  <button class="btn btn-warning btn-lg shadow" (click)="verAlertas()">
                    <i class="fas fa-search-plus me-2"></i>
                    Ver Detalles Completos
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado de Salud del Sistema de Pagos -->
      <div class="row mb-4" *ngIf="alertas">
        <div class="col-12 mb-3">
          <h4 class="text-gray-700">
            <i class="fas fa-heartbeat me-2"></i>
            Estado de Salud del Sistema de Pagos
          </h4>
          <p class="text-muted small">
            Monitoreo en tiempo real de la salud financiera de las suscripciones
          </p>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-warning shadow h-100 py-2 hover-card">
            <div class="card-body">
              <div class="row no-gutters align-items-center mb-2">
                <div class="col mr-2">
                  <div class="d-flex align-items-center mb-1">
                    <div class="text-xs font-weight-bold text-warning text-uppercase">
                      Total Alertas Activas
                    </div>
                    <i class="fas fa-info-circle text-muted ms-2"
                       title="Cantidad total de situaciones que requieren atención"
                       style="cursor: help; font-size: 0.75rem;"></i>
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ alertas.resumen.total_alertas }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                </div>
              </div>
              <hr class="my-2">
              <small class="text-muted d-block">
                <i class="fas fa-shield-alt me-1"></i>
                Problemas detectados en el sistema
              </small>
              <small class="text-warning d-block mt-1">
                <i class="fas fa-bolt me-1"></i>
                Acción recomendada: Revisar inmediatamente
              </small>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-info shadow h-100 py-2 hover-card">
            <div class="card-body">
              <div class="row no-gutters align-items-center mb-2">
                <div class="col mr-2">
                  <div class="d-flex align-items-center mb-1">
                    <div class="text-xs font-weight-bold text-info text-uppercase">
                      Pagos Próximos (24h)
                    </div>
                    <i class="fas fa-info-circle text-muted ms-2"
                       title="Cobros automáticos que se procesarán en las próximas 24 horas"
                       style="cursor: help; font-size: 0.75rem;"></i>
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ alertas.resumen.pagos_pendientes_24h }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-clock fa-2x text-gray-300"></i>
                </div>
              </div>
              <hr class="my-2">
              <small class="text-muted d-block">
                <i class="fas fa-calendar-check me-1"></i>
                Procesamiento automático por Stripe
              </small>
              <small class="text-info d-block mt-1">
                <i class="fas fa-robot me-1"></i>
                Monitorear resultados del cobro
              </small>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-danger shadow h-100 py-2 hover-card">
            <div class="card-body">
              <div class="row no-gutters align-items-center mb-2">
                <div class="col mr-2">
                  <div class="d-flex align-items-center mb-1">
                    <div class="text-xs font-weight-bold text-danger text-uppercase">
                      Intentos Fallidos (7d)
                    </div>
                    <i class="fas fa-info-circle text-muted ms-2"
                       title="Cobros rechazados por fondos insuficientes, tarjeta inválida u otros motivos"
                       style="cursor: help; font-size: 0.75rem;"></i>
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ alertas.resumen.pagos_fallidos_7d }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-times-circle fa-2x text-gray-300"></i>
                </div>
              </div>
              <hr class="my-2">
              <small class="text-muted d-block">
                <i class="fas fa-ban me-1"></i>
                Cobros rechazados por el banco emisor
              </small>
              <small class="text-danger d-block mt-1">
                <i class="fas fa-user-times me-1"></i>
                Riesgo de cancelación de suscripción
              </small>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-warning shadow h-100 py-2 hover-card">
            <div class="card-body">
              <div class="row no-gutters align-items-center mb-2">
                <div class="col mr-2">
                  <div class="d-flex align-items-center mb-1">
                    <div class="text-xs font-weight-bold text-warning text-uppercase">
                      Tarjetas Vencidas
                    </div>
                    <i class="fas fa-info-circle text-muted ms-2"
                       title="Métodos de pago que han alcanzado su fecha de expiración"
                       style="cursor: help; font-size: 0.75rem;"></i>
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ alertas.resumen.tarjetas_expiradas }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-credit-card fa-2x text-gray-300"></i>
                </div>
              </div>
              <hr class="my-2">
              <small class="text-muted d-block">
                <i class="fas fa-calendar-times me-1"></i>
                Métodos de pago inválidos o vencidos
              </small>
              <small class="text-warning d-block mt-1">
                <i class="fas fa-envelope me-1"></i>
                Contactar a clientes para actualizar
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen General Explicativo -->
      <div class="row mb-4" *ngIf="metricas">
        <div class="col-12">
          <div class="card shadow mb-4">
            <div class="card-header py-3 bg-gradient-primary text-white">
              <h5 class="m-0 font-weight-bold">
                <i class="fas fa-chart-bar me-2"></i>
                Resumen Global del Sistema de Suscripciones
              </h5>
            </div>
            <div class="card-body">
              <p class="mb-3 text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Vista consolidada de las 3 plataformas de suscripción:
                <strong class="text-primary">Reportes de Crédito</strong>,
                <strong class="text-info">Monitoreo</strong> y
                <strong class="text-success">Verificación</strong>.
                Estas métricas se actualizan en tiempo real desde Stripe.
              </p>
              <div class="row">
                <div class="col-md-4">
                  <small class="text-muted d-block">
                    <i class="fas fa-calendar me-1"></i>
                    Última actualización: {{ getCurrentDateTime() }}
                  </small>
                </div>
                <div class="col-md-4">
                  <small class="text-muted d-block">
                    <i class="fas fa-server me-1"></i>
                    Ambiente: <span class="badge bg-{{ selectedEnvironment === 'qa' ? 'warning' : 'success' }}">{{ selectedEnvironment.toUpperCase() }}</span>
                  </small>
                </div>
                <div class="col-md-4">
                  <small class="text-muted d-block">
                    <i class="fas fa-sync me-1"></i>
                    Auto-refresh: <span class="badge bg-{{ autoRefresh ? 'success' : 'secondary' }}">{{ autoRefresh ? 'Activo (60s)' : 'Inactivo' }}</span>
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards Globales con más contexto -->
      <div class="row mb-4" *ngIf="metricas">
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2 hover-card">
            <div class="card-body">
              <div class="row no-gutters align-items-center mb-2">
                <div class="col mr-2">
                  <div class="d-flex align-items-center mb-1">
                    <div class="text-xs font-weight-bold text-primary text-uppercase">
                      Suscripciones Activas
                    </div>
                    <i class="fas fa-info-circle text-muted ms-2"
                       title="Total de usuarios con suscripción activa en las 3 plataformas"
                       style="cursor: help; font-size: 0.75rem;"></i>
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ metricas.resumen_global.suscripciones_activas_total }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-users fa-2x text-gray-300"></i>
                </div>
              </div>
              <hr class="my-2">
              <small class="text-muted">
                <i class="fas fa-chart-pie me-1"></i>
                Usuarios pagando por servicio activo
              </small>
              <div class="mt-2 d-flex justify-content-between">
                <small class="text-primary">
                  <i class="fas fa-file-invoice-dollar me-1"></i>
                  Reportes: {{ metricas.reportes_credito.suscripciones_activas }}
                </small>
                <small class="text-info">
                  <i class="fas fa-search me-1"></i>
                  Monitor: {{ metricas.monitoreo.suscripciones_activas }}
                </small>
                <small class="text-success">
                  <i class="fas fa-check-circle me-1"></i>
                  Verif: {{ metricas.verificacion.suscripciones_activas }}
                </small>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-success shadow h-100 py-2 hover-card">
            <div class="card-body">
              <div class="row no-gutters align-items-center mb-2">
                <div class="col mr-2">
                  <div class="d-flex align-items-center mb-1">
                    <div class="text-xs font-weight-bold text-success text-uppercase">
                      MRR Total
                    </div>
                    <i class="fas fa-info-circle text-muted ms-2"
                       title="Monthly Recurring Revenue - Ingresos mensuales recurrentes proyectados"
                       style="cursor: help; font-size: 0.75rem;"></i>
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ dashboardService.formatCurrency(metricas.resumen_global.mrr_total) }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                </div>
              </div>
              <hr class="my-2">
              <small class="text-muted">
                <i class="fas fa-calculator me-1"></i>
                Ingresos recurrentes mensuales estimados
              </small>
              <div class="mt-2">
                <small class="text-success d-block">
                  <i class="fas fa-trending-up me-1"></i>
                  ARR Proyectado: {{ calcularARR(metricas.resumen_global.mrr_total) }}
                </small>
                <small class="text-muted d-block mt-1">
                  <i class="fas fa-calendar-alt me-1"></i>
                  Basado en suscripciones activas actuales
                </small>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-warning shadow h-100 py-2 hover-card">
            <div class="card-body">
              <div class="row no-gutters align-items-center mb-2">
                <div class="col mr-2">
                  <div class="d-flex align-items-center mb-1">
                    <div class="text-xs font-weight-bold text-warning text-uppercase">
                      Pagos Pendientes
                    </div>
                    <i class="fas fa-info-circle text-muted ms-2"
                       title="Pagos programados en las próximas 24 horas que aún no se procesan"
                       style="cursor: help; font-size: 0.75rem;"></i>
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ metricas.resumen_global.pagos_pendientes_total }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-clock fa-2x text-gray-300"></i>
                </div>
              </div>
              <hr class="my-2">
              <small class="text-muted">
                <i class="fas fa-hourglass-half me-1"></i>
                Cobros programados próximas 24h
              </small>
              <div class="mt-2">
                <small class="text-warning d-block">
                  <i class="fas fa-exclamation-triangle me-1"></i>
                  Requieren monitoreo activo
                </small>
                <small class="text-muted d-block mt-1">
                  <i class="fas fa-bell me-1"></i>
                  Se procesarán automáticamente por Stripe
                </small>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-danger shadow h-100 py-2 hover-card">
            <div class="card-body">
              <div class="row no-gutters align-items-center mb-2">
                <div class="col mr-2">
                  <div class="d-flex align-items-center mb-1">
                    <div class="text-xs font-weight-bold text-danger text-uppercase">
                      Tarjetas Expiradas
                    </div>
                    <i class="fas fa-info-circle text-muted ms-2"
                       title="Tarjetas de crédito vencidas que requieren actualización del cliente"
                       style="cursor: help; font-size: 0.75rem;"></i>
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ metricas.resumen_global.tarjetas_expiradas }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-credit-card fa-2x text-gray-300"></i>
                </div>
              </div>
              <hr class="my-2">
              <small class="text-muted">
                <i class="fas fa-calendar-times me-1"></i>
                Métodos de pago vencidos o inválidos
              </small>
              <div class="mt-2">
                <small class="text-danger d-block">
                  <i class="fas fa-user-clock me-1"></i>
                  Acción requerida: Contactar clientes
                </small>
                <small class="text-muted d-block mt-1">
                  <i class="fas fa-shield-alt me-1"></i>
                  Alto riesgo de cancelación automática
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métricas por Módulo - Detalladas -->
      <div class="row mb-4" *ngIf="metricas">
        <div class="col-12 mb-3">
          <h4 class="text-gray-700">
            <i class="fas fa-layer-group me-2"></i>
            Métricas por Plataforma
          </h4>
          <p class="text-muted small">
            Desglose individual de cada plataforma de suscripción con métricas específicas del negocio
          </p>
        </div>

        <!-- Reportes de Crédito -->
        <div class="col-lg-4 mb-4">
          <div class="card shadow h-100 hover-card">
            <div class="card-header py-3 bg-primary text-white">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold">
                  <i class="fas fa-file-invoice-dollar me-2"></i>
                  Reportes de Crédito
                </h6>
                <i class="fas fa-info-circle"
                   title="Plataforma de consulta de historial crediticio"
                   style="cursor: help;"></i>
              </div>
            </div>
            <div class="card-body">
              <!-- Suscripciones Activas -->
              <div class="metric-item mb-3 p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-users me-1"></i>
                    Suscripciones Activas
                  </div>
                  <span class="badge bg-primary">{{ metricas.reportes_credito.suscripciones_activas }}</span>
                </div>
                <small class="text-muted d-block">
                  Usuarios con acceso activo a reportes de crédito
                </small>
              </div>

              <!-- MRR -->
              <div class="metric-item mb-3 p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-dollar-sign me-1"></i>
                    MRR Reportes
                  </div>
                  <span class="badge bg-success">{{ dashboardService.formatCurrency(metricas.reportes_credito.mrr) }}</span>
                </div>
                <small class="text-muted d-block">
                  Ingresos mensuales recurrentes de este módulo
                </small>
                <div class="progress mt-2" style="height: 4px;">
                  <div class="progress-bar bg-success"
                       [style.width.%]="calcularPorcentajeMRR(metricas.reportes_credito.mrr)">
                  </div>
                </div>
              </div>

              <!-- Pagos Pendientes -->
              <div class="metric-item mb-3 p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-clock me-1"></i>
                    Pagos Pendientes
                  </div>
                  <span class="badge bg-warning text-dark">{{ metricas.reportes_credito.pagos_pendientes }}</span>
                </div>
                <small class="text-muted d-block">
                  Cobros automáticos programados (24h)
                </small>
              </div>

              <!-- Cambios Pendientes -->
              <div class="metric-item p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-exchange-alt me-1"></i>
                    Cambios de Plan
                  </div>
                  <span class="badge bg-info">{{ metricas.reportes_credito.cambios_pendientes }}</span>
                </div>
                <small class="text-muted d-block">
                  Upgrades/downgrades programados al finalizar ciclo
                </small>
              </div>
            </div>
            <div class="card-footer bg-transparent">
              <small class="text-muted">
                <i class="fas fa-chart-line me-1"></i>
                ARR: {{ calcularARR(metricas.reportes_credito.mrr) }}
              </small>
            </div>
          </div>
        </div>

        <!-- Monitoreo -->
        <div class="col-lg-4 mb-4">
          <div class="card shadow h-100 hover-card">
            <div class="card-header py-3 bg-info text-white">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold">
                  <i class="fas fa-search me-2"></i>
                  Monitoreo
                </h6>
                <i class="fas fa-info-circle"
                   title="Plataforma de monitoreo continuo de crédito"
                   style="cursor: help;"></i>
              </div>
            </div>
            <div class="card-body">
              <!-- Suscripciones Activas -->
              <div class="metric-item mb-3 p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-users me-1"></i>
                    Suscripciones Activas
                  </div>
                  <span class="badge bg-info">{{ metricas.monitoreo.suscripciones_activas }}</span>
                </div>
                <small class="text-muted d-block">
                  Usuarios con monitoreo activo de cambios
                </small>
              </div>

              <!-- MRR -->
              <div class="metric-item mb-3 p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-dollar-sign me-1"></i>
                    MRR Monitoreo
                  </div>
                  <span class="badge bg-success">{{ dashboardService.formatCurrency(metricas.monitoreo.mrr) }}</span>
                </div>
                <small class="text-muted d-block">
                  Ingresos mensuales recurrentes de este módulo
                </small>
                <div class="progress mt-2" style="height: 4px;">
                  <div class="progress-bar bg-success"
                       [style.width.%]="calcularPorcentajeMRR(metricas.monitoreo.mrr)">
                  </div>
                </div>
              </div>

              <!-- Pagos Pendientes -->
              <div class="metric-item mb-3 p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-clock me-1"></i>
                    Pagos Pendientes
                  </div>
                  <span class="badge bg-warning text-dark">{{ metricas.monitoreo.pagos_pendientes }}</span>
                </div>
                <small class="text-muted d-block">
                  Cobros automáticos programados (24h)
                </small>
              </div>

              <!-- Clientes Monitoreados -->
              <div class="metric-item p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-eye me-1"></i>
                    Clientes Monitoreados
                  </div>
                  <span class="badge bg-primary">{{ metricas.monitoreo.clientes_monitoreados }}</span>
                </div>
                <small class="text-muted d-block">
                  Total de perfiles bajo vigilancia continua
                </small>
              </div>
            </div>
            <div class="card-footer bg-transparent">
              <small class="text-muted">
                <i class="fas fa-chart-line me-1"></i>
                ARR: {{ calcularARR(metricas.monitoreo.mrr) }}
              </small>
            </div>
          </div>
        </div>

        <!-- Verificación -->
        <div class="col-lg-4 mb-4">
          <div class="card shadow h-100 hover-card">
            <div class="card-header py-3 bg-success text-white">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold">
                  <i class="fas fa-check-circle me-2"></i>
                  Verificación
                </h6>
                <i class="fas fa-info-circle"
                   title="Plataforma de verificación de identidad"
                   style="cursor: help;"></i>
              </div>
            </div>
            <div class="card-body">
              <!-- Suscripciones Activas -->
              <div class="metric-item mb-3 p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-users me-1"></i>
                    Suscripciones Activas
                  </div>
                  <span class="badge bg-success">{{ metricas.verificacion.suscripciones_activas }}</span>
                </div>
                <small class="text-muted d-block">
                  Usuarios con servicio de verificación activo
                </small>
              </div>

              <!-- MRR -->
              <div class="metric-item mb-3 p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-dollar-sign me-1"></i>
                    MRR Verificación
                  </div>
                  <span class="badge bg-success">{{ dashboardService.formatCurrency(metricas.verificacion.mrr) }}</span>
                </div>
                <small class="text-muted d-block">
                  Ingresos mensuales recurrentes de este módulo
                </small>
                <div class="progress mt-2" style="height: 4px;">
                  <div class="progress-bar bg-success"
                       [style.width.%]="calcularPorcentajeMRR(metricas.verificacion.mrr)">
                  </div>
                </div>
              </div>

              <!-- Periodo de Prueba -->
              <div class="metric-item mb-3 p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-flask me-1"></i>
                    En Período de Prueba
                  </div>
                  <span class="badge bg-info">{{ metricas.verificacion.en_periodo_prueba }}</span>
                </div>
                <small class="text-muted d-block">
                  Usuarios en trial, aún no facturados
                </small>
              </div>

              <!-- Pruebas por Vencer -->
              <div class="metric-item p-2 bg-light rounded">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="text-xs font-weight-bold text-muted text-uppercase">
                    <i class="fas fa-calendar-times me-1"></i>
                    Trials por Vencer
                  </div>
                  <span class="badge bg-warning text-dark">{{ metricas.verificacion.pruebas_proximas_vencer }}</span>
                </div>
                <small class="text-muted d-block">
                  Se convertirán a pago en los próximos 3 días
                </small>
              </div>
            </div>
            <div class="card-footer bg-transparent">
              <small class="text-muted">
                <i class="fas fa-chart-line me-1"></i>
                ARR: {{ calcularARR(metricas.verificacion.mrr) }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Accesos Rápidos -->
      <div class="row mb-4" *ngIf="alertas">
        <div class="col-lg-12 mb-4">
          <div class="card shadow h-100">
            <div class="card-header py-3">
              <h6 class="m-0 font-weight-bold text-primary">
                <i class="fas fa-bolt me-2"></i>
                Accesos Rápidos
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-2">
                <div class="col-md-6">
                  <button class="btn btn-outline-primary btn-sm w-100" (click)="verAlertas()">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Ver Errores y Alertas
                  </button>
                </div>
                <div class="col-md-6">
                  <button class="btn btn-outline-success btn-sm w-100" (click)="verTransacciones()">
                    <i class="fas fa-exchange-alt me-2"></i>
                    Transacciones Recientes
                  </button>
                </div>
                <div class="col-md-6">
                  <button class="btn btn-outline-info btn-sm w-100" (click)="verCobrosRecurrentes()">
                    <i class="fas fa-sync-alt me-2"></i>
                    Cobros Recurrentes
                  </button>
                </div>
                <div class="col-md-6">
                  <button class="btn btn-outline-warning btn-sm w-100" (click)="verEstadisticas()">
                    <i class="fas fa-chart-line me-2"></i>
                    Estadísticas de Stripe
                  </button>
                </div>
                <div class="col-md-12">
                  <button class="btn btn-primary btn-sm w-100" (click)="verEmpresas()">
                    <i class="fas fa-building me-2"></i>
                    Empresas con Suscripciones
                    <span class="badge bg-light text-dark ms-2">Nuevo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-suscripciones {
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
    .border-left-danger {
      border-left: 0.25rem solid #e74a3b !important;
    }

    .text-xs {
      font-size: 0.7rem;
    }

    .hover-card {
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .hover-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 1rem 3rem rgba(0,0,0,.175) !important;
      border-color: rgba(0,123,255,.3);
    }

    .metric-item {
      transition: all 0.2s ease;
    }

    .metric-item:hover {
      background-color: #e9ecef !important;
      transform: translateX(3px);
    }

    .bg-gradient-primary {
      background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
    }

    .bg-warning-gradient {
      background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
    }

    .alert-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 60px;
    }

    .alert-badge-container {
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .alert-badge-container:hover {
      border-color: #dee2e6;
      background-color: #f8f9fa !important;
      transform: translateY(-2px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .text-gray-700 {
      color: #5a5c69;
    }

    .text-gray-800 {
      color: #3a3b45;
    }
  `]
})
export class DashboardSuscripcionesComponent implements OnInit, OnDestroy {
  metricas: MetricasGlobales | null = null;
  alertas: ErroresAlertas | null = null;
  isLoading = false;
  error: string | null = null;
  autoRefresh = false;

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
    // Leer el ambiente del query parameter
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['env']) {
        this.selectedEnvironment = queryParams['env'] as 'qa' | 'prod';
        console.log('🔧 [DASHBOARD-SUSCRIPCIONES] Ambiente desde URL:', this.selectedEnvironment);
      }
    });

    this.subscribeToFacade();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.facade.disableAutoRefresh();
  }

  private subscribeToFacade(): void {
    this.facade.isLoading$.subscribe(loading => {
      console.log('📊 [DASHBOARD-SUSCRIPCIONES] Loading state:', loading);
      this.isLoading = loading;
    });

    this.facade.error$.subscribe(error => {
      console.log('📊 [DASHBOARD-SUSCRIPCIONES] Error state:', error);
      this.error = error;
    });

    this.facade.metricasGlobales$.subscribe(metricas => {
      console.log('📊 [DASHBOARD-SUSCRIPCIONES] Métricas recibidas:', metricas);
      if (metricas) {
        console.log('📊 [DASHBOARD-SUSCRIPCIONES] Métricas válidas, actualizando vista');
      } else {
        console.log('📊 [DASHBOARD-SUSCRIPCIONES] Métricas es null');
      }
      this.metricas = metricas;
    });

    this.facade.erroresAlertas$.subscribe(alertas => {
      console.log('🚨 [DASHBOARD-SUSCRIPCIONES] Alertas recibidas:', alertas);
      if (alertas) {
        console.log('🚨 [DASHBOARD-SUSCRIPCIONES] Alertas válidas, actualizando vista');
      } else {
        console.log('🚨 [DASHBOARD-SUSCRIPCIONES] Alertas es null');
      }
      this.alertas = alertas;
    });
  }

  loadData(): void {
    const baseUrl = this.getCurrentBaseUrl();
    console.log('📊 [DASHBOARD-SUSCRIPCIONES] Cargando datos del dashboard...');
    console.log('📊 [DASHBOARD-SUSCRIPCIONES] Base URL construida:', baseUrl);

    // Cargar todos los datos del dashboard
    this.facade.loadMetricasGlobales(baseUrl);
    this.facade.loadErroresAlertas(baseUrl);
  }

  refreshData(): void {
    this.loadData();
  }

  onEnvironmentChange(): void {
    this.facade.clearState();
    this.loadData();

    if (this.autoRefresh) {
      this.facade.disableAutoRefresh();
      this.facade.enableAutoRefresh(this.getCurrentBaseUrl(), 60000);
    }
  }

  toggleAutoRefresh(): void {
    if (this.autoRefresh) {
      this.facade.enableAutoRefresh(this.getCurrentBaseUrl(), 60000);
    } else {
      this.facade.disableAutoRefresh();
    }
  }

  getCurrentBaseUrl(): string {
    return this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
  }

  verAlertas(): void {
    this.router.navigate(['/dashboard-admin/alertas'], {
      queryParams: { env: this.selectedEnvironment }
    });
  }

  verTransacciones(): void {
    this.router.navigate(['/dashboard-admin/transacciones'], {
      queryParams: { env: this.selectedEnvironment }
    });
  }

  verCobrosRecurrentes(): void {
    this.router.navigate(['/dashboard-admin/cobros-recurrentes'], {
      queryParams: { env: this.selectedEnvironment }
    });
  }

  verEstadisticas(): void {
    this.router.navigate(['/dashboard-admin/estadisticas'], {
      queryParams: { env: this.selectedEnvironment }
    });
  }

  verEmpresas(): void {
    this.router.navigate(['/dashboard-admin/empresas'], {
      queryParams: { env: this.selectedEnvironment }
    });
  }

  /**
   * Calcula el porcentaje de MRR de un módulo respecto al total
   */
  calcularPorcentajeMRR(mrrModulo: string): number {
    if (!this.metricas) return 0;

    const mrrTotal = parseFloat(this.metricas.resumen_global.mrr_total);
    const mrr = parseFloat(mrrModulo);

    if (mrrTotal === 0) return 0;

    return Math.round((mrr / mrrTotal) * 100);
  }

  /**
   * Calcula el ARR (Annual Recurring Revenue) a partir del MRR
   */
  calcularARR(mrr: string): string {
    const mrrNumerico = parseFloat(mrr);
    const arr = mrrNumerico * 12;
    return this.dashboardService.formatCurrency(arr);
  }

  /**
   * Obtiene la fecha y hora actual formateada
   */
  getCurrentDateTime(): string {
    const now = new Date();
    return now.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
