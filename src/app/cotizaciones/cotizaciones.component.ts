import { Component, OnInit } from '@angular/core';
import { RemissionService } from '../services/remission.service';
import { CookieService } from '../services/cookie.service';

@Component({
  selector: 'app-cotizaciones',
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css']
})
export class CotizacionesComponent implements OnInit {
  remisiones: any[] = [];
  errorMessage = '';

  constructor(
    private remissionService: RemissionService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    let ownerId: number | null = null;
    const loginData = this.cookieService.get('loginData');
    if (loginData) {
      try {
        const data = JSON.parse(loginData);
        ownerId = parseInt(data.ownerCompany.id, 10);
      } catch (_) {
        ownerId = null;
      }
    }
    if (ownerId !== null && !isNaN(ownerId)) {
      this.remissionService.getByOwner(ownerId).subscribe({
        next: res => {
          this.remisiones = Array.isArray(res) ? res : [];
        },
        error: err => {
          console.error('Failed to load remissions', err);
          this.errorMessage = 'Error al cargar las cotizaciones';
        }
      });
    } else {
      this.errorMessage = 'No se pudo determinar la empresa';
    }
  }

  get headers(): string[] {
    return this.remisiones.length ? Object.keys(this.remisiones[0]) : [];
  }
}
