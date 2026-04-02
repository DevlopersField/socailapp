'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

const PLATFORM_DETAILS = {
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    status: 'OAuth 2.0',
    difficulty: 'Advanced',
    setupTime: '10-15 min',
    description: 'Connect your Instagram Business Account to schedule posts, view insights, and manage content from AutoSocial.',
    features: [
      'Schedule photos and reels',
      '60-day auto-refreshing tokens',
      'Real-time insights & analytics',
      'Hashtag research & suggestions',
      'Multi-account management',
      'Batch scheduling support',
    ],
    requirements: [
      'Instagram Business Account (linked to Facebook Page)',
      'Facebook App created in Meta Business',
      'Instagram Graph API access',
      'Admin or Editor role on connected page',
    ],
    limitations: [
      'Cannot schedule Stories via API',
      'Token auto-refreshes every 60 days',
      'Insights data delayed by ~24 hours',
      'API limits: 200 calls/user/hour',
    ],
    setup: [
      {
        step: 1,
        title: 'Create Facebook App',
        description: 'Go to Facebook Developers and create a new Business app',
        details: [
          'Visit https://developers.facebook.com/apps/',
          'Click "Create App" → Select "Business" type',
          'Name your app (e.g., "AutoSocial")',
          'Accept terms and create',
        ],
      },
      {
        step: 2,
        title: 'Add Instagram Graph API',
        description: 'Enable Instagram Graph API in your app',
        details: [
          'In app dashboard, click "Add Product"',
          'Search for and select "Instagram Graph API"',
          'Click "Set Up"',
          'Go to Settings → Basic',
          'Copy your App ID (Client ID) and App Secret',
        ],
      },
      {
        step: 3,
        title: 'Configure Callback URL',
        description: 'Set up OAuth callback for AutoSocial',
        details: [
          'In your app settings, find "OAuth Redirect URIs"',
          'Add: YOUR_APP_URL/api/auth/instagram/callback',
          'Save changes',
        ],
      },
      {
        step: 4,
        title: 'Save Credentials',
        description: 'Add credentials to AutoSocial',
        details: [
          'Go back to AutoSocial Connect page',
          'Click "Add Instagram Credentials"',
          'Paste your App ID and App Secret',
          'Click "Save Credentials"',
        ],
      },
      {
        step: 5,
        title: 'Connect Account',
        description: 'Authorize your Instagram Business Account',
        details: [
          'Click "Connect Instagram" button',
          'Log in with your Facebook Business account',
          'Authorize AutoSocial to access your account',
          'You\'re connected! Start scheduling posts',
        ],
      },
    ],
    tips: [
      '💡 Your app needs to be in "Live" mode to work with real accounts',
      '💡 Make sure your Instagram account is a Business Account, not Personal',
      '💡 Tokens auto-refresh for 60 days. No manual refresh needed!',
      '💡 You can connect multiple Instagram accounts (one app per account)',
      '💡 Use Meta Business Suite to manage multiple properties',
    ],
    docs: 'https://developers.facebook.com/docs/instagram-graph-api',
    apiDocs: 'https://developers.facebook.com/docs/instagram-api/reference',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    status: 'OAuth 2.0',
    difficulty: 'Medium',
    setupTime: '10 min',
    description: 'Connect your LinkedIn account to share posts, articles, and manage your professional network.',
    features: [
      'Share text posts and articles',
      'Reach your professional network',
      'Post on company pages',
      'Analytics & engagement tracking',
      'Scheduled publishing',
      'Multi-account support',
    ],
    requirements: [
      'LinkedIn Account (Personal or Company Page)',
      'LinkedIn Developer App created',
      'Sign In with LinkedIn permission',
      'Share on LinkedIn permission',
    ],
    limitations: [
      'Cannot schedule Stories',
      'Token expires periodically',
      'Analytics delayed by ~24 hours',
      'API rate: 300 requests/10 minutes',
    ],
    setup: [
      {
        step: 1,
        title: 'Create LinkedIn App',
        description: 'Register your app on LinkedIn Developer Portal',
        details: [
          'Go to https://www.linkedin.com/developers/apps',
          'Click "Create App"',
          'Fill in: App name, LinkedIn Page (create if needed), Logo',
          'Review and create',
        ],
      },
      {
        step: 2,
        title: 'Configure Permissions',
        description: 'Request necessary scopes for posting',
        details: [
          'Go to "Products" tab',
          'Request "Sign In with LinkedIn using OpenID Connect"',
          'Request "Share on LinkedIn"',
          'Wait for LinkedIn to approve (usually instant)',
        ],
      },
      {
        step: 3,
        title: 'Get Credentials',
        description: 'Copy your Client ID and Secret',
        details: [
          'Go to "Auth" tab',
          'Copy your Client ID',
          'Copy your Client Secret',
          'Set Callback URL: YOUR_APP_URL/api/auth/linkedin/callback',
        ],
      },
      {
        step: 4,
        title: 'Save in AutoSocial',
        description: 'Add credentials to your account',
        details: [
          'Go to AutoSocial Connect page',
          'Click "Add LinkedIn Credentials"',
          'Paste Client ID and Secret',
          'Click "Save Credentials"',
        ],
      },
      {
        step: 5,
        title: 'Connect Account',
        description: 'Authorize LinkedIn access',
        details: [
          'Click "Connect LinkedIn"',
          'Log in with your LinkedIn account',
          'Authorize AutoSocial access',
          'Done! Ready to share',
        ],
      },
    ],
    tips: [
      '💡 LinkedIn works best for B2B content, thought leadership, and company updates',
      '💡 Optimal posting time: 8-10 AM on weekdays',
      '💡 LinkedIn prioritizes original content over shares',
      '💡 Articles perform better than simple text posts',
      '💡 Post frequency: 1-2 times per week for best engagement',
    ],
    docs: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication',
    apiDocs: 'https://learn.microsoft.com/en-us/linkedin/shared/integrations/integrations-overview',
  },
  pinterest: {
    name: 'Pinterest',
    icon: '📌',
    color: '#BD081C',
    status: 'Token-based',
    difficulty: 'Easy',
    setupTime: '5 min',
    description: 'Connect Pinterest to create pins, organize boards, and drive traffic to your website.',
    features: [
      'Create and schedule pins',
      'Manage boards and collections',
      'Pin analytics and reach tracking',
      'Rich pin support',
      'Bulk uploading',
    ],
    requirements: [
      'Pinterest Business Account',
      'Pinterest Developer App',
      'API access approved',
    ],
    limitations: [
      'Free tier: 100 requests/month',
      'Business tier: Higher rate limits',
      'No story/reels support',
    ],
    setup: [
      {
        step: 1,
        title: 'Go to Pinterest Developers',
        description: 'Access the Pinterest Developer portal',
        details: [
          'Visit https://developers.pinterest.com/apps/',
          'Sign in with your Pinterest Business account',
        ],
      },
      {
        step: 2,
        title: 'Create Application',
        description: 'Register a new app',
        details: [
          'Click "Create app"',
          'Name: "AutoSocial"',
          'Accept terms',
        ],
      },
      {
        step: 3,
        title: 'Generate Access Token',
        description: 'Get your API access token',
        details: [
          'In app settings, find "Access tokens"',
          'Click "Generate" for a new token',
          'Copy the token (starts with "pinterestapproxxx")',
        ],
      },
      {
        step: 4,
        title: 'Add to AutoSocial',
        description: 'Save token in your account',
        details: [
          'Go to AutoSocial Connect',
          'Click "Add Pinterest Credentials"',
          'Paste your access token',
          'Click "Save"',
        ],
      },
    ],
    tips: [
      '💡 Pinterest is great for DIY, fashion, home decor, and recipes',
      '💡 Optimal pin size: 1000x1500 pixels',
      '💡 Post 3-5 times daily for best reach',
      '💡 Rich pins with descriptions get 40% more clicks',
      '💡 Pinterest traffic is highly valuable for e-commerce',
    ],
    docs: 'https://developers.pinterest.com/docs/',
    apiDocs: 'https://developers.pinterest.com/docs/api/overview/',
  },
  twitter: {
    name: 'Twitter / X',
    icon: '𝕏',
    color: '#000000',
    status: 'OAuth 2.0',
    difficulty: 'Medium',
    setupTime: '10 min',
    description: 'Connect your X (Twitter) account to tweet, retweet, and engage with your audience in real-time.',
    features: [
      'Schedule tweets and threads',
      'Real-time engagement metrics',
      'Retweet and quote tweet',
      'Hashtag and mention tracking',
      'Trend monitoring',
      'Multi-account support',
    ],
    requirements: [
      'X/Twitter Account',
      'Developer account approved',
      'Elevated API access',
    ],
    limitations: [
      'Free tier: 1,500 tweets/month',
      'API v2 required',
      'Rate limits: 300 requests/15 min',
    ],
    setup: [
      {
        step: 1,
        title: 'Sign up for Developer Access',
        description: 'Apply for X Developer access',
        details: [
          'Go to https://developer.twitter.com/',
          'Sign in or create account',
          'Apply for developer access',
          'Wait for approval (usually instant)',
        ],
      },
      {
        step: 2,
        title: 'Create App',
        description: 'Create your integration app',
        details: [
          'Go to Developer Portal Dashboard',
          'Click "Create App"',
          'Name: "AutoSocial"',
          'Choose "Automation"',
        ],
      },
      {
        step: 3,
        title: 'Configure OAuth',
        description: 'Set up OAuth 2.0',
        details: [
          'Go to app settings',
          'Enable "User Context OAuth"',
          'Add Callback URL: YOUR_APP_URL/api/auth/twitter/callback',
          'Save',
        ],
      },
      {
        step: 4,
        title: 'Get Credentials',
        description: 'Copy your API keys',
        details: [
          'Go to "Keys & Tokens"',
          'Copy API Key (Client ID)',
          'Copy API Secret Key (Client Secret)',
        ],
      },
      {
        step: 5,
        title: 'Connect in AutoSocial',
        description: 'Complete setup',
        details: [
          'Go to Connect page',
          'Click "Add Twitter Credentials"',
          'Paste API Key and Secret',
          'Click "Connect X"',
          'Authorize in X',
        ],
      },
    ],
    tips: [
      '💡 X is best for news, real-time updates, and engagement',
      '💡 Optimal posting times: 9 AM and 5 PM weekdays',
      '💡 Threads get 3x more engagement than single tweets',
      '💡 Use hashtags strategically (2-3 per tweet)',
      '💡 Retweet valuable content to build authority',
    ],
    docs: 'https://developer.twitter.com/en/docs',
    apiDocs: 'https://developer.twitter.com/en/docs/twitter-api',
  },
  dribbble: {
    name: 'Dribbble',
    icon: '🏀',
    color: '#EA4C89',
    status: 'OAuth 2.0',
    difficulty: 'Easy',
    setupTime: '5 min',
    description: 'Share your design work on Dribbble to showcase portfolio, get feedback, and find design jobs.',
    features: [
      'Upload design shots',
      'Manage projects',
      'Track followers and likes',
      'Dribbble Pro analytics',
      'Showcase work globally',
    ],
    requirements: [
      'Dribbble Account (Pro recommended)',
      'Dribbble App registered',
    ],
    limitations: [
      'Free accounts: 1 shot per week',
      'Pro accounts: Unlimited shots',
      'Analytics only available to Pro',
    ],
    setup: [
      {
        step: 1,
        title: 'Open Dribbble Developer Settings',
        description: 'Access app management',
        details: [
          'Go to https://dribbble.com/account/applications',
          'Sign in with your Dribbble account',
        ],
      },
      {
        step: 2,
        title: 'Register New Application',
        description: 'Create your app',
        details: [
          'Click "Register a new application"',
          'App name: "AutoSocial"',
          'Description: Social media scheduler',
        ],
      },
      {
        step: 3,
        title: 'Set Callback URL',
        description: 'Configure OAuth redirect',
        details: [
          'Callback URL: YOUR_APP_URL/api/auth/dribbble/callback',
          'Accept terms',
          'Create application',
        ],
      },
      {
        step: 4,
        title: 'Copy Credentials',
        description: 'Get your app credentials',
        details: [
          'Copy Client ID',
          'Copy Client Secret',
          'Save securely',
        ],
      },
      {
        step: 5,
        title: 'Add to AutoSocial',
        description: 'Complete setup',
        details: [
          'Go to Connect page',
          'Click "Add Dribbble Credentials"',
          'Paste Client ID and Secret',
          'Click "Connect Dribbble"',
        ],
      },
    ],
    tips: [
      '💡 Dribbble is design-focused: best for portfolio and freelance work',
      '💡 Optimal shot size: 400x300px or 800x600px',
      '💡 Use clear, compelling titles and descriptions',
      '💡 Tag your work appropriately for discoverability',
      '💡 Pro membership gives unlimited uploads and better analytics',
    ],
    docs: 'https://developer.dribbble.com/',
    apiDocs: 'https://developer.dribbble.com/v2/',
  },
  gmb: {
    name: 'Google My Business',
    icon: '📍',
    color: '#4285F4',
    status: 'OAuth 2.0',
    difficulty: 'Advanced',
    setupTime: '15-20 min',
    description: 'Manage your Google Business Profile to post updates, respond to reviews, and track performance.',
    features: [
      'Post business updates',
      'Manage customer reviews',
      'View location insights',
      'Photo management',
      'Q&A management',
      'Multi-location support',
    ],
    requirements: [
      'Google Business Profile (verified)',
      'Google Cloud project',
      'Business Profile API enabled',
      'OAuth credentials configured',
    ],
    limitations: [
      'Requires verified business location',
      'API access must be approved',
      'Rate limits apply',
    ],
    setup: [
      {
        step: 1,
        title: 'Create Google Cloud Project',
        description: 'Set up your Google Cloud environment',
        details: [
          'Go to https://console.cloud.google.com',
          'Create a new project (or use existing)',
          'Name: "AutoSocial GMB"',
        ],
      },
      {
        step: 2,
        title: 'Enable Business Profile API',
        description: 'Enable the API for your project',
        details: [
          'Go to "APIs & Services" → "Library"',
          'Search for "Business Profile"',
          'Click "Google Business Profile API"',
          'Click "Enable"',
        ],
      },
      {
        step: 3,
        title: 'Create OAuth Credentials',
        description: 'Generate OAuth 2.0 credentials',
        details: [
          'Go to "APIs & Services" → "Credentials"',
          'Click "Create Credentials" → "OAuth Client ID"',
          'Choose "Web application"',
          'Set Callback URL: YOUR_APP_URL/api/auth/google/callback',
        ],
      },
      {
        step: 4,
        title: 'Get Client ID & Secret',
        description: 'Copy your credentials',
        details: [
          'Copy your Client ID',
          'Copy your Client Secret',
          'Save securely',
        ],
      },
      {
        step: 5,
        title: 'Add to AutoSocial',
        description: 'Complete the setup',
        details: [
          'Go to Connect page',
          'Click "Add Google My Business Credentials"',
          'Paste Client ID and Secret',
          'Click "Connect GMB"',
          'Authorize with your Google account',
        ],
      },
    ],
    tips: [
      '💡 Your business must be verified on Google My Business',
      '💡 Keep your hours, address, and phone number up-to-date',
      '💡 Respond to reviews within 48 hours for best engagement',
      '💡 Post updates regularly (2-3 times per week)',
      '💡 High-quality photos increase click-through rates by 60%',
    ],
    docs: 'https://developers.google.com/my-business',
    apiDocs: 'https://developers.google.com/my-business/reference/rest',
  },
};

interface PostAnalytics {
  id: string;
  title: string;
  caption: string;
  image?: string;
  publishedAt: string;
  metrics: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves?: number;
    engagement_rate: number;
  };
}

interface PlatformStats {
  isConnected: boolean;
  posts: PostAnalytics[];
  stats: {
    totalPosts: number;
    totalImpressions: number;
    totalReach: number;
    totalLikes: number;
    avgEngagementRate: number;
  };
}

type Tab = 'analytics' | 'guide';

export default function PlatformDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const platform = params.platform as string;
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [tab, setTab] = useState<Tab>('guide');

  const details = PLATFORM_DETAILS[platform as keyof typeof PLATFORM_DETAILS];

  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const res = await apiGet(`/api/connect/${platform}/posts`);
        const data = await res.json();
        setPlatformStats(data);
        if (data.isConnected) setTab('analytics');
      } catch {
        // Platform not connected or no stats available
        setPlatformStats({ isConnected: false, posts: [], stats: { totalPosts: 0, totalImpressions: 0, totalReach: 0, totalLikes: 0, avgEngagementRate: 0 } });
      } finally {
        setLoadingStats(false);
      }
    };

    if (platform) {
      fetchPlatformStats();
    }
  }, [platform]);

  if (!details) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-[#f1f5f9] mb-4">Platform not found</h1>
        <Link href="/connect" className="text-[#6366f1] hover:underline">
          ← Back to Connect
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ══════ HEADER ══════ */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
            style={{ backgroundColor: `${details.color}15` }}
          >
            {details.icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#f1f5f9]">{details.name}</h1>
            <p className="text-[#94a3b8] mt-1">{details.description}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${details.color}20`, color: details.color }}
              >
                {details.status}
              </span>
              <span className="text-xs text-[#64748b]">⏱ {details.setupTime}</span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  details.difficulty === 'Easy'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : details.difficulty === 'Medium'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-red-500/10 text-red-400'
                }`}
              >
                {details.difficulty}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-[#1a1b2e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg hover:bg-[#2a2b3e] transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* ══════ TAB BAR ══════ */}
      <div className="flex gap-1 bg-[#12131e] rounded-lg p-1 border border-[#2a2b3e] w-fit">
        <button
          onClick={() => setTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'analytics'
              ? 'bg-[#6366f1] text-white'
              : 'text-[#94a3b8] hover:text-[#f1f5f9]'
          }`}
        >
          <span>📊</span> Overview & Analytics
        </button>
        <button
          onClick={() => setTab('guide')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'guide'
              ? 'bg-[#6366f1] text-white'
              : 'text-[#94a3b8] hover:text-[#f1f5f9]'
          }`}
        >
          <span>🚀</span> Setup Guide
        </button>
      </div>

      {/* ══════ TAB: ANALYTICS ══════ */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Loading skeleton */}
          {loadingStats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-[#1a1b2e] rounded-lg border border-[#2a2b3e] p-3 h-16 animate-pulse" />
              ))}
            </div>
          )}

          {/* Connected state: show stats & posts */}
          {!loadingStats && platformStats?.isConnected && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatCard label="Posts" value={platformStats.stats.totalPosts.toString()} />
                <StatCard label="Impressions" value={fmt(platformStats.stats.totalImpressions)} />
                <StatCard label="Reach" value={fmt(platformStats.stats.totalReach)} />
                <StatCard label="Likes" value={fmt(platformStats.stats.totalLikes)} />
                <StatCard label="Avg ER" value={`${platformStats.stats.avgEngagementRate.toFixed(1)}%`} highlight />
              </div>

              {platformStats.posts.length > 0 ? (
                <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
                  <h3 className="text-lg font-bold text-[#f1f5f9] mb-4">Recent Posts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platformStats.posts.slice(0, 6).map(post => (
                      <PostCard key={post.id} post={post} platform={details.name} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-8 text-center">
                  <p className="text-[#94a3b8]">No posts yet. Start publishing to see analytics!</p>
                  <Link href="/brain" className="inline-block mt-3 px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm rounded-lg transition-colors">
                    Create Your First Post →
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Not connected: show CTA */}
          {!loadingStats && !platformStats?.isConnected && (
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto"
                style={{ backgroundColor: `${details.color}15` }}>
                {details.icon}
              </div>
              <h3 className="text-xl font-bold text-[#f1f5f9]">Connect {details.name} to see your analytics</h3>
              <p className="text-[#94a3b8] text-sm max-w-sm mx-auto">
                Once connected, your posts, impressions, reach, likes, and engagement rate will appear here.
              </p>
              <Link
                href="/connect"
                className="inline-block px-6 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium rounded-lg transition-colors"
              >
                Go to Connect →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ══════ TAB: GUIDE ══════ */}
      {tab === 'guide' && (
        <div className="space-y-6">
          {/* Connected confirmation banner */}
          {platformStats?.isConnected && (
            <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-4 flex items-center justify-between gap-4">
              <p className="text-[#22c55e] text-sm">
                ✅ <strong>{details.name}</strong> is connected. Switch to the Analytics tab to view your data.
              </p>
              <button
                onClick={() => setTab('analytics')}
                className="px-4 py-2 bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-[#22c55e] text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                View Analytics →
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Features */}
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
              <h2 className="text-xl font-bold text-[#f1f5f9] mb-4">✨ Features</h2>
              <ul className="space-y-2">
                {details.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#f1f5f9]">
                    <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Setup Steps */}
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
              <h2 className="text-xl font-bold text-[#f1f5f9] mb-6">🚀 Setup Guide</h2>
              <div className="space-y-6">
                {details.setup.map((section) => (
                  <div key={section.step} className="border-l-2 border-[#6366f1] pl-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-full bg-[#6366f1] text-white text-sm font-bold flex items-center justify-center">
                        {section.step}
                      </span>
                      <h3 className="text-lg font-semibold text-[#f1f5f9]">{section.title}</h3>
                    </div>
                    <p className="text-[#94a3b8] text-sm mb-3">{section.description}</p>
                    <ul className="space-y-2 bg-[#12131e] rounded-lg p-3">
                      {section.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#f1f5f9]">
                          <span className="text-[#6366f1] mt-0.5">→</span>
                          {detail.includes('http') ? (
                            <a href={detail} target="_blank" rel="noopener noreferrer" className="text-[#6366f1] hover:underline">
                              {detail}
                            </a>
                          ) : (
                            detail
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
              <h2 className="text-lg font-bold text-amber-300 mb-4">💡 Pro Tips</h2>
              <ul className="space-y-3">
                {details.tips.map((tip, i) => (
                  <li key={i} className="text-amber-200 text-sm">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Requirements */}
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
              <h3 className="text-lg font-bold text-[#f1f5f9] mb-4">📋 Requirements</h3>
              <ul className="space-y-2">
                {details.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#94a3b8]">
                    <span className="text-[#6366f1] mt-1">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Limitations */}
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
              <h3 className="text-lg font-bold text-[#f1f5f9] mb-4">⚠️ Limitations</h3>
              <ul className="space-y-2">
                {details.limitations.map((limit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#94a3b8]">
                    <span className="text-amber-400">•</span>
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Documentation */}
            <div className="space-y-2">
              <a
                href={details.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg font-medium text-sm transition-colors text-center block"
              >
                📚 Read Official Docs
              </a>
              <a
                href={details.apiDocs}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 bg-[#1a1b2e] hover:bg-[#2a2b3e] text-[#f1f5f9] border border-[#2a2b3e] rounded-lg font-medium text-sm transition-colors text-center block"
              >
                🔗 API Reference
              </a>
              <Link
                href="/connect"
                className="w-full px-4 py-3 bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-[#22c55e] border border-[#22c55e]/30 rounded-lg font-medium text-sm transition-colors text-center block"
              >
                → Go to Connect
              </Link>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#1a1b2e] rounded-lg border border-[#2a2b3e] p-3 text-center">
      <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold mt-1.5 ${highlight ? 'text-emerald-400' : 'text-[#f1f5f9]'}`}>{value}</p>
    </div>
  );
}

function PostCard({ post, platform }: { post: PostAnalytics; platform: string }) {
  return (
    <div className="bg-[#12131e] rounded-lg border border-[#2a2b3e] overflow-hidden hover:border-[#6366f1]/50 transition-colors">
      {/* Image */}
      {post.image && (
        <div className="w-full h-32 bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/10 relative overflow-hidden">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Date */}
        <div>
          <p className="text-[#f1f5f9] font-semibold text-sm line-clamp-2">{post.title}</p>
          <p className="text-[#64748b] text-xs mt-1">{new Date(post.publishedAt).toLocaleDateString()}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2a2b3e]">
          <MetricBadge label="Impressions" value={fmt(post.metrics.impressions)} />
          <MetricBadge label="Reach" value={fmt(post.metrics.reach)} />
          <MetricBadge label="Likes" value={fmt(post.metrics.likes)} highlight />
          <MetricBadge label="ER" value={`${post.metrics.engagement_rate.toFixed(1)}%`} highlight />
        </div>

        {/* Secondary metrics */}
        {(post.metrics.comments > 0 || post.metrics.shares > 0) && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {post.metrics.comments > 0 && <span className="text-[#94a3b8]">💬 {fmt(post.metrics.comments)} comments</span>}
            {post.metrics.shares > 0 && <span className="text-[#94a3b8]">↗️ {fmt(post.metrics.shares)} shares</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBadge({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#1a1b2e] rounded p-2 text-center">
      <p className="text-[10px] text-[#64748b] uppercase">{label}</p>
      <p className={`text-xs font-bold mt-1 ${highlight ? 'text-emerald-400' : 'text-[#f1f5f9]'}`}>{value}</p>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}
