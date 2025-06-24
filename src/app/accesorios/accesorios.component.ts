import { Component, OnInit } from '@angular/core';
import { MaterialService, Material } from '../services/material.service';
import { MaterialTypeService, MaterialType } from '../services/material-type.service';
import { CookieService } from '../services/cookie.service';

interface SelectedMaterial {
  material: Material;
  width?: number;
  length?: number;
  quantity?: number;
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

  constructor(
    private materialService: MaterialService,
    private materialTypeService: MaterialTypeService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    const loginData = this.cookieService.get('loginData');
    if (loginData) {
      try {
        const data = JSON.parse(loginData);
        if (typeof data.profit_percentage === 'number') {
          this.profitPercentage = data.profit_percentage;
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
}
