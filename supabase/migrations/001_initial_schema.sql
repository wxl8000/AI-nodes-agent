-- 笔记表
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('book', 'activity', 'article', 'thought', 'experience')),
  source_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed'))
);

-- 分析结果表
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_note_id ON analysis_results(note_id);
CREATE INDEX idx_analysis_type ON analysis_results(analysis_type);

-- 用户画像表
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cognitive_radar JSONB DEFAULT '{}',
  thinking_style JSONB DEFAULT '{}',
  knowledge_domains TEXT[] DEFAULT '{}',
  total_notes INTEGER DEFAULT 0,
  total_books INTEGER DEFAULT 0,
  total_activities INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 辩论会话表
CREATE TABLE IF NOT EXISTS debate_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  viewpoint TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 深度追问会话表
CREATE TABLE IF NOT EXISTS deep_inquiry_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  questions JSONB DEFAULT '[]',
  current_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS（行级安全）
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_inquiry_sessions ENABLE ROW LEVEL SECURITY;

-- 允许所有操作（原型阶段简化权限）
CREATE POLICY "Allow all" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON analysis_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON user_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON debate_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON deep_inquiry_sessions FOR ALL USING (true) WITH CHECK (true);
