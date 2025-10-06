// Parametros System Types

export interface Parametro {
  id: number;
  nombre: string;
  valor: string;
  descripcion?: string;
  tipo_dato: 'string' | 'int' | 'boolean' | 'float' | 'json' | 'date';
  fecha_creacion: string;
  fecha_modificacion?: string | null;
}

export interface ParametroStats {
  total_parametros: number;
  por_tipo_dato: {
    tipo: string;
    cantidad: number;
  }[];
  ultimos_creados: number;
  parametros_sin_descripcion: number;
}

export interface ParametroFilters {
  page?: number;
  limit?: number;
  nombre?: string;
  valor?: string;
  descripcion?: string;
  tipoDato?: 'string' | 'int' | 'boolean' | 'float' | 'json' | 'date';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ParametroPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ParametrosResponse {
  success: boolean;
  data: Parametro[];
  pagination: ParametroPagination;
  filters?: {
    nombre: string | null;
    valor: string | null;
    descripcion: string | null;
    tipoDato: string | null;
    dateFrom: string | null;
    dateTo: string | null;
    sortBy: string;
    sortOrder: string;
  };
}

export interface ParametroStatsResponse {
  success: boolean;
  data: ParametroStats;
}

export interface ParametroDetailResponse {
  success: boolean;
  data: Parametro;
}

export interface CreateParametroRequest {
  nombre: string;
  valor: string;
  descripcion?: string;
  tipo_dato: 'string' | 'int' | 'boolean' | 'float' | 'json' | 'date';
}

export interface UpdateParametroRequest {
  nombre?: string;
  valor?: string;
  descripcion?: string;
  tipo_dato?: 'string' | 'int' | 'boolean' | 'float' | 'json' | 'date';
}

export interface ParametroApiResponse {
  success: boolean;
  message?: string;
  data?: Parametro;
  error?: string;
}

// Form validation types
export interface ParametroFormData {
  nombre: string;
  valor: string;
  descripcion: string;
  tipo_dato: 'string' | 'int' | 'boolean' | 'float' | 'json' | 'date';
}

export interface ParametroFormErrors {
  nombre?: string;
  valor?: string;
  descripcion?: string;
  tipo_dato?: string;
}