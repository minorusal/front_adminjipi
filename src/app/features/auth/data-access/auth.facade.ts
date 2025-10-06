import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { removeCookie } from '../../../shared/utils/cookies';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  constructor(private authService: AuthService) {}

  login(credentials: { email: string; password: string }) {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    return this.authService.login(credentials).pipe(
      tap({
        next: (response) => {
          this.loadingSubject.next(false);
          console.log('Login successful:', response);
        },
        error: (error) => {
          this.loadingSubject.next(false);
          this.errorSubject.next('Login failed');
          console.error('Login error:', error);
        },
      })
    );
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.clearTokens(),
      error: () => this.clearTokens(), // Limpiar tokens incluso si el logout falla
    });
  }

  private clearTokens(): void {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('payload');
    removeCookie('payload');
  }
}
