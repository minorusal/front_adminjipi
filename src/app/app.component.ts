import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { CookieService } from './services/cookie.service';
import { environment } from '../environments/environment';

interface LoginResponse {
  message: string;
  token: string;
  user: { id: number; username: string };
  ownerCompany: {
    id: number;
    name: string;
    profit_percentage: number;
  };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app-test';
  loginForm: FormGroup;
  error = '';
  isLoggedIn = false;
  user: { name: string; company: string } | null = null;
  private inactivityTimeout: any;

  ngOnInit(): void {
    const loginData = this.cookieService.get('loginData');
    if (loginData) {
      try {
        const res: LoginResponse = JSON.parse(decodeURIComponent(loginData));
        this.isLoggedIn = true;
        this.user = { name: res.user.username, company: res.ownerCompany.name };
        this.resetInactivityTimer();
      } catch (_) {
        // ignore parse errors
      }
    }
  }

  @HostListener('document:mousemove')
  @HostListener('document:keydown')
  @HostListener('document:click')
  handleActivity(): void {
    this.resetInactivityTimer();
  }

  constructor(private fb: FormBuilder, private http: HttpClient, private cookieService: CookieService) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }


  private resetInactivityTimer(): void {
    if (!this.isLoggedIn) {
      return;
    }
    clearTimeout(this.inactivityTimeout);
    this.inactivityTimeout = setTimeout(() => this.performLogout(), 10 * 60 * 1000);
  }

  logout(): void {
    this.performLogout();
  }

  private performLogout(): void {
    const token = this.cookieService.get('token');
    const options = token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, options)
      .subscribe({
        complete: () => this.clearSession(),
        error: () => this.clearSession()
      });
  }

  private clearSession(): void {
    this.isLoggedIn = false;
    this.user = null;
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'loginData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    clearTimeout(this.inactivityTimeout);
  }

  onSubmit(): void {
    this.error = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.loginForm.value;
    this.http
      .post<LoginResponse>(
        `${environment.apiUrl}/auth/login`,
        { username, password },
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          document.cookie = `token=${res.token}; path=/`;
          document.cookie = `loginData=${encodeURIComponent(JSON.stringify(res))}; path=/`;
          this.isLoggedIn = true;
          this.user = { name: res.user.username, company: res.ownerCompany.name };
          this.resetInactivityTimer();
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.status === 0
            ? 'Ocurrió un error, contacte al administrador'
            : 'Los datos son incorrectos';
        }
      });
  }
}
