'use client';

import { useState } from 'react';
import { PLATFORMS } from '@/lib/platforms';
import type { Platform, ContentType } from '@/lib/types';

// ── Content type config ──────────────────────────────────────────────────────

const CONTENT_TYPES: {
  id: ContentType;
  label: string;
  emoji: string;
  questions: [string, string];
}[] = [
  {
    id: 'case-study',
    label: 'Case Study',
    emoji: '📊',
    questions: ['Client industry?', 'What result did you achieve?'],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    emoji: '🧠',
    questions: ['What topic?', 'Target audience?'],
  },
  {
    id: 'design',
    label: 'Design',
    emoji: '🎨',
    questions: ['Design type?', "What's unique about it?"],
  },
  {
    id: 'trend',
    label: 'Trend',
    emoji: '📈',
    questions: ['What trend?', 'Why important now?'],
  },
  {
    id: 'promotion',
    label: 'Promotion',
    emoji: '🚀',
    questions: ['What service?', 'What problem does it solve?'],
  },
];

// ── Static demo output ───────────────────────────────────────────────────────

const DEMO_TITLES = [
  'Dark Mode Design: Beyond Just Inverting Colors',
  '5 Dark Mode Mistakes That Break Your UI (And How to Fix Them)',
  'The Science of Dark Mode: Why It Converts Better for SaaS Products',
];

const DEMO_CAPTIONS: Partial<Record<Platform, string>> = {
  instagram:
    'Dark mode done wrong looks like a negative photo.\nDark mode done right feels like a premium product.\n\nThe difference? It\'s not about inverting colors — it\'s about rethinking every surface, every shadow, and every contrast relationship from scratch. 🌑\n\nSwipe to see the 5 principles we use when designing dark interfaces for our SaaS clients.',
  linkedin:
    'Most teams approach dark mode as a last-minute toggle. The result is interfaces that feel flat, inconsistent, and frankly — broken.\n\nAfter redesigning 30+ product UIs, here\'s what separates dark mode that converts from dark mode that just looks "developer-built":\n\n→ Elevation through color, not shadows\n→ Background layering with perceptible contrast steps\n→ Desaturated palettes with intentional accent punches\n→ Typography rendering tested on dark surfaces\n→ System icon adaptation, not just recoloring\n\nFull breakdown in the article below.',
  twitter:
    'Dark mode is not just inverting colors. It\'s an entirely different design system.\n\nMost teams get this wrong — here\'s the 5-point framework we use for every SaaS dark UI 🧵',
  dribbble:
    'Dark mode dashboard exploration — elevation through perceptual color layers, zero drop shadows. Every surface intentionally lit to create depth without noise.',
  pinterest:
    'Dark mode UI design inspiration — 5 principles for building premium dark interfaces. Save for your next SaaS or dashboard project.',
  gmb: 'We specialize in dark mode UI design for SaaS products and dashboards. Professional, conversion-focused, and built with accessibility in mind.',
};

const DEMO_HASHTAGS = {
  trending: ['#DarkMode', '#UIDesign', '#UXDesign', '#SaaS', '#ProductDesign'],
  niche: ['#DarkUI', '#DashboardDesign', '#DesignSystem', '#ComponentDesign', '#ModernUI'],
  branded: ['#AgencyWork', '#DesignProcess', '#ClientProject', '#WeDesign'],
};

// ── Component ────────────────────────────────────────────────────────────────

