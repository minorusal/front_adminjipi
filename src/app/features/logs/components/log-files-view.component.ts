import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogsService } from '../services/logs.service';
import { LogFile } from '../types/logs.types';

@Component({
  selector: 'app-log-files-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card shadow">
      <div class="card-header py-3 d-flex justify-content-between align-items-center">
        <h6 class="m-0 font-weight-bold text-primary">
          <i class="fas fa-folder-open me-2"></i>
          Archivos de Log Disponibles
        </h6>
        <button class="btn btn-outline-primary btn-sm" 
                (click)="refreshFiles.emit()"
                [disabled]="loading">
          <i class="fas fa-sync-alt me-1"></i>
          Actualizar
        </button>
      </div>
      
      <div class="card-body">
        <!-- Loading -->
        <div *ngIf="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando archivos...</span>
          </div>
        </div>

        <!-- Files Table -->
        <div *ngIf="!loading && files.length > 0" class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>
                  <i class="fas fa-file me-1"></i>
                  Archivo
                </th>
                <th>
                  <i class="fas fa-calendar me-1"></i>
                  Última Modificación
                </th>
                <th>
                  <i class="fas fa-weight me-1"></i>
                  Tamaño
                </th>
                <th>
                  <i class="fas fa-tag me-1"></i>
                  Tipo
                </th>
                <th>
                  <i class="fas fa-cogs me-1"></i>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let file of files; trackBy: trackByFilename">
                <td>
                  <div class="d-flex align-items-center">
                    <i class="fas fa-file-alt me-2" 
                       [class]="getFileIcon(file)"></i>
                    <div>
                      <div class="font-weight-bold">{{ file.filename }}</div>
                      <small class="text-muted">{{ file.path }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span [title]="file.lastModified | date:'full'">
                    {{ file.lastModified | date:'dd/MM/yyyy HH:mm' }}
                  </span>
                </td>
                <td>
                  <span class="badge" [class]="getSizeBadgeClass(file.size)">
                    {{ logsService.formatFileSize(file.size) }}
                  </span>
                </td>
                <td>
                  <span class="badge" [class]="getTypeBadgeClass(file.type)">
                    {{ file.type === 'current' ? 'Actual' : 'Archivado' }}
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-wrap gap-1">
                    <button class="btn btn-outline-primary btn-sm" 
                            (click)="fileSelected.emit(file)"
                            title="Ver contenido del archivo">
                      <i class="fas fa-eye me-1"></i>
                      Ver
                    </button>
                    <button class="btn btn-outline-success btn-sm" 
                            (click)="downloadFile.emit(file)"
                            title="Descargar archivo">
                      <i class="fas fa-download me-1"></i>
                      Descargar
                    </button>
                    <button class="btn btn-outline-info btn-sm" 
                            (click)="showFileInfo(file)"
                            title="Ver información del archivo">
                      <i class="fas fa-info-circle me-1"></i>
                      Info
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- No Files -->
        <div *ngIf="!loading && files.length === 0" class="text-center py-5">
          <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">No hay archivos de log disponibles</h5>
          <p class="text-muted">
            No se encontraron archivos de log en el sistema.
          </p>
          <button class="btn btn-primary" (click)="refreshFiles.emit()">
            <i class="fas fa-sync-alt me-1"></i>
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>

    <!-- File Info Modal -->
    <div *ngIf="selectedFileInfo" class="modal fade show d-block" 
         tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-info-circle me-2"></i>
              Información del Archivo
            </h5>
            <button type="button" class="btn-close" (click)="closeFileInfo()"></button>
          </div>
          <div class="modal-body">
            <table class="table table-sm">
              <tr>
                <td><strong>Nombre:</strong></td>
                <td>{{ selectedFileInfo.filename }}</td>
              </tr>
              <tr>
                <td><strong>Ruta:</strong></td>
                <td><code>{{ selectedFileInfo.path }}</code></td>
              </tr>
              <tr>
                <td><strong>Tamaño:</strong></td>
                <td>
                  {{ logsService.formatFileSize(selectedFileInfo.size) }}
                  <small class="text-muted">({{ selectedFileInfo.size | number }} bytes)</small>
                </td>
              </tr>
              <tr>
                <td><strong>Última Modificación:</strong></td>
                <td>{{ selectedFileInfo.lastModified | date:'full' }}</td>
              </tr>
              <tr>
                <td><strong>Tipo:</strong></td>
                <td>
                  <span class="badge" [class]="getTypeBadgeClass(selectedFileInfo.type)">
                    {{ selectedFileInfo.type === 'current' ? 'Archivo Actual' : 'Archivo Archivado' }}
                  </span>
                </td>
              </tr>
            </table>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeFileInfo()">
              Cerrar
            </button>
            <button type="button" class="btn btn-primary" (click)="viewFile()">
              <i class="fas fa-eye me-1"></i>
              Ver Archivo
            </button>
            <button type="button" class="btn btn-success" (click)="downloadSelectedFile()">
              <i class="fas fa-download me-1"></i>
              Descargar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table th {
      border-top: none;
      background-color: #f8f9fc;
      font-weight: 600;
      font-size: 0.85rem;
    }
    
    .btn-group .btn {
      padding: 0.25rem 0.5rem;
    }
    
    .badge {
      font-size: 0.75rem;
    }
    
    .table-responsive {
      border-radius: 0.35rem;
    }
    
    .modal {
      display: block;
    }
    
    code {
      font-size: 0.8rem;
      background-color: #f8f9fc;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
    }
  `]
})
export class LogFilesViewComponent {
  @Input() files: LogFile[] = [];
  @Input() loading = false;
  
  @Output() fileSelected = new EventEmitter<LogFile>();
  @Output() downloadFile = new EventEmitter<LogFile>();
  @Output() refreshFiles = new EventEmitter<void>();

  selectedFileInfo: LogFile | null = null;

  constructor(public logsService: LogsService) {}

  trackByFilename(index: number, file: LogFile): string {
    return file.filename;
  }

  getFileIcon(file: LogFile): string {
    if (file.type === 'current') {
      return 'text-success';
    }
    return 'text-info';
  }

  getSizeBadgeClass(size: number): string {
    if (size > 100 * 1024 * 1024) return 'bg-danger'; // > 100MB
    if (size > 10 * 1024 * 1024) return 'bg-warning';  // > 10MB
    if (size > 1024 * 1024) return 'bg-info';          // > 1MB
    return 'bg-success';
  }

  getTypeBadgeClass(type: string): string {
    return type === 'current' ? 'bg-success' : 'bg-secondary';
  }

  showFileInfo(file: LogFile) {
    this.selectedFileInfo = file;
  }

  closeFileInfo() {
    this.selectedFileInfo = null;
  }

  viewFile() {
    if (this.selectedFileInfo) {
      this.fileSelected.emit(this.selectedFileInfo);
      this.closeFileInfo();
    }
  }

  downloadSelectedFile() {
    if (this.selectedFileInfo) {
      this.downloadFile.emit(this.selectedFileInfo);
      this.closeFileInfo();
    }
  }
}