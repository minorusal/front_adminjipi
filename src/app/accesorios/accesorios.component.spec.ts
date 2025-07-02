import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AccesoriosComponent } from './accesorios.component';
import { MaterialService } from '../services/material.service';
import { MaterialTypeService } from '../services/material-type.service';
import { CookieService } from '../services/cookie.service';
import { AccessoryService } from '../services/accessory.service';

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
      'getAccessory'
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

  it('should parse different number formats', () => {
    const toNumber = (component as any).toNumber.bind(component);

    expect(toNumber('10,6')).toBeCloseTo(10.6, 5);
    expect(toNumber('10.6')).toBeCloseTo(10.6, 5);
    expect(toNumber('1.234,56')).toBeCloseTo(1234.56, 5);
    expect(toNumber('1,234.56')).toBeCloseTo(1234.56, 5);
  });

  it('should handle currency symbols and whitespace', () => {
    const toNumber = (component as any).toNumber.bind(component);

    expect(toNumber(' $1,234.56 ')).toBeCloseTo(1234.56, 5);
    expect(toNumber('\u20AC\u00A01.234,56')).toBeCloseTo(1234.56, 5);
  });
});
