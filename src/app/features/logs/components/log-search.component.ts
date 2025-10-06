import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogsService } from '../services/logs.service';
import { 
  LogEntry, 
  LogSearchParams, 
  LogLevel, 
  CertificationLogSearchParams, 
  CertificationLogEntry 
} from '../types/logs.types';

@Component({
  selector: 'app-log-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card shadow">
      <!-- Search Form -->
      <div class="card-header py-3">
        <div class="d-flex justify-content-between align-items-center">
          <h6 class="m-0 font-weight-bold text-primary">
            <i class="fas fa-search me-2"></i>
            Búsqueda Avanzada de Logs
          </h6>
          
          <!-- Environment Selector -->
          <div class="d-flex align-items-center gap-2">
            <small class="text-muted">Ambiente:</small>
            <select class="form-select form-select-sm" [(ngModel)]="selectedEnvironment" (change)="onEnvironmentChange()">
              <option value="qa">QA</option>
              <option value="prod">Prod</option>
            </select>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="mt-3">
          <ul class="nav nav-tabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button 
                class="nav-link" 
                [class.active]="activeSearchTab === 'standard'"
                (click)="activeSearchTab = 'standard'"
                type="button">
                <i class="fas fa-file-alt me-1"></i>
                Logs Estándar
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button 
                class="nav-link" 
                [class.active]="activeSearchTab === 'certification'"
                (click)="activeSearchTab = 'certification'"
                type="button">
                <i class="fas fa-certificate me-1"></i>
                Logs de Certificación
              </button>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="card-body">
        <!-- Standard Log Search Tab -->
        <div *ngIf="activeSearchTab === 'standard'">
          <form (ngSubmit)="performSearch()" #searchForm="ngForm">
            <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">Fecha de inicio:</label>
              <input type="date" 
                     class="form-control"
                     [(ngModel)]="searchParams.startDate"
                     name="startDate"
                     required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Fecha de fin:</label>
              <input type="date" 
                     class="form-control"
                     [(ngModel)]="searchParams.endDate"
                     name="endDate"
                     required>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">Nivel de log:</label>
              <select class="form-select" 
                      [(ngModel)]="searchParams.level"
                      name="level">
                <option value="">Todos los niveles</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="fatal">Fatal</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Límite de resultados:</label>
              <select class="form-select" 
                      [(ngModel)]="searchParams.limit"
                      name="limit">
                <option [value]="100">100 resultados</option>
                <option [value]="500">500 resultados</option>
                <option [value]="1000">1000 resultados</option>
                <option [value]="5000">5000 resultados</option>
                <option [value]="10000">10000 resultados</option>
              </select>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-8">
              <label class="form-label">Término de búsqueda:</label>
              <input type="text" 
                     class="form-control"
                     [(ngModel)]="searchParams.search"
                     name="search"
                     placeholder="Buscar texto específico en los logs...">
            </div>
            <div class="col-md-4">
              <label class="form-label">Formato:</label>
              <select class="form-select" 
                      [(ngModel)]="searchParams.format"
                      name="format">
                <option value="json">JSON</option>
                <option value="raw">Texto plano</option>
              </select>
            </div>
          </div>

          <div class="row">
            <div class="col-12">
              <button type="submit" 
                      class="btn btn-primary me-2"
                      [disabled]="loading || !searchForm.valid">
                <i class="fas fa-search me-1"></i>
                <span *ngIf="!loading">Buscar Logs</span>
                <span *ngIf="loading">
                  <span class="spinner-border spinner-border-sm me-1"></span>
                  Buscando...
                </span>
              </button>
              <button type="button" 
                      class="btn btn-outline-secondary me-2"
                      (click)="clearSearch()">
                <i class="fas fa-times me-1"></i>
                Limpiar
              </button>
              <button type="button" 
                      class="btn btn-outline-success"
                      [disabled]="searchResults.length === 0"
                      (click)="exportResults()">
                <i class="fas fa-download me-1"></i>
                Exportar Resultados
              </button>
            </div>
          </div>
        </form>
        </div>

        <!-- Certification Log Search Tab -->
        <div *ngIf="activeSearchTab === 'certification'">
          <form (ngSubmit)="performCertificationSearch()" #certSearchForm="ngForm">
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Fecha de inicio:</label>
                <input type="date" 
                       class="form-control"
                       [(ngModel)]="certSearchParams.from"
                       name="fromDate"
                       required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Fecha de fin:</label>
                <input type="date" 
                       class="form-control"
                       [(ngModel)]="certSearchParams.to"
                       name="toDate"
                       required>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-12">
                <label class="form-label">Término de búsqueda:</label>
                <input type="text" 
                       class="form-control"
                       [(ngModel)]="certSearchParams.query"
                       name="searchQuery"
                       placeholder="Ej: 'No se guardo la encuesta correctamente'"
                       required>
                <small class="form-text text-muted">
                  Texto específico a buscar en los logs de certificación
                </small>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">Nivel de log:</label>
                <select class="form-select" 
                        [(ngModel)]="certSearchParams.level"
                        name="logLevel">
                  <option value="">Todos los niveles</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Límite de resultados:</label>
                <select class="form-select" 
                        [(ngModel)]="certSearchParams.limit"
                        name="resultLimit">
                  <option [value]="100">100 resultados</option>
                  <option [value]="500">500 resultados</option>
                  <option [value]="1000">1000 resultados</option>
                  <option [value]="2000">2000 resultados</option>
                  <option [value]="5000">5000 resultados (máx)</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Máximo archivos:</label>
                <select class="form-select" 
                        [(ngModel)]="certSearchParams.maxFiles"
                        name="maxFiles">
                  <option [value]="1">1 archivo</option>
                  <option [value]="2">2 archivos</option>
                  <option [value]="3">3 archivos (máx)</option>
                </select>
              </div>
            </div>

            <!-- Validation Info -->
            <div class="alert alert-info mb-3">
              <h6 class="alert-heading">
                <i class="fas fa-info-circle me-1"></i>
                Información de Búsqueda
              </h6>
              <ul class="mb-0 small">
                <li>Rango máximo: 30 días</li>
                <li>Máximo 5000 resultados por búsqueda</li>
                <li>Máximo 3 archivos de log</li>
                <li>Requiere tokens de autenticación válidos</li>
              </ul>
            </div>

            <div class="row">
              <div class="col-12">
                <button type="submit" 
                        class="btn btn-primary me-2"
                        [disabled]="certLoading || !certSearchForm.valid">
                  <i class="fas fa-search me-1"></i>
                  <span *ngIf="!certLoading">Buscar Logs de Certificación</span>
                  <span *ngIf="certLoading">
                    <span class="spinner-border spinner-border-sm me-1"></span>
                    Buscando...
                  </span>
                </button>
                <button type="button" 
                        class="btn btn-outline-secondary me-2"
                        (click)="clearCertificationSearch()">
                  <i class="fas fa-times me-1"></i>
                  Limpiar
                </button>
                <button type="button" 
                        class="btn btn-outline-success"
                        [disabled]="certSearchResults.length === 0"
                        (click)="exportCertificationResults()">
                  <i class="fas fa-download me-1"></i>
                  Exportar Resultados
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Standard Search Results -->
    <div *ngIf="activeSearchTab === 'standard' && (searchResults.length > 0 || (searchExecuted && !loading))" class="card shadow mt-4">
      <div class="card-header py-3 d-flex justify-content-between align-items-center">
        <h6 class="m-0 font-weight-bold text-primary">
          <i class="fas fa-list me-2"></i>
          Resultados de Búsqueda - Logs Estándar
        </h6>
        <div *ngIf="searchStats" class="text-muted small">
          {{ searchStats.totalFound | number }} resultados encontrados en {{ searchStats.executionTime }}ms
        </div>
      </div>

      <div class="card-body">
        <!-- Search Stats -->
        <div *ngIf="searchStats" class="row mb-3">
          <div class="col-md-3">
            <div class="text-center">
              <div class="h4 font-weight-bold text-primary">{{ searchStats.totalFound | number }}</div>
              <div class="text-xs text-uppercase text-muted">Total Encontrados</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center">
              <div class="h4 font-weight-bold text-info">{{ searchResults.length | number }}</div>
              <div class="text-xs text-uppercase text-muted">Mostrados</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center">
              <div class="h4 font-weight-bold text-success">{{ searchStats.executionTime }}</div>
              <div class="text-xs text-uppercase text-muted">Tiempo (ms)</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center">
              <div class="h4 font-weight-bold text-warning">{{ getDaysSearched() }}</div>
              <div class="text-xs text-uppercase text-muted">Días Buscados</div>
            </div>
          </div>
        </div>

        <!-- Results Controls -->
        <div class="row mb-3 align-items-center">
          <div class="col-md-6">
            <div class="form-check">
              <input class="form-check-input" 
                     type="checkbox" 
                     [(ngModel)]="showTimestamps"
                     id="showTimestamps">
              <label class="form-check-label" for="showTimestamps">
                Mostrar timestamps completos
              </label>
            </div>
          </div>
          <div class="col-md-6 text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary" 
                      (click)="scrollToTop()"
                      title="Ir al inicio">
                <i class="fas fa-angle-double-up"></i>
              </button>
              <button class="btn btn-outline-secondary" 
                      (click)="scrollToBottom()"
                      title="Ir al final">
                <i class="fas fa-angle-double-down"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Results List -->
        <div #resultsContainer class="search-results-container" *ngIf="searchResults.length > 0">
          <div *ngFor="let entry of searchResults; let i = index; trackBy: trackByIndex" 
               class="search-result-item"
               [class]="getLogEntryClass(entry)">
            <div class="result-header">
              <span class="result-timestamp" [class.expanded]="showTimestamps">
                {{ entry.timestamp | date:(showTimestamps ? 'dd/MM/yyyy HH:mm:ss.SSS' : 'HH:mm:ss') }}
              </span>
              <span class="result-level">
                <span class="badge" [class]="logsService.getLogLevelBadge(entry.level)">
                  {{ entry.level.toUpperCase() }}
                </span>
              </span>
              <span class="result-index text-muted">#{{ i + 1 }}</span>
            </div>
            <div class="result-message" [innerHTML]="highlightSearch(entry.message)"></div>
            <div *ngIf="entry.meta" class="result-meta">
              <details>
                <summary class="meta-summary">Ver metadatos</summary>
                <pre>{{ formatMeta(entry.meta) }}</pre>
              </details>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div *ngIf="searchResults.length === 0 && searchExecuted && !loading" class="text-center py-5">
          <i class="fas fa-search fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">No se encontraron resultados</h5>
          <p class="text-muted">
            No hay logs que coincidan con los criterios de búsqueda especificados.
          </p>
          <button class="btn btn-outline-primary" (click)="clearSearch()">
            <i class="fas fa-edit me-1"></i>
            Modificar búsqueda
          </button>
        </div>
      </div>
    </div>

    <!-- Certification Search Results -->
    <div *ngIf="activeSearchTab === 'certification' && (certSearchResults.length > 0 || (certSearchExecuted && !certLoading))" class="card shadow mt-4">
      <div class="card-header py-3 d-flex justify-content-between align-items-center">
        <h6 class="m-0 font-weight-bold text-success">
          <i class="fas fa-certificate me-2"></i>
          Resultados de Búsqueda - Logs de Certificación
        </h6>
        <div *ngIf="certSearchStats" class="text-muted small">
          {{ certSearchStats.totalFound | number }} resultados encontrados en {{ certSearchStats.executionTime }}ms
        </div>
      </div>

      <div class="card-body">
        <!-- Certification Search Stats -->
        <div *ngIf="certSearchStats" class="row mb-3">
          <div class="col-md-3">
            <div class="text-center">
              <div class="h4 font-weight-bold text-success">{{ certSearchStats.totalFound | number }}</div>
              <div class="text-xs text-uppercase text-muted">Total Encontrados</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center">
              <div class="h4 font-weight-bold text-info">{{ certSearchResults.length | number }}</div>
              <div class="text-xs text-uppercase text-muted">Mostrados</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center">
              <div class="h4 font-weight-bold text-warning">{{ certSearchStats.executionTime }}</div>
              <div class="text-xs text-uppercase text-muted">Tiempo (ms)</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="text-center">
              <div class="h4 font-weight-bold text-primary">{{ getCertificationDaysSearched() }}</div>
              <div class="text-xs text-uppercase text-muted">Días Buscados</div>
            </div>
          </div>
        </div>

        <!-- Files Searched Info -->
        <div *ngIf="certSearchStats && certSearchStats.filesSearched?.length > 0" class="alert alert-info mb-3">
          <h6 class="alert-heading">
            <i class="fas fa-file-alt me-1"></i>
            Archivos Analizados ({{ certSearchStats.filesSearched.length }})
          </h6>
          <div class="small">
            <span *ngFor="let file of certSearchStats.filesSearched; let last = last" class="badge bg-secondary me-1">
              {{ file }}
            </span>
          </div>
        </div>

        <!-- Results Controls -->
        <div class="row mb-3 align-items-center">
          <div class="col-md-6">
            <div class="form-check">
              <input class="form-check-input" 
                     type="checkbox" 
                     [(ngModel)]="showTimestamps"
                     id="showCertTimestamps">
              <label class="form-check-label" for="showCertTimestamps">
                Mostrar timestamps completos
              </label>
            </div>
          </div>
          <div class="col-md-6 text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary" 
                      (click)="scrollToTop()"
                      title="Ir al inicio">
                <i class="fas fa-angle-double-up"></i>
              </button>
              <button class="btn btn-outline-secondary" 
                      (click)="scrollToBottom()"
                      title="Ir al final">
                <i class="fas fa-angle-double-down"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Certification Results List -->
        <div #certResultsContainer class="search-results-container" *ngIf="certSearchResults.length > 0">
          <div *ngFor="let entry of certSearchResults; let i = index; trackBy: trackByIndex" 
               class="search-result-item"
               [class]="getCertificationLogEntryClass(entry)">
            <div class="result-header">
              <span class="result-timestamp" [class.expanded]="showTimestamps">
                {{ entry.timestamp | date:(showTimestamps ? 'dd/MM/yyyy HH:mm:ss.SSS' : 'HH:mm:ss') }}
              </span>
              <span class="result-level">
                <span class="badge" [class]="logsService.getLogLevelBadge(entry.level)">
                  {{ entry.level.toUpperCase() }}
                </span>
              </span>
              <span class="result-index text-muted">#{{ i + 1 }}</span>
              <span *ngIf="entry.file" class="result-file text-muted ms-2">
                <i class="fas fa-file-alt me-1"></i>{{ entry.file }}
                <span *ngIf="entry.line">:{{ entry.line }}</span>
              </span>
            </div>
            <div class="result-message" [innerHTML]="highlightCertificationSearch(entry.message)"></div>
            <div *ngIf="entry.metadata" class="result-meta">
              <details>
                <summary class="meta-summary">Ver metadatos</summary>
                <pre>{{ formatMeta(entry.metadata) }}</pre>
              </details>
            </div>
          </div>
        </div>

        <!-- No Certification Results -->
        <div *ngIf="certSearchResults.length === 0 && certSearchExecuted && !certLoading" class="text-center py-5">
          <i class="fas fa-search fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">No se encontraron resultados</h5>
          <p class="text-muted">
            No hay logs de certificación que coincidan con los criterios especificados.
          </p>
          <button class="btn btn-outline-primary" (click)="clearCertificationSearch()">
            <i class="fas fa-edit me-1"></i>
            Modificar búsqueda
          </button>
        </div>
      </div>
    </div>

    <!-- Standard Error Display -->
    <div *ngIf="activeSearchTab === 'standard' && error" class="alert alert-danger mt-4">
      <i class="fas fa-exclamation-triangle me-2"></i>
      {{ error }}
    </div>

    <!-- Certification Error Display -->
    <div *ngIf="activeSearchTab === 'certification' && certError" class="alert alert-danger mt-4">
      <i class="fas fa-exclamation-triangle me-2"></i>
      {{ certError }}
    </div>
  `,
  styles: [`
    .search-results-container {
      max-height: 600px;
      overflow-y: auto;
      border: 1px solid #495057;
      border-radius: 0.35rem;
      background-color: #212529;
    }
    
    .search-result-item {
      padding: 1rem;
      border-bottom: 1px solid #495057;
      border-left: 4px solid transparent;
      background-color: #343a40;
      margin-bottom: 0.5rem;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      transition: box-shadow 0.2s ease;
    }
    
    .search-result-item:hover {
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      background-color: #3d4449;
    }
    
    .search-result-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    
    .search-result-item.debug { border-left-color: #6c757d; }
    .search-result-item.info { border-left-color: #17a2b8; }
    .search-result-item.warn { border-left-color: #ffc107; }
    .search-result-item.error { border-left-color: #dc3545; }
    .search-result-item.fatal { border-left-color: #343a40; }
    
    .result-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
      padding: 6px 0;
      border-bottom: 1px solid #6c757d;
    }
    
    .result-timestamp {
      font-family: 'Courier New', monospace;
      color: #e9ecef;
      font-weight: 600;
      background-color: #495057;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.8rem;
    }
    
    .result-timestamp.expanded {
      min-width: 150px;
    }
    
    .result-level .badge {
      font-size: 0.7rem;
      min-width: 50px;
    }
    
    .result-index {
      margin-left: auto;
      font-size: 0.75rem;
    }
    
    .result-message {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
      color: #f8f9fa;
      font-weight: 500;
      background-color: #2c3034;
      padding: 8px 12px;
      border-radius: 4px;
      border-left: 3px solid #17a2b8;
    }
    
    .result-meta {
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #6c757d;
    }
    
    .meta-summary {
      cursor: pointer;
      color: #17a2b8;
      font-size: 0.875rem;
      outline: none;
    }
    
    .meta-summary:hover {
      text-decoration: underline;
      color: #20c997;
    }
    
    .result-meta pre {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      background-color: #1e1e1e;
      border: 1px solid #495057;
      border-radius: 0.25rem;
      padding: 0.5rem;
      color: #e9ecef;
    }
    
    .highlight {
      background-color: #ffc107;
      color: #212529;
      padding: 0.1rem 0.2rem;
      border-radius: 0.2rem;
      font-weight: 600;
    }
    
    .text-xs {
      font-size: 0.75rem;
    }
    
    .h4 {
      font-size: 1.5rem;
    }
  `]
})
export class LogSearchComponent {
  // Environment
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  
  // Active tab
  activeSearchTab: 'standard' | 'certification' = 'standard';

  // Standard search
  searchParams: LogSearchParams = {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    level: '',
    search: '',
    limit: 1000,
    format: 'json'
  };

  searchResults: (LogEntry | CertificationLogEntry)[] = [];
  searchStats: any = null;
  loading = false;
  error: string | null = null;
  searchExecuted = false;
  showTimestamps = false;

  // Certification search
  certSearchParams: CertificationLogSearchParams = {
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    to: new Date().toISOString().split('T')[0], // today
    query: '',
    limit: 1000,
    level: undefined,
    maxFiles: 3
  };

  certSearchResults: CertificationLogEntry[] = [];
  certSearchStats: any = null;
  certLoading = false;
  certError: string | null = null;
  certSearchExecuted = false;

  constructor(public logsService: LogsService) {}

  performSearch() {
    // If we're on certification tab, redirect to certification search
    if (this.activeSearchTab === 'certification') {
      console.log('🔄 Redirecting to certification search from performSearch()');
      console.log('🔄 Current active tab:', this.activeSearchTab);
      this.performCertificationSearch();
      return;
    }
    
    console.log('🔍 performSearch() continuing for standard search, active tab:', this.activeSearchTab);
    
    if (!this.searchParams.startDate || !this.searchParams.endDate) {
      this.error = 'Por favor seleccione las fechas de inicio y fin';
      return;
    }

    this.loading = true;
    this.error = null;
    this.searchResults = [];
    this.searchStats = null;

    this.logsService.searchLogs(this.searchParams).subscribe({
      next: (response) => {
        console.log('🔍 Raw response from API:', response);
        this.loading = false;
        
        // Set the correct executed flag based on active tab
        if (this.activeSearchTab === 'certification') {
          this.certSearchExecuted = true;
        } else {
          this.searchExecuted = true;
        }
        
        if (response.success && response.data) {
          // Save results in the correct variables based on active tab
          if (this.activeSearchTab === 'certification') {
            this.certSearchResults = response.data.logs;
            this.certSearchStats = {
              totalFound: response.data.total,
              executionTime: response.data.executionTime,
              filesSearched: response.data.filesSearched || []
            };
            console.log('✅ Certification results processed:', this.certSearchResults.length, 'entries');
          } else {
            this.searchResults = response.data.logs;
            this.searchStats = {
              totalFound: response.data.total,
              executionTime: response.data.executionTime
            };
            console.log('✅ Standard results processed:', this.searchResults.length, 'entries');
          }
          console.log('✅ First entry:', response.data.logs[0]);
          console.log('✅ Search executed flag:', this.searchExecuted);
          console.log('✅ Active tab:', this.activeSearchTab);
        } else {
          this.error = response.error || response.message || 'Error desconocido';
          console.log('❌ Response indicates failure:', response);
        }
      },
      error: (err) => {
        this.loading = false;
        this.searchExecuted = true;
        this.error = 'Error al realizar la búsqueda de logs';
        console.error('Search error:', err);
      }
    });
  }

  clearSearch() {
    this.searchParams = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      level: '',
      search: '',
      limit: 1000,
      format: 'json'
    };
    this.searchResults = [];
    this.searchStats = null;
    this.error = null;
    this.searchExecuted = false;
  }

  exportResults() {
    if (this.searchResults.length === 0) return;

    const dataStr = JSON.stringify(this.searchResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const filename = `log-search-results-${this.searchParams.startDate}-to-${this.searchParams.endDate}.json`;
    this.logsService.downloadBlob(dataBlob, filename);
  }

  getDaysSearched(): number {
    if (!this.searchParams.startDate || !this.searchParams.endDate) return 0;
    
    const start = new Date(this.searchParams.startDate);
    const end = new Date(this.searchParams.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  scrollToTop() {
    const container = document.querySelector('.search-results-container');
    if (container) {
      container.scrollTop = 0;
    }
  }

  scrollToBottom() {
    const container = document.querySelector('.search-results-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  getLogEntryClass(entry: LogEntry | CertificationLogEntry): string {
    return entry.level?.toLowerCase() || 'info';
  }

  highlightSearch(message: string): string {
    // Use certification search term if we're on certification tab, otherwise use standard search
    const searchTerm = this.activeSearchTab === 'certification' 
      ? this.certSearchParams.query 
      : this.searchParams.search;
      
    if (!searchTerm) return message;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return message.replace(regex, '<span class="highlight">$1</span>');
  }

  formatMeta(meta: Record<string, any> | undefined): string {
    if (!meta) return '';
    return JSON.stringify(meta, null, 2);
  }

  // ===== CERTIFICATION SEARCH METHODS =====

  onEnvironmentChange() {
    // Clear results when environment changes
    this.clearSearch();
    this.clearCertificationSearch();
  }

  performCertificationSearch() {
    console.log('🚀 performCertificationSearch called with params:', this.certSearchParams);
    console.log('🔍 Active tab:', this.activeSearchTab);
    
    if (!this.certSearchParams.from || !this.certSearchParams.to || !this.certSearchParams.query.trim()) {
      this.certError = 'Por favor complete todos los campos requeridos';
      return;
    }

    this.certLoading = true;
    this.certError = null;
    this.certSearchResults = [];
    this.certSearchStats = null;

    const baseUrl = this.selectedEnvironment === 'qa' ? undefined : 'https://produccion.credibusiness.io';

    this.logsService.searchCertificationLogs(this.certSearchParams, baseUrl).subscribe({
      next: (response) => {
        this.certLoading = false;
        this.certSearchExecuted = true;
        
        if (response.success && response.data) {
          this.certSearchResults = response.data.logs;
          this.certSearchStats = {
            totalFound: response.data.total,
            executionTime: response.data.executionTime,
            filesSearched: response.data.filesSearched
          };
        } else {
          this.certError = response.error || response.message || 'Error desconocido';
        }
      },
      error: (err) => {
        this.certLoading = false;
        this.certSearchExecuted = true;
        
        // Handle specific error codes
        if (err.status === 400) {
          this.certError = 'Parámetros inválidos: ' + (err.error?.message || 'Verifique los datos ingresados');
        } else if (err.status === 401) {
          this.certError = 'No autorizado - revisar tokens de autenticación';
        } else if (err.status === 429) {
          this.certError = 'Demasiadas búsquedas activas - reintentar más tarde';
        } else {
          this.certError = 'Error al realizar la búsqueda: ' + (err.error?.message || err.message);
        }
        
        console.error('Certification search error:', err);
      }
    });
  }

  clearCertificationSearch() {
    this.certSearchParams = {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
      query: '',
      limit: 1000,
      level: undefined,
      maxFiles: 3
    };
    this.certSearchResults = [];
    this.certSearchStats = null;
    this.certError = null;
    this.certSearchExecuted = false;
  }

  exportCertificationResults() {
    if (this.certSearchResults.length === 0) return;

    const exportData = {
      searchParams: this.certSearchParams,
      stats: this.certSearchStats,
      results: this.certSearchResults,
      exportDate: new Date().toISOString(),
      environment: this.selectedEnvironment
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const filename = `certification-logs-${this.certSearchParams.from}-to-${this.certSearchParams.to}.json`;
    this.logsService.downloadBlob(dataBlob, filename);
  }

  getCertificationDaysSearched(): number {
    if (!this.certSearchParams.from || !this.certSearchParams.to) return 0;
    
    const start = new Date(this.certSearchParams.from);
    const end = new Date(this.certSearchParams.to);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  getCertificationLogEntryClass(entry: CertificationLogEntry): string {
    return entry.level?.toLowerCase() || 'info';
  }

  highlightCertificationSearch(message: string): string {
    if (!this.certSearchParams.query) return message;
    
    const searchTerm = this.certSearchParams.query;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return message.replace(regex, '<span class="highlight">$1</span>');
  }
}