import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (for pages)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Server client (for API routes — uses service role for admin ops)
export function getServerSupabase() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey);
}

// Auth helper — get current user from browser client
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
