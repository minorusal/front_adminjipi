import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { MenuService, MenuNode } from '../services/menu.service';
import { SidebarComponent } from './sidebar.component';
import { CookieService } from '../services/cookie.service';

const MOCK_MENU: MenuNode[] = [
  { id: 1, name: 'Inicio', path: '/home' },
  {
    id: 2,
    name: 'Módulos',
    children: [
      { id: 3, name: 'Ventas', path: '/ventas' },
      { id: 4, name: 'Inventario', path: '/inventario', children: [
          { id: 5, name: 'Productos', path: '/inventario/productos' },
        ]
      }
    ]
  }
];

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let localStorageSpy: jasmine.Spy;

  beforeEach(() => {
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuTree']);
    menuServiceSpy.getMenuTree.and.returnValue(of(MOCK_MENU));

    localStorageSpy = spyOn(localStorage, 'setItem').and.callThrough();

    TestBed.configureTestingModule({
      declarations: [SidebarComponent],
      imports: [RouterTestingModule],
      providers: [CookieService, { provide: MenuService, useValue: menuServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should load menu tree from service on init', () => {
    fixture.detectChanges();
    expect(component.menuTree).toEqual(MOCK_MENU);
  });

  it('should load expanded state from localStorage on init', () => {
    localStorage.setItem('menuExpanded', JSON.stringify({ 2: true }));
    fixture.detectChanges(); // ngOnInit
    expect(component.isOpen(2)).toBeTrue();
  });

  it('should handle invalid JSON from localStorage gracefully', () => {
    localStorage.setItem('menuExpanded', 'invalid-json');
    fixture.detectChanges();
    expect(component.expanded).toEqual({});
  });

  it('should toggle node open state and save to localStorage', () => {
    expect(component.isOpen(42)).toBeFalse();

    component.toggleNode(42);
    expect(component.isOpen(42)).toBeTrue();
    expect(localStorageSpy).toHaveBeenCalledWith('menuExpanded', JSON.stringify({ 42: true }));

    component.toggleNode(42);
    expect(component.isOpen(42)).toBeFalse();
    expect(localStorageSpy).toHaveBeenCalledWith('menuExpanded', JSON.stringify({ 42: false }));
  });

  describe('onItemClick', () => {
    it('should toggle node if it has children', () => {
      const nodeWithChildren = MOCK_MENU[1]; // 'Módulos'
      const event = new MouseEvent('click');
      spyOn(component, 'toggleNode');
      
      component.onItemClick(nodeWithChildren, event);
      
      expect(component.toggleNode).toHaveBeenCalledWith(nodeWithChildren.id);
    });

    it('should prevent default action if node has children and a path', () => {
        const nodeWithPathAndChildren = MOCK_MENU[1].children![1]; // 'Inventario'
        const event = new MouseEvent('click');
        spyOn(event, 'preventDefault');

        component.onItemClick(nodeWithPathAndChildren, event);

        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not toggle node if it has no children', () => {
        const nodeWithoutChildren = MOCK_MENU[0]; // 'Inicio'
        const event = new MouseEvent('click');
        spyOn(component, 'toggleNode');

        component.onItemClick(nodeWithoutChildren, event);

        expect(component.toggleNode).not.toHaveBeenCalled();
    });
  });

  describe('onKeydown', () => {
    const nodeWithChildren = MOCK_MENU[1];
    const nodeWithoutChildren = MOCK_MENU[0];

    it('should toggle node on Enter key if it has children', () => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        spyOn(component, 'toggleNode');
        component.onKeydown(event, nodeWithChildren);
        expect(component.toggleNode).toHaveBeenCalledWith(nodeWithChildren.id);
    });

    it('should expand a collapsed node on ArrowRight', () => {
        component.expanded[nodeWithChildren.id] = false;
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        spyOn(component, 'toggleNode');
        component.onKeydown(event, nodeWithChildren);
        expect(component.toggleNode).toHaveBeenCalledWith(nodeWithChildren.id);
    });

    it('should collapse an expanded node on ArrowLeft', () => {
        component.expanded[nodeWithChildren.id] = true;
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        spyOn(component, 'toggleNode');
        component.onKeydown(event, nodeWithChildren);
        expect(component.toggleNode).toHaveBeenCalledWith(nodeWithChildren.id);
    });

    it('should not do anything for other keys', () => {
        const event = new KeyboardEvent('keydown', { key: 'a' });
        spyOn(component, 'toggleNode');
        component.onKeydown(event, nodeWithChildren);
        expect(component.toggleNode).not.toHaveBeenCalled();
    });
  });
});
