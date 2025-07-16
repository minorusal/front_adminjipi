import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AuthFacade } from '../data-access/auth.facade';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-login',
  templateUrl: './auth-login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLoginPage {
  readonly isLoading$ = this.authFacade.isLoading$;
  readonly error$ = this.authFacade.error$;

  constructor(private readonly authFacade: AuthFacade, private router: Router) {}

  login(credentials: { email: string; password: string }): void {
    this.authFacade.login(credentials).subscribe({
      next: () => this.router.navigate(['/dashboard']),
    });
  }
}
