import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Platform } from './database.types';

/**
 * Store OAuth credentials in Supabase auth.users user_metadata
 * No database table needed - stores directly in user profile
 */

interface OAuthCreds {
  clientId: string;
  clientSecret: string;
  savedAt: string;
}

/**
 * Get OAuth credentials for a user and platform
 * Reads from user_metadata stored in auth.users
 */
export async function getUserOAuthCredentials(userId: string, platform: Platform) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(url, key);

    // Get user with metadata
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !user) {
      console.log('[OAuth Creds] User not found or error:', error?.message);
      return null;
    }

    // Get credentials from user metadata
    const oauth_creds = user.user_metadata?.oauth_creds || {};
    const creds = oauth_creds[platform] as OAuthCreds | undefined;

    if (!creds) {
      console.log('[OAuth Creds] No credentials found for', platform);
      return null;
    }

    return {
      platform,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      saved_at: creds.savedAt,
    };
  } catch (error) {
    console.error('[OAuth Creds] Error reading:', error);
    return null;
  }
}

/**
 * Get all OAuth credentials for a user
 */
export async function getUserOAuthCredentialsList(userId: string) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(url, key);

    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !user) {
      return [];
    }

    const oauth_creds = user.user_metadata?.oauth_creds || {};

    return Object.entries(oauth_creds).map(([platform, creds]: [string, any]) => ({
      platform,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      saved_at: creds.savedAt,
    }));
  } catch (error) {
    console.error('[OAuth Creds] Error listing:', error);
    return [];
  }
}

/**
 * Save OAuth credentials
 * Stores in auth.users user_metadata (no table needed)
 */
export async function saveUserOAuthCredentials(
  userId: string,
  platform: Platform,
  clientId: string,
  clientSecret: string
) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(url, key);

    console.log('[OAuth Creds] Fetching user...');

    // Get current user data
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(userId);

    if (getUserError || !user) {
      throw new Error(`Failed to get user: ${getUserError?.message}`);
    }

    // Get current metadata
    const user_metadata = user.user_metadata || {};
    const oauth_creds = user_metadata.oauth_creds || {};

    // Add/update credentials
    oauth_creds[platform] = {
      clientId,
      clientSecret,
      savedAt: new Date().toISOString(),
    };

    console.log('[OAuth Creds] Updating user metadata...');

    // Update user with new credentials
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...user_metadata,
        oauth_creds,
      },
    });

    if (updateError) {
      throw new Error(`Failed to save credentials: ${updateError.message}`);
    }

    console.log('[OAuth Creds] Credentials saved successfully ✓');

    return {
      platform,
      client_id: clientId,
      client_secret: clientSecret,
      saved_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[OAuth Creds] Save error:', error);
    throw error;
  }
}

/**
 * Delete OAuth credentials for a platform
 */
export async function deleteUserOAuthCredentials(userId: string, platform: Platform) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(url, key);

    // Get current user data
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(userId);

    if (getUserError || !user) {
      throw new Error(`Failed to get user: ${getUserError?.message}`);
    }

    // Get current metadata
    const user_metadata = user.user_metadata || {};
    const oauth_creds = user_metadata.oauth_creds || {};

    // Remove credentials for this platform
    delete oauth_creds[platform];

    // Update user
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...user_metadata,
        oauth_creds,
      },
    });

    if (updateError) {
      throw new Error(`Failed to delete credentials: ${updateError.message}`);
    }

    console.log('[OAuth Creds] Credentials deleted successfully ✓');
  } catch (error) {
    console.error('[OAuth Creds] Delete error:', error);
    throw error;
  }
}
