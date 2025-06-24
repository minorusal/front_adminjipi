import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CookieService } from './cookie.service';
import { environment } from '../../environments/environment';

export interface MaterialType {
  id: number;
  name: string;
  unit: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MaterialTypeService {
  constructor(private http: HttpClient, private cookieService: CookieService) {}

  private httpOptions() {
    const token = this.cookieService.get('token');
    return token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
  }

  getMaterialTypes(): Observable<MaterialType[]> {
    return this.http.get<MaterialType[]>(
      `${environment.apiUrl}/material-types`,
      this.httpOptions()
    );
  }
}
