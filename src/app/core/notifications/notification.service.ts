import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly listUrl = `${environment.apiUrl}/api/notifications`;
  private readonly badgeUrl = `${environment.apiUrl}/api/notifications/unseen-count`;

  constructor(private http: HttpClient) {}

  fetchList() {
    return this.http.get<any[]>(this.listUrl, { params: { page: 1, limit: 20 } });
  }

  fetchBadge() {
    return this.http.get<any>(this.badgeUrl);
  }
}
