import { Component, OnInit } from '@angular/core';
import { MaterialService, Material } from '../services/material.service';
import { MaterialTypeService, MaterialType } from '../services/material-type.service';

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

  constructor(
    private materialService: MaterialService,
    private materialTypeService: MaterialTypeService
  ) {}

  ngOnInit(): void {
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

  removeMaterial(sel: SelectedMaterial): void {
    const confirmed = window.confirm('Quitar?');
    if (confirmed) {
      this.selected = this.selected.filter(m => m.material.id !== sel.material.id);
    }
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
      return width * length * price;
    }
    if (this.isPieceType(sel.material)) {
      const qty = sel.quantity ?? 0;
      return qty * price;
    }
    return price;
  }
}
