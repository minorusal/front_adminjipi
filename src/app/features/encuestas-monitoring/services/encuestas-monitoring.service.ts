import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EncuestasResponse, EncuestasFilters, SurveyErrorsResponse } from '../types/encuestas.types';

@Injectable({
  providedIn: 'root'
})
export class EncuestasMonitoringService {

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el listado de encuestas con filtros y paginación
   * GET /api/cron/surveys
   */
  getEncuestas(filters: EncuestasFilters, baseUrl: string): Observable<EncuestasResponse> {
    let params = new HttpParams()
      .set('limit', filters.limit.toString())
      .set('offset', filters.offset.toString());

    if (filters.hasErrors !== undefined) {
      params = params.set('hasErrors', filters.hasErrors.toString());
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    const fullUrl = `${baseUrl}/api/cron/surveys?${params.toString()}`;
    console.log('🌐 [SERVICE] GET Request URL:', fullUrl);

    return this.http.get<EncuestasResponse>(`${baseUrl}/api/cron/surveys`, { params }).pipe(
      tap({
        next: (response) => {
          console.log('🌐 [SERVICE] Response from /api/cron/surveys:', response);
          console.log('🌐 [SERVICE] Total encuestas:', response.total);
          console.log('🌐 [SERVICE] Stats:', response.stats);
        },
        error: (error) => {
          console.error('🌐 [SERVICE] Error from /api/cron/surveys:', error);
        }
      })
    );
  }

  /**
   * Obtiene usuarios sin encuestas y análisis de errores
   * GET /api/cron/survey-errors
   */
  getSurveyErrors(baseUrl: string): Observable<SurveyErrorsResponse> {
    const fullUrl = `${baseUrl}/api/cron/survey-errors`;
    console.log('🌐 [SERVICE] GET Request URL:', fullUrl);

    return this.http.get<SurveyErrorsResponse>(fullUrl).pipe(
      tap({
        next: (response) => {
          console.log('🌐 [SERVICE] Response from /api/cron/survey-errors:', response);
          console.log('🌐 [SERVICE] Total usuarios sin encuestas:', response.total_usuarios_sin_encuestas);
          console.log('🌐 [SERVICE] Analysis:', response.analysis);
        },
        error: (error) => {
          console.error('🌐 [SERVICE] Error from /api/cron/survey-errors:', error);
        }
      })
    );
  }

  /**
   * Formatea la fecha en formato legible
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene el color según si tiene errores
   */
  getStatusColor(hasErrors: boolean): string {
    return hasErrors ? 'danger' : 'success';
  }

  /**
   * Obtiene el icono según si tiene errores
   */
  getStatusIcon(hasErrors: boolean): string {
    return hasErrors ? 'fa-times-circle' : 'fa-check-circle';
  }
}
