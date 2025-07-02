import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialService, Material } from '../services/material.service';
import { MaterialTypeService, MaterialType } from '../services/material-type.service';
import { CookieService } from '../services/cookie.service';
import {
  AccessoryService,
  AccessoryMaterial,
  Accessory
} from '../services/accessory.service';
import { toNumber } from '../utils/number-parse';

interface SelectedAccessory {
  accessory: Accessory;
  quantity: number;
  component_id?: number;
}

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
  childSearchText = '';
  accessoryResults: Accessory[] = [];
  selectedChildren: SelectedAccessory[] = [];
  showRemoveChildModal = false;
  childToRemove: SelectedAccessory | null = null;
  materialTypes: MaterialType[] = [];
  searching = false;
  showRemoveModal = false;
  materialToRemove: SelectedMaterial | null = null;
  profitPercentage = 0;
  accessoryName = '';
  accessoryDescription = '';
  saveError = '';
  successMessage = '';
  isSaving = false;
  formSubmitted = false;
  accessories: Accessory[] = [];
  ownerId: number | null = null;
  isEditing = false;
  editingId: number | null = null;
  activeTab: 'create' | 'edit' | 'list' = 'create';
  listSearchText = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;

  constructor(
    private materialService: MaterialService,
    private materialTypeService: MaterialTypeService,
    private cookieService: CookieService,
    private accessoryService: AccessoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const editIdParam = this.route.snapshot.paramMap.get('id');
    if (editIdParam) {
      const id = parseInt(editIdParam, 10);
      if (!isNaN(id)) {
        this.isEditing = true;
        this.editingId = id;
        this.activeTab = 'edit';
        this.loadAccessory(id);
      }
    }

    const loginData = this.cookieService.get('loginData');
    if (loginData) {
      try {
        const data = JSON.parse(loginData);
        this.ownerId = parseInt(data.ownerCompany?.id, 10);
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
    if (this.ownerId !== null && !isNaN(this.ownerId)) {
      this.loadAccessories();
    }
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

  onAccessorySearchChange(): void {
    if (this.childSearchText.trim() === '' || this.ownerId === null) {
      this.accessoryResults = [];
      return;
    }
    this.accessoryService
      .getAccessories(this.ownerId, 1, 10, this.childSearchText)
      .subscribe({
        next: res => {
          const docs: any = (res as any).docs ?? (res as any).items ?? res;
          this.accessoryResults = Array.isArray(docs) ? docs : [];
        },
        error: () => {
          this.accessoryResults = [];
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

  addChildAccessory(acc: Accessory): void {
    if (!this.selectedChildren.some(a => a.accessory.id === acc.id)) {
      const sel: SelectedAccessory = { accessory: { ...acc }, quantity: 1 };
      this.selectedChildren.push(sel);
      this.childSearchText = '';
      this.accessoryResults = [];

      // Fetch full accessory details to populate cost and price
      this.populateAccessoryTotals(sel);
    }
  }

  openRemoveModal(sel: SelectedMaterial): void {
    this.materialToRemove = sel;
    this.showRemoveModal = true;
  }

  openRemoveChildModal(sel: SelectedAccessory): void {
    this.childToRemove = sel;
    this.showRemoveChildModal = true;
  }

  closeRemoveModal(): void {
    this.showRemoveModal = false;
    this.materialToRemove = null;
  }

  closeRemoveChildModal(): void {
    this.showRemoveChildModal = false;
    this.childToRemove = null;
  }

  private populateAccessoryTotals(sel: SelectedAccessory): void {
    this.accessoryService.getAccessory(sel.accessory.id).subscribe({
      next: acc => {
        sel.accessory = { ...sel.accessory, ...acc };
        if (sel.accessory.cost === undefined || sel.accessory.price === undefined) {
          this.accessoryService.getAccessoryMaterials(sel.accessory.id).subscribe({
            next: mats => {
              const items: any[] = Array.isArray((mats as any).materials)
                ? (mats as any).materials
                : Array.isArray(mats)
                ? (mats as any)
                : [];
              let cost = 0;
              let price = 0;
              for (const m of items) {
                cost += toNumber(m.cost);
                price += toNumber(m.price);
              }
              sel.accessory.cost = cost;
              sel.accessory.price = price;
            },
            error: () => {
              // ignore errors and keep whatever data we have
            }
          });
        }
      },
      error: () => {
        // ignore errors and keep existing partial data
      }
    });
  }

  confirmRemove(): void {
    if (this.materialToRemove) {
      this.selected = this.selected.filter(
        m => m.material.id !== this.materialToRemove!.material.id
      );
    }
    this.closeRemoveModal();
  }

  confirmRemoveChild(): void {
    if (this.childToRemove) {
      if (this.childToRemove.component_id) {
        this.accessoryService
          .deleteAccessoryComponent(this.childToRemove.component_id)
          .subscribe({
            next: () => {},
            error: () => {}
          });
      }
      this.selectedChildren = this.selectedChildren.filter(
        c => c.accessory.id !== this.childToRemove!.accessory.id
      );
    }
    this.closeRemoveChildModal();
  }

  private resetForm(): void {
    this.accessoryName = '';
    this.accessoryDescription = '';
    this.selected = [];
    this.selectedChildren = [];
    this.formSubmitted = false;
    this.saveError = '';
    this.successMessage = '';
  }

  setTab(tab: 'create' | 'edit' | 'list'): void {
    this.activeTab = tab;
    if (tab === 'list' && this.ownerId !== null && !isNaN(this.ownerId)) {
      this.loadAccessories();
    } else if (tab === 'create') {
      this.isEditing = false;
      this.editingId = null;
      this.resetForm();
    }
  }

  loadAccessories(): void {
    if (this.ownerId === null || isNaN(this.ownerId)) {
      this.accessories = [];
      this.totalPages = 0;
      return;
    }
    this.accessoryService
      .getAccessories(
        this.ownerId,
        this.currentPage,
        this.pageSize,
        this.listSearchText
      )
      .subscribe({
        next: res => {
          const docs: any = (res as any).docs ?? (res as any).items ?? res;
          this.accessories = Array.isArray(docs) ? docs : [];
          let pages: any = (res as any).totalPages;
          if (!Number.isFinite(pages)) {
            const totalDocs = (res as any).totalDocs;
            if (Number.isFinite(totalDocs) && this.pageSize > 0) {
              pages = Math.ceil(totalDocs / this.pageSize);
            }
          }
          this.totalPages = Number.isFinite(pages) ? pages : 0;
        },
        error: () => {
          this.accessories = [];
          this.totalPages = 0;
        }
      });
  }

  private loadAccessory(id: number): void {
    this.accessoryService.getAccessory(id).subscribe({
      next: acc => {
        this.accessoryName = acc.name;
        this.accessoryDescription = acc.description;
        this.accessoryService.getAccessoryMaterials(id).subscribe({
          next: mats => {
            const materials: any[] = Array.isArray((mats as any).materials)
              ? (mats as any).materials
              : Array.isArray(mats)
              ? (mats as any)
              : [];
            this.selected = materials.map(m => {
              const mat: Material = (m as any).material ?? {
                id: m.material_id ?? m.id,
                name: m.material_name ?? m.name,
                description: m.description,
                material_type_id: m.material_type_id,
                thickness_mm: m.thickness_mm,
                width_m: m.width_m,
                length_m: m.length_m,
                price: m.price
              };
              return {
                material: mat,
                width: m.width ?? m.width_m_used,
                length: m.length ?? m.length_m_used,
                quantity: m.quantity
              } as SelectedMaterial;
            });
          },
          error: () => {
            this.selected = [];
          }
        });
        this.accessoryService.getAccessoryComponents(id).subscribe({
          next: comps => {
            const items: any[] = Array.isArray((comps as any).components)
              ? (comps as any).components
              : Array.isArray(comps)
              ? (comps as any)
              : [];
            this.selectedChildren = items.map(c => {
              const child: Accessory = (c as any).child ?? {
                id: c.child_accessory_id,
                name: (c as any).child_name ?? '',
                description: (c as any).child_description ?? ''
              };
              return {
                accessory: child,
                quantity: c.quantity ?? 1,
                component_id: c.id
              } as SelectedAccessory;
            });

            // Fetch full accessory details to ensure name, cost and price are available
            for (const sel of this.selectedChildren) {
              this.populateAccessoryTotals(sel);
            }
          },
          error: () => {
            this.selectedChildren = [];
          }
        });
      },
      error: () => {
        // ignore errors
      }
    });
  }

  get filteredAccessories(): Accessory[] {
    const term = this.listSearchText.trim().toLowerCase();
    if (!term) {
      return this.accessories;
    }
    return this.accessories.filter(acc =>
      acc.id.toString().includes(term) ||
      acc.name?.toLowerCase().includes(term) ||
      acc.description?.toLowerCase().includes(term)
    );
  }

  onListSearchChange(): void {
    this.currentPage = 1;
    this.loadAccessories();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.loadAccessories();
  }

  getMaterialType(mat: Material): MaterialType | undefined {
    return this.materialTypes.find(t => t.id === mat.material_type_id);
  }

  isAreaType(mat: Material): boolean {
    const typeId = mat.material_type_id;
    if (typeId != null) {
      return typeId === 2;
    }
    const type = this.getMaterialType(mat);
    // Avoid classifying piece based materials as area even if they have
    // width/length metadata by explicitly checking the piece type first
    if (this.isPieceType(mat)) {
      return false;
    }
    const ident = (type?.unit || type?.name || '').toLowerCase();
    return (
      (mat.width_m !== undefined && mat.length_m !== undefined) ||
      (type?.id === 2 || ident.includes('m2') || ident.includes('área') || ident.includes('area'))
    );
  }

  isPieceType(mat: Material): boolean {
    const typeId = mat.material_type_id;
    if (typeId != null) {
      return typeId === 1;
    }
    const type = this.getMaterialType(mat);
    if (!type) {
      return false;
    }
    const ident = (type.unit || type.name || '').toLowerCase();
    return type.id === 1 || ident.includes('pieza') || ident.includes('unidad');
  }

  private toNumber(value: any): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return 0;
      }
      // Remove currency symbols and other non-numeric characters
      const cleaned = trimmed.replace(/[^0-9.,-]/g, '');
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      let normalized = cleaned;
      if (lastComma > lastDot) {
        // comma used as decimal separator -> remove dots used as thousands
        normalized = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // dot used as decimal separator -> remove commas
        normalized = cleaned.replace(/,/g, '');
      }
      const n = parseFloat(normalized);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
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
    const price = toNumber(sel.material.price);
    if (this.isAreaType(sel.material)) {
      const width = toNumber(sel.width);
      const length = toNumber(sel.length);
      const baseWidth = toNumber(sel.material.width_m);
      const baseLength = toNumber(sel.material.length_m);
      const baseArea = baseWidth * baseLength;
      const area = width * length;
      if (baseArea > 0) {
        return (area / baseArea) * price;
      }
      return area * price;
    }
    if (this.isPieceType(sel.material)) {
      const qty = toNumber(sel.quantity);
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

  get totalAccessoryCost(): number {
    return this.selectedChildren.reduce((sum, child) => {
      const qty = toNumber(child.quantity ?? 1);
      const cost = toNumber(child.accessory?.cost);
      return sum + cost * qty;
    }, 0);
  }

  get totalAccessoryPrice(): number {
    return this.selectedChildren.reduce((sum, child) => {
      const qty = toNumber(child.quantity ?? 1);
      const price = toNumber(child.accessory?.price);
      return sum + price * qty;
    }, 0);
  }

  calculateChildCost(child: SelectedAccessory): number {
    const qty = toNumber(child.quantity ?? 1);
    const cost = toNumber(child.accessory?.cost);
    return cost * qty;
  }

  calculateChildPrice(child: SelectedAccessory): number {
    const qty = toNumber(child.quantity ?? 1);
    const price = toNumber(child.accessory?.price);
    return price * qty;
  }

  calculatePricePercentage(acc: Accessory): number {
    if (!acc || acc.cost === undefined || acc.price === undefined) {
      return 0;
    }
    const cost = toNumber(acc.cost);
    const price = toNumber(acc.price);
    return cost > 0 ? ((price - cost) / cost) * 100 : 0;
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

    for (const child of this.selectedChildren) {
      if (!child.quantity || child.quantity <= 0) {
        this.saveError = 'Ingresa cantidades válidas para los accesorios hijos';
        return;
      }
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

    const save$ = this.isEditing && this.editingId !== null
      ? this.accessoryService.updateAccessory(this.editingId, name, description)
      : this.accessoryService.addAccessory(name, description, ownerId);

    save$.subscribe({
      next: (acc: Accessory) => {
        const id = this.isEditing && this.editingId !== null ? this.editingId : acc.id;
        const materials: AccessoryMaterial[] = this.selected.map(sel => {
          const cost = this.calculateCost(sel);
          return {
            accessory_id: id,
            material_id: sel.material.id,
            width: sel.width,
            length: sel.length,
            quantity: sel.quantity,
            cost,
            price: cost * (1 + this.profitPercentage / 100),
            profit_percentage: this.profitPercentage
          };
        });
        const materials$ = this.isEditing
          ? this.accessoryService.updateAccessoryMaterials(id, materials)
          : this.accessoryService.addAccessoryMaterials(id, materials);
        materials$.subscribe({
          next: () => {
            const newChildren = this.selectedChildren.filter(c => !c.component_id);
            if (newChildren.length) {
              let pending = newChildren.length;
              const finalizeSave = () => {
                this.isSaving = false;
                if (this.isEditing) {
                  this.formSubmitted = false;
                } else {
                  this.resetForm();
                  form.resetForm();
                }
                this.saveError = '';
                this.successMessage = 'Accesorio guardado exitosamente';
                setTimeout(() => (this.successMessage = ''), 3000);
              };
              for (const child of newChildren) {
                this.accessoryService
                  .addAccessoryComponent(id, child.accessory.id, child.quantity)
                  .subscribe({
                    next: res => {
                      child.component_id = res.id;
                      if (--pending === 0) {
                        finalizeSave();
                      }
                    },
                    error: () => {
                      if (--pending === 0) {
                        finalizeSave();
                      }
                    }
                  });
              }
            } else {
              const finalizeSave = () => {
                this.isSaving = false;
                if (this.isEditing) {
                  this.formSubmitted = false;
                } else {
                  this.resetForm();
                  form.resetForm();
                }
                this.saveError = '';
                this.successMessage = 'Accesorio guardado exitosamente';
                setTimeout(() => (this.successMessage = ''), 3000);
              };
              finalizeSave();
            }
          },
          error: err => {
            this.isSaving = false;
            this.saveError = err?.error?.message || 'Error al guardar materiales';
          }
        });
      },
      error: err => {
        this.isSaving = false;
        this.saveError = err?.error?.message || 'Error al guardar el accesorio';
      }
    });
  }

  editAccessory(acc: Accessory): void {
    this.isEditing = true;
    this.editingId = acc.id;
    this.activeTab = 'edit';
    this.loadAccessory(acc.id);
  }
}
