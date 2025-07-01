import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CookieService } from './cookie.service';

export interface Accessory {
  id: number;
  name: string;
  description: string;
  /** Total cost of materials without profit */
  cost?: number;
  /** Final price including profit percentage */
  price?: number;
  owner_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AccessoryMaterial {
  accessory_id: number;
  material_id: number;
  width?: number;
  length?: number;
  quantity?: number;
  cost?: number;
  price?: number;
  profit_percentage?: number;
}

export interface PaginatedAccessories {
  docs: Accessory[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
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
    ownerId: number
  ): Observable<Accessory> {
    const body = { name, description, owner_id: ownerId };
    return this.http.post<Accessory>(
      `${environment.apiUrl}/accessories`,
      body,
      this.httpOptions()
    );
  }

  addAccessoryMaterials(
    accessoryId: number,
    materials: AccessoryMaterial[]
  ): Observable<any> {
    const body = { accessory_id: accessoryId, materials };
    return this.http.post<any>(
      `${environment.apiUrl}/accessory-materials`,
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
}
