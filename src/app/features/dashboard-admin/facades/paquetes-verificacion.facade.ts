import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, finalize } from 'rxjs';
import { PaquetesVerificacionService } from '../services/paquetes-verificacion.service';
import {
  PaqueteVerificacion,
  ResumenPaquetesVerificacion,
  ActualizarPrecioVerificacionRequest,
  ActualizarConfiguracionVerificacionRequest,
  CambiarEstadoVerificacionRequest
} from '../types/paquetes.types';

@Injectable({
  providedIn: 'root'
})
export class PaquetesVerificacionFacade {
  // Estado de carga
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Estado de errores
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Paquetes disponibles
  private paquetesDisponiblesSubject = new BehaviorSubject<PaqueteVerificacion[]>([]);
  public paquetesDisponibles$ = this.paquetesDisponiblesSubject.asObservable();

  // Resumen completo
  private resumenSubject = new BehaviorSubject<ResumenPaquetesVerificacion | null>(null);
  public resumen$ = this.resumenSubject.asObservable();

  // Paquete seleccionado
  private paqueteSeleccionadoSubject = new BehaviorSubject<PaqueteVerificacion | null>(null);
  public paqueteSeleccionado$ = this.paqueteSeleccionadoSubject.asObservable();

  // Estadísticas de suscripciones
  private estadisticasSuscripcionesSubject = new BehaviorSubject<any>(null);
  public estadisticasSuscripciones$ = this.estadisticasSuscripcionesSubject.asObservable();

  constructor(private paquetesService: PaquetesVerificacionService) {}

  /**
   * Cargar todos los paquetes disponibles
   */
  cargarPaquetesDisponibles(baseUrl: string, tipo?: 'MENSUAL' | 'ANUAL'): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.paquetesService.getPaquetesDisponibles(baseUrl, tipo)
      .pipe(
        tap((response) => {
          if (!response.error) {
            this.paquetesDisponiblesSubject.next(response.data);
          } else {
            this.errorSubject.next(response.message);
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe({
        error: (err) => {
          this.errorSubject.next('Error al cargar paquetes: ' + err.message);
          this.loadingSubject.next(false);
        }
      });
  }

  /**
   * Cargar un paquete específico por ID
   */
  cargarPaquetePorId(baseUrl: string, id: number): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.paquetesService.getPaquetePorId(baseUrl, id)
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
   * Cargar resumen completo con estadísticas
   */
  cargarResumen(baseUrl: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.paquetesService.getResumen(baseUrl)
      .pipe(
        tap((response) => {
          if (!response.error) {
            this.resumenSubject.next(response.data);
            // También actualizar la lista de paquetes
            this.paquetesDisponiblesSubject.next(response.data.paquetes);
          } else {
            this.errorSubject.next(response.message);
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe({
        error: (err) => {
          this.errorSubject.next('Error al cargar resumen: ' + err.message);
          this.loadingSubject.next(false);
        }
      });
  }

  /**
   * Cargar estadísticas de suscripciones
   */
  cargarEstadisticasSuscripciones(baseUrl: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.paquetesService.getEstadisticasSuscripciones(baseUrl)
      .pipe(
        tap((response) => {
          if (!response.error) {
            this.estadisticasSuscripcionesSubject.next(response.data);
          } else {
            this.errorSubject.next(response.message);
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe({
        error: (err) => {
          this.errorSubject.next('Error al cargar estadísticas: ' + err.message);
          this.loadingSubject.next(false);
        }
      });
  }

  /**
   * Actualizar precio de un paquete
   */
  actualizarPrecio(
    baseUrl: string,
    payload: ActualizarPrecioVerificacionRequest
  ): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.paquetesService.actualizarPrecio(baseUrl, payload)
      .pipe(
        tap((response) => {
          if (response.error) {
            this.errorSubject.next(response.message);
          } else {
            // Recargar resumen después de actualizar
            this.cargarResumen(baseUrl);
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Actualizar configuración de un paquete
   */
  actualizarConfiguracion(
    baseUrl: string,
    payload: ActualizarConfiguracionVerificacionRequest
  ): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.paquetesService.actualizarConfiguracion(baseUrl, payload)
      .pipe(
        tap((response) => {
          if (response.error) {
            this.errorSubject.next(response.message);
          } else {
            // Recargar paquetes después de actualizar
            this.cargarResumen(baseUrl);
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Cambiar estado de un paquete (activar/desactivar)
   */
  cambiarEstado(
    baseUrl: string,
    payload: CambiarEstadoVerificacionRequest
  ): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.paquetesService.cambiarEstado(baseUrl, payload)
      .pipe(
        tap((response) => {
          if (response.error) {
            this.errorSubject.next(response.message);
          } else {
            // Recargar paquetes después de cambiar estado
            this.cargarResumen(baseUrl);
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
   * Limpiar paquete seleccionado
   */
  clearPaqueteSeleccionado(): void {
    this.paqueteSeleccionadoSubject.next(null);
  }
}
