import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthGuard } from './core/auth/auth.guard';

export const appRoutes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
    data: { preload: true },
  },
  {
    path: 'dashboard',
    canActivate: [() => {
      const router = inject(Router);
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        router.navigate(['/auth/login']);
        return false;
      }
      return true;
    }],
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
    ],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'users/list',
        pathMatch: 'full',
      },
      {
        path: 'users/list',
        loadComponent: () =>
          import('./features/admin/components/users-list.component').then(
            (m) => m.UsersListComponent
          ),
      },
      {
        path: 'users/create',
        loadComponent: () =>
          import('./features/admin/components/user-create.component').then(
            (m) => m.UserCreateComponent
          ),
      },
      {
        path: 'config/general',
        loadComponent: () =>
          import('./features/admin/components/config-general.component').then(
            (m) => m.ConfigGeneralComponent
          ),
      },
      {
        path: 'config/security',
        loadComponent: () =>
          import('./features/admin/components/config-security.component').then(
            (m) => m.ConfigSecurityComponent
          ),
      },
      {
        path: 'sessions/active',
        loadComponent: () =>
          import('./features/admin/components/active-sessions.component').then(
            (m) => m.ActiveSessionsComponent
          ),
      },
    ],
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: 'sales',
        loadComponent: () =>
          import('./features/reports/components/sales-report.component').then(
            (m) => m.SalesReportComponent
          ),
      },
      {
        path: 'analytics/traffic',
        loadComponent: () =>
          import('./features/reports/components/analytics-traffic.component').then(
            (m) => m.AnalyticsTrafficComponent
          ),
      },
      {
        path: 'analytics/conversions',
        loadComponent: () =>
          import('./features/reports/components/analytics-conversions.component').then(
            (m) => m.AnalyticsConversionsComponent
          ),
      },
    ],
  },
  {
    path: 'resources',
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/resources/components/documents.component').then(
            (m) => m.DocumentsComponent
          ),
      },
      {
        path: 'multimedia/images',
        loadComponent: () =>
          import('./features/resources/components/multimedia-images.component').then(
            (m) => m.MultimediaImagesComponent
          ),
      },
      {
        path: 'multimedia/videos',
        loadComponent: () =>
          import('./features/resources/components/multimedia-videos.component').then(
            (m) => m.MultimediaVideosComponent
          ),
      },
    ],
  },
  {
    path: 'monitoring',
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'blocbloc',
        pathMatch: 'full',
      },
      {
        path: 'blocbloc',
        loadComponent: () =>
          import('./features/monitoring/components/blocbloc-monitoring.component').then(
            (m) => m.BlocBlocMonitoringComponent
          ),
      },
      {
        path: 'konesh',
        loadComponent: () =>
          import('./features/monitoring/components/konesh-monitoring.component').then(
            (m) => m.KoneshMonitoringComponent
          ),
      },
      {
        path: 'credit-reports',
        loadComponent: () =>
          import('./features/monitoring/components/credit-reports-monitoring.component').then(
            (m) => m.CreditReportsMonitoringComponent
          ),
      },
      {
        path: 'bitacora',
        loadComponent: () =>
          import('./features/bitacora/components/bitacora-dashboard.component').then(
            (m) => m.BitacoraDashboardComponent
          ),
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('./features/logs/components/logs-dashboard.component').then(
            (m) => m.LogsDashboardComponent
          ),
      },
      {
        path: 'mailjet',
        loadComponent: () =>
          import('./features/monitoring/components/mailjet-monitoring.component').then(
            (m) => m.MailjetMonitoringComponent
          ),
      },
    ],
  },
  {
    path: 'cron-monitoring',
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/cron-monitoring/components/cron-dashboard.component').then(
            (m) => m.CronDashboardComponent
          ),
      },
      {
        path: 'job/:jobId',
        loadComponent: () =>
          import('./features/cron-monitoring/components/job-details.component').then(
            (m) => m.JobDetailsComponent
          ),
      },
      {
        path: 'diagnostics',
        loadComponent: () =>
          import('./features/cron-monitoring/components/cron-diagnostics.component').then(
            (m) => m.CronDiagnosticsComponent
          ),
      },
    ],
  },
  {
    path: 'encuestas-monitoring',
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/encuestas-monitoring/components/encuestas-dashboard.component').then(
            (m) => m.EncuestasDashboardComponent
          ),
      },
    ],
  },
  {
    path: 'unconfirmed-users-monitoring',
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/unconfirmed-users-monitoring/components/unconfirmed-users-dashboard.component').then(
            (m) => m.UnconfirmedUsersDashboardComponent
          ),
      },
    ],
  },
  {
    path: 'registration-attempts-monitoring',
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/registration-attempts-monitoring/components/registration-attempts-dashboard.component').then(
            (m) => m.RegistrationAttemptsDashboardComponent
          ),
      },
    ],
  },
  {
    path: 'algoritmo',
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'parametros',
        pathMatch: 'full',
      },
      {
        path: 'parametros',
        loadComponent: () =>
          import('./features/algoritmo/components/parameters.component').then(
            (m) => m.ParametersComponent
          ),
      },
      {
        path: 'parametros/tabla/:table',
        loadComponent: () =>
          import('./features/algoritmo/components/table-management.component').then(
            (m) => m.TableManagementComponent
          ),
      },
      {
        path: 'parametros/tabla/:table/crear',
        loadComponent: () =>
          import('./features/algoritmo/components/record-form.component').then(
            (m) => m.RecordFormComponent
          ),
      },
      {
        path: 'parametros/tabla/:table/editar/:id',
        loadComponent: () =>
          import('./features/algoritmo/components/record-form.component').then(
            (m) => m.RecordFormComponent
          ),
      },
    ],
  },
  {
    path: 'sistema',
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'parametros',
        pathMatch: 'full',
      },
      {
        path: 'parametros',
        loadComponent: () =>
          import('./features/parametros/components/parametros-management.component').then(
            (m) => m.ParametrosManagementComponent
          ),
      },
    ],
  },
  { 
    path: '', 
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
];
