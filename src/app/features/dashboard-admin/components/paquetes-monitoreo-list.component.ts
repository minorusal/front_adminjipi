import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DashboardAdminService } from '../services/dashboard-admin.service';
import { PaquetesMonitoreoFacade } from '../facades/paquetes-monitoreo.facade';
import {
  PaqueteMonitoreo,
  ConfiguracionPrecioMonitoreo,
  ActualizarPrecioMonitoreoRequest,
  ActualizarParametroMonitoreoRequest
} from '../types/paquetes.types';
import { environment as environmentQA } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-paquetes-monitoreo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="paquetes-monitoreo-container">
      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-info" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="text-muted mt-2">Cargando paquetes...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
        <button type="button" class="btn-close" (click)="clearError()"></button>
      </div>

      <!-- Filtros -->
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="row align-items-end">
            <div class="col-md-3">
              <label class="form-label fw-bold">Modalidad</label>
              <select class="form-select" [(ngModel)]="filtroModalidad" (change)="aplicarFiltros()">
                <option value="">Todas</option>
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div class="col-md-3">
              <div class="form-check mt-4">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="incluirParametros"
                  [(ngModel)]="incluirParametros"
                  (change)="aplicarFiltros()">
                <label class="form-check-label" for="incluirParametros">
                  Incluir configuraciones de precios
                </label>
              </div>
            </div>
            <div class="col-md-6 text-end">
              <button class="btn btn-info text-white" (click)="recargar()">
                <i class="fas fa-sync-alt me-2"></i>
                Recargar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuraciones Globales -->
      <div *ngIf="configuraciones.length > 0" class="card shadow-sm mb-4">
        <div class="card-header bg-light">
          <h5 class="mb-0">
            <i class="fas fa-cog me-2"></i>
            Configuraciones Globales de Precios
          </h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Parámetro</th>
                  <th>Valor Actual</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let config of configuraciones">
                  <td class="fw-bold">{{ config.nombre_parametro }}</td>
                  <td>
                    <span class="badge bg-info">{{ config.valor }}</span>
                  </td>
                  <td>
                    <span class="badge bg-secondary">{{ config.tipo }}</span>
                  </td>
                  <td class="text-muted small">{{ config.descripcion }}</td>
                  <td>
                    <span class="badge" [class.bg-success]="config.activo === 1" [class.bg-danger]="config.activo === 0">
                      {{ config.activo === 1 ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn btn-sm btn-outline-info"
                      (click)="editarConfiguracion(config)"
                      [disabled]="loading">
                      <i class="fas fa-edit"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Lista de Paquetes -->
      <div class="row">
        <div class="col-md-6 col-lg-4 mb-4" *ngFor="let paquete of paquetes">
          <div class="card shadow-sm h-100 border-left-info">
            <div class="card-header bg-gradient-info text-white">
              <h5 class="mb-0">{{ paquete.nombre_paquete }}</h5>
            </div>
            <div class="card-body">
              <p class="text-muted">{{ paquete.descripcion }}</p>

              <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Precio Mensual:</span>
                  <span class="fw-bold text-primary">{{ formatCurrency(paquete.precio_mensual) }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Precio Anual:</span>
                  <span class="fw-bold text-success">{{ formatCurrency(paquete.precio_anual) }}</span>
                </div>
              </div>

              <hr>

              <div class="mb-3">
                <div class="alert alert-info py-2 mb-2">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="small fw-bold">Rango de Clientes:</span>
                    <span class="badge bg-info">
                      {{ paquete.clientes_min }} - {{ paquete.clientes_max }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <span
                  class="badge w-100 py-2"
                  [class.bg-success]="paquete.activo === 1"
                  [class.bg-danger]="paquete.activo === 0">
                  {{ paquete.activo === 1 ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </div>

              <div class="d-grid gap-2">
                <button
                  class="btn btn-sm btn-outline-info"
                  (click)="editarPaquete(paquete)"
                  [disabled]="loading">
                  <i class="fas fa-edit me-2"></i>
                  Editar Parámetros
                </button>
              </div>
            </div>
            <div class="card-footer bg-light text-muted small">
              <i class="fas fa-clock me-1"></i>
              Actualizado: {{ formatDate(paquete.updated_at) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Sin resultados -->
      <div *ngIf="!loading && paquetes.length === 0" class="text-center py-5">
        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
        <p class="text-muted">No se encontraron paquetes</p>
      </div>
    </div>

    <!-- Modal Editar Configuración -->
    <div class="modal fade" [class.show]="showModalConfiguracion" [style.display]="showModalConfiguracion ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title">
              <i class="fas fa-cog me-2"></i>
              Actualizar Configuración Global
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="cerrarModalConfiguracion()"></button>
          </div>
          <div class="modal-body" *ngIf="configuracionEditando">
            <div class="mb-3">
              <label class="form-label fw-bold">Parámetro</label>
              <input type="text" class="form-control" [value]="configuracionEditando.nombre_parametro" disabled>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Tipo</label>
              <input type="text" class="form-control" [value]="configuracionEditando.tipo" disabled>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Descripción</label>
              <textarea class="form-control" rows="2" [value]="configuracionEditando.descripcion" disabled></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Nuevo Valor *</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="nuevoValorConfiguracion"
                placeholder="Ingrese el nuevo valor">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cerrarModalConfiguracion()" [disabled]="loading">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-info text-white"
              (click)="guardarConfiguracion()"
              [disabled]="loading || !nuevoValorConfiguracion">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Editar Paquete -->
    <div class="modal fade" [class.show]="showModalPaquete" [style.display]="showModalPaquete ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title">
              <i class="fas fa-edit me-2"></i>
              Editar Todos los Parámetros del Paquete
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="cerrarModalPaquete()"></button>
          </div>
          <div class="modal-body" *ngIf="paqueteEditando && formularioPaquete">
            <div class="alert alert-info mb-4">
              <i class="fas fa-info-circle me-2"></i>
              <strong>Editando:</strong> {{ paqueteEditando.nombre_paquete }}
              <br>
              <small>Modifica los campos que necesites y guarda los cambios. Todos los campos se actualizarán simultáneamente.</small>
            </div>

            <div class="row">
              <!-- Sección de Precios -->
              <div class="col-md-6 mb-4">
                <div class="card border-info">
                  <div class="card-header bg-info text-white">
                    <h6 class="mb-0"><i class="fas fa-dollar-sign me-2"></i>Precios</h6>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label class="form-label fw-bold">Precio Mensual *</label>
                      <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="formularioPaquete.precio_mensual"
                          step="0.01"
                          min="0"
                          placeholder="0.00">
                        <span class="input-group-text">MXN</span>
                      </div>
                      <small class="text-muted">Valor actual: {{ formatCurrency(paqueteEditando.precio_mensual) }}</small>
                    </div>

                    <div class="mb-0">
                      <label class="form-label fw-bold">Precio Anual *</label>
                      <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="formularioPaquete.precio_anual"
                          step="0.01"
                          min="0"
                          placeholder="0.00">
                        <span class="input-group-text">MXN</span>
                      </div>
                      <small class="text-muted">Valor actual: {{ formatCurrency(paqueteEditando.precio_anual) }}</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sección de Clientes -->
              <div class="col-md-6 mb-4">
                <div class="card border-success">
                  <div class="card-header bg-success text-white">
                    <h6 class="mb-0"><i class="fas fa-users me-2"></i>Configuración de Clientes</h6>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label class="form-label fw-bold">Clientes Mínimos *</label>
                      <input
                        type="number"
                        class="form-control"
                        [(ngModel)]="formularioPaquete.clientes_min"
                        min="0"
                        step="1"
                        placeholder="Cantidad mínima de clientes">
                      <small class="text-muted">Valor actual: {{ paqueteEditando.clientes_min }}</small>
                    </div>

                    <div class="mb-3">
                      <label class="form-label fw-bold">Clientes Máximos *</label>
                      <input
                        type="number"
                        class="form-control"
                        [(ngModel)]="formularioPaquete.clientes_max"
                        min="0"
                        step="1"
                        placeholder="Cantidad máxima de clientes">
                      <small class="text-muted">Valor actual: {{ paqueteEditando.clientes_max }}</small>
                    </div>

                    <div class="mb-0">
                      <label class="form-label fw-bold">Estado del Paquete *</label>
                      <select class="form-select" [(ngModel)]="formularioPaquete.activo">
                        <option [value]="1">Activo</option>
                        <option [value]="0">Inactivo</option>
                      </select>
                      <small class="text-muted">
                        Valor actual:
                        <span class="badge ms-1" [class.bg-success]="paqueteEditando.activo === 1" [class.bg-danger]="paqueteEditando.activo === 0">
                          {{ paqueteEditando.activo === 1 ? 'ACTIVO' : 'INACTIVO' }}
                        </span>
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Resumen de cambios -->
            <div class="alert alert-warning" *ngIf="hayCambios()">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>Hay cambios pendientes de guardar</strong>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cerrarModalPaquete()" [disabled]="loading">
              <i class="fas fa-times me-2"></i>
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-info text-white"
              (click)="guardarTodosLosParametros()"
              [disabled]="loading || !formularioValido()">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i *ngIf="!loading" class="fas fa-save me-2"></i>
              Guardar Todos los Cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade" [class.show]="showModalConfiguracion || showModalPaquete" *ngIf="showModalConfiguracion || showModalPaquete"></div>
  `,
  styles: [`
    .border-left-info {
      border-left: 4px solid #36b9cc;
    }

    .bg-gradient-info {
      background: linear-gradient(135deg, #36b9cc 0%, #258391 100%);
    }

    .card:hover {
      transform: translateY(-5px);
      transition: all 0.3s ease;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }

    .modal.show {
      display: block;
      background-color: rgba(0, 0, 0, 0.5);
    }

    .modal-backdrop.show {
      opacity: 0.5;
    }
  `]
})
export class PaquetesMonitoreoListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  paquetes: PaqueteMonitoreo[] = [];
  configuraciones: ConfiguracionPrecioMonitoreo[] = [];
  loading = false;
  error: string | null = null;

  // Filtros
  filtroModalidad: 'mensual' | 'anual' | '' = '';
  incluirParametros = true;

  // Modales
  showModalConfiguracion = false;
  showModalPaquete = false;
  configuracionEditando: ConfiguracionPrecioMonitoreo | null = null;
  paqueteEditando: PaqueteMonitoreo | null = null;
  nuevoValorConfiguracion = '';
  parametroSeleccionado = '';
  nuevoValorParametro = '';

  // Formulario completo para edición
  formularioPaquete: {
    precio_mensual: number;
    precio_anual: number;
    clientes_min: number;
    clientes_max: number;
    activo: number;
  } | null = null;

  // Environment
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environmentQA.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  constructor(
    public dashboardService: DashboardAdminService,
    private facade: PaquetesMonitoreoFacade
  ) {}

  ngOnInit(): void {
    this.facade.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
    });

    this.facade.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      this.error = error;
    });

    this.facade.paquetesDisponibles$.pipe(takeUntil(this.destroy$)).subscribe(paquetes => {
      this.paquetes = paquetes;
    });

    this.facade.configuracionesPrecios$.pipe(takeUntil(this.destroy$)).subscribe(configs => {
      this.configuraciones = configs;
    });

    this.aplicarFiltros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentBaseUrl(): string {
    return this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
  }

  aplicarFiltros(): void {
    const baseUrl = this.getCurrentBaseUrl();
    this.facade.cargarPaquetesDisponibles(baseUrl, {
      modalidad: this.filtroModalidad || undefined,
      incluir_parametros: this.incluirParametros
    });
  }

  recargar(): void {
    this.aplicarFiltros();
  }

  clearError(): void {
    this.facade.clearError();
  }

  editarConfiguracion(config: ConfiguracionPrecioMonitoreo): void {
    this.configuracionEditando = config;
    this.nuevoValorConfiguracion = '';
    this.showModalConfiguracion = true;
  }

  cerrarModalConfiguracion(): void {
    this.showModalConfiguracion = false;
    this.configuracionEditando = null;
    this.nuevoValorConfiguracion = '';
  }

  guardarConfiguracion(): void {
    if (!this.configuracionEditando || !this.nuevoValorConfiguracion) return;

    const payload: ActualizarPrecioMonitoreoRequest = {
      tipo_configuracion: this.configuracionEditando.tipo,
      valor: this.nuevoValorConfiguracion,
      nombre_parametro: this.configuracionEditando.nombre_parametro
    };

    const baseUrl = this.getCurrentBaseUrl();
    this.facade.actualizarPrecio(baseUrl, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          alert('Configuración actualizada exitosamente');
          this.cerrarModalConfiguracion();
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (err) => {
        alert('Error al actualizar: ' + err.message);
      }
    });
  }

  editarPaquete(paquete: PaqueteMonitoreo): void {
    this.paqueteEditando = paquete;
    // Inicializar formulario con los valores actuales
    this.formularioPaquete = {
      precio_mensual: parseFloat(paquete.precio_mensual),
      precio_anual: parseFloat(paquete.precio_anual),
      clientes_min: paquete.clientes_min,
      clientes_max: paquete.clientes_max,
      activo: paquete.activo
    };
    this.showModalPaquete = true;
  }

  cerrarModalPaquete(): void {
    this.showModalPaquete = false;
    this.paqueteEditando = null;
    this.formularioPaquete = null;
  }

  hayCambios(): boolean {
    if (!this.paqueteEditando || !this.formularioPaquete) return false;

    return (
      this.formularioPaquete.precio_mensual !== parseFloat(this.paqueteEditando.precio_mensual) ||
      this.formularioPaquete.precio_anual !== parseFloat(this.paqueteEditando.precio_anual) ||
      this.formularioPaquete.clientes_min !== this.paqueteEditando.clientes_min ||
      this.formularioPaquete.clientes_max !== this.paqueteEditando.clientes_max ||
      this.formularioPaquete.activo !== this.paqueteEditando.activo
    );
  }

  formularioValido(): boolean {
    if (!this.formularioPaquete) return false;

    return (
      this.formularioPaquete.precio_mensual >= 0 &&
      this.formularioPaquete.precio_anual >= 0 &&
      this.formularioPaquete.clientes_min >= 0 &&
      this.formularioPaquete.clientes_max >= 0 &&
      this.formularioPaquete.clientes_min <= this.formularioPaquete.clientes_max &&
      (this.formularioPaquete.activo === 0 || this.formularioPaquete.activo === 1)
    );
  }

  guardarTodosLosParametros(): void {
    if (!this.paqueteEditando || !this.formularioPaquete || !this.formularioValido()) return;

    const baseUrl = this.getCurrentBaseUrl();
    const paqueteId = this.paqueteEditando.id;

    // Crear array de actualizaciones para todos los parámetros que cambiaron
    const actualizaciones = [];

    if (this.formularioPaquete.precio_mensual !== parseFloat(this.paqueteEditando.precio_mensual)) {
      actualizaciones.push({ parametro: 'precio_mensual', valor: this.formularioPaquete.precio_mensual });
    }
    if (this.formularioPaquete.precio_anual !== parseFloat(this.paqueteEditando.precio_anual)) {
      actualizaciones.push({ parametro: 'precio_anual', valor: this.formularioPaquete.precio_anual });
    }
    if (this.formularioPaquete.clientes_min !== this.paqueteEditando.clientes_min) {
      actualizaciones.push({ parametro: 'clientes_min', valor: this.formularioPaquete.clientes_min });
    }
    if (this.formularioPaquete.clientes_max !== this.paqueteEditando.clientes_max) {
      actualizaciones.push({ parametro: 'clientes_max', valor: this.formularioPaquete.clientes_max });
    }
    if (this.formularioPaquete.activo !== this.paqueteEditando.activo) {
      actualizaciones.push({ parametro: 'activo', valor: this.formularioPaquete.activo });
    }

    if (actualizaciones.length === 0) {
      alert('No hay cambios para guardar');
      return;
    }

    // Guardar todas las actualizaciones secuencialmente
    this.guardarActualizacionesSecuenciales(baseUrl, paqueteId, actualizaciones, 0);
  }

  private guardarActualizacionesSecuenciales(
    baseUrl: string,
    paqueteId: number,
    actualizaciones: { parametro: string; valor: any }[],
    index: number
  ): void {
    if (index >= actualizaciones.length) {
      alert(`¡Éxito! Todos los parámetros (${actualizaciones.length}) fueron actualizados correctamente.`);
      this.cerrarModalPaquete();
      this.recargar();
      return;
    }

    const actualizacion = actualizaciones[index];
    const payload: ActualizarParametroMonitoreoRequest = {
      id_paquete: paqueteId,
      parametro: actualizacion.parametro,
      valor: actualizacion.valor
    };

    this.facade.actualizarParametro(baseUrl, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          // Continuar con la siguiente actualización
          this.guardarActualizacionesSecuenciales(baseUrl, paqueteId, actualizaciones, index + 1);
        } else {
          alert(`Error al actualizar ${actualizacion.parametro}: ${response.message}`);
        }
      },
      error: (err) => {
        alert(`Error al actualizar ${actualizacion.parametro}: ${err.message}`);
      }
    });
  }

  guardarParametro(): void {
    if (!this.paqueteEditando || !this.parametroSeleccionado || !this.nuevoValorParametro) return;

    const payload: ActualizarParametroMonitoreoRequest = {
      id_paquete: this.paqueteEditando.id,
      parametro: this.parametroSeleccionado,
      valor: this.parametroSeleccionado === 'activo' ? parseInt(this.nuevoValorParametro) : this.nuevoValorParametro
    };

    const baseUrl = this.getCurrentBaseUrl();
    this.facade.actualizarParametro(baseUrl, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          alert('Parámetro actualizado exitosamente');
          this.cerrarModalPaquete();
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (err) => {
        alert('Error al actualizar: ' + err.message);
      }
    });
  }

  obtenerValorActual(parametro: string, paquete: PaqueteMonitoreo): string {
    switch (parametro) {
      case 'clientes_min':
        return paquete.clientes_min.toString();
      case 'clientes_max':
        return paquete.clientes_max.toString();
      case 'precio_mensual':
        return this.formatCurrency(paquete.precio_mensual);
      case 'precio_anual':
        return this.formatCurrency(paquete.precio_anual);
      case 'activo':
        return paquete.activo === 1 ? '1 (Activo)' : '0 (Inactivo)';
      default:
        return '';
    }
  }

  formatCurrency(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return this.dashboardService.formatCurrency(numValue);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
