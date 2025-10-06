import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlgorithmService } from '../services/algorithm.service';
import { 
  CatalogRecord, 
  TableSchema,
  AVAILABLE_TABLES
} from '../types/algorithm.types';

@Component({
  selector: 'app-record-form',
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
            {{ isEditMode ? 'Editar' : 'Crear' }} {{ tableConfig?.displayName || tableName }}
          </h2>
        </div>
        <div class="d-flex gap-2">
          <button 
            class="btn btn-success" 
            (click)="saveRecord()" 
            [disabled]="saving || !isFormValid()">
            <i class="fas fa-save me-1"></i>
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
          <button class="btn btn-secondary" (click)="goBack()">
            <i class="fas fa-times me-1"></i>
            Cancelar
          </button>
        </div>
      </div>

      <!-- Loading Schema -->
      <div *ngIf="loadingSchema" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando esquema...</span>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <!-- Form -->
      <div *ngIf="!loadingSchema && schema" class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-edit me-2"></i>
                Información del Registro
              </h5>
            </div>
            <div class="card-body">
              <form (ngSubmit)="saveRecord()" #recordForm="ngForm">
                <div class="row">
                  <!-- Dynamic form fields -->
                  <div 
                    class="col-md-6 mb-3" 
                    *ngFor="let column of getEditableColumns()"
                    [class.col-md-12]="isLongTextField(column)">
                    <label [for]="column" class="form-label">
                      {{ column }}
                      <span class="text-danger" *ngIf="isRequired(column)">*</span>
                      <small class="text-muted ms-1">({{ getColumnType(column) }})</small>
                    </label>

                    <!-- Text/String fields -->
                    <input
                      *ngIf="getColumnType(column) === 'string'"
                      [id]="column"
                      type="text"
                      class="form-control"
                      [(ngModel)]="formData[column]"
                      [name]="column"
                      [required]="isRequired(column)"
                      [placeholder]="'Ingrese ' + column">

                    <!-- Numeric fields -->
                    <input
                      *ngIf="getColumnType(column) === 'int'"
                      [id]="column"
                      type="number"
                      class="form-control"
                      [(ngModel)]="formData[column]"
                      [name]="column"
                      [required]="isRequired(column)"
                      step="1"
                      [placeholder]="'Ingrese ' + column">

                    <!-- Decimal fields -->
                    <input
                      *ngIf="getColumnType(column) === 'decimal'"
                      [id]="column"
                      type="number"
                      class="form-control"
                      [(ngModel)]="formData[column]"
                      [name]="column"
                      [required]="isRequired(column)"
                      step="0.01"
                      [placeholder]="'Ingrese ' + column">

                    <!-- Boolean fields -->
                    <div *ngIf="getColumnType(column) === 'boolean'" class="form-check">
                      <input
                        [id]="column"
                        type="checkbox"
                        class="form-check-input"
                        [(ngModel)]="formData[column]"
                        [name]="column">
                      <label class="form-check-label" [for]="column">
                        Habilitado
                      </label>
                    </div>

                    <!-- Datetime fields -->
                    <input
                      *ngIf="getColumnType(column) === 'datetime'"
                      [id]="column"
                      type="datetime-local"
                      class="form-control"
                      [(ngModel)]="formData[column]"
                      [name]="column"
                      [required]="isRequired(column)">

                    <!-- Field validation messages -->
                    <div class="invalid-feedback" *ngIf="isRequired(column) && !formData[column]">
                      Este campo es requerido
                    </div>
                  </div>
                </div>

                <!-- Primary Key Display (for edit mode) -->
                <div *ngIf="isEditMode && schema.pk" class="alert alert-info">
                  <strong>ID:</strong> {{ formData[schema.pk] }}
                </div>

                <!-- Required fields info -->
                <div class="alert alert-light border">
                  <h6 class="mb-2">
                    <i class="fas fa-info-circle me-1"></i>
                    Campos Requeridos:
                  </h6>
                  <div class="d-flex flex-wrap gap-2">
                    <span 
                      class="badge bg-danger" 
                      *ngFor="let field of schema.required">
                      {{ field }}
                    </span>
                  </div>
                </div>

                <!-- Form actions -->
                <div class="d-flex justify-content-between align-items-center mt-4">
                  <div>
                    <small class="text-muted">
                      Los campos marcados con <span class="text-danger">*</span> son obligatorios
                    </small>
                  </div>
                  <div class="d-flex gap-2">
                    <button 
                      type="button" 
                      class="btn btn-outline-warning"
                      (click)="resetForm()"
                      [disabled]="saving">
                      <i class="fas fa-undo me-1"></i>
                      Restablecer
                    </button>
                    <button 
                      type="submit" 
                      class="btn btn-success"
                      [disabled]="saving || !isFormValid()">
                      <i class="fas fa-save me-1"></i>
                      {{ saving ? 'Guardando...' : 'Guardar' }}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Modal -->
      <div *ngIf="showSuccessModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title">
                <i class="fas fa-check-circle me-2"></i>
                Éxito
              </h5>
            </div>
            <div class="modal-body">
              <p class="mb-0">
                {{ isEditMode ? 'Registro actualizado' : 'Registro creado' }} exitosamente.
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-success" (click)="closeSuccessModal()">
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-label {
      font-weight: 500;
    }
    
    .text-danger {
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
    
    .invalid-feedback {
      display: block;
    }
    
    .badge {
      font-size: 0.75em;
    }
  `]
})
export class RecordFormComponent implements OnInit {
  tableName = '';
  recordId: number | null = null;
  isEditMode = false;
  tableConfig: any = null;
  schema: TableSchema | null = null;
  formData: CatalogRecord = {};
  originalData: CatalogRecord = {};
  
  loadingSchema = false;
  saving = false;
  error: string | null = null;
  showSuccessModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private algorithmService: AlgorithmService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.tableName = params['table'];
      this.recordId = params['id'] ? parseInt(params['id'], 10) : null;
      this.isEditMode = !!this.recordId;
      
      this.tableConfig = AVAILABLE_TABLES.find(t => t.name === this.tableName);
      
      this.loadSchema();
    });
  }

  loadSchema() {
    this.loadingSchema = true;
    this.algorithmService.getTableSchema(this.tableName).subscribe({
      next: (response) => {
        this.loadingSchema = false;
        if (response.ok) {
          this.schema = response.data;
          this.initializeForm();
          
          if (this.isEditMode && this.recordId) {
            this.loadRecord();
          }
        } else {
          this.error = 'Error al cargar el esquema de la tabla';
        }
      },
      error: (err) => {
        this.loadingSchema = false;
        this.error = 'Error al cargar el esquema de la tabla';
        console.error('Error loading schema:', err);
      }
    });
  }

  loadRecord() {
    if (!this.recordId) return;

    this.algorithmService.getRecord(this.tableName, this.recordId).subscribe({
      next: (response) => {
        if (response.ok) {
          this.formData = { ...response.data };
          this.originalData = { ...response.data };
          
          // Format datetime fields for input
          this.getEditableColumns().forEach(column => {
            if (this.getColumnType(column) === 'datetime' && this.formData[column]) {
              const date = new Date(this.formData[column]);
              this.formData[column] = date.toISOString().slice(0, 16);
            }
          });
        } else {
          this.error = 'Error al cargar el registro';
        }
      },
      error: (err) => {
        this.error = 'Error al cargar el registro';
        console.error('Error loading record:', err);
      }
    });
  }

  initializeForm() {
    if (!this.schema) return;

    this.formData = {};
    this.schema.columns.forEach(column => {
      if (this.isEditableColumn(column)) {
        const type = this.getColumnType(column);
        
        switch (type) {
          case 'boolean':
            this.formData[column] = false;
            break;
          case 'int':
          case 'decimal':
            this.formData[column] = null;
            break;
          case 'string':
          case 'datetime':
          default:
            this.formData[column] = '';
            break;
        }
      }
    });
  }

  saveRecord() {
    if (!this.isFormValid() || this.saving) return;

    this.saving = true;
    this.error = null;

    const dataToSave = this.prepareDataForSave();

    const operation = this.isEditMode
      ? this.algorithmService.updateRecord(this.tableName, this.recordId!, dataToSave)
      : this.algorithmService.createRecord(this.tableName, dataToSave);

    operation.subscribe({
      next: (response) => {
        this.saving = false;
        if (response.ok) {
          this.showSuccessModal = true;
        } else {
          this.error = 'Error al guardar el registro';
        }
      },
      error: (err) => {
        this.saving = false;
        console.error('Error saving record:', err);
        
        if (err.error && err.error.error) {
          this.error = err.error.error;
        } else {
          this.error = 'Error al guardar el registro';
        }
      }
    });
  }

  prepareDataForSave(): Record<string, any> {
    const data: Record<string, any> = {};

    this.getEditableColumns().forEach(column => {
      const value = this.formData[column];
      
      if (value !== null && value !== undefined && value !== '') {
        const type = this.getColumnType(column);
        
        switch (type) {
          case 'int':
            data[column] = parseInt(value, 10);
            break;
          case 'decimal':
            data[column] = parseFloat(value);
            break;
          case 'boolean':
            data[column] = Boolean(value);
            break;
          case 'datetime':
            if (value) {
              data[column] = new Date(value).toISOString();
            }
            break;
          default:
            data[column] = value;
            break;
        }
      } else if (this.isRequired(column)) {
        // Required field is empty - this should be caught by validation
        return;
      }
    });

    return data;
  }

  resetForm() {
    if (this.isEditMode) {
      this.formData = { ...this.originalData };
    } else {
      this.initializeForm();
    }
  }

  isFormValid(): boolean {
    if (!this.schema) return false;

    return this.schema.required.every(field => {
      if (!this.isEditableColumn(field)) return true;
      
      const value = this.formData[field];
      return value !== null && value !== undefined && value !== '';
    });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.goBack();
  }

  goBack() {
    this.router.navigate(['/algoritmo/parametros/tabla', this.tableName]);
  }

  // Helper methods

  getEditableColumns(): string[] {
    if (!this.schema) return [];
    
    return this.schema.columns.filter(column => this.isEditableColumn(column));
  }

  isEditableColumn(column: string): boolean {
    if (!this.schema) return false;
    
    // Don't edit primary key, created_at, updated_at
    return column !== this.schema.pk && 
           column !== 'created_at' && 
           column !== 'updated_at';
  }

  getColumnType(column: string): string {
    return this.schema?.types[column] || 'string';
  }

  isRequired(column: string): boolean {
    return this.schema?.required.includes(column) || false;
  }

  isLongTextField(column: string): boolean {
    // Fields that should take full width
    const longFields = ['descripcion', 'description', 'observaciones', 'comentarios'];
    return longFields.some(field => column.toLowerCase().includes(field));
  }
}