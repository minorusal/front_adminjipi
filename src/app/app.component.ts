import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
export class AppComponent {
  title = 'app-test';
  loginForm: FormGroup;
  error = '';
  isLoggedIn = false;
  user: { name: string; company: string } | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
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
        { username, password }
      )
      .subscribe({
        next: (res) => {
          document.cookie = `token=${res.token}; path=/`;
          document.cookie = `loginData=${encodeURIComponent(JSON.stringify(res))}; path=/`;
          this.isLoggedIn = true;
          this.user = { name: res.user.username, company: res.ownerCompany.name };
        },
        error: () => {
          this.error = 'Los datos son incorrectos';
        }
      });
  }
}
