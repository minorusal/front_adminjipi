import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActiveSessionsResponse, SessionFilters } from '../../shared/types/session.types';

@Injectable({
  providedIn: 'root'
})
export class SessionsService {
  private readonly baseUrl = `${environment.apiUrl}/api/auth/sessions`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las sesiones activas
   */
  getActiveSessions(filters: SessionFilters, baseUrl?: string): Observable<ActiveSessionsResponse> {
    let params = new HttpParams();
    
    // Parámetros de paginación
    params = params.append('page', (filters.page || 1).toString());
    params = params.append('limit', (filters.limit || 10).toString());
    
    // Filtros opcionales
    if (filters.user_id) {
      params = params.append('user_id', filters.user_id.toString());
    }
    if (filters.company_id) {
      params = params.append('company_id', filters.company_id.toString());
    }

    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<ActiveSessionsResponse>(`${apiUrl}/api/auth/sessions/active`, { params });
  }

  /**
   * Obtiene sesiones activas de un usuario específico
   */
  getActiveSessionsByUser(userId: number): Observable<ActiveSessionsResponse> {
    return this.getActiveSessions({ user_id: userId });
  }

  /**
   * Obtiene sesiones activas de una empresa específica
   */
  getActiveSessionsByCompany(companyId: number): Observable<ActiveSessionsResponse> {
    return this.getActiveSessions({ company_id: companyId });
  }
}