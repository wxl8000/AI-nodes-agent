// ========== 笔记相关类型 ==========

export interface Note {
  id: string;
  title: string;
  content: string;
  source_type: 'book' | 'activity' | 'article' | 'thought' | 'experience';
  source_name: string;
  created_at: string;
  tags: string[];
  analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
}

// ========== 认知维度 ==========

export interface CognitiveRadar {
  rational_vs_emotional: number;      // 理性分析(高) / 感性共情(低)
  abstract_vs_concrete: number;       // 抽象思辨(高) / 具象实践(低)
  critical_vs_accepting: number;      // 批判质疑(高) / 接纳吸收(低)
  macro_vs_detail: number;            // 宏观格局(高) / 细节洞察(低)
  longterm_vs_instant: number;        // 长期主义(高) / 即时反馈(低)
  inward_vs_outward: number;          // 向内探索(高) / 向外联结(低)
}

export interface SelfAssessment {
  user_self: CognitiveRadar;
  ai_analysis: CognitiveRadar;
  differences: {
    dimension: keyof CognitiveRadar;
    user_score: number;
    ai_score: number;
    gap: number;
  }[];
}

// ========== 分析结果 ==========

export type AnalysisType =
  | 'cognitive_radar'
  | 'word_cloud'
  | 'milestone'
  | 'knowledge_galaxy'
  | 'thinking_style'
  | 'emotion_spectrum'
  | 'concept_network'
  | 'book_recommendation'
  | 'monthly_brief'
  | 'golden_quotes'
  | 'blind_spot'
  | 'devil_advocate'
  | 'practice_intent';

export interface AnalysisResult {
  id: string;
  note_id?: string;
  analysis_type: AnalysisType;
  result: Record<string, unknown>;
  created_at: string;
}

// ========== 词云 ==========

export interface WordCloudItem {
  text: string;
  weight: number;
  sentiment: 'positive' | 'neutral' | 'critical';
  level: 'fact' | 'opinion' | 'principle';
  source_note_id: string;
  source_note_title: string;
}

// ========== 里程碑 ==========

export type MilestoneType = 'consolidate' | 'overturn' | 'explore';

export interface Milestone {
  id: string;
  note_id: string;
  note_title: string;
  date: string;
  title: string;
  description: string;
  type: MilestoneType;
}

// ========== 知识星系 ==========

export interface GalaxyNode {
  id: string;
  name: string;
  type: 'star' | 'planet' | 'comet';
  domain: string;
  related_notes: string[];
  weight: number;
  position?: { x: number; y: number };
}

export interface GalaxyEdge {
  source: string;
  target: string;
  strength: number;
}

// ========== 思考风格 ==========

export interface ThinkingStyle {
  type: string;
  description: string;
  traits: string[];
  catchphrases: string[];
}

// ========== 深度思考 ==========

export interface DebateMessage {
  role: 'user' | 'devil_advocate';
  content: string;
  timestamp: string;
}

export interface DebateSession {
  id: string;
  note_id: string;
  viewpoint: string;
  messages: DebateMessage[];
  summary?: string;
  created_at: string;
}

export interface DeepQuestion {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  question: string;
  answer?: string;
}

export interface DeepInquirySession {
  id: string;
  note_id: string;
  topic: string;
  questions: DeepQuestion[];
  current_level: number;
  created_at: string;
}

// ========== 推荐 ==========

export interface BookRecommendation {
  title: string;
  author: string;
  reason: string;
  gap_type: 'weak_area' | 'shallow_topic' | 'contradiction';
  related_notes: string[];
  urgency: 'high' | 'medium' | 'low';
}

// ========== 概念网络 ==========

export interface ConceptNode {
  id: string;
  name: string;
  occurrences: number;
  related_notes: { note_id: string; note_title: string; snippet: string }[];
}

export interface ConceptEdge {
  source: string;
  target: string;
  relation: string;
}

// ========== 月报 ==========

export interface MonthlyBriefStats {
  total_notes: number;
  total_keywords: number;
  active_days: number;
  top_source_type: string;
}

export interface ThinkingTrend {
  dimension: string;
  label: string;
  start_score: number;
  end_score: number;
  direction: 'up' | 'down' | 'stable';
  description: string;
}

export interface KnowledgeDistribution {
  domain: string;
  percentage: number;
  note_count: number;
}

export interface GrowthMilestone {
  date: string;
  title: string;
  description: string;
  type: 'breakthrough' | 'consolidation' | 'exploration';
}

export interface MonthlyBrief {
  id: string;
  month_label: string;
  month_start: string;
  month_end: string;
  core_insights: string[];
  thinking_trends: ThinkingTrend[];
  knowledge_distribution: KnowledgeDistribution[];
  growth_milestones: GrowthMilestone[];
  next_month_suggestions: string[];
  question: string;
  highlights: string[];
  stats: MonthlyBriefStats;
  created_at: string;
}

// ========== 金句 ==========

export interface GoldenQuote {
  id: string;
  text: string;
  source_note_id: string;
  source_note_title: string;
  theme: string;
  score: number;
}

// ========== 用户画像 ==========

export interface UserProfile {
  id: string;
  cognitive_radar: CognitiveRadar;
  thinking_style: ThinkingStyle;
  knowledge_domains: string[];
  total_notes: number;
  total_books: number;
  total_activities: number;
  created_at: string;
  updated_at: string;
}

// ========== AI 配置 ==========

export type AIProvider = 'deepseek' | 'qwen';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

// ========== 实践目标 ==========

export interface PracticeGoal {
  id: string;
  note_id: string;
  note_title: string;
  source_name: string;
  intention_text: string;
  description: string;
  status: 'pending' | 'reminded' | 'done' | 'deferred' | 'ignored';
  remind_at: string;
  created_at: string;
  updated_at: string;
  deferred_count: number;
}
