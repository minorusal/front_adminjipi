import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UnconfirmedUsersResponse } from '../types/unconfirmed-users.types';

@Injectable({
  providedIn: 'root'
})
export class UnconfirmedUsersMonitoringService {

  constructor(private http: HttpClient) {}

  /**
   * Obtiene usuarios no confirmados con estatus_registro = 'noconfirmadocontinua'
   * GET /api/cron/unconfirmed-users
   */
  getUnconfirmedUsers(baseUrl: string): Observable<UnconfirmedUsersResponse> {
    const fullUrl = `${baseUrl}/api/cron/unconfirmed-users`;
    console.log('🌐 [SERVICE] GET Request URL:', fullUrl);

    return this.http.get<UnconfirmedUsersResponse>(fullUrl).pipe(
      tap({
        next: (response) => {
          console.log('🌐 [SERVICE] Response from /api/cron/unconfirmed-users:', response);
          console.log('🌐 [SERVICE] Total usuarios no confirmados:', response.data?.estadisticas?.total_no_confirmados);
          console.log('🌐 [SERVICE] Usuarios con empresa:', response.data?.estadisticas?.con_empresa);
          console.log('🌐 [SERVICE] Usuarios sin empresa:', response.data?.estadisticas?.sin_empresa);
          console.log('🌐 [SERVICE] Total empresas afectadas:', response.data?.total_empresas_afectadas);
        },
        error: (error) => {
          console.error('🌐 [SERVICE] Error from /api/cron/unconfirmed-users:', error);
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
      minute: '2-digit'
    });
  }
}
