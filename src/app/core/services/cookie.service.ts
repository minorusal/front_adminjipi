import { Injectable } from '@angular/core';

@Injectable()
export class CookieService {
  get(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  set(name: string, value: string, options: { path?: string; expires?: string | Date } = {}): void {
    let cookie = `${name}=${encodeURIComponent(value)}`;
    if (options.expires) {
      const expires = options.expires instanceof Date
        ? options.expires.toUTCString()
        : options.expires;
      cookie += `; expires=${expires}`;
    }
    cookie += `; path=${options.path ?? '/'}`;
    document.cookie = cookie;
  }

  delete(name: string, path = '/'): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
  }
}
