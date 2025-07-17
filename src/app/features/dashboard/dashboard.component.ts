import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SocketService } from '../../core/socket/socket.service';
import { NotificationBadgeComponent } from '../../shared/components/notification-badge.component';
import { NotificationListComponent } from '../../shared/components/notification-list.component';
import { AuthFacade } from '../auth/data-access/auth.facade';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NotificationBadgeComponent, NotificationListComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Dashboard</h2>
      <button class="btn btn-outline-secondary" (click)="logout()">Logout</button>
    </div>
    <app-notification-badge></app-notification-badge>
    <app-notification-list></app-notification-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  constructor(
    private socketService: SocketService,
    private router: Router,
    private authFacade: AuthFacade
  ) {}

  ngOnInit(): void {
    this.socketService.connect();
  }

  logout(): void {
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }
}
