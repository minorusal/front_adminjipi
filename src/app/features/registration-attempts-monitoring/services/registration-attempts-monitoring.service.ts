import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RegistrationAttemptsResponse, RegistrationFilters, IPAlertsResponse, IPAlertFilters } from '../types/registration-attempts.types';

@Injectable({
  providedIn: 'root'
})
export class RegistrationAttemptsMonitoringService {

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los intentos de registro con filtros y paginación
   * GET /api/cron/registration-attempts
   */
  getRegistrationAttempts(filters: RegistrationFilters, baseUrl: string): Observable<RegistrationAttemptsResponse> {
    let params = new HttpParams()
      .set('limit', filters.limit.toString())
      .set('offset', filters.offset.toString());

    if (filters.fecha_inicio) {
      params = params.set('fecha_inicio', filters.fecha_inicio);
    }
    if (filters.fecha_fin) {
      params = params.set('fecha_fin', filters.fecha_fin);
    }
    if (filters.solo_fallidos !== undefined) {
      params = params.set('solo_fallidos', filters.solo_fallidos.toString());
    }
    if (filters.tipo_fallo) {
      params = params.set('tipo_fallo', filters.tipo_fallo);
    }
    if (filters.rfc) {
      params = params.set('rfc', filters.rfc);
    }
    if (filters.email) {
      params = params.set('email', filters.email);
    }
    if (filters.ip) {
      params = params.set('ip', filters.ip);
    }

    const fullUrl = `${baseUrl}/api/cron/registration-attempts?${params.toString()}`;
    console.log('🌐 [SERVICE] GET Request URL:', fullUrl);

    return this.http.get<RegistrationAttemptsResponse>(`${baseUrl}/api/cron/registration-attempts`, { params }).pipe(
      tap({
        next: (response) => {
          console.log('🌐 [SERVICE] Response from /api/cron/registration-attempts:', response);
          console.log('🌐 [SERVICE] Total intentos:', response.data?.intentos?.paginacion?.total);
          console.log('🌐 [SERVICE] Estadísticas:', response.data?.estadisticas);
        },
        error: (error) => {
          console.error('🌐 [SERVICE] Error from /api/cron/registration-attempts:', error);
        }
      })
    );
  }

  /**
   * Formatea la fecha en formato legible
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Formatea la duración en formato legible
   */
  formatDuration(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return 'N/A';

    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }

  /**
   * Obtiene el color según el estado
   */
  getStatusColor(exitoso: boolean): string {
    return exitoso ? 'success' : 'danger';
  }

  /**
   * Obtiene el icono según el estado
   */
  getStatusIcon(exitoso: boolean): string {
    return exitoso ? 'fa-check-circle' : 'fa-times-circle';
  }

  /**
   * Obtiene el badge class según el tipo de fallo
   */
  getFailureTypeBadge(tipoFallo: string | null): string {
    if (!tipoFallo) return 'bg-secondary';

    const badges: Record<string, string> = {
      'validacion': 'bg-warning',
      'konesh': 'bg-danger',
      'duplicado': 'bg-info',
      'sistema': 'bg-dark',
      'timeout': 'bg-danger'
    };

    return badges[tipoFallo.toLowerCase()] || 'bg-secondary';
  }

  /**
   * Obtiene las alertas de IPs sospechosas
   * GET /api/cron/ip-alerts
   */
  getIPAlerts(filters: IPAlertFilters, baseUrl: string): Observable<IPAlertsResponse> {
    let params = new HttpParams();

    if (filters.horas_analisis !== undefined) {
      params = params.set('horas_analisis', filters.horas_analisis.toString());
    }
    if (filters.min_intentos !== undefined) {
      params = params.set('min_intentos', filters.min_intentos.toString());
    }
    if (filters.solo_alertas !== undefined) {
      params = params.set('solo_alertas', filters.solo_alertas.toString());
    }

    const fullUrl = `${baseUrl}/api/cron/ip-alerts?${params.toString()}`;
    console.log('🌐 [SERVICE] GET Request URL:', fullUrl);

    return this.http.get<IPAlertsResponse>(`${baseUrl}/api/cron/ip-alerts`, { params }).pipe(
      tap({
        next: (response) => {
          console.log('🌐 [SERVICE] Response from /api/cron/ip-alerts:', response);
          console.log('🌐 [SERVICE] Total alertas:', response.data?.alertas?.length);
          console.log('🌐 [SERVICE] Estadísticas:', response.data?.estadisticas);
        },
        error: (error) => {
          console.error('🌐 [SERVICE] Error from /api/cron/ip-alerts:', error);
        }
      })
    );
  }

  /**
   * Obtiene el color del badge según el nivel de riesgo
   */
  getRiskLevelColor(level: string): string {
    const colors: Record<string, string> = {
      'CRÍTICO': 'danger',
      'ALTO': 'warning',
      'MEDIO': 'info',
      'BAJO': 'success'
    };
    return colors[level] || 'secondary';
  }

  /**
   * Obtiene el icono según el nivel de riesgo
   */
  getRiskLevelIcon(level: string): string {
    const icons: Record<string, string> = {
      'CRÍTICO': 'fa-exclamation-circle',
      'ALTO': 'fa-exclamation-triangle',
      'MEDIO': 'fa-info-circle',
      'BAJO': 'fa-check-circle'
    };
    return icons[level] || 'fa-question-circle';
  }

  /**
   * Obtiene el texto en español del tipo de alerta
   */
  getAlertTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'multiple_rfcs': 'Múltiples RFCs',
      'multiple_emails': 'Múltiples Emails',
      'intentos_masivos': 'Intentos Masivos',
      'fuerza_bruta': 'Fuerza Bruta'
    };
    return labels[type] || type;
  }
}
