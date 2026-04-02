import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

/**
 * Debug endpoint to check if oauth_credentials table exists
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServerSupabase();

    // Try to query the table
    const { data, error } = await supabase
      .from('oauth_credentials')
      .select('count()', { count: 'exact' });

    if (error) {
      return NextResponse.json({
        tableExists: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      tableExists: true,
      message: 'oauth_credentials table exists!',
      rowCount: data,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
