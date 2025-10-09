import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UnconfirmedUsersMonitoringService } from '../services/unconfirmed-users-monitoring.service';
import { UnconfirmedUsersStats, UsuariosPorEmpresaMap, UsuarioNoConfirmado } from '../types/unconfirmed-users.types';

// Interface para empresa agrupada (para el componente)
export interface EmpresaAgrupada {
  emp_id: number;
  empresa_nombre: string;
  empresa_completa: string;
  total_usuarios: number;
  usuarios: {
    usu_id: number;
    nombre_completo: string;
    email: string;
    fecha_registro: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class UnconfirmedUsersMonitoringFacade {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  private readonly statsSubject = new BehaviorSubject<UnconfirmedUsersStats | null>(null);
  readonly stats$ = this.statsSubject.asObservable();

  private readonly usuariosPorEmpresaSubject = new BehaviorSubject<EmpresaAgrupada[]>([]);
  readonly usuariosPorEmpresa$ = this.usuariosPorEmpresaSubject.asObservable();

  private readonly usuariosSinEmpresaSubject = new BehaviorSubject<UsuarioNoConfirmado[]>([]);
  readonly usuariosSinEmpresa$ = this.usuariosSinEmpresaSubject.asObservable();

  private readonly totalEmpresasAfectadasSubject = new BehaviorSubject<number>(0);
  readonly totalEmpresasAfectadas$ = this.totalEmpresasAfectadasSubject.asObservable();

  private readonly todosLosUsuariosSubject = new BehaviorSubject<UsuarioNoConfirmado[]>([]);
  readonly todosLosUsuarios$ = this.todosLosUsuariosSubject.asObservable();

  constructor(private unconfirmedUsersService: UnconfirmedUsersMonitoringService) {}

  /**
   * Carga los usuarios no confirmados
   */
  loadUnconfirmedUsers(baseUrl: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('🔍 [FACADE] Cargando usuarios no confirmados...');
    console.log('🔍 [FACADE] Base URL:', baseUrl);

    this.unconfirmedUsersService.getUnconfirmedUsers(baseUrl).pipe(
      tap({
        next: (response) => {
          console.log('✅ [FACADE] Respuesta de /api/cron/unconfirmed-users:', response);

          this.loadingSubject.next(false);

          if (response.error === false && response.data) {
            const data = response.data;

            // Procesar estadísticas
            this.statsSubject.next(data.estadisticas);

            // Convertir el objeto usuarios_por_empresa a array
            const empresasArray: EmpresaAgrupada[] = Object.keys(data.usuarios_por_empresa).map(empresaId => {
              const empresaData = data.usuarios_por_empresa[empresaId];
              return {
                emp_id: empresaData.empresa_info.emp_id,
                empresa_nombre: empresaData.empresa_info.empresa_nombre,
                empresa_completa: empresaData.empresa_info.empresa_completa,
                total_usuarios: empresaData.usuarios.length,
                usuarios: empresaData.usuarios
              };
            });

            this.usuariosPorEmpresaSubject.next(empresasArray);
            this.usuariosSinEmpresaSubject.next(data.usuarios_sin_empresa || []);
            this.totalEmpresasAfectadasSubject.next(data.total_empresas_afectadas || 0);
            this.todosLosUsuariosSubject.next(data.usuarios_detallados || []);

            console.log('✅ [FACADE] Stats procesadas:', data.estadisticas);
            console.log('✅ [FACADE] Usuarios por empresa:', empresasArray.length);
            console.log('✅ [FACADE] Usuarios sin empresa:', data.usuarios_sin_empresa?.length);
            console.log('✅ [FACADE] Total empresas afectadas:', data.total_empresas_afectadas);
            console.log('✅ [FACADE] Total usuarios procesados:', data.usuarios_detallados?.length);
          } else {
            this.errorSubject.next(response.message || 'Error al cargar usuarios no confirmados');
          }
        },
        error: (error) => {
          console.error('❌ [FACADE] Error al cargar usuarios no confirmados:', error);
          this.loadingSubject.next(false);
          this.errorSubject.next('Error al cargar usuarios no confirmados');
        }
      })
    ).subscribe();
  }

  /**
   * Limpia el estado
   */
  clearState(): void {
    this.statsSubject.next(null);
    this.usuariosPorEmpresaSubject.next([]);
    this.usuariosSinEmpresaSubject.next([]);
    this.totalEmpresasAfectadasSubject.next(0);
    this.todosLosUsuariosSubject.next([]);
    this.errorSubject.next(null);
  }
}
