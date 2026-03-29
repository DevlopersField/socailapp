'use client';

import { useState } from 'react';

interface Guide {
  id: string;
  title: string;
  icon: string;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  time: string;
  cost?: string;
  steps: string[];
  tip?: string;
  link?: string;
  linkLabel?: string;
}

const DIFFICULTY_COLORS = {
  Easy: 'bg-[#22c55e]/10 text-[#22c55e]',
  Medium: 'bg-amber-500/10 text-amber-400',
  Advanced: 'bg-red-500/10 text-red-400',
};

const AI_GUIDES: Guide[] = [
  {
    id: 'openrouter',
    title: 'OpenRouter (Recommended — Free)',
    icon: '🌐',
    color: '#6366f1',
    difficulty: 'Easy',
    time: '2 min',
    cost: 'Free tier available',
    link: 'https://openrouter.ai/keys',
    linkLabel: 'Open OpenRouter',
    steps: [
      'Go to openrouter.ai/keys',
      'Sign up with Google or GitHub (free)',
      'Click "Create Key"',
      'Copy your key (starts with sk-or-)',
      'Go to Settings → AI Provider → OpenRouter',
      'Paste your key and click "Test"',
    ],
    tip: 'OpenRouter gives you access to many models with one key. The Nemotron 120B model is completely free!',
  },
  {
    id: 'openai',
    title: 'OpenAI (GPT-4o)',
    icon: '🤖',
    color: '#10a37f',
    difficulty: 'Easy',
    time: '3 min',
    cost: 'Pay-as-you-go ($5 minimum)',
    link: 'https://platform.openai.com/api-keys',
    linkLabel: 'Open OpenAI',
    steps: [
      'Go to platform.openai.com/api-keys',
      'Sign up or log in',
      'Click "Create new secret key"',
      'Name it "AutoSocial" and copy the key',
      'Go to Settings → AI Provider → OpenAI',
      'Paste your key and click "Test"',
    ],
    tip: 'GPT-4o has vision — it can analyze your uploaded images to generate better content.',
  },
  {
    id: 'anthropic',
    title: 'Anthropic (Claude)',
    icon: '🧠',
    color: '#d97757',
    difficulty: 'Easy',
    time: '3 min',
    cost: 'Pay-as-you-go',
    link: 'https://console.anthropic.com',
    linkLabel: 'Open Anthropic',
    steps: [
      'Go to console.anthropic.com',
      'Create an account',
      'Navigate to API Keys section',
      'Click "Create Key" and copy it',
      'Go to Settings → AI Provider → Anthropic',
      'Paste your key',
    ],
    tip: 'Claude excels at creative writing — great for captions that sound natural and engaging.',
  },
];

