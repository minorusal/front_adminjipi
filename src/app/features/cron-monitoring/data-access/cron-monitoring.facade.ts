import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, forkJoin, of } from 'rxjs';
import { tap, switchMap, startWith, map, catchError } from 'rxjs';
import { CronMonitoringService } from '../services/cron-monitoring.service';
import {
  CronJob,
  JobMonitoring,
  ExecutionLog,
  ExecutionFilters,
  JobExecutionStats,
  ExecutionStatsResponse,
  ExecutionLogsResponse
} from '../types/cron.types';

@Injectable({ providedIn: 'root' })
export class CronMonitoringFacade {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  private readonly jobsSubject = new BehaviorSubject<JobMonitoring[]>([]);
  readonly jobs$ = this.jobsSubject.asObservable();

  private readonly executionLogsSubject = new BehaviorSubject<ExecutionLog[]>([]);
  readonly executionLogs$ = this.executionLogsSubject.asObservable();

  private readonly jobStatsSubject = new BehaviorSubject<any>(null);
  readonly jobStats$ = this.jobStatsSubject.asObservable();

  private readonly totalRecordsSubject = new BehaviorSubject<number>(0);
  readonly totalRecords$ = this.totalRecordsSubject.asObservable();

  private autoRefreshEnabled = false;
  private autoRefreshSubscription: any;

  constructor(private cronService: CronMonitoringService) {}

  /**
   * Carga todos los jobs con información enriquecida
   */
  loadJobs(baseUrl: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.cronService.getAllJobs(baseUrl).pipe(
      tap({
        next: (response) => {
          console.log('Response from /api/cron/jobs:', response);

          if (response.error) {
            this.loadingSubject.next(false);
            this.errorSubject.next('Error al obtener los jobs del servidor');
            this.jobsSubject.next([]);
            return;
          }

          if (!response.jobs || response.jobs.length === 0) {
            this.loadingSubject.next(false);
            this.jobsSubject.next([]);
            return;
          }

          // Enriquecer jobs con información adicional
          this.enrichJobs(response.jobs, baseUrl);
        },
        error: (error) => {
          this.loadingSubject.next(false);
          this.errorSubject.next('Error al cargar los jobs');
          console.error('Load jobs error:', error);
        }
      })
    ).subscribe();
  }

  /**
   * Enriquece los jobs con estado y ejecuciones recientes
   */
  private enrichJobs(jobs: CronJob[], baseUrl: string): void {
    const jobRequests = jobs.map(job =>
      forkJoin({
        job: Promise.resolve(job),
        stats: this.cronService.getJobStats(job.job_id, baseUrl).pipe(
          tap(res => console.log(`Stats for ${job.job_id}:`, res)),
          catchError(error => {
            console.error(`❌ Error obteniendo stats para ${job.job_id}:`, error);
            // Retornar estructura vacía en caso de error
            return of({
              error: true,
              job_id: job.job_id,
              stats: {
                total_executions: 0,
                successful_executions: 0,
                failed_executions: 0,
                manual_executions: 0,
                automatic_executions: 0,
                success_rate: 0,
                failure_rate: 0,
                avg_duration_ms: 0,
                max_duration_ms: 0,
                min_duration_ms: 0,
                avg_memory_mb: 0,
                last_execution: null
              }
            } as ExecutionStatsResponse);
          })
        ),
        logs: this.cronService.getExecutionLogs(
          { jobId: job.job_id, limit: 5, offset: 0 },
          baseUrl
        ).pipe(
          tap(res => console.log(`Logs for ${job.job_id}:`, res)),
          catchError(error => {
            console.error(`❌ Error obteniendo logs para ${job.job_id}:`, error);
            // Retornar estructura vacía en caso de error
            return of({
              error: true,
              executions: [],
              total: 0,
              limit: 5,
              offset: 0
            } as ExecutionLogsResponse);
          })
        )
      }).pipe(
        map(({ job, stats, logs }) => {
          // Determinar última ejecución: priorizar ultima_ejecucion_real
          let lastExecution: string | undefined;
          if (stats.error === false && stats.ultima_ejecucion_real) {
            lastExecution = stats.ultima_ejecucion_real;
            console.log(`✅ [FACADE] Job ${job.job_id}: usando ultima_ejecucion_real =`, stats.ultima_ejecucion_real);
          } else if (stats.error === false && stats.stats?.last_execution) {
            lastExecution = stats.stats.last_execution.start_time;
            console.log(`⚠️ [FACADE] Job ${job.job_id}: usando stats.last_execution.start_time =`, stats.stats.last_execution.start_time);
          } else {
            lastExecution = undefined;
            console.log(`❌ [FACADE] Job ${job.job_id}: sin última ejecución`);
          }

          const enrichedJob: JobMonitoring = {
            ...job,
            last_execution: lastExecution,
            next_execution: stats.error === false && stats.proxima_ejecucion ? stats.proxima_ejecucion : undefined,
            recent_executions: logs.error === false ? logs.executions : []
          };

          // Calcular success rate desde stats o desde logs
          if (stats.error === false && stats.stats?.success_rate !== undefined) {
            enrichedJob.success_rate = stats.stats.success_rate.toString();
          } else if (logs.error === false && logs.executions.length > 0) {
            const successCount = logs.executions.filter(e => e.status === 'SUCCESS').length;
            enrichedJob.success_rate = ((successCount / logs.executions.length) * 100).toFixed(1);
          } else {
            enrichedJob.success_rate = '0';
          }

          return enrichedJob;
        })
      )
    );

    forkJoin(jobRequests).subscribe({
      next: (enrichedJobs) => {
        this.loadingSubject.next(false);
        console.log('Enriched jobs:', enrichedJobs);

        // Log para diagnosticar el problema de NaN
        enrichedJobs.forEach(job => {
          console.log(`Job ${job.job_id}:`, {
            nombre: job.nombre_job,
            frecuencia: job.frecuencia,
            frecuencia_type: typeof job.frecuencia,
            estatus: job.estatus
          });
        });

        this.jobsSubject.next(enrichedJobs);
      },
      error: (error) => {
        this.loadingSubject.next(false);
        this.errorSubject.next('Error al enriquecer los jobs');
        console.error('Enrich jobs error:', error);
      }
    });
  }

