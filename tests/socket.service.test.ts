import { test } from 'node:test';
import * as assert from 'node:assert';
import { EventEmitter } from 'events';
import { SocketService } from '../src/app/core/socket/socket.service';

class FakeSocket extends EventEmitter {
  public emitted: {event: string; payload: any}[] = [];
  emit(event: string, payload?: any): boolean {
    this.emitted.push({ event, payload });
    return super.emit(event, payload);
  }
}

test('service updates list on notification:list', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  const list = [{ uuid: '1', seen: false }];
  socket.emit('notification:list', list);
  assert.deepStrictEqual(service.notifications$.value, list);
});

test('notification:list:ack handles object payloads', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  const list = [{ uuid: 'a' }];
  socket.emit('notification:list:ack', { data: { data: list } });
  assert.deepStrictEqual(service.notifications$.value, list);
});

test('notification:list:ack supports results property', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  const list = [{ uuid: 'b' }];
  socket.emit('notification:list:ack', { data: { results: list } });
  assert.deepStrictEqual(service.notifications$.value, list);
});

test('notification:list handles results property', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  const list = [{ uuid: 'r1' }];
  socket.emit('notification:list', { results: list });
  assert.deepStrictEqual(service.notifications$.value, list);
});

test('markSeen emits correct payload', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  service.markSeen('123');
  assert.deepStrictEqual(socket.emitted[0], { event: 'notification:seen', payload: { uuid: '123' } });
});

test('notification:seen:ack updates badge and notifications', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  const list = [{ uuid: 'a', seen: false }];
  socket.emit('notification:list', list);
  socket.emit('notification:seen:ack', { data: 'a' });
  assert.strictEqual(service.badge$.value, 0);
  assert.strictEqual(service.notifications$.value[0].seen, true);
});

test('notification:badge handles object payloads', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  socket.emit('notification:badge', { data: 5 });
  assert.strictEqual(service.badge$.value, 5);
});

test('notification:new adds notification and increases badge', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  socket.emit('notification:new', { data: { uuid: 'n1' } });
  assert.strictEqual(service.notifications$.value[0].uuid, 'n1');
  assert.strictEqual(service.badge$.value, 1);
});

test('registers listener for notification:new and updates badge', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  const events: string[] = [];
  const origOn = socket.on;
  socket.on = function (event: string, listener: any) {
    events.push(event);
    return origOn.call(this, event, listener);
  };
  service.setSocketForTesting(socket as any);

  assert.ok(events.includes('notification:new'));
  socket.emit('notification:new', { data: { uuid: 'x' } });
  assert.strictEqual(service.badge$.value, 1);
});

test('createNotification emits correct payload', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  (globalThis as any).localStorage = {
    getItem: (k: string) =>
      k === 'payload' ? JSON.stringify({ user_id: 9, company_id: 8 }) : null,
  } as any;
  (globalThis as any).document = { cookie: 'from_user_id=9; from_company_id=8' } as any;

  const payload = {
    to_company_id: 3,
    to_user_id: 4,
    title: 't',
    body: 'b',
    payload: {},
    channel: 'email',
  };

  service.createNotification(payload as any);
  assert.deepStrictEqual(socket.emitted[0], {
    event: 'crea-notificacion',
    payload: { ...payload, from_user_id: 9, from_company_id: 8 },
  });
});

test('getNotification emits correct payload', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  service.getNotification({ uuid: '42' } as any);
  assert.deepStrictEqual(socket.emitted[0], {
    event: 'notification:get',
    payload: { uuid: '42' },
  });
});

test('notification:get:ack adds or updates notification', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  const initial = [{ uuid: '1', title: 'old' }];
  socket.emit('notification:list', initial);

  const update = { uuid: '1', title: 'new' };
  socket.emit('notification:get:ack', { data: update });
  assert.deepStrictEqual(service.notifications$.value[0], update);

  const added = { uuid: '2', title: 'added' };
  socket.emit('notification:get:ack', { data: added });
  assert.strictEqual(service.notifications$.value.length, 2);
  assert.deepStrictEqual(service.notifications$.value[0], added);
  assert.deepStrictEqual(service.notifications$.value[1], update);
});

test('logs error on connection failure', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  let captured: any;
  const orig = console.error;
  console.error = (_msg: any, err?: any) => {
    captured = err ?? _msg;
  };

  const error = new Error('fail');
  socket.emit('connect_error', error);

  console.error = orig;
  assert.strictEqual(captured, error);
});

test('notification:unseen-count:ack handles nested payloads', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  socket.emit('notification:unseen-count:ack', { data: { count: 3 } });
  assert.strictEqual(service.badge$.value, 3);
});

test('requestUnseenCount forwards passed to_user_id', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  (globalThis as any).localStorage = {
    getItem: (k: string) =>
      k === 'payload' ? JSON.stringify({ user_id: 1, company_id: 2 }) : null,
  } as any;
  (globalThis as any).document = { cookie: 'from_user_id=1; from_company_id=2' } as any;

  const payload = {
    to_company_id: 1,
    to_user_id: 7,
    title: 't',
    body: 'b',
    payload: {},
    channel: 'email',
  };

  service.createNotification(payload as any);
  service.requestUnseenCount(payload.to_user_id);

  assert.deepStrictEqual(socket.emitted[0], {
    event: 'crea-notificacion',
    payload: { ...payload, from_user_id: 1, from_company_id: 2 },
  });

  assert.deepStrictEqual(socket.emitted[1], {
    event: 'notification:unseen-count',
    payload: { to_user_id: 7 },
  });
});

test('requestList emits default sender ids', () => {
  const service = new SocketService();
  const socket = new FakeSocket();
  service.setSocketForTesting(socket as any);

  (globalThis as any).document = { cookie: 'from_user_id=5; from_company_id=6' } as any;

  service.requestList({ page: 2, limit: 5 });

  assert.deepStrictEqual(socket.emitted[0], {
    event: 'notification:list',
    payload: { page: 2, limit: 5, from_user_id: 5, from_company_id: 6 },
  });
});

test('getCurrentIds parses mcId and compId', () => {
  const service = new SocketService();
  (globalThis as any).localStorage = {
    getItem: () =>
      'eyJhbGciOiJIUzI1NiJ9.eyJtY0lkIjoxMjMsImNvbXBJZCI6NDU2fQ.sig',
  } as any;
  const ids = service.getCurrentIds();
  assert.strictEqual(ids.user_id, 123);
  assert.strictEqual(ids.company_id, 456);
});
