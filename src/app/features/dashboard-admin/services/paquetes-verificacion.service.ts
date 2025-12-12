import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { EncryptService } from '../../../core/auth/encrypt.service';
import {
  ApiResponsePaquetes,
  PaqueteVerificacion,
  ResumenPaquetesVerificacion,
  ActualizarPrecioVerificacionRequest,
  ActualizarConfiguracionVerificacionRequest,
  CambiarEstadoVerificacionRequest
} from '../types/paquetes.types';

@Injectable({
  providedIn: 'root'
})
export class PaquetesVerificacionService {
  private readonly BASE_PATH = '/api/paquetes-verificacion';

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
          console.error('❌ [PAQUETES-VERIFICACION] Error al descifrar respuesta:', error);
          throw new Error('Error al descifrar la respuesta del servidor');
        }
      }),
      catchError((error) => {
        console.error('❌ [PAQUETES-VERIFICACION] Error en la petición:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 1. Obtener todos los paquetes disponibles
   * GET /api/paquetes-verificacion/disponibles
   */
  getPaquetesDisponibles(
    baseUrl: string,
    tipo?: 'MENSUAL' | 'ANUAL'
  ): Observable<ApiResponsePaquetes<PaqueteVerificacion[]>> {
    const url = `${baseUrl}${this.BASE_PATH}/disponibles`;
    const headers = this.getHeaders(baseUrl);

    let params = new HttpParams();
    if (tipo) {
      params = params.set('tipo', tipo);
    }

    console.log('📦 [PAQUETES-VERIFICACION] Obteniendo paquetes disponibles...');

    return this.handleEncryptedResponse<PaqueteVerificacion[]>(
      this.http.get(url, {
        headers,
        params,
        responseType: 'text'
      })
    );
  }

  /**
   * 2. Obtener paquete específico por ID
   * GET /api/paquetes-verificacion/paquete/{id}
   */
  getPaquetePorId(
    baseUrl: string,
    id: number
  ): Observable<ApiResponsePaquetes<PaqueteVerificacion>> {
    const url = `${baseUrl}${this.BASE_PATH}/paquete/${id}`;
    const headers = this.getHeaders(baseUrl);

    console.log('📦 [PAQUETES-VERIFICACION] Obteniendo paquete ID:', id);

    return this.handleEncryptedResponse<PaqueteVerificacion>(
      this.http.get(url, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 3. Obtener resumen completo de todos los paquetes con estadísticas
   * GET /api/paquetes-verificacion/resumen
   */
  getResumen(
    baseUrl: string
  ): Observable<ApiResponsePaquetes<ResumenPaquetesVerificacion>> {
    const url = `${baseUrl}${this.BASE_PATH}/resumen`;
    const headers = this.getHeaders(baseUrl);

    console.log('📊 [PAQUETES-VERIFICACION] Obteniendo resumen de paquetes...');

    return this.handleEncryptedResponse<ResumenPaquetesVerificacion>(
      this.http.get(url, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 4. Obtener estadísticas de suscripciones por paquete
   * GET /api/paquetes-verificacion/estadisticas-suscripciones
   */
  getEstadisticasSuscripciones(
    baseUrl: string
  ): Observable<ApiResponsePaquetes<any>> {
    const url = `${baseUrl}${this.BASE_PATH}/estadisticas-suscripciones`;
    const headers = this.getHeaders(baseUrl);

    console.log('📈 [PAQUETES-VERIFICACION] Obteniendo estadísticas de suscripciones...');

    return this.handleEncryptedResponse<any>(
      this.http.get(url, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 5. Actualizar precio de un paquete
   * POST /api/paquetes-verificacion/actualizar-precio
   */
  actualizarPrecio(
    baseUrl: string,
    payload: ActualizarPrecioVerificacionRequest
  ): Observable<ApiResponsePaquetes<any>> {
    const url = `${baseUrl}${this.BASE_PATH}/actualizar-precio`;
    const headers = this.getHeaders(baseUrl);

    console.log('💰 [PAQUETES-VERIFICACION] Actualizando precio...', payload);

    return this.handleEncryptedResponse<any>(
      this.http.post(url, payload, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 6. Actualizar configuración de un paquete
   * POST /api/paquetes-verificacion/actualizar-configuracion
   */
  actualizarConfiguracion(
    baseUrl: string,
    payload: ActualizarConfiguracionVerificacionRequest
  ): Observable<ApiResponsePaquetes<any>> {
    const url = `${baseUrl}${this.BASE_PATH}/actualizar-configuracion`;
    const headers = this.getHeaders(baseUrl);

    console.log('🔧 [PAQUETES-VERIFICACION] Actualizando configuración...', payload);

    return this.handleEncryptedResponse<any>(
      this.http.post(url, payload, {
        headers,
        responseType: 'text'
      })
    );
  }

  /**
   * 7. Cambiar estado de un paquete (activar/desactivar)
   * POST /api/paquetes-verificacion/cambiar-estado
   */
  cambiarEstado(
    baseUrl: string,
    payload: CambiarEstadoVerificacionRequest
  ): Observable<ApiResponsePaquetes<any>> {
    const url = `${baseUrl}${this.BASE_PATH}/cambiar-estado`;
    const headers = this.getHeaders(baseUrl);

    console.log('🔄 [PAQUETES-VERIFICACION] Cambiando estado...', payload);

    return this.handleEncryptedResponse<any>(
      this.http.post(url, payload, {
        headers,
        responseType: 'text'
      })
    );
  }
}
