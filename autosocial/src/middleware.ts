import { NextRequest, NextResponse } from 'next/server';

/**
 * Global middleware for security headers + CSRF protection on API mutations.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ── Security Headers ──
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // ── CSRF Protection for API mutations ──
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const method = request.method.toUpperCase();

    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      // Check Origin header
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      const authHeader = request.headers.get('authorization');

      // Allow localhost in development
      const isLocalhost = (orig: string) => orig.startsWith('http://localhost:');

      let allowed = false;

      if (origin) {
        allowed = isLocalhost(origin) || origin === 'https://autosocial.app' || origin === 'https://www.autosocial.app';
      } else if (referer) {
        try {
          const refOrigin = new URL(referer).origin;
          allowed = isLocalhost(refOrigin) || refOrigin === 'https://autosocial.app';
        } catch { /* invalid referer */ }
      }

      // Allow if auth header present (API client / cron job)
      if (!allowed && authHeader?.startsWith('Bearer ')) {
        allowed = true;
      }

      if (!allowed) {
        return NextResponse.json(
          { error: 'Forbidden — invalid origin' },
          { status: 403 }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|brain-output).*)',
  ],
};
