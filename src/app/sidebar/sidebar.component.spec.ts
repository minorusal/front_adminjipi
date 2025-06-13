import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { MenuService } from '../services/menu.service';

import { SidebarComponent } from './sidebar.component';
import { CookieService } from '../services/cookie.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;

  beforeEach(() => {
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuTree']);
    TestBed.configureTestingModule({
      declarations: [SidebarComponent],
      imports: [RouterTestingModule],
      providers: [CookieService, { provide: MenuService, useValue: menuServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });
  it('should load menu tree from service', () => {
    const menu = [
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
    ];
    menuServiceSpy.getMenuTree.and.returnValue(of(menu));

    fixture.detectChanges();

    expect(component.menuTree).toEqual(menu);
  });

  it('should toggle node open state', () => {
    expect(component.isOpen(42)).toBeFalse();

    component.toggleNode(42);
    expect(component.isOpen(42)).toBeTrue();

    component.toggleNode(42);
    expect(component.isOpen(42)).toBeFalse();
  });
});
