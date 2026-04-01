import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';

const VALID_PLATFORMS = ['instagram', 'linkedin', 'twitter', 'pinterest', 'dribbble', 'gmb', 'reddit'] as const;
const VALID_STATUSES = ['connected', 'expired', 'disconnected'] as const;

export async function GET(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('platform_connections').select('platform, account_name, account_id, status, connected_at, token_expires_at');
    if (error) throw error;
    return NextResponse.json({ connections: data || [] });
  } catch (error) {
    console.error('[GET /api/connections]', error);
    return NextResponse.json({ error: 'Failed to read connections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Validate platform
    if (!body.platform || !VALID_PLATFORMS.includes(body.platform)) {
      return NextResponse.json({ error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` }, { status: 400 });
    }

    // Validate status
    const status = body.status ?? 'connected';
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    // Validate token
    if (!body.access_token || typeof body.access_token !== 'string' || body.access_token.trim().length === 0) {
      return NextResponse.json({ error: 'access_token is required' }, { status: 400 });
    }

    const { data, error } = await supabase.from('platform_connections').upsert({
      user_id: user.id,
      platform: body.platform,
      access_token: body.access_token.trim(),
      refresh_token: body.refresh_token ?? null,
      token_expires_at: body.token_expires_at ?? null,
      account_name: body.account_name ?? null,
      account_id: body.account_id ?? null,
      status,
    }, { onConflict: 'platform' }).select('platform, account_name, account_id, status, connected_at').single();

    if (error) throw error;
    return NextResponse.json({ connection: data });
  } catch (error) {
    console.error('[POST /api/connections]', error);
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const platform = new URL(request.url).searchParams.get('platform');
    if (!platform || !VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) {
      return NextResponse.json({ error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` }, { status: 400 });
    }

    await supabase.from('platform_connections').delete().eq('platform', platform);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[DELETE /api/connections]', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
