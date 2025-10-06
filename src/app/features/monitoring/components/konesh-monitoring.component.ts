import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitoringService } from '../../../core/services/monitoring.service';
import { 
  KoneshResponse, 
  MonitoringFilters 
} from '../../../shared/types/monitoring.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-konesh-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-receipt me-2"></i>
          Monitoreo SAT (Konesh)
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
            <div class="col-md-3">
              <label for="startDate" class="form-label">Fecha Inicio:</label>
              <input
                type="datetime-local"
                id="startDate"
                class="form-control"
                [(ngModel)]="filters.startDate">
            </div>
            <div class="col-md-3">
              <label for="endDate" class="form-label">Fecha Fin:</label>
              <input
                type="datetime-local"
                id="endDate"
                class="form-control"
                [(ngModel)]="filters.endDate">
            </div>
            <div class="col-md-2">
              <label for="statusFilter" class="form-label">HTTP Status:</label>
              <select id="statusFilter" class="form-select" [(ngModel)]="filters.http_status">
                <option value="">Todos</option>
                <option value="200">200 - OK</option>
                <option value="400">400 - Bad Request</option>
                <option value="401">401 - Unauthorized</option>
                <option value="500">500 - Server Error</option>
              </select>
            </div>
            <div class="col-md-2">
              <label for="statusKoneshFilter" class="form-label">Konesh Status:</label>
              <select id="statusKoneshFilter" class="form-select" [(ngModel)]="filters.konesh_status">
                <option value="">Todos</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button class="btn btn-primary me-2" (click)="applyFilters()">
                <i class="fas fa-search me-1"></i>
                Aplicar
              </button>
              <button class="btn btn-secondary" (click)="clearFilters()">
                <i class="fas fa-times me-1"></i>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <!-- Pagination Info -->
      <div *ngIf="!loading && !error && totalItems > 0" class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span class="text-muted">
            Mostrando {{ (currentPage - 1) * pageSize + 1 }} a {{ Math.min(currentPage * pageSize, totalItems) }} de {{ totalItems }} resultados
            (Página {{ currentPage }} de {{ totalPages }})
          </span>
        </div>
      </div>

      <!-- Responses Table -->
      <div *ngIf="!loading && !error" class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            <i class="fas fa-table me-2"></i>
            Responses SAT (Konesh)
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
                  <th>RFC</th>
                  <th>HTTP Status</th>
                  <th>Konesh Status</th>
                  <th>Tiempo (ms)</th>
                  <th>Transaction ID</th>
                  <th>Nodo</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let response of responses; trackBy: trackById">
                  <td>{{ response.id }}</td>
                  <td>
                    <span class="font-monospace">{{ response.rfc }}</span>
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
                    <span class="badge" 
                          [class.bg-success]="response.konesh_status === 'true'"
                          [class.bg-danger]="response.konesh_status === 'false'">
                      {{ response.konesh_status }}
                    </span>
                  </td>
                  <td>
                    <span [class.text-success]="response.response_time_ms < 2000"
                          [class.text-warning]="response.response_time_ms >= 2000 && response.response_time_ms < 5000"
                          [class.text-danger]="response.response_time_ms >= 5000">
                      {{ response.response_time_ms }}ms
                    </span>
                  </td>
                  <td>
                    <small class="font-monospace">{{ response.transaction_id }}</small>
                  </td>
                  <td>
                    <span class="badge bg-info">{{ response.node }}</span>
                  </td>
                  <td>
                    <div>{{ response.created_at | date:'dd/MM/yyyy' }}</div>
                    <small class="text-muted">{{ response.created_at | date:'HH:mm:ss' }}</small>
                  </td>
                  <td>
                    <button 
                      class="btn btn-outline-info btn-sm"
                      (click)="viewDetails(response)"
                      title="Ver detalles de la respuesta SAT">
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
      <div *ngIf="!loading && !error && totalPages > 1" class="d-flex justify-content-center mt-4">
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

      <!-- Details Modal -->
      <div *ngIf="selectedResponse" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-info-circle me-2"></i>
                Detalles de Response SAT
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
                      <td><strong>RFC:</strong></td>
                      <td class="font-monospace">{{ selectedResponse.rfc }}</td>
                    </tr>
                    <tr>
                      <td><strong>Empresa ID:</strong></td>
                      <td>{{ selectedResponse.emp_id }}</td>
                    </tr>
                    <tr>
                      <td><strong>Razón Social:</strong></td>
                      <td>{{ selectedResponse.razon_social_req }}</td>
                    </tr>
                    <tr>
                      <td><strong>Request Timestamp:</strong></td>
                      <td>{{ selectedResponse.request_ts | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    </tr>
                    <tr>
                      <td><strong>Transaction Date:</strong></td>
                      <td>{{ selectedResponse.transaction_date | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    </tr>
                    <tr>
                      <td><strong>HTTP Status:</strong></td>
                      <td>{{ selectedResponse.http_status }}</td>
                    </tr>
                    <tr>
                      <td><strong>Konesh Status:</strong></td>
                      <td>
                        <span class="badge" 
                              [class.bg-success]="selectedResponse.konesh_status === 'true'"
                              [class.bg-danger]="selectedResponse.konesh_status === 'false'">
                          {{ selectedResponse.konesh_status }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Tiempo de Respuesta:</strong></td>
                      <td>{{ selectedResponse.response_time_ms }}ms</td>
                    </tr>
                    <tr>
                      <td><strong>Transaction ID:</strong></td>
                      <td class="font-monospace">{{ selectedResponse.transaction_id }}</td>
                    </tr>
                    <tr>
                      <td><strong>Nodo:</strong></td>
                      <td>{{ selectedResponse.node }}</td>
                    </tr>
                    <tr>
                      <td><strong>Creado:</strong></td>
                      <td>{{ selectedResponse.created_at | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>Información SAT</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>Nombre SAT:</strong></td>
                      <td>{{ selectedResponse.name_sat }}</td>
                    </tr>
                    <tr>
                      <td><strong>Código Postal:</strong></td>
                      <td>{{ selectedResponse.postal_code }}</td>
                    </tr>
                  </table>
                  
                  <div *ngIf="selectedResponse.error_message" class="mt-3">
                    <h6>Error Message</h6>
                    <div class="alert alert-danger">{{ selectedResponse.error_message }}</div>
                  </div>
                  
                  <h6 class="mt-3">Raw Response</h6>
                  <pre class="bg-light p-2 rounded" style="max-height: 300px; overflow-y: auto;">{{ selectedResponse.raw_response | json }}</pre>
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
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class KoneshMonitoringComponent implements OnInit {
  responses: KoneshResponse[] = [];
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  loading = false;
  error: string | null = null;
  selectedResponse: KoneshResponse | null = null;
  
  filters: MonitoringFilters = {};
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  // Exposer Math para usar en el template
  Math = Math;

  constructor(private monitoringService: MonitoringService) {}

  ngOnInit() {
    this.loadData();
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

    this.monitoringService.getKoneshResponses(filtersWithPagination, baseUrl).subscribe({
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
        this.error = 'Error al cargar los datos de monitoreo SAT. Por favor intente nuevamente.';
        console.error('Error loading monitoring data:', err);
      }
    });
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

  applyFilters() {
    if (!this.filters.http_status) {
      delete this.filters.http_status;
    }
    if (!this.filters.konesh_status) {
      delete this.filters.konesh_status;
    }
    
    this.currentPage = 1;
    this.loadData();
  }

  clearFilters() {
    this.filters = {};
    this.currentPage = 1;
    this.loadData();
  }

  viewDetails(response: KoneshResponse) {
    this.selectedResponse = response;
  }

  closeDetails() {
    this.selectedResponse = null;
  }

  trackById(index: number, response: KoneshResponse): number {
    return response.id;
  }
}