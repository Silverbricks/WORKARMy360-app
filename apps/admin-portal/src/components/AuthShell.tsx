import type { ReactNode } from 'react';
import { Card } from '@workarmy/ui';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-10">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </Card>
    </div>
  );
}
