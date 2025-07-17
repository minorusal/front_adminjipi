export interface Notificacion {
  origen: number | null;
  destino: number;
  tipo: number;
  data: number;
}

export interface NotificationSeen {
  uuid: string;
}

export interface NotificationUpdateStatus {
  uuid: string;
  status: number;
}

export interface NotificationDelete {
  uuid: string;
}

export interface NotificationGet {
  uuid: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
}

export interface NotificationHistory {
  uuid: string;
}
