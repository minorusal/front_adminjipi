import { test } from 'node:test';
import * as assert from 'node:assert';
import { NotificationListComponent } from '../src/app/shared/components/notification-list.component';

class FakeSocketService {
  seen: string | null = null;
  deleteCalled: string | null = null;
  notifications$ = { subscribe() {} } as any;
  markSeen(uuid: string) {
    this.seen = uuid;
  }
  delete(uuid: string) {
    this.deleteCalled = uuid;
  }
}

test('markSeen forwards uuid to SocketService', () => {
  const socket = new FakeSocketService();
  const component = new NotificationListComponent(socket as any);
  component.markSeen('abc');
  assert.strictEqual(socket.seen, 'abc');
});
