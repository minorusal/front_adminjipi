export interface SessionInfo {
  loginId: string;
  sessionToken: string;
  sessionTokenId: string;
  refreshTokenId: string;
  createdAt: string;
  lastActivity: string;
  active: number;
}

export interface SessionUser {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
}

export interface SessionCompany {
  id: number;
  nombre: string;
  rfc: string;
}

export interface SessionRole {
  id: number;
  nombre: string;
}

export interface ActiveSession {
  sessionInfo: SessionInfo;
  user: SessionUser;
  company: SessionCompany;
  role: SessionRole;
}

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemsOnCurrentPage: number;
}

export interface ActiveSessionsResponse {
  error: boolean;
  message: string;
  data: {
    sessions: ActiveSession[];
    pagination: PaginationInfo;
  };
}

export interface SessionFilters {
  user_id?: number;
  company_id?: number;
  page?: number;
  limit?: number;
}