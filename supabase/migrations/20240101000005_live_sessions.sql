-- Create live_sessions table
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_url TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'live', 'ended'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for live_sessions
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions are viewable by enrolled students" 
ON live_sessions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.course_id = live_sessions.course_id 
    AND enrollments.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage live_sessions" 
ON live_sessions FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
