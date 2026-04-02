'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { OAuthCredentialsForm } from '@/components/oauth-credentials-form';
import type { Platform } from '@/lib/database.types';

// ─── Platform configs with inline setup guides ──────────

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    dbPlatform: 'instagram',
    features: ['Post photos & reels', 'Insights & analytics', 'Hashtag research'],
    tokenType: 'oauth' as const,
    difficulty: 'Medium',
    time: '5 min',
    steps: [
      { text: 'Go to developers.facebook.com/apps and click "Create App"', link: 'https://developers.facebook.com/apps/' },
      { text: 'Choose "Business" type, name it (e.g. "AutoSocial")' },
      { text: 'In the dashboard, click "Add Product" → find "Instagram Graph API" → Set Up' },
      { text: 'Go to Settings → Basic → copy App ID and App Secret' },
      { text: 'Add redirect URI: http://localhost:3000/api/auth/instagram/callback' },
      { text: 'Go to Graph API Explorer → generate a User Token with instagram_basic permission' },
      { text: 'Copy the token and paste it below' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    dbPlatform: 'linkedin',
    features: ['Share posts & articles', 'Analytics', 'Company pages'],
    tokenType: 'oauth' as const,
    difficulty: 'Medium',
    time: '5 min',
    steps: [
      { text: 'Go to linkedin.com/developers/apps and click "Create App"', link: 'https://www.linkedin.com/developers/apps' },
      { text: 'Fill in app name, LinkedIn page (create one if needed), logo' },
      { text: 'Go to "Auth" tab → copy Client ID and Client Secret' },
      { text: 'Under "OAuth 2.0 settings", add redirect URL: http://localhost:3000/api/auth/linkedin/callback' },
      { text: 'Go to "Products" tab → request "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect"' },
      { text: 'Use the OAuth Playground or generate a token with the Auth tab' },
      { text: 'Copy the access token and paste it below' },
    ],
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    color: '#BD081C',
    dbPlatform: 'pinterest',
    features: ['Pin creation', 'Board management', 'Analytics & trends'],
    tokenType: 'token' as const,
    difficulty: 'Easy',
    time: '2 min',
    steps: [
      { text: 'Go to developers.pinterest.com/apps and click "Create app"', link: 'https://developers.pinterest.com/apps/' },
      { text: 'Name your app (e.g. "AutoSocial"), accept terms' },
      { text: 'Once created, go to the app settings' },
      { text: 'Under "Access tokens", click "Generate" to create a token' },
      { text: 'Copy the token and paste it below' },
    ],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '🟠',
    color: '#FF4500',
    dbPlatform: 'reddit',
    features: ['Post to subreddits', 'Trending monitoring', 'Karma tracking'],
    tokenType: 'token' as const,
    difficulty: 'Easy',
    time: '2 min',
    steps: [
      { text: 'Go to reddit.com/prefs/apps and scroll to bottom', link: 'https://www.reddit.com/prefs/apps' },
      { text: 'Click "create another app..." button' },
      { text: 'Choose "script" type, name it "AutoSocial"' },
      { text: 'Set redirect URI to: http://localhost:3000/api/auth/reddit/callback' },
      { text: 'Click "create app" — copy the ID (under app name) and secret' },
      { text: 'Your Client ID is the string under your app name. Paste it below.' },
    ],
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    icon: '🏀',
    color: '#EA4C89',
    dbPlatform: 'dribbble',
    features: ['Upload shots', 'Portfolio analytics', 'Follow tracking'],
    tokenType: 'token' as const,
    difficulty: 'Easy',
    time: '2 min',
    steps: [
      { text: 'Go to dribbble.com/account/applications', link: 'https://dribbble.com/account/applications' },
      { text: 'Click "Register a New Application"' },
      { text: 'Fill in name "AutoSocial" and callback URL: http://localhost:3000/api/auth/dribbble/callback' },
      { text: 'After creation, you\'ll see your Client ID and Client Secret' },
      { text: 'Copy the access token and paste it below' },
    ],
  },
  {
    id: 'google',
    name: 'Google My Business',
    icon: '📍',
    color: '#4285F4',
    dbPlatform: 'gmb',
    features: ['Post updates', 'Review management', 'Local SEO insights'],
    tokenType: 'oauth' as const,
    difficulty: 'Medium',
    time: '5 min',
    steps: [
      { text: 'Go to console.cloud.google.com and create a new project', link: 'https://console.cloud.google.com' },
      { text: 'Enable "Business Profile API" from the API Library' },
      { text: 'Go to "Credentials" → "Create Credentials" → "OAuth Client ID"' },
      { text: 'Choose "Web application", name it "AutoSocial"' },
      { text: 'Add redirect URI: http://localhost:3000/api/auth/google/callback' },
      { text: 'Copy Client ID and Client Secret' },
      { text: 'Use OAuth Playground to generate an access token, paste it below' },
    ],
  },
];

