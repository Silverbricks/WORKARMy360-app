import { Prisma } from '@prisma/client';

/**
 * Allocate the next permanent WA ID atomically. Call inside the SAME
 * transaction that creates the person/organisation so the id and the row commit
 * together. The single-statement upsert-and-return is race-safe under
 * concurrency — no gaps, no duplicates.
 */
export async function allocateWaId(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.$queryRaw<Array<{ last_value: bigint }>>(Prisma.sql`
    INSERT INTO wa_id_counters (id, last_value, updated_at)
    VALUES ('GLOBAL', 1, now())
    ON CONFLICT (id) DO UPDATE
      SET last_value = wa_id_counters.last_value + 1,
          updated_at = now()
    RETURNING last_value;
  `);
  const value = rows[0]?.last_value ?? 0n;
  return `WA${value.toString().padStart(6, '0')}`;
}
