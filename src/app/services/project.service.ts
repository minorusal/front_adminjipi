import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Define la estructura de un Proyecto
export interface Project {
  id: number;
  name: string;
  // Agrega aquí otros campos relevantes del proyecto
}

// Define la estructura de la respuesta paginada genérica
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type NewProject = Omit<Project, 'id' | 'created_at' | 'updated_at'>;

export interface PaginatedProjects {
  docs: Project[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/api/projects`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los proyectos con paginación.
   * @param page El número de página.
   * @param limit El número de proyectos por página.
   * @returns Un Observable con la respuesta paginada de proyectos.
   */
  getProjects(page: number, limit: number): Observable<PaginatedResponse<Project>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedResponse<Project>>(this.apiUrl, { params });
  }

  /**
   * Obtiene un proyecto por su ID.
   * @param id El ID del proyecto.
   * @returns Un Observable con el proyecto encontrado.
   */
  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo proyecto.
   * @param project El proyecto a crear.
   * @returns Un Observable con el proyecto creado.
   */
  createProject(project: Project): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  /**
   * Actualiza un proyecto existente.
   * @param id El ID del proyecto a actualizar.
   * @param project Los datos actualizados del proyecto.
   * @returns Un Observable con el proyecto actualizado.
   */
  updateProject(id: number, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
  }

  /**
   * Elimina un proyecto.
   * @param id El ID del proyecto a eliminar.
   * @returns Un Observable que se completa cuando la operación termina.
   */
  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Descarga el PDF de un proyecto.
   * @param id El ID del proyecto.
   * @returns Un Observable con el Blob del PDF.
   */
  downloadProjectPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }
} 