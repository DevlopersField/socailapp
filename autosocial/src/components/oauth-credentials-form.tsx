'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import type { Platform } from '@/lib/database.types';

const PLATFORMS: { id: Platform; name: string; icon: string; color: string }[] = [
  { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E4405F' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
  { id: 'twitter', name: 'Twitter/X', icon: '𝕏', color: '#1DA1F2' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#BD081C' },
  { id: 'dribbble', name: 'Dribbble', icon: '🏀', color: '#EA4C89' },
  { id: 'gmb', name: 'Google My Business', icon: '📍', color: '#4285F4' },
];

interface OAuthCredentialsFormProps {
  platform: Platform;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OAuthCredentialsForm({ platform, onSuccess, onCancel }: OAuthCredentialsFormProps) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const platInfo = PLATFORMS.find(p => p.id === platform);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiPost('/api/oauth-credentials', {
        platform,
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save credentials');
      }

      setClientId('');
      setClientSecret('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1b2e] border border-[#2a2b3e] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{platInfo?.icon}</span>
        <div>
          <h3 className="text-lg font-semibold text-[#f1f5f9]">Add {platInfo?.name} Credentials</h3>
          <p className="text-xs text-[#64748b]">Paste your App ID and App Secret from the developer platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client ID */}
        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-2">
            {platform === 'linkedin' ? 'Client ID' : platform === 'gmb' ? 'Client ID' : 'App ID'}
          </label>
          <input
            type="password"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            placeholder="Paste your Client/App ID here"
            className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 placeholder:text-[#64748b]"
            required
          />
        </div>

        {/* Client Secret */}
        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-2">
            {platform === 'linkedin' ? 'Client Secret' : 'App Secret'}
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={e => setClientSecret(e.target.value)}
            placeholder="Paste your Client/App Secret here"
            className="w-full bg-[#12131e] border border-[#2a2b3e] text-[#f1f5f9] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 placeholder:text-[#64748b]"
            required
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Helper Text */}
        <div className="p-3 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-lg">
          <p className="text-xs text-[#a5b4fc]">
            💡 Your credentials are stored securely in your account. We never share them or store them in environment variables.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={!clientId || !clientSecret || loading}
            className="flex-1 px-4 py-2 bg-[#6366f1] text-white rounded-lg font-medium text-sm hover:bg-[#6366f1]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Credentials'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-[#2a2b3e] text-[#f1f5f9] rounded-lg font-medium text-sm hover:bg-[#3a3b4e] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
