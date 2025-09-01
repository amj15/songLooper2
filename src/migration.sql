-- Create projects table if not exists
CREATE TABLE IF NOT EXISTS projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  tempo int not null,
  time_signature text not null,
  bars jsonb not null,
  audio_url text,
  created_at timestamp default now()
);

-- Add sections, loop, and category columns to projects table (safe)
DO $$ 
BEGIN 
    -- Add sections column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'sections') THEN
        ALTER TABLE projects ADD COLUMN sections jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add loopstate column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'loopstate') THEN
        ALTER TABLE projects ADD COLUMN loopstate jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'category') THEN
        ALTER TABLE projects ADD COLUMN category text DEFAULT 'General';
    END IF;
END $$;

-- Create table for drum notation per bar if it doesn't exist
CREATE TABLE IF NOT EXISTS bar_notations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  bar_index INTEGER NOT NULL,
  time_signature_numerator INTEGER DEFAULT 4,
  time_signature_denominator INTEGER DEFAULT 4,
  subdivision_resolution INTEGER DEFAULT 16, -- 16 para 1/16, 32 para 1/32, etc.
  notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one notation per bar per project
  UNIQUE(project_id, bar_index)
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bar_notations' AND column_name = 'subdivision_resolution') THEN
        ALTER TABLE bar_notations ADD COLUMN subdivision_resolution INTEGER DEFAULT 16;
    END IF;
END $$;

-- Create table for project drum tracks header if not exists
CREATE TABLE IF NOT EXISTS project_drum_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  instruments_used JSONB DEFAULT '[]'::jsonb, -- Lista de instrumentos utilizados
  total_bars INTEGER DEFAULT 0,
  subdivision_resolution INTEGER DEFAULT 16,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- One track header per project
  UNIQUE(project_id)
);

-- Create indexes for faster queries (safe)
CREATE INDEX IF NOT EXISTS idx_bar_notations_project_bar ON bar_notations(project_id, bar_index);
CREATE INDEX IF NOT EXISTS idx_project_drum_tracks_project ON project_drum_tracks(project_id);

-- Enable RLS safely
DO $$ 
BEGIN 
    -- Enable RLS on bar_notations if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'bar_notations' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE bar_notations ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on project_drum_tracks if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'project_drum_tracks' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE project_drum_tracks ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies safely (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Users can access their own bar notations" ON bar_notations;
CREATE POLICY "Users can access their own bar notations" ON bar_notations
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can access their own drum tracks" ON project_drum_tracks;
CREATE POLICY "Users can access their own drum tracks" ON project_drum_tracks
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );