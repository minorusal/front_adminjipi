import { Component, OnInit } from '@angular/core';
import { MaterialService, Material } from '../services/material.service';
import { MaterialTypeService, MaterialType } from '../services/material-type.service';
import { CookieService } from '../services/cookie.service';
import {
  AccessoryService,
  AccessoryMaterial,
  Accessory
} from '../services/accessory.service';

interface SelectedMaterial {
  material: Material;
  width?: number;
  length?: number;
  quantity?: number;
  _invalid?: boolean;
}

@Component({
  selector: 'app-accesorios',
  templateUrl: './accesorios.component.html',
  styleUrls: ['./accesorios.component.css']
})

export class AccesoriosComponent implements OnInit {
  searchText = '';
  results: Material[] = [];
  selected: SelectedMaterial[] = [];
  materialTypes: MaterialType[] = [];
  searching = false;
  showRemoveModal = false;
  materialToRemove: SelectedMaterial | null = null;
  profitPercentage = 0;
  accessoryName = '';
  accessoryDescription = '';
  saveError = '';
  isSaving = false;
  formSubmitted = false;

  constructor(
    private materialService: MaterialService,
    private materialTypeService: MaterialTypeService,
    private cookieService: CookieService,
    private accessoryService: AccessoryService
  ) {}

  ngOnInit(): void {
    const loginData = this.cookieService.get('loginData');
    if (loginData) {
      try {
        const data = JSON.parse(loginData);
        let profit = 0;
        if (typeof data.profit_percentage === 'number') {
          profit = data.profit_percentage;
        } else if (data.profit_percentage !== undefined) {
          profit = parseFloat(data.profit_percentage);
        } else if (
          data.ownerCompany &&
          typeof data.ownerCompany.profit_percentage === 'number'
        ) {
          profit = data.ownerCompany.profit_percentage;
        } else if (data.ownerCompany?.profit_percentage !== undefined) {
          profit = parseFloat(data.ownerCompany.profit_percentage);
        }
        if (!Number.isNaN(profit)) {
          this.profitPercentage = profit;
        }
      } catch (_) {
        // ignore parse errors
      }
    }
    this.materialTypeService.getMaterialTypes().subscribe({
      next: types => {
        this.materialTypes = Array.isArray(types) ? types : [];
      },
      error: () => {
        this.materialTypes = [];
      }
    });
  }

  onSearchChange(): void {
    if (this.searchText.trim() === '') {
      this.results = [];
      return;
    }
    this.searching = true;
    this.materialService.getMaterials(1, 10, this.searchText).subscribe({
      next: res => {
        const docs: any = (res as any).docs ?? (res as any).items ?? res;
        this.results = Array.isArray(docs) ? docs : [];
        this.searching = false;
      },
      error: () => {
        this.results = [];
        this.searching = false;
      }
    });
  }

  addMaterial(mat: Material): void {
    if (!this.selected.some(m => m.material.id === mat.id)) {
      this.selected.push({ material: mat });
      this.searchText = '';
      this.results = [];
    }
  }

  openRemoveModal(sel: SelectedMaterial): void {
    this.materialToRemove = sel;
    this.showRemoveModal = true;
  }

  closeRemoveModal(): void {
    this.showRemoveModal = false;
    this.materialToRemove = null;
  }

  confirmRemove(): void {
    if (this.materialToRemove) {
      this.selected = this.selected.filter(
        m => m.material.id !== this.materialToRemove!.material.id
      );
    }
    this.closeRemoveModal();
  }

  getMaterialType(mat: Material): MaterialType | undefined {
    return this.materialTypes.find(t => t.id === mat.material_type_id);
  }

  isAreaType(mat: Material): boolean {
    const type = this.getMaterialType(mat);
    return type?.id === 2;
  }

  isPieceType(mat: Material): boolean {
    const type = this.getMaterialType(mat);
    return type?.id === 1;
  }

  isMaterialInfoValid(sel: SelectedMaterial): boolean {
    if (this.isAreaType(sel.material)) {
      return (
        !!sel.width &&
        sel.width > 0 &&
        !!sel.length &&
        sel.length > 0
      );
    }
    if (this.isPieceType(sel.material)) {
      return !!sel.quantity && sel.quantity > 0;
    }
    return true;
  }

  onMaterialInput(sel: SelectedMaterial): void {
    if (sel._invalid && this.isMaterialInfoValid(sel)) {
      sel._invalid = false;
    }
  }

  calculateCost(sel: SelectedMaterial): number {
    const price = sel.material.price ?? 0;
    if (this.isAreaType(sel.material)) {
      const width = sel.width ?? 0;
      const length = sel.length ?? 0;
      const baseWidth = sel.material.width_m ?? 0;
      const baseLength = sel.material.length_m ?? 0;
      const baseArea = baseWidth * baseLength;
      const area = width * length;
      if (baseArea > 0) {
        return (area / baseArea) * price;
      }
      return area * price;
    }
    if (this.isPieceType(sel.material)) {
      const qty = sel.quantity ?? 0;
      return qty * price;
    }
    return price;
  }

  get totalCost(): number {
    return this.selected.reduce((sum, sel) => sum + this.calculateCost(sel), 0);
  }

  get totalWithProfit(): number {
    return this.totalCost * (1 + this.profitPercentage / 100);
  }

  submitAccessory(form: any): void {
    if (this.isSaving) {
      return;
    }
    this.formSubmitted = true;
    this.saveError = '';
    if (!form.valid) {
      form.form.markAllAsTouched();
      return;
    }
    // Prevent saving without selecting any material
    if (this.selected.length === 0) {
      this.saveError = 'Debes seleccionar al menos un material';
      return;
    }

    // Validate dynamic inputs
    let hasInvalid = false;
    for (const sel of this.selected) {
      if (!this.isMaterialInfoValid(sel)) {
        sel._invalid = true;
        hasInvalid = true;
      } else {
        sel._invalid = false;
      }
    }
    if (hasInvalid) {
      this.saveError = 'Completa las cantidades o medidas de los materiales seleccionados';
      return;
    }

    const loginData = this.cookieService.get('loginData');
    let ownerId: number | null = null;
    if (loginData) {
      try {
        const data = JSON.parse(loginData);
        ownerId = parseInt(data.ownerCompany.id, 10);
      } catch {
        ownerId = null;
      }
    }
    if (ownerId === null || isNaN(ownerId)) {
      this.saveError = 'No se pudo determinar la empresa';
      return;
    }

    const name = this.accessoryName.trim();
    const description = this.accessoryDescription.trim();
    this.isSaving = true;
    this.accessoryService
      .addAccessory(name, description, ownerId)
      .subscribe({
        next: (acc: Accessory) => {
          const materials: AccessoryMaterial[] = this.selected.map(sel => ({
            accessory_id: acc.id,
            material_id: sel.material.id,
            width: sel.width,
            length: sel.length,
            quantity: sel.quantity
          }));
          this.accessoryService
            .addAccessoryMaterials(acc.id, materials)
            .subscribe({
              next: () => {
                this.isSaving = false;
                this.accessoryName = '';
                this.accessoryDescription = '';
                this.selected = [];
              },
              error: () => {
                this.isSaving = false;
                this.saveError = 'Error al guardar materiales';
              }
            });
        },
        error: () => {
          this.isSaving = false;
          this.saveError = 'Error al guardar el accesorio';
        }
      });
  }
}
