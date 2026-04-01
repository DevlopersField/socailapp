'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

// ─── Platform configs ────────────────────────────────────

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    authUrl: 'https://developers.facebook.com/apps/',
    guide: 'Create Facebook App → Add Instagram Graph API → Generate long-lived token',
    features: ['Post photos & reels', 'Story publishing', 'Insights & analytics', 'Hashtag research'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    authUrl: 'https://www.linkedin.com/developers/apps',
    guide: 'Create app → Request Marketing APIs → Generate OAuth token',
    features: ['Share posts & articles', 'Company page management', 'Analytics', 'Lead gen forms'],
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    color: '#BD081C',
    authUrl: 'https://developers.pinterest.com/apps/',
    guide: 'Create app → Get sandbox access → Generate access token',
    features: ['Pin creation', 'Board management', 'Analytics & trends', 'Rich pins'],
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    icon: '🏀',
    color: '#EA4C89',
    authUrl: 'https://dribbble.com/account/applications',
    guide: 'Register application → Copy access token',
    features: ['Upload shots', 'Portfolio analytics', 'Like & follow tracking'],
  },
  {
    id: 'gmb',
    name: 'Google My Business',
    icon: '📍',
    color: '#4285F4',
    authUrl: 'https://console.cloud.google.com',
    guide: 'Enable Business Profile API → Create OAuth credentials → Authorize',
    features: ['Post updates', 'Review management', 'Local SEO insights', 'Photo uploads'],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '🟠',
    color: '#FF4500',
    authUrl: 'https://www.reddit.com/prefs/apps',
    guide: 'Create script app → Use client ID and secret for OAuth',
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
  const [connections, setConnections] = useState<Connection[]>([]);
  const [platformInsights, setPlatformInsights] = useState<PlatformInsight[]>([]);
  const [internalStats, setInternalStats] = useState<Record<string, InternalStats>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [accountNameInput, setAccountNameInput] = useState('');
  const [savingConnection, setSavingConnection] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

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

  const connectPlatform = async (platformId: string) => {
    if (!tokenInput.trim()) return;
    setSavingConnection(true);
    try {
      await apiPost('/api/connections', {
        platform: platformId,
        access_token: tokenInput.trim(),
        account_name: accountNameInput.trim() || null,
        status: 'connected',
      });
      setTokenInput('');
      setAccountNameInput('');
      setConnectingPlatform(null);
      await fetchData();
    } catch { /* silent */ } finally {
      setSavingConnection(false);
    }
  };

  const disconnectPlatform = async (platformId: string) => {
    try {
      await apiDelete(`/api/connections?platform=${platformId}`);
      setConnections(prev => prev.filter(c => c.platform !== platformId));
      setPlatformInsights(prev => prev.filter(p => p.platform !== platformId));
    } catch { /* silent */ }
  };

  const refreshInsights = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const getConnection = (platformId: string) => connections.find(c => c.platform === platformId);
  const getInsight = (platformId: string) => platformInsights.find(p => p.platform === platformId);
  const getStats = (platformId: string) => internalStats[platformId];

  const connectedCount = connections.filter(c => c.status === 'connected').length;
  const totalPlatforms = PLATFORMS.length;

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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Connect</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Manage all your social media accounts in one place — like Buffer &amp; Hootsuite
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1b2e] border border-[#2a2b3e] rounded-lg">
            <span className={`w-2 h-2 rounded-full ${connectedCount > 0 ? 'bg-[#22c55e]' : 'bg-[#64748b]'}`} />
            <span className="text-sm text-[#f1f5f9]">{connectedCount}/{totalPlatforms} connected</span>
          </div>
          <button
            onClick={refreshInsights}
            disabled={refreshing}
            className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {refreshing && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Refresh Insights
          </button>
        </div>
      </div>

      {/* Connection Overview Stats */}
      {connectedCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <OverviewCard
            label="Connected"
            value={`${connectedCount}`}
            sub={`of ${totalPlatforms} platforms`}
          />
          <OverviewCard
            label="Total Posts Tracked"
            value={fmt(Object.values(internalStats).reduce((s, v) => s + v.posts, 0))}
            sub="across all platforms"
          />
          <OverviewCard
            label="Total Impressions"
            value={fmt(Object.values(internalStats).reduce((s, v) => s + v.totalImpressions, 0))}
            sub="combined reach"
          />
          <OverviewCard
            label="Avg Engagement"
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
          const isConnecting = connectingPlatform === platform.id;
          const isExpanded = expandedPlatform === platform.id;

          return (
            <div
              key={platform.id}
              className={`bg-[#1a1b2e] rounded-xl border transition-all ${
                isConnected ? 'border-[#2a2b3e] hover:border-[#6366f1]/30' : 'border-[#2a2b3e]'
              }`}
            >
              {/* Platform Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${platform.color}15` }}
                    >
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

                {/* Connected State — Show Insights */}
                {isConnected && (
                  <div className="space-y-3">
                    {/* Quick stats from internal analytics */}
                    {stats && (
                      <div className="grid grid-cols-3 gap-2">
                        <MiniStat label="Posts" value={stats.posts.toString()} />
                        <MiniStat label="Impressions" value={fmt(stats.totalImpressions)} />
                        <MiniStat label="Avg ER" value={`${stats.avgER}%`} highlight />
                      </div>
                    )}

                    {/* Live platform insights */}
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

                    {insight?.error && (
                      <p className="text-amber-400 text-xs p-2 bg-amber-500/5 rounded">
                        API: {insight.error} — stats shown from internal tracking
                      </p>
                    )}

                    {!stats && !insight?.insights && (
                      <p className="text-[#64748b] text-xs">No analytics data yet. Publish posts to see insights here.</p>
                    )}

                    {/* Token expiry warning */}
                    {conn?.tokenExpiry && new Date(conn.tokenExpiry) < new Date(Date.now() + 7 * 86400000) && (
                      <p className="text-amber-400 text-xs flex items-center gap-1">
                        Token expires {new Date(conn.tokenExpiry).toLocaleDateString()} — refresh soon
                      </p>
                    )}

                    {/* Actions */}
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

                {/* Connecting State */}
                {!isConnected && isConnecting && (
                  <div className="space-y-3">
                    <p className="text-[#94a3b8] text-xs">{platform.guide}</p>
                    <a
                      href={platform.authUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#6366f1] hover:underline"
                    >
                      Open Developer Portal →
                    </a>
                    <div>
                      <input
                        type="text"
                        value={accountNameInput}
                        onChange={e => setAccountNameInput(e.target.value)}
                        placeholder="Account name / username (optional)"
                        className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2.5 text-xs mb-2 focus:outline-none focus:border-[#6366f1] transition-colors placeholder-[#64748b]"
                      />
                      <input
                        type="password"
                        value={tokenInput}
                        onChange={e => setTokenInput(e.target.value)}
                        placeholder="Paste access token..."
                        className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#6366f1] transition-colors placeholder-[#64748b]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => connectPlatform(platform.id)}
                        disabled={!tokenInput.trim() || savingConnection}
                        className="flex-1 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        {savingConnection && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Connect
                      </button>
                      <button
                        onClick={() => { setConnectingPlatform(null); setTokenInput(''); setAccountNameInput(''); }}
                        className="px-3 py-2 bg-[#12131e] border border-[#2a2b3e] text-[#94a3b8] text-xs rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Disconnected State */}
                {!isConnected && !isConnecting && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {platform.features.map(f => (
                        <span key={f} className="text-[10px] px-2 py-0.5 bg-[#12131e] text-[#94a3b8] rounded-md">{f}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => { setConnectingPlatform(platform.id); setTokenInput(''); setAccountNameInput(''); }}
                      className="w-full py-2.5 border border-[#2a2b3e] text-[#94a3b8] text-sm rounded-lg hover:border-[#6366f1]/40 hover:text-[#f1f5f9] transition-colors"
                    >
                      Connect {platform.name}
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded Details Panel */}
              {isConnected && isExpanded && (
                <div className="border-t border-[#2a2b3e] p-5 space-y-3">
                  <h4 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Full Account Insights</h4>

                  {/* Internal tracking stats */}
                  {stats && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Internal Tracking</p>
                      <div className="grid grid-cols-2 gap-2">
                        <DetailRow label="Posts Tracked" value={stats.posts.toString()} />
                        <DetailRow label="Total Impressions" value={fmt(stats.totalImpressions)} />
                        <DetailRow label="Total Reach" value={fmt(stats.totalReach)} />
                        <DetailRow label="Total Likes" value={fmt(stats.totalLikes)} />
                        <DetailRow label="Avg Engagement Rate" value={`${stats.avgER}%`} highlight />
                      </div>
                    </div>
                  )}

                  {/* Live API insights */}
                  {insight?.insights && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Live from {platform.name} API</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(insight.insights)
                          .filter(([, v]) => v !== null)
                          .map(([key, value]) => {
                            if (typeof value === 'object') {
                              return Object.entries(value as Record<string, unknown>).map(([subKey, subVal]) => (
                                <DetailRow
                                  key={`${key}-${subKey}`}
                                  label={formatKey(subKey)}
                                  value={typeof subVal === 'number' ? fmt(subVal) : String(subVal)}
                                />
                              ));
                            }
                            return (
                              <DetailRow
                                key={key}
                                label={formatKey(key)}
                                value={typeof value === 'number' ? fmt(value) : String(value)}
                              />
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Connection info */}
                  <div className="space-y-2 pt-2 border-t border-[#2a2b3e]">
                    <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Connection</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Connect accounts', desc: 'Paste your platform API token to connect. We store it encrypted per-user.' },
            { step: '2', title: 'View live insights', desc: 'Once connected, we pull real follower counts, engagement rates, and post metrics.' },
            { step: '3', title: 'Manage from one place', desc: 'Create content, schedule posts, and track performance across all platforms.' },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-[#6366f1]/10 text-[#6366f1] text-xs font-bold flex items-center justify-center shrink-0">
                {s.step}
              </span>
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

function OverviewCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
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

// ─── Helpers ─────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}
