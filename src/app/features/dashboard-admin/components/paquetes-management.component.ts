import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardAdminService } from '../services/dashboard-admin.service';
import { PaquetesSuscripcionListComponent } from './paquetes-suscripcion-list.component';
import { PaquetesMonitoreoListComponent } from './paquetes-monitoreo-list.component';
import { PaquetesVerificacionListComponent } from './paquetes-verificacion-list.component';

@Component({
  selector: 'app-paquetes-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaquetesSuscripcionListComponent,
    PaquetesMonitoreoListComponent,
    PaquetesVerificacionListComponent
  ],
  template: `
    <div class="container-fluid px-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-2 text-gray-800">Gestión de Paquetes</h1>
          <p class="text-muted mb-0">
            Administra los paquetes de suscripción, monitoreo y verificación
          </p>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <ul class="nav nav-tabs mb-4" role="tablist">
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            [class.active]="activeTab === 'suscripcion'"
            (click)="cambiarTab('suscripcion')"
            type="button"
            role="tab">
            <i class="fas fa-file-alt me-2"></i>
            Reportes de Crédito
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            [class.active]="activeTab === 'monitoreo'"
            (click)="cambiarTab('monitoreo')"
            type="button"
            role="tab">
            <i class="fas fa-eye me-2"></i>
            Monitoreo
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            [class.active]="activeTab === 'verificacion'"
            (click)="cambiarTab('verificacion')"
            type="button"
            role="tab">
            <i class="fas fa-shield-alt me-2"></i>
            Verificación
          </button>
        </li>
      </ul>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Reportes de Crédito (Suscripción) -->
        <div
          class="tab-pane fade"
          [class.show]="activeTab === 'suscripcion'"
          [class.active]="activeTab === 'suscripcion'"
          role="tabpanel">
          <div class="card shadow">
            <div class="card-header py-3 bg-primary text-white">
              <h6 class="m-0 font-weight-bold">
                <i class="fas fa-file-alt me-2"></i>
                Paquetes de Reportes de Crédito (Suscripciones)
              </h6>
            </div>
            <div class="card-body">
              <app-paquetes-suscripcion-list></app-paquetes-suscripcion-list>
            </div>
          </div>
        </div>

        <!-- Monitoreo -->
        <div
          class="tab-pane fade"
          [class.show]="activeTab === 'monitoreo'"
          [class.active]="activeTab === 'monitoreo'"
          role="tabpanel">
          <div class="card shadow">
            <div class="card-header py-3 bg-info text-white">
              <h6 class="m-0 font-weight-bold">
                <i class="fas fa-eye me-2"></i>
                Paquetes de Monitoreo
              </h6>
            </div>
            <div class="card-body">
              <app-paquetes-monitoreo-list></app-paquetes-monitoreo-list>
            </div>
          </div>
        </div>

        <!-- Verificación -->
        <div
          class="tab-pane fade"
          [class.show]="activeTab === 'verificacion'"
          [class.active]="activeTab === 'verificacion'"
          role="tabpanel">
          <div class="card shadow">
            <div class="card-header py-3 bg-success text-white">
              <h6 class="m-0 font-weight-bold">
                <i class="fas fa-shield-alt me-2"></i>
                Paquetes de Verificación
              </h6>
            </div>
            <div class="card-body">
              <app-paquetes-verificacion-list></app-paquetes-verificacion-list>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nav-tabs .nav-link {
      color: #6c757d;
      border: 1px solid transparent;
      border-bottom: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .nav-tabs .nav-link:hover {
      border-color: #e9ecef #e9ecef #dee2e6;
      color: #495057;
    }

    .nav-tabs .nav-link.active {
      color: #495057;
      background-color: #fff;
      border-color: #dee2e6 #dee2e6 #fff;
      border-bottom: 2px solid #4e73df;
      font-weight: 600;
    }

    .card-header {
      border-bottom: 2px solid rgba(0,0,0,0.125);
    }

    .tab-pane {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class PaquetesManagementComponent implements OnInit {
  activeTab: 'suscripcion' | 'monitoreo' | 'verificacion' = 'suscripcion';

  constructor(public dashboardService: DashboardAdminService) {}

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  cambiarTab(tab: 'suscripcion' | 'monitoreo' | 'verificacion'): void {
    this.activeTab = tab;
  }
}
