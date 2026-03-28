'use client';

import { useState, useMemo } from 'react';
import { scheduledPosts } from '@/lib/sample-data';
import { PLATFORMS } from '@/lib/platforms';
import type { Post, Platform } from '@/lib/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0=Mon … 6=Sun (ISO weekday minus 1) */
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1;
}

function formatTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  draft: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  published: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  failed: 'text-red-400 bg-red-500/10 border-red-500/30',
};

// Week hours shown in week view
const WEEK_HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 – 20:00

// ── Post pill ────────────────────────────────────────────────────────────────

function PostPill({
  post,
  onClick,
  selected,
}: {
  post: Post;
  onClick: () => void;
  selected: boolean;
}) {
  const primary = post.platforms[0] as Platform;
  const platformColor = PLATFORMS[primary]?.color ?? '#6366f1';
  return (
    <button
      onClick={onClick}
      style={{ borderLeftColor: platformColor }}
      className={`w-full text-left px-2 py-1.5 rounded-md border-l-2 text-xs font-medium truncate transition-all ${
        selected
          ? 'bg-indigo-600/20 text-white ring-1 ring-indigo-500/50'
          : 'bg-[#12131e] text-[#94a3b8] hover:bg-[#12131e]/80 hover:text-[#f1f5f9]'
      }`}
      title={post.title}
    >
      <span className="mr-1">{PLATFORMS[primary]?.icon}</span>
      <span className="truncate">{post.title}</span>
    </button>
  );
}

// ── Post detail sidebar ──────────────────────────────────────────────────────

