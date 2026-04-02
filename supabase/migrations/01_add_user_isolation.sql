-- Add user_id columns to existing tables and create new oauth_credentials table

-- 1. Add user_id to platform_connections
ALTER TABLE platform_connections
ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT (auth.uid());

-- Drop old unique constraint and add new one with user_id
ALTER TABLE platform_connections
DROP CONSTRAINT IF EXISTS platform_connections_user_id_platform_key,
ADD CONSTRAINT platform_connections_user_id_platform_key UNIQUE(user_id, platform);

-- Create index for faster queries
CREATE INDEX idx_platform_connections_user_id ON platform_connections(user_id);

-- 2. Add user_id to posts
ALTER TABLE posts
ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT (auth.uid());
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- 3. Add user_id to scheduled_jobs
ALTER TABLE scheduled_jobs
ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT (auth.uid());
CREATE INDEX idx_scheduled_jobs_user_id ON scheduled_jobs(user_id);

-- 4. Add user_id to analytics (optional but recommended)
ALTER TABLE analytics
ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT (auth.uid());
CREATE INDEX idx_analytics_user_id ON analytics(user_id);

-- 5. Create oauth_credentials table for per-user OAuth app configs
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

CREATE INDEX idx_oauth_credentials_user_id ON oauth_credentials(user_id);

-- 6. Update RLS policies

-- Platform connections RLS
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own connections" ON platform_connections;
DROP POLICY IF EXISTS "Users can manage their own connections" ON platform_connections;

CREATE POLICY "Users can view their own connections"
  ON platform_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own connections"
  ON platform_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Posts RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
DROP POLICY IF EXISTS "Users can manage their own posts" ON posts;

CREATE POLICY "Users can view their own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own posts"
  ON posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Scheduled jobs RLS
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own jobs" ON scheduled_jobs;
DROP POLICY IF EXISTS "Users can manage their own jobs" ON scheduled_jobs;

CREATE POLICY "Users can view their own jobs"
  ON scheduled_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own jobs"
  ON scheduled_jobs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Analytics RLS
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own analytics" ON analytics;
DROP POLICY IF EXISTS "Users can manage their own analytics" ON analytics;

CREATE POLICY "Users can view their own analytics"
  ON analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own analytics"
  ON analytics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- OAuth credentials RLS
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own oauth credentials" ON oauth_credentials;
DROP POLICY IF EXISTS "Users can manage their own oauth credentials" ON oauth_credentials;

CREATE POLICY "Users can view their own oauth credentials"
  ON oauth_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own oauth credentials"
  ON oauth_credentials FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant trends table to everyone (no user_id needed, global data)
ALTER TABLE trends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view trends" ON trends;

CREATE POLICY "Anyone can view trends"
  ON trends FOR SELECT
  USING (true);
