import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CookieService } from './cookie.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export interface PaginatedRemissions {
  docs: any[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
}

export class RemissionService {
  constructor(private http: HttpClient, private cookieService: CookieService) {}

  private httpOptions() {
    const token = this.cookieService.get('token');
    return token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
  }

  getByOwner(
    ownerId: number,
    page?: number,
    limit?: number,
    search?: string
  ): Observable<PaginatedRemissions> {
    let url = `${environment.apiUrl}/remissions/by-owner/${ownerId}`;
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
      url += `?${params.join('&')}`;
    }
    return this.http.get<PaginatedRemissions>(url, this.httpOptions());
  }
}
