import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MenuService, MenuNode, MenuItem } from './menu.service';
import { environment } from '../../environments/environment';

describe('MenuService', () => {
  let service: MenuService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/menus`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MenuService]
    });
    service = TestBed.inject(MenuService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get the full menu tree', () => {
    const mockTree: MenuNode[] = [{ id: 1, name: 'Root', children: [] }];
    service.getMenuTree().subscribe(tree => {
      expect(tree).toEqual(mockTree);
    });
    const req = httpMock.expectOne(`${apiUrl}/tree`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTree);
  });

  it('should get a flat list of all menu items', () => {
    const mockItems: MenuItem[] = [{ id: 1, name: 'Item 1', path: '/path1' }];
    service.getAllMenus().subscribe(items => {
      expect(items).toEqual(mockItems);
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockItems);
  });

  it('should create a new menu item', () => {
    const newItem: Partial<MenuItem> = { name: 'New Item', path: '/new' };
    const mockResponse: MenuItem = { id: 2, ...newItem } as MenuItem;
    service.createMenuItem(newItem).subscribe(item => {
      expect(item).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should update a menu item', () => {
    const updatedItem: Partial<MenuItem> = { name: 'Updated' };
    const mockResponse: MenuItem = { id: 1, name: 'Updated', path: '/path1' };
    service.updateMenuItem(1, updatedItem).subscribe(item => {
      expect(item).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete a menu item', () => {
    service.deleteMenuItem(1).subscribe(res => {
      expect(res).toBeNull();
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
}); 