import { Component, OnInit } from '@angular/core';
<<<<<<< HEAD:src/app/settings/settings.component.ts
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MenuService, MenuNode, MenuItem } from '../services/menu.service';
=======
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from '../../../app/core/services/cookie.service';
import { MenuService, MenuNode } from '../../../app/core/services/menu.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { environment } from '../../../environments/environment';
>>>>>>> 623efd667937a91c87fbe8fb2a7d690fdba176d9:src/features/settings/shell/settings.page.ts

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.css']
})
export class SettingsPage implements OnInit {
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
