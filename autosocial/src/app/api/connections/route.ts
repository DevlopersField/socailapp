import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit';

const VALID_PLATFORMS = ['instagram', 'linkedin', 'twitter', 'pinterest', 'dribbble', 'gmb', 'reddit'] as const;
const VALID_STATUSES = ['connected', 'expired', 'disconnected'] as const;

export async function GET(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!rateLimiters.read.check(user.id)) return rateLimitResponse() as unknown as NextResponse;

    // Fetch connections for this user (RLS + explicit filter)
    const { data, error } = await supabase
      .from('platform_connections')
      .select('platform, account_name, account_id, status, connected_at, token_expires_at')
      .eq('user_id', user.id);

    if (error) {
      // If user_id column doesn't exist yet, fetch all (old schema fallback)
      if (error.message?.includes('user_id')) {
        const { data: fallback } = await supabase
          .from('platform_connections')
          .select('platform, account_name, account_id, status, connected_at, token_expires_at');
        return NextResponse.json({ connections: fallback || [] });
      }
      throw error;
    }
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

    if (!rateLimiters.write.check(user.id)) return rateLimitResponse() as unknown as NextResponse;

    const body = await request.json();

    if (!body.platform || !VALID_PLATFORMS.includes(body.platform)) {
      return NextResponse.json({ error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` }, { status: 400 });
    }

    const status = body.status ?? 'connected';
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status` }, { status: 400 });
    }

    if (!body.access_token || typeof body.access_token !== 'string' || body.access_token.trim().length === 0) {
      return NextResponse.json({ error: 'access_token is required' }, { status: 400 });
    }

    const row = {
      user_id: user.id,
      platform: body.platform,
      access_token: body.access_token.trim(),
      refresh_token: body.refresh_token ?? null,
      token_expires_at: body.token_expires_at ?? null,
      account_name: body.account_name ?? null,
      account_id: body.account_id ?? null,
      status,
    };

    // Try upsert with composite key first (new schema)
    let result = await supabase.from('platform_connections')
      .upsert(row, { onConflict: 'user_id,platform' })
      .select('platform, account_name, account_id, status, connected_at')
      .single();

    if (result.error) {
      // Fallback: old schema with unique on platform only
      // Delete existing row first, then insert
      await supabase.from('platform_connections').delete().eq('platform', body.platform);
      result = await supabase.from('platform_connections')
        .insert(row)
        .select('platform, account_name, account_id, status, connected_at')
        .single();
    }

    if (result.error) throw result.error;
    return NextResponse.json({ connection: result.data });
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

    if (!rateLimiters.write.check(user.id)) return rateLimitResponse() as unknown as NextResponse;

    const platform = new URL(request.url).searchParams.get('platform');
    if (!platform || !VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    // Delete with user_id filter (falls back gracefully if column missing)
    const { error } = await supabase.from('platform_connections').delete().eq('platform', platform).eq('user_id', user.id);
    if (error && error.message?.includes('user_id')) {
      // Old schema fallback
      await supabase.from('platform_connections').delete().eq('platform', platform);
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[DELETE /api/connections]', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
