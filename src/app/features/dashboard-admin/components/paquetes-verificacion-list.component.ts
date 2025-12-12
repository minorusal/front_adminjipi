import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DashboardAdminService } from '../services/dashboard-admin.service';
import { PaquetesVerificacionFacade } from '../facades/paquetes-verificacion.facade';
import {
  PaqueteVerificacion,
  ResumenPaquetesVerificacion,
  ActualizarPrecioVerificacionRequest,
  ActualizarConfiguracionVerificacionRequest,
  CambiarEstadoVerificacionRequest
} from '../types/paquetes.types';
import { environment as environmentQA } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-paquetes-verificacion-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="paquetes-verificacion-container">
      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-success" role="status">
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

      <!-- Estadísticas Resumen -->
      <div *ngIf="resumen && resumen.estadisticas" class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Total Paquetes</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ resumen.estadisticas.total_paquetes }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-box fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3 mb-3">
          <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Paquetes Activos</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ resumen.estadisticas.paquetes_activos }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3 mb-3">
          <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Suscripciones</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ resumen.estadisticas.total_suscripciones }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-users fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3 mb-3">
          <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">MRR Total</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ formatCurrency(resumen.estadisticas.mrr_total) }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="row align-items-end">
            <div class="col-md-3">
              <label class="form-label fw-bold">Tipo</label>
              <select class="form-select" [(ngModel)]="filtroTipo" (change)="aplicarFiltros()">
                <option value="">Todos</option>
                <option value="MENSUAL">Mensual</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
            <div class="col-md-9 text-end">
              <button class="btn btn-success me-2" (click)="cargarResumen()">
                <i class="fas fa-chart-bar me-2"></i>
                Ver Resumen
              </button>
              <button class="btn btn-outline-success" (click)="recargar()">
                <i class="fas fa-sync-alt me-2"></i>
                Recargar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de Paquetes -->
      <div class="row">
        <div class="col-md-6 col-lg-4 mb-4" *ngFor="let paquete of paquetes">
          <div class="card shadow-sm h-100 border-left-success">
            <div class="card-header bg-gradient-success text-white">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0">{{ paquete.nombre }}</h5>
                <span class="badge bg-light text-dark">{{ paquete.tipo }}</span>
              </div>
            </div>
            <div class="card-body">
              <p class="text-muted small">{{ paquete.descripcion }}</p>

              <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Precio:</span>
                  <span class="fw-bold text-success h5 mb-0">{{ formatCurrency(paquete.precio) }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Precio Trial:</span>
                  <span class="fw-bold text-info">{{ formatCurrency(paquete.precio_trial) }}</span>
                </div>
              </div>

              <hr>

              <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Días Trial:</span>
                  <span class="badge bg-warning text-dark">{{ paquete.dias_trial }} días</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Orden:</span>
                  <span class="badge bg-secondary">{{ paquete.orden }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2" *ngIf="paquete.suscripciones_activas !== undefined">
                  <span class="text-muted">Suscripciones:</span>
                  <span class="badge bg-primary">{{ paquete.suscripciones_activas }}</span>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label small text-muted fw-bold">Características:</label>
                <div class="caracteristicas-box p-2 bg-light rounded">
                  <small class="text-muted">{{ paquete.caracteristicas }}</small>
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
                  class="btn btn-sm btn-outline-success"
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

    <!-- Modal Editar Paquete Completo -->
    <div class="modal fade" [class.show]="showModalEditar" [style.display]="showModalEditar ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="fas fa-edit me-2"></i>
              Editar Todos los Parámetros del Paquete
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="cerrarModalEditar()"></button>
          </div>
          <div class="modal-body" *ngIf="paqueteEditando && formularioPaquete">
            <div class="alert alert-info mb-4">
              <i class="fas fa-info-circle me-2"></i>
              <strong>Editando:</strong> {{ paqueteEditando.nombre }}
              <br>
              <small>Modifica los campos que necesites y guarda los cambios. Todos los campos se actualizarán simultáneamente.</small>
            </div>

            <div class="row">
              <!-- Sección de Precios -->
              <div class="col-md-6 mb-4">
                <div class="card border-success">
                  <div class="card-header bg-success text-white">
                    <h6 class="mb-0"><i class="fas fa-dollar-sign me-2"></i>Precios</h6>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label class="form-label fw-bold">Precio Principal *</label>
                      <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="formularioPaquete.precio"
                          step="0.01"
                          min="0"
                          placeholder="0.00">
                        <span class="input-group-text">MXN</span>
                      </div>
                      <small class="text-muted">Valor actual: {{ formatCurrency(paqueteEditando.precio) }}</small>
                    </div>

                    <div class="mb-0">
                      <label class="form-label fw-bold">Precio Trial</label>
                      <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="formularioPaquete.precio_trial"
                          step="0.01"
                          min="0"
                          placeholder="0.00">
                        <span class="input-group-text">MXN</span>
                      </div>
                      <small class="text-muted">Valor actual: {{ formatCurrency(paqueteEditando.precio_trial) }}</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sección de Información Básica -->
              <div class="col-md-6 mb-4">
                <div class="card border-info">
                  <div class="card-header bg-info text-white">
                    <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Información Básica</h6>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label class="form-label fw-bold">Nombre del Paquete *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formularioPaquete.nombre"
                        placeholder="Nombre del paquete">
                      <small class="text-muted">Valor actual: {{ paqueteEditando.nombre }}</small>
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

              <!-- Sección de Descripción y Características -->
              <div class="col-md-12 mb-4">
                <div class="card border-primary">
                  <div class="card-header bg-primary text-white">
                    <h6 class="mb-0"><i class="fas fa-list me-2"></i>Descripción y Características</h6>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label class="form-label fw-bold">Descripción</label>
                      <textarea
                        class="form-control"
                        rows="3"
                        [(ngModel)]="formularioPaquete.descripcion"
                        placeholder="Descripción del paquete"></textarea>
                      <small class="text-muted">Valor actual: {{ paqueteEditando.descripcion }}</small>
                    </div>

                    <div class="mb-0">
                      <label class="form-label fw-bold">Características</label>
                      <textarea
                        class="form-control"
                        rows="3"
                        [(ngModel)]="formularioPaquete.caracteristicas"
                        placeholder="Características del paquete (separadas por comas o líneas)"></textarea>
                      <small class="text-muted">Valor actual: {{ paqueteEditando.caracteristicas }}</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sección de Configuración Adicional -->
              <div class="col-md-12 mb-4">
                <div class="card border-warning">
                  <div class="card-header bg-warning text-dark">
                    <h6 class="mb-0"><i class="fas fa-cog me-2"></i>Configuración Adicional</h6>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6 mb-3">
                        <label class="form-label fw-bold">Días de Prueba Gratis</label>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="formularioPaquete.dias_trial"
                          min="0"
                          step="1"
                          placeholder="Días de prueba">
                        <small class="text-muted">Valor actual: {{ paqueteEditando.dias_trial }} días</small>
                      </div>

                      <div class="col-md-6 mb-0">
                        <label class="form-label fw-bold">Orden de Visualización</label>
                        <input
                          type="number"
                          class="form-control"
                          [(ngModel)]="formularioPaquete.orden"
                          min="0"
                          step="1"
                          placeholder="Orden">
                        <small class="text-muted">Valor actual: {{ paqueteEditando.orden }}</small>
                      </div>
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
            <button type="button" class="btn btn-secondary" (click)="cerrarModalEditar()" [disabled]="loading">
              <i class="fas fa-times me-2"></i>
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-success"
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
    <div class="modal-backdrop fade" [class.show]="showModalEditar" *ngIf="showModalEditar"></div>
  `,
  styles: [`
    .border-left-success {
      border-left: 4px solid #1cc88a;
    }

    .border-left-primary {
      border-left: 4px solid #4e73df;
    }

    .border-left-info {
      border-left: 4px solid #36b9cc;
    }

    .bg-gradient-success {
      background: linear-gradient(135deg, #1cc88a 0%, #13855c 100%);
    }

    .card:hover {
      transform: translateY(-5px);
      transition: all 0.3s ease;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }

    .caracteristicas-box {
      max-height: 100px;
      overflow-y: auto;
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
export class PaquetesVerificacionListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  paquetes: PaqueteVerificacion[] = [];
  resumen: ResumenPaquetesVerificacion | null = null;
  loading = false;
  error: string | null = null;

  // Filtros
  filtroTipo: 'MENSUAL' | 'ANUAL' | '' = '';

  // Modales
  showModalEditar = false;
  paqueteEditando: PaqueteVerificacion | null = null;

  // Formulario completo para edición
  formularioPaquete: {
    precio: number;
    precio_trial: number;
    nombre: string;
    descripcion: string;
    caracteristicas: string;
    dias_trial: number;
    orden: number;
    activo: number;
  } | null = null;

  // Environment
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environmentQA.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  constructor(
    public dashboardService: DashboardAdminService,
    private facade: PaquetesVerificacionFacade
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

    this.facade.resumen$.pipe(takeUntil(this.destroy$)).subscribe(resumen => {
      this.resumen = resumen;
    });

    this.cargarResumen();
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
    this.facade.cargarPaquetesDisponibles(baseUrl, this.filtroTipo || undefined);
  }

  cargarResumen(): void {
    const baseUrl = this.getCurrentBaseUrl();
    this.facade.cargarResumen(baseUrl);
  }

  recargar(): void {
    this.cargarResumen();
  }

  clearError(): void {
    this.facade.clearError();
  }

  editarPaquete(paquete: PaqueteVerificacion): void {
    this.paqueteEditando = paquete;
    // Inicializar formulario con los valores actuales
    this.formularioPaquete = {
      precio: parseFloat(paquete.precio),
      precio_trial: parseFloat(paquete.precio_trial),
      nombre: paquete.nombre,
      descripcion: paquete.descripcion,
      caracteristicas: paquete.caracteristicas,
      dias_trial: paquete.dias_trial,
      orden: paquete.orden,
      activo: paquete.activo
    };
    this.showModalEditar = true;
  }

  cerrarModalEditar(): void {
    this.showModalEditar = false;
    this.paqueteEditando = null;
    this.formularioPaquete = null;
  }

  hayCambios(): boolean {
    if (!this.paqueteEditando || !this.formularioPaquete) return false;

    return (
      this.formularioPaquete.precio !== parseFloat(this.paqueteEditando.precio) ||
      this.formularioPaquete.precio_trial !== parseFloat(this.paqueteEditando.precio_trial) ||
      this.formularioPaquete.nombre !== this.paqueteEditando.nombre ||
      this.formularioPaquete.descripcion !== this.paqueteEditando.descripcion ||
      this.formularioPaquete.caracteristicas !== this.paqueteEditando.caracteristicas ||
      this.formularioPaquete.dias_trial !== this.paqueteEditando.dias_trial ||
      this.formularioPaquete.orden !== this.paqueteEditando.orden ||
      this.formularioPaquete.activo !== this.paqueteEditando.activo
    );
  }

  formularioValido(): boolean {
    if (!this.formularioPaquete) return false;

    return (
      this.formularioPaquete.precio >= 0 &&
      this.formularioPaquete.precio_trial >= 0 &&
      this.formularioPaquete.nombre.trim() !== '' &&
      this.formularioPaquete.dias_trial >= 0 &&
      this.formularioPaquete.orden >= 0 &&
      (this.formularioPaquete.activo === 0 || this.formularioPaquete.activo === 1)
    );
  }

  guardarTodosLosParametros(): void {
    if (!this.paqueteEditando || !this.formularioPaquete || !this.formularioValido()) return;

    const baseUrl = this.getCurrentBaseUrl();
    const paqueteId = this.paqueteEditando.id;

    // Primero actualizar precios si cambiaron
    const preciosCambiaron =
      this.formularioPaquete.precio !== parseFloat(this.paqueteEditando.precio) ||
      this.formularioPaquete.precio_trial !== parseFloat(this.paqueteEditando.precio_trial);

    // Luego actualizar configuración si cambió
    const configCambio =
      this.formularioPaquete.nombre !== this.paqueteEditando.nombre ||
      this.formularioPaquete.descripcion !== this.paqueteEditando.descripcion ||
      this.formularioPaquete.caracteristicas !== this.paqueteEditando.caracteristicas ||
      this.formularioPaquete.dias_trial !== this.paqueteEditando.dias_trial ||
      this.formularioPaquete.orden !== this.paqueteEditando.orden;

    // Estado cambió
    const estadoCambio = this.formularioPaquete.activo !== this.paqueteEditando.activo;

    if (!preciosCambiaron && !configCambio && !estadoCambio) {
      alert('No hay cambios para guardar');
      return;
    }

    // Guardar en secuencia: precios -> configuración -> estado
    this.guardarCambiosSecuenciales(baseUrl, paqueteId, preciosCambiaron, configCambio, estadoCambio);
  }

  private guardarCambiosSecuenciales(
    baseUrl: string,
    paqueteId: number,
    preciosCambiaron: boolean,
    configCambio: boolean,
    estadoCambio: boolean
  ): void {
    if (!this.formularioPaquete) return;

    // Step 1: Actualizar precios
    if (preciosCambiaron) {
      const payloadPrecio: ActualizarPrecioVerificacionRequest = {
        id_paquete: paqueteId,
        precio: this.formularioPaquete.precio.toString(),
        precio_trial: this.formularioPaquete.precio_trial.toString()
      };

      this.facade.actualizarPrecio(baseUrl, payloadPrecio).subscribe({
        next: (response) => {
          if (response.error) {
            alert('Error al actualizar precios: ' + response.message);
            return;
          }
          // Continuar con configuración
          if (configCambio) {
            this.guardarConfiguracionStep(baseUrl, paqueteId, estadoCambio);
          } else if (estadoCambio) {
            this.guardarEstadoStep(baseUrl, paqueteId);
          } else {
            this.finalizarGuardado(1);
          }
        },
        error: (err) => {
          alert('Error al actualizar precios: ' + err.message);
        }
      });
    } else if (configCambio) {
      this.guardarConfiguracionStep(baseUrl, paqueteId, estadoCambio);
    } else if (estadoCambio) {
      this.guardarEstadoStep(baseUrl, paqueteId);
    }
  }

  private guardarConfiguracionStep(baseUrl: string, paqueteId: number, estadoCambio: boolean): void {
    if (!this.formularioPaquete) return;

    const payloadConfig: ActualizarConfiguracionVerificacionRequest = {
      id_paquete: paqueteId,
      nombre: this.formularioPaquete.nombre,
      descripcion: this.formularioPaquete.descripcion,
      caracteristicas: this.formularioPaquete.caracteristicas,
      dias_trial: this.formularioPaquete.dias_trial,
      orden: this.formularioPaquete.orden
    };

    this.facade.actualizarConfiguracion(baseUrl, payloadConfig).subscribe({
      next: (response) => {
        if (response.error) {
          alert('Error al actualizar configuración: ' + response.message);
          return;
        }
        if (estadoCambio) {
          this.guardarEstadoStep(baseUrl, paqueteId);
        } else {
          this.finalizarGuardado(2);
        }
      },
      error: (err) => {
        alert('Error al actualizar configuración: ' + err.message);
      }
    });
  }

  private guardarEstadoStep(baseUrl: string, paqueteId: number): void {
    if (!this.formularioPaquete) return;

    const payloadEstado: CambiarEstadoVerificacionRequest = {
      id_paquete: paqueteId,
      activo: this.formularioPaquete.activo
    };

    this.facade.cambiarEstado(baseUrl, payloadEstado).subscribe({
      next: (response) => {
        if (response.error) {
          alert('Error al actualizar estado: ' + response.message);
          return;
        }
        this.finalizarGuardado(3);
      },
      error: (err) => {
        alert('Error al actualizar estado: ' + err.message);
      }
    });
  }

  private finalizarGuardado(pasos: number): void {
    alert(`¡Éxito! Todos los parámetros fueron actualizados correctamente.`);
    this.cerrarModalEditar();
    this.recargar();
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
