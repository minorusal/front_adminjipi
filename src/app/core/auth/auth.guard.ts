import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  constructor(private router: Router, private jwtHelper: JwtHelperService) {}

  canActivate: CanActivateFn = () => {
    const token = localStorage.getItem('sessionToken');
    if (!token || this.jwtHelper.isTokenExpired(token)) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  };
}
