import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListadoMaterialesComponent } from './listado-materiales.component';
import { MaterialService, Material, MaterialInList, PaginatedMaterials } from '../../services/material.service';
import { MaterialTypeService, MaterialType } from '../../services/material-type.service';
import { MaterialStateService } from '../../services/material-state.service';
import { CookieService } from '../../services/cookie.service';
import { of, Subject } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

describe('ListadoMaterialesComponent', () => {
  let component: ListadoMaterialesComponent;
  let fixture: ComponentFixture<ListadoMaterialesComponent>;
  let mockMaterialService: jasmine.SpyObj<MaterialService>;
  let mockMaterialTypeService: jasmine.SpyObj<MaterialTypeService>;
  let mockMaterialStateService: {
    paginatedMaterials$: Subject<PaginatedMaterials>;
    error$: Subject<string | null>;
    loadMaterials: jasmine.Spy;
  };
  let mockCookieService: jasmine.SpyObj<CookieService>;

  const mockMaterialTypes: MaterialType[] = [
    { id: 1, name: 'Piece', description: 'desc', unit: 'unit' },
    { id: 2, name: 'Area', description: 'desc', unit: 'm2' }
  ];

  beforeEach(async () => {
    // Mock for MaterialService
    mockMaterialService = jasmine.createSpyObj('MaterialService', ['getMaterials', 'getMaterialById', 'createMaterial', 'updateMaterial', 'deleteMaterial']);
    
    // Mock for MaterialTypeService
    mockMaterialTypeService = jasmine.createSpyObj('MaterialTypeService', ['getMaterialTypes']);
    mockMaterialTypeService.getMaterialTypes.and.returnValue(of(mockMaterialTypes));

    // Mock for MaterialStateService
    mockMaterialStateService = {
      paginatedMaterials$: new Subject<PaginatedMaterials>(),
      error$: new Subject<string | null>(),
      loadMaterials: jasmine.createSpy('loadMaterials')
    };

    // Mock for CookieService
    mockCookieService = jasmine.createSpyObj('CookieService', ['get']);

    await TestBed.configureTestingModule({
      imports: [
        ListadoMaterialesComponent, // Standalone component
        ReactiveFormsModule,
        NoopAnimationsModule,
        CommonModule
      ],
      providers: [
        { provide: MaterialService, useValue: mockMaterialService },
        { provide: MaterialTypeService, useValue: mockMaterialTypeService },
        { provide: MaterialStateService, useValue: mockMaterialStateService },
        { provide: CookieService, useValue: mockCookieService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListadoMaterialesComponent);
    component = fixture.componentInstance;

    // Initial emission for the state service observables
    mockMaterialStateService.paginatedMaterials$.next({ docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: 10 });
    mockMaterialStateService.error$.next(null);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load materials and material types on init', () => {
    expect(mockMaterialStateService.loadMaterials).toHaveBeenCalledWith(1, 10, '');
    expect(mockMaterialTypeService.getMaterialTypes).toHaveBeenCalled();
  });

  describe('Dynamic Form Logic', () => {
    beforeEach(() => {
      // Ensure material types are loaded and available for the tests
      component.materialTypes = mockMaterialTypes;
    });

    it('should add controls for "Area" type (ID 2)', () => {
      component.materialForm.get('material_type_id')?.setValue(2);
      fixture.detectChanges();
      
      const attributes = component.materialForm.get('attributes') as any;
      expect(attributes.controls.gauge).toBeDefined();
      expect(attributes.controls.width).toBeDefined();
      expect(attributes.controls.length).toBeDefined();
      expect(attributes.controls.volume).toBeUndefined();
    });

    it('should add controls for "Piece" type (ID 1)', () => {
      component.materialForm.get('material_type_id')?.setValue(1);
      fixture.detectChanges();
      
      const attributes = component.materialForm.get('attributes') as any;
      expect(attributes.controls.length).toBeDefined();
      expect(attributes.controls.gauge).toBeDefined();
      expect(attributes.controls.width).toBeUndefined();
      expect(attributes.controls.volume).toBeUndefined();
    });
    
    it('should add controls for "Volume" type (ID 3)', () => {
      component.materialForm.get('material_type_id')?.setValue(3);
      fixture.detectChanges();

      const attributes = component.materialForm.get('attributes') as any;
      expect(attributes.controls.volume).toBeDefined();
      expect(attributes.controls.length).toBeUndefined();
      expect(attributes.controls.gauge).toBeUndefined();
    });

    it('should reset attributes when changing type', () => {
      // First, set to 'Area' (ID 2)
      component.materialForm.get('material_type_id')?.setValue(2);
      fixture.detectChanges();
      
      let attributes = component.materialForm.get('attributes') as any;
      expect(attributes.controls.width).toBeDefined();

      // Then, change to 'Piece' (ID 1)
      component.materialForm.get('material_type_id')?.setValue(1);
      fixture.detectChanges();

      attributes = component.materialForm.get('attributes') as any;
      expect(attributes.controls.width).toBeUndefined(); // 'width' should be gone
      expect(attributes.controls.gauge).toBeDefined(); // 'gauge' should be present
    });
  });

  describe('Modal and Form Population', () => {
    it('openAddModal should reset the form and set profit from cookie', () => {
      mockCookieService.get.withArgs('profit_percentage').and.returnValue('55');
      component.openAddModal();

      expect(component.materialForm.get('name')?.value).toBeNull();
      expect(component.materialForm.get('profit_percentage')?.value).toBe(55);
      expect(component.showAddModal).toBeTrue();
    });

    it('openEditModal should fetch the full material and display the modal', () => {
      const listSummary: MaterialInList = { id: 1, name: 'Test', description: 'Desc', sale_price: 140, type_name: 'area' };
      const fullMaterial: Material = { id: 1, name: 'Test', description: 'Desc', material_type_id: 2, owner_id: 1, purchase_price: '100', sale_price: '140', profit_percentage_at_creation: '40', type_name: 'area', attributes: { thickness: { value: 10, unit: 'mm' } } };
      
      mockMaterialService.getMaterialById.and.returnValue(of(fullMaterial));
      
      component.openEditModal(listSummary);

      expect(mockMaterialService.getMaterialById).toHaveBeenCalledWith(1);
      expect(component.editingMaterialId).toBe(1);
      expect(component.showEditModal).toBeTrue();
    });

    it('openEditModal should populate the form with fetched data and cookie profit', () => {
        const listSummary: MaterialInList = { id: 1, name: 'Test', description: 'Desc', sale_price: 140, type_name: 'area' };
        const fullMaterial: Material = { id: 1, name: 'Test', description: 'Desc', material_type_id: 2, owner_id: 1, purchase_price: '100', sale_price: '140', profit_percentage_at_creation: '40', type_name: 'area', attributes: { thickness: { value: 10, unit: 'mm' } } };
        
        mockMaterialService.getMaterialById.and.returnValue(of(fullMaterial));
        mockCookieService.get.withArgs('profit_percentage').and.returnValue('60');

        component.openEditModal(listSummary);
        fixture.detectChanges(); // Allow patched values to propagate

        expect(component.materialForm.get('name')?.value).toBe('Test');
        expect(component.materialForm.get('purchase_price')?.value).toBe('100');
        expect(component.materialForm.get('profit_percentage')?.value).toBe(60); // Check that cookie value is used
        expect(component.materialForm.get('attributes.thickness.value')?.value).toBe(10);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Set a default type so the form is somewhat valid for most tests
      component.materialForm.get('material_type_id')?.setValue(1);
    });

    it('saveMaterial should not call service if form is invalid', () => {
      component.materialForm.get('name')?.setValue(''); // Make form invalid
      component.saveMaterial();
      expect(mockMaterialService.createMaterial).not.toHaveBeenCalled();
    });

    it('saveMaterial should call service with correct payload if form is valid', () => {
      mockMaterialService.createMaterial.and.returnValue(of({} as Material));
      component.materialForm.patchValue({
        name: 'New Test Mat',
        description: 'A description',
        material_type_id: 1, // Piece
        unit: 'unit',
        purchase_price: 120,
        profit_percentage: 50,
        attributes: {
          length: { value: 10, unit: 'cm' },
          gauge: { value: 1, unit: 'in' }
        }
      });

      component.saveMaterial();

      expect(mockMaterialService.createMaterial).toHaveBeenCalled();
      const payload = mockMaterialService.createMaterial.calls.mostRecent().args[0];
      expect(payload.name).toBe('New Test Mat');
      expect(payload.profit_percentage).toBe(50);
    });
    
    it('updateMaterial should not call service if form is invalid', () => {
        component.editingMaterialId = 1;
        component.materialForm.get('name')?.setValue(''); // Make form invalid
        component.updateMaterial();
        expect(mockMaterialService.updateMaterial).not.toHaveBeenCalled();
    });

    it('updateMaterial should call service with correct payload if form is valid', () => {
      mockMaterialService.updateMaterial.and.returnValue(of({} as Material));
      component.editingMaterialId = 5;
      component.materialForm.patchValue({
        name: 'Updated Mat',
        description: 'An updated description',
        material_type_id: 1, // Piece
        unit: 'unit',
        purchase_price: 200,
        profit_percentage: 25,
        attributes: {
          length: { value: 20, unit: 'cm' },
          gauge: { value: 2, unit: 'in' }
        }
      });

      component.updateMaterial();
      
      expect(mockMaterialService.updateMaterial).toHaveBeenCalledWith(5, jasmine.any(Object));
      const payload = mockMaterialService.updateMaterial.calls.mostRecent().args[1];
      expect(payload.name).toBe('Updated Mat');
      expect(payload.purchase_price).toBe(200);
    });
  });

}); 