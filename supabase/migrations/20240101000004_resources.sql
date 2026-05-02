-- 1. Add notes column to lessons
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Create resources table for files and links
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'pdf', -- 'pdf', 'link', 'zip', 'doc'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set up RLS for resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resources are viewable by everyone" 
ON resources FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage resources" 
ON resources FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
