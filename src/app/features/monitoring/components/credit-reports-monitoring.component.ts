import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdfViewerComponent } from '../../../shared/components/pdf-viewer.component';
import { MonitoringService } from '../../../core/services/monitoring.service';
import { 
  CreditReport, 
  CreditReportMeta,
  MonitoringFilters 
} from '../../../shared/types/monitoring.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-credit-reports-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfViewerComponent],
  template: `
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-file-invoice-dollar me-2"></i>
          Monitoreo Reportes de Crédito
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
            Total: {{ meta?.totalItems || 0 }}
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
            <div class="col-md-4">
              <label for="startDate" class="form-label">Fecha Inicio:</label>
              <input
                type="datetime-local"
                id="startDate"
                class="form-control"
                [(ngModel)]="filters.startDate">
            </div>
            <div class="col-md-4">
              <label for="endDate" class="form-label">Fecha Fin:</label>
              <input
                type="datetime-local"
                id="endDate"
                class="form-control"
                [(ngModel)]="filters.endDate">
            </div>
            <div class="col-md-4 d-flex align-items-end">
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
      <div *ngIf="!loading && !error && meta && meta.totalItems > 0" class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span class="text-muted">
            Mostrando {{ ((meta.page - 1) * meta.limit) + 1 }} a {{ Math.min(meta.page * meta.limit, meta.totalItems) }} de {{ meta.totalItems }} resultados
            (Página {{ meta.page }} de {{ meta.totalPages }})
          </span>
        </div>
      </div>

      <!-- Reports Table -->
      <div *ngIf="!loading && !error" class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            <i class="fas fa-table me-2"></i>
            Reportes de Crédito
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
          <div *ngIf="reports.length === 0" class="text-center py-4">
            <i class="fas fa-info-circle fa-2x text-muted mb-3"></i>
            <p class="text-muted">No se encontraron reportes con los filtros aplicados.</p>
          </div>

          <div *ngIf="reports.length > 0" class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Información</th>
                  <th>Score</th> <!-- New column -->
                  <th>Datos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let report of reports; trackBy: trackById">
                  <td>{{ report.id }}</td>
                  <td>
                    <div *ngFor="let key of getDisplayKeys(report) | slice:0:3">
                      <strong>{{ formatKey(key) }}:</strong> {{ report[key] }}
                    </div>
                  </td>
                  <td> <!-- New Score column -->
                    <span class="badge fs-5" [ngStyle]="{'background-color': getScoreColor(report.score)}">{{ report.score }}</span>
                  </td>
                  <td>
                    <div><strong>Monto Solicitado:</strong> {{ report.monto_solicitado }}</div>
                    <div><strong>Monto Sugerido:</strong> {{ report.monto_sugerido }}</div>
                    <div><strong>Wording Underwriting:</strong> {{ report.wording_underwriting }}</div>
                  </td>
                  <td>
                    <div class="d-flex flex-column gap-1">
                      <button 
                        class="btn btn-outline-info btn-sm"
                        (click)="viewDetails(report)"
                        title="Ver detalles del reporte">
                        <i class="fas fa-eye me-1"></i>
                        Ver Detalles
                      </button>
                      <button 
                        *ngIf="getPdfUrl(report)"
                        class="btn btn-outline-danger btn-sm"
                        (click)="viewPdf(report, 'basic')"
                        title="Descargar PDF básico">
                        <i class="fas fa-file-pdf me-1"></i>
                        PDF Básico
                      </button>
                      <button 
                        *ngIf="getDetailedPdfUrl(report)"
                        class="btn btn-outline-warning btn-sm"
                        (click)="viewPdf(report, 'detailed')"
                        title="Descargar PDF detallado">
                        <i class="fas fa-file-alt me-1"></i>
                        PDF Detallado
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
      <div *ngIf="!loading && !error && meta && meta.totalPages > 1" class="d-flex justify-content-center mt-4">
        <nav>
          <ul class="pagination">
            <li class="page-item" [class.disabled]="!meta.hasPreviousPage">
              <button class="page-link" (click)="goToPage(1)" [disabled]="!meta.hasPreviousPage">
                <i class="fas fa-angle-double-left"></i>
              </button>
            </li>
            <li class="page-item" [class.disabled]="!meta.hasPreviousPage">
              <button class="page-link" (click)="goToPage(meta.currentPage - 1)" [disabled]="!meta.hasPreviousPage">
                <i class="fas fa-angle-left"></i>
              </button>
            </li>
            
            <li *ngFor="let page of getVisiblePages()" 
                class="page-item" 
                [class.active]="page === meta.currentPage">
              <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
            </li>
            
            <li class="page-item" [class.disabled]="!meta.hasNextPage">
              <button class="page-link" (click)="goToPage(meta.currentPage + 1)" [disabled]="!meta.hasNextPage">
                <i class="fas fa-angle-right"></i>
              </button>
            </li>
            <li class="page-item" [class.disabled]="!meta.hasNextPage">
              <button class="page-link" (click)="goToPage(meta.totalPages)" [disabled]="!meta.hasNextPage">
                <i class="fas fa-angle-double-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <!-- Details Modal -->
      <div *ngIf="selectedReport" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-info-circle me-2"></i>
                Detalles del Reporte de Crédito
              </h5>
              <button type="button" class="btn-close" (click)="closeDetails()"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-12">
                  <h6>Información Completa</h6>
                  <table class="table table-sm">
                    <tr *ngFor="let key of getAllKeys(selectedReport)">
                      <td><strong>{{ formatKey(key) }}:</strong></td>
                      <td>
                        <span *ngIf="!isObject(selectedReport[key])">{{ selectedReport[key] }}</span>
                        <pre *ngIf="isObject(selectedReport[key])" class="bg-light p-2 rounded">{{ selectedReport[key] | json }}</pre>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeDetails()">Cerrar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- PDF Viewer -->
      <app-pdf-viewer
        [pdfUrl]="currentPdfUrl"
        [title]="currentPdfTitle"
        [isVisible]="showPdfViewer"
        (closed)="closePdfViewer()">
      </app-pdf-viewer>
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
      max-height: 200px;
      overflow-y: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CreditReportsMonitoringComponent implements OnInit {
  reports: CreditReport[] = [];
  meta: CreditReportMeta | null = null;
  currentPage = 1;
  pageSize = 10;
  loading = false;
  error: string | null = null;
  selectedReport: CreditReport | null = null;
  
  // PDF Viewer properties
  showPdfViewer = false;
  currentPdfUrl: string | null = null;
  currentPdfTitle = '';
  
  filters: MonitoringFilters = {};
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;
  currentBaseUrl: string = ''; // Initialize with an empty string

  // Exposer Math para usar en el template
  Math = Math;

  constructor(private monitoringService: MonitoringService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = null;

    this.currentBaseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl; // Set the base URL here
    const filtersWithPagination = {
      ...this.filters,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.monitoringService.getCreditReports(filtersWithPagination, this.currentBaseUrl).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.error) {
          this.error = 'Error en la respuesta del servidor';
          this.reports = [];
          this.meta = null;
        } else {
          this.reports = response.results.data || [];
          this.meta = response.results.meta;
          this.currentPage = this.meta?.page || 1;
          console.log('Reports loaded. reports.length:', this.reports.length, 'Reports data:', this.reports);
          console.log('Pagination Meta:', this.meta); // Add this line
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar los reportes de crédito. Por favor intente nuevamente.';
        console.error('Error loading credit reports:', err);
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
    if (page >= 1 && page <= (this.meta?.totalPages || 1)) {
      this.currentPage = page;
      this.loadData();
    }
  }

  getVisiblePages(): number[] {
    if (!this.meta) return [];

    const pages: number[] = [];
    const totalPages = this.meta.totalPages;
        const current = this.meta.page; // Change from this.meta.currentPage to this.meta.page
    const maxPagesToShow = 5; // Max number of page buttons to display

    console.log('getVisiblePages: current:', current, 'totalPages:', totalPages); // Log 1

    // Always show first page
    pages.push(1);

    // Calculate start and end for the middle pages
    let startPage = Math.max(2, current - Math.floor(maxPagesToShow / 2) + 1);
    let endPage = Math.min(totalPages - 1, current + Math.floor(maxPagesToShow / 2) - 1);

    console.log('getVisiblePages: initial startPage:', startPage, 'endPage:', endPage); // Log 2

    // Adjust start/end if near boundaries
    if (current <= Math.ceil(maxPagesToShow / 2)) {
      endPage = Math.min(totalPages - 1, maxPagesToShow);
    }
    if (current > totalPages - Math.ceil(maxPagesToShow / 2)) {
      startPage = Math.max(2, totalPages - maxPagesToShow + 1);
    }

    console.log('getVisiblePages: adjusted startPage:', startPage, 'endPage:', endPage); // Log 3

    // Add ellipsis if needed after first page
    if (startPage > 2) {
      pages.push(-1); // Ellipsis
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed before last page
    if (endPage < totalPages - 1) {
      pages.push(-1); // Ellipsis
    }

    // Always show last page if not already included
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }
    
    // Filter out duplicates and sort
    const finalPages = [...new Set(pages)].filter(p => p !== -1).sort((a, b) => a - b);
    console.log('getVisiblePages: finalPages:', finalPages); // Log 4
    return finalPages;
  }

  refreshData() {
    this.loadData();
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

  viewDetails(report: CreditReport) {
    this.selectedReport = report;
    console.log('Selected report for details:', this.selectedReport); // Add this line
  }

  closeDetails() {
    this.selectedReport = null;
  }

  trackById(index: number, report: CreditReport): number {
    return report.id;
  }

  // Métodos para manejo dinámico de datos
  getDisplayKeys(report: CreditReport): string[] {
    return Object.keys(report).filter(key => key !== 'id');
  }

  getAllKeys(report: CreditReport): string[] {
    return Object.keys(report);
  }

  formatKey(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }

  getScoreColor(score: number): string {
    if (score < 1 || score > 10) {
      return 'hsl(0, 100%, 50%)'; // Default to red for out-of-range scores
    }
    // Map score from 1-10 to hue from 0 (red) to 120 (green)
    const hue = (score - 1) * (120 / 9);
        return `hsl(${hue}, 80%, 50%)`; // Reduced saturation to 80%
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  // PDF Viewer methods
  getPdfUrl(report: CreditReport): string | null {
    return report.pdf_url || report.reporte_pdf || null;
  }

  getDetailedPdfUrl(report: CreditReport): string | null {
    return report.detailed_pdf_url || report.reporte_pdf_detallado || null;
  }

  viewPdf(report: CreditReport, type: 'basic' | 'detailed') {
    let pdfUrlFromReport: string | null = null; // Renamed for clarity
    let title = '';

    if (type === 'basic') {
      pdfUrlFromReport = this.getPdfUrl(report);
      title = `Reporte PDF - ID: ${report.id}`;
    } else {
      pdfUrlFromReport = this.getDetailedPdfUrl(report);
      title = `Reporte PDF Detallado - ID: ${report.id}`;
    }

    if (pdfUrlFromReport) {
      let finalPdfUrl: string;
      // Check if the URL from the report is already absolute
      if (pdfUrlFromReport.startsWith('http://') || pdfUrlFromReport.startsWith('https://')) {
        finalPdfUrl = pdfUrlFromReport; // Use it as is
      } else {
        // Prepend base URL only if it's a relative path
        finalPdfUrl = `${this.currentBaseUrl}/${pdfUrlFromReport}`;
      }

      console.log('Attempting to load PDF from URL:', finalPdfUrl);
      this.currentPdfUrl = finalPdfUrl;
      this.currentPdfTitle = title;
      this.showPdfViewer = true;
    } else {
      console.warn(`No se encontró URL de PDF ${type} para el reporte ${report.id}`);
    }
  }

  closePdfViewer() {
    this.showPdfViewer = false;
    this.currentPdfUrl = null;
    this.currentPdfTitle = '';
  }
}