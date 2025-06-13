import { Component } from '@angular/core';

interface Material {
  id: number;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-listado-materiales',
  templateUrl: './listado-materiales.component.html',
  styleUrls: ['./listado-materiales.component.css']
})
export class ListadoMaterialesComponent {
  materiales: Material[] = [];
  pageSize = 10;
  currentPage = 1;
  filterId = '';
  filterNombre = '';
  filterDescripcion = '';

  constructor() {
    this.materiales = Array.from({ length: 100 }).map((_, i) => ({
      id: i + 1,
      nombre: `Material ${i + 1}`,
      descripcion: `Descripción del material ${i + 1}`
    }));
  }

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize);
  }

  get paginatedItems(): Material[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  get filteredItems(): Material[] {
    return this.materiales.filter(m =>
      (this.filterId === '' || m.id.toString().includes(this.filterId)) &&
      (this.filterNombre === '' || m.nombre.toLowerCase().includes(this.filterNombre.toLowerCase())) &&
      (this.filterDescripcion === '' || m.descripcion.toLowerCase().includes(this.filterDescripcion.toLowerCase()))
    );
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }
}
