import { test } from 'node:test';
import * as assert from 'node:assert';
import { AuthService } from '../src/app/core/auth/auth.service';
import { getCookie } from '../src/app/shared/utils/cookies';

class FakeObservable<T> {
  constructor(private value: T) {}
  pipe(op: any) {
    return op(this);
  }
  subscribe(cb: (v: T) => void) {
    cb(this.value);
  }
}

class FakeHttpClient {
  constructor(private resp: string) {}
  post(_url: string, _body: any, _opts: any) {
    return new FakeObservable(this.resp);
  }
}

class FakeCipher {
  encrypt(data: any) {
    return JSON.stringify(data);
  }
  decrypt(text: string) {
    return JSON.parse(text);
  }
}

test('login sets user/company cookies', () => {
  (globalThis as any).document = {
    _cookies: {} as Record<string, string>,
    get cookie() {
      return Object.entries(this._cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    },
    set cookie(val: string) {
      const [pair] = val.split(';');
      const [name, v] = pair.split('=');
      this._cookies[name] = decodeURIComponent(v);
    },
  };
  const payload = { login: { usuario: { company_id: 5, idDb: 9 }, usu_token: {} } };
  const http = new FakeHttpClient(JSON.stringify(payload));
  const cipher = new FakeCipher();
  const service = new AuthService(http as any, cipher as any);

  let result: any;
  service.login({ email: 'a', password: 'b' }).subscribe((r: any) => {
    result = r;
  });

  assert.strictEqual(result.login.usuario.company_id, 5);
  assert.strictEqual(getCookie('from_company_id'), '5');
  assert.strictEqual(getCookie('from_user_id'), '9');
});
