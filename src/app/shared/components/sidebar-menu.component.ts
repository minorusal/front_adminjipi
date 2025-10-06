import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MenuItem } from '../types/menu.types';
import { MenuDataService } from '../services/menu-data.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar" [class.collapsed]="isCollapsed">
      <!-- Header del sidebar -->
      <div class="sidebar-header">
        <button 
          class="hamburger-btn"
          (click)="toggleSidebar()"
          [class.active]="!isCollapsed">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h5 class="sidebar-title" [class.hidden]="isCollapsed">Admin Panel</h5>
      </div>
      
      <!-- Menu items -->
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li *ngFor="let item of menuItems" class="nav-item">
            <div class="nav-link-container">
              <a 
                [href]="item.route || '#'"
                class="nav-link"
                [class.has-children]="item.children && item.children.length > 0"
                [class.active]="isActiveRoute(item.route)"
                (click)="handleItemClick(item, $event)">
                <i *ngIf="item.icon" [class]="item.icon" class="nav-icon"></i>
                <span class="nav-text" [class.hidden]="isCollapsed">{{ item.label }}</span>
                <i *ngIf="item.children && item.children.length > 0 && !isCollapsed" 
                   class="expand-icon fas"
                   [class.fa-chevron-down]="item.expanded"
                   [class.fa-chevron-right]="!item.expanded"></i>
              </a>
            </div>
            
            <!-- Submenú -->
            <ul *ngIf="item.children && item.children.length > 0 && item.expanded && !isCollapsed" 
                class="submenu">
              <li *ngFor="let child of item.children" class="submenu-item">
                <div class="nav-link-container">
                  <a 
                    [href]="child.route || '#'"
                    class="nav-link submenu-link"
                    [class.has-children]="child.children && child.children.length > 0"
                    [class.active]="isActiveRoute(child.route)"
                    (click)="handleItemClick(child, $event)">
                    <i *ngIf="child.icon" [class]="child.icon" class="nav-icon"></i>
                    <span class="nav-text">{{ child.label }}</span>
                    <i *ngIf="child.children && child.children.length > 0" 
                       class="expand-icon fas"
                       [class.fa-chevron-down]="child.expanded"
                       [class.fa-chevron-right]="!child.expanded"></i>
                  </a>
                </div>
                
                <!-- Sub-submenú -->
                <ul *ngIf="child.children && child.children.length > 0 && child.expanded" 
                    class="submenu sub-submenu">
                  <li *ngFor="let grandchild of child.children" class="submenu-item">
                    <a 
                      [href]="grandchild.route || '#'"
                      class="nav-link submenu-link sub-submenu-link"
                      [class.active]="isActiveRoute(grandchild.route)"
                      (click)="handleItemClick(grandchild, $event)">
                      <i *ngIf="grandchild.icon" [class]="grandchild.icon" class="nav-icon"></i>
                      <span class="nav-text">{{ grandchild.label }}</span>
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      
      <!-- Logout Button -->
      <div class="sidebar-footer">
        <button 
          class="logout-btn"
          (click)="handleLogout()"
          [title]="isCollapsed ? 'Cerrar Sesión' : ''"
          type="button">
          <i class="fas fa-sign-out-alt nav-icon"></i>
          <span class="nav-text" [class.hidden]="isCollapsed">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      height: 100vh;
      width: 250px;
      background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
      color: white;
      transition: all 0.3s ease;
      z-index: 1000;
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .sidebar.collapsed {
      width: 60px;
    }
    
    .sidebar-header {
      padding: 15px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      background: inherit;
    }
    
    .hamburger-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      width: 30px;
      height: 30px;
      position: relative;
      transition: all 0.3s ease;
    }
    
    .hamburger-btn span {
      display: block;
      width: 20px;
      height: 2px;
      background: white;
      margin: 4px auto;
      transition: all 0.3s ease;
      transform-origin: center;
    }
    
    .hamburger-btn.active span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    .hamburger-btn.active span:nth-child(2) {
      opacity: 0;
    }
    
    .hamburger-btn.active span:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }
    
    .sidebar-title {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      transition: all 0.3s ease;
      white-space: nowrap;
    }
    
    .sidebar-title.hidden {
      opacity: 0;
      width: 0;
    }
    
    .sidebar-nav {
      padding: 10px 0;
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }
    
    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .nav-item {
      margin-bottom: 2px;
    }
    
    .nav-link-container {
      position: relative;
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      transition: all 0.3s ease;
      position: relative;
      white-space: nowrap;
    }
    
    .nav-link:hover {
      background: rgba(255,255,255,0.1);
      color: white;
      transform: translateX(2px);
    }
    
    .nav-link.active {
      background: rgba(52, 152, 219, 0.3);
      color: #3498db;
      border-right: 3px solid #3498db;
    }
    
    .nav-icon {
      width: 20px;
      margin-right: 10px;
      text-align: center;
      font-size: 16px;
    }
    
    .nav-text {
      flex: 1;
      transition: all 0.3s ease;
    }
    
    .nav-text.hidden {
      opacity: 0;
      width: 0;
    }
    
    .expand-icon {
      margin-left: auto;
      font-size: 12px;
      transition: all 0.3s ease;
    }
    
    .submenu {
      list-style: none;
      padding: 0;
      margin: 0;
      background: rgba(0,0,0,0.2);
      border-left: 3px solid rgba(52, 152, 219, 0.3);
    }
    
    .submenu-item {
      position: relative;
    }
    
    .submenu-link {
      padding: 10px 15px 10px 40px;
      font-size: 0.9rem;
    }
    
    .sub-submenu .submenu-link {
      padding: 8px 15px 8px 60px;
      font-size: 0.85rem;
      color: rgba(255,255,255,0.7);
    }
    
    .sub-submenu {
      background: rgba(0,0,0,0.3);
      border-left: 2px solid rgba(52, 152, 219, 0.2);
    }
    
    /* Scrollbar personalizado para el nav */
    .sidebar-nav::-webkit-scrollbar {
      width: 6px;
    }
    
    .sidebar-nav::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.1);
    }
    
    .sidebar-nav::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
    }
    
    .sidebar-nav::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.4);
    }
    
    /* Sidebar Footer */
    .sidebar-footer {
      flex-shrink: 0;
      padding: 15px;
      border-top: 1px solid rgba(255,255,255,0.1);
      background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%);
    }
    
    .logout-btn {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 0;
      background: none;
      border: none;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 6px;
      text-align: left;
    }
    
    .logout-btn:hover {
      background: rgba(231, 76, 60, 0.2);
      color: #e74c3c;
      transform: translateX(2px);
    }
    
    .logout-btn:active {
      transform: translateX(1px);
      background: rgba(231, 76, 60, 0.3);
    }
    
    .logout-btn .nav-icon {
      width: 20px;
      margin-right: 10px;
      text-align: center;
      font-size: 16px;
    }
    
    .logout-btn .nav-text {
      flex: 1;
      transition: all 0.3s ease;
      font-weight: 500;
    }
    
    .logout-btn .nav-text.hidden {
      opacity: 0;
      width: 0;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }
      
      .sidebar.show {
        transform: translateX(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SidebarMenuComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() sidebarToggle = new EventEmitter<boolean>();
  
  menuItems: MenuItem[] = [];

  constructor(
    private menuDataService: MenuDataService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('SidebarMenuComponent initialized - Logout button should be visible');
    this.menuItems = this.menuDataService.getMenuItems();
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit(this.isCollapsed);
  }

  handleItemClick(item: MenuItem, event: Event) {
    event.preventDefault();
    
    if (item.children && item.children.length > 0) {
      // Toggle expansion
      item.expanded = !item.expanded;
      
      // Cerrar otros items del mismo nivel
      this.collapseOtherItems(item);
    } else if (item.route) {
      // Navegar a la ruta
      this.router.navigate([item.route]);
    }
  }

  private collapseOtherItems(clickedItem: MenuItem) {
    const collapseItems = (items: MenuItem[], parentId?: string) => {
      items.forEach(item => {
        if (item.id !== clickedItem.id && item.parentId === parentId) {
          item.expanded = false;
        }
        if (item.children) {
          collapseItems(item.children, item.id);
        }
      });
    };
    
    collapseItems(this.menuItems, clickedItem.parentId);
  }

  isActiveRoute(route?: string): boolean {
    if (!route) return false;
    return this.router.url === route;
  }

  handleLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      // Get session token from localStorage
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (sessionToken) {
        // Call logout service
        this.authService.logoutUserSession(sessionToken).subscribe({
          next: (response) => {
            console.log('Logout successful:', response);
            this.clearUserSession();
            this.router.navigate(['/auth/login']);
          },
          error: (error) => {
            console.error('Logout error:', error);
            // Even if logout fails on server, clear local session
            this.clearUserSession();
            this.router.navigate(['/auth/login']);
          }
        });
      } else {
        // No session token, just clear local data and redirect
        this.clearUserSession();
        this.router.navigate(['/auth/login']);
      }
    }
  }

  private clearUserSession() {
    // Clear all authentication data from localStorage and cookies
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('payload');
    
    // Clear cookies
    document.cookie = 'from_company_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'from_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'payload=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
}