import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface MenuNode {
  id: number;
  name: string;
  path?: string | null;
  children?: MenuNode[];
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  menuForm: FormGroup;
  parentMenus: any[] = [];
  menuTree: MenuNode[] = [];
  private ownerId = 1;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.menuForm = this.fb.group({
      name: [''],
      url: [''],
      parent: ['']
    });
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  ngOnInit(): void {
    this.loadParentMenus();
    this.loadMenuTree();
  }

  loadParentMenus(): void {
    const token = this.getCookie('token');
    const options = token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
    this.http
      .get<any[]>(
        `http://localhost:3000/menus/all?owner_id=${this.ownerId}`,
        options
      )
      .subscribe((menus) => (this.parentMenus = menus));
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
      .subscribe((tree) => {
        // Ensure the data is in a nested tree format. Some responses may
        // return a flat list, so build the hierarchy if "children" are missing.
        const isFlat = tree.length && !tree.some((m) => Array.isArray(m.children));
        this.menuTree = isFlat ? this.buildTree(tree) : (tree as MenuNode[]);
      });
  }

  private buildTree(items: any[], parentId: number | null = null): MenuNode[] {
    return items
      .filter((m) => m.parent_id === parentId)
      .map((m) => ({
        id: m.id,
        name: m.name,
        path: m.path,
        children: this.buildTree(items, m.id),
      }));
  }

  hasChild = (_: number, node: MenuNode) =>
    !!node.children && node.children.length > 0;

  onSubmit(): void {
    const { name, url, parent } = this.menuForm.value;
    const body = {
      name,
      path: url || null,
      parent_id: parent || null,
      owner_id: this.ownerId
    };
    const token = this.getCookie('token');
    const options = token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
    this.http.post('http://localhost:3000/menus', body, options).subscribe({
      next: () => {
        this.menuForm.reset();
        this.loadParentMenus();
        this.loadMenuTree();
      }
    });
  }
}
