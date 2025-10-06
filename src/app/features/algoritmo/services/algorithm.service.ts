import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TablesResponse,
  TableSchemaResponse,
  CatalogRecordsResponse,
  SingleRecordResponse,
  CreateRecordResponse,
  UpdateRecordResponse,
  DeleteRecordResponse,
  BatchRequest,
  BatchResponse,
  FilterOptions
} from '../types/algorithm.types';

@Injectable({
  providedIn: 'root'
})
export class AlgorithmService {
  private baseUrl = `${environment.apiUrl}/api/catalogos-algoritmo`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de todas las tablas disponibles
   */
  getTables(): Observable<TablesResponse> {
    return this.http.get<TablesResponse>(`${this.baseUrl}/tables`);
  }

  /**
   * Obtiene el esquema de una tabla específica
   */
  getTableSchema(table: string, baseUrl?: string): Observable<TableSchemaResponse> {
    const apiUrl = baseUrl ? `${baseUrl}/api/catalogos-algoritmo` : this.baseUrl;
    return this.http.get<TableSchemaResponse>(`${apiUrl}/${table}/schema`);
  }

  /**
   * Lista registros de una tabla con filtros y paginación
   */
  getRecords(table: string, filters: FilterOptions = {}, baseUrl?: string): Observable<CatalogRecordsResponse> {
    let params = new HttpParams();

    // Agregar todos los filtros como parámetros
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Manejar filtros complejos como min/max
          Object.keys(value).forEach(subKey => {
            if (value[subKey] !== null && value[subKey] !== undefined && value[subKey] !== '') {
              params = params.append(`${key}[${subKey}]`, value[subKey].toString());
            }
          });
        } else {
          params = params.append(key, value.toString());
        }
      }
    });

    const apiUrl = baseUrl ? `${baseUrl}/api/catalogos-algoritmo` : this.baseUrl;
    return this.http.get<CatalogRecordsResponse>(`${apiUrl}/${table}`, { params });
  }

  /**
   * Obtiene un registro específico por ID
   */
  getRecord(table: string, id: number): Observable<SingleRecordResponse> {
    return this.http.get<SingleRecordResponse>(`${this.baseUrl}/${table}/${id}`);
  }

  /**
   * Crea un nuevo registro
   */
  createRecord(table: string, data: Record<string, any>): Observable<CreateRecordResponse> {
    return this.http.post<CreateRecordResponse>(`${this.baseUrl}/${table}`, data);
  }

  /**
   * Actualiza un registro existente
   */
  updateRecord(table: string, id: number, data: Record<string, any>, baseUrl?: string): Observable<UpdateRecordResponse> {
    const apiUrl = baseUrl ? `${baseUrl}/api/catalogos-algoritmo` : this.baseUrl;
    return this.http.put<UpdateRecordResponse>(`${apiUrl}/${table}/${id}`, data);
  }

  /**
   * Elimina un registro
   */
  deleteRecord(table: string, id: number): Observable<DeleteRecordResponse> {
    return this.http.delete<DeleteRecordResponse>(`${this.baseUrl}/${table}/${id}`);
  }

  /**
   * Ejecuta operaciones en lote
   */
  batchOperations(operations: BatchRequest): Observable<BatchResponse> {
    return this.http.post<BatchResponse>(`${this.baseUrl}/batch`, operations);
  }

  /**
   * Construye parámetros de filtro para ranges
   */
  buildRangeFilter(field: string, min?: number, max?: number): Record<string, any> {
    const filter: Record<string, any> = {};
    if (min !== undefined && min !== null) {
      filter[`${field}[min]`] = min;
    }
    if (max !== undefined && max !== null) {
      filter[`${field}[max]`] = max;
    }
    return filter;
  }

  /**
   * Construye parámetro de filtro LIKE
   */
  buildLikeFilter(field: string, value: string): Record<string, any> {
    return {
      [`${field}[like]`]: value
    };
  }
}