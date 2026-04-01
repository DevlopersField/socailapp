import { NextRequest, NextResponse } from 'next/server';
import { OAUTH_PROVIDERS, getOAuthCredentials, getCallbackUrl } from '@/lib/oauth-providers';
import { getServerSupabase } from '@/lib/supabase-server';

type RouteContext = { params: Promise<{ platform: string }> };

/**
 * GET /api/auth/:platform/callback
 *
 * OAuth callback handler. The platform redirects here after user authorizes.
 * Exchanges the authorization code for an access token, fetches profile,
 * stores the connection, and redirects to /connect.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { platform } = await params;
    const { searchParams } = new URL(request.url);

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle user denial
    if (error) {
      return NextResponse.redirect(new URL(`/connect?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/connect?error=missing_code', request.url));
    }

    // Validate platform
    const provider = OAUTH_PROVIDERS[platform];
    if (!provider) {
      return NextResponse.redirect(new URL('/connect?error=unknown_platform', request.url));
    }

    // Verify state (CSRF protection)
    const storedState = request.cookies.get(`oauth_state_${platform}`)?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(new URL('/connect?error=invalid_state', request.url));
    }

    // Get user ID from cookie
    const userId = request.cookies.get('oauth_user')?.value;
    if (!userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get credentials
    const creds = getOAuthCredentials(platform);
    if (!creds) {
      return NextResponse.redirect(new URL('/connect?error=not_configured', request.url));
    }

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(platform, code, creds, provider);
    if (!tokenData) {
      return NextResponse.redirect(new URL('/connect?error=token_exchange_failed', request.url));
    }

    // Fetch user profile from the platform
    const profile = provider.profileUrl
      ? await fetchProfile(provider.profileUrl, tokenData.access_token, platform)
      : null;

    // Store connection in database using service role (callback has no user session)
    const supabase = getServerSupabase();
    const { error: dbError } = await supabase.from('platform_connections').upsert({
      user_id: userId,
      platform: platform === 'google' ? 'gmb' : platform,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      account_name: profile?.username || profile?.name || profile?.login || null,
      account_id: profile?.id?.toString() || null,
      status: 'connected',
    }, { onConflict: 'user_id,platform' });

    if (dbError) {
      console.error(`[OAuth] DB save failed for ${platform}:`, dbError);
      return NextResponse.redirect(new URL('/connect?error=save_failed', request.url));
    }

    // Clean up cookies and redirect to connect page with success
    const response = NextResponse.redirect(new URL(`/connect?connected=${platform}`, request.url));
    response.cookies.delete(`oauth_state_${platform}`);
    response.cookies.delete('oauth_user');
    return response;
  } catch (error) {
    console.error(`[OAuth] Callback error:`, error);
    return NextResponse.redirect(new URL('/connect?error=callback_failed', request.url));
  }
}

async function exchangeCodeForToken(
  platform: string,
  code: string,
  creds: { clientId: string; clientSecret: string },
  provider: { tokenUrl: string }
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number } | null> {
  try {
    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: getCallbackUrl(platform),
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
    };

    // Reddit uses Basic Auth for token exchange
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    };

    if (platform === 'reddit') {
      headers['Authorization'] = `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')}`;
      delete body.client_id;
      delete body.client_secret;
    }

    const res = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers,
      body: new URLSearchParams(body).toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[OAuth] Token exchange failed for ${platform}: ${res.status}`, errText);
      return null;
    }

    const data = await res.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  } catch (err) {
    console.error(`[OAuth] Token exchange error for ${platform}:`, err);
    return null;
  }
}

async function fetchProfile(
  profileUrl: string,
  accessToken: string,
  platform: string
): Promise<Record<string, unknown> | null> {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    };

    // Reddit needs a User-Agent
    if (platform === 'reddit') {
      headers['User-Agent'] = 'AutoSocial/1.0';
    }

    // Instagram needs token as query param
    const url = platform === 'instagram'
      ? `${profileUrl}&access_token=${accessToken}`
      : profileUrl;

    const res = await fetch(url, {
      headers: platform === 'instagram' ? undefined : headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
