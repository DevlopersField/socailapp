import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data, error } = await supabase.from('platform_connections').select('*');
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
    const { data, error } = await supabase.from('platform_connections').upsert({
      user_id: user.id,
      platform: body.platform,
      access_token: body.access_token,
      refresh_token: body.refresh_token ?? null,
      token_expires_at: body.token_expires_at ?? null,
      account_name: body.account_name ?? null,
      account_id: body.account_id ?? null,
      status: body.status ?? 'connected',
    }, { onConflict: 'platform' }).select().single();

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
    const platform = new URL(request.url).searchParams.get('platform');
    if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });
    await supabase.from('platform_connections').delete().eq('platform', platform);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[DELETE /api/connections]', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
