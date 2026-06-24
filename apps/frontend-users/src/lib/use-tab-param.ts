'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Reads the active tab from `?tab=` and writes it back on change, so sidebar
 * deep-links activate the right tab and the active nav item stays in sync.
 */
export function useTabParam<T extends string>(
  allowed: readonly T[],
  fallback: T,
): [T, (tab: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get('tab') as T | null;
  const current = raw && allowed.includes(raw) ? raw : fallback;

  const setTab = useCallback(
    (tab: T) => {
      const sp = new URLSearchParams(Array.from(params.entries()));
      sp.set('tab', tab);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  return [current, setTab];
}
