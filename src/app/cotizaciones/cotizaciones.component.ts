import { Component, OnInit } from '@angular/core';
import { RemissionService } from '../services/remission.service';
import { CookieService } from '../services/cookie.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-cotizaciones',
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css']
})
export class CotizacionesComponent implements OnInit {
  remisiones: any[] = [];
  errorMessage = '';
  showPdfModal = false;
  selectedPdf: SafeResourceUrl | null = null;

  constructor(
    private remissionService: RemissionService,
    private cookieService: CookieService,
    private sanitizer: DomSanitizer
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
          this.remisiones = Array.isArray(res)
            ? res.map(item => {
                const clone: any = { ...item };
                delete clone.data;
                if (typeof clone.pdf_path === 'string') {
                  // Handle both Unix and Windows style paths
                  const parts = clone.pdf_path.split(/[\\/]/);
                  clone.file = parts[parts.length - 1];
                  clone._pdfUrl = clone.pdf_path;
                  delete clone.pdf_path;
                }
                return clone;
              })
            : [];
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

  openPdf(url: string): void {
    let finalUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      const normalized = url.startsWith('/') ? url : `/${url}`;
      finalUrl = `${environment.apiUrl}${normalized}`;
    }
    this.selectedPdf = this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
    this.showPdfModal = true;
  }

  closePdfModal(): void {
    this.showPdfModal = false;
    this.selectedPdf = null;
  }

  get headers(): string[] {
    return this.remisiones.length
      ? Object.keys(this.remisiones[0]).filter(h => !h.startsWith('_'))
      : [];
  }
}