function PostDetailPanel({
  post,
  onClose,
}: {
  post: Post;
  onClose: () => void;
}) {
  return (
    <aside className="w-[320px] flex-shrink-0 bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 flex flex-col gap-5 self-start sticky top-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#f1f5f9] leading-snug">{post.title}</h3>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-[#12131e] border border-[#2a2b3e] text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Status */}
      <div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border capitalize ${
            STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
          }`}
        >
          {post.status}
        </span>
      </div>

      {/* Scheduled time */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Scheduled</p>
        <div className="flex items-center gap-2 text-sm text-[#f1f5f9]">
          <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDateTime(post.scheduledAt)}
        </div>
      </div>

      {/* Platforms */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Platforms</p>
        <div className="flex flex-wrap gap-2">
          {post.platforms.map((p) => (
            <div
              key={p}
              className="flex items-center gap-1.5 bg-[#12131e] border border-[#2a2b3e] rounded-lg px-2.5 py-1.5"
            >
              <span className="text-sm">{PLATFORMS[p as Platform]?.icon}</span>
              <span className="text-xs text-[#94a3b8] font-medium">
                {PLATFORMS[p as Platform]?.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Caption preview */}
      {post.platforms[0] && post.content[post.platforms[0] as Platform] && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">
            Caption Preview
          </p>
          <div className="bg-[#12131e] rounded-lg border border-[#2a2b3e] p-3">
            <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-4">
              {post.content[post.platforms[0] as Platform]!.caption.slice(0, 180)}
              {post.content[post.platforms[0] as Platform]!.caption.length > 180 ? '…' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Content type */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Type</p>
        <span className="text-xs capitalize text-[#f1f5f9] bg-[#12131e] border border-[#2a2b3e] rounded-md px-2.5 py-1 w-fit">
          {post.contentType.replace('-', ' ')}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1 border-t border-[#2a2b3e]">
        <button className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all text-center">
          Edit Post
        </button>
        <div className="flex gap-2">
          <button className="flex-1 py-2 px-3 rounded-lg bg-[#12131e] hover:bg-[#0a0b14] border border-[#2a2b3e] hover:border-amber-500/40 text-amber-400 text-sm font-medium transition-all">
            Reschedule
          </button>
          <button className="flex-1 py-2 px-3 rounded-lg bg-[#12131e] hover:bg-[#0a0b14] border border-[#2a2b3e] hover:border-red-500/40 text-red-400 text-sm font-medium transition-all">
            Delete
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── New post modal ────────────────────────────────────────────────────────────

function NewPostModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1a1b2e] border border-[#2a2b3e] rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#f1f5f9]">New Post</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#12131e] border border-[#2a2b3e] text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-5 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#f1f5f9] mb-2">Title</label>
            <input
              type="text"
              placeholder="Post title…"
              className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-3 text-sm placeholder-[#94a3b8]/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#f1f5f9] mb-2">Schedule Date & Time</label>
            <input
              type="datetime-local"
              defaultValue="2026-03-28T10:00"
              className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[#12131e] border border-[#2a2b3e] text-[#94a3b8] hover:text-[#f1f5f9] text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <a
            href="/content"
            className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all text-center"
          >
            Create in Editor
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SchedulerPage() {
  // Today: March 28 2026
  const today = new Date(2026, 2, 28); // month is 0-indexed
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // March = 2
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);

  // Current week: Mon of week containing today
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date(today);
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon
    d.setDate(d.getDate() - day);
    return d;
  });

  // Navigation
  function prevPeriod() {
    if (viewMode === 'month') {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
      else setCurrentMonth(m => m - 1);
    } else {
      const d = new Date(weekStart);
      d.setDate(d.getDate() - 7);
      setWeekStart(d);
    }
  }

  function nextPeriod() {
    if (viewMode === 'month') {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
      else setCurrentMonth(m => m + 1);
    } else {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 7);
      setWeekStart(d);
    }
  }

  function goToToday() {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const d = new Date(today);
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day);
    setWeekStart(d);
  }

  // Map posts to date strings
  const postsByDate = useMemo(() => {
    const map: Record<string, Post[]> = {};
    scheduledPosts.forEach((post) => {
      const d = new Date(post.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(post);
    });
    return map;
  }, []);

  // Month grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOfMonth(currentYear, currentMonth); // 0=Mon
  const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;

  // Week days array
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const periodLabel =
    viewMode === 'month'
      ? `${MONTH_NAMES[currentMonth]} ${currentYear}`
      : (() => {
          const end = new Date(weekStart);
          end.setDate(end.getDate() + 6);
          return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        })();

  function isToday(year: number, month: number, day: number) {
    return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  }

  function getPostsForDay(year: number, month: number, day: number) {
    return postsByDate[`${year}-${month}-${day}`] ?? [];
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-[#f1f5f9] font-sans">
      {/* Header */}
      <div className="border-b border-[#2a2b3e] bg-[#12131e]">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#f1f5f9]">Content Calendar</h1>
            <p className="text-sm text-[#94a3b8] mt-0.5">
              {scheduledPosts.length} posts scheduled across {Object.keys(postsByDate).length} days
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-[#1a1b2e] border border-[#2a2b3e] rounded-lg p-1">
              {(['month', 'week'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                    viewMode === mode
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 bg-[#1a1b2e] border border-[#2a2b3e] rounded-lg p-1">
              <button
                onClick={prevPeriod}
                className="w-8 h-8 flex items-center justify-center rounded-md text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#2a2b3e]/50 transition-all"
                aria-label="Previous"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm font-semibold text-[#f1f5f9] min-w-[160px] text-center hover:text-indigo-400 transition-colors"
              >
                {periodLabel}
              </button>
              <button
                onClick={nextPeriod}
                className="w-8 h-8 flex items-center justify-center rounded-md text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#2a2b3e]/50 transition-all"
                aria-label="Next"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* New post */}
            <button
              onClick={() => setShowNewPost(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Post
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1400px] mx-auto px-6 py-6 flex gap-6">
        {/* Calendar area */}
        <div className="flex-1 min-w-0">

          {/* Month view */}
          {viewMode === 'month' && (
            <div className="bg-[#12131e] rounded-xl border border-[#2a2b3e] overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-[#2a2b3e]">
                {DAY_NAMES.map((d) => (
                  <div
                    key={d}
                    className="py-3 text-center text-xs font-semibold text-[#94a3b8] uppercase tracking-wider"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: totalCells }, (_, i) => {
                  const dayNum = i - firstDayOffset + 1;
                  const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
                  const today_ = isCurrentMonth && isToday(currentYear, currentMonth, dayNum);
                  const posts = isCurrentMonth ? getPostsForDay(currentYear, currentMonth, dayNum) : [];
                  const col = i % 7;
                  const isLastRow = i >= totalCells - 7;

                  return (
                    <div
                      key={i}
                      className={`min-h-[110px] p-2 flex flex-col gap-1.5 border-b border-r border-[#2a2b3e] ${
                        !isLastRow ? '' : 'border-b-0'
                      } ${col === 6 ? 'border-r-0' : ''} ${
                        !isCurrentMonth ? 'bg-[#0a0b14]/40' : 'bg-[#1a1b2e]'
                      } ${today_ ? 'ring-inset ring-2 ring-indigo-500' : ''}`}
                    >
                      {/* Date number */}
                      <span
                        className={`text-xs font-semibold self-start w-6 h-6 flex items-center justify-center rounded-full ${
                          today_
                            ? 'bg-indigo-600 text-white'
                            : isCurrentMonth
                            ? 'text-[#f1f5f9]'
                            : 'text-[#94a3b8]/40'
                        }`}
                      >
                        {isCurrentMonth ? dayNum : ''}
                      </span>

                      {/* Post pills */}
                      {posts.slice(0, 3).map((post) => (
                        <PostPill
                          key={post.id}
                          post={post}
                          onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                          selected={selectedPost?.id === post.id}
                        />
                      ))}

                      {/* Overflow indicator */}
                      {posts.length > 3 && (
                        <span className="text-xs text-[#94a3b8] px-1">
                          +{posts.length - 3} more
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week view */}
          {viewMode === 'week' && (
            <div className="bg-[#12131e] rounded-xl border border-[#2a2b3e] overflow-hidden">
              {/* Day header row */}
              <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[#2a2b3e]">
                <div className="py-3" />
                {weekDays.map((d, i) => {
                  const isToday_ = isToday(d.getFullYear(), d.getMonth(), d.getDate());
                  return (
                    <div
                      key={i}
                      className={`py-3 text-center border-l border-[#2a2b3e] ${isToday_ ? 'bg-indigo-600/10' : ''}`}
                    >
                      <p className={`text-xs font-medium ${isToday_ ? 'text-indigo-400' : 'text-[#94a3b8]'}`}>
                        {DAY_NAMES[i]}
                      </p>
                      <p
                        className={`text-base font-bold mt-0.5 ${
                          isToday_ ? 'text-indigo-400' : 'text-[#f1f5f9]'
                        }`}
                      >
                        {d.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Time rows */}
              <div className="overflow-y-auto max-h-[600px]">
                {WEEK_HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[#2a2b3e]/50"
                  >
                    {/* Time label */}
                    <div className="py-3 px-2 text-right">
                      <span className="text-xs text-[#94a3b8]/60 font-medium">
                        {hour < 10 ? `0${hour}` : hour}:00
                      </span>
                    </div>

                    {weekDays.map((d, di) => {
                      const dayPosts = getPostsForDay(d.getFullYear(), d.getMonth(), d.getDate()).filter((p) => {
                        const h = new Date(p.scheduledAt).getHours();
                        return h === hour;
                      });
                      const isToday_ = isToday(d.getFullYear(), d.getMonth(), d.getDate());

                      return (
                        <div
                          key={di}
                          className={`min-h-[52px] p-1 border-l border-[#2a2b3e] flex flex-col gap-1 ${
                            isToday_ ? 'bg-indigo-600/5' : ''
                          }`}
                        >
                          {dayPosts.map((post) => {
                            const primary = post.platforms[0] as Platform;
                            const color = PLATFORMS[primary]?.color ?? '#6366f1';
                            return (
                              <button
                                key={post.id}
                                onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                                style={{ borderLeftColor: color, backgroundColor: `${color}18` }}
                                className={`w-full text-left px-2 py-2 rounded-md border-l-2 text-xs transition-all hover:brightness-110 ${
                                  selectedPost?.id === post.id
                                    ? 'ring-1 ring-indigo-500/50'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span>{PLATFORMS[primary]?.icon}</span>
                                  <span className="font-medium text-[#94a3b8]">
                                    {formatTime(post.scheduledAt)}
                                  </span>
                                </div>
                                <p className="text-[#f1f5f9] font-medium truncate leading-snug">
                                  {post.title}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {selectedPost ? (
          <PostDetailPanel
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        ) : (
          <aside className="w-[280px] flex-shrink-0 bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 self-start sticky top-6">
            <h3 className="text-sm font-semibold text-[#f1f5f9] mb-4">Upcoming Posts</h3>
            <div className="flex flex-col gap-2">
              {scheduledPosts
                .filter((p) => p.status === 'scheduled' || p.status === 'draft')
                .slice(0, 6)
                .map((post) => {
                  const primary = post.platforms[0] as Platform;
                  const color = PLATFORMS[primary]?.color ?? '#6366f1';
                  return (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="w-full text-left bg-[#12131e] border border-[#2a2b3e] rounded-lg p-3 hover:border-indigo-500/40 transition-colors group"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#f1f5f9] truncate group-hover:text-indigo-300 transition-colors">
                            {post.title}
                          </p>
                          <p className="text-xs text-[#94a3b8] mt-0.5">
                            {new Date(post.scheduledAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            · {formatTime(post.scheduledAt)}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5">
                            {post.platforms.slice(0, 3).map((p) => (
                              <span key={p} className="text-xs">{PLATFORMS[p as Platform]?.icon}</span>
                            ))}
                            {post.platforms.length > 3 && (
                              <span className="text-xs text-[#94a3b8]">+{post.platforms.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>

            <div className="mt-5 pt-4 border-t border-[#2a2b3e]">
              <p className="text-xs text-[#94a3b8] text-center">
                Click any post on the calendar to view details
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* New post modal */}
      {showNewPost && <NewPostModal onClose={() => setShowNewPost(false)} />}
    </div>
  );
}
