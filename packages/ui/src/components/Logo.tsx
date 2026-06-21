import { cn } from './cn';

export interface LogoProps {
  className?: string;
  /** Renders the wordmark in white (for the charcoal header). */
  onDark?: boolean;
}

export function Logo({ className, onDark = false }: LogoProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-2 text-lg font-semibold tracking-tight', className)}
      style={{ fontFamily: 'var(--font-display)', color: onDark ? '#FFFFFF' : '#1B1F24' }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2 3 6v6c0 5 3.8 7.7 9 10 5.2-2.3 9-5 9-10V6z"
          fill={onDark ? '#FFFFFF' : '#1B1F24'}
          opacity="0.12"
        />
        <path
          d="M12 2 3 6v6c0 5 3.8 7.7 9 10 5.2-2.3 9-5 9-10V6z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="m8 11 2.5 3L16 8.5" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      WorkArmy
    </span>
  );
}
