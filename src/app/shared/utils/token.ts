export interface TokenIds {
  user_id: number;
  company_id: number;
}

export function getIdsFromToken(token: string): TokenIds {
  try {
    const [, payload] = token.split('.');
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded =
      typeof atob === 'function'
        ? atob(base64)
        : (globalThis as any).Buffer.from(base64, 'base64').toString('binary');
    const json = JSON.parse(decoded);
    return {
      user_id: Number(json.mcId || 0),
      company_id: Number(json.compId || 0),
    };
  } catch {
    return { user_id: 0, company_id: 0 };
  }
}
