/** Australian formatting helpers — dd/mm/yyyy, AUD, AU mobile. */

export function formatDateAU(input: Date | string): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

export function formatCurrencyAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
}

/** "0412345678" / "+61412345678" -> "0412 345 678". */
export function formatMobileAU(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  const local = digits.startsWith('61') ? `0${digits.slice(2)}` : digits;
  if (/^0\d{9}$/.test(local)) {
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return mobile;
}
