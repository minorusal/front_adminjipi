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
          this.materiales = res.docs;
          this.totalPages = res.totalPages;
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
