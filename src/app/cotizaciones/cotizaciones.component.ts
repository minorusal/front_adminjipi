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
                  // Handle both Unix and Windows style paths and convert the
                  // server file path into a URL that can be requested from the
                  // API. The backend returns an absolute path such as
                  // "C:\\...\\remissions\\project_1.pdf". Extract the file name
                  // and build a relative URL under the /remissions endpoint so
                  // that openPdf() generates a proper API URL.
                  const parts = clone.pdf_path.split(/[\\/]/);
                  const fileName = parts[parts.length - 1];
                  clone.file = fileName;
                  clone._pdfUrl = `remissions/${fileName}`;
                  delete clone.pdf_path;
                }
                if (clone.client && typeof clone.client === 'object') {
                  clone['Contacto'] = clone.client.contact_name;
                  clone['Cliente'] = clone.client.company_name;
                  delete clone.client;
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

  displayValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      const preferredKeys = [
        'name',
        'nombre',
        'razon_social',
        'description',
        'label'
      ];
      for (const key of preferredKeys) {
        if (value && key in value && typeof value[key] === 'string') {
          return value[key];
        }
      }
      try {
        return JSON.stringify(value);
      } catch (_) {
        return '' + value;
      }
    }
    return '' + value;
  }
}
