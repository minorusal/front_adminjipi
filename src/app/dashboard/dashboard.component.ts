import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface MenuNode {
  id: number;
  name: string;
  path?: string | null;
  children?: MenuNode[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {
  @Input() user: { name: string; company: string } | null = null;
  @Output() logout = new EventEmitter<void>();
  menuOpen = false;
  menuTree: MenuNode[] = [];
  expanded: Record<number, boolean> = {};
  private ownerId = 1;

  constructor(private http: HttpClient) {}

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  ngOnInit(): void {
    this.loadMenuTree();
  }

  loadMenuTree(): void {
    const token = this.getCookie('token');
    const options = token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
    this.http
      .get<any[]>(
        `http://localhost:3000/menus?owner_id=${this.ownerId}`,
        options
      )
      .subscribe({
        next: (tree) => (this.menuTree = tree as MenuNode[]),
        error: () => {
          // Fallback sample menu when backend is unavailable
          this.menuTree = [
            { id: 1, name: 'Inicio', path: 'home' },
            {
              id: 2,
              name: 'Módulos',
              children: [
                {
                  id: 3,
                  name: 'Ventas',
                  path: 'ventas'
                },
                {
                  id: 4,
                  name: 'Inventario',
                  children: [
                    {
                      id: 5,
                      name: 'Productos',
                      path: 'inventario/productos'
                    },
                    {
                      id: 6,
                      name: 'Bodegas',
                      path: 'inventario/bodegas'
                    }
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


  onLogout(): void {
    this.logout.emit();
  }
}
