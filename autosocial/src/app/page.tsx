import { scheduledPosts, analyticsEntries, analyticsData } from '@/lib/sample-data';
import { PLATFORMS } from '@/lib/platforms';
import type { Platform } from '@/lib/types';

export default function Dashboard() {
  const totalImpressions = analyticsEntries.reduce((sum, e) => sum + e.metrics.impressions, 0);
  const upcomingPosts = scheduledPosts.filter(p => p.status === 'scheduled').slice(0, 5);
  const platformStats = (['instagram', 'linkedin', 'twitter', 'pinterest', 'dribbble', 'gmb'] as Platform[]).map(p => {
    const entries = analyticsEntries.filter(e => e.platform === p);
    const avgER = entries.length ? entries.reduce((s, e) => s + e.metrics.engagementRate, 0) / entries.length : 0;
    return { platform: p, avgER, posts: entries.length };
  }).filter(p => p.posts > 0).sort((a, b) => b.avgER - a.avgER);

  const maxER = Math.max(...platformStats.map(p => p.avgER));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Dashboard</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Overview of your social media performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon="📊" label="Total Posts" value={analyticsData.summary.totalPosts.toString()} trend="+18%" up />
        <KPICard icon="🔥" label="Avg Engagement" value={`${analyticsData.summary.avgEngagementRate}%`} trend="+2.4%" up />
        <KPICard icon="👁" label="Total Impressions" value={formatNumber(totalImpressions)} trend="+12%" up />
        <KPICard icon="📅" label="Scheduled" value={upcomingPosts.length.toString()} trend="" up />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Posts */}
        <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
          <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Upcoming Posts</h2>
          <div className="space-y-3">
            {upcomingPosts.map(post => (
              <div key={post.id} className="flex items-center justify-between p-3 bg-[#12131e] rounded-lg border border-[#2a2b3e] hover:border-[#6366f1]/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex gap-1 shrink-0">
                    {post.platforms.map(p => (
                      <span key={p} className="text-sm" title={PLATFORMS[p].name}>{PLATFORMS[p].icon}</span>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#f1f5f9] text-sm font-medium truncate">{post.title}</p>
                    <p className="text-[#94a3b8] text-xs">{formatDate(post.scheduledAt)}</p>
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
          <div className="space-y-4">
            {platformStats.map(({ platform, avgER, posts }) => (
              <div key={platform} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[#f1f5f9]">
                    <span>{PLATFORMS[platform].icon}</span>
                    <span>{PLATFORMS[platform].name}</span>
                    <span className="text-[#94a3b8] text-xs">({posts} posts)</span>
                  </span>
                  <span className="text-[#f1f5f9] font-medium">{avgER.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#12131e] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(avgER / maxER) * 100}%`, backgroundColor: PLATFORMS[platform].color }}
                  />
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
            { action: 'Post scheduled', detail: 'Motion Design Principles for Web', time: '2 hours ago', icon: '📅' },
            { action: 'Post published', detail: 'Brand Identity Redesign — Before & After', time: '1 day ago', icon: '✅' },
            { action: 'Package exported', detail: '3 posts × 4 platforms', time: '2 days ago', icon: '📦' },
            { action: 'Content generated', detail: '5 Web Design Trends Dominating Q2 2026', time: '3 days ago', icon: '✨' },
            { action: 'Analytics updated', detail: 'Weekly report for Mar 22-28', time: '4 days ago', icon: '📊' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-[#2a2b3e] last:border-0">
              <div className="flex flex-col items-center">
                <span className="text-lg">{item.icon}</span>
                {i < 4 && <div className="w-px h-6 bg-[#2a2b3e] mt-1" />}
              </div>
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
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