const PLATFORM_GUIDES: Guide[] = [
  {
    id: 'instagram',
    title: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    difficulty: 'Advanced',
    time: '15-20 min',
    link: 'https://developers.facebook.com/apps/',
    linkLabel: 'Open Facebook Developers',
    steps: [
      'You need an Instagram Business or Creator account (not personal)',
      'Go to developers.facebook.com/apps and create a new app',
      'Choose "Business" type',
      'Add the "Instagram Graph API" product',
      'Connect your Instagram Business account',
      'Go to Graph API Explorer → generate a User Token',
      'Select permissions: instagram_basic, instagram_content_publish',
      'Click "Generate Access Token" and copy it',
      'Go to AutoSocial Settings → Platforms → Instagram → Paste token',
    ],
    tip: 'Your token expires in 60 days. You can extend it to 60 days by exchanging it for a long-lived token in Graph API Explorer.',
  },
  {
    id: 'linkedin',
    title: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    difficulty: 'Medium',
    time: '10 min',
    link: 'https://www.linkedin.com/developers/apps',
    linkLabel: 'Open LinkedIn Developers',
    steps: [
      'Go to linkedin.com/developers/apps',
      'Click "Create App"',
      'Fill in: App name → "AutoSocial", Your company page, Upload any logo',
      'Under Products tab → request "Sign In with LinkedIn" and "Share on LinkedIn"',
      'Go to Auth tab → copy Client ID and Client Secret',
      'Use the OAuth 2.0 playground to generate an access token',
      'Paste token → AutoSocial Settings → Platforms → LinkedIn',
    ],
    tip: 'LinkedIn tokens expire in 60 days. Bookmark your app page to refresh when needed.',
  },
  {
    id: 'twitter',
    title: 'Twitter / X',
    icon: '𝕏',
    color: '#1DA1F2',
    difficulty: 'Medium',
    time: '10 min',
    link: 'https://developer.x.com/en/portal/dashboard',
    linkLabel: 'Open X Developer Portal',
    steps: [
      'Go to developer.x.com and sign up for a developer account',
      'Create a new Project and App',
      'In your app settings, set up "User Authentication" with OAuth 2.0',
      'Set callback URL to: http://localhost:3000/api/auth/twitter/callback',
      'Go to "Keys and Tokens" tab',
      'Generate "Access Token and Secret"',
      'Paste both → AutoSocial Settings → Platforms → Twitter/X',
    ],
    tip: 'Free tier allows 1,500 tweets per month — more than enough for most agencies.',
  },
  {
    id: 'pinterest',
    title: 'Pinterest',
    icon: '📌',
    color: '#BD081C',
    difficulty: 'Easy',
    time: '5 min',
    link: 'https://developers.pinterest.com/apps/',
    linkLabel: 'Open Pinterest Developers',
    steps: [
      'Go to developers.pinterest.com/apps',
      'Create a new app',
      'Get your access token from the sandbox section',
      'Paste → AutoSocial Settings → Platforms → Pinterest',
    ],
    tip: 'Pinterest has the simplest API setup of all platforms. Takes just 5 minutes!',
  },
  {
    id: 'dribbble',
    title: 'Dribbble',
    icon: '🏀',
    color: '#EA4C89',
    difficulty: 'Easy',
    time: '5 min',
    link: 'https://dribbble.com/account/applications',
    linkLabel: 'Open Dribbble Apps',
    steps: [
      'Go to dribbble.com/account/applications',
      'Click "Register a new application"',
      'Fill in the app details',
      'Copy your access token',
      'Paste → AutoSocial Settings → Platforms → Dribbble',
    ],
  },
  {
    id: 'gmb',
    title: 'Google My Business',
    icon: '📍',
    color: '#4285F4',
    difficulty: 'Advanced',
    time: '20 min',
    link: 'https://console.cloud.google.com',
    linkLabel: 'Open Google Cloud Console',
    steps: [
      'You need a verified Google Business Profile first',
      'Go to console.cloud.google.com → create a new project',
      'Enable the "Google Business Profile API"',
      'Go to Credentials → Create OAuth 2.0 Client ID',
      'Set up the OAuth consent screen (External)',
      'Add scopes: business.manage',
      'Generate an access token using OAuth playground',
      'Paste → AutoSocial Settings → Platforms → GMB',
    ],
    tip: 'The hardest part is the OAuth consent screen. If stuck, use Google\'s OAuth 2.0 Playground to test.',
  },
];

const FEATURE_GUIDES: Guide[] = [
  {
    id: 'brain',
    title: 'Brain — Image Upload',
    icon: '🧠',
    color: '#6366f1',
    difficulty: 'Easy',
    time: '1 min',
    steps: [
      'Go to the Brain page from the sidebar',
      'Drag and drop an image (or click to browse)',
      'Optionally add context like "This is a case study for our fintech client"',
      'Choose your resize mode (Contain = no cropping, recommended)',
      'Click "Generate Everything"',
      'Get titles, captions, hashtags, and resized images for all 6 platforms!',
    ],
    tip: 'You need an AI key configured in Settings for Brain to generate content. Set up OpenRouter (free) in under 2 minutes!',
  },
  {
    id: 'trends',
    title: 'Trends — Live Data',
    icon: '📈',
    color: '#22c55e',
    difficulty: 'Easy',
    time: '30 sec',
    steps: [
      'Go to the Trends page — data loads automatically',
      'Browse trending topics from Google, Reddit, and X',
      'Click any trend to see details and content angles',
      'Click "Use for Post" to copy the topic',
      'Use it in Brain to generate content from trending topics',
    ],
    tip: 'Data refreshes every hour automatically. Click "Refresh" to force-fetch the latest trends.',
  },
  {
    id: 'scheduler',
    title: 'Scheduler — Content Calendar',
    icon: '📅',
    color: '#f59e0b',
    difficulty: 'Easy',
    time: '2 min',
    steps: [
      'Go to the Scheduler page',
      'Click any day on the calendar to create a new post',
      'Fill in: title, content type, platforms, date/time, caption',
      'Click "Schedule" to set it live, or "Save Draft" to finalize later',
      'Click existing posts on the calendar to edit, delete, or publish them',
    ],
    tip: 'Best posting times: Instagram 11am-1pm, LinkedIn 8-10am, Twitter 9am/12pm. The calendar makes planning easy!',
  },
  {
    id: 'packages',
    title: 'Packages — Export',
    icon: '📦',
    color: '#ec4899',
    difficulty: 'Easy',
    time: '1 min',
    steps: [
      'Go to Packages page',
      'Select the posts you want to export',
      'Choose format, platforms, and what to include',
      'Click "Generate Package" to create downloadable files',
    ],
  },
];

