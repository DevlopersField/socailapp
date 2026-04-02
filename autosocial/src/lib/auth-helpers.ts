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

// Extract user ID from request (from auth header or cookies)
export async function getUserId(request: NextRequest): Promise<string | null> {
  // Try to get from Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const client = getAuthClient(request);
    const { data: { user } } = await client.auth.getUser();
    if (user?.id) return user.id;
  }

  // Fall back to user-id cookie set by middleware
  const userId = request.cookies.get('user-id')?.value;
  if (userId) return userId;

  return null;
}
