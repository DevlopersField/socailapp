import 'server-only';
import { NextRequest } from 'next/server';

/**
 * CSRF protection for mutation endpoints.
 *
 * Uses the Origin/Referer header check pattern (recommended by OWASP).
 * All POST/PUT/DELETE requests must originate from the same origin.
 *
 * This is effective because:
 * - Browsers always send Origin on cross-origin requests
 * - Attackers cannot forge Origin headers from a browser
 * - API clients (non-browser) don't need CSRF protection
 */

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'https://autosocial.app',
  'https://www.autosocial.app',
]);

export function validateCsrf(request: NextRequest): boolean {
  const method = request.method.toUpperCase();

  // GET/HEAD/OPTIONS are safe methods — no CSRF check needed
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  // Check for CRON_SECRET on scheduler endpoints (machine-to-machine)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ') && process.env.CRON_SECRET) {
    const token = authHeader.replace('Bearer ', '');
    if (token === process.env.CRON_SECRET) return true;
  }

  // Check Origin header first (most reliable)
  const origin = request.headers.get('origin');
  if (origin) {
    // In development, allow localhost
    if (origin.startsWith('http://localhost:')) return true;
    return ALLOWED_ORIGINS.has(origin);
  }

  // Fallback to Referer header
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin.startsWith('http://localhost:')) return true;
      return ALLOWED_ORIGINS.has(refererOrigin);
    } catch {
      return false;
    }
  }

  // If neither Origin nor Referer is present, it could be:
  // - A direct API call (curl, Postman) — allow these since they have auth tokens
  // - A privacy-stripping browser — unlikely for same-origin
  // Allow if there's a valid auth header (API client pattern)
  if (authHeader?.startsWith('Bearer ')) return true;

  return false;
}
