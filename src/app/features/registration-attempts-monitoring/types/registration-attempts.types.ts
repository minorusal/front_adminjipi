// Intento de registro individual (estructura real del API)
export interface RegistrationAttempt {
  uuid_intento: string;
  timestamp_inicio: string;
  timestamp_fin: string | null;
  empresa_rfc: string;
  empresa_razon_social: string | null;
  usuario_email: string;
  usuario_nombre: string | null;
  usuario_apellido: string | null;
  usuario_telefono: string | null;
  codigo_promocion: string | null;
  meta_from: string | null;
  meta_id: string | null;
  certificacion_completa: number;
  ip_address: string | null;
  registro_exitoso: number;
  duracion_ms: number | null;
  email_valido: number | null;
  email_corporativo: number | null;
  rfc_existe: number | null;
  email_existe: number | null;
  konesh_valido: number | null;
  konesh_status: string | null;
  codigo_promocion_valido: number | null;
  fallo_tipo: string | null;
  fallo_detalle: string | null;
  validacion_fallida: string | null;
  mensaje_resultado: string | null;
  empresa_id_creada: number | null;
  usuario_id_creado: number | null;
  token_generado: string | null;
  es_reintento: number;
  intentos_rfc_exitosos: number;
  intentos_email_exitosos: number;
}

// Estadísticas generales (estructura real del API)
export interface RegistrationStats {
  total_intentos: number;
  intentos_exitosos: string | number;
  intentos_fallidos: string | number;
  duracion_promedio_ms: number | null;
  rfcs_unicos: number;
  emails_unicos: number;
  ips_unicas: number;
  total_reintentos: string | number;
  primeros_intentos: string | number;
}

// Tipo de fallo
export interface TipoFallo {
  fallo_tipo: string;
  cantidad: number;
  porcentaje: string;
}

// RFC con más intentos
export interface TopRFC {
  empresa_rfc: string;
  empresa_razon_social: string | null;
  total_intentos: number;
  intentos_exitosos: string | number;
  intentos_fallidos: string | number;
  ultimo_intento: string;
}

// Email con más intentos
export interface TopEmail {
  usuario_email: string;
  total_intentos: number;
  intentos_exitosos: string | number;
  intentos_fallidos: string | number;
  rfcs_diferentes: number;
  ultimo_intento: string;
}

// IP sospechosa
export interface SuspiciousIP {
  ip_address: string;
  total_intentos: number;
  intentos_exitosos: string | number;
  rfcs_diferentes: number;
  emails_diferentes: number;
  ultimo_intento: string;
}

// Paginación (estructura real del API)
export interface Paginacion {
  total: number;
  limit: number;
  offset: number;
  total_paginas: number;
}

// Filtros para la consulta
export interface RegistrationFilters {
  fecha_inicio?: string;
  fecha_fin?: string;
  solo_fallidos?: boolean;
  tipo_fallo?: string;
  rfc?: string;
  email?: string;
  ip?: string;
  limit: number;
  offset: number;
}

// Respuesta del endpoint GET /api/cron/registration-attempts (estructura real del backend)
export interface RegistrationAttemptsResponse {
  error: boolean;
  message: string;
  data: {
    intentos: {
      datos: RegistrationAttempt[];
      paginacion: Paginacion;
    };
    estadisticas: RegistrationStats;
    tipos_fallo: TipoFallo[];
    top_rfcs: TopRFC[];
    top_emails: TopEmail[];
    ips_sospechosas: SuspiciousIP[];
  };
}

// Tipos de alerta para IP sospechosa (estructura real del API)
export type RiskLevel = 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO';

// Alerta individual de IP (estructura real del API)
export interface IPAlert {
  ip_address: string;
  total_intentos: number;
  intentos_exitosos: number;
  intentos_fallidos: number;
  rfcs_diferentes: number;
  emails_diferentes: number;
  primer_intento: string;
  ultimo_intento: string;
  duracion_promedio_ms: number;
  nivel_riesgo: RiskLevel;
  tipos_alerta: string[];
  recomendaciones: string[];
  puntuacion_riesgo: number;
  intentos_por_hora: number;
  horas_actividad: number;
  tipos_fallo_array: string[];
  sample_rfcs_array: string[];
  sample_emails_array: string[];
}

// Estadísticas de alertas IP
export interface IPAlertsStats {
  total_ips_analizadas: number;
  ips_con_alertas: number;
  ips_criticas: number;
  ips_alto_riesgo: number;
  total_intentos_periodo: number;
  total_registros_exitosos: number;
  periodo_analisis: string;
  timestamp_analisis: string;
}

// Alertas por tipo
export interface AlertasPorTipo {
  multiples_rfcs: number;
  multiples_emails: number;
  intentos_masivos_fallidos: number;
  registros_exitosos_multiples: number;
  actividad_intensiva: number;
}

// Filtros aplicados
export interface FiltrosAplicados {
  min_intentos: number;
  horas_analisis: number;
  solo_alertas: boolean;
}

// Filtros para alertas IP
export interface IPAlertFilters {
  min_intentos?: number;
  horas_analisis?: number;
  solo_alertas?: boolean;
}

// Respuesta del endpoint GET /api/cron/ip-alerts (estructura real)
export interface IPAlertsResponse {
  error: boolean;
  message: string;
  data: {
    alertas: IPAlert[];
    estadisticas: IPAlertsStats;
    alertas_por_tipo: AlertasPorTipo;
    filtros_aplicados: FiltrosAplicados;
  };
}
