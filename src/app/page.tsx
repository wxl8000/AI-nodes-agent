'use client';

import { useState, useEffect } from 'react';
import { BookOpen, PenLine, Brain, TrendingUp, Lightbulb, Sparkles, Briefcase, Calendar, Loader2, Bell, CheckCircle2, Clock, XCircle, Target, Filter } from 'lucide-react';
import Link from 'next/link';
import { mockNotes, mockThinkingStyle } from '@/lib/mock/data';
import { cn } from '@/lib/utils';
import type { Note, PracticeGoal } from '@/types';

const SOURCE_LABELS: Record<string, string> = {
  book: '📚 书籍',
  article: '📝 文章',
  activity: '🎯 活动',
  experience: '💼 经历',
  thought: '💡 随想',
};

const quickActions = [
  { href: '/analysis', label: '认知雷达图', desc: '六维认知画像', icon: Brain, gradient: 'from-accent-purple to-primary' },
  { href: '/analysis?tab=timeline', label: '认知里程碑', desc: '思想进化时间轴', icon: TrendingUp, gradient: 'from-accent-blue to-accent-green' },
  { href: '/thinking', label: '魔鬼代言人', desc: '深度思考辅助', icon: Lightbulb, gradient: 'from-accent-orange to-accent-pink' },
  { href: '/recommend', label: '认知缺口书单', desc: '比你更懂你', icon: Sparkles, gradient: 'from-accent-yellow to-accent-orange' },
];

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch { return dateStr; }
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [goldenQuoteCount, setGoldenQuoteCount] = useState<number>(0);
  const [overdueGoals, setOverdueGoals] = useState<PracticeGoal[]>([]);
  const [allGoals, setAllGoals] = useState<PracticeGoal[]>([]);
  const [goalFilter, setGoalFilter] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      fetch('/api/notes').then(res => res.json()).catch(() => null),
      fetch('/api/analysis').then(res => res.json()).catch(() => null),
      fetch('/api/practice-goals?overdue=true').then(res => res.json()).catch(() => null),
      fetch('/api/practice-goals').then(res => res.json()).catch(() => null),
    ]).then(([notesJson, analysisJson, overdueJson, allGoalsJson]) => {
      // Notes
      if (notesJson?.success && notesJson.data?.length > 0) {
        setNotes(notesJson.data);
      } else {
        setNotes(mockNotes);
      }
      // Golden quotes count (only real API data)
      if (analysisJson?.success && analysisJson.data?.golden_quotes?.length > 0) {
        setGoldenQuoteCount(analysisJson.data.golden_quotes.length);
      }
      // Overdue practice goals
      if (overdueJson?.success && overdueJson.data?.length > 0) {
        setOverdueGoals(overdueJson.data);
      }
      // All practice goals
      if (allGoalsJson?.success && allGoalsJson.data) {
        setAllGoals(allGoalsJson.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  // 更新实践目标状态
  const handleGoalAction = async (goalId: string, status: 'done' | 'deferred' | 'ignored') => {
    try {
      const res = await fetch('/api/practice-goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: goalId, status }),
      });
      const json = await res.json();
      if (json.success) {
        setOverdueGoals(prev => prev.filter(g => g.id !== goalId));
        setAllGoals(prev => prev.map(g =>
          g.id === goalId ? { ...g, status } : g
        ));
      }
    } catch {
      // 静默失败，刷新页面后会重新显示
    }
  };

  // 计算时间间隔描述
  const getTimeAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days}天前`;
    if (days < 90) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365 * 10) / 10}年前`;
  };

  const stats = [
    { label: '总笔记数', value: notes.length, icon: PenLine, color: 'from-accent-blue to-accent-purple', href: '/notes' },
    { label: '读过的书', value: notes.filter(n => n.source_type === 'book').length, icon: BookOpen, color: 'from-accent-green to-accent-blue', href: '/notes?filter=book' },
    { label: '参加活动', value: notes.filter(n => n.source_type === 'activity').length, icon: Brain, color: 'from-accent-orange to-accent-pink', href: '/notes?filter=activity' },
    { label: '金句数', value: goldenQuoteCount, icon: Lightbulb, color: 'from-accent-yellow to-accent-orange', href: '/output?tab=quotes' },
  ];

  const recentNotes = notes.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          欢迎回来，<span className="gradient-text">思想探索者</span>
        </h1>
        <p className="text-muted mt-2">
          {mockThinkingStyle.description.substring(0, 80)}...
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="glass-card glass-card-hover p-5 flex items-center gap-4 cursor-pointer transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted" />
                ) : (
                  <p className="text-2xl font-bold">{stat.value}</p>
                )}
                <p className="text-xs text-muted">{stat.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">快速入口</h2>
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="glass-card glass-card-hover p-5 group cursor-pointer transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{action.label}</h3>
                <p className="text-xs text-muted mt-1">{action.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 实践提醒 */}
      {overdueGoals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-accent-orange" />
            <h2 className="text-lg font-semibold">实践提醒</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-orange/15 text-accent-orange">
              {overdueGoals.length} 条待处理
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {overdueGoals.slice(0, 4).map((goal) => (
              <div
                key={goal.id}
                className="glass-card p-5 border-l-4 border-l-accent-orange transition-all hover:border-l-primary"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-orange/15 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-accent-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug mb-1">
                      {goal.description}
                    </p>
                    <p className="text-xs text-muted mb-1 line-clamp-2">
                      &ldquo;{goal.intention_text}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>《{goal.source_name}》</span>
                      <span>·</span>
                      <span>{getTimeAgo(goal.created_at)}记录</span>
                      {goal.deferred_count > 0 && (
                        <span className="text-accent-orange">· 已延期{goal.deferred_count}次</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleGoalAction(goal.id, 'done')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-green/15 text-accent-green text-xs font-medium hover:bg-accent-green/25 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已完成
                  </button>
                  <button
                    onClick={() => handleGoalAction(goal.id, 'deferred')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/15 text-accent-blue text-xs font-medium hover:bg-accent-blue/25 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    延期 30 天
                  </button>
                  <button
                    onClick={() => handleGoalAction(goal.id, 'ignored')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-muted text-xs font-medium hover:bg-secondary transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    忽略
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 实践目标总览 */}
      {allGoals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-accent-purple" />
            <h2 className="text-lg font-semibold">实践目标总览</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple">
              {allGoals.length} 个目标
            </span>
          </div>
          {/* 筛选标签 */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-3.5 h-3.5 text-muted" />
            {[
              { key: 'all', label: '全部' },
              { key: 'pending', label: '待实践' },
              { key: 'done', label: '已完成' },
              { key: 'deferred', label: '已延期' },
              { key: 'ignored', label: '已忽略' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setGoalFilter(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  goalFilter === tab.key
                    ? 'bg-primary text-white'
                    : 'bg-card border border-card-border text-muted hover:text-foreground'
                )}
              >
                {tab.label}
                {tab.key !== 'all' && (
                  <span className="ml-1 opacity-70">
                    ({allGoals.filter(g => g.status === tab.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* 目标列表 */}
          <div className="grid grid-cols-2 gap-4">
            {(goalFilter === 'all' ? allGoals : allGoals.filter(g => g.status === goalFilter)).slice(0, 8).map((goal) => {
              const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Target }> = {
                pending:   { label: '待实践', color: 'text-accent-orange', bg: 'bg-accent-orange/15', icon: Target },
                reminded:  { label: '已提醒', color: 'text-accent-blue',   bg: 'bg-accent-blue/15',   icon: Bell },
                done:      { label: '已完成', color: 'text-accent-green',  bg: 'bg-accent-green/15',  icon: CheckCircle2 },
                deferred:  { label: '已延期', color: 'text-accent-purple', bg: 'bg-accent-purple/15', icon: Clock },
                ignored:   { label: '已忽略', color: 'text-muted',         bg: 'bg-secondary/50',     icon: XCircle },
              };
              const cfg = statusConfig[goal.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              const isOverdue = (goal.status === 'pending' || goal.status === 'reminded') &&
                Math.floor((Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)) > 60;

              return (
                <div
                  key={goal.id}
                  className={cn(
                    'glass-card p-5 transition-all',
                    isOverdue && 'border-l-4 border-l-accent-orange'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                      <StatusIcon className={cn('w-4 h-4', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug mb-1">
                        {goal.description}
                      </p>
                      <p className="text-xs text-muted mb-1 line-clamp-2">
                        &ldquo;{goal.intention_text}&rdquo;
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted flex-wrap">
                        <span className={cn('px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
                        <span>《{goal.source_name}》</span>
                        <span>·</span>
                        <span>{getTimeAgo(goal.created_at)}</span>
                        {goal.deferred_count > 0 && (
                          <span className="text-accent-orange">· 延期{goal.deferred_count}次</span>
                        )}
                        {isOverdue && (
                          <span className="text-accent-orange font-medium">· 已超期</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {(goal.status === 'pending' || goal.status === 'reminded') && (
                    <div className="flex gap-2 mt-4 ml-11">
                      <button
                        onClick={() => handleGoalAction(goal.id, 'done')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-green/15 text-accent-green text-xs font-medium hover:bg-accent-green/25 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已完成
                      </button>
                      <button
                        onClick={() => handleGoalAction(goal.id, 'deferred')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/15 text-accent-blue text-xs font-medium hover:bg-accent-blue/25 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        延期
                      </button>
                      <button
                        onClick={() => handleGoalAction(goal.id, 'ignored')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-muted text-xs font-medium hover:bg-secondary transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        忽略
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {allGoals.filter(g => goalFilter === 'all' || g.status === goalFilter).length > 8 && (
            <p className="text-center text-xs text-muted mt-3">
              还有 {allGoals.filter(g => goalFilter === 'all' || g.status === goalFilter).length - 8} 个目标未显示
            </p>
          )}
        </div>
      )}

      {/* Recent Notes & Thinking Style */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Notes */}
        <div className="col-span-2 glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">最近笔记</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes?noteId=${note.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer group"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    note.source_type === 'book' ? 'bg-accent-blue' :
                    note.source_type === 'article' ? 'bg-accent-green' :
                    note.source_type === 'experience' ? 'bg-accent-yellow' :
                    note.source_type === 'activity' ? 'bg-accent-orange' :
                    'bg-accent-purple'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{note.title}</h3>
                    <p className="text-xs text-muted mt-1 line-clamp-2">
                      {note.content.substring(0, 120)}...
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted">
                        {SOURCE_LABELS[note.source_type] || '📝 笔记'}
                      </span>
                      <span className="text-xs text-muted">{formatDate(note.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link href="/notes" className="block text-center text-sm text-primary hover:text-primary-hover mt-4 transition-colors">
            查看全部笔记 →
          </Link>
        </div>

        {/* Thinking Style Card */}
        <Link href="/thinking" className="glass-card glass-card-hover p-6 cursor-pointer transition-all duration-300 group block">
          <h2 className="text-lg font-semibold mb-4">思考风格</h2>
          <div className="text-center mb-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent-pink/20 border border-primary/30 group-hover:scale-105 transition-transform">
              <span className="text-sm font-semibold gradient-text">{mockThinkingStyle.type}</span>
            </div>
          </div>
          <p className="text-xs text-muted leading-relaxed mb-4">
            {mockThinkingStyle.description.substring(0, 150)}...
          </p>
          <div>
            <h4 className="text-xs font-semibold text-muted mb-2">思考口头禅</h4>
            <div className="flex flex-wrap gap-2">
              {mockThinkingStyle.catchphrases.map((phrase, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-secondary/50 text-foreground/80"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-primary mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
            点击探索深度思考 →
          </p>
        </Link>
      </div>
    </div>
  );
}
