import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (for pages) — uses anon key with RLS
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Auth helper — get current user from browser client
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
