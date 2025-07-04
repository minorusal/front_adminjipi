import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CookieService } from './cookie.service';
import { Material } from './material.service';

export interface Accessory {
  id: number;
  name: string;
  description: string;
  /** Total cost of materials without profit */
  cost?: number;
  /** Final price including profit percentage */
  price?: number;
  /** Stored markup percentage */
  markup_percentage?: number;
  /** Total cost of all materials */
  total_materials_cost?: number;
  /** Total price of all materials */
  total_materials_price?: number;
  /** Total cost of all child accessories */
  total_accessories_cost?: number;
  /** Total price of all child accessories */
  total_accessories_price?: number;
  /** Combined materials and accessories cost */
  total_cost?: number;
  /** Final price including profit */
  total_price?: number;
  owner_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AccessoryMaterial {
  accessory_id: number;
  material_id: number;
  /** Base material information when returned from the API */
  material?: Material;
  /** Material type identifier when returned from the API */
  material_type_id?: number;
  /** Unit of measure for the material when returned from the API */
  unit?: string;
  /**
   * Values used when the material is measured by area.
   * For backwards compatibility the API might also return `width`/`length`.
   */
  width?: number;
  length?: number;
  width_m_used?: number;
  length_m_used?: number;
  /** Quantity when the material is a discrete piece or other unit */
  quantity?: number;
  cost?: number;
  price?: number;
  profit_percentage?: number;
}

export interface AccessoryMaterialPayload
  extends Omit<AccessoryMaterial, 'accessory_id'> {
  accessory_id?: number;
}

export interface PaginatedAccessories {
  docs: Accessory[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
}

export interface AccessoryComponent {
  id: number;
  parent_accessory_id: number;
  child_accessory_id: number;
  quantity: number;
  /** Cost for the specified quantity */
  cost?: number;
  /** Price for the specified quantity */
  price?: number;
  child?: Accessory;
}

export interface AccessoryChildPayload {
  accessory_id: number;
  price: number;
  cost: number;
  quantity: number;
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
  providedIn: 'root'
})
export class AccessoryService {
  constructor(private http: HttpClient, private cookieService: CookieService) {}

  private httpOptions() {
    const token = this.cookieService.get('token');
    return token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
  }

  addAccessory(
    name: string,
    description: string,
    ownerId: number,
    materials: AccessoryMaterialPayload[] = [],
    accessories: AccessoryChildPayload[] = []
  ): Observable<Accessory> {
    const body: any = { name, description, owner_id: ownerId };
    if (materials.length) {
      body.materials = materials;
    }
    if (accessories.length) {
      body.accessories = accessories;
    }
    return this.http.post<Accessory>(
      `${environment.apiUrl}/accessories`,
      body,
      this.httpOptions()
    );
  }

  createAccessoryDetailed(payload: AccessoryCreatePayload): Observable<Accessory> {
    return this.http.post<Accessory>(
      `${environment.apiUrl}/accessories`,
      payload,
      this.httpOptions()
    );
  }

  updateAccessoryDetailed(
    id: number,
    payload: AccessoryUpdatePayload
  ): Observable<Accessory> {
    return this.http.put<Accessory>(
      `${environment.apiUrl}/accessories/${id}`,
      payload,
      this.httpOptions()
    );
  }

  addAccessoryMaterials(
    accessoryId: number,
    markupPercentage: number,
    materials: AccessoryMaterial[],
    accessories: AccessoryChildPayload[] = [],
    totalMaterialsPrice?: number,
    totalAccessoriesPrice?: number,
    totalPrice?: number
  ): Observable<any> {
    const body = {
      accessory_id: accessoryId,
      markup_percentage: markupPercentage,
      materials,
      accessories,
      total_materials_price: totalMaterialsPrice,
      total_accessories_price: totalAccessoriesPrice,
      total_price: totalPrice
    };
    return this.http.post<any>(
      `${environment.apiUrl}/accessory-materials`,
      body,
      this.httpOptions()
    );
  }

  /**
   * Update the materials used in an accessory. The provided materials payload
   * omits the `accessory_id` property as it is derived from the supplied
   * `accessoryId` argument.
   */
  updateAccessoryMaterials(
    accessoryId: number,
    markupPercentage: number,
    materials: AccessoryMaterialPayload[],
    accessories: AccessoryChildPayload[] = [],
    totalMaterialsPrice?: number,
    totalAccessoriesPrice?: number,
    totalPrice?: number
  ): Observable<any> {
    const body = {
      accessory_id: accessoryId,
      markup_percentage: markupPercentage,
      materials,
      accessories,
      total_materials_price: totalMaterialsPrice,
      total_accessories_price: totalAccessoriesPrice,
      total_price: totalPrice
    };
    return this.http.put<any>(
      `${environment.apiUrl}/accessory-materials/${accessoryId}`,
      body,
      this.httpOptions()
    );
  }

  getAccessories(
    ownerId: number,
    page?: number,
    limit?: number,
    search?: string
  ): Observable<PaginatedAccessories> {
    let url = `${environment.apiUrl}/accessories?owner_id=${ownerId}`;
    const params: string[] = [];
    if (page !== undefined) {
      params.push(`page=${page}`);
    }
    if (limit !== undefined) {
      params.push(`limit=${limit}`);
    }
    if (search !== undefined && search !== '') {
      params.push(`search=${encodeURIComponent(search)}`);
    }
    if (params.length) {
      url += `&${params.join('&')}`;
    }
    return this.http.get<PaginatedAccessories>(url, this.httpOptions());
  }

  getAccessory(id: number): Observable<Accessory> {
    return this.http.get<Accessory>(
      `${environment.apiUrl}/accessories/${id}`,
      this.httpOptions()
    );
  }

  updateAccessory(
    id: number,
    name: string,
    description: string
  ): Observable<Accessory> {
    const body = { name, description };
    return this.http.put<Accessory>(
      `${environment.apiUrl}/accessories/${id}`,
      body,
      this.httpOptions()
    );
  }

  getAccessoryMaterials(id: number): Observable<AccessoryMaterial[]> {
    const url = `${environment.apiUrl}/accessories/${id}/materials`;
    return this.http.get<AccessoryMaterial[]>(url, this.httpOptions());
  }

  getAccessoryComponents(id: number): Observable<AccessoryComponent[]> {
    const url = `${environment.apiUrl}/accessories/${id}/components`;
    return this.http.get<AccessoryComponent[]>(url, this.httpOptions());
  }

  addAccessoryComponent(
    parentId: number,
    childId: number,
    quantity: number
  ): Observable<AccessoryComponent> {
    const body = {
      parent_accessory_id: parentId,
      child_accessory_id: childId,
      quantity
    };
    return this.http.post<AccessoryComponent>(
      `${environment.apiUrl}/accessory-components`,
      body,
      this.httpOptions()
    );
  }

  deleteAccessoryComponent(id: number): Observable<any> {
    return this.http.delete<any>(
      `${environment.apiUrl}/accessory-components/${id}`,
      this.httpOptions()
    );
  }

  getAccessoryCost(id: number, ownerId?: number): Observable<AccessoryTotals> {
    let url = `${environment.apiUrl}/accessories/${id}/cost`;
    if (ownerId !== undefined) {
      url += `?owner_id=${ownerId}`;
    }
    return this.http.get<AccessoryTotals>(url, this.httpOptions());
  }
}
