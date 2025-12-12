import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, finalize } from 'rxjs';
import { PaquetesMonitoreoService } from '../services/paquetes-monitoreo.service';
import {
  PaqueteMonitoreoDisponible,
  PaqueteMonitoreo,
  PaqueteMonitoreoConModalidad,
  ConfiguracionPrecioMonitoreo,
  ActualizarPrecioMonitoreoRequest,
  ActualizarParametroMonitoreoRequest,
  FiltrosPaquetesMonitoreo
} from '../types/paquetes.types';

@Injectable({
  providedIn: 'root'
})
export class PaquetesMonitoreoFacade {
  // Estado de carga
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Estado de errores
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Paquetes disponibles
  private paquetesDisponiblesSubject = new BehaviorSubject<PaqueteMonitoreo[]>([]);
  public paquetesDisponibles$ = this.paquetesDisponiblesSubject.asObservable();

  // Configuraciones de precios
  private configuracionesPreciosSubject = new BehaviorSubject<ConfiguracionPrecioMonitoreo[]>([]);
  public configuracionesPrecios$ = this.configuracionesPreciosSubject.asObservable();

  // Paquete seleccionado
  private paqueteSeleccionadoSubject = new BehaviorSubject<PaqueteMonitoreo | null>(null);
  public paqueteSeleccionado$ = this.paqueteSeleccionadoSubject.asObservable();

  // Paquete sugerido por clientes
  private paqueteSugeridoSubject = new BehaviorSubject<PaqueteMonitoreoConModalidad | null>(null);
  public paqueteSugerido$ = this.paqueteSugeridoSubject.asObservable();

  constructor(private paquetesService: PaquetesMonitoreoService) {}

  /**
   * Cargar todos los paquetes disponibles
   */
  cargarPaquetesDisponibles(baseUrl: string, filtros?: FiltrosPaquetesMonitoreo): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.paquetesService.getPaquetesDisponibles(baseUrl, filtros)
      .pipe(
        tap((response) => {
          if (!response.error) {
            this.paquetesDisponiblesSubject.next(response.data.paquetes);
            if (response.data.configuraciones) {
              this.configuracionesPreciosSubject.next(response.data.configuraciones);
            }
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
  cargarPaquetePorId(
    baseUrl: string,
    id: number,
    modalidad?: 'mensual' | 'anual'
  ): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.paquetesService.getPaquetePorId(baseUrl, id, modalidad)
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
   * Cargar paquete sugerido según cantidad de clientes
   */
  cargarPaquetePorClientes(baseUrl: string, cantidadClientes: number): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.paquetesService.getPaquetePorClientes(baseUrl, cantidadClientes)
      .pipe(
        tap((response) => {
          if (!response.error) {
            this.paqueteSugeridoSubject.next(response.data);
          } else {
            this.errorSubject.next(response.message);
          }
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe({
        error: (err) => {
          this.errorSubject.next('Error al obtener paquete sugerido: ' + err.message);
          this.loadingSubject.next(false);
        }
      });
  }

  /**
   * Actualizar precio global
   */
  actualizarPrecio(
    baseUrl: string,
    payload: ActualizarPrecioMonitoreoRequest
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
    payload: ActualizarParametroMonitoreoRequest
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
   * Limpiar paquete seleccionado
   */
  clearPaqueteSeleccionado(): void {
    this.paqueteSeleccionadoSubject.next(null);
  }

  /**
   * Limpiar paquete sugerido
   */
  clearPaqueteSugerido(): void {
    this.paqueteSugeridoSubject.next(null);
  }
}
