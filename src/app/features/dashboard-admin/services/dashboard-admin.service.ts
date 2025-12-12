import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { EncryptService } from '../../../core/auth/encrypt.service';
import {
  ApiResponse,
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
export class DashboardAdminService {
  private readonly BASE_PATH = '/api/dashboard-admin';

  constructor(
    private http: HttpClient,
    private encryptService: EncryptService
  ) {}

  /**
   * Obtiene los headers necesarios para las peticiones
   */
  private getHeaders(baseUrl: string): HttpHeaders {
    const token = localStorage.getItem('sessionToken');
    return new HttpHeaders({
      'mc-token': `Bearer ${token}`
    });
  }

  /**
   * Método auxiliar para manejar respuestas cifradas
   */
  private handleEncryptedResponse<T>(obs: Observable<string>): Observable<ApiResponse<T>> {
    return obs.pipe(
      map((encryptedResponse: string) => {
        try {
          console.log('🔐 [DASHBOARD-ADMIN] Respuesta cifrada recibida (primeros 100 chars):', encryptedResponse.substring(0, 100));
          console.log('🔐 [DASHBOARD-ADMIN] Longitud de respuesta:', encryptedResponse.length);

          // Descifrar la respuesta
          let decrypted = this.encryptService.decrypt(encryptedResponse);
          console.log('🔐 [DASHBOARD-ADMIN] Tipo de dato descifrado:', typeof decrypted);
          console.log('✅ [DASHBOARD-ADMIN] Respuesta descifrada:', decrypted);

          // Si el descifrado retorna un string, parsearlo a objeto
          if (typeof decrypted === 'string') {
            console.log('🔄 [DASHBOARD-ADMIN] Parseando string JSON a objeto...');
            decrypted = JSON.parse(decrypted);
            console.log('✅ [DASHBOARD-ADMIN] JSON parseado correctamente');
          }

          console.log('🔍 [DASHBOARD-ADMIN] Verificando propiedades del objeto:');
          console.log('  - error:', decrypted.error);
          console.log('  - message:', decrypted.message);
          console.log('  - data:', decrypted.data ? 'Presente' : 'Ausente');

          return decrypted as ApiResponse<T>;
        } catch (error) {
          console.error('❌ [DASHBOARD-ADMIN] Error al descifrar respuesta:', error);
          console.error('❌ [DASHBOARD-ADMIN] Respuesta que causó el error:', encryptedResponse);
          throw new Error('Error al descifrar la respuesta del servidor');
        }
      }),
      catchError((error) => {
        console.error('❌ [DASHBOARD-ADMIN] Error en la petición:', error);
        if (error.status) {
          console.error('❌ [DASHBOARD-ADMIN] Status HTTP:', error.status);
          console.error('❌ [DASHBOARD-ADMIN] Mensaje:', error.message);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * 1. Obtiene métricas globales
   * GET /api/dashboard-admin/metricas-globales
   */
  getMetricasGlobales(baseUrl: string): Observable<ApiResponse<MetricasGlobales>> {
    const url = `${baseUrl}${this.BASE_PATH}/metricas-globales`;
    const headers = this.getHeaders(baseUrl);

    console.log('📊 [DASHBOARD-ADMIN] Obteniendo métricas globales...');
    console.log('📊 [DASHBOARD-ADMIN] URL:', url);

    return this.handleEncryptedResponse<MetricasGlobales>(
      this.http.get(url, {
        headers,
        responseType: 'text' // Importante: la respuesta es texto cifrado
      })
    );
  }

  /**
   * 2. Obtiene errores y alertas
   * GET /api/dashboard-admin/errores-alertas
   */
  getErroresAlertas(baseUrl: string): Observable<ApiResponse<ErroresAlertas>> {
    const url = `${baseUrl}${this.BASE_PATH}/errores-alertas`;
    const headers = this.getHeaders(baseUrl);

    console.log('🚨 [DASHBOARD-ADMIN] Obteniendo errores y alertas...');
    console.log('🚨 [DASHBOARD-ADMIN] URL:', url);

    return this.handleEncryptedResponse<ErroresAlertas>(
      this.http.get(url, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 3. Obtiene transacciones recientes con filtros
   * GET /api/dashboard-admin/transacciones-recientes
   */
  getTransaccionesRecientes(
    baseUrl: string,
    filtros?: FiltrosTransacciones
  ): Observable<ApiResponse<TransaccionesRecientes>> {
    const url = `${baseUrl}${this.BASE_PATH}/transacciones-recientes`;
    const headers = this.getHeaders(baseUrl);

    let params = new HttpParams();
    if (filtros?.limite) {
      params = params.set('limite', filtros.limite.toString());
    }
    if (filtros?.tipo && filtros.tipo !== 'todas') {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros?.estatus && filtros.estatus !== 'todos') {
      params = params.set('estatus', filtros.estatus);
    }

    console.log('💳 [DASHBOARD-ADMIN] Obteniendo transacciones recientes...');
    console.log('💳 [DASHBOARD-ADMIN] URL:', url);
    console.log('💳 [DASHBOARD-ADMIN] Filtros:', filtros);

    return this.handleEncryptedResponse<TransaccionesRecientes>(
      this.http.get(url, {
        headers,
        params,
        responseType: 'text'
      })
    );
  }

  /**
   * 4. Obtiene estado de cobros recurrentes
   * GET /api/dashboard-admin/cobros-recurrentes
   */
  getCobrosRecurrentes(baseUrl: string): Observable<ApiResponse<CobrosRecurrentes>> {
    const url = `${baseUrl}${this.BASE_PATH}/cobros-recurrentes`;
    const headers = this.getHeaders(baseUrl);

    console.log('🔄 [DASHBOARD-ADMIN] Obteniendo cobros recurrentes...');
    console.log('🔄 [DASHBOARD-ADMIN] URL:', url);

    return this.handleEncryptedResponse<CobrosRecurrentes>(
      this.http.get(url, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 5. Obtiene estadísticas avanzadas de Stripe
   * GET /api/dashboard-admin/estadisticas-stripe
   */
  getEstadisticasStripe(
    baseUrl: string,
    filtros?: FiltrosEstadisticas
  ): Observable<ApiResponse<EstadisticasStripe>> {
    const url = `${baseUrl}${this.BASE_PATH}/estadisticas-stripe`;
    const headers = this.getHeaders(baseUrl);

    let params = new HttpParams();
    if (filtros?.periodo) {
      params = params.set('periodo', filtros.periodo.toString());
    }

    console.log('📈 [DASHBOARD-ADMIN] Obteniendo estadísticas de Stripe...');
    console.log('📈 [DASHBOARD-ADMIN] URL:', url);
    console.log('📈 [DASHBOARD-ADMIN] Periodo:', filtros?.periodo || 30);

    return this.handleEncryptedResponse<EstadisticasStripe>(
      this.http.get(url, {
        headers,
        params,
        responseType: 'text'
      })
    );
  }

  /**
   * 6. Obtiene empresas con todas sus suscripciones
   * GET /api/dashboard-admin/empresas-con-suscripciones
   */
  getEmpresasConSuscripciones(
    baseUrl: string,
    filtros?: FiltrosEmpresasSuscripciones
  ): Observable<ApiResponse<EmpresasConSuscripciones>> {
    const url = `${baseUrl}${this.BASE_PATH}/empresas-con-suscripciones`;
    const headers = this.getHeaders(baseUrl);

    let params = new HttpParams();
    if (filtros?.limite) {
      params = params.set('limite', filtros.limite.toString());
    }
    if (filtros?.emp_id) {
      params = params.set('emp_id', filtros.emp_id.toString());
    }
    if (filtros?.estado_suscripcion && filtros.estado_suscripcion !== 'todas') {
      params = params.set('estado_suscripcion', filtros.estado_suscripcion);
    }

    console.log('🏢 [DASHBOARD-ADMIN] Obteniendo empresas con suscripciones...');
    console.log('🏢 [DASHBOARD-ADMIN] URL:', url);
    console.log('🏢 [DASHBOARD-ADMIN] Filtros:', filtros);

    return this.handleEncryptedResponse<EmpresasConSuscripciones>(
      this.http.get(url, {
        headers,
        params,
        responseType: 'text'
      })
    );
  }

  /**
   * Función auxiliar para formatear fechas
   */
  formatDate(dateString: string): string {
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
   * Función auxiliar para formatear montos
   */
  formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(num);
  }

  /**
   * Función auxiliar para obtener color según severidad
   */
  getSeverityColor(severity: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA'): string {
    const colors = {
      'CRITICA': 'danger',
      'ALTA': 'warning',
      'MEDIA': 'info',
      'BAJA': 'secondary'
    };
    return colors[severity] || 'secondary';
  }

  /**
   * Función auxiliar para obtener icono según tipo de transacción
   */
  getTransactionIcon(tipo: string): string {
    const icons: { [key: string]: string } = {
      'pago_inicial': 'fa-credit-card',
      'cobro_recurrente': 'fa-sync-alt',
      'upgrade': 'fa-arrow-up',
      'downgrade': 'fa-arrow-down',
      'reintento_cobro': 'fa-redo'
    };
    return icons[tipo] || 'fa-dollar-sign';
  }

  /**
   * Función auxiliar para obtener color según estado
   */
  getStatusColor(estatus: string): string {
    const colors: { [key: string]: string } = {
      'exitoso': 'success',
      'fallido': 'danger',
      'pendiente': 'warning',
      'reembolsado': 'info'
    };
    return colors[estatus] || 'secondary';
  }
}
