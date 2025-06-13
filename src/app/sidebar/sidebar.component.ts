import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from '../services/cookie.service';
import { environment } from '../../environments/environment';

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
  private ownerId!: number;

  constructor(private http: HttpClient, private cookieService: CookieService) {}

  ngOnInit(): void {
    const loginData = this.cookieService.get('loginData');
    if (loginData) {
      try {
        const data = JSON.parse(loginData);
        this.ownerId = data.ownerCompany.id;
      } catch (_) {
        // ignore parse errors
      }
    }

    const stored = localStorage.getItem('menuExpanded');
    if (stored) {
      try {
        this.expanded = JSON.parse(stored);
      } catch (_) {
        this.expanded = {};
      }
    }
    this.loadMenuTree();
  }


  loadMenuTree(): void {
    const token = this.cookieService.get('token');
    const options = token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
    this.http
      .get<any[]>(`${environment.apiUrl}/menus?owner_id=${this.ownerId}`, options)
      .subscribe({
        next: (tree) => {
          const isFlat = tree.length && !tree.some((m) => Array.isArray(m.children));
          this.menuTree = isFlat ? this.buildTree(tree) : (tree as MenuNode[]);
        },
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

  private buildTree(items: any[], parentId: number | null = null): MenuNode[] {
    return items
      .filter((m) => m.parent_id === parentId)
      .map((m) => ({
        id: m.id,
        name: m.name,
        path: m.path,
        children: this.buildTree(items, m.id)
      }));
  }

  toggleNode(id: number): void {
    this.expanded[id] = !this.expanded[id];
    localStorage.setItem('menuExpanded', JSON.stringify(this.expanded));
  }

  isOpen(id: number): boolean {
    return !!this.expanded[id];
  }

  onSelect(): void {
    this.closeMenu.emit();
  }

  onKeydown(event: KeyboardEvent, node: MenuNode): void {
    const hasChildren = !!node.children && node.children.length > 0;
    if (event.key === 'Enter' || event.key === ' ') {
      if (!node.path) {
        event.preventDefault();
        if (hasChildren) {
          this.toggleNode(node.id);
        }
      }
    } else if (event.key === 'ArrowRight' && hasChildren && !this.isOpen(node.id)) {
      event.preventDefault();
      this.toggleNode(node.id);
    } else if (event.key === 'ArrowLeft' && hasChildren && this.isOpen(node.id)) {
      event.preventDefault();
      this.toggleNode(node.id);
    }
  }
}
