import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  @Input() user: { username: string; companyName: string } | null = null;
  @Output() logout = new EventEmitter<void>();
  
  menuOpen: boolean;
  isDesktop = window.innerWidth >= 768;

  constructor() {
    const storedState = localStorage.getItem('sidebarOpen');
    // On desktop, default to open. On mobile, default to closed.
    const defaultState = this.isDesktop;
    this.menuOpen = storedState !== null ? storedState === 'true' : defaultState;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    localStorage.setItem('sidebarOpen', String(this.menuOpen));
  }

  onLogout(): void {
    this.logout.emit();
  }
}
