'use client';

import { useState, useEffect } from 'react';

interface Trend {
  id: string;
  source: 'pinterest' | 'instagram' | 'reddit';
  keyword: string;
  volume: number | null;
  trend_score: number;
  category: string | null;
  url: string | null;
  fetched_at: string;
}

const SOURCE_CONFIG: Record<string, { name: string; icon: string; color: string; bg: string }> = {
  pinterest: { name: 'Pinterest', icon: '📌', color: '#BD081C', bg: 'bg-red-500/10' },
  instagram: { name: 'Instagram', icon: '📸', color: '#E4405F', bg: 'bg-pink-500/10' },
  reddit: { name: 'Reddit', icon: '🟠', color: '#FF4500', bg: 'bg-orange-500/10' },
};

type SourceFilter = 'all' | 'pinterest' | 'instagram' | 'reddit';

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTrends = async () => {
    try {
      const res = await fetch('/api/trends');
      const data = await res.json();
      setTrends(data.trends || []);
      setLastUpdated(data.lastUpdated);
      // If no trends returned, auto-refresh from sources
      if (!data.trends || data.trends.length === 0) {
        const refreshRes = await fetch('/api/trends', { method: 'POST' });
        const refreshData = await refreshRes.json();
        setTrends(refreshData.trends || []);
        setLastUpdated(refreshData.lastUpdated);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const refreshTrends = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/trends', { method: 'POST' });
      const data = await res.json();
      setTrends(data.trends || []);
      setLastUpdated(data.lastUpdated);
    } catch {} finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTrends(); }, []);

  const filtered = filter === 'all' ? trends : trends.filter(t => t.source === filter);
  const maxScore = Math.max(...filtered.map(t => t.trend_score), 1);

  const sourceCounts = {
    all: trends.length,
    pinterest: trends.filter(t => t.source === 'pinterest').length,
    instagram: trends.filter(t => t.source === 'instagram').length,
    reddit: trends.filter(t => t.source === 'reddit').length,
  };

  const copyTopic = (trend: Trend) => {
    navigator.clipboard.writeText(trend.keyword);
    setCopiedId(trend.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-[#f1f5f9]">Trending Now</h1></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Trending Now</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Live trends from Pinterest, Instagram, and Reddit — {lastUpdated ? `updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'loading...'}
          </p>
        </div>
        <button
          onClick={refreshTrends}
          disabled={refreshing}
          className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {refreshing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          Refresh
        </button>
      </div>

      {/* Source Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pinterest', 'instagram', 'reddit'] as const).map(src => (
          <button
            key={src}
            onClick={() => setFilter(src)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === src ? 'bg-[#6366f1] text-white' : 'bg-[#1a1b2e] border border-[#2a2b3e] text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            <span>{src === 'all' ? '🌐' : SOURCE_CONFIG[src].icon}</span>
            <span>{src === 'all' ? 'All Sources' : SOURCE_CONFIG[src].name}</span>
            <span className="text-xs opacity-60">({sourceCounts[src]})</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending Topics List */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.map((trend, i) => {
            const src = SOURCE_CONFIG[trend.source] || { name: trend.source, icon: '📊', color: '#6366f1', bg: 'bg-indigo-500/10' };
            const isSelected = selectedTrend?.id === trend.id;
            return (
              <div
                key={trend.id || i}
                onClick={() => setSelectedTrend(trend)}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected ? 'bg-[#6366f1]/10 border-[#6366f1]/40' : 'bg-[#1a1b2e] border-[#2a2b3e] hover:border-[#6366f1]/20'
                }`}
              >
                {/* Rank */}
                <span className="text-lg font-bold text-[#6366f1] w-8 text-center shrink-0">#{i + 1}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[#f1f5f9] font-medium text-sm truncate">{trend.keyword}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${src.bg}`} style={{ color: src.color }}>
                      {src.icon} {trend.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
                    {trend.volume && <span>{formatVolume(trend.volume)} volume</span>}
                    {trend.category && <span>{trend.category}</span>}
                  </div>
                </div>

                {/* Score Bar */}
                <div className="w-24 shrink-0">
                  <div className="w-full h-2 bg-[#12131e] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(trend.trend_score / maxScore) * 100}%`, backgroundColor: src.color }}
                    />
                  </div>
                  <p className="text-[10px] text-[#64748b] text-right mt-0.5">{trend.trend_score}</p>
                </div>

                {/* Copy */}
                <button
                  onClick={e => { e.stopPropagation(); copyTopic(trend); }}
                  className="px-2 py-1 text-xs text-[#6366f1] hover:bg-[#6366f1]/10 rounded transition-colors shrink-0"
                >
                  {copiedId === trend.id ? '✓' : 'Copy'}
                </button>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center p-10 bg-[#1a1b2e] rounded-xl border border-[#2a2b3e]">
              <p className="text-[#f1f5f9] font-medium mb-1">No trends available</p>
              <p className="text-[#94a3b8] text-sm mb-4">Click Refresh to fetch the latest from Pinterest, Instagram, and Reddit.</p>
              <button onClick={refreshTrends} disabled={refreshing} className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm rounded-lg transition-colors">
                {refreshing ? 'Loading...' : 'Fetch Now'}
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar — Trend Detail + Quick Actions */}
        <div className="space-y-4">
          {/* Selected Trend Detail */}
          {selectedTrend ? (
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
              <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">Trend Detail</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[#f1f5f9] font-medium">{selectedTrend.keyword}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {SOURCE_CONFIG[selectedTrend.source] && (
                      <span className="text-xs" style={{ color: SOURCE_CONFIG[selectedTrend.source].color }}>
                        {SOURCE_CONFIG[selectedTrend.source].icon} {SOURCE_CONFIG[selectedTrend.source].name}
                      </span>
                    )}
                    {selectedTrend.category && (
                      <span className="text-xs text-[#94a3b8]">{selectedTrend.category}</span>
                    )}
                  </div>
                </div>
                {selectedTrend.volume && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94a3b8]">Volume</span>
                    <span className="text-[#f1f5f9]">{formatVolume(selectedTrend.volume)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#94a3b8]">Score</span>
                  <span className="text-[#f1f5f9]">{selectedTrend.trend_score}/100</span>
                </div>
                {selectedTrend.url && (
                  <a href={selectedTrend.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-[#6366f1] hover:underline truncate">
                    View source →
                  </a>
                )}

                <div className="pt-3 border-t border-[#2a2b3e]">
                  <p className="text-xs text-[#94a3b8] mb-2">Suggested content angles:</p>
                  <div className="space-y-1.5">
                    {[
                      `"How ${selectedTrend.keyword} is changing the game"`,
                      `"Our take on ${selectedTrend.keyword}"`,
                      `"${selectedTrend.keyword}: What agencies need to know"`,
                    ].map((angle, i) => (
                      <p key={i} className="text-xs text-[#f1f5f9] p-2 bg-[#12131e] rounded">{angle}</p>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => copyTopic(selectedTrend)}
                    className="flex-1 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs rounded-lg transition-colors"
                  >
                    Use for Post
                  </button>
                  <button className="flex-1 py-2 bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] text-xs rounded-lg hover:bg-[#2a2b3e] transition-colors">
                    Add to Calendar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 text-center">
              <p className="text-[#94a3b8] text-sm">Click a trend to see details</p>
            </div>
          )}

          {/* Source Distribution */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
            <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">Source Distribution</h3>
            <div className="space-y-3">
              {(['pinterest', 'instagram', 'reddit'] as const).map(src => {
                const count = sourceCounts[src];
                const total = trends.length || 1;
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
          </div>

          {/* Top Categories */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
            <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">Categories</h3>
            <div className="flex flex-wrap gap-1.5">
              {getUniqueCategories(trends).map(cat => (
                <span key={cat} className="px-2 py-1 bg-[#12131e] text-[#94a3b8] text-xs rounded-md">{cat}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatVolume(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function getUniqueCategories(trends: Trend[]): string[] {
  const cats = new Set(trends.map(t => t.category).filter(Boolean) as string[]);
  return Array.from(cats).slice(0, 12);
}
