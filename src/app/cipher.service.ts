import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class CipherService {

  constructor(private http: HttpClient) { }

  async encryptData(data: any, key: string):  Promise<any> {
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  }

  async decryptData(encryptedData: string, key: string):  Promise<any> {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key)
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8)
      return typeof decryptedText === 'object' ? decryptedText : JSON.parse(JSON.stringify(decryptedText))
    } catch (error) {
      console.log(error)
    }
  }

  testApiCipher(data: string): Observable<string> {
    try {
      const authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbXByZXNhIjoiNFJDNTQyMDI0IiwidXN1YXJpbyI6ImczbjNyMWMwIiwiZ2VuIjp0cnVlLCJnZW5Ub2tlbiI6IiQyYiQxMCRUMmUvUWZwbUhqMHNuOEhmQ3lGVUkudWt0T2p1U24waFhGM3F4ZGhPVUo0NjZzcFBPNTJyTyIsImlhdCI6MTcwODU1ODM3M30.x5pavYWH9b1gTHvEBvzG042fz9dG40-iEJwmjMMgAsA';
      const apiUrl = 'http://localhost:3000/api/auth/testCipher';
      const headers = new HttpHeaders({
        'Content-Type': 'text/plain',
        'mc-token': authToken
      });
      return this.http.post(apiUrl, data, { headers, responseType: 'text' });
    } catch (error) {
      console.log('TEST DEL SERVICIO:', error);
      throw error
    }
  }

  async testLogin(): Promise<Observable<string>> {
    try {
      const apiUrl = 'https://desarrollo.credibusiness.io/api/auth/login';
      const data = {
        "email": "gabriel@puntocommerce.com",
        "password": "123456"
      }
      const decrypt = await this.encryptData(JSON.stringify(data), 'CR3D1BU51N355K3YC1PH3R')
      console.log('cifrado', decrypt);
      console.log('DESCIFRADO', await this.decryptData(decrypt, 'CR3D1BU51N355K3YC1PH3R'))
      const headers = new HttpHeaders({
        'Content-Type': 'text/plain',
        'mc-token': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbXByZXNhIjoiNFJDNTQyMDI0IiwidXN1YXJpbyI6ImczbjNyMWMwIiwiZ2VuIjp0cnVlLCJnZW5Ub2tlbiI6IiQyYiQxMCRUMmUvUWZwbUhqMHNuOEhmQ3lGVUkudWt0T2p1U24waFhGM3F4ZGhPVUo0NjZzcFBPNTJyTyIsImlhdCI6MTcwODU1ODM3M30.x5pavYWH9b1gTHvEBvzG042fz9dG40-iEJwmjMMgAsA'
      });
      return this.http.post(apiUrl, decrypt, { headers, responseType: 'text' });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }


}
