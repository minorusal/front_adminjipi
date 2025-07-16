import { Routes } from '@angular/router';
import { AuthShellPage } from './shell/auth-shell.page';
import { AuthLoginPage } from './shell/auth-login.page';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthShellPage,
    children: [
      {
        path: 'login',
        component: AuthLoginPage,
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
];
