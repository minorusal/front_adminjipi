import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Representa un nodo en la estructura de árbol del menú.
 */
export interface MenuNode {
  id: number;
  name: string;
  path?: string;
  children?: MenuNode[];
}

/**
 * Representa un único elemento de menú para operaciones CRUD.
 */
export interface MenuItem {
  id: number;
  name: string;
  path?: string;
  parent_id?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private apiUrl = `${environment.apiUrl}/api/menus`; // Corregido a plural

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el árbol de menús completo.
   * @returns Un Observable con la estructura de árbol del menú.
   */
  getMenuTree(): Observable<MenuNode[]> {
    return this.http.get<MenuNode[]>(`${this.apiUrl}/tree`);
  }

  /**
   * Obtiene la lista plana de todos los menús.
   * @returns Un Observable con la lista de menús.
   */
  getAllMenus(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.apiUrl);
  }

  /**
   * Crea un nuevo elemento de menú.
   * @param menuItem El elemento de menú a crear.
   * @returns Un Observable con el elemento de menú creado.
   */
  createMenuItem(menuItem: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.post<MenuItem>(this.apiUrl, menuItem);
  }

  /**
   * Actualiza un elemento de menú existente.
   * @param id El ID del elemento de menú a actualizar.
   * @param menuItem Los datos actualizados del elemento de menú.
   * @returns Un Observable con el elemento de menú actualizado.
   */
  updateMenuItem(id: number, menuItem: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.apiUrl}/${id}`, menuItem);
  }

  /**
   * Elimina un elemento de menú.
   * @param id El ID del elemento de menú a eliminar.
   * @returns Un Observable que se completa cuando la operación termina.
   */
  deleteMenuItem(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
