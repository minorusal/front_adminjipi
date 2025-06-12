import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

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
  treeControl = new NestedTreeControl<MenuNode>((node: MenuNode) => node.children);
  dataSource = new MatTreeNestedDataSource<MenuNode>();
  private ownerId = 1;

  constructor(private http: HttpClient, private router: Router) {}

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
      .subscribe((tree) => {
        this.menuTree = tree as MenuNode[];
        this.dataSource.data = this.menuTree;
      });
  }

  hasChild = (_: number, node: MenuNode) =>
    !!node.children && node.children.length > 0;

  navigateTo(path: string | null | undefined): void {
    if (path) {
      this.router.navigate([path]);
      this.menuOpen = false;
    }
  }

  onLogout(): void {
    this.logout.emit();
  }
}