export default function ContentCreatorPage() {
  const [selectedType, setSelectedType] = useState<ContentType>('design');
  const [answers, setAnswers] = useState<[string, string]>(['Dark mode dashboard UI', 'Elevation via color instead of shadows']);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram', 'linkedin', 'twitter']);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<Platform>('instagram');
  const [copiedTitle, setCopiedTitle] = useState<number | null>(null);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [aiTitles, setAiTitles] = useState<string[]>([]);
  const [aiCaptions, setAiCaptions] = useState<Record<string, string>>({});
  const [aiHashtags, setAiHashtags] = useState<{ trending: string[]; niche: string[]; branded: string[] }>({ trending: [], niche: [], branded: [] });

  const currentType = CONTENT_TYPES.find((t) => t.id === selectedType)!;

  function handleTypeSelect(type: ContentType) {
    setSelectedType(type);
    setAnswers(['', '']);
    setGenerated(false);
  }

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  async function handleGenerate() {
    if (selectedPlatforms.length === 0) return;
    setGenerating(true);
    setGenerated(false);

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: selectedType,
          answers,
          platforms: selectedPlatforms,
        }),
      });
      const data = await res.json();

      if (data.titles) setAiTitles(data.titles);
      if (data.captions) setAiCaptions(data.captions);
      if (data.hashtags) setAiHashtags(data.hashtags);
    } catch {
      // Fallback to demo content on error
      setAiTitles([...DEMO_TITLES]);
      setAiCaptions({ ...DEMO_CAPTIONS } as Record<string, string>);
      setAiHashtags({ ...DEMO_HASHTAGS });
    }

    setGenerating(false);
    setGenerated(true);
    setActiveTab(selectedPlatforms[0]);
  }

  function copyToClipboard(text: string, onDone: () => void) {
    navigator.clipboard.writeText(text).then(onDone).catch(() => onDone());
  }

  function handleCopyTitle(index: number) {
    const titles = aiTitles.length > 0 ? aiTitles : DEMO_TITLES;
    copyToClipboard(titles[index], () => {
      setCopiedTitle(index);
      setTimeout(() => setCopiedTitle(null), 2000);
    });
  }

  function handleCopyAllHashtags() {
    const tags = aiHashtags.trending.length > 0 ? aiHashtags : DEMO_HASHTAGS;
    const all = [
      ...tags.trending,
      ...tags.niche,
      ...tags.branded,
    ].join(' ');
    copyToClipboard(all, () => {
      setCopiedHashtags(true);
      setTimeout(() => setCopiedHashtags(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-[#f1f5f9] font-sans">
      {/* Page header */}
      <div className="border-b border-[#2a2b3e] bg-[#12131e]">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#f1f5f9]">Content Creator</h1>
            <p className="text-sm text-[#94a3b8] mt-0.5">Generate platform-optimized content in seconds</p>
          </div>
          <a
            href="/scheduler"
            className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
          >
            <span>View Calendar</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-[1400px] mx-auto px-6 py-8 flex gap-6">
        {/* ── Left panel: Form ── */}
        <div className="w-[60%] flex flex-col gap-6">

          {/* Content type selector */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
            <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider mb-4">
              Content Type
            </h2>
            <div className="flex gap-2">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg text-sm font-medium transition-all border ${
                    selectedType === type.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-[#12131e] border-[#2a2b3e] text-[#94a3b8] hover:border-indigo-500/50 hover:text-[#f1f5f9]'
                  }`}
                >
                  <span className="text-xl">{type.emoji}</span>
                  <span className="text-xs leading-tight text-center">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic questions */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
            <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider mb-4">
              Content Details
            </h2>
            <div className="flex flex-col gap-4">
              {currentType.questions.map((question, i) => (
                <div key={`${selectedType}-q${i}`}>
                  <label className="block text-sm font-medium text-[#f1f5f9] mb-2">
                    {question}
                  </label>
                  <input
                    type="text"
                    value={answers[i]}
                    onChange={(e) => {
                      const updated: [string, string] = [...answers] as [string, string];
                      updated[i] = e.target.value;
                      setAnswers(updated);
                    }}
                    placeholder={`Enter your answer…`}
                    className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-3 text-sm placeholder-[#94a3b8]/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Platform selection */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider">
                Platforms
              </h2>
              <span className="text-xs text-[#94a3b8]">
                {selectedPlatforms.length} selected
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(PLATFORMS) as [Platform, typeof PLATFORMS[Platform]][]).map(
                ([key, platform]) => {
                  const isSelected = selectedPlatforms.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => togglePlatform(key)}
                      style={
                        isSelected
                          ? {
                              borderColor: platform.color,
                              boxShadow: `0 0 0 1px ${platform.color}40`,
                              backgroundColor: `${platform.color}15`,
                            }
                          : {}
                      }
                      className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm transition-all ${
                        isSelected
                          ? 'text-[#f1f5f9]'
                          : 'bg-[#12131e] border-[#2a2b3e] text-[#94a3b8] hover:border-[#2a2b3e]/80 hover:text-[#f1f5f9]'
                      }`}
                    >
                      <span className="text-base flex-shrink-0">{platform.icon}</span>
                      <span className="font-medium truncate text-xs">{platform.name}</span>
                      {isSelected && (
                        <svg
                          className="w-3 h-3 ml-auto flex-shrink-0"
                          style={{ color: platform.color }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={selectedPlatforms.length === 0 || generating}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
          >
            {generating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Content…
              </>
            ) : (
              <>
                Generate Content
                <span className="text-base">⚡</span>
              </>
            )}
          </button>
        </div>

        {/* ── Right panel: Preview ── */}
        <div className="w-[40%] flex flex-col gap-5">
          {!generated ? (
            <div className="flex-1 bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-base font-semibold text-[#f1f5f9] mb-2">
                Ready to generate
              </h3>
              <p className="text-sm text-[#94a3b8] max-w-xs">
                Fill in your content details, select platforms, and click Generate to create optimized content for each channel.
              </p>
            </div>
          ) : (
            <>
              {/* Titles */}
              <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
                <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider mb-3">
                  Title Options
                </h2>
                <div className="flex flex-col gap-2">
                  {(aiTitles.length > 0 ? aiTitles : DEMO_TITLES).map((title, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-[#12131e] rounded-lg p-3 border border-[#2a2b3e] group hover:border-indigo-500/40 transition-colors"
                    >
                      <span className="text-xs text-indigo-400 font-bold mt-0.5 flex-shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="text-sm text-[#f1f5f9] flex-1 leading-relaxed">{title}</p>
                      <button
                        onClick={() => handleCopyTitle(i)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy title"
                      >
                        {copiedTitle === i ? (
                          <svg className="w-4 h-4 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-[#94a3b8] hover:text-[#f1f5f9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Captions per platform */}
              <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
                <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider mb-3">
                  Platform Captions
                </h2>
                {/* Tabs */}
                <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                  {selectedPlatforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => setActiveTab(p)}
                      style={
                        activeTab === p
                          ? { borderColor: PLATFORMS[p].color, color: PLATFORMS[p].color }
                          : {}
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap flex-shrink-0 ${
                        activeTab === p
                          ? 'bg-[#12131e]'
                          : 'border-transparent text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#12131e]/50'
                      }`}
                    >
                      <span>{PLATFORMS[p].icon}</span>
                      <span>{PLATFORMS[p].name}</span>
                    </button>
                  ))}
                </div>
                {/* Caption text */}
                <div className="bg-[#12131e] rounded-lg border border-[#2a2b3e] p-4">
                  <pre className="text-sm text-[#f1f5f9] whitespace-pre-wrap font-sans leading-relaxed">
                    {(Object.keys(aiCaptions).length > 0 ? aiCaptions[activeTab] : DEMO_CAPTIONS[activeTab]) ?? DEMO_CAPTIONS.instagram}
                  </pre>
                </div>
              </div>

              {/* Hashtags */}
              <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider">
                    Hashtags
                  </h2>
                  <button
                    onClick={handleCopyAllHashtags}
                    className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
                  >
                    {copiedHashtags ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[#22c55e]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy All
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {(
                    [
                      { label: 'Trending', tags: (aiHashtags.trending.length > 0 ? aiHashtags : DEMO_HASHTAGS).trending, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
                      { label: 'Niche', tags: (aiHashtags.niche.length > 0 ? aiHashtags : DEMO_HASHTAGS).niche, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                      { label: 'Branded', tags: (aiHashtags.branded.length > 0 ? aiHashtags : DEMO_HASHTAGS).branded, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                    ] as const
                  ).map(({ label, tags, color }) => (
                    <div key={label}>
                      <p className="text-xs font-medium text-[#94a3b8] mb-2">{label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-xs px-2 py-1 rounded-md border font-medium ${color}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
                <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider mb-4">
                  Actions
                </h2>
                <div className="flex flex-col gap-2">
                  <a
                    href="/scheduler"
                    className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm text-center transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Post
                  </a>
                  <button className="w-full py-3 px-4 rounded-lg bg-[#12131e] hover:bg-[#0a0b14] text-[#f1f5f9] font-medium text-sm transition-all border border-[#2a2b3e] hover:border-indigo-500/40 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Package
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="w-full py-3 px-4 rounded-lg bg-[#12131e] hover:bg-[#0a0b14] text-[#94a3b8] hover:text-[#f1f5f9] font-medium text-sm transition-all border border-[#2a2b3e] hover:border-indigo-500/40 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
