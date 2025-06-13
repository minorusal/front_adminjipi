import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from '../services/cookie.service';
import { MenuService, MenuNode } from '../services/menu.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { environment } from '../../environments/environment';

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
    this.loadParentMenus();
    this.loadMenuTree();
  }

  loadParentMenus(): void {
    this.menuService
      .getParentMenus(this.ownerId)
      .subscribe((menus) => (this.parentMenus = menus));
  }

  loadMenuTree(): void {
    this.menuService
      .getMenuTree(this.ownerId)
      .subscribe((tree) => (this.menuTree = tree));
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
        this.loadParentMenus();
        this.loadMenuTree();
      }
    });
  }
}
