# Guía para implementar login y logout en Angular 15

Este documento describe cómo integrar las funciones de autenticación del backend en una aplicación Angular 15. La API espera que las credenciales y la respuesta se manejen de manera cifrada.

## 1. Endpoints de autenticación

- **Login**: `POST /api/auth/login`
- **Logout**: `DELETE /api/auth/logout`

## 2. Cifrado de datos

El backend utiliza AES de `crypto-js` con la clave `KEY_CIPHER` definida en las variables de entorno. Para replicar el cifrado en Angular se crea un servicio `EncryptService`:

```ts
import * as CryptoJS from 'crypto-js';
import { environment } from '../environments/environment';

export class EncryptService {
  private key = environment.keyCipher; // debe coincidir con KEY_CIPHER

  encrypt(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.key).toString();
  }

  decrypt(text: string): any {
    const bytes = CryptoJS.AES.decrypt(text, this.key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }
}
```

## 3. Servicio de autenticación

El servicio `AuthService` consume las rutas del backend y maneja la encriptación de las peticiones y respuestas:

```ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EncryptService } from './encrypt.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private cipher: EncryptService) {}

  login(email: string, password: string) {
    const encrypted = this.cipher.encrypt({ email, password });
    const headers = new HttpHeaders({
      'mc-token': `Bearer ${GENERIC_TOKEN}`,
      'Content-Type': 'text/plain'
    });
    return this.http.post('/api/auth/login', encrypted, { headers, responseType: 'text' });
  }

  logout(sessionToken: string) {
    const headers = new HttpHeaders({
      'mc-token': `Bearer ${sessionToken}`
    });
    return this.http.delete('/api/auth/logout', { headers });
  }
}
```

## 4. Procesar la respuesta de login

La respuesta del endpoint de login también llega cifrada. Debe descifrarse y almacenar los tokens recibidos:

```ts
this.authService.login(email, password).subscribe(enc => {
  const data = this.cipher.decrypt(enc);
  const tokens = data.login.usu_token; // { sessionToken, refreshToken }
  // Guardar tokens (por ejemplo en localStorage)
});
```

## 5. Cerrar sesión

Para cerrar sesión se envía el `sessionToken` en el encabezado `mc-token`:

```ts
this.authService.logout(sessionToken).subscribe(() => {
  // El backend retorna { deleted: true }
  // Eliminar tokens almacenados
});
```

## 6. Renovación de token

El proyecto incluye un endpoint `/api/auth/renewToken` que acepta el `refreshToken`. Utilícelo para mantener la sesión activa sin que el usuario vuelva a introducir sus credenciales.

---

Esta guía resume los pasos necesarios para integrar el inicio y cierre de sesión respetando el cifrado exigido por la API.
