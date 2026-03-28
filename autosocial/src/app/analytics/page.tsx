'use client';

import { useState } from 'react';
import { analyticsEntries, analyticsData } from '@/lib/sample-data';
import { PLATFORMS } from '@/lib/platforms';
import type { Platform } from '@/lib/types';

export default function AnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

  const totals = analyticsEntries.reduce(
    (acc, e) => ({
      impressions: acc.impressions + e.metrics.impressions,
      reach: acc.reach + e.metrics.reach,
      likes: acc.likes + e.metrics.likes,
      comments: acc.comments + e.metrics.comments,
      shares: acc.shares + e.metrics.shares,
      saves: acc.saves + e.metrics.saves,
    }),
    { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
  );

  const platformBreakdown = (['instagram', 'linkedin', 'twitter', 'pinterest', 'dribbble', 'gmb'] as Platform[])
    .map(p => {
      const entries = analyticsEntries.filter(e => e.platform === p);
      if (!entries.length) return null;
      const avgER = entries.reduce((s, e) => s + e.metrics.engagementRate, 0) / entries.length;
      const totalImpressions = entries.reduce((s, e) => s + e.metrics.impressions, 0);
      const topHashtag = getMostFrequent(entries.flatMap(e => e.hashtags));
      return { platform: p, posts: entries.length, impressions: totalImpressions, avgER, topHashtag };
    })
    .filter(Boolean) as { platform: Platform; posts: number; impressions: number; avgER: number; topHashtag: string }[];

  const contentTypeStats = ['case-study', 'knowledge', 'design', 'trend', 'promotion'].map(type => {
    const entries = analyticsEntries.filter(e => e.contentType === type);
    const avgER = entries.length ? entries.reduce((s, e) => s + e.metrics.engagementRate, 0) / entries.length : 0;
    return { type, avgER, count: entries.length };
  }).filter(s => s.count > 0).sort((a, b) => b.avgER - a.avgER);

  const maxContentER = Math.max(...contentTypeStats.map(s => s.avgER));

  const topPosts = [...analyticsEntries].sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Analytics</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Track performance and optimize strategy</p>
        </div>
        <div className="flex gap-1 bg-[#12131e] rounded-lg p-1 border border-[#2a2b3e]">
          {(['7d', '30d', '90d'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${range === r ? 'bg-[#6366f1] text-white' : 'text-[#94a3b8] hover:text-[#f1f5f9]'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Impressions" value={fmt(totals.impressions)} bar={1} />
        <MetricCard label="Reach" value={fmt(totals.reach)} bar={0.75} />
        <MetricCard label="Likes" value={fmt(totals.likes)} bar={0.6} />
        <MetricCard label="Comments" value={fmt(totals.comments)} bar={0.25} />
        <MetricCard label="Shares" value={fmt(totals.shares)} bar={0.45} />
        <MetricCard label="Avg ER" value={`${analyticsData.summary.avgEngagementRate}%`} bar={0.85} />
      </div>

      {/* Platform Breakdown Table */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] overflow-hidden">
        <div className="p-5 border-b border-[#2a2b3e]">
          <h2 className="text-lg font-semibold text-[#f1f5f9]">Platform Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2b3e]">
                <th className="text-left text-[#94a3b8] font-medium px-5 py-3">Platform</th>
                <th className="text-right text-[#94a3b8] font-medium px-5 py-3">Posts</th>
                <th className="text-right text-[#94a3b8] font-medium px-5 py-3">Impressions</th>
                <th className="text-right text-[#94a3b8] font-medium px-5 py-3">Avg ER</th>
                <th className="text-left text-[#94a3b8] font-medium px-5 py-3">Top Hashtag</th>
              </tr>
            </thead>
            <tbody>
              {platformBreakdown.map(({ platform, posts, impressions, avgER, topHashtag }) => (
                <tr key={platform} className="border-b border-[#2a2b3e] last:border-0 hover:bg-[#12131e]/50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 text-[#f1f5f9]">
                      <span>{PLATFORMS[platform].icon}</span>
                      <span>{PLATFORMS[platform].name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-[#f1f5f9]">{posts}</td>
                  <td className="px-5 py-3 text-right text-[#f1f5f9]">{fmt(impressions)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-[#f1f5f9] font-medium">{avgER.toFixed(1)}%</span>
                  </td>
                  <td className="px-5 py-3 text-[#94a3b8]">{topHashtag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Type Performance */}
        <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
          <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Content Type Performance</h2>
          <div className="space-y-4">
            {contentTypeStats.map(({ type, avgER, count }) => (
              <div key={type} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#f1f5f9] capitalize">{type.replace('-', ' ')} <span className="text-[#94a3b8] text-xs">({count})</span></span>
                  <span className="text-[#f1f5f9] font-medium">{avgER.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#12131e] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#6366f1] transition-all duration-500" style={{ width: `${(avgER / maxContentER) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Posts */}
        <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
          <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Top Performing Posts</h2>
          <div className="space-y-3">
            {topPosts.map((entry, i) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 bg-[#12131e] rounded-lg border border-[#2a2b3e]">
                <span className="text-lg font-bold text-[#6366f1] w-6 text-center shrink-0">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span>{PLATFORMS[entry.platform].icon}</span>
                    <span className="text-[#f1f5f9] text-sm font-medium">{PLATFORMS[entry.platform].name}</span>
                  </div>
                  <p className="text-[#94a3b8] text-xs mt-1 capitalize">{entry.contentType.replace('-', ' ')}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-emerald-400">{entry.metrics.engagementRate}% ER</span>
                    <span className="text-[#94a3b8]">{fmt(entry.metrics.impressions)} impressions</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
        <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">💡 AI Recommendations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: 'Double down on Knowledge content', detail: 'Knowledge posts average 11.5% ER — 2x your case study average. Publish 2 more per week.' },
            { title: 'Shift LinkedIn to 9:30 AM', detail: 'Your top LinkedIn posts were all published at 9:30am. Current schedule mixes 10am and 11am.' },
            { title: 'Pinterest is underutilized', detail: 'Your 1 Pinterest post hit 17.2% ER — highest across all platforms. Add 2 pins per week.' },
            { title: 'Retire #agencylife hashtag', detail: 'Posts with #agencylife average 5.5% ER vs 11% without. Replace with #productdesign.' },
          ].map((rec, i) => (
            <div key={i} className="p-4 bg-[#12131e] rounded-lg border border-[#2a2b3e] hover:border-[#6366f1]/30 transition-colors">
              <p className="text-[#f1f5f9] text-sm font-medium">{rec.title}</p>
              <p className="text-[#94a3b8] text-xs mt-1">{rec.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, bar }: { label: string; value: string; bar: number }) {
  return (
    <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-4">
      <p className="text-[#94a3b8] text-xs">{label}</p>
      <p className="text-xl font-bold text-[#f1f5f9] mt-1">{value}</p>
      <div className="w-full h-1 bg-[#12131e] rounded-full mt-2 overflow-hidden">
        <div className="h-full rounded-full bg-[#6366f1]" style={{ width: `${bar * 100}%` }} />
      </div>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function getMostFrequent(arr: string[]): string {
  const counts: Record<string, number> = {};
  arr.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}
