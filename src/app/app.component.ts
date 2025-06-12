import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface LoginResponse {
  message: string;
  token: string;
  user: { id: number; username: string };
  ownerCompany: { id: number; name: string };
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
    const loginData = this.getCookie('loginData');
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

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
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
    const token = this.getCookie('token');
    const options = token
      ? { headers: new HttpHeaders({ token }), withCredentials: true }
      : { withCredentials: true };
    this.http
      .post('http://localhost:3000/auth/logout', {}, options)
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
        'http://localhost:3000/auth/login',
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
        error: () => {
          this.error = 'Los datos son incorrectos';
        }
      });
  }
}
