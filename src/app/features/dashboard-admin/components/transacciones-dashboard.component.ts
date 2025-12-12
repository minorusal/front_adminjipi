import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transacciones-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid p-4">
      <button class="btn btn-outline-secondary btn-sm mb-3" (click)="goBack()">
        <i class="fas fa-arrow-left me-1"></i> Volver
      </button>
      <div class="card shadow">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">
            <i class="fas fa-exchange-alt me-2"></i>
            Transacciones Recientes
          </h5>
        </div>
        <div class="card-body text-center py-5">
          <i class="fas fa-construction fa-4x text-muted mb-3"></i>
          <h4>Próximamente</h4>
          <p class="text-muted">
            Esta sección mostrará las transacciones recientes con filtros avanzados.
          </p>
        </div>
      </div>
    </div>
  `
})
export class TransaccionesDashboardComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard-admin']);
  }
}
