'use client';

import { useState, useCallback, useRef } from 'react';
import { PLATFORMS } from '@/lib/platforms';
import type { Platform } from '@/lib/types';
import { apiUpload } from '@/lib/api';

type ResizeMode = 'contain' | 'cover' | 'fill';
type OutputFormat = 'jpeg' | 'png' | 'webp';
type Orientation = 'landscape' | 'portrait' | 'square';

interface BrainResult {
  success: boolean;
  outputId: string;
  original: { width: number; height: number; format: string; sizeKB: number; orientation: string; aspectRatio: string };
  resizeSettings: { mode: string; bgColor: string; quality: number; format: string };
  analysis: { subject: string; industry: string; mood: string; contentType: string; detectedText: string };
  titles: { hook: string; value: string; curiosity: string };
  captions: Record<string, string>;
  hashtags: Record<string, string[]>;
  strategy: { bestTime: string; bestDay: string; contentTip: string };
  images: { platform: Platform; spec: string; orientation: Orientation; width: number; height: number; sizeKB: number; filename: string; url: string }[];
  automated?: { contentGenerated: boolean; imagesResized: number; postCreated: boolean; scheduled: boolean; jobsCreated: number };
  post?: { id: string };
}

const ORIENTATION_ICONS: Record<string, string> = { landscape: '🖼', portrait: '📱', square: '⬜' };

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
  const [resizeMode, setResizeMode] = useState<ResizeMode>('contain');
  const [bgColor, setBgColor] = useState('#000000');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg');
  const [quality, setQuality] = useState(90);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [autoSchedule, setAutoSchedule] = useState(true);
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
    formData.append('resizeMode', resizeMode);
    formData.append('bgColor', bgColor);
    formData.append('quality', quality.toString());
    formData.append('format', outputFormat);
    formData.append('scheduledAt', new Date(scheduleDate).toISOString());
    formData.append('autoSchedule', autoSchedule.toString());

    try {
      const res = await apiUpload('/api/automate', formData);
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

            {/* Image Settings */}
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#f1f5f9]">Image Settings</h3>

              {/* Resize Mode */}
              <div>
                <label className="text-xs text-[#94a3b8] block mb-2">Resize Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['contain', 'Contain', 'No crop — adds padding'],
                    ['cover', 'Cover', 'Fills area — may crop'],
                    ['fill', 'Stretch', 'Exact size — distorts'],
                  ] as const).map(([value, label, desc]) => (
                    <button
                      key={value}
                      onClick={() => setResizeMode(value)}
                      className={`p-2 rounded-lg border text-left transition-colors ${resizeMode === value ? 'bg-[#6366f1]/10 border-[#6366f1]/50' : 'bg-[#12131e] border-[#2a2b3e] hover:border-[#6366f1]/20'}`}
                    >
                      <span className={`text-xs font-medium block ${resizeMode === value ? 'text-[#6366f1]' : 'text-[#f1f5f9]'}`}>{label}</span>
                      <span className="text-[10px] text-[#64748b] block mt-0.5">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color — only for contain mode */}
              {resizeMode === 'contain' && (
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-2">Background Fill</label>
                  <div className="flex items-center gap-2">
                    {[
                      ['#000000', 'Black'],
                      ['#FFFFFF', 'White'],
                      ['#0a0b14', 'Dark'],
                      ['#12131e', 'Surface'],
                    ].map(([color, label]) => (
                      <button
                        key={color}
                        onClick={() => setBgColor(color)}
                        title={label}
                        className={`w-7 h-7 rounded-md border-2 transition-colors ${bgColor === color ? 'border-[#6366f1]' : 'border-[#2a2b3e]'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={bgColor}
                      onChange={e => setBgColor(e.target.value)}
                      className="w-7 h-7 rounded-md cursor-pointer border border-[#2a2b3e] bg-transparent"
                      title="Custom color"
                    />
                    <span className="text-[10px] text-[#64748b] ml-1">{bgColor}</span>
                  </div>
                </div>
              )}

              {/* Format + Quality row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-2">Format</label>
                  <div className="flex gap-1.5">
                    {(['jpeg', 'png', 'webp'] as const).map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => setOutputFormat(fmt)}
                        className={`flex-1 py-1.5 text-xs rounded-md border transition-colors uppercase ${outputFormat === fmt ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'bg-[#12131e] border-[#2a2b3e] text-[#94a3b8]'}`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-2">Quality: {quality}%</label>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={quality}
                    onChange={e => setQuality(parseInt(e.target.value))}
                    className="w-full accent-[#6366f1]"
                  />
                </div>
              </div>
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

            {/* Scheduling */}
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[#f1f5f9]">Scheduling</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={autoSchedule} onChange={e => setAutoSchedule(e.target.checked)} className="w-4 h-4 accent-[#6366f1] rounded" />
                <div>
                  <span className="text-sm text-[#f1f5f9]">Auto-schedule for all platforms</span>
                  <p className="text-[10px] text-[#64748b]">Post will be created and scheduled automatically</p>
                </div>
              </label>
              {autoSchedule && (
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-1.5">Schedule Date & Time</label>
                  <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50" />
                </div>
              )}
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
              ) : autoSchedule ? (
                <>🚀 Generate & Schedule</>
              ) : (
                <>🧠 Generate Content</>
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
          {/* Automation Success Banner */}
          {result.automated && (
            <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <p className="text-[#22c55e] font-semibold">Automation Complete!</p>
                    <p className="text-[#94a3b8] text-sm">
                      Content generated • {result.automated.imagesResized} images resized
                      {result.automated.scheduled && ' • Post scheduled'}
                      {result.automated.jobsCreated > 0 && ` • ${result.automated.jobsCreated} platform jobs queued`}
                    </p>
                  </div>
                </div>
                <a href="/scheduler" className="px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white text-sm rounded-lg transition-colors">View in Calendar →</a>
              </div>
            </div>
          )}

          {/* Analysis + Original */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
              <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">🔍 Image Analysis</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ['Subject', result.analysis?.subject],
                  ['Industry', result.analysis?.industry],
                  ['Mood', result.analysis?.mood],
                  ['Type', result.analysis?.contentType],
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
                  <dd className="text-[#f1f5f9]">{result.strategy?.bestTime}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#94a3b8]">Best Day</dt>
                  <dd className="text-[#f1f5f9]">{result.strategy?.bestDay}</dd>
                </div>
              </dl>
              <p className="text-[#94a3b8] text-xs mt-3 p-2 bg-[#12131e] rounded-lg">{result.strategy?.contentTip}</p>
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
                ['Hook', result.titles?.hook, '🪝'],
                ['Value', result.titles?.value, '💎'],
                ['Curiosity', result.titles?.curiosity, '❓'],
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
                {result.captions?.[activeTab] || 'No caption generated for this platform.'}
              </div>
              <button
                onClick={() => copyToClipboard(result.captions?.[activeTab] || '', `caption-${activeTab}`)}
                className="absolute top-3 right-3 px-2 py-1 bg-[#1a1b2e] text-[#6366f1] text-xs rounded hover:bg-[#2a2b3e] transition-colors"
              >
                {copiedField === `caption-${activeTab}` ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            {/* Hashtags for active platform */}
            {result.hashtags?.[activeTab]?.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#94a3b8] text-xs">Hashtags ({result.hashtags?.[activeTab].length})</span>
                  <button
                    onClick={() => copyToClipboard(result.hashtags?.[activeTab].join(' '), `hashtags-${activeTab}`)}
                    className="text-xs text-[#6366f1] hover:text-[#4f46e5]"
                  >
                    {copiedField === `hashtags-${activeTab}` ? '✓ Copied' : 'Copy All'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags?.[activeTab].map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-[#6366f1]/10 text-[#6366f1] text-xs rounded-md">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resized Images — grouped by orientation */}
          <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#f1f5f9]">📐 Resized Images</h3>
              <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                <span className="px-2 py-0.5 bg-[#12131e] rounded">Mode: {result.resizeSettings?.mode || resizeMode}</span>
                <span className="px-2 py-0.5 bg-[#12131e] rounded">{result.original.orientation} source</span>
                <span className="px-2 py-0.5 bg-[#12131e] rounded">{result.original.aspectRatio}</span>
              </div>
            </div>
            {(['landscape', 'portrait', 'square'] as const).map(orientation => {
              const imgs = result.images.filter(img => img.orientation === orientation);
              if (imgs.length === 0) return null;
              return (
                <div key={orientation} className="mb-4 last:mb-0">
                  <h4 className="text-xs font-medium text-[#94a3b8] mb-2 flex items-center gap-1.5">
                    <span>{ORIENTATION_ICONS[orientation]}</span>
                    <span className="capitalize">{orientation}</span>
                    <span className="text-[#64748b]">({imgs.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {imgs.map((img, i) => (
                      <div key={i} className="p-3 bg-[#12131e] rounded-lg border border-[#2a2b3e] group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span>{PLATFORMS[img.platform].icon}</span>
                            <span className="text-[#f1f5f9] text-xs font-medium">{PLATFORMS[img.platform].name}</span>
                          </div>
                          <span className="text-[10px] text-[#64748b] px-1.5 py-0.5 bg-[#0a0b14] rounded capitalize">{img.orientation}</span>
                        </div>
                        <div className="bg-[#0a0b14] rounded-md mb-2 flex items-center justify-center overflow-hidden" style={{ aspectRatio: `${img.width}/${img.height}`, maxHeight: '120px' }}>
                          <img src={img.url} alt={img.filename} className="w-full h-full object-contain rounded-md" />
                        </div>
                        <p className="text-[#94a3b8] text-xs">{img.width}×{img.height} • {img.sizeKB} KB</p>
                        <p className="text-[#64748b] text-xs truncate">{img.spec.replace(/_/g, ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
