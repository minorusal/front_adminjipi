import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CookieService } from './cookie.service';
import { environment } from '../../environments/environment';

export interface Material {
  id: number;
  name: string;
  description: string;
  thickness_mm?: number;
  width_m?: number;
  length_m?: number;
  price?: number;
  created_at?: string;
  updated_at?: string;
  owner_id?: number;
}

export interface PaginatedMaterials {
  docs: Material[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class MaterialService {
  constructor(private http: HttpClient, private cookieService: CookieService) {}

  private httpOptions() {
    const token = this.cookieService.get('token');
    return token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
  }

  getMaterials(page?: number, limit?: number): Observable<PaginatedMaterials> {
    let url = `${environment.apiUrl}/materials`;
    const params: string[] = [];
    if (page !== undefined) {
      params.push(`page=${page}`);
    }
    if (limit !== undefined) {
      params.push(`limit=${limit}`);
    }
    if (params.length) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<PaginatedMaterials>(url, this.httpOptions());
  }
}
