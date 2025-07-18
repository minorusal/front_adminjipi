export interface Socket {
  on(event: string, cb: (...args: any[]) => void): this;
  emit(event: string, payload?: any): void;
  disconnect(): void;
}

export function io(_url?: string, _options?: any): Socket {
  return {
    on() {
      return this;
    },
    emit() {},
    disconnect() {},
  } as Socket;
}

export default io;
