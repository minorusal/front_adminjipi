export function toNumber(value: any): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }
    // Remove spaces and currency/other symbols except digits, comma, dot and minus
    const cleaned = trimmed.replace(/[^0-9.,-]/g, '').replace(/\s/g, '');
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    let normalized = cleaned;
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma) {
      normalized = cleaned.replace(/,/g, '');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
