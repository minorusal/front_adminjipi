import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ParametrosResponse,
  ParametroStatsResponse,
  ParametroDetailResponse,
  ParametroApiResponse,
  ParametroFilters,
  CreateParametroRequest,
  UpdateParametroRequest
} from '../../shared/types/parametros.types';

@Injectable({
  providedIn: 'root'
})
export class ParametrosService {
  
  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de parámetros con filtros y paginación
   */
  getParametros(filters: ParametroFilters, baseUrl?: string): Observable<ParametrosResponse> {
    let params = new HttpParams();
    
    // Parámetros de paginación
    params = params.append('page', (filters.page || 1).toString());
    params = params.append('limit', (filters.limit || 20).toString());
    
    // Filtros de búsqueda
    if (filters.nombre) {
      params = params.append('nombre', filters.nombre);
    }
    if (filters.valor) {
      params = params.append('valor', filters.valor);
    }
    if (filters.descripcion) {
      params = params.append('descripcion', filters.descripcion);
    }
    if (filters.tipoDato) {
      params = params.append('tipoDato', filters.tipoDato);
    }
    
    // Filtros de fecha
    if (filters.dateFrom) {
      params = params.append('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params = params.append('dateTo', filters.dateTo);
    }
    
    // Ordenamiento
    if (filters.sortBy) {
      params = params.append('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params = params.append('sortOrder', filters.sortOrder);
    }

    const apiUrl = baseUrl || environment.apiUrl;
    const fullUrl = `${apiUrl}/api/parametros?${params.toString()}`;
    console.log('Making request to:', fullUrl);
    console.log('Filters object:', filters);
    console.log('Params object:', params.toString());
    return this.http.get<ParametrosResponse>(`${apiUrl}/api/parametros`, { params });
  }

  /**
   * Obtiene estadísticas de parámetros
   */
  getParametroStats(baseUrl?: string): Observable<ParametroStatsResponse> {
    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<ParametroStatsResponse>(`${apiUrl}/api/parametros/stats`);
  }

  /**
   * Obtiene un parámetro específico por ID
   */
  getParametroById(id: number, baseUrl?: string): Observable<ParametroDetailResponse> {
    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.get<ParametroDetailResponse>(`${apiUrl}/api/parametros/${id}`);
  }

  /**
   * Crea un nuevo parámetro
   */
  createParametro(parametro: CreateParametroRequest, baseUrl?: string): Observable<ParametroApiResponse> {
    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.post<ParametroApiResponse>(`${apiUrl}/api/parametros`, parametro);
  }

  /**
   * Actualiza un parámetro existente
   */
  updateParametro(id: number, parametro: UpdateParametroRequest, baseUrl?: string): Observable<ParametroApiResponse> {
    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.put<ParametroApiResponse>(`${apiUrl}/api/parametros/${id}`, parametro);
  }

  /**
   * Elimina un parámetro
   */
  deleteParametro(id: number, baseUrl?: string): Observable<ParametroApiResponse> {
    const apiUrl = baseUrl || environment.apiUrl;
    return this.http.delete<ParametroApiResponse>(`${apiUrl}/api/parametros/${id}`);
  }

  /**
   * Valida un valor según el tipo de dato
   */
  validateValueByType(value: string, tipo: string): boolean {
    switch (tipo) {
      case 'int':
        return /^-?\d+$/.test(value);
      case 'float':
        return /^-?\d*\.?\d+$/.test(value);
      case 'boolean':
        return ['true', 'false', '1', '0'].includes(value.toLowerCase());
      case 'json':
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      case 'date':
        return !isNaN(Date.parse(value));
      case 'string':
      default:
        return true;
    }
  }

  /**
   * Formatea un valor para mostrar según su tipo
   */
  formatValueForDisplay(value: string, tipo: string): string {
    switch (tipo) {
      case 'json':
        try {
          return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
          return value;
        }
      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      case 'boolean':
        return value === 'true' || value === '1' ? 'Verdadero' : 'Falso';
      default:
        return value;
    }
  }
}