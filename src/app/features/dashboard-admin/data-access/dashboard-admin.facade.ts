import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DashboardAdminService } from '../services/dashboard-admin.service';
import {
  MetricasGlobales,
  ErroresAlertas,
  TransaccionesRecientes,
  CobrosRecurrentes,
  EstadisticasStripe,
  FiltrosTransacciones,
  FiltrosEstadisticas,
  EmpresasConSuscripciones,
  FiltrosEmpresasSuscripciones
} from '../types/dashboard.types';

@Injectable({
  providedIn: 'root'
})
export class DashboardAdminFacade {
  // Estado de carga
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  // Estado de error
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Métricas globales
  private metricasGlobalesSubject = new BehaviorSubject<MetricasGlobales | null>(null);
  public metricasGlobales$ = this.metricasGlobalesSubject.asObservable();

  // Errores y alertas
  private erroresAlertasSubject = new BehaviorSubject<ErroresAlertas | null>(null);
  public erroresAlertas$ = this.erroresAlertasSubject.asObservable();

  // Transacciones recientes
  private transaccionesSubject = new BehaviorSubject<TransaccionesRecientes | null>(null);
  public transacciones$ = this.transaccionesSubject.asObservable();

  // Cobros recurrentes
  private cobrosRecurrentesSubject = new BehaviorSubject<CobrosRecurrentes | null>(null);
  public cobrosRecurrentes$ = this.cobrosRecurrentesSubject.asObservable();

  // Estadísticas de Stripe
  private estadisticasStripeSubject = new BehaviorSubject<EstadisticasStripe | null>(null);
  public estadisticasStripe$ = this.estadisticasStripeSubject.asObservable();

  // Empresas con Suscripciones
  private empresasConSuscripcionesSubject = new BehaviorSubject<EmpresasConSuscripciones | null>(null);
  public empresasConSuscripciones$ = this.empresasConSuscripcionesSubject.asObservable();

  // Auto-refresh
  private autoRefreshInterval: any;

  constructor(private dashboardService: DashboardAdminService) {}

  /**
   * Carga métricas globales
   */
  loadMetricasGlobales(baseUrl: string): void {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('📊 [FACADE] Cargando métricas globales...');
    console.log('📊 [FACADE] Base URL:', baseUrl);

    this.dashboardService.getMetricasGlobales(baseUrl).subscribe({
      next: (response) => {
        console.log('✅ [FACADE] Respuesta completa recibida:', response);
        console.log('✅ [FACADE] response.error:', response.error);
        console.log('✅ [FACADE] response.message:', response.message);
        console.log('✅ [FACADE] response.data:', response.data);

        if (response.error) {
          console.error('❌ [FACADE] La API retornó error:', response.message);
          this.errorSubject.next(response.message || 'Error al cargar métricas globales');
          this.isLoadingSubject.next(false);
          return;
        }

        console.log('✅ [FACADE] Métricas globales cargadas exitosamente');
        this.metricasGlobalesSubject.next(response.data);
        this.isLoadingSubject.next(false);
      },
      error: (error) => {
        console.error('❌ [FACADE] Error al cargar métricas globales:', error);
        console.error('❌ [FACADE] Error completo:', JSON.stringify(error, null, 2));
        const errorMessage = error.message || error.error?.message || 'Error al cargar métricas globales';
        this.errorSubject.next(errorMessage);
        this.isLoadingSubject.next(false);
      }
    });
  }

  /**
   * Carga errores y alertas
   */
  loadErroresAlertas(baseUrl: string): void {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('🚨 [FACADE] Cargando errores y alertas...');
    console.log('🚨 [FACADE] Base URL:', baseUrl);

    this.dashboardService.getErroresAlertas(baseUrl).subscribe({
      next: (response) => {
        console.log('✅ [FACADE] Respuesta completa recibida:', response);

        if (response.error) {
          console.error('❌ [FACADE] La API retornó error:', response.message);
          this.errorSubject.next(response.message || 'Error al cargar errores y alertas');
          this.isLoadingSubject.next(false);
          return;
        }

        console.log('✅ [FACADE] Errores y alertas cargadas exitosamente');
        this.erroresAlertasSubject.next(response.data);
        this.isLoadingSubject.next(false);
      },
      error: (error) => {
        console.error('❌ [FACADE] Error al cargar errores y alertas:', error);
        const errorMessage = error.message || error.error?.message || 'Error al cargar errores y alertas';
        this.errorSubject.next(errorMessage);
        this.isLoadingSubject.next(false);
      }
    });
  }

  /**
   * Carga transacciones recientes
   */
  loadTransaccionesRecientes(baseUrl: string, filtros?: FiltrosTransacciones): void {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('💳 [FACADE] Cargando transacciones recientes...', filtros);

    this.dashboardService.getTransaccionesRecientes(baseUrl, filtros).subscribe({
      next: (response) => {
        console.log('✅ [FACADE] Transacciones cargadas:', response.data);
        this.transaccionesSubject.next(response.data);
        this.isLoadingSubject.next(false);
      },
      error: (error) => {
        console.error('❌ [FACADE] Error al cargar transacciones:', error);
        this.errorSubject.next('Error al cargar transacciones');
        this.isLoadingSubject.next(false);
      }
    });
  }

