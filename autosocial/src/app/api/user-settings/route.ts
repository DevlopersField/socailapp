import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();

    // Return settings (mask keys for security — only show last 8 chars)
    if (data) {
      return NextResponse.json({
        settings: {
          ...data,
          openrouter_key_preview: data.openrouter_key ? '***' + data.openrouter_key.slice(-8) : null,
          openai_key_preview: data.openai_key ? '***' + data.openai_key.slice(-8) : null,
          anthropic_key_preview: data.anthropic_key ? '***' + data.anthropic_key.slice(-8) : null,
          // Never send raw keys to client
          openrouter_key: undefined,
          openai_key: undefined,
          anthropic_key: undefined,
          has_openrouter_key: Boolean(data.openrouter_key),
          has_openai_key: Boolean(data.openai_key),
          has_anthropic_key: Boolean(data.anthropic_key),
        },
      });
    }

    return NextResponse.json({ settings: null });
  } catch (error) {
    console.error('[GET /api/user-settings]', error);
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAuthClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Build update object — only update provided fields
    const updates: Record<string, unknown> = { user_id: user.id };

    if (body.ai_provider !== undefined) updates.ai_provider = body.ai_provider;
    if (body.ai_model !== undefined) updates.ai_model = body.ai_model;
    if (body.openrouter_key !== undefined) updates.openrouter_key = body.openrouter_key;
    if (body.openai_key !== undefined) updates.openai_key = body.openai_key;
    if (body.anthropic_key !== undefined) updates.anthropic_key = body.anthropic_key;
    if (body.default_resize_mode !== undefined) updates.default_resize_mode = body.default_resize_mode;
    if (body.default_bg_color !== undefined) updates.default_bg_color = body.default_bg_color;
    if (body.default_format !== undefined) updates.default_format = body.default_format;
    if (body.default_quality !== undefined) updates.default_quality = body.default_quality;

    const { data, error } = await supabase.from('user_settings')
      .upsert(updates, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      saved: true,
      settings: {
        ai_provider: data.ai_provider,
        ai_model: data.ai_model,
        has_openrouter_key: Boolean(data.openrouter_key),
        has_openai_key: Boolean(data.openai_key),
        has_anthropic_key: Boolean(data.anthropic_key),
        default_resize_mode: data.default_resize_mode,
        default_bg_color: data.default_bg_color,
        default_format: data.default_format,
        default_quality: data.default_quality,
      },
    });
  } catch (error) {
    console.error('[POST /api/user-settings]', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
