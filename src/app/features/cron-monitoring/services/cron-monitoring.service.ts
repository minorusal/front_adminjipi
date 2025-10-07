import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  CronJobsResponse,
  JobStatusResponse,
  ExecutionLogsResponse,
  ExecutionStatsResponse,
  ExecuteJobResponse,
  ExecutionFilters
} from '../types/cron.types';

@Injectable({
  providedIn: 'root'
})
export class CronMonitoringService {

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los jobs con su información de monitoreo
   * GET /api/cron/jobs
   */
  getAllJobs(baseUrl: string): Observable<CronJobsResponse> {
    return this.http.get<CronJobsResponse>(`${baseUrl}/api/cron/jobs`);
  }

  /**
   * Obtiene el estado detallado de un job específico
   * GET /api/cron/jobs/{jobId}/status
   */
  getJobStatus(jobId: string, baseUrl: string): Observable<JobStatusResponse> {
    return this.http.get<JobStatusResponse>(`${baseUrl}/api/cron/jobs/${jobId}/status`);
  }

  /**
   * Obtiene estadísticas de ejecución de un job específico
   * GET /api/cron/jobs/{jobId}/stats
   */
  getJobStats(jobId: string, baseUrl: string): Observable<ExecutionStatsResponse> {
    const url = `${baseUrl}/api/cron/jobs/${jobId}/stats`;
    console.log('🌐 [SERVICE] GET Request URL:', url);

    return this.http.get<ExecutionStatsResponse>(url).pipe(
      tap({
        next: (response) => {
          console.log('🌐 [SERVICE] ========== RESPONSE FROM STATS ENDPOINT ==========');
          console.log('🌐 [SERVICE] Full response:', response);
          console.log('🌐 [SERVICE] response.error:', response.error);
          console.log('🌐 [SERVICE] response.proxima_ejecucion:', response.proxima_ejecucion);
          console.log('🌐 [SERVICE] response.horario_programado:', response.horario_programado);
          console.log('🌐 [SERVICE] response.ultima_ejecucion_real:', response.ultima_ejecucion_real);
          console.log('🌐 [SERVICE] response.stats:', response.stats);
          console.log('🌐 [SERVICE] response.stats.last_execution:', response.stats?.last_execution);
          console.log('🌐 [SERVICE] ========== END RESPONSE ==========');
        },
        error: (error) => {
          console.error('🌐 [SERVICE] Error from /api/cron/jobs/{jobId}/stats:', error);
          console.error('🌐 [SERVICE] Error status:', error.status);
          console.error('🌐 [SERVICE] Error message:', error.message);
          console.error('🌐 [SERVICE] Error body:', error.error);
        }
      })
    );
  }

  /**
   * Obtiene el historial de ejecuciones con filtros
   * GET /api/cron/executions
   */
  getExecutionLogs(filters: ExecutionFilters, baseUrl: string): Observable<ExecutionLogsResponse> {
    let params = new HttpParams()
      .set('limit', filters.limit.toString())
      .set('offset', filters.offset.toString());

    if (filters.jobId) {
      params = params.set('jobId', filters.jobId);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.executionType) {
      params = params.set('executionType', filters.executionType);
    }
    if (filters.dateRange?.startDate) {
      params = params.set('startDate', filters.dateRange.startDate);
    }
    if (filters.dateRange?.endDate) {
      params = params.set('endDate', filters.dateRange.endDate);
    }

    const fullUrl = `${baseUrl}/api/cron/executions?${params.toString()}`;
    console.log('🌐 [SERVICE] GET Request URL:', fullUrl);
    console.log('🌐 [SERVICE] Params:', params.toString());

    return this.http.get<ExecutionLogsResponse>(`${baseUrl}/api/cron/executions`, { params }).pipe(
      tap({
        next: (response) => {
          console.log('🌐 [SERVICE] Response from /api/cron/executions:', response);
          console.log('🌐 [SERVICE] Response keys:', Object.keys(response));
          console.log('🌐 [SERVICE] Response type:', typeof response);
          console.log('🌐 [SERVICE] Full response structure:', JSON.stringify(response, null, 2));
        },
        error: (error) => {
          console.error('🌐 [SERVICE] Error from /api/cron/executions:', error);
        }
      })
    );
  }

