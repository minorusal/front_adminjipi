export interface Notificacion {
  from_company_id: number;
  from_user_id: number;
  to_company_id: number;
  to_user_id: number;
  title: string;
  body: string;
  payload: any;
  channel: string;
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
