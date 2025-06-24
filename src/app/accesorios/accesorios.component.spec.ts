import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AccesoriosComponent } from './accesorios.component';
import { MaterialService } from '../services/material.service';
import { CookieService } from '../services/cookie.service';

describe('AccesoriosComponent', () => {
  let component: AccesoriosComponent;
  let fixture: ComponentFixture<AccesoriosComponent>;
  let materialServiceSpy: jasmine.SpyObj<MaterialService>;

  beforeEach(() => {
    materialServiceSpy = jasmine.createSpyObj('MaterialService', ['getMaterials']);
    TestBed.configureTestingModule({
      declarations: [AccesoriosComponent],
      imports: [FormsModule],
      providers: [CookieService, { provide: MaterialService, useValue: materialServiceSpy }],
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
});
