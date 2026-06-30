import type { ModuleCatalogEntry } from '@workarmy/types';

/**
 * The Feature Marketplace catalog — the menu of capabilities a company can turn
 * on/off (Module Marketplace builder). This is a code constant, NOT a per-org
 * branch: enabling a module writes a PlatformModule row. `dependsOn` modules are
 * auto-enabled with the parent (e.g. Payroll needs Timesheets).
 *
 * v1 wires a few of these to behaviour (compliance → conflict gates, marketplace
 * → open-shift cascade, piece-rate/weather → display); the rest toggle config and
 * gate future builders. Nothing here is industry-specific.
 */
export const MODULE_CATALOG: ModuleCatalogEntry[] = [
  // --- Core ---
  { key: 'roster', label: 'Roster', group: 'Core', description: 'Demand planner + staff grid.' },
  { key: 'timesheets', label: 'Timesheets', group: 'Core', description: 'Track hours worked.' },
  { key: 'payroll', label: 'Payroll', group: 'Finance', description: 'Pay runs & payslips.', dependsOn: ['timesheets'] },
  { key: 'invoices', label: 'Invoices', group: 'Finance', description: 'Client invoicing & docs.' },
  { key: 'expenses', label: 'Expenses', group: 'Finance', description: 'Worker & job expenses.' },
  { key: 'purchaseorders', label: 'Purchase Orders', group: 'Finance', description: 'Raise & track POs.' },
  // --- Compliance ---
  { key: 'compliance', label: 'Compliance', group: 'Compliance', description: 'Licence/visa gates on assignment.' },
  { key: 'inductions', label: 'Inductions', group: 'Compliance', description: 'Site/client inductions.', dependsOn: ['compliance'] },
  { key: 'swms', label: 'SWMS', group: 'Compliance', description: 'Safe Work Method Statements.', dependsOn: ['compliance'] },
  { key: 'risk', label: 'Risk Assessments', group: 'Compliance', description: 'Hazard & risk checks.' },
  { key: 'incidents', label: 'Incidents', group: 'Compliance', description: 'Report & track incidents.' },
  { key: 'inspections', label: 'Inspections', group: 'Compliance', description: 'Scheduled inspections.' },
  // --- Field ops ---
  { key: 'gps', label: 'GPS', group: 'Field Ops', description: 'Location verification.' },
  { key: 'qr', label: 'QR Attendance', group: 'Field Ops', description: 'QR clock-in/out.' },
  { key: 'weather', label: 'Weather', group: 'Field Ops', description: 'Forecast + extreme-heat warnings.' },
  { key: 'transport', label: 'Transport', group: 'Field Ops', description: 'Pickup routes & runs.' },
  { key: 'accommodation', label: 'Accommodation', group: 'Field Ops', description: 'On-site housing.', dependsOn: ['transport'] },
  { key: 'vehicles', label: 'Vehicles', group: 'Field Ops', description: 'Fleet & pre-start checks.' },
  { key: 'equipment', label: 'Equipment', group: 'Field Ops', description: 'Plant & PPE per shift.' },
  { key: 'assets', label: 'Assets', group: 'Field Ops', description: 'Asset register.' },
  { key: 'maintenance', label: 'Maintenance', group: 'Field Ops', description: 'Maintenance jobs.' },
  // --- People / engagement ---
  { key: 'marketplace', label: 'Open-Shift Marketplace', group: 'People', description: 'Cascade unfilled shifts to the pool.' },
  { key: 'clientportal', label: 'Client Portal', group: 'People', description: 'Host/client visibility & approvals.' },
  { key: 'contractor', label: 'Contractor Mgmt', group: 'People', description: 'Engaged contractors/agencies.' },
  { key: 'visitor', label: 'Visitor Mgmt', group: 'People', description: 'Site visitor sign-in.' },
  { key: 'chat', label: 'Shift Chat', group: 'People', description: 'In-shift messaging.' },
  { key: 'learning', label: 'Learning', group: 'People', description: 'Courses & competencies.' },
  { key: 'training', label: 'Training', group: 'People', description: 'Training records.', dependsOn: ['learning'] },
  // --- Docs / forms ---
  { key: 'documents', label: 'Documents', group: 'Docs', description: 'Document library.' },
  { key: 'forms', label: 'Forms', group: 'Docs', description: 'Dynamic forms (Form Builder).' },
  { key: 'checklists', label: 'Checklists', group: 'Docs', description: 'Reusable checklists.' },
  { key: 'signatures', label: 'Digital Signatures', group: 'Docs', description: 'Sign-off & e-signatures.' },
  // --- Industry add-ons ---
  { key: 'piecerate', label: 'Piece Rate', group: 'Industry', description: 'Buckets/bins per worker.' },
  { key: 'ndis', label: 'NDIS', group: 'Industry', description: 'NDIS participant support.' },
  // --- Advanced ---
  { key: 'ai', label: 'AI Planner', group: 'Advanced', description: 'Best-match & auto-fill.' },
  { key: 'custom', label: 'Custom Module', group: 'Advanced', description: 'Bring your own module.' },
];

const CATALOG_BY_KEY = new Map(MODULE_CATALOG.map((m) => [m.key, m]));

/** Expand a set of module keys to include every transitive dependency. */
export function withDependencies(keys: Iterable<string>): string[] {
  const out = new Set<string>();
  const visit = (key: string) => {
    if (out.has(key)) return;
    const entry = CATALOG_BY_KEY.get(key);
    if (!entry) return;
    out.add(key);
    for (const dep of entry.dependsOn ?? []) visit(dep);
  };
  for (const k of keys) visit(k);
  return [...out];
}

export function catalogEntry(key: string): ModuleCatalogEntry | undefined {
  return CATALOG_BY_KEY.get(key);
}
