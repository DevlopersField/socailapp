import type { Platform } from './types';

export const PLATFORMS: Record<Platform, { name: string; icon: string; color: string; bgColor: string }> = {
  instagram: { name: 'Instagram', icon: '📸', color: '#E4405F', bgColor: 'bg-pink-500/10' },
  linkedin: { name: 'LinkedIn', icon: '💼', color: '#0A66C2', bgColor: 'bg-blue-500/10' },
  twitter: { name: 'Twitter/X', icon: '𝕏', color: '#1DA1F2', bgColor: 'bg-sky-500/10' },
  pinterest: { name: 'Pinterest', icon: '📌', color: '#BD081C', bgColor: 'bg-red-500/10' },
  dribbble: { name: 'Dribbble', icon: '🏀', color: '#EA4C89', bgColor: 'bg-rose-500/10' },
  gmb: { name: 'Google My Business', icon: '📍', color: '#4285F4', bgColor: 'bg-indigo-500/10' },
};
