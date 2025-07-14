import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  login(credentials: { email: string; password: string }): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    try {
      const token = btoa(`${credentials.email}:${credentials.password}`);
      this.setToken(token);
    } catch (e) {
      this.errorSubject.next('Login failed');
    }
    this.loadingSubject.next(false);
  }

  logout(): void {
    this.setToken(null);
  }

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }
}
