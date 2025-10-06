import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BitacoraService } from '../services/bitacora.service';
import {
  SessionJourney,
  SessionJourneyStep,
  SessionJourneyInfo,
  RealSessionJourneyResponse,
  UserSearchResult,
  UserSearchResponse,
  LoginIdsResponse,
  LoginIdsData
} from '../types/bitacora.types';

@Component({
  selector: 'app-session-journey',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid p-4">
      <!-- Search Header -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="fas fa-route me-2"></i>
            Búsqueda de Journey de Sesión
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-8">
              <!-- User Search Dropdown -->
              <div class="mb-3">
                <label class="form-label">Buscar Usuario:</label>
                <div class="position-relative">
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="userSearchTerm"
                    placeholder="Buscar por email, nombre, apellido, empresa o RFC..."
                    (input)="onUserSearch()"
                    (focus)="onUserFocus()"
                    (blur)="onUserBlur()"
                    autocomplete="off">
                  
                  
                  <!-- Loading indicator -->
                  <div *ngIf="userSearchLoading" class="position-absolute top-50 end-0 translate-middle-y me-3">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                      <span class="visually-hidden">Buscando...</span>
                    </div>
                  </div>
                  
                  <!-- User dropdown -->
                  <div *ngIf="showUserDropdown && users.length > 0" 
                       class="dropdown-menu show w-100 user-dropdown-menu">
                    <div *ngFor="let user of users" 
                         class="dropdown-item user-dropdown-item"
                         (mousedown)="selectUser(user)">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                          <div class="fw-bold text-primary">{{ user.display_name }}</div>
                          <small class="text-muted">ID: {{ user.usuario_id }}</small>
                          <div *ngIf="user.empresa_principal" class="mt-1">
                            <small class="text-info">
                              <i class="fas fa-building me-1"></i>
                              {{ user.empresa_principal }}
                            </small>
                            <span *ngIf="user.total_empresas > 1" class="badge bg-secondary ms-1">
                              +{{ user.total_empresas - 1 }} más
                            </span>
                          </div>
                          <div *ngIf="!user.empresa_principal" class="mt-1">
                            <small class="text-warning">
                              <i class="fas fa-exclamation-triangle me-1"></i>
                              Sin empresa asignada
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- No results -->
                  <div *ngIf="showUserDropdown && users.length === 0 && userSearchTerm.length > 2 && !userSearchLoading" 
                       class="dropdown-menu show w-100">
                    <div class="dropdown-item-text text-muted text-center py-3">
                      <i class="fas fa-search me-2"></i>
                      No se encontraron usuarios
                    </div>
                  </div>
                </div>
                
                <!-- Selected user info -->
                <div *ngIf="selectedUser" class="mt-2 p-2 bg-info bg-opacity-10 border border-info rounded">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <small class="text-info fw-bold">Usuario seleccionado:</small>
                      <div>{{ selectedUser.display_name }}</div>
                      <small class="text-muted">ID: {{ selectedUser.usuario_id }}</small>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-secondary" (click)="clearSelectedUser()">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Date Selection -->
              <div class="mb-3">
                <label class="form-label">Fecha de Búsqueda:</label>
                <input
                  type="date"
                  class="form-control"
                  [(ngModel)]="selectedDate"
                  (change)="onDateChange()"
                  [disabled]="!selectedUser"
                  placeholder="Seleccione una fecha">
              </div>

              <!-- Login ID Dropdown -->
              <div class="mb-3" *ngIf="selectedUser && selectedDate">
                <label class="form-label">Seleccionar Login ID:</label>
                <div class="position-relative">
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="loginIdSearchTerm"
                    placeholder="Buscar login ID..."
                    (input)="onLoginIdSearch()"
                    (focus)="showLoginIdDropdown = true"
                    (blur)="onLoginIdBlur()"
                    autocomplete="off">
                  
                  <!-- Loading indicator -->
                  <div *ngIf="loginIdsLoading" class="position-absolute top-50 end-0 translate-middle-y me-3">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                      <span class="visually-hidden">Cargando login IDs...</span>
                    </div>
                  </div>
                  
                  <!-- Login ID dropdown -->
                  <div *ngIf="showLoginIdDropdown && filteredLoginIds.length > 0" 
                       class="dropdown-menu show w-100 loginid-dropdown-menu">
                    <div *ngFor="let loginId of filteredLoginIds" 
                         class="dropdown-item loginid-dropdown-item"
                         (mousedown)="selectLoginId(loginId)">
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="flex-grow-1">
                          <code class="text-primary">{{ loginId }}</code>
                        </div>
                        <div *ngIf="getLoginIdStats(loginId)" class="text-end">
                          <small class="text-muted">
                            {{ getLoginIdSessionCount(loginId) }} sesiones
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- No results -->
                  <div *ngIf="showLoginIdDropdown && filteredLoginIds.length === 0 && loginIdSearchTerm.length > 0 && !loginIdsLoading" 
                       class="dropdown-menu show w-100">
                    <div class="dropdown-item-text text-muted text-center py-3">
                      <i class="fas fa-search me-2"></i>
                      No se encontraron login IDs que coincidan
                    </div>
                  </div>
                </div>
                
                <!-- Login IDs Statistics -->
                <div *ngIf="loginIdsData" class="mt-2 p-2 bg-info bg-opacity-10 border border-info rounded">
                  <div class="row text-center">
                    <div class="col-md-4">
                      <small class="text-info fw-bold">Total Sesiones</small>
                      <div class="fw-bold">{{ loginIdsData.total_registros }}</div>
                    </div>
                    <div class="col-md-4">
                      <small class="text-warning fw-bold">Tokens Expirados</small>
                      <div class="fw-bold">{{ loginIdsData.estadisticas.tokens_expirados }}</div>
                    </div>
                    <div class="col-md-4">
                      <small class="text-danger fw-bold">Tokens con Error</small>
                      <div class="fw-bold">{{ loginIdsData.estadisticas.tokens_con_error }}</div>
                    </div>
                  </div>
                  <div class="row mt-2">
                    <div class="col-12 text-center">
                      <small class="text-success fw-bold">Login ID Único Disponible</small>
                      <div class="mt-1">
                        <code class="bg-success bg-opacity-10 text-success p-2 rounded">
                          {{ loginIdsData.login_ids_unicos[0] }}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Selected login ID info -->
                <div *ngIf="selectedLoginId" class="mt-2 p-2 bg-success bg-opacity-10 border border-success rounded">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <small class="text-success fw-bold">Login ID seleccionado:</small>
                      <div><code>{{ selectedLoginId }}</code></div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-secondary" (click)="clearSelectedLoginId()">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <label class="form-label">Login ID Manual:</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="searchLoginId"
                placeholder="Ingrese el Login ID para ver el journey completo"
                (keyup.enter)="searchJourney()">
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <div class="btn-group-responsive d-flex flex-wrap gap-2 w-100">
                <button class="btn btn-primary btn-action" (click)="searchJourney()" [disabled]="!searchLoginId || loading">
                  <i class="fas fa-search me-2"></i>
                  Buscar Journey
                </button>
                <button class="btn btn-outline-secondary btn-action" (click)="clearJourney()">
                  <i class="fas fa-times me-2"></i>
                  Limpiar
                </button>
                <button class="btn btn-outline-info btn-action" (click)="toggleSessionSearch()">
                  <i class="fas fa-search-plus me-2"></i>
                  Búsqueda Avanzada
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Session Search -->
      <div *ngIf="showSessionSearch" class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="fas fa-search-plus me-2"></i>
            Búsqueda Avanzada de Sesiones
          </h5>
        </div>
        <div class="card-body">
          <!-- Search Filters -->
          <div class="row mb-3">
            <div class="col-md-3">
              <label class="form-label">Usuario ID:</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="sessionSearchFilters.usuario_id"
                placeholder="ID del usuario">
            </div>
            <div class="col-md-3">
              <label class="form-label">Empresa ID:</label>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="sessionSearchFilters.empresa_id"
                placeholder="ID de la empresa">
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha Inicio:</label>
              <input
                type="datetime-local"
                class="form-control"
                [(ngModel)]="sessionSearchFilters.fecha_inicio">
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha Fin:</label>
              <input
                type="datetime-local"
                class="form-control"
                [(ngModel)]="sessionSearchFilters.fecha_fin">
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">Ejecución del Algoritmo:</label>
              <select class="form-select" [(ngModel)]="sessionSearchFilters.has_algorithm_execution">
                <option [value]="null">Todas las sesiones</option>
                <option [value]="true">Solo con ejecución del algoritmo</option>
                <option [value]="false">Sin ejecución del algoritmo</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Razón de Fallo:</label>
              <select class="form-select" [(ngModel)]="sessionSearchFilters.razon_fallo">
                <option value="">Todas</option>
                <option value="incomplete_initial_information">Información Inicial Incompleta</option>
                <option value="certification_not_found">Certificación No Encontrada</option>
                <option value="incomplete_algorithm_information">Información del Algoritmo Incompleta</option>
                <option value="algorithm_execution_error">Error en Ejecución del Algoritmo</option>
                <option value="session_expired">Sesión Expirada</option>
                <option value="invalid_token">Token Inválido</option>
              </select>
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <div class="btn-group-responsive d-flex flex-wrap gap-2 w-100">
                <button class="btn btn-primary btn-action" (click)="searchSessions()" [disabled]="sessionSearchLoading">
                  <i class="fas fa-search me-2"></i>
                  Buscar Sesiones
                </button>
                <button class="btn btn-outline-secondary btn-action" (click)="clearSessionSearch()">
                  <i class="fas fa-times me-2"></i>
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div *ngIf="sessionSearchLoading" class="text-center py-3">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Buscando sesiones...</span>
            </div>
          </div>

          <!-- Search Results -->
          <div *ngIf="sessionSearchResults.length > 0 && !sessionSearchLoading">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">
                  <i class="fas fa-search me-2"></i>
                  Resultados de Búsqueda
                </h6>
                <div class="d-flex align-items-center gap-3">
                  <!-- Quick pagination in header -->
                  <div *ngIf="sessionSearchPagination && sessionSearchPagination.totalPages > 1" class="d-flex align-items-center gap-2">
                    <small class="text-muted">Página:</small>
                    <div class="btn-group btn-group-sm" role="group">
                      <button type="button" 
                              class="btn btn-outline-secondary"
                              (click)="goToSessionPage(sessionSearchPagination.page - 1)" 
                              [disabled]="sessionSearchPagination.page === 1"
                              title="Página anterior">
                        <i class="fas fa-chevron-left"></i>
                      </button>
                      <button type="button" class="btn btn-outline-secondary disabled">
                        {{ sessionSearchPagination.page }} / {{ sessionSearchPagination.totalPages }}
                      </button>
                      <button type="button" 
                              class="btn btn-outline-secondary"
                              (click)="goToSessionPage(sessionSearchPagination.page + 1)" 
                              [disabled]="sessionSearchPagination.page === sessionSearchPagination.totalPages"
                              title="Página siguiente">
                        <i class="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                  <span class="badge bg-primary fs-6" *ngIf="sessionSearchPagination">
                    Total: {{ sessionSearchPagination.total }}
                  </span>
                </div>
              </div>
              <div class="card-body">
                <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Login ID</th>
                    <th>Usuario</th>
                    <th>Empresa</th>
                    <th>Inicio Sesión</th>
                    <th>Duración</th>
                    <th>Requests</th>
                    <th>Algoritmo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let session of sessionSearchResults">
                    <td>
                      <code class="small">{{ session.login_id }}</code>
                    </td>
                    <td>
                      <div>
                        <strong>{{ session.usuario_nombre }}</strong>
                        <br><small class="text-muted">{{ session.usuario_email }}</small>
                      </div>
                    </td>
                    <td>{{ session.empresa_nombre }}</td>
                    <td>
                      <small>{{ session.session_start | date:'dd/MM/yyyy HH:mm' }}</small>
                    </td>
                    <td>
                      <span [class]="getDurationClass(session.total_duration_ms)">
                        {{ formatDuration(session.total_duration_ms) }}
                      </span>
                    </td>
                    <td>
                      <span class="badge bg-primary">{{ session.total_requests }}</span>
                      <span class="badge bg-success ms-1" *ngIf="session.successful_requests > 0">
                        {{ session.successful_requests }} ✓
                      </span>
                      <span class="badge bg-danger ms-1" *ngIf="session.failed_requests > 0">
                        {{ session.failed_requests }} ✗
                      </span>
                    </td>
                    <td>
                      <span class="badge" [class]="session.algorithm_executions > 0 ? 'bg-success' : 'bg-secondary'">
                        {{ session.algorithm_executions }} ejecuciones
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary" 
                              (click)="viewSessionJourney(session.login_id)"
                              title="Ver journey completo">
                        <i class="fas fa-route"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <nav *ngIf="sessionSearchPagination && sessionSearchPagination.totalPages > 1" class="mt-3">
              <ul class="pagination justify-content-center">
                <li class="page-item" [class.disabled]="!sessionSearchPagination.hasPrevPage">
                  <button class="page-link" (click)="goToSessionPage(sessionSearchPagination.page - 1)">
                    Anterior
                  </button>
                </li>
                <li class="page-item" 
                    *ngFor="let page of getSessionPageNumbers()" 
                    [class.active]="page === sessionSearchPagination.page">
                  <button class="page-link" (click)="goToSessionPage(page)">
                    {{ page }}
                  </button>
                </li>
                <li class="page-item" [class.disabled]="!sessionSearchPagination.hasNextPage">
                  <button class="page-link" (click)="goToSessionPage(sessionSearchPagination.page + 1)">
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div *ngIf="sessionSearchResults.length === 0 && !sessionSearchLoading && sessionSearchFilters.page === 1" class="text-center py-3">
            <i class="fas fa-search fa-2x text-muted mb-2"></i>
            <p class="text-muted">No se encontraron sesiones con los criterios especificados.</p>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="mt-2">Cargando journey de sesión...</div>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>

      <!-- Session Journey Results -->
      <div *ngIf="sessionJourney && !loading">
        <!-- Session Info Card -->
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="fas fa-user-clock me-2"></i>
              Información de la Sesión
            </h5>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-success btn-sm" (click)="exportJourney('pdf')">
                <i class="fas fa-file-pdf me-1"></i>
                PDF
              </button>
              <button class="btn btn-outline-primary btn-sm" (click)="exportJourney('excel')">
                <i class="fas fa-file-excel me-1"></i>
                Excel
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <table class="table table-sm">
                  <tr>
                    <td><strong>Login ID:</strong></td>
                    <td class="font-monospace">{{ sessionJourney.session_info.login_id }}</td>
                  </tr>
                  <tr>
                    <td><strong>Usuario:</strong></td>
                    <td>
                      <div>
                        <strong>{{ getSessionUserName() }}</strong>
                        <br><small class="text-muted">ID: {{ getSessionUserId() }}</small>
                        <br><small class="text-info">{{ getSessionUserEmail() }}</small>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Empresa:</strong></td>
                    <td>
                      <div>
                        <strong>{{ getSessionCompanyName() }}</strong>
                        <br><small class="text-muted">ID: {{ getSessionCompanyId() }}</small>
                        <br><small class="text-info">RFC: {{ getSessionCompanyRFC() }}</small>
                        <div *ngIf="getSessionCompanyPhone()" class="mt-1">
                          <small class="text-warning">
                            <i class="fas fa-phone me-1"></i>
                            {{ getSessionCompanyPhone() }}
                          </small>
                        </div>
                        <div *ngIf="getSessionCompanyRazonSocial() && getSessionCompanyRazonSocial() !== getSessionCompanyName()" class="mt-1">
                          <small class="text-secondary">
                            Razón Social: {{ getSessionCompanyRazonSocial() }}
                          </small>
                        </div>
                        <div *ngIf="getSessionCompanyDenominacion()" class="mt-1">
                          <small class="text-success">
                            <i class="fas fa-building me-1"></i>
                            Denominación: {{ getSessionCompanyDenominacion() }}
                          </small>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>IP Cliente:</strong></td>
                    <td>{{ sessionJourney.session_info.ip_cliente || 'N/A' }}</td>
                  </tr>
                </table>
              </div>
              <div class="col-md-6">
                <table class="table table-sm">
                  <tr>
                    <td><strong>Inicio de Sesión:</strong></td>
                    <td>{{ sessionJourney.session_info.session_start | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                  </tr>
                  <tr>
                    <td><strong>Fin de Sesión:</strong></td>
                    <td>
                      <span *ngIf="sessionJourney.session_info.session_end">
                        {{ sessionJourney.session_info.session_end | date:'dd/MM/yyyy HH:mm:ss' }}
                      </span>
                      <span *ngIf="!sessionJourney.session_info.session_end" class="badge bg-success">
                        Sesión Activa
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Duración Total:</strong></td>
                    <td>{{ formatDuration(sessionJourney.session_info.total_duration_ms) }}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Requests:</strong></td>
                    <td>
                      <span class="badge bg-primary">{{ sessionJourney.session_info.total_requests }}</span>
                      <span class="badge bg-success ms-1">{{ sessionJourney.session_info.successful_requests }} exitosos</span>
                      <span class="badge bg-danger ms-1" *ngIf="sessionJourney.session_info.failed_requests > 0">
                        {{ sessionJourney.session_info.failed_requests }} fallidos
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Status Usuario:</strong></td>
                    <td>
                      <span class="badge" [class]="getUserStatusClass()">
                        {{ getSessionUserStatus() }}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Session Statistics -->
        <div class="row mb-4">
          <div class="col-md-4">
            <div class="card border-left-primary">
              <div class="card-body">
                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                  Ejecuciones del Algoritmo
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ sessionJourney.session_info.algorithm_executions }}
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-left-success">
              <div class="card-body">
                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                  Tasa de Éxito del Algoritmo
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ sessionJourney.session_stats.algorithm_success_rate | number:'1.1-1' }}%
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-left-info">
              <div class="card-body">
                <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                  Tiempo Promedio de Respuesta
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ sessionJourney.session_stats.average_response_time | number:'1.0-0' }}ms
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Journey Timeline -->
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-timeline me-2"></i>
              Timeline de Actividad de la Sesión
            </h5>
          </div>
          <div class="card-body">
            <div class="timeline">
              <div *ngFor="let step of sessionJourney.steps; let i = index" 
                   class="timeline-item"
                   [class.timeline-success]="step.codigo_respuesta >= 200 && step.codigo_respuesta < 300"
                   [class.timeline-warning]="step.codigo_respuesta >= 400 && step.codigo_respuesta < 500"
                   [class.timeline-danger]="step.codigo_respuesta >= 500"
                   [class.timeline-algorithm]="isAlgorithmExecution(step)">
                
                <div class="timeline-marker">
                  <i class="fas" [class]="getStepIcon(step)"></i>
                </div>
                
                <div class="timeline-content">
                  <div class="timeline-header">
                    <div class="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 class="mb-1">
                          <span class="badge me-2" [ngClass]="{
                            'bg-success': step.metodo_http === 'GET',
                            'bg-primary': step.metodo_http === 'POST',
                            'bg-warning': step.metodo_http === 'PUT',
                            'bg-danger': step.metodo_http === 'DELETE'
                          }">{{ step.metodo_http }}</span>
                          <code class="text-primary">{{ step.endpoint_url }}</code>
                        </h6>
                        <small class="text-muted">
                          {{ step.timestamp | date:'dd/MM/yyyy HH:mm:ss.SSS' }}
                        </small>
                      </div>
                      <div class="text-end">
                        <span class="badge" [ngClass]="{
                          'bg-success': step.codigo_respuesta >= 200 && step.codigo_respuesta < 300,
                          'bg-warning': step.codigo_respuesta >= 400 && step.codigo_respuesta < 500,
                          'bg-danger': step.codigo_respuesta >= 500
                        }">{{ step.codigo_respuesta }}</span>
                        <div class="small text-muted">{{ step.duracion_ms }}ms</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="timeline-body mt-2">
                    <!-- Información específica del algoritmo -->
                    <div *ngIf="isAlgorithmExecution(step) && hasAlgorithmInfo(step)" class="algorithm-info mb-2">
                      <div class="d-flex align-items-center mb-2">
                        <i class="fas fa-brain text-purple me-2"></i>
                        <span class="fw-bold text-purple">Ejecución del Algoritmo</span>
                      </div>
                      
                      <div class="algorithm-details">
                        <!-- Primera fila: Resultado y Fallo -->
                        <div class="row mb-2" *ngIf="step.resultado || step.razon_fallo">
                          <div class="col-md-6" *ngIf="step.resultado">
                            <small><strong>Resultado:</strong></small>
                            <span class="badge bg-success ms-1">{{ step.resultado }}</span>
                          </div>
                          <div class="col-md-6" *ngIf="step.razon_fallo">
                            <small><strong>Razón de Fallo:</strong></small>
                            <span class="badge bg-danger ms-1">{{ getFailureReasonLabel(step.razon_fallo) }}</span>
                          </div>
                        </div>
                        
                        <!-- UUID si existe -->
                        <div *ngIf="step.custom_uuid" class="mb-2">
                          <small><strong>UUID Proceso:</strong></small>
                          <code class="small ms-1">{{ step.custom_uuid }}</code>
                        </div>
                        
                        <!-- Endpoint consumido si existe -->
                        <div *ngIf="step.endpoint_consumido" class="mb-1">
                          <small><strong>Endpoint Consumido:</strong></small>
                          <code class="small ms-1">{{ step.endpoint_consumido }}</code>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Error information -->
                    <div *ngIf="step.mensaje_error" class="error-info mt-2">
                      <small><strong>Error:</strong></small>
                      <div class="alert alert-danger alert-sm mt-1">
                        {{ step.mensaje_error }}
                      </div>
                    </div>
                    
                    <!-- Datos adicionales -->
                    <div *ngIf="step.datos_adicionales && hasAdditionalData(step.datos_adicionales)" class="additional-data mt-2">
                      <small><strong>Datos Adicionales:</strong></small>
                      <pre class="small mt-1 additional-data-content p-2 rounded">{{ formatAdditionalData(step.datos_adicionales) }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Patterns -->
        <div *ngIf="sessionJourney.session_stats.error_patterns.length > 0" class="card mt-4">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Patrones de Error en la Sesión
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div *ngFor="let pattern of sessionJourney.session_stats.error_patterns" class="col-md-4 mb-3">
                <div class="card border-left-danger">
                  <div class="card-body">
                    <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                      {{ getFailureReasonLabel(pattern.razon_fallo) }}
                    </div>
                    <div class="h6 mb-0 text-gray-800">
                      {{ pattern.count }} ocurrencias
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .border-left-primary {
      border-left: 0.25rem solid #4e73df !important;
    }
    .border-left-success {
      border-left: 0.25rem solid #1cc88a !important;
    }
    .border-left-info {
      border-left: 0.25rem solid #36b9cc !important;
    }
    .border-left-danger {
      border-left: 0.25rem solid #e74a3b !important;
    }
    .text-xs {
      font-size: 0.7rem;
    }
    
    .timeline {
      position: relative;
      padding-left: 2rem;
    }
    
    .timeline::before {
      content: '';
      position: absolute;
      left: 1.5rem;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(to bottom, #495057, #6c757d, #495057);
      border-radius: 1.5px;
      box-shadow: 0 0 8px rgba(108, 117, 125, 0.3);
    }
    
    .timeline-item {
      position: relative;
      padding-bottom: 2.5rem;
      opacity: 0;
      animation: timelineSlideIn 0.6s ease-out forwards;
    }
    
    .timeline-item:nth-child(even) {
      animation-delay: 0.1s;
    }
    
    .timeline-item:nth-child(odd) {
      animation-delay: 0.05s;
    }
    
    @keyframes timelineSlideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .timeline-marker {
      position: absolute;
      left: -2.5rem;
      top: 0.5rem;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      z-index: 2;
      border: 3px solid #212529;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    
    .timeline-marker:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
    }
    
    .timeline-success .timeline-marker {
      background: linear-gradient(135deg, #198754, #20c997);
      color: white;
      box-shadow: 0 4px 12px rgba(25, 135, 84, 0.4);
    }
    
    .timeline-warning .timeline-marker {
      background: linear-gradient(135deg, #ffc107, #ffda6a);
      color: #000;
      box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
    }
    
    .timeline-danger .timeline-marker {
      background: linear-gradient(135deg, #dc3545, #ea868f);
      color: white;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
    }
    
    .timeline-algorithm .timeline-marker {
      background: linear-gradient(135deg, #6f42c1, #9333ea);
      color: white;
      box-shadow: 0 4px 16px rgba(111, 66, 193, 0.5), 0 0 0 4px rgba(111, 66, 193, 0.2);
      animation: algorithmPulse 2s infinite;
    }
    
    @keyframes algorithmPulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 4px 16px rgba(111, 66, 193, 0.5), 0 0 0 4px rgba(111, 66, 193, 0.2);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(111, 66, 193, 0.7), 0 0 0 6px rgba(111, 66, 193, 0.3);
      }
    }
    
    .timeline-content {
      background: linear-gradient(135deg, #2c3034, #343a40);
      border: 1px solid #495057;
      border-radius: 0.5rem;
      padding: 1.25rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      color: #e9ecef;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .timeline-content::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, rgba(110, 168, 254, 0.5), transparent);
    }
    
    .timeline-content:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      border-color: #6c757d;
    }
    
    .timeline-success .timeline-content::before {
      background: linear-gradient(90deg, transparent, rgba(25, 135, 84, 0.6), transparent);
    }
    
    .timeline-warning .timeline-content::before {
      background: linear-gradient(90deg, transparent, rgba(255, 193, 7, 0.6), transparent);
    }
    
    .timeline-danger .timeline-content::before {
      background: linear-gradient(90deg, transparent, rgba(220, 53, 69, 0.6), transparent);
    }
    
    .timeline-algorithm .timeline-content::before {
      background: linear-gradient(90deg, transparent, rgba(111, 66, 193, 0.8), transparent);
    }
    
    .algorithm-info {
      background: linear-gradient(135deg, rgba(111, 66, 193, 0.1), rgba(147, 51, 234, 0.1));
      padding: 1rem;
      border-radius: 0.375rem;
      border-left: 4px solid #6f42c1;
      border: 1px solid rgba(111, 66, 193, 0.2);
      box-shadow: 0 4px 12px rgba(111, 66, 193, 0.1);
      color: #e9ecef;
      margin: 0.75rem 0;
    }
    
    .error-info .alert-sm {
      padding: 0.75rem;
      margin-bottom: 0;
      font-size: 0.8rem;
      background: linear-gradient(135deg, rgba(220, 53, 69, 0.1), rgba(234, 134, 143, 0.1)) !important;
      border: 1px solid rgba(220, 53, 69, 0.3) !important;
      color: #ea868f !important;
      border-radius: 0.375rem;
      box-shadow: 0 2px 8px rgba(220, 53, 69, 0.1);
    }
    
    .additional-data pre {
      font-size: 0.75rem;
      max-height: 120px;
      overflow-y: auto;
      background: linear-gradient(135deg, #1a1d20, #212529) !important;
      color: #adb5bd !important;
      border: 1px solid #495057 !important;
      border-radius: 0.375rem;
      padding: 0.75rem;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .additional-data pre::-webkit-scrollbar {
      width: 6px;
    }
    
    .additional-data pre::-webkit-scrollbar-track {
      background: #343a40;
      border-radius: 3px;
    }
    
    .additional-data pre::-webkit-scrollbar-thumb {
      background: #6c757d;
      border-radius: 3px;
    }
    
    .additional-data pre::-webkit-scrollbar-thumb:hover {
      background: #adb5bd;
    }
    
    /* Timeline header improvements */
    .timeline-header h6 {
      color: #ffffff !important;
      font-weight: 600;
    }
    
    .timeline-header .text-muted {
      color: #adb5bd !important;
    }
    
    .timeline-header code {
      background: rgba(110, 168, 254, 0.1) !important;
      color: #6ea8fe !important;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      border: 1px solid rgba(110, 168, 254, 0.2);
    }
    
    /* Badge improvements for dark theme */
    .badge {
      font-weight: 500;
      font-size: 0.75rem;
      padding: 0.375rem 0.75rem;
      border-radius: 0.25rem;
    }
    
    .badge.bg-success {
      background: linear-gradient(135deg, #198754, #20c997) !important;
      color: white !important;
      box-shadow: 0 2px 4px rgba(25, 135, 84, 0.3);
    }
    
    .badge.bg-primary {
      background: linear-gradient(135deg, #0d6efd, #6ea8fe) !important;
      color: white !important;
      box-shadow: 0 2px 4px rgba(13, 110, 253, 0.3);
    }
    
    .badge.bg-warning {
      background: linear-gradient(135deg, #ffc107, #ffda6a) !important;
      color: #000 !important;
      box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3);
    }
    
    .badge.bg-danger {
      background: linear-gradient(135deg, #dc3545, #ea868f) !important;
      color: white !important;
      box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
    }
    
    .badge.bg-secondary {
      background: linear-gradient(135deg, #6c757d, #adb5bd) !important;
      color: white !important;
      box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
    }
    
    /* Small text improvements */
    small, .small {
      color: #adb5bd !important;
    }
    
    small strong, .small strong {
      color: #e9ecef !important;
    }
    
    /* Additional data content styling */
    .additional-data-content {
      background: linear-gradient(135deg, #1a1d20, #212529) !important;
      color: #adb5bd !important;
      border: 1px solid #495057 !important;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    /* Purple text for algorithm sections */
    .text-purple {
      color: #9333ea !important;
    }
    
    /* Algorithm info header styling */
    .algorithm-info .fas.fa-brain {
      font-size: 1rem;
      text-shadow: 0 0 8px rgba(147, 51, 234, 0.5);
    }
    
    /* Better spacing for algorithm details */
    .algorithm-details .row {
      margin-left: 0;
      margin-right: 0;
    }
    
    .algorithm-details .row [class*="col-"] {
      padding-left: 0;
      padding-right: 0.75rem;
    }
    
    .font-monospace {
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
    }
    
    .btn-action {
      min-width: 140px;
      height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 0.875rem;
      border-radius: 6px;
      transition: all 0.2s ease-in-out;
      text-decoration: none;
      border-width: 1px;
      padding: 0.375rem 0.75rem;
      flex: 0 0 auto;
    }
    
    .btn-action:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
    }
    
    .btn-action:disabled {
      transform: none;
      box-shadow: none;
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-action i {
      font-size: 0.875rem;
    }
    
    .btn-group-responsive {
      max-width: 100%;
    }
    
    .gap-2 {
      gap: 0.5rem !important;
    }
    
    /* Responsive adjustments for small screens */
    @media (max-width: 767.98px) {
      .btn-action {
        min-width: 120px;
        font-size: 0.8rem;
        padding: 0.3rem 0.6rem;
      }
      
      .btn-group-responsive {
        justify-content: flex-start;
      }
    }
    
    @media (max-width: 575.98px) {
      .btn-action {
        min-width: 100px;
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        height: 36px;
      }
      
      .btn-action i {
        font-size: 0.75rem;
      }
      
      .gap-2 {
        gap: 0.25rem !important;
      }
    }
    
    /* User dropdown styling */
    .user-dropdown-menu {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #495057 !important;
      background-color: #212529 !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      z-index: 1050;
    }
    
    .user-dropdown-item {
      padding: 0.75rem 1rem !important;
      border-bottom: 1px solid #343a40;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }
    
    .user-dropdown-item:hover {
      background-color: #343a40 !important;
      transform: translateX(2px);
    }
    
    .user-dropdown-item:last-child {
      border-bottom: none;
    }
    
    .user-dropdown-item .text-primary {
      color: #6ea8fe !important;
    }
    
    .user-dropdown-item .text-info {
      color: #6edff6 !important;
    }
    
    .user-dropdown-item .text-warning {
      color: #ffda6a !important;
    }
    
    .user-dropdown-item .text-muted {
      color: #adb5bd !important;
    }
    
    .user-dropdown-menu::-webkit-scrollbar {
      width: 6px;
    }
    
    .user-dropdown-menu::-webkit-scrollbar-track {
      background: #343a40;
      border-radius: 3px;
    }
    
    .user-dropdown-menu::-webkit-scrollbar-thumb {
      background: #6c757d;
      border-radius: 3px;
    }
    
    .user-dropdown-menu::-webkit-scrollbar-thumb:hover {
      background: #adb5bd;
    }
    
    /* Login ID dropdown styling */
    .loginid-dropdown-menu {
      max-height: 250px;
      overflow-y: auto;
      border: 1px solid #495057 !important;
      background-color: #212529 !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      z-index: 1050;
    }
    
    .loginid-dropdown-item {
      padding: 0.5rem 0.75rem !important;
      border-bottom: 1px solid #343a40;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }
    
    .loginid-dropdown-item:hover {
      background-color: #343a40 !important;
      transform: translateX(2px);
    }
    
    .loginid-dropdown-item:last-child {
      border-bottom: none;
    }
    
    .loginid-dropdown-item code {
      background: rgba(110, 168, 254, 0.1) !important;
      color: #6ea8fe !important;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      border: 1px solid rgba(110, 168, 254, 0.2);
      font-size: 0.8rem;
    }
    
    .loginid-dropdown-menu::-webkit-scrollbar {
      width: 6px;
    }
    
    .loginid-dropdown-menu::-webkit-scrollbar-track {
      background: #343a40;
      border-radius: 3px;
    }
    
    .loginid-dropdown-menu::-webkit-scrollbar-thumb {
      background: #6c757d;
      border-radius: 3px;
    }
    
    .loginid-dropdown-menu::-webkit-scrollbar-thumb:hover {
      background: #adb5bd;
    }
  `]
})
export class SessionJourneyComponent implements OnInit, OnChanges {
  @Input() apiUrl?: string;
  @Input() preloadLoginId?: string;

  sessionJourney: SessionJourney | null = null;
  realJourneyData: any = null; // Para almacenar la respuesta real del backend
  searchLoginId = '';
  loading = false;
  error: string | null = null;
  
  // User search dropdown
  users: UserSearchResult[] = [];
  selectedUser: UserSearchResult | null = null;
  userSearchTerm = '';
  showUserDropdown = false;
  userSearchLoading = false;
  
  // Date and login ID selection
  selectedDate = '';
  loginIds: string[] = [];
  selectedLoginId = '';
  showLoginIdDropdown = false;
  loginIdSearchTerm = '';
  loginIdsLoading = false;
  loginIdsData: LoginIdsData | null = null;
  
  
  // Session search functionality
  showSessionSearch = false;
  sessionSearchResults: SessionJourneyInfo[] = [];
  sessionSearchLoading = false;
  sessionSearchPagination: any = null;
  sessionSearchFilters = {
    usuario_id: null as number | null,
    empresa_id: null as number | null,
    fecha_inicio: '',
    fecha_fin: '',
    has_algorithm_execution: null as boolean | null,
    razon_fallo: '',
    page: 1,
    limit: 10
  };

  constructor(
    private bitacoraService: BitacoraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.preloadLoginId) {
      this.searchLoginId = this.preloadLoginId;
      this.searchJourney();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['preloadLoginId'] && changes['preloadLoginId'].currentValue) {
      this.searchLoginId = changes['preloadLoginId'].currentValue;
      this.searchJourney();
    }
  }

  searchJourney() {
    if (!this.searchLoginId.trim()) {
      this.error = 'Por favor ingrese un Login ID';
      return;
    }

    this.loading = true;
    this.error = null;
    this.sessionJourney = null;
    this.realJourneyData = null;

    this.bitacoraService.getSessionJourney(this.searchLoginId.trim(), this.apiUrl).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.ok) {
          this.realJourneyData = response.data;
          this.sessionJourney = this.transformToExpectedFormat(response.data);
        } else {
          this.error = response.message;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al obtener el journey de la sesión. Verifique que el Login ID sea correcto.';
        console.error('Session journey error:', err);
      }
    });
  }

  // Convertir la respuesta real del backend al formato esperado por el template
  private transformToExpectedFormat(realData: any): SessionJourney {
    return {
      session_info: {
        login_id: realData.login_id || realData.loginId,
        usuario_id: realData.journey[0]?.usuario_id || 0,
        usuario_email: realData.journey[0]?.usuario_email || '',
        usuario_nombre: realData.journey[0]?.usuario_nombre || 'N/A',
        empresa_id: 0,
        empresa_nombre: 'N/A',
        session_start: realData.journey_stats?.session_start || '',
        session_end: realData.journey_stats?.session_end || undefined,
        total_requests: realData.journey?.length || 0,
        successful_requests: realData.journey?.filter((j: any) => j.codigo_respuesta >= 200 && j.codigo_respuesta < 300).length || 0,
        failed_requests: realData.journey?.filter((j: any) => j.codigo_respuesta >= 400).length || 0,
        algorithm_executions: realData.journey?.filter((j: any) => 
          j.endpoint_url.includes('/getResultAlgoritmo')
        ).length || 0,
        total_duration_ms: realData.journey_stats?.session_duration || 0,
        ip_cliente: 'N/A',
        user_agent: undefined
      },
      steps: realData.journey?.map((step: any, index: number) => ({
        id: index + 1,
        login_id: realData.login_id || realData.loginId,
        timestamp: step.fecha_ejecucion,
        endpoint_url: step.endpoint_url,
        metodo_http: step.metodo_http,
        codigo_respuesta: step.codigo_respuesta,
        duracion_ms: step.duracion_ms,
        resultado: step.resultado,
        razon_fallo: step.razon_fallo,
        session_token_presente: step.session_token_presente || false,
        endpoint_consumido: step.endpoint_consumido,
        custom_uuid: step.custom_uuid,
        mensaje_error: step.mensaje_error,
        stack_trace: step.stack_trace,
        datos_adicionales: step.datos_adicionales
      })) || [],
      session_stats: {
        endpoints_accessed: Array.from(new Set(realData.journey?.map((j: any) => j.endpoint_url) || [])),
        most_used_endpoint: this.getMostUsedEndpoint(realData.journey || []),
        algorithm_success_rate: this.calculateAlgorithmSuccessRate(realData.journey || []),
        average_response_time: this.calculateAverageResponseTime(realData.journey || []),
        error_patterns: this.getErrorPatterns(realData.journey || [])
      }
    };
  }

  private getMostUsedEndpoint(journey: any[]): string {
    if (!journey.length) return '';
    
    const counts = journey.reduce((acc: any, step: any) => {
      acc[step.endpoint_url] = (acc[step.endpoint_url] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  private calculateAlgorithmSuccessRate(journey: any[]): number {
    const algorithmSteps = journey.filter(j => j.endpoint_url.includes('/getResultAlgoritmo'));
    if (!algorithmSteps.length) return 0;
    
    const successful = algorithmSteps.filter(j => j.codigo_respuesta >= 200 && j.codigo_respuesta < 300).length;
    return (successful / algorithmSteps.length) * 100;
  }

  private calculateAverageResponseTime(journey: any[]): number {
    if (!journey.length) return 0;
    
    const total = journey.reduce((sum: number, step: any) => sum + (step.duracion_ms || 0), 0);
    return total / journey.length;
  }

  private getErrorPatterns(journey: any[]): { razon_fallo: string; count: number; }[] {
    const errors = journey.filter(j => j.razon_fallo);
    const patterns: { [key: string]: number } = {};
    
    errors.forEach(error => {
      patterns[error.razon_fallo] = (patterns[error.razon_fallo] || 0) + 1;
    });
    
    return Object.entries(patterns).map(([razon_fallo, count]) => ({ razon_fallo, count }));
  }

  clearJourney() {
    this.searchLoginId = '';
    this.sessionJourney = null;
    this.realJourneyData = null;
    this.error = null;
    
    // Clear user selection and related data
    this.clearSelectedUser();
  }

  exportJourney(format: 'pdf' | 'excel') {
    if (!this.sessionJourney) return;

    this.bitacoraService.exportSessionJourney(this.sessionJourney.session_info.login_id, format, this.apiUrl).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-journey-${this.sessionJourney!.session_info.login_id}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Export error:', err);
        this.error = 'Error al exportar el journey de la sesión';
      }
    });
  }

  isAlgorithmExecution(step: SessionJourneyStep): boolean {
    return step.endpoint_url.includes('/getResultAlgoritmo') || 
           !!step.resultado || 
           !!step.razon_fallo;
  }

  hasAlgorithmInfo(step: SessionJourneyStep): boolean {
    return !!(step.resultado || 
              step.razon_fallo || 
              step.custom_uuid || 
              step.endpoint_consumido);
  }

  getStepIcon(step: SessionJourneyStep): string {
    if (this.isAlgorithmExecution(step)) {
      return 'fa-brain';
    }
    
    switch (step.metodo_http) {
      case 'GET': return 'fa-eye';
      case 'POST': return 'fa-plus';
      case 'PUT': return 'fa-edit';
      case 'DELETE': return 'fa-trash';
      default: return 'fa-globe';
    }
  }

  getFailureReasonLabel(razonFallo: string): string {
    const labels: { [key: string]: string } = {
      'incomplete_initial_information': 'Información Inicial Incompleta',
      'certification_not_found': 'Certificación No Encontrada',
      'incomplete_algorithm_information': 'Información del Algoritmo Incompleta',
      'algorithm_execution_error': 'Error en Ejecución del Algoritmo',
      'session_expired': 'Sesión Expirada',
      'invalid_token': 'Token Inválido'
    };
    return labels[razonFallo] || razonFallo;
  }

  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  hasAdditionalData(data: Record<string, any>): boolean {
    return data && Object.keys(data).length > 0;
  }

  formatAdditionalData(data: Record<string, any>): string {
    return JSON.stringify(data, null, 2);
  }

  // Session search methods
  toggleSessionSearch() {
    this.showSessionSearch = !this.showSessionSearch;
    if (!this.showSessionSearch) {
      this.clearSessionSearch();
    }
  }

  searchSessions() {
    this.sessionSearchLoading = true;
    this.error = null;
    this.sessionSearchResults = [];

    // Clean filters - remove null/empty values
    const cleanFilters: any = {};
    Object.keys(this.sessionSearchFilters).forEach(key => {
      const value = this.sessionSearchFilters[key as keyof typeof this.sessionSearchFilters];
      if (value !== null && value !== undefined && value !== '') {
        cleanFilters[key] = value;
      }
    });

    this.bitacoraService.searchSessions(cleanFilters, this.apiUrl).subscribe({
      next: (response) => {
        this.sessionSearchLoading = false;
        if (response.ok) {
          this.sessionSearchResults = response.data.sessions;
          this.sessionSearchPagination = response.data.pagination;
        } else {
          this.error = response.message;
        }
      },
      error: (err) => {
        this.sessionSearchLoading = false;
        this.error = 'Error al buscar sesiones. Por favor intente nuevamente.';
        console.error('Session search error:', err);
      }
    });
  }

  clearSessionSearch() {
    this.sessionSearchFilters = {
      usuario_id: null,
      empresa_id: null,
      fecha_inicio: '',
      fecha_fin: '',
      has_algorithm_execution: null,
      razon_fallo: '',
      page: 1,
      limit: 10
    };
    this.sessionSearchResults = [];
    this.sessionSearchPagination = null;
    this.error = null;
  }

  viewSessionJourney(loginId: string) {
    this.searchLoginId = loginId;
    this.showSessionSearch = false;
    this.searchJourney();
  }

  goToSessionPage(page: number) {
    if (page < 1 || (this.sessionSearchPagination && page > this.sessionSearchPagination.totalPages)) {
      return;
    }
    
    this.sessionSearchFilters.page = page;
    this.searchSessions();
  }

  getSessionPageNumbers(): number[] {
    if (!this.sessionSearchPagination) return [];
    
    const total = this.sessionSearchPagination.totalPages;
    const current = this.sessionSearchPagination.page;
    const pages: number[] = [];
    
    // Show max 5 pages
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getDurationClass(duration: number): string {
    if (duration > 1800000) return 'text-danger'; // > 30 min
    if (duration > 600000) return 'text-warning';  // > 10 min
    return 'text-success';
  }

  // Computed properties
  get filteredLoginIds(): string[] {
    if (!this.loginIds.length) return [];
    if (!this.loginIdSearchTerm.trim()) return this.loginIds;
    
    return this.loginIds.filter(loginId => 
      loginId.toLowerCase().includes(this.loginIdSearchTerm.toLowerCase())
    );
  }

  // User search dropdown methods
  private userSearchTimeout: any;
  
  onUserSearch() {
    // Clear previous timeout
    if (this.userSearchTimeout) {
      clearTimeout(this.userSearchTimeout);
    }
    
    // If search term is too short, clear users and hide dropdown
    if (this.userSearchTerm.length < 2) {
      this.users = [];
      this.showUserDropdown = false;
      return;
    }
    
    // Debounce the search
    this.userSearchTimeout = setTimeout(() => {
      this.performUserSearch();
    }, 300);
  }
  
  private performUserSearch() {
    this.userSearchLoading = true;
    this.showUserDropdown = true;
    
    this.bitacoraService.getUsers(this.userSearchTerm, 10, this.apiUrl).subscribe({
      next: (response) => {
        this.userSearchLoading = false;
        if (response.ok) {
          this.users = response.data; // Los usuarios están directamente en data
          this.cdr.detectChanges();
        } else {
          this.users = [];
          console.error('Error searching users:', response.message);
        }
      },
      error: (err) => {
        this.userSearchLoading = false;
        this.users = [];
        console.error('Network error searching users:', err);
        this.cdr.detectChanges();
      }
    });
  }
  
  selectUser(user: UserSearchResult) {
    this.selectedUser = user;
    this.userSearchTerm = user.display_name;
    this.showUserDropdown = false;
    
    // Auto-fill the user ID in session search filters
    this.sessionSearchFilters.usuario_id = user.usuario_id;
  }
  
  clearSelectedUser() {
    this.selectedUser = null;
    this.userSearchTerm = '';
    this.users = [];
    this.showUserDropdown = false;
    
    // Clear date and login IDs
    this.selectedDate = '';
    this.clearLoginIds();
    
    // Clear user ID from session search filters
    this.sessionSearchFilters.usuario_id = null;
  }
  
  onUserFocus() {
    if (this.users.length > 0) {
      this.showUserDropdown = true;
    }
  }

  onUserBlur() {
    // Delay hiding dropdown to allow click events to register
    setTimeout(() => {
      this.showUserDropdown = false;
    }, 150);
  }

  // Date and Login ID methods
  onDateChange() {
    if (this.selectedUser && this.selectedDate) {
      this.loadLoginIds();
    } else {
      this.clearLoginIds();
    }
  }

  private loadLoginIds() {
    if (!this.selectedUser || !this.selectedDate) return;

    this.loginIdsLoading = true;
    this.loginIds = [];
    this.loginIdsData = null;
    this.clearSelectedLoginId();

    this.bitacoraService.getUserLoginIds(this.selectedUser.usuario_email, this.selectedDate, this.apiUrl).subscribe({
      next: (response) => {
        this.loginIdsLoading = false;
        if (response.ok) {
          this.loginIdsData = response.data;
          this.loginIds = response.data.login_ids_unicos;
          
          // Si hay solo un login ID, auto-seleccionarlo
          if (this.loginIds.length === 1) {
            this.selectLoginId(this.loginIds[0]);
          }
        } else {
          this.error = response.message;
          console.error('Error loading login IDs:', response.message);
        }
      },
      error: (err) => {
        this.loginIdsLoading = false;
        this.error = 'Error al cargar los login IDs. Por favor intente nuevamente.';
        console.error('Error loading login IDs:', err);
      }
    });
  }

  onLoginIdSearch() {
    if (this.loginIds.length > 0) {
      this.showLoginIdDropdown = true;
    }
  }

  onLoginIdFocus() {
    if (this.loginIds.length > 0) {
      this.showLoginIdDropdown = true;
    }
  }

  selectLoginId(loginId: string) {
    this.selectedLoginId = loginId;
    this.loginIdSearchTerm = loginId;
    this.showLoginIdDropdown = false;
    
    // Auto-fill the manual login ID field
    this.searchLoginId = loginId;
  }

  clearSelectedLoginId() {
    this.selectedLoginId = '';
    this.loginIdSearchTerm = '';
    this.showLoginIdDropdown = false;
    this.searchLoginId = '';
  }

  onLoginIdBlur() {
    // Delay hiding dropdown to allow click events to register
    setTimeout(() => {
      this.showLoginIdDropdown = false;
    }, 150);
  }

  clearLoginIds() {
    this.loginIds = [];
    this.loginIdsData = null;
    this.clearSelectedLoginId();
  }

  getLoginIdStats(loginId: string): boolean {
    return !!this.loginIdsData?.sesiones.some(session => session.login_id === loginId);
  }

  getLoginIdSessionCount(loginId: string): number {
    if (!this.loginIdsData) return 0;
    return this.loginIdsData.sesiones.filter(session => session.login_id === loginId).length;
  }

  // Métodos para obtener información completa de la sesión desde el backend
  getSessionUserName(): string {
    if (!this.realJourneyData?.session_user_info) return this.sessionJourney?.session_info?.usuario_nombre || 'N/A';
    const userInfo = this.realJourneyData.session_user_info;
    return `${userInfo.usuario_nombre || ''} ${userInfo.usuario_apellido || ''}`.trim() || 'N/A';
  }

  getSessionUserId(): string {
    if (!this.realJourneyData?.session_user_info) return this.sessionJourney?.session_info?.usuario_id?.toString() || 'N/A';
    return this.realJourneyData.session_user_info.usuario_id?.toString() || 'N/A';
  }

  getSessionUserEmail(): string {
    if (!this.realJourneyData?.session_user_info) return this.sessionJourney?.session_info?.usuario_email || 'N/A';
    return this.realJourneyData.session_user_info.usuario_email || 'N/A';
  }

  getSessionCompanyName(): string {
    if (!this.realJourneyData?.session_empresa_info) return this.sessionJourney?.session_info?.empresa_nombre || 'N/A';
    return this.realJourneyData.session_empresa_info.empresa_nombre || 'N/A';
  }

  getSessionCompanyId(): string {
    if (!this.realJourneyData?.session_empresa_info) return this.sessionJourney?.session_info?.empresa_id?.toString() || 'N/A';
    return this.realJourneyData.session_empresa_info.empresa_id?.toString() || 'N/A';
  }

  getSessionCompanyRFC(): string {
    if (!this.realJourneyData?.session_empresa_info) return 'N/A';
    return this.realJourneyData.session_empresa_info.empresa_rfc || 'N/A';
  }

  getSessionUserStatus(): string {
    if (!this.realJourneyData?.session_user_info) return 'N/A';
    const status = this.realJourneyData.session_user_info.estatus_registro;
    const statusLabels: { [key: string]: string } = {
      'confirmado': 'Confirmado',
      'pendiente': 'Pendiente',
      'suspendido': 'Suspendido',
      'inactivo': 'Inactivo'
    };
    return statusLabels[status] || status || 'N/A';
  }

  getUserStatusClass(): string {
    if (!this.realJourneyData?.session_user_info) return 'bg-secondary';
    const status = this.realJourneyData.session_user_info.estatus_registro;
    const statusClasses: { [key: string]: string } = {
      'confirmado': 'bg-success',
      'pendiente': 'bg-warning',
      'suspendido': 'bg-danger',
      'inactivo': 'bg-secondary'
    };
    return statusClasses[status] || 'bg-secondary';
  }

  getSessionCompanyPhone(): string {
    if (!this.realJourneyData?.session_empresa_info) return '';
    return this.realJourneyData.session_empresa_info.empresa_telefono || '';
  }

  getSessionCompanyRazonSocial(): string {
    if (!this.realJourneyData?.session_empresa_info) return '';
    return this.realJourneyData.session_empresa_info.empresa_razon_social || '';
  }

  getSessionCompanyDenominacion(): string {
    if (!this.realJourneyData?.session_empresa_info) return '';
    return this.realJourneyData.session_empresa_info.empresa_denominacion || '';
  }

}