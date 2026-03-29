'use client';

import { useState, useEffect } from 'react';
import { PLATFORMS } from '@/lib/platforms';
import type { Platform } from '@/lib/types';
import { apiGet } from '@/lib/api';

interface PostItem {
  id: string;
  title: string;
  platforms: string[];
  scheduled_at: string;
  status: string;
  content_type: string;
}

interface AnalyticsSummary {
  totalPosts: number;
  totalImpressions: number;
  totalReach: number;
  avgEngagementRate: number;
  bestPlatform: string;
  entries: { platform: string; metrics: { impressions: number; engagement_rate: number } }[];
}

export default function Dashboard() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet('/api/posts').then(r => r.json()),
      apiGet('/api/analytics').then(r => r.json()),
    ]).then(([postsData, analyticsData]) => {
      setPosts(postsData.posts || []);
      setAnalytics(analyticsData.summary || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-[#f1f5f9]">Dashboard</h1></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const upcomingPosts = posts.filter(p => p.status === 'scheduled' || p.status === 'draft').slice(0, 5);
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

  // Platform performance from analytics entries
  const entries = analytics?.entries || [];
  const platformStats = (['instagram', 'linkedin', 'twitter', 'pinterest', 'dribbble', 'gmb'] as Platform[]).map(p => {
    const pEntries = entries.filter(e => e.platform === p);
    const avgER = pEntries.length ? pEntries.reduce((s, e) => s + (e.metrics?.engagement_rate || 0), 0) / pEntries.length : 0;
    return { platform: p, avgER, posts: pEntries.length };
  }).filter(p => p.posts > 0).sort((a, b) => b.avgER - a.avgER);
  const maxER = Math.max(...platformStats.map(p => p.avgER), 1);

  const isNewUser = posts.length === 0 && !analytics?.totalPosts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Dashboard</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Overview of your social media performance</p>
      </div>

      {/* Welcome Banner for new users */}
      {isNewUser && (
        <div className="bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/10 rounded-xl border border-[#6366f1]/30 p-6">
          <h2 className="text-lg font-bold text-[#f1f5f9] mb-2">Welcome to AutoSocial! 👋</h2>
          <p className="text-[#94a3b8] text-sm mb-4">Your AI-powered social media manager is ready. Here&apos;s how to get started:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: '🧠', title: 'Upload an Image', desc: 'Brain generates everything', href: '/brain' },
              { icon: '📈', title: 'Check Trends', desc: 'See what\'s trending now', href: '/trends' },
              { icon: '📅', title: 'Schedule a Post', desc: 'Plan your content', href: '/scheduler' },
              { icon: '📖', title: 'Read the Guides', desc: 'Step-by-step setup', href: '/guides' },
            ].map(item => (
              <a key={item.href} href={item.href} className="flex items-center gap-3 p-3 bg-[#1a1b2e] rounded-lg border border-[#2a2b3e] hover:border-[#6366f1]/50 transition-colors group">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-[#f1f5f9] text-sm font-medium group-hover:text-[#6366f1] transition-colors">{item.title}</p>
                  <p className="text-[#64748b] text-xs">{item.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon="📊" label="Total Posts" value={String(analytics?.totalPosts || posts.length)} trend="+18%" up />
        <KPICard icon="🔥" label="Avg Engagement" value={`${analytics?.avgEngagementRate || 0}%`} trend="+2.4%" up />
        <KPICard icon="👁" label="Total Impressions" value={formatNumber(analytics?.totalImpressions || 0)} trend="+12%" up />
        <KPICard icon="📅" label="Scheduled" value={String(scheduledCount)} trend="" up />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Posts */}
        <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
          <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Upcoming Posts</h2>
          <div className="space-y-3">
            {upcomingPosts.length === 0 && <p className="text-[#94a3b8] text-sm">No upcoming posts. Create one in the Scheduler.</p>}
            {upcomingPosts.map(post => (
              <div key={post.id} className="flex items-center justify-between p-3 bg-[#12131e] rounded-lg border border-[#2a2b3e] hover:border-[#6366f1]/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex gap-1 shrink-0">
                    {post.platforms.map(p => (
                      <span key={p} className="text-sm" title={PLATFORMS[p as Platform]?.name}>{PLATFORMS[p as Platform]?.icon}</span>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#f1f5f9] text-sm font-medium truncate">{post.title}</p>
                    <p className="text-[#94a3b8] text-xs">{formatDate(post.scheduled_at)}</p>
                  </div>
                </div>
                <StatusBadge status={post.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Platform Performance */}
        <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
          <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Platform Performance</h2>
          {platformStats.length === 0 && <p className="text-[#94a3b8] text-sm">No analytics data yet. Publish some posts to see performance.</p>}
          <div className="space-y-4">
            {platformStats.map(({ platform, avgER, posts: count }) => (
              <div key={platform} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[#f1f5f9]">
                    <span>{PLATFORMS[platform].icon}</span>
                    <span>{PLATFORMS[platform].name}</span>
                    <span className="text-[#94a3b8] text-xs">({count})</span>
                  </span>
                  <span className="text-[#f1f5f9] font-medium">{avgER.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#12131e] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(avgER / maxER) * 100}%`, backgroundColor: PLATFORMS[platform].color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
        <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Recent Activity</h2>
        <div className="space-y-0">
          {[
            { action: 'Post scheduled', detail: posts[0]?.title || 'New post', time: 'Recently', icon: '📅' },
            { action: 'Analytics updated', detail: 'Dashboard data refreshed', time: 'Just now', icon: '📊' },
            { action: 'Trends fetched', detail: 'Google + Reddit + X trends loaded', time: 'On page load', icon: '📈' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-[#2a2b3e] last:border-0">
              <span className="text-lg">{item.icon}</span>
              <div>
                <p className="text-[#f1f5f9] text-sm font-medium">{item.action}</p>
                <p className="text-[#94a3b8] text-xs">{item.detail}</p>
                <p className="text-[#94a3b8]/60 text-xs mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, trend, up }: { icon: string; label: string; value: string; trend: string; up: boolean }) {
  return (
    <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 hover:border-[#6366f1]/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${up ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {up ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#f1f5f9]">{value}</p>
      <p className="text-[#94a3b8] text-sm mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'text-amber-400 bg-amber-400/10',
    scheduled: 'text-blue-400 bg-blue-400/10',
    published: 'text-emerald-400 bg-emerald-400/10',
    failed: 'text-red-400 bg-red-400/10',
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`}>{status}</span>;
}

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
