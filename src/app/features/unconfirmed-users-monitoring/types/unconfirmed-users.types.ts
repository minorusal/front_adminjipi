// Usuario no confirmado con información detallada
export interface UsuarioNoConfirmado {
  usu_id: number;
  usu_nombre: string | null;
  usu_app: string | null;
  nombre_completo: string;
  usu_email: string;
  estatus_registro: string;
  fecha_registro: string;
  emp_id: number | null;
  empresa_nombre: string | null;
  empresa_completa: string | null;
}

// Usuario simple dentro de empresa
export interface UsuarioSimple {
  usu_id: number;
  nombre_completo: string;
  email: string;
  fecha_registro: string;
}

// Información de empresa
export interface EmpresaInfo {
  emp_id: number;
  empresa_nombre: string;
  empresa_completa: string;
}

// Usuarios agrupados por empresa (objeto con IDs como keys)
export interface UsuariosPorEmpresaMap {
  [empresaId: string]: {
    empresa_info: EmpresaInfo;
    usuarios: UsuarioSimple[];
  };
}

// Estadísticas de usuarios no confirmados
export interface UnconfirmedUsersStats {
  total_no_confirmados: number;
  con_empresa: number;
  sin_empresa: number;
  primer_registro: string | null;
  ultimo_registro: string | null;
}

// Estructura de data dentro de la respuesta
export interface UnconfirmedUsersData {
  estadisticas: UnconfirmedUsersStats;
  usuarios_por_empresa: UsuariosPorEmpresaMap;
  usuarios_sin_empresa: UsuarioNoConfirmado[];
  total_empresas_afectadas: number;
  usuarios_detallados: UsuarioNoConfirmado[];
}

// Respuesta del endpoint GET /api/cron/unconfirmed-users
export interface UnconfirmedUsersResponse {
  error: boolean;
  message: string;
  data: UnconfirmedUsersData;
}
