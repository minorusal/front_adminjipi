import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CookieService } from './cookie.service';
import { environment } from '../../environments/environment';

export interface MenuNode {
  id: number;
  name: string;
  path?: string | null;
  children?: MenuNode[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  constructor(private http: HttpClient, private cookieService: CookieService) {}

  private httpOptions() {
    const token = this.cookieService.get('token');
    return token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
  }

  getParentMenus(ownerId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/menus/all?owner_id=${ownerId}`,
      this.httpOptions()
    );
  }

  /**
   * Fetches the hierarchical menu for the given company.
   * If the request fails, an empty list is returned.
   */
  getMenuTree(ownerId: number): Observable<MenuNode[]> {
    return this.http
      .get<any[]>(`${environment.apiUrl}/menus?owner_id=${ownerId}`, this.httpOptions())
      .pipe(
        map(tree => {
          const isFlat = tree.length && !tree.some(m => Array.isArray(m.children));
          return isFlat ? this.buildTree(tree) : (tree as MenuNode[]);
        }),
        catchError(() => of([]))
      );
  }

  private buildTree(items: any[], parentId: number | null = null): MenuNode[] {
    return items
      .filter(m => m.parent_id === parentId)
      .map(m => ({
        id: m.id,
        name: m.name,
        path: m.path,
        children: this.buildTree(items, m.id)
      }));
  }
}
