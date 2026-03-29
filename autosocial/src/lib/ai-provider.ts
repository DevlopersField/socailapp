import { createClient } from '@supabase/supabase-js';

export type AIProvider = 'openrouter' | 'openai' | 'anthropic';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
}

const BASE_URLS: Record<AIProvider, string> = {
  openrouter: 'https://openrouter.ai/api/v1',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
};

// Get AI config from user's saved settings in Supabase
export async function getUserAIConfig(userId: string): Promise<AIConfig> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data } = await supabase.from('user_settings').select('*').eq('user_id', userId).single();

  if (!data) {
    throw new Error('No AI settings configured. Go to Settings to set up your AI provider and API key.');
  }

  const provider = (data.ai_provider || 'openrouter') as AIProvider;
  const keyMap: Record<AIProvider, string> = {
    openrouter: data.openrouter_key || '',
    openai: data.openai_key || '',
    anthropic: data.anthropic_key || '',
  };

  const apiKey = keyMap[provider];
  if (!apiKey) {
    throw new Error(`No API key set for ${provider}. Go to Settings → AI Provider to add your ${provider} key.`);
  }

  return {
    provider,
    apiKey,
    model: data.ai_model || 'nvidia/nemotron-3-super-120b-a12b:free',
    baseUrl: BASE_URLS[provider],
  };
}

export async function analyzeImageAndGenerate(
  imageBase64: string,
  mimeType: string,
  userContext?: string,
  userId?: string,
): Promise<BrainOutput> {
  if (!userId) {
    throw new Error('Authentication required. Please sign in.');
  }

  const config = await getUserAIConfig(userId);

  if (config.provider === 'anthropic') {
    return callAnthropic(config, imageBase64, mimeType, userContext);
  }

  return callOpenAICompatible(config, imageBase64, mimeType, userContext);
}

async function callOpenAICompatible(
  config: AIConfig,
  imageBase64: string,
  mimeType: string,
  userContext?: string
): Promise<BrainOutput> {
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(userContext);
  const isOpenRouter = config.provider === 'openrouter';

  // Models that support vision (image analysis)
  const isVisionModel = config.model.includes('vl') || config.model.includes('gemini') || config.model.includes('gpt-4o') || config.model.includes('claude');

  const userContent = isVisionModel
    ? [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        { type: 'text', text: userMessage },
      ]
    : userMessage + '\n\nNote: An image was uploaded but this model cannot analyze it directly. Generate high-quality social media content based on the context provided. Be creative and specific.';

  const body: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  };

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...(isOpenRouter
        ? { 'HTTP-Referer': 'https://autosocial.app', 'X-Title': 'AutoSocial' }
        : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`[AI ${config.provider}] Error:`, err);
    throw new Error(`AI request failed (${response.status}). Check your API key in Settings.`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const content = message?.content || message?.reasoning || '';

  if (!content) {
    throw new Error('AI returned empty response. Try a different model in Settings.');
  }

  try {
    const parsed = extractJSON(content);
    if (parsed && 'titles' in parsed && 'captions' in parsed) {
      return parsed as unknown as BrainOutput;
    }
    return JSON.parse(content) as BrainOutput;
  } catch {
    console.error('[AI] Failed to parse JSON, content:', content.slice(0, 300));
    throw new Error('AI response was not valid JSON. Try again or switch model in Settings.');
  }
}

async function callAnthropic(
  config: AIConfig,
  imageBase64: string,
  mimeType: string,
  userContext?: string
): Promise<BrainOutput> {
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(userContext);

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
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: userMessage },
        ],
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API failed (${response.status}). Check your API key in Settings.`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  const parsed = extractJSON(textBlock?.text || '');
  if (parsed && 'titles' in parsed && 'captions' in parsed) {
    return parsed as unknown as BrainOutput;
  }
  throw new Error('Anthropic response was not valid JSON. Try again.');
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

function buildSystemPrompt(): string {
  return `You are AutoSocial Brain — an expert social media manager for web agencies.
You analyze images and generate complete social media content packages.

ALWAYS respond with valid JSON matching this exact structure:
{
  "analysis": {
    "subject": "what the image shows",
    "industry": "detected industry/niche",
    "mood": "visual mood and style",
    "contentType": "case-study|knowledge|design|trend|promotion",
    "detectedText": "any text visible in the image"
  },
  "titles": {
    "hook": "attention-grabbing title",
    "value": "benefit-focused title",
    "curiosity": "curiosity-driven title"
  },
  "captions": {
    "instagram": "engaging caption with line breaks, max 300 chars, end with CTA",
    "linkedin": "professional storytelling caption, 1300-2000 chars, insight-driven",
    "twitter": "sharp punchy caption under 280 chars",
    "pinterest": "SEO-rich description with keywords",
    "dribbble": "design-focused, process-oriented caption",
    "gmb": "local SEO, direct, service-focused with CTA"
  },
  "hashtags": {
    "instagram": ["15-20 hashtags"],
    "linkedin": ["3-5 hashtags"],
    "twitter": ["2-3 hashtags"],
    "pinterest": ["5-10 hashtags"],
    "dribbble": ["5-8 hashtags"],
    "gmb": []
  },
  "strategy": {
    "bestTime": "recommended posting time",
    "bestDay": "recommended day of week",
    "contentTip": "one specific tip for this post"
  }
}

Rules:
- Never use "excited to announce", "game-changer", "thrilled", "leveraging"
- Every caption must have a clear CTA
- Hashtags must be platform-appropriate counts
- Be specific to the image content, not generic
- Respond ONLY with JSON, no other text`;
}

function buildUserMessage(userContext?: string): string {
  let msg = 'Analyze this image and generate a complete social media content package for all 6 platforms (Instagram, LinkedIn, Twitter/X, Pinterest, Dribbble, Google My Business).';
  if (userContext) msg += `\n\nAdditional context from the user: ${userContext}`;
  msg += '\n\nRespond ONLY with the JSON object, no other text.';
  return msg;
}

export interface BrainOutput {
  analysis: {
    subject: string;
    industry: string;
    mood: string;
    contentType: string;
    detectedText: string;
  };
  titles: {
    hook: string;
    value: string;
    curiosity: string;
  };
  captions: Record<string, string>;
  hashtags: Record<string, string[]>;
  strategy: {
    bestTime: string;
    bestDay: string;
    contentTip: string;
  };
}
