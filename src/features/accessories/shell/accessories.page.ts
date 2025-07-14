import { Component, OnInit } from '@angular/core';
<<<<<<< HEAD:src/app/accesorios/accesorios.component.ts
import { NgForm } from '@angular/forms';
=======
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialService, Material } from '../../../app/core/services/material.service';
import {
  MaterialTypeService,
  MaterialType,
} from '../../../app/core/services/material-type.service';
import { CookieService } from '../../../app/core/services/cookie.service';
>>>>>>> 623efd667937a91c87fbe8fb2a7d690fdba176d9:src/features/accessories/shell/accessories.page.ts
import {
  AccessoryService,
  Accessory,
  AccessoryMaterial,
  PaginatedResponse,
  AccessoryCreatePayload,
  AccessoryUpdatePayload,
  AccessoryComponent,
  AccessoryMaterialDetail,
  AccessoryChildDetail,
<<<<<<< HEAD:src/app/accesorios/accesorios.component.ts
} from '../services/accessory.service';
import { MaterialService, Material, MaterialInList } from '../services/material.service';
import { MaterialTypeService, MaterialType } from '../services/material-type.service';
import { toNumber } from '../utils/number-parse';
import { CookieService } from '../services/cookie.service';
=======
  Accessory,
} from '../../../app/core/services/accessory.service';
import { toNumber } from '../../../app/shared/utils/number-parse';

interface SelectedAccessory {
  accessory: Accessory;
  quantity: number;
  component_id?: number;
}
>>>>>>> 623efd667937a91c87fbe8fb2a7d690fdba176d9:src/features/accessories/shell/accessories.page.ts

interface SelectedMaterial {
  id?: number; // Will hold the accessory_materials.id for deletion
  material: Material;
  quantity: number;
  width: number;
  length: number;
  cost: number;
  investment: number;
  _invalid?: boolean;
}

interface SelectedChild {
  id?: number; // Will hold the accessory_components.id for deletion
  accessory: Accessory;
  quantity: number;
}
@Component({
  selector: 'app-accessories',
  templateUrl: './accessories.page.html',
  styleUrls: ['./accessories.page.css'],
})
<<<<<<< HEAD:src/app/accesorios/accesorios.component.ts
export class AccesoriosComponent implements OnInit {
  // Tab control
  activeTab: 'create' | 'list' | 'edit' = 'list';

  // State
=======
export class AccessoriesPage implements OnInit {
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
>>>>>>> 623efd667937a91c87fbe8fb2a7d690fdba176d9:src/features/accessories/shell/accessories.page.ts
  isEditing = false;
  editingId: number | null = null;
  isLoading = false;
  isSaving = false;
  formSubmitted = false;

  // Forms model
  accessoryName = '';
  accessoryDescription = '';
  profitPercentage = 0; // Default to 0, will be loaded from cookie

  // Data lists
  accessories: Accessory[] = [];
  filteredAccessories: Accessory[] = [];
  materials: Material[] = [];
  materialTypes: MaterialType[] = [];
  results: MaterialInList[] = [];
  accessoryResults: Accessory[] = [];
  selected: SelectedMaterial[] = [];
  selectedChildren: SelectedChild[] = [];

  // Search
  searchText = '';
  accessorySearchText = '';
  listSearchText = '';

  // Modals
  showRemoveModal = false;
  itemToRemove: any = null;
  showRemoveChildModal = false;
  childToRemove: any = null;
  
  // Messages
  saveError = '';
  successMessage = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 0;
  pageSize = 10;
  
  // Totals
  totalCost = 0;
  totalMaterialPrice = 0;
  totalAccessoryCost = 0;
  totalAccessoryPrice = 0;
  totalWithProfit = 0;
  combinedCost = 0;

  ownerId = 1;

  constructor(
    private accessoryService: AccessoryService,
    private materialService: MaterialService,
    private materialTypeService: MaterialTypeService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    const profitCookie = this.cookieService.get('profit_percentage');
    if (profitCookie) {
      this.profitPercentage = toNumber(profitCookie);
    }
    const ownerIdCookie = this.cookieService.get('owner_id');
    if (ownerIdCookie) {
      this.ownerId = toNumber(ownerIdCookie);
    }

    this.loadAccessories();
    this.materialTypeService.getMaterialTypes().subscribe(types => this.materialTypes = types);
  }

