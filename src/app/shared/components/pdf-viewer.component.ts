import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.8);">
      <div class="modal-dialog modal-fullscreen">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">
              <i class="fas fa-file-pdf me-2"></i>
              {{ title }}
            </h5>
            <div class="d-flex gap-2">
              <a 
                *ngIf="pdfUrl" 
                [href]="pdfUrl" 
                target="_blank" 
                class="btn btn-outline-light btn-sm"
                title="Abrir en nueva pestaña">
                <i class="fas fa-external-link-alt me-1"></i>
                Nueva pestaña
              </a>
              <a 
                *ngIf="pdfUrl" 
                [href]="pdfUrl" 
                download 
                class="btn btn-outline-light btn-sm"
                title="Descargar PDF">
                <i class="fas fa-download me-1"></i>
                Descargar
              </a>
              <button type="button" class="btn-close btn-close-white" (click)="closePdf()"></button>
            </div>
          </div>
          <div class="modal-body p-0">
            <div class="d-flex justify-content-center align-items-center flex-column" style="height: 80vh;">
              <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
              <h5 class="text-danger">No se puede visualizar el PDF</h5>
              <p class="text-muted text-center px-4">
                El PDF no se puede mostrar directamente aquí debido a restricciones de seguridad (CORS) o configuración del servidor.
                Sin embargo, puedes abrirlo en una nueva pestaña.
              </p>
              <a
                *ngIf="pdfUrl"
                [href]="pdfUrl"
                target="_blank"
                class="btn btn-primary mt-3"
                title="Abrir PDF en nueva pestaña">
                <i class="fas fa-external-link-alt me-1"></i>
                Abrir PDF en nueva pestaña
              </a>
            </div>
          </div>
          <div class="modal-footer bg-light">
            <div class="d-flex justify-content-between w-100 align-items-center">
              <div class="text-muted">
                <small>{{ pdfUrl }}</small>
              </div>
              <button type="button" class="btn btn-secondary" (click)="closePdf()">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal.show {
      display: block !important;
    }
    
    .pdf-container {
      width: 100%;
      height: 80vh;
      overflow: hidden;
    }

    .modal-fullscreen .modal-content {
      height: 100vh;
    }

    .modal-body {
      overflow: hidden;
    }

    iframe, object, embed {
      border: none;
    }

    .btn-close-white {
      filter: invert(1) grayscale(100%) brightness(200%);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfViewerComponent {
  @Input() pdfUrl: string | null = null;
  @Input() title: string = 'Visualizador PDF';
  @Input() isVisible: boolean = false;
  @Output() closed = new EventEmitter<void>();

  safePdfUrl: SafeResourceUrl | null = null;
  loading = false;
  error: string | null = null;
  showAlternativeViewer = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    if (this.isVisible && this.pdfUrl) {
      this.loadPdf();
    }
  }

  private loadPdf() {
    this.loading = true;
    this.error = null;
    this.showAlternativeViewer = false;

    try {
      // Sanitizar la URL del PDF
      this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl + '#toolbar=1&navpanes=0&scrollbar=1');
      
    } catch (err) {
      this.loading = false;
      this.error = 'Error al procesar la URL del PDF';
      console.error('Error loading PDF:', err);
    }
  }

  onPdfLoad() {
    this.loading = false;
    this.error = null;
  }

  onPdfError() {
    this.loading = false;
    this.error = 'No se pudo cargar el PDF. Verifique la URL o su conexión a internet.';
    this.showAlternativeViewer = true;
  }

  reloadPdf() {
    if (this.pdfUrl) {
      this.loadPdf();
    }
  }

  closePdf() {
    this.isVisible = false;
    this.safePdfUrl = null;
    this.loading = false;
    this.error = null;
    this.closed.emit();
  }
}