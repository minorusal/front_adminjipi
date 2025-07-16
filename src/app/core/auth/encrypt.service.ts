import * as CryptoJS from 'crypto-js';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EncryptService {
  private key = environment.keyCipher;

  encrypt(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.key).toString();
  }

  decrypt(text: string): any {
    const bytes = CryptoJS.AES.decrypt(text, this.key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }
}
