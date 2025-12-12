import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { EncryptService } from '../../../core/auth/encrypt.service';
import {
  ApiResponsePaquetes,
  PaqueteMonitoreoDisponible,
  PaqueteMonitoreoConModalidad,
  PaqueteMonitoreo,
  ConfiguracionPrecioMonitoreo,
  ActualizarPrecioMonitoreoRequest,
  ActualizarParametroMonitoreoRequest,
  FiltrosPaquetesMonitoreo
} from '../types/paquetes.types';

@Injectable({
  providedIn: 'root'
})
export class PaquetesMonitoreoService {
  private readonly BASE_PATH = '/api/paquetes-monitoreo';

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
  private handleEncryptedResponse<T>(obs: Observable<string>): Observable<ApiResponsePaquetes<T>> {
    return obs.pipe(
      map((encryptedResponse: string) => {
        try {
          let decrypted = this.encryptService.decrypt(encryptedResponse);

          if (typeof decrypted === 'string') {
            decrypted = JSON.parse(decrypted);
          }

          return decrypted as ApiResponsePaquetes<T>;
        } catch (error) {
          console.error('❌ [PAQUETES-MONITOREO] Error al descifrar respuesta:', error);
          throw new Error('Error al descifrar la respuesta del servidor');
        }
      }),
      catchError((error) => {
        console.error('❌ [PAQUETES-MONITOREO] Error en la petición:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 1. Obtener todos los paquetes disponibles
   * GET /api/paquetes-monitoreo/disponibles
   */
  getPaquetesDisponibles(
    baseUrl: string,
    filtros?: FiltrosPaquetesMonitoreo
  ): Observable<ApiResponsePaquetes<PaqueteMonitoreoDisponible>> {
    const url = `${baseUrl}${this.BASE_PATH}/disponibles`;
    const headers = this.getHeaders(baseUrl);

    let params = new HttpParams();
    if (filtros?.modalidad) {
      params = params.set('modalidad', filtros.modalidad);
    }
    if (filtros?.incluir_parametros !== undefined) {
      params = params.set('incluir_parametros', filtros.incluir_parametros.toString());
    }

    console.log('📦 [PAQUETES-MONITOREO] Obteniendo paquetes disponibles...');

    return this.handleEncryptedResponse<PaqueteMonitoreoDisponible>(
      this.http.get(url, {
        headers,
        params,
        responseType: 'text'
      })
    );
  }

  /**
   * 2. Obtener paquete específico por ID
   * GET /api/paquetes-monitoreo/paquete/{id}
   */
  getPaquetePorId(
    baseUrl: string,
    id: number,
    modalidad?: 'mensual' | 'anual'
  ): Observable<ApiResponsePaquetes<PaqueteMonitoreo>> {
    const url = `${baseUrl}${this.BASE_PATH}/paquete/${id}`;
    const headers = this.getHeaders(baseUrl);

    let params = new HttpParams();
    if (modalidad) {
      params = params.set('modalidad', modalidad);
    }

    console.log('📦 [PAQUETES-MONITOREO] Obteniendo paquete ID:', id);

    return this.handleEncryptedResponse<PaqueteMonitoreo>(
      this.http.get(url, {
        headers,
        params,
        responseType: 'text'
      })
    );
  }

  /**
   * 3. Obtener configuraciones globales de precios
   * GET /api/paquetes-monitoreo/configuraciones-precios
   */
  getConfiguracionesPrecios(
    baseUrl: string
  ): Observable<ApiResponsePaquetes<ConfiguracionPrecioMonitoreo[]>> {
    const url = `${baseUrl}${this.BASE_PATH}/configuraciones-precios`;
    const headers = this.getHeaders(baseUrl);

    console.log('⚙️ [PAQUETES-MONITOREO] Obteniendo configuraciones de precios...');

    return this.handleEncryptedResponse<ConfiguracionPrecioMonitoreo[]>(
      this.http.get(url, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 4. Obtener paquete sugerido según cantidad de clientes
   * GET /api/paquetes-monitoreo/paquete-por-clientes
   */
  getPaquetePorClientes(
    baseUrl: string,
    cantidadClientes: number
  ): Observable<ApiResponsePaquetes<PaqueteMonitoreoConModalidad>> {
    const url = `${baseUrl}${this.BASE_PATH}/paquete-por-clientes`;
    const headers = this.getHeaders(baseUrl);

    const params = new HttpParams().set('cantidad_clientes', cantidadClientes.toString());

    console.log('📦 [PAQUETES-MONITOREO] Obteniendo paquete por clientes:', cantidadClientes);

    return this.handleEncryptedResponse<PaqueteMonitoreoConModalidad>(
      this.http.get(url, {
        headers,
        params,
        responseType: 'text'
      })
    );
  }

  /**
   * 5. Actualizar configuración global de precios
   * POST /api/paquetes-monitoreo/actualizar-precio
   */
  actualizarPrecio(
    baseUrl: string,
    payload: ActualizarPrecioMonitoreoRequest
  ): Observable<ApiResponsePaquetes<any>> {
    const url = `${baseUrl}${this.BASE_PATH}/actualizar-precio`;
    const headers = this.getHeaders(baseUrl);

    console.log('💰 [PAQUETES-MONITOREO] Actualizando precio...', payload);

    return this.handleEncryptedResponse<any>(
      this.http.post(url, payload, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 6. Actualizar parámetro de paquete
   * POST /api/paquetes-monitoreo/actualizar-parametro
   */
  actualizarParametro(
    baseUrl: string,
    payload: ActualizarParametroMonitoreoRequest
  ): Observable<ApiResponsePaquetes<any>> {
    const url = `${baseUrl}${this.BASE_PATH}/actualizar-parametro`;
    const headers = this.getHeaders(baseUrl);

    console.log('🔧 [PAQUETES-MONITOREO] Actualizando parámetro...', payload);

    return this.handleEncryptedResponse<any>(
      this.http.post(url, payload, {
        headers,
        responseType: 'text'
      })
    );
  }
}
