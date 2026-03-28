import { NextRequest, NextResponse } from 'next/server';
import { getConnections, upsertConnection, deleteConnection } from '@/lib/db';

export async function GET() {
  try {
    const connections = await getConnections();
    return NextResponse.json({ connections }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/connections]', error);
    return NextResponse.json({ error: 'Failed to read connections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, access_token, refresh_token, token_expires_at, account_name, account_id, status } = body;

    if (!platform || !access_token) {
      return NextResponse.json({ error: 'platform and access_token are required' }, { status: 400 });
    }

    const connection = await upsertConnection({
      platform,
      access_token,
      refresh_token: refresh_token ?? null,
      token_expires_at: token_expires_at ?? null,
      account_name: account_name ?? null,
      account_id: account_id ?? null,
      status: status ?? 'connected',
    });

    return NextResponse.json({ connection }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/connections]', error);
    return NextResponse.json({ error: 'Failed to upsert connection' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    if (!platform) {
      return NextResponse.json({ error: 'platform query param is required' }, { status: 400 });
    }
    await deleteConnection(platform);
    return NextResponse.json({ deleted: true, platform }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/connections]', error);
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
  }
}
