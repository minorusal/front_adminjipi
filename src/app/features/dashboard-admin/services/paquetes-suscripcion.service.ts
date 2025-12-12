import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { EncryptService } from '../../../core/auth/encrypt.service';
import {
  ApiResponsePaquetes,
  PaqueteSuscripcionDisponible,
  PaqueteSuscripcion,
  ConfiguracionPrecioSuscripcion,
  ActualizarPrecioSuscripcionRequest,
  ActualizarParametroSuscripcionRequest,
  ActualizarPaqueteCompletoRequest,
  FiltrosPaquetesSuscripcion
} from '../types/paquetes.types';

@Injectable({
  providedIn: 'root'
})
export class PaquetesSuscripcionService {
  private readonly BASE_PATH = '/api/paquetes-suscripcion';

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
          console.log('🔐 [SERVICE] Respuesta encriptada (primeros 100 chars):', encryptedResponse.substring(0, 100));
          let decrypted = this.encryptService.decrypt(encryptedResponse);
          console.log('🔓 [SERVICE] Respuesta desencriptada (tipo):', typeof decrypted);

          if (typeof decrypted === 'string') {
            decrypted = JSON.parse(decrypted);
          }

          console.log('📦 [SERVICE] Respuesta parseada:', decrypted);
          return decrypted as ApiResponsePaquetes<T>;
        } catch (error) {
          console.error('❌ [PAQUETES-SUSCRIPCION] Error al descifrar respuesta:', error);
          console.error('❌ [PAQUETES-SUSCRIPCION] Respuesta que causó el error:', encryptedResponse);
          throw new Error('Error al descifrar la respuesta del servidor');
        }
      }),
      catchError((error) => {
        console.error('❌ [PAQUETES-SUSCRIPCION] Error en la petición:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 1. Obtener todos los paquetes disponibles
   * GET /api/paquetes-suscripcion/disponibles
   */
  getPaquetesDisponibles(
    baseUrl: string,
    filtros?: FiltrosPaquetesSuscripcion
  ): Observable<ApiResponsePaquetes<PaqueteSuscripcionDisponible>> {
    const url = `${baseUrl}${this.BASE_PATH}/disponibles`;
    const headers = this.getHeaders(baseUrl);

    let params = new HttpParams();
    if (filtros?.modalidad) {
      params = params.set('modalidad', filtros.modalidad);
    }
    if (filtros?.incluir_parametros !== undefined) {
      params = params.set('incluir_parametros', filtros.incluir_parametros.toString());
    }

    console.log('📦 [PAQUETES-SUSCRIPCION] Obteniendo paquetes disponibles...');

    return this.handleEncryptedResponse<PaqueteSuscripcionDisponible>(
      this.http.get(url, {
        headers,
        params,
        responseType: 'text'
      })
    );
  }

  /**
   * 2. Obtener paquete específico con modalidad
   * GET /api/paquetes-suscripcion/paquete/{nombre}
   */
  getPaquetePorNombre(
    baseUrl: string,
    nombre: string,
    modalidad?: 'mensual' | 'anual'
  ): Observable<ApiResponsePaquetes<PaqueteSuscripcion>> {
    const url = `${baseUrl}${this.BASE_PATH}/paquete/${nombre}`;
    const headers = this.getHeaders(baseUrl);

    let params = new HttpParams();
    if (modalidad) {
      params = params.set('modalidad', modalidad);
    }

    console.log('📦 [PAQUETES-SUSCRIPCION] Obteniendo paquete:', nombre);

    return this.handleEncryptedResponse<PaqueteSuscripcion>(
      this.http.get(url, {
        headers,
        params,
        responseType: 'text'
      })
    );
  }

  /**
   * 3. Obtener configuraciones globales de precios
   * GET /api/paquetes-suscripcion/configuraciones-precios
   */
  getConfiguracionesPrecios(
    baseUrl: string
  ): Observable<ApiResponsePaquetes<ConfiguracionPrecioSuscripcion[]>> {
    const url = `${baseUrl}${this.BASE_PATH}/configuraciones-precios`;
    const headers = this.getHeaders(baseUrl);

    console.log('⚙️ [PAQUETES-SUSCRIPCION] Obteniendo configuraciones de precios...');

    return this.handleEncryptedResponse<ConfiguracionPrecioSuscripcion[]>(
      this.http.get(url, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 4. Actualizar configuración global de precios
   * POST /api/paquetes-suscripcion/actualizar-precio
   */
  actualizarPrecio(
    baseUrl: string,
    payload: ActualizarPrecioSuscripcionRequest
  ): Observable<ApiResponsePaquetes<any>> {
    const url = `${baseUrl}${this.BASE_PATH}/actualizar-precio`;
    const headers = this.getHeaders(baseUrl);

    console.log('💰 [PAQUETES-SUSCRIPCION] Actualizando precio...', payload);

    // Cifrar el payload antes de enviarlo
    const encryptedPayload = this.encryptService.encrypt(payload);

    return this.handleEncryptedResponse<any>(
      this.http.post(url, encryptedPayload, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 5. Actualizar parámetro de paquete
   * POST /api/paquetes-suscripcion/actualizar-parametro
   */
  actualizarParametro(
    baseUrl: string,
    payload: ActualizarParametroSuscripcionRequest
  ): Observable<ApiResponsePaquetes<any>> {
    const url = `${baseUrl}${this.BASE_PATH}/actualizar-parametro`;
    const headers = this.getHeaders(baseUrl);

    console.log('🔧 [PAQUETES-SUSCRIPCION] Actualizando parámetro...', payload);

    // Cifrar el payload antes de enviarlo
    const encryptedPayload = this.encryptService.encrypt(payload);
    console.log('🔐 [PAQUETES-SUSCRIPCION] Payload cifrado (primeros 100 chars):', encryptedPayload.substring(0, 100));

    return this.handleEncryptedResponse<any>(
      this.http.post(url, encryptedPayload, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 6. Actualizar paquete completo
   * PUT /api/paquetes-suscripcion/{id}
   */
  actualizarPaqueteCompleto(
    baseUrl: string,
    id: number,
    payload: ActualizarPaqueteCompletoRequest
  ): Observable<ApiResponsePaquetes<any>> {
    const url = `${baseUrl}${this.BASE_PATH}/${id}`;
    const headers = this.getHeaders(baseUrl);

    console.log('📦 [PAQUETES-SUSCRIPCION] Actualizando paquete completo...', payload);

    // Cifrar el payload antes de enviarlo
    const encryptedPayload = this.encryptService.encrypt(payload);

    return this.handleEncryptedResponse<any>(
      this.http.put(url, encryptedPayload, {
        headers,
        responseType: 'text'
      })
    );
  }
}
