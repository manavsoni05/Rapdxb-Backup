/*
  # Create platform connections table

  1. New Tables
    - `platform_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `platform` (text) - Platform name (instagram, tiktok, youtube, etc.)
      - `is_connected` (boolean) - Connection status
      - `access_token` (text) - Encrypted access token
      - `refresh_token` (text) - Encrypted refresh token
      - `expires_at` (timestamptz) - Token expiration
      - `platform_user_id` (text) - User ID on the platform
      - `platform_username` (text) - Username on the platform
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `platform_connections` table
    - Add policy for users to read their own connections
    - Add policy for users to create their own connections
    - Add policy for users to update their own connections
    - Add policy for users to delete their own connections

  3. Important Notes
    - Each user can have multiple platform connections
    - Tokens should be encrypted in production
    - Users can only access their own connections
*/

CREATE TABLE IF NOT EXISTS platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  is_connected boolean DEFAULT false,
  access_token text DEFAULT '',
  refresh_token text DEFAULT '',
  expires_at timestamptz,
  platform_user_id text DEFAULT '',
  platform_username text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own platform connections"
  ON platform_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own platform connections"
  ON platform_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own platform connections"
  ON platform_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own platform connections"
  ON platform_connections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS platform_connections_user_id_idx ON platform_connections(user_id);
CREATE INDEX IF NOT EXISTS platform_connections_platform_idx ON platform_connections(platform);
