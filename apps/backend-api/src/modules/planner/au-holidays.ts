/**
 * AU public holidays (2026–2027) for highlighting roster day headers. National
 * holidays apply to every state; state-specific ones are filtered by the org's
 * OrgProfile.state (AU state code). This is a UI affordance, not a payroll source
 * — keep it pragmatic; extend per year as needed.
 */
interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  states: string[] | 'ALL';
}

const AU_HOLIDAYS: Holiday[] = [
  // --- National (ALL states) ---
  { date: '2026-01-01', name: "New Year's Day", states: 'ALL' },
  { date: '2026-01-26', name: 'Australia Day', states: 'ALL' },
  { date: '2026-04-03', name: 'Good Friday', states: 'ALL' },
  { date: '2026-04-06', name: 'Easter Monday', states: 'ALL' },
  { date: '2026-04-25', name: 'Anzac Day', states: 'ALL' },
  { date: '2026-12-25', name: 'Christmas Day', states: 'ALL' },
  { date: '2026-12-26', name: 'Boxing Day', states: 'ALL' },
  { date: '2027-01-01', name: "New Year's Day", states: 'ALL' },
  { date: '2027-01-26', name: 'Australia Day', states: 'ALL' },
  { date: '2027-03-26', name: 'Good Friday', states: 'ALL' },
  { date: '2027-03-29', name: 'Easter Monday', states: 'ALL' },
  { date: '2027-04-25', name: 'Anzac Day', states: 'ALL' },
  { date: '2027-12-25', name: 'Christmas Day', states: 'ALL' },
  { date: '2027-12-26', name: 'Boxing Day', states: 'ALL' },
  // --- King's Birthday (2nd Mon June; eastern states + SA/TAS/ACT/NT) ---
  { date: '2026-06-08', name: "King's Birthday", states: ['NSW', 'VIC', 'SA', 'TAS', 'ACT', 'NT'] },
  { date: '2027-06-14', name: "King's Birthday", states: ['NSW', 'VIC', 'SA', 'TAS', 'ACT', 'NT'] },
  // --- Labour Day (state-specific) ---
  { date: '2026-03-09', name: 'Labour Day', states: ['VIC'] },
  { date: '2027-03-08', name: 'Labour Day', states: ['VIC'] },
  { date: '2026-10-05', name: 'Labour Day', states: ['NSW', 'ACT', 'SA'] },
  { date: '2027-10-04', name: 'Labour Day', states: ['NSW', 'ACT', 'SA'] },
  { date: '2026-05-04', name: 'Labour Day', states: ['QLD'] },
  { date: '2027-05-03', name: 'Labour Day', states: ['QLD'] },
  // --- Melbourne Cup (VIC) ---
  { date: '2026-11-03', name: 'Melbourne Cup', states: ['VIC'] },
  { date: '2027-11-02', name: 'Melbourne Cup', states: ['VIC'] },
];

const norm = (s: string | null | undefined) => (s ?? '').trim().toUpperCase();

/** Map of date→holiday name for the given dates, filtered to national + the org's state. */
export function holidaysForDates(dates: string[], state: string | null): Record<string, string> {
  const st = norm(state);
  const set = new Set(dates);
  const out: Record<string, string> = {};
  for (const h of AU_HOLIDAYS) {
    if (!set.has(h.date)) continue;
    if (h.states === 'ALL' || (st && h.states.includes(st))) out[h.date] = h.name;
  }
  return out;
}
