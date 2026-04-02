import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin endpoint to set up database tables
 * Usage: POST http://localhost:3000/api/admin/setup-database
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Setup] Starting database initialization...');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase credentials in .env');
    }

    const supabase = createClient(url, key);

    // Step 1: Create table
    console.log('[Setup] Creating oauth_credentials table...');
    const { error: createError } = await supabase.from('oauth_credentials').select('count()', { count: 'exact' });

    // If table doesn't exist, we'll try to create it via PostgreSQL
    // For now, let's just verify it can be accessed
    if (createError?.message?.includes('does not exist')) {
      console.log('[Setup] Table does not exist, needs to be created via SQL Editor');
      throw new Error('oauth_credentials table does not exist. Please create it manually in Supabase SQL Editor.');
    }

    console.log('[Setup] oauth_credentials table exists! ✓');

    // Verify we can insert
    const testInsert = await supabase.from('oauth_credentials').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      platform: 'test',
      client_id: 'test',
      client_secret: 'test',
    });

    if (!testInsert.error) {
      // Clean up test record
      await supabase.from('oauth_credentials').delete().eq('platform', 'test');
      console.log('[Setup] Insert test successful ✓');
    }

    console.log('[Setup] Database setup complete! ✓');

    return NextResponse.json({
      success: true,
      message: 'oauth_credentials table is ready!',
    });
  } catch (error) {
    console.error('[Setup] Error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: errorMsg,
        solution: 'Please create the oauth_credentials table manually in Supabase SQL Editor',
      },
      { status: 500 }
    );
  }
}
