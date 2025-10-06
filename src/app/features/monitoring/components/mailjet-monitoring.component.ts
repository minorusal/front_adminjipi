import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitoringService } from '../../../core/services/monitoring.service';
import { 
  EmailMonitoringRecord, 
  EmailStats,
  EmailMetrics,
  TopTemplate,
  RecentFailure,
  EmailDetail,
  EmailMonitoringFilters,
  MailjetErrorNotification, 
  MailjetStats
} from '../../../shared/types/monitoring.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-mailjet-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-envelope me-2"></i>
          Monitoreo Mailjet - Sistema Completo
        </h2>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select form-select-sm" [(ngModel)]="selectedEnvironment" (change)="onEnvironmentChange()">
            <option value="qa">QA</option>
            <option value="prod">Prod</option>
          </select>
          <button class="btn btn-outline-primary btn-sm ms-2" (click)="refreshAllData()">
            <i class="fas fa-sync-alt me-1"></i>
            Actualizar Todo
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <ul class="nav nav-tabs mb-4" role="tablist">
        <li class="nav-item" role="presentation">
          <button 
            class="nav-link" 
            [class.active]="activeTab === 'dashboard'"
            (click)="switchTab('dashboard')"
            type="button"
            role="tab">
            <i class="fas fa-tachometer-alt me-2"></i>
            Dashboard
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button 
            class="nav-link" 
            [class.active]="activeTab === 'monitoring'"
            (click)="switchTab('monitoring')"
            type="button"
            role="tab">
            <i class="fas fa-list me-2"></i>
            Monitoreo General
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button 
            class="nav-link" 
            [class.active]="activeTab === 'analytics'"
            (click)="switchTab('analytics')"
            type="button"
            role="tab">
            <i class="fas fa-chart-line me-2"></i>
            Análisis y Métricas
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button 
            class="nav-link" 
            [class.active]="activeTab === 'errors'"
            (click)="switchTab('errors')"
            type="button"
            role="tab">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Gestión de Errores
          </button>
        </li>
      </ul>

      <!-- DASHBOARD TAB -->
      <div *ngIf="activeTab === 'dashboard'">
        <!-- Quick Stats Cards -->
        <div class="row mb-4" *ngIf="emailStats && !statsLoading">
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card text-center">
              <div class="card-body">
                <i class="fas fa-paper-plane fa-2x text-primary mb-2"></i>
                <h4 class="card-title">{{ emailStats.total_emails | number }}</h4>
                <p class="card-text text-muted">Total Emails</p>
                <small class="text-success">+{{ emailStats.today_emails }} hoy</small>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card text-center">
              <div class="card-body">
                <i class="fas fa-check-circle fa-2x text-success mb-2"></i>
                <h4 class="card-title">{{ emailStats.emails_delivered | number }}</h4>
                <p class="card-text text-muted">Entregados</p>
                <small class="text-muted">{{ getDeliveryRate() }}% tasa</small>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card text-center">
              <div class="card-body">
                <i class="fas fa-exclamation-circle fa-2x text-danger mb-2"></i>
                <h4 class="card-title">{{ getTotalErrors() | number }}</h4>
                <p class="card-text text-muted">Errores Total</p>
                <small class="text-warning">{{ emailStats.emails_pending }} pendientes</small>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card text-center">
              <div class="card-body">
                <i class="fas fa-mouse-pointer fa-2x text-info mb-2"></i>
                <h4 class="card-title">{{ emailStats.emails_opened | number }}</h4>
                <p class="card-text text-muted">Abiertos</p>
                <small class="text-info">{{ emailStats.emails_clicked }} clicks</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Failures Alert -->
        <div *ngIf="recentFailures && recentFailures.length > 0" class="alert alert-warning mb-4">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>Alertas:</strong> {{ recentFailures.length }} fallos en las últimas 24 horas
            </div>
            <button class="btn btn-outline-warning btn-sm" (click)="switchTab('errors')">
              Ver Detalles
            </button>
          </div>
        </div>

        <!-- Top Templates -->
        <div class="card mb-4" *ngIf="topTemplates && topTemplates.length > 0">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-trophy me-2"></i>
              Templates Más Utilizados
            </h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Template ID</th>
                    <th>Usos</th>
                    <th>Éxitos</th>
                    <th>Fallos</th>
                    <th>Tasa Éxito</th>
                    <th>Último Uso</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let template of topTemplates.slice(0, 5)">
                    <td><span class="badge bg-primary">{{ template.template_id }}</span></td>
                    <td>{{ template.usage_count | number }}</td>
                    <td><span class="text-success">{{ template.success_count | number }}</span></td>
                    <td><span class="text-danger">{{ template.failed_count | number }}</span></td>
                    <td>
                      <span class="badge" 
                            [class.bg-success]="template.success_rate >= 95"
                            [class.bg-warning]="template.success_rate >= 85 && template.success_rate < 95"
                            [class.bg-danger]="template.success_rate < 85">
                        {{ template.success_rate.toFixed(1) }}%
                      </span>
                    </td>
                    <td><small>{{ template.last_used | date:'dd/MM/yyyy HH:mm' }}</small></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Weekly Metrics Chart -->
        <div class="card" *ngIf="weeklyMetrics && weeklyMetrics.length > 0">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-chart-line me-2"></i>
              Métricas de los Últimos 7 Días
            </h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Éxitos</th>
                    <th>Fallos</th>
                    <th>Pendientes</th>
                    <th>Tasa Éxito</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let metric of weeklyMetrics">
                    <td>{{ metric.period | date:'dd/MM/yyyy' }}</td>
                    <td>{{ metric.total_emails | number }}</td>
                    <td><span class="text-success">{{ metric.success_emails | number }}</span></td>
                    <td><span class="text-danger">{{ metric.failed_emails | number }}</span></td>
                    <td><span class="text-warning">{{ metric.pending_emails | number }}</span></td>
                    <td>
                      <div class="d-flex align-items-center">
                        <span class="badge me-2" 
                              [class.bg-success]="metric.success_rate >= 95"
                              [class.bg-warning]="metric.success_rate >= 85 && metric.success_rate < 95"
                              [class.bg-danger]="metric.success_rate < 85">
                          {{ metric.success_rate.toFixed(1) }}%
                        </span>
                        <div class="progress" style="width: 60px; height: 6px;">
                          <div class="progress-bar" 
                               [class.bg-success]="metric.success_rate >= 95"
                               [class.bg-warning]="metric.success_rate >= 85 && metric.success_rate < 95"
                               [class.bg-danger]="metric.success_rate < 85"
                               [style.width.%]="metric.success_rate">
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- GENERAL MONITORING TAB -->
      <div *ngIf="activeTab === 'monitoring'">
        <!-- Advanced Filters -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-filter me-2"></i>
              Filtros Avanzados
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3 mb-3">
                <label for="recipient" class="form-label">Destinatario:</label>
                <input
                  type="email"
                  id="recipient"
                  class="form-control"
                  placeholder="email@ejemplo.com"
                  [(ngModel)]="emailFilters.recipient">
              </div>
              <div class="col-md-3 mb-3">
                <label for="sender" class="form-label">Remitente:</label>
                <input
                  type="email"
                  id="sender"
                  class="form-control"
                  placeholder="noreply@credibusiness.com"
                  [(ngModel)]="emailFilters.sender">
              </div>
              <div class="col-md-3 mb-3">
                <label for="subject" class="form-label">Asunto:</label>
                <input
                  type="text"
                  id="subject"
                  class="form-control"
                  placeholder="Buscar en asunto..."
                  [(ngModel)]="emailFilters.subject">
              </div>
              <div class="col-md-3 mb-3">
                <label for="status" class="form-label">Estado:</label>
                <select id="status" class="form-select" [(ngModel)]="emailFilters.status">
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="sent">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="opened">Abierto</option>
                  <option value="clicked">Click realizado</option>
                  <option value="bounced">Rebotado</option>
                  <option value="spam">Spam</option>
                  <option value="blocked">Bloqueado</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
            <div class="row">
              <div class="col-md-3 mb-3">
                <label for="templateId" class="form-label">Template ID:</label>
                <input
                  type="number"
                  id="templateId"
                  class="form-control"
                  placeholder="6185967"
                  [(ngModel)]="emailFilters.templateId">
              </div>
              <div class="col-md-3 mb-3">
                <label for="tipoOperacion" class="form-label">Tipo Operación:</label>
                <input
                  type="text"
                  id="tipoOperacion"
                  class="form-control"
                  placeholder="email_template"
                  [(ngModel)]="emailFilters.tipoOperacion">
              </div>
              <div class="col-md-3 mb-3">
                <label for="dateFrom" class="form-label">Desde:</label>
                <input
                  type="date"
                  id="dateFrom"
                  class="form-control"
                  [(ngModel)]="emailFilters.dateFrom">
              </div>
              <div class="col-md-3 mb-3">
                <label for="dateTo" class="form-label">Hasta:</label>
                <input
                  type="date"
                  id="dateTo"
                  class="form-control"
                  [(ngModel)]="emailFilters.dateTo">
              </div>
            </div>
            <div class="row">
              <div class="col-md-12 d-flex justify-content-between align-items-center">
                <div class="d-flex gap-2">
                  <button class="btn btn-primary" (click)="applyEmailFilters()">
                    <i class="fas fa-search me-1"></i>
                    Buscar
                  </button>
                  <button class="btn btn-secondary" (click)="clearEmailFilters()">
                    <i class="fas fa-times me-1"></i>
                    Limpiar
                  </button>
                </div>
                <div class="d-flex gap-2 align-items-center">
                  <label for="pageSize" class="form-label mb-0">Por página:</label>
                  <select id="pageSize" class="form-select form-select-sm" [(ngModel)]="pageSize" (change)="onPageSizeChange()">
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Email Monitoring Table -->
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-table me-2"></i>
              Monitoreo de Emails
            </h5>
            <div class="d-flex align-items-center gap-3">
              <!-- Quick pagination in header -->
              <div *ngIf="emailTotalPages > 1" class="d-flex align-items-center gap-2">
                <small class="text-muted">Página:</small>
                <div class="btn-group btn-group-sm" role="group">
                  <button type="button" 
                          class="btn btn-outline-secondary"
                          (click)="goToEmailPage(emailCurrentPage - 1)" 
                          [disabled]="emailCurrentPage === 1"
                          title="Página anterior">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <button type="button" class="btn btn-outline-secondary disabled">
                    {{ emailCurrentPage }} / {{ emailTotalPages }}
                  </button>
                  <button type="button" 
                          class="btn btn-outline-secondary"
                          (click)="goToEmailPage(emailCurrentPage + 1)" 
                          [disabled]="emailCurrentPage === emailTotalPages"
                          title="Página siguiente">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              <span class="badge bg-primary fs-6">
                Total: {{ totalEmailItems }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <div *ngIf="emailLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>

            <div *ngIf="emailError" class="alert alert-danger">
              <i class="fas fa-exclamation-triangle me-2"></i>
              {{ emailError }}
            </div>

            <div *ngIf="!emailLoading && !emailError && emailRecords.length === 0" class="text-center py-4">
              <i class="fas fa-info-circle fa-2x text-muted mb-3"></i>
              <p class="text-muted">No se encontraron emails con los filtros aplicados.</p>
            </div>

            <div *ngIf="!emailLoading && !emailError && emailRecords.length > 0" class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Destinatario</th>
                    <th>Asunto</th>
                    <th>Estado</th>
                    <th>Template</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let email of emailRecords; trackBy: trackByEmailId">
                    <td>{{ email.bitacora_id }}</td>
                    <td>
                      <div><strong>{{ email.nombre_destinatario }}</strong></div>
                      <small class="text-muted">{{ email.email_destinatario }}</small>
                    </td>
                    <td>
                      <div class="email-subject">{{ email.asunto }}</div>
                      <small class="text-muted">{{ email.tipo_operacion }}</small>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadgeClass(email.estado_actual)">
                        {{ getStatusLabel(email.estado_actual) }}
                      </span>
                    </td>
                    <td>
                      <span *ngIf="email.template_id" class="badge bg-secondary">{{ email.template_id }}</span>
                      <span *ngIf="!email.template_id" class="text-muted">-</span>
                    </td>
                    <td>
                      <div>{{ email.fecha_creacion | date:'dd/MM/yyyy' }}</div>
                      <small class="text-muted">{{ email.fecha_creacion | date:'HH:mm:ss' }}</small>
                    </td>
                    <td>
                      <button 
                        class="btn btn-outline-info btn-sm"
                        (click)="viewEmailDetails(email)"
                        title="Ver detalles del email">
                        <i class="fas fa-eye me-1"></i>
                        Ver
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div *ngIf="totalEmailPages > 1" class="d-flex justify-content-center mt-4">
              <nav>
                <ul class="pagination">
                  <li class="page-item" [class.disabled]="currentEmailPage === 1">
                    <button class="page-link" (click)="goToEmailPage(1)" [disabled]="currentEmailPage === 1">
                      <i class="fas fa-angle-double-left"></i>
                    </button>
                  </li>
                  <li class="page-item" [class.disabled]="currentEmailPage === 1">
                    <button class="page-link" (click)="goToEmailPage(currentEmailPage - 1)" [disabled]="currentEmailPage === 1">
                      <i class="fas fa-angle-left"></i>
                    </button>
                  </li>
                  
                  <li *ngFor="let page of getVisibleEmailPages()" 
                      class="page-item" 
                      [class.active]="page === currentEmailPage">
                    <button class="page-link" (click)="goToEmailPage(page)">{{ page }}</button>
                  </li>
                  
                  <li class="page-item" [class.disabled]="currentEmailPage === totalEmailPages">
                    <button class="page-link" (click)="goToEmailPage(currentEmailPage + 1)" [disabled]="currentEmailPage === totalEmailPages">
                      <i class="fas fa-angle-right"></i>
                    </button>
                  </li>
                  <li class="page-item" [class.disabled]="currentEmailPage === totalEmailPages">
                    <button class="page-link" (click)="goToEmailPage(totalEmailPages)" [disabled]="currentEmailPage === totalEmailPages">
                      <i class="fas fa-angle-double-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- ANALYTICS TAB -->
      <div *ngIf="activeTab === 'analytics'">
        <!-- Metrics Period Selection -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-chart-bar me-2"></i>
              Métricas por Período
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="metricsPeriod" class="form-label">Período:</label>
                <select id="metricsPeriod" class="form-select" [(ngModel)]="selectedPeriod" (change)="loadMetrics()">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label for="metricsDays" class="form-label">Últimos días:</label>
                <select id="metricsDays" class="form-select" [(ngModel)]="selectedDays" (change)="loadMetrics()">
                  <option value="7">7 días</option>
                  <option value="14">14 días</option>
                  <option value="30">30 días</option>
                  <option value="90">90 días</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Templates Analytics -->
        <div class="card" *ngIf="topTemplates && topTemplates.length > 0">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-trophy me-2"></i>
              Análisis de Templates (Top 10)
            </h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped">
                <thead class="table-dark">
                  <tr>
                    <th>Ranking</th>
                    <th>Template ID</th>
                    <th>Total Usos</th>
                    <th>Éxitos</th>
                    <th>Fallos</th>
                    <th>Tasa de Éxito</th>
                    <th>Último Uso</th>
                    <th>Rendimiento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let template of topTemplates; index as i">
                    <td>
                      <span class="badge" 
                            [class.bg-warning]="i === 0"
                            [class.bg-secondary]="i === 1"
                            [class.bg-info]="i === 2"
                            [class.bg-light]="i > 2"
                            [class.text-dark]="i > 2">
                        #{{ i + 1 }}
                      </span>
                    </td>
                    <td><strong>{{ template.template_id }}</strong></td>
                    <td>{{ template.usage_count | number }}</td>
                    <td><span class="text-success">{{ template.success_count | number }}</span></td>
                    <td><span class="text-danger">{{ template.failed_count | number }}</span></td>
                    <td>
                      <span class="badge" 
                            [class.bg-success]="template.success_rate >= 95"
                            [class.bg-warning]="template.success_rate >= 85 && template.success_rate < 95"
                            [class.bg-danger]="template.success_rate < 85">
                        {{ template.success_rate.toFixed(2) }}%
                      </span>
                    </td>
                    <td>{{ template.last_used | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                      <div class="progress" style="height: 20px;">
                        <div class="progress-bar" 
                             [class.bg-success]="template.success_rate >= 95"
                             [class.bg-warning]="template.success_rate >= 85 && template.success_rate < 95"
                             [class.bg-danger]="template.success_rate < 85"
                             [style.width.%]="template.success_rate">
                          {{ template.success_rate.toFixed(1) }}%
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ERRORS TAB -->
      <div *ngIf="activeTab === 'errors'">
        <!-- Recent Failures -->
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Fallos Recientes (Últimas 24h)
            </h5>
            <button class="btn btn-outline-danger btn-sm" (click)="loadRecentFailures()">
              <i class="fas fa-sync me-1"></i>
              Actualizar
            </button>
          </div>
          <div class="card-body">
            <div *ngIf="recentFailuresLoading" class="text-center py-4">
              <div class="spinner-border text-danger" role="status">
                <span class="visually-hidden">Cargando fallos...</span>
              </div>
            </div>

            <div *ngIf="!recentFailuresLoading && recentFailures && recentFailures.length === 0" class="text-center py-4">
              <i class="fas fa-check-circle fa-2x text-success mb-3"></i>
              <p class="text-success">¡Excelente! No hay fallos recientes en las últimas 24 horas.</p>
            </div>

            <div *ngIf="!recentFailuresLoading && recentFailures && recentFailures.length > 0" class="table-responsive">
              <table class="table table-striped">
                <thead class="table-danger">
                  <tr>
                    <th>ID</th>
                    <th>Destinatario</th>
                    <th>Asunto</th>
                    <th>Estado</th>
                    <th>Error</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let failure of recentFailures">
                    <td>{{ failure.bitacora_id }}</td>
                    <td>
                      <div><strong>{{ failure.nombre_destinatario }}</strong></div>
                      <small class="text-muted">{{ failure.email_destinatario }}</small>
                    </td>
                    <td>{{ failure.asunto }}</td>
                    <td>
                      <span class="badge bg-danger">{{ getStatusLabel(failure.estado_actual) }}</span>
                    </td>
                    <td>
                      <div class="error-message">
                        {{ failure.error_mensaje ? (failure.error_mensaje.length > 50 ? (failure.error_mensaje | slice:0:50) + '...' : failure.error_mensaje) : 'Sin mensaje' }}
                      </div>
                    </td>
                    <td>{{ failure.fecha_creacion | date:'dd/MM/yyyy HH:mm' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- System Error Notifications (Original functionality) -->
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-cogs me-2"></i>
              Notificaciones de Error del Sistema
            </h5>
            <button class="btn btn-outline-danger btn-sm" (click)="cleanupErrors()">
              <i class="fas fa-trash me-1"></i>
              Limpiar Errores
            </button>
          </div>
          <div class="card-body">
            <!-- Original error notifications functionality here -->
            <div *ngIf="systemErrorStats" class="row mb-3">
              <div class="col-md-4">
                <div class="card text-center">
                  <div class="card-body">
                    <h6 class="card-title">{{ systemErrorStats.total_errors }}</h6>
                    <p class="card-text text-muted small">Total Errores</p>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card text-center">
                  <div class="card-body">
                    <h6 class="card-title text-warning">{{ systemErrorStats.unresolved_errors }}</h6>
                    <p class="card-text text-muted small">Sin Resolver</p>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card text-center">
                  <div class="card-body">
                    <h6 class="card-title text-success">{{ systemErrorStats.resolved_errors }}</h6>
                    <p class="card-text text-muted small">Resueltos</p>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="systemNotifications && systemNotifications.length > 0" class="table-responsive">
              <table class="table table-striped">
                <thead class="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Mensaje</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let notification of systemNotifications; trackBy: trackByNotificationId"
                      [class.table-warning]="!notification.resolved">
                    <td>{{ notification.id }}</td>
                    <td><span class="badge bg-secondary">{{ notification.error_type }}</span></td>
                    <td>
                      <div class="error-message-cell">
                        {{ notification.error_message.length > 80 ? (notification.error_message | slice:0:80) + '...' : notification.error_message }}
                      </div>
                    </td>
                    <td>
                      <span class="badge"
                            [class.bg-success]="notification.resolved"
                            [class.bg-danger]="!notification.resolved">
                        {{ notification.resolved ? 'Resuelto' : 'Pendiente' }}
                      </span>
                    </td>
                    <td>{{ notification.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                      <button 
                        class="btn btn-outline-info btn-sm"
                        (click)="viewSystemErrorDetails(notification)"
                        title="Ver detalles del error del sistema">
                        <i class="fas fa-eye me-1"></i>
                        Ver
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Email Details Modal -->
      <div *ngIf="selectedEmailDetail" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-envelope me-2"></i>
                Detalles Completos del Email - ID: {{ selectedEmailDetail.bitacora_id }}
              </h5>
              <button type="button" class="btn-close" (click)="closeEmailDetails()"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <!-- Columna Izquierda: Información Básica -->
                <div class="col-md-6">
                  <div class="card mb-3">
                    <div class="card-header">
                      <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Información Básica</h6>
                    </div>
                    <div class="card-body">
                      <table class="table table-sm table-borderless">
                        <tr>
                          <td><strong>ID Bitácora:</strong></td>
                          <td>{{ selectedEmailDetail.bitacora_id }}</td>
                        </tr>
                        <tr>
                          <td><strong>Tipo Operación:</strong></td>
                          <td><span class="badge bg-info">{{ selectedEmailDetail.tipo_operacion }}</span></td>
                        </tr>
                        <tr>
                          <td><strong>Estado Inicial:</strong></td>
                          <td>
                            <span class="badge" [ngClass]="getStatusBadgeClass(selectedEmailDetail.estado_inicial)">
                              {{ getStatusLabel(selectedEmailDetail.estado_inicial) }}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Estado Actual:</strong></td>
                          <td>
                            <span class="badge" [ngClass]="getStatusBadgeClass(selectedEmailDetail.estado_actual)">
                              {{ getStatusLabel(selectedEmailDetail.estado_actual) }}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Intentos Chequeo:</strong></td>
                          <td>{{ selectedEmailDetail.intentos_chequeo }}</td>
                        </tr>
                        <tr>
                          <td><strong>Fecha Creación:</strong></td>
                          <td>{{ selectedEmailDetail.fecha_creacion | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                        </tr>
                        <tr *ngIf="selectedEmailDetail.fecha_actualizacion">
                          <td><strong>Fecha Actualización:</strong></td>
                          <td>{{ selectedEmailDetail.fecha_actualizacion | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                        </tr>
                        <tr *ngIf="selectedEmailDetail.fecha_ultimo_chequeo">
                          <td><strong>Último Chequeo:</strong></td>
                          <td>{{ selectedEmailDetail.fecha_ultimo_chequeo | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                        </tr>
                      </table>
                    </div>
                  </div>

                  <!-- Información del Destinatario -->
                  <div class="card mb-3">
                    <div class="card-header">
                      <h6 class="mb-0"><i class="fas fa-user me-2"></i>Destinatario</h6>
                    </div>
                    <div class="card-body">
                      <table class="table table-sm table-borderless">
                        <tr>
                          <td><strong>Nombre:</strong></td>
                          <td>{{ selectedEmailDetail.nombre_destinatario || 'N/A' }}</td>
                        </tr>
                        <tr>
                          <td><strong>Email:</strong></td>
                          <td>{{ selectedEmailDetail.email_destinatario || 'N/A' }}</td>
                        </tr>
                      </table>
                    </div>
                  </div>

                  <!-- Información del Remitente -->
                  <div class="card mb-3" *ngIf="selectedEmailDetail.email_remitente || selectedEmailDetail.nombre_remitente">
                    <div class="card-header">
                      <h6 class="mb-0"><i class="fas fa-paper-plane me-2"></i>Remitente</h6>
                    </div>
                    <div class="card-body">
                      <table class="table table-sm table-borderless">
                        <tr *ngIf="selectedEmailDetail.nombre_remitente">
                          <td><strong>Nombre:</strong></td>
                          <td>{{ selectedEmailDetail.nombre_remitente }}</td>
                        </tr>
                        <tr *ngIf="selectedEmailDetail.email_remitente">
                          <td><strong>Email:</strong></td>
                          <td>{{ selectedEmailDetail.email_remitente }}</td>
                        </tr>
                        <tr *ngIf="selectedEmailDetail.asunto">
                          <td><strong>Asunto:</strong></td>
                          <td>{{ selectedEmailDetail.asunto }}</td>
                        </tr>
                      </table>
                    </div>
                  </div>

                  <!-- Errores -->
                  <div class="card mb-3" *ngIf="selectedEmailDetail.error_mensaje || selectedEmailDetail.error_detalles">
                    <div class="card-header bg-danger text-white">
                      <h6 class="mb-0"><i class="fas fa-exclamation-triangle me-2"></i>Información de Errores</h6>
                    </div>
                    <div class="card-body">
                      <div *ngIf="selectedEmailDetail.error_mensaje" class="mb-2">
                        <strong>Mensaje:</strong>
                        <div class="alert alert-danger mt-1">{{ selectedEmailDetail.error_mensaje }}</div>
                      </div>
                      <div *ngIf="selectedEmailDetail.error_detalles">
                        <strong>Detalles:</strong>
                        <pre class="bg-light p-2 rounded mt-1" style="max-height: 150px; overflow-y: auto;">{{ selectedEmailDetail.error_detalles }}</pre>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Columna Derecha: Información Técnica -->
                <div class="col-md-6">
                  <!-- Template Information -->
                  <div class="card mb-3" *ngIf="selectedEmailDetail.template_id || selectedEmailDetail.template_variables">
                    <div class="card-header">
                      <h6 class="mb-0"><i class="fas fa-code me-2"></i>Información de Template</h6>
                    </div>
                    <div class="card-body">
                      <table class="table table-sm table-borderless" *ngIf="selectedEmailDetail.template_id">
                        <tr>
                          <td><strong>Template ID:</strong></td>
                          <td><span class="badge bg-primary">{{ selectedEmailDetail.template_id }}</span></td>
                        </tr>
                      </table>
                      <div *ngIf="selectedEmailDetail.template_variables" class="mt-2">
                        <strong>Variables del Template:</strong>
                        <pre class="bg-light p-2 rounded mt-1" style="max-height: 200px; overflow-y: auto;">{{ selectedEmailDetail.template_variables | json }}</pre>
                      </div>
                    </div>
                  </div>

                  <!-- Lista Information -->
                  <div class="card mb-3" *ngIf="selectedEmailDetail.lista_id || selectedEmailDetail.accion_lista || selectedEmailDetail.propiedades_contacto">
                    <div class="card-header">
                      <h6 class="mb-0"><i class="fas fa-list me-2"></i>Información de Lista</h6>
                    </div>
                    <div class="card-body">
                      <table class="table table-sm table-borderless">
                        <tr *ngIf="selectedEmailDetail.lista_id">
                          <td><strong>Lista ID:</strong></td>
                          <td><span class="badge bg-secondary">{{ selectedEmailDetail.lista_id }}</span></td>
                        </tr>
                        <tr *ngIf="selectedEmailDetail.accion_lista">
                          <td><strong>Acción Lista:</strong></td>
                          <td><span class="badge bg-info">{{ selectedEmailDetail.accion_lista }}</span></td>
                        </tr>
                      </table>
                      <div *ngIf="selectedEmailDetail.propiedades_contacto" class="mt-2">
                        <strong>Propiedades Contacto:</strong>
                        <pre class="bg-light p-2 rounded mt-1" style="max-height: 150px; overflow-y: auto;">{{ selectedEmailDetail.propiedades_contacto | json }}</pre>
                      </div>
                    </div>
                  </div>

                  <!-- Mailjet Information -->
                  <div class="card mb-3" *ngIf="selectedEmailDetail.mailjet_message_id || selectedEmailDetail.mailjet_contact_id || selectedEmailDetail.mailjet_response">
                    <div class="card-header">
                      <h6 class="mb-0"><i class="fas fa-server me-2"></i>Información de Mailjet</h6>
                    </div>
                    <div class="card-body">
                      <table class="table table-sm table-borderless">
                        <tr *ngIf="selectedEmailDetail.mailjet_message_id">
                          <td><strong>Message ID:</strong></td>
                          <td><span class="badge bg-success">{{ selectedEmailDetail.mailjet_message_id }}</span></td>
                        </tr>
                        <tr *ngIf="selectedEmailDetail.mailjet_contact_id">
                          <td><strong>Contact ID:</strong></td>
                          <td><span class="badge bg-success">{{ selectedEmailDetail.mailjet_contact_id }}</span></td>
                        </tr>
                      </table>
                      <div *ngIf="selectedEmailDetail.mailjet_response" class="mt-2">
                        <strong>Respuesta de Mailjet:</strong>
                        <pre class="bg-light p-2 rounded mt-1" style="max-height: 200px; overflow-y: auto;">{{ selectedEmailDetail.mailjet_response | json }}</pre>
                      </div>
                    </div>
                  </div>

                  <!-- Session Information -->
                  <div class="card mb-3" *ngIf="selectedEmailDetail.usuario_id || selectedEmailDetail.ip_origen || selectedEmailDetail.user_agent">
                    <div class="card-header">
                      <h6 class="mb-0"><i class="fas fa-user-shield me-2"></i>Información de Sesión</h6>
                    </div>
                    <div class="card-body">
                      <table class="table table-sm table-borderless">
                        <tr *ngIf="selectedEmailDetail.usuario_id">
                          <td><strong>Usuario ID:</strong></td>
                          <td><span class="badge bg-warning text-dark">{{ selectedEmailDetail.usuario_id }}</span></td>
                        </tr>
                        <tr *ngIf="selectedEmailDetail.ip_origen">
                          <td><strong>IP Origen:</strong></td>
                          <td><code>{{ selectedEmailDetail.ip_origen }}</code></td>
                        </tr>
                      </table>
                      <div *ngIf="selectedEmailDetail.user_agent" class="mt-2">
                        <strong>User Agent:</strong>
                        <div class="bg-light p-2 rounded mt-1" style="font-family: monospace; font-size: 0.85em; word-break: break-all;">
                          {{ selectedEmailDetail.user_agent }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- History of States -->
                  <div class="card mb-3" *ngIf="selectedEmailDetail.historial_estados && selectedEmailDetail.historial_estados.length > 0">
                    <div class="card-header">
                      <h6 class="mb-0"><i class="fas fa-history me-2"></i>Historial de Estados</h6>
                    </div>
                    <div class="card-body">
                      <div class="timeline">
                        <div *ngFor="let estado of selectedEmailDetail.historial_estados" class="timeline-item">
                          <small class="text-muted">{{ estado.fecha_cambio | date:'dd/MM/yyyy HH:mm:ss' }}</small>
                          <div>
                            <span class="badge bg-secondary">{{ estado.estado_anterior }}</span>
                            <i class="fas fa-arrow-right mx-2"></i>
                            <span class="badge bg-primary">{{ estado.estado_nuevo }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="card mb-3" *ngIf="!selectedEmailDetail.historial_estados || selectedEmailDetail.historial_estados.length === 0">
                    <div class="card-header">
                      <h6 class="mb-0"><i class="fas fa-history me-2"></i>Historial de Estados</h6>
                    </div>
                    <div class="card-body">
                      <div class="text-center text-muted py-3">
                        <i class="fas fa-info-circle fa-2x mb-2"></i>
                        <p>No hay cambios de estado registrados</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeEmailDetails()">Cerrar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- System Error Details Modal (Original) -->
      <div *ngIf="selectedNotification" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-bug me-2"></i>
                Error del Sistema - ID: {{ selectedNotification.id }}
              </h5>
              <button type="button" class="btn-close" (click)="closeSystemErrorDetails()"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Información del Error</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>ID:</strong></td>
                      <td>{{ selectedNotification.id }}</td>
                    </tr>
                    <tr>
                      <td><strong>Tipo:</strong></td>
                      <td><span class="badge bg-secondary">{{ selectedNotification.error_type }}</span></td>
                    </tr>
                    <tr>
                      <td><strong>Estado:</strong></td>
                      <td>
                        <span class="badge"
                              [class.bg-success]="selectedNotification.resolved"
                              [class.bg-danger]="!selectedNotification.resolved">
                          {{ selectedNotification.resolved ? 'Resuelto' : 'Pendiente' }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Fecha:</strong></td>
                      <td>{{ selectedNotification.created_at | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    </tr>
                  </table>
                  
                  <div class="mt-3">
                    <h6><i class="fas fa-exclamation-triangle me-2"></i>Mensaje</h6>
                    <div class="alert alert-danger">{{ selectedNotification.error_message }}</div>
                  </div>

                  <div *ngIf="selectedNotification.resolution_notes" class="mt-3">
                    <h6><i class="fas fa-check-circle me-2"></i>Notas de Resolución</h6>
                    <div class="alert alert-success">{{ selectedNotification.resolution_notes }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6><i class="fas fa-database me-2"></i>Contexto</h6>
                  <pre class="bg-light p-2 rounded" style="max-height: 250px; overflow-y: auto;">{{ selectedNotification.context_data | json }}</pre>
                  
                  <div *ngIf="selectedNotification.stack_trace" class="mt-3">
                    <h6><i class="fas fa-bug me-2"></i>Stack Trace</h6>
                    <pre class="bg-light p-2 rounded text-danger small" style="max-height: 250px; overflow-y: auto;">{{ selectedNotification.stack_trace }}</pre>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeSystemErrorDetails()">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      border: none;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    
    .card {
      border: none;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    
    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }

    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .modal.show {
      display: block;
    }

    .email-subject {
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .error-message {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .error-message-cell {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .table-warning {
      background-color: #fff3cd;
    }

    .timeline {
      border-left: 2px solid #dee2e6;
      padding-left: 1rem;
    }

    .timeline-item {
      margin-bottom: 1rem;
      position: relative;
    }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: -1.5rem;
      top: 0.5rem;
      width: 8px;
      height: 8px;
      background-color: #007bff;
      border-radius: 50%;
    }

    .progress {
      background-color: #f1f3f4;
    }

    .nav-tabs .nav-link.active {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MailjetMonitoringComponent implements OnInit {
  // Tab management
  activeTab: 'dashboard' | 'monitoring' | 'analytics' | 'errors' = 'dashboard';

  // Environment
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  // Email Monitoring Data
  emailRecords: EmailMonitoringRecord[] = [];
  emailStats: EmailStats | null = null;
  weeklyMetrics: EmailMetrics[] = [];
  topTemplates: TopTemplate[] = [];
  recentFailures: RecentFailure[] = [];
  
  // Email Monitoring Pagination
  currentEmailPage = 1;
  pageSize = 20;
  totalEmailItems = 0;
  totalEmailPages = 0;
  
  // Email Filters
  emailFilters: EmailMonitoringFilters = {};
  
  // Loading states
  emailLoading = false;
  statsLoading = false;
  metricsLoading = false;
  recentFailuresLoading = false;
  
  // Error states
  emailError: string | null = null;
  
  // Analytics
  selectedPeriod: 'daily' | 'weekly' | 'monthly' = 'daily';
  selectedDays = 7;
  
  // Modals
  selectedEmailRecord: EmailMonitoringRecord | null = null;
  selectedEmailDetail: EmailDetail | null = null;
  
  // Original error notifications (System errors)
  systemNotifications: MailjetErrorNotification[] = [];
  systemErrorStats: MailjetStats | null = null;
  selectedNotification: MailjetErrorNotification | null = null;

  // Expose Math for use in template
  Math = Math;

  constructor(private monitoringService: MonitoringService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  // ===== TAB MANAGEMENT =====
  switchTab(tab: 'dashboard' | 'monitoring' | 'analytics' | 'errors') {
    this.activeTab = tab;
    
    switch (tab) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'monitoring':
        this.loadEmailMonitoring();
        break;
      case 'analytics':
        this.loadAnalytics();
        break;
      case 'errors':
        this.loadErrorsData();
        break;
    }
  }

  onEnvironmentChange() {
    this.refreshAllData();
  }

  refreshAllData() {
    switch (this.activeTab) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'monitoring':
        this.loadEmailMonitoring();
        break;
      case 'analytics':
        this.loadAnalytics();
        break;
      case 'errors':
        this.loadErrorsData();
        break;
    }
  }

  // ===== DASHBOARD DATA =====
  loadDashboardData() {
    this.loadEmailStats();
    this.loadWeeklyMetrics();
    this.loadTopTemplates();
    this.loadRecentFailures();
  }

  loadEmailStats() {
    this.statsLoading = true;
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;

    this.monitoringService.getEmailStats(baseUrl).subscribe({
      next: (response) => {
        this.statsLoading = false;
        if (response.success && response.data && response.data.length > 0) {
          this.emailStats = response.data[0];
        } else {
          this.emailStats = null;
        }
      },
      error: (err) => {
        this.statsLoading = false;
        console.error('Error loading email stats:', err);
        this.emailStats = null;
      }
    });
  }

  loadWeeklyMetrics() {
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    
    this.monitoringService.getEmailMetrics('daily', 7, baseUrl).subscribe({
      next: (response) => {
        if (response.success) {
          this.weeklyMetrics = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading weekly metrics:', err);
      }
    });
  }

  loadTopTemplates() {
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    
    this.monitoringService.getTopTemplates(10, baseUrl).subscribe({
      next: (response) => {
        if (response.success) {
          this.topTemplates = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading top templates:', err);
      }
    });
  }

  loadRecentFailures() {
    this.recentFailuresLoading = true;
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    
    this.monitoringService.getRecentFailures(24, 50, baseUrl).subscribe({
      next: (response) => {
        this.recentFailuresLoading = false;
        if (response.success) {
          this.recentFailures = response.data;
        }
      },
      error: (err) => {
        this.recentFailuresLoading = false;
        console.error('Error loading recent failures:', err);
      }
    });
  }

  // ===== EMAIL MONITORING =====
  loadEmailMonitoring() {
    this.emailLoading = true;
    this.emailError = null;
    
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    const filters = {
      ...this.emailFilters,
      page: this.currentEmailPage,
      limit: this.pageSize
    };

    this.monitoringService.getEmailMonitoring(filters, baseUrl).subscribe({
      next: (response) => {
        this.emailLoading = false;
        if (response.success) {
          this.emailRecords = response.data;
          this.totalEmailItems = response.pagination.total;
          this.totalEmailPages = response.pagination.totalPages;
          this.currentEmailPage = response.pagination.page;
        } else {
          this.emailError = 'Error en la respuesta del servidor';
        }
      },
      error: (err) => {
        this.emailLoading = false;
        this.emailError = 'Error al cargar el monitoreo de emails';
        console.error('Error loading email monitoring:', err);
      }
    });
  }

  applyEmailFilters() {
    this.currentEmailPage = 1;
    this.loadEmailMonitoring();
  }

  clearEmailFilters() {
    this.emailFilters = {};
    this.currentEmailPage = 1;
    this.loadEmailMonitoring();
  }

  onPageSizeChange() {
    this.currentEmailPage = 1;
    this.loadEmailMonitoring();
  }

  goToEmailPage(page: number) {
    if (page >= 1 && page <= this.totalEmailPages) {
      this.currentEmailPage = page;
      this.loadEmailMonitoring();
    }
  }

  getVisibleEmailPages(): number[] {
    const pages: number[] = [];
    const totalPages = this.totalEmailPages;
    const current = this.currentEmailPage;
    
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

  // ===== ANALYTICS =====
  loadAnalytics() {
    this.loadMetrics();
    this.loadTopTemplates();
  }

  loadMetrics() {
    this.metricsLoading = true;
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    
    this.monitoringService.getEmailMetrics(this.selectedPeriod, this.selectedDays, baseUrl).subscribe({
      next: (response) => {
        this.metricsLoading = false;
        if (response.success) {
          this.weeklyMetrics = response.data;
        }
      },
      error: (err) => {
        this.metricsLoading = false;
        console.error('Error loading metrics:', err);
      }
    });
  }

  // ===== ERRORS DATA =====
  loadErrorsData() {
    this.loadRecentFailures();
    this.loadSystemErrors();
  }

  loadSystemErrors() {
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    
    // Load system error notifications (original functionality)
    this.monitoringService.getMailjetErrorNotifications({page: 1, limit: 50}, baseUrl).subscribe({
      next: (response) => {
        if (!response.error) {
          this.systemNotifications = response.results || [];
        }
      },
      error: (err) => {
        console.error('Error loading system notifications:', err);
      }
    });

    // Load system error stats
    this.monitoringService.getMailjetStats(baseUrl).subscribe({
      next: (response) => {
        if (!response.error) {
          this.systemErrorStats = response.stats;
        }
      },
      error: (err) => {
        console.error('Error loading system error stats:', err);
      }
    });
  }

  cleanupErrors() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los errores del sistema? Esta acción no se puede deshacer.')) {
      const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
      
      this.monitoringService.cleanupMailjetErrors(baseUrl).subscribe({
        next: () => {
          alert('Errores del sistema limpiados exitosamente.');
          this.loadSystemErrors();
        },
        error: (err) => {
          console.error('Error cleaning up system errors:', err);
          alert('Error al limpiar los errores del sistema. Por favor intente nuevamente.');
        }
      });
    }
  }

  // ===== EMAIL DETAILS MODAL =====
  viewEmailDetails(email: EmailMonitoringRecord) {
    this.selectedEmailRecord = email;
    
    // Load detailed information
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    this.monitoringService.getEmailDetail(email.bitacora_id, baseUrl).subscribe({
      next: (response) => {
        console.log('Email detail response:', response); // Para debug
        if (response.success) {
          this.selectedEmailDetail = response.data;
        } else {
          console.error('Error en respuesta del servidor:', response);
          // En caso de error, usar los datos básicos del email
          this.selectedEmailDetail = {
            ...email,
            estado_inicial: email.estado_actual, // Asumimos que es el mismo
            fecha_ultimo_chequeo: null,
            intentos_chequeo: email.intentos_chequeo || 0,
            usuario_id: undefined,
            ip_origen: undefined,
            user_agent: undefined,
            fecha_actualizacion: null,
            historial_estados: []
          } as EmailDetail;
        }
      },
      error: (err) => {
        console.error('Error loading email detail:', err);
        // En caso de error, usar los datos básicos del email
        this.selectedEmailDetail = {
          ...email,
          estado_inicial: email.estado_actual, // Asumimos que es el mismo
          fecha_ultimo_chequeo: null,
          intentos_chequeo: email.intentos_chequeo || 0,
          usuario_id: undefined,
          ip_origen: undefined,
          user_agent: undefined,
          fecha_actualizacion: null,
          historial_estados: []
        } as EmailDetail;
      }
    });
  }

  closeEmailDetails() {
    this.selectedEmailRecord = null;
    this.selectedEmailDetail = null;
  }

  // ===== SYSTEM ERROR DETAILS MODAL =====
  viewSystemErrorDetails(notification: MailjetErrorNotification) {
    this.selectedNotification = notification;
  }

  closeSystemErrorDetails() {
    this.selectedNotification = null;
  }

  // ===== UTILITY METHODS =====
  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-success';
      case 'opened': return 'bg-info';
      case 'clicked': return 'bg-primary';
      case 'sent': return 'bg-secondary';
      case 'pending': return 'bg-warning';
      case 'bounced': return 'bg-danger';
      case 'spam': return 'bg-warning';
      case 'blocked': return 'bg-dark';
      case 'error': return 'bg-danger';
      default: return 'bg-light text-dark';
    }
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'sent': 'Enviado',
      'delivered': 'Entregado',
      'opened': 'Abierto',
      'clicked': 'Click',
      'bounced': 'Rebotado',
      'spam': 'Spam',
      'blocked': 'Bloqueado',
      'error': 'Error'
    };
    return labels[status?.toLowerCase()] || status;
  }

  getDeliveryRate(): number {
    if (!this.emailStats || this.emailStats.total_emails === 0) return 0;
    return (this.emailStats.emails_delivered / this.emailStats.total_emails * 100);
  }

  getTotalErrors(): number {
    if (!this.emailStats) return 0;
    return this.emailStats.emails_bounced + this.emailStats.emails_spam + 
           this.emailStats.emails_blocked + this.emailStats.emails_error;
  }

  trackByEmailId(index: number, email: EmailMonitoringRecord): number {
    return email.bitacora_id;
  }

  trackByNotificationId(index: number, notification: MailjetErrorNotification): number {
    return notification.id;
  }
}