  /**
   * Carga las estadísticas de un job específico
   */
  loadJobStats(jobId: string, baseUrl: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('📊 [FACADE] Cargando estadísticas para job:', jobId);

    this.cronService.getJobStats(jobId, baseUrl).pipe(
      tap({
        next: (response) => {
          console.log('📊 [FACADE] Respuesta de /api/cron/jobs/{jobId}/stats:', response);

          this.loadingSubject.next(false);
          if (response.error === false) {
            console.log('📊 [FACADE] Estadísticas procesadas:', response);
            // Enviar la respuesta completa, no solo stats
            this.jobStatsSubject.next(response);
          } else {
            this.errorSubject.next('Error al obtener estadísticas');
          }
        },
        error: (error) => {
          console.error('❌ [FACADE] Error al cargar estadísticas:', error);
          this.loadingSubject.next(false);
          this.errorSubject.next('Error al cargar estadísticas');
        }
      })
    ).subscribe();
  }

  /**
   * Carga el historial de ejecuciones con filtros
   */
  loadExecutionLogs(filters: ExecutionFilters, baseUrl: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('🔍 [FACADE] Cargando ejecuciones con filtros:', filters);
    console.log('🔍 [FACADE] Base URL:', baseUrl);

    this.cronService.getExecutionLogs(filters, baseUrl).pipe(
      tap({
        next: (response: any) => {
          console.log('✅ [FACADE] Respuesta de /api/cron/executions:', response);
          console.log('✅ [FACADE] response.ok:', response.ok);
          console.log('✅ [FACADE] response.error:', response.error);
          console.log('✅ [FACADE] response.data:', response.data);

          this.loadingSubject.next(false);

          // Manejar diferentes estructuras de respuesta
          let executions: ExecutionLog[] = [];
          let total = 0;

          // Estructura Real: { error: false, executions: [], total: 0, limit: 20, offset: 0 }
          if (response.error === false && response.executions) {
            executions = response.executions || [];
            total = response.total || 0;
            console.log('✅ [FACADE] Estructura detectada: { error: false, executions, total } ← ESTRUCTURA REAL');
          }
          // Estructura 1: { ok: true, data: { executions: [], total: 0 } }
          else if (response.ok && response.data) {
            executions = response.data.executions || [];
            total = response.data.total || 0;
            console.log('✅ [FACADE] Estructura detectada: { ok, data }');
          }
          // Estructura 2: { error: false, data: { executions: [], total: 0 } }
          else if (response.error === false && response.data) {
            executions = response.data.executions || [];
            total = response.data.total || 0;
            console.log('✅ [FACADE] Estructura detectada: { error: false, data }');
          }
          // Estructura 3: { executions: [], total: 0 } (directo)
          else if (response.executions) {
            executions = response.executions || [];
            total = response.total || 0;
            console.log('✅ [FACADE] Estructura detectada: { executions, total } (directo)');
          }
          // Estructura 4: Array directo
          else if (Array.isArray(response)) {
            executions = response;
            total = response.length;
            console.log('✅ [FACADE] Estructura detectada: Array directo');
          }

          console.log('✅ [FACADE] Ejecuciones procesadas:', executions.length);
          console.log('✅ [FACADE] Total de registros:', total);
          console.log('✅ [FACADE] Primeras ejecuciones:', executions.slice(0, 3));

          this.executionLogsSubject.next(executions);
          this.totalRecordsSubject.next(total);

          if (executions.length === 0) {
            console.warn('⚠️ [FACADE] No se encontraron ejecuciones. Verifica la estructura de respuesta.');
          }
        },
        error: (error) => {
          console.error('❌ [FACADE] Error HTTP al cargar ejecuciones:', error);
          console.error('❌ [FACADE] Error status:', error.status);
          console.error('❌ [FACADE] Error message:', error.message);
          console.error('❌ [FACADE] Error completo:', error);

          this.loadingSubject.next(false);
          this.errorSubject.next('Error al cargar ejecuciones');
        }
      })
    ).subscribe();
  }

  /**
   * Ejecuta un job manualmente
   */
  executeJob(jobId: string, baseUrl: string): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('🚀 [FACADE] Ejecutando job manualmente:', jobId);
    console.log('🚀 [FACADE] URL:', `${baseUrl}/api/cron/jobs/${jobId}/execute`);

    return this.cronService.executeJob(jobId, baseUrl).pipe(
      tap({
        next: (response) => {
          console.log('✅ [FACADE] Respuesta de ejecución manual:', response);
          console.log('✅ [FACADE] response.success:', response.success);
          console.log('✅ [FACADE] response.job_id:', response.job_id);
          console.log('✅ [FACADE] response.duracion_segundos:', response.duracion_segundos);
          console.log('✅ [FACADE] response.mensaje:', response.mensaje);
          console.log('✅ [FACADE] response.resultado:', response.resultado);

          this.loadingSubject.next(false);
          if (!response.success) {
            console.error('❌ [FACADE] Error al ejecutar job:', response.mensaje);
            this.errorSubject.next(response.mensaje || 'Error al ejecutar el job');
          }
        },
        error: (error) => {
          console.error('❌ [FACADE] Error HTTP al ejecutar job:', error);
          console.error('❌ [FACADE] Error status:', error.status);
          console.error('❌ [FACADE] Error message:', error.message);
          console.error('❌ [FACADE] Error completo:', error);

          this.loadingSubject.next(false);
          this.errorSubject.next('Error al ejecutar el job');
        }
      })
    );
  }

  /**
   * Habilita el auto-refresh cada 30 segundos
   */
  enableAutoRefresh(baseUrl: string, filters?: ExecutionFilters): void {
    if (this.autoRefreshEnabled) return;

    this.autoRefreshEnabled = true;
    this.autoRefreshSubscription = interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (filters) {
            return this.cronService.getExecutionLogs(filters, baseUrl);
          } else {
            return this.cronService.getAllJobs(baseUrl);
          }
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            if (filters) {
              this.executionLogsSubject.next(response.data.executions);
              this.totalRecordsSubject.next(response.data.total);
            } else {
              this.jobsSubject.next(response.data.jobs);
            }
          }
        },
        error: (error) => {
          console.error('Auto-refresh error:', error);
        }
      });
  }

  /**
   * Deshabilita el auto-refresh
   */
  disableAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshEnabled = false;
    }
  }

  /**
   * Limpia el estado
   */
  clearState(): void {
    this.jobsSubject.next([]);
    this.executionLogsSubject.next([]);
    this.jobStatsSubject.next(null);
    this.totalRecordsSubject.next(0);
    this.errorSubject.next(null);
    this.disableAutoRefresh();
  }
}
