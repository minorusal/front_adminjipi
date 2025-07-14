import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MenuService, MenuNode, MenuItem } from '../services/menu.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  menuForm: FormGroup;
  menuTree: MenuNode[] = [];
  flatMenu: MenuNode[] = [];
  expanded: Record<number, boolean> = {};

  constructor(
    private fb: FormBuilder,
    private menuService: MenuService
  ) {
    this.menuForm = this.fb.group({
      name: [''],
      path: [''],
      parent_id: ['']
    });
  }


  ngOnInit(): void {
    this.loadMenuTree();
  }

  loadMenuTree(): void {
    this.menuService
      .getMenuTree()
      .subscribe((tree: MenuNode[]) => {
        this.menuTree = tree;
        this.flatMenu = this.flattenTree(tree);
        this.initExpanded(tree);
      });
  }

  private flattenTree(nodes: MenuNode[], level = 0, result: MenuNode[] = []): MenuNode[] {
    for (const node of nodes) {
      result.push({ ...node, name: '—'.repeat(level) + ' ' + node.name });
      if (node.children) {
        this.flattenTree(node.children, level + 1, result);
      }
    }
    return result;
  }

  private initExpanded(nodes: MenuNode[]): void {
    nodes.forEach(node => {
      if (node.children && node.children.length) {
        if (this.expanded[node.id] === undefined) {
          this.expanded[node.id] = true;
        }
        this.initExpanded(node.children);
      }
    });
  }

  toggleNode(id: number): void {
    this.expanded[id] = !this.expanded[id];
  }

  isOpen(id: number): boolean {
    return !!this.expanded[id];
  }

  hasChild = (_: number, node: MenuNode) =>
    !!node.children && node.children.length > 0;

  onSubmit(): void {
    if (this.menuForm.invalid) {
      return;
    }
    const formValue = this.menuForm.value;
    const newNode: Partial<MenuItem> = {
      name: formValue.name,
      path: formValue.path,
      parent_id: formValue.parent_id ? Number(formValue.parent_id) : null,
    };

    this.menuService.createMenuItem(newNode).subscribe({
      next: () => {
        this.loadMenuTree();
        this.menuForm.reset();
      },
      error: (err: any) => {
        console.error('Failed to add menu item', err);
        // Optionally, show an error message to the user
      }
    });
  }
}
