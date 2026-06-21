/** Font stacks. Actual faces are loaded by the app via next/font and exposed as
 * the CSS variables referenced here. */
export const fontFamily = {
  display: 'var(--font-display), Fraunces, Georgia, "Times New Roman", serif',
  body: 'var(--font-body), "Hanken Grotesk", system-ui, -apple-system, sans-serif',
} as const;

export const fontSize = {
  micro: '0.75rem',
  small: '0.875rem',
  body: '1rem',
  h3: '1.375rem',
  h2: '1.75rem',
  h1: '2.25rem',
  display: '3rem',
} as const;
