import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MaterialInList, PaginatedMaterials, MaterialService, CreateMaterialPayload, UpdateMaterialPayload, Material } from '../../services/material.service';
import { MaterialTypeService, MaterialType } from '../../services/material-type.service';
import { toNumber } from '../../utils/number-parse';
import { MaterialStateService } from '../../services/material-state.service';
import { tap } from 'rxjs/operators';
import { CookieService } from '../../services/cookie.service';

@Component({
  selector: 'app-listado-materiales',
  templateUrl: './listado-materiales.component.html',
  styleUrls: ['./listado-materiales.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ListadoMaterialesComponent implements OnInit {
  paginatedMaterials$: Observable<PaginatedMaterials>;
  error$: Observable<string | null>;
  
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  searchText = '';
  
  showAddModal = false;
  showEditModal = false;
  materialTypes: MaterialType[] = [];
  editingMaterialId: number | null = null;
  
  materialForm: FormGroup;

  saveError = '';
  updateError = '';
  isSaving = false;
  isUpdating = false;

  constructor(
    private materialTypeService: MaterialTypeService,
    private materialState: MaterialStateService,
    private fb: FormBuilder,
    private materialService: MaterialService,
    private cookieService: CookieService
  ) {
    this.paginatedMaterials$ = this.materialState.paginatedMaterials$.pipe(
      tap((p: PaginatedMaterials) => this.totalPages = p.totalPages)
    );
    this.error$ = this.materialState.error$;

    this.materialForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      material_type_id: [null, Validators.required],
      purchase_price: [null, Validators.required],
      profit_percentage: [null, [Validators.min(0)]],
      attributes: this.fb.group({})
    });
  }

  ngOnInit(): void {
    this.loadMaterials();
    this.loadMaterialTypes();
    this.onMaterialTypeChange();
  }

  private loadMaterials(): void {
    this.materialState.loadMaterials(this.currentPage, this.pageSize, this.searchText);
  }

  private loadMaterialTypes(): void {
    this.materialTypeService.getMaterialTypes().subscribe({
      next: (types: MaterialType[]) => {
        this.materialTypes = Array.isArray(types) ? types : [];
      },
      error: (err: any) => {
        console.error('Failed to load material types', err);
      }
    });
  }

  private onMaterialTypeChange(): void {
    this.materialForm.get('material_type_id')?.valueChanges.subscribe(typeId => {
      // Replace the entire attributes FormGroup with a new one to ensure a clean state
      const newAttributesGroup = this.fb.group({});
      this.materialForm.setControl('attributes', newAttributesGroup);

      if (typeId) {
        switch (typeId) {
          case 2: // Area
            newAttributesGroup.addControl('gauge', this.fb.group({ value: [null, Validators.required], unit: ['gauge', Validators.required] }));
            newAttributesGroup.addControl('width', this.fb.group({ value: [null, Validators.required], unit: ['m', Validators.required] }));
            newAttributesGroup.addControl('length', this.fb.group({ value: [null, Validators.required], unit: ['m', Validators.required] }));
            break;
          case 1: // Pieza
            newAttributesGroup.addControl('length', this.fb.group({ value: [null, Validators.required], unit: ['in', Validators.required] }));
            newAttributesGroup.addControl('gauge', this.fb.group({ value: [null, Validators.required], unit: ['gauge', Validators.required] }));
            break;
          case 3: // Volumen
            newAttributesGroup.addControl('volume', this.fb.group({ value: [null, Validators.required], unit: ['l', Validators.required] }));
            break;
        }
      }
    });
  }

  getAttributesControls(form: FormGroup): string[] {
    const attributes = form.get('attributes') as FormGroup;
    return Object.keys(attributes.controls);
  }

  getUnitsForAttribute(key: string): string[] {
    const lengthAttrs = ['thickness', 'width', 'length', 'gauge'];
    if (lengthAttrs.includes(key)) {
      return ['mm', 'cm', 'm', 'in'];
    }
    if (key === 'volume') {
      return ['ml', 'l'];
    }
    return [];
  }

  parseNumber(value: string): number | undefined {
    const trimmed = value?.toString().trim();
    if (!trimmed || !/\d/.test(trimmed)) {
      return undefined;
    }
    const n = toNumber(trimmed);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
  }

  private getMaterialType(id: number | undefined): MaterialType | undefined {
    return this.materialTypes.find(t => t.id === id);
  }

  isAreaType(id: number | undefined): boolean {
    const type = this.getMaterialType(id);
    const ident = (type?.unit || type?.name || '').toLowerCase();
    return type?.id === 2 || ident.includes('m2') || ident.includes('área') || ident.includes('area');
  }

  isPieceType(id: number | undefined): boolean {
    const type = this.getMaterialType(id);
    if (!type) {
      return false;
    }
    const ident = (type.unit || type.name || '').toLowerCase();
    return type.id === 1 || ident.includes('pieza') || ident.includes('unidad');
  }

  openAddModal(): void {
    this.materialForm.reset({
      material_type_id: null,
      attributes: {}
    });

    const profitFromCookie = this.cookieService.get('profit_percentage');
    const defaultProfit = profitFromCookie ? parseFloat(profitFromCookie) : 40; // Default to 40 if no cookie
    this.materialForm.patchValue({ profit_percentage: defaultProfit });

    // Ensure attributes are cleared
    const attributesGroup = this.materialForm.get('attributes') as FormGroup;
    Object.keys(attributesGroup.controls).forEach(key => {
      attributesGroup.removeControl(key);
    });
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.saveError = '';
    this.isSaving = false;
  }

  openEditModal(materialSummary: MaterialInList): void {
    this.editingMaterialId = materialSummary.id;
    this.updateError = '';
    this.isUpdating = false;

    this.materialService.getMaterialById(materialSummary.id).subscribe(material => {
      const profitFromCookie = this.cookieService.get('profit_percentage');
      const profitPercentage = profitFromCookie ? parseFloat(profitFromCookie) : material.profit_percentage_at_creation;

      this.materialForm.patchValue({
        name: material.name,
        description: material.description,
        material_type_id: material.material_type_id,
        purchase_price: material.purchase_price,
        profit_percentage: profitPercentage,
      });

      // Manually trigger the value change to build the form, then patch attributes
      this.materialForm.get('material_type_id')?.updateValueAndValidity({ emitEvent: true });
      this.materialForm.get('attributes')?.patchValue(material.attributes);

    this.showEditModal = true;
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingMaterialId = null;
    this.updateError = '';
    this.isUpdating = false;
  }

  saveMaterial(): void {
    if (this.materialForm.invalid) {
      this.materialForm.markAllAsTouched();
      return;
    }

    const formValue = this.materialForm.value;
    const payload: CreateMaterialPayload = {
      name: formValue.name,
      description: formValue.description,
      material_type_id: formValue.material_type_id,
      purchase_price: formValue.purchase_price,
      attributes: formValue.attributes,
      owner_id: 1 // Assuming a default owner_id for now
    };

    if (formValue.profit_percentage !== null && formValue.profit_percentage !== undefined) {
      payload.profit_percentage = formValue.profit_percentage;
    }

    this.isSaving = true;
    this.saveError = '';

    this.materialService.createMaterial(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeAddModal();
        this.loadMaterials();
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = 'Failed to create material.';
        console.error(err);
      }
    });
  }

  updateMaterial(): void {
    if (this.materialForm.invalid || !this.editingMaterialId) {
      this.materialForm.markAllAsTouched();
      return;
    }

    const formValue = this.materialForm.value;
    const payload: UpdateMaterialPayload = {
      name: formValue.name,
      description: formValue.description,
      material_type_id: formValue.material_type_id,
      purchase_price: formValue.purchase_price,
      attributes: formValue.attributes,
      owner_id: 1 // Assuming a default owner_id
    };

    if (formValue.profit_percentage !== null && formValue.profit_percentage !== undefined) {
      payload.profit_percentage = formValue.profit_percentage;
    }
    
    this.isUpdating = true;
    this.updateError = '';

    this.materialService.updateMaterial(this.editingMaterialId, payload).subscribe({
      next: () => {
        this.isUpdating = false;
        this.closeEditModal();
        this.loadMaterials();
      },
      error: (err) => {
        this.isUpdating = false;
        this.updateError = 'Failed to update material.';
        console.error(err);
      }
    });
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
}
