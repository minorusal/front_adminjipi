import { Injectable } from '@angular/core';
import { MenuItem } from '../types/menu.types';

@Injectable({
  providedIn: 'root'
})
export class MenuDataService {
  
  // Simulando datos de API
  getMenuItems(): MenuItem[] {
    return [
      {
        id: '1',
        label: 'Administración',
        icon: 'fas fa-cogs',
        expanded: false,
        children: [
          {
            id: '1-1',
            label: 'Usuarios',
            icon: 'fas fa-users',
            parentId: '1',
            expanded: false,
            children: [
              {
                id: '1-1-1',
                label: 'Lista de Usuarios',
                icon: 'fas fa-list',
                route: '/admin/users/list',
                parentId: '1-1'
              },
              {
                id: '1-1-2',
                label: 'Crear Usuario',
                icon: 'fas fa-user-plus',
                route: '/admin/users/create',
                parentId: '1-1'
              }
            ]
          },
          {
            id: '1-2',
            label: 'Configuración',
            icon: 'fas fa-wrench',
            parentId: '1',
            expanded: false,
            children: [
              {
                id: '1-2-1',
                label: 'General',
                icon: 'fas fa-cog',
                route: '/admin/config/general',
                parentId: '1-2'
              },
              {
                id: '1-2-2',
                label: 'Seguridad',
                icon: 'fas fa-shield-alt',
                route: '/admin/config/security',
                parentId: '1-2'
              }
            ]
          },
          {
            id: '1-3',
            label: 'Sesiones Activas',
            icon: 'fas fa-users-cog',
            route: '/admin/sessions/active',
            parentId: '1'
          }
        ]
      },
      {
        id: '2',
        label: 'Reportes',
        icon: 'fas fa-chart-bar',
        expanded: false,
        children: [
          {
            id: '2-1',
            label: 'Ventas',
            icon: 'fas fa-dollar-sign',
            route: '/reports/sales',
            parentId: '2'
          },
          {
            id: '2-2',
            label: 'Analytics',
            icon: 'fas fa-analytics',
            parentId: '2',
            expanded: false,
            children: [
              {
                id: '2-2-1',
                label: 'Tráfico Web',
                icon: 'fas fa-globe',
                route: '/reports/analytics/traffic',
                parentId: '2-2'
              },
              {
                id: '2-2-2',
                label: 'Conversiones',
                icon: 'fas fa-funnel-dollar',
                route: '/reports/analytics/conversions',
                parentId: '2-2'
              }
            ]
          }
        ]
      },
      {
        id: '3',
        label: 'Notificaciones',
        icon: 'fas fa-bell',
        route: '/dashboard',
        expanded: false
      },
      {
        id: '4',
        label: 'Recursos',
        icon: 'fas fa-folder',
        expanded: false,
        children: [
          {
            id: '4-1',
            label: 'Documentos',
            icon: 'fas fa-file-alt',
            route: '/resources/documents',
            parentId: '4'
          },
          {
            id: '4-2',
            label: 'Multimedia',
            icon: 'fas fa-images',
            parentId: '4',
            expanded: false,
            children: [
              {
                id: '4-2-1',
                label: 'Imágenes',
                icon: 'fas fa-image',
                route: '/resources/multimedia/images',
                parentId: '4-2'
              },
              {
                id: '4-2-2',
                label: 'Videos',
                icon: 'fas fa-video',
                route: '/resources/multimedia/videos',
                parentId: '4-2'
              }
            ]
          }
        ]
      },
      {
        id: '5',
        label: 'Monitoreo',
        icon: 'fas fa-chart-line',
        expanded: false,
        children: [
          {
            id: '5-1',
            label: 'BlocBloc',
            icon: 'fas fa-cube',
            route: '/monitoring/blocbloc',
            parentId: '5'
          },
          {
            id: '5-2',
            label: 'SAT (Konesh)',
            icon: 'fas fa-receipt',
            route: '/monitoring/konesh',
            parentId: '5'
          },
          {
            id: '5-3',
            label: 'Reportes de Crédito',
            icon: 'fas fa-file-invoice-dollar',
            route: '/monitoring/credit-reports',
            parentId: '5'
          },
          {
            id: '5-4',
            label: 'Bitácora de Endpoints',
            icon: 'fas fa-list-alt',
            route: '/monitoring/bitacora',
            parentId: '5'
          },
          {
            id: '5-5',
            label: 'Gestión de Logs',
            icon: 'fas fa-file-alt',
            route: '/monitoring/logs',
            parentId: '5'
          },
          {
            id: '5-6',
            label: 'Mailjet',
            icon: 'fas fa-envelope',
            route: '/monitoring/mailjet',
            parentId: '5'
          },
          {
            id: '5-7',
            label: 'Cron Jobs',
            icon: 'fas fa-clock',
            route: '/cron-monitoring',
            parentId: '5'
          },
          {
            id: '5-8',
            label: 'Diagnóstico Cron',
            icon: 'fas fa-bug',
            route: '/cron-monitoring/diagnostics',
            parentId: '5'
          }
        ]
      },
      {
        id: '6',
        label: 'Algoritmo',
        icon: 'fas fa-brain',
        expanded: false,
        children: [
          {
            id: '6-1',
            label: 'Parámetros',
            icon: 'fas fa-sliders-h',
            route: '/algoritmo/parametros',
            parentId: '6'
          }
        ]
      },
      {
        id: '7',
        label: 'Sistema',
        icon: 'fas fa-server',
        expanded: false,
        children: [
          {
            id: '7-1',
            label: 'Parámetros del Sistema',
            icon: 'fas fa-cogs',
            route: '/sistema/parametros',
            parentId: '7'
          }
        ]
      }
    ];
  }
}