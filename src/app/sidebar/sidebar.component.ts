import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MenuService, MenuNode } from '../services/menu.service';

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

  constructor(private menuService: MenuService) {}

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
