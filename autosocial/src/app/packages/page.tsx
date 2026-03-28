'use client';

import { useState } from 'react';
import { scheduledPosts } from '@/lib/sample-data';
import { PLATFORMS } from '@/lib/platforms';
import type { Platform } from '@/lib/types';

export default function PackagesPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<'files' | 'zip' | 'json'>('files');
  const [includes, setIncludes] = useState({ captions: true, hashtags: true, notes: true, specs: true });
  const [platformFilter, setPlatformFilter] = useState<Set<Platform>>(new Set(['instagram', 'linkedin', 'twitter']));
  const [generated, setGenerated] = useState(false);

  const togglePost = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === scheduledPosts.length) setSelected(new Set());
    else setSelected(new Set(scheduledPosts.map(p => p.id)));
  };

  const togglePlatform = (p: Platform) => {
    const next = new Set(platformFilter);
    next.has(p) ? next.delete(p) : next.add(p);
    setPlatformFilter(next);
  };

  const toggleInclude = (key: keyof typeof includes) => {
    setIncludes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedPosts = scheduledPosts.filter(p => selected.has(p.id));
  const packageFiles = selectedPosts.flatMap(post =>
    post.platforms
      .filter(p => platformFilter.has(p))
      .map(platform => {
        const date = new Date(post.scheduledAt).toISOString().slice(0, 10);
        const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
        const folder = `${date}_${platform}_${slug}`;
        const files: string[] = [];
        if (includes.captions) files.push('caption.txt');
        if (includes.hashtags) files.push('hashtags.txt');
        if (includes.notes) files.push('posting-notes.txt');
        if (includes.specs) files.push('image-specs.txt');
        return { folder, files, platform, title: post.title };
      })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Post Packages</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Generate ready-to-post content packages for each platform</p>
      </div>

      {/* Select Posts */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f1f5f9]">Select Posts</h2>
          <button onClick={toggleAll} className="text-xs text-[#6366f1] hover:text-[#4f46e5] transition-colors">
            {selected.size === scheduledPosts.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="space-y-2">
          {scheduledPosts.map(post => (
            <label key={post.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected.has(post.id) ? 'bg-[#6366f1]/10 border-[#6366f1]/40' : 'bg-[#12131e] border-[#2a2b3e] hover:border-[#2a2b3e]/80'}`}>
              <input type="checkbox" checked={selected.has(post.id)} onChange={() => togglePost(post.id)} className="w-4 h-4 accent-[#6366f1] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[#f1f5f9] text-sm font-medium truncate">{post.title}</p>
                <p className="text-[#94a3b8] text-xs">{new Date(post.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {post.platforms.map(p => (
                  <span key={p} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: PLATFORMS[p].color + '20', color: PLATFORMS[p].color }}>{PLATFORMS[p].name}</span>
                ))}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Package Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Export Format */}
        <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
          <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">Export Format</h3>
          <div className="flex gap-2">
            {([['files', 'Individual Files'], ['zip', 'ZIP Bundle'], ['json', 'JSON Export']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setFormat(key)} className={`px-3 py-2 text-xs rounded-lg border transition-colors ${format === key ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'bg-[#12131e] border-[#2a2b3e] text-[#94a3b8] hover:text-[#f1f5f9]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Include */}
        <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
          <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">Include</h3>
          <div className="grid grid-cols-2 gap-2">
            {([['captions', 'Captions'], ['hashtags', 'Hashtags'], ['notes', 'Posting Notes'], ['specs', 'Image Specs']] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs text-[#94a3b8] cursor-pointer">
                <input type="checkbox" checked={includes[key]} onChange={() => toggleInclude(key)} className="accent-[#6366f1]" />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Platform Filter */}
        <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
          <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">Platforms</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PLATFORMS) as Platform[]).map(p => (
              <button key={p} onClick={() => togglePlatform(p)} className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${platformFilter.has(p) ? 'border-opacity-60 text-white' : 'bg-[#12131e] border-[#2a2b3e] text-[#94a3b8]'}`} style={platformFilter.has(p) ? { backgroundColor: PLATFORMS[p].color + '30', borderColor: PLATFORMS[p].color } : {}}>
                {PLATFORMS[p].icon} {PLATFORMS[p].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      {selected.size > 0 && (
        <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
          <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Package Preview</h2>
          <div className="bg-[#12131e] rounded-lg border border-[#2a2b3e] p-4 font-mono text-sm">
            <div className="text-[#f59e0b]">📦 packages/</div>
            {packageFiles.map(({ folder, files, platform }, i) => (
              <div key={i} className="ml-4">
                <div className="text-[#6366f1]">📁 {folder}/</div>
                {files.map(f => (
                  <div key={f} className="ml-4 text-[#94a3b8]">📄 {f}</div>
                ))}
              </div>
            ))}
          </div>
          <p className="text-[#94a3b8] text-xs mt-3">
            {selected.size} post{selected.size !== 1 ? 's' : ''} × {platformFilter.size} platform{platformFilter.size !== 1 ? 's' : ''} = {packageFiles.length} package{packageFiles.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Generate */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setGenerated(true)}
          disabled={selected.size === 0}
          className="px-6 py-3 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm"
        >
          Generate Package 📦
        </button>
        {generated && (
          <div className="flex items-center gap-3 px-4 py-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl">
            <span className="text-[#22c55e] text-sm font-medium">✓ Package generated! {packageFiles.length} files ready</span>
            <button className="px-3 py-1 bg-[#22c55e] text-white text-xs rounded-lg hover:bg-[#16a34a] transition-colors">Download</button>
          </div>
        )}
      </div>

      {/* Package History */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] overflow-hidden">
        <div className="p-5 border-b border-[#2a2b3e]">
          <h2 className="text-lg font-semibold text-[#f1f5f9]">Package History</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2b3e]">
              <th className="text-left text-[#94a3b8] font-medium px-5 py-3">Date</th>
              <th className="text-left text-[#94a3b8] font-medium px-5 py-3">Posts</th>
              <th className="text-left text-[#94a3b8] font-medium px-5 py-3">Platforms</th>
              <th className="text-left text-[#94a3b8] font-medium px-5 py-3">Format</th>
              <th className="text-right text-[#94a3b8] font-medium px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {[
              { date: 'Mar 27, 2026', posts: 3, platforms: 'IG, LI, TW', format: 'ZIP' },
              { date: 'Mar 24, 2026', posts: 5, platforms: 'All', format: 'Files' },
              { date: 'Mar 20, 2026', posts: 2, platforms: 'LI, DR', format: 'JSON' },
            ].map((row, i) => (
              <tr key={i} className="border-b border-[#2a2b3e] last:border-0 hover:bg-[#12131e]/50 transition-colors">
                <td className="px-5 py-3 text-[#f1f5f9]">{row.date}</td>
                <td className="px-5 py-3 text-[#f1f5f9]">{row.posts}</td>
                <td className="px-5 py-3 text-[#94a3b8]">{row.platforms}</td>
                <td className="px-5 py-3 text-[#94a3b8]">{row.format}</td>
                <td className="px-5 py-3 text-right"><button className="text-[#6366f1] hover:text-[#4f46e5] text-xs">Re-download</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
