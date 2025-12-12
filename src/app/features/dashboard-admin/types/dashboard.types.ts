// Tipos para el Dashboard Administrativo de Suscripciones

// ============ MÉTRICAS GLOBALES ============

export interface ResumenGlobal {
  suscripciones_activas_total: number;
  mrr_total: string;
  pagos_pendientes_total: number;
  cambios_pendientes_total: number;
  tarjetas_expiradas: number;
  pagos_fallidos_24h: number;
}

export interface ModuloReportes {
  suscripciones_activas: number;
  mrr: string;
  pagos_pendientes: number;
  cambios_pendientes: number;
}

export interface ModuloMonitoreo {
  suscripciones_activas: number;
  mrr: string;
  pagos_pendientes: number;
  cambios_pendientes: number;
  clientes_monitoreados: number;
}

export interface ModuloVerificacion {
  suscripciones_activas: number;
  mrr: string;
  pagos_pendientes: number;
  en_periodo_prueba: number;
  pagando: number;
  pruebas_proximas_vencer: number;
}

export interface MetricasStripe {
  cobros_recurrentes_mes: number;
  monto_cobrado_mes: string;
  tarjetas_expiradas: number;
  pagos_fallidos_24h: number;
}

export interface AlertasResumen {
  requieren_atencion: number;
  criticas: number;
  advertencias: number;
  pruebas_por_vencer: number;
}

export interface MetricasGlobales {
  fecha_consulta: string;
  mes_actual: string;
  resumen_global: ResumenGlobal;
  reportes_credito: ModuloReportes;
  monitoreo: ModuloMonitoreo;
  verificacion: ModuloVerificacion;
  stripe: MetricasStripe;
  alertas: AlertasResumen;
}

// ============ ERRORES Y ALERTAS ============

export interface ResumenAlertas {
  total_alertas: number;
  pagos_fallidos_7d: number;
  tarjetas_expiradas: number;
  pagos_pendientes_24h: number;
  cobros_recurrentes_fallidos_mes: number;
  pruebas_sin_metodo_pago: number;
}

export interface PagoFallido {
  id: number;
  id_empresa: number;
  tipo_transaccion: string;
  monto: string;
  estatus_stripe: string;
  descripcion: string;
  metadata?: string;
  created_at: string;
  fecha_formatted: string;
}

export interface TarjetaExpirada {
  id: number;
  emp_id: number;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  expira_en: string;
  ya_expirada: boolean;
  ultimo_cobro_exitoso?: string;
  ultimo_cobro_exitoso_formatted?: string;
}

export interface PagoPendiente {
  id: number;
  id_empresa: number;
  paquete: string;
  monto: string;
  hash: string;
  stripe_session_id: string;
  created_at: string;
  horas_pendiente: number;
  fecha_formatted: string;
}

export interface PagosPendientes {
  reportes: PagoPendiente[];
  monitoreo: PagoPendiente[];
  verificacion: PagoPendiente[];
}

export interface CobroRecurrenteFallido {
  id: number;
  id_empresa: number;
  tipo_transaccion: string;
  monto: string;
  nombre_paquete: string;
  estatus_stripe: string;
  descripcion: string;
  created_at: string;
  fecha_formatted: string;
}

export interface PruebaSinMetodoPago {
  id: number;
  emp_id: number;
  nombre_paquete: string;
  fecha_prueba_inicio: string;
  fecha_prueba_fin: string;
  dias_restantes: number;
  payment_status: string;
  vence_formatted: string;
}

export interface PagoVerificacionFallido {
  id: number;
  id_empresa: number;
  paquete: string;
  monto: string;
  tipo_pago: string;
  estatus: string;
  created_at: string;
  fecha_formatted: string;
}

export interface AlertasVerificacion {
  pruebas_sin_metodo_pago: PruebaSinMetodoPago[];
  pagos_fallidos: PagoVerificacionFallido[];
}

export interface ErroresAlertas {
  resumen: ResumenAlertas;
  pagos_fallidos: PagoFallido[];
  tarjetas_expiradas: TarjetaExpirada[];
  pagos_pendientes: PagosPendientes;
  cobros_recurrentes_fallidos: CobroRecurrenteFallido[];
  verificacion: AlertasVerificacion;
}

