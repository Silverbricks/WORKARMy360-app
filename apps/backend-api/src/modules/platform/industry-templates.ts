import type { IndustryTemplate } from '@workarmy/types';

/**
 * Industry templates are DATA, not code branches. Applying one writes the per-org
 * config rows (PlatformModule / PlatformTerm / PlatformCategory / PlatformGate)
 * and seeds RosterTemplate rows. The engine never reads these directly at
 * runtime — it reads the resolved config — so adding a new industry is a matter
 * of adding an entry here, never touching engine code.
 *
 * `gates[].credentialType` matches the free-text `Credential.type` strings used
 * elsewhere in WorkArmy (e.g. "right-to-work", "white-card").
 */
export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    key: 'agriculture',
    label: 'Agriculture',
    emoji: '🌾',
    planningMode: 'demand',
    terminology: { worker: 'Picker', location: 'Block', client: 'Farm', shift: 'Shift' },
    modules: ['roster', 'timesheets', 'compliance', 'piecerate', 'weather', 'transport', 'accommodation', 'marketplace', 'ai'],
    categories: [
      { key: 'harvest', label: 'Harvest', color: '#5b7a4f' },
      { key: 'packing', label: 'Pack shed', color: '#c98a3c' },
      { key: 'pruning', label: 'Pruning', color: '#3d6f8e' },
      { key: 'irrigation', label: 'Irrigation', color: '#6d4a73' },
    ],
    gates: [
      { key: 'right-to-work', label: 'Right to work / visa', credentialType: 'right-to-work', block: false },
      { key: 'chemical-handling', label: 'Chemical handling cert', credentialType: 'chemical-handling', block: false },
    ],
    shiftTemplates: [
      { name: 'Harvest', category: 'harvest', startTime: '06:00', endTime: '14:00' },
      { name: 'Pack shed', category: 'packing', startTime: '08:00', endTime: '16:00' },
      { name: 'Pruning', category: 'pruning', startTime: '07:00', endTime: '15:00' },
      { name: 'Irrigation', category: 'irrigation', startTime: '05:00', endTime: '11:00' },
    ],
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    emoji: '🏥',
    planningMode: 'demand',
    terminology: { worker: 'Nurse', location: 'Ward', client: 'Facility', shift: 'Shift' },
    modules: ['roster', 'timesheets', 'compliance', 'documents', 'qr', 'ndis', 'ai'],
    categories: [
      { key: 'am', label: 'AM / Early', color: '#3f72a8' },
      { key: 'pm', label: 'PM / Late', color: '#6d4a73' },
      { key: 'night', label: 'Night', color: '#4a5560' },
      { key: 'longday', label: 'Long day', color: '#5b7a4f' },
    ],
    gates: [
      { key: 'ahpra', label: 'AHPRA registration', credentialType: 'ahpra', block: false },
      { key: 'immunisation', label: 'Immunisation record', credentialType: 'immunisation', block: false },
    ],
    shiftTemplates: [
      { name: 'AM (Early)', category: 'am', startTime: '07:00', endTime: '15:30' },
      { name: 'PM (Late)', category: 'pm', startTime: '13:00', endTime: '21:30' },
      { name: 'Night', category: 'night', startTime: '21:00', endTime: '07:30' },
      { name: 'Long day', category: 'longday', startTime: '07:00', endTime: '19:30' },
    ],
  },
  {
    key: 'construction',
    label: 'Construction',
    emoji: '🏗️',
    planningMode: 'demand',
    terminology: { worker: 'Worker', location: 'Site', client: 'Client', shift: 'Shift' },
    modules: ['roster', 'timesheets', 'compliance', 'swms', 'equipment', 'inductions', 'gps', 'ai'],
    categories: [
      { key: 'day', label: 'Day', color: '#c98a3c' },
      { key: 'afternoon', label: 'Afternoon', color: '#4a5560' },
      { key: 'pour', label: 'Pour day', color: '#3d6f8e' },
    ],
    gates: [
      { key: 'white-card', label: 'White Card', credentialType: 'white-card', block: false },
      { key: 'site-induction', label: 'Site induction', credentialType: 'site-induction', block: false },
    ],
    shiftTemplates: [
      { name: 'Day', category: 'day', startTime: '06:30', endTime: '14:30' },
      { name: 'Afternoon', category: 'afternoon', startTime: '14:00', endTime: '22:00' },
      { name: 'Pour day', category: 'pour', startTime: '05:00', endTime: '15:00' },
    ],
  },
  {
    key: 'hospitality',
    label: 'Hospitality',
    emoji: '🍽️',
    planningMode: 'demand',
    terminology: { worker: 'Staff', location: 'Section', client: 'Venue', shift: 'Shift' },
    modules: ['roster', 'timesheets', 'payroll', 'compliance', 'chat', 'ai'],
    categories: [
      { key: 'breakfast', label: 'Breakfast', color: '#c98a3c' },
      { key: 'lunch', label: 'Lunch', color: '#5b7a4f' },
      { key: 'dinner', label: 'Dinner', color: '#6d4a73' },
      { key: 'split', label: 'Split', color: '#3d6f8e' },
    ],
    gates: [
      { key: 'rsa', label: 'RSA certificate', credentialType: 'rsa', block: false },
      { key: 'food-handling', label: 'Food handling cert', credentialType: 'food-handling', block: false },
    ],
    shiftTemplates: [
      { name: 'Breakfast', category: 'breakfast', startTime: '06:00', endTime: '11:00' },
      { name: 'Lunch', category: 'lunch', startTime: '11:00', endTime: '15:00' },
      { name: 'Dinner', category: 'dinner', startTime: '17:00', endTime: '23:00' },
    ],
  },
  {
    key: 'security',
    label: 'Security',
    emoji: '🛡️',
    planningMode: 'demand',
    terminology: { worker: 'Guard', location: 'Post', client: 'Client', shift: 'Shift' },
    modules: ['roster', 'timesheets', 'compliance', 'gps', 'qr', 'incidents', 'ai'],
    categories: [
      { key: 'daypatrol', label: 'Day patrol', color: '#4a5560' },
      { key: 'nightpatrol', label: 'Night patrol', color: '#23271f' },
      { key: 'static', label: 'Static guard', color: '#3d6f8e' },
      { key: 'event', label: 'Event', color: '#6d4a73' },
    ],
    gates: [
      { key: 'security-licence', label: 'Security licence', credentialType: 'security-licence', block: false },
      { key: 'first-aid', label: 'First aid', credentialType: 'first-aid', block: false },
    ],
    shiftTemplates: [
      { name: 'Day patrol', category: 'daypatrol', startTime: '06:00', endTime: '18:00' },
      { name: 'Night patrol', category: 'nightpatrol', startTime: '18:00', endTime: '06:00' },
      { name: 'Static guard', category: 'static', startTime: '08:00', endTime: '20:00' },
      { name: 'Event', category: 'event', startTime: '16:00', endTime: '02:00' },
    ],
  },
  {
    key: 'labourhire',
    label: 'Labour Hire',
    emoji: '🤝',
    planningMode: 'demand',
    terminology: { worker: 'Worker', location: 'Host', client: 'Host client', shift: 'Placement' },
    modules: ['roster', 'timesheets', 'compliance', 'marketplace', 'invoices', 'clientportal', 'gps', 'ai'],
    categories: [
      { key: 'day', label: 'Day placement', color: '#5b7a4f' },
      { key: 'afternoon', label: 'Afternoon', color: '#c98a3c' },
      { key: 'night', label: 'Night', color: '#4a5560' },
    ],
    gates: [
      { key: 'right-to-work', label: 'Right to work / visa', credentialType: 'right-to-work', block: false },
      { key: 'labour-hire-licence', label: 'Labour Hire Licence', credentialType: 'labour-hire-licence', block: false },
    ],
    shiftTemplates: [
      { name: 'Day placement', category: 'day', startTime: '07:00', endTime: '15:00' },
      { name: 'Afternoon', category: 'afternoon', startTime: '14:00', endTime: '22:00' },
      { name: 'Night', category: 'night', startTime: '22:00', endTime: '06:00' },
    ],
  },
  {
    key: 'general',
    label: 'General',
    emoji: '🏢',
    planningMode: 'demand',
    terminology: { worker: 'Worker', location: 'Location', client: 'Client', shift: 'Shift' },
    modules: ['roster', 'timesheets', 'compliance', 'ai'],
    categories: [
      { key: 'general', label: 'General', color: '#4a5560' },
      { key: 'urgent', label: 'Urgent', color: '#c0524a' },
      { key: 'training', label: 'Training', color: '#caa63c' },
    ],
    gates: [],
    shiftTemplates: [{ name: 'Standard', category: 'general', startTime: '09:00', endTime: '17:00' }],
  },
];

const TEMPLATE_BY_KEY = new Map(INDUSTRY_TEMPLATES.map((t) => [t.key, t]));

export function industryTemplate(key: string): IndustryTemplate | undefined {
  return TEMPLATE_BY_KEY.get(key);
}

/** The fallback config when an org has no PlatformConfig yet. */
export const DEFAULT_TEMPLATE_KEY = 'general';
