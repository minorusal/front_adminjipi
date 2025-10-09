// Estructura de una encuesta (formato actualizado del endpoint)
export interface Encuesta {
  id_encuesta: number;
  empresa: string | null;
  nombre: string | null;
  telefono_empresa: string | null;
  telefono_personal: string | null;
  correo_contacto: string | null;
  a_la_empresa_le_gustaria: string | null;
  numero_clientes_credito: string | null;
  rango_ventas_credito_mensual: string | null;
  tiene_errores: boolean;
  errores_detectados: string[];
}

// Estadísticas de encuestas
export interface EncuestasStats {
  total_encuestas: number;
  encuestas_con_errores: number;
  porcentaje_errores: string;
}

// Filtros para la consulta
export interface EncuestasFilters {
  hasErrors?: boolean;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}

// Respuesta del endpoint GET /api/cron/surveys
export interface EncuestasResponse {
  error: boolean;
  surveys: Encuesta[];
  total: number;
  limit: number;
  offset: number;
  stats: EncuestasStats;
}

// Usuario sin encuesta
export interface UsuarioSinEncuesta {
  id_usuario: number;
  nombre: string;
  email: string;
  empresa: string;
  fecha_registro: string;
}

// Análisis de errores
export interface ErrorAnalysis {
  error_rate: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  log_search_terms: string[];
}

// Respuesta del endpoint GET /api/cron/survey-errors
export interface SurveyErrorsResponse {
  error: boolean;
  usuarios_sin_encuestas: UsuarioSinEncuesta[];
  total_usuarios_sin_encuestas: number;
  analysis: ErrorAnalysis;
  timestamp: string;
}
