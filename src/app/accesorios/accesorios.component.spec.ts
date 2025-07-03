import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AccesoriosComponent } from './accesorios.component';
import { MaterialService } from '../services/material.service';
import { MaterialTypeService } from '../services/material-type.service';
import { CookieService } from '../services/cookie.service';
import { AccessoryService } from '../services/accessory.service';
import { of } from 'rxjs';

describe('AccesoriosComponent', () => {
  let component: AccesoriosComponent;
  let fixture: ComponentFixture<AccesoriosComponent>;
  let materialServiceSpy: jasmine.SpyObj<MaterialService>;
  let materialTypeServiceSpy: jasmine.SpyObj<MaterialTypeService>;
  let accessoryServiceSpy: jasmine.SpyObj<AccessoryService>;

  beforeEach(() => {
    materialServiceSpy = jasmine.createSpyObj('MaterialService', ['getMaterials']);
    materialTypeServiceSpy = jasmine.createSpyObj('MaterialTypeService', ['getMaterialTypes']);
    accessoryServiceSpy = jasmine.createSpyObj('AccessoryService', [
      'addAccessory',
      'addAccessoryMaterials',
      'updateAccessoryMaterials',
      'updateAccessory',
      'updateAccessoryDetailed',
      'getAccessory',
      'getAccessoryMaterials',
      'getAccessoryComponents',
      'getAccessoryCost'
    ]);
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

  it('should add material and clear search', () => {
    const mat = { id: 1, name: 'Mat', description: 'Desc' } as any;
    component.results = [mat];
    component.searchText = 'ma';

    component.addMaterial(mat);

    expect(component.selected).toContain(mat);
    expect(component.searchText).toBe('');
    expect(component.results).toEqual([]);
  });

  it('should calculate area cost relative to base size', () => {
    const mat = {
      id: 1,
      name: 'Madera',
      description: 'Sheet',
      material_type_id: 2,
      price: 1001,
      width_m: 1.22,
      length_m: 2.44
    } as any;

    component.materialTypes = [
      { id: 2, name: 'Area', unit: 'm2', description: '' } as any
    ];

    const sel: any = { material: mat, width: 1.22, length: 2.44 };

    const cost = component.calculateCost(sel);

    expect(cost).toBeCloseTo(1001, 2);
  });

  it('should fallback to simple area cost when base is missing', () => {
    const mat = {
      id: 2,
      name: 'Madera',
      description: 'Sheet',
      material_type_id: 2,
      price: 100,
      width_m: undefined,
      length_m: undefined
    } as any;

    component.materialTypes = [
      { id: 2, name: 'Area', unit: 'm2', description: '' } as any
    ];

    const sel: any = { material: mat, width: 2, length: 3 };

    const cost = component.calculateCost(sel);

    expect(cost).toBeCloseTo(600, 2);
  });

  it('should compute area cost using base dimensions when unit is m²', () => {
    const mat = {
      id: 3,
      name: 'MDF',
      description: 'Board',
      material_type_id: 2,
      price: 1000,
      width_m: 1.22,
      length_m: 2.44
    } as any;

    component.materialTypes = [
      { id: 2, name: 'Area', unit: 'm2', description: '' } as any
    ];

    const sel: any = { material: mat, width: 0.6, length: 0.3, unit: 'm²' };

    const cost = component.calculateCost(sel);

    expect(cost).toBeCloseTo(60.47, 2);
  });

  it('should filter accessories by search text', () => {
    component.accessories = [
      { id: 1, name: 'Alpha', description: 'Primero' } as any,
      { id: 2, name: 'Beta', description: 'Segundo' } as any
    ];
    component.listSearchText = 'seg';

    const filtered = component.filteredAccessories;

    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(2);
  });

  it('should sum accessory cost and price', () => {
    component.selectedChildren = [
      {
        accessory: { id: 1, name: 'A', description: '', cost: 10, price: 15 } as any,
        quantity: 2
      },
      {
        accessory: { id: 2, name: 'B', description: '', cost: 5, price: 8 } as any,
        quantity: 1
      }
    ] as any;

    expect(component.totalAccessoryCost).toBe(25);
    expect(component.totalAccessoryPrice).toBe(38);
  });

  it('should compute material price and total with profit', () => {
    component.profitPercentage = 40;
    component.selected = [
      {
        material: { id: 1, name: 'Mat', material_type_id: 1, price: 10 } as any,
        quantity: 2
      }
    ] as any;
    component.selectedChildren = [
      {
        accessory: { id: 3, name: 'Child', cost: 5, price: 7 } as any,
        quantity: 3
      }
    ] as any;

    expect(component.totalMaterialPrice).toBeCloseTo(28, 2);
    expect(component.totalWithProfit).toBeCloseTo(49, 2);
    expect(component.combinedCost).toBeCloseTo(35, 2);
    expect(component.combinedPrice).toBeCloseTo(49, 2);
  });

  it('should not fetch totals when accessory already has cost and price', () => {
    const acc: any = { id: 3, name: 'C', cost: 7, price: 9 };
    spyOn<any>(component, 'populateAccessoryTotals');

    component.addChildAccessory(acc);

    expect((component as any).populateAccessoryTotals).not.toHaveBeenCalled();
    expect(component.selectedChildren.length).toBe(1);
    expect(component.selectedChildren[0].accessory.cost).toBe(7);
    expect(component.selectedChildren[0].accessory.price).toBe(9);
  });

  it('should load component cost and price from API response', () => {
    (accessoryServiceSpy.getAccessory as jasmine.Spy).and.returnValue(of({
      id: 10,
      name: 'Parent',
      description: 'P'
    } as any));
    (accessoryServiceSpy.getAccessoryMaterials as jasmine.Spy).and.returnValue(
      of([])
    );
    (accessoryServiceSpy.getAccessoryComponents as jasmine.Spy).and.returnValue(
      of([
        {
          id: 1,
          parent_accessory_id: 10,
          child_accessory_id: 2,
          quantity: 5,
          cost: 7.57,
          price: 10.6,
          child: { id: 2, name: 'Child', description: '' }
        }
      ])
    );
    (accessoryServiceSpy.getAccessoryCost as jasmine.Spy).and.returnValue(
      of({
        accessory_id: 10,
        accessory_name: 'Parent',
        cost: 0,
        price: 0,
        profit_margin: 0,
        profit_percentage: 0
      })
    );

    spyOn<any>(component, 'populateAccessoryTotals');

    (component as any).loadAccessory(10);

    expect(component.selectedChildren.length).toBe(1);
    const child = component.selectedChildren[0];
    expect(child.accessory.cost).toBe(7.57);
    expect(child.accessory.price).toBe(10.6);
    expect((component as any).populateAccessoryTotals).not.toHaveBeenCalled();
  });

  it('should convert different numeric formats to numbers', () => {
    const toNumber = (component as any).toNumber.bind(component);

    expect(toNumber('1,234.56')).toBeCloseTo(1234.56, 2);
    expect(toNumber('1.234,56')).toBeCloseTo(1234.56, 2);
    expect(toNumber('$ 1 234,56')).toBeCloseTo(1234.56, 2);
    expect(toNumber('')).toBe(0);
    expect(toNumber('abc')).toBe(0);
  });
});
