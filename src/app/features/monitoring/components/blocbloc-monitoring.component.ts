import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitoringService } from '../../../core/services/monitoring.service';
import { 
  BlocBlocResponse, 
  MonitoringFilters,
  PerformanceFilters,
  PerformanceStats
} from '../../../shared/types/monitoring.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-blocbloc-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-cube me-2"></i>
          Monitoreo BlocBloc
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
          <button class="btn btn-outline-primary btn-sm ms-2" (click)="refreshData()">
            <i class="fas fa-sync-alt me-1"></i>
            Actualizar
          </button>
          <span class="badge bg-primary fs-6 ms-2">
            Total: {{ totalItems }}
          </span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <ul class="nav nav-tabs mb-4" role="tablist">
        <li class="nav-item" role="presentation">
          <button 
            class="nav-link" 
            [class.active]="activeTab === 'general'"
            (click)="switchTab('general')"
            type="button"
            role="tab">
            <i class="fas fa-list me-2"></i>
            Listado General
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button 
            class="nav-link" 
            [class.active]="activeTab === 'performance'"
            (click)="switchTab('performance')"
            type="button"
            role="tab">
            <i class="fas fa-chart-line me-2"></i>
            Análisis de Rendimiento
          </button>
        </li>
      </ul>

      <!-- Tab Content: General -->
      <div *ngIf="activeTab === 'general'">
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
              <div class="col-md-12 mb-3">
                <label for="httpStatusSearch" class="form-label">Buscar por código HTTP:</label>
                <div class="input-group search-input-group">
                  <span class="input-group-text">
                    <i class="fas fa-search"></i>
                  </span>
                  <input
                    type="number"
                    id="httpStatusSearch"
                    class="form-control"
                    placeholder="Ej: 200, 404, 500..."
                    [(ngModel)]="httpStatusSearch"
                    (keyup.enter)="applyHttpStatusFilter()"
                    min="100"
                    max="599">
                  <button class="btn btn-outline-primary" type="button" (click)="applyHttpStatusFilter()">
                    Buscar
                  </button>
                  <button 
                    *ngIf="httpStatusSearch"
                    class="btn btn-outline-secondary" 
                    type="button" 
                    (click)="clearHttpStatusSearch()"
                    title="Limpiar búsqueda">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <small class="text-muted">
                  Busca códigos HTTP exactos (200, 404, 500, etc.)
                </small>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12 d-flex justify-content-end">
                <button class="btn btn-secondary" (click)="clearFilters()">
                  <i class="fas fa-times me-1"></i>
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Content: Performance Analysis -->
      <div *ngIf="activeTab === 'performance'">
        <!-- Performance Filters -->
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-filter me-2"></i>
              Filtros de Rendimiento
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="startDate" class="form-label">Fecha Inicio:</label>
                <input
                  type="datetime-local"
                  id="startDate"
                  class="form-control"
                  [(ngModel)]="performanceFilters.startDate"
                  (change)="applyPerformanceFilters()">
              </div>
              <div class="col-md-4 mb-3">
                <label for="endDate" class="form-label">Fecha Fin:</label>
                <input
                  type="datetime-local"
                  id="endDate"
                  class="form-control"
                  [(ngModel)]="performanceFilters.endDate"
                  (change)="applyPerformanceFilters()">
              </div>
              <div class="col-md-4 mb-3">
                <label for="minResponseTime" class="form-label">Tiempo Mínimo (ms):</label>
                <input
                  type="number"
                  id="minResponseTime"
                  class="form-control"
                  placeholder="Ej: 1000, 3000..."
                  [(ngModel)]="performanceFilters.minResponseTime"
                  (change)="applyPerformanceFilters()"
                  min="0">
              </div>
            </div>
            <div class="row">
              <div class="col-md-12 d-flex justify-content-between align-items-center">
                <div class="d-flex gap-2">
                  <button class="btn btn-primary" (click)="applyPerformanceFilters()">
                    <i class="fas fa-search me-1"></i>
                    Buscar
                  </button>
                  <button class="btn btn-secondary" (click)="clearPerformanceFilters()">
                    <i class="fas fa-times me-1"></i>
                    Limpiar Filtros
                  </button>
                </div>
                <div class="text-muted small">
                  <i class="fas fa-info-circle me-1"></i>
                  Busca respuestas con tiempos elevados para análisis de rendimiento
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Common Loading and Error States -->
      <div *ngIf="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <!-- General Tab Content -->
      <div *ngIf="activeTab === 'general' && !loading && !error">
        <!-- Pagination Info -->
        <div *ngIf="totalItems > 0" class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <span class="text-muted">
              Mostrando {{ (currentPage - 1) * pageSize + 1 }} a {{ Math.min(currentPage * pageSize, totalItems) }} de {{ totalItems }} resultados
              (Página {{ currentPage }} de {{ totalPages }})
            </span>
          </div>
        </div>

        <!-- Responses Table -->
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-table me-2"></i>
              Responses BlocBloc
            </h5>
            <div class="d-flex align-items-center gap-3">
              <!-- Quick pagination in header -->
              <div *ngIf="totalPages > 1" class="d-flex align-items-center gap-2">
                <small class="text-muted">Página:</small>
                <div class="btn-group btn-group-sm" role="group">
                  <button type="button" 
                          class="btn btn-outline-secondary"
                          (click)="goToPage(currentPage - 1)" 
                          [disabled]="currentPage === 1"
                          title="Página anterior">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <button type="button" class="btn btn-outline-secondary disabled">
                    {{ currentPage }} / {{ totalPages }}
                  </button>
                  <button type="button" 
                          class="btn btn-outline-secondary"
                          (click)="goToPage(currentPage + 1)" 
                          [disabled]="currentPage === totalPages"
                          title="Página siguiente">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              <span class="badge bg-primary fs-6">
                Total: {{ totalItems }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <div *ngIf="responses.length === 0" class="text-center py-4">
              <i class="fas fa-info-circle fa-2x text-muted mb-3"></i>
              <p class="text-muted">No se encontraron responses con los filtros aplicados.</p>
            </div>

            <div *ngIf="responses.length > 0" class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Endpoint</th>
                    <th>HTTP Status</th>
                    <th>Tiempo (ms)</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let response of responses; trackBy: trackById">
                    <td>{{ response.id }}</td>
                    <td>
                      <div><strong>{{ response.endpoint_name }}</strong></div>
                      <small class="text-muted font-monospace">{{ response.request_url }}</small>
                    </td>
                    <td>
                      <span class="badge"
                            [class.bg-success]="response.http_status >= 200 && response.http_status < 300"
                            [class.bg-warning]="response.http_status >= 400 && response.http_status < 500"
                            [class.bg-danger]="response.http_status >= 500">
                        {{ response.http_status }}
                      </span>
                    </td>
                    <td>
                      <span [class.text-success]="response.response_time_ms < 1000"
                            [class.text-warning]="response.response_time_ms >= 1000 && response.response_time_ms < 3000"
                            [class.text-danger]="response.response_time_ms >= 3000">
                        {{ response.response_time_ms }}ms
                      </span>
                    </td>
                    <td>
                      <div>{{ response.created_at | date:'dd/MM/yyyy' }}</div>
                      <small class="text-muted">{{ response.created_at | date:'HH:mm:ss' }}</small>
                    </td>
                    <td>
                      <button 
                        class="btn btn-outline-info btn-sm"
                        (click)="viewDetails(response)"
                        title="Ver detalles de la respuesta">
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

        <!-- Pagination Controls -->
        <div *ngIf="totalPages > 1" class="d-flex justify-content-center mt-4">
          <nav>
            <ul class="pagination">
              <li class="page-item" [class.disabled]="currentPage === 1">
                <button class="page-link" (click)="goToPage(1)" [disabled]="currentPage === 1">
                  <i class="fas fa-angle-double-left"></i>
                </button>
              </li>
              <li class="page-item" [class.disabled]="currentPage === 1">
                <button class="page-link" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">
                  <i class="fas fa-angle-left"></i>
                </button>
              </li>
              
              <li *ngFor="let page of getVisiblePages()" 
                  class="page-item" 
                  [class.active]="page === currentPage">
                <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
              </li>
              
              <li class="page-item" [class.disabled]="currentPage === totalPages">
                <button class="page-link" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">
                  <i class="fas fa-angle-right"></i>
                </button>
              </li>
              <li class="page-item" [class.disabled]="currentPage === totalPages">
                <button class="page-link" (click)="goToPage(totalPages)" [disabled]="currentPage === totalPages">
                  <i class="fas fa-angle-double-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <!-- Performance Analysis Tab Content -->
      <div *ngIf="activeTab === 'performance' && !loading && !error">
        <!-- Performance Stats Summary -->
        <div class="row mb-4" *ngIf="performanceStats">
          <div class="col-md-3">
            <div class="card text-center">
              <div class="card-body">
                <i class="fas fa-clock fa-2x text-warning mb-2"></i>
                <h5 class="card-title">{{ performanceStats.average_time }}ms</h5>
                <p class="card-text text-muted">Tiempo Promedio</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card text-center">
              <div class="card-body">
                <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
                <h5 class="card-title">{{ performanceStats.slowest_time }}ms</h5>
                <p class="card-text text-muted">Más Lento</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card text-center">
              <div class="card-body">
                <i class="fas fa-bolt fa-2x text-success mb-2"></i>
                <h5 class="card-title">{{ performanceStats.fastest_time }}ms</h5>
                <p class="card-text text-muted">Más Rápido</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card text-center">
              <div class="card-body">
                <i class="fas fa-chart-bar fa-2x text-info mb-2"></i>
                <h5 class="card-title">{{ performanceStats.total_requests }}</h5>
                <p class="card-text text-muted">Total Consultas</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Info -->
        <div *ngIf="totalItems > 0" class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <span class="text-muted">
              Mostrando {{ (currentPage - 1) * pageSize + 1 }} a {{ Math.min(currentPage * pageSize, totalItems) }} de {{ totalItems }} resultados
              (Página {{ currentPage }} de {{ totalPages }})
            </span>
          </div>
        </div>

        <!-- Performance Table (Sorted by response time) -->
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-tachometer-alt me-2"></i>
              Análisis de Rendimiento - Tiempos Más Altos
            </h5>
            <div class="text-muted small">
              <i class="fas fa-sort-amount-down me-1 text-success"></i>
              <strong class="text-success">Ordenado por tiempo de respuesta (más lento primero)</strong>
              <br>
              <small><i class="fas fa-check-circle me-1 text-success"></i>Ordenamiento completo en base de datos - Los tiempos más altos de cualquier fecha aparecen primero</small>
            </div>
          </div>
          <div class="card-body">
            <div *ngIf="responses.length === 0" class="text-center py-4">
              <i class="fas fa-search fa-2x text-muted mb-3"></i>
              <p class="text-muted">No se encontraron respuestas con los filtros de rendimiento aplicados.</p>
              <small class="text-muted">Prueba ajustar las fechas o reducir el tiempo mínimo.</small>
            </div>

            <div *ngIf="responses.length > 0" class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Endpoint</th>
                    <th>HTTP Status</th>
                    <th>
                      <i class="fas fa-stopwatch me-1"></i>
                      Tiempo (ms)
                    </th>
                    <th>Fecha</th>
                    <th>Impacto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let response of responses; trackBy: trackById" 
                      [style.background-color]="response.response_time_ms >= 5000 ? '#fff5f5' : response.response_time_ms >= 3000 ? '#fffbf0' : ''"
                      [style.border-left]="response.response_time_ms >= 5000 ? '3px solid #fca5a5' : response.response_time_ms >= 3000 ? '3px solid #fed7aa' : ''">
                    <td>{{ response.id }}</td>
                    <td>
                      <div><strong>{{ response.endpoint_name }}</strong></div>
                      <small class="text-muted font-monospace">{{ response.request_url }}</small>
                    </td>
                    <td>
                      <span class="badge"
                            [class.bg-success]="response.http_status >= 200 && response.http_status < 300"
                            [class.bg-warning]="response.http_status >= 400 && response.http_status < 500"
                            [class.bg-danger]="response.http_status >= 500">
                        {{ response.http_status }}
                      </span>
                    </td>
                    <td>
                      <div class="d-flex align-items-center">
                        <span class="badge fs-6"
                              [style.background-color]="response.response_time_ms >= 3000 ? '#f3e8ff' : response.response_time_ms >= 1000 ? '#fef3c7' : '#e6fffa'"
                              [style.color]="response.response_time_ms >= 3000 ? '#7c3aed' : response.response_time_ms >= 1000 ? '#d97706' : '#047857'"
                              [style.border]="response.response_time_ms >= 3000 ? '1px solid #c4b5fd' : response.response_time_ms >= 1000 ? '1px solid #fbbf24' : '1px solid #6ee7b7'">
                          {{ response.response_time_ms }}ms
                        </span>
                        <div class="progress ms-2" style="width: 100px; height: 8px; background-color: #f1f5f9;">
                          <div class="progress-bar"
                               [style.background-color]="response.response_time_ms >= 3000 ? '#c4b5fd' : response.response_time_ms >= 1000 ? '#fbbf24' : '#6ee7b7'"
                               [style.width.%]="Math.min((response.response_time_ms / 10000) * 100, 100)">
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{{ response.created_at | date:'dd/MM/yyyy' }}</div>
                      <small class="text-muted">{{ response.created_at | date:'HH:mm:ss' }}</small>
                    </td>
                    <td>
                      <span class="badge"
                            [style.background-color]="response.response_time_ms >= 5000 ? '#fee2e2' : response.response_time_ms >= 3000 ? '#fef3c7' : response.response_time_ms >= 1000 ? '#dbeafe' : '#f0fdf4'"
                            [style.color]="response.response_time_ms >= 5000 ? '#dc2626' : response.response_time_ms >= 3000 ? '#d97706' : response.response_time_ms >= 1000 ? '#2563eb' : '#166534'"
                            [style.border]="response.response_time_ms >= 5000 ? '1px solid #fca5a5' : response.response_time_ms >= 3000 ? '1px solid #fbbf24' : response.response_time_ms >= 1000 ? '1px solid #93c5fd' : '1px solid #86efac'">
                        {{ getPerformanceImpact(response.response_time_ms) }}
                      </span>
                    </td>
                    <td>
                      <button 
                        class="btn btn-outline-info btn-sm"
                        (click)="viewDetails(response)"
                        title="Ver detalles de la respuesta">
                        <i class="fas fa-eye me-1"></i>
                        Analizar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Performance Pagination Controls -->
        <div *ngIf="totalPages > 1" class="d-flex justify-content-center mt-4">
          <nav>
            <ul class="pagination">
              <li class="page-item" [class.disabled]="currentPage === 1">
                <button class="page-link" (click)="goToPage(1)" [disabled]="currentPage === 1">
                  <i class="fas fa-angle-double-left"></i>
                </button>
              </li>
              <li class="page-item" [class.disabled]="currentPage === 1">
                <button class="page-link" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">
                  <i class="fas fa-angle-left"></i>
                </button>
              </li>
              
              <li *ngFor="let page of getVisiblePages()" 
                  class="page-item" 
                  [class.active]="page === currentPage">
                <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
              </li>
              
              <li class="page-item" [class.disabled]="currentPage === totalPages">
                <button class="page-link" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">
                  <i class="fas fa-angle-right"></i>
                </button>
              </li>
              <li class="page-item" [class.disabled]="currentPage === totalPages">
                <button class="page-link" (click)="goToPage(totalPages)" [disabled]="currentPage === totalPages">
                  <i class="fas fa-angle-double-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <!-- Details Modal -->
      <div *ngIf="selectedResponse" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-info-circle me-2"></i>
                Detalles de Response BlocBloc
              </h5>
              <button type="button" class="btn-close" (click)="closeDetails()"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Información General</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>ID:</strong></td>
                      <td>{{ selectedResponse.id }}</td>
                    </tr>
                    <tr>
                      <td><strong>Endpoint:</strong></td>
                      <td>{{ selectedResponse.endpoint_name }}</td>
                    </tr>
                    <tr>
                      <td><strong>URL Base:</strong></td>
                      <td class="font-monospace">{{ getBaseUrl(selectedResponse.request_url) }}</td>
                    </tr>
                    <tr>
                      <td><strong>HTTP Status:</strong></td>
                      <td>{{ selectedResponse.http_status }}</td>
                    </tr>
                    <tr>
                      <td><strong>Tiempo de Respuesta:</strong></td>
                      <td>{{ selectedResponse.response_time_ms }}ms</td>
                    </tr>
                    <tr>
                      <td><strong>Fecha:</strong></td>
                      <td>{{ selectedResponse.created_at | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    </tr>
                  </table>
                  
                  <!-- URL Parameters Section -->
                  <div class="mt-3 url-params-section" *ngIf="getUrlParameters(selectedResponse.request_url).length > 0">
                    <h6><i class="fas fa-link me-2 text-primary"></i>Parámetros de la URL</h6>
                    <div class="card">
                      <div class="card-body p-3">
                        <div class="row" *ngFor="let param of getUrlParameters(selectedResponse.request_url)">
                          <div class="col-sm-4"><strong class="text-secondary">{{ param.key }}:</strong></div>
                          <div class="col-sm-8">
                            <span class="badge bg-primary bg-opacity-75">{{ param.value }}</span>
                          </div>
                        </div>
                        <div *ngIf="getUrlParameters(selectedResponse.request_url).length === 0" class="text-muted small">
                          <i class="fas fa-info-circle me-1"></i>Sin parámetros
                        </div>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="selectedResponse.error_message" class="mt-3">
                    <h6><i class="fas fa-exclamation-triangle me-2"></i>Error Message</h6>
                    <div class="alert alert-danger">{{ selectedResponse.error_message }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6><i class="fas fa-arrow-up me-2"></i>Request JSON</h6>
                  <pre class="bg-light p-2 rounded" style="max-height: 200px; overflow-y: auto;">{{ selectedResponse.request_json | json }}</pre>
                  
                  <h6 class="mt-3"><i class="fas fa-arrow-down me-2"></i>Response JSON</h6>
                  <pre class="bg-light p-2 rounded" style="max-height: 200px; overflow-y: auto;">{{ selectedResponse.response_json | json }}</pre>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeDetails()">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .font-monospace {
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
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

    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .input-group-text {
      background-color: #f8f9fa;
      border-color: #ced4da;
    }
    
    .search-input-group {
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }

    .url-params-section .card {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
    }

    .url-params-section .row {
      margin-bottom: 0.5rem;
      padding: 0.25rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .url-params-section .row:last-child {
      border-bottom: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class BlocBlocMonitoringComponent implements OnInit {
  responses: BlocBlocResponse[] = [];
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  loading = false;
  error: string | null = null;
  selectedResponse: BlocBlocResponse | null = null;
  
  // Tab management
  activeTab: 'general' | 'performance' = 'general';
  
  // General filters
  filters: MonitoringFilters = {};
  httpStatusSearch: number | null = null;
  
  // Performance analysis filters and data
  performanceFilters: PerformanceFilters = {};
  
  performanceStats: PerformanceStats | null = null;
  
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  // Exposer Math para usar en el template
  Math = Math;

  constructor(private monitoringService: MonitoringService) {}

  ngOnInit() {
    this.loadData();
  }

  onEnvironmentChange() {
    this.currentPage = 1;
    this.loadData();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadData();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadData();
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const totalPages = this.totalPages;
    const current = this.currentPage;
    
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

  refreshData() {
    this.loadData();
  }

  clearFilters() {
    if (this.activeTab === 'general') {
      this.filters = {};
      this.httpStatusSearch = null;
    } else {
      this.clearPerformanceFilters();
      return; // clearPerformanceFilters already calls loadData
    }
    this.currentPage = 1;
    this.loadData();
  }

  applyHttpStatusFilter() {
    if (this.httpStatusSearch) {
      this.filters.http_status = this.httpStatusSearch;
    } else {
      delete this.filters.http_status;
    }
    this.currentPage = 1;
    this.loadData();
  }

  clearHttpStatusSearch() {
    this.httpStatusSearch = null;
    delete this.filters.http_status;
    this.currentPage = 1;
    this.loadData();
  }

  viewDetails(response: BlocBlocResponse) {
    this.selectedResponse = response;
  }

  closeDetails() {
    this.selectedResponse = null;
  }

  trackById(index: number, response: BlocBlocResponse): number {
    return response.id;
  }

  // URL parsing methods for modal
  getBaseUrl(fullUrl: string): string {
    try {
      const url = new URL(fullUrl);
      return `${url.protocol}//${url.host}${url.pathname}`;
    } catch {
      // If it's not a full URL, just return the path part
      const parts = fullUrl.split('?');
      return parts[0];
    }
  }

  getUrlParameters(fullUrl: string): { key: string; value: string }[] {
    try {
      const url = new URL(fullUrl);
      const params: { key: string; value: string }[] = [];
      
      url.searchParams.forEach((value, key) => {
        params.push({ key, value });
      });
      
      return params;
    } catch {
      // If it's not a full URL, try to parse query string manually
      const parts = fullUrl.split('?');
      if (parts.length < 2) return [];
      
      const queryString = parts[1];
      const params: { key: string; value: string }[] = [];
      
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key) {
          params.push({ 
            key: decodeURIComponent(key), 
            value: decodeURIComponent(value || '') 
          });
        }
      });
      
      return params;
    }
  }

  // Tab management
  switchTab(tab: 'general' | 'performance') {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      this.currentPage = 1;
      this.resetDataAndFilters();
      this.loadData();
    }
  }

  private resetDataAndFilters() {
    this.responses = [];
    this.totalItems = 0;
    this.totalPages = 0;
    this.error = null;
    this.performanceStats = null;
    
    if (this.activeTab === 'general') {
      // Reset performance filters when switching to general
      this.performanceFilters = {};
      this.filters = this.httpStatusSearch ? { http_status: this.httpStatusSearch } : {};
    } else {
      // Reset general filters when switching to performance
      this.httpStatusSearch = null;
      this.filters = {};
    }
  }

  // Performance analysis methods
  applyPerformanceFilters() {
    this.currentPage = 1;
    this.loadPerformanceData();
  }

  clearPerformanceFilters() {
    this.performanceFilters = {};
    this.currentPage = 1;
    this.loadPerformanceData();
  }

  private buildPerformanceFilters(): PerformanceFilters {
    const filters: PerformanceFilters = {
      page: this.currentPage,
      limit: this.pageSize
    };
    
    if (this.performanceFilters.startDate) {
      filters.startDate = this.performanceFilters.startDate;
    }
    
    if (this.performanceFilters.endDate) {
      filters.endDate = this.performanceFilters.endDate;
    }
    
    if (this.performanceFilters.minResponseTime) {
      filters.minResponseTime = this.performanceFilters.minResponseTime;
    }
    
    return filters;
  }


  getPerformanceImpact(responseTime: number): string {
    if (responseTime >= 5000) return 'CRÍTICO';
    if (responseTime >= 3000) return 'ALTO';
    if (responseTime >= 1000) return 'MEDIO';
    return 'NORMAL';
  }

  // Main loadData method - routes to appropriate endpoint based on active tab
  loadData() {
    if (this.activeTab === 'performance') {
      this.loadPerformanceData();
    } else {
      this.loadGeneralData();
    }
  }

  // Load general monitoring data (original endpoint)
  private loadGeneralData() {
    this.loading = true;
    this.error = null;
    this.performanceStats = null;

    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    const filtersWithPagination = {
      ...this.filters,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.monitoringService.getBlocBlocResponses(filtersWithPagination, baseUrl).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.error) {
          this.error = 'Error en la respuesta del servidor';
          this.responses = [];
          this.totalItems = 0;
          this.totalPages = 0;
        } else {
          this.responses = response.results || [];
          this.totalItems = response.total;
          this.currentPage = response.page;
          this.pageSize = response.limit;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar los datos de monitoreo. Por favor intente nuevamente.';
        console.error('Error loading general monitoring data:', err);
      }
    });
  }

  // Load performance analysis data (new optimized endpoint)
  private loadPerformanceData() {
    this.loading = true;
    this.error = null;

    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    const performanceFilters = this.buildPerformanceFilters();

    this.monitoringService.getBlocBlocPerformanceAnalysis(performanceFilters, baseUrl).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.error) {
          this.error = response.message || 'Error en la respuesta del servidor';
          this.responses = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.performanceStats = null;
        } else {
          this.responses = response.results || [];
          this.totalItems = response.total;
          this.currentPage = response.page;
          this.pageSize = response.limit;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          
          // Set performance stats directly from backend response
          this.performanceStats = response.performance_stats;
          
          console.log('Performance data loaded:', {
            total: this.totalItems,
            stats: this.performanceStats,
            filtersApplied: response.filters_applied
          });
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar los datos de análisis de rendimiento. Por favor intente nuevamente.';
        this.performanceStats = null;
        console.error('Error loading performance analysis data:', err);
      }
    });
  }
}