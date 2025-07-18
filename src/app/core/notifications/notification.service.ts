import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly listUrl = `${environment.apiUrl}/api/notifications`;
  private readonly badgeUrl = `${environment.apiUrl}/api/notifications/unseen-count`;

  constructor(private http: HttpClient) {}
  
  fetchList(page = 1, limit = 10) {
    return this.http.get<any[]>(this.listUrl, {
      params: { page, limit },
    });
  }

  fetchBadge() {
    return this.http.get<number>(this.badgeUrl);
  }
}
