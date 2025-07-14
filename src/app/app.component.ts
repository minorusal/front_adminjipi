import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CookieService } from './services/cookie.service';
import { AuthService } from './services/auth.service';
import { MenuService, MenuNode } from './services/menu.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'app-test';
  isLoggedIn = false;
  loginForm: FormGroup;
  loginError = '';
  menu$: Observable<MenuNode[]>;
  user: { username: string; companyName: string } | null = null;

  constructor(
    private cookieService: CookieService,
    private fb: FormBuilder,
    private authService: AuthService,
    private menuService: MenuService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.menu$ = this.menuService.getMenuTree();
  }

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      this.isLoggedIn = true;
      // Aquí podrías hacer una llamada a un endpoint /me para obtener los datos del usuario
      // Por ahora, podrías intentar decodificar el token si contiene la info,
      // o simplemente mantener el estado de loggedIn.
    }
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.user = null;
  }

  onSubmit(): void {
    this.loginError = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.loginForm.value;

    this.authService.login({ username: username, password: password }).subscribe({
      next: (res) => {
        if (res.token) {
          this.isLoggedIn = true;
          this.user = {
            username: res.user.username,
            companyName: res.ownerCompany.name
          };
          this.menu$ = this.menuService.getMenuTree();
        } else {
          this.loginError = 'Respuesta de login inválida';
        }
      },
      error: (err) => {
        this.loginError = err.message || 'Los datos son incorrectos';
        console.error(err);
      },
    });
  }
}
