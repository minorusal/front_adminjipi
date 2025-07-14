import { Component, Input, OnInit } from '@angular/core';
import { MenuService, MenuNode } from '../services/menu.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() open = false;

  menuTree: MenuNode[] = [];
  expanded: Record<number, boolean> = {};

  constructor(
    private menuService: MenuService
  ) {}

  ngOnInit(): void {
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
      .getMenuTree()
      .subscribe((tree: MenuNode[]) => (this.menuTree = tree));
  }

  toggleNode(id: number): void {
    this.expanded[id] = !this.expanded[id];
    localStorage.setItem('menuExpanded', JSON.stringify(this.expanded));
  }

  isOpen(id: number): boolean {
    return !!this.expanded[id];
  }

  onItemClick(node: MenuNode, event: MouseEvent): void {
    const hasChildren = !!node.children && node.children.length > 0;
    if (hasChildren) {
      if (node.path) {
        event.preventDefault();
      }
      this.toggleNode(node.id);
      event.stopPropagation();
    }
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
