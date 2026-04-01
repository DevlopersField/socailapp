-- Run this in Supabase SQL Editor to fix platform_connections table
-- This adds the user_id column and changes the unique constraint

-- Step 1: Add user_id column if it doesn't exist
ALTER TABLE platform_connections ADD COLUMN IF NOT EXISTS user_id uuid;

-- Step 2: Drop the old unique constraint on platform only
ALTER TABLE platform_connections DROP CONSTRAINT IF EXISTS platform_connections_platform_key;

-- Step 3: Add composite unique constraint (user_id + platform)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'platform_connections_user_id_platform_key'
  ) THEN
    ALTER TABLE platform_connections ADD CONSTRAINT platform_connections_user_id_platform_key UNIQUE (user_id, platform);
  END IF;
END $$;

-- Step 4: Update RLS policy to be user-scoped
DROP POLICY IF EXISTS "Allow all on platform_connections" ON platform_connections;
CREATE POLICY "Users manage own connections" ON platform_connections
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Done! Now each user can only see/edit their own connections.
