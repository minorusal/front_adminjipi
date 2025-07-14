import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface for a material attribute (e.g., thickness, width)
export interface MaterialAttribute {
  value: number;
  unit: string;
}

// Interface for the detailed material object used for "get by ID" and "update"
export interface Material {
  id: number;
  name: string;
  description: string;
  material_type_id: number;
  owner_id: number;
  purchase_price: string;
  profit_percentage_at_creation?: string;
  sale_price: string;
  attributes: {
    [key: string]: MaterialAttribute;
  };
  type_name: string;
}

// Interface for the material object in a list (paginated response)
export interface MaterialInList {
  id: number;
  name:string;
  description: string;
  purchase_price?: number;
  profit_percentage_at_creation?: number;
  sale_price: number;
  type_name: string;
}

// Interface for the paginated response from the API
export interface PaginatedMaterials {
  docs: MaterialInList[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  search?: string;
}

// Interface for the payload when creating a new material
export interface CreateMaterialPayload {
  name: string;
  description: string;
  material_type_id: number;
  owner_id: number;
  purchase_price: number;
  profit_percentage?: number;
  attributes: {
    [key: string]: MaterialAttribute;
  };
}

// The update payload is the same as the create payload
export type UpdateMaterialPayload = CreateMaterialPayload;

@Injectable({
  providedIn: 'root',
})
export class MaterialService {
  private apiUrl = `${environment.apiUrl}/api/materials`;

  constructor(private http: HttpClient) {}

  getMaterials(
    page: number,
    limit: number,
    search?: string
  ): Observable<PaginatedMaterials> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedMaterials>(this.apiUrl, { params });
  }

  getMaterialById(id: number): Observable<Material> {
    return this.http.get<Material>(`${this.apiUrl}/${id}`);
  }

  createMaterial(payload: CreateMaterialPayload): Observable<Material> {
    return this.http.post<Material>(this.apiUrl, payload);
  }

  updateMaterial(id: number, payload: UpdateMaterialPayload): Observable<Material> {
    return this.http.put<Material>(`${this.apiUrl}/${id}`, payload);
  }

  deleteMaterial(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
