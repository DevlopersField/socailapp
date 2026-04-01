'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { PLATFORMS } from '@/lib/platforms';
import type { Platform } from '@/lib/types';

// ─── Types ──────────────────────────────────────────────

type Tab = 'performance' | 'trends' | 'strategy';
type TimeRange = '7d' | '30d' | '90d';
type TrendSource = 'all' | 'pinterest' | 'instagram' | 'reddit';

interface InsightsData {
  summary: {
    totalPosts: number;
    totalImpressions: number;
    totalReach: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    totalClicks: number;
    avgEngagementRate: number;
  };
  platformBreakdown: { platform: string; posts: number; impressions: number; reach: number; likes: number; avgEngagementRate: number }[];
  contentTypeBreakdown: { type: string; posts: number; avgEngagementRate: number }[];
  topPosts: { id: string; postId: string; platform: string; contentType: string; publishedAt: string; metrics: Record<string, number>; hashtags: string[] }[];
  worstPosts: { id: string; platform: string; contentType: string; metrics: Record<string, number> }[];
  topHashtags: { tag: string; count: number; avgER: number }[];
  bestHours: { hour: number; posts: number; avgER: number }[];
  bestDays: { day: string; posts: number; avgER: number }[];
}

interface TrendItem {
  id: string;
  source: 'pinterest' | 'instagram' | 'reddit';
  keyword: string;
  volume: number | null;
  trend_score: number;
  category: string | null;
  url: string | null;
}

interface Strategy {
  overview: string;
  weeklyPlan: { day: string; platform: string; contentType: string; topic: string; caption: string; bestTime: string; hashtags: string[] }[];
  platformStrategies: Record<string, { focus: string; frequency: string; contentMix: string; tip: string }>;
  trendOpportunities: { trend: string; angle: string; platform: string; urgency: string }[];
  improvements: { area: string; action: string; expectedImpact: string }[];
}

// ─── Source config ──────────────────────────────────────

const SOURCE_CONFIG = {
  pinterest: { name: 'Pinterest', icon: '📌', color: '#BD081C', bg: 'bg-red-500/10' },
  instagram: { name: 'Instagram', icon: '📸', color: '#E4405F', bg: 'bg-pink-500/10' },
  reddit: { name: 'Reddit', icon: '🟠', color: '#FF4500', bg: 'bg-orange-500/10' },
} as const;

const GOAL_OPTIONS = [
  { value: 'growth', label: 'Follower Growth', icon: '📈' },
  { value: 'engagement', label: 'More Engagement', icon: '💬' },
  { value: 'brand-awareness', label: 'Brand Awareness', icon: '🎯' },
  { value: 'traffic', label: 'Drive Traffic', icon: '🔗' },
  { value: 'leads', label: 'Generate Leads', icon: '🧲' },
];

// ─── Component ──────────────────────────────────────────

export default function InsightsPage() {
  const [tab, setTab] = useState<Tab>('performance');
  const [range, setRange] = useState<TimeRange>('30d');
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [trendFilter, setTrendFilter] = useState<TrendSource>('all');
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [strategyGoal, setStrategyGoal] = useState('growth');
  const [strategyContext, setStrategyContext] = useState('');
  const [strategyPlatforms, setStrategyPlatforms] = useState<string[]>(['instagram', 'pinterest', 'reddit']);
  const [loading, setLoading] = useState({ insights: true, trends: true, strategy: false });
  const [trendLastUpdated, setTrendLastUpdated] = useState<string | null>(null);
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);

  // Fetch insights
  const fetchInsights = useCallback(async () => {
    setLoading(p => ({ ...p, insights: true }));
    try {
      const res = await apiGet(`/api/insights?range=${range}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInsights(data);
    } catch { /* silent */ } finally {
      setLoading(p => ({ ...p, insights: false }));
    }
  }, [range]);

  // Fetch trends
  const fetchTrends = useCallback(async (refresh = false) => {
    setLoading(p => ({ ...p, trends: true }));
    try {
      const res = refresh
        ? await apiPost('/api/trends', {})
        : await apiGet('/api/trends');
      const data = await res.json();
      setTrends(data.trends || []);
      setTrendLastUpdated(data.lastUpdated);
      if (!refresh && (!data.trends || data.trends.length === 0)) {
        const refreshRes = await apiPost('/api/trends', {});
        const refreshData = await refreshRes.json();
        setTrends(refreshData.trends || []);
        setTrendLastUpdated(refreshData.lastUpdated);
      }
    } catch { /* silent */ } finally {
      setLoading(p => ({ ...p, trends: false }));
    }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);
  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  // Generate strategy
  const generateStrategy = async () => {
    setLoading(p => ({ ...p, strategy: true }));
    setStrategy(null);
    try {
      const res = await apiPost('/api/strategy', {
        goal: strategyGoal,
        platforms: strategyPlatforms,
        context: strategyContext,
        analyticsData: insights ? {
          summary: insights.summary,
          topPlatform: insights.platformBreakdown[0]?.platform,
          bestContentType: insights.contentTypeBreakdown[0]?.type,
          bestHour: insights.bestHours[0]?.hour,
          bestDay: insights.bestDays[0]?.day,
        } : null,
        trendsData: trends.slice(0, 15),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStrategy(data.strategy);
    } catch { /* silent */ } finally {
      setLoading(p => ({ ...p, strategy: false }));
    }
  };

  const filteredTrends = trendFilter === 'all' ? trends : trends.filter(t => t.source === trendFilter);
  const trendCounts = {
    all: trends.length,
    pinterest: trends.filter(t => t.source === 'pinterest').length,
    instagram: trends.filter(t => t.source === 'instagram').length,
    reddit: trends.filter(t => t.source === 'reddit').length,
  };

  const toggleStrategyPlatform = (p: string) => {
    setStrategyPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Insights & Strategy</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Performance analytics, live trends, and AI-powered strategies</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#12131e] rounded-lg p-1 border border-[#2a2b3e] w-fit">
        {([
          { key: 'performance', label: 'Performance', icon: '▲' },
          { key: 'trends', label: 'Trends', icon: '📈' },
          { key: 'strategy', label: 'Strategy', icon: '🧠' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t.key ? 'bg-[#6366f1] text-white' : 'text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ═══════ PERFORMANCE TAB ═══════ */}
      {tab === 'performance' && (
        <PerformanceTab
          insights={insights}
          loading={loading.insights}
          range={range}
          onRangeChange={setRange}
        />
      )}

      {/* ═══════ TRENDS TAB ═══════ */}
      {tab === 'trends' && (
        <TrendsTab
          trends={filteredTrends}
          trendCounts={trendCounts}
          loading={loading.trends}
          filter={trendFilter}
          onFilterChange={setTrendFilter}
          onRefresh={() => fetchTrends(true)}
          lastUpdated={trendLastUpdated}
          selectedTrend={selectedTrend}
          onSelectTrend={setSelectedTrend}
        />
      )}

      {/* ═══════ STRATEGY TAB ═══════ */}
      {tab === 'strategy' && (
        <StrategyTab
          strategy={strategy}
          loading={loading.strategy}
          goal={strategyGoal}
          onGoalChange={setStrategyGoal}
          platforms={strategyPlatforms}
          onTogglePlatform={toggleStrategyPlatform}
          context={strategyContext}
          onContextChange={setStrategyContext}
          onGenerate={generateStrategy}
        />
      )}
    </div>
  );
}

// ─── Performance Tab ─────────────────────────────────────

function PerformanceTab({ insights, loading, range, onRangeChange }: {
  insights: InsightsData | null;
  loading: boolean;
  range: TimeRange;
  onRangeChange: (r: TimeRange) => void;
}) {
  if (loading) return <SkeletonGrid count={8} />;

  const s = insights?.summary;

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex gap-1 bg-[#12131e] rounded-lg p-1 border border-[#2a2b3e] w-fit">
        {(['7d', '30d', '90d'] as const).map(r => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              range === r ? 'bg-[#6366f1] text-white' : 'text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Impressions" value={fmt(s?.totalImpressions || 0)} />
        <KPI label="Reach" value={fmt(s?.totalReach || 0)} />
        <KPI label="Engagement" value={fmt(s?.totalLikes || 0)} sub="likes" />
        <KPI label="Avg ER" value={`${s?.avgEngagementRate || 0}%`} highlight />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Comments" value={fmt(s?.totalComments || 0)} small />
        <KPI label="Shares" value={fmt(s?.totalShares || 0)} small />
        <KPI label="Saves" value={fmt(s?.totalSaves || 0)} small />
        <KPI label="Clicks" value={fmt(s?.totalClicks || 0)} small />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Breakdown */}
        <Card title="Platform Performance">
          <div className="space-y-4">
            {(insights?.platformBreakdown || []).map(p => {
              const maxER = Math.max(...(insights?.platformBreakdown || []).map(x => x.avgEngagementRate), 1);
              const plat = PLATFORMS[p.platform as Platform];
              return (
                <div key={p.platform} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#f1f5f9] flex items-center gap-2">
                      {plat?.icon} {plat?.name || p.platform}
                      <span className="text-[#64748b] text-xs">({p.posts})</span>
                    </span>
                    <span className="text-[#f1f5f9] font-semibold">{p.avgEngagementRate}% ER</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#12131e] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(p.avgEngagementRate / maxER) * 100}%`,
                        backgroundColor: plat?.color || '#6366f1',
                      }}
                    />
                  </div>
                  <div className="flex gap-4 text-[10px] text-[#64748b]">
                    <span>{fmt(p.impressions)} impr</span>
                    <span>{fmt(p.reach)} reach</span>
                    <span>{fmt(p.likes)} likes</span>
                  </div>
                </div>
              );
            })}
            {(!insights?.platformBreakdown || insights.platformBreakdown.length === 0) && (
              <p className="text-[#64748b] text-sm text-center py-4">No platform data yet</p>
            )}
          </div>
        </Card>

        {/* Content Type */}
        <Card title="Content Type Performance">
          <div className="space-y-4">
            {(insights?.contentTypeBreakdown || []).map(ct => {
              const maxER = Math.max(...(insights?.contentTypeBreakdown || []).map(x => x.avgEngagementRate), 1);
              return (
                <div key={ct.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#f1f5f9] capitalize">{ct.type.replace('-', ' ')} <span className="text-[#64748b] text-xs">({ct.posts})</span></span>
                    <span className="text-[#f1f5f9] font-semibold">{ct.avgEngagementRate}% ER</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#12131e] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#6366f1] transition-all duration-700" style={{ width: `${(ct.avgEngagementRate / maxER) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            {(!insights?.contentTypeBreakdown || insights.contentTypeBreakdown.length === 0) && (
              <p className="text-[#64748b] text-sm text-center py-4">No content data yet</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Posts */}
        <Card title="Top Performing Posts" className="lg:col-span-2">
          <div className="space-y-3">
            {(insights?.topPosts || []).map((post, i) => {
              const plat = PLATFORMS[post.platform as Platform];
              return (
                <div key={post.id} className="flex items-start gap-3 p-3 bg-[#12131e] rounded-lg border border-[#2a2b3e]">
                  <span className="text-lg font-bold text-[#6366f1] w-6 text-center shrink-0">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span>{plat?.icon}</span>
                      <span className="text-[#f1f5f9] text-sm font-medium">{plat?.name}</span>
                      <span className="text-[#64748b] text-xs capitalize">{post.contentType?.replace('-', ' ')}</span>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs flex-wrap">
                      <span className="text-emerald-400 font-medium">{post.metrics.engagement_rate}% ER</span>
                      <span className="text-[#94a3b8]">{fmt(post.metrics.impressions)} impr</span>
                      <span className="text-[#94a3b8]">{fmt(post.metrics.likes)} likes</span>
                      <span className="text-[#94a3b8]">{fmt(post.metrics.shares)} shares</span>
                    </div>
                    {post.hashtags?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {post.hashtags.slice(0, 4).map(h => (
                          <span key={h} className="text-[10px] px-1.5 py-0.5 bg-[#6366f1]/10 text-[#6366f1] rounded">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {(!insights?.topPosts || insights.topPosts.length === 0) && (
              <p className="text-[#64748b] text-sm text-center py-4">No post data yet. Publish posts and add analytics to see performance.</p>
            )}
          </div>
        </Card>

        {/* Best Times & Hashtags */}
        <div className="space-y-6">
          <Card title="Best Posting Times">
            <div className="space-y-2">
              {(insights?.bestHours || []).slice(0, 5).map(h => (
                <div key={h.hour} className="flex items-center justify-between text-sm p-2 bg-[#12131e] rounded">
                  <span className="text-[#f1f5f9]">{formatHour(h.hour)}</span>
                  <span className="text-emerald-400 text-xs font-medium">{h.avgER}% ER</span>
                </div>
              ))}
              {(!insights?.bestHours || insights.bestHours.length === 0) && (
                <p className="text-[#64748b] text-xs text-center py-2">No time data yet</p>
              )}
            </div>
          </Card>

          <Card title="Top Hashtags">
            <div className="space-y-2">
              {(insights?.topHashtags || []).slice(0, 6).map(h => (
                <div key={h.tag} className="flex items-center justify-between text-sm p-2 bg-[#12131e] rounded">
                  <span className="text-[#6366f1] text-xs">{h.tag}</span>
                  <span className="text-[#94a3b8] text-xs">{h.avgER}% ER ({h.count}x)</span>
                </div>
              ))}
              {(!insights?.topHashtags || insights.topHashtags.length === 0) && (
                <p className="text-[#64748b] text-xs text-center py-2">No hashtag data yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Best Days */}
      {insights?.bestDays && insights.bestDays.length > 0 && (
        <Card title="Best Days to Post">
          <div className="flex gap-3 flex-wrap">
            {insights.bestDays.map((d, i) => (
              <div key={d.day} className={`flex-1 min-w-[120px] p-3 rounded-lg border text-center ${
                i === 0 ? 'bg-[#6366f1]/10 border-[#6366f1]/30' : 'bg-[#12131e] border-[#2a2b3e]'
              }`}>
                <p className={`text-sm font-semibold ${i === 0 ? 'text-[#6366f1]' : 'text-[#f1f5f9]'}`}>{d.day}</p>
                <p className="text-xs text-[#94a3b8] mt-1">{d.avgER}% avg ER</p>
                <p className="text-[10px] text-[#64748b]">{d.posts} posts</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Trends Tab ──────────────────────────────────────────

function TrendsTab({ trends, trendCounts, loading, filter, onFilterChange, onRefresh, lastUpdated, selectedTrend, onSelectTrend }: {
  trends: TrendItem[];
  trendCounts: Record<string, number>;
  loading: boolean;
  filter: TrendSource;
  onFilterChange: (f: TrendSource) => void;
  onRefresh: () => void;
  lastUpdated: string | null;
  selectedTrend: TrendItem | null;
  onSelectTrend: (t: TrendItem | null) => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyTopic = (trend: TrendItem) => {
    navigator.clipboard.writeText(trend.keyword);
    setCopiedId(trend.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (loading) return <SkeletonGrid count={6} />;

  const maxScore = Math.max(...trends.map(t => t.trend_score), 1);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pinterest', 'instagram', 'reddit'] as const).map(src => (
            <button
              key={src}
              onClick={() => onFilterChange(src)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === src ? 'bg-[#6366f1] text-white' : 'bg-[#1a1b2e] border border-[#2a2b3e] text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              <span>{src === 'all' ? '🌐' : SOURCE_CONFIG[src as keyof typeof SOURCE_CONFIG].icon}</span>
              <span>{src === 'all' ? 'All' : SOURCE_CONFIG[src as keyof typeof SOURCE_CONFIG].name}</span>
              <span className="text-xs opacity-60">({trendCounts[src]})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[#64748b] text-xs">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trends List */}
        <div className="lg:col-span-2 space-y-2">
          {trends.map((trend, i) => {
            const src = SOURCE_CONFIG[trend.source];
            const isSelected = selectedTrend?.id === trend.id;
            return (
              <div
                key={trend.id}
                onClick={() => onSelectTrend(trend)}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected ? 'bg-[#6366f1]/10 border-[#6366f1]/40' : 'bg-[#1a1b2e] border-[#2a2b3e] hover:border-[#6366f1]/20'
                }`}
              >
                <span className="text-lg font-bold text-[#6366f1] w-8 text-center shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[#f1f5f9] font-medium text-sm truncate">{trend.keyword}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${src.bg}`} style={{ color: src.color }}>
                      {src.icon} {trend.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
                    {trend.volume && <span>{fmt(trend.volume)} volume</span>}
                    {trend.category && <span>{trend.category}</span>}
                  </div>
                </div>
                <div className="w-24 shrink-0">
                  <div className="w-full h-2 bg-[#12131e] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(trend.trend_score / maxScore) * 100}%`, backgroundColor: src.color }}
                    />
                  </div>
                  <p className="text-[10px] text-[#64748b] text-right mt-0.5">{trend.trend_score}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); copyTopic(trend); }}
                  className="px-2 py-1 text-xs text-[#6366f1] hover:bg-[#6366f1]/10 rounded transition-colors shrink-0"
                >
                  {copiedId === trend.id ? '✓' : 'Copy'}
                </button>
              </div>
            );
          })}

          {trends.length === 0 && (
            <div className="text-center p-10 bg-[#1a1b2e] rounded-xl border border-[#2a2b3e]">
              <p className="text-[#f1f5f9] font-medium mb-1">No trends available</p>
              <p className="text-[#94a3b8] text-sm mb-4">Click Refresh to fetch the latest from Pinterest, Instagram, and Reddit.</p>
              <button onClick={onRefresh} className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm rounded-lg transition-colors">
                Fetch Now
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {selectedTrend ? (
            <Card title="Trend Detail">
              <div className="space-y-3">
                <p className="text-[#f1f5f9] font-medium">{selectedTrend.keyword}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: SOURCE_CONFIG[selectedTrend.source].color }}>
                    {SOURCE_CONFIG[selectedTrend.source].icon} {SOURCE_CONFIG[selectedTrend.source].name}
                  </span>
                  {selectedTrend.category && <span className="text-xs text-[#94a3b8]">{selectedTrend.category}</span>}
                </div>
                {selectedTrend.volume && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94a3b8]">Volume</span>
                    <span className="text-[#f1f5f9]">{fmt(selectedTrend.volume)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#94a3b8]">Score</span>
                  <span className="text-[#f1f5f9]">{selectedTrend.trend_score}/100</span>
                </div>
                {selectedTrend.url && (
                  <a href={selectedTrend.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-[#6366f1] hover:underline truncate">
                    View source
                  </a>
                )}
                <div className="pt-3 border-t border-[#2a2b3e]">
                  <p className="text-xs text-[#94a3b8] mb-2">Content angles:</p>
                  <div className="space-y-1.5">
                    {[
                      `"How ${selectedTrend.keyword} is changing the game"`,
                      `"Our take on ${selectedTrend.keyword}"`,
                      `"${selectedTrend.keyword}: What you need to know"`,
                    ].map((angle, i) => (
                      <p key={i} className="text-xs text-[#f1f5f9] p-2 bg-[#12131e] rounded">{angle}</p>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 text-center">
              <p className="text-[#94a3b8] text-sm">Click a trend to see details</p>
            </div>
          )}

          {/* Source Distribution */}
          <Card title="Source Distribution">
            <div className="space-y-3">
              {(['pinterest', 'instagram', 'reddit'] as const).map(src => {
                const count = trendCounts[src];
                const total = trendCounts.all || 1;
                const cfg = SOURCE_CONFIG[src];
                return (
                  <div key={src} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#f1f5f9] flex items-center gap-1.5">{cfg.icon} {cfg.name}</span>
                      <span className="text-[#94a3b8]">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-[#12131e] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, backgroundColor: cfg.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Strategy Tab ────────────────────────────────────────

function StrategyTab({ strategy, loading, goal, onGoalChange, platforms, onTogglePlatform, context, onContextChange, onGenerate }: {
  strategy: Strategy | null;
  loading: boolean;
  goal: string;
  onGoalChange: (g: string) => void;
  platforms: string[];
  onTogglePlatform: (p: string) => void;
  context: string;
  onContextChange: (c: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Strategy Builder */}
      <Card title="Strategy Builder">
        <div className="space-y-4">
          {/* Goal Selection */}
          <div>
            <label className="text-xs text-[#94a3b8] mb-2 block">What&apos;s your primary goal?</label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_OPTIONS.map(g => (
                <button
                  key={g.value}
                  onClick={() => onGoalChange(g.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    goal === g.value ? 'bg-[#6366f1] text-white' : 'bg-[#12131e] border border-[#2a2b3e] text-[#94a3b8] hover:text-[#f1f5f9]'
                  }`}
                >
                  <span>{g.icon}</span> {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="text-xs text-[#94a3b8] mb-2 block">Target platforms</label>
            <div className="flex gap-2 flex-wrap">
              {(['instagram', 'pinterest', 'reddit', 'linkedin'] as const).map(p => {
                const plat = p === 'reddit'
                  ? { icon: '🟠', name: 'Reddit' }
                  : PLATFORMS[p as Platform];
                return (
                  <button
                    key={p}
                    onClick={() => onTogglePlatform(p)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      platforms.includes(p) ? 'bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#f1f5f9]' : 'bg-[#12131e] border border-[#2a2b3e] text-[#64748b]'
                    }`}
                  >
                    <span>{plat?.icon}</span> {plat?.name || p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context */}
          <div>
            <label className="text-xs text-[#94a3b8] mb-2 block">Additional context (optional)</label>
            <textarea
              value={context}
              onChange={e => onContextChange(e.target.value)}
              maxLength={2000}
              placeholder="e.g. We're a web design agency targeting SaaS startups, launching a new service next month..."
              className="w-full p-3 bg-[#12131e] border border-[#2a2b3e] rounded-lg text-[#f1f5f9] text-sm placeholder-[#64748b] resize-none focus:outline-none focus:border-[#6366f1] transition-colors"
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            disabled={loading || platforms.length === 0}
            className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Strategy...
              </>
            ) : (
              'Generate AI Strategy'
            )}
          </button>
        </div>
      </Card>

      {/* Strategy Results */}
      {strategy && (
        <div className="space-y-6">
          {/* Overview */}
          <Card title="Strategy Overview">
            <p className="text-[#f1f5f9] text-sm leading-relaxed">{strategy.overview}</p>
          </Card>

          {/* Weekly Content Plan */}
          <Card title="Weekly Content Plan">
            <div className="space-y-3">
              {(strategy.weeklyPlan || []).map((day, i) => {
                const plat = day.platform === 'reddit'
                  ? { icon: '🟠', name: 'Reddit', color: '#FF4500' }
                  : PLATFORMS[day.platform as Platform];
                return (
                  <div key={i} className="p-4 bg-[#12131e] rounded-lg border border-[#2a2b3e]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#6366f1] bg-[#6366f1]/10 px-2 py-1 rounded">{day.day}</span>
                        <span>{plat?.icon}</span>
                        <span className="text-[#f1f5f9] text-sm font-medium">{plat?.name || day.platform}</span>
                      </div>
                      <span className="text-xs text-[#94a3b8]">{day.bestTime}</span>
                    </div>
                    <p className="text-[#f1f5f9] text-sm font-medium mb-1">{day.topic}</p>
                    <p className="text-[#94a3b8] text-xs mb-2 capitalize">{day.contentType?.replace('-', ' ')}</p>
                    {day.caption && <p className="text-[#94a3b8] text-xs italic">&quot;{day.caption}&quot;</p>}
                    {day.hashtags?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {day.hashtags.slice(0, 5).map(h => (
                          <span key={h} className="text-[10px] px-1.5 py-0.5 bg-[#6366f1]/10 text-[#6366f1] rounded">{h.startsWith('#') ? h : `#${h}`}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Strategies */}
            <Card title="Platform Strategies">
              <div className="space-y-4">
                {Object.entries(strategy.platformStrategies || {}).map(([p, s]) => {
                  const plat = p === 'reddit'
                    ? { icon: '🟠', name: 'Reddit' }
                    : PLATFORMS[p as Platform];
                  return (
                    <div key={p} className="p-3 bg-[#12131e] rounded-lg border border-[#2a2b3e]">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{plat?.icon}</span>
                        <span className="text-[#f1f5f9] text-sm font-medium">{plat?.name || p}</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <p><span className="text-[#94a3b8]">Focus:</span> <span className="text-[#f1f5f9]">{s.focus}</span></p>
                        <p><span className="text-[#94a3b8]">Frequency:</span> <span className="text-[#f1f5f9]">{s.frequency}</span></p>
                        <p><span className="text-[#94a3b8]">Mix:</span> <span className="text-[#f1f5f9]">{s.contentMix}</span></p>
                        <p className="text-emerald-400 mt-1">{s.tip}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Trend Opportunities */}
            <Card title="Trend Opportunities">
              <div className="space-y-3">
                {(strategy.trendOpportunities || []).map((t, i) => (
                  <div key={i} className="p-3 bg-[#12131e] rounded-lg border border-[#2a2b3e]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[#f1f5f9] text-sm font-medium">{t.trend}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        t.urgency === 'high' ? 'bg-red-500/10 text-red-400' :
                        t.urgency === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {t.urgency}
                      </span>
                    </div>
                    <p className="text-[#94a3b8] text-xs">{t.angle}</p>
                    <p className="text-[#64748b] text-[10px] mt-1">Best for: {t.platform}</p>
                  </div>
                ))}
                {(!strategy.trendOpportunities || strategy.trendOpportunities.length === 0) && (
                  <p className="text-[#64748b] text-xs text-center py-4">No trend opportunities identified</p>
                )}
              </div>
            </Card>
          </div>

          {/* Improvements */}
          {strategy.improvements && strategy.improvements.length > 0 && (
            <Card title="Recommended Improvements">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {strategy.improvements.map((imp, i) => (
                  <div key={i} className="p-4 bg-[#12131e] rounded-lg border border-[#2a2b3e] hover:border-[#6366f1]/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[#f1f5f9] text-sm font-medium">{imp.area}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        imp.expectedImpact === 'high' ? 'bg-emerald-500/10 text-emerald-400' :
                        imp.expectedImpact === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-[#6366f1]/10 text-[#6366f1]'
                      }`}>
                        {imp.expectedImpact} impact
                      </span>
                    </div>
                    <p className="text-[#94a3b8] text-xs mt-1">{imp.action}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Empty state when no strategy generated */}
      {!strategy && !loading && (
        <div className="text-center p-10 bg-[#1a1b2e] rounded-xl border border-[#2a2b3e]">
          <p className="text-4xl mb-3">🧠</p>
          <p className="text-[#f1f5f9] font-medium mb-1">No strategy generated yet</p>
          <p className="text-[#94a3b8] text-sm">Select your goal and platforms above, then hit Generate to get an AI-powered content strategy based on your performance data and current trends.</p>
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-[#f1f5f9] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function KPI({ label, value, sub, highlight, small }: { label: string; value: string; sub?: string; highlight?: boolean; small?: boolean }) {
  return (
    <div className={`bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] ${small ? 'p-3' : 'p-4'}`}>
      <p className="text-[#94a3b8] text-xs">{label}</p>
      <p className={`font-bold text-[#f1f5f9] mt-1 ${small ? 'text-lg' : 'text-xl'} ${highlight ? 'text-emerald-400' : ''}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-[#64748b] mt-0.5">{sub}</p>}
    </div>
  );
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-4 h-20 animate-pulse" />
      ))}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatHour(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:00 ${ampm}`;
}
