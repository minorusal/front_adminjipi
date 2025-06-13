import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MaterialService, Material, NewMaterial } from '../services/material.service';

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
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  searchText = '';
  showAddModal = false;
  newMaterial: NewMaterial = {
    name: '',
    description: '',
    thickness_mm: undefined,
    width_m: undefined,
    length_m: undefined,
    price: undefined
  };
  saveError = '';
  isSaving = false;

  constructor(private materialService: MaterialService) {}

  ngOnInit(): void {
    this.loadMaterials();
  }

  private loadMaterials(): void {
    this.errorMessage = '';
    this.materialService
      .getMaterials(this.currentPage, this.pageSize, this.searchText)
      .subscribe({
        next: res => {
          const docs: any = (res as any).docs ?? (res as any).items ?? res;
          this.materiales = Array.isArray(docs) ? docs : [];
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
          console.error('Failed to load materials', err);
          this.errorMessage = 'Error al cargar los materiales';
        }
      });
  }

  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.saveError = '';
    this.isSaving = false;
    this.resetNewMaterial();
  }

  saveMaterial(form: NgForm): void {
    if (this.isSaving) {
      return;
    }
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    this.saveError = '';
    this.isSaving = true;
    this.materialService.addMaterial(this.newMaterial).subscribe({
      next: () => {
        this.isSaving = false;
        this.resetNewMaterial();
        this.closeAddModal();
        this.loadMaterials();
      },
      error: err => {
        this.isSaving = false;
        console.error('Failed to add material', err);
        this.saveError = 'Error al guardar el material';
      }
    });
  }

  private resetNewMaterial(): void {
    this.newMaterial = {
      name: '',
      description: '',
      thickness_mm: undefined,
      width_m: undefined,
      length_m: undefined,
      price: undefined
    };
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

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadMaterials();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.loadMaterials();
  }

  editMaterial(material: Material): void {
    // Placeholder for edit logic
    console.log('Edit material', material);
  }
}
