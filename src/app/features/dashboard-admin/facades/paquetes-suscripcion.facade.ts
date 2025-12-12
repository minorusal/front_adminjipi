import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, finalize } from 'rxjs';
import { PaquetesSuscripcionService } from '../services/paquetes-suscripcion.service';
import {
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
export class PaquetesSuscripcionFacade {
  // Estado de carga
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Estado de errores
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Paquetes disponibles
  private paquetesDisponiblesSubject = new BehaviorSubject<PaqueteSuscripcion[]>([]);
  public paquetesDisponibles$ = this.paquetesDisponiblesSubject.asObservable();

  // Configuraciones de precios
  private configuracionesPreciosSubject = new BehaviorSubject<ConfiguracionPrecioSuscripcion[]>([]);
  public configuracionesPrecios$ = this.configuracionesPreciosSubject.asObservable();

  // Paquete seleccionado
  private paqueteSeleccionadoSubject = new BehaviorSubject<PaqueteSuscripcion | null>(null);
  public paqueteSeleccionado$ = this.paqueteSeleccionadoSubject.asObservable();

  constructor(private paquetesService: PaquetesSuscripcionService) {}

  /**
   * Cargar todos los paquetes disponibles
   */
  cargarPaquetesDisponibles(baseUrl: string, filtros?: FiltrosPaquetesSuscripcion): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.paquetesService.getPaquetesDisponibles(baseUrl, filtros)
      .pipe(
        tap((response) => {
          console.log('📦 [FACADE] Respuesta del servicio:', response);
          if (!response.error && response.data) {
            console.log('📦 [FACADE] Data completa:', response.data);
            if (response.data.paquetes) {
              this.paquetesDisponiblesSubject.next(response.data.paquetes);
              console.log('📦 [FACADE] Paquetes guardados:', response.data.paquetes);
            } else {
              console.warn('⚠️ [FACADE] No se encontró el array de paquetes en response.data');
            }
            if (response.data.configuraciones) {
              this.configuracionesPreciosSubject.next(response.data.configuraciones);
            }
          } else {
            console.error('❌ [FACADE] Error en respuesta:', response);
            this.errorSubject.next(response.message || 'Error desconocido al cargar paquetes');
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe({
        error: (err) => {
          console.error('❌ [FACADE] Error en subscribe:', err);
          this.errorSubject.next('Error al cargar paquetes: ' + err.message);
          this.loadingSubject.next(false);
        }
      });
  }

  /**
   * Cargar un paquete específico por nombre
   */
  cargarPaquetePorNombre(
    baseUrl: string,
    nombre: string,
    modalidad?: 'mensual' | 'anual'
  ): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.paquetesService.getPaquetePorNombre(baseUrl, nombre, modalidad)
      .pipe(
        tap((response) => {
          if (!response.error) {
            this.paqueteSeleccionadoSubject.next(response.data);
          } else {
            this.errorSubject.next(response.message);
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe({
        error: (err) => {
          this.errorSubject.next('Error al cargar paquete: ' + err.message);
          this.loadingSubject.next(false);
        }
      });
  }

  /**
   * Cargar configuraciones de precios globales
   */
  cargarConfiguracionesPrecios(baseUrl: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.paquetesService.getConfiguracionesPrecios(baseUrl)
      .pipe(
        tap((response) => {
          if (!response.error) {
            this.configuracionesPreciosSubject.next(response.data);
          } else {
            this.errorSubject.next(response.message);
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe({
        error: (err) => {
          this.errorSubject.next('Error al cargar configuraciones: ' + err.message);
          this.loadingSubject.next(false);
        }
      });
  }

  /**
   * Actualizar precio global
   */
  actualizarPrecio(
    baseUrl: string,
    payload: ActualizarPrecioSuscripcionRequest
  ): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.paquetesService.actualizarPrecio(baseUrl, payload)
      .pipe(
        tap((response) => {
          if (response.error) {
            this.errorSubject.next(response.message);
          } else {
            // Recargar configuraciones después de actualizar
            this.cargarConfiguracionesPrecios(baseUrl);
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Actualizar parámetro de paquete
   */
  actualizarParametro(
    baseUrl: string,
    payload: ActualizarParametroSuscripcionRequest
  ): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.paquetesService.actualizarParametro(baseUrl, payload)
      .pipe(
        tap((response) => {
          if (response.error) {
            this.errorSubject.next(response.message);
          } else {
            // Recargar paquetes después de actualizar
            this.cargarPaquetesDisponibles(baseUrl);
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Limpiar error
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Actualizar paquete completo
   */
  actualizarPaqueteCompleto(
    baseUrl: string,
    id: number,
    payload: ActualizarPaqueteCompletoRequest
  ): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.paquetesService.actualizarPaqueteCompleto(baseUrl, id, payload)
      .pipe(
        tap((response) => {
          if (response.error) {
            this.errorSubject.next(response.message);
          } else {
            // Recargar paquetes después de actualizar
            this.cargarPaquetesDisponibles(baseUrl);
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Limpiar paquete seleccionado
   */
  clearPaqueteSeleccionado(): void {
    this.paqueteSeleccionadoSubject.next(null);
  }
}
