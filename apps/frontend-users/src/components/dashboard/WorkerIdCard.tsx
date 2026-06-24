'use client';

import { Card, Icon } from '@workarmy/ui';
import { fileDownloadUrl } from '@/lib/api';

export interface WorkerIdCardProps {
  name: string;
  waId: string;
  initials: string;
  photoId?: string | null;
  /** Verified credential labels (approved badges). */
  badges?: string[];
  footer?: React.ReactNode;
}

/** The WorkArmy Digital ID card visual — reused on Home and the Worker ID section. */
export function WorkerIdCard({ name, waId, initials, photoId, badges = [], footer }: WorkerIdCardProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div
        className="px-5 py-3 text-sm font-semibold text-white"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        WorkArmy Digital ID
      </div>
      <div className="flex items-center gap-4 p-5">
        {photoId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileDownloadUrl(photoId)} alt={name} className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <span
            className="grid h-20 w-20 place-items-center rounded-full text-xl font-semibold text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <div className="text-lg font-semibold text-[#1E293B]">{name}</div>
          <div className="font-mono text-sm text-[#64748B]">{waId}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.length === 0 ? (
              <span className="text-xs text-[#94A3B8]">No verified badges yet</span>
            ) : (
              badges.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#166534]"
                >
                  <Icon name="check" size={12} /> {b}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
      {footer ? <div className="border-t border-[#E5E7EB] p-4">{footer}</div> : null}
    </Card>
  );
}
