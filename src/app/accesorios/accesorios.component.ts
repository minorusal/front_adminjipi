import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialService, Material } from '../services/material.service';
import {
  MaterialTypeService,
  MaterialType,
} from '../services/material-type.service';
import { CookieService } from '../services/cookie.service';
import {
  AccessoryService,
  AccessoryMaterial,
  AccessoryMaterialPayload,
  AccessoryCreatePayload,
  AccessoryUpdatePayload,
  AccessoryMaterialDetail,
  AccessoryChildDetail,
  Accessory,
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
  /** Unit of measure used when editing an existing accessory */
  unit?: string;
  quantity?: number;
  /** Stored cost for this material selection */
  cost?: number;
  /** Base investment of the material */
  investment?: number;
  _invalid?: boolean;
}

@Component({
  selector: 'app-accesorios',
  templateUrl: './accesorios.component.html',
  styleUrls: ['./accesorios.component.css'],
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
  /** Totals loaded from the API when editing */
  apiTotals = {
    total_materials_cost: 0,
    total_materials_price: 0,
    total_accessories_cost: 0,
    total_accessories_price: 0,
    total_cost: 0,
    total_price: 0,
  };
  /** Whether totals should be recalculated after user edits */
  totalsDirty = false;
  /** Flag to avoid recalculating costs while loading from API */
  initializingMaterials = false;
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
    private router: Router,
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
      next: (types) => {
        this.materialTypes = Array.isArray(types) ? types : [];
      },
      error: () => {
        this.materialTypes = [];
      },
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
      next: (res) => {
        const docs: any = (res as any).docs ?? (res as any).items ?? res;
        this.results = Array.isArray(docs) ? docs : [];
        this.searching = false;
      },
      error: () => {
        this.results = [];
        this.searching = false;
      },
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
        next: (res) => {
          const docs: any = (res as any).docs ?? (res as any).items ?? res;
          this.accessoryResults = Array.isArray(docs) ? docs : [];
        },
        error: () => {
          this.accessoryResults = [];
        },
      });
  }

  addMaterial(mat: Material): void {
    if (!this.selected.some((m) => m.material.id === mat.id)) {
      this.selected.push({ material: mat, investment: mat.price, cost: undefined });
      this.searchText = '';
      this.results = [];
      this.totalsDirty = true;
    }
  }

  addChildAccessory(acc: Accessory): void {
    if (!this.selectedChildren.some((a) => a.accessory.id === acc.id)) {
      const sel: SelectedAccessory = { accessory: { ...acc }, quantity: 1 };
      this.selectedChildren.push(sel);
      this.childSearchText = '';
      this.accessoryResults = [];
      this.totalsDirty = true;

      // Fetch full accessory details to populate cost and price only when
      // the selected accessory lacks this information.
      if (acc.cost === undefined || acc.price === undefined) {
        this.populateAccessoryTotals(sel);
      }
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
      next: (acc) => {
        sel.accessory = { ...sel.accessory, ...acc };
        if (
          sel.accessory.cost === undefined ||
          sel.accessory.price === undefined
        ) {
          this.accessoryService
            .getAccessoryMaterials(sel.accessory.id)
            .subscribe({
              next: (mats) => {
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
              },
            });
        }
      },
      error: () => {
        // ignore errors and keep existing partial data
      },
    });
  }

  confirmRemove(): void {
    if (this.materialToRemove) {
      this.selected = this.selected.filter(
        (m) => m.material.id !== this.materialToRemove!.material.id,
      );
    }
    this.totalsDirty = true;
    this.closeRemoveModal();
  }

  confirmRemoveChild(): void {
    if (this.childToRemove) {
      if (this.childToRemove.component_id) {
        this.accessoryService
          .deleteAccessoryComponent(this.childToRemove.component_id)
          .subscribe({
            next: () => {
              if (this.editingId) {
                this.updateApiTotals(this.editingId);
              }
            },
            error: () => {},
          });
      }
      this.selectedChildren = this.selectedChildren.filter(
        (c) => c.accessory.id !== this.childToRemove!.accessory.id,
      );
    }
    this.totalsDirty = true;
    this.closeRemoveChildModal();
  }

  private resetForm(): void {
    this.accessoryName = '';
    this.accessoryDescription = '';
    this.selected = [];
    this.selectedChildren = [];
    this.apiTotals = {
      total_materials_cost: 0,
      total_materials_price: 0,
      total_accessories_cost: 0,
      total_accessories_price: 0,
      total_cost: 0,
      total_price: 0,
    };
    this.totalsDirty = false;
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
        this.listSearchText,
      )
      .subscribe({
        next: (res) => {
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
        },
      });
  }

  private loadAccessory(id: number): void {
    this.initializingMaterials = true;
    this.accessoryService.getAccessory(id).subscribe({
      next: (acc) => {
        this.accessoryName = acc.name;
        this.accessoryDescription = acc.description;
        this.apiTotals = {
          total_materials_cost: this.toNumber((acc as any).total_materials_cost),
          total_materials_price: this.toNumber((acc as any).total_materials_price),
          total_accessories_cost: this.toNumber((acc as any).total_accessories_cost),
          total_accessories_price: this.toNumber((acc as any).total_accessories_price),
          total_cost: this.toNumber((acc as any).total_cost),
          total_price: this.toNumber((acc as any).total_price),
        };
        if ((acc as any).markup_percentage !== undefined) {
          const mp = this.toNumber((acc as any).markup_percentage);
          if (!Number.isNaN(mp)) {
            this.profitPercentage = mp;
          }
        }
        this.totalsDirty = false;
        this.updateApiTotals(id);
        this.accessoryService.getAccessoryMaterials(id).subscribe({
          next: (mats) => {
            const materials: any[] = Array.isArray((mats as any).materials)
              ? (mats as any).materials
              : Array.isArray(mats)
                ? (mats as any)
                : [];
            this.selected = materials.map((m) => {
              const basePrice = this.toNumber(
                (m as any).investment ??
                  (m as any).material?.price ??
                  m.price,
              );
              const mat: Material = (m as any).material ?? {
                id: m.material_id ?? m.id,
                name: m.material_name ?? m.name,
                description: m.description,
                material_type_id: m.material_type_id,
                thickness_mm: m.thickness_mm,
                width_m: m.width_m,
                length_m: m.length_m,
                price: basePrice,
              };
              const width = this.toNumber(m.width ?? m.width_m_used);
              const length = this.toNumber(m.length ?? m.length_m_used);
              const cost = this.toNumber(m.cost);
              return {
                material: mat,
                width,
                length,
                unit: m.unit,
                quantity: this.toNumber(m.quantity),
                cost,
                investment: basePrice,
              } as SelectedMaterial;
            });

            // Recalculate costs for area-based materials when not provided
            for (const sel of this.selected) {
              if (this.isAreaSel(sel) && (!sel.cost || sel.cost === 0)) {
                sel.cost = this.calculateCost(sel);
              }
            }

            // If API totals were missing, derive them from the loaded materials
            const calcTotal = this.selected.reduce(
              (sum, sel) => sum + this.toNumber(sel.cost),
              0,
            );
            if (!this.apiTotals.total_materials_cost) {
              this.apiTotals.total_materials_cost = calcTotal;
            }
            if (!this.apiTotals.total_materials_price) {
              this.apiTotals.total_materials_price =
                calcTotal * (1 + this.profitPercentage / 100);
            }

            this.initializingMaterials = false;
          },
          error: () => {
            this.selected = [];
            this.initializingMaterials = false;
          },
        });
        this.accessoryService.getAccessoryComponents(id).subscribe({
          next: (comps) => {
            const items: any[] = Array.isArray((comps as any).components)
              ? (comps as any).components
              : Array.isArray(comps)
                ? (comps as any)
                : [];
            this.selectedChildren = items.map((c) => {
              const base: Accessory = (c as any).child ?? {
                id: c.child_accessory_id,
                name: (c as any).child_name ?? '',
                description: (c as any).child_description ?? '',
              };
              const child: Accessory = {
                ...base,
                cost: c.cost,
                price: c.price,
              };
              return {
                accessory: child,
                quantity: c.quantity ?? 1,
                component_id: c.id,
              } as SelectedAccessory;
            });

            // Fetch full accessory details to ensure name, cost and price are available
            for (const sel of this.selectedChildren) {
              if (
                sel.accessory.cost === undefined ||
                sel.accessory.price === undefined
              ) {
                this.populateAccessoryTotals(sel);
              }
            }
          },
          error: () => {
            this.selectedChildren = [];
          },
        });
      },
      error: () => {
        // ignore errors
      },
    });
  }

  get filteredAccessories(): Accessory[] {
    const term = this.listSearchText.trim().toLowerCase();
    if (!term) {
      return this.accessories;
    }
    return this.accessories.filter(
      (acc) =>
        acc.id.toString().includes(term) ||
        acc.name?.toLowerCase().includes(term) ||
        acc.description?.toLowerCase().includes(term),
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
    return this.materialTypes.find((t) => t.id === mat.material_type_id);
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
      type?.id === 2 ||
      ident.includes('m2') ||
      ident.includes('área') ||
      ident.includes('area')
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

  /** Determine if the selected material should be treated as area based on its unit */
  isAreaSel(sel: SelectedMaterial): boolean {
    const unit = sel.unit ?? this.getMaterialType(sel.material)?.unit;
    if (unit) {
      const ident = unit.toLowerCase();
      return (
        ident.includes('m2') || ident.includes('m²') || ident.includes('area') || ident.includes('área')
      );
    }
    return this.isAreaType(sel.material);
  }

  /** Determine if the selected material should be treated as piece/unit based on its unit */
  isPieceSel(sel: SelectedMaterial): boolean {
    const unit = sel.unit ?? this.getMaterialType(sel.material)?.unit;
    if (unit) {
      const ident = unit.toLowerCase();
      return ident.includes('unit') || ident.includes('pieza') || ident.includes('unidad');
    }
    return this.isPieceType(sel.material);
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
    if (this.isAreaSel(sel)) {
      return !!sel.width && sel.width > 0 && !!sel.length && sel.length > 0;
    }
    if (this.isPieceSel(sel)) {
      return !!sel.quantity && sel.quantity > 0;
    }
    return true;
  }

  onMaterialInput(sel: SelectedMaterial): void {
    if (this.initializingMaterials) {
      return;
    }
    if (sel._invalid && this.isMaterialInfoValid(sel)) {
      sel._invalid = false;
    }
    sel.cost = this.calculateCost(sel);
    this.totalsDirty = true;
  }

  onChildInput(): void {
    this.totalsDirty = true;
  }

  calculateCost(sel: SelectedMaterial): number {
    const price = toNumber(sel.material.price);
    const investment = toNumber(sel.investment ?? sel.material.price);
    if (sel.unit === 'm²') {
      const width = toNumber(sel.width);
      const length = toNumber(sel.length);
      return width * length * investment;
    }
    if (this.isAreaSel(sel)) {
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
    if (this.isPieceSel(sel)) {
      const qty = toNumber(sel.quantity);
      return qty * price;
    }
    return price;
  }

  get totalCost(): number {
    if (this.isEditing && !this.totalsDirty) {
      return this.toNumber(this.apiTotals.total_materials_cost);
    }
    return this.selected.reduce((sum, sel) => {
      if (this.isEditing && sel.cost !== undefined) {
        return sum + toNumber(sel.cost);
      }
      return sum + this.calculateCost(sel);
    }, 0);
  }

  get totalMaterialPrice(): number {
    if (this.isEditing && !this.totalsDirty) {
      return this.toNumber(this.apiTotals.total_materials_price);
    }
    return this.totalCost * (1 + this.profitPercentage / 100);
  }

  get totalWithProfit(): number {
    if (this.isEditing && !this.totalsDirty) {
      return this.toNumber(this.apiTotals.total_price);
    }
    return this.totalMaterialPrice + this.totalAccessoryPrice;
  }

  get totalAccessoryCost(): number {
    if (this.isEditing && !this.totalsDirty) {
      return this.toNumber(this.apiTotals.total_accessories_cost);
    }
    return this.selectedChildren.reduce((sum, child) => {
      const qty = toNumber(child.quantity ?? 1);
      const cost = toNumber(child.accessory?.cost);
      return sum + cost * qty;
    }, 0);
  }

  get totalAccessoryPrice(): number {
    if (this.isEditing && !this.totalsDirty) {
      return this.toNumber(this.apiTotals.total_accessories_price);
    }
    return this.selectedChildren.reduce((sum, child) => {
      const qty = toNumber(child.quantity ?? 1);
      const price = toNumber(child.accessory?.price);
      return sum + price * qty;
    }, 0);
  }

  get combinedCost(): number {
    if (this.isEditing && !this.totalsDirty) {
      return this.toNumber(this.apiTotals.total_cost);
    }
    return this.totalCost + this.totalAccessoryCost;
  }

  get combinedPrice(): number {
    if (this.isEditing && !this.totalsDirty) {
      return this.toNumber(this.apiTotals.total_price);
    }
    return this.totalWithProfit;
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

  private updateApiTotals(id: number): void {
    if (this.ownerId === null || isNaN(this.ownerId)) {
      return;
    }
    this.accessoryService.getAccessoryCost(id, this.ownerId).subscribe({
      next: (res) => {
        if (typeof res.profit_percentage === 'number') {
          this.profitPercentage = res.profit_percentage;
        }
      },
      error: () => {
        // ignore errors
      },
    });
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
      this.saveError =
        'Completa las cantidades o medidas de los materiales seleccionados';
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

    const markup = toNumber(this.profitPercentage);

    const materialsDetailed: AccessoryMaterialDetail[] = this.selected.map((sel) => {
      const cost =
        this.isEditing && sel.cost !== undefined
          ? toNumber(sel.cost)
          : this.calculateCost(sel);
      const price = cost + (markup / 100) * cost;
      const unit = this.isAreaSel(sel) ? 'm²' : 'unit';
      return {
        material_id: sel.material.id,
        width: toNumber(sel.width),
        length: toNumber(sel.length),
        unit,
        quantity: toNumber(sel.quantity),
        cost,
        price,
        investment: toNumber(sel.investment ?? sel.material.price),
        description: sel.material.description,
      } as AccessoryMaterialDetail;
    });
    const accessoriesDetailed: AccessoryChildDetail[] = this.selectedChildren.map((child) => {
      return {
        accessory_id: child.accessory.id,
        name: child.accessory.name,
        quantity: toNumber(child.quantity),
        cost: this.calculateChildCost(child),
        price: this.calculateChildPrice(child),
      } as AccessoryChildDetail;
    });

    const payload: AccessoryCreatePayload = {
      name,
      description,
      owner_id: ownerId,
      markup_percentage: markup,
      materials: materialsDetailed,
      accessories: accessoriesDetailed,
      total_materials_cost: this.totalCost,
      total_materials_price: this.totalMaterialPrice,
      total_accessories_cost: this.totalAccessoryCost,
      total_accessories_price: this.totalAccessoryPrice,
      total_cost: this.combinedCost,
      total_price: this.combinedPrice,
    };

    const updatePayload = {
      name,
      description,
      owner_id: ownerId,
      markup_percentage: markup,
      materials: materialsDetailed,
      accessories: accessoriesDetailed,
      totals: {
        total_materials_cost: this.totalCost,
        total_accessories_cost: this.totalAccessoryCost,
        total_cost: this.combinedCost,
      },
    } as AccessoryUpdatePayload;

    const save$ =
      this.isEditing && this.editingId !== null
        ? this.accessoryService.updateAccessoryDetailed(this.editingId, updatePayload)
        : this.accessoryService.createAccessoryDetailed(payload);

    save$.subscribe({
      next: (acc: Accessory) => {
        const id =
          this.isEditing && this.editingId !== null ? this.editingId : acc.id;
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
          this.updateApiTotals(id);
          this.apiTotals = {
            total_materials_cost: this.totalCost,
            total_materials_price: this.totalMaterialPrice,
            total_accessories_cost: this.totalAccessoryCost,
            total_accessories_price: this.totalAccessoryPrice,
            total_cost: this.combinedCost,
            total_price: this.combinedPrice,
          };
          this.totalsDirty = false;
        };

        finalizeSave();
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = err?.error?.message || 'Error al guardar el accesorio';
      },
    });
  }

  editAccessory(acc: Accessory): void {
    this.isEditing = true;
    this.editingId = acc.id;
    this.activeTab = 'edit';
    this.loadAccessory(acc.id);
  }
}
