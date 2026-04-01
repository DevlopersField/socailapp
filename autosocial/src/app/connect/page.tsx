'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

// ─── Platform configs ────────────────────────────────────

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    devUrl: 'https://developers.facebook.com/apps/',
    features: ['Post photos & reels', 'Story publishing', 'Insights & analytics', 'Hashtag research'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    devUrl: 'https://www.linkedin.com/developers/apps',
    features: ['Share posts & articles', 'Company page management', 'Analytics', 'Professional networking'],
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    color: '#BD081C',
    devUrl: 'https://developers.pinterest.com/apps/',
    features: ['Pin creation', 'Board management', 'Analytics & trends', 'Rich pins'],
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    icon: '🏀',
    color: '#EA4C89',
    devUrl: 'https://dribbble.com/account/applications',
    features: ['Upload shots', 'Portfolio analytics', 'Like & follow tracking'],
  },
  {
    id: 'google',
    name: 'Google My Business',
    icon: '📍',
    color: '#4285F4',
    dbPlatform: 'gmb',
    devUrl: 'https://console.cloud.google.com/apis/credentials',
    features: ['Post updates', 'Review management', 'Local SEO insights', 'Photo uploads'],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '🟠',
    color: '#FF4500',
    devUrl: 'https://www.reddit.com/prefs/apps',
    features: ['Post to subreddits', 'Comment tracking', 'Trending monitoring', 'Karma analytics'],
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
  connectedAt: string;
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

// ─── Component ──────────────────────────────────────────

export default function ConnectPage() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [platformInsights, setPlatformInsights] = useState<PlatformInsight[]>([]);
  const [internalStats, setInternalStats] = useState<Record<string, InternalStats>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [manualPlatform, setManualPlatform] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [accountNameInput, setAccountNameInput] = useState('');
  const [savingToken, setSavingToken] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check for OAuth redirect results
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      const name = PLATFORMS.find(p => p.id === connected)?.name || connected;
      showToast('success', `${name} connected successfully!`);
      window.history.replaceState({}, '', '/connect');
    }
    if (error) {
      const messages: Record<string, string> = {
        access_denied: 'You cancelled the connection.',
        missing_code: 'Authorization failed. Please try again.',
        invalid_state: 'Security check failed. Please try again.',
        token_exchange_failed: 'Could not get access token. Check app configuration.',
        save_failed: 'Connected but failed to save. Please try again.',
        not_configured: 'This platform is not configured yet.',
        callback_failed: 'Something went wrong. Please try again.',
      };
      showToast('error', messages[error] || `Connection error: ${error}`);
      window.history.replaceState({}, '', '/connect');
    }
  }, [searchParams]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await apiGet('/api/connect/insights');
      const data = await res.json();
      setConnections(data.connections || []);
      setPlatformInsights(data.platformInsights || []);
      setInternalStats(data.internalStats || {});
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Try OAuth first — if not configured, fall back to manual token entry
  const connectPlatform = async (platformId: string) => {
    setConnectingPlatform(platformId);
    try {
      const res = await apiPost(`/api/auth/${platformId}`, {});
      const data = await res.json();

      if (data.url) {
        // OAuth is configured — redirect to platform login
        window.location.href = data.url;
        return;
      }

      // OAuth not configured — show manual token entry
      setConnectingPlatform(null);
      setManualPlatform(platformId);
    } catch {
      // Network error — show manual entry as fallback
      setConnectingPlatform(null);
      setManualPlatform(platformId);
    }
  };

  // Manual token save (fallback when OAuth not configured)
  const saveManualToken = async (platformId: string) => {
    if (!tokenInput.trim()) return;
    setSavingToken(true);
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
      setManualPlatform(null);
      showToast('success', `${PLATFORMS.find(p => p.id === platformId)?.name} connected!`);
      await fetchData();
    } catch {
      showToast('error', 'Failed to save connection. Please try again.');
    } finally {
      setSavingToken(false);
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

  const getConnection = (platformId: string) => {
    const dbPlatform = PLATFORMS.find(p => p.id === platformId)?.dbPlatform || platformId;
    return connections.find(c => c.platform === dbPlatform);
  };
  const getInsight = (platformId: string) => {
    const dbPlatform = PLATFORMS.find(p => p.id === platformId)?.dbPlatform || platformId;
    return platformInsights.find(p => p.platform === dbPlatform);
  };
  const getStats = (platformId: string) => {
    const dbPlatform = PLATFORMS.find(p => p.id === platformId)?.dbPlatform || platformId;
    return internalStats[dbPlatform];
  };

  const connectedCount = connections.filter(c => c.status === 'connected').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-[#f1f5f9]">Connect</h1></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <button onClick={() => setToast(null)} className="ml-3 text-xs opacity-60 hover:opacity-100">x</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Connect</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Connect your social accounts — login with one click or paste a token
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1b2e] border border-[#2a2b3e] rounded-lg">
            <span className={`w-2 h-2 rounded-full ${connectedCount > 0 ? 'bg-[#22c55e]' : 'bg-[#64748b]'}`} />
            <span className="text-sm text-[#f1f5f9]">{connectedCount}/{PLATFORMS.length} connected</span>
          </div>
          {connectedCount > 0 && (
            <button
              onClick={() => { setRefreshing(true); fetchData(); }}
              disabled={refreshing}
              className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {refreshing && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      {connectedCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Connected" value={`${connectedCount}`} sub={`of ${PLATFORMS.length} platforms`} />
          <StatCard label="Posts Tracked" value={fmt(Object.values(internalStats).reduce((s, v) => s + v.posts, 0))} sub="across platforms" />
          <StatCard label="Impressions" value={fmt(Object.values(internalStats).reduce((s, v) => s + v.totalImpressions, 0))} sub="combined" />
          <StatCard
            label="Avg ER"
            value={(() => {
              const stats = Object.values(internalStats);
              const total = stats.reduce((s, v) => s + v.avgER, 0);
              return stats.length ? `${(total / stats.length).toFixed(1)}%` : '0%';
            })()}
            sub="engagement rate"
            highlight
          />
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
          const isConnecting = connectingPlatform === platform.id;
          const isManual = manualPlatform === platform.id;

          return (
            <div
              key={platform.id}
              className={`bg-[#1a1b2e] rounded-xl border transition-all ${
                isConnected ? 'border-[#2a2b3e] hover:border-[#6366f1]/30' : 'border-[#2a2b3e]'
              }`}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${platform.color}15` }}>
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="text-[#f1f5f9] font-semibold text-sm">{platform.name}</h3>
                      {isConnected && conn?.accountName && (
                        <p className="text-[#94a3b8] text-xs">@{conn.accountName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22c55e]' : 'bg-[#64748b]'}`} />
                    <span className={`text-xs ${isConnected ? 'text-[#22c55e]' : 'text-[#64748b]'}`}>
                      {isConnected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                </div>

                {/* ═══ Connected ═══ */}
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
                        <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">Live Account Data</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(insight.insights)
                            .filter(([, v]) => v !== null && typeof v !== 'object')
                            .slice(0, 6)
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="text-[#94a3b8] capitalize">{formatKey(key)}</span>
                                <span className="text-[#f1f5f9] font-medium">{typeof value === 'number' ? fmt(value) : String(value)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {!stats && !insight?.insights && (
                      <p className="text-[#64748b] text-xs">No analytics data yet. Publish posts to see insights.</p>
                    )}

                    {conn?.tokenExpiry && new Date(conn.tokenExpiry) < new Date(Date.now() + 7 * 86400000) && (
                      <div className="flex items-center justify-between p-2 bg-amber-500/5 rounded">
                        <p className="text-amber-400 text-xs">Token expires {new Date(conn.tokenExpiry).toLocaleDateString()}</p>
                        <button onClick={() => connectPlatform(platform.id)} className="text-xs text-[#6366f1] hover:underline">Reconnect</button>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                        className="flex-1 py-2 bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] text-xs rounded-lg hover:bg-[#2a2b3e] transition-colors"
                      >
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </button>
                      <button
                        onClick={() => disconnectPlatform(platform.id)}
                        className="px-3 py-2 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}

                {/* ═══ Manual token entry (fallback) ═══ */}
                {!isConnected && isManual && (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#12131e] rounded-lg border border-[#2a2b3e]">
                      <p className="text-[#94a3b8] text-xs mb-2">Paste an access token from {platform.name}:</p>
                      <a href={platform.devUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6366f1] hover:underline">
                        Open {platform.name} Developer Portal
                      </a>
                    </div>
                    <input
                      type="text"
                      value={accountNameInput}
                      onChange={e => setAccountNameInput(e.target.value)}
                      placeholder="Username / account name (optional)"
                      className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#6366f1] transition-colors placeholder-[#64748b]"
                    />
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={e => setTokenInput(e.target.value)}
                      placeholder="Paste access token..."
                      className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#6366f1] transition-colors placeholder-[#64748b]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveManualToken(platform.id)}
                        disabled={!tokenInput.trim() || savingToken}
                        className="flex-1 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        {savingToken && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Save Token
                      </button>
                      <button
                        onClick={() => { setManualPlatform(null); setTokenInput(''); setAccountNameInput(''); }}
                        className="px-3 py-2 bg-[#12131e] border border-[#2a2b3e] text-[#94a3b8] text-xs rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* ═══ Not connected ═══ */}
                {!isConnected && !isManual && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {platform.features.map(f => (
                        <span key={f} className="text-[10px] px-2 py-0.5 bg-[#12131e] text-[#94a3b8] rounded-md">{f}</span>
                      ))}
                    </div>

                    {/* Primary: OAuth login button */}
                    <button
                      onClick={() => connectPlatform(platform.id)}
                      disabled={isConnecting}
                      className="w-full py-2.5 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: platform.color }}
                    >
                      {isConnecting ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>{platform.icon}</span>
                      )}
                      {isConnecting ? 'Connecting...' : `Connect with ${platform.name}`}
                    </button>

                    {/* Secondary: Manual token option */}
                    <button
                      onClick={() => { setManualPlatform(platform.id); setTokenInput(''); setAccountNameInput(''); }}
                      className="w-full py-1.5 text-[#64748b] text-xs hover:text-[#94a3b8] transition-colors"
                    >
                      or paste access token manually
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isConnected && isExpanded && (
                <div className="border-t border-[#2a2b3e] p-5 space-y-3">
                  <h4 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Full Account Insights</h4>
                  {stats && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Internal Tracking</p>
                      <div className="grid grid-cols-2 gap-2">
                        <DetailRow label="Posts Tracked" value={stats.posts.toString()} />
                        <DetailRow label="Total Impressions" value={fmt(stats.totalImpressions)} />
                        <DetailRow label="Total Reach" value={fmt(stats.totalReach)} />
                        <DetailRow label="Total Likes" value={fmt(stats.totalLikes)} />
                        <DetailRow label="Avg Engagement" value={`${stats.avgER}%`} highlight />
                      </div>
                    </div>
                  )}
                  {insight?.insights && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Live from {platform.name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(insight.insights)
                          .filter(([, v]) => v !== null)
                          .map(([key, value]) => {
                            if (typeof value === 'object' && value !== null) {
                              return Object.entries(value as Record<string, unknown>).map(([sk, sv]) => (
                                <DetailRow key={`${key}-${sk}`} label={formatKey(sk)} value={typeof sv === 'number' ? fmt(sv) : String(sv)} />
                              ));
                            }
                            return <DetailRow key={key} label={formatKey(key)} value={typeof value === 'number' ? fmt(value) : String(value)} />;
                          })}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 pt-2 border-t border-[#2a2b3e]">
                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Connection Info</p>
                    <DetailRow label="Connected" value={conn ? new Date(conn.connectedAt).toLocaleDateString() : '-'} />
                    {conn?.tokenExpiry && <DetailRow label="Token Expires" value={new Date(conn.tokenExpiry).toLocaleDateString()} />}
                    {conn?.accountId && <DetailRow label="Account ID" value={conn.accountId} />}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* How It Works */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
        <h2 className="text-sm font-semibold text-[#f1f5f9] mb-4">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: '🔐', title: 'OAuth Login (recommended)', desc: 'Click connect, login on the platform, authorize — done. Requires OAuth app setup in .env.local once.' },
            { icon: '🔑', title: 'Manual Token (fallback)', desc: 'Click "paste access token manually", get a token from the platform\'s developer portal, paste it in.' },
            { icon: '📊', title: 'Live Insights', desc: 'Once connected, we pull real followers, engagement, and post metrics from the platform API.' },
            { icon: '📅', title: 'Manage Everything', desc: 'Create content, schedule posts, and track performance across all platforms from one dashboard.' },
          ].map(s => (
            <div key={s.title} className="flex gap-3">
              <span className="text-lg shrink-0">{s.icon}</span>
              <div>
                <p className="text-[#f1f5f9] text-sm font-medium">{s.title}</p>
                <p className="text-[#94a3b8] text-xs mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
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
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()).trim();
}
