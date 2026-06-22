-- 添加 experience (经历) 类型到 source_type
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_source_type_check;
ALTER TABLE notes ADD CONSTRAINT notes_source_type_check
  CHECK (source_type IN ('book', 'activity', 'article', 'thought', 'experience'));

-- 为 analysis_results 添加唯一约束（用于 upsert）
CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_note_type
  ON analysis_results(note_id, analysis_type) WHERE note_id IS NOT NULL;

-- 允许 note_id 为 NULL（聚合分析结果）
-- 已经是 nullable 的，无需修改