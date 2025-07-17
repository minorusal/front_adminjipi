export const AES = {
  encrypt(data: string, _key?: string) {
    return { toString: (_enc?: any) => data };
  },
  decrypt(text: string, _key?: string) {
    return { toString: (_enc?: any) => text };
  },
};
export const enc = { Utf8: 'utf8' };
