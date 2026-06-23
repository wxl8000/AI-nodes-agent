-- 实践目标跟踪表
CREATE TABLE IF NOT EXISTS practice_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  note_title TEXT NOT NULL,
  source_name TEXT NOT NULL,
  intention_text TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reminded', 'done', 'deferred', 'ignored')),
  remind_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deferred_count INTEGER DEFAULT 0
);

CREATE INDEX idx_practice_goals_status ON practice_goals(status);
CREATE INDEX idx_practice_goals_note_id ON practice_goals(note_id);
CREATE INDEX idx_practice_goals_remind_at ON practice_goals(remind_at);

-- 启用 RLS
ALTER TABLE practice_goals ENABLE ROW LEVEL SECURITY;

-- 允许所有操作（原型阶段简化权限）
CREATE POLICY "Allow all" ON practice_goals FOR ALL USING (true) WITH CHECK (true);
