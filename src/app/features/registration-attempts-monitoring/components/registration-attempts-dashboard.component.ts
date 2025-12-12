import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RegistrationAttemptsMonitoringFacade, RegistrationAnalysis } from '../data-access/registration-attempts-monitoring.facade';
import { RegistrationAttemptsMonitoringService } from '../services/registration-attempts-monitoring.service';
import {
  RegistrationAttempt,
  RegistrationStats,
  RegistrationFilters,
  IPAlert,
  IPAlertFilters,
  IPAlertsStats,
  AlertasPorTipo,
  FiltrosAplicados,
  Paginacion
} from '../types/registration-attempts.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-registration-attempts-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <h2 class="mb-0">
              <i class="fas fa-user-plus me-2"></i>
              Monitoreo de Intentos de Registro
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

      <!-- Filters -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <h5 class="card-title mb-3">
            <i class="fas fa-filter me-2"></i>
            Filtros
          </h5>
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label small">Fecha Inicio</label>
              <input
                type="date"
                class="form-control"
                [(ngModel)]="filters.fecha_inicio"
                (change)="applyFilters()">
            </div>
            <div class="col-md-3">
              <label class="form-label small">Fecha Fin</label>
              <input
                type="date"
                class="form-control"
                [(ngModel)]="filters.fecha_fin"
                (change)="applyFilters()">
            </div>
            <div class="col-md-3">
              <label class="form-label small">Estado</label>
              <select
                class="form-select"
                [(ngModel)]="filters.solo_fallidos"
                (change)="applyFilters()">
                <option [ngValue]="undefined">Todos</option>
                <option [ngValue]="true">Solo Fallidos</option>
                <option [ngValue]="false">Solo Exitosos</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label small">RFC</label>
              <input
                type="text"
                class="form-control"
                placeholder="Buscar por RFC..."
                [(ngModel)]="filters.rfc"
                (input)="onFilterChange()">
            </div>
            <div class="col-md-3">
              <label class="form-label small">Email</label>
              <input
                type="text"
                class="form-control"
                placeholder="Buscar por email..."
                [(ngModel)]="filters.email"
                (input)="onFilterChange()">
            </div>
            <div class="col-md-3">
              <label class="form-label small">IP</label>
              <input
                type="text"
                class="form-control"
                placeholder="Buscar por IP..."
                [(ngModel)]="filters.ip"
                (input)="onFilterChange()">
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <button
                class="btn btn-secondary w-100"
                (click)="clearFilters()">
                <i class="fas fa-times me-2"></i>
                Limpiar Filtros
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
        <p class="mt-3 text-muted">Cargando intentos de registro...</p>
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
                    <p class="text-muted mb-1 small">Total Intentos</p>
                    <h3 class="mb-0 fw-bold text-primary">{{ stats.total_intentos }}</h3>
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
                    <p class="text-muted mb-1 small">Exitosos</p>
                    <h3 class="mb-0 fw-bold text-success">{{ stats.intentos_exitosos }}</h3>
                    <p class="mb-0 small text-muted">{{ getTasaExitoStats(stats) }}% éxito</p>
                  </div>
                  <div class="bg-success bg-opacity-10 rounded-3 p-3">
                    <i class="fas fa-check-circle fa-2x text-success"></i>
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
                    <p class="text-muted mb-1 small">Fallidos</p>
                    <h3 class="mb-0 fw-bold text-danger">{{ stats.intentos_fallidos }}</h3>
                    <p class="mb-0 small text-muted">{{ (100 - getTasaExitoStats(stats)).toFixed(1) }}% fallos</p>
                  </div>
                  <div class="bg-danger bg-opacity-10 rounded-3 p-3">
                    <i class="fas fa-times-circle fa-2x text-danger"></i>
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
                    <p class="text-muted mb-1 small">Duración Promedio</p>
                    <h3 class="mb-0 fw-bold text-info">
                      {{ formatDurationMs(stats.duracion_promedio_ms) }}
                    </h3>
                  </div>
                  <div class="bg-info bg-opacity-10 rounded-3 p-3">
                    <i class="fas fa-clock fa-2x text-info"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Stats Row -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <p class="text-muted mb-1 small">RFCs Únicos</p>
                <h4 class="mb-0 fw-bold">{{ stats.rfcs_unicos }}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <p class="text-muted mb-1 small">Emails Únicos</p>
                <h4 class="mb-0 fw-bold">{{ stats.emails_unicos }}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <p class="text-muted mb-1 small">IPs Únicas</p>
                <h4 class="mb-0 fw-bold">{{ stats.ips_unicas }}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <p class="text-muted mb-1 small">Reintentos</p>
                <h4 class="mb-0 fw-bold">{{ stats.total_reintentos }}</h4>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item">
            <a
              class="nav-link"
              [class.active]="activeTab === 'intentos'"
              (click)="setActiveTab('intentos')"
              style="cursor: pointer;">
              <i class="fas fa-list me-2"></i>
              Intentos ({{ attempts.length }})
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              [class.active]="activeTab === 'analisis'"
              (click)="setActiveTab('analisis')"
              style="cursor: pointer;">
              <i class="fas fa-chart-pie me-2"></i>
              Análisis
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              [class.active]="activeTab === 'alertas'"
              (click)="setActiveTab('alertas')"
              style="cursor: pointer;">
              <i class="fas fa-shield-alt me-2"></i>
              Alertas IP ({{ ipAlerts.length }})
            </a>
          </li>
        </ul>

        <!-- Tab: Intentos -->
        <div *ngIf="activeTab === 'intentos'" class="tab-content">
          <div *ngIf="attempts.length === 0" class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No hay intentos de registro que coincidan con los filtros.
          </div>

          <div *ngIf="attempts.length > 0" class="card border-0 shadow-sm">
            <div class="card-body">
              <!-- Paginación Superior -->
              <div *ngIf="paginacion" class="d-flex justify-content-between align-items-center mb-3">
                <div class="text-muted">
                  Mostrando {{ filters.offset + 1 }} - {{ Math.min(filters.offset + filters.limit, paginacion.total) }}
                  de {{ paginacion.total }} registros
                  <span class="badge bg-secondary ms-2">Página {{ paginaActual }} de {{ paginacion.total_paginas }}</span>
                </div>
                <nav>
                  <ul class="pagination mb-0">
                    <li class="page-item" [class.disabled]="!tieneAnterior">
                      <a class="page-link" (click)="firstPage()" style="cursor: pointer;">
                        <i class="fas fa-angle-double-left"></i>
                      </a>
                    </li>
                    <li class="page-item" [class.disabled]="!tieneAnterior">
                      <a class="page-link" (click)="previousPage()" style="cursor: pointer;">
                        <i class="fas fa-angle-left"></i> Anterior
                      </a>
                    </li>
                    <li
                      *ngFor="let page of getPageNumbers()"
                      class="page-item"
                      [class.active]="page === paginaActual">
                      <a class="page-link" (click)="goToPage(page)" style="cursor: pointer;">{{ page }}</a>
                    </li>
                    <li class="page-item" [class.disabled]="!tieneSiguiente">
                      <a class="page-link" (click)="nextPage()" style="cursor: pointer;">
                        Siguiente <i class="fas fa-angle-right"></i>
                      </a>
                    </li>
                    <li class="page-item" [class.disabled]="!tieneSiguiente">
                      <a class="page-link" (click)="lastPage()" style="cursor: pointer;">
                        <i class="fas fa-angle-double-right"></i>
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>

              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Fecha/Hora</th>
                      <th>Estado</th>
                      <th>RFC</th>
                      <th>Razón Social</th>
                      <th>Email Usuario</th>
                      <th>Duración</th>
                      <th>Tipo Fallo</th>
                      <th>IP</th>
                      <th>Reintento</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let attempt of attempts">
                      <td>{{ registrationService.formatDate(attempt.timestamp_inicio) }}</td>
                      <td>
                        <span
                          class="badge bg-{{ registrationService.getStatusColor(isExitoso(attempt)) }}">
                          <i class="fas {{ registrationService.getStatusIcon(isExitoso(attempt)) }} me-1"></i>
                          {{ isExitoso(attempt) ? 'Exitoso' : 'Fallido' }}
                        </span>
                      </td>
                      <td>{{ attempt.empresa_rfc }}</td>
                      <td>{{ attempt.empresa_razon_social || 'N/A' }}</td>
                      <td>{{ attempt.usuario_email }}</td>
                      <td>{{ formatDurationMs(attempt.duracion_ms) }}</td>
                      <td>
                        <span
                          *ngIf="attempt.fallo_tipo"
                          class="badge {{ registrationService.getFailureTypeBadge(attempt.fallo_tipo) }}">
                          {{ attempt.fallo_tipo }}
                        </span>
                        <span *ngIf="!attempt.fallo_tipo">-</span>
                      </td>
                      <td>{{ attempt.ip_address || 'N/A' }}</td>
                      <td>
                        <i
                          *ngIf="isReintento(attempt)"
                          class="fas fa-redo text-warning"
                          title="Reintento"></i>
                      </td>
                      <td>
                        <button
                          class="btn btn-sm btn-outline-primary"
                          (click)="viewDetails(attempt)">
                          <i class="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Paginación Inferior -->
              <div *ngIf="paginacion" class="d-flex justify-content-between align-items-center mt-3">
                <div class="text-muted">
                  Mostrando {{ filters.offset + 1 }} - {{ Math.min(filters.offset + filters.limit, paginacion.total) }}
                  de {{ paginacion.total }} registros
                  <span class="badge bg-secondary ms-2">Página {{ paginaActual }} de {{ paginacion.total_paginas }}</span>
                </div>
                <nav>
                  <ul class="pagination mb-0">
                    <li class="page-item" [class.disabled]="!tieneAnterior">
                      <a class="page-link" (click)="firstPage()" style="cursor: pointer;">
                        <i class="fas fa-angle-double-left"></i>
                      </a>
                    </li>
                    <li class="page-item" [class.disabled]="!tieneAnterior">
                      <a class="page-link" (click)="previousPage()" style="cursor: pointer;">
                        <i class="fas fa-angle-left"></i> Anterior
                      </a>
                    </li>
                    <li
                      *ngFor="let page of getPageNumbers()"
                      class="page-item"
                      [class.active]="page === paginaActual">
                      <a class="page-link" (click)="goToPage(page)" style="cursor: pointer;">{{ page }}</a>
                    </li>
                    <li class="page-item" [class.disabled]="!tieneSiguiente">
                      <a class="page-link" (click)="nextPage()" style="cursor: pointer;">
                        Siguiente <i class="fas fa-angle-right"></i>
                      </a>
                    </li>
                    <li class="page-item" [class.disabled]="!tieneSiguiente">
                      <a class="page-link" (click)="lastPage()" style="cursor: pointer;">
                        <i class="fas fa-angle-double-right"></i>
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Análisis -->
        <div *ngIf="activeTab === 'analisis' && analysis" class="tab-content">
          <div class="row">
            <!-- Top Fallos -->
            <div class="col-md-6 mb-4">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-light">
                  <h5 class="mb-0">
                    <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                    Top Fallos por Tipo
                  </h5>
                </div>
                <div class="card-body">
                  <div *ngIf="analysis.tipos_fallo.length === 0" class="text-muted text-center py-3">
                    No hay fallos registrados
                  </div>
                  <div *ngFor="let fallo of analysis.tipos_fallo" class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="fw-semibold">{{ fallo.fallo_tipo }}</span>
                      <span class="badge bg-danger">{{ fallo.cantidad }} ({{ fallo.porcentaje }}%)</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                      <div
                        class="progress-bar bg-danger"
                        [style.width.%]="fallo.porcentaje">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Top RFCs -->
            <div class="col-md-6 mb-4">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-light">
                  <h5 class="mb-0">
                    <i class="fas fa-building text-primary me-2"></i>
                    Top RFCs con Más Intentos
                  </h5>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>RFC</th>
                          <th>Razón Social</th>
                          <th>Intentos</th>
                          <th>Exitosos</th>
                          <th>Fallidos</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let rfc of analysis.top_rfcs">
                          <td>{{ rfc.empresa_rfc }}</td>
                          <td>{{ rfc.empresa_razon_social || 'N/A' }}</td>
                          <td>{{ rfc.total_intentos }}</td>
                          <td><span class="badge bg-success">{{ rfc.intentos_exitosos }}</span></td>
                          <td><span class="badge bg-danger">{{ rfc.intentos_fallidos }}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Top Emails -->
            <div class="col-md-6 mb-4">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-light">
                  <h5 class="mb-0">
                    <i class="fas fa-envelope text-info me-2"></i>
                    Top Emails con Más Intentos
                  </h5>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Nombre</th>
                          <th>Intentos</th>
                          <th>Exitosos</th>
                          <th>Fallidos</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let email of analysis.top_emails">
                          <td>{{ email.usuario_email }}</td>
                          <td>N/A</td>
                          <td>{{ email.total_intentos }}</td>
                          <td><span class="badge bg-success">{{ email.intentos_exitosos }}</span></td>
                          <td><span class="badge bg-danger">{{ email.intentos_fallidos }}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- IPs Sospechosas -->
            <div class="col-md-6 mb-4">
              <div class="card border-0 shadow-sm border-warning">
                <div class="card-header bg-warning bg-opacity-10">
                  <h5 class="mb-0">
                    <i class="fas fa-shield-alt text-warning me-2"></i>
                    IPs Sospechosas (>5 intentos)
                  </h5>
                </div>
                <div class="card-body">
                  <div *ngIf="analysis.ips_sospechosas.length === 0" class="text-muted text-center py-3">
                    No se detectaron IPs sospechosas
                  </div>
                  <div class="table-responsive" *ngIf="analysis.ips_sospechosas.length > 0">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>IP</th>
                          <th>Intentos</th>
                          <th>Fallidos</th>
                          <th>RFCs Distintos</th>
                          <th>Emails Distintos</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let ip of analysis.ips_sospechosas" class="table-warning">
                          <td class="fw-bold">{{ ip.ip_address }}</td>
                          <td>{{ ip.total_intentos }}</td>
                          <td><span class="badge bg-danger">{{ getFailedAttempts(ip.total_intentos, ip.intentos_exitosos) }}</span></td>
                          <td>{{ ip.rfcs_diferentes }}</td>
                          <td>{{ ip.emails_diferentes }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Alertas IP -->
        <div *ngIf="activeTab === 'alertas'" class="tab-content">
          <!-- Filtros de Alertas -->
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-3">
                  <label class="form-label">Período (horas)</label>
                  <select class="form-select" [(ngModel)]="ipAlertFilters.horas_analisis" (change)="loadIPAlertsData()">
                    <option [ngValue]="1">Última hora</option>
                    <option [ngValue]="6">Últimas 6 horas</option>
                    <option [ngValue]="12">Últimas 12 horas</option>
                    <option [ngValue]="24">Últimas 24 horas</option>
                    <option [ngValue]="48">Últimas 48 horas</option>
                    <option [ngValue]="168">Última semana</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Mínimo Intentos</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="ipAlertFilters.min_intentos"
                    (change)="loadIPAlertsData()"
                    min="1"
                    placeholder="3">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Solo Alertas</label>
                  <select class="form-select" [(ngModel)]="ipAlertFilters.solo_alertas" (change)="loadIPAlertsData()">
                    <option [ngValue]="true">Sí</option>
                    <option [ngValue]="false">No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Metadata de Análisis -->
          <div *ngIf="ipAlertsStats" class="alert alert-info mb-4">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Análisis:</strong> {{ ipAlertsStats.periodo_analisis }} |
            <strong>Timestamp:</strong> {{ registrationService.formatDate(ipAlertsStats.timestamp_analisis) }} |
            <strong>IPs analizadas:</strong> {{ ipAlertsStats.total_ips_analizadas }} |
            <strong>Con alertas:</strong> {{ ipAlertsStats.ips_con_alertas }} |
            <strong>Críticas:</strong> {{ ipAlertsStats.ips_criticas }} |
            <strong>Alto riesgo:</strong> {{ ipAlertsStats.ips_alto_riesgo }}
          </div>

          <!-- Tabla de Alertas IP -->
          <div *ngIf="ipAlerts.length === 0" class="alert alert-success">
            <i class="fas fa-check-circle me-2"></i>
            No se detectaron IPs sospechosas en el período seleccionado.
          </div>

          <div *ngIf="ipAlerts.length > 0" class="card border-0 shadow-sm">
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-dark-theme">
                  <thead>
                    <tr>
                      <th>
                        <i class="fas fa-network-wired me-1"></i>
                        IP Address
                      </th>
                      <th>
                        <i class="fas fa-exclamation-triangle me-1"></i>
                        Nivel de Riesgo
                      </th>
                      <th>
                        <i class="fas fa-tachometer-alt me-1"></i>
                        Puntuación de Riesgo
                        <small class="d-block text-muted" style="font-weight: normal; font-size: 0.75rem;">
                          <i class="fas fa-info-circle"></i> Bajo: 0-50 | Medio: 51-150 | Alto: 151-300 | Crítico: 301+
                        </small>
                      </th>
                      <th>
                        <i class="fas fa-hashtag me-1"></i>
                        Intentos
                      </th>
                      <th>
                        <i class="fas fa-percentage me-1"></i>
                        Tasa Éxito
                      </th>
                      <th>
                        <i class="fas fa-building me-1"></i>
                        RFCs
                      </th>
                      <th>
                        <i class="fas fa-envelope me-1"></i>
                        Emails
                      </th>
                      <th>
                        <i class="fas fa-shield-alt me-1"></i>
                        Tipos de Alerta
                      </th>
                      <th>
                        <i class="fas fa-cog me-1"></i>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let alert of ipAlerts"
                        [class.alert-row-critical]="alert.nivel_riesgo === 'CRÍTICO'"
                        [class.alert-row-high]="alert.nivel_riesgo === 'ALTO'"
                        [class.alert-row-medium]="alert.nivel_riesgo === 'MEDIO'"
                        [class.alert-row-low]="alert.nivel_riesgo === 'BAJO'">
                      <td class="fw-bold">
                        <i class="fas fa-desktop me-2 text-muted"></i>
                        {{ alert.ip_address }}
                      </td>
                      <td>
                        <span class="badge badge-risk" [ngClass]="'badge-risk-' + alert.nivel_riesgo.toLowerCase()">
                          <i class="fas" [ngClass]="registrationService.getRiskLevelIcon(alert.nivel_riesgo)"></i>
                          {{ alert.nivel_riesgo }}
                        </span>
                      </td>
                      <td>
                        <div class="risk-score-container position-relative">
                          <div class="d-flex align-items-center cursor-pointer"
                               (mouseenter)="showScoreTooltip(alert, $event)"
                               (mouseleave)="hideScoreTooltip()"
                               (mousemove)="updateTooltipPosition($event)">
                            <div class="risk-score-visual me-2">
                              <i class="fas fa-chart-line me-1" [ngClass]="'text-' + getRiskScoreColorClass(alert.nivel_riesgo)"></i>
                              <span class="fw-bold fs-5">{{ alert.puntuacion_riesgo }}</span>
                              <span class="text-muted ms-1">pts</span>
                            </div>
                            <i class="fas fa-info-circle text-muted small"></i>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="d-flex flex-column">
                          <span class="badge bg-secondary mb-1">
                            <i class="fas fa-list me-1"></i>
                            {{ alert.total_intentos }} total
                          </span>
                          <small class="text-muted">
                            <i class="fas fa-check text-success"></i> {{ alert.intentos_exitosos }}
                            <i class="fas fa-times text-danger ms-2"></i> {{ alert.intentos_fallidos }}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div class="progress" style="height: 24px; min-width: 90px; background-color: rgba(255, 255, 255, 0.1);">
                          <div
                            class="progress-bar d-flex align-items-center justify-content-center"
                            [ngClass]="getTasaExito(alert) > 50 ? 'bg-danger' : 'bg-warning'"
                            [style.width.%]="getTasaExito(alert)"
                            role="progressbar">
                            <span class="fw-bold" style="font-size: 0.85rem;">{{ getTasaExito(alert).toFixed(1) }}%</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge badge-info-custom">
                          <i class="fas fa-building me-1"></i>
                          {{ alert.rfcs_diferentes }}
                        </span>
                      </td>
                      <td>
                        <span class="badge badge-info-custom">
                          <i class="fas fa-envelope me-1"></i>
                          {{ alert.emails_diferentes }}
                        </span>
                      </td>
                      <td>
                        <div class="d-flex flex-wrap gap-1">
                          <span *ngFor="let tipo of alert.tipos_alerta" class="badge badge-alert-type">
                            <i class="fas fa-exclamation-circle me-1"></i>
                            {{ registrationService.getAlertTypeLabel(tipo) }}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-action" (click)="viewIPAlertDetails(alert)">
                          <i class="fas fa-eye me-1"></i>
                          Ver Detalles
                        </button>
                      </td>
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
        <p class="text-muted">Haz clic en "Actualizar" para cargar los intentos de registro</p>
      </div>
    </div>

    <!-- Modal de Detalles -->
    <div
      class="modal fade"
      [class.show]="selectedAttempt !== null"
      [style.display]="selectedAttempt !== null ? 'block' : 'none'"
      tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" *ngIf="selectedAttempt">
          <div class="modal-header">
            <h5 class="modal-title">
              Detalles del Intento: {{ selectedAttempt.uuid_intento }}
            </h5>
            <button type="button" class="btn-close" (click)="closeDetails()"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <h6>Información General</h6>
                <p><strong>UUID:</strong> {{ selectedAttempt.uuid_intento }}</p>
                <p><strong>Fecha Inicio:</strong> {{ registrationService.formatDate(selectedAttempt.timestamp_inicio) }}</p>
                <p><strong>Fecha Fin:</strong> {{ registrationService.formatDate(selectedAttempt.timestamp_fin) }}</p>
                <p><strong>Duración:</strong> {{ formatDurationMs(selectedAttempt.duracion_ms) }}</p>
                <p>
                  <strong>Estado:</strong>
                  <span class="badge" [ngClass]="'bg-' + registrationService.getStatusColor(isExitoso(selectedAttempt))">
                    {{ isExitoso(selectedAttempt) ? 'Exitoso' : 'Fallido' }}
                  </span>
                </p>
                <p *ngIf="selectedAttempt.fallo_tipo">
                  <strong>Tipo Fallo:</strong>
                  <span class="badge" [ngClass]="registrationService.getFailureTypeBadge(selectedAttempt.fallo_tipo)">
                    {{ selectedAttempt.fallo_tipo }}
                  </span>
                </p>
                <p *ngIf="selectedAttempt.fallo_detalle">
                  <strong>Detalle Fallo:</strong> {{ selectedAttempt.fallo_detalle }}
                </p>
                <p *ngIf="selectedAttempt.mensaje_resultado">
                  <strong>Mensaje:</strong> {{ selectedAttempt.mensaje_resultado }}
                </p>
              </div>

              <div class="col-md-6 mb-3">
                <h6>Datos de Empresa</h6>
                <p><strong>RFC:</strong> {{ selectedAttempt.empresa_rfc }}</p>
                <p><strong>Razón Social:</strong> {{ selectedAttempt.empresa_razon_social || 'N/A' }}</p>

                <h6 class="mt-3">Datos de Usuario</h6>
                <p><strong>Email:</strong> {{ selectedAttempt.usuario_email }}</p>
                <p><strong>Nombre:</strong> {{ getFullName(selectedAttempt.usuario_nombre, selectedAttempt.usuario_apellido) }}</p>
                <p><strong>Teléfono:</strong> {{ selectedAttempt.usuario_telefono || 'N/A' }}</p>
                <p><strong>Código Promoción:</strong> {{ selectedAttempt.codigo_promocion || 'N/A' }}</p>
              </div>

              <div class="col-md-6 mb-3">
                <h6>Validaciones</h6>
                <p>
                  <strong>Email Válido:</strong>
                  <i [class]="getValidationIconClass(selectedAttempt.email_valido)"></i>
                </p>
                <p>
                  <strong>Email Corporativo:</strong>
                  <i [class]="getValidationIconClass(selectedAttempt.email_corporativo)"></i>
                </p>
                <p>
                  <strong>RFC Existe:</strong>
                  <i [class]="getRfcValidationIconClass(selectedAttempt.rfc_existe)"></i>
                </p>
                <p>
                  <strong>Konesh Válido:</strong>
                  <i [class]="getValidationIconClass(selectedAttempt.konesh_valido)"></i>
                </p>
                <p><strong>Código Promoción Válido:</strong>
                  <i [class]="getValidationIconClass(selectedAttempt.codigo_promocion_valido)"></i>
                </p>
              </div>

              <div class="col-md-6 mb-3">
                <h6>Información Técnica</h6>
                <p><strong>IP Origen:</strong> {{ selectedAttempt.ip_address || 'N/A' }}</p>
                <p><strong>Reintento:</strong>
                  <i class="fas" [class.fa-check]="isReintento(selectedAttempt)" [class.fa-times]="!isReintento(selectedAttempt)"></i>
                </p>
                <p><strong>Certificación Completa:</strong> {{ selectedAttempt.certificacion_completa === 1 ? 'Sí' : 'No' }}</p>
                <p *ngIf="selectedAttempt.empresa_id_creada">
                  <strong>ID Empresa Creada:</strong> {{ selectedAttempt.empresa_id_creada }}
                </p>
                <p *ngIf="selectedAttempt.usuario_id_creado">
                  <strong>ID Usuario Creado:</strong> {{ selectedAttempt.usuario_id_creado }}
                </p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeDetails()">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade" [class.show]="selectedAttempt !== null" *ngIf="selectedAttempt !== null"></div>

    <!-- Modal de Detalles de Alerta IP -->
    <div
      class="modal fade"
      [class.show]="selectedIPAlert !== null"
      [style.display]="selectedIPAlert !== null ? 'block' : 'none'"
      tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" *ngIf="selectedIPAlert">
          <div class="modal-header" [ngClass]="'bg-' + registrationService.getRiskLevelColor(selectedIPAlert.nivel_riesgo) + ' text-white'">
            <h5 class="modal-title">
              <i class="fas" [ngClass]="registrationService.getRiskLevelIcon(selectedIPAlert.nivel_riesgo)"></i>
              Detalles de Alerta: {{ selectedIPAlert.ip_address }}
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="closeIPAlertDetails()"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-12 mb-4">
                <h6 class="mb-3">
                  <i class="fas fa-calculator me-2"></i>
                  Evaluación de Riesgo
                </h6>
                <div class="row">
                  <div class="col-md-6">
                    <p><strong>Nivel de Riesgo:</strong>
                      <span class="badge" [ngClass]="'bg-' + registrationService.getRiskLevelColor(selectedIPAlert.nivel_riesgo)">
                        {{ selectedIPAlert.nivel_riesgo }}
                      </span>
                    </p>
                    <p><strong>Puntuación Total:</strong>
                      <span class="fs-4 fw-bold text-warning">{{ selectedIPAlert.puntuacion_riesgo }} puntos</span>
                    </p>
                    <p class="text-muted small">{{ getRiskRangeExplanation(selectedIPAlert.puntuacion_riesgo) }}</p>
                  </div>
                  <div class="col-md-6" *ngIf="selectedIPAlert.detalle_puntuacion">
                    <div class="card bg-dark border-secondary">
                      <div class="card-header bg-secondary text-white py-2">
                        <strong>Desglose de Puntuación</strong>
                      </div>
                      <div class="card-body p-2">
                        <table class="table table-sm table-dark mb-0">
                          <tbody>
                            <tr>
                              <td>
                                <i class="fas fa-list-ol me-1"></i>
                                Intentos (×{{ selectedIPAlert.detalle_puntuacion.breakdown.intentos_totales.peso }})
                              </td>
                              <td class="text-end">
                                {{ selectedIPAlert.detalle_puntuacion.breakdown.intentos_totales.valor }} =
                                <strong>{{ selectedIPAlert.detalle_puntuacion.breakdown.intentos_totales.puntos }}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <i class="fas fa-building me-1"></i>
                                RFCs (×{{ selectedIPAlert.detalle_puntuacion.breakdown.rfcs_diferentes.peso }})
                              </td>
                              <td class="text-end">
                                {{ selectedIPAlert.detalle_puntuacion.breakdown.rfcs_diferentes.valor }} =
                                <strong>{{ selectedIPAlert.detalle_puntuacion.breakdown.rfcs_diferentes.puntos }}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <i class="fas fa-envelope me-1"></i>
                                Emails (×{{ selectedIPAlert.detalle_puntuacion.breakdown.emails_diferentes.peso }})
                              </td>
                              <td class="text-end">
                                {{ selectedIPAlert.detalle_puntuacion.breakdown.emails_diferentes.valor }} =
                                <strong>{{ selectedIPAlert.detalle_puntuacion.breakdown.emails_diferentes.puntos }}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <i class="fas fa-times-circle me-1"></i>
                                Fallos (×{{ selectedIPAlert.detalle_puntuacion.breakdown.intentos_fallidos.peso }})
                              </td>
                              <td class="text-end">
                                {{ selectedIPAlert.detalle_puntuacion.breakdown.intentos_fallidos.valor }} =
                                <strong>{{ selectedIPAlert.detalle_puntuacion.breakdown.intentos_fallidos.puntos }}</strong>
                              </td>
                            </tr>
                            <tr class="table-danger">
                              <td>
                                <i class="fas fa-exclamation-triangle me-1"></i>
                                Éxitos (×{{ selectedIPAlert.detalle_puntuacion.breakdown.intentos_exitosos.peso }})
                              </td>
                              <td class="text-end">
                                {{ selectedIPAlert.detalle_puntuacion.breakdown.intentos_exitosos.valor }} =
                                <strong>{{ selectedIPAlert.detalle_puntuacion.breakdown.intentos_exitosos.puntos }}</strong>
                              </td>
                            </tr>
                            <tr class="border-top border-warning">
                              <td><strong>TOTAL</strong></td>
                              <td class="text-end">
                                <strong class="fs-5 text-warning">{{ selectedIPAlert.detalle_puntuacion.total }}</strong>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6 mb-3">
                <h6>Estadísticas de Actividad</h6>
                <p><strong>Total de Intentos:</strong> {{ selectedIPAlert.total_intentos }}</p>
                <p><strong>Intentos Exitosos:</strong>
                  <span class="badge bg-success">{{ selectedIPAlert.intentos_exitosos }}</span>
                </p>
                <p><strong>Intentos Fallidos:</strong>
                  <span class="badge bg-danger">{{ selectedIPAlert.intentos_fallidos }}</span>
                </p>
                <p><strong>Tasa de Éxito:</strong> {{ getTasaExito(selectedIPAlert).toFixed(2) }}%</p>
                <p><strong>Intentos/Hora:</strong> {{ selectedIPAlert.intentos_por_hora.toFixed(2) }}</p>
                <p><strong>Horas de Actividad:</strong> {{ selectedIPAlert.horas_actividad.toFixed(2) }}h</p>
              </div>

              <div class="col-md-6 mb-3">
                <h6>Patrones Detectados</h6>
                <p><strong>RFCs Diferentes:</strong>
                  <span class="badge bg-info">{{ selectedIPAlert.rfcs_diferentes }}</span>
                </p>
                <p><strong>Emails Diferentes:</strong>
                  <span class="badge bg-info">{{ selectedIPAlert.emails_diferentes }}</span>
                </p>
                <p><strong>Primer Intento:</strong> {{ registrationService.formatDate(selectedIPAlert.primer_intento) }}</p>
                <p><strong>Último Intento:</strong> {{ registrationService.formatDate(selectedIPAlert.ultimo_intento) }}</p>
                <p><strong>Duración Promedio:</strong> {{ formatDurationMs(selectedIPAlert.duracion_promedio_ms) }}</p>
              </div>

              <div class="col-md-6 mb-3">
                <h6>Tipos de Alerta Detectados</h6>
                <div class="mb-3">
                  <span *ngFor="let tipo of selectedIPAlert.tipos_alerta" class="badge bg-danger me-2 mb-2">
                    <i class="fas fa-exclamation-triangle me-1"></i>
                    {{ tipo }}
                  </span>
                </div>
              </div>

              <div class="col-12 mb-3" *ngIf="selectedIPAlert.tipos_fallo_array && selectedIPAlert.tipos_fallo_array.length > 0">
                <h6>Tipos de Fallo Detectados</h6>
                <div class="mb-3">
                  <span *ngFor="let fallo of selectedIPAlert.tipos_fallo_array" class="badge bg-warning me-1 mb-1">
                    {{ fallo }}
                  </span>
                </div>
              </div>

              <div class="col-12 mb-3">
                <h6>Recomendaciones de Seguridad</h6>
                <div class="alert alert-warning">
                  <ul class="mb-0">
                    <li *ngFor="let rec of selectedIPAlert.recomendaciones">{{ rec }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeIPAlertDetails()">Cerrar</button>
            <button type="button" class="btn btn-danger">
              <i class="fas fa-ban me-1"></i>
              Bloquear IP
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade" [class.show]="selectedIPAlert !== null" *ngIf="selectedIPAlert !== null"></div>

    <!-- Tooltip global para desglose de puntuación -->
    <div *ngIf="selectedScoreAlert && selectedScoreAlert.detalle_puntuacion"
         class="score-tooltip"
         [style.left.px]="tooltipPosition.x"
         [style.top.px]="tooltipPosition.y">
      <div class="score-tooltip-header">
        <i class="fas fa-calculator me-2"></i>
        <strong>Desglose de Puntuación - {{ selectedScoreAlert.ip_address }}</strong>
      </div>
      <div class="score-tooltip-body">
        <div class="score-breakdown-item">
          <span class="score-label">
            <i class="fas fa-list-ol me-1"></i>
            Intentos Totales (×{{ selectedScoreAlert.detalle_puntuacion.breakdown.intentos_totales.peso }}):
          </span>
          <span class="score-value">
            {{ selectedScoreAlert.detalle_puntuacion.breakdown.intentos_totales.valor }} =
            <strong>{{ selectedScoreAlert.detalle_puntuacion.breakdown.intentos_totales.puntos }} pts</strong>
          </span>
        </div>
        <div class="score-breakdown-item">
          <span class="score-label">
            <i class="fas fa-building me-1"></i>
            RFCs Diferentes (×{{ selectedScoreAlert.detalle_puntuacion.breakdown.rfcs_diferentes.peso }}):
          </span>
          <span class="score-value">
            {{ selectedScoreAlert.detalle_puntuacion.breakdown.rfcs_diferentes.valor }} =
            <strong>{{ selectedScoreAlert.detalle_puntuacion.breakdown.rfcs_diferentes.puntos }} pts</strong>
          </span>
        </div>
        <div class="score-breakdown-item">
          <span class="score-label">
            <i class="fas fa-envelope me-1"></i>
            Emails Diferentes (×{{ selectedScoreAlert.detalle_puntuacion.breakdown.emails_diferentes.peso }}):
          </span>
          <span class="score-value">
            {{ selectedScoreAlert.detalle_puntuacion.breakdown.emails_diferentes.valor }} =
            <strong>{{ selectedScoreAlert.detalle_puntuacion.breakdown.emails_diferentes.puntos }} pts</strong>
          </span>
        </div>
        <div class="score-breakdown-item">
          <span class="score-label">
            <i class="fas fa-times-circle me-1"></i>
            Intentos Fallidos (×{{ selectedScoreAlert.detalle_puntuacion.breakdown.intentos_fallidos.peso }}):
          </span>
          <span class="score-value">
            {{ selectedScoreAlert.detalle_puntuacion.breakdown.intentos_fallidos.valor }} =
            <strong>{{ selectedScoreAlert.detalle_puntuacion.breakdown.intentos_fallidos.puntos }} pts</strong>
          </span>
        </div>
        <div class="score-breakdown-item score-critical">
          <span class="score-label">
            <i class="fas fa-exclamation-triangle me-1"></i>
            Intentos Exitosos (×{{ selectedScoreAlert.detalle_puntuacion.breakdown.intentos_exitosos.peso }}):
          </span>
          <span class="score-value">
            {{ selectedScoreAlert.detalle_puntuacion.breakdown.intentos_exitosos.valor }} =
            <strong>{{ selectedScoreAlert.detalle_puntuacion.breakdown.intentos_exitosos.puntos }} pts</strong>
          </span>
        </div>
        <div class="score-total">
          <span class="score-label"><strong>TOTAL:</strong></span>
          <span class="score-value">
            <strong class="fs-5">{{ selectedScoreAlert.detalle_puntuacion.total }} puntos</strong>
          </span>
        </div>
      </div>
      <div class="score-tooltip-footer">
        <small class="text-muted">
          <i class="fas fa-lightbulb me-1"></i>
          {{ getRiskRangeExplanation(selectedScoreAlert.puntuacion_riesgo) }}
        </small>
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
    .modal.show {
      background-color: rgba(0, 0, 0, 0.5);
    }

    /* Tabla con tema dark */
    .table-dark-theme {
      color: #dee2e6;
    }

    .table-dark-theme thead th {
      background-color: rgba(0, 0, 0, 0.2);
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      padding: 12px;
      font-weight: 600;
      color: #adb5bd;
    }

    .table-dark-theme tbody td {
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    /* Estilos para alertas IP - tema dark friendly */
    .table-dark-theme tbody tr.alert-row-critical {
      background-color: rgba(220, 53, 69, 0.08) !important;
      border-left: 4px solid #dc3545 !important;
    }
    .table-dark-theme tbody tr.alert-row-critical:hover {
      background-color: rgba(220, 53, 69, 0.15) !important;
    }

    .table-dark-theme tbody tr.alert-row-high {
      background-color: rgba(255, 193, 7, 0.06) !important;
      border-left: 4px solid #ffc107 !important;
    }
    .table-dark-theme tbody tr.alert-row-high:hover {
      background-color: rgba(255, 193, 7, 0.12) !important;
    }

    .table-dark-theme tbody tr.alert-row-medium {
      background-color: rgba(13, 202, 240, 0.05) !important;
      border-left: 4px solid #0dcaf0 !important;
    }
    .table-dark-theme tbody tr.alert-row-medium:hover {
      background-color: rgba(13, 202, 240, 0.10) !important;
    }

    .table-dark-theme tbody tr.alert-row-low {
      background-color: rgba(25, 135, 84, 0.05) !important;
      border-left: 4px solid #198754 !important;
    }
    .table-dark-theme tbody tr.alert-row-low:hover {
      background-color: rgba(25, 135, 84, 0.10) !important;
    }

    /* Badges personalizados para tema dark */
    .badge-risk {
      padding: 6px 12px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .badge-risk-crítico {
      background-color: rgba(220, 53, 69, 0.2);
      color: #ff6b6b;
      border: 1px solid rgba(220, 53, 69, 0.4);
    }

    .badge-risk-alto {
      background-color: rgba(255, 193, 7, 0.2);
      color: #ffd43b;
      border: 1px solid rgba(255, 193, 7, 0.4);
    }

    .badge-risk-medio {
      background-color: rgba(13, 202, 240, 0.2);
      color: #66d9ef;
      border: 1px solid rgba(13, 202, 240, 0.4);
    }

    .badge-risk-bajo {
      background-color: rgba(25, 135, 84, 0.2);
      color: #51cf66;
      border: 1px solid rgba(25, 135, 84, 0.4);
    }

    /* Badge para info (RFCs, Emails) */
    .badge-info-custom {
      background-color: rgba(100, 116, 139, 0.2);
      color: #94a3b8;
      border: 1px solid rgba(100, 116, 139, 0.3);
      padding: 6px 10px;
      font-size: 0.85rem;
    }

    /* Badge para tipos de alerta */
    .badge-alert-type {
      background-color: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 4px 8px;
      font-size: 0.75rem;
      white-space: nowrap;
    }

    /* Barra de puntuación de riesgo */
    .risk-score-bar {
      height: 8px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      min-width: 60px;
      position: relative;
    }

    .risk-score-fill {
      height: 100%;
      width: 100%;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .risk-score-fill.risk-level-crítico {
      background: linear-gradient(90deg, #dc3545 0%, #ff6b6b 100%);
    }

    .risk-score-fill.risk-level-alto {
      background: linear-gradient(90deg, #ffc107 0%, #ffd43b 100%);
    }

    .risk-score-fill.risk-level-medio {
      background: linear-gradient(90deg, #0dcaf0 0%, #66d9ef 100%);
    }

    .risk-score-fill.risk-level-bajo {
      background: linear-gradient(90deg, #198754 0%, #51cf66 100%);
    }

    /* Botón de acción personalizado */
    .btn-action {
      background-color: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 6px 12px;
      transition: all 0.2s ease;
    }

    .btn-action:hover {
      background-color: rgba(59, 130, 246, 0.25);
      color: #93c5fd;
      border-color: rgba(59, 130, 246, 0.5);
      transform: translateY(-1px);
    }

    /* Asegurar que el texto sea legible */
    tr.alert-row-critical td,
    tr.alert-row-high td,
    tr.alert-row-medium td,
    tr.alert-row-low td {
      color: inherit;
    }

    /* Cursor pointer para elementos interactivos */
    .cursor-pointer {
      cursor: pointer;
    }

    /* Colores de texto para puntuación de riesgo */
    .text-crítico {
      color: #ff6b6b !important;
    }
    .text-alto {
      color: #ffd43b !important;
    }
    .text-medio {
      color: #66d9ef !important;
    }
    .text-bajo {
      color: #51cf66 !important;
    }

    /* Tooltip de desglose de puntuación */
    .risk-score-container {
      position: relative;
    }

    .score-tooltip {
      position: fixed;
      z-index: 9999;
      min-width: 420px;
      max-width: 500px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      animation: fadeInTooltip 0.2s ease-out;
      pointer-events: none;
    }

    @keyframes fadeInTooltip {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .score-tooltip-header {
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px 8px 0 0;
      color: #e2e8f0;
    }

    .score-tooltip-body {
      padding: 12px 16px;
    }

    .score-breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.875rem;
    }

    .score-breakdown-item:last-of-type {
      border-bottom: none;
    }

    .score-breakdown-item.score-critical {
      background: rgba(220, 53, 69, 0.1);
      padding: 8px 12px;
      margin: 4px -12px;
      border-radius: 4px;
      border-bottom: 1px solid rgba(220, 53, 69, 0.2);
    }

    .score-breakdown-item .score-label {
      color: #94a3b8;
      flex: 1;
    }

    .score-breakdown-item .score-value {
      color: #e2e8f0;
      text-align: right;
      white-space: nowrap;
    }

    .score-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0 8px;
      margin-top: 8px;
      border-top: 2px solid rgba(255, 255, 255, 0.15);
    }

    .score-total .score-label {
      color: #f1f5f9;
    }

    .score-total .score-value {
      color: #fbbf24;
    }

    .score-tooltip-footer {
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.03);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0 0 8px 8px;
    }

    .score-tooltip-footer small {
      display: block;
      line-height: 1.4;
    }
  `]
})
export class RegistrationAttemptsDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedEnvironment: 'qa' | 'prod' = 'qa';
  isLoading = false;
  error: string | null = null;

  attempts: RegistrationAttempt[] = [];
  stats: RegistrationStats | null = null;
  analysis: RegistrationAnalysis | null = null;
  paginacion: Paginacion | null = null;

  // Propiedades calculadas para paginación
  get paginaActual(): number {
    if (!this.paginacion) return 1;
    return Math.floor(this.filters.offset / this.filters.limit) + 1;
  }

  get tieneSiguiente(): boolean {
    if (!this.paginacion) return false;
    return this.filters.offset + this.filters.limit < this.paginacion.total;
  }

  get tieneAnterior(): boolean {
    return this.filters.offset > 0;
  }

  ipAlerts: IPAlert[] = [];
  ipAlertsStats: IPAlertsStats | null = null;
  alertasPorTipo: AlertasPorTipo | null = null;
  filtrosAplicados: FiltrosAplicados | null = null;

  activeTab: 'intentos' | 'analisis' | 'alertas' = 'intentos';
  selectedAttempt: RegistrationAttempt | null = null;
  selectedIPAlert: IPAlert | null = null;
  selectedScoreAlert: IPAlert | null = null;
  tooltipPosition = { x: 0, y: 0 };

  filters: RegistrationFilters = {
    limit: 20,
    offset: 0
  };

  ipAlertFilters: IPAlertFilters = {
    horas_analisis: 24,
    min_intentos: 3,
    solo_alertas: true
  };

  Math = Math;

  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  private filterTimeout: any;

  constructor(
    public facade: RegistrationAttemptsMonitoringFacade,
    public registrationService: RegistrationAttemptsMonitoringService
  ) {}

  ngOnInit(): void {
    this.subscribeToFacade();
    this.loadData();
    this.loadIPAlertsData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.facade.clearState();
  }

  private subscribeToFacade(): void {
    this.facade.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.isLoading = loading);

    this.facade.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);

    this.facade.attempts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(attempts => this.attempts = attempts);

    this.facade.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => this.stats = stats);

    this.facade.analysis$
      .pipe(takeUntil(this.destroy$))
      .subscribe(analysis => this.analysis = analysis);

    this.facade.paginacion$
      .pipe(takeUntil(this.destroy$))
      .subscribe(paginacion => this.paginacion = paginacion);

    this.facade.ipAlerts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(alerts => this.ipAlerts = alerts);

    this.facade.ipAlertsStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => this.ipAlertsStats = stats);

    this.facade.alertasPorTipo$
      .pipe(takeUntil(this.destroy$))
      .subscribe(alertas => this.alertasPorTipo = alertas);

    this.facade.filtrosAplicados$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filtros => this.filtrosAplicados = filtros);
  }

  onEnvironmentChange(): void {
    this.loadData();
  }

  loadData(): void {
    const baseUrl = this.getCurrentBaseUrl();
    this.facade.loadAttempts(this.filters, baseUrl);
  }

  applyFilters(): void {
    this.filters.offset = 0;
    this.loadData();
  }

  onFilterChange(): void {
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    this.filterTimeout = setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  clearFilters(): void {
    this.filters = {
      limit: 20,
      offset: 0
    };
    this.loadData();
  }

  previousPage(): void {
    if (this.tieneAnterior) {
      this.filters.offset = Math.max(0, this.filters.offset - this.filters.limit);
      this.loadData();
    }
  }

  nextPage(): void {
    if (this.tieneSiguiente) {
      this.filters.offset += this.filters.limit;
      this.loadData();
    }
  }

  firstPage(): void {
    this.filters.offset = 0;
    this.loadData();
  }

  lastPage(): void {
    if (this.paginacion) {
      this.filters.offset = (this.paginacion.total_paginas - 1) * this.filters.limit;
      this.loadData();
    }
  }

  goToPage(page: number): void {
    this.filters.offset = (page - 1) * this.filters.limit;
    this.loadData();
  }

  getPageNumbers(): number[] {
    if (!this.paginacion) return [];

    const currentPage = this.paginaActual;
    const totalPages = this.paginacion.total_paginas;
    const maxPagesToShow = 5;
    const pages: number[] = [];

    if (totalPages <= maxPagesToShow) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar un rango alrededor de la página actual
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      // Ajustar si estamos cerca del final
      if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  viewDetails(attempt: RegistrationAttempt): void {
    this.selectedAttempt = attempt;
  }

  closeDetails(): void {
    this.selectedAttempt = null;
  }

  setActiveTab(tab: 'intentos' | 'analisis' | 'alertas'): void {
    this.activeTab = tab;
  }

  loadIPAlertsData(): void {
    const baseUrl = this.getCurrentBaseUrl();
    this.facade.loadIPAlerts(this.ipAlertFilters, baseUrl);
  }

  viewIPAlertDetails(alert: IPAlert): void {
    this.selectedIPAlert = alert;
  }

  closeIPAlertDetails(): void {
    this.selectedIPAlert = null;
  }

  private getCurrentBaseUrl(): string {
    return this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
  }

  // Helper methods para manejar la estructura del API
  getTasaExitoStats(stats: RegistrationStats): number {
    if (stats.total_intentos === 0) return 0;
    const exitosos = typeof stats.intentos_exitosos === 'string' ? parseInt(stats.intentos_exitosos) : stats.intentos_exitosos;
    return ((exitosos / stats.total_intentos) * 100);
  }

  formatDurationMs(ms: number | null): string {
    if (ms === null || ms === undefined) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    const seconds = ms / 1000;
    return this.registrationService.formatDuration(seconds);
  }

  isExitoso(attempt: RegistrationAttempt): boolean {
    return attempt.registro_exitoso === 1;
  }

  isReintento(attempt: RegistrationAttempt): boolean {
    return attempt.es_reintento === 1;
  }

  getValidationIconClass(value: number | null): string {
    if (value === 1) return 'fas fa-check-circle text-success';
    if (value === 0) return 'fas fa-times-circle text-danger';
    return 'fas fa-question-circle text-muted';
  }

  getRfcValidationIconClass(value: number | null): string {
    if (value === 1) return 'fas fa-check-circle text-warning';
    if (value === 0) return 'fas fa-times-circle text-success';
    return 'fas fa-question-circle text-muted';
  }

  getNumericValue(value: string | number): number {
    return typeof value === 'string' ? parseInt(value) : value;
  }

  getFailedAttempts(totalIntentos: number, intentosExitosos: string | number): number {
    const exitosos = typeof intentosExitosos === 'string' ? parseInt(intentosExitosos) : intentosExitosos;
    return totalIntentos - exitosos;
  }

  getFullName(nombre: string | null, apellido: string | null): string {
    const n = nombre || '';
    const a = apellido || '';
    const fullName = `${n} ${a}`.trim();
    return fullName || 'N/A';
  }

  getTasaExito(alert: IPAlert): number {
    if (alert.total_intentos === 0) return 0;
    return (alert.intentos_exitosos / alert.total_intentos) * 100;
  }

  showScoreTooltip(alert: IPAlert, event: MouseEvent): void {
    this.selectedScoreAlert = alert;
    this.updateTooltipPosition(event);
  }

  hideScoreTooltip(): void {
    this.selectedScoreAlert = null;
  }

  updateTooltipPosition(event: MouseEvent): void {
    if (this.selectedScoreAlert) {
      // Posicionar tooltip a la derecha del cursor con offset
      const offsetX = 20;
      const offsetY = -50;

      // Calcular posición
      let x = event.clientX + offsetX;
      let y = event.clientY + offsetY;

      // Ajustar si se sale por la derecha de la pantalla
      const tooltipWidth = 420;
      if (x + tooltipWidth > window.innerWidth) {
        x = event.clientX - tooltipWidth - offsetX;
      }

      // Ajustar si se sale por abajo de la pantalla
      const tooltipHeight = 400;
      if (y + tooltipHeight > window.innerHeight) {
        y = window.innerHeight - tooltipHeight - 20;
      }

      // Ajustar si se sale por arriba de la pantalla
      if (y < 0) {
        y = 20;
      }

      this.tooltipPosition = { x, y };
    }
  }

  getRiskScoreColorClass(nivelRiesgo: string): string {
    return nivelRiesgo.toLowerCase();
  }

  getRiskRangeExplanation(puntuacion: number): string {
    if (puntuacion <= 50) {
      return 'Riesgo bajo - Actividad normal';
    } else if (puntuacion <= 150) {
      return 'Riesgo medio - Monitoreo recomendado';
    } else if (puntuacion <= 300) {
      return 'Riesgo alto - Atención inmediata';
    } else {
      return 'Riesgo crítico - Acción urgente requerida';
    }
  }
}
