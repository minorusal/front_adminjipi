import { Component, Input, OnInit } from '@angular/core';
import { MenuService, MenuNode } from '../services/menu.service';
import { CookieService } from '../services/cookie.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() open = false;

  menuTree: MenuNode[] = [];
  expanded: Record<number, boolean> = {};
  private ownerId!: number;

  constructor(
    private menuService: MenuService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    const loginData = this.cookieService.get('loginData');
    if (loginData) {
      try {
        const data = JSON.parse(loginData);
        this.ownerId = parseInt(data.ownerCompany.id, 10);
      } catch (_) {
        // ignore parse errors
      }
    }

    const hasValidOwner =
      typeof this.ownerId === 'number' && !isNaN(this.ownerId);
    
    const stored = localStorage.getItem('menuExpanded');
    if (stored) {
      try {
        this.expanded = JSON.parse(stored);
      } catch (_) {
        this.expanded = {};
      }
    }

    if (hasValidOwner) {
      this.loadMenuTree();
    } else {
      console.warn('SidebarComponent: ownerId could not be determined');
    }
  }


  loadMenuTree(): void {
    this.menuService
      .getMenuTree(this.ownerId)
      .subscribe((tree) => (this.menuTree = tree));
  }

  toggleNode(id: number): void {
    this.expanded[id] = !this.expanded[id];
    localStorage.setItem('menuExpanded', JSON.stringify(this.expanded));
  }

  isOpen(id: number): boolean {
    return !!this.expanded[id];
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
