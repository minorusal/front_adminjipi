import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EncryptService } from './encrypt.service';
import { getIdsFromToken } from '../../shared/utils/token';
import { setCookie } from '../../shared/utils/cookies';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loginUrl = `${environment.apiUrl}/api/auth/login`;
  private readonly logoutUrl = `${environment.apiUrl}/api/auth/logout`;

  constructor(private http: HttpClient, private cipher: EncryptService) { }

  login(credentials: { email: string; password: string }) {
    const encrypted = this.cipher.encrypt(credentials);
    const headers = new HttpHeaders({
      'mc-token': `Bearer ${environment.genericToken}`,
      'Content-Type': 'text/plain',
    });
    return this.http
      .post(this.loginUrl, encrypted, { headers, responseType: 'text' })
      .pipe(
        map((resp) => {
          const decrypted = JSON.parse(this.cipher.decrypt(resp))
          const tokens = decrypted.login?.usu_token || {};
          if (tokens.sessionToken) {
            localStorage.setItem('sessionToken', tokens.sessionToken)
            const ids = getIdsFromToken(tokens.sessionToken)
            setCookie('from_company_id', JSON.stringify(ids.company_id))
            setCookie('from_user_id', JSON.stringify(ids.user_id))
            localStorage.setItem('payload', JSON.stringify(ids))
            setCookie('payload', JSON.stringify(ids))
          }
          if (tokens.refreshToken) {
            localStorage.setItem('refreshToken', tokens.refreshToken)
          }
          return decrypted;
        })
      );
  }

  logout(sessionToken: string) {
    const headers = new HttpHeaders({
      'mc-token': `Bearer ${sessionToken}`,
    });
    return this.http.delete<{ results: { deleted: boolean } }>(this.logoutUrl, {
      headers,
    });
  }
}
