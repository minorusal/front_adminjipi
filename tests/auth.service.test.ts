import { test } from 'node:test';
import * as assert from 'node:assert';
import { AuthService } from '../src/app/core/auth/auth.service';

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

test('login stores session and refresh tokens', () => {
  (globalThis as any).localStorage = {
    _data: {} as Record<string, string>,
    getItem(k: string) {
      return this._data[k] || null;
    },
    setItem(k: string, v: string) {
      this._data[k] = v;
    },
    removeItem(k: string) {
      delete this._data[k];
    },
  };
  const payload = { login: { usu: { emp_id: 5, usu_id: 9 }, usu_token: { sessionToken: 'a', refreshToken: 'b' } } };
  const http = new FakeHttpClient(JSON.stringify(payload));
  const cipher = new FakeCipher();
  const service = new AuthService(http as any, cipher as any);

  let result: any;
  service.login({ email: 'a', password: 'b' }).subscribe((r: any) => {
    result = r;
  });

  assert.strictEqual(result.login.usu.emp_id, 5);
  assert.strictEqual(localStorage.getItem('sessionToken'), 'a');
  assert.strictEqual(localStorage.getItem('refreshToken'), 'b');
});
