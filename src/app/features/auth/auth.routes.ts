import { Routes } from '@angular/router';
import { AuthShellPage } from './shell/auth-shell.page';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthShellPage,
    children: [],
  },
];
