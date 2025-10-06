import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid p-4">
      <h2>Reporte de Ventas</h2>
      <p>Dashboard de métricas y análisis de ventas.</p>
      <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        Sección en desarrollo - próximamente se conectará a la API real.
      </div>
    </div>
  `
})
export class SalesReportComponent {}