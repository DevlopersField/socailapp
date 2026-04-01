import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const supabase = getAuthClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!rateLimiters.read.check(user.id)) return rateLimitResponse() as unknown as NextResponse;

  // Only return the active provider name — never disclose which server-side keys exist
  const provider = process.env.AI_PROVIDER || 'openrouter';

  return NextResponse.json({
    provider,
    note: 'Configure your AI provider and API key in Settings.',
  });
}