  /**
   * Carga cobros recurrentes
   */
  loadCobrosRecurrentes(baseUrl: string): void {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('🔄 [FACADE] Cargando cobros recurrentes...');

    this.dashboardService.getCobrosRecurrentes(baseUrl).subscribe({
      next: (response) => {
        console.log('✅ [FACADE] Cobros recurrentes cargados:', response.data);
        this.cobrosRecurrentesSubject.next(response.data);
        this.isLoadingSubject.next(false);
      },
      error: (error) => {
        console.error('❌ [FACADE] Error al cargar cobros recurrentes:', error);
        this.errorSubject.next('Error al cargar cobros recurrentes');
        this.isLoadingSubject.next(false);
      }
    });
  }

  /**
   * Carga estadísticas de Stripe
   */
  loadEstadisticasStripe(baseUrl: string, filtros?: FiltrosEstadisticas): void {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('📈 [FACADE] Cargando estadísticas de Stripe...', filtros);

    this.dashboardService.getEstadisticasStripe(baseUrl, filtros).subscribe({
      next: (response) => {
        console.log('✅ [FACADE] Estadísticas de Stripe cargadas:', response.data);
        this.estadisticasStripeSubject.next(response.data);
        this.isLoadingSubject.next(false);
      },
      error: (error) => {
        console.error('❌ [FACADE] Error al cargar estadísticas de Stripe:', error);
        this.errorSubject.next('Error al cargar estadísticas de Stripe');
        this.isLoadingSubject.next(false);
      }
    });
  }

  /**
   * Carga empresas con suscripciones
   */
  loadEmpresasConSuscripciones(baseUrl: string, filtros?: FiltrosEmpresasSuscripciones): void {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('🏢 [FACADE] Cargando empresas con suscripciones...', filtros);

    this.dashboardService.getEmpresasConSuscripciones(baseUrl, filtros).subscribe({
      next: (response) => {
        console.log('✅ [FACADE] Empresas con suscripciones cargadas:', response.data);
        this.empresasConSuscripcionesSubject.next(response.data);
        this.isLoadingSubject.next(false);
      },
      error: (error) => {
        console.error('❌ [FACADE] Error al cargar empresas con suscripciones:', error);
        this.errorSubject.next('Error al cargar empresas con suscripciones');
        this.isLoadingSubject.next(false);
      }
    });
  }

  /**
   * Carga todos los datos del dashboard
   */
  loadAllData(baseUrl: string, filtrosTransacciones?: FiltrosTransacciones, filtrosEstadisticas?: FiltrosEstadisticas): void {
    console.log('🔄 [FACADE] Cargando todos los datos del dashboard...');

    this.loadMetricasGlobales(baseUrl);
    this.loadErroresAlertas(baseUrl);
    this.loadTransaccionesRecientes(baseUrl, filtrosTransacciones);
    this.loadCobrosRecurrentes(baseUrl);
    this.loadEstadisticasStripe(baseUrl, filtrosEstadisticas);
  }

  /**
   * Habilita auto-refresh
   */
  enableAutoRefresh(
    baseUrl: string,
    intervalMs: number = 60000, // 1 minuto por defecto
    filtrosTransacciones?: FiltrosTransacciones,
    filtrosEstadisticas?: FiltrosEstadisticas
  ): void {
    console.log('🔄 [FACADE] Auto-refresh habilitado cada', intervalMs / 1000, 'segundos');

    this.disableAutoRefresh(); // Limpia cualquier intervalo anterior

    this.autoRefreshInterval = setInterval(() => {
      console.log('🔄 [FACADE] Ejecutando auto-refresh...');
      this.loadAllData(baseUrl, filtrosTransacciones, filtrosEstadisticas);
    }, intervalMs);
  }

  /**
   * Deshabilita auto-refresh
   */
  disableAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      console.log('⏸️ [FACADE] Auto-refresh deshabilitado');
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  /**
   * Limpia el estado
   */
  clearState(): void {
    console.log('🧹 [FACADE] Limpiando estado...');
    this.metricasGlobalesSubject.next(null);
    this.erroresAlertasSubject.next(null);
    this.transaccionesSubject.next(null);
    this.cobrosRecurrentesSubject.next(null);
    this.estadisticasStripeSubject.next(null);
    this.empresasConSuscripcionesSubject.next(null);
    this.errorSubject.next(null);
    this.isLoadingSubject.next(false);
    this.disableAutoRefresh();
  }

  /**
   * Obtiene el estado de carga actual
   */
  get isLoading(): boolean {
    return this.isLoadingSubject.value;
  }

  /**
   * Obtiene el error actual
   */
  get error(): string | null {
    return this.errorSubject.value;
  }

  /**
   * Obtiene las métricas globales actuales
   */
  get metricasGlobales(): MetricasGlobales | null {
    return this.metricasGlobalesSubject.value;
  }

  /**
   * Obtiene los errores y alertas actuales
   */
  get erroresAlertas(): ErroresAlertas | null {
    return this.erroresAlertasSubject.value;
  }

  /**
   * Obtiene las transacciones actuales
   */
  get transacciones(): TransaccionesRecientes | null {
    return this.transaccionesSubject.value;
  }

  /**
   * Obtiene los cobros recurrentes actuales
   */
  get cobrosRecurrentes(): CobrosRecurrentes | null {
    return this.cobrosRecurrentesSubject.value;
  }

  /**
   * Obtiene las estadísticas de Stripe actuales
   */
  get estadisticasStripe(): EstadisticasStripe | null {
    return this.estadisticasStripeSubject.value;
  }

  /**
   * Obtiene las empresas con suscripciones actuales
   */
  get empresasConSuscripciones(): EmpresasConSuscripciones | null {
    return this.empresasConSuscripcionesSubject.value;
  }
}
