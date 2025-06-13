import { Component, OnInit } from '@angular/core';
import { MaterialService, Material } from '../services/material.service';

@Component({
  selector: 'app-listado-materiales',
  templateUrl: './listado-materiales.component.html',
  styleUrls: ['./listado-materiales.component.css']
})
export class ListadoMaterialesComponent implements OnInit {
  materiales: Material[] = [];
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  filterId = '';
  filterNombre = '';
  filterDescripcion = '';
  errorMessage = '';

  constructor(private materialService: MaterialService) {}

  ngOnInit(): void {
    this.loadMaterials();
  }

  private loadMaterials(): void {
    this.errorMessage = '';
    this.materialService
      .getMaterials(this.currentPage, this.pageSize)
      .subscribe({
        next: res => {
          const docs: any = (res as any).docs ?? (res as any).items ?? res;
          const materials = Array.isArray(docs) ? docs : [];

          // Determinar el total de páginas. Si la API no proporciona el valor o
          // no respeta el límite solicitado, lo calculamos a partir del número
          // de elementos recibido.
          const apiTotalPages = (res as any).totalPages;
          const apiTotalDocs = (res as any).totalDocs ?? materials.length;
          const calculatedTotal = Math.ceil(apiTotalDocs / this.pageSize) || 1;
          this.totalPages = apiTotalPages && apiTotalPages > 0
            ? apiTotalPages
            : calculatedTotal;

          // En caso de que la API devuelva todos los elementos sin paginar,
          // mostramos sólo los correspondientes a la página actual para que el
          // usuario pueda paginar correctamente.
          const start = (this.currentPage - 1) * this.pageSize;
          const end = start + this.pageSize;
          this.materiales = materials.slice(start, end);
        },
        error: err => {
          console.error('Failed to load materials', err);
          this.errorMessage = 'Error al cargar los materiales';
        }
      });
  }

  get filteredItems(): Material[] {
    return this.materiales.filter(m =>
      (this.filterId === '' || m.id.toString().includes(this.filterId)) &&
      (this.filterNombre === '' || m.name.toLowerCase().includes(this.filterNombre.toLowerCase())) &&
      (this.filterDescripcion === '' || m.description.toLowerCase().includes(this.filterDescripcion.toLowerCase()))
    );
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadMaterials();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMaterials();
    }
  }

  onFilterChange(): void {
    // Filtering is done client-side on the current page only
  }
}
