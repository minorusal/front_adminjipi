import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

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
        next: () => {
          this.loadingSubject.next(false);
        },
        error: () => {
          this.loadingSubject.next(false);
          this.errorSubject.next('Login failed');
        },
      })
    );
  }

  logout(): void {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      this.authService.logout(token).subscribe({
        next: () => this.clearTokens(),
        error: () => this.clearTokens(),
      });
    } else {
      this.clearTokens();
    }
  }

  private clearTokens(): void {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('refreshToken');
  }
}
