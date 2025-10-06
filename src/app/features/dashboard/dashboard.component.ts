import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid p-4">
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="mb-0">
            <i class="fas fa-tachometer-alt me-2"></i>
            Dashboard Principal
          </h1>
          <p class="text-muted">Bienvenido al panel de administración</p>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-3 mb-4">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-chart-line fa-2x text-primary mb-3"></i>
              <h5 class="card-title">Monitoreo</h5>
              <p class="card-text">Supervisa el rendimiento del sistema</p>
              <button (click)="navigateTo('/monitoring')" class="btn btn-primary">
                <i class="fas fa-eye me-1"></i>
                Ver Monitoreo
              </button>
            </div>
          </div>
        </div>
        
        <div class="col-md-3 mb-4">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-users fa-2x text-success mb-3"></i>
              <h5 class="card-title">Administración</h5>
              <p class="card-text">Gestiona usuarios y configuraciones</p>
              <button (click)="navigateTo('/admin')" class="btn btn-success">
                <i class="fas fa-cog me-1"></i>
                Ver Admin
              </button>
            </div>
          </div>
        </div>
        
        <div class="col-md-3 mb-4">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-file-alt fa-2x text-info mb-3"></i>
              <h5 class="card-title">Reportes</h5>
              <p class="card-text">Genera reportes y analíticas</p>
              <button (click)="navigateTo('/reports')" class="btn btn-info">
                <i class="fas fa-chart-bar me-1"></i>
                Ver Reportes
              </button>
            </div>
          </div>
        </div>
        
        <div class="col-md-3 mb-4">
          <div class="card text-center">
            <div class="card-body">
              <i class="fas fa-calculator fa-2x text-warning mb-3"></i>
              <h5 class="card-title">Algoritmo</h5>
              <p class="card-text">Configura parámetros del algoritmo</p>
              <button (click)="navigateTo('/algoritmo')" class="btn btn-warning">
                <i class="fas fa-sliders-h me-1"></i>
                Ver Algoritmo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-info-circle me-2"></i>
                Estado del Sistema
              </h5>
            </div>
            <div class="card-body">
              <p>✅ Login exitoso - Token de sesión guardado correctamente</p>
              <p><strong>Usuario:</strong> {{ getUserInfo() }}</p>
              <p><strong>Último acceso:</strong> {{ getCurrentTime() }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border: none;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      transition: transform 0.2s ease;
    }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }
    
    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }
    
    .btn {
      transition: all 0.2s ease;
    }
    
    .btn:hover {
      transform: translateY(-1px);
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class DashboardComponent implements OnInit {
  
  constructor(private router: Router) {}

  ngOnInit() {
    console.log('Dashboard component loaded successfully');
    console.log('Session token:', localStorage.getItem('sessionToken'));
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  getUserInfo(): string {
    try {
      const payload = localStorage.getItem('payload');
      if (payload) {
        const user = JSON.parse(payload);
        return `ID: ${user.user_id || 'N/A'}, Empresa: ${user.company_id || 'N/A'}`;
      }
      return 'Información no disponible';
    } catch {
      return 'Error al obtener información';
    }
  }

  getCurrentTime(): string {
    return new Date().toLocaleString();
  }
}