interface Connection {
  platform: string;
  accountName: string | null;
  accountId: string | null;
  status: string;
  connectedAt: string;
  tokenExpiry: string | null;
}

interface PlatformInsight {
  platform: string;
  accountName: string | null;
  status: string;
  insights: Record<string, unknown> | null;
  error: string | null;
}

interface InternalStats {
  posts: number;
  totalImpressions: number;
  totalReach: number;
  totalLikes: number;
  avgER: number;
}

interface OAuthCreds {
  platform: Platform;
  saved: boolean;
}

// ─── Component ──────────────────────────────────────────

export default function ConnectPage() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [platformInsights, setPlatformInsights] = useState<PlatformInsight[]>([]);
  const [internalStats, setInternalStats] = useState<Record<string, InternalStats>>({});
  const [oauthCreds, setOAuthCreds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [setupPlatform, setSetupPlatform] = useState<string | null>(null);
  const [credentialsPlatform, setCredentialsPlatform] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState(0);
  const [tokenInput, setTokenInput] = useState('');
  const [accountNameInput, setAccountNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check OAuth redirect results
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) {
      showToast('success', `${PLATFORMS.find(p => p.id === connected)?.name || connected} connected!`);
      window.history.replaceState({}, '', '/connect');
    }
    if (error) {
      showToast('error', error === 'access_denied' ? 'Connection cancelled.' : 'Connection failed. Try the manual setup below.');
      window.history.replaceState({}, '', '/connect');
    }
  }, [searchParams]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await apiGet('/api/connect/insights');
      const data = await res.json();
      setConnections(data.connections || []);
      setPlatformInsights(data.platformInsights || []);
      setInternalStats(data.internalStats || {});

      // Fetch OAuth credentials status
      const credsRes = await apiGet('/api/oauth-credentials');
      const credsData = await credsRes.json();
      const savedCreds: Record<string, boolean> = {};
      (credsData.credentials || []).forEach((cred: { platform: string }) => {
        savedCreds[cred.platform] = true;
      });
      setOAuthCreds(savedCreds);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startSetup = (platformId: string) => {
    setSetupPlatform(platformId);
    setSetupStep(0);
    setTokenInput('');
    setAccountNameInput('');
  };

  const saveConnection = async (platformId: string) => {
    if (!tokenInput.trim()) return;
    setSaving(true);
    const dbPlatform = PLATFORMS.find(p => p.id === platformId)?.dbPlatform || platformId;
    try {
      await apiPost('/api/connections', {
        platform: dbPlatform,
        access_token: tokenInput.trim(),
        account_name: accountNameInput.trim() || null,
        status: 'connected',
      });
      setTokenInput('');
      setAccountNameInput('');
      setSetupPlatform(null);
      showToast('success', `${PLATFORMS.find(p => p.id === platformId)?.name} connected!`);
      await fetchData();
    } catch {
      showToast('error', 'Failed to save. Check your token and try again.');
    } finally {
      setSaving(false);
    }
  };

  const disconnectPlatform = async (platformId: string) => {
    const dbPlatform = PLATFORMS.find(p => p.id === platformId)?.dbPlatform || platformId;
    try {
      await apiDelete(`/api/connections?platform=${dbPlatform}`);
      setConnections(prev => prev.filter(c => c.platform !== dbPlatform));
      setPlatformInsights(prev => prev.filter(p => p.platform !== dbPlatform));
      showToast('success', 'Disconnected');
    } catch { /* silent */ }
  };

  // Check if credentials are saved, show form if not, then proceed with OAuth
  const connectPlatform = async (platformId: string) => {
    if (!oauthCreds[platformId]) {
      // Show credentials form
      setCredentialsPlatform(platformId);
      return;
    }

    // Credentials are saved, proceed with OAuth
    try {
      const res = await apiPost(`/api/auth/${platformId}`, {});
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch { /* OAuth not available */ }
    // Fall back to guided manual setup
    startSetup(platformId);
  };

  const getConnection = (id: string) => {
    const db = PLATFORMS.find(p => p.id === id)?.dbPlatform || id;
    return connections.find(c => c.platform === db);
  };
  const getInsight = (id: string) => {
    const db = PLATFORMS.find(p => p.id === id)?.dbPlatform || id;
    return platformInsights.find(p => p.platform === db);
  };
  const getStats = (id: string) => {
    const db = PLATFORMS.find(p => p.id === id)?.dbPlatform || id;
    return internalStats[db];
  };

  const connectedCount = connections.filter(c => c.status === 'connected').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Connect</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-3 opacity-60 hover:opacity-100">x</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Connect</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Follow the guided setup to connect each platform in minutes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1b2e] border border-[#2a2b3e] rounded-lg">
            <span className={`w-2 h-2 rounded-full ${connectedCount > 0 ? 'bg-[#22c55e]' : 'bg-[#64748b]'}`} />
            <span className="text-sm text-[#f1f5f9]">{connectedCount}/{PLATFORMS.length} connected</span>
          </div>
          {connectedCount > 0 && (
            <button onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}
              className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              {refreshing && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {connectedCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Connected" value={`${connectedCount}`} sub={`of ${PLATFORMS.length}`} />
          <StatCard label="Posts" value={fmt(Object.values(internalStats).reduce((s, v) => s + v.posts, 0))} sub="tracked" />
          <StatCard label="Impressions" value={fmt(Object.values(internalStats).reduce((s, v) => s + v.totalImpressions, 0))} sub="combined" />
          <StatCard label="Avg ER" value={`${Object.values(internalStats).length ? (Object.values(internalStats).reduce((s, v) => s + v.avgER, 0) / Object.values(internalStats).length).toFixed(1) : 0}%`} sub="engagement" highlight />
        </div>
      )}

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map(platform => {
          const conn = getConnection(platform.id);
          const insight = getInsight(platform.id);
          const stats = getStats(platform.id);
          const isConnected = conn?.status === 'connected';
          const isExpanded = expandedPlatform === platform.id;
          const isSettingUp = setupPlatform === platform.id;

          return (
            <div key={platform.id} className={`bg-[#1a1b2e] rounded-xl border transition-all overflow-hidden ${
              isConnected ? 'border-[#2a2b3e]' : isSettingUp ? 'border-[#6366f1]/40' : 'border-[#2a2b3e]'
            }`}>
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${platform.color}15` }}>
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="text-[#f1f5f9] font-semibold text-sm">{platform.name}</h3>
                      {isConnected && conn?.accountName ? (
                        <p className="text-[#94a3b8] text-xs">@{conn.accountName}</p>
                      ) : !isConnected && !isSettingUp ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${platform.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {platform.difficulty}
                          </span>
                          <span className="text-[10px] text-[#64748b]">{platform.time} setup</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-[#22c55e]' : 'text-[#64748b]'}`}>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22c55e]' : 'bg-[#64748b]'}`} />
                    {isConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>

                {/* ═══ CONNECTED STATE ═══ */}
                {isConnected && (
                  <div className="space-y-3">
                    {stats && (
                      <div className="grid grid-cols-3 gap-2">
                        <MiniStat label="Posts" value={stats.posts.toString()} />
                        <MiniStat label="Impressions" value={fmt(stats.totalImpressions)} />
                        <MiniStat label="Avg ER" value={`${stats.avgER}%`} highlight />
                      </div>
                    )}
                    {insight?.insights && (
                      <div className="p-3 bg-[#12131e] rounded-lg border border-[#2a2b3e]">
                        <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">Live Data</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(insight.insights).filter(([, v]) => v !== null && typeof v !== 'object').slice(0, 6).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-xs">
                              <span className="text-[#94a3b8] capitalize">{fmtKey(k)}</span>
                              <span className="text-[#f1f5f9] font-medium">{typeof v === 'number' ? fmt(v) : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!stats && !insight?.insights && <p className="text-[#64748b] text-xs">Publish posts to see insights here.</p>}
                    {conn?.tokenExpiry && new Date(conn.tokenExpiry) < new Date(Date.now() + 7 * 86400000) && (
                      <div className="flex items-center justify-between p-2 bg-amber-500/5 rounded">
                        <p className="text-amber-400 text-xs">Token expires {new Date(conn.tokenExpiry).toLocaleDateString()}</p>
                        <button onClick={() => startSetup(platform.id)} className="text-xs text-[#6366f1] hover:underline">Reconnect</button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/connect/${platform.id}`}
                        className="flex-1 py-2 bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] text-xs rounded-lg hover:bg-[#2a2b3e] transition-colors text-center">
                        View Details →
                      </Link>
                      <button onClick={() => disconnectPlatform(platform.id)}
                        className="px-3 py-2 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20 transition-colors">
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}

                {/* ═══ GUIDED SETUP (step-by-step) ═══ */}
                {!isConnected && isSettingUp && (
                  <div className="space-y-3">
                    {/* Progress bar */}
                    <div className="flex items-center gap-1">
                      {platform.steps.map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= setupStep ? 'bg-[#6366f1]' : 'bg-[#2a2b3e]'
                        }`} />
                      ))}
                    </div>

                    <div className="text-xs text-[#64748b]">Step {setupStep + 1} of {platform.steps.length}</div>

                    {/* Current step */}
                    {setupStep < platform.steps.length ? (
                      <div className="p-3 bg-[#12131e] rounded-lg border border-[#6366f1]/20">
                        <p className="text-[#f1f5f9] text-sm leading-relaxed">{platform.steps[setupStep].text}</p>
                        {platform.steps[setupStep].link && (
                          <a href={platform.steps[setupStep].link} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs text-[#6366f1] hover:underline">
                            Open this page
                            <span className="text-[10px]">↗</span>
                          </a>
                        )}
                      </div>
                    ) : null}

                    {/* Last step: paste token */}
                    {setupStep === platform.steps.length - 1 ? (
                      <div className="space-y-2">
                        <input type="text" value={accountNameInput} onChange={e => setAccountNameInput(e.target.value)}
                          placeholder="Username (optional)" className="w-full bg-[#0a0b14] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#6366f1] placeholder-[#64748b]" />
                        <input type="password" value={tokenInput} onChange={e => setTokenInput(e.target.value)}
                          placeholder="Paste your token here..." className="w-full bg-[#0a0b14] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#6366f1] placeholder-[#64748b]" />
                        <button onClick={() => saveConnection(platform.id)} disabled={!tokenInput.trim() || saving}
                          className="w-full py-2.5 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                          style={{ backgroundColor: platform.color }}>
                          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : platform.icon}
                          {saving ? 'Connecting...' : `Connect ${platform.name}`}
                        </button>
                      </div>
                    ) : null}

                    {/* Navigation buttons */}
                    <div className="flex gap-2">
                      {setupStep > 0 && (
                        <button onClick={() => setSetupStep(s => s - 1)}
                          className="px-3 py-2 bg-[#12131e] border border-[#2a2b3e] text-[#94a3b8] text-xs rounded-lg hover:bg-[#2a2b3e]">
                          Back
                        </button>
                      )}
                      {setupStep < platform.steps.length - 1 && (
                        <button onClick={() => setSetupStep(s => s + 1)}
                          className="flex-1 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-medium rounded-lg transition-colors">
                          Done, Next Step
                        </button>
                      )}
                      <button onClick={() => { setSetupPlatform(null); setTokenInput(''); setAccountNameInput(''); }}
                        className="px-3 py-2 text-[#64748b] text-xs hover:text-[#94a3b8]">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* ═══ NOT CONNECTED ═══ */}
                {!isConnected && !isSettingUp && credentialsPlatform !== platform.id && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {platform.features.map(f => (
                        <span key={f} className="text-[10px] px-2 py-0.5 bg-[#12131e] text-[#94a3b8] rounded-md">{f}</span>
                      ))}
                    </div>
                    <Link
                      href={`/connect/${platform.id}`}
                      className="block text-center py-2 px-3 bg-[#12131e] border border-[#2a2b3e] text-[#6366f1] text-xs rounded-lg hover:bg-[#2a2b3e] transition-colors mb-2 font-medium"
                    >
                      View Details →
                    </Link>
                    {!oauthCreds[platform.id] && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-2">
                        <p className="text-xs text-amber-300 mb-2">💡 Add your {platform.name} app credentials first</p>
                        <button onClick={() => setCredentialsPlatform(platform.id)}
                          className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium rounded-lg transition-colors">
                          Add {platform.name} Credentials
                        </button>
                      </div>
                    )}
                    <button onClick={() => connectPlatform(platform.id)}
                      disabled={!oauthCreds[platform.id]}
                      className="w-full py-2.5 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: platform.color }}>
                      <span>{platform.icon}</span>
                      Connect {platform.name}
                    </button>
                  </div>
                )}

                {/* ═══ CREDENTIALS FORM ═══ */}
                {credentialsPlatform === platform.id && !isConnected && !isSettingUp && (
                  <div className="space-y-3 -mx-5 -mb-5 p-5" style={{ backgroundColor: `${platform.color}08` }}>
                    <OAuthCredentialsForm
                      platform={platform.id as Platform}
                      onSuccess={() => {
                        setCredentialsPlatform(null);
                        showToast('success', `${platform.name} credentials saved! Ready to connect.`);
                        fetchData(); // Refresh OAuth creds
                      }}
                      onCancel={() => setCredentialsPlatform(null)}
                    />
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isConnected && isExpanded && (
                <div className="border-t border-[#2a2b3e] p-5 space-y-3">
                  {stats && (
                    <div className="grid grid-cols-2 gap-2">
                      <DetailRow label="Posts" value={stats.posts.toString()} />
                      <DetailRow label="Impressions" value={fmt(stats.totalImpressions)} />
                      <DetailRow label="Reach" value={fmt(stats.totalReach)} />
                      <DetailRow label="Likes" value={fmt(stats.totalLikes)} />
                      <DetailRow label="Avg ER" value={`${stats.avgER}%`} highlight />
                    </div>
                  )}
                  {insight?.insights && (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(insight.insights).filter(([, v]) => v !== null && typeof v !== 'object').map(([k, v]) => (
                        <DetailRow key={k} label={fmtKey(k)} value={typeof v === 'number' ? fmt(v) : String(v)} />
                      ))}
                    </div>
                  )}
                  <DetailRow label="Connected" value={conn ? new Date(conn.connectedAt).toLocaleDateString() : '-'} />
                  {conn?.tokenExpiry && <DetailRow label="Expires" value={new Date(conn.tokenExpiry).toLocaleDateString()} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-4">
      <p className="text-[#94a3b8] text-xs">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? 'text-emerald-400' : 'text-[#f1f5f9]'}`}>{value}</p>
      <p className="text-[10px] text-[#64748b] mt-0.5">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-2 bg-[#12131e] rounded-lg text-center">
      <p className={`text-sm font-bold ${highlight ? 'text-emerald-400' : 'text-[#f1f5f9]'}`}>{value}</p>
      <p className="text-[10px] text-[#64748b]">{label}</p>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-xs p-2 bg-[#12131e] rounded">
      <span className="text-[#94a3b8]">{label}</span>
      <span className={`font-medium ${highlight ? 'text-emerald-400' : 'text-[#f1f5f9]'}`}>{value}</span>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function fmtKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()).trim();
}
