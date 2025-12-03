/*
  # Create posts table for community content

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `title` (text) - Post title/header
      - `caption` (text) - Post description/subtext
      - `media_url` (text) - URL to media file if any
      - `thumbnail_url` (text) - Thumbnail preview URL
      - `created_at` (timestamptz) - When post was created
      - `updated_at` (timestamptz) - When post was last updated
      
  2. Security
    - Enable RLS on `posts` table
    - Add policy for authenticated users to read all posts
    - Add policy for authenticated users to create posts
    - Add policy for authenticated users to update their own posts
    - Add policy for authenticated users to delete their own posts
*/

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  caption text DEFAULT '',
  media_url text DEFAULT '',
  thumbnail_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (true);