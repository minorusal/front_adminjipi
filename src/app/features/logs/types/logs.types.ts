export interface LogFile {
  filename: string;
  size: number;
  lastModified: string;
  path: string;
  type: 'current' | 'archived';
}

export interface LogFileStats {
  totalFiles: number;
  totalSize: number;
  newestFile: string;
  oldestFile: string;
  currentLogSize: number;
}

export interface LogFilesResponse {
  error: boolean;
  message: string;
  ok: boolean;
  data: {
    files: LogFile[];
    stats: LogFileStats;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: Record<string, any>;
  raw?: string;
}

export interface LogSearchParams {
  startDate?: string;
  endDate?: string;
  level?: string;
  search?: string;
  limit?: number;
  format?: 'json' | 'raw';
}

export interface LogSearchResponse {
  error: boolean;
  message: string;
  ok: boolean;
  data: {
    entries: LogEntry[];
    totalFound: number;
    searchParams: LogSearchParams;
    executionTime: number;
  };
}

export interface LogTailOptions {
  lines?: number;
  follow?: boolean;
  level?: string;
  search?: string;
}

export interface ApiResponse<T> {
  error: boolean;
  message: string;
  ok: boolean;
  data: T;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'all';

export interface LogFilters {
  dateFrom?: string;
  dateTo?: string;
  level?: LogLevel;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

// New types for certification logs search endpoint
export interface CertificationLogSearchParams {
  from: string;          // Date format YYYY-MM-DD
  to: string;            // Date format YYYY-MM-DD
  query: string;         // Search text
  limit: number;         // Max 5000
  level?: 'info' | 'warn' | 'error';  // Optional log level
  maxFiles?: number;     // Optional, max 3
}

export interface CertificationLogEntry {
  timestamp: string;
  level: string;
  message: string;
  file?: string;
  line?: number;
  metadata?: Record<string, any>;
}

export interface CertificationLogSearchResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    logs: CertificationLogEntry[];
    total: number;
    searchParams: CertificationLogSearchParams;
    executionTime: number;
    filesSearched: string[];
  };
}