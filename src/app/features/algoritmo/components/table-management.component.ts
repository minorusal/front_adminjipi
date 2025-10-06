import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlgorithmService } from '../services/algorithm.service';
import { 
  CatalogRecord, 
  TableSchema, 
  PaginationInfo,
  AVAILABLE_TABLES,
  FilterOptions 
} from '../types/algorithm.types';

@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex align-items-center">
          <button class="btn btn-outline-secondary me-3" (click)="goBack()">
            <i class="fas fa-arrow-left me-1"></i>
            Volver
          </button>
          <h2 class="mb-0">
            <i [class]="tableConfig?.icon + ' me-2'"></i>
            {{ tableConfig?.displayName || tableName }}
          </h2>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <button class="btn btn-success btn-sm" (click)="createRecord()">
            <i class="fas fa-plus me-1"></i>
            Crear Registro
          </button>
          <button class="btn btn-outline-primary btn-sm" (click)="refreshData()">
            <i class="fas fa-sync-alt me-1"></i>
            Actualizar
          </button>
          <span class="badge bg-primary fs-6" *ngIf="pagination">
            Total: {{ pagination.total }}
          </span>
        </div>
      </div>

      <!-- Filters -->
      <div class="card mb-4" *ngIf="schema">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="fas fa-filter me-2"></i>
            Filtros
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <!-- Search by text fields -->
            <div class="col-md-4 mb-3" *ngFor="let column of getTextColumns()">
              <label [for]="'filter_' + column" class="form-label">{{ column }}:</label>
              <input
                [id]="'filter_' + column"
                type="text"
                class="form-control"
                [placeholder]="'Buscar por ' + column"
                [(ngModel)]="filters[column]"
                (keyup.enter)="applyFilters()">
            </div>
            
            <!-- Numeric range filters -->
            <div class="col-md-6 mb-3" *ngFor="let column of getNumericColumns()">
              <label class="form-label">{{ column }}:</label>
              <div class="row">
                <div class="col-6">
                  <input
                    type="number"
                    class="form-control"
                    [placeholder]="'Min ' + column"
                    [(ngModel)]="filters[column + '_min']"
                    (keyup.enter)="applyFilters()">
                </div>
                <div class="col-6">
                  <input
                    type="number"
                    class="form-control"
                    [placeholder]="'Max ' + column"
                    [(ngModel)]="filters[column + '_max']"
                    (keyup.enter)="applyFilters()">
                </div>
              </div>
            </div>
          </div>
          
          <div class="d-flex gap-2">
            <button class="btn btn-primary" (click)="applyFilters()">
              <i class="fas fa-search me-1"></i>
              Aplicar Filtros
            </button>
            <button class="btn btn-secondary" (click)="clearFilters()">
              <i class="fas fa-times me-1"></i>
              Limpiar
            </button>
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
      <div *ngIf="!loading && !error && pagination" class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span class="text-muted">
            Mostrando {{ getStartRecord() }} a {{ getEndRecord() }} de {{ pagination.total }} registros
            (Página {{ pagination.page }} de {{ pagination.totalPages }})
          </span>
        </div>
        <div>
          <select class="form-select form-select-sm" [(ngModel)]="currentLimit" (change)="onLimitChange()">
            <option value="10">10 por página</option>
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
            <option value="100">100 por página</option>
          </select>
        </div>
      </div>

      <!-- Records Table -->
      <div *ngIf="!loading && !error" class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            <i class="fas fa-table me-2"></i>
            Registros
          </h5>
          <div class="d-flex align-items-center gap-3">
            <!-- Quick pagination in header -->
            <div *ngIf="pagination && pagination.totalPages > 1" class="d-flex align-items-center gap-2">
              <small class="text-muted">Página:</small>
              <div class="btn-group btn-group-sm" role="group">
                <button type="button" 
                        class="btn btn-outline-secondary"
                        (click)="goToPage(pagination.page - 1)" 
                        [disabled]="pagination.page === 1"
                        title="Página anterior">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button type="button" class="btn btn-outline-secondary disabled">
                  {{ pagination.page }} / {{ pagination.totalPages }}
                </button>
                <button type="button" 
                        class="btn btn-outline-secondary"
                        (click)="goToPage(pagination.page + 1)" 
                        [disabled]="pagination.page === pagination.totalPages"
                        title="Página siguiente">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
            <span class="badge bg-primary fs-6" *ngIf="pagination">
              Total: {{ pagination.total }}
            </span>
          </div>
        </div>
        <div class="card-body">
          <div *ngIf="records.length === 0" class="text-center py-4">
            <i class="fas fa-info-circle fa-2x text-muted mb-3"></i>
            <p class="text-muted">No se encontraron registros con los filtros aplicados.</p>
          </div>

          <div *ngIf="records.length > 0" class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-dark">
                <tr>
                  <th *ngFor="let column of getVisibleColumns()">{{ column }}</th>
                  <th width="120">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let record of records; trackBy: trackByRecordId">
                  <td *ngFor="let column of getVisibleColumns()">
                    <div [ngSwitch]="getColumnType(column)">
                      <span *ngSwitchCase="'datetime'">
                        {{ formatDateTime(record[column]) }}
                      </span>
                      <span *ngSwitchCase="'decimal'" class="font-monospace">
                        {{ formatNumber(record[column]) }}
                      </span>
                      <span *ngSwitchCase="'int'" class="font-monospace">
                        {{ record[column] }}
                      </span>
                      <span *ngSwitchDefault>
                        {{ record[column] }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button 
                        class="btn btn-outline-info"
                        (click)="viewRecord(record)"
                        title="Ver detalles">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button 
                        class="btn btn-outline-warning"
                        (click)="editRecord(record)"
                        title="Editar">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button 
                        class="btn btn-outline-danger"
                        (click)="deleteRecord(record)"
                        title="Eliminar">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div *ngIf="!loading && !error && pagination && pagination.totalPages > 1" class="d-flex justify-content-center mt-4">
        <nav>
          <ul class="pagination">
            <li class="page-item" [class.disabled]="pagination.page === 1">
              <button class="page-link" (click)="goToPage(1)" [disabled]="pagination.page === 1">
                <i class="fas fa-angle-double-left"></i>
              </button>
            </li>
            <li class="page-item" [class.disabled]="!pagination.hasPrevPage">
              <button class="page-link" (click)="goToPage(pagination.page - 1)" [disabled]="!pagination.hasPrevPage">
                <i class="fas fa-angle-left"></i>
              </button>
            </li>
            
            <li *ngFor="let page of getVisiblePages()" 
                class="page-item" 
                [class.active]="page === pagination.page">
              <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
            </li>
            
            <li class="page-item" [class.disabled]="!pagination.hasNextPage">
              <button class="page-link" (click)="goToPage(pagination.page + 1)" [disabled]="!pagination.hasNextPage">
                <i class="fas fa-angle-right"></i>
              </button>
            </li>
            <li class="page-item" [class.disabled]="pagination.page === pagination.totalPages">
              <button class="page-link" (click)="goToPage(pagination.totalPages)" [disabled]="pagination.page === pagination.totalPages">
                <i class="fas fa-angle-double-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <!-- View Record Modal -->
      <div *ngIf="selectedRecord" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-info-circle me-2"></i>
                Detalles del Registro
              </h5>
              <button type="button" class="btn-close" (click)="closeViewRecord()"></button>
            </div>
            <div class="modal-body">
              <table class="table table-striped">
                <tbody>
                  <tr *ngFor="let column of getAllColumns()">
                    <td><strong>{{ column }}:</strong></td>
                    <td>
                      <div [ngSwitch]="getColumnType(column)">
                        <span *ngSwitchCase="'datetime'">
                          {{ formatDateTime(selectedRecord[column]) }}
                        </span>
                        <span *ngSwitchCase="'decimal'" class="font-monospace">
                          {{ formatNumber(selectedRecord[column]) }}
                        </span>
                        <span *ngSwitchDefault>
                          {{ selectedRecord[column] }}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeViewRecord()">Cerrar</button>
              <button type="button" class="btn btn-warning" (click)="editFromView()">
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
    .font-monospace {
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
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
    
    .btn-group .btn {
      padding: 0.25rem 0.5rem;
    }
  `]
})
export class TableManagementComponent implements OnInit {
  tableName = '';
  tableConfig: any = null;
  schema: TableSchema | null = null;
  records: CatalogRecord[] = [];
  pagination: PaginationInfo | null = null;
  loading = false;
  error: string | null = null;
  selectedRecord: CatalogRecord | null = null;
  
  filters: FilterOptions = {};
  currentPage = 1;
  currentLimit = 50;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private algorithmService: AlgorithmService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.tableName = params['table'];
      this.tableConfig = AVAILABLE_TABLES.find(t => t.name === this.tableName);
      this.loadSchema();
      this.loadData();
    });
  }

  loadSchema() {
    this.algorithmService.getTableSchema(this.tableName).subscribe({
      next: (response) => {
        if (response.ok) {
          this.schema = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading schema:', err);
      }
    });
  }

  loadData() {
    this.loading = true;
    this.error = null;

    const filterParams = this.buildFilterParams();

    this.algorithmService.getRecords(this.tableName, filterParams).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.ok) {
          this.records = response.data;
          this.pagination = response.pagination;
        } else {
          this.error = 'Error al cargar los registros';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar los registros';
        console.error('Error loading records:', err);
      }
    });
  }

  buildFilterParams(): FilterOptions {
    const params: FilterOptions = {
      page: this.currentPage,
      limit: this.currentLimit
    };

    // Add text filters
    Object.keys(this.filters).forEach(key => {
      const value = this.filters[key];
      if (value && value.toString().trim()) {
        if (key.endsWith('_min') || key.endsWith('_max')) {
          const field = key.replace('_min', '').replace('_max', '');
          const type = key.endsWith('_min') ? 'min' : 'max';
          
          if (!params[field]) {
            params[field] = {};
          }
          params[field][type] = value;
        } else {
          if (this.getColumnType(key) === 'string') {
            params[key] = { like: value };
          } else {
            params[key] = value;
          }
        }
      }
    });

    return params;
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadData();
  }

  clearFilters() {
    this.filters = {};
    this.currentPage = 1;
    this.loadData();
  }

  onLimitChange() {
    this.currentPage = 1;
    this.loadData();
  }

  goToPage(page: number) {
    if (page >= 1 && this.pagination && page <= this.pagination.totalPages) {
      this.currentPage = page;
      this.loadData();
    }
  }

  refreshData() {
    this.loadData();
  }

  createRecord() {
    this.router.navigate(['/algoritmo/parametros/tabla', this.tableName, 'crear']);
  }

  editRecord(record: CatalogRecord) {
    const recordId = record[this.schema?.pk || 'id'];
    this.router.navigate(['/algoritmo/parametros/tabla', this.tableName, 'editar', recordId]);
  }

  viewRecord(record: CatalogRecord) {
    this.selectedRecord = record;
  }

  closeViewRecord() {
    this.selectedRecord = null;
  }

  editFromView() {
    if (this.selectedRecord) {
      this.editRecord(this.selectedRecord);
      this.closeViewRecord();
    }
  }

  deleteRecord(record: CatalogRecord) {
    const recordId = record[this.schema?.pk || 'id'];
    
    if (confirm('¿Está seguro de que desea eliminar este registro?')) {
      this.algorithmService.deleteRecord(this.tableName, recordId).subscribe({
        next: (response) => {
          if (response.ok) {
            this.loadData();
          } else {
            this.error = 'Error al eliminar el registro';
          }
        },
        error: (err) => {
          this.error = 'Error al eliminar el registro';
          console.error('Error deleting record:', err);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/algoritmo/parametros']);
  }

  // Helper methods

  getVisibleColumns(): string[] {
    if (!this.schema) return [];
    return this.schema.columns.filter(col => col !== 'created_at' && col !== 'updated_at');
  }

  getAllColumns(): string[] {
    return this.schema?.columns || [];
  }

  getTextColumns(): string[] {
    if (!this.schema) return [];
    return this.schema.columns.filter(col => 
      this.schema!.types[col] === 'string' && 
      col !== this.schema!.pk &&
      col !== 'created_at' && 
      col !== 'updated_at'
    );
  }

  getNumericColumns(): string[] {
    if (!this.schema) return [];
    return this.schema.columns.filter(col => 
      (this.schema!.types[col] === 'decimal' || this.schema!.types[col] === 'int') &&
      col !== this.schema!.pk
    );
  }

  getColumnType(column: string): string {
    return this.schema?.types[column] || 'string';
  }

  formatDateTime(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('es-ES');
  }

  formatNumber(value: any): string {
    if (value === null || value === undefined) return '';
    return Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 });
  }

  getStartRecord(): number {
    if (!this.pagination) return 0;
    return (this.pagination.page - 1) * this.pagination.limit + 1;
  }

  getEndRecord(): number {
    if (!this.pagination) return 0;
    return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
  }

  getVisiblePages(): number[] {
    if (!this.pagination) return [];
    
    const pages: number[] = [];
    const current = this.pagination.page;
    const total = this.pagination.totalPages;
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1, total);
      } else if (current >= total - 3) {
        pages.push(1, -1);
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1, -1);
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1, total);
      }
    }
    
    return pages.filter(p => p !== -1);
  }

  trackByRecordId(index: number, record: CatalogRecord): any {
    return record[this.schema?.pk || 'id'] || index;
  }
}