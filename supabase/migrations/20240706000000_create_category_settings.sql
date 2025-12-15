-- Create category_settings table
CREATE TABLE IF NOT EXISTS category_settings (
  id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  category_id TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_category_settings_category_id ON category_settings(category_id);
