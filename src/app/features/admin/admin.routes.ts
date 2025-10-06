import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: 'users/list',
    loadComponent: () =>
      import('./components/users-list.component').then(
        (m) => m.UsersListComponent
      ),
  },
  {
    path: 'users/create',
    loadComponent: () =>
      import('./components/user-create.component').then(
        (m) => m.UserCreateComponent
      ),
  },
  {
    path: 'config/general',
    loadComponent: () =>
      import('./components/config-general.component').then(
        (m) => m.ConfigGeneralComponent
      ),
  },
  {
    path: 'config/security',
    loadComponent: () =>
      import('./components/config-security.component').then(
        (m) => m.ConfigSecurityComponent
      ),
  },
];