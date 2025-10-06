export interface TableSchema {
  pk: string;
  columns: string[];
  required: string[];
  types: Record<string, string>;
}

export interface TableSchemaResponse {
  ok: boolean;
  data: TableSchema;
  message: string;
}

export interface TablesResponse {
  ok: boolean;
  data: string[];
  message: string;
}

export interface CatalogRecord {
  [key: string]: any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CatalogRecordsResponse {
  ok: boolean;
  data: CatalogRecord[];
  pagination: PaginationInfo;
  message: string;
}

export interface SingleRecordResponse {
  ok: boolean;
  data: CatalogRecord;
  message: string;
}

export interface CreateRecordResponse {
  ok: boolean;
  data: CatalogRecord;
  id: number;
  message: string;
}

export interface UpdateRecordResponse {
  ok: boolean;
  data: CatalogRecord;
  message: string;
}

export interface DeleteRecordResponse {
  ok: boolean;
  data: {
    id: number;
    deleted: boolean;
  };
  message: string;
}

export interface BatchOperation {
  type: 'create' | 'update' | 'remove';
  table: string;
  id?: number;
  data?: Record<string, any>;
}

export interface BatchRequest {
  operations: BatchOperation[];
}

export interface BatchResponse {
  ok: boolean;
  data: Array<{
    ok: boolean;
    data: any;
    id?: number;
  }>;
  message: string;
}

export interface ApiError {
  ok: boolean;
  error: string;
  code?: string;
  sqlCode?: string;
}

export interface FilterOptions {
  page?: number;
  limit?: number;
  [key: string]: any;
}

export interface TableConfig {
  name: string;
  displayName: string;
  icon: string;
  description: string;
}

export const AVAILABLE_TABLES: TableConfig[] = [
  {
    name: 'cat_apalancamiento_algoritmo',
    displayName: 'Apalancamiento',
    icon: 'fas fa-chart-line',
    description: 'Configuración de parámetros de apalancamiento'
  },
  {
    name: 'cat_capital_contable_algoritmo',
    displayName: 'Capital Contable',
    icon: 'fas fa-coins',
    description: 'Parámetros de capital contable'
  },
  {
    name: 'cat_flujo_neto_caja_algoritmo',
    displayName: 'Flujo Neto de Caja',
    icon: 'fas fa-money-bill-wave',
    description: 'Configuración de flujo de caja'
  },
  {
    name: 'cat_incidencias_legales_algoritmo',
    displayName: 'Incidencias Legales',
    icon: 'fas fa-gavel',
    description: 'Parámetros de incidencias legales'
  },
  {
    name: 'cat_influencia_controlante',
    displayName: 'Influencia Controlante',
    icon: 'fas fa-users-cog',
    description: 'Configuración de influencia controlante'
  },
  {
    name: 'cat_pais_algoritmo',
    displayName: 'País',
    icon: 'fas fa-globe',
    description: 'Parámetros por país'
  },
  {
    name: 'cat_payback_algoritmo',
    displayName: 'Payback',
    icon: 'fas fa-clock',
    description: 'Configuración de periodo de retorno'
  },
  {
    name: 'cat_plantilla_laboral_algoritmo',
    displayName: 'Plantilla Laboral',
    icon: 'fas fa-users',
    description: 'Parámetros de plantilla laboral'
  },
  {
    name: 'cat_sector_clientes_finales_algoritmo',
    displayName: 'Sector Clientes Finales',
    icon: 'fas fa-industry',
    description: 'Configuración por sector de clientes'
  },
  {
    name: 'cat_sector_riesgo_sectorial_algoritmo',
    displayName: 'Sector Riesgo',
    icon: 'fas fa-exclamation-triangle',
    description: 'Parámetros de riesgo sectorial'
  },
  {
    name: 'cat_tiempo_actividad_comercial_algoritmo',
    displayName: 'Tiempo Actividad Comercial',
    icon: 'fas fa-calendar',
    description: 'Configuración de tiempo de actividad'
  },
  {
    name: 'cat_tipo_cifras_algoritmo',
    displayName: 'Tipo de Cifras',
    icon: 'fas fa-calculator',
    description: 'Parámetros de tipo de cifras'
  },
  {
    name: 'cat_ventas_anuales_algoritmo',
    displayName: 'Ventas Anuales',
    icon: 'fas fa-chart-bar',
    description: 'Configuración de ventas anuales'
  },
  {
    name: 'cat_evolucion_ventas_algoritmo',
    displayName: 'Evolución de Ventas',
    icon: 'fas fa-chart-line-up',
    description: 'Parámetros de evolución de ventas'
  },
  {
    name: 'cat_rotacion_cuentas_cobrar_algoritmo',
    displayName: 'Rotación Cuentas por Cobrar',
    icon: 'fas fa-sync-alt',
    description: 'Configuración de rotación de cuentas por cobrar'
  },
  {
    name: 'cat_resultado_referencias_proveedores_algoritmo',
    displayName: 'Referencias de Proveedores',
    icon: 'fas fa-handshake',
    description: 'Resultados de referencias de proveedores'
  }
];