import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Material } from './material.service';

// Define la estructura para la respuesta paginada, coincidiendo con la API real
export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface Accessory {
  id: number;
  name: string;
  description: string;
  cost?: number;
  price?: number;
  markup_percentage?: number;
  total_materials_cost?: number;
  total_materials_price?: number;
  total_accessories_cost?: number;
  total_accessories_price?: number;
  total_cost?: number;
  total_price?: number;
  // Add camelCase properties to handle API inconsistencies
  totalCost?: number;
  totalPrice?: number;
  owner_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AccessoryMaterial {
  id: number;
  name: string;
  description: string;
  accessory_id: number;
  material_id: number;
  material?: Material;
  material_type_id?: number;
  unit?: string;
  width?: number;
  length?: number;
  width_m_used?: number;
  length_m_used?: number;
  quantity?: number;
  cost?: number;
  price?: number;
  profit_percentage?: number;
}

export interface AccessoryComponent {
  id: number;
  child_accessory_id: number;
  quantity: number;
  component_name: string;
  component_description: string;
  cost: number;
  price: number;
}

export interface AccessoryMaterialDetail {
  material_id: number;
  width?: number;
  length?: number;
  unit: string;
  quantity?: number;
  cost: number;
  price: number;
  investment: number;
  description: string;
}

export interface AccessoryChildDetail {
  accessory_id: number;
  name: string;
  quantity: number;
  cost: number;
  price: number;
}

export interface AccessoryCreatePayload {
  name: string;
  description: string;
  owner_id: number;
  markup_percentage: number;
  materials: AccessoryMaterialDetail[];
  accessories: AccessoryChildDetail[];
  total_materials_cost: number;
  total_materials_price: number;
  total_accessories_cost: number;
  total_accessories_price: number;
  total_cost: number;
  total_price: number;
}

export interface AccessoryUpdatePayload {
  name: string;
  description: string;
  owner_id: number;
  markup_percentage: number;
  materials: AccessoryMaterialDetail[];
  accessories: AccessoryChildDetail[];
  total_cost?: number;
  total_price?: number;
}

export interface AccessoryTotals {
  accessory_id: number;
  accessory_name: string;
  cost: number;
  price: number;
  profit_margin: number;
  profit_percentage: number;
}


@Injectable({
  providedIn: 'root',
})
export class AccessoryService {
  private apiUrl = `${environment.apiUrl}/api/accessories`;
  private componentsApiUrl = `${environment.apiUrl}/api/accessory-components`;

  constructor(private http: HttpClient) {}

  createAccessoryDetailed(payload: AccessoryCreatePayload): Observable<Accessory> {
    return this.http.post<Accessory>(this.apiUrl, payload);
  }

  updateAccessoryDetailed(
    id: number,
    payload: AccessoryUpdatePayload
  ): Observable<Accessory> {
    return this.http.put<Accessory>(`${this.apiUrl}/${id}`, payload);
  }

  getAccessories(
    ownerId: number,
    page?: number,
    limit?: number,
    search?: string
  ): Observable<PaginatedResponse<Accessory>> {
    let params = new HttpParams().set('owner_id', ownerId.toString());

    if (page) {
      params = params.set('page', page.toString());
    }
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<PaginatedResponse<Accessory>>(this.apiUrl, { params });
  }

  getAccessoryById(id: number): Observable<Accessory> {
    return this.http.get<Accessory>(`${this.apiUrl}/${id}`);
  }

  deleteAccessory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteAccessoryMaterial(accessoryId: number, accessoryMaterialId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${accessoryId}/materials/${accessoryMaterialId}`);
  }

  getAccessoryMaterials(id: number): Observable<AccessoryMaterial[]> {
    return this.http.get<AccessoryMaterial[]>(`${this.apiUrl}/${id}/materials`);
  }

  getAccessoryComponents(id: number): Observable<AccessoryComponent[]> {
    return this.http.get<AccessoryComponent[]>(`${this.apiUrl}/${id}/components`);
  }

  addAccessoryComponent(
    parentId: number,
    childId: number,
    quantity: number
  ): Observable<AccessoryComponent> {
    const body = {
      parent_accessory_id: parentId,
      child_accessory_id: childId,
      quantity,
    };
    return this.http.post<AccessoryComponent>(
      this.componentsApiUrl,
      body
    );
  }

  deleteAccessoryComponent(accessoryId: number, accessoryComponentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${accessoryId}/components/${accessoryComponentId}`);
  }

  getAccessoryCost(id: number, ownerId?: number): Observable<AccessoryTotals> {
    let params = new HttpParams();
    if (ownerId) {
      params = params.set('ownerId', ownerId.toString());
    }
    return this.http.get<AccessoryTotals>(`${this.apiUrl}/${id}/cost`, {
      params,
    });
  }
}
