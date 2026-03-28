import { NextRequest, NextResponse } from 'next/server';
import { getAIConfig } from '@/lib/ai-provider';

export async function POST(request: NextRequest) {
  try {
    const { contentType, answers, platforms } = await request.json();

    if (!contentType || !answers) {
      return NextResponse.json({ error: 'contentType and answers are required' }, { status: 400 });
    }

    const config = getAIConfig();
    const context = `Content type: ${contentType}. Details: ${answers[0] || ''}. Additional: ${answers[1] || ''}`;

    // If no AI key, generate smart template-based content
    if (!config.apiKey) {
      return NextResponse.json(generateTemplateContent(contentType, answers, platforms || []));
    }

    // Call AI for real generation
    const systemPrompt = `You are an expert social media content creator for web agencies.
Generate content based on the user's input. Respond ONLY with valid JSON:
{
  "titles": ["title1", "title2", "title3"],
  "captions": { "instagram": "...", "linkedin": "...", "twitter": "...", "pinterest": "...", "dribbble": "...", "gmb": "..." },
  "hashtags": { "trending": ["5 hashtags"], "niche": ["5 hashtags"], "branded": ["3 hashtags"] }
}
Rules: No "excited to announce" or "game-changer". Every caption needs a CTA. Be specific to the topic.`;

    const body: Record<string, unknown> = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create social media content for: ${context}\nPlatforms: ${(platforms || []).join(', ')}` },
      ],
      temperature: 0.8,
      max_tokens: 3000,
    };

    if (config.provider === 'openrouter') {
      body.reasoning = { enabled: true };
    }

    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        ...(config.provider === 'openrouter' ? { 'HTTP-Referer': 'https://autosocial.app', 'X-Title': 'AutoSocial' } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('[Content Generate] AI error:', await res.text());
      return NextResponse.json(generateTemplateContent(contentType, answers, platforms || []));
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      } catch {}
    }

    return NextResponse.json(generateTemplateContent(contentType, answers, platforms || []));
  } catch (error) {
    console.error('[Content Generate]', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}

function generateTemplateContent(contentType: string, answers: string[], _platforms: string[]) {
  const topic = answers[0] || 'our latest project';
  const detail = answers[1] || 'a unique approach';

  const templates: Record<string, { titles: string[]; captions: Record<string, string>; hashtags: { trending: string[]; niche: string[]; branded: string[] } }> = {
    'case-study': {
      titles: [
        `How we transformed ${topic} — real results inside`,
        `${topic}: The strategy behind a ${detail}`,
        `From challenge to success: Our ${topic} story`,
      ],
      captions: {
        instagram: `Real results, not just pretty pixels.\n\nWe took on ${topic} with one goal: ${detail}.\n\nThe outcome? A transformation that speaks for itself.\n\nSwipe to see the full before & after 👇`,
        linkedin: `Every great case study starts with a real problem.\n\nOur client came to us with ${topic}. The challenge? ${detail}.\n\nHere's how we approached it:\n\n1. Deep discovery and stakeholder alignment\n2. Strategic positioning and visual direction\n3. Iterative design with data-backed decisions\n4. Launch, measure, and optimize\n\nThe result exceeded expectations. Full case study in the comments.`,
        twitter: `New case study: ${topic}\n\nThe brief: ${detail}\nThe result: exceeded every KPI.\n\nFull breakdown 👇`,
        pinterest: `${topic} case study — design transformation with measurable results. Save for project inspiration.`,
        dribbble: `${topic} — Full case study. ${detail}. Check the attachments for the complete process.`,
        gmb: `See how we helped with ${topic}. Real results for real businesses. Contact us for your project.`,
      },
      hashtags: {
        trending: ['#CaseStudy', '#DesignTransformation', '#ClientWork', '#Results', '#BeforeAndAfter'],
        niche: ['#AgencyWork', '#WebDesign', '#BrandStrategy', '#DesignProcess', '#ClientSuccess'],
        branded: ['#WeDesign', '#OurWork', '#AgencyPortfolio'],
      },
    },
    knowledge: {
      titles: [
        `${topic}: What every creative needs to know`,
        `The definitive guide to ${topic}`,
        `Stop getting ${topic} wrong — here's the right way`,
      ],
      captions: {
        instagram: `Most people get ${topic} completely wrong.\n\nHere's what actually works:\n\n${detail}\n\nSave this for later — you'll need it 🔖`,
        linkedin: `I've spent years studying ${topic}.\n\nThe biggest mistake I see? People overcomplicate it.\n\nHere's the framework that actually works:\n\n→ Start with ${detail}\n→ Test with real users, not assumptions\n→ Iterate based on data, not opinions\n→ Document everything for your team\n\nWhat's your experience with ${topic}? Drop your thoughts below.`,
        twitter: `${topic} simplified:\n\n${detail}\n\nMost people overthink this. Here's the framework 🧵`,
        pinterest: `Guide to ${topic} — practical tips and frameworks for ${detail}. Save for reference.`,
        dribbble: `Exploring ${topic} — key insights and practical applications. ${detail}.`,
        gmb: `Expert insights on ${topic}. We help businesses with ${detail}. Learn more on our blog.`,
      },
      hashtags: {
        trending: ['#DesignTips', '#LearnDesign', '#ProTips', '#KnowledgeSharing', '#DesignEducation'],
        niche: ['#DesignThinking', '#CreativeProcess', '#DesignFramework', '#BestPractices', '#DesignCommunity'],
        branded: ['#WeTeach', '#DesignInsights', '#AgencyTips'],
      },
    },
    design: {
      titles: [
        `${topic}: Where form meets function`,
        `The design decisions behind ${topic}`,
        `${detail} — a deep dive into ${topic}`,
      ],
      captions: {
        instagram: `Every pixel has a purpose.\n\nThis ${topic} was built with ${detail} at its core.\n\nThe result? A design that doesn't just look good — it works.\n\nWhat catches your eye first? 👇`,
        linkedin: `Good design is invisible. Great design is unforgettable.\n\nOur latest ${topic} focuses on ${detail}.\n\nThe approach:\n→ Function-first thinking\n→ Intentional visual hierarchy\n→ Accessibility as a foundation\n→ Performance-aware design decisions\n\nWhat makes a design memorable to you?`,
        twitter: `New work: ${topic}\n\nFocused on ${detail}.\n\nEvery element earns its place 🎯`,
        pinterest: `${topic} design inspiration — ${detail}. Modern, clean, functional design approach.`,
        dribbble: `${topic} — ${detail}. Process and thinking in the description. Feedback welcome.`,
        gmb: `Check out our latest ${topic} design. ${detail}. Contact us for your project.`,
      },
      hashtags: {
        trending: ['#UIDesign', '#DesignInspiration', '#CreativeDesign', '#VisualDesign', '#ModernDesign'],
        niche: ['#DesignDetails', '#PixelPerfect', '#CleanUI', '#DesignCraft', '#IntentionalDesign'],
        branded: ['#WeDesign', '#OurCraft', '#DesignProcess'],
      },
    },
    trend: {
      titles: [
        `${topic} is changing everything — here's why`,
        `Why ${topic} matters more than you think in 2026`,
        `The rise of ${topic}: ${detail}`,
      ],
      captions: {
        instagram: `${topic} is not a fad — it's the future.\n\n${detail}\n\nThe agencies that adapt now will lead tomorrow.\n\nAre you already using this? Tell us below 👇`,
        linkedin: `The landscape is shifting.\n\n${topic} is gaining momentum, and here's why it matters:\n\n${detail}\n\nThe question isn't whether to adopt it — it's how fast you can.\n\nEarly movers in our industry are already seeing 2-3x engagement improvements.\n\nWhat's your take on ${topic}?`,
        twitter: `${topic} is having a moment.\n\n${detail}\n\nHere's why smart agencies are paying attention 👀`,
        pinterest: `${topic} trend analysis — ${detail}. Stay ahead of the curve with these insights.`,
        dribbble: `Exploring ${topic} trend — ${detail}. Thoughts on where this is heading?`,
        gmb: `Stay ahead with ${topic}. ${detail}. We help businesses stay current with design trends.`,
      },
      hashtags: {
        trending: ['#DesignTrends', '#FutureOfDesign', '#TrendAlert', '#Innovation', '#WhatsTrending'],
        niche: ['#DesignForecast', '#IndustryInsights', '#CreativeTrends', '#DesignEvolution', '#NextBigThing'],
        branded: ['#WeTrend', '#AgencyInsights', '#OurTake'],
      },
    },
    promotion: {
      titles: [
        `${topic}: Built for businesses that want results`,
        `Introducing ${topic} — ${detail}`,
        `Your ${topic} deserves better. Here's how we help.`,
      ],
      captions: {
        instagram: `${topic} — designed to ${detail}.\n\nWe've helped dozens of businesses transform their results.\n\nReady to be next? DM us "START" to learn more 💬`,
        linkedin: `We're opening spots for ${topic}.\n\n${detail}\n\nThis isn't a one-size-fits-all solution. We customize every engagement to your specific goals, audience, and market position.\n\nInterested? Drop a comment or DM for details.`,
        twitter: `${topic} → ${detail}\n\nLimited spots available. DM to learn more.`,
        pinterest: `${topic} — professional service for businesses. ${detail}. Save for when you're ready.`,
        dribbble: `${topic} — ${detail}. Taking on new clients. Details in bio.`,
        gmb: `${topic} now available. ${detail}. Contact us today to get started. Limited availability.`,
      },
      hashtags: {
        trending: ['#BusinessGrowth', '#DigitalTransformation', '#MarketingStrategy', '#GrowYourBusiness', '#Results'],
        niche: ['#WebAgency', '#DesignServices', '#BrandPartner', '#CreativeAgency', '#DigitalAgency'],
        branded: ['#OurServices', '#WorkWithUs', '#AgencyPartner'],
      },
    },
  };

  return templates[contentType] || templates.design;
}
