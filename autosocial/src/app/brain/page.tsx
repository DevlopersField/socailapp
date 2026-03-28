'use client';

import { useState, useCallback, useRef } from 'react';
import { PLATFORMS } from '@/lib/platforms';
import type { Platform } from '@/lib/types';

interface BrainResult {
  success: boolean;
  outputId: string;
  original: { width: number; height: number; format: string; sizeKB: number };
  analysis: { subject: string; industry: string; mood: string; contentType: string; detectedText: string };
  titles: { hook: string; value: string; curiosity: string };
  captions: Record<string, string>;
  hashtags: Record<string, string[]>;
  strategy: { bestTime: string; bestDay: string; contentTip: string };
  images: { platform: Platform; spec: string; width: number; height: number; sizeKB: number; filename: string; url: string }[];
}

export default function BrainPage() {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BrainResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Platform>('instagram');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    if (context.trim()) formData.append('context', context.trim());

    try {
      const res = await fetch('/api/brain', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Processing failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const allPlatforms = Object.keys(PLATFORMS) as Platform[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f1f5f9]">🧠 Brain</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Upload one image — get everything for all 6 platforms automatically</p>
      </div>

      {/* Upload Zone */}
      {!result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-10 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 min-h-[300px] ${
                dragOver
                  ? 'border-[#6366f1] bg-[#6366f1]/10'
                  : preview
                    ? 'border-[#22c55e]/40 bg-[#1a1b2e]'
                    : 'border-[#2a2b3e] bg-[#1a1b2e] hover:border-[#6366f1]/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-[250px] rounded-lg object-contain" />
              ) : (
                <>
                  <span className="text-5xl mb-4">📸</span>
                  <p className="text-[#f1f5f9] font-medium">Drop your image here</p>
                  <p className="text-[#94a3b8] text-sm mt-1">or click to browse — JPEG, PNG, WebP, GIF (max 10MB)</p>
                </>
              )}
            </div>

            {file && (
              <div className="mt-3 flex items-center justify-between px-2">
                <span className="text-[#94a3b8] text-xs">{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                <button onClick={() => { setFile(null); setPreview(null); }} className="text-xs text-red-400 hover:text-red-300">Remove</button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
              <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">Additional Context (optional)</h3>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="e.g. 'This is a case study for our fintech client' or 'Promoting our new branding package'..."
                className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-3 text-sm min-h-[100px] placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 resize-none"
              />
            </div>

            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
              <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">What Brain will generate</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#94a3b8]">
                {[
                  ['🎯', '3 title variations'],
                  ['📝', '6 platform captions'],
                  ['#️⃣', 'Platform-specific hashtags'],
                  ['📐', '7 resized images'],
                  ['📊', 'Posting strategy'],
                  ['🔍', 'Image analysis'],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-2 p-2 bg-[#12131e] rounded-lg">
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!file || loading}
              className="w-full py-3.5 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>🧠 Generate Everything</>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Analysis + Original */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
              <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">🔍 Image Analysis</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ['Subject', result.analysis.subject],
                  ['Industry', result.analysis.industry],
                  ['Mood', result.analysis.mood],
                  ['Type', result.analysis.contentType],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-[#94a3b8]">{label}</dt>
                    <dd className="text-[#f1f5f9] text-right capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
              <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">📊 Strategy</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#94a3b8]">Best Time</dt>
                  <dd className="text-[#f1f5f9]">{result.strategy.bestTime}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#94a3b8]">Best Day</dt>
                  <dd className="text-[#f1f5f9]">{result.strategy.bestDay}</dd>
                </div>
              </dl>
              <p className="text-[#94a3b8] text-xs mt-3 p-2 bg-[#12131e] rounded-lg">{result.strategy.contentTip}</p>
            </div>

            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
              <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">📸 Original</h3>
              {preview && <img src={preview} alt="Original" className="w-full h-32 object-contain rounded-lg mb-2" />}
              <p className="text-[#94a3b8] text-xs">{result.original.width}×{result.original.height} • {result.original.format.toUpperCase()} • {result.original.sizeKB} KB</p>
            </div>
          </div>

          {/* Titles */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
            <h3 className="text-lg font-semibold text-[#f1f5f9] mb-4">🎯 Titles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                ['Hook', result.titles.hook, '🪝'],
                ['Value', result.titles.value, '💎'],
                ['Curiosity', result.titles.curiosity, '❓'],
              ].map(([type, title, icon]) => (
                <div key={type} className="p-3 bg-[#12131e] rounded-lg border border-[#2a2b3e] group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#94a3b8] text-xs">{icon} {type}</span>
                    <button onClick={() => copyToClipboard(title, `title-${type}`)} className="text-xs text-[#6366f1] opacity-0 group-hover:opacity-100 transition-opacity">
                      {copiedField === `title-${type}` ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[#f1f5f9] text-sm font-medium">{title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Captions */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
            <h3 className="text-lg font-semibold text-[#f1f5f9] mb-4">📝 Captions</h3>
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {allPlatforms.map(p => (
                <button
                  key={p}
                  onClick={() => setActiveTab(p)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg whitespace-nowrap transition-colors ${activeTab === p ? 'text-white' : 'bg-[#12131e] text-[#94a3b8] hover:text-[#f1f5f9]'}`}
                  style={activeTab === p ? { backgroundColor: PLATFORMS[p].color } : {}}
                >
                  <span>{PLATFORMS[p].icon}</span>
                  <span>{PLATFORMS[p].name}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <div className="p-4 bg-[#12131e] rounded-lg border border-[#2a2b3e] min-h-[120px] whitespace-pre-wrap text-[#f1f5f9] text-sm leading-relaxed">
                {result.captions[activeTab] || 'No caption generated for this platform.'}
              </div>
              <button
                onClick={() => copyToClipboard(result.captions[activeTab] || '', `caption-${activeTab}`)}
                className="absolute top-3 right-3 px-2 py-1 bg-[#1a1b2e] text-[#6366f1] text-xs rounded hover:bg-[#2a2b3e] transition-colors"
              >
                {copiedField === `caption-${activeTab}` ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            {/* Hashtags for active platform */}
            {result.hashtags[activeTab]?.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#94a3b8] text-xs">Hashtags ({result.hashtags[activeTab].length})</span>
                  <button
                    onClick={() => copyToClipboard(result.hashtags[activeTab].join(' '), `hashtags-${activeTab}`)}
                    className="text-xs text-[#6366f1] hover:text-[#4f46e5]"
                  >
                    {copiedField === `hashtags-${activeTab}` ? '✓ Copied' : 'Copy All'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags[activeTab].map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-[#6366f1]/10 text-[#6366f1] text-xs rounded-md">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resized Images */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
            <h3 className="text-lg font-semibold text-[#f1f5f9] mb-4">📐 Resized Images</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {result.images.map((img, i) => (
                <div key={i} className="p-3 bg-[#12131e] rounded-lg border border-[#2a2b3e]">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{PLATFORMS[img.platform].icon}</span>
                    <span className="text-[#f1f5f9] text-xs font-medium">{PLATFORMS[img.platform].name}</span>
                  </div>
                  <div className="bg-[#0a0b14] rounded-md mb-2 flex items-center justify-center" style={{ aspectRatio: `${img.width}/${img.height}`, maxHeight: '120px' }}>
                    <img src={img.url} alt={img.filename} className="w-full h-full object-cover rounded-md" />
                  </div>
                  <p className="text-[#94a3b8] text-xs">{img.width}×{img.height} • {img.sizeKB} KB</p>
                  <p className="text-[#64748b] text-xs truncate">{img.spec.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { setResult(null); setFile(null); setPreview(null); setContext(''); }}
              className="px-5 py-2.5 bg-[#1a1b2e] border border-[#2a2b3e] text-[#f1f5f9] rounded-xl text-sm hover:bg-[#2a2b3e] transition-colors"
            >
              Upload New Image
            </button>
            <button className="px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl text-sm transition-colors">
              Schedule All Posts
            </button>
            <button className="px-5 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl text-sm transition-colors">
              Export Package
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