// ============ TRANSACCIONES RECIENTES ============

export interface FiltrosAplicados {
  limite: number;
  tipo: string;
  estatus: string;
}

export interface ResumenTransacciones {
  total_transacciones: number;
  exitosas: number;
  fallidas: number;
  pendientes: number;
  monto_total_exitoso: string;
}

export interface Transaccion {
  id: number;
  id_empresa: number;
  stripe_session_id: string;
  stripe_payment_intent_id: string;
  stripe_payment_method_id: string;
  tipo_transaccion: string;
  monto: string;
  moneda: string;
  nombre_paquete: string;
  estatus: string;
  estatus_stripe: string;
  descripcion: string;
  fecha_pago: string;
  created_at: string;
  fecha_formatted: string;
}

export interface TransaccionesRecientes {
  filtros_aplicados: FiltrosAplicados;
  resumen: ResumenTransacciones;
  transacciones: Transaccion[];
}

// ============ COBROS RECURRENTES ============

export interface ResumenCobrosRecurrentes {
  reportes_pendientes_renovacion: number;
  monitoreo_pendientes_facturacion: number;
  total_pendientes: number;
  cobros_exitosos_30d: number;
  monto_cobrado_30d: string;
  cobros_fallidos_30d: number;
  monto_perdido_30d: string;
}

export interface SuscripcionReportePendiente {
  id: number;
  emp_id: number;
  tipo_plan: string;
  precio_mensual: string;
  fecha_fin: string;
  metodo_pago: string;
  dias_atrasado: number;
}

export interface SuscripcionMonitoreoPendiente {
  id: number;
  emp_id: number;
  nombre_paquete: string;
  precio_mensual: string;
  fecha_proximo_ciclo: string;
  metodo_pago: string;
  dias_atrasado: number;
}

export interface SuscripcionesPendientes {
  reportes: SuscripcionReportePendiente[];
  monitoreo: SuscripcionMonitoreoPendiente[];
}

export interface AlertasCobros {
  reportes_atrasados: number;
  monitoreo_atrasado: number;
}

export interface CobrosRecurrentes {
  fecha_consulta: string;
  dia_mes: number;
  resumen: ResumenCobrosRecurrentes;
  suscripciones_pendientes: SuscripcionesPendientes;
  alertas: AlertasCobros;
}

// ============ ESTADÍSTICAS STRIPE ============

