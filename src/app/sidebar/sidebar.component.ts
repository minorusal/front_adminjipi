import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from '../services/cookie.service';

export interface MenuNode {
  id: number;
  name: string;
  path?: string | null;
  children?: MenuNode[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() open = false;
  @Output() closeMenu = new EventEmitter<void>();

  menuTree: MenuNode[] = [];
  expanded: Record<number, boolean> = {};
  private ownerId = 1;

  constructor(private http: HttpClient, private cookieService: CookieService) {}

  ngOnInit(): void {
    this.loadMenuTree();
  }


  loadMenuTree(): void {
    const token = this.cookieService.get('token');
    const options = token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
    this.http
      .get<MenuNode[]>(`${environment.apiUrl}/menus?owner_id=${this.ownerId}`, options)
      .subscribe({
        next: (tree) => (this.menuTree = tree),
        error: () => {
          // fallback menu when backend unavailable
          this.menuTree = [
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
        }
      });
  }

  toggleNode(id: number): void {
    this.expanded[id] = !this.expanded[id];
  }

  isOpen(id: number): boolean {
    return !!this.expanded[id];
  }

  onSelect(): void {
    this.closeMenu.emit();
  }
}
