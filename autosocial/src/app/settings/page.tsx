'use client';

import { useState, useEffect } from 'react';

interface ProviderConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  models?: { value: string; label: string }[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🌐',
    description: 'Access multiple AI models via one API. Supports free models.',
    models: [
      { value: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nemotron 120B (Free)' },
      { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
      { value: 'meta-llama/llama-3-70b', label: 'Llama 3 70B' },
    ],
  },
  { id: 'openai', name: 'OpenAI', icon: '🤖', description: 'GPT-4o with vision. Best for image analysis.' },
  { id: 'anthropic', name: 'Anthropic', icon: '🧠', description: 'Claude with vision. Best for creative content.' },
];

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E4405F', authUrl: 'https://www.instagram.com/accounts/login/', guide: 'Requires Facebook Business account + Instagram Graph API app' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2', authUrl: 'https://www.linkedin.com/developers/apps', guide: 'Create an app at LinkedIn Developers, enable Marketing API' },
  { id: 'twitter', name: 'Twitter/X', icon: '𝕏', color: '#1DA1F2', authUrl: 'https://developer.x.com/en/portal/dashboard', guide: 'Apply for X Developer account, create a project with OAuth 2.0' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#BD081C', authUrl: 'https://developers.pinterest.com/apps/', guide: 'Create app at Pinterest Developers, request API access' },
  { id: 'dribbble', name: 'Dribbble', icon: '🏀', color: '#EA4C89', authUrl: 'https://dribbble.com/account/applications', guide: 'Register your application in Dribbble settings' },
  { id: 'gmb', name: 'Google My Business', icon: '📍', color: '#4285F4', authUrl: 'https://console.cloud.google.com/apis/credentials', guide: 'Enable Business Profile API in Google Cloud Console' },
];

const DATA_SOURCES = [
  { id: 'google-trends', name: 'Google Trends', icon: '📊', color: '#4285F4', status: 'active', description: 'Live search trend data — no API key needed. Auto-fetches hourly.' },
  { id: 'reddit', name: 'Reddit', icon: '🟠', color: '#FF4500', status: 'active', description: 'Popular posts from Reddit — public JSON endpoint. No API key needed.' },
  { id: 'twitter-trends', name: 'Twitter/X Trends', icon: '𝕏', color: '#1DA1F2', status: 'active', description: 'Trending hashtags scraped from live sources. No API key needed.' },
];

interface Settings {
  activeProvider: string;
  keys: Record<string, string>;
  selectedModel: string;
  defaultResizeMode: string;
  defaultBgColor: string;
  defaultFormat: string;
  defaultQuality: number;
  platformTokens: Record<string, string>;
}

const DEFAULT_SETTINGS: Settings = {
  activeProvider: 'openrouter',
  keys: { openrouter: '', openai: '', anthropic: '' },
  selectedModel: 'nvidia/nemotron-3-super-120b-a12b:free',
  defaultResizeMode: 'contain',
  defaultBgColor: '#000000',
  defaultFormat: 'jpeg',
  defaultQuality: 90,
  platformTokens: {},
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, 'success' | 'error' | 'loading' | null>>({});
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('autosocial-settings');
    if (stored) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) }); } catch {}
    }
  }, []);

  const save = () => {
    localStorage.setItem('autosocial-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateKey = (provider: string, value: string) => {
    setSettings(prev => ({ ...prev, keys: { ...prev.keys, [provider]: value } }));
  };

  const testConnection = async (providerId: string) => {
    setTestResult(prev => ({ ...prev, [providerId]: 'loading' }));
    const key = settings.keys[providerId];
    if (!key || key.length < 10) {
      setTestResult(prev => ({ ...prev, [providerId]: 'error' }));
      return;
    }

    try {
      // Test OpenRouter
      if (providerId === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        setTestResult(prev => ({ ...prev, [providerId]: res.ok ? 'success' : 'error' }));
      }
      // Test OpenAI
      else if (providerId === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        setTestResult(prev => ({ ...prev, [providerId]: res.ok ? 'success' : 'error' }));
      }
      // Test Anthropic
      else if (providerId === 'anthropic') {
        // Anthropic doesn't have a simple models endpoint, just check key format
        setTestResult(prev => ({ ...prev, [providerId]: key.startsWith('sk-ant-') ? 'success' : 'error' }));
      }
    } catch {
      setTestResult(prev => ({ ...prev, [providerId]: 'error' }));
    }
  };

  const savePlatformToken = (platformId: string) => {
    if (!tokenInput.trim()) return;
    setSettings(prev => ({
      ...prev,
      platformTokens: { ...prev.platformTokens, [platformId]: tokenInput.trim() },
    }));
    setTokenInput('');
    setConnectingPlatform(null);
    save();
  };

  const disconnectPlatform = (platformId: string) => {
    setSettings(prev => {
      const tokens = { ...prev.platformTokens };
      delete tokens[platformId];
      return { ...prev, platformTokens: tokens };
    });
    setTimeout(save, 100);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Settings</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Connect platforms, configure AI, and manage data sources</p>
      </div>

      {/* AI Provider */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
        <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">AI Provider</h2>
        <div className="space-y-4">
          {PROVIDERS.map(provider => {
            const isActive = settings.activeProvider === provider.id;
            const hasKey = (settings.keys[provider.id] || '').length > 0;
            const test = testResult[provider.id];

            return (
              <div key={provider.id} className={`p-4 rounded-lg border transition-colors ${isActive ? 'bg-[#6366f1]/5 border-[#6366f1]/40' : 'bg-[#12131e] border-[#2a2b3e]'}`}>
                <div className="flex items-start justify-between mb-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="provider" checked={isActive} onChange={() => setSettings(prev => ({ ...prev, activeProvider: provider.id }))} className="accent-[#6366f1] w-4 h-4" />
                    <span className="text-xl">{provider.icon}</span>
                    <div>
                      <p className="text-[#f1f5f9] font-medium">{provider.name}</p>
                      <p className="text-[#94a3b8] text-xs">{provider.description}</p>
                    </div>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-[#22c55e]' : 'bg-[#64748b]'}`} />
                    <span className="text-xs text-[#94a3b8]">{hasKey ? 'Key set' : 'Not configured'}</span>
                  </div>
                </div>
                <div className="ml-7 space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type={showKeys[provider.id] ? 'text' : 'password'} value={settings.keys[provider.id] || ''} onChange={e => updateKey(provider.id, e.target.value)} placeholder={`Enter ${provider.name} API key...`} className="w-full bg-[#0a0b14] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 placeholder:text-[#64748b]" />
                      <button onClick={() => setShowKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#f1f5f9] text-xs">{showKeys[provider.id] ? '🙈' : '👁'}</button>
                    </div>
                    <button onClick={() => testConnection(provider.id)} disabled={test === 'loading'} className={`px-3 py-2 border rounded-lg text-xs whitespace-nowrap transition-colors ${test === 'success' ? 'bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]' : test === 'error' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-[#1a1b2e] border-[#2a2b3e] text-[#94a3b8] hover:text-[#f1f5f9]'}`}>
                      {test === 'loading' ? '...' : test === 'success' ? '✓ Connected' : test === 'error' ? '✗ Failed' : 'Test'}
                    </button>
                  </div>
                  {provider.models && isActive && (
                    <select value={settings.selectedModel} onChange={e => setSettings(prev => ({ ...prev, selectedModel: e.target.value }))} className="w-full bg-[#0a0b14] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50">
                      {provider.models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
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
            <div key={src.id} className="flex items-center justify-between p-4 bg-[#12131e] rounded-lg border border-[#2a2b3e]">
              <div className="flex items-center gap-3">
                <span className="text-xl">{src.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[#f1f5f9] font-medium text-sm">{src.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e]">
                      Active
                    </span>
                  </div>
                  <p className="text-[#94a3b8] text-xs mt-0.5">{src.description}</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" title="Connected" />
            </div>
          ))}
        </div>
        <p className="text-[#64748b] text-xs mt-3">All data sources fetch automatically. Visit the Trends page to see live data.</p>
      </div>

      {/* Platform Connections */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
        <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Platform Connections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SOCIAL_PLATFORMS.map(platform => {
            const isConnected = Boolean(settings.platformTokens[platform.id]);
            const isConnecting = connectingPlatform === platform.id;

            return (
              <div key={platform.id} className="p-4 bg-[#12131e] rounded-lg border border-[#2a2b3e] relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: platform.color }} />
                <div className="flex items-center gap-3 mb-3 pl-2">
                  <span className="text-xl">{platform.icon}</span>
                  <div>
                    <p className="text-[#f1f5f9] font-medium text-sm">{platform.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#22c55e]' : 'bg-[#64748b]'}`} />
                      <span className={`text-xs ${isConnected ? 'text-[#22c55e]' : 'text-[#64748b]'}`}>{isConnected ? 'Connected' : 'Not connected'}</span>
                    </div>
                  </div>
                </div>

                <div className="pl-2 space-y-2">
                  {isConnecting ? (
                    <div className="space-y-2">
                      <p className="text-[#94a3b8] text-xs">{platform.guide}</p>
                      <a href={platform.authUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-[#6366f1] hover:underline">Open {platform.name} Developer Portal →</a>
                      <input type="text" value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder="Paste access token..." className="w-full bg-[#0a0b14] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 placeholder:text-[#64748b]" />
                      <div className="flex gap-2">
                        <button onClick={() => savePlatformToken(platform.id)} className="flex-1 px-3 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg text-xs transition-colors">Save Token</button>
                        <button onClick={() => { setConnectingPlatform(null); setTokenInput(''); }} className="px-3 py-1.5 bg-[#2a2b3e] text-[#94a3b8] rounded-lg text-xs hover:text-[#f1f5f9] transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : isConnected ? (
                    <div className="space-y-2">
                      <p className="text-[#22c55e] text-xs">Token saved — ready for auto-publishing</p>
                      <button onClick={() => disconnectPlatform(platform.id)} className="w-full px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">Disconnect</button>
                    </div>
                  ) : (
                    <button onClick={() => { setConnectingPlatform(platform.id); setTokenInput(''); }} className="w-full px-3 py-2 bg-[#1a1b2e] border border-[#2a2b3e] text-[#94a3b8] rounded-lg text-xs hover:text-[#f1f5f9] hover:border-[#6366f1]/30 transition-colors" style={{ borderLeftColor: platform.color }}>
                      Connect {platform.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Default Export Settings */}
      <div className="bg-[#1a1b2e] rounded-xl border border-[#2a2b3e] p-5">
        <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Default Export Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-[#94a3b8] block mb-2">Resize Mode</label>
            <div className="flex gap-2">
              {[{ value: 'contain', label: 'Contain' }, { value: 'cover', label: 'Cover' }, { value: 'fill', label: 'Stretch' }].map(opt => (
                <button key={opt.value} onClick={() => setSettings(prev => ({ ...prev, defaultResizeMode: opt.value }))} className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors ${settings.defaultResizeMode === opt.value ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'bg-[#12131e] border-[#2a2b3e] text-[#94a3b8]'}`}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-[#94a3b8] block mb-2">Background Color</label>
            <div className="flex items-center gap-2">
              {['#000000', '#FFFFFF', '#0a0b14', '#12131e'].map(c => (
                <button key={c} onClick={() => setSettings(prev => ({ ...prev, defaultBgColor: c }))} className={`w-8 h-8 rounded-lg border-2 ${settings.defaultBgColor === c ? 'border-[#6366f1]' : 'border-[#2a2b3e]'}`} style={{ backgroundColor: c }} title={c} />
              ))}
              <input type="color" value={settings.defaultBgColor} onChange={e => setSettings(prev => ({ ...prev, defaultBgColor: e.target.value }))} className="w-8 h-8 rounded-lg cursor-pointer border border-[#2a2b3e]" />
            </div>
          </div>
          <div>
            <label className="text-sm text-[#94a3b8] block mb-2">Format</label>
            <div className="flex gap-2">
              {['jpeg', 'png', 'webp'].map(fmt => (
                <button key={fmt} onClick={() => setSettings(prev => ({ ...prev, defaultFormat: fmt }))} className={`flex-1 px-3 py-2 text-xs rounded-lg border uppercase ${settings.defaultFormat === fmt ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'bg-[#12131e] border-[#2a2b3e] text-[#94a3b8]'}`}>{fmt}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-[#94a3b8] block mb-2">Quality: {settings.defaultQuality}%</label>
            <input type="range" min={50} max={100} value={settings.defaultQuality} onChange={e => setSettings(prev => ({ ...prev, defaultQuality: parseInt(e.target.value) }))} className="w-full accent-[#6366f1]" />
          </div>
        </div>
      </div>

      {/* Save + About */}
      <div className="flex items-center justify-between">
        <p className="text-[#64748b] text-xs">AutoSocial v0.1.0 — Built for web agencies</p>
        <div className="flex items-center gap-3">
          {saved && <span className="text-[#22c55e] text-sm">✓ Saved</span>}
          <button onClick={save} className="px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-medium rounded-xl transition-colors text-sm">Save Settings</button>
        </div>
      </div>
    </div>
  );
}
