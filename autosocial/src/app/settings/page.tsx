'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', icon: '🌐', description: 'Access multiple AI models via one API. Free models available.', keyField: 'openrouter_key' as const },
  { id: 'openai', name: 'OpenAI', icon: '🤖', description: 'GPT-4o with vision. Best for image analysis.', keyField: 'openai_key' as const },
  { id: 'anthropic', name: 'Anthropic', icon: '🧠', description: 'Claude with vision. Best for creative content.', keyField: 'anthropic_key' as const },
];

const MODELS = [
  { value: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nemotron 120B (Free)', provider: 'openrouter' },
  { value: 'qwen/qwen3-next-80b-a3b-instruct:free', label: 'Qwen3 80B (Free)', provider: 'openrouter' },
  { value: 'openai/gpt-oss-120b:free', label: 'GPT-OSS 120B (Free)', provider: 'openrouter' },
  { value: 'gpt-4o', label: 'GPT-4o (Vision)', provider: 'openai' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'anthropic' },
];

const DATA_SOURCES = [
  { name: 'Pinterest Trends', icon: '📌', color: '#BD081C', description: 'Trending pins and searches — live scraping' },
  { name: 'Instagram Trends', icon: '📸', color: '#E4405F', description: 'Trending topics via Google Trends + IG mapping' },
  { name: 'Reddit', icon: '🟠', color: '#FF4500', description: 'Popular posts — public JSON endpoint' },
];

interface UserSettings {
  ai_provider: string;
  ai_model: string;
  has_openrouter_key: boolean;
  has_openai_key: boolean;
  has_anthropic_key: boolean;
  openrouter_key_preview: string | null;
  openai_key_preview: string | null;
  anthropic_key_preview: string | null;
  default_resize_mode: string;
  default_bg_color: string;
  default_format: string;
  default_quality: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeProvider, setActiveProvider] = useState('openrouter');
  const [selectedModel, setSelectedModel] = useState('nvidia/nemotron-3-super-120b-a12b:free');
  const [keys, setKeys] = useState<Record<string, string>>({ openrouter_key: '', openai_key: '', anthropic_key: '' });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<Record<string, 'success' | 'error' | 'loading' | null>>({});
  const [resizeMode, setResizeMode] = useState('contain');
  const [bgColor, setBgColor] = useState('#000000');
  const [format, setFormat] = useState('jpeg');
  const [quality, setQuality] = useState(90);
  const [platformTokens, setPlatformTokens] = useState<Record<string, boolean>>({});

  useEffect(() => {
    apiGet('/api/user-settings').then(r => r.json()).then(data => {
      if (data.settings) {
        const s = data.settings;
        setSettings(s);
        setActiveProvider(s.ai_provider || 'openrouter');
        setSelectedModel(s.ai_model || 'nvidia/nemotron-3-super-120b-a12b:free');
        setResizeMode(s.default_resize_mode || 'contain');
        setBgColor(s.default_bg_color || '#000000');
        setFormat(s.default_format || 'jpeg');
        setQuality(s.default_quality || 90);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    // Load platform connections
    apiGet('/api/connections').then(r => r.json()).then(data => {
      const connected: Record<string, boolean> = {};
      (data.connections || []).forEach((c: { platform: string; status: string }) => {
        if (c.status === 'connected') connected[c.platform] = true;
      });
      setPlatformTokens(connected);
    }).catch(() => {});
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    const body: Record<string, unknown> = {
      ai_provider: activeProvider,
      ai_model: selectedModel,
      default_resize_mode: resizeMode,
      default_bg_color: bgColor,
      default_format: format,
      default_quality: quality,
    };
    // Only send keys if user typed a new one
    if (keys.openrouter_key) body.openrouter_key = keys.openrouter_key;
    if (keys.openai_key) body.openai_key = keys.openai_key;
    if (keys.anthropic_key) body.anthropic_key = keys.anthropic_key;

    try {
      const res = await apiPost('/api/user-settings', body);
      const data = await res.json();
      if (data.saved) {
        setSettings(data.settings);
        setKeys({ openrouter_key: '', openai_key: '', anthropic_key: '' }); // Clear inputs after save
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const testConnection = async (providerId: string) => {
    setTestResult(prev => ({ ...prev, [providerId]: 'loading' }));
    const keyField = PROVIDERS.find(p => p.id === providerId)?.keyField;
    const key = keys[keyField || ''] || '';

    if (!key && !settings?.[`has_${providerId}_key` as keyof UserSettings]) {
      setTestResult(prev => ({ ...prev, [providerId]: 'error' }));
      return;
    }

    // If no new key entered, check if saved key exists
    if (!key) {
      setTestResult(prev => ({ ...prev, [providerId]: settings?.[`has_${providerId}_key` as keyof UserSettings] ? 'success' : 'error' }));
      return;
    }

    // Validate through server-side proxy — never send keys to third-party from browser
    try {
      const res = await apiPost('/api/user-settings/test', { provider: providerId, apiKey: key });
      const data = await res.json();
      setTestResult(prev => ({ ...prev, [providerId]: data.valid ? 'success' : 'error' }));
    } catch {
      setTestResult(prev => ({ ...prev, [providerId]: 'error' }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div><h1 className="text-2xl font-bold text-[#f1f5f9]">Settings</h1></div>
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5 h-32 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Settings</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Your API keys are stored securely in the database — never exposed to the browser.</p>
      </div>

      {/* AI Provider */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
        <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">AI Provider</h2>
        <div className="space-y-4">
          {PROVIDERS.map(provider => {
            const isActive = activeProvider === provider.id;
            const hasKey = settings?.[`has_${provider.id}_key` as keyof UserSettings] as boolean;
            const hasNewKey = Boolean(keys[provider.keyField]);
            const preview = settings?.[`${provider.id}_key_preview` as keyof UserSettings] as string | null;
            const test = testResult[provider.id];

            return (
              <div key={provider.id} className={`p-4 rounded-lg border transition-colors ${isActive ? 'bg-[#6366f1]/5 border-[#6366f1]/40' : 'bg-[#12131e] border-[#2a2b3e]'}`}>
                <div className="flex items-start justify-between mb-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="provider" checked={isActive} onChange={() => setActiveProvider(provider.id)} className="accent-[#6366f1] w-4 h-4" />
                    <span className="text-xl">{provider.icon}</span>
                    <div>
                      <p className="text-[#f1f5f9] font-medium">{provider.name}</p>
                      <p className="text-[#94a3b8] text-xs">{provider.description}</p>
                    </div>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${hasKey || hasNewKey ? 'bg-[#22c55e]' : 'bg-[#64748b]'}`} />
                    <span className="text-xs text-[#94a3b8]">{hasKey ? `Key saved (${preview})` : hasNewKey ? 'Key entered' : 'No key'}</span>
                  </div>
                </div>
                <div className="ml-7 space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKeys[provider.id] ? 'text' : 'password'}
                        value={keys[provider.keyField]}
                        onChange={e => setKeys(prev => ({ ...prev, [provider.keyField]: e.target.value }))}
                        placeholder={hasKey ? `Current key: ${preview} (enter new to replace)` : `Enter ${provider.name} API key...`}
                        className="w-full bg-[#0a0b14] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 placeholder:text-[#64748b]"
                      />
                      <button onClick={() => setShowKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] text-xs">{showKeys[provider.id] ? '🙈' : '👁'}</button>
                    </div>
                    <button onClick={() => testConnection(provider.id)} disabled={test === 'loading'} className={`px-3 py-2 border rounded-lg text-xs whitespace-nowrap ${test === 'success' ? 'bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]' : test === 'error' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-[#1a1b2e] border-[#2a2b3e] text-[#94a3b8]'}`}>
                      {test === 'loading' ? '...' : test === 'success' ? '✓ Valid' : test === 'error' ? '✗ Invalid' : 'Test'}
                    </button>
                  </div>
                  {isActive && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={selectedModel}
                        onChange={e => setSelectedModel(e.target.value)}
                        placeholder="e.g. nvidia/nemotron-3-super-120b-a12b:free"
                        className="w-full bg-[#0a0b14] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 placeholder:text-[#64748b] font-mono"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {MODELS.filter(m => m.provider === provider.id).map(m => (
                          <button key={m.value} onClick={() => setSelectedModel(m.value)} className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${selectedModel === m.value ? 'bg-[#6366f1]/10 border-[#6366f1]/40 text-[#6366f1]' : 'bg-[#12131e] border-[#2a2b3e] text-[#64748b] hover:text-[#94a3b8]'}`}>{m.label}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
        <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Data Sources (Trends)</h2>
        <div className="space-y-3">
          {DATA_SOURCES.map(src => (
            <div key={src.name} className="flex items-center justify-between p-4 bg-[#12131e] rounded-lg border border-[#2a2b3e]">
              <div className="flex items-center gap-3">
                <span className="text-xl">{src.icon}</span>
                <div>
                  <p className="text-[#f1f5f9] font-medium text-sm flex items-center gap-2">{src.name} <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e]">Active</span></p>
                  <p className="text-[#94a3b8] text-xs">{src.description}</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
            </div>
          ))}
        </div>
      </div>

      {/* Platform Connections — managed in /connect */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#f1f5f9]">Platform Connections</h2>
            <p className="text-[#94a3b8] text-xs mt-1">Connect and manage all your social media accounts</p>
          </div>
          <a href="/connect" className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-lg transition-colors">
            Manage Connections →
          </a>
        </div>
      </div>

      {/* Export Defaults */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
        <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Default Export Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-[#94a3b8] block mb-2">Resize Mode</label>
            <div className="flex gap-2">
              {[{ v: 'contain', l: 'Contain' }, { v: 'cover', l: 'Cover' }, { v: 'fill', l: 'Stretch' }].map(o => (
                <button key={o.v} onClick={() => setResizeMode(o.v)} className={`flex-1 px-3 py-2 text-xs rounded-lg border ${resizeMode === o.v ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'bg-[#12131e] border-[#2a2b3e] text-[#94a3b8]'}`}>{o.l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-[#94a3b8] block mb-2">Background</label>
            <div className="flex items-center gap-2">
              {['#000000', '#FFFFFF', '#0a0b14'].map(c => (
                <button key={c} onClick={() => setBgColor(c)} className={`w-8 h-8 rounded-lg border-2 ${bgColor === c ? 'border-[#6366f1]' : 'border-[#2a2b3e]'}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border border-[#2a2b3e]" />
            </div>
          </div>
          <div>
            <label className="text-sm text-[#94a3b8] block mb-2">Format</label>
            <div className="flex gap-2">
              {['jpeg', 'png', 'webp'].map(f => (
                <button key={f} onClick={() => setFormat(f)} className={`flex-1 px-3 py-2 text-xs rounded-lg border uppercase ${format === f ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'bg-[#12131e] border-[#2a2b3e] text-[#94a3b8]'}`}>{f}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-[#94a3b8] block mb-2">Quality: {quality}%</label>
            <input type="range" min={50} max={100} value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full accent-[#6366f1]" />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        <p className="text-[#64748b] text-xs">AutoSocial v0.2.0 — Keys encrypted per-user in Supabase</p>
        <div className="flex items-center gap-3">
          {saved && <span className="text-[#22c55e] text-sm">✓ Saved</span>}
          <button onClick={saveSettings} disabled={saving} className="px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white font-medium rounded-xl text-sm">{saving ? 'Saving...' : 'Save Settings'}</button>
        </div>
      </div>
    </div>
  );
}
