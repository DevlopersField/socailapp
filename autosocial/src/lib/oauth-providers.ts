import 'server-only';

/**
 * OAuth 2.0 provider configurations for social platform connections.
 *
 * Setup (one-time per platform):
 *   1. Create a developer app on the platform
 *   2. Set redirect URI to: {APP_URL}/api/auth/{platform}/callback
 *   3. Add client ID + secret to .env.local
 *
 * Users just click "Connect" → login on the platform → done.
 */

export interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  /** Extra params to add to the auth URL */
  extraAuthParams?: Record<string, string>;
  /** How to extract user info from the token response or a profile call */
  profileUrl?: string;
  /** Setup guide for creating the developer app */
  setupGuide: string;
  setupUrl: string;
}

export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    // Instagram uses Facebook OAuth
    authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'],
    profileUrl: 'https://graph.instagram.com/v21.0/me?fields=id,username,media_count',
    setupGuide: 'Create a Facebook App → Add Instagram Graph API product → Add your redirect URI',
    setupUrl: 'https://developers.facebook.com/apps/',
  },

  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['openid', 'profile', 'w_member_social'],
    profileUrl: 'https://api.linkedin.com/v2/userinfo',
    setupGuide: 'Create a LinkedIn App → Add Sign In with LinkedIn → Set redirect URI',
    setupUrl: 'https://www.linkedin.com/developers/apps',
  },

  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    color: '#BD081C',
    authUrl: 'https://www.pinterest.com/oauth/',
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    scopes: ['boards:read', 'pins:read', 'pins:write', 'user_accounts:read'],
    profileUrl: 'https://api.pinterest.com/v5/user_account',
    setupGuide: 'Create a Pinterest App → Set redirect URI → Copy App ID and Secret',
    setupUrl: 'https://developers.pinterest.com/apps/',
  },

  reddit: {
    id: 'reddit',
    name: 'Reddit',
    icon: '🟠',
    color: '#FF4500',
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    scopes: ['identity', 'read', 'submit', 'mysubreddits'],
    extraAuthParams: { duration: 'permanent', response_type: 'code' },
    profileUrl: 'https://oauth.reddit.com/api/v1/me',
    setupGuide: 'Create a Reddit App (web app type) → Set redirect URI → Copy client ID and secret',
    setupUrl: 'https://www.reddit.com/prefs/apps',
  },

  dribbble: {
    id: 'dribbble',
    name: 'Dribbble',
    icon: '🏀',
    color: '#EA4C89',
    authUrl: 'https://dribbble.com/oauth/authorize',
    tokenUrl: 'https://dribbble.com/oauth/token',
    scopes: ['public', 'upload'],
    profileUrl: 'https://api.dribbble.com/v2/user',
    setupGuide: 'Register a Dribbble Application → Set callback URL → Copy Client ID and Secret',
    setupUrl: 'https://dribbble.com/account/applications',
  },

  google: {
    id: 'google',
    name: 'Google My Business',
    icon: '📍',
    color: '#4285F4',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/business.manage', 'openid', 'profile'],
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
    profileUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    setupGuide: 'Create a Google Cloud project → Enable Business Profile API → Create OAuth credentials',
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
  },
};

/**
 * Get the OAuth client credentials from environment variables.
 * Pattern: {PLATFORM}_CLIENT_ID and {PLATFORM}_CLIENT_SECRET
 */
export function getOAuthCredentials(platformId: string): { clientId: string; clientSecret: string } | null {
  const envPrefix = platformId.toUpperCase();
  const clientId = process.env[`${envPrefix}_CLIENT_ID`];
  const clientSecret = process.env[`${envPrefix}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** Get the callback URL for a platform */
export function getCallbackUrl(platformId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/${platformId}/callback`;
}

/** Build the full OAuth authorization URL */
export function buildAuthUrl(platformId: string, state: string): string | null {
  const provider = OAUTH_PROVIDERS[platformId];
  const creds = getOAuthCredentials(platformId);
  if (!provider || !creds) return null;

  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: getCallbackUrl(platformId),
    scope: provider.scopes.join(' '),
    state,
    response_type: 'code',
    ...provider.extraAuthParams,
  });

  return `${provider.authUrl}?${params.toString()}`;
}
