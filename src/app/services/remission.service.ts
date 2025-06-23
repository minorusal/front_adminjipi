import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CookieService } from './cookie.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RemissionService {
  constructor(private http: HttpClient, private cookieService: CookieService) {}

  private httpOptions() {
    const token = this.cookieService.get('token');
    return token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
  }

  getByOwner(ownerId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/remissions/by-owner/${ownerId}`,
      this.httpOptions()
    );
  }
}
