export interface BlocBlocResponse {
  id: number;
  request_json: string;
  endpoint_name: string;
  request_url: string;
  http_status: number;
  response_time_ms: number;
  response_json: string;
  error_message: string | null;
  created_at: string;
}

export interface KoneshResponse {
  id: number;
  emp_id: number;
  rfc: string;
  razon_social_req: string;
  request_ts: string;
  response_time_ms: number;
  http_status: number;
  konesh_status: string;
  error_message: string;
  name_sat: string;
  postal_code: string;
  transaction_id: string;
  transaction_date: string;
  node: string;
  raw_response: any;
  created_at: string;
}

export interface MonitoringFilters {
  startDate?: string;
  endDate?: string;
  http_status?: number;
  konesh_status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MonitoringPagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemsOnCurrentPage: number;
}

export interface BlocBlocResponsesResponse {
  error: boolean;
  results: BlocBlocResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface PerformanceStats {
  average_time: number;
  slowest_time: number;
  fastest_time: number;
  total_requests: number;
}

export interface BlocBlocPerformanceAnalysisResponse {
  error: boolean;
  message: string;
  results: BlocBlocResponse[];
  total: number;
  page: number;
  limit: number;
  performance_stats: PerformanceStats;
  filters_applied: {
    startDate?: string;
    endDate?: string;
    minResponseTime?: number;
    environment?: string;
  };
}

export interface PerformanceFilters {
  startDate?: string;
  endDate?: string;
  minResponseTime?: number;
  page?: number;
  limit?: number;
}

export interface KoneshResponsesResponse {
  error: boolean;
  results: KoneshResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface CreditReport {
  id: number;
  pdf_url?: string; // URL del reporte PDF básico
  detailed_pdf_url?: string; // URL del reporte PDF detallado
  reporte_pdf?: string; // Posible campo alternativo
  reporte_pdf_detallado?: string; // Posible campo alternativo
  // Aquí agregaremos más campos según la estructura real del reporte de crédito
  [key: string]: any; // Para campos adicionales que puedan venir
}

export interface CreditReportMeta {
  page: number; // Changed from currentPage
  limit: number; // Changed from itemsPerPage
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreditReportsResponse {
  error: boolean;
  results: {
    data: CreditReport[];
    meta: CreditReportMeta;
  };
}

export interface MailjetErrorNotification {
  id: number;
  error_type: string;
  error_message: string;
  context_data: any;
  stack_trace?: string;
  created_at: string;
  resolved: boolean;
  resolution_notes?: string;
}

export interface MailjetStats {
  total_errors: number;
  unresolved_errors: number;
  resolved_errors: number;
  most_common_error: string;
  error_rate_24h: number;
}

export interface MailjetErrorNotificationsResponse {
  error: boolean;
  results: MailjetErrorNotification[];
  total: number;
  page: number;
  limit: number;
}

export interface MailjetStatsResponse {
  error: boolean;
  stats: MailjetStats;
}

export interface MailjetErrorDetailResponse {
  error: boolean;
  result: MailjetErrorNotification;
}

// Email Monitoring Types
export interface EmailMonitoringRecord {
  bitacora_id: number;
  fecha_creacion: string;
  tipo_operacion: string;
  email_destinatario: string;
  nombre_destinatario: string;
  email_remitente: string;
  asunto: string;
  template_id?: number;
  estado_actual: string;
  mailjet_message_id?: string;
  intentos_chequeo: number;
  error_mensaje?: string;
}

export interface EmailPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EmailMonitoringResponse {
  success: boolean;
  data: EmailMonitoringRecord[];
  pagination: EmailPagination;
}

export interface EmailStats {
  total_emails: number;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_bounced: number;
  emails_spam: number;
  emails_blocked: number;
  emails_error: number;
  emails_pending: number;
  today_emails: number;
  week_emails: number;
  month_emails: number;
  tipo_operacion?: string;
  template_id?: number;
}

export interface EmailStatsResponse {
  success: boolean;
  data: EmailStats[];
}

export interface EmailMetrics {
  period: string;
  total_emails: number;
  success_emails: number;
  failed_emails: number;
  pending_emails: number;
  success_rate: number;
}

export interface EmailMetricsResponse {
  success: boolean;
  data: EmailMetrics[];
  period: string;
  days: number;
}

export interface TopTemplate {
  template_id: number;
  usage_count: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  last_used: string;
}

export interface TopTemplatesResponse {
  success: boolean;
  data: TopTemplate[];
}

export interface RecentFailure {
  bitacora_id: number;
  fecha_creacion: string;
  email_destinatario: string;
  nombre_destinatario: string;
  asunto: string;
  estado_actual: string;
  error_mensaje?: string;
  template_id?: number;
  tipo_operacion: string;
}

export interface RecentFailuresResponse {
  success: boolean;
  data: RecentFailure[];
  hours: number;
  total: number;
}

export interface EmailDetail {
  bitacora_id: number;
  tipo_operacion: string;
  email_destinatario: string;
  nombre_destinatario: string;
  template_id?: number | null;
  template_variables?: any;
  email_remitente?: string | null;
  nombre_remitente?: string | null;
  asunto?: string | null;
  lista_id?: string | null;
  propiedades_contacto?: any;
  accion_lista?: string | null;
  mailjet_message_id?: string | null;
  mailjet_contact_id?: string | null;
  mailjet_response?: any;
  estado_inicial: string;
  estado_actual: string;
  fecha_ultimo_chequeo?: string | null;
  intentos_chequeo: number;
  usuario_id?: number;
  ip_origen?: string;
  user_agent?: string;
  error_mensaje?: string | null;
  error_detalles?: string | null;
  fecha_creacion: string;
  fecha_actualizacion?: string | null;
  historial_estados: EmailStateHistory[];
}

export interface EmailStateHistory {
  estado_anterior: string;
  estado_nuevo: string;
  fecha_cambio: string;
}

export interface EmailDetailResponse {
  success: boolean;
  data: EmailDetail;
}

export interface EmailMonitoringFilters {
  page?: number;
  limit?: number;
  recipient?: string;
  sender?: string;
  subject?: string;
  status?: string;
  templateId?: number;
  tipoOperacion?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}