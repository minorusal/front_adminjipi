import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BitacoraResponse,
  ErrorMetrics,
  EndpointTimeMetrics,
  SessionTraceabilityResponse,
  TopEndpoint,
  UserMetrics,
  TemporalMetrics,
  DashboardMetrics,
  BitacoraFilters,
  ApiResponse,
  SystemOverview,
  EndpointUsageMetrics,
  UserUsageMetrics,
  CompanyUsageMetrics,
  MethodUsageMetrics,
  TimeSeriesData,
  PerformanceMetrics,
  SlowRequest,
  PerformanceTrends,
  ErrorAnalysis,
  ErrorTrends,
  ErrorsByEndpoint,
  ErrorsByUser,
  SecurityMetrics,
  SuspiciousActivity,
  IpAnalysis,
  SecurityAlerts,
  RawLogExportOptions,
  SessionJourney,
  SessionJourneyInfo,
  SessionJourneyResponse,
  RealSessionJourneyResponse,
  SessionAnalytics,
  UserSearchResponse,
  LoginIdsResponse
} from '../types/bitacora.types';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {
  private baseUrl = `${environment.apiUrl}/api/bitacora-endpoints`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener usuarios para el dropdown de búsqueda
   */
  getUsers(search?: string, limit?: number, baseUrl?: string): Observable<UserSearchResponse> {
    const apiUrl = this.getApiUrl(baseUrl);
    let params = new HttpParams();
    
    if (search) {
      params = params.set('search', search);
    }
    if (limit) {
      params = params.set('limit', limit.toString());
    }

    const finalUrl = `${apiUrl}/usuarios`;

    return this.http.get<UserSearchResponse>(finalUrl, { params }).pipe(
      timeout(10000), // 10 second timeout
      catchError(error => {
        console.error('Error in getUsers:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener login IDs de un usuario por fecha
   */
  getUserLoginIds(email: string, fecha: string, baseUrl?: string): Observable<LoginIdsResponse> {
    const apiUrl = this.getApiUrl(baseUrl);
    const params = new HttpParams()
      .set('email', email)
      .set('fecha', fecha);

    return this.http.get<LoginIdsResponse>(`${apiUrl}/loginids`, { params });
  }

  private getApiUrl(customBaseUrl?: string): string {
    return customBaseUrl ? `${customBaseUrl}/api/bitacora-endpoints` : this.baseUrl;
  }

  /**
   * Consulta general de bitácora con filtros avanzados
   */
  getBitacoraRecords(filters: BitacoraFilters = {}, customBaseUrl?: string): Observable<BitacoraResponse> {
    let params = new HttpParams();
    
    // Agregar todos los filtros como parámetros
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof BitacoraFilters];
      if (value !== null && value !== undefined && value !== '') {
        params = params.append(key, value.toString());
      }
    });

    return this.http.get<BitacoraResponse>(this.getApiUrl(customBaseUrl), { params });
  }

  /**
   * Métricas de errores del sistema
   */
  getErrorMetrics(fechaInicio?: string, fechaFin?: string): Observable<ApiResponse<ErrorMetrics>> {
    let params = new HttpParams();
    if (fechaInicio) params = params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.append('fecha_fin', fechaFin);

    return this.http.get<ApiResponse<ErrorMetrics>>(`${this.baseUrl}/metricas/errores`, { params });
  }

  /**
   * Métricas de tiempo por endpoint
   */
  getTimeMetrics(fechaInicio?: string, fechaFin?: string): Observable<ApiResponse<EndpointTimeMetrics[]>> {
    let params = new HttpParams();
    if (fechaInicio) params = params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.append('fecha_fin', fechaFin);

    return this.http.get<ApiResponse<EndpointTimeMetrics[]>>(`${this.baseUrl}/metricas/tiempos`, { params });
  }

  /**
   * Trazabilidad de sesión
   */
  getSessionTraceability(filters: {
    token_session?: string;
    usuario_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    page?: number;
    limit?: number;
  }): Observable<SessionTraceabilityResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof typeof filters];
      if (value !== null && value !== undefined && value !== '') {
        params = params.append(key, value.toString());
      }
    });

    return this.http.get<SessionTraceabilityResponse>(`${this.baseUrl}/trazabilidad/sesion`, { params });
  }

  /**
   * Top endpoints más utilizados
   */
  getTopEndpoints(limit: number = 10): Observable<ApiResponse<TopEndpoint[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<TopEndpoint[]>>(`${this.baseUrl}/metricas/top-endpoints`, { params });
  }

  /**
   * Métricas por usuario
   */
  getUserMetrics(fechaInicio?: string, fechaFin?: string): Observable<ApiResponse<UserMetrics[]>> {
    let params = new HttpParams();
    if (fechaInicio) params = params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.append('fecha_fin', fechaFin);

    return this.http.get<ApiResponse<UserMetrics[]>>(`${this.baseUrl}/metricas/usuarios`, { params });
  }

  /**
   * Métricas temporales (por horas y días)
   */
  getTemporalMetrics(fechaInicio?: string, fechaFin?: string): Observable<ApiResponse<TemporalMetrics>> {
    let params = new HttpParams();
    if (fechaInicio) params = params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.append('fecha_fin', fechaFin);

    return this.http.get<ApiResponse<TemporalMetrics>>(`${this.baseUrl}/metricas/temporales`, { params });
  }

  /**
   * Dashboard resumido con todas las métricas principales
   */
  getDashboardMetrics(customBaseUrl?: string): Observable<ApiResponse<DashboardMetrics>> {
    return this.http.get<ApiResponse<DashboardMetrics>>(`${this.getApiUrl(customBaseUrl)}/dashboard`);
  }

  /**
   * Buscar registros por usuario específico
   */
  searchByUser(userId: number, filters: BitacoraFilters = {}): Observable<BitacoraResponse> {
    return this.getBitacoraRecords({ ...filters, usuario_id: userId });
  }

  /**
   * Buscar registros con errores
   */
  getErrorRecords(filters: BitacoraFilters = {}): Observable<BitacoraResponse> {
    return this.getBitacoraRecords({ ...filters, has_error: true });
  }

  /**
   * Buscar requests lentos (legacy method)
   */
  getSlowRequestsLegacy(minDuration: number = 2000, filters: BitacoraFilters = {}): Observable<BitacoraResponse> {
    return this.getBitacoraRecords({ ...filters, duracion_min: minDuration });
  }

  /**
   * Buscar por endpoint específico
   */
  searchByEndpoint(endpointUrl: string, filters: BitacoraFilters = {}): Observable<BitacoraResponse> {
    return this.getBitacoraRecords({ ...filters, endpoint_url: endpointUrl });
  }

  /**
   * Buscar por rango de fechas
   */
  searchByDateRange(fechaInicio: string, fechaFin: string, filters: BitacoraFilters = {}): Observable<BitacoraResponse> {
    return this.getBitacoraRecords({ ...filters, fecha_inicio: fechaInicio, fecha_fin: fechaFin });
  }

  /**
   * Exportar datos a CSV (simulado)
   */
  exportToCSV(filters: BitacoraFilters = {}, customBaseUrl?: string): Observable<Blob> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof BitacoraFilters];
      if (value !== null && value !== undefined && value !== '') {
        params = params.append(key, value.toString());
      }
    });

    return this.http.get(`${this.getApiUrl(customBaseUrl)}/export/csv`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // ========================================
  // NUEVOS ENDPOINTS IMPLEMENTADOS
  // ========================================

  /**
   * MÉTRICAS OVERVIEW - /metrics/overview
   * Métricas generales del sistema
   */
  getSystemOverview(params?: { period?: string }, customBaseUrl?: string): Observable<ApiResponse<SystemOverview>> {
    let httpParams = new HttpParams();
    if (params?.period) {
      httpParams = httpParams.set('period', params.period);
    }
    return this.http.get<ApiResponse<SystemOverview>>(`${this.getApiUrl(customBaseUrl)}/metrics/overview`, { params: httpParams });
  }

  /**
   * MÉTRICAS DE USO - /metrics/usage/*
   */

  // Métricas de uso por endpoint
  getEndpointUsageMetrics(params?: {
    period?: string;
    limit?: number;
    endpoint?: string;
    method?: string;
  }, customBaseUrl?: string): Observable<ApiResponse<EndpointUsageMetrics[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<EndpointUsageMetrics[]>>(`${this.getApiUrl(customBaseUrl)}/metrics/usage/endpoints`, { params: httpParams });
  }

  // Métricas de uso por usuario
  getUserUsageMetrics(params?: {
    period?: string;
    limit?: number;
    user_id?: number;
    company_id?: number;
  }): Observable<ApiResponse<UserUsageMetrics[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<UserUsageMetrics[]>>(`${this.baseUrl}/metrics/usage/users`, { params: httpParams });
  }

  // Métricas de uso por empresa
  getCompanyUsageMetrics(params?: {
    period?: string;
    limit?: number;
    company_id?: number;
  }): Observable<ApiResponse<CompanyUsageMetrics[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<CompanyUsageMetrics[]>>(`${this.baseUrl}/metrics/usage/companies`, { params: httpParams });
  }

  // Métricas de uso por método HTTP
  getMethodUsageMetrics(params?: { period?: string }): Observable<ApiResponse<MethodUsageMetrics[]>> {
    let httpParams = new HttpParams();
    if (params?.period) {
      httpParams = httpParams.set('period', params.period);
    }
    return this.http.get<ApiResponse<MethodUsageMetrics[]>>(`${this.baseUrl}/metrics/usage/methods`, { params: httpParams });
  }

  // Series temporales de uso
  getUsageTimeSeries(params?: {
    period?: string;
    interval?: string;
    endpoint?: string;
    user_id?: number;
    company_id?: number;
  }): Observable<ApiResponse<TimeSeriesData[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<TimeSeriesData[]>>(`${this.baseUrl}/metrics/usage/timeseries`, { params: httpParams });
  }

  /**
   * MÉTRICAS DE RENDIMIENTO - /metrics/perf/*
   */

  // Métricas detalladas de rendimiento por endpoint
  getPerformanceMetrics(params?: {
    period?: string;
    limit?: number;
    min_requests?: number;
    endpoint?: string;
  }, customBaseUrl?: string): Observable<ApiResponse<PerformanceMetrics[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<PerformanceMetrics[]>>(`${this.getApiUrl(customBaseUrl)}/metrics/perf/endpoints`, { params: httpParams });
  }

  // Requests más lentos
  getSlowRequests(params?: {
    period?: string;
    limit?: number;
    min_duration?: number;
    endpoint?: string;
    user_id?: number;
  }, customBaseUrl?: string): Observable<ApiResponse<SlowRequest[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<SlowRequest[]>>(`${this.getApiUrl(customBaseUrl)}/metrics/perf/slow-requests`, { params: httpParams });
  }

  // Tendencias de rendimiento
  getPerformanceTrends(params?: {
    period?: string;
    comparison_period?: string;
    endpoint?: string;
  }): Observable<ApiResponse<PerformanceTrends[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<PerformanceTrends[]>>(`${this.baseUrl}/metrics/perf/trends`, { params: httpParams });
  }

  /**
   * ANÁLISIS DE ERRORES - /metrics/errors/*
   */

  // Análisis detallado de errores
  getErrorAnalysis(params?: {
    period?: string;
    error_code?: number;
    endpoint?: string;
    user_id?: number;
    limit?: number;
  }, customBaseUrl?: string): Observable<ApiResponse<ErrorAnalysis[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<ErrorAnalysis[]>>(`${this.getApiUrl(customBaseUrl)}/metrics/errors/analysis`, { params: httpParams });
  }

  // Tendencias de errores
  getErrorTrends(params?: {
    period?: string;
    interval?: string;
  }): Observable<ApiResponse<ErrorTrends[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<ErrorTrends[]>>(`${this.baseUrl}/metrics/errors/trends`, { params: httpParams });
  }

  // Errores por endpoint
  getErrorsByEndpoint(params?: {
    period?: string;
    limit?: number;
    min_errors?: number;
  }): Observable<ApiResponse<ErrorsByEndpoint[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<ErrorsByEndpoint[]>>(`${this.baseUrl}/metrics/errors/by-endpoint`, { params: httpParams });
  }

  // Errores por usuario
  getErrorsByUser(params?: {
    period?: string;
    limit?: number;
    min_errors?: number;
    company_id?: number;
  }): Observable<ApiResponse<ErrorsByUser[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<ErrorsByUser[]>>(`${this.baseUrl}/metrics/errors/by-user`, { params: httpParams });
  }

  /**
   * ANÁLISIS DE SEGURIDAD - /metrics/security/*
   */

  // Métricas generales de seguridad
  getSecurityMetrics(params?: { period?: string }, customBaseUrl?: string): Observable<ApiResponse<SecurityMetrics>> {
    let httpParams = new HttpParams();
    if (params?.period) {
      httpParams = httpParams.set('period', params.period);
    }
    return this.http.get<ApiResponse<SecurityMetrics>>(`${this.getApiUrl(customBaseUrl)}/metrics/security/overview`, { params: httpParams });
  }

  // Actividad sospechosa
  getSuspiciousActivity(params?: {
    period?: string;
    risk_level?: string;
    limit?: number;
  }, customBaseUrl?: string): Observable<ApiResponse<SuspiciousActivity[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<SuspiciousActivity[]>>(`${this.getApiUrl(customBaseUrl)}/metrics/security/suspicious`, { params: httpParams });
  }

  // Análisis de IPs
  getIpAnalysis(params?: {
    period?: string;
    ip_address?: string;
    min_requests?: number;
    risk_level?: string;
  }, customBaseUrl?: string): Observable<ApiResponse<IpAnalysis[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<IpAnalysis[]>>(`${this.getApiUrl(customBaseUrl)}/metrics/security/ip-analysis`, { params: httpParams });
  }

  // Alertas de seguridad
  getSecurityAlerts(params?: {
    period?: string;
    severity?: string;
    status?: string;
    limit?: number;
  }, customBaseUrl?: string): Observable<ApiResponse<SecurityAlerts[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<SecurityAlerts[]>>(`${this.getApiUrl(customBaseUrl)}/metrics/security/alerts`, { params: httpParams });
  }

  /**
   * EXPORTACIÓN DE LOGS - /export/raw-logs
   */

  // Exportar logs en bruto
  exportRawLogs(options: RawLogExportOptions = {}, customBaseUrl?: string): Observable<Blob> {
    let params = new HttpParams();
    
    Object.keys(options).forEach(key => {
      const value = options[key as keyof RawLogExportOptions];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          // Para arrays como error_codes
          value.forEach(item => params = params.append(`${key}[]`, item.toString()));
        } else {
          params = params.append(key, value.toString());
        }
      }
    });

    return this.http.get(`${this.getApiUrl(customBaseUrl)}/export/raw-logs`, { 
      params, 
      responseType: 'blob' 
    });
  }

  /**
   * MÉTODOS DE CONVENIENCIA PARA CASOS DE USO COMUNES
   */

  // Dashboard completo con métricas nuevas
  getEnhancedDashboard(customBaseUrl?: string): Observable<{
    overview: SystemOverview;
    topEndpoints: EndpointUsageMetrics[];
    securityMetrics: SecurityMetrics;
    performanceIssues: SlowRequest[];
    recentErrors: ErrorAnalysis[];
  }> {
    // Combinar múltiples llamadas para un dashboard completo
    return new Observable(observer => {
      Promise.all([
        this.getSystemOverview({}, customBaseUrl).toPromise(),
        this.getEndpointUsageMetrics({ limit: 10 }, customBaseUrl).toPromise(),
        this.getSecurityMetrics({}, customBaseUrl).toPromise(),
        this.getSlowRequests({ limit: 5, min_duration: 2000 }, customBaseUrl).toPromise(),
        this.getErrorAnalysis({ limit: 5 }, customBaseUrl).toPromise()
      ]).then(([overview, endpoints, security, slowRequests, errors]) => {
        observer.next({
          overview: overview?.data!,
          topEndpoints: endpoints?.data || [],
          securityMetrics: security?.data!,
          performanceIssues: slowRequests?.data || [],
          recentErrors: errors?.data || []
        });
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  // Alerta de problemas críticos
  getCriticalIssues(): Observable<{
    criticalErrors: ErrorAnalysis[];
    suspiciousIps: SuspiciousActivity[];
    slowEndpoints: PerformanceMetrics[];
    securityAlerts: SecurityAlerts[];
  }> {
    return new Observable(observer => {
      Promise.all([
        this.getErrorAnalysis({ period: '1h' }).toPromise(),
        this.getSuspiciousActivity({ risk_level: 'high', limit: 10 }).toPromise(),
        this.getPerformanceMetrics({ period: '1h', limit: 5 }).toPromise(),
        this.getSecurityAlerts({ severity: 'high', status: 'new', limit: 10 }).toPromise()
      ]).then(([errors, suspicious, performance, alerts]) => {
        observer.next({
          criticalErrors: errors?.data || [],
          suspiciousIps: suspicious?.data || [],
          slowEndpoints: performance?.data || [],
          securityAlerts: alerts?.data || []
        });
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * SESSION JOURNEY - AUDITORÍA MEJORADA
   */

  // Obtener el journey completo de una sesión por loginId
  getSessionJourney(loginId: string, customBaseUrl?: string): Observable<RealSessionJourneyResponse> {
    return this.http.get<RealSessionJourneyResponse>(`${this.getApiUrl(customBaseUrl)}/session-journey/${loginId}`);
  }

  // Buscar sesiones por diferentes criterios
  searchSessions(params?: {
    usuario_id?: number;
    empresa_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    has_algorithm_execution?: boolean;
    razon_fallo?: string;
    page?: number;
    limit?: number;
  }, customBaseUrl?: string): Observable<ApiResponse<{
    sessions: SessionJourneyInfo[];
    pagination: any;
  }>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<{
      sessions: SessionJourneyInfo[];
      pagination: any;
    }>>(`${this.getApiUrl(customBaseUrl)}/sessions/search`, { params: httpParams });
  }

  // Analíticas de sesiones
  getSessionAnalytics(params?: {
    period?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }, customBaseUrl?: string): Observable<ApiResponse<SessionAnalytics>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<SessionAnalytics>>(`${this.getApiUrl(customBaseUrl)}/sessions/analytics`, { params: httpParams });
  }

  // Obtener estadísticas de algoritmo por sesión
  getAlgorithmSessionStats(params?: {
    period?: string;
    usuario_id?: number;
    empresa_id?: number;
  }, customBaseUrl?: string): Observable<ApiResponse<{
    total_executions: number;
    success_rate: number;
    avg_duration: number;
    failure_breakdown: {
      razon_fallo: string;
      count: number;
      percentage: number;
    }[];
    top_users: {
      usuario_email: string;
      executions: number;
      success_rate: number;
    }[];
  }>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.append(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<{
      total_executions: number;
      success_rate: number;
      avg_duration: number;
      failure_breakdown: {
        razon_fallo: string;
        count: number;
        percentage: number;
      }[];
      top_users: {
        usuario_email: string;
        executions: number;
        success_rate: number;
      }[];
    }>>(`${this.getApiUrl(customBaseUrl)}/algorithm/session-stats`, { params: httpParams });
  }

  // Buscar por token de sesión
  getSessionByToken(sessionToken: string, customBaseUrl?: string): Observable<SessionJourneyResponse> {
    const params = new HttpParams().set('session_token', sessionToken);
    return this.http.get<SessionJourneyResponse>(`${this.getApiUrl(customBaseUrl)}/sessions/by-token`, { params });
  }

  // Exportar journey de sesión a PDF/Excel
  exportSessionJourney(loginId: string, format: 'pdf' | 'excel' = 'pdf', customBaseUrl?: string): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    return this.http.get(`${this.getApiUrl(customBaseUrl)}/session-journey/${loginId}/export`, {
      params,
      responseType: 'blob'
    });
  }
}