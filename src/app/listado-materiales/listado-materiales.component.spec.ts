import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListadoMaterialesComponent } from './listado-materiales.component';
import { MaterialService } from '../services/material.service';
import { CookieService } from '../services/cookie.service';
import { environment } from '../../environments/environment';

describe('ListadoMaterialesComponent', () => {
  let component: ListadoMaterialesComponent;
  let fixture: ComponentFixture<ListadoMaterialesComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListadoMaterialesComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [MaterialService, CookieService],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(ListadoMaterialesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load materials with valid response', () => {
    (component as any).loadMaterials();

    const req = httpMock.expectOne(`${environment.apiUrl}/materials?page=1&limit=10`);
    expect(req.request.method).toBe('GET');

    const materials = [{ id: 1, name: 'Mat1', description: 'Desc1' }];
    req.flush({ docs: materials, totalPages: 5 });

    expect(component.materiales).toEqual(materials);
  });

  it('should handle mismatched fields', () => {
    (component as any).loadMaterials();
    const req = httpMock.expectOne(`${environment.apiUrl}/materials?page=1&limit=10`);
    expect(req.request.method).toBe('GET');

    req.flush({ items: [] });

    expect(component.materiales).toEqual([]);
  });

  it('should keep defaults on http error', () => {
    (component as any).loadMaterials();
    const req = httpMock.expectOne(`${environment.apiUrl}/materials?page=1&limit=10`);
    expect(req.request.method).toBe('GET');

    try {
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    } catch {}

    expect(component.materiales).toEqual([]);
  });

  it('should send PUT request when updating material', () => {
    component.editMaterialData = {
      name: 'Mat1',
      description: 'Desc',
      material_type_id: 1,
      thickness_mm: 1,
      width_m: 2,
      length_m: 3,
      price: 10
    };
    (component as any).editingMaterialId = 5;
    const fakeForm: any = { invalid: false, form: { markAllAsTouched: () => {} } };
    component.updateMaterial(fakeForm as any);

    const req = httpMock.expectOne(`${environment.apiUrl}/materials/5`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should not send request if update form is invalid', () => {
    const fakeForm: any = { invalid: true, form: { markAllAsTouched: () => {} } };
    component.updateMaterial(fakeForm as any);
    const reqs = httpMock.match(() => true);
    expect(reqs.length).toBe(0);
  });
});
