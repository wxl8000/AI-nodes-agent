'use client';

import { useState, useEffect } from 'react';
import { BookOpen, PenLine, Brain, TrendingUp, Lightbulb, Sparkles, Briefcase, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { mockNotes, mockThinkingStyle } from '@/lib/mock/data';
import type { Note } from '@/types';

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

  useEffect(() => {
    Promise.all([
      fetch('/api/notes').then(res => res.json()).catch(() => null),
      fetch('/api/analysis').then(res => res.json()).catch(() => null),
    ]).then(([notesJson, analysisJson]) => {
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
    }).finally(() => setLoading(false));
  }, []);

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
