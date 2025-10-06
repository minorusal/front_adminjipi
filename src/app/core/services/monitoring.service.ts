import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  BlocBlocResponsesResponse, 
  KoneshResponsesResponse, 
  CreditReportsResponse,
  BlocBlocPerformanceAnalysisResponse,
  MonitoringFilters,
  PerformanceFilters,
  MailjetErrorNotificationsResponse,
  MailjetStatsResponse,
  MailjetErrorDetailResponse,
  EmailMonitoringResponse,
  EmailStatsResponse,
  EmailMetricsResponse,
  TopTemplatesResponse,
  RecentFailuresResponse,
  EmailDetailResponse,
  EmailMonitoringFilters 
} from '../../shared/types/monitoring.types';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene responses de BlocBloc
   */
  getBlocBlocResponses(filters: MonitoringFilters, baseUrl?: string): Observable<BlocBlocResponsesResponse> {
    let params = new HttpParams();
    
    // Parámetros de paginación
    params = params.append('page', (filters.page || 1).toString());
    params = params.append('limit', (filters.limit || 10).toString());
    
    // Filtros opcionales
    if (filters.startDate) {
      params = params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.append('endDate', filters.endDate);
    }
    if (filters.http_status) {
      console.log('MonitoringService: http_status filter value:', filters.http_status); // Add this log
      params = params.append('http_status', filters.http_status.toString());
    } else {
      console.log('MonitoringService: http_status filter is NOT set or is falsy:', filters.http_status); // Add this log
    }
    if (filters.konesh_status) {
      params = params.append('konesh_status', filters.konesh_status);
    }
    if (filters.sortBy) {
      params = params.append('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params = params.append('sortOrder', filters.sortOrder);
    }

    const apiUrl = baseUrl || environment.apiUrl;
    console.log('MonitoringService: API URL with params:', `${apiUrl}/api/monitoring/bloc-responses?${params.toString()}`); // Add this log
    return this.http.get<BlocBlocResponsesResponse>(`${apiUrl}/api/monitoring/bloc-responses`, { params });
  }

  /**
   * Obtiene responses de Konesh (SAT)
   */
  getKoneshResponses(filters: MonitoringFilters, baseUrl?: string): Observable<KoneshResponsesResponse> {
    let params = new HttpParams();
    
    // Parámetros de paginación
    params = params.append('page', (filters.page || 1).toString());
    params = params.append('limit', (filters.limit || 10).toString());
    
    // Filtros opcionales
    if (filters.startDate) {
      params = params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.append('endDate', filters.endDate);
    }
    if (filters.http_status) {
      params = params.append('http_status', filters.http_status.toString());
    }
    if (filters.konesh_status) {
      params = params.append('konesh_status', filters.konesh_status);
    }

    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<KoneshResponsesResponse>(`${apiUrl}/api/monitoring/konesh-responses`, { params });
  }

  /**
   * Obtiene reportes de crédito
   */
  getCreditReports(filters: MonitoringFilters, baseUrl?: string): Observable<CreditReportsResponse> {
    let params = new HttpParams();
    
    // Parámetros de paginación
    params = params.append('page', (filters.page || 1).toString());
    params = params.append('limit', (filters.limit || 10).toString());
    
    // Filtros opcionales
    if (filters.startDate) {
      params = params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.append('endDate', filters.endDate);
    }

    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<CreditReportsResponse>(`${apiUrl}/api/reporte-credito`, { params });
  }

  /**
   * Obtiene análisis de rendimiento de BlocBloc (nuevo endpoint optimizado)
   */
  getBlocBlocPerformanceAnalysis(filters: PerformanceFilters, baseUrl?: string): Observable<BlocBlocPerformanceAnalysisResponse> {
    let params = new HttpParams();
    
    // Parámetros de paginación
    params = params.append('page', (filters.page || 1).toString());
    params = params.append('limit', (filters.limit || 10).toString());
    
    // Filtros de rendimiento
    if (filters.startDate) {
      params = params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.append('endDate', filters.endDate);
    }
    if (filters.minResponseTime) {
      params = params.append('minResponseTime', filters.minResponseTime.toString());
    }

    const apiUrl = baseUrl || environment.apiUrl;
    console.log('MonitoringService: Performance Analysis URL with params:', `${apiUrl}/api/monitoring/bloc-responses/performance-analysis?${params.toString()}`);
    return this.http.get<BlocBlocPerformanceAnalysisResponse>(`${apiUrl}/api/monitoring/bloc-responses/performance-analysis`, { params });
  }

  /**
   * Obtiene las notificaciones de error de Mailjet
   */
  getMailjetErrorNotifications(filters: MonitoringFilters, baseUrl?: string): Observable<MailjetErrorNotificationsResponse> {
    let params = new HttpParams();
    
    // Parámetros de paginación
    params = params.append('page', (filters.page || 1).toString());
    params = params.append('limit', (filters.limit || 10).toString());
    
    // Filtros opcionales
    if (filters.startDate) {
      params = params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.append('endDate', filters.endDate);
    }

    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<MailjetErrorNotificationsResponse>(`${apiUrl}/api/mailjet-error-notifications`, { params });
  }

  /**
   * Obtiene las estadísticas de errores de Mailjet
   */
  getMailjetStats(baseUrl?: string): Observable<MailjetStatsResponse> {
    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<MailjetStatsResponse>(`${apiUrl}/api/mailjet-error-notifications/stats`);
  }

  /**
   * Obtiene el detalle de un error específico de Mailjet
   */
  getMailjetErrorDetail(id: number, baseUrl?: string): Observable<MailjetErrorDetailResponse> {
    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<MailjetErrorDetailResponse>(`${apiUrl}/api/mailjet-error-notifications/${id}`);
  }

  /**
   * Limpia las notificaciones de error de Mailjet
   */
  cleanupMailjetErrors(baseUrl?: string): Observable<any> {
    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.delete(`${apiUrl}/api/mailjet-error-notifications/cleanup`);
  }

  // ===== EMAIL MONITORING METHODS =====

  /**
   * Obtiene monitoreo general de emails con filtros avanzados
   */
  getEmailMonitoring(filters: EmailMonitoringFilters, baseUrl?: string): Observable<EmailMonitoringResponse> {
    let params = new HttpParams();
    
    // Parámetros de paginación
    params = params.append('page', (filters.page || 1).toString());
    params = params.append('limit', (filters.limit || 20).toString());
    
    // Filtros de búsqueda
    if (filters.recipient) {
      params = params.append('recipient', filters.recipient);
    }
    if (filters.sender) {
      params = params.append('sender', filters.sender);
    }
    if (filters.subject) {
      params = params.append('subject', filters.subject);
    }
    if (filters.status) {
      params = params.append('status', filters.status);
    }
    if (filters.templateId) {
      params = params.append('templateId', filters.templateId.toString());
    }
    if (filters.tipoOperacion) {
      params = params.append('tipoOperacion', filters.tipoOperacion);
    }
    
    // Filtros de fecha
    if (filters.dateFrom) {
      params = params.append('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params = params.append('dateTo', filters.dateTo);
    }
    
    // Ordenamiento
    if (filters.sortBy) {
      params = params.append('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params = params.append('sortOrder', filters.sortOrder);
    }

    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<EmailMonitoringResponse>(`${apiUrl}/api/email-monitoring`, { params });
  }

  /**
   * Obtiene estadísticas generales de emails
   */
  getEmailStats(baseUrl?: string): Observable<EmailStatsResponse> {
    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<EmailStatsResponse>(`${apiUrl}/api/email-monitoring/stats`);
  }

  /**
   * Obtiene métricas por período
   */
  getEmailMetrics(period: 'daily' | 'hourly' | 'weekly' | 'monthly', days: number, baseUrl?: string): Observable<EmailMetricsResponse> {
    let params = new HttpParams();
    params = params.append('period', period);
    params = params.append('days', days.toString());

    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<EmailMetricsResponse>(`${apiUrl}/api/email-monitoring/metrics`, { params });
  }

  /**
   * Obtiene templates más utilizados
   */
  getTopTemplates(limit: number = 10, baseUrl?: string): Observable<TopTemplatesResponse> {
    let params = new HttpParams();
    params = params.append('limit', limit.toString());

    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<TopTemplatesResponse>(`${apiUrl}/api/email-monitoring/top-templates`, { params });
  }

  /**
   * Obtiene fallos recientes para alertas
   */
  getRecentFailures(hours: number = 24, limit: number = 50, baseUrl?: string): Observable<RecentFailuresResponse> {
    let params = new HttpParams();
    params = params.append('hours', hours.toString());
    params = params.append('limit', limit.toString());

    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<RecentFailuresResponse>(`${apiUrl}/api/email-monitoring/recent-failures`, { params });
  }

  /**
   * Obtiene detalles de un email específico
   */
  getEmailDetail(id: number, baseUrl?: string): Observable<EmailDetailResponse> {
    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<EmailDetailResponse>(`${apiUrl}/api/email-monitoring/${id}`);
  }
}