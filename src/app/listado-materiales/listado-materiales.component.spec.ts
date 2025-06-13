import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
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
      imports: [HttpClientTestingModule],
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

    const req = httpMock.expectOne(`${environment.apiUrl}/materials`);
    expect(req.request.method).toBe('GET');

    const materials = [{ id: 1, name: 'Mat1', description: 'Desc1' }];
    req.flush({ docs: materials, totalPages: 5 });

    expect(component.materiales).toEqual(materials);
  });

  it('should handle mismatched fields', () => {
    (component as any).loadMaterials();
    const req = httpMock.expectOne(`${environment.apiUrl}/materials`);
    expect(req.request.method).toBe('GET');

    req.flush({ items: [] });

    expect(component.materiales).toEqual([]);
  });

  it('should keep defaults on http error', () => {
    (component as any).loadMaterials();
    const req = httpMock.expectOne(`${environment.apiUrl}/materials`);
    expect(req.request.method).toBe('GET');

    try {
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    } catch {}

    expect(component.materiales).toEqual([]);
  });
});
