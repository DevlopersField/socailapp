import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';
import { OAUTH_PROVIDERS, getOAuthCredentials, buildAuthUrl } from '@/lib/oauth-providers';
import { randomBytes } from 'crypto';

type RouteContext = { params: Promise<{ platform: string }> };

/**
 * POST /api/auth/:platform
 *
 * Returns the OAuth authorization URL. The frontend redirects to it.
 * Uses POST so it can carry the auth token in the Authorization header.
 *
 * Returns: { url: "https://linkedin.com/oauth/..." } or { error, setup }
 *
 * Also sets httpOnly cookies for CSRF state + user ID so the callback
 * can verify the flow and associate the connection.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { platform } = await params;

    // Validate platform
    if (!OAUTH_PROVIDERS[platform]) {
      return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
    }

    // Check auth via Bearer token
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if OAuth credentials are configured
    const creds = getOAuthCredentials(platform);
    if (!creds) {
      return NextResponse.json({
        error: `${OAUTH_PROVIDERS[platform].name} is not configured yet. Add OAuth credentials to .env.local`,
        notConfigured: true,
        setup: {
          guide: OAUTH_PROVIDERS[platform].setupGuide,
          url: OAUTH_PROVIDERS[platform].setupUrl,
          envVars: [`${platform.toUpperCase()}_CLIENT_ID`, `${platform.toUpperCase()}_CLIENT_SECRET`],
        },
      }, { status: 200 }); // 200 so frontend can show setup info
    }

    // Generate state token for CSRF protection
    const state = randomBytes(32).toString('hex');

    // Build the auth URL
    const authUrl = buildAuthUrl(platform, state);
    if (!authUrl) {
      return NextResponse.json({ error: 'Failed to build auth URL' }, { status: 500 });
    }

    // Return URL + set cookies for callback verification
    const response = NextResponse.json({ url: authUrl });

    response.cookies.set(`oauth_state_${platform}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
      path: '/',
    });

    response.cookies.set('oauth_user', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error(`[OAuth] Init failed:`, error);
    return NextResponse.json({ error: 'OAuth initialization failed' }, { status: 500 });
  }
}
