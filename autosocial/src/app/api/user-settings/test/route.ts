import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit';

/**
 * Server-side API key validation.
 * Tests the key against the provider's API without exposing it to the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!rateLimiters.auth.check(user.id)) return rateLimitResponse() as unknown as NextResponse;

    const body = await request.json();
    const { provider, apiKey } = body;

    const validProviders = ['openrouter', 'openai', 'anthropic'];
    if (!provider || !validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
    }

    let valid = false;

    try {
      if (provider === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
          signal: AbortSignal.timeout(8000),
        });
        valid = res.ok;
      } else if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
          signal: AbortSignal.timeout(8000),
        });
        valid = res.ok;
      } else if (provider === 'anthropic') {
        // Validate format — Anthropic keys start with sk-ant-
        valid = apiKey.trim().startsWith('sk-ant-');
      }
    } catch {
      valid = false;
    }

    return NextResponse.json({ valid, provider });
  } catch (error) {
    console.error('[POST /api/user-settings/test]', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
