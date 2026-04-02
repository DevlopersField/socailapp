import 'server-only';
import { getServerSupabase } from './supabase-server';
import type { Platform } from './database.types';

/**
 * Per-user OAuth credentials management.
 * Users store their own OAuth app credentials (client ID/secret) in the database.
 * This replaces environment variable-based credentials for true multi-tenant support.
 */

export interface OAuthCredentials {
  id: string;
  user_id: string;
  platform: Platform;
  client_id: string;
  client_secret: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get OAuth credentials for a user and platform
 */
export async function getUserOAuthCredentials(userId: string, platform: Platform) {
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('oauth_credentials')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    console.error('[OAuth Credentials] Query error:', error);
    return null;
  }

  return (data as OAuthCredentials) || null;
}

/**
 * Get all OAuth credentials for a user
 */
export async function getUserOAuthCredentialsList(userId: string) {
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('oauth_credentials')
    .select('*')
    .eq('user_id', userId)
    .order('platform');

  if (error) {
    console.error('[OAuth Credentials] Query error:', error);
    return [];
  }

  return (data as OAuthCredentials[]) || [];
}

/**
 * Save OAuth credentials for a user
 */
export async function saveUserOAuthCredentials(
  userId: string,
  platform: Platform,
  clientId: string,
  clientSecret: string
) {
  const supabase = getServerSupabase();

  console.log('[OAuth Credentials] Attempting to save:', { userId, platform });

  const { data, error } = await supabase
    .from('oauth_credentials')
    .upsert(
      {
        user_id: userId,
        platform,
        client_id: clientId,
        client_secret: clientSecret,
      },
      { onConflict: 'user_id,platform' }
    )
    .select()
    .single();

  if (error) {
    console.error('[OAuth Credentials] Save error:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    throw new Error(`Failed to save credentials: ${error.message}`);
  }

  console.log('[OAuth Credentials] Save successful');
  return data as OAuthCredentials;
}

/**
 * Delete OAuth credentials for a user and platform
 */
export async function deleteUserOAuthCredentials(userId: string, platform: Platform) {
  const supabase = getServerSupabase();

  const { error } = await supabase
    .from('oauth_credentials')
    .delete()
    .eq('user_id', userId)
    .eq('platform', platform);

  if (error) {
    console.error('[OAuth Credentials] Delete error:', error);
    throw error;
  }
}
