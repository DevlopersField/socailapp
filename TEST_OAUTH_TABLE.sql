-- Quick test: Create oauth_credentials table if it doesn't exist
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS oauth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_user_id ON oauth_credentials(user_id);

-- Enable RLS
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own oauth credentials" ON oauth_credentials;
DROP POLICY IF EXISTS "Users can manage their own oauth credentials" ON oauth_credentials;

-- Create RLS policies
CREATE POLICY "Users can view their own oauth credentials"
  ON oauth_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own oauth credentials"
  ON oauth_credentials FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Test: Check if table was created
SELECT * FROM information_schema.tables WHERE table_name = 'oauth_credentials';
