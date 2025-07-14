import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AccesoriosComponent } from './accesorios.component';
import { MaterialService, Material, MaterialInList } from '../services/material.service';
import { MaterialTypeService } from '../services/material-type.service';
import { CookieService } from '../services/cookie.service';
import { AccessoryService, Accessory, AccessoryComponent, AccessoryTotals, AccessoryCreatePayload, AccessoryUpdatePayload } from '../services/accessory.service';

interface SelectedMaterial {
  material: Material;
  quantity: number;
  width: number;
  length: number;
  cost: number;
  investment: number;
  _invalid?: boolean;
  id?: number;
}

interface SelectedChild {
  id?: number;
  accessory: Accessory;
  quantity: number;
}

describe('AccesoriosComponent', () => {
  let component: AccesoriosComponent;
  let fixture: ComponentFixture<AccesoriosComponent>;
  let materialServiceSpy: jasmine.SpyObj<MaterialService>;
  let materialTypeServiceSpy: jasmine.SpyObj<MaterialTypeService>;
  let accessoryServiceSpy: jasmine.SpyObj<AccessoryService>;

  beforeEach(() => {
    materialServiceSpy = jasmine.createSpyObj('MaterialService', ['getMaterials', 'getMaterialById']);
    materialTypeServiceSpy = jasmine.createSpyObj('MaterialTypeService', ['getMaterialTypes']);
    accessoryServiceSpy = jasmine.createSpyObj('AccessoryService', [
      'getAccessories',
      'getAccessoryById',
      'getAccessoryMaterials',
      'getAccessoryComponents',
      'getAccessoryCost',
      'createAccessoryDetailed',
      'updateAccessoryDetailed'
    ]);

    accessoryServiceSpy.getAccessories.and.returnValue(of({ docs: [], totalDocs: 0, limit: 10, totalPages: 1, page: 1 }));
    accessoryServiceSpy.getAccessoryById.and.returnValue(of({} as Accessory));
    accessoryServiceSpy.getAccessoryMaterials.and.returnValue(of([]));
    accessoryServiceSpy.getAccessoryComponents.and.returnValue(of([]));
    accessoryServiceSpy.getAccessoryCost.and.returnValue(of({} as AccessoryTotals));
    materialServiceSpy.getMaterials.and.returnValue(of({ docs: [], totalDocs: 0, limit: 10, totalPages: 1, page: 1 }));
    materialTypeServiceSpy.getMaterialTypes.and.returnValue(of([]));

    TestBed.configureTestingModule({
      declarations: [AccesoriosComponent],
      imports: [FormsModule],
      providers: [
        CookieService,
        { provide: MaterialService, useValue: materialServiceSpy },
        { provide: MaterialTypeService, useValue: materialTypeServiceSpy },
        { provide: AccessoryService, useValue: accessoryServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(AccesoriosComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate totals correctly with new logic', () => {
    component.profitPercentage = 50; // 50% profit
    
    const material1: Material = { id: 1, name: 'MDF', purchase_price: '100', sale_price: '150', type_name: 'area' } as any;
    const material2: Material = { id: 2, name: 'Tornillo', purchase_price: '5', sale_price: '8', type_name: 'piece' } as any;
    component.selected = [
      { material: material1, width: 2, length: 1, quantity: 0, cost: 100, investment: 200 },
      { material: material2, width: 0, length: 0, quantity: 10, cost: 5, investment: 50 }
    ] as any;

    const childAccessory: Accessory = { id: 3, name: 'Child Acc', cost: 20, price: 30, total_price: 30 } as any;
    component.selectedChildren = [
      { accessory: childAccessory, quantity: 2 }
    ] as any;

    component.calculateTotals();

    // 1. Cost of materials
    expect(component.totalCost).toBe(250); // (100 * 2 * 1) + (5 * 10)

    // 2. Cost of child accessories
    expect(component.totalAccessoryCost).toBe(40); // 20 * 2

    // 3. Combined Cost
    expect(component.combinedCost).toBe(290); // 250 + 40

    // 4. Final Price (totalWithProfit)
    // Materials cost (250) + 50% profit (125) = 375
    // Price of child accessories (30 * 2) = 60
    // Total = 375 + 60 = 435
    expect(component.totalWithProfit).toBe(435);
  });

  describe('submitAccessory', () => {
    let form: any;

    beforeEach(() => {
      form = { invalid: false, value: {} } as any;
      component.accessoryName = 'Test';
      component.accessoryDescription = 'Test Desc';
    });

    it('should not submit if form is invalid', () => {
      form.invalid = true;
      component.submitAccessory(form);
      expect(accessoryServiceSpy.createAccessoryDetailed).not.toHaveBeenCalled();
      expect(component.saveError).toBe('El formulario no es válido. Revisa los campos marcados.');
    });

    it('should call createAccessoryDetailed and handle success on create mode', async () => {
      const newAccessory: Accessory = { id: 10, name: 'New', owner_id: 1, description: '' };
      accessoryServiceSpy.createAccessoryDetailed.and.returnValue(of(newAccessory));
      spyOn(component, 'resetForm').and.callThrough();
      spyOn(component, 'loadAccessories').and.callThrough();

      component.isEditing = false;
      component.submitAccessory(form);
      
      fixture.detectChanges();
      await fixture.whenStable();

      expect(accessoryServiceSpy.createAccessoryDetailed).toHaveBeenCalled();
    });
    
    it('should handle error when creating an accessory', async () => {
      const errorResponse = { message: 'Creation failed' };
      accessoryServiceSpy.createAccessoryDetailed.and.returnValue(throwError(() => errorResponse));
      
      component.isEditing = false;
      component.submitAccessory(form);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.isSaving).toBe(false);
      expect(component.saveError).toContain('Creation failed');
    });

    it('should call updateAccessoryDetailed and handle success on edit mode', async () => {
      const updatedAccessory: Accessory = { id: 1, name: 'Updated', owner_id: 1, description: '' };
      accessoryServiceSpy.updateAccessoryDetailed.and.returnValue(of(updatedAccessory));
      spyOn(component, 'resetForm').and.callThrough();
      spyOn(component, 'loadAccessories').and.callThrough();

      component.isEditing = true;
      component.editingId = 1;
      component.submitAccessory(form);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(accessoryServiceSpy.updateAccessoryDetailed).toHaveBeenCalled();
    });

    it('should handle error when updating an accessory', async () => {
      const errorResponse = { message: 'Update failed' };
      accessoryServiceSpy.updateAccessoryDetailed.and.returnValue(throwError(() => errorResponse));
      
      component.isEditing = true;
      component.editingId = 1;
      component.submitAccessory(form);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.isSaving).toBe(false);
      expect(component.saveError).toContain('Update failed');
    });
  });
}); 