import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';
import { getUserAIConfig } from '@/lib/ai-provider';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit';

// Input validation schemas
const VALID_GOALS = ['growth', 'engagement', 'brand-awareness', 'traffic', 'leads'] as const;
const VALID_PLATFORMS = ['instagram', 'linkedin', 'pinterest', 'reddit'] as const;
const MAX_CONTEXT_LENGTH = 2000;

export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit (AI calls are expensive)
    if (!rateLimiters.ai.check(user.id)) return rateLimitResponse() as unknown as NextResponse;

    // Parse and validate body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const goal = typeof body.goal === 'string' ? body.goal : 'growth';
    const platforms = Array.isArray(body.platforms) ? body.platforms : ['instagram', 'pinterest', 'reddit'];
    const context = typeof body.context === 'string' ? body.context.slice(0, MAX_CONTEXT_LENGTH) : '';
    const analyticsData = typeof body.analyticsData === 'object' && body.analyticsData ? body.analyticsData : null;
    const trendsData = Array.isArray(body.trendsData) ? body.trendsData.slice(0, 20) : [];

    // Validate goal
    if (!VALID_GOALS.includes(goal as typeof VALID_GOALS[number])) {
      return NextResponse.json({ error: `Invalid goal. Must be one of: ${VALID_GOALS.join(', ')}` }, { status: 400 });
    }

    // Validate platforms
    const validPlatforms = platforms.filter((p: unknown) =>
      typeof p === 'string' && VALID_PLATFORMS.includes(p as typeof VALID_PLATFORMS[number])
    );
    if (validPlatforms.length === 0) {
      return NextResponse.json({ error: `At least one valid platform required: ${VALID_PLATFORMS.join(', ')}` }, { status: 400 });
    }

    // Get AI config
    const config = await getUserAIConfig(user.id);

    // Build strategy prompt
    const systemPrompt = buildStrategySystemPrompt();
    const userPrompt = buildStrategyUserPrompt(goal, validPlatforms, context, analyticsData, trendsData);

    let strategyText: string;

    if (config.provider === 'anthropic') {
      strategyText = await callAnthropicStrategy(config, systemPrompt, userPrompt);
    } else {
      strategyText = await callOpenAIStrategy(config, systemPrompt, userPrompt);
    }

    // Parse JSON response
    const strategy = extractJSON(strategyText);
    if (!strategy) {
      return NextResponse.json({ error: 'AI returned invalid strategy format. Try again.' }, { status: 502 });
    }

    return NextResponse.json({ strategy, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[POST /api/strategy]', error);
    const message = error instanceof Error ? error.message : 'Failed to generate strategy';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildStrategySystemPrompt(): string {
  return `You are AutoSocial Strategist — an expert social media strategist for web agencies.
You analyze performance data and current trends to create actionable content strategies.

ALWAYS respond with valid JSON matching this exact structure:
{
  "overview": "2-3 sentence strategy summary",
  "weeklyPlan": [
    {
      "day": "Monday",
      "platform": "instagram",
      "contentType": "case-study|knowledge|design|trend|promotion",
      "topic": "specific topic idea",
      "caption": "ready-to-use caption (first 100 chars)",
      "bestTime": "HH:MM AM/PM",
      "hashtags": ["relevant", "hashtags"]
    }
  ],
  "platformStrategies": {
    "instagram": { "focus": "what to focus on", "frequency": "posts per week", "contentMix": "ratio breakdown", "tip": "specific actionable tip" },
    "pinterest": { "focus": "...", "frequency": "...", "contentMix": "...", "tip": "..." },
    "reddit": { "focus": "...", "frequency": "...", "contentMix": "...", "tip": "..." },
    "linkedin": { "focus": "...", "frequency": "...", "contentMix": "...", "tip": "..." }
  },
  "trendOpportunities": [
    { "trend": "trend keyword", "angle": "how to leverage it", "platform": "best platform for it", "urgency": "high|medium|low" }
  ],
  "improvements": [
    { "area": "what to improve", "action": "specific step to take", "expectedImpact": "high|medium|low" }
  ]
}

Rules:
- Base recommendations on the actual data provided
- Be specific — no generic "post regularly" advice
- Include exact posting times, content types, and topic ideas
- Each weeklyPlan entry must be a concrete, ready-to-execute post idea
- Generate 5-7 days of content in weeklyPlan
- Only include platforms the user selected
- Respond ONLY with JSON, no other text`;
}

function buildStrategyUserPrompt(
  goal: string,
  platforms: string[],
  context: string,
  analyticsData: unknown,
  trendsData: unknown[]
): string {
  let prompt = `Generate a social media strategy for the following:

GOAL: ${goal}
PLATFORMS: ${platforms.join(', ')}
`;

  if (context) {
    prompt += `\nADDITIONAL CONTEXT: ${context}\n`;
  }

  if (analyticsData && typeof analyticsData === 'object') {
    prompt += `\nPERFORMANCE DATA:\n${JSON.stringify(analyticsData, null, 2)}\n`;
  }

  if (trendsData.length > 0) {
    const trendSummary = trendsData.map((t: unknown) => {
      const trend = t as Record<string, unknown>;
      return `- ${trend.keyword} (${trend.source}, score: ${trend.trend_score})`;
    }).join('\n');
    prompt += `\nCURRENT TRENDS:\n${trendSummary}\n`;
  }

  prompt += '\nRespond ONLY with the JSON object, no other text.';
  return prompt;
}

async function callOpenAIStrategy(
  config: { provider: string; apiKey: string; model: string; baseUrl: string },
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const isOpenRouter = config.provider === 'openrouter';

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...(isOpenRouter ? { 'HTTP-Referer': 'https://autosocial.app', 'X-Title': 'AutoSocial' } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed (${response.status}). Check your API key in Settings.`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropicStrategy(
  config: { apiKey: string; model: string; baseUrl: string },
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API failed (${response.status}). Check your API key in Settings.`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  return textBlock?.text || '';
}

function extractJSON(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    if (depth === 0) { end = i; break; }
  }
  if (end === -1) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}
