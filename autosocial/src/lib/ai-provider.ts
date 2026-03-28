export type AIProvider = 'openrouter' | 'openai' | 'anthropic';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
}

const PROVIDER_CONFIGS: Record<AIProvider, Omit<AIConfig, 'apiKey'>> = {
  openrouter: {
    provider: 'openrouter',
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  openai: {
    provider: 'openai',
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    baseUrl: 'https://api.anthropic.com/v1',
  },
};

export function getAIConfig(): AIConfig {
  const rawProvider = process.env.AI_PROVIDER || 'openrouter';
  const provider: AIProvider = rawProvider in PROVIDER_CONFIGS
    ? (rawProvider as AIProvider)
    : 'openrouter';
  const keyEnvMap: Record<AIProvider, string> = {
    openrouter: 'OPENROUTER_API_KEY',
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
  };
  const apiKey = process.env[keyEnvMap[provider]] || '';
  return { ...PROVIDER_CONFIGS[provider], apiKey };
}

export async function analyzeImageAndGenerate(
  imageBase64: string,
  mimeType: string,
  userContext?: string
): Promise<BrainOutput> {
  const config = getAIConfig();

  if (!config.apiKey) {
    return generateFallbackContent(userContext);
  }

  if (config.provider === 'anthropic') {
    return callAnthropic(config, imageBase64, mimeType, userContext);
  }

  // OpenRouter and OpenAI share OpenAI-compatible API format
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
  const isVisionModel = !config.model.includes('nemotron');

  // Build message content — use vision format for vision models, text-only for others
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

  // Enable reasoning for OpenRouter models that support it
  if (isOpenRouter) {
    body.reasoning = { enabled: true };
  }

  // Only request JSON format for models that support it
  if (!config.model.includes('nemotron')) {
    body.response_format = { type: 'json_object' };
  }

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
    return generateFallbackContent(userContext);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const content = message?.content || '';

  // Log reasoning if available (for debugging)
  if (message?.reasoning_details) {
    console.log('[AI] Reasoning details available');
  }

  try {
    // Extract JSON from response — use non-greedy match to find the outermost balanced braces
    const parsed = extractJSON(content);
    if (parsed && 'titles' in parsed && 'captions' in parsed) {
      return parsed as unknown as BrainOutput;
    }
    // Direct parse as fallback
    return JSON.parse(content) as BrainOutput;
  } catch {
    console.error('[AI] Failed to parse JSON response, content:', content.slice(0, 200));
    return generateFallbackContent(userContext);
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
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: userMessage },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[AI Anthropic] Error:', err);
    return generateFallbackContent(userContext);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  try {
    const parsed = extractJSON(textBlock?.text || '');
    if (parsed && 'titles' in parsed && 'captions' in parsed) {
      return parsed as unknown as BrainOutput;
    }
    return generateFallbackContent(userContext);
  } catch {
    return generateFallbackContent(userContext);
  }
}

function extractJSON(text: string): Record<string, unknown> | null {
  // Find the first { and match balanced braces to find the complete JSON object
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }

  if (end === -1) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
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
- Be specific to the image content, not generic`;
}

function buildUserMessage(userContext?: string): string {
  let msg = 'Analyze this image and generate a complete social media content package for all 6 platforms (Instagram, LinkedIn, Twitter/X, Pinterest, Dribbble, Google My Business).';
  if (userContext) {
    msg += `\n\nAdditional context from the user: ${userContext}`;
  }
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

function generateFallbackContent(userContext?: string): BrainOutput {
  const ctx = userContext || 'design showcase';
  return {
    analysis: {
      subject: 'Visual content for social media',
      industry: 'Design / Creative',
      mood: 'Professional, modern',
      contentType: 'design',
      detectedText: '',
    },
    titles: {
      hook: `This is what happens when design meets strategy`,
      value: `How we turned a concept into a scroll-stopping visual`,
      curiosity: `The one design principle most agencies ignore`,
    },
    captions: {
      instagram: `Design is not decoration — it's communication.\n\nThis piece was crafted with intention at every pixel. From color theory to visual hierarchy, every decision serves a purpose.\n\nWhat catches your eye first? Tell us below 👇`,
      linkedin: `Good design doesn't just look right — it feels right.\n\nWe approach every project with a simple framework:\n\n1. Understand the audience\n2. Define the visual language\n3. Execute with precision\n4. Iterate based on data\n\nThis ${ctx} is a perfect example of that process in action.\n\nThe result? A visual that doesn't just attract attention — it holds it.\n\nWhat's your design process? I'd love to compare notes.`,
      twitter: `Design is communication, not decoration. Here's our latest work that proves it 🎯`,
      pinterest: `${ctx} — professional design inspiration for creative agencies. Modern visual design with clean composition and strategic color choices.`,
      dribbble: `New work: ${ctx}. Focused on visual hierarchy and clean composition. Every element serves the story.`,
      gmb: `Check out our latest design work. We create visuals that drive results for businesses. Contact us for a free consultation.`,
    },
    hashtags: {
      instagram: ['#DesignInspiration', '#CreativeAgency', '#VisualDesign', '#GraphicDesign', '#DesignCommunity', '#CreativeDirection', '#BrandDesign', '#DesignThinking', '#MinimalDesign', '#DesignDaily', '#UIDesign', '#CreativeWork', '#DesignProcess', '#ArtDirection', '#VisualIdentity'],
      linkedin: ['#Design', '#CreativeAgency', '#BrandStrategy', '#VisualDesign'],
      twitter: ['#Design', '#CreativeAgency'],
      pinterest: ['#DesignInspiration', '#CreativeDesign', '#VisualDesign', '#GraphicDesign', '#ModernDesign', '#DesignIdeas', '#CreativeAgency'],
      dribbble: ['#design', '#visual', '#creative', '#agency', '#branding'],
      gmb: [],
    },
    strategy: {
      bestTime: '11:00 AM EST',
      bestDay: 'Tuesday',
      contentTip: 'Post the Instagram version first, then repurpose to LinkedIn 2 hours later for maximum reach.',
    },
  };
}