export interface PeriodoAnalizado {
  dias: number;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface MetricasGlobalesStripe {
  total_transacciones: number;
  total_exitosas: number;
  total_fallidas: number;
  total_pendientes: number;
  tasa_exito_global: string;
  ingresos_reales: string;
  ingresos_perdidos: string;
  ticket_promedio: string;
  empresas_activas: number;
}

export interface AnalisisPorTipo {
  tipo_transaccion: string;
  total: number;
  exitosas: number;
  fallidas: number;
  tasa_exito: string;
  ingresos_generados: string;
  ingresos_perdidos: string;
}

export interface TendenciaDiaria {
  fecha: string;
  total_transacciones: number;
  exitosas: number;
  fallidas: number;
  monto_exitoso: string;
  monto_perdido: string;
  tasa_exito: string;
}

export interface TopEmpresa {
  id_empresa: number;
  total_transacciones: number;
  exitosas: number;
  fallidas: number;
  monto_pagado: string;
  monto_total_intentado: string;
  tasa_exito: string;
}

export interface AnalisisMetodoPago {
  marca_tarjeta: string;
  total_transacciones: number;
  exitosas: number;
  tasa_exito: string;
}

export interface RazonFallo {
  estatus_stripe: string;
  total_fallos: number;
  monto_perdido: string;
  paquetes_afectados: string;
}

export interface AnalisisPorModulo {
  modulo: string;
  total_transacciones: number;
  exitosas: number;
  fallidas: number;
  tasa_exito: string;
  ingresos_generados: string;
  ingresos_perdidos: string;
  ticket_promedio: string;
  empresas_activas: number;
}

export interface EstadisticasStripe {
  periodo_analizado: PeriodoAnalizado;
  metricas_globales: MetricasGlobalesStripe;
  analisis_por_tipo: AnalisisPorTipo[];
  tendencia_diaria: TendenciaDiaria[];
  top_empresas: TopEmpresa[];
  analisis_metodos_pago: AnalisisMetodoPago[];
  razones_fallo: RazonFallo[];
  analisis_por_modulo: AnalisisPorModulo[];
  resumen_detallado?: any[];
}

// ============ RESPUESTAS API ============

export interface ApiResponse<T> {
  error: boolean;
  message: string;
  data: T;
}

// ============ FILTROS ============

export interface FiltrosTransacciones {
  limite?: number;
  tipo?: 'todas' | 'pago_inicial' | 'cobro_recurrente' | 'upgrade' | 'downgrade' | 'reintento_cobro';
  estatus?: 'todos' | 'exitoso' | 'fallido' | 'pendiente' | 'reembolsado';
}

export interface FiltrosEstadisticas {
  periodo?: number; // días
}

// ============ EMPRESAS CON SUSCRIPCIONES ============

export interface Empresa {
  emp_id: number;
  cin_id: number;
  emp_nombre: string;
  emp_razon_social: string;
  denominacion: string;
  emp_rfc: string;
  konesh_valid: 'true' | 'false';
  contador_konesh: number;
  contador_konesh_razon_social_no_igual: number;
  giro: string;
  emp_website: string;
  emp_phone: string;
  emp_logo: string;
  emp_banner: string;
  emp_video: string;
  emp_ventas_gob: number;
  emp_ventas_credito: number;
  emp_ventas_contado: number;
  emp_loc: number;
  emp_nac: number;
  emp_int: number;
  emp_exportacion: number;
  emp_credito: number;
  emp_certificada: number;
  emp_empleados: number;
  emp_status: number;
  emp_fecha_fundacion: string;
  emp_fecha_creacion: string;
  emp_update: string;
  emp_marcas: string;
  valores: string;
  anios_experiencia: string;
  reg_active: number;
  proposito: string;
  tipo: '1' | '2';
  cronos: 'true' | 'false';
}

export interface SuscripcionReporte {
  id: number;
  emp_id: number;
  id_paquete: number;
  tipo_plan: string;
  precio_mensual: string;
  precio_anual: string;
  reportes_acumulados: number;
  reportes_incluidos: number;
  max_reportes_ondemand: number;
  precio_reporte_ondemand?: string;
  modalidad_pago: 'MENSUAL' | 'ANUAL';
  metodo_pago: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  codigo_promocional_aplicado: string | null;
  descuento_aplicado: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_aniversario?: string;
  fecha_renovacion: string;
  fecha_proximo_ciclo: string;
  periodo_gracia_dias: number;
  en_periodo_gracia: number;
  estado: 'activa' | 'cancelada' | 'suspendida' | 'expirada';
  razon_cancelacion: string | null;
  auto_renovacion: number;
  ciclo_facturacion_activo: number;
  ultimo_ciclo_procesado?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
  fecha_inicio_formatted: string;
  fecha_fin_formatted: string;
  fecha_renovacion_formatted: string;
  dias_restantes: number;
  esta_activa: boolean;
  esta_por_vencer: boolean;
}

export interface SuscripcionMonitoreo {
  id: number;
  emp_id: number;
  paquete_id: number;
  nombre_paquete: string;
  precio_mensual: string;
  clientes_min: number;
  clientes_max: number;
  clientes_actuales: number;
  modalidad_pago: 'mensual' | 'anual';
  metodo_pago: string;
  estado: 'activa' | 'cancelada' | 'suspendida' | 'pendiente_pago';
  stripe_customer_id: string;
  stripe_subscription_id: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  fecha_proximo_ciclo: string;
  fecha_ultima_facturacion: string;
  ciclo_facturacion_activo: number;
  intentos_cobro_fallidos: number;
  ultima_fecha_intento_cobro: string | null;
  codigo_promocional_aplicado: string | null;
  descuento_aplicado: string;
  razon_cancelacion: string | null;
  fecha_solicitud_cancelacion: string | null;
  cancelado_por: string | null;
  created_at: string;
  updated_at: string;
  fecha_inicio_formatted: string;
  fecha_fin_formatted: string | null;
  fecha_proximo_ciclo_formatted: string;
  dias_hasta_facturacion: number;
  esta_activa: boolean;
  capacidad_usada_porcentaje: string;
}

export interface SuscripcionVerificacion {
  id: number;
  emp_id: number;
  id_paquete: number;
  nombre_paquete: string;
  tipo_plan: 'MENSUAL' | 'ANUAL';
  precio_mensual: string;
  precio_total: string;
  en_periodo_prueba: number;
  prueba_utilizada: number;
  fecha_prueba_inicio: string | null;
  fecha_prueba_fin: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  fecha_prox_corte: string;
  estado: 'EN_PRUEBA' | 'ACTIVA' | 'VENCIDA' | 'CANCELADA';
  es_activa: number;
  payment_status: 'PENDING_METHOD' | 'READY' | 'PAID' | 'PAST_DUE' | 'FAILED' | 'CANCELLED';
  metodo_pago: 'stripe' | 'transferencia' | 'otro';
  payment_hash: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_checkout_session_id: string | null;
  stripe_price_id: string;
  ciclo_facturacion_activo: number;
  renovacion_automatica: number;
  reintentos_pago: number;
  ultimo_intento_pago: string | null;
  proximo_intento_pago: string | null;
  fecha_cancelacion: string | null;
  motivo_cancelacion: string | null;
  cancelado_por: number | null;
  webhook_last_event: string | null;
  webhook_last_ts: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  fecha_prueba_inicio_formatted: string | null;
  fecha_prueba_fin_formatted: string | null;
  fecha_inicio_formatted: string;
  fecha_fin_formatted: string | null;
  fecha_prox_corte_formatted: string;
  dias_restantes_prueba: number;
  dias_hasta_proximo_ciclo: number;
  esta_en_prueba: boolean;
  prueba_por_vencer: boolean;
  esta_activa: boolean;
}

export interface SuscripcionesEmpresa {
  reportes_credito: SuscripcionReporte[];
  monitoreo: SuscripcionMonitoreo[];
  verificacion: SuscripcionVerificacion[];
}

export interface MetodoPago {
  id: number;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  estado: 'activo' | 'inactivo';
  es_default: number;
  ultimo_cobro_exitoso: string | null;
  ultimo_cobro_fallido: string | null;
  ultimo_cobro_exitoso_formatted: string | null;
  ultimo_cobro_fallido_formatted: string | null;
  tarjeta_expirada: boolean;
  expira_en: string;
}

export interface TransaccionReciente {
  id: number;
  stripe_payment_intent_id: string;
  tipo_transaccion: string;
  monto: string;
  moneda: string;
  nombre_paquete: string;
  modulo: 'reportes' | 'monitoreo' | 'verificacion';
  estatus: 'exitoso' | 'fallido' | 'pendiente';
  estatus_stripe: string;
  fecha_pago: string;
  created_at: string;
  fecha_formatted: string;
}

export interface SuscripcionesActivas {
  reportes: number;
  monitoreo: number;
  verificacion: number;
}

export interface ResumenEmpresa {
  total_suscripciones: number;
  suscripciones_activas: SuscripcionesActivas;
  mrr_total: string;
  tiene_metodo_pago: boolean;
  metodos_pago_activos: number;
  ultima_transaccion: string | null;
}

export interface EmpresaConSuscripciones {
  empresa: Empresa;
  suscripciones: SuscripcionesEmpresa;
  metodos_pago: MetodoPago[];
  transacciones_recientes: TransaccionReciente[];
  resumen: ResumenEmpresa;
}

export interface FiltrosEmpresasSuscripciones {
  limite?: number;
  emp_id?: number;
  estado_suscripcion?: 'todas' | 'activa' | 'cancelada' | 'suspendida' | 'expirada';
}

export interface FiltrosAplicadosEmpresas {
  limite: number;
  emp_id: number | null;
  estado_suscripcion: string;
}

export interface EmpresasConSuscripciones {
  total_empresas: number;
  filtros_aplicados: FiltrosAplicadosEmpresas;
  empresas: EmpresaConSuscripciones[];
}