export default function GuidesPage() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['getting-started']));

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const matchesSearch = (guide: Guide) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return guide.title.toLowerCase().includes(q) || guide.steps.some(s => s.toLowerCase().includes(q));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#f1f5f9]">📖 Setup Guides</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Step-by-step instructions to connect everything. No technical knowledge needed.</p>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search guides... (e.g. Instagram, OpenRouter, scheduler)"
        className="w-full bg-[#1a1b2e] border border-[#2a2b3e] text-[#f1f5f9] rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 placeholder:text-[#64748b]"
      />

      {/* Getting Started */}
      {!search && (
        <div className="bg-gradient-to-r from-[#6366f1]/15 to-[#8b5cf6]/10 rounded-xl border border-[#6366f1]/30 p-6">
          <h2 className="text-lg font-bold text-[#f1f5f9] mb-3">Getting Started</h2>
          <p className="text-[#94a3b8] text-sm mb-4">4 steps to get up and running:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { num: '1', title: 'Upload your first image', desc: 'Brain generates everything automatically', href: '/brain', icon: '🧠' },
              { num: '2', title: 'Check what\'s trending', desc: 'Live data from Google, Reddit, and X', href: '/trends', icon: '📈' },
              { num: '3', title: 'Schedule your first post', desc: 'Pick a date and create content', href: '/scheduler', icon: '📅' },
              { num: '4', title: 'Connect your platforms', desc: 'Set up API access for auto-posting', href: '/settings', icon: '⚙️' },
            ].map(step => (
              <a key={step.num} href={step.href} className="flex items-center gap-3 p-3 bg-[#1a1b2e]/80 rounded-lg border border-[#2a2b3e] hover:border-[#6366f1]/50 transition-colors group">
                <span className="w-8 h-8 rounded-full bg-[#6366f1] text-white text-sm font-bold flex items-center justify-center shrink-0">{step.num}</span>
                <div className="min-w-0">
                  <p className="text-[#f1f5f9] text-sm font-medium group-hover:text-[#6366f1] transition-colors">{step.title}</p>
                  <p className="text-[#64748b] text-xs">{step.desc}</p>
                </div>
                <span className="text-[#94a3b8] ml-auto shrink-0 group-hover:text-[#6366f1]">→</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* AI Provider Guides */}
      <Section title="AI Provider Setup" subtitle="Choose one — OpenRouter is free and recommended" expanded={expanded.has('ai')} onToggle={() => toggle('ai')} defaultOpen>
        {AI_GUIDES.filter(matchesSearch).map(guide => <GuideCard key={guide.id} guide={guide} />)}
      </Section>

      {/* Platform Guides */}
      <Section title="Platform Connections" subtitle="Connect platforms to enable auto-publishing" expanded={expanded.has('platforms')} onToggle={() => toggle('platforms')} defaultOpen>
        {PLATFORM_GUIDES.filter(matchesSearch).map(guide => <GuideCard key={guide.id} guide={guide} />)}
      </Section>

      {/* Feature Guides */}
      <Section title="How to Use Each Feature" subtitle="Quick guides for every tool" expanded={expanded.has('features')} onToggle={() => toggle('features')} defaultOpen>
        {FEATURE_GUIDES.filter(matchesSearch).map(guide => <GuideCard key={guide.id} guide={guide} />)}
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children, expanded, onToggle, defaultOpen }: { title: string; subtitle: string; children: React.ReactNode; expanded: boolean; onToggle: () => void; defaultOpen?: boolean }) {
  const isOpen = expanded || defaultOpen;
  return (
    <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:bg-[#12131e]/50 transition-colors">
        <div>
          <h2 className="text-lg font-semibold text-[#f1f5f9]">{title}</h2>
          <p className="text-[#94a3b8] text-xs mt-0.5">{subtitle}</p>
        </div>
        <span className={`text-[#94a3b8] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="px-5 pb-5 space-y-3">{children}</div>}
    </div>
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-[#2a2b3e] overflow-hidden bg-[#12131e]">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#1a1b2e]/50 transition-colors">
        <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: guide.color }} />
        <span className="text-xl shrink-0">{guide.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[#f1f5f9] font-medium text-sm">{guide.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[guide.difficulty]}`}>{guide.difficulty}</span>
            <span className="text-[10px] text-[#64748b]">⏱ {guide.time}</span>
            {guide.cost && <span className="text-[10px] text-[#64748b]">{guide.cost}</span>}
          </div>
        </div>
        <span className={`text-[#94a3b8] transition-transform text-sm ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-[#2a2b3e]">
          {/* Steps */}
          <div className="space-y-2 mt-3">
            {guide.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#6366f1]/20 text-[#6366f1] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-[#f1f5f9] text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          {/* Link */}
          {guide.link && (
            <a href={guide.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90" style={{ backgroundColor: guide.color + '20', color: guide.color }}>
              {guide.linkLabel || 'Open'} →
            </a>
          )}

          {/* Tip */}
          {guide.tip && (
            <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-300"><span className="mr-1">💡</span> {guide.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
