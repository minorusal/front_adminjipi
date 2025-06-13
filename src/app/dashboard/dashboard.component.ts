import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent {
  @Input() user: { name: string; company: string } | null = null;
  @Output() logout = new EventEmitter<void>();
  menuOpen = false;
  private savedMenuState = true;
  isDesktop = window.innerWidth >= 768;

  ngOnInit(): void {
    const stored = localStorage.getItem('sidebarOpen');
    this.savedMenuState = stored !== null ? stored === 'true' : true;
    this.menuOpen = this.isDesktop ? this.savedMenuState : false;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isDesktop = window.innerWidth >= 768;
    this.menuOpen = this.isDesktop ? this.savedMenuState : false;
  }

  constructor() {}

  toggleMenu(): void {
    this.savedMenuState = !this.savedMenuState;
    this.menuOpen = this.savedMenuState;
    localStorage.setItem('sidebarOpen', String(this.savedMenuState));
  }

  onLogout(): void {
    this.logout.emit();
  }
}
