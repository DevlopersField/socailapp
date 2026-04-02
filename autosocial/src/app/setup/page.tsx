'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [adminKey, setAdminKey] = useState('');

  const handleSetup = async () => {
    setStatus('loading');
    setMessage('Setting up database...');

    try {
      const res = await fetch('/api/admin/setup-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey: adminKey || 'dev-key',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(`Error: ${data.error}`);
        return;
      }

      setStatus('success');
      setMessage('✅ Database setup complete! You can now add OAuth credentials.');
    } catch (error) {
      setStatus('error');
      setMessage(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1e] to-[#1a1b2e] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1a1b2e] border border-[#2a2b3e] rounded-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#f1f5f9] mb-2">⚙️ Database Setup</h1>
          <p className="text-[#94a3b8] text-sm">Initialize the oauth_credentials table</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#f1f5f9] mb-2">
              Admin Key (optional)
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Leave empty for development"
              className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 placeholder:text-[#64748b]"
            />
          </div>

          <button
            onClick={handleSetup}
            disabled={status === 'loading'}
            className="w-full py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up...
              </>
            ) : (
              '🚀 Initialize Database'
            )}
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              status === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : status === 'error'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                  : 'bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1]'
            }`}
          >
            {message}
          </div>
        )}

        {status === 'success' && (
          <a
            href="/connect"
            className="block text-center py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-medium transition-colors"
          >
            → Go to Connect
          </a>
        )}

        <div className="p-3 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg">
          <p className="text-xs text-[#a5b4fc]">
            💡 This page creates the necessary database tables for OAuth credentials storage. Run this once during initial setup.
          </p>
        </div>
      </div>
    </div>
  );
}
