import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Remission {
  id: number;
  // Add other remission fields here based on your data model
  // e.g., projectId: number, clientId: number, date: string, etc.
  created_at?: string;
  updated_at?: string;
}

export type NewRemission = Omit<Remission, 'id' | 'created_at' | 'updated_at'>;

export interface PaginatedRemissions {
  docs: Remission[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class RemissionService {
  private apiUrl = `${environment.apiUrl}/api/remissions`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las remisiones con paginación.
   * @param page El número de página.
   * @param limit El número de remisiones por página.
   * @returns Un Observable con la respuesta paginada de remisiones.
   */
  getRemissions(page: number, limit: number): Observable<PaginatedRemissions> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedRemissions>(this.apiUrl, { params });
  }

  /**
   * Obtiene una remisión por su ID.
   * @param id El ID de la remisión.
   * @returns Un Observable con la remisión encontrada.
   */
  getRemissionById(id: number): Observable<Remission> {
    return this.http.get<Remission>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva remisión.
   * @param remission La remisión a crear.
   * @returns Un Observable con la remisión creada.
   */
  createRemission(remission: Remission): Observable<Remission> {
    return this.http.post<Remission>(this.apiUrl, remission);
  }

  /**
   * Actualiza una remisión existente.
   * @param id El ID de la remisión a actualizar.
   * @param remission Los datos actualizados de la remisión.
   * @returns Un Observable con la remisión actualizada.
   */
  updateRemission(id: number, remission: Partial<Remission>): Observable<Remission> {
    return this.http.put<Remission>(`${this.apiUrl}/${id}`, remission);
  }

  /**
   * Elimina una remisión.
   * @param id El ID de la remisión a eliminar.
   * @returns Un Observable que se completa cuando la operación termina.
   */
  deleteRemission(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
