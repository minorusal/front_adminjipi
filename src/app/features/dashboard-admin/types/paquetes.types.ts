// ============ PAQUETES DE REPORTES DE CRÉDITO (SUSCRIPCIONES) ============

export interface PreciosDesglosados {
  mensual: {
    original: number;
    con_descuento: number;
    descuento_aplicado: number;
    ahorro: number;
  };
  anual: {
    original: number;
    con_descuento: number;
    descuento_aplicado: string;
    ahorro: number;
  };
}

export interface ConfiguracionAvanzada {
  stripe_monthly_product_id: string;
  stripe_annual_product_id: string;
  setup_fee?: number;
  trial_days?: number;
  support_level?: string;
  cancellation_fee?: number;
  upgrade_proration?: boolean;
  downgrade_proration?: boolean;
}

export interface PaqueteSuscripcion {
  id?: number;
  nombre: string;
  badge_etiqueta: string;
  badge_color: string;
  subtitulo: string;
  descripcion: string;
  precio_mensual: number;
  precio_anual: number;
  descuento_anual: number;
  reportes_incluidos: number;
  max_reportes_ondemand: number;
  precio_reporte_ondemand: number;
  max_monitoreos: number;
  mensaje_reportes: string;
  copy_valor_individual: string | null;
  mensaje_monitoreos: string;
  vigencia_texto: string;
  mensaje_on_demand: string;
  copy_extra: string;
  copy_cierre: string;
  copy_boton_toggle: string;
  cta_texto: string;
  es_destacado: boolean;
  modalidades_pago: string[];
  caracteristicas: string[];
  configuracion_avanzada: ConfiguracionAvanzada;
  orden_visualizacion: number;
  activo: boolean;
  // Campos de respuesta GET (no van en el request)
  precios?: PreciosDesglosados;
  modalidades_disponibles?: string[]; // Este es el campo que viene de la API
  created_at?: string;
  updated_at?: string;
  // Campos adicionales que pueden venir en la respuesta
  parametros_dinamicos?: any;
}

export interface ConfiguracionPrecioSuscripcion {
  id: number;
  nombre_parametro: string;
  valor: string;
  tipo: string;
  descripcion: string;
  activo: number;
  created_at: string;
  updated_at: string;
}

export interface FiltrosAplicados {
  modalidad: string;
  incluir_parametros: boolean;
  descuento: string | null;
}

export interface PaqueteSuscripcionDisponible {
  total_paquetes: number;
  filtros_aplicados: FiltrosAplicados;
  paquetes: PaqueteSuscripcion[];
  configuraciones?: ConfiguracionPrecioSuscripcion[];
}

export interface ActualizarPrecioSuscripcionRequest {
  tipo_configuracion: string;
  valor: string;
  nombre_parametro?: string;
}

export interface ActualizarParametroSuscripcionRequest {
  id_paquete: number;
  parametro: string;
  valor: string | number;
}

export interface ActualizarPaqueteCompletoRequest {
  nombre: string;
  badge_etiqueta: string;
  badge_color: string;
  subtitulo: string;
  descripcion: string;
  precio_mensual: number;
  precio_anual: number;
  descuento_anual: number;
  reportes_incluidos: number;
  max_reportes_ondemand: number;
  precio_reporte_ondemand: number;
  max_monitoreos: number;
  mensaje_reportes: string;
  copy_valor_individual: string | null;
  mensaje_monitoreos: string;
  vigencia_texto: string;
  mensaje_on_demand: string;
  copy_extra: string;
  copy_cierre: string;
  copy_boton_toggle: string;
  cta_texto: string;
  es_destacado: boolean;
  modalidades_pago: string[];
  caracteristicas: string[];
  configuracion_avanzada: {
    stripe_monthly_product_id: string;
    stripe_annual_product_id: string;
  };
  orden_visualizacion: number;
  activo: boolean;
}

// ============ PAQUETES DE MONITOREO ============

export interface PaqueteMonitoreo {
  id: number;
  nombre_paquete: string;
  descripcion: string;
  clientes_min: number;
  clientes_max: number;
  precio_mensual: string;
  precio_anual: string;
  activo: number;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracionPrecioMonitoreo {
  id: number;
  nombre_parametro: string;
  valor: string;
  tipo: string;
  descripcion: string;
  activo: number;
  created_at: string;
  updated_at: string;
}

export interface PaqueteMonitoreoDisponible {
  paquetes: PaqueteMonitoreo[];
  configuraciones?: ConfiguracionPrecioMonitoreo[];
}

export interface PaqueteMonitoreoConModalidad {
  paquete: PaqueteMonitoreo;
  precio: string;
  modalidad: 'mensual' | 'anual';
}

export interface ActualizarPrecioMonitoreoRequest {
  tipo_configuracion: string;
  valor: string;
  nombre_parametro?: string;
}

export interface ActualizarParametroMonitoreoRequest {
  id_paquete: number;
  parametro: string;
  valor: string | number;
}

// ============ PAQUETES DE VERIFICACIÓN ============

export interface PaqueteVerificacion {
  id: number;
  nombre: string;
  tipo: 'MENSUAL' | 'ANUAL';
  descripcion: string;
  precio: string;
  precio_trial: string;
  dias_trial: number;
  caracteristicas: string;
  activo: number;
  orden: number;
  created_at: string;
  updated_at: string;
  suscripciones_activas?: number;
}

export interface ResumenPaquetesVerificacion {
  paquetes: PaqueteVerificacion[];
  estadisticas: {
    total_paquetes: number;
    paquetes_activos: number;
    total_suscripciones: number;
    mrr_total: string;
  };
}

export interface ActualizarPrecioVerificacionRequest {
  id_paquete: number;
  precio: string;
  precio_trial?: string;
}

export interface ActualizarConfiguracionVerificacionRequest {
  id_paquete: number;
  nombre?: string;
  descripcion?: string;
  caracteristicas?: string;
  dias_trial?: number;
  orden?: number;
}

export interface CambiarEstadoVerificacionRequest {
  id_paquete: number;
  activo: number;
}

// ============ RESPUESTAS API ============

export interface ApiResponsePaquetes<T> {
  error: boolean;
  message: string;
  data: T;
}

// ============ FILTROS ============

export interface FiltrosPaquetesSuscripcion {
  modalidad?: 'mensual' | 'anual';
  incluir_parametros?: boolean;
}

export interface FiltrosPaquetesMonitoreo {
  modalidad?: 'mensual' | 'anual';
  incluir_parametros?: boolean;
}
