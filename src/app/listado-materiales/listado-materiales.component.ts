import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MaterialService, Material, NewMaterial } from '../services/material.service';
import { MaterialTypeService, MaterialType } from '../services/material-type.service';

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
  showEditModal = false;
  materialTypes: MaterialType[] = [];
  editingMaterialId: number | null = null;
  editMaterialData: NewMaterial = {
    name: '',
    description: '',
    material_type_id: undefined,
    thickness_mm: undefined,
    width_m: undefined,
    length_m: undefined,
    price: undefined
  };
  newMaterial: NewMaterial = {
    name: '',
    description: '',
    material_type_id: undefined,
    thickness_mm: undefined,
    width_m: undefined,
    length_m: undefined,
    price: undefined
  };
  saveError = '';
  updateError = '';
  isSaving = false;
  isUpdating = false;

  constructor(
    private materialService: MaterialService,
    private materialTypeService: MaterialTypeService
  ) {}

  ngOnInit(): void {
    this.loadMaterials();
    this.loadMaterialTypes();
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

  private loadMaterialTypes(): void {
    this.materialTypeService.getMaterialTypes().subscribe({
      next: types => {
        this.materialTypes = Array.isArray(types) ? types : [];
      },
      error: err => {
        console.error('Failed to load material types', err);
      }
    });
  }

  parseNumber(value: string): number | undefined {
    const n = parseInt(value, 10);
    return isNaN(n) ? undefined : n;
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

  openEditModal(material: Material): void {
    this.editingMaterialId = material.id;
    this.editMaterialData = {
      name: material.name,
      description: material.description,
      material_type_id: material.material_type_id,
      thickness_mm: material.thickness_mm,
      width_m: material.width_m,
      length_m: material.length_m,
      price: material.price
    };
    this.updateError = '';
    this.isUpdating = false;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingMaterialId = null;
    this.updateError = '';
    this.isUpdating = false;
  }

  updateMaterial(form: NgForm): void {
    if (this.isUpdating) {
      return;
    }
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    if (this.editingMaterialId === null) {
      return;
    }
    this.updateError = '';
    this.isUpdating = true;
    this.materialService
      .updateMaterial(this.editingMaterialId, this.editMaterialData)
      .subscribe({
        next: () => {
          this.isUpdating = false;
          this.closeEditModal();
          this.loadMaterials();
        },
        error: err => {
          this.isUpdating = false;
          console.error('Failed to update material', err);
          this.updateError = 'Error al actualizar el material';
        }
      });
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
      material_type_id: undefined,
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
    this.openEditModal(material);
  }
}
