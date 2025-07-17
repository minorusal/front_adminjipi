export function map(fn: (value: any) => any) {
  return (source: { subscribe: (cb: (value: any) => void) => void }) => ({
    subscribe(cb: (value: any) => void) {
      source.subscribe((value: any) => cb(fn(value)));
    },
  });
}
