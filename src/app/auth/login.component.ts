import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.error = '';
    this.http.post<any>('http://localhost:3000/auth/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res) => {
        localStorage.setItem('user', JSON.stringify(res));
        this.router.navigate(['/dashboard']);
      },
      error: () => this.error = 'Login failed'
    });
  }
}
