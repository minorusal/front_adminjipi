import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CookieService } from './cookie.service'; // Asegúrate que la ruta sea correcta

// --- Interfaces ---

export interface LoginCredentials {
  username: string;
  password?: string; // Maintained for general use, but password_hash is for the backend
  password_hash?: string;
}

export interface RegisterPayload {
  username: string;
  password?: string;
  password_hash?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    owner_company_id: number;
  };
  ownerCompany: {
    id: number;
    name: string;
    address: string;
    created_at: string;
    updated_at: string;
    profit_percentage: string;
    logo_path: string;
  };
}

// --- Service ---

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private companyIdentifier = 'Jipi';
  private readonly TOKEN_KEY = 'authToken';

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) {}

  /**
   * Registra un nuevo usuario para la compañía.
   * @param payload Los datos del usuario a registrar (username, password).
   */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    const { username, password } = payload;
    const registerData = {
      username,
      password,
      companyIdentifier: this.companyIdentifier,
    };
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData);
  }

  /**
   * Inicia sesión de un usuario.
   * @param credentials Las credenciales del usuario (username, password).
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const { username, password } = credentials;
    const loginData = {
      username,
      password,
      companyIdentifier: this.companyIdentifier,
    };
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData).pipe(
      tap(response => {
        if (response.token) {
          this.cookieService.set(this.TOKEN_KEY, response.token, { path: '/' });
          if (response.ownerCompany?.profit_percentage) {
            this.cookieService.set('profit_percentage', response.ownerCompany.profit_percentage, { path: '/' });
          }
          if (response.user?.owner_company_id) {
            this.cookieService.set('owner_id', response.user.owner_company_id.toString(), { path: '/' });
          }
        }
      })
    );
  }

  /**
   * Cierra la sesión del usuario eliminando el token.
   */
  logout(): void {
    this.cookieService.delete(this.TOKEN_KEY, '/');
    // Considera invalidar el token en el backend si es necesario.
    // return this.http.post(`${this.apiUrl}/logout`, {});
  }
  
  /**
   * Obtiene el token guardado para adjuntarlo a las peticiones.
   * @returns El token JWT o null si no existe.
   */
  getToken(): string | null {
    return this.cookieService.get(this.TOKEN_KEY);
  }
} 