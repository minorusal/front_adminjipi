import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @Input() user: { name: string; company: string } | null = null;
  @Output() logout = new EventEmitter<void>();
  menuOpen = false;
  expanded: Record<number, boolean> = {};
  menuTree: any[] = [];
  private ownerId = 1;
  selectedView = 'home';

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
      .subscribe((tree) => (this.menuTree = tree));
  }

  toggleNode(id: number): void {
    this.expanded[id] = !this.expanded[id];
  }

  isOpen(id: number): boolean {
    return !!this.expanded[id];
  }

  selectView(view: string): void {
    this.selectedView = view;
    this.menuOpen = false;
  }

  onLogout(): void {
    this.logout.emit();
  }
}
