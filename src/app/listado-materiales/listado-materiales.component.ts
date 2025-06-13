import { Component, OnInit } from '@angular/core';
import { MaterialService, Material } from '../services/material.service';

@Component({
  selector: 'app-listado-materiales',
  templateUrl: './listado-materiales.component.html',
  styleUrls: ['./listado-materiales.component.css']
})
export class ListadoMaterialesComponent implements OnInit {
  materiales: Material[] = [];
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
      // Request a large limit so we fetch all materials in one call
      .getMaterials(undefined, 1000)
      .subscribe({
        next: res => {
          const docs: any = (res as any).docs ?? (res as any).items ?? res;
          this.materiales = Array.isArray(docs) ? docs : [];
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



  onFilterChange(): void {
    // Filtering is done client-side
  }
}
