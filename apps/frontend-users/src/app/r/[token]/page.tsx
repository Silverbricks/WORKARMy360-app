import { PublicResumeView } from '@/components/public/PublicResumeView';

// Public, shareable CV — no auth, dynamic per token.
export const dynamic = 'force-dynamic';

export default async function PublicResumePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicResumeView token={token} />;
}