  setTab(tab: 'create' | 'list' | 'edit'): void {
    this.activeTab = tab;
    if (tab === 'create') {
      this.isEditing = false;
      this.resetForm();
    }
  }

  loadAccessories(): void {
    this.isLoading = true;
    this.accessoryService
      .getAccessories(this.ownerId, this.currentPage, this.pageSize, this.listSearchText)
      .subscribe({
        next: (res: PaginatedResponse<Accessory>) => {
          this.accessories = res.docs; // <-- Corregido: de 'items' a 'docs'
          this.totalPages = res.totalPages; // <-- Corregido: usar 'totalPages' directamente
          this.onListSearchChange(); // Aplicar filtro inicial
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  onSearchChange(): void {
    if (this.searchText.length > 2) {
      this.materialService.getMaterials(1, 20, this.searchText).subscribe((res) => {
        this.results = res.docs;
      });
    } else {
      this.results = [];
    }
  }
  
  onAccessorySearchChange(): void {
    if (this.accessorySearchText.length > 2) {
      this.accessoryService.getAccessories(this.ownerId, 1, 20, this.accessorySearchText).subscribe(res => {
        this.accessoryResults = res.docs; // <-- Corregido aquí
      });
    } else {
      this.accessoryResults = [];
    }
  }
  
  onListSearchChange(): void {
    if (!this.listSearchText) {
      this.filteredAccessories = this.accessories;
    } else {
      const term = this.listSearchText.toLowerCase();
      this.filteredAccessories = this.accessories.filter(
        (acc) =>
          acc.name.toLowerCase().includes(term) ||
          acc.description?.toLowerCase().includes(term)
      );
    }
  }

  addMaterial(material: MaterialInList): void {
    const existing = this.selected.find((m) => m.material.id === material.id);
    if (!existing) {
      // Get the full material details before adding
      this.materialService.getMaterialById(material.id).subscribe(fullMaterial => {
        const typeName = this.getMaterialType(fullMaterial)?.name?.trim().toLowerCase();
        const isArea = typeName === 'area';

        let initialWidth = 0;
        let initialLength = 0;

        if (isArea) {
            initialWidth = toNumber(fullMaterial.attributes?.['width']?.value);
            initialLength = toNumber(fullMaterial.attributes?.['length']?.value);
        }
        
        this.selected.push({
          material: fullMaterial,
          quantity: 1,
          width: initialWidth,
          length: initialLength,
          cost: 0,
          investment: 0,
          _invalid: false
        });
        this.calculateTotals();
      });
    }
    this.searchText = '';
    this.results = [];
  }

  addChildAccessory(accessory: Accessory): void {
    const existing = this.selectedChildren.find(c => c.accessory.id === accessory.id);
    if (!existing) {
        this.accessoryService.getAccessoryById(accessory.id).subscribe(fullAccessory => {
            // Map total_cost and total_price to cost and price for consistency.
            // Handles both snake_case (total_cost) and camelCase (totalCost) from the API.
            const mappedAccessory: Accessory = {
              ...fullAccessory,
              cost: fullAccessory.totalCost ?? fullAccessory.total_cost ?? 0,
              price: fullAccessory.totalPrice ?? fullAccessory.total_price ?? 0,
            };
            this.selectedChildren.push({ accessory: mappedAccessory, quantity: 1});
            this.calculateTotals();
        });
    }
    this.accessorySearchText = '';
    this.accessoryResults = [];
  }

  isAreaSel(sel: any): boolean {
    const typeName = this.getMaterialType(sel.material)?.name?.toLowerCase() || '';
    return typeName.includes('area');
  }

  isPieceSel(sel: any): boolean {
    const typeName = this.getMaterialType(sel.material)?.name?.toLowerCase() || '';
    return typeName.includes('pieza');
  }
  
  getMaterialType(material: any): MaterialType | undefined {
      if (!material) {
        return undefined;
      }
      return this.materialTypes.find(t => t.id === material.material_type_id);
  }

  onMaterialInput(sel: any): void {
    this.calculateTotals();
  }
  
  onChildInput(): void {
    this.calculateTotals();
  }

  calculateTotals(): void {
    // 1. Calculate cost and investment for each selected material
    this.selected.forEach(sel => {
      const purchasePrice = toNumber(sel.material.purchase_price);
      let investment = 0;
  
      if (this.isAreaSel(sel)) {
        const materialWidth = toNumber(sel.material.attributes?.['width']?.value);
        const materialLength = toNumber(sel.material.attributes?.['length']?.value);

        // We use the 'investment' property to store the calculated cost of the piece
        if (materialWidth > 0 && materialLength > 0) {
          const materialArea = materialWidth * materialLength;
          const pricePerUnitArea = purchasePrice / materialArea;
          const pieceArea = toNumber(sel.width) * toNumber(sel.length);
          investment = pricePerUnitArea * pieceArea;
        } else {
          investment = 0; // Cannot calculate if material dimensions are missing
        }
        
        sel.cost = purchasePrice; // The cost of the full material
      } else {
        // For 'piece' or other types, investment is price * quantity
        investment = purchasePrice * toNumber(sel.quantity);
        sel.cost = purchasePrice; // Cost per piece
      }
      
      sel.investment = investment;
    });

    // 2. Calculate total cost for all materials
    this.totalCost = this.selected.reduce((sum, sel) => sum + sel.investment, 0);

    // 3. Calculate total sale price for materials, including profit
    const profitMargin = this.profitPercentage / 100;
    this.totalMaterialPrice = this.totalCost * (1 + profitMargin);
    
    // 4. Calculate total cost and sale price for all child accessories
    this.totalAccessoryCost = this.selectedChildren.reduce((sum, child) => {
        const cost = toNumber(child.accessory.cost); // cost should always exist
        return sum + (cost * toNumber(child.quantity));
    }, 0);

    this.totalAccessoryPrice = this.selectedChildren.reduce((sum, child) => {
        // Use total_price if available, otherwise cost
        const price = toNumber(child.accessory.price ?? child.accessory.cost);
        return sum + (price * toNumber(child.quantity));
    }, 0);

    // 5. Calculate final total cost and sale price for the new accessory
    this.combinedCost = this.totalCost + this.totalAccessoryCost;
    
    // Apply the main profit percentage to the combined cost of all parts.
    const profitMarginCombined = this.profitPercentage / 100;
    this.totalWithProfit = this.combinedCost * (1 + profitMarginCombined);
  }

  editAccessory(acc: Accessory): void {
    // Create a deep copy of the accessory object to prevent unintended mutations.
    // This is a common issue when passing objects by reference to forms.
    const accessoryToEdit = JSON.parse(JSON.stringify(acc));

    if (!accessoryToEdit || !accessoryToEdit.id) {
      this.saveError = 'No se puede editar un accesorio inválido.';
      return;
    }
  
    this.isEditing = true;
    this.editingId = accessoryToEdit.id;
    this.activeTab = 'edit';
    this.isLoading = true;
    this.saveError = '';
  
    // Fetch all details concurrently
    this.accessoryService.getAccessoryById(accessoryToEdit.id).subscribe({
        next: (fullAccessory) => {
            // Populate form
            this.accessoryName = fullAccessory.name;
            this.accessoryDescription = fullAccessory.description ?? '';
            this.profitPercentage = fullAccessory.markup_percentage ?? 20;

            // Populate materials
            this.accessoryService.getAccessoryMaterials(accessoryToEdit.id).subscribe(materials => {
                this.selected = materials.map((am: AccessoryMaterial) => {
                    const purchasePrice = am.material?.purchase_price ?? 0;
                    const investment = this.isAreaType(am.material?.type_name) 
                        ? toNumber(purchasePrice) * toNumber(am.width_m_used) * toNumber(am.length_m_used)
                        : toNumber(purchasePrice) * toNumber(am.quantity);

                    return {
                        id: am.id, // <-- IMPORTANT: Store accessory_material_id
                        material: am.material as Material,
                        quantity: am.quantity ?? 0,
                        width: am.width_m_used ?? 0,
                        length: am.length_m_used ?? 0,
                        cost: toNumber(purchasePrice),
                        investment: investment,
                    };
                });
                this.calculateTotals();
            });

            // Populate child accessories
            this.accessoryService.getAccessoryComponents(accessoryToEdit.id).subscribe(components => {
                this.selectedChildren = components.map((comp: AccessoryComponent) => {
                    return {
                        id: comp.id, // <-- IMPORTANT: Store accessory_component_id
                        accessory: { // Re-construct an Accessory object from component data
                            id: comp.child_accessory_id,
                            name: comp.component_name,
                            description: comp.component_description,
                            cost: comp.cost,
                            price: comp.price,
                        },
                        quantity: comp.quantity,
                    };
                });
                this.calculateTotals();
            });

            this.isLoading = false;
        },
        error: (err) => {
            this.saveError = 'Error al cargar el accesorio. ' + (err.error?.message || '');
            this.isLoading = false;
        }
    });
  }

  submitAccessory(form: NgForm): void {
    this.formSubmitted = true;

    // Recalculate totals one last time to ensure they are fresh
    this.calculateTotals();

    // Basic form validation
    if (form.invalid) {
      this.saveError = 'El formulario no es válido. Revisa los campos marcados.';
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    // Construct the materials and accessories details for the payload
    const materialsPayload: AccessoryMaterialDetail[] = this.selected.map(s => ({
      material_id: s.material.id,
      width: toNumber(s.width),
      length: toNumber(s.length),
      quantity: toNumber(s.quantity),
      unit: s.material.type_name,
      cost: s.cost,
      price: this.isAreaSel(s) ? toNumber(s.material.sale_price) * toNumber(s.width) * toNumber(s.length) : toNumber(s.material.sale_price) * toNumber(s.quantity),
      investment: s.investment,
      description: s.material.description,
    }));

    const accessoriesPayload: AccessoryChildDetail[] = this.selectedChildren.map(c => ({
      accessory_id: c.accessory.id,
      name: c.accessory.name,
      quantity: toNumber(c.quantity),
      cost: toNumber(c.accessory.cost),
      price: toNumber(c.accessory.price)
    }));

    if (this.isEditing && this.editingId) {
      // Logic for UPDATE
      const payload: AccessoryUpdatePayload = {
        name: this.accessoryName,
        description: this.accessoryDescription,
        owner_id: this.ownerId,
        markup_percentage: this.profitPercentage,
        materials: materialsPayload,
        accessories: accessoriesPayload,
        // Assuming backend recalculates totals, but sending our calculated ones if needed
        total_cost: this.combinedCost,
        total_price: this.totalWithProfit,
      };

      this.accessoryService.updateAccessoryDetailed(this.editingId, payload).subscribe({
        next: () => {
          this.successMessage = 'Accesorio actualizado con éxito.';
          this.isSaving = false;
          this.resetForm();
          this.setTab('list');
          this.loadAccessories();
        },
        error: (err) => {
          this.isSaving = false;
          this.saveError = `Error al actualizar el accesorio: ${err.message}`;
        }
      });
    } else {
      // Logic for CREATE
      const payload: AccessoryCreatePayload = {
        name: this.accessoryName,
        description: this.accessoryDescription,
        owner_id: this.ownerId,
        markup_percentage: this.profitPercentage,
        materials: materialsPayload,
        accessories: accessoriesPayload,
        total_materials_cost: this.totalCost,
        total_materials_price: this.totalMaterialPrice,
        total_accessories_cost: this.totalAccessoryCost,
        total_accessories_price: this.totalAccessoryPrice,
        total_cost: this.combinedCost,
        total_price: this.totalWithProfit,
      };

      this.accessoryService.createAccessoryDetailed(payload).subscribe({
        next: () => {
          this.successMessage = 'Accesorio creado con éxito.';
          this.isSaving = false;
          this.resetForm();
          this.setTab('list');
          this.loadAccessories();
        },
        error: (err) => {
          this.isSaving = false;
          this.saveError = `Error al crear el accesorio: ${err.message}`;
        }
      });
    }
  }
  
  deleteAccessory(id: number): void {
      if(confirm('¿Está seguro de que desea eliminar este accesorio?')) {
          this.accessoryService.deleteAccessory(id).subscribe(() => this.loadAccessories());
      }
  }

  resetForm(): void {
    this.accessoryName = '';
    this.accessoryDescription = '';
    // Re-read profit percentage from cookie to ensure it's not lost
    const profitCookie = this.cookieService.get('profit_percentage');
    this.profitPercentage = profitCookie ? toNumber(profitCookie) : 0;
    this.selected = [];
    this.selectedChildren = [];
    this.editingId = null;
    this.isEditing = false;
    this.formSubmitted = false;
    this.saveError = '';
    this.successMessage = '';
  }
  
  // Modal methods
  openRemoveModal(item: any): void {
    this.itemToRemove = item;
    this.showRemoveModal = true;
  }

  closeRemoveModal(): void {
    this.showRemoveModal = false;
    this.itemToRemove = null;
  }

  confirmRemove(): void {
    if (!this.itemToRemove) return;

    // If the item has an ID, it exists on the server and needs an API call
    if (this.itemToRemove.id && this.editingId) {
      this.accessoryService.deleteAccessoryMaterial(this.editingId, this.itemToRemove.id).subscribe({
        next: () => {
          this.successMessage = 'Material eliminado correctamente.';
          // "Golden Rule": Refresh the entire accessory state
          this.editAccessory({ id: this.editingId! } as Accessory); 
        },
        error: (err) => {
          this.saveError = 'Error al eliminar el material. ' + (err.error?.message || '');
        },
        complete: () => {
          this.closeRemoveModal();
          setTimeout(() => this.successMessage = '', 3000);
        }
      });
    } else {
      // If it has no ID, it's a newly-added item that hasn't been saved yet.
      // Just remove it from the local array.
    const index = this.selected.indexOf(this.itemToRemove);
    if (index > -1) {
      this.selected.splice(index, 1);
        this.calculateTotals();
      }
      this.closeRemoveModal();
    }
  }

  openRemoveChildModal(child: any): void {
    this.childToRemove = child;
    this.showRemoveChildModal = true;
  }

  closeRemoveChildModal(): void {
    this.showRemoveChildModal = false;
    this.childToRemove = null;
  }

  confirmRemoveChild(): void {
    if (!this.childToRemove) return;

    // If the child has an ID, it's saved in the DB and needs an API call
    if (this.childToRemove.id && this.editingId) {
      this.accessoryService.deleteAccessoryComponent(this.editingId, this.childToRemove.id).subscribe({
        next: () => {
          this.successMessage = 'Accesorio hijo eliminado correctamente.';
          // "Golden Rule": Refresh the entire accessory state
          this.editAccessory({ id: this.editingId! } as Accessory);
        },
        error: (err) => {
          this.saveError = 'Error al eliminar el accesorio hijo. ' + (err.error?.message || '');
        },
        complete: () => {
          this.closeRemoveChildModal();
          setTimeout(() => this.successMessage = '', 3000);
        }
      });
    } else {
      // If no ID, it's a new item. Just remove locally.
    const index = this.selectedChildren.indexOf(this.childToRemove);
    if (index > -1) {
      this.selectedChildren.splice(index, 1);
        this.calculateTotals();
      }
      this.closeRemoveChildModal();
    }
  }
  
  // Pagination methods
  goToPage(page: number): void {
      if(page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.loadAccessories();
  }
  
  get pages(): number[] {
      const pagesArray = [];
      for(let i = 1; i <= this.totalPages; i++) {
          pagesArray.push(i);
      }
      return pagesArray;
  }

  // Helper to avoid repetitive checks
  private isAreaType(typeName: string | undefined): boolean {
    return typeName === 'area';
  }
}
