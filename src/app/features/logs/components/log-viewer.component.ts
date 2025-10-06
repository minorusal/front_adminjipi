import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogsService } from '../services/logs.service';
import { LogFile, LogEntry, LogLevel, LogFilters } from '../types/logs.types';

@Component({
  selector: 'app-log-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card shadow">
      <!-- Header -->
      <div class="card-header py-3">
        <div class="row align-items-center">
          <div class="col-md-6">
            <h6 class="m-0 font-weight-bold text-primary">
              <i class="fas fa-eye me-2"></i>
              Visor de Logs
            </h6>
            <small class="text-muted" *ngIf="selectedFile">
              {{ selectedFile.filename }} ({{ logsService.formatFileSize(selectedFile.size) }})
            </small>
          </div>
          <div class="col-md-6">
            <div class="row">
              <div class="col-md-6">
                <label class="form-label small">Fecha del log:</label>
                <input type="date" 
                       class="form-control form-control-sm"
                       [(ngModel)]="selectedDate"
                       (change)="onDateChange()">
              </div>
              <div class="col-md-6">
                <label class="form-label small">Nivel:</label>
                <select class="form-select form-select-sm" 
                        [(ngModel)]="filters.level"
                        (change)="onFilterChange()">
                  <option value="all">Todos los niveles</option>
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="fatal">Fatal</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card-body border-bottom">
        <div class="row">
          <div class="col-md-6">
            <label class="form-label small">Buscar en logs:</label>
            <input type="text" 
                   class="form-control form-control-sm"
                   [(ngModel)]="filters.searchTerm"
                   (input)="onFilterChange()"
                   placeholder="Buscar texto en los logs...">
          </div>
          <div class="col-md-3">
            <label class="form-label small">Límite de líneas:</label>
            <select class="form-select form-select-sm"
                    [(ngModel)]="filters.limit"
                    (change)="onFilterChange()">
              <option [value]="100">100 líneas</option>
              <option [value]="500">500 líneas</option>
              <option [value]="1000">1000 líneas</option>
              <option [value]="5000">5000 líneas</option>
            </select>
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button class="btn btn-primary btn-sm me-2" 
                    (click)="loadLogs()"
                    [disabled]="loading || !selectedDate">
              <i class="fas fa-search me-1"></i>
              Cargar Logs
            </button>
            <button class="btn btn-outline-success btn-sm" 
                    (click)="downloadLogs()"
                    [disabled]="!selectedDate">
              <i class="fas fa-download me-1"></i>
              Descargar
            </button>
          </div>
        </div>
      </div>

      <!-- Log Content -->
      <div class="card-body p-0">
        <!-- Loading -->
        <div *ngIf="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando logs...</span>
          </div>
          <div class="mt-2">Cargando contenido del log...</div>
        </div>

        <!-- Error -->
        <div *ngIf="error" class="alert alert-danger m-3">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ error }}
        </div>

        <!-- No File Selected -->
        <div *ngIf="!selectedDate && !loading" class="text-center py-5">
          <i class="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">Seleccione una fecha</h5>
          <p class="text-muted">
            Seleccione una fecha para cargar y visualizar los logs correspondientes.
          </p>
        </div>

        <!-- Log Entries -->
        <div *ngIf="logEntries.length > 0 && !loading" class="log-viewer">
          <div class="log-controls p-3 border-bottom bg-light">
            <div class="row align-items-center">
              <div class="col-md-6">
                <small class="text-muted">
                  Mostrando {{ logEntries.length | number }} entradas
                  <span *ngIf="filteredCount > 0"> ({{ filteredCount | number }} filtradas)</span>
                </small>
              </div>
              <div class="col-md-6 text-end">
                <div class="btn-group btn-group-sm" role="group">
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
                  <button class="btn btn-outline-secondary" 
                          (click)="toggleWrap()"
                          [class.active]="wrapLines"
                          title="Ajustar líneas">
                    <i class="fas fa-text-width"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div #logContainer class="log-content" [class.wrap-lines]="wrapLines">
            <div *ngFor="let entry of logEntries; let i = index; trackBy: trackByIndex" 
                 class="log-entry"
                 [class]="getLogEntryClass(entry)">
              <div class="log-line">
                <span class="log-timestamp">{{ entry.timestamp | date:'HH:mm:ss.SSS' }}</span>
                <span class="log-level" [class]="logsService.getLogLevelColor(entry.level)">
                  <span class="badge" [class]="logsService.getLogLevelBadge(entry.level)">
                    {{ entry.level.toUpperCase() }}
                  </span>
                </span>
                <span class="log-message" [innerHTML]="highlightSearch(entry.message)"></span>
              </div>
              <div *ngIf="entry.meta && showMetadata" class="log-meta">
                <pre>{{ formatMeta(entry.meta) }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- No Logs Found -->
        <div *ngIf="logEntries.length === 0 && !loading && selectedDate" class="text-center py-5">
          <i class="fas fa-search fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">No se encontraron logs</h5>
          <p class="text-muted">
            No hay entradas de log para la fecha y filtros seleccionados.
          </p>
          <button class="btn btn-outline-primary" (click)="clearFilters()">
            <i class="fas fa-filter me-1"></i>
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .log-viewer {
      max-height: 600px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
    }
    
    .log-content {
      max-height: 500px;
      overflow-y: auto;
      background-color: #1e1e1e;
      color: #d4d4d4;
      padding: 1rem;
    }
    
    .log-entry {
      margin-bottom: 0.25rem;
      border-left: 3px solid transparent;
      padding-left: 0.5rem;
    }
    
    .log-entry.debug { border-left-color: #6c757d; }
    .log-entry.info { border-left-color: #17a2b8; }
    .log-entry.warn { border-left-color: #ffc107; }
    .log-entry.error { border-left-color: #dc3545; }
    .log-entry.fatal { border-left-color: #343a40; }
    
    .log-line {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      font-size: 0.875rem;
    }
    
    .log-timestamp {
      color: #9cdcfe;
      font-weight: 500;
      min-width: 80px;
    }
    
    .log-level {
      min-width: 60px;
    }
    
    .log-level .badge {
      font-size: 0.7rem;
      min-width: 50px;
    }
    
    .log-message {
      flex: 1;
      word-break: break-word;
    }
    
    .log-meta {
      margin-top: 0.25rem;
      padding-left: 1rem;
      border-left: 2px solid #495057;
    }
    
    .log-meta pre {
      color: #7fb3d3;
      font-size: 0.75rem;
      margin: 0;
      background: none;
      border: none;
      padding: 0;
    }
    
    .wrap-lines .log-message {
      white-space: pre-wrap;
    }
    
    .log-controls {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    
    .highlight {
      background-color: #fff3cd;
      color: #856404;
      padding: 0.1rem 0.2rem;
      border-radius: 0.2rem;
    }
    
    .form-label.small {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .btn-group-sm .btn {
      padding: 0.25rem 0.5rem;
    }
  `]
})
export class LogViewerComponent implements OnChanges {
  @Input() selectedFile: LogFile | null = null;
  @Output() fileChanged = new EventEmitter<LogFile | null>();

  logEntries: LogEntry[] = [];
  selectedDate = '';
  loading = false;
  error: string | null = null;
  filteredCount = 0;
  wrapLines = false;
  showMetadata = false;

  filters: LogFilters = {
    level: 'all',
    searchTerm: '',
    limit: 1000
  };

  constructor(public logsService: LogsService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedFile'] && this.selectedFile) {
      this.selectedDate = this.extractDateFromFile(this.selectedFile);
      this.loadLogs();
    }
  }

  onDateChange() {
    if (this.selectedDate) {
      this.loadLogs();
    }
  }

  onFilterChange() {
    // Debounce filter changes
    setTimeout(() => {
      if (this.selectedDate) {
        this.loadLogs();
      }
    }, 300);
  }

  loadLogs() {
    if (!this.selectedDate) {
      this.error = 'Seleccione una fecha para cargar los logs';
      return;
    }

    this.loading = true;
    this.error = null;
    this.logEntries = [];

    this.logsService.getLogsByDate(this.selectedDate, this.filters).subscribe({
      next: (blob) => {
        this.loading = false;
        this.processLogBlob(blob);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar los logs';
        console.error('Log loading error:', err);
      }
    });
  }

  downloadLogs() {
    if (!this.selectedDate) return;

    this.logsService.downloadLogs(this.selectedDate, this.filters).subscribe({
      next: (blob) => {
        this.logsService.downloadBlob(blob, `logs-${this.selectedDate}.gz`);
      },
      error: (err) => {
        this.error = 'Error al descargar los logs';
        console.error('Download error:', err);
      }
    });
  }

  private processLogBlob(blob: Blob) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.parseLogText(text);
    };
    reader.readAsText(blob);
  }

  private parseLogText(text: string) {
    const lines = text.split('\n').filter(line => line.trim());
    this.logEntries = lines
      .map(line => this.logsService.parseLogEntry(line))
      .filter((entry): entry is LogEntry => entry !== null);
    
    this.filteredCount = this.logEntries.length;
  }

  private extractDateFromFile(file: LogFile): string {
    const dateMatch = file.filename.match(/(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
  }

  clearFilters() {
    this.filters = {
      level: 'all',
      searchTerm: '',
      limit: 1000
    };
    this.loadLogs();
  }

  scrollToTop() {
    const container = document.querySelector('.log-content');
    if (container) {
      container.scrollTop = 0;
    }
  }

  scrollToBottom() {
    const container = document.querySelector('.log-content');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  toggleWrap() {
    this.wrapLines = !this.wrapLines;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getLogEntryClass(entry: LogEntry): string {
    return entry.level.toLowerCase();
  }

  highlightSearch(message: string): string {
    if (!this.filters.searchTerm) return message;
    
    const searchTerm = this.filters.searchTerm;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return message.replace(regex, '<span class="highlight">$1</span>');
  }

  formatMeta(meta: Record<string, any>): string {
    return JSON.stringify(meta, null, 2);
  }
}