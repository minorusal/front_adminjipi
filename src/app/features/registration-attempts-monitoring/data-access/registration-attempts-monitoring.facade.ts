import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RegistrationAttemptsMonitoringService } from '../services/registration-attempts-monitoring.service';
import {
  RegistrationAttempt,
  RegistrationStats,
  RegistrationFilters,
  TipoFallo,
  TopRFC,
  TopEmail,
  SuspiciousIP,
  IPAlert,
  IPAlertFilters,
  IPAlertsStats,
  AlertasPorTipo,
  FiltrosAplicados,
  Paginacion
} from '../types/registration-attempts.types';

// Análisis consolidado para el componente
export interface RegistrationAnalysis {
  tipos_fallo: TipoFallo[];
  top_rfcs: TopRFC[];
  top_emails: TopEmail[];
  ips_sospechosas: SuspiciousIP[];
}

@Injectable({ providedIn: 'root' })
export class RegistrationAttemptsMonitoringFacade {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  private readonly attemptsSubject = new BehaviorSubject<RegistrationAttempt[]>([]);
  readonly attempts$ = this.attemptsSubject.asObservable();

  private readonly statsSubject = new BehaviorSubject<RegistrationStats | null>(null);
  readonly stats$ = this.statsSubject.asObservable();

  private readonly analysisSubject = new BehaviorSubject<RegistrationAnalysis | null>(null);
  readonly analysis$ = this.analysisSubject.asObservable();

  private readonly paginacionSubject = new BehaviorSubject<Paginacion | null>(null);
  readonly paginacion$ = this.paginacionSubject.asObservable();

  private readonly ipAlertsSubject = new BehaviorSubject<IPAlert[]>([]);
  readonly ipAlerts$ = this.ipAlertsSubject.asObservable();

  private readonly ipAlertsStatsSubject = new BehaviorSubject<IPAlertsStats | null>(null);
  readonly ipAlertsStats$ = this.ipAlertsStatsSubject.asObservable();

  private readonly alertasPorTipoSubject = new BehaviorSubject<AlertasPorTipo | null>(null);
  readonly alertasPorTipo$ = this.alertasPorTipoSubject.asObservable();

  private readonly filtrosAplicadosSubject = new BehaviorSubject<FiltrosAplicados | null>(null);
  readonly filtrosAplicados$ = this.filtrosAplicadosSubject.asObservable();

  constructor(private registrationService: RegistrationAttemptsMonitoringService) {}

  /**
   * Carga los intentos de registro con filtros
   */
  loadAttempts(filters: RegistrationFilters, baseUrl: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('🔍 [FACADE] Cargando intentos de registro con filtros:', filters);
    console.log('🔍 [FACADE] Base URL:', baseUrl);

    this.registrationService.getRegistrationAttempts(filters, baseUrl).pipe(
      tap({
        next: (response) => {
          console.log('✅ [FACADE] Respuesta de /api/cron/registration-attempts:', response);

          this.loadingSubject.next(false);

          if (response.error === false && response.data) {
            this.attemptsSubject.next(response.data.intentos?.datos || []);
            this.paginacionSubject.next(response.data.intentos?.paginacion || null);
            this.statsSubject.next(response.data.estadisticas);

            // Consolidar análisis
            const analysis: RegistrationAnalysis = {
              tipos_fallo: response.data.tipos_fallo || [],
              top_rfcs: response.data.top_rfcs || [],
              top_emails: response.data.top_emails || [],
              ips_sospechosas: response.data.ips_sospechosas || []
            };
            this.analysisSubject.next(analysis);

            console.log('✅ [FACADE] Intentos procesados:', response.data.intentos?.datos?.length);
            console.log('✅ [FACADE] Paginación:', response.data.intentos?.paginacion);
            console.log('✅ [FACADE] Stats:', response.data.estadisticas);
            console.log('✅ [FACADE] Análisis:', analysis);
          } else {
            this.errorSubject.next(response.message || 'Error al cargar intentos de registro');
          }
        },
        error: (error) => {
          console.error('❌ [FACADE] Error al cargar intentos de registro:', error);
          this.loadingSubject.next(false);
          this.errorSubject.next('Error al cargar intentos de registro');
        }
      })
    ).subscribe();
  }

  /**
   * Carga las alertas de IPs sospechosas
   */
  loadIPAlerts(filters: IPAlertFilters, baseUrl: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('🔍 [FACADE] Cargando alertas de IP con filtros:', filters);
    console.log('🔍 [FACADE] Base URL:', baseUrl);

    this.registrationService.getIPAlerts(filters, baseUrl).pipe(
      tap({
        next: (response) => {
          console.log('✅ [FACADE] Respuesta de /api/cron/ip-alerts:', response);

          this.loadingSubject.next(false);

          if (response.error === false && response.data) {
            this.ipAlertsSubject.next(response.data.alertas || []);
            this.ipAlertsStatsSubject.next(response.data.estadisticas);
            this.alertasPorTipoSubject.next(response.data.alertas_por_tipo);
            this.filtrosAplicadosSubject.next(response.data.filtros_aplicados);

            console.log('✅ [FACADE] Alertas procesadas:', response.data.alertas?.length);
            console.log('✅ [FACADE] Estadísticas:', response.data.estadisticas);
          } else {
            this.errorSubject.next(response.message || 'Error al cargar alertas de IP');
          }
        },
        error: (error) => {
          console.error('❌ [FACADE] Error al cargar alertas de IP:', error);
          this.loadingSubject.next(false);
          this.errorSubject.next('Error al cargar alertas de IP');
        }
      })
    ).subscribe();
  }

  /**
   * Limpia el estado
   */
  clearState(): void {
    this.attemptsSubject.next([]);
    this.statsSubject.next(null);
    this.analysisSubject.next(null);
    this.paginacionSubject.next(null);
    this.ipAlertsSubject.next([]);
    this.ipAlertsStatsSubject.next(null);
    this.alertasPorTipoSubject.next(null);
    this.filtrosAplicadosSubject.next(null);
    this.errorSubject.next(null);
  }
}
