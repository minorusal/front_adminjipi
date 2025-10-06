import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarMenuComponent } from './sidebar-menu.component';
import { SocketNotificationsComponent } from './socket-notifications.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarMenuComponent,
    SocketNotificationsComponent
  ],
  template: `
    <div class="main-layout">
      <app-sidebar-menu 
        [isCollapsed]="sidebarCollapsed"
        (sidebarToggle)="onSidebarToggle($event)">
      </app-sidebar-menu>
      
      <main class="main-content" [class.expanded]="sidebarCollapsed">
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .main-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    
    .main-content {
      margin-left: 250px;
      flex: 1;
      overflow-y: auto;
      background: #1a1a1a;
      transition: margin-left 0.3s ease;
    }
    
    .main-content.expanded {
      margin-left: 60px;
    }
    
    .content-wrapper {
      min-height: 100%;
      padding: 0;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
      }
      
      .main-content.expanded {
        margin-left: 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MainLayoutComponent {
  sidebarCollapsed = false;

  constructor() {
    console.log('MainLayoutComponent constructed - Sidebar should be visible');
  }

  onSidebarToggle(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }
}