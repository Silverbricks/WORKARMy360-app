'use client';

import { type ChangeEvent, useRef, useState } from 'react';
import type { DocumentView } from '@workarmy/types';
import { Button, Icon } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

/** Reusable upload control — picks a file, POSTs it, returns the saved Document. */
export function FileUploadButton({
  kind = 'OTHER',
  label = 'Upload file',
  onUploaded,
}: {
  kind?: string;
  label?: string;
  onUploaded: (doc: DocumentView) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await api.files.upload(file, kind);
      onUploaded(doc);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <div>
      <input
        ref={ref}
        type="file"
        hidden
        onChange={onChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
      />
      <Button type="button" size="sm" variant="secondary" loading={busy} onClick={() => ref.current?.click()}>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="upload" size={16} />
          {label}
        </span>
      </Button>
      {error ? <p className="mt-1 text-sm text-[#DC2626]">{error}</p> : null}
    </div>
  );
}
