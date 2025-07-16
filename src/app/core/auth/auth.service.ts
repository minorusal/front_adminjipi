import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loginUrl = '/api/auth/login';
  private readonly encryptionKey = environment.encryptionKey;

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ data: string }>(this.loginUrl, credentials).pipe(
      map((resp) => {
        const bytes = CryptoJS.AES.decrypt(resp.data, this.encryptionKey);
        const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        localStorage.setItem('sessionToken', decrypted.sessionToken);
        localStorage.setItem('refreshToken', decrypted.refreshToken);
        localStorage.setItem('user_id', decrypted.user_id);
        localStorage.setItem('company_id', decrypted.company_id);
        return decrypted;
      })
    );
  }
}
