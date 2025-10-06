import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogsService } from '../services/logs.service';
import { LogFilesViewComponent } from './log-files-view.component';
import { LogViewerComponent } from './log-viewer.component';
import { LogSearchComponent } from './log-search.component';
import { LogTailComponent } from './log-tail.component';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';
import {
  LogFile,
  LogFileStats,
  LogFilters,
  LogLevel
} from '../types/logs.types';

@Component({
  selector: 'app-logs-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LogFilesViewComponent,
    LogViewerComponent,
    LogSearchComponent,
    LogTailComponent
  ],
  template: `
    <div class="logs-dashboard container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="fas fa-file-alt me-2 text-primary"></i>
          Gestión de Logs del Sistema
        </h2>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select form-select-sm" [(ngModel)]="selectedEnvironment" (change)="onEnvironmentChange()">
            <option value="qa">QA</option>
            <option value="prod">Prod</option>
          </select>
          <button class="btn btn-outline-success btn-sm" (click)="refreshData()">
            <i class="fas fa-sync-alt me-1"></i>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4" *ngIf="stats">
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total de Archivos
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ stats.totalFiles | number }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-file fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Tamaño Total
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ logsService.formatFileSize(stats.totalSize) }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-hdd fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Log Actual
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">
                    {{ logsService.formatFileSize(stats.currentLogSize) }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-file-medical fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Archivo Más Nuevo
                  </div>
                  <div class="small mb-0 font-weight-bold text-gray-800">
                    {{ stats.newestFile }}
                  </div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-clock fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <ul class="nav nav-tabs mb-4" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link" 
                  [class.active]="activeTab === 'files'"
                  (click)="setActiveTab('files')">
            <i class="fas fa-folder-open me-2"></i>Archivos de Log
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" 
                  [class.active]="activeTab === 'viewer'"
                  (click)="setActiveTab('viewer')">
            <i class="fas fa-eye me-2"></i>Visor de Logs
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" 
                  [class.active]="activeTab === 'search'"
                  (click)="setActiveTab('search')">
            <i class="fas fa-search me-2"></i>Búsqueda Avanzada
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" 
                  [class.active]="activeTab === 'tail'"
                  (click)="setActiveTab('tail')">
            <i class="fas fa-stream me-2"></i>Tiempo Real
            <span *ngIf="logsService.isTailActive()" class="badge bg-success ms-1">●</span>
          </button>
        </li>
      </ul>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="mt-3">Cargando datos de logs...</div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Files Tab -->
        <div *ngIf="activeTab === 'files' && !loading" class="tab-pane active">
          <app-log-files-view 
            [files]="logFiles"
            [loading]="filesLoading"
            [baseUrl]="getCurrentBaseUrl()"
            (fileSelected)="onFileSelected($event)"
            (downloadFile)="onDownloadFile($event)"
            (refreshFiles)="loadLogFiles()">
          </app-log-files-view>
        </div>

        <!-- Viewer Tab -->
        <div *ngIf="activeTab === 'viewer' && !loading" class="tab-pane active">
          <app-log-viewer 
            [selectedFile]="selectedFile"
            [baseUrl]="getCurrentBaseUrl()"
            (fileChanged)="onViewerFileChanged($event)">
          </app-log-viewer>
        </div>

        <!-- Search Tab -->
        <div *ngIf="activeTab === 'search' && !loading" class="tab-pane active">
          <app-log-search [baseUrl]="getCurrentBaseUrl()"></app-log-search>
        </div>

        <!-- Tail Tab -->
        <div *ngIf="activeTab === 'tail' && !loading" class="tab-pane active">
          <app-log-tail [baseUrl]="getCurrentBaseUrl()"></app-log-tail>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .logs-dashboard {
      position: relative;
      z-index: 1;
    }
    
    .border-left-primary {
      border-left: 0.25rem solid #4e73df !important;
    }
    .border-left-info {
      border-left: 0.25rem solid #36b9cc !important;
    }
    .border-left-success {
      border-left: 0.25rem solid #1cc88a !important;
    }
    .border-left-warning {
      border-left: 0.25rem solid #f6c23e !important;
    }
    .text-xs {
      font-size: 0.7rem;
    }
    .nav-tabs .nav-link {
      border: none;
      border-bottom: 2px solid transparent;
      color: #6c757d;
    }
    .nav-tabs .nav-link.active {
      border-bottom: 2px solid #4e73df;
      background: none;
      color: #4e73df;
    }
    .nav-tabs .nav-link:hover {
      border-bottom: 2px solid #4e73df;
      background: none;
    }
  `]
})
export class LogsDashboardComponent implements OnInit, OnDestroy {
  activeTab = 'files';
  loading = false;
  filesLoading = false;
  error: string | null = null;
  
  logFiles: LogFile[] = [];
  stats: LogFileStats | null = null;
  selectedFile: LogFile | null = null;
  
  // Environment selection
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  constructor(public logsService: LogsService) {}

  ngOnInit() {
    console.log('LogsDashboardComponent loaded - Sidebar should be visible');
    this.loadInitialData();
  }

  ngOnDestroy() {
    // Stop any active tail when component is destroyed
    this.logsService.stopTail();
  }

  private loadInitialData() {
    this.loading = true;
    this.error = null;
    
    this.loadLogFiles();
  }

  loadLogFiles() {
    this.filesLoading = true;
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    
    this.logsService.getLogFiles(1, 20, baseUrl).subscribe({
      next: (response) => {
        this.loading = false;
        this.filesLoading = false;
        
        if (response.ok) {
          this.logFiles = response.data.files;
          this.stats = response.data.stats;
        } else {
          this.error = response.message;
        }
      },
      error: (err) => {
        this.loading = false;
        this.filesLoading = false;
        this.error = 'Error al cargar los archivos de log';
        console.error('Logs files error:', err);
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    
    // Stop tail when switching away from tail tab
    if (tab !== 'tail') {
      this.logsService.stopTail();
    }
  }

  refreshData() {
    if (this.activeTab === 'files') {
      this.loadLogFiles();
    }
  }

  onEnvironmentChange() {
    // Stop any active tail connections when switching environments
    this.logsService.stopTail();
    
    // Clear current data
    this.logFiles = [];
    this.stats = null;
    this.selectedFile = null;
    
    // Reload data for new environment
    this.loadLogFiles();
  }

  getCurrentBaseUrl(): string {
    return this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
  }

  onFileSelected(file: LogFile) {
    this.selectedFile = file;
    this.setActiveTab('viewer');
  }

  onDownloadFile(file: LogFile) {
    const date = this.extractDateFromFilename(file.filename);
    if (date) {
      this.logsService.downloadLogs(date).subscribe({
        next: (blob) => {
          this.logsService.downloadBlob(blob, `${file.filename}.gz`);
        },
        error: (err) => {
          this.error = 'Error al descargar el archivo';
          console.error('Download error:', err);
        }
      });
    }
  }

  onViewerFileChanged(file: LogFile | null) {
    this.selectedFile = file;
  }

  private extractDateFromFilename(filename: string): string | null {
    // Extract date from filename patterns like: app-2023-12-25.log
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : null;
  }
}