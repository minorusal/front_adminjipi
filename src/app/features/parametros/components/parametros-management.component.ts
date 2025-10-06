import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParametrosService } from '../../../core/services/parametros.service';
import {
  Parametro,
  ParametroStats,
  ParametroFilters,
  ParametroFormData,
  ParametroFormErrors,
  CreateParametroRequest,
  UpdateParametroRequest
} from '../../../shared/types/parametros.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-parametros-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-cogs me-2"></i>
          Gestión de Parámetros del Sistema
        </h2>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select form-select-sm" [(ngModel)]="selectedEnvironment" (change)="onEnvironmentChange()">
            <option value="qa">QA</option>
            <option value="prod">Prod</option>
          </select>
          <button class="btn btn-success btn-sm" (click)="openCreateModal()">
            <i class="fas fa-plus me-1"></i>
            Nuevo Parámetro
          </button>
          <button class="btn btn-outline-primary btn-sm" (click)="refreshData()">
            <i class="fas fa-sync-alt me-1"></i>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="row mb-4" *ngIf="stats && !statsLoading">
        <div class="col-md-3">
          <div class="card stat-card text-center">
            <div class="card-body">
              <i class="fas fa-list fa-2x text-primary mb-2"></i>
              <h4 class="card-title">{{ stats.total_parametros }}</h4>
              <p class="card-text text-muted">Total Parámetros</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card text-center">
            <div class="card-body">
              <i class="fas fa-plus-circle fa-2x text-success mb-2"></i>
              <h4 class="card-title">{{ stats.ultimos_creados }}</h4>
              <p class="card-text text-muted">Creados Recientemente</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card text-center">
            <div class="card-body">
              <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
              <h4 class="card-title">{{ stats.parametros_sin_descripcion }}</h4>
              <p class="card-text text-muted">Sin Descripción</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stat-card text-center">
            <div class="card-body">
              <i class="fas fa-tags fa-2x text-info mb-2"></i>
              <h4 class="card-title">{{ stats.por_tipo_dato?.length || 0 }}</h4>
              <p class="card-text text-muted">Tipos Diferentes</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Types Distribution -->
      <div class="card mb-4" *ngIf="stats && stats.por_tipo_dato && stats.por_tipo_dato.length > 0">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="fas fa-chart-pie me-2"></i>
            Distribución por Tipo de Dato
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <div *ngFor="let tipo of stats.por_tipo_dato" class="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <span class="badge me-2" [ngClass]="getTypeBadgeClass(tipo.tipo)">{{ tipo.tipo }}</span>
                  <span>{{ tipo.cantidad }} parámetros</span>
                </div>
                <div class="progress" style="width: 150px; height: 8px;">
                  <div class="progress-bar" 
                       [ngClass]="getTypeProgressClass(tipo.tipo)"
                       [style.width.%]="(tipo.cantidad / stats.total_parametros) * 100">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="fas fa-filter me-2"></i>
            Filtros de Búsqueda
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3 mb-3">
              <label for="filterNombre" class="form-label">Nombre:</label>
              <input
                type="text"
                id="filterNombre"
                class="form-control"
                placeholder="Buscar por nombre..."
                [(ngModel)]="filters.nombre">
            </div>
            <div class="col-md-3 mb-3">
              <label for="filterValor" class="form-label">Valor:</label>
              <input
                type="text"
                id="filterValor"
                class="form-control"
                placeholder="Buscar por valor..."
                [(ngModel)]="filters.valor">
            </div>
            <div class="col-md-3 mb-3">
              <label for="filterDescripcion" class="form-label">Descripción:</label>
              <input
                type="text"
                id="filterDescripcion"
                class="form-control"
                placeholder="Buscar en descripción..."
                [(ngModel)]="filters.descripcion">
            </div>
            <div class="col-md-3 mb-3">
              <label for="filterTipo" class="form-label">Tipo de Dato:</label>
              <select id="filterTipo" class="form-select" [(ngModel)]="filters.tipoDato">
                <option value="">Todos los tipos</option>
                <option value="string">String</option>
                <option value="int">Entero</option>
                <option value="float">Decimal</option>
                <option value="boolean">Booleano</option>
                <option value="json">JSON</option>
                <option value="date">Fecha</option>
              </select>
            </div>
          </div>
          <div class="row">
            <div class="col-md-3 mb-3">
              <label for="filterDateFrom" class="form-label">Desde:</label>
              <input
                type="date"
                id="filterDateFrom"
                class="form-control"
                [(ngModel)]="filters.dateFrom">
            </div>
            <div class="col-md-3 mb-3">
              <label for="filterDateTo" class="form-label">Hasta:</label>
              <input
                type="date"
                id="filterDateTo"
                class="form-control"
                [(ngModel)]="filters.dateTo">
            </div>
            <div class="col-md-6 mb-3 d-flex align-items-end">
              <div class="d-flex gap-2">
                <button class="btn btn-primary" (click)="applyFilters()">
                  <i class="fas fa-search me-1"></i>
                  Buscar
                </button>
                <button class="btn btn-secondary" (click)="clearFilters()">
                  <i class="fas fa-times me-1"></i>
                  Limpiar
                </button>
              </div>
              <div class="ms-auto d-flex gap-2 align-items-center">
                <label for="pageSize" class="form-label mb-0">Por página:</label>
                <select id="pageSize" class="form-select form-select-sm" [(ngModel)]="pageSize" (change)="onPageSizeChange()">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Parameters Table -->
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            <i class="fas fa-table me-2"></i>
            Lista de Parámetros
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
          <div *ngIf="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>

          <div *ngIf="error" class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ error }}
          </div>

          <div *ngIf="!loading && !error && parametros.length === 0" class="text-center py-4">
            <i class="fas fa-info-circle fa-2x text-muted mb-3"></i>
            <p class="text-muted">No se encontraron parámetros con los filtros aplicados.</p>
          </div>

          <div *ngIf="!loading && !error && parametros.length > 0" class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Valor</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Fecha Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let parametro of parametros; trackBy: trackById">
                  <td>{{ parametro.id }}</td>
                  <td>
                    <strong>{{ parametro.nombre }}</strong>
                  </td>
                  <td>
                    <div class="parameter-value" [title]="parametro.valor">
                      {{ getDisplayValue(parametro.valor, parametro.tipo_dato) }}
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getTypeBadgeClass(parametro.tipo_dato)">
                      {{ parametro.tipo_dato }}
                    </span>
                  </td>
                  <td>
                    <div class="parameter-description" [title]="parametro.descripcion">
                      {{ parametro.descripcion || 'Sin descripción' }}
                    </div>
                  </td>
                  <td>
                    <div>{{ parametro.fecha_creacion | date:'dd/MM/yyyy' }}</div>
                    <small class="text-muted">{{ parametro.fecha_creacion | date:'HH:mm:ss' }}</small>
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <button 
                        type="button"
                        class="btn btn-outline-info btn-sm"
                        (click)="viewDetails(parametro); $event.stopPropagation()"
                        title="Ver detalles">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button 
                        type="button"
                        class="btn btn-outline-warning btn-sm"
                        (click)="openEditModal(parametro); $event.stopPropagation()"
                        title="Editar">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button 
                        type="button"
                        class="btn btn-outline-danger btn-sm"
                        (click)="confirmDelete(parametro); $event.stopPropagation()"
                        title="Eliminar">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div *ngIf="totalPages > 1" class="d-flex justify-content-center mt-4">
            <nav>
              <ul class="pagination">
                <li class="page-item" [class.disabled]="currentPage === 1">
                  <button type="button" class="page-link" (click)="goToPage(1)" [disabled]="currentPage === 1">
                    <i class="fas fa-angle-double-left"></i>
                  </button>
                </li>
                <li class="page-item" [class.disabled]="currentPage === 1">
                  <button type="button" class="page-link" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">
                    <i class="fas fa-angle-left"></i>
                  </button>
                </li>
                
                <li *ngFor="let page of getVisiblePages()" 
                    class="page-item" 
                    [class.active]="page === currentPage">
                  <button type="button" class="page-link" (click)="goToPage(page)">{{ page }}</button>
                </li>
                
                <li class="page-item" [class.disabled]="currentPage === totalPages">
                  <button type="button" class="page-link" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">
                    <i class="fas fa-angle-right"></i>
                  </button>
                </li>
                <li class="page-item" [class.disabled]="currentPage === totalPages">
                  <button type="button" class="page-link" (click)="goToPage(totalPages)" [disabled]="currentPage === totalPages">
                    <i class="fas fa-angle-double-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          <!-- Debug info for pagination -->
          <div class="mt-2 text-center text-muted small">
            Página {{ currentPage }} de {{ totalPages }} | Total items: {{ totalItems }}
          </div>
        </div>
      </div>

      <!-- Floating Pagination (appears when scrolled down) -->
      <div *ngIf="totalPages > 1" 
           class="floating-pagination" 
           [class.show]="showFloatingPagination">
        <div class="floating-pagination-content">
          <div class="d-flex align-items-center justify-content-center gap-2">
            <small class="text-muted me-2">{{ currentPage }}/{{ totalPages }}</small>
            <div class="btn-group btn-group-sm">
              <button type="button" 
                      class="btn btn-primary"
                      (click)="goToPage(1)" 
                      [disabled]="currentPage === 1"
                      title="Primera página">
                <i class="fas fa-angle-double-left"></i>
              </button>
              <button type="button" 
                      class="btn btn-primary"
                      (click)="goToPage(currentPage - 1)" 
                      [disabled]="currentPage === 1"
                      title="Página anterior">
                <i class="fas fa-angle-left"></i>
              </button>
              <button type="button" 
                      class="btn btn-primary"
                      (click)="goToPage(currentPage + 1)" 
                      [disabled]="currentPage === totalPages"
                      title="Página siguiente">
                <i class="fas fa-angle-right"></i>
              </button>
              <button type="button" 
                      class="btn btn-primary"
                      (click)="goToPage(totalPages)" 
                      [disabled]="currentPage === totalPages"
                      title="Última página">
                <i class="fas fa-angle-double-right"></i>
              </button>
            </div>
            <button type="button" 
                    class="btn btn-outline-secondary btn-sm ms-2"
                    (click)="scrollToTop()"
                    title="Ir arriba">
              <i class="fas fa-arrow-up"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div *ngIf="showModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-cog me-2"></i>
                {{ isEditMode ? 'Editar Parámetro' : 'Crear Nuevo Parámetro' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="saveParametro()" #paramForm="ngForm">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="nombre" class="form-label">
                      Nombre <span class="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      class="form-control"
                      [(ngModel)]="formData.nombre"
                      [class.is-invalid]="formErrors.nombre"
                      maxlength="255"
                      required>
                    <div *ngIf="formErrors.nombre" class="invalid-feedback">
                      {{ formErrors.nombre }}
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="tipo_dato" class="form-label">
                      Tipo de Dato <span class="text-danger">*</span>
                    </label>
                    <select
                      id="tipo_dato"
                      name="tipo_dato"
                      class="form-select"
                      [(ngModel)]="formData.tipo_dato"
                      [class.is-invalid]="formErrors.tipo_dato"
                      required>
                      <option value="">Seleccionar tipo</option>
                      <option value="string">String</option>
                      <option value="int">Entero</option>
                      <option value="float">Decimal</option>
                      <option value="boolean">Booleano</option>
                      <option value="json">JSON</option>
                      <option value="date">Fecha</option>
                    </select>
                    <div *ngIf="formErrors.tipo_dato" class="invalid-feedback">
                      {{ formErrors.tipo_dato }}
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="valor" class="form-label">
                    Valor <span class="text-danger">*</span>
                  </label>
                  <textarea
                    id="valor"
                    name="valor"
                    class="form-control"
                    [(ngModel)]="formData.valor"
                    [class.is-invalid]="formErrors.valor"
                    rows="3"
                    maxlength="1000"
                    required></textarea>
                  <div *ngIf="formErrors.valor" class="invalid-feedback">
                    {{ formErrors.valor }}
                  </div>
                  <small class="text-muted">
                    <span *ngIf="formData.tipo_dato === 'boolean'">Valores válidos: true, false, 1, 0</span>
                    <span *ngIf="formData.tipo_dato === 'int'">Solo números enteros</span>
                    <span *ngIf="formData.tipo_dato === 'float'">Números decimales (ej: 3.14)</span>
                    <span *ngIf="formData.tipo_dato === 'json'">JSON válido</span>
                    <span *ngIf="formData.tipo_dato === 'date'">Fecha válida (YYYY-MM-DD o formato ISO)</span>
                  </small>
                </div>
                <div class="mb-3">
                  <label for="descripcion" class="form-label">Descripción</label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    class="form-control"
                    [(ngModel)]="formData.descripcion"
                    rows="3"
                    placeholder="Descripción opcional del parámetro"></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="button" class="btn btn-primary" (click)="saveParametro()" [disabled]="saving">
                <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
                {{ isEditMode ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Modal -->
      <div *ngIf="selectedParametro" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-info-circle me-2"></i>
                Detalles del Parámetro
              </h5>
              <button type="button" class="btn-close" (click)="closeDetailsModal()"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="card">
                    <div class="card-header">
                      <h6 class="mb-0">Información Básica</h6>
                    </div>
                    <div class="card-body">
                      <table class="table table-sm table-borderless">
                        <tr>
                          <td><strong>ID:</strong></td>
                          <td>{{ selectedParametro.id }}</td>
                        </tr>
                        <tr>
                          <td><strong>Nombre:</strong></td>
                          <td>{{ selectedParametro.nombre }}</td>
                        </tr>
                        <tr>
                          <td><strong>Tipo:</strong></td>
                          <td>
                            <span class="badge" [ngClass]="getTypeBadgeClass(selectedParametro.tipo_dato)">
                              {{ selectedParametro.tipo_dato }}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Fecha Creación:</strong></td>
                          <td>{{ selectedParametro.fecha_creacion | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                        </tr>
                        <tr *ngIf="selectedParametro.fecha_modificacion">
                          <td><strong>Última Actualización:</strong></td>
                          <td>{{ selectedParametro.fecha_modificacion | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                        </tr>
                      </table>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card">
                    <div class="card-header">
                      <h6 class="mb-0">Valor y Descripción</h6>
                    </div>
                    <div class="card-body">
                      <div class="mb-3">
                        <strong>Valor:</strong>
                        <div class="bg-light p-2 rounded mt-1" style="font-family: monospace;">
                          {{ parametrosService.formatValueForDisplay(selectedParametro.valor, selectedParametro.tipo_dato) }}
                        </div>
                      </div>
                      <div>
                        <strong>Descripción:</strong>
                        <div class="mt-1">
                          {{ selectedParametro.descripcion || 'Sin descripción' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeDetailsModal()">Cerrar</button>
              <button type="button" class="btn btn-warning" (click)="editFromDetails()">
                <i class="fas fa-edit me-1"></i>
                Editar
              </button>
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
    
    .modal.show {
      display: block;
    }

    .parameter-value {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .parameter-description {
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .progress {
      background-color: #f1f3f4;
    }

    .floating-pagination {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1040;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
      pointer-events: none;
    }

    .floating-pagination.show {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .floating-pagination-content {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
    }

    .floating-pagination-content .btn-group .btn {
      border-radius: 4px !important;
      margin: 0 1px;
    }

    .floating-pagination-content .btn-group .btn:first-child {
      margin-left: 0;
    }

    .floating-pagination-content .btn-group .btn:last-child {
      margin-right: 0;
    }

    @media (max-width: 768px) {
      .floating-pagination {
        bottom: 10px;
        right: 10px;
      }
      
      .floating-pagination-content {
        padding: 8px 12px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametrosManagementComponent implements OnInit, OnDestroy {
  // Environment
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  // Data
  parametros: Parametro[] = [];
  stats: ParametroStats | null = null;
  selectedParametro: Parametro | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;

  // Filters
  filters: ParametroFilters = {};

  // Loading states
  loading = false;
  statsLoading = false;
  saving = false;

  // Error state
  error: string | null = null;

  // Modal states
  showModal = false;
  isEditMode = false;
  editingId: number | null = null;

  // Form data
  formData: ParametroFormData = {
    nombre: '',
    valor: '',
    descripcion: '',
    tipo_dato: 'string'
  };

  formErrors: ParametroFormErrors = {};

  // Floating pagination
  showFloatingPagination = false;

  constructor(
    public parametrosService: ParametrosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
    // Cargar estadísticas después, ya que es menos crítico
    setTimeout(() => {
      this.loadStats();
    }, 1000);
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const windowHeight = window.innerHeight;
    
    // Show floating pagination when scrolled past the table header (approximately 800px)
    const shouldShow = scrollPosition > 800 && this.totalPages > 1;
    
    if (shouldShow !== this.showFloatingPagination) {
      this.showFloatingPagination = shouldShow;
      this.cdr.detectChanges();
    }
  }

  // ===== ENVIRONMENT MANAGEMENT =====
  onEnvironmentChange() {
    this.currentPage = 1;
    this.loadStats();
    this.loadData();
  }

  refreshData() {
    this.loadStats();
    this.loadData();
  }

  // ===== DATA LOADING =====
  loadStats() {
    this.statsLoading = true;
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;

    this.parametrosService.getParametroStats(baseUrl).subscribe({
      next: (response) => {
        this.statsLoading = false;
        console.log('Stats response:', response); // Para debug
        if (response.success && response.data) {
          // Inicializar por_tipo_dato como array vacío si no existe
          this.stats = {
            ...response.data,
            por_tipo_dato: response.data.por_tipo_dato || []
          };
        } else {
          console.warn('Stats endpoint returned success=false');
          this.stats = null;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.statsLoading = false;
        console.warn('Stats endpoint not available or error:', err);
        // No mostrar error, simplemente continuar sin estadísticas
        this.stats = null;
        this.cdr.detectChanges();
      }
    });
  }

  loadData() {
    this.loading = true;
    this.error = null;

    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    const filtersWithPagination = {
      ...this.filters,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.parametrosService.getParametros(filtersWithPagination, baseUrl).subscribe({
      next: (response: any) => {
        this.loading = false;
        console.log('Parametros response:', response); // Para debug
        console.log('Request filters:', filtersWithPagination);
        
        if (response && response.success && response.data) {
          this.parametros = response.data;
          
          // Manejar la paginación de forma segura
          if (response.pagination) {
            console.log('Pagination data:', response.pagination);
            this.totalItems = response.pagination.total || 0;
            this.totalPages = response.pagination.totalPages || 0;
            this.currentPage = response.pagination.page || 1;
            console.log('Updated pagination:', {
              totalItems: this.totalItems,
              totalPages: this.totalPages,
              currentPage: this.currentPage
            });
          } else {
            // Si no hay paginación, calcular básico
            console.log('No pagination in response, using basic calculation');
            this.totalItems = response.data.length;
            this.totalPages = 1;
            this.currentPage = 1;
          }
          
          // Forzar detección de cambios
          this.cdr.detectChanges();
        } else {
          this.error = 'Error en la respuesta del servidor';
          this.parametros = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar los parámetros. Por favor intente nuevamente.';
        console.error('Error loading parametros:', err);
        this.parametros = [];
        this.totalItems = 0;
        this.totalPages = 0;
      }
    });
  }

  // ===== FILTERING =====
  applyFilters() {
    this.currentPage = 1;
    this.loadData();
  }

  clearFilters() {
    this.filters = {};
    this.currentPage = 1;
    this.loadData();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadData();
  }

  // ===== PAGINATION =====
  goToPage(page: number) {
    console.log('goToPage called with:', page, 'current:', this.currentPage, 'totalPages:', this.totalPages);
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      console.log('Loading data for page:', page);
      this.loadData();
    } else {
      console.log('Page out of bounds:', page);
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

  // ===== CRUD OPERATIONS =====
  openCreateModal() {
    this.isEditMode = false;
    this.editingId = null;
    this.formData = {
      nombre: '',
      valor: '',
      descripcion: '',
      tipo_dato: 'string'
    };
    this.formErrors = {};
    this.showModal = true;
  }

  openEditModal(parametro: Parametro) {
    console.log('openEditModal called with:', parametro);
    this.isEditMode = true;
    this.editingId = parametro.id;
    this.formData = {
      nombre: parametro.nombre,
      valor: parametro.valor,
      descripcion: parametro.descripcion || '',
      tipo_dato: parametro.tipo_dato
    };
    this.formErrors = {};
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    console.log('closeModal called');
    this.showModal = false;
    this.isEditMode = false;
    this.editingId = null;
    this.formData = {
      nombre: '',
      valor: '',
      descripcion: '',
      tipo_dato: 'string'
    };
    this.formErrors = {};
    this.cdr.detectChanges();
  }

  saveParametro() {
    this.formErrors = {};
    
    // Validate form
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;

    const parametroData: CreateParametroRequest | UpdateParametroRequest = {
      nombre: this.formData.nombre,
      valor: this.formData.valor,
      descripcion: this.formData.descripcion || undefined,
      tipo_dato: this.formData.tipo_dato
    };

    const operation = this.isEditMode && this.editingId
      ? this.parametrosService.updateParametro(this.editingId, parametroData, baseUrl)
      : this.parametrosService.createParametro(parametroData as CreateParametroRequest, baseUrl);

    operation.subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          alert(this.isEditMode ? 'Parámetro actualizado exitosamente' : 'Parámetro creado exitosamente');
          this.closeModal();
          this.loadStats();
          this.loadData();
        } else {
          alert('Error: ' + (response.message || 'Error desconocido'));
        }
      },
      error: (err) => {
        this.saving = false;
        console.error('Error saving parametro:', err);
        alert('Error al guardar el parámetro. Por favor intente nuevamente.');
      }
    });
  }

  confirmDelete(parametro: Parametro) {
    console.log('confirmDelete called with:', parametro);
    if (confirm(`¿Está seguro de que desea eliminar el parámetro "${parametro.nombre}"? Esta acción no se puede deshacer.`)) {
      const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
      
      this.parametrosService.deleteParametro(parametro.id, baseUrl).subscribe({
        next: (response: any) => {
          console.log('Delete response:', response);
          if (response && response.success) {
            alert('Parámetro eliminado exitosamente');
            this.loadStats();
            this.loadData();
          } else {
            alert('Error: ' + (response?.message || 'Error desconocido'));
          }
        },
        error: (err) => {
          console.error('Error deleting parametro:', err);
          alert('Error al eliminar el parámetro. Por favor intente nuevamente.');
        }
      });
    }
  }

  // ===== DETAILS MODAL =====
  viewDetails(parametro: Parametro) {
    console.log('viewDetails called with:', parametro);
    this.selectedParametro = parametro;
    this.cdr.detectChanges();
  }

  closeDetailsModal() {
    this.selectedParametro = null;
    this.cdr.detectChanges();
  }

  editFromDetails() {
    if (this.selectedParametro) {
      console.log('editFromDetails called with selectedParametro:', this.selectedParametro);
      const parametroToEdit = { ...this.selectedParametro }; // Crear una copia
      this.closeDetailsModal();
      this.openEditModal(parametroToEdit);
    } else {
      console.error('editFromDetails called but selectedParametro is null');
    }
  }

  // ===== FORM VALIDATION =====
  validateForm(): boolean {
    let isValid = true;

    // Validate nombre
    if (!this.formData.nombre.trim()) {
      this.formErrors.nombre = 'El nombre es obligatorio';
      isValid = false;
    } else if (this.formData.nombre.length > 255) {
      this.formErrors.nombre = 'El nombre no puede exceder 255 caracteres';
      isValid = false;
    }

    // Validate tipo_dato
    if (!this.formData.tipo_dato) {
      this.formErrors.tipo_dato = 'El tipo de dato es obligatorio';
      isValid = false;
    }

    // Validate valor
    if (!this.formData.valor.trim()) {
      this.formErrors.valor = 'El valor es obligatorio';
      isValid = false;
    } else if (this.formData.valor.length > 1000) {
      this.formErrors.valor = 'El valor no puede exceder 1000 caracteres';
      isValid = false;
    } else if (!this.parametrosService.validateValueByType(this.formData.valor, this.formData.tipo_dato)) {
      this.formErrors.valor = `El valor no es válido para el tipo ${this.formData.tipo_dato}`;
      isValid = false;
    }

    return isValid;
  }

  // ===== UTILITY METHODS =====
  getTypeBadgeClass(tipo: string): string {
    switch (tipo) {
      case 'string': return 'bg-primary';
      case 'int': return 'bg-success';
      case 'float': return 'bg-info';
      case 'boolean': return 'bg-warning text-dark';
      case 'json': return 'bg-secondary';
      case 'date': return 'bg-dark';
      default: return 'bg-light text-dark';
    }
  }

  getTypeProgressClass(tipo: string): string {
    switch (tipo) {
      case 'string': return 'bg-primary';
      case 'int': return 'bg-success';
      case 'float': return 'bg-info';
      case 'boolean': return 'bg-warning';
      case 'json': return 'bg-secondary';
      case 'date': return 'bg-dark';
      default: return 'bg-light';
    }
  }

  getDisplayValue(value: string, tipo: string): string {
    if (value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return this.parametrosService.formatValueForDisplay(value, tipo);
  }

  trackById(index: number, parametro: Parametro): number {
    return parametro.id;
  }

  // ===== SCROLL UTILITIES =====
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}