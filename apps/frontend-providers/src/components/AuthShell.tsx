import type { ReactNode } from 'react';
import { Card } from '@workarmy/ui';

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-10">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 text-center text-sm text-[#64748B]">{footer}</div> : null}
      </Card>
    </div>
  );
}
