import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogsService } from '../services/logs.service';
import { LogEntry, LogTailOptions, LogLevel } from '../types/logs.types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-log-tail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card shadow">
      <!-- Controls -->
      <div class="card-header py-3">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h6 class="m-0 font-weight-bold text-primary">
              <i class="fas fa-stream me-2"></i>
              Monitoreo en Tiempo Real
              <span *ngIf="isActive" class="badge bg-success ms-2">
                <i class="fas fa-circle"></i> En vivo
              </span>
              <span *ngIf="!isActive" class="badge bg-secondary ms-2">
                <i class="fas fa-stop-circle"></i> Detenido
              </span>
            </h6>
          </div>
          <div class="col-md-4 text-end">
            <button *ngIf="!isActive" 
                    class="btn btn-success btn-sm me-2" 
                    (click)="startTail()">
              <i class="fas fa-play me-1"></i>
              Iniciar
            </button>
            <button *ngIf="isActive" 
                    class="btn btn-danger btn-sm me-2" 
                    (click)="stopTail()">
              <i class="fas fa-stop me-1"></i>
              Detener
            </button>
            <button class="btn btn-outline-secondary btn-sm" 
                    (click)="clearLogs()">
              <i class="fas fa-trash me-1"></i>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <!-- Configuration -->
      <div class="card-body border-bottom">
        <div class="row">
          <div class="col-md-3">
            <label class="form-label small">Líneas iniciales:</label>
            <select class="form-select form-select-sm" 
                    [(ngModel)]="tailOptions.lines"
                    [disabled]="isActive">
              <option [value]="10">10 líneas</option>
              <option [value]="25">25 líneas</option>
              <option [value]="50">50 líneas</option>
              <option [value]="100">100 líneas</option>
              <option [value]="0">Solo nuevas</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small">Nivel mínimo:</label>
            <select class="form-select form-select-sm" 
                    [(ngModel)]="tailOptions.level"
                    [disabled]="isActive">
              <option value="">Todos</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="fatal">Fatal</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label small">Filtro de texto:</label>
            <input type="text" 
                   class="form-control form-control-sm"
                   [(ngModel)]="tailOptions.search"
                   [disabled]="isActive"
                   placeholder="Filtrar logs por texto...">
          </div>
          <div class="col-md-2">
            <label class="form-label small">Auto-scroll:</label>
            <div class="form-check">
              <input class="form-check-input" 
                     type="checkbox" 
                     [(ngModel)]="autoScroll"
                     id="autoScroll">
              <label class="form-check-label" for="autoScroll">
                Activado
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="card-body border-bottom py-2" *ngIf="stats.total > 0">
        <div class="row text-center">
          <div class="col-md-2">
            <small class="text-muted">Total:</small>
            <div class="fw-bold text-primary">{{ stats.total | number }}</div>
          </div>
          <div class="col-md-2">
            <small class="text-muted">Debug:</small>
            <div class="fw-bold text-secondary">{{ stats.debug | number }}</div>
          </div>
          <div class="col-md-2">
            <small class="text-muted">Info:</small>
            <div class="fw-bold text-info">{{ stats.info | number }}</div>
          </div>
          <div class="col-md-2">
            <small class="text-muted">Warning:</small>
            <div class="fw-bold text-warning">{{ stats.warn | number }}</div>
          </div>
          <div class="col-md-2">
            <small class="text-muted">Error:</small>
            <div class="fw-bold text-danger">{{ stats.error | number }}</div>
          </div>
          <div class="col-md-2">
            <small class="text-muted">Fatal:</small>
            <div class="fw-bold text-dark">{{ stats.fatal | number }}</div>
          </div>
        </div>
      </div>

      <!-- Log Stream -->
      <div class="card-body p-0">
        <!-- Connection Status -->
        <div *ngIf="!isActive && logEntries.length === 0" class="text-center py-5">
          <i class="fas fa-play-circle fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">Listo para monitorear</h5>
          <p class="text-muted">
            Haga clic en "Iniciar" para comenzar a recibir logs en tiempo real.
          </p>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="alert alert-danger m-3">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ error }}
          <button class="btn btn-outline-danger btn-sm ms-2" (click)="retryConnection()">
            <i class="fas fa-redo me-1"></i>
            Reintentar
          </button>
        </div>

        <!-- Log Entries -->
        <div *ngIf="logEntries.length > 0" class="tail-log-container">
          <div class="log-controls p-2 border-bottom bg-light d-flex justify-content-between align-items-center">
            <small class="text-muted">
              Mostrando {{ displayedEntries.length | number }} de {{ logEntries.length | number }} entradas
              <span *ngIf="isActive" class="text-success ms-2">
                <i class="fas fa-circle"></i> Actualizando...
              </span>
            </small>
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
              <button class="btn btn-outline-secondary" 
                      (click)="togglePause()"
                      [class.active]="isPaused"
                      title="Pausar/Reanudar">
                <i class="fas" [class.fa-pause]="!isPaused" [class.fa-play]="isPaused"></i>
              </button>
            </div>
          </div>

          <div #logContainer class="tail-content">
            <div *ngFor="let entry of displayedEntries; let i = index; trackBy: trackByIndex" 
                 class="tail-entry"
                 [class]="getTailEntryClass(entry)"
                 [class.new-entry]="isNewEntry(entry)">
              <div class="entry-line">
                <span class="entry-time">{{ entry.timestamp | date:'HH:mm:ss.SSS' }}</span>
                <span class="entry-level">
                  <span class="badge" [class]="logsService.getLogLevelBadge(entry.level || 'info')">
                    {{ (entry.level || 'INFO').toUpperCase() }}
                  </span>
                </span>
                <span class="entry-message" [innerHTML]="highlightSearch(entry.message || entry.raw || '')"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tail-log-container {
      height: 600px;
      display: flex;
      flex-direction: column;
    }
    
    .tail-content {
      flex: 1;
      overflow-y: auto;
      background-color: #1e1e1e;
      color: #d4d4d4;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      padding: 0.5rem;
    }
    
    .tail-entry {
      margin-bottom: 0.25rem;
      border-left: 3px solid transparent;
      padding-left: 0.5rem;
      transition: all 0.3s ease;
    }
    
    .tail-entry.new-entry {
      animation: fadeIn 0.5s ease-in;
      background-color: rgba(40, 167, 69, 0.1);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    .tail-entry.debug { border-left-color: #6c757d; }
    .tail-entry.info { border-left-color: #17a2b8; }
    .tail-entry.warn { border-left-color: #ffc107; }
    .tail-entry.error { border-left-color: #dc3545; }
    .tail-entry.fatal { border-left-color: #343a40; }
    
    .entry-line {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    
    .entry-time {
      color: #9cdcfe;
      font-weight: 500;
      min-width: 90px;
    }
    
    .entry-level {
      min-width: 60px;
    }
    
    .entry-level .badge {
      font-size: 0.7rem;
      min-width: 50px;
    }
    
    .entry-message {
      flex: 1;
      word-break: break-word;
    }
    
    .log-controls {
      flex-shrink: 0;
    }
    
    .highlight {
      background-color: #ffc107;
      color: #000;
      padding: 0.1rem 0.2rem;
      border-radius: 0.2rem;
    }
    
    .form-label.small {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .fw-bold {
      font-weight: 600 !important;
    }
    
    .btn-group-sm .btn {
      padding: 0.25rem 0.5rem;
    }
    
    .badge {
      font-size: 0.7rem;
    }
  `]
})
export class LogTailComponent implements OnInit, OnDestroy {
  @Input() baseUrl?: string;
  
  logEntries: LogEntry[] = [];
  displayedEntries: LogEntry[] = [];
  isActive = false;
  isPaused = false;
  autoScroll = true;
  error: string | null = null;
  
  private tailSubscription: Subscription | null = null;
  private newEntryIds = new Set<string>();
  private maxEntries = 1000;

  tailOptions: LogTailOptions = {
    lines: 50,
    follow: true,
    level: '',
    search: ''
  };

  stats = {
    total: 0,
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
    fatal: 0
  };

  constructor(public logsService: LogsService) {}

  ngOnInit() {
    // Auto-start tail if needed
  }

  ngOnDestroy() {
    this.stopTail();
  }

  startTail() {
    if (this.isActive) return;

    this.error = null;
    this.isActive = true;
    this.isPaused = false;

    this.tailSubscription = this.logsService.startTail(this.tailOptions, this.baseUrl).subscribe({
      next: (entry) => {
        console.log('Component received log entry:', entry);
        if (!this.isPaused) {
          this.addLogEntry(entry);
        }
      },
      error: (err) => {
        this.isActive = false;
        console.error('Tail error details:', err);
        
        if (err.message && err.message.includes('autenticación')) {
          this.error = 'Error de autenticación. Verifique que esté logueado correctamente.';
        } else {
          this.error = `Error en la conexión: ${err.message || 'Error desconocido'}`;
        }
      }
    });
  }

  stopTail() {
    this.isActive = false;
    this.logsService.stopTail();
    
    if (this.tailSubscription) {
      this.tailSubscription.unsubscribe();
      this.tailSubscription = null;
    }
  }

  retryConnection() {
    this.stopTail();
    setTimeout(() => this.startTail(), 1000);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  clearLogs() {
    this.logEntries = [];
    this.displayedEntries = [];
    this.newEntryIds.clear();
    this.resetStats();
  }

  private addLogEntry(entry: LogEntry) {
    console.log('Adding log entry to display:', entry);
    
    // Add entry to the list
    this.logEntries.push(entry);
    
    // Mark as new entry for animation
    const entryId = `${entry.timestamp}-${entry.message || entry.raw || ''}`;
    this.newEntryIds.add(entryId);
    
    // Remove the "new" marker after animation
    setTimeout(() => {
      this.newEntryIds.delete(entryId);
    }, 2000);

    // Limit total entries
    if (this.logEntries.length > this.maxEntries) {
      const removed = this.logEntries.splice(0, this.logEntries.length - this.maxEntries);
      removed.forEach(removedEntry => {
        const removedId = `${removedEntry.timestamp}-${removedEntry.message || removedEntry.raw || ''}`;
        this.newEntryIds.delete(removedId);
      });
    }

    // Update filtered display
    this.updateDisplayedEntries();
    this.updateStats();

    console.log('Total entries:', this.logEntries.length, 'Displayed:', this.displayedEntries.length);

    // Auto-scroll to bottom if enabled
    if (this.autoScroll) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  private updateDisplayedEntries() {
    console.log('Updating displayed entries. Total entries:', this.logEntries.length);
    console.log('Filters - Level:', this.tailOptions.level, 'Search:', this.tailOptions.search);
    
    this.displayedEntries = this.logEntries.filter(entry => {
      // Level filter
      if (this.tailOptions.level && entry.level !== this.tailOptions.level) {
        console.log('Entry filtered out by level:', entry.level, 'vs', this.tailOptions.level);
        return false;
      }
      
      // Search filter
      if (this.tailOptions.search && 
          !(entry.message || entry.raw || '').toLowerCase().includes(this.tailOptions.search.toLowerCase())) {
        console.log('Entry filtered out by search:', entry.message || entry.raw);
        return false;
      }
      
      return true;
    });
    
    console.log('Filtered result:', this.displayedEntries.length, 'entries to display');
  }

  private updateStats() {
    this.stats = {
      total: this.logEntries.length,
      debug: this.logEntries.filter(e => e.level === 'debug').length,
      info: this.logEntries.filter(e => e.level === 'info').length,
      warn: this.logEntries.filter(e => e.level === 'warn').length,
      error: this.logEntries.filter(e => e.level === 'error').length,
      fatal: this.logEntries.filter(e => e.level === 'fatal').length
    };
  }

  private resetStats() {
    this.stats = {
      total: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0
    };
  }

  scrollToTop() {
    const container = document.querySelector('.tail-content');
    if (container) {
      container.scrollTop = 0;
      this.autoScroll = false;
    }
  }

  scrollToBottom() {
    const container = document.querySelector('.tail-content');
    if (container) {
      container.scrollTop = container.scrollHeight;
      this.autoScroll = true;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  getTailEntryClass(entry: LogEntry): string {
    return entry.level ? entry.level.toLowerCase() : 'info';
  }

  isNewEntry(entry: LogEntry): boolean {
    const entryId = `${entry.timestamp}-${entry.message || entry.raw || ''}`;
    return this.newEntryIds.has(entryId);
  }

  highlightSearch(message: string): string {
    if (!this.tailOptions.search) return message;
    
    const searchTerm = this.tailOptions.search;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return message.replace(regex, '<span class="highlight">$1</span>');
  }

  private addTestEntry() {
    console.log('Adding test entry to verify UI works');
    const testEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Test log entry - UI verification',
      raw: 'Test log entry - UI verification'
    };
    this.addLogEntry(testEntry);
  }
}