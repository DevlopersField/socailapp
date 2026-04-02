import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helpers';
import {
  getUserOAuthCredentialsList,
  saveUserOAuthCredentials,
  deleteUserOAuthCredentials,
} from '@/lib/oauth-credentials-simple';
import type { Platform } from '@/lib/database.types';

/**
 * GET /api/oauth-credentials
 * List all OAuth credentials for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    console.log('[OAuth Creds API] GET - User ID:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentials = await getUserOAuthCredentialsList(userId);
    return NextResponse.json({ credentials });
  } catch (error) {
    console.error('[OAuth Credentials API] GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * POST /api/oauth-credentials
 * Save OAuth credentials for a platform
 * Body: { platform: string, clientId: string, clientSecret: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    console.log('[OAuth Creds API] POST - User ID:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, clientId, clientSecret } = body;

    if (!platform || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, clientId, clientSecret' },
        { status: 400 }
      );
    }

    console.log('[OAuth Creds API] Saving credentials for:', platform);
    const creds = await saveUserOAuthCredentials(userId, platform as Platform, clientId, clientSecret);
    console.log('[OAuth Creds API] Success! Credentials saved');

    return NextResponse.json({ credentials: creds }, { status: 201 });
  } catch (error) {
    console.error('[OAuth Credentials API] POST Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/oauth-credentials?platform=instagram
 * Delete OAuth credentials for a platform
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    console.log('[OAuth Creds API] DELETE - User ID:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const platform = request.nextUrl.searchParams.get('platform');
    if (!platform) {
      return NextResponse.json({ error: 'Missing platform parameter' }, { status: 400 });
    }

    await deleteUserOAuthCredentials(userId, platform as Platform);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[OAuth Credentials API] DELETE Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
