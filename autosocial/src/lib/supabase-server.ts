import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service role key.
 * This bypasses RLS — use only for admin operations that need cross-user access.
 * NEVER import this file from a 'use client' component.
 */
export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
  }

  return createClient(url, key);
}
