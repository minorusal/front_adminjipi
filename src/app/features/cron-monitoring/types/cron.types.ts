// Estructura real del endpoint GET /api/cron/jobs
export interface CronJob {
  job_id: string;
  nombre_job: string;
  frecuencia: string;
  estatus: 'Activo' | 'Inactivo';
}

// Estructura extendida con datos de ejecuciones
export interface JobMonitoring extends CronJob {
  last_execution?: string;
  next_execution?: string;
  success_rate?: string;
  recent_executions?: ExecutionLog[];
}

export interface ExecutionLog {
  id: number;                           // ← La API devuelve "id", no "log_id"
  log_id?: number;                      // ← Mantener compatibilidad
  job_id: string;
  job_name: string;
  execution_type: 'AUTO' | 'MANUAL';
  trigger_source: string;
  status: 'STARTED' | 'SUCCESS' | 'ERROR';
  start_time: string;
  end_time: string | null;
  duration_ms: number | null;
  memory_usage_mb: string | number | null;  // ← Puede ser string o number
  records_processed: number | null;
  email_sent: number | boolean;        // ← Puede ser 0/1 o true/false
  email_recipients: string | null;
  email_subject?: string | null;
  error_message: string | null;
  stack_trace?: string | null;
  next_scheduled_run: string | null;
  created_at?: string;
  server_hostname?: string;
  notes?: string;
}

export interface ExecutionFilters {
  jobId?: string;
  status?: 'STARTED' | 'SUCCESS' | 'ERROR';
  executionType?: 'AUTO' | 'MANUAL';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  limit: number;
  offset: number;
}

// Estructura real del endpoint /api/cron/jobs/{jobId}/stats
export interface JobExecutionStats {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  manual_executions: number;
  automatic_executions: number;
  success_rate: number;
  failure_rate: number;
  avg_duration_ms: number;
  max_duration_ms: number;
  min_duration_ms: number;
  avg_memory_mb: number;
  last_execution: {
    id: number;
    job_id: string;
    execution_type: string;
    status: string;
    start_time: string;
    end_time: string;
    duration_ms: number;
  } | null;
}

// Respuesta real de GET /api/cron/jobs
export interface CronJobsResponse {
  error: boolean;
  jobs: CronJob[];
}

// Respuesta de GET /api/cron/jobs/{jobId}/status
export interface JobStatusResponse {
  error: boolean;
  job: CronJob;
  ultima_ejecucion?: ExecutionLog;
  proxima_ejecucion?: string;
}

// Respuesta de POST /api/cron/jobs/{jobId}/execute
export interface ExecuteJobResponse {
  success: boolean;
  job_id: string;
  duracion_segundos: number;
  resultado: any;
  mensaje: string;
}

// Estructura real de la API
export interface ExecutionLogsResponse {
  error: boolean;
  executions: ExecutionLog[];
  total: number;
  limit: number;
  offset: number;
}

// Estructura real de la respuesta del endpoint /api/cron/jobs/{jobId}/stats
export interface ExecutionStatsResponse {
  error: boolean;
  job_id: string;
  job_name: string;
  frecuencia: string;
  estatus: string;
  horario_programado: string;
  proxima_ejecucion: string;
  proxima_ejecucion_timestamp: string;
  ultima_ejecucion_real?: string;  // Última ejecución de tabla trabajos_ejecuciones (ISO timestamp)
  stats: JobExecutionStats;
}

