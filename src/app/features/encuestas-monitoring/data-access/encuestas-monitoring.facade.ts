import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EncuestasMonitoringService } from '../services/encuestas-monitoring.service';
import { Encuesta, EncuestasStats, EncuestasFilters, SurveyErrorsResponse, UsuarioSinEncuesta, ErrorAnalysis } from '../types/encuestas.types';

@Injectable({ providedIn: 'root' })
export class EncuestasMonitoringFacade {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  private readonly encuestasSubject = new BehaviorSubject<Encuesta[]>([]);
  readonly encuestas$ = this.encuestasSubject.asObservable();

  private readonly statsSubject = new BehaviorSubject<EncuestasStats | null>(null);
  readonly stats$ = this.statsSubject.asObservable();

  private readonly totalRecordsSubject = new BehaviorSubject<number>(0);
  readonly totalRecords$ = this.totalRecordsSubject.asObservable();

  private readonly usuariosSinEncuestasSubject = new BehaviorSubject<UsuarioSinEncuesta[]>([]);
  readonly usuariosSinEncuestas$ = this.usuariosSinEncuestasSubject.asObservable();

  private readonly errorAnalysisSubject = new BehaviorSubject<ErrorAnalysis | null>(null);
  readonly errorAnalysis$ = this.errorAnalysisSubject.asObservable();

  constructor(private encuestasService: EncuestasMonitoringService) {}

  /**
   * Carga las encuestas con filtros
   */
  loadEncuestas(filters: EncuestasFilters, baseUrl: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('🔍 [FACADE] Cargando encuestas con filtros:', filters);
    console.log('🔍 [FACADE] Base URL:', baseUrl);

    this.encuestasService.getEncuestas(filters, baseUrl).pipe(
      tap({
        next: (response) => {
          console.log('✅ [FACADE] Respuesta de /api/cron/surveys:', response);

          this.loadingSubject.next(false);

          if (response.error === false) {
            this.encuestasSubject.next(response.surveys || []);
            this.totalRecordsSubject.next(response.total || 0);
            this.statsSubject.next(response.stats);

            console.log('✅ [FACADE] Encuestas procesadas:', response.surveys.length);
            console.log('✅ [FACADE] Total de registros:', response.total);
            console.log('✅ [FACADE] Stats:', response.stats);
          } else {
            this.errorSubject.next('Error al cargar encuestas');
          }
        },
        error: (error) => {
          console.error('❌ [FACADE] Error al cargar encuestas:', error);
          this.loadingSubject.next(false);
          this.errorSubject.next('Error al cargar encuestas');
        }
      })
    ).subscribe();
  }

  /**
   * Carga usuarios sin encuestas y análisis de errores
   */
  loadSurveyErrors(baseUrl: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('🚨 [FACADE] Cargando usuarios sin encuestas...');
    console.log('🚨 [FACADE] Base URL:', baseUrl);

    this.encuestasService.getSurveyErrors(baseUrl).pipe(
      tap({
        next: (response) => {
          console.log('✅ [FACADE] Respuesta de /api/cron/survey-errors:', response);

          this.loadingSubject.next(false);

          if (response.error === false) {
            this.usuariosSinEncuestasSubject.next(response.usuarios_sin_encuestas || []);
            this.errorAnalysisSubject.next(response.analysis);

            console.log('✅ [FACADE] Usuarios sin encuestas procesados:', response.usuarios_sin_encuestas.length);
            console.log('✅ [FACADE] Analysis:', response.analysis);
          } else {
            this.errorSubject.next('Error al cargar usuarios sin encuestas');
          }
        },
        error: (error) => {
          console.error('❌ [FACADE] Error al cargar usuarios sin encuestas:', error);
          this.loadingSubject.next(false);
          this.errorSubject.next('Error al cargar usuarios sin encuestas');
        }
      })
    ).subscribe();
  }

  /**
   * Limpia el estado
   */
  clearState(): void {
    this.encuestasSubject.next([]);
    this.statsSubject.next(null);
    this.totalRecordsSubject.next(0);
    this.usuariosSinEncuestasSubject.next([]);
    this.errorAnalysisSubject.next(null);
    this.errorSubject.next(null);
  }
}
