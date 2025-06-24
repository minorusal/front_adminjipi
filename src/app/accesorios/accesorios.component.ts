import { Component } from '@angular/core';
import { MaterialService, Material } from '../services/material.service';

@Component({
  selector: 'app-accesorios',
  templateUrl: './accesorios.component.html',
  styleUrls: ['./accesorios.component.css']
})
export class AccesoriosComponent {
  searchText = '';
  results: Material[] = [];
  selected: Material[] = [];
  searching = false;

  constructor(private materialService: MaterialService) {}

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
    if (!this.selected.some(m => m.id === mat.id)) {
      this.selected.push(mat);
    }
  }
}
