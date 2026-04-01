import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const supabase = getAuthClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const provider = process.env.AI_PROVIDER || 'openrouter';
  const hasKey = Boolean(
    provider === 'openrouter'
      ? process.env.OPENROUTER_API_KEY
      : provider === 'openai'
        ? process.env.OPENAI_API_KEY
        : process.env.ANTHROPIC_API_KEY
  );

  return NextResponse.json({
    provider,
    hasKey,
    availableProviders: [
      { id: 'openrouter', name: 'OpenRouter', configured: Boolean(process.env.OPENROUTER_API_KEY) },
      { id: 'openai', name: 'OpenAI', configured: Boolean(process.env.OPENAI_API_KEY) },
      { id: 'anthropic', name: 'Anthropic (Claude)', configured: Boolean(process.env.ANTHROPIC_API_KEY) },
    ],
  });
}
