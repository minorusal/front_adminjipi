import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CookieService } from '../services/cookie.service';

import { SidebarComponent } from './sidebar.component';
import { CookieService } from '../services/cookie.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SidebarComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [CookieService],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load fallback menu tree on http error', () => {
    const cookieService = TestBed.inject(CookieService);
    spyOn(cookieService, 'get').and.callFake((name: string) => {
      if (name === 'loginData') {
        return JSON.stringify({ ownerCompany: { id: 1 } });
      }
      return null;
    });

    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:3000/menus?owner_id=1');
    req.error(new ErrorEvent('Network error'));

    expect(component.menuTree).toEqual([
      { id: 1, name: 'Inicio', path: 'home' },
      {
        id: 2,
        name: 'Módulos',
        children: [
          { id: 3, name: 'Ventas', path: 'ventas' },
          {
            id: 4,
            name: 'Inventario',
            children: [
              { id: 5, name: 'Productos', path: 'inventario/productos' },
              { id: 6, name: 'Bodegas', path: 'inventario/bodegas' }
            ]
          }
        ]
      }
    ]);
  });

  it('should toggle node open state', () => {
    expect(component.isOpen(42)).toBeFalse();

    component.toggleNode(42);
    expect(component.isOpen(42)).toBeTrue();

    component.toggleNode(42);
    expect(component.isOpen(42)).toBeFalse();
  });
});
