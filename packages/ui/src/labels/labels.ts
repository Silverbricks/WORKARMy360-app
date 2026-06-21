import { enAU } from './en-AU';

export type LabelKey = keyof typeof enAU;

/**
 * Resolve a label by key, with optional `{var}` interpolation.
 * Unknown keys fall back to the key itself so nothing crashes during dev.
 */
export function t(key: LabelKey, vars?: Record<string, string | number>): string {
  let value: string = enAU[key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${name}\\}`, 'g'), String(replacement));
    }
  }
  return value;
}
