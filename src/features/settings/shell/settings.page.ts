import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from '../../../app/core/services/cookie.service';
import { MenuService, MenuNode } from '../../../app/core/services/menu.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.css']
})
export class SettingsPage implements OnInit {
  menuForm: FormGroup;
  parentMenus: any[] = [];
  menuTree: MenuNode[] = [];
  expanded: Record<number, boolean> = {};
  private ownerId!: number;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cookieService: CookieService,
    private menuService: MenuService
  ) {
    this.menuForm = this.fb.group({
      name: [''],
      url: [''],
      parent: ['']
    });
  }


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

    if (hasValidOwner) {
      this.loadParentMenus();
      this.loadMenuTree();
    } else {
      console.warn('SettingsComponent: ownerId could not be determined');
    }
  }

  loadParentMenus(): void {
    this.menuService
      .getParentMenus(this.ownerId)
      .subscribe((menus) => (this.parentMenus = menus));
  }

  loadMenuTree(): void {
    this.menuService
      .getMenuTree(this.ownerId)
      .subscribe((tree) => {
        this.menuTree = tree;
        this.initExpanded(tree);
      });
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
    const { name, url, parent } = this.menuForm.value;
    const body = {
      name,
      path: url || null,
      parent_id: parent || null,
      owner_id: this.ownerId
    };
    const token = this.cookieService.get('token');
    const options = token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
    this.http.post(`${environment.apiUrl}/menus`, body, options).subscribe({
      next: () => {
        this.menuForm.reset();
        if (typeof this.ownerId === 'number' && !isNaN(this.ownerId)) {
          this.loadParentMenus();
          this.loadMenuTree();
        } else {
          console.warn('SettingsComponent: ownerId could not be determined');
        }
      }
    });
  }
}
