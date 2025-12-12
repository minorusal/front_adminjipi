import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DashboardAdminFacade } from '../data-access/dashboard-admin.facade';
import { DashboardAdminService } from '../services/dashboard-admin.service';
import { EmpresasConSuscripciones, EmpresaConSuscripciones, FiltrosEmpresasSuscripciones } from '../types/dashboard.types';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-empresas-suscripciones-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="empresas-suscripciones-dashboard container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button class="btn btn-outline-secondary btn-sm mb-2" (click)="goBack()">
            <i class="fas fa-arrow-left me-1"></i> Volver
          </button>
          <h2 class="mb-0">
            <i class="fas fa-building me-2 text-primary"></i>
            Empresas con Suscripciones
          </h2>
          <p class="text-muted small mb-0">
            Vista completa de empresas y todas sus suscripciones en los 3 módulos
          </p>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select form-select-sm" [(ngModel)]="selectedEnvironment" (change)="onEnvironmentChange()">
            <option value="qa">QA</option>
            <option value="prod">Prod</option>
          </select>
          <button class="btn btn-outline-success btn-sm" (click)="refreshData()" [disabled]="isLoading">
            <i class="fas fa-sync-alt me-1" [class.fa-spin]="isLoading"></i>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card shadow mb-4">
        <div class="card-header bg-light">
          <h5 class="mb-0">
            <i class="fas fa-filter me-2"></i>
            Filtros de Búsqueda
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <label class="form-label small">Límite de resultados</label>
              <select class="form-select form-select-sm" [(ngModel)]="filtros.limite" (change)="aplicarFiltros()">
                <option [value]="10">10 empresas</option>
                <option [value]="25">25 empresas</option>
                <option [value]="50">50 empresas</option>
                <option [value]="100">100 empresas</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label small">ID de empresa específica</label>
              <input
                type="number"
                class="form-control form-control-sm"
                [(ngModel)]="filtros.emp_id"
                (change)="aplicarFiltros()"
                placeholder="Opcional">
            </div>
            <div class="col-md-3">
              <label class="form-label small">Estado de suscripción</label>
              <select class="form-select form-select-sm" [(ngModel)]="filtros.estado_suscripcion" (change)="aplicarFiltros()">
                <option value="todas">Todas</option>
                <option value="activa">Solo activas</option>
                <option value="cancelada">Solo canceladas</option>
                <option value="suspendida">Solo suspendidas</option>
                <option value="expirada">Solo expiradas</option>
              </select>
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <button class="btn btn-primary btn-sm w-100" (click)="limpiarFiltros()">
                <i class="fas fa-eraser me-1"></i>
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading && !empresasData" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="mt-3">Cargando empresas con suscripciones...</div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger alert-dismissible fade show">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
        <button type="button" class="btn-close" (click)="error = null"></button>
      </div>

      <!-- Resumen de resultados -->
      <div *ngIf="empresasData" class="card shadow mb-4">
        <div class="card-body bg-info text-white">
          <div class="row">
            <div class="col-md-4">
              <h5 class="mb-0">
                <i class="fas fa-building me-2"></i>
                <strong>{{ empresasData.total_empresas }}</strong> Empresas encontradas
              </h5>
            </div>
            <div class="col-md-8 text-end">
              <small>
                <i class="fas fa-filter me-1"></i>
                Filtros aplicados:
                Límite: {{ empresasData.filtros_aplicados.limite }} |
                <span *ngIf="empresasData.filtros_aplicados.emp_id">
                  Empresa ID: {{ empresasData.filtros_aplicados.emp_id }} |
                </span>
                Estado: {{ empresasData.filtros_aplicados.estado_suscripcion }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de Empresas -->
      <div *ngIf="empresasData && empresasData.empresas.length > 0">
        <div *ngFor="let empresaItem of empresasData.empresas; let i = index" class="card shadow-lg mb-4 empresa-card">
          <!-- Header de la Empresa -->
          <div class="card-header bg-gradient-primary text-white">
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-3">
                <div class="empresa-numero">
                  {{ i + 1 }}
                </div>
                <div>
                  <h4 class="mb-0">{{ empresaItem.empresa.emp_nombre }}</h4>
                  <small>{{ empresaItem.empresa.emp_razon_social }}</small>
                </div>
              </div>
              <div class="text-end">
                <div class="badge bg-light text-dark fs-6 px-3 py-2">
                  ID: {{ empresaItem.empresa.emp_id }}
                </div>
                <div class="mt-1">
                  <small>RFC: {{ empresaItem.empresa.emp_rfc }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="card-body">
            <!-- Información Completa de la Empresa (Colapsable) -->
            <div class="mb-4">
              <button
                class="btn btn-outline-info btn-sm w-100"
                (click)="toggleSection(empresaItem.empresa.emp_id, 'detalles_empresa')">
                <i class="fas" [class.fa-chevron-down]="isSectionCollapsed(empresaItem.empresa.emp_id, 'detalles_empresa')" [class.fa-chevron-up]="!isSectionCollapsed(empresaItem.empresa.emp_id, 'detalles_empresa')"></i>
                {{ isSectionCollapsed(empresaItem.empresa.emp_id, 'detalles_empresa') ? 'Mostrar' : 'Ocultar' }} Información Completa de la Empresa
              </button>

              <div *ngIf="!isSectionCollapsed(empresaItem.empresa.emp_id, 'detalles_empresa')" class="card mt-2 bg-light">
                <div class="card-body">
                  <div class="row">
                    <!-- Información Básica -->
                    <div class="col-md-6 mb-3">
                      <h6 class="text-primary border-bottom pb-2"><i class="fas fa-building me-2"></i>Información Básica</h6>
                      <table class="table table-sm table-bordered">
                        <tbody>
                          <tr><th class="bg-white" width="40%">ID Empresa</th><td>{{ empresaItem.empresa.emp_id }}</td></tr>
                          <tr><th class="bg-white">ID Industria (cin_id)</th><td>{{ empresaItem.empresa.cin_id || 'N/A' }}</td></tr>
                          <tr><th class="bg-white">Nombre</th><td>{{ empresaItem.empresa.emp_nombre || 'Sin nombre' }}</td></tr>
                          <tr><th class="bg-white">Razón Social</th><td>{{ empresaItem.empresa.emp_razon_social }}</td></tr>
                          <tr><th class="bg-white">Denominación</th><td>{{ empresaItem.empresa.denominacion || 'N/A' }}</td></tr>
                          <tr><th class="bg-white">RFC</th><td><strong>{{ empresaItem.empresa.emp_rfc }}</strong></td></tr>
                          <tr><th class="bg-white">Tipo</th><td>{{ empresaItem.empresa.tipo === '1' ? 'Persona Moral' : empresaItem.empresa.tipo === '2' ? 'Persona Física' : 'N/A' }}</td></tr>
                          <tr><th class="bg-white">Giro</th><td>{{ empresaItem.empresa.giro || 'No especificado' }}</td></tr>
                          <tr><th class="bg-white">Website</th><td>
                            <span *ngIf="empresaItem.empresa.emp_website && empresaItem.empresa.emp_website !== 'undefined' && empresaItem.empresa.emp_website !== ''">
                              <a [href]="empresaItem.empresa.emp_website" target="_blank" class="text-info">{{ empresaItem.empresa.emp_website }}</a>
                            </span>
                            <span *ngIf="!empresaItem.empresa.emp_website || empresaItem.empresa.emp_website === 'undefined' || empresaItem.empresa.emp_website === ''">No especificado</span>
                          </td></tr>
                          <tr><th class="bg-white">Teléfono</th><td>{{ empresaItem.empresa.emp_phone || 'N/A' }}</td></tr>
                          <tr><th class="bg-white">Empleados</th><td>{{ empresaItem.empresa.emp_empleados }}</td></tr>
                          <tr><th class="bg-white">Años de Experiencia</th><td>{{ empresaItem.empresa.anios_experiencia || 'N/A' }}</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Información Operativa -->
                    <div class="col-md-6 mb-3">
                      <h6 class="text-success border-bottom pb-2"><i class="fas fa-cogs me-2"></i>Información Operativa</h6>
                      <table class="table table-sm table-bordered">
                        <tbody>
                          <tr><th class="bg-white" width="50%">Ventas al Gobierno</th><td>{{ formatBoolean(empresaItem.empresa.emp_ventas_gob) }}</td></tr>
                          <tr><th class="bg-white">Ventas a Crédito</th><td>{{ formatBoolean(empresaItem.empresa.emp_ventas_credito) }}</td></tr>
                          <tr><th class="bg-white">Ventas de Contado</th><td>{{ formatBoolean(empresaItem.empresa.emp_ventas_contado) }}</td></tr>
                          <tr><th class="bg-white">Mercado Local</th><td>{{ formatBoolean(empresaItem.empresa.emp_loc) }}</td></tr>
                          <tr><th class="bg-white">Mercado Nacional</th><td>{{ formatBoolean(empresaItem.empresa.emp_nac) }}</td></tr>
                          <tr><th class="bg-white">Mercado Internacional</th><td>{{ formatBoolean(empresaItem.empresa.emp_int) }}</td></tr>
                          <tr><th class="bg-white">Exportación</th><td>{{ formatBoolean(empresaItem.empresa.emp_exportacion) }}</td></tr>
                          <tr><th class="bg-white">Maneja Crédito</th><td>{{ formatBoolean(empresaItem.empresa.emp_credito) }}</td></tr>
                          <tr><th class="bg-white">Empresa Certificada</th><td>{{ formatBoolean(empresaItem.empresa.emp_certificada) }}</td></tr>
                          <tr><th class="bg-white">Estado</th><td>
                            <span class="badge" [class.bg-success]="empresaItem.empresa.emp_status === 0" [class.bg-danger]="empresaItem.empresa.emp_status !== 0">
                              {{ empresaItem.empresa.emp_status === 0 ? 'Activa' : 'Inactiva' }}
                            </span>
                          </td></tr>
                          <tr><th class="bg-white">Registro Activo</th><td>{{ formatBoolean(empresaItem.empresa.reg_active) }}</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Validaciones y Sistemas -->
                    <div class="col-md-6 mb-3">
                      <h6 class="text-warning border-bottom pb-2"><i class="fas fa-check-circle me-2"></i>Validaciones y Sistemas</h6>
                      <table class="table table-sm table-bordered">
                        <tbody>
                          <tr><th class="bg-white" width="60%">Konesh Válido</th><td>{{ formatBoolean(empresaItem.empresa.konesh_valid) }}</td></tr>
                          <tr><th class="bg-white">Contador Konesh</th><td>{{ empresaItem.empresa.contador_konesh }}</td></tr>
                          <tr><th class="bg-white">Contador Konesh (Razón Social diferente)</th><td>{{ empresaItem.empresa.contador_konesh_razon_social_no_igual }}</td></tr>
                          <tr><th class="bg-white">Cronos</th><td>{{ formatBoolean(empresaItem.empresa.cronos) }}</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Fechas y Metadatos -->
                    <div class="col-md-6 mb-3">
                      <h6 class="text-info border-bottom pb-2"><i class="fas fa-calendar me-2"></i>Fechas y Metadatos</h6>
                      <table class="table table-sm table-bordered">
                        <tbody>
                          <tr><th class="bg-white" width="50%">Fecha de Fundación</th><td>{{ formatDate(empresaItem.empresa.emp_fecha_fundacion) }}</td></tr>
                          <tr><th class="bg-white">Fecha de Creación (Sistema)</th><td>{{ formatDate(empresaItem.empresa.emp_fecha_creacion) }}</td></tr>
                          <tr><th class="bg-white">Última Actualización</th><td>{{ formatDate(empresaItem.empresa.emp_update) }}</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Multimedia y Adicionales -->
                    <div class="col-md-12 mb-3" *ngIf="empresaItem.empresa.emp_logo || empresaItem.empresa.emp_banner || empresaItem.empresa.emp_video">
                      <h6 class="text-secondary border-bottom pb-2"><i class="fas fa-images me-2"></i>Multimedia</h6>
                      <div class="row">
                        <div class="col-md-4" *ngIf="empresaItem.empresa.emp_logo && empresaItem.empresa.emp_logo !== 'null'">
                          <label class="small text-muted">Logo:</label><br>
                          <img [src]="empresaItem.empresa.emp_logo" alt="Logo" class="img-thumbnail" style="max-height: 100px;">
                        </div>
                        <div class="col-md-4" *ngIf="empresaItem.empresa.emp_banner && empresaItem.empresa.emp_banner !== 'null'">
                          <label class="small text-muted">Banner:</label><br>
                          <img [src]="empresaItem.empresa.emp_banner" alt="Banner" class="img-thumbnail" style="max-height: 100px;">
                        </div>
                        <div class="col-md-4" *ngIf="empresaItem.empresa.emp_video">
                          <label class="small text-muted">Video:</label><br>
                          <a [href]="empresaItem.empresa.emp_video" target="_blank" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-play-circle me-1"></i> Ver Video
                          </a>
                        </div>
                      </div>
                    </div>

                    <!-- Información Adicional -->
                    <div class="col-md-12" *ngIf="empresaItem.empresa.emp_marcas || empresaItem.empresa.valores || empresaItem.empresa.proposito">
                      <h6 class="text-dark border-bottom pb-2"><i class="fas fa-info-circle me-2"></i>Información Adicional</h6>
                      <div class="row">
                        <div class="col-md-4" *ngIf="empresaItem.empresa.emp_marcas && empresaItem.empresa.emp_marcas !== ''">
                          <label class="small text-muted">Marcas:</label>
                          <p class="small">{{ empresaItem.empresa.emp_marcas }}</p>
                        </div>
                        <div class="col-md-4" *ngIf="empresaItem.empresa.valores">
                          <label class="small text-muted">Valores:</label>
                          <p class="small">{{ empresaItem.empresa.valores }}</p>
                        </div>
                        <div class="col-md-4" *ngIf="empresaItem.empresa.proposito">
                          <label class="small text-muted">Propósito:</label>
                          <p class="small">{{ empresaItem.empresa.proposito }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Resumen de la empresa -->
            <div class="row mb-4">
              <div class="col-md-12">
                <div class="alert alert-light border">
                  <div class="row text-center">
                    <div class="col-md-2">
                      <i class="fas fa-layer-group fa-2x text-primary mb-2"></i>
                      <h5 class="mb-0">{{ empresaItem.resumen.total_suscripciones }}</h5>
                      <small class="text-muted">Total Suscripciones</small>
                    </div>
                    <div class="col-md-2">
                      <i class="fas fa-check-circle fa-2x text-success mb-2"></i>
                      <h5 class="mb-0">
                        {{ empresaItem.resumen.suscripciones_activas.reportes +
                           empresaItem.resumen.suscripciones_activas.monitoreo +
                           empresaItem.resumen.suscripciones_activas.verificacion }}
                      </h5>
                      <small class="text-muted">Activas</small>
                    </div>
                    <div class="col-md-2">
                      <i class="fas fa-dollar-sign fa-2x text-success mb-2"></i>
                      <h5 class="mb-0">{{ formatCurrency(empresaItem.resumen.mrr_total) }}</h5>
                      <small class="text-muted">MRR Total</small>
                    </div>
                    <div class="col-md-2">
                      <i class="fas fa-credit-card fa-2x mb-2" [class.text-success]="empresaItem.resumen.tiene_metodo_pago" [class.text-danger]="!empresaItem.resumen.tiene_metodo_pago"></i>
                      <h5 class="mb-0">{{ empresaItem.resumen.metodos_pago_activos }}</h5>
                      <small class="text-muted">Métodos de Pago</small>
                    </div>
                    <div class="col-md-4">
                      <i class="fas fa-clock fa-2x text-info mb-2"></i>
                      <h5 class="mb-0">{{ empresaItem.resumen.ultima_transaccion || 'Sin transacciones' }}</h5>
                      <small class="text-muted">Última Transacción</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Suscripciones por Módulo -->
            <div class="row mb-4">
              <!-- Reportes de Crédito -->
              <div class="col-md-4">
                <h6 class="text-primary">
                  <i class="fas fa-file-invoice-dollar me-2"></i>
                  Reportes de Crédito ({{ empresaItem.suscripciones.reportes_credito.length }})
                </h6>
                <div *ngIf="empresaItem.suscripciones.reportes_credito.length === 0" class="text-muted small">
                  Sin suscripciones
                </div>
                <div *ngFor="let sus of empresaItem.suscripciones.reportes_credito" class="card mb-2 border-primary">
                  <div class="card-body p-2">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="badge" [class.bg-success]="sus.esta_activa" [class.bg-secondary]="!sus.esta_activa">
                        {{ sus.estado }}
                      </span>
                      <span class="badge bg-info">{{ sus.modalidad_pago }}</span>
                    </div>
                    <div class="mt-2 small">
                      <strong>{{ formatCurrency(sus.precio_mensual) }}/mes</strong>
                      <span *ngIf="sus.precio_anual"> | Anual: {{ formatCurrency(sus.precio_anual) }}</span>
                    </div>
                    <div class="small text-muted">
                      <i class="fas fa-file-alt me-1"></i>
                      Reportes: {{ sus.reportes_acumulados }}/{{ sus.reportes_incluidos }}
                      (Max on-demand: {{ sus.max_reportes_ondemand }})
                    </div>
                    <div class="small text-muted">
                      <i class="fas fa-calendar-check me-1"></i>
                      Renovación: {{ sus.fecha_renovacion_formatted || 'N/A' }}
                    </div>
                    <div class="small text-muted">
                      <i class="fas fa-clock me-1"></i>
                      {{ sus.dias_restantes }} días restantes
                      <span *ngIf="sus.esta_por_vencer" class="badge bg-warning text-dark ms-1">Por vencer</span>
                    </div>
                    <div *ngIf="sus.en_periodo_gracia === 1" class="small text-warning">
                      <i class="fas fa-exclamation-triangle me-1"></i>
                      En período de gracia ({{ sus.periodo_gracia_dias }} días)
                    </div>
                    <div *ngIf="sus.descuento_aplicado !== '0.00'" class="small text-success">
                      <i class="fas fa-tag me-1"></i>
                      Descuento: {{ sus.descuento_aplicado }}%
                      <span *ngIf="sus.codigo_promocional_aplicado">({{ sus.codigo_promocional_aplicado }})</span>
                    </div>

                    <!-- Botón para expandir detalles completos -->
                    <button
                      class="btn btn-sm btn-outline-primary mt-2 w-100"
                      (click)="toggleSection(empresaItem.empresa.emp_id, 'reporte_' + sus.id)">
                      <i class="fas fa-info-circle me-1"></i>
                      {{ isSectionCollapsed(empresaItem.empresa.emp_id, 'reporte_' + sus.id) ? 'Ver' : 'Ocultar' }} Detalles Completos
                    </button>

                    <!-- Detalles completos colapsables -->
                    <div *ngIf="!isSectionCollapsed(empresaItem.empresa.emp_id, 'reporte_' + sus.id)" class="mt-2 p-2 bg-light rounded">
                      <table class="table table-sm table-bordered mb-0">
                        <tbody>
                          <tr><th width="45%">ID Suscripción</th><td>{{ sus.id }}</td></tr>
                          <tr><th>ID Paquete</th><td>{{ sus.id_paquete }}</td></tr>
                          <tr><th>Tipo de Plan</th><td>{{ sus.tipo_plan }}</td></tr>
                          <tr><th>Método de Pago</th><td>{{ sus.metodo_pago }}</td></tr>
                          <tr><th>Stripe Customer ID</th><td><small>{{ sus.stripe_customer_id || 'N/A' }}</small></td></tr>
                          <tr><th>Stripe Subscription ID</th><td><small>{{ sus.stripe_subscription_id || 'N/A' }}</small></td></tr>
                          <tr><th>Auto Renovación</th><td>{{ formatBoolean(sus.auto_renovacion) }}</td></tr>
                          <tr><th>Estado de Vigencia</th><td>
                            <span class="badge" [ngClass]="sus.badge_estado?.color ? 'bg-' + sus.badge_estado.color : 'bg-secondary'">
                              {{ sus.badge_estado?.texto || sus.estado_vigencia }}
                            </span>
                          </td></tr>
                          <tr><th>Fecha Inicio</th><td>{{ sus.fecha_inicio_formatted }}</td></tr>
                          <tr><th>Fecha Fin</th><td>{{ sus.fecha_fin_formatted }}</td></tr>
                          <tr *ngIf="sus.razon_cancelacion"><th>Razón Cancelación</th><td class="text-danger">{{ sus.razon_cancelacion }}</td></tr>
                          <tr><th>Creado el</th><td>{{ formatDate(sus.created_at) }}</td></tr>
                          <tr><th>Actualizado el</th><td>{{ formatDate(sus.updated_at) }}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Monitoreo -->
              <div class="col-md-4">
                <h6 class="text-info">
                  <i class="fas fa-search me-2"></i>
                  Monitoreo ({{ empresaItem.suscripciones.monitoreo.length }})
                </h6>
                <div *ngIf="empresaItem.suscripciones.monitoreo.length === 0" class="text-muted small">
                  Sin suscripciones
                </div>
                <div *ngFor="let sus of empresaItem.suscripciones.monitoreo" class="card mb-2 border-info">
                  <div class="card-body p-2">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="badge" [class.bg-success]="sus.esta_activa" [class.bg-secondary]="!sus.esta_activa">
                        {{ sus.estado }}
                      </span>
                      <span class="badge bg-primary">{{ sus.nombre_paquete }}</span>
                    </div>
                    <div class="mt-2 small">
                      <strong>{{ formatCurrency(sus.precio_mensual) }}/{{ sus.modalidad_pago }}</strong>
                    </div>
                    <div class="small text-muted">
                      <i class="fas fa-users me-1"></i>
                      Clientes: {{ sus.clientes_actuales }}/{{ sus.clientes_max }}
                      <span class="text-muted">(Min: {{ sus.clientes_min }})</span>
                    </div>
                    <div class="small">
                      <div class="progress" style="height: 5px;">
                        <div class="progress-bar bg-info"
                             [style.width.%]="sus.capacidad_usada_porcentaje"
                             [title]="'Capacidad usada: ' + sus.capacidad_usada_porcentaje + '%'">
                        </div>
                      </div>
                      <span class="text-muted" style="font-size: 0.65rem;">
                        Capacidad: {{ sus.capacidad_usada_porcentaje }}%
                      </span>
                    </div>
                    <div class="small text-muted">
                      <i class="fas fa-calendar-alt me-1"></i>
                      Próximo ciclo: {{ sus.fecha_proximo_ciclo_formatted }}
                    </div>
                    <div class="small text-muted">
                      <i class="fas fa-clock me-1"></i>
                      {{ sus.dias_hasta_facturacion }} días
                    </div>
                    <div *ngIf="sus.intentos_cobro_fallidos > 0" class="small text-danger">
                      <i class="fas fa-exclamation-circle me-1"></i>
                      {{ sus.intentos_cobro_fallidos }} intento(s) fallido(s)
                    </div>
                    <div *ngIf="sus.descuento_aplicado !== '0.00'" class="small text-success">
                      <i class="fas fa-tag me-1"></i>
                      Descuento: {{ sus.descuento_aplicado }}%
                      <span *ngIf="sus.codigo_promocional_aplicado">({{ sus.codigo_promocional_aplicado }})</span>
                    </div>

                    <!-- Botón para expandir detalles completos -->
                    <button
                      class="btn btn-sm btn-outline-info mt-2 w-100"
                      (click)="toggleSection(empresaItem.empresa.emp_id, 'monitoreo_' + sus.id)">
                      <i class="fas fa-info-circle me-1"></i>
                      {{ isSectionCollapsed(empresaItem.empresa.emp_id, 'monitoreo_' + sus.id) ? 'Ver' : 'Ocultar' }} Detalles Completos
                    </button>

                    <!-- Detalles completos colapsables -->
                    <div *ngIf="!isSectionCollapsed(empresaItem.empresa.emp_id, 'monitoreo_' + sus.id)" class="mt-2 p-2 bg-light rounded">
                      <table class="table table-sm table-bordered mb-0">
                        <tbody>
                          <tr><th width="50%">ID Suscripción</th><td>{{ sus.id }}</td></tr>
                          <tr><th>ID Paquete</th><td>{{ sus.paquete_id }}</td></tr>
                          <tr><th>Método de Pago</th><td>{{ sus.metodo_pago }}</td></tr>
                          <tr><th>Stripe Customer ID</th><td><small>{{ sus.stripe_customer_id || 'N/A' }}</small></td></tr>
                          <tr><th>Stripe Subscription ID</th><td><small>{{ sus.stripe_subscription_id || 'N/A' }}</small></td></tr>
                          <tr><th>Fecha Inicio</th><td>{{ sus.fecha_inicio_formatted }}</td></tr>
                          <tr><th>Fecha Fin</th><td>{{ sus.fecha_fin_formatted || 'N/A (Sin fin)' }}</td></tr>
                          <tr><th>Última Facturación</th><td>{{ formatDate(sus.fecha_ultima_facturacion) }}</td></tr>
                          <tr><th>Ciclo Facturación Activo</th><td>{{ formatBoolean(sus.ciclo_facturacion_activo) }}</td></tr>
                          <tr *ngIf="sus.ultima_fecha_intento_cobro"><th>Último Intento de Cobro</th><td>{{ formatDate(sus.ultima_fecha_intento_cobro) }}</td></tr>
                          <tr><th>Estado de Vigencia</th><td>
                            <span class="badge" [ngClass]="sus.badge_estado?.color ? 'bg-' + sus.badge_estado?.color : 'bg-secondary'">
                              {{ sus.badge_estado?.texto || sus.estado_vigencia }}
                            </span>
                          </td></tr>
                          <tr *ngIf="sus.razon_cancelacion"><th>Razón Cancelación</th><td class="text-danger">{{ sus.razon_cancelacion }}</td></tr>
                          <tr><th>Creado el</th><td>{{ formatDate(sus.created_at) }}</td></tr>
                          <tr><th>Actualizado el</th><td>{{ formatDate(sus.updated_at) }}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Verificación -->
              <div class="col-md-4">
                <h6 class="text-success">
                  <i class="fas fa-check-circle me-2"></i>
                  Verificación ({{ empresaItem.suscripciones.verificacion.length }})
                </h6>
                <div *ngIf="empresaItem.suscripciones.verificacion.length === 0" class="text-muted small">
                  Sin suscripciones
                </div>
                <div *ngFor="let sus of empresaItem.suscripciones.verificacion" class="card mb-2 border-success">
                  <div class="card-body p-2">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="badge"
                            [class.bg-success]="sus.esta_activa && !sus.esta_en_prueba"
                            [class.bg-warning]="sus.esta_en_prueba"
                            [class.bg-secondary]="!sus.esta_activa"
                            [class.text-dark]="sus.esta_en_prueba">
                        {{ sus.estado }}
                      </span>
                      <span class="badge bg-primary">{{ sus.tipo_plan }}</span>
                    </div>
                    <div class="mt-2 small">
                      <strong>{{ formatCurrency(sus.precio_mensual) }}/mes</strong>
                      <span *ngIf="sus.precio_total !== sus.precio_mensual"> (Total: {{ formatCurrency(sus.precio_total) }})</span>
                    </div>
                    <div class="small text-muted">
                      <i class="fas fa-box me-1"></i>
                      {{ sus.nombre_paquete }}
                    </div>
                    <div class="small"
                         [class.text-warning]="sus.esta_en_prueba"
                         [class.text-muted]="!sus.esta_en_prueba">
                      <i class="fas fa-info-circle me-1"></i>
                      Estado de pago:
                      <span class="badge badge-sm"
                            [class.bg-success]="sus.payment_status === 'PAID'"
                            [class.bg-warning]="sus.payment_status === 'PENDING_METHOD' || sus.payment_status === 'READY'"
                            [class.bg-danger]="sus.payment_status === 'FAILED' || sus.payment_status === 'PAST_DUE'"
                            [class.text-dark]="sus.payment_status === 'PENDING_METHOD' || sus.payment_status === 'READY'">
                        {{ sus.payment_status }}
                      </span>
                    </div>
                    <div class="small text-warning mt-1" *ngIf="sus.esta_en_prueba">
                      <i class="fas fa-flask me-1"></i>
                      <strong>Período de prueba</strong>
                    </div>
                    <div class="small text-muted" *ngIf="sus.esta_en_prueba">
                      <i class="fas fa-calendar-times me-1"></i>
                      Vence: {{ sus.fecha_prueba_fin_formatted }}
                    </div>
                    <div class="small text-muted" *ngIf="sus.esta_en_prueba">
                      <i class="fas fa-clock me-1"></i>
                      {{ sus.dias_restantes_prueba }} días restantes
                    </div>
                    <div class="small text-muted" *ngIf="!sus.esta_en_prueba">
                      <i class="fas fa-calendar-alt me-1"></i>
                      Próximo corte: {{ sus.fecha_prox_corte_formatted }}
                    </div>
                    <div class="small text-muted" *ngIf="!sus.esta_en_prueba">
                      <i class="fas fa-clock me-1"></i>
                      {{ sus.dias_hasta_proximo_ciclo }} días
                    </div>
                    <div *ngIf="sus.prueba_utilizada === 1 && !sus.esta_en_prueba" class="small text-info">
                      <i class="fas fa-check-circle me-1"></i>
                      Prueba ya utilizada
                    </div>
                    <div *ngIf="sus.reintentos_pago > 0" class="small text-danger">
                      <i class="fas fa-exclamation-triangle me-1"></i>
                      {{ sus.reintentos_pago }} reintento(s) de pago
                    </div>
                    <div *ngIf="sus.renovacion_automatica === 1" class="small text-success">
                      <i class="fas fa-sync-alt me-1"></i>
                      Renovación automática
                    </div>

                    <!-- Botón para expandir detalles completos -->
                    <button
                      class="btn btn-sm btn-outline-success mt-2 w-100"
                      (click)="toggleSection(empresaItem.empresa.emp_id, 'verificacion_' + sus.id)">
                      <i class="fas fa-info-circle me-1"></i>
                      {{ isSectionCollapsed(empresaItem.empresa.emp_id, 'verificacion_' + sus.id) ? 'Ver' : 'Ocultar' }} Detalles Completos
                    </button>

                    <!-- Detalles completos colapsables -->
                    <div *ngIf="!isSectionCollapsed(empresaItem.empresa.emp_id, 'verificacion_' + sus.id)" class="mt-2 p-2 bg-light rounded">
                      <table class="table table-sm table-bordered mb-0">
                        <tbody>
                          <tr><th width="50%">ID Suscripción</th><td>{{ sus.id }}</td></tr>
                          <tr><th>ID Paquete</th><td>{{ sus.id_paquete }}</td></tr>
                          <tr><th>Método de Pago</th><td>{{ sus.metodo_pago }}</td></tr>
                          <tr><th>En Período de Prueba</th><td>{{ formatBoolean(sus.en_periodo_prueba) }}</td></tr>
                          <tr><th>Prueba Utilizada</th><td>{{ formatBoolean(sus.prueba_utilizada) }}</td></tr>
                          <tr *ngIf="sus.fecha_prueba_inicio"><th>Inicio Prueba</th><td>{{ sus.fecha_prueba_inicio_formatted }}</td></tr>
                          <tr *ngIf="sus.fecha_prueba_fin"><th>Fin Prueba</th><td>{{ sus.fecha_prueba_fin_formatted }}</td></tr>
                          <tr><th>Fecha Inicio</th><td>{{ sus.fecha_inicio_formatted }}</td></tr>
                          <tr><th>Fecha Fin</th><td>{{ sus.fecha_fin_formatted || 'N/A' }}</td></tr>
                          <tr><th>Es Activa</th><td>{{ formatBoolean(sus.es_activa) }}</td></tr>
                          <tr><th>Stripe Customer ID</th><td><small>{{ sus.stripe_customer_id || 'N/A' }}</small></td></tr>
                          <tr><th>Stripe Subscription ID</th><td><small>{{ sus.stripe_subscription_id || 'N/A' }}</small></td></tr>
                          <tr *ngIf="sus.stripe_checkout_session_id"><th>Stripe Checkout Session</th><td><small>{{ sus.stripe_checkout_session_id }}</small></td></tr>
                          <tr *ngIf="sus.stripe_price_id"><th>Stripe Price ID</th><td><small>{{ sus.stripe_price_id }}</small></td></tr>
                          <tr *ngIf="sus.payment_hash"><th>Payment Hash</th><td><small>{{ sus.payment_hash }}</small></td></tr>
                          <tr><th>Ciclo Facturación Activo</th><td>{{ formatBoolean(sus.ciclo_facturacion_activo) }}</td></tr>
                          <tr><th>Renovación Automática</th><td>{{ formatBoolean(sus.renovacion_automatica) }}</td></tr>
                          <tr><th>Reintentos de Pago</th><td>{{ sus.reintentos_pago }}</td></tr>
                          <tr *ngIf="sus.ultimo_intento_pago"><th>Último Intento Pago</th><td>{{ formatDate(sus.ultimo_intento_pago) }}</td></tr>
                          <tr *ngIf="sus.proximo_intento_pago"><th>Próximo Intento Pago</th><td>{{ formatDate(sus.proximo_intento_pago) }}</td></tr>
                          <tr *ngIf="sus.fecha_cancelacion"><th>Fecha Cancelación</th><td class="text-danger">{{ formatDate(sus.fecha_cancelacion) }}</td></tr>
                          <tr *ngIf="sus.motivo_cancelacion"><th>Motivo Cancelación</th><td class="text-danger">{{ sus.motivo_cancelacion }}</td></tr>
                          <tr *ngIf="sus.webhook_last_event"><th>Último Webhook Event</th><td><small>{{ sus.webhook_last_event }}</small></td></tr>
                          <tr *ngIf="sus.webhook_last_ts"><th>Último Webhook Timestamp</th><td>{{ formatDate(sus.webhook_last_ts) }}</td></tr>
                          <tr><th>Creado el</th><td>{{ formatDate(sus.created_at) }}</td></tr>
                          <tr><th>Actualizado el</th><td>{{ formatDate(sus.updated_at) }}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Métodos de Pago -->
            <div class="row mb-3" *ngIf="empresaItem.metodos_pago.length > 0">
              <div class="col-12">
                <h6>
                  <i class="fas fa-credit-card me-2"></i>
                  Métodos de Pago ({{ empresaItem.metodos_pago.length }})
                </h6>
                <div class="table-responsive">
                  <table class="table table-sm table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Marca</th>
                        <th>Últimos 4</th>
                        <th>Expira</th>
                        <th>Estado</th>
                        <th>Default</th>
                        <th>Stripe IDs</th>
                        <th>Último Cobro Exitoso</th>
                        <th>Último Cobro Fallido</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let mp of empresaItem.metodos_pago">
                        <td>{{ mp.id }}</td>
                        <td><i class="fab fa-cc-{{ mp.card_brand }} me-1"></i> {{ mp.card_brand | uppercase }}</td>
                        <td>**** {{ mp.card_last4 }}</td>
                        <td>
                          <span [class.text-danger]="mp.tarjeta_expirada">
                            {{ mp.expira_en }}
                            <i *ngIf="mp.tarjeta_expirada" class="fas fa-exclamation-triangle text-danger ms-1" title="Tarjeta expirada"></i>
                          </span>
                        </td>
                        <td>
                          <span class="badge" [class.bg-success]="mp.estado === 'activo'" [class.bg-secondary]="mp.estado !== 'activo'">
                            {{ mp.estado }}
                          </span>
                        </td>
                        <td>
                          <span *ngIf="mp.es_default === 1" class="badge bg-primary">
                            <i class="fas fa-star me-1"></i>Default
                          </span>
                          <span *ngIf="mp.es_default !== 1" class="text-muted">-</span>
                        </td>
                        <td>
                          <small>
                            <div><strong>Customer:</strong> {{ mp.stripe_customer_id }}</div>
                            <div><strong>Payment Method:</strong> {{ mp.stripe_payment_method_id }}</div>
                          </small>
                        </td>
                        <td>{{ mp.ultimo_cobro_exitoso_formatted || 'N/A' }}</td>
                        <td>
                          <span *ngIf="mp.ultimo_cobro_fallido_formatted" class="text-danger">
                            {{ mp.ultimo_cobro_fallido_formatted }}
                            <i class="fas fa-times-circle ms-1"></i>
                          </span>
                          <span *ngIf="!mp.ultimo_cobro_fallido_formatted" class="text-muted">N/A</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Transacciones Recientes -->
            <div class="row" *ngIf="empresaItem.transacciones_recientes.length > 0">
              <div class="col-12">
                <h6>
                  <i class="fas fa-exchange-alt me-2"></i>
                  Transacciones Recientes ({{ empresaItem.transacciones_recientes.length }})
                </h6>
                <div class="table-responsive">
                  <table class="table table-sm table-striped">
                    <thead class="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Fecha Pago</th>
                        <th>Tipo</th>
                        <th>Módulo</th>
                        <th>Paquete</th>
                        <th>Monto</th>
                        <th>Moneda</th>
                        <th>Estado</th>
                        <th>Estado Stripe</th>
                        <th>Payment Intent ID</th>
                        <th>Vigencia Suscripción</th>
                        <th>Creado el</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let tx of empresaItem.transacciones_recientes">
                        <td>{{ tx.id }}</td>
                        <td>{{ tx.fecha_formatted }}</td>
                        <td><small>{{ tx.tipo_transaccion }}</small></td>
                        <td>
                          <span class="badge"
                                [class.bg-primary]="tx.modulo === 'reportes'"
                                [class.bg-info]="tx.modulo === 'monitoreo'"
                                [class.bg-success]="tx.modulo === 'verificacion'">
                            {{ tx.modulo }}
                          </span>
                        </td>
                        <td>{{ tx.nombre_paquete }}</td>
                        <td><strong>{{ formatCurrency(tx.monto) }}</strong></td>
                        <td>{{ tx.moneda }}</td>
                        <td>
                          <span class="badge"
                                [class.bg-success]="tx.estatus === 'exitoso'"
                                [class.bg-danger]="tx.estatus === 'fallido'"
                                [class.bg-warning]="tx.estatus === 'pendiente'"
                                [class.text-dark]="tx.estatus === 'pendiente'">
                            {{ tx.estatus }}
                          </span>
                        </td>
                        <td><small>{{ tx.estatus_stripe }}</small></td>
                        <td><small class="text-muted">{{ tx.stripe_payment_intent_id }}</small></td>
                        <td>
                          <span *ngIf="tx.badge_vigencia" class="badge"
                                [ngClass]="tx.badge_vigencia.color ? 'bg-' + tx.badge_vigencia.color : 'bg-secondary'">
                            <i *ngIf="tx.badge_vigencia.icono" class="fas fa-{{ tx.badge_vigencia.icono }} me-1"></i>
                            {{ tx.badge_vigencia.texto }}
                          </span>
                          <span *ngIf="!tx.badge_vigencia" class="text-muted">-</span>
                        </td>
                        <td><small>{{ formatDate(tx.created_at) }}</small></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div *ngIf="empresasData && empresasData.empresas.length === 0" class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        No se encontraron empresas con los filtros especificados.
      </div>
    </div>
  `,
  styles: [`
    .empresas-suscripciones-dashboard {
      position: relative;
      z-index: 1;
    }

    .empresa-card {
      transition: all 0.3s ease;
      border-left: 5px solid #4e73df;
    }

    .empresa-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 1rem 3rem rgba(0,0,0,.175) !important;
    }

    .bg-gradient-primary {
      background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
    }

    .empresa-numero {
      background: rgba(255, 255, 255, 0.2);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: bold;
    }

    .card.border-primary {
      border-left: 3px solid #4e73df;
    }

    .card.border-info {
      border-left: 3px solid #36b9cc;
    }

    .card.border-success {
      border-left: 3px solid #1cc88a;
    }

    .progress {
      margin-top: 5px;
      margin-bottom: 3px;
    }

    .badge-sm {
      font-size: 0.65rem;
      padding: 0.2rem 0.4rem;
    }

    .table-sm th,
    .table-sm td {
      font-size: 0.85rem;
      padding: 0.4rem;
    }

    .fab {
      font-size: 1.1rem;
    }
  `]
})
export class EmpresasSuscripcionesDashboardComponent implements OnInit, OnDestroy {
  empresasData: EmpresasConSuscripciones | null = null;
  isLoading = false;
  error: string | null = null;

  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;

  filtros: FiltrosEmpresasSuscripciones = {
    limite: 10,
    estado_suscripcion: 'todas'
  };

  // Control de secciones colapsables
  collapsedSections: { [key: string]: { [section: string]: boolean } } = {};

  constructor(
    public facade: DashboardAdminFacade,
    public dashboardService: DashboardAdminService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Leer el ambiente del query parameter
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['env']) {
        this.selectedEnvironment = queryParams['env'] as 'qa' | 'prod';
      }
    });

    this.subscribeToFacade();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.facade.disableAutoRefresh();
  }

  private subscribeToFacade(): void {
    this.facade.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });

    this.facade.error$.subscribe(error => {
      this.error = error;
    });

    this.facade.empresasConSuscripciones$.subscribe(data => {
      this.empresasData = data;
    });
  }

  loadData(): void {
    const baseUrl = this.getCurrentBaseUrl();
    this.facade.loadEmpresasConSuscripciones(baseUrl, this.filtros);
  }

  refreshData(): void {
    this.loadData();
  }

  aplicarFiltros(): void {
    this.loadData();
  }

  limpiarFiltros(): void {
    this.filtros = {
      limite: 10,
      estado_suscripcion: 'todas'
    };
    this.loadData();
  }

  onEnvironmentChange(): void {
    this.facade.clearState();
    this.loadData();
  }

  getCurrentBaseUrl(): string {
    return this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
  }

  goBack(): void {
    this.router.navigate(['/dashboard-admin']);
  }

  formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(num);
  }

  toggleSection(empresaId: number, section: string): void {
    const key = `emp_${empresaId}`;
    if (!this.collapsedSections[key]) {
      this.collapsedSections[key] = {};
    }
    this.collapsedSections[key][section] = !this.collapsedSections[key][section];
  }

  isSectionCollapsed(empresaId: number, section: string): boolean {
    const key = `emp_${empresaId}`;
    return this.collapsedSections[key]?.[section] ?? true; // Default collapsed
  }

  formatBoolean(value: number | string | boolean): string {
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'string') return value === 'true' || value === '1' ? 'Sí' : 'No';
    return value === 1 ? 'Sí' : 'No';
  }

  formatDate(date: string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
