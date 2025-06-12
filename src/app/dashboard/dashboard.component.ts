import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  @Input() user: { name: string; company: string } | null = null;
  @Output() logout = new EventEmitter<void>();
  menuOpen = false;
  submenus: Record<string, boolean> = {};
  subsubmenus: Record<string, boolean> = {};

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  toggleSubmenu(key: string): void {
    this.submenus[key] = !this.submenus[key];
  }

  toggleSubsubmenu(key: string): void {
    this.subsubmenus[key] = !this.subsubmenus[key];
  }

  onLogout(): void {
    this.logout.emit();
  }
}
