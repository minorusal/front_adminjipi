export interface BitacoraRecord {
  id: number;
  usuario_id: number;
  usuario_email: string;
  usuario_nombre: string;
  empresa_id: number;
  empresa_nombre: string;
  endpoint_url: string;
  metodo_http: string;
  endpoint_completo: string;
  duracion_ms: number;
  codigo_respuesta: number;
  mensaje_error?: string;
  fecha_ejecucion: string;
  ip_cliente: string;
  custom_uuid?: string;
  token_session?: string;
}

export interface BitacoraResponse {
  error: boolean;
  message: string;
  ok: boolean;
  data: BitacoraRecord[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ErrorMetrics {
  total_requests: number;
  total_errors: number;
  server_errors: number;
  client_errors: number;
  error_rate_percentage: number;
  avg_response_time: number;
  max_response_time: number;
  min_response_time: number;
}

export interface EndpointTimeMetrics {
  endpoint_url: string;
  metodo_http: string;
  total_calls: number;
  avg_time: number;
  max_time: number;
  min_time: number;
  std_deviation: number;
  error_count: number;
  error_rate: number;
}

export interface SessionTraceability {
  id: number;
  endpoint_url: string;
  metodo_http: string;
  duracion_ms: number;
  codigo_respuesta: number;
  fecha_ejecucion: string;
}

export interface SessionStats {
  total_requests: number;
  error_count: number;
  avg_response_time: number;
  session_start: string;
  session_end: string;
  unique_endpoints: number;
}

export interface SessionTraceabilityResponse {
  error: boolean;
  message: string;
  ok: boolean;
  data: SessionTraceability[];
  session_stats: SessionStats;
  pagination: PaginationInfo;
}

export interface TopEndpoint {
  endpoint_url: string;
  metodo_http: string;
  total_calls: number;
  error_count: number;
  avg_response_time: number;
  unique_users: number;
  last_call: string;
}

export interface UserMetrics {
  usuario_id: number;
  usuario_email: string;
  usuario_nombre: string;
  empresa_id: number;
  empresa_nombre: string;
  total_requests: number;
  error_count: number;
  avg_response_time: number;
  unique_endpoints: number;
  active_days: number;
  first_request: string;
  last_request: string;
}

export interface HourlyMetrics {
  hour_of_day: number;
  total_requests: number;
  error_count: number;
  avg_response_time: number;
}

export interface DailyMetrics {
  day_of_week: number;
  day_name: string;
  total_requests: number;
  error_count: number;
  avg_response_time: number;
}

export interface TemporalMetrics {
  hourly: HourlyMetrics[];
  daily: DailyMetrics[];
}

export interface DashboardMetrics {
  error_metrics: ErrorMetrics;
  top_endpoints: TopEndpoint[];
  time_based_metrics: TemporalMetrics;
}

export interface BitacoraFilters {
  page?: number;
  limit?: number;
  usuario_id?: number;
  usuario_email?: string;
  empresa_id?: number;
  endpoint_url?: string;
  metodo_http?: string;
  codigo_respuesta?: number;
  codigo_respuesta_min?: number;
  codigo_respuesta_max?: number;
  duracion_min?: number;
  duracion_max?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  ip_cliente?: string;
  token_session?: string;
  custom_uuid?: string;
  has_error?: boolean;
  mensaje_error?: string;
}

export interface ApiResponse<T> {
  error: boolean;
  message: string;
  ok: boolean;
  data: T;
}

// Nuevos tipos para los endpoints implementados recientemente

// Métricas Overview
export interface SystemOverview {
  total_requests: number;
  total_users: number;
  total_endpoints: number;
  total_errors: number;
  error_rate: number;
  avg_response_time: number;
  peak_requests_hour: number;
  active_users_24h: number;
  top_error_endpoint: string;
  slowest_endpoint: string;
  uptime_percentage: number;
}

// Métricas de Uso
export interface EndpointUsageMetrics {
  endpoint_url: string;
  method: string;
  total_requests: number;
  unique_users: number;
  avg_response_time: number;
  error_count: number;
  error_rate: number;
  last_request: string;
  peak_hour: number;
  usage_trend: string; // 'increasing', 'decreasing', 'stable'
}

export interface UserUsageMetrics {
  user_id: number;
  user_email: string;
  user_name: string;
  company_id: number;
  company_name: string;
  total_requests: number;
  unique_endpoints: number;
  avg_response_time: number;
  error_count: number;
  error_rate: number;
  first_request: string;
  last_request: string;
  most_used_endpoint: string;
  activity_score: number;
}

export interface CompanyUsageMetrics {
  company_id: number;
  company_name: string;
  total_requests: number;
  unique_users: number;
  unique_endpoints: number;
  avg_response_time: number;
  error_count: number;
  error_rate: number;
  peak_usage_hour: number;
  activity_trend: string;
}

export interface MethodUsageMetrics {
  method: string;
  total_requests: number;
  avg_response_time: number;
  error_count: number;
  error_rate: number;
  unique_endpoints: number;
  unique_users: number;
}

export interface TimeSeriesData {
  timestamp: string;
  requests: number;
  errors: number;
  avg_response_time: number;
  unique_users: number;
}

// Métricas de Rendimiento
export interface PerformanceMetrics {
  endpoint_url: string;
  method: string;
  total_requests: number;
  avg_response_time: number;
  min_response_time: number;
  max_response_time: number;
  p50_response_time: number;
  p90_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  std_deviation: number;
  slow_requests_count: number;
  slow_requests_percentage: number;
}

export interface SlowRequest {
  endpoint_url: string;
  metodo_http: string;
  duracion_ms: number;
  codigo_respuesta: number;
  fecha_ejecucion: string;
  usuario_email: string | null;
  ip_cliente: string;
}

export interface PerformanceTrends {
  endpoint_url: string;
  method: string;
  current_avg: number;
  previous_avg: number;
  trend_percentage: number;
  trend_direction: 'improving' | 'degrading' | 'stable';
  sample_period: string;
}

// Métricas de Errores
export interface ErrorAnalysis {
  error_code: number;
  error_message: string;
  count: number;
  percentage: number;
  first_occurrence: string;
  last_occurrence: string;
  affected_endpoints: string[];
  affected_users: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ErrorTrends {
  date: string;
  total_errors: number;
  error_rate: number;
  server_errors: number;
  client_errors: number;
  unique_error_types: number;
}

export interface ErrorsByEndpoint {
  endpoint_url: string;
  method: string;
  total_requests: number;
  error_count: number;
  error_rate: number;
  common_errors: {
    code: number;
    message: string;
    count: number;
  }[];
}

export interface ErrorsByUser {
  user_id: number;
  user_email: string;
  user_name: string;
  company_name: string;
  total_requests: number;
  error_count: number;
  error_rate: number;
  recent_errors: {
    endpoint: string;
    error_code: number;
    timestamp: string;
  }[];
}

// Métricas de Seguridad
export interface SecurityMetrics {
  total_unique_ips: number;
  suspicious_ips_count: number;
  blocked_requests: number;
  failed_auth_attempts: number;
  unusual_patterns: number;
  high_frequency_ips: number;
  geographic_anomalies: number;
}

export interface SuspiciousActivity {
  ip_address: string;
  request_count: number;
  error_count: number;
  error_rate: number;
  unique_endpoints: number;
  unique_users: number;
  first_seen: string;
  last_seen: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  patterns: string[];
  geographic_location?: string;
}

export interface IpAnalysis {
  ip_address: string;
  total_requests: number;
  unique_users: number;
  unique_endpoints: number;
  error_count: number;
  error_rate: number;
  avg_response_time: number;
  first_request: string;
  last_request: string;
  user_agents: string[];
  geographic_info?: {
    country: string;
    city: string;
    region: string;
  };
  threat_indicators: {
    high_frequency: boolean;
    multiple_users: boolean;
    error_prone: boolean;
    unusual_patterns: boolean;
  };
}

export interface SecurityAlerts {
  id: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address?: string;
  user_email?: string;
  endpoint_url?: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  details: Record<string, any>;
}

// Exportación de logs
export interface RawLogExportOptions {
  start_date?: string;
  end_date?: string;
  user_id?: number;
  company_id?: number;
  endpoint_url?: string;
  method?: string;
  error_codes?: number[];
  include_sensitive?: boolean;
  format?: 'json' | 'csv' | 'tsv';
  compression?: 'none' | 'gzip' | 'zip';
  max_records?: number;
}

// Session Journey y Auditoría Mejorada
export interface SessionJourneyStep {
  id: number;
  login_id: string;
  timestamp: string;
  endpoint_url: string;
  metodo_http: string;
  codigo_respuesta: number;
  duracion_ms: number;
  resultado?: string;
  razon_fallo?: string;
  session_token_presente: boolean;
  endpoint_consumido?: string;
  custom_uuid?: string;
  mensaje_error?: string;
  stack_trace?: string;
  datos_adicionales?: Record<string, any>;
}

export interface SessionJourneyInfo {
  login_id: string;
  usuario_id: number;
  usuario_email: string;
  usuario_nombre: string;
  empresa_id: number;
  empresa_nombre: string;
  session_start: string;
  session_end?: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  algorithm_executions: number;
  total_duration_ms: number;
  ip_cliente: string;
  user_agent?: string;
}

export interface SessionJourney {
  session_info: SessionJourneyInfo;
  steps: SessionJourneyStep[];
  session_stats: {
    endpoints_accessed: string[];
    most_used_endpoint: string;
    algorithm_success_rate: number;
    average_response_time: number;
    error_patterns: {
      razon_fallo: string;
      count: number;
    }[];
  };
}

export interface SessionJourneyResponse {
  error: boolean;
  message: string;
  ok: boolean;
  data: SessionJourney;
}

// Estructura real que devuelve el backend
export interface RealSessionJourneyResponse {
  error: boolean;
  message: string;
  ok: boolean;
  data: {
    loginId: string;
    login_id: string;
    journey: {
      fecha_ejecucion: string;
      endpoint_url: string;
      metodo_http: string;
      duracion_ms: number;
      codigo_respuesta: number;
      usuario_id: number;
      usuario_email: string;
      modulo: string;
      mensaje_error?: string;
      resultado?: string;
      razon_fallo?: string;
      session_token_presente?: boolean;
      endpoint_consumido?: string;
      custom_uuid?: string;
      datos_adicionales?: Record<string, any>;
    }[];
    journey_stats: {
      total_endpoints: number;
      session_duration: number;
      modules_visited: string[];
      errors_encountered: number;
      session_start: string;
      session_end: string;
      unique_endpoints: number;
    };
  };
}

// Métricas de sesión para analytics
export interface SessionAnalytics {
  total_sessions: number;
  active_sessions: number;
  average_session_duration: number;
  algorithm_usage_rate: number;
  top_failure_reasons: {
    razon_fallo: string;
    count: number;
    percentage: number;
  }[];
  session_patterns: {
    hour_of_day: number;
    session_count: number;
    avg_duration: number;
  }[];
}

// Tipos para el dropdown de usuarios
export interface UserSearchResult {
  usuario_id: number;
  usuario_email: string;
  usuario_nombre: string;
  usuario_apellido: string;
  nombre_completo: string;
  fecha_registro: string;
  estatus_usuario: string;
  empresas: {
    empresa_id: number;
    empresa_nombre: string;
    empresa_rfc: string;
  }[];
  display_name: string;
  empresa_principal: string; // Es un string, no un objeto
  total_empresas: number;
}

export interface UserSearchResponse {
  error: boolean;
  message: string;
  ok: boolean;
  data: UserSearchResult[]; // Los usuarios están directamente en data
  metadata: {
    total_usuarios: number;
    usuarios_con_empresa: number;
    usuarios_sin_empresa: number;
    search_applied: boolean;
    search_term: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Tipos para el endpoint de login IDs
export interface LoginIdSession {
  registro_id: number;
  fecha_ejecucion: string;
  endpoint: string;
  metodo_http: string;
  codigo_respuesta: number;
  login_id: string;
  token_valido: boolean;
  error_token?: string;
  token_preview: string;
}

export interface LoginIdsStats {
  tokens_validos: number;
  tokens_expirados: number;
  tokens_con_error: number;
}

export interface LoginIdsData {
  email: string;
  fecha: string;
  total_registros: number;
  total_login_ids_unicos: number;
  login_ids_unicos: string[];
  sesiones: LoginIdSession[];
  estadisticas: LoginIdsStats;
}

export interface LoginIdsResponse {
  error: boolean;
  message: string;
  ok: boolean;
  data: LoginIdsData;
}