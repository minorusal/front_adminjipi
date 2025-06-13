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

  constructor() {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }



  onLogout(): void {
    this.logout.emit();
  }
}
