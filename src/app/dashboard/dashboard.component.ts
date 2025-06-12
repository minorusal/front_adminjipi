import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  ngOnInit(): void {
    this.loadMenuTree();
  }

  loadMenuTree(): void {
    this.http
      .get<any[]>(`http://localhost:3000/menus?owner_id=${this.ownerId}`)
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
