import { NextResponse } from 'next/server';

export async function GET() {
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
