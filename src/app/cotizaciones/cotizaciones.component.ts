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
  ownerId: number | null = null;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  searchText = '';

  constructor(
    private remissionService: RemissionService,
    private cookieService: CookieService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const loginData = this.cookieService.get('loginData');
    if (loginData) {
      try {
        const data = JSON.parse(loginData);
        this.ownerId = parseInt(data.ownerCompany.id, 10);
      } catch (_) {
        this.ownerId = null;
      }
    }
    if (this.ownerId !== null && !isNaN(this.ownerId)) {
      this.loadRemisiones();
    } else {
      this.errorMessage = 'No se pudo determinar la empresa';
    }
  }

  private loadRemisiones(): void {
    if (this.ownerId === null) {
      this.errorMessage = 'No se pudo determinar la empresa';
      return;
    }
    this.errorMessage = '';
    this.remissionService
      .getByOwner(this.ownerId, this.currentPage, this.pageSize, this.searchText)
      .subscribe({
        next: res => {
          const docs: any[] = Array.isArray((res as any).docs)
            ? (res as any).docs
            : Array.isArray(res)
            ? (res as any)
            : [];
          this.remisiones = docs.map(item => {
            const clone: any = { ...item };
            delete clone.data;
            delete clone.project_id;
            delete clone.recipient_type;
            delete clone.owner_id;

            let pdfPath: string | undefined;
            if (typeof clone.pdf_path === 'string') {
              pdfPath = clone.pdf_path;
              delete clone.pdf_path;
            }

            if (clone.client && typeof clone.client === 'object') {
              clone['Contacto'] = clone.client.contact_name;
              clone['Cliente'] = clone.client.company_name;
              delete clone.client;
            }

            if (pdfPath) {
              const parts = pdfPath.split(/[\\/]/);
              clone.file = parts[parts.length - 1];
              clone._pdfUrl = pdfPath;
            }

            return clone;
          });
          let pages: any = (res as any).totalPages;
          if (!Number.isFinite(pages)) {
            const totalDocs = (res as any).totalDocs;
            if (Number.isFinite(totalDocs) && this.pageSize > 0) {
              pages = Math.ceil(totalDocs / this.pageSize);
            }
          }
          this.totalPages = Number.isFinite(pages) ? pages : 0;
        },
        error: err => {
          console.error('Failed to load remissions', err);
          this.errorMessage = 'Error al cargar las cotizaciones';
        }
      });
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadRemisiones();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.loadRemisiones();
  }

  openPdf(url: string): void {
    let finalUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      const normalized = url.startsWith('/') ? url : `/${url}`;
      finalUrl = `${environment.apiUrl}${normalized}`;
    }
    // Open the PDF at 100% zoom instead of fitting the page width
    const viewerParams = 'zoom=100&pagemode=none';
    finalUrl += finalUrl.includes('#') ? `&${viewerParams}` : `#${viewerParams}`;
    this.selectedPdf = this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
    this.showPdfModal = true;
  }

  closePdfModal(): void {
    this.showPdfModal = false;
    this.selectedPdf = null;
  }

  get headers(): string[] {
    if (!this.remisiones.length) {
      return [];
    }

    const keys = Object.keys(this.remisiones[0]).filter(
      h => !h.startsWith('_')
    );
    const others = keys.filter(
      k =>
        k !== 'Contacto' &&
        k !== 'Cliente' &&
        k !== 'file' &&
        k !== 'created_at'
    );
    const filePos = keys.indexOf('file');
    const idx = filePos === -1 ? others.length : Math.min(filePos, others.length);
    return [
      ...others.slice(0, idx),
      'Contacto',
      'Cliente',
      ...others.slice(idx),
      'file',
      'created_at'
    ];
  }

  headerLabel(header: string): string {
    return header === 'created_at' ? 'Fecha de emisión' : header;
  }
  displayValue(value: any, header?: string): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (header === 'created_at') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('es-MX', {
          timeZone: 'America/Mexico_City'
        });
      }
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
