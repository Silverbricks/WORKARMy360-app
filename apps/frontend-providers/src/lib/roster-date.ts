/** Shared date helpers for the roster views (UTC-anchored, AU display). */

export function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function mondayOfToday(): string {
  const d = new Date();
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  u.setUTCDate(u.getUTCDate() - ((u.getUTCDay() + 6) % 7));
  return u.toISOString().slice(0, 10);
}

export function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function dShort(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
}
