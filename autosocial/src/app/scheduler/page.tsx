'use client';

import { useState, useEffect, useCallback } from 'react';
import { PLATFORMS } from '@/lib/platforms';
import type { Platform } from '@/lib/types';

interface Post {
  id: string;
  title: string;
  platforms: string[];
  scheduled_at: string;
  status: string;
  content_type: string;
  content: Record<string, { caption: string; hashtags: string[] }>;
}

const CONTENT_TYPES = ['case-study', 'knowledge', 'design', 'trend', 'promotion'];
const ALL_PLATFORMS: Platform[] = ['instagram', 'linkedin', 'twitter', 'pinterest', 'dribbble', 'gmb'];

export default function SchedulerPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('design');
  const [formPlatforms, setFormPlatforms] = useState<Set<Platform>>(new Set(['instagram', 'linkedin']));
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('11:00');
  const [formCaption, setFormCaption] = useState('');

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openNewPost = (date?: string) => {
    setEditingPost(null);
    setFormTitle(''); setFormType('design');
    setFormPlatforms(new Set(['instagram', 'linkedin']));
    setFormDate(date || new Date().toISOString().slice(0, 10));
    setFormTime('11:00'); setFormCaption('');
    setShowModal(true);
  };

  const openEditPost = (post: Post) => {
    setEditingPost(post);
    setFormTitle(post.title); setFormType(post.content_type);
    setFormPlatforms(new Set(post.platforms as Platform[]));
    const d = new Date(post.scheduled_at);
    setFormDate(d.toISOString().slice(0, 10));
    setFormTime(d.toTimeString().slice(0, 5));
    setFormCaption(Object.values(post.content || {})[0]?.caption || '');
    setShowModal(true);
  };

  const handleSave = async (asDraft: boolean) => {
    if (!formTitle.trim()) { showToast('Title is required', 'error'); return; }
    if (formPlatforms.size === 0) { showToast('Select at least one platform', 'error'); return; }
    const scheduledAt = new Date(`${formDate}T${formTime}:00Z`).toISOString();
    const content: Record<string, { caption: string; hashtags: string[] }> = {};
    formPlatforms.forEach(p => { content[p] = { caption: formCaption, hashtags: [] }; });
    try {
      if (editingPost) {
        await fetch(`/api/posts/${editingPost.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: formTitle, platforms: Array.from(formPlatforms), scheduledAt, status: asDraft ? 'draft' : 'scheduled', contentType: formType, content }) });
        showToast('Post updated', 'success');
      } else {
        await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: formTitle, platforms: Array.from(formPlatforms), scheduledAt, status: asDraft ? 'draft' : 'scheduled', contentType: formType, content }) });
        showToast(asDraft ? 'Draft saved' : 'Post scheduled', 'success');
      }
      setShowModal(false); fetchPosts();
    } catch { showToast('Failed to save post', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      showToast('Post deleted', 'success');
      setSelectedPost(null); fetchPosts();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/posts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      showToast(`Status: ${status}`, 'success'); fetchPosts();
    } catch { showToast('Failed to update', 'error'); }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getPostsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter(p => p.scheduled_at?.slice(0, 10) === dateStr);
  };
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  if (loading) return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-[#f1f5f9]">Content Calendar</h1></div>
      <div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }).map((_, i) => <div key={i} className="bg-[#1a1b2e] rounded-lg h-24 animate-pulse" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-[#22c55e] text-white' : 'bg-red-500 text-white'}`}>{toast.msg}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Content Calendar</h1>
          <p className="text-[#94a3b8] text-sm mt-1">{posts.length} posts — {posts.filter(p => p.status === 'scheduled').length} scheduled</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-[#12131e] rounded-lg p-1 border border-[#2a2b3e]">
            {(['month', 'week'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${view === v ? 'bg-[#6366f1] text-white' : 'text-[#94a3b8]'}`}>{v}</button>
            ))}
          </div>
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 text-[#94a3b8] hover:text-[#f1f5f9]">←</button>
          <span className="text-[#f1f5f9] text-sm font-medium w-36 text-center">{monthName}</span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 text-[#94a3b8] hover:text-[#f1f5f9]">→</button>
          <button onClick={() => openNewPost()} className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-lg">+ New Post</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-xs text-[#94a3b8] py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} className="bg-[#12131e]/50 rounded-lg min-h-[100px]" />;
              const dayPosts = getPostsForDay(day);
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return (
                <div key={day} onClick={() => openNewPost(dateStr)} className={`bg-[#1a1b2e] rounded-lg min-h-[100px] p-2 border cursor-pointer hover:border-[#6366f1]/30 ${isToday(day) ? 'border-[#6366f1]' : 'border-[#2a2b3e]'}`}>
                  <span className={`text-xs font-medium ${isToday(day) ? 'text-[#6366f1]' : 'text-[#94a3b8]'}`}>{day}</span>
                  <div className="mt-1 space-y-1">
                    {dayPosts.slice(0, 3).map(post => (
                      <div key={post.id} onClick={e => { e.stopPropagation(); setSelectedPost(post); }} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer hover:opacity-80" style={{ backgroundColor: PLATFORMS[post.platforms[0] as Platform]?.color + '20', color: PLATFORMS[post.platforms[0] as Platform]?.color }}>
                        <span>{PLATFORMS[post.platforms[0] as Platform]?.icon}</span>
                        <span className="truncate">{post.title}</span>
                      </div>
                    ))}
                    {dayPosts.length > 3 && <span className="text-[10px] text-[#64748b]">+{dayPosts.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {selectedPost ? (
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#f1f5f9]">Post Detail</h3>
                <button onClick={() => setSelectedPost(null)} className="text-[#94a3b8] text-xs">✕</button>
              </div>
              <p className="text-[#f1f5f9] font-medium text-sm mb-2">{selectedPost.title}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {selectedPost.platforms.map(p => (
                  <span key={p} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: PLATFORMS[p as Platform]?.color + '20', color: PLATFORMS[p as Platform]?.color }}>{PLATFORMS[p as Platform]?.icon} {PLATFORMS[p as Platform]?.name}</span>
                ))}
              </div>
              <div className="space-y-2 text-xs mb-4">
                <div className="flex justify-between"><span className="text-[#94a3b8]">Date</span><span className="text-[#f1f5f9]">{new Date(selectedPost.scheduled_at).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">Status</span><span className={`px-2 py-0.5 rounded-full ${selectedPost.status === 'scheduled' ? 'text-blue-400 bg-blue-400/10' : selectedPost.status === 'published' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'}`}>{selectedPost.status}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">Type</span><span className="text-[#f1f5f9] capitalize">{selectedPost.content_type?.replace('-', ' ')}</span></div>
              </div>
              <div className="space-y-2">
                <button onClick={() => openEditPost(selectedPost)} className="w-full py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs rounded-lg">Edit</button>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPost.status !== 'published' && <button onClick={() => handleStatusChange(selectedPost.id, 'published')} className="py-2 bg-[#22c55e]/10 text-[#22c55e] text-xs rounded-lg">Publish</button>}
                  <button onClick={() => handleDelete(selectedPost.id)} className="py-2 bg-red-500/10 text-red-400 text-xs rounded-lg">Delete</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 text-center">
              <p className="text-[#94a3b8] text-sm">Click a post to see details</p>
              <p className="text-[#64748b] text-xs mt-1">or click a day to create new</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#f1f5f9] mb-4">{editingPost ? 'Edit Post' : 'New Post'}</h2>
            <div className="space-y-4">
              <div><label className="text-xs text-[#94a3b8] block mb-1.5">Title</label><input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Post title..." className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 placeholder:text-[#64748b]" /></div>
              <div><label className="text-xs text-[#94a3b8] block mb-1.5">Content Type</label><div className="flex flex-wrap gap-1.5">{CONTENT_TYPES.map(t => (<button key={t} onClick={() => setFormType(t)} className={`px-3 py-1.5 text-xs rounded-lg border capitalize ${formType === t ? 'bg-[#6366f1]/10 border-[#6366f1]/50 text-[#6366f1]' : 'bg-[#12131e] border-[#2a2b3e] text-[#94a3b8]'}`}>{t.replace('-', ' ')}</button>))}</div></div>
              <div><label className="text-xs text-[#94a3b8] block mb-1.5">Platforms</label><div className="flex flex-wrap gap-1.5">{ALL_PLATFORMS.map(p => (<button key={p} onClick={() => { const n = new Set(formPlatforms); n.has(p) ? n.delete(p) : n.add(p); setFormPlatforms(n); }} className={`px-3 py-1.5 text-xs rounded-lg border ${formPlatforms.has(p) ? 'text-white' : 'bg-[#12131e] border-[#2a2b3e] text-[#94a3b8]'}`} style={formPlatforms.has(p) ? { backgroundColor: PLATFORMS[p].color + '30', borderColor: PLATFORMS[p].color } : {}}>{PLATFORMS[p].icon} {PLATFORMS[p].name}</button>))}</div></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-[#94a3b8] block mb-1.5">Date</label><input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50" /></div><div><label className="text-xs text-[#94a3b8] block mb-1.5">Time</label><input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50" /></div></div>
              <div><label className="text-xs text-[#94a3b8] block mb-1.5">Caption</label><textarea value={formCaption} onChange={e => setFormCaption(e.target.value)} placeholder="Write your caption..." rows={4} className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 resize-none placeholder:text-[#64748b]" /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleSave(true)} className="flex-1 py-2.5 bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] text-sm rounded-lg hover:bg-[#2a2b3e]">Save Draft</button>
                <button onClick={() => handleSave(false)} className="flex-1 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-lg">Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
