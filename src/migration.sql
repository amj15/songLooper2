create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  name text not null,
  tempo int not null,
  time_signature text not null,
  bars jsonb not null,
  audio_url text,
  created_at timestamp default now()
);

-- Add sections, loop, and category columns to projects table
ALTER TABLE projects 
ADD COLUMN sections jsonb DEFAULT '[]'::jsonb,
ADD COLUMN loopstate jsonb DEFAULT '{}'::jsonb,
ADD COLUMN category text DEFAULT 'General';

-- Create table for drum notation per bar
CREATE TABLE bar_notations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  bar_index INTEGER NOT NULL,
  time_signature_numerator INTEGER DEFAULT 4,
  time_signature_denominator INTEGER DEFAULT 4,
  notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one notation per bar per project
  UNIQUE(project_id, bar_index)
);

-- Create index for faster queries
CREATE INDEX idx_bar_notations_project_bar ON bar_notations(project_id, bar_index);

-- Add RLS policies
ALTER TABLE bar_notations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own project's bar notations
CREATE POLICY "Users can access their own bar notations" ON bar_notations
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );