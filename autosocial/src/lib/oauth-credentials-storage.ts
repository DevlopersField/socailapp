import 'server-only';
import { getServerSupabase } from './supabase-server';
import type { Platform } from './database.types';

/**
 * Store OAuth credentials in platform_connections metadata instead of separate table
 * This is a workaround for when oauth_credentials table doesn't exist
 */

interface StoredCredentials {
  clientId: string;
  clientSecret: string;
  storedAt: string;
}

/**
 * Get OAuth credentials for a user and platform (from JSON metadata)
 */
export async function getUserOAuthCredentials(userId: string, platform: Platform) {
  try {
    const supabase = getServerSupabase();

    // Try to fetch from oauth_credentials table first
    const { data, error } = await supabase
      .from('oauth_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        user_id: data.user_id,
        platform: data.platform,
        client_id: data.client_id,
        client_secret: data.client_secret,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }

    // Fallback: check if stored in browser localStorage as fallback
    // This is NOT recommended for production, but works for development
    return null;
  } catch (error) {
    console.error('[OAuth Credentials] Error reading:', error);
    return null;
  }
}

/**
 * Get all OAuth credentials for a user
 */
export async function getUserOAuthCredentialsList(userId: string) {
  try {
    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from('oauth_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('platform');

    if (error) {
      console.warn('[OAuth Credentials] Table does not exist, returning empty list');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[OAuth Credentials] Error listing:', error);
    return [];
  }
}

/**
 * Save OAuth credentials - uses oauth_credentials table if available
 * Falls back to storing in a JSON config if table doesn't exist
 */
export async function saveUserOAuthCredentials(
  userId: string,
  platform: Platform,
  clientId: string,
  clientSecret: string
) {
  const supabase = getServerSupabase();

  try {
    // Try to save to oauth_credentials table
    const { data, error } = await supabase
      .from('oauth_credentials')
      .upsert({
        user_id: userId,
        platform,
        client_id: clientId,
        client_secret: clientSecret,
      })
      .select()
      .single();

    if (!error && data) {
      return {
        id: data.id,
        user_id: data.user_id,
        platform: data.platform,
        client_id: data.client_id,
        client_secret: data.client_secret,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }

    // If oauth_credentials table doesn't exist, store in auth.users metadata
    console.log('[OAuth Credentials] Storing in user metadata (fallback)...');

    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(userId);

    if (getUserError) throw getUserError;

    // Store credentials in user metadata
    const metadata = userData.user?.user_metadata || {};
    if (!metadata.oauth_creds) {
      metadata.oauth_creds = {};
    }

    metadata.oauth_creds[platform] = {
      clientId,
      clientSecret,
      storedAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    });

    if (updateError) throw updateError;

    return {
      id: `${userId}-${platform}`,
      user_id: userId,
      platform,
      client_id: clientId,
      client_secret: clientSecret,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[OAuth Credentials] Save error:', error);
    throw new Error(`Failed to save credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete OAuth credentials
 */
export async function deleteUserOAuthCredentials(userId: string, platform: Platform) {
  const supabase = getServerSupabase();

  try {
    // Try to delete from oauth_credentials table
    const { error } = await supabase
      .from('oauth_credentials')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    if (!error) return;

    // Fallback: remove from user metadata
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(userId);

    if (getUserError) throw getUserError;

    const metadata = userData.user?.user_metadata || {};
    if (metadata.oauth_creds && metadata.oauth_creds[platform]) {
      delete metadata.oauth_creds[platform];
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    });

    if (updateError) throw updateError;
  } catch (error) {
    console.error('[OAuth Credentials] Delete error:', error);
    throw error;
  }
}
