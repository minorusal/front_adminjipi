import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { environment as environmentProd } from '../../../environments/environment.prod';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiUrl = req.url.startsWith(environment.apiUrl) || 
                     req.url.startsWith(environmentProd.apiUrl) || 
                     req.url.startsWith('/api/');

    // No adjuntar el token en la ruta de login
    if (req.url.includes('/api/auth/login')) {
      return next.handle(req);
    }

    if (isApiUrl) {
      // Add mc-token if not already present (allows override)
      if (!req.headers.has('mc-token')) {
        req = req.clone({
          setHeaders: {
            'mc-token': `Bearer ${environment.genericToken}`
          }
        });
      }
    }

    return next.handle(req);
  }
}
