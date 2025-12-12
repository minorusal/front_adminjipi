import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DashboardAdminService } from '../services/dashboard-admin.service';
import { PaquetesSuscripcionFacade } from '../facades/paquetes-suscripcion.facade';
import {
  PaqueteSuscripcion,
  ConfiguracionPrecioSuscripcion,
  ActualizarPrecioSuscripcionRequest,
  ActualizarParametroSuscripcionRequest,
  ActualizarPaqueteCompletoRequest
} from '../types/paquetes.types';
import { environment as environmentQA } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-paquetes-suscripcion-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="paquetes-suscripcion-container">
      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
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
              <label class="form-label fw-bold">
                <i class="fas fa-server me-1"></i>
                Ambiente
              </label>
              <select class="form-select" [(ngModel)]="selectedEnvironment" (change)="cambiarAmbiente()">
                <option value="qa">QA (Desarrollo)</option>
                <option value="prod">Producción</option>
              </select>
              <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                {{ selectedEnvironment === 'qa' ? qaApiUrl : prodApiUrl }}
              </small>
            </div>
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
            <div class="col-md-3 text-end">
              <button class="btn btn-primary" (click)="recargar()">
                <i class="fas fa-sync-alt me-2"></i>
                Recargar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuraciones Globales (si están incluidas) -->
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
                      class="btn btn-sm btn-outline-primary"
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
          <div class="card shadow-sm h-100 border-left-primary">
            <div class="card-header bg-gradient-primary text-white">
              <h5 class="mb-0">{{ paquete.nombre }}</h5>
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
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Reportes Incluidos:</span>
                  <span class="badge bg-info">{{ paquete.reportes_incluidos }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Max OnDemand:</span>
                  <span class="badge bg-warning text-dark">{{ paquete.max_reportes_ondemand }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Precio OnDemand:</span>
                  <span class="fw-bold">{{ formatCurrency(paquete.precio_reporte_ondemand) }}</span>
                </div>
              </div>

              <div class="mb-3" *ngIf="paquete.activo !== undefined">
                <span
                  class="badge w-100 py-2"
                  [class.bg-success]="paquete.activo"
                  [class.bg-danger]="!paquete.activo">
                  {{ paquete.activo ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </div>

              <div class="d-grid gap-2">
                <button
                  class="btn btn-sm btn-outline-primary"
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
          <div class="modal-header bg-primary text-white">
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
              <small class="text-muted">Formato según tipo: precio (ej: 299.99), porcentaje (ej: 15), número (ej: 5)</small>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cerrarModalConfiguracion()" [disabled]="loading">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary"
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
      <div class="modal-dialog modal-fullscreen">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="fas fa-edit me-2"></i>
              Editar Paquete: {{ paqueteEditando?.nombre }}
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="cerrarModalPaquete()"></button>
          </div>
          <div class="modal-body" *ngIf="paqueteEditando && formularioPaquete" style="overflow-y: auto; max-height: calc(100vh - 160px);">
            <div class="alert alert-info mb-4">
              <i class="fas fa-info-circle me-2"></i>
              <strong>Editando:</strong> {{ paqueteEditando.nombre }}
              <br>
              <small>Modifica los campos que necesites y guarda los cambios. Todos los campos se actualizarán simultáneamente.</small>
            </div>

            <!-- Navegación por pestañas con TODOS los campos -->
            <ul class="nav nav-pills mb-4" role="tablist">
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link"
                  [class.active]="activeTabModal === 'basico'"
                  (click)="cambiarTabModal('basico')"
                  type="button">
                  <i class="fas fa-info-circle me-1"></i>Información Básica
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link"
                  [class.active]="activeTabModal === 'estilo'"
                  (click)="cambiarTabModal('estilo')"
                  type="button">
                  <i class="fas fa-palette me-1"></i>Estilo y Branding
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link"
                  [class.active]="activeTabModal === 'precios'"
                  (click)="cambiarTabModal('precios')"
                  type="button">
                  <i class="fas fa-dollar-sign me-1"></i>Precios y Límites
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link"
                  [class.active]="activeTabModal === 'mensajes'"
                  (click)="cambiarTabModal('mensajes')"
                  type="button">
                  <i class="fas fa-comment-dots me-1"></i>Mensajes y Copy
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link"
                  [class.active]="activeTabModal === 'caracteristicas'"
                  (click)="cambiarTabModal('caracteristicas')"
                  type="button">
                  <i class="fas fa-list me-1"></i>Características
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link"
                  [class.active]="activeTabModal === 'avanzado'"
                  (click)="cambiarTabModal('avanzado')"
                  type="button">
                  <i class="fas fa-cog me-1"></i>Configuración Avanzada
                </button>
              </li>
            </ul>

            <div class="tab-content">
              <!-- Pestaña: Información Básica -->
              <div class="tab-pane fade" [class.show]="activeTabModal === 'basico'" [class.active]="activeTabModal === 'basico'" role="tabpanel">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Nombre del Paquete *</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.nombre" placeholder="Basico">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.nombre }}</small>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Subtítulo *</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.subtitulo" placeholder="Para validar clientes o proveedores nuevos">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.subtitulo }}</small>
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">Descripción *</label>
                    <textarea class="form-control" rows="4" [(ngModel)]="formularioPaquete.descripcion" placeholder="Plan ideal para emprendedores..."></textarea>
                    <small class="text-muted">Valor actual: {{ paqueteEditando.descripcion }}</small>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Orden Visualización *</label>
                    <input type="number" class="form-control" [(ngModel)]="formularioPaquete.orden_visualizacion" min="0" step="1">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.orden_visualizacion }}</small>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Estado *</label>
                    <select class="form-select" [(ngModel)]="formularioPaquete.activo">
                      <option [value]="true">Activo</option>
                      <option [value]="false">Inactivo</option>
                    </select>
                    <small class="text-muted">Valor actual: {{ paqueteEditando.activo ? 'Activo' : 'Inactivo' }}</small>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Paquete Destacado</label>
                    <div class="form-check form-switch mt-2">
                      <input class="form-check-input" type="checkbox" [(ngModel)]="formularioPaquete.es_destacado" id="esDestacado">
                      <label class="form-check-label" for="esDestacado">
                        Marcar como destacado
                      </label>
                    </div>
                    <small class="text-muted">Valor actual: {{ paqueteEditando.es_destacado ? 'Sí' : 'No' }}</small>
                  </div>
                </div>
              </div>

              <!-- Pestaña: Estilo y Branding -->
              <div class="tab-pane fade" [class.show]="activeTabModal === 'estilo'" [class.active]="activeTabModal === 'estilo'" role="tabpanel">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Badge Etiqueta *</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.badge_etiqueta" placeholder="Más Popular">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.badge_etiqueta }}</small>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Badge Color *</label>
                    <div class="input-group">
                      <input type="text" class="form-control" [(ngModel)]="formularioPaquete.badge_color" placeholder="#FFDA1A">
                      <input type="color" class="form-control form-control-color" [(ngModel)]="formularioPaquete.badge_color" title="Seleccionar color">
                    </div>
                    <small class="text-muted">Valor actual: {{ paqueteEditando.badge_color }}</small>
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">CTA Texto *</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.cta_texto" placeholder="{{PRECIO_MENSUAL}} C/U">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.cta_texto }}</small>
                    <small class="d-block text-info mt-1">
                      <i class="fas fa-info-circle"></i> Variables disponibles: {{PRECIO_MENSUAL}}, {{PRECIO_ANUAL}}
                    </small>
                  </div>
                </div>
              </div>

              <!-- Pestaña: Precios y Límites -->
              <div class="tab-pane fade" [class.show]="activeTabModal === 'precios'" [class.active]="activeTabModal === 'precios'" role="tabpanel">
                <h6 class="mb-3"><i class="fas fa-dollar-sign me-2"></i>Precios</h6>
                <div class="row mb-4">
                  <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Precio Mensual *</label>
                    <div class="input-group">
                      <span class="input-group-text">$</span>
                      <input type="number" class="form-control" [(ngModel)]="formularioPaquete.precio_mensual" step="0.01" min="0">
                      <span class="input-group-text">MXN</span>
                    </div>
                    <small class="text-muted">Valor actual: {{ formatCurrency(paqueteEditando.precio_mensual) }}</small>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Precio Anual *</label>
                    <div class="input-group">
                      <span class="input-group-text">$</span>
                      <input type="number" class="form-control" [(ngModel)]="formularioPaquete.precio_anual" step="0.01" min="0">
                      <span class="input-group-text">MXN</span>
                    </div>
                    <small class="text-muted">Valor actual: {{ formatCurrency(paqueteEditando.precio_anual) }}</small>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Descuento Anual (%) *</label>
                    <div class="input-group">
                      <input type="number" class="form-control" [(ngModel)]="formularioPaquete.descuento_anual" step="0.01" min="0" max="100">
                      <span class="input-group-text">%</span>
                    </div>
                    <small class="text-muted">Valor actual: {{ paqueteEditando.descuento_anual }}%</small>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Precio Reporte OnDemand *</label>
                    <div class="input-group">
                      <span class="input-group-text">$</span>
                      <input type="number" class="form-control" [(ngModel)]="formularioPaquete.precio_reporte_ondemand" step="0.01" min="0">
                      <span class="input-group-text">MXN</span>
                    </div>
                    <small class="text-muted">Valor actual: {{ formatCurrency(paqueteEditando.precio_reporte_ondemand) }}</small>
                  </div>
                </div>

                <hr>

                <h6 class="mb-3 mt-4"><i class="fas fa-list-ol me-2"></i>Límites y Cantidades</h6>
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Reportes Incluidos *</label>
                    <input type="number" class="form-control" [(ngModel)]="formularioPaquete.reportes_incluidos" min="0" step="1">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.reportes_incluidos }}</small>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Max Reportes OnDemand *</label>
                    <input type="number" class="form-control" [(ngModel)]="formularioPaquete.max_reportes_ondemand" min="0" step="1">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.max_reportes_ondemand }}</small>
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Max Monitoreos *</label>
                    <input type="number" class="form-control" [(ngModel)]="formularioPaquete.max_monitoreos" min="0" step="1">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.max_monitoreos }}</small>
                  </div>
                </div>
              </div>

              <!-- Pestaña: Mensajes y Copy -->
              <div class="tab-pane fade" [class.show]="activeTabModal === 'mensajes'" [class.active]="activeTabModal === 'mensajes'" role="tabpanel">
                <div class="alert alert-info mb-4">
                  <i class="fas fa-info-circle me-2"></i>
                  <strong>Variables disponibles:</strong> {{REPORTES}}, {{MONITOREOS}}, {{PRECIO_ONDEMAND}}, {{MAX_ONDEMAND}}, {{PRECIO_MENSUAL}}, {{PRECIO_ANUAL}}
                </div>

                <div class="row">
                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">Mensaje Reportes *</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.mensaje_reportes" placeholder="{{REPORTES}} + 1 reporte regalo bienvenida">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.mensaje_reportes }}</small>
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">Copy Valor Individual</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.copy_valor_individual" placeholder="(Opcional)">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.copy_valor_individual || 'No especificado' }}</small>
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">Mensaje Monitoreos *</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.mensaje_monitoreos" placeholder="{{MONITOREOS}} monitoreos incluidos">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.mensaje_monitoreos }}</small>
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">Vigencia Texto *</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.vigencia_texto" placeholder="Vigencia de 1 año">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.vigencia_texto }}</small>
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">Mensaje On Demand *</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.mensaje_on_demand" placeholder="On demand adicionales: {{PRECIO_ONDEMAND}} (hasta {{MAX_ONDEMAND}} reportes)">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.mensaje_on_demand }}</small>
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">Copy Extra *</label>
                    <textarea class="form-control" rows="2" [(ngModel)]="formularioPaquete.copy_extra" placeholder="Podrás agregar más consultas en el momento que desees"></textarea>
                    <small class="text-muted">Valor actual: {{ paqueteEditando.copy_extra }}</small>
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">Copy Cierre *</label>
                    <textarea class="form-control" rows="2" [(ngModel)]="formularioPaquete.copy_cierre" placeholder="Información rápida y confiable para tus primeras evaluaciones"></textarea>
                    <small class="text-muted">Valor actual: {{ paqueteEditando.copy_cierre }}</small>
                  </div>
                  <div class="col-md-12 mb-3">
                    <label class="form-label fw-bold">Copy Botón Toggle *</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.copy_boton_toggle" placeholder="Ver menos">
                    <small class="text-muted">Valor actual: {{ paqueteEditando.copy_boton_toggle }}</small>
                  </div>
                </div>
              </div>

              <!-- Pestaña: Características -->
              <div class="tab-pane fade" [class.show]="activeTabModal === 'caracteristicas'" [class.active]="activeTabModal === 'caracteristicas'" role="tabpanel">
                <div class="mb-4">
                  <label class="form-label fw-bold">Agregar Nueva Característica</label>
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control"
                      [(ngModel)]="caracteristicaTemp"
                      placeholder="Escribe una característica..."
                      (keyup.enter)="agregarCaracteristica()">
                    <button class="btn btn-success" type="button" (click)="agregarCaracteristica()">
                      <i class="fas fa-plus me-1"></i>Agregar
                    </button>
                  </div>
                </div>
                <div class="card">
                  <div class="card-header bg-light">
                    <h6 class="mb-0">Lista de Características ({{ formularioPaquete.caracteristicas.length }})</h6>
                  </div>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item" *ngFor="let caracteristica of formularioPaquete.caracteristicas; let i = index">
                      <div class="d-flex align-items-center">
                        <span class="badge bg-primary me-2">{{ i + 1 }}</span>
                        <input
                          type="text"
                          class="form-control form-control-sm me-2"
                          [value]="caracteristica"
                          (change)="actualizarCaracteristica(i, $any($event.target).value)">
                        <button class="btn btn-sm btn-danger" (click)="removerCaracteristica(i)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </li>
                    <li class="list-group-item text-center text-muted" *ngIf="formularioPaquete.caracteristicas.length === 0">
                      <i class="fas fa-inbox fa-2x mb-2"></i>
                      <p class="mb-0">No hay características agregadas</p>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Pestaña: Configuración Avanzada -->
              <div class="tab-pane fade" [class.show]="activeTabModal === 'avanzado'" [class.active]="activeTabModal === 'avanzado'" role="tabpanel">
                <div class="alert alert-info">
                  <i class="fas fa-info-circle me-2"></i>
                  Configuración de integración con Stripe y modalidades de pago
                </div>

                <h6 class="mb-3"><i class="fab fa-stripe me-2"></i>Integración con Stripe</h6>
                <div class="row mb-4">
                  <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Stripe Monthly Product ID *</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.stripe_monthly_product_id" placeholder="prod_basico_monthly">
                    <small class="text-muted">ID del producto mensual en Stripe</small>
                    <br>
                    <small class="text-muted">Valor actual: {{ paqueteEditando.configuracion_avanzada?.stripe_monthly_product_id }}</small>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Stripe Annual Product ID *</label>
                    <input type="text" class="form-control" [(ngModel)]="formularioPaquete.stripe_annual_product_id" placeholder="prod_basico_annual">
                    <small class="text-muted">ID del producto anual en Stripe</small>
                    <br>
                    <small class="text-muted">Valor actual: {{ paqueteEditando.configuracion_avanzada?.stripe_annual_product_id }}</small>
                  </div>
                </div>

                <hr>

                <h6 class="mb-3 mt-4"><i class="fas fa-credit-card me-2"></i>Modalidades de Pago *</h6>
                <div class="row">
                  <div class="col-md-12">
                    <div class="mb-3">
                      <label class="form-label fw-bold">Agregar Nueva Modalidad</label>
                      <div class="input-group">
                        <input
                          type="text"
                          class="form-control"
                          [(ngModel)]="modalidadTemp"
                          placeholder="Ej: mensual, anual..."
                          (keyup.enter)="agregarModalidad()">
                        <button class="btn btn-success" type="button" (click)="agregarModalidad()">
                          <i class="fas fa-plus me-1"></i>Agregar
                        </button>
                      </div>
                    </div>
                    <div class="card">
                      <div class="card-header bg-light">
                        <h6 class="mb-0">Modalidades Disponibles ({{ formularioPaquete.modalidades_pago.length }})</h6>
                      </div>
                      <ul class="list-group list-group-flush">
                        <li class="list-group-item" *ngFor="let modalidad of formularioPaquete.modalidades_pago; let i = index">
                          <div class="d-flex align-items-center justify-content-between">
                            <span class="badge bg-success me-2">{{ modalidad }}</span>
                            <button class="btn btn-sm btn-danger" (click)="removerModalidad(i)">
                              <i class="fas fa-trash"></i>
                            </button>
                          </div>
                        </li>
                        <li class="list-group-item text-center text-muted" *ngIf="formularioPaquete.modalidades_pago.length === 0">
                          <i class="fas fa-inbox fa-2x mb-2"></i>
                          <p class="mb-0">No hay modalidades agregadas</p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Resumen de cambios -->
            <div class="alert alert-warning mt-4" *ngIf="hayCambios()">
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
              class="btn btn-primary"
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
    .border-left-primary {
      border-left: 4px solid #4e73df;
    }

    .bg-gradient-primary {
      background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
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
export class PaquetesSuscripcionListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  paquetes: PaqueteSuscripcion[] = [];
  configuraciones: ConfiguracionPrecioSuscripcion[] = [];
  loading = false;
  error: string | null = null;

  // Filtros
  filtroModalidad: 'mensual' | 'anual' | '' = '';
  incluirParametros = true;

  // Modales
  showModalConfiguracion = false;
  showModalPaquete = false;
  configuracionEditando: ConfiguracionPrecioSuscripcion | null = null;
  paqueteEditando: PaqueteSuscripcion | null = null;
  nuevoValorConfiguracion = '';
  parametroSeleccionado = '';
  nuevoValorParametro = '';

  // Control de pestañas del modal
  activeTabModal: 'basico' | 'estilo' | 'precios' | 'mensajes' | 'caracteristicas' | 'avanzado' = 'basico';

  // Formulario completo con TODOS los campos del paquete
  formularioPaquete: {
    nombre: string;
    badge_etiqueta: string;
    badge_color: string;
    subtitulo: string;
    descripcion: string;
    precio_mensual: number;
    precio_anual: number;
    descuento_anual: number;
    reportes_incluidos: number;
    max_reportes_ondemand: number;
    precio_reporte_ondemand: number;
    max_monitoreos: number;
    mensaje_reportes: string;
    copy_valor_individual: string | null;
    mensaje_monitoreos: string;
    vigencia_texto: string;
    mensaje_on_demand: string;
    copy_extra: string;
    copy_cierre: string;
    copy_boton_toggle: string;
    cta_texto: string;
    es_destacado: boolean;
    modalidades_pago: string[];
    caracteristicas: string[];
    orden_visualizacion: number;
    activo: boolean;
    // Campos de configuración avanzada
    stripe_monthly_product_id: string;
    stripe_annual_product_id: string;
  } | null = null;

  // Environment
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environmentQA.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  constructor(
    public dashboardService: DashboardAdminService,
    private facade: PaquetesSuscripcionFacade
  ) {}

  ngOnInit(): void {
    // Suscribirse a los observables
    this.facade.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
    });

    this.facade.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      this.error = error;
    });

    this.facade.paquetesDisponibles$.pipe(takeUntil(this.destroy$)).subscribe(paquetes => {
      this.paquetes = paquetes;
      console.log('📦 [DEBUG] Paquetes cargados:', paquetes);
    });

    this.facade.configuracionesPrecios$.pipe(takeUntil(this.destroy$)).subscribe(configs => {
      this.configuraciones = configs;
    });

    // Cargar datos iniciales
    this.aplicarFiltros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentBaseUrl(): string {
    return this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
  }

  cambiarAmbiente(): void {
    console.log('🔄 [DEBUG] Cambiando ambiente a:', this.selectedEnvironment);
    console.log('🌐 [DEBUG] URL:', this.getCurrentBaseUrl());
    this.aplicarFiltros();
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

  editarConfiguracion(config: ConfiguracionPrecioSuscripcion): void {
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

    const payload: ActualizarPrecioSuscripcionRequest = {
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

  editarPaquete(paquete: PaqueteSuscripcion): void {
    console.log('✏️ [DEBUG] Editando paquete:', paquete.nombre);
    this.paqueteEditando = paquete;
    this.activeTabModal = 'basico';

    // Convertir precios a números si vienen como strings
    const precioMensual = typeof paquete.precio_mensual === 'string' ? parseFloat(paquete.precio_mensual) : paquete.precio_mensual;
    const precioAnual = typeof paquete.precio_anual === 'string' ? parseFloat(paquete.precio_anual) : paquete.precio_anual;
    const descuentoAnual = typeof paquete.descuento_anual === 'string' ? parseFloat(paquete.descuento_anual) : paquete.descuento_anual;
    const precioReporteOndemand = typeof paquete.precio_reporte_ondemand === 'string' ? parseFloat(paquete.precio_reporte_ondemand) : paquete.precio_reporte_ondemand;

    // Inicializar formulario con TODOS los campos del paquete
    this.formularioPaquete = {
      nombre: paquete.nombre || '',
      badge_etiqueta: paquete.badge_etiqueta || '',
      badge_color: paquete.badge_color || '',
      subtitulo: paquete.subtitulo || '',
      descripcion: paquete.descripcion || '',
      precio_mensual: precioMensual || 0,
      precio_anual: precioAnual || 0,
      descuento_anual: descuentoAnual || 0,
      reportes_incluidos: paquete.reportes_incluidos || 0,
      max_reportes_ondemand: paquete.max_reportes_ondemand || 0,
      precio_reporte_ondemand: precioReporteOndemand || 0,
      max_monitoreos: paquete.max_monitoreos || 0,
      mensaje_reportes: paquete.mensaje_reportes || '',
      copy_valor_individual: paquete.copy_valor_individual || null,
      mensaje_monitoreos: paquete.mensaje_monitoreos || '',
      vigencia_texto: paquete.vigencia_texto || '',
      mensaje_on_demand: paquete.mensaje_on_demand || '',
      copy_extra: paquete.copy_extra || '',
      copy_cierre: paquete.copy_cierre || '',
      copy_boton_toggle: paquete.copy_boton_toggle || '',
      cta_texto: paquete.cta_texto || '',
      es_destacado: paquete.es_destacado || false,
      modalidades_pago: paquete.modalidades_disponibles ? [...paquete.modalidades_disponibles] : (paquete.modalidades_pago ? [...paquete.modalidades_pago] : []),
      caracteristicas: paquete.caracteristicas ? [...paquete.caracteristicas] : [],
      orden_visualizacion: paquete.orden_visualizacion || 1,
      activo: paquete.activo !== undefined ? paquete.activo : true,
      stripe_monthly_product_id: paquete.configuracion_avanzada?.stripe_monthly_product_id || '',
      stripe_annual_product_id: paquete.configuracion_avanzada?.stripe_annual_product_id || ''
    };

    console.log('📝 [DEBUG] Formulario inicializado:', this.formularioPaquete);
    this.showModalPaquete = true;
  }

  cambiarTabModal(tab: 'basico' | 'estilo' | 'precios' | 'mensajes' | 'caracteristicas' | 'avanzado'): void {
    this.activeTabModal = tab;
  }

  cerrarModalPaquete(): void {
    this.showModalPaquete = false;
    this.paqueteEditando = null;
    this.formularioPaquete = null;
  }

  hayCambios(): boolean {
    if (!this.paqueteEditando || !this.formularioPaquete) return false;

    // Convertir valores originales para comparación
    const precioMensualOriginal = typeof this.paqueteEditando.precio_mensual === 'string'
      ? parseFloat(this.paqueteEditando.precio_mensual)
      : this.paqueteEditando.precio_mensual;
    const precioAnualOriginal = typeof this.paqueteEditando.precio_anual === 'string'
      ? parseFloat(this.paqueteEditando.precio_anual)
      : this.paqueteEditando.precio_anual;
    const descuentoAnualOriginal = typeof this.paqueteEditando.descuento_anual === 'string'
      ? parseFloat(this.paqueteEditando.descuento_anual)
      : this.paqueteEditando.descuento_anual;
    const precioReporteOndemandOriginal = typeof this.paqueteEditando.precio_reporte_ondemand === 'string'
      ? parseFloat(this.paqueteEditando.precio_reporte_ondemand)
      : this.paqueteEditando.precio_reporte_ondemand;

    return (
      this.formularioPaquete.nombre !== (this.paqueteEditando.nombre || '') ||
      this.formularioPaquete.badge_etiqueta !== (this.paqueteEditando.badge_etiqueta || '') ||
      this.formularioPaquete.badge_color !== (this.paqueteEditando.badge_color || '') ||
      this.formularioPaquete.subtitulo !== (this.paqueteEditando.subtitulo || '') ||
      this.formularioPaquete.descripcion !== (this.paqueteEditando.descripcion || '') ||
      this.formularioPaquete.precio_mensual !== (precioMensualOriginal || 0) ||
      this.formularioPaquete.precio_anual !== (precioAnualOriginal || 0) ||
      this.formularioPaquete.descuento_anual !== (descuentoAnualOriginal || 0) ||
      this.formularioPaquete.reportes_incluidos !== (this.paqueteEditando.reportes_incluidos || 0) ||
      this.formularioPaquete.max_reportes_ondemand !== (this.paqueteEditando.max_reportes_ondemand || 0) ||
      this.formularioPaquete.precio_reporte_ondemand !== (precioReporteOndemandOriginal || 0) ||
      this.formularioPaquete.max_monitoreos !== (this.paqueteEditando.max_monitoreos || 0) ||
      this.formularioPaquete.mensaje_reportes !== (this.paqueteEditando.mensaje_reportes || '') ||
      this.formularioPaquete.copy_valor_individual !== (this.paqueteEditando.copy_valor_individual || null) ||
      this.formularioPaquete.mensaje_monitoreos !== (this.paqueteEditando.mensaje_monitoreos || '') ||
      this.formularioPaquete.vigencia_texto !== (this.paqueteEditando.vigencia_texto || '') ||
      this.formularioPaquete.mensaje_on_demand !== (this.paqueteEditando.mensaje_on_demand || '') ||
      this.formularioPaquete.copy_extra !== (this.paqueteEditando.copy_extra || '') ||
      this.formularioPaquete.copy_cierre !== (this.paqueteEditando.copy_cierre || '') ||
      this.formularioPaquete.copy_boton_toggle !== (this.paqueteEditando.copy_boton_toggle || '') ||
      this.formularioPaquete.cta_texto !== (this.paqueteEditando.cta_texto || '') ||
      this.formularioPaquete.es_destacado !== (this.paqueteEditando.es_destacado || false) ||
      JSON.stringify(this.formularioPaquete.modalidades_pago) !== JSON.stringify(this.paqueteEditando.modalidades_disponibles || this.paqueteEditando.modalidades_pago || []) ||
      JSON.stringify(this.formularioPaquete.caracteristicas) !== JSON.stringify(this.paqueteEditando.caracteristicas || []) ||
      this.formularioPaquete.orden_visualizacion !== (this.paqueteEditando.orden_visualizacion || 1) ||
      this.formularioPaquete.activo !== (this.paqueteEditando.activo || false) ||
      this.formularioPaquete.stripe_monthly_product_id !== (this.paqueteEditando.configuracion_avanzada?.stripe_monthly_product_id || '') ||
      this.formularioPaquete.stripe_annual_product_id !== (this.paqueteEditando.configuracion_avanzada?.stripe_annual_product_id || '')
    );
  }

  formularioValido(): boolean {
    if (!this.formularioPaquete) {
      console.log('❌ Formulario inválido: formularioPaquete es null');
      return false;
    }

    // Validar solo los campos esenciales (menos estricto)
    const validaciones = {
      nombre: this.formularioPaquete.nombre?.trim() !== '',
      descripcion: this.formularioPaquete.descripcion?.trim() !== '',
      precio_mensual: this.formularioPaquete.precio_mensual >= 0,
      precio_anual: this.formularioPaquete.precio_anual >= 0,
      stripe_monthly: this.formularioPaquete.stripe_monthly_product_id?.trim() !== '',
      stripe_annual: this.formularioPaquete.stripe_annual_product_id?.trim() !== ''
    };

    const esValido = Object.values(validaciones).every(v => v === true);

    if (!esValido) {
      console.log('❌ Formulario inválido. Campos faltantes:',
        Object.entries(validaciones)
          .filter(([_, valido]) => !valido)
          .map(([campo]) => campo)
      );
    } else {
      console.log('✅ Formulario válido');
    }

    return esValido;
  }

  guardarTodosLosParametros(): void {
    if (!this.paqueteEditando || !this.formularioPaquete || !this.formularioValido()) return;

    if (!this.hayCambios()) {
      alert('No hay cambios para guardar');
      return;
    }

    const baseUrl = this.getCurrentBaseUrl();
    const paqueteId = this.paqueteEditando.id!;

    console.log('💾 [DEBUG] Guardando paquete completo con ID:', paqueteId);

    // Construir el payload completo con TODOS los campos
    const payload: ActualizarPaqueteCompletoRequest = {
      nombre: this.formularioPaquete.nombre,
      badge_etiqueta: this.formularioPaquete.badge_etiqueta,
      badge_color: this.formularioPaquete.badge_color,
      subtitulo: this.formularioPaquete.subtitulo,
      descripcion: this.formularioPaquete.descripcion,
      precio_mensual: this.formularioPaquete.precio_mensual,
      precio_anual: this.formularioPaquete.precio_anual,
      descuento_anual: this.formularioPaquete.descuento_anual,
      reportes_incluidos: this.formularioPaquete.reportes_incluidos,
      max_reportes_ondemand: this.formularioPaquete.max_reportes_ondemand,
      precio_reporte_ondemand: this.formularioPaquete.precio_reporte_ondemand,
      max_monitoreos: this.formularioPaquete.max_monitoreos,
      mensaje_reportes: this.formularioPaquete.mensaje_reportes,
      copy_valor_individual: this.formularioPaquete.copy_valor_individual,
      mensaje_monitoreos: this.formularioPaquete.mensaje_monitoreos,
      vigencia_texto: this.formularioPaquete.vigencia_texto,
      mensaje_on_demand: this.formularioPaquete.mensaje_on_demand,
      copy_extra: this.formularioPaquete.copy_extra,
      copy_cierre: this.formularioPaquete.copy_cierre,
      copy_boton_toggle: this.formularioPaquete.copy_boton_toggle,
      cta_texto: this.formularioPaquete.cta_texto,
      es_destacado: this.formularioPaquete.es_destacado,
      modalidades_pago: this.formularioPaquete.modalidades_pago,
      caracteristicas: this.formularioPaquete.caracteristicas,
      configuracion_avanzada: {
        stripe_monthly_product_id: this.formularioPaquete.stripe_monthly_product_id,
        stripe_annual_product_id: this.formularioPaquete.stripe_annual_product_id
      },
      orden_visualizacion: this.formularioPaquete.orden_visualizacion,
      activo: this.formularioPaquete.activo
    };

    console.log('📦 [DEBUG] Payload completo:', payload);

    // Enviar actualización usando PUT /api/paquetes-suscripcion/{id}
    this.facade.actualizarPaqueteCompleto(baseUrl, paqueteId, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          alert('¡Éxito! El paquete fue actualizado correctamente.');
          this.cerrarModalPaquete();
          this.recargar();
        } else {
          alert('Error al actualizar el paquete: ' + response.message);
        }
      },
      error: (err) => {
        alert('Error al actualizar el paquete: ' + err.message);
      }
    });
  }

  guardarParametro(): void {
    if (!this.paqueteEditando || !this.parametroSeleccionado || !this.nuevoValorParametro) return;

    const payload: ActualizarParametroSuscripcionRequest = {
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

  obtenerValorActual(parametro: string, paquete: PaqueteSuscripcion): string {
    switch (parametro) {
      case 'reportes_incluidos':
        return paquete.reportes_incluidos.toString();
      case 'max_reportes_ondemand':
        return paquete.max_reportes_ondemand.toString();
      case 'precio_reporte_ondemand':
        return this.formatCurrency(paquete.precio_reporte_ondemand);
      case 'precio_mensual':
        return this.formatCurrency(paquete.precio_mensual);
      case 'precio_anual':
        return this.formatCurrency(paquete.precio_anual);
      case 'activo':
        return paquete.activo ? 'Activo' : 'Inactivo';
      default:
        return '';
    }
  }

  formatCurrency(value: string | number | undefined): string {
    if (value === undefined || value === null) return '$0.00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return this.dashboardService.formatCurrency(numValue);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Métodos auxiliares para manejar características
  caracteristicaTemp = '';

  agregarCaracteristica(): void {
    if (!this.formularioPaquete || !this.caracteristicaTemp.trim()) return;

    if (!this.formularioPaquete.caracteristicas.includes(this.caracteristicaTemp.trim())) {
      this.formularioPaquete.caracteristicas.push(this.caracteristicaTemp.trim());
      this.caracteristicaTemp = '';
    }
  }

  removerCaracteristica(index: number): void {
    if (!this.formularioPaquete) return;
    this.formularioPaquete.caracteristicas.splice(index, 1);
  }

  actualizarCaracteristica(index: number, valor: string): void {
    if (!this.formularioPaquete) return;
    this.formularioPaquete.caracteristicas[index] = valor;
  }

  // Métodos auxiliares para manejar modalidades de pago
  modalidadTemp = '';

  agregarModalidad(): void {
    if (!this.formularioPaquete || !this.modalidadTemp.trim()) return;

    const modalidad = this.modalidadTemp.trim().toLowerCase();
    if (!this.formularioPaquete.modalidades_pago.includes(modalidad)) {
      this.formularioPaquete.modalidades_pago.push(modalidad);
      this.modalidadTemp = '';
    }
  }

  removerModalidad(index: number): void {
    if (!this.formularioPaquete) return;
    this.formularioPaquete.modalidades_pago.splice(index, 1);
  }
}
