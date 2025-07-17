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
