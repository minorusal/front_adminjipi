import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlgorithmService } from '../services/algorithm.service';
import { AVAILABLE_TABLES, TableConfig } from '../types/algorithm.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-parameters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Database Viewer (Now Main View) -->
    <div class="database-viewer-main vh-100">
      <div class="modal-content bg-dark text-light h-100">
        <div class="modal-header bg-dark text-light border-secondary">
          <h5 class="modal-title">
            <i class="fas fa-database me-2 text-info"></i>
            Parámetros de Algoritmo - Catálogos
          </h5>
          <div class="d-flex gap-2 align-items-center">
            <select class="form-select form-select-sm bg-dark text-light border-secondary" 
                    [value]="selectedEnvironment"
                    (change)="onEnvironmentSelectChange($event)"
                    title="Seleccionar ambiente">
              <option value="qa">🔧 QA</option>
              <option value="prod">🚀 Prod</option>
            </select>
            <select class="form-select form-select-sm bg-dark text-light border-secondary" 
                    [(ngModel)]="selectedDbTable" 
                    (change)="onDbTableSelectionChange()">
              <option value="">Seleccionar tabla...</option>
              <option *ngFor="let table of tableConfigs" [value]="table.name">
                {{ table.displayName }} ({{ table.name }})
              </option>
            </select>
            <button class="btn btn-success btn-sm" (click)="exportToPDF()" [disabled]="loading">
              <i class="fas fa-file-pdf me-1"></i>
              PDF ({{ selectedEnvironment.toUpperCase() }})
            </button>
            <button class="btn btn-outline-primary btn-sm" (click)="refreshTables()">
              <i class="fas fa-sync-alt me-1"></i>
              Actualizar
            </button>
            <span class="badge bg-primary">
              {{ tableConfigs.length }} tablas
            </span>
          </div>
        </div>
        <div class="modal-body p-0 bg-dark h-100">
          <div class="database-container h-100">
            <!-- Database Info Panel -->
            <div class="db-info-panel">
              <div class="db-info-header">
                <i class="fas fa-server me-2"></i>
                Información de la Base de Datos
              </div>
              <div class="db-info-content">
                <div class="info-item">
                  <strong>Ambiente:</strong> 
                  <span [class.text-warning]="selectedEnvironment === 'qa'" 
                        [class.text-success]="selectedEnvironment === 'prod'">
                    {{ selectedEnvironment === 'qa' ? '🔧 QA' : '🚀 PROD' }}
                  </span>
                </div>
                <div class="info-item">
                  <strong>Host:</strong> <span class="text-success">{{ getCurrentHost() }}</span>
                </div>
                <div class="info-item">
                  <strong>API URL:</strong> <span class="text-info font-monospace small">{{ getCurrentApiUrl() }}</span>
                </div>
                <div class="info-item">
                  <strong>Base de Datos:</strong> <span class="text-info">catalogs_algorithm</span>
                </div>
                <div class="info-item">
                  <strong>Total Tablas:</strong> <span class="text-warning">{{ tableConfigs.length }}</span>
                </div>
                <div class="info-item">
                  <strong>Tabla Seleccionada:</strong> 
                  <span class="text-success">{{ selectedDbTable || 'Ninguna' }}</span>
                </div>
              </div>
            </div>

            <!-- Tables List Panel -->
            <div class="db-tables-panel">
              <div class="db-tables-header">
                <i class="fas fa-table me-2"></i>
                Tablas Disponibles
              </div>
              <div class="db-tables-content">
                <div 
                  *ngFor="let table of tableConfigs; trackBy: trackByTableName"
                  class="table-item"
                  [class.active]="selectedDbTable === table.name"
                  (click)="selectTableInViewer(table.name)">
                  <div class="table-icon">
                    <i [class]="table.icon"></i>
                  </div>
                  <div class="table-info">
                    <div class="table-name">{{ table.displayName }}</div>
                    <div class="table-description">{{ table.name }}</div>
                    <small class="table-count" *ngIf="tableCounts[table.name]">
                      {{ tableCounts[table.name] }} registros
                    </small>
                  </div>
                  <div class="table-actions">
                    <button 
                      class="btn btn-sm btn-outline-light opacity-75"
                      (click)="viewSchemaInViewer(table.name); $event.stopPropagation()"
                      title="Ver esquema">
                      <i class="fas fa-info-circle"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Query Results Panel -->
            <div class="db-results-panel">
              <div class="db-results-header">
                <div class="d-flex align-items-center">
                  <i class="fas fa-table me-2"></i>
                  <span *ngIf="selectedDbTable">{{ selectedDbTable }}</span>
                  <span *ngIf="!selectedDbTable">Resultados de Consulta</span>
                </div>
                <div class="results-actions" *ngIf="selectedDbTable">
                  <span class="badge 
                        bg-warning text-dark" 
                        [class.bg-warning]="selectedEnvironment === 'qa'"
                        [class.bg-success]="selectedEnvironment === 'prod'">
                    {{ selectedEnvironment === 'qa' ? '🔧 QA' : '🚀 PROD' }}
                  </span>
                </div>
              </div>
              <div class="db-results-content">
                <!-- Loading state -->
                <div *ngIf="loadingTable" class="text-center py-5">
                  <div class="spinner-border text-info" role="status">
                    <span class="visually-hidden">Cargando datos...</span>
                  </div>
                  <div class="mt-2">Cargando datos de la tabla...</div>
                </div>

                <!-- No table selected -->
                <div *ngIf="!selectedDbTable && !loadingTable" class="text-center py-5 text-muted">
                  <i class="fas fa-table fa-3x mb-3 opacity-25"></i>
                  <h5>Selecciona una tabla</h5>
                  <p>Elige una tabla de la lista para ver su contenido</p>
                </div>


                <!-- Table data -->
                <div *ngIf="selectedDbTable && !loadingTable" class="table-responsive">
                  <table class="table table-dark table-striped table-hover table-sm">
                    <thead class="table-info">
                      <tr>
                        <th *ngFor="let column of getDbColumns(); trackBy: trackByColumn" 
                            [style.min-width.px]="120">
                          {{ column }}
                          <small class="d-block text-muted">{{ getDbColumnType(column) }}</small>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngIf="dbTableData.length === 0">
                        <td [attr.colspan]="getDbColumns().length" class="text-center text-muted py-3">
                          No hay datos disponibles
                        </td>
                      </tr>
                      <tr *ngFor="let row of dbTableData; let i = index">
                        <td *ngFor="let column of getDbColumns(); trackBy: trackByColumn"
                            [attr.data-column]="column"
                            [attr.data-row]="i"
                            (dblclick)="startEdit(i, column)"
                            [class.editable-cell]="!isEditingCell(i, column)"
                            [class.editing-cell]="isEditingCell(i, column)">
                          
                          <!-- Normal display mode -->
                          <span *ngIf="!isEditingCell(i, column)" 
                                [class.text-muted]="row[column] === null || row[column] === undefined"
                                [class.text-truncate]="true"
                                [style.max-width.px]="200"
                                [title]="formatCellValue(row[column])">
                            {{ formatCellValue(row[column]) }}
                          </span>
                          
                          <!-- Edit mode -->
                          <div *ngIf="isEditingCell(i, column)" class="edit-cell-container">
                            <input 
                              #editInput
                              class="form-control form-control-sm bg-dark text-light border-info"
                              [value]="formatEditValue(row[column])"
                              (keydown.enter)="saveEdit(i, column, editInput.value)"
                              (keydown.escape)="cancelEdit()"
                              (blur)="saveEdit(i, column, editInput.value)"
                              [attr.data-row]="i"
                              [attr.data-column]="column"
                              autocomplete="off">
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <!-- Saving indicator -->
                  <div *ngIf="savingChanges" class="text-center py-2">
                    <div class="spinner-border spinner-border-sm text-info me-2" role="status"></div>
                    <small>Guardando cambios...</small>
                  </div>
                </div>

                <!-- No data message -->
                <div *ngIf="selectedDbTable && dbTableData.length === 0 && !loadingTable" class="text-center py-5 text-muted">
                  <i class="fas fa-inbox fa-3x mb-3 opacity-25"></i>
                  <h5>No hay datos</h5>
                  <p>Esta tabla no contiene registros</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      <!-- Schema Modal -->
      <div *ngIf="selectedSchema" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-info-circle me-2"></i>
                Esquema de {{ selectedTableName }}
              </h5>
              <button type="button" class="btn-close" (click)="closeSchema()"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Información General</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>Clave Primaria:</strong></td>
                      <td>{{ selectedSchema.pk }}</td>
                    </tr>
                    <tr>
                      <td><strong>Total Columnas:</strong></td>
                      <td>{{ selectedSchema.columns.length }}</td>
                    </tr>
                    <tr>
                      <td><strong>Campos Requeridos:</strong></td>
                      <td>{{ selectedSchema.required.length }}</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>Campos Requeridos</h6>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item" *ngFor="let field of selectedSchema.required">
                      <i class="fas fa-asterisk text-danger me-2" style="font-size: 0.7em;"></i>
                      {{ field }}
                      <span class="badge bg-secondary ms-2">{{ selectedSchema.types[field] }}</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div class="row mt-3">
                <div class="col-12">
                  <h6>Todas las Columnas</h6>
                  <div class="table-responsive">
                    <table class="table table-striped table-sm">
                      <thead>
                        <tr>
                          <th>Campo</th>
                          <th>Tipo</th>
                          <th>Requerido</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let column of selectedSchema.columns">
                          <td>
                            <code>{{ column }}</code>
                            <i *ngIf="column === selectedSchema.pk" class="fas fa-key text-warning ms-2" title="Clave primaria"></i>
                          </td>
                          <td>
                            <span class="badge bg-info">{{ selectedSchema.types[column] }}</span>
                          </td>
                          <td>
                            <i *ngIf="selectedSchema.required.includes(column)" 
                               class="fas fa-check text-success" 
                               title="Requerido"></i>
                            <i *ngIf="!selectedSchema.required.includes(column)" 
                               class="fas fa-times text-muted" 
                               title="Opcional"></i>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeSchema()">Cerrar</button>
              <button type="button" class="btn btn-primary" (click)="openTableFromSchema()">
                <i class="fas fa-table me-1"></i>
                Ver Registros
              </button>
            </div>
          </div>
        </div>
      </div>
  `,
  styles: [`
    .table-card {
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      cursor: pointer;
      border: none;
    }
    
    .table-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }
    
    .icon-container {
      width: 60px;
      height: 60px;
      background: linear-gradient(45deg, #f8f9fa, #e9ecef);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .card {
      border: none;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    
    .modal.show {
      display: block;
    }
    
    .badge {
      font-size: 0.75em;
    }
    
    code {
      color: #e83e8c;
      background-color: #f8f9fa;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
    }
    
    /* Database Viewer Styles */
    .database-viewer-main {
      font-family: 'Consolas', 'Monaco', monospace;
    }
    
    .database-container {
      display: grid;
      grid-template-columns: 300px 250px 1fr;
      height: calc(100vh - 120px);
    }
    
    .db-info-panel {
      background: #1e1e1e;
      border-right: 1px solid #333;
      padding: 0;
    }
    
    .db-info-header {
      background: #2d2d2d;
      padding: 12px 15px;
      font-weight: bold;
      border-bottom: 1px solid #444;
      color: #ffffff;
    }
    
    .db-info-content {
      padding: 15px;
    }
    
    .info-item {
      margin-bottom: 10px;
      font-size: 0.9em;
    }
    
    .db-tables-panel {
      background: #252525;
      border-right: 1px solid #333;
      padding: 0;
    }
    
    .db-tables-header {
      background: #2d2d2d;
      padding: 12px 15px;
      font-weight: bold;
      border-bottom: 1px solid #444;
      color: #ffffff;
    }
    
    .db-tables-content {
      padding: 10px;
      max-height: calc(100vh - 200px);
      overflow-y: auto;
    }
    
    .table-item {
      display: flex;
      align-items: center;
      padding: 10px;
      margin-bottom: 5px;
      background: #2a2a2a;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    
    .table-item:hover {
      background: #333;
      border-color: #555;
    }
    
    .table-item.active {
      background: #0d6efd;
      border-color: #0d6efd;
    }
    
    .table-icon {
      width: 20px;
      margin-right: 10px;
      color: #17a2b8;
    }
    
    .table-info {
      flex: 1;
    }
    
    .table-name {
      font-size: 0.9em;
      font-weight: bold;
      color: #fff;
    }
    
    .table-description {
      font-size: 0.8em;
      color: #aaa;
      font-family: monospace;
    }
    
    .table-count {
      font-size: 0.75em;
      color: #28a745;
    }
    
    .db-results-panel {
      background: #1a1a1a;
      padding: 0;
      display: flex;
      flex-direction: column;
    }
    
    .db-results-header {
      background: #2d2d2d;
      padding: 12px 15px;
      border-bottom: 1px solid #444;
      flex-shrink: 0;
      display: flex;
      justify-content: between;
      align-items: center;
    }
    
    .db-results-content {
      flex: 1;
      padding: 15px;
      overflow: auto;
    }
    
    .query-info {
      font-size: 0.85em;
    }
    
    .query-loading,
    .query-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #aaa;
    }
    
    .query-results {
      flex: 1;
      padding: 15px;
      overflow: auto;
    }
    
    .results-info {
      margin-bottom: 10px;
    }
    
    .database-table {
      font-size: 0.85em;
      margin: 0;
    }
    
    .db-column-header {
      background: #333 !important;
      border-color: #555 !important;
      color: #17a2b8 !important;
      font-weight: bold;
      white-space: nowrap;
      padding: 8px 12px;
    }
    
    .db-cell {
      border-color: #333 !important;
      padding: 6px 12px;
      vertical-align: top;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .db-cell:hover {
      background: #333 !important;
      white-space: normal;
      word-wrap: break-word;
      max-width: none;
    }
    
    .font-monospace {
      font-family: 'Consolas', 'Monaco', monospace;
    }
    
    .db-status {
      font-size: 0.9em;
    }
    
    .table-actions {
      display: flex;
      gap: 5px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    .table-item:hover .table-actions {
      opacity: 1;
    }
    
    .results-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Editable cell styles */
    .editable-cell {
      cursor: pointer;
      position: relative;
    }
    
    .editable-cell:hover {
      background: rgba(13, 110, 253, 0.1) !important;
    }
    
    .editing-cell {
      background: rgba(13, 110, 253, 0.2) !important;
      padding: 2px !important;
    }
    
    .edit-cell-container {
      width: 100%;
    }
    
    .edit-cell-container input {
      width: 100%;
      font-size: 0.85em;
    }

    /* Scrollbar for dark theme */
    .db-tables-content::-webkit-scrollbar,
    .db-results-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .db-tables-content::-webkit-scrollbar-track,
    .db-results-content::-webkit-scrollbar-track {
      background: #1a1a1a;
    }
    
    .db-tables-content::-webkit-scrollbar-thumb,
    .db-results-content::-webkit-scrollbar-thumb {
      background: #555;
      border-radius: 4px;
    }
    
    .db-tables-content::-webkit-scrollbar-thumb:hover,
    .db-results-content::-webkit-scrollbar-thumb:hover {
      background: #777;
    }
    
    /* Inline Editing Styles */
    .editing-row {
      background: rgba(13, 110, 253, 0.1) !important;
    }
    
    .editing-cell {
      background: rgba(13, 110, 253, 0.2) !important;
      border: 2px solid #0d6efd !important;
      position: relative;
    }
    
    .non-editable {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .non-editable:hover {
      background: inherit !important;
    }
    
    .cell-content {
      position: relative;
      min-height: 20px;
    }
    
    .edit-icon {
      opacity: 0;
      color: #17a2b8;
      cursor: pointer;
      transition: opacity 0.2s ease;
      font-size: 0.8em;
    }
    
    .db-cell:hover .edit-icon {
      opacity: 1;
    }
    
    .db-cell:hover:not(.non-editable) {
      background: rgba(23, 162, 184, 0.1) !important;
      cursor: pointer;
    }
    
    .editing-container {
      position: relative;
      width: 100%;
    }
    
    .db-edit-input {
      background: #2a2a2a !important;
      border: 1px solid #17a2b8 !important;
      color: #fff !important;
      font-size: 0.85em;
      padding: 2px 6px !important;
      height: auto !important;
      min-height: 24px;
      width: 100%;
    }
    
    .db-edit-input:focus {
      background: #333 !important;
      border-color: #0d6efd !important;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25) !important;
      outline: none !important;
    }
    
    .saving-indicator {
      position: absolute;
      top: 2px;
      right: 2px;
      z-index: 10;
    }
    
    .form-check {
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .form-check-input {
      background-color: #2a2a2a;
      border-color: #555;
      margin: 0;
    }
    
    .form-check-input:checked {
      background-color: #28a745;
      border-color: #28a745;
    }
    
    .form-check-input:focus {
      box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
    }
    
    /* Animations for notifications */
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `]
})
export class ParametersComponent implements OnInit {
  tableConfigs = AVAILABLE_TABLES;
  loading = false;
  error: string | null = null;
  tableCounts: Record<string, number> = {};
  selectedSchema: any = null;
  selectedTableName = '';
  
  // Database Viewer properties
  selectedDbTable = '';
  dbTableData: any[] = [];
  dbTableSchemas: Record<string, any> = {};
  loadingTable = false;
  
  // Inline editing properties
  editingCell: { rowIndex: number, column: string } | null = null;
  editingValue: any = null;
  savingChanges = false;
  originalValues: Record<string, any> = {};
  
  // Environment selection properties
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  constructor(
    private algorithmService: AlgorithmService,
    private router: Router
  ) {
    console.log('🏗️ Constructor URLs:');
    console.log('🔧 QA URL:', this.qaApiUrl);
    console.log('🚀 Prod URL:', this.prodApiUrl);
    console.log('📊 URLs are different:', this.qaApiUrl !== this.prodApiUrl);
  }

  ngOnInit() {
    this.tableConfigs = AVAILABLE_TABLES;
    this.loadTableCountsForEnvironment();
    console.log('📊 Parameters component initialized with', this.tableConfigs.length, 'tables');
  }

  loadTableCounts() {
    this.loading = true;
    this.error = null;

    // Cargar el conteo de registros para cada tabla
    this.tableConfigs.forEach(table => {
      this.algorithmService.getRecords(table.name, { page: 1, limit: 1 }, this.getCurrentApiUrl()).subscribe({
        next: (response) => {
          if (response.ok && response.pagination) {
            this.tableCounts[table.name] = response.pagination.total;
          }
        },
        error: (err) => {
          console.error(`Error loading count for ${table.name}:`, err);
        }
      });
    });

    this.loading = false;
  }

  refreshTables() {
    this.tableCounts = {};
    this.loadTableCounts();
  }

  openTable(tableName: string) {
    this.router.navigate(['/algoritmo/parametros/tabla', tableName]);
  }

  openTableForCreate(tableName: string) {
    this.router.navigate(['/algoritmo/parametros/tabla', tableName, 'crear']);
  }

  viewSchema(tableName: string) {
    this.loading = true;
    this.algorithmService.getTableSchema(tableName).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.ok) {
          this.selectedSchema = response.data;
          this.selectedTableName = this.getTableDisplayName(tableName);
        } else {
          this.error = 'Error al cargar el esquema de la tabla';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar el esquema de la tabla';
        console.error('Error loading schema:', err);
      }
    });
  }

  closeSchema() {
    this.selectedSchema = null;
    this.selectedTableName = '';
  }

  openTableFromSchema() {
    if (this.selectedSchema) {
      const tableName = this.tableConfigs.find(t => this.selectedTableName.includes(t.displayName))?.name;
      if (tableName) {
        this.closeSchema();
        this.openTable(tableName);
      }
    }
  }

  getTableDisplayName(tableName: string): string {
    const config = this.tableConfigs.find(t => t.name === tableName);
    return config ? config.displayName : tableName;
  }

  trackByTableName(index: number, table: TableConfig): string {
    return table.name;
  }

  // Database Viewer Methods




  onDbTableSelectionChange() {
    this.loadTableDataForViewer();
  }

  selectTableInViewer(tableName: string) {
    this.selectedDbTable = tableName;
    this.loadTableDataForViewer();
  }

  viewSchemaInViewer(tableName: string) {
    this.viewSchema(tableName);
  }

  onEnvironmentSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedEnvironment = target.value as 'qa' | 'prod';
    console.log(`🔄 Environment changed to: ${this.selectedEnvironment}`);
    this.onEnvironmentChange();
  }

  onEnvironmentChange() {
    console.log(`🔄 Environment changed to: ${this.selectedEnvironment}`);
    
    // Limpiar datos cuando cambie el ambiente
    this.selectedDbTable = '';
    this.dbTableData = [];
    this.cancelEdit();
    
    // Recargar contadores de tablas para el nuevo ambiente
    this.loadTableCountsForEnvironment();
  }

  getCurrentHost(): string {
    const baseUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    try {
      return new URL(baseUrl).hostname;
    } catch {
      return baseUrl;
    }
  }

  getCurrentApiUrl(): string {
    const apiUrl = this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
    return apiUrl;
  }

  loadTableCountsForEnvironment() {
    this.tableCounts = {};
    const apiUrl = this.getCurrentApiUrl();
    
    this.tableConfigs.forEach(table => {
      const currentEnv = this.selectedEnvironment.toUpperCase();
      this.algorithmService.getRecords(table.name, { page: 1, limit: 1 }, apiUrl).subscribe({
        next: (response) => {
          console.log(`📊 [${currentEnv}] Table ${table.name}:`, response.pagination?.total || 0, 'records');
          if (response.ok && response.pagination) {
            this.tableCounts[table.name] = response.pagination.total;
          }
        },
        error: (err) => {
          console.error(`❌ [${currentEnv}] Error loading ${table.name}:`, err);
          // Si hay error 404, significa que la API no existe en este ambiente
          if (err.status === 404) {
            console.warn(`⚠️ API endpoint not found in ${currentEnv} environment`);
          }
        }
      });
    });
  }

  loadTableDataForViewer() {
    if (!this.selectedDbTable) {
      return;
    }

    this.loadingTable = true;
    this.dbTableData = [];

    // Cargar esquema si no existe
    if (!this.dbTableSchemas[this.selectedDbTable]) {
      this.algorithmService.getTableSchema(this.selectedDbTable, this.getCurrentApiUrl()).subscribe({
        next: (schemaResponse) => {
          if (schemaResponse.ok) {
            this.dbTableSchemas[this.selectedDbTable] = schemaResponse.data;
            this.loadTableRecords();
          } else {
            this.loadingTable = false;
          }
        },
        error: (err) => {
          console.error('Error loading schema for viewer:', err);
          this.loadingTable = false;
        }
      });
    } else {
      this.loadTableRecords();
    }
  }

  loadTableRecords() {
    // Cargar datos de la tabla (limitados a 50 registros para simular consulta)
    this.algorithmService.getRecords(this.selectedDbTable, { page: 1, limit: 50 }, this.getCurrentApiUrl()).subscribe({
      next: (response) => {
        this.loadingTable = false;
        if (response.ok) {
          this.dbTableData = response.data;
        } else {
          this.dbTableData = [];
        }
      },
      error: (err) => {
        console.error('Error loading table data for viewer:', err);
        this.loadingTable = false;
        this.dbTableData = [];
      }
    });
  }

  getDbColumns(): string[] {
    if (!this.selectedDbTable || !this.dbTableSchemas[this.selectedDbTable]) {
      return [];
    }
    return this.dbTableSchemas[this.selectedDbTable].columns;
  }

  trackByColumn(index: number, column: string): string {
    return column;
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 47) + '...';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  formatEditValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  getDbColumnType(column: string): string {
    if (!this.selectedDbTable || !this.dbTableSchemas[this.selectedDbTable]) {
      return 'string';
    }
    return this.dbTableSchemas[this.selectedDbTable].types[column] || 'string';
  }

  formatDbDateTime(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatDbNumber(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return value.toString();
    return num.toLocaleString('es-ES', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 6 
    });
  }

  trackByDbRow(index: number, row: any): any {
    if (!this.selectedDbTable || !this.dbTableSchemas[this.selectedDbTable] || !row) {
      return index;
    }
    
    const schema = this.dbTableSchemas[this.selectedDbTable];
    if (schema && schema.pk && row.hasOwnProperty(schema.pk)) {
      return row[schema.pk];
    }
    return index;
  }

  // Inline Editing Methods

  isColumnEditable(column: string): boolean {
    if (!this.selectedDbTable || !this.dbTableSchemas[this.selectedDbTable]) {
      return false;
    }
    
    const schema = this.dbTableSchemas[this.selectedDbTable];
    // No permitir editar clave primaria, created_at, updated_at
    return column !== schema.pk && 
           column !== 'created_at' && 
           column !== 'updated_at';
  }

  isEditingCell(rowIndex: number, column: string): boolean {
    return this.editingCell !== null && 
           this.editingCell.rowIndex === rowIndex && 
           this.editingCell.column === column;
  }

  isRowBeingEdited(rowIndex: number): boolean {
    return this.editingCell !== null && this.editingCell.rowIndex === rowIndex;
  }

  getEditTooltip(column: string): string {
    if (!this.isColumnEditable(column)) {
      return 'Campo no editable';
    }
    return 'Doble click para editar | Click en el ícono para editar';
  }

  startEditing(rowIndex: number, column: string, row: any) {
    if (!this.isColumnEditable(column) || this.savingChanges) {
      return;
    }

    // Cancelar edición previa si existe
    this.cancelEdit();

    this.editingCell = { rowIndex, column };
    this.editingValue = row[column];
    
    // Guardar valor original para rollback
    this.originalValues = { ...row };

    // Formatear valor para edición según el tipo
    const columnType = this.getDbColumnType(column);
    if (columnType === 'datetime' && this.editingValue) {
      // Convertir a formato datetime-local
      const date = new Date(this.editingValue);
      this.editingValue = date.toISOString().slice(0, 16);
    }

    // Focus al input después del siguiente ciclo de detección de cambios
    setTimeout(() => {
      const input = document.querySelector('.db-edit-input') as HTMLInputElement;
      if (input) {
        input.focus();
        if (columnType === 'string') {
          input.select();
        }
      }
    }, 10);
  }

  cancelEdit() {
    this.editingCell = null;
    this.editingValue = null;
    this.originalValues = {};
  }

  saveEdit(row: any) {
    if (!this.editingCell || this.savingChanges) {
      return;
    }

    const { rowIndex, column } = this.editingCell;
    const newValue = this.editingValue;
    const oldValue = row[column];

    // Verificar si hay cambios
    if (newValue === oldValue) {
      this.cancelEdit();
      return;
    }

    // Validar el valor según el tipo
    if (!this.validateEditValue(column, newValue)) {
      return; // No cancelar, permitir al usuario corregir
    }

    this.savingChanges = true;

    // Preparar datos para envío
    const updatedData = { ...row };
    
    // Formatear valor según tipo antes de enviar
    const columnType = this.getDbColumnType(column);
    switch (columnType) {
      case 'int':
        updatedData[column] = parseInt(newValue, 10);
        break;
      case 'decimal':
        updatedData[column] = parseFloat(newValue);
        break;
      case 'datetime':
        if (newValue) {
          updatedData[column] = new Date(newValue).toISOString();
        }
        break;
      case 'boolean':
        updatedData[column] = Boolean(newValue);
        break;
      default:
        updatedData[column] = newValue;
        break;
    }

    // Obtener ID del registro
    const schema = this.dbTableSchemas[this.selectedDbTable];
    const recordId = row[schema.pk];

    // Enviar actualización al servidor
    this.algorithmService.updateRecord(this.selectedDbTable, recordId, updatedData, this.getCurrentApiUrl()).subscribe({
      next: (response) => {
        this.savingChanges = false;
        if (response.ok) {
          // Actualizar el registro en la tabla local
          this.dbTableData[rowIndex] = { ...this.dbTableData[rowIndex], ...updatedData };
          this.cancelEdit();
          
          // Mostrar notificación de éxito (opcional)
          this.showUpdateNotification('success', `Campo ${column} actualizado exitosamente`);
        } else {
          this.showUpdateNotification('error', 'Error al actualizar el campo');
          this.cancelEdit();
        }
      },
      error: (err) => {
        this.savingChanges = false;
        console.error('Error updating record:', err);
        this.showUpdateNotification('error', 'Error al actualizar el campo');
        this.cancelEdit();
      }
    });
  }

  validateEditValue(column: string, value: any): boolean {
    const columnType = this.getDbColumnType(column);
    
    switch (columnType) {
      case 'int':
        const intValue = parseInt(value, 10);
        if (isNaN(intValue)) {
          this.showUpdateNotification('error', 'Valor debe ser un número entero');
          return false;
        }
        break;
      case 'decimal':
        const floatValue = parseFloat(value);
        if (isNaN(floatValue)) {
          this.showUpdateNotification('error', 'Valor debe ser un número decimal');
          return false;
        }
        break;
      case 'datetime':
        if (value && isNaN(Date.parse(value))) {
          this.showUpdateNotification('error', 'Formato de fecha inválido');
          return false;
        }
        break;
    }
    
    return true;
  }

  showUpdateNotification(type: 'success' | 'error', message: string) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
    notification.style.cssText = `
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
      animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'} me-2"></i>
      ${message}
    `;

    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  async exportToPDF() {
    this.loading = true;
    
    try {
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      
      // Configuración inicial
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;
      
      // Título del documento
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte de Parámetros del Algoritmo', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      
      // Información general
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, yPosition);
      yPosition += 8;
      doc.text(`Ambiente: ${this.selectedEnvironment.toUpperCase()}`, 14, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      doc.text(`API URL: ${this.getCurrentApiUrl()}`, 14, yPosition);
      yPosition += 8;
      doc.setFontSize(12);
      doc.text(`Total de tablas: ${this.tableConfigs.length}`, 14, yPosition);
      yPosition += 15;
      
      // Procesar cada tabla
      for (const table of this.tableConfigs) {
        // Verificar si necesitamos nueva página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Título de la tabla
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(table.displayName, 14, yPosition);
        yPosition += 6;
        
        // Información de la tabla
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tabla: ${table.name}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Descripción: ${table.description}`, 14, yPosition);
        yPosition += 8;
        
        try {
          // Obtener esquema y datos de la tabla
          const [schemaResponse, recordsResponse] = await Promise.all([
            this.algorithmService.getTableSchema(table.name, this.getCurrentApiUrl()).toPromise(),
            this.algorithmService.getRecords(table.name, { limit: 100 }, this.getCurrentApiUrl()).toPromise()
          ]);
          
          if (schemaResponse?.ok && recordsResponse?.ok) {
            const schema = schemaResponse.data;
            const records = recordsResponse.data;
            
            // Información del esquema
            doc.text(`Columnas: ${schema.columns.join(', ')}`, 14, yPosition);
            yPosition += 5;
            doc.text(`Clave primaria: ${schema.pk}`, 14, yPosition);
            yPosition += 5;
            doc.text(`Total de registros: ${recordsResponse.pagination.total}`, 14, yPosition);
            yPosition += 10;
            
            // Tabla de datos (solo primeros 10 registros para evitar páginas muy largas)
            if (records.length > 0) {
              const displayRecords = records.slice(0, 10);
              const columns = schema.columns.slice(0, 6); // Limitar columnas para que quepa en PDF
              
              const tableData = displayRecords.map(record => 
                columns.map(col => {
                  const value = record[col];
                  if (value === null || value === undefined) return '-';
                  if (typeof value === 'string' && value.length > 20) return value.substring(0, 17) + '...';
                  return String(value);
                })
              );
              
              (doc as any).autoTable({
                head: [columns],
                body: tableData,
                startY: yPosition,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185] },
                margin: { left: 14, right: 14 },
                didDrawPage: (data: any) => {
                  yPosition = data.cursor.y + 10;
                }
              });
              
              yPosition += 5;
              if (records.length > 10) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                doc.text(`... y ${records.length - 10} registros más`, 14, yPosition);
                yPosition += 8;
              }
            } else {
              doc.setFont('helvetica', 'italic');
              doc.text('No hay datos disponibles', 14, yPosition);
              yPosition += 8;
            }
            
          } else {
            doc.setFont('helvetica', 'italic');
            doc.text('Error al obtener información de la tabla', 14, yPosition);
            yPosition += 8;
          }
        } catch (error) {
          doc.setFont('helvetica', 'italic');
          doc.text('Error al cargar datos de la tabla', 14, yPosition);
          yPosition += 8;
        }
        
        yPosition += 5;
      }
      
      // Pie de página en todas las páginas
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 30, doc.internal.pageSize.height - 10);
        doc.text('Generado por CrediBusiness', 14, doc.internal.pageSize.height - 10);
      }
      
      // Guardar el PDF
      const fileName = `parametros-algoritmo-${this.selectedEnvironment}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      this.showUpdateNotification('success', 'PDF generado exitosamente');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.showUpdateNotification('error', 'Error al generar el PDF');
    } finally {
      this.loading = false;
    }
  }
}