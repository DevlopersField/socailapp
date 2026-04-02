'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { PLATFORMS } from '@/lib/platforms';
import type { Platform } from '@/lib/types';

// ─── Types ──────────────────────────────────────────────

type Tab = 'performance' | 'trends' | 'strategy';
type TimeRange = '7d' | '30d' | '90d';
type TrendSource = 'all' | 'pinterest' | 'instagram' | 'reddit';

interface DailySeries {
  date: string;
  posts: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  avgEngagementRate: number;
}

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
  platformBreakdown: { platform: string; posts: number; impressions: number; reach: number; likes: number; comments: number; shares: number; saves: number; clicks: number; avgEngagementRate: number }[];
  contentTypeBreakdown: { type: string; posts: number; avgEngagementRate: number }[];
  topPosts: { id: string; postId: string; platform: string; contentType: string; publishedAt: string; metrics: Record<string, number>; hashtags: string[] }[];
  worstPosts: { id: string; platform: string; contentType: string; metrics: Record<string, number> }[];
  topHashtags: { tag: string; count: number; avgER: number }[];
  bestHours: { hour: number; posts: number; avgER: number }[];
  bestDays: { day: string; posts: number; avgER: number }[];
  dailySeries: DailySeries[];
  range: string;
  platform: string;
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

// ─── Chart Components ──────────────────────────────────

function LineChart({ data, keys, colors }: { data: DailySeries[]; keys: (keyof DailySeries)[]; colors: string[] }) {
  if (!data || data.length === 0) return <div className="h-48 bg-[#1a1b2e] rounded-lg flex items-center justify-center text-[#94a3b8]">No data available</div>;

  const padding = 40;
  const width = 800;
  const height = 240;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.flatMap(d => keys.map(k => (d[k] as number) || 0)));
  const minValue = 0;
  const range = maxValue - minValue || 1;

  const points = (key: keyof DailySeries) =>
    data
      .map((d, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
        const y = padding + chartHeight - (((d[key] as number || 0) - minValue) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="min-w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + (1 - pct) * chartHeight}
            x2={width - padding}
            y2={padding + (1 - pct) * chartHeight}
            stroke="#2a2b3e"
            strokeWidth="1"
          />
        ))}

        {/* Lines */}
        {keys.map((key, idx) => (
          <polyline
            key={key}
            points={points(key)}
            fill="none"
            stroke={colors[idx]}
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* X-axis */}
        <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#2a2b3e" strokeWidth="1" />

        {/* Y-axis */}
        <line x1={padding} y1={padding} x2={padding} y2={padding + chartHeight} stroke="#2a2b3e" strokeWidth="1" />

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % Math.ceil(data.length / 5) !== 0 && i !== data.length - 1) return null;
          const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
          return (
            <text key={`label-${i}`} x={x} y={padding + chartHeight + 20} textAnchor="middle" fontSize="12" fill="#64748b">
              {d.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, color }: { data: any[]; labelKey: string; valueKey: string; color: string }) {
  if (!data || data.length === 0) return <div className="h-32 bg-[#1a1b2e] rounded-lg flex items-center justify-center text-[#94a3b8]">No data</div>;

  const max = Math.max(...data.map(d => d[valueKey] as number));
  const barHeight = 120;

  return (
    <div className="flex items-end justify-around gap-2 h-40 p-4">
      {data.map((d, i) => {
        const height = ((d[valueKey] as number) / max) * barHeight;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded-t transition-colors hover:opacity-80"
              style={{ height: `${height}px`, backgroundColor: color }}
            />
            <span className="text-[10px] text-[#64748b] text-center">{d[labelKey]}</span>
            <span className="text-[11px] font-semibold text-[#f1f5f9]">{d[valueKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function KPICard({ label, value, highlight, icon }: { label: string; value: string | number; highlight?: boolean; icon?: string }) {
  return (
    <div className="bg-[#1a1b2e] border border-[#2a2b3e] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <p className="text-[#94a3b8] text-xs uppercase tracking-wider">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold mt-2 ${highlight ? 'text-emerald-400' : 'text-[#f1f5f9]'}`}>{value}</p>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────

export default function InsightsPage() {
  const [tab, setTab] = useState<Tab>('performance');
  const [range, setRange] = useState<TimeRange>('30d');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
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
      const url = selectedPlatform && selectedPlatform !== 'all'
        ? `/api/insights?range=${range}&platform=${selectedPlatform}`
        : `/api/insights?range=${range}`;
      const res = await apiGet(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInsights(data);
    } catch { /* silent */ } finally {
      setLoading(p => ({ ...p, insights: false }));
    }
  }, [range, selectedPlatform]);

  // Fetch trends
  const fetchTrends = useCallback(async (refresh = false) => {
    setLoading(p => ({ ...p, trends: true }));
    try {
      const res = refresh ? await apiPost('/api/trends', {}) : await apiGet('/api/trends');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTrends(data.items || []);
      setTrendLastUpdated(new Date().toLocaleTimeString());
    } catch { /* silent */ } finally {
      setLoading(p => ({ ...p, trends: false }));
    }
  }, []);

  // Generate strategy
  const generateStrategy = useCallback(async () => {
    if (!insights) return;
    setLoading(p => ({ ...p, strategy: true }));
    try {
      const res = await apiPost('/api/strategy', {
        goal: strategyGoal,
        platforms: strategyPlatforms,
        context: strategyContext,
        analyticsData: insights.summary,
        trendsData: trends.slice(0, 5),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStrategy(data.strategy);
    } catch { /* silent */ } finally {
      setLoading(p => ({ ...p, strategy: false }));
    }
  }, [insights, trends, strategyGoal, strategyPlatforms, strategyContext]);

  // Effects
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  if (!insights) return <div>Loading...</div>;

  const platformIcon = (p: string) => PLATFORMS[p as Platform]?.icon || '⚙️';
  const platformColor = (p: string) => PLATFORMS[p as Platform]?.color || '#6366f1';
  const selectedPlatformData = selectedPlatform !== 'all' ? insights.platformBreakdown.find(p => p.platform === selectedPlatform) : null;

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div>
        <h1 className="text-2xl font-bold text-[#f1f5f9]">📊 Insights & Analytics</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Real-time performance tracking across all platforms</p>
      </div>

      {/* ═══ TAB BAR ═══ */}
      <div className="flex gap-1 bg-[#12131e] rounded-lg p-1 border border-[#2a2b3e] w-fit">
        {(['performance', 'trends', 'strategy'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t
                ? 'bg-[#6366f1] text-white'
                : 'text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            {t === 'performance' && '▲ Performance'}
            {t === 'trends' && '📈 Trends'}
            {t === 'strategy' && '🧠 Strategy'}
          </button>
        ))}
      </div>

      {/* ═══ PERFORMANCE TAB ═══ */}
      {tab === 'performance' && (
        <div className="space-y-6">
          {/* Platform Filter */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#f1f5f9] uppercase tracking-wider">Filter by Platform</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedPlatform('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatform === 'all'
                    ? 'bg-[#6366f1] text-white'
                    : 'bg-[#1a1b2e] border border-[#2a2b3e] text-[#f1f5f9] hover:border-[#6366f1]/50'
                }`}
              >
                All Platforms
              </button>
              {insights.platformBreakdown.map(p => (
                <button
                  key={p.platform}
                  onClick={() => setSelectedPlatform(p.platform)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedPlatform === p.platform
                      ? 'text-white'
                      : 'bg-[#1a1b2e] border border-[#2a2b3e] text-[#f1f5f9] hover:border-[#6366f1]/50'
                  }`}
                  style={selectedPlatform === p.platform ? { backgroundColor: platformColor(p.platform) } : {}}
                >
                  <span>{platformIcon(p.platform)}</span>
                  {p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  range === r
                    ? 'bg-[#6366f1] text-white'
                    : 'bg-[#1a1b2e] border border-[#2a2b3e] text-[#f1f5f9] hover:bg-[#2a2b3e]'
                }`}
              >
                {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </button>
            ))}
          </div>

          {/* Platform Overview */}
          {selectedPlatformData && (
            <div className="bg-gradient-to-br from-[#1a1b2e] to-[#12131e] rounded-xl border border-[#2a2b3e] p-6 lg:col-span-3 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: `${platformColor(selectedPlatformData.platform)}20` }}>
                  {platformIcon(selectedPlatformData.platform)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#f1f5f9]">{selectedPlatformData.platform.charAt(0).toUpperCase() + selectedPlatformData.platform.slice(1)} Overview</h2>
                  <p className="text-[#94a3b8] text-sm">Connected & active</p>
                </div>
              </div>

              {/* 8 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard label="Impressions" value={insights.summary.totalImpressions.toLocaleString()} icon="👁️" />
                <KPICard label="Reach" value={insights.summary.totalReach.toLocaleString()} icon="📢" />
                <KPICard label="Likes" value={insights.summary.totalLikes.toLocaleString()} icon="❤️" />
                <KPICard label="Comments" value={insights.summary.totalComments.toLocaleString()} icon="💬" />
                <KPICard label="Shares" value={insights.summary.totalShares.toLocaleString()} icon="↗️" />
                <KPICard label="Saves" value={insights.summary.totalSaves.toLocaleString()} icon="🔖" />
                <KPICard label="Clicks" value={insights.summary.totalClicks.toLocaleString()} icon="🔗" />
                <KPICard label="Avg ER" value={`${insights.summary.avgEngagementRate}%`} highlight icon="📈" />
              </div>

              {/* Audience Trend Chart */}
              <div className="bg-[#0a0b14] rounded-lg p-6">
                <h3 className="text-lg font-bold text-[#f1f5f9] mb-4">Audience Trend</h3>
                <LineChart data={insights.dailySeries} keys={['impressions', 'reach']} colors={['#6366f1', '#8b5cf6']} />
              </div>
            </div>
          )}

          {/* Primary KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPICard label="Total Posts" value={insights.summary.totalPosts} icon="📱" />
            <KPICard label="Impressions" value={insights.summary.totalImpressions.toLocaleString()} icon="👁️" />
            <KPICard label="Reach" value={insights.summary.totalReach.toLocaleString()} icon="📢" />
            <KPICard label="Avg ER" value={`${insights.summary.avgEngagementRate}%`} highlight icon="📈" />
          </div>

          {/* Secondary KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPICard label="Likes" value={insights.summary.totalLikes.toLocaleString()} />
            <KPICard label="Comments" value={insights.summary.totalComments.toLocaleString()} />
            <KPICard label="Shares" value={insights.summary.totalShares.toLocaleString()} />
            <KPICard label="Saves" value={insights.summary.totalSaves.toLocaleString()} />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Impressions & Reach Chart */}
            <div className="lg:col-span-2 bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
              <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">Impressions & Reach Trend</h2>
              {loading.insights ? (
                <div className="h-64 bg-[#12131e] rounded-lg animate-pulse" />
              ) : (
                <LineChart data={insights.dailySeries} keys={['impressions', 'reach']} colors={['#6366f1', '#8b5cf6']} />
              )}
            </div>

            {/* Platform Breakdown */}
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
              <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">Platforms</h2>
              <div className="space-y-4">
                {insights.platformBreakdown.slice(0, 4).map(p => (
                  <div key={p.platform} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#f1f5f9] flex items-center gap-2">
                        <span>{platformIcon(p.platform)}</span>
                        {p.platform}
                      </span>
                      <span className="text-xs text-[#94a3b8]">{p.posts} posts</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 h-2 bg-[#12131e] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(p.avgEngagementRate / 10) * 100}%`,
                            backgroundColor: platformColor(p.platform),
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#f1f5f9] w-10 text-right">{p.avgEngagementRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Best Days & Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Days */}
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
              <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">Best Days to Post</h2>
              {loading.insights ? (
                <div className="h-32 bg-[#12131e] rounded-lg animate-pulse" />
              ) : (
                <BarChart data={insights.bestDays} labelKey="day" valueKey="avgER" color="#6366f1" />
              )}
            </div>

            {/* Best Hours */}
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
              <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">Best Hours to Post</h2>
              {loading.insights ? (
                <div className="h-32 bg-[#12131e] rounded-lg animate-pulse" />
              ) : (
                <BarChart
                  data={insights.bestHours
                    .sort((a, b) => b.avgER - a.avgER)
                    .slice(0, 12)
                    .map(h => ({ ...h, hour: `${h.hour}:00` }))}
                  labelKey="hour"
                  valueKey="avgER"
                  color="#8b5cf6"
                />
              )}
            </div>
          </div>

          {/* Top Posts */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
            <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">Top Performing Posts</h2>
            <div className="space-y-3">
              {insights.topPosts.slice(0, 5).map((post, idx) => (
                <div key={post.id} className="flex items-center gap-4 p-4 bg-[#12131e] rounded-lg">
                  <span className="text-2xl font-bold text-[#6366f1] w-8 text-center">#{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-[#6366f1]/20 text-[#6366f1]">{post.platform}</span>
                      <span className="text-xs text-[#94a3b8]">{post.contentType}</span>
                    </div>
                    <p className="text-[#f1f5f9] text-sm line-clamp-1">{post.hashtags.join(' ')}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-bold text-emerald-400">{post.metrics.engagement_rate}% ER</p>
                    <p className="text-xs text-[#94a3b8]">{post.metrics.impressions} impressions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Hashtags */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
            <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">Top Hashtags</h2>
            <div className="flex flex-wrap gap-2">
              {insights.topHashtags.slice(0, 10).map(tag => (
                <div key={tag.tag} className="px-3 py-1.5 bg-[#12131e] rounded-lg border border-[#2a2b3e]">
                  <p className="text-[#6366f1] text-sm font-medium">{tag.tag}</p>
                  <p className="text-[#94a3b8] text-xs">{tag.avgER}% ER ({tag.count}x)</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TRENDS TAB ═══ */}
      {tab === 'trends' && (
        <div className="space-y-6">
          {/* Trend Source Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pinterest', 'instagram', 'reddit'] as const).map(source => {
              const config = source === 'all' ? { name: 'All Trends', icon: '📊' } : SOURCE_CONFIG[source];
              return (
                <button
                  key={source}
                  onClick={() => setTrendFilter(source)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    trendFilter === source
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-[#1a1b2e] border border-[#2a2b3e] text-[#f1f5f9] hover:bg-[#2a2b3e]'
                  }`}
                >
                  <span>{config.icon}</span>
                  {config.name}
                </button>
              );
            })}
          </div>

          {/* Refresh Button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#94a3b8]">Last updated: {trendLastUpdated || 'Never'}</p>
            <button
              onClick={() => fetchTrends(true)}
              disabled={loading.trends}
              className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white text-sm rounded-lg transition-colors font-medium"
            >
              {loading.trends ? '⟳ Refreshing...' : '⟳ Refresh'}
            </button>
          </div>

          {/* Trends List */}
          <div className="space-y-3">
            {loading.trends ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-[#1a1b2e] rounded-lg animate-pulse" />
              ))
            ) : trends.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#94a3b8]">No trends available</p>
              </div>
            ) : (
              trends
                .filter(t => trendFilter === 'all' || t.source === trendFilter)
                .slice(0, 20)
                .map(trend => {
                  const config = SOURCE_CONFIG[trend.source];
                  return (
                    <div
                      key={trend.id}
                      onClick={() => setSelectedTrend(selectedTrend?.id === trend.id ? null : trend)}
                      className="p-4 bg-[#1a1b2e] border border-[#2a2b3e] rounded-lg cursor-pointer hover:border-[#6366f1]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${config.bg}`} style={{ color: config.color }}>
                              {config.icon} {config.name}
                            </span>
                            {trend.volume && <span className="text-xs text-[#94a3b8]">📊 {trend.volume.toLocaleString()}</span>}
                          </div>
                          <p className="text-[#f1f5f9] font-semibold">{trend.keyword}</p>
                          {trend.category && <p className="text-xs text-[#94a3b8] mt-1">Category: {trend.category}</p>}
                        </div>
                        <div className="text-right">
                          <div className="w-16 h-8 bg-[#12131e] rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-[#6366f1]">{trend.trend_score}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ═══ STRATEGY TAB ═══ */}
      {tab === 'strategy' && (
        <div className="space-y-6">
          {/* Goal Selector */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
            <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">What's your goal?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {GOAL_OPTIONS.map(goal => (
                <button
                  key={goal.value}
                  onClick={() => setStrategyGoal(goal.value)}
                  className={`p-4 rounded-lg text-center transition-all text-sm font-medium ${
                    strategyGoal === goal.value
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] hover:border-[#6366f1]/50'
                  }`}
                >
                  <span className="text-xl mb-1 block">{goal.icon}</span>
                  {goal.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
            <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">Focus Platforms</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {insights.platformBreakdown.map(p => (
                <button
                  key={p.platform}
                  onClick={() =>
                    setStrategyPlatforms(prev =>
                      prev.includes(p.platform) ? prev.filter(x => x !== p.platform) : [...prev, p.platform]
                    )
                  }
                  className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    strategyPlatforms.includes(p.platform)
                      ? 'text-white'
                      : 'bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] hover:border-[#6366f1]/50'
                  }`}
                  style={strategyPlatforms.includes(p.platform) ? { backgroundColor: platformColor(p.platform) } : {}}
                >
                  <span>{platformIcon(p.platform)}</span>
                  {p.platform}
                </button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
            <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">Additional Context</h2>
            <textarea
              value={strategyContext}
              onChange={e => setStrategyContext(e.target.value)}
              placeholder="Tell us more about your audience, business goals, or any constraints..."
              className="w-full bg-[#12131e] border border-[#2a2b3e] rounded-lg p-4 text-[#f1f5f9] text-sm placeholder:text-[#64748b] focus:outline-none focus:border-[#6366f1] min-h-24"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateStrategy}
            disabled={loading.strategy}
            className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {loading.strategy ? '🧠 Generating Strategy...' : '🧠 Generate AI Strategy'}
          </button>

          {/* Strategy Result */}
          {strategy && (
            <div className="space-y-6">
              <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
                <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">Your Strategy</h2>
                <p className="text-[#f1f5f9]">{strategy.overview}</p>
              </div>

              <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
                <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">Weekly Content Plan</h2>
                <div className="space-y-3">
                  {strategy.weeklyPlan.slice(0, 7).map((day, idx) => (
                    <div key={idx} className="p-4 bg-[#12131e] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-[#f1f5f9]">{day.day}</span>
                        <span className="text-xs px-2 py-1 rounded bg-[#6366f1]/20 text-[#6366f1]">{day.platform}</span>
                      </div>
                      <p className="text-sm text-[#94a3b8]">{day.caption}</p>
                      <p className="text-xs text-[#64748b] mt-2">🏷️ {day.hashtags.slice(0, 3).join(', ')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6">
                <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">Improvement Opportunities</h2>
                <div className="space-y-2">
                  {strategy.improvements.map((imp, idx) => (
                    <div key={idx} className="p-3 bg-[#12131e] rounded-lg">
                      <p className="font-semibold text-[#f1f5f9] text-sm">{imp.area}</p>
                      <p className="text-xs text-[#94a3b8] mt-1">{imp.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
