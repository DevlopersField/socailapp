import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Create an authenticated Supabase client from a request's auth token
export function getAuthClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || '';

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// Extract user ID from request
export async function getUserId(request: NextRequest): Promise<string | null> {
  const client = getAuthClient(request);
  const { data: { user } } = await client.auth.getUser();
  return user?.id || null;
}
