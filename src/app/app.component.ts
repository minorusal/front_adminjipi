import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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

  constructor(private fb: FormBuilder) {
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
    if (username === 'admin@example.com' && password === 'admin') {
      this.isLoggedIn = true;
      this.user = { name: 'Admin', company: 'Empresa Ejemplo' };
    } else {
      this.error = 'Los datos son incorrectos';
    }
  }
}
