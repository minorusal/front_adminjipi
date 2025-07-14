import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MaterialType {
  id: number;
  name: string;
  unit: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export type NewMaterialType = Omit<MaterialType, 'id' | 'created_at' | 'updated_at'>;

@Injectable({
  providedIn: 'root',
})
export class MaterialTypeService {
  private apiUrl = `${environment.apiUrl}/api/material-types`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los tipos de materiales.
   * @returns Un Observable con la lista de tipos de material.
   */
  getMaterialTypes(): Observable<MaterialType[]> {
    return this.http.get<MaterialType[]>(this.apiUrl);
  }

  /**
   * Obtiene un tipo de material por su ID.
   * @param id El ID del tipo de material.
   * @returns Un Observable con el tipo de material encontrado.
   */
  getMaterialTypeById(id: number): Observable<MaterialType> {
    return this.http.get<MaterialType>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo tipo de material.
   * @param materialType El tipo de material a crear.
   * @returns Un Observable con el tipo de material creado.
   */
  createMaterialType(materialType: { name: string }): Observable<MaterialType> {
    return this.http.post<MaterialType>(this.apiUrl, materialType);
  }

  /**
   * Actualiza un tipo de material existente.
   * @param id El ID del tipo de material a actualizar.
   * @param materialType Los datos actualizados del tipo de material.
   * @returns Un Observable con el tipo de material actualizado.
   */
  updateMaterialType(id: number, materialType: { name: string }): Observable<MaterialType> {
    return this.http.put<MaterialType>(`${this.apiUrl}/${id}`, materialType);
  }

  /**
   * Elimina un tipo de material.
   * @param id El ID del tipo de material a eliminar.
   * @returns Un Observable que se completa cuando la operación termina.
   */
  deleteMaterialType(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