  /**
   * Ejecuta un job manualmente
   * POST /api/cron/jobs/{jobId}/execute
   */
  executeJob(jobId: string, baseUrl: string): Observable<ExecuteJobResponse> {
    const fullUrl = `${baseUrl}/api/cron/jobs/${jobId}/execute`;
    console.log('🌐 [SERVICE] POST Request URL:', fullUrl);

    return this.http.post<ExecuteJobResponse>(fullUrl, {}).pipe(
      tap({
        next: (response) => {
          console.log('🌐 [SERVICE] Response from POST /api/cron/jobs/{jobId}/execute:', response);
        },
        error: (error) => {
          console.error('🌐 [SERVICE] Error from POST /api/cron/jobs/{jobId}/execute:', error);
        }
      })
    );
  }

  /**
   * Parsea el cron expression para obtener descripción legible
   */
  parseCronExpression(cron: string): string {
    // Validar que existe y no es null/undefined
    if (!cron || typeof cron !== 'string') {
      return 'Sin programación definida';
    }

    // Formato: "minuto hora dia mes dia_semana"
    // Ejemplos:
    // "0 18 * * 5" = Todos los viernes a las 18:00
    // "5 10 * * 1" = Todos los lunes a las 10:05

    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      return cron; // Retornar el valor original si no tiene el formato esperado
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Validar que hour y minute son números válidos
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);

    if (isNaN(hourNum) || isNaN(minuteNum)) {
      return cron; // Retornar el valor original si no son números válidos
    }

    const daysOfWeek: { [key: string]: string } = {
      '0': 'Domingo',
      '1': 'Lunes',
      '2': 'Martes',
      '3': 'Miércoles',
      '4': 'Jueves',
      '5': 'Viernes',
      '6': 'Sábado'
    };

    let description = '';

    // Día de la semana
    if (dayOfWeek !== '*' && daysOfWeek[dayOfWeek]) {
      description = `Todos los ${daysOfWeek[dayOfWeek]}`;
    } else if (dayOfMonth !== '*') {
      description = `Día ${dayOfMonth} de cada mes`;
    } else {
      description = 'Todos los días';
    }

    // Hora
    const timeStr = `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;

    description += ` a las ${timeStr}`;

    return description;
  }

  /**
   * Formatea la duración en milisegundos a formato legible
   */
  formatDuration(ms: number | null): string {
    if (!ms) return 'N/A';

    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Formatea el uso de memoria
   */
  formatMemory(mb: string | number | null): string {
    if (!mb) return 'N/A';

    // Convertir a número si es string
    const numValue = typeof mb === 'string' ? parseFloat(mb) : mb;

    if (isNaN(numValue)) return 'N/A';

    return `${numValue.toFixed(2)} MB`;
  }

  /**
   * Calcula el tiempo relativo desde una fecha
   */
  getRelativeTime(dateString: string): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    // Validar que la fecha es válida
    if (isNaN(date.getTime())) {
      console.error('❌ [SERVICE] getRelativeTime: fecha inválida:', dateString);
      return 'N/A';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return `hace ${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  }

  /**
   * Obtiene el color según el status
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'SUCCESS': 'success',
      'ERROR': 'danger',
      'STARTED': 'warning'
    };
    return colors[status] || 'secondary';
  }

  /**
   * Obtiene el icono según el status
   */
  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'SUCCESS': 'fa-check-circle',
      'ERROR': 'fa-times-circle',
      'STARTED': 'fa-spinner fa-spin'
    };
    return icons[status] || 'fa-question-circle';
  }
}
