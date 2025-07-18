import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { getCookie } from '../../shared/utils/cookies';
import { NotificationListParams } from '../socket/notification.types';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly listUrl = `${environment.apiUrl}/api/notifications`;
  private readonly badgeUrl = `${environment.apiUrl}/api/notifications/unseen-count`;

  constructor(private http: HttpClient) {}
  
  fetchList(params: NotificationListParams = {}) {
    const defaults: NotificationListParams = {
      page: 1,
      limit: 10,
      from_company_id: Number(getCookie('from_company_id')),
      from_user_id: Number(getCookie('from_user_id')),
    };
    return this.http.get<any>(this.listUrl, {
      params: { ...defaults, ...params },
    }).pipe(
      // The API may return either an array directly or wrap it under
      // properties like `list`, `data.list` or `results`. Normalize the
      // response so consumers always receive an array.
      map((resp: any) =>
        Array.isArray(resp)
          ? resp
          : Array.isArray(resp?.list)
          ? resp.list
          : Array.isArray(resp?.data?.list)
          ? resp.data.list
          : Array.isArray(resp?.results)
          ? resp.results
          : Array.isArray(resp?.data?.results)
          ? resp.data.results
          : Array.isArray(resp?.data)
          ? resp.data
          : []
      )
    );
  }

  fetchBadge() {
    return this.http.get<number>(this.badgeUrl);
  }
}
