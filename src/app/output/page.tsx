'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, Quote, BarChart3, Copy, Download, Share2 } from 'lucide-react';
import { mockWeeklyBrief } from '@/lib/mock/data';
import { cn } from '@/lib/utils';

type Tab = 'brief' | 'quotes' | 'report';

export default function OutputPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OutputContent />
    </Suspense>
  );
}

function OutputContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'brief';
  const [activeTab, setActiveTab] = useState<Tab>(['brief', 'quotes', 'report'].includes(initialTab) ? initialTab : 'brief');
  const [copiedQuote, setCopiedQuote] = useState<string | null>(null);
  const [isRealData, setIsRealData] = useState(false);
  const [goldenQuotes, setGoldenQuotes] = useState<any[]>([]);  // Start empty, only show real data
  const [weeklyBrief, setWeeklyBrief] = useState(mockWeeklyBrief);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportData, setReportData] = useState<{
    totalNotes: number;
    totalBooks: number;
    totalActivities: number;
    knowledgeDomains: string[];
    milestones: { title: string; type: string; date: string; description: string; key_insight: string }[];
    cognitiveRadar: Record<string, number> | null;
    thinkingStyle: { type: string; description: string; traits: string[]; catchphrases: string[] } | null;
    goldenQuotes: { text: string; source_note_title: string; theme: string; score: number }[];
    wordCloud: { text: string; weight: number }[];
    year: number;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analysis');
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setIsRealData(true);

          // Golden quotes
          if (d.golden_quotes?.length > 0) {
            const apiQuotes = d.golden_quotes.map((q: any, i: number) => ({
              id: q.id || `q-api-${i}`,
              text: q.text || q.quote || '',
              source_note_id: q.source_note_id || '',
              source_note_title: q.source_note_title || q.note_title || q.source || '',
              theme: q.theme || q.category || '思考',
              score: q.score || q.insight_score || 80,
            }));
            setGoldenQuotes(apiQuotes);
          }

          // Build annual report data
          const milestones = (d.milestones || []).map((m: any) => ({
            title: m.title || '',
            type: m.type || 'explore',
            date: m.date || m.created_at || '',
            description: m.description || '',
            key_insight: m.key_insight || '',
          }));
          const wordCloud = (d.word_cloud || []).map((w: any) => ({
            text: w.text || '',
            weight: w.weight || 1,
          }));
          const allQuotes = (d.golden_quotes || []).map((q: any) => ({
            text: q.text || q.quote || '',
            source_note_title: q.source_note_title || q.note_title || q.source || '',
            theme: q.theme || q.category || '思考',
            score: q.score || q.insight_score || 80,
          }));
          // Determine year from milestone dates or default to current year
          const yearFromData = milestones
            .map((m: any) => new Date(m.date).getFullYear())
            .filter((y: number) => !isNaN(y) && y > 2000);
          const reportYear = yearFromData.length > 0
            ? Math.max(...yearFromData)
            : new Date().getFullYear();
          setReportData({
            totalNotes: d.total_notes ?? d.analyzed_count ?? 0,
            totalBooks: d.total_books ?? 0,
            totalActivities: d.total_activities ?? 0,
            knowledgeDomains: d.knowledge_domains ?? [],
            milestones,
            cognitiveRadar: d.cognitive_radar || null,
            thinkingStyle: d.thinking_style || null,
            goldenQuotes: allQuotes,
            wordCloud,
            year: reportYear,
          });

          // Build a brief from thinking_style + analysis data
          if (d.thinking_style) {
            const ts = d.thinking_style;
            setWeeklyBrief({
              ...mockWeeklyBrief,
              insights: ts.traits?.slice(0, 3) || mockWeeklyBrief.insights,
              question: ts.description ? `如何进一步发展「${ts.type || '你的'}」思考风格？` : mockWeeklyBrief.question,
              highlights: ts.catchphrases?.slice(0, 2) || mockWeeklyBrief.highlights,
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch output data:', e);
      } finally {
        setQuotesLoading(false);
        setReportLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCopyQuote = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuote(id);
    setTimeout(() => setCopiedQuote(null), 2000);
  };

  const themeColors: Record<string, string> = {
    '认知科学': '#3b82f6',
    '自我管理': '#22c55e',
    '创新': '#f97316',
    '哲学': '#8b5cf6',
    '人生哲学': '#ec4899',
    '思维模型': '#eab308',
    '创业': '#ef4444',
    '自我认知': '#06b6d4',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">创意输出</h1>
        <p className="text-sm text-muted mt-1">将你的思考转化为有形的内容资产</p>
        {isRealData ? (
          <p className="text-xs text-accent-green mt-1">基于真实分析数据</p>
        ) : (
          <p className="text-xs text-muted mt-1">当前展示演示数据 · <a href="/notes" className="text-primary underline">去分析笔记</a></p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'brief' as Tab, label: '每周思想简报', icon: FileText },
          { id: 'quotes' as Tab, label: '个人金句集', icon: Quote },
          { id: 'report' as Tab, label: '年度思想报告', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-card border border-card-border text-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Weekly Brief */}
      {activeTab === 'brief' && (
        <div className="glass-card p-8 max-w-3xl mx-auto">
          {/* Newsletter Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
              个人思想简报
            </div>
            <h2 className="text-xl font-bold">本周思想回顾</h2>
            <p className="text-sm text-muted mt-1">
              {weeklyBrief.week_start} ~ {weeklyBrief.week_end}
            </p>
          </div>

          {/* Core Insights */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-accent-blue mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs">💡</span>
              三大核心洞察
            </h3>
            <div className="space-y-4">
              {weeklyBrief.insights.map((insight, i) => (
                <div key={i} className="flex gap-3 animate-fade-in" style={{ animationDelay: `${i * 200}ms` }}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shrink-0 text-white text-sm font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed pt-1">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Question */}
          <div className="mb-8 p-4 rounded-xl bg-accent-orange/5 border border-accent-orange/20">
            <h3 className="text-sm font-semibold text-accent-orange mb-2 flex items-center gap-2">
              <span>❓</span> 值得追问的问题
            </h3>
            <p className="text-sm text-foreground/80 italic">{weeklyBrief.question}</p>
          </div>

          {/* Highlights */}
          <div>
            <h3 className="text-sm font-semibold text-accent-green mb-3 flex items-center gap-2">
              <span>✨</span> 本周亮点
            </h3>
            <div className="flex gap-3">
              {weeklyBrief.highlights.map((h, i) => (
                <div key={i} className="flex-1 p-3 rounded-lg bg-accent-green/5 border border-accent-green/20 text-sm text-accent-green">
                  {h}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 mt-8 pt-6 border-t border-card-border">
            <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors flex items-center gap-2">
              <Share2 className="w-4 h-4" /> 分享简报
            </button>
            <button className="px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 text-sm transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> 导出 PDF
            </button>
          </div>
        </div>
      )}

      {/* Golden Quotes */}
      {activeTab === 'quotes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted">
              从你的笔记中自动提炼的最有洞见的句子，按主题分类
            </p>
            <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> 生成海报
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {quotesLoading ? (
              <div className="col-span-2 flex justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-muted">正在从笔记中提取金句...</p>
                </div>
              </div>
            ) : goldenQuotes.length === 0 ? (
              <div className="col-span-2 glass-card p-12 text-center">
                <div className="text-4xl mb-3">💡</div>
                <p className="text-base font-medium mb-2">还没有提取到金句</p>
                <p className="text-sm text-muted mb-4">
                  请先在笔记管理页面导入并分析笔记，AI 将自动从你的笔记中提取最有洞见的句子
                </p>
                <a href="/notes" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">
                  <FileText className="w-4 h-4" /> 去管理笔记
                </a>
              </div>
            ) : (
              goldenQuotes.sort((a, b) => b.score - a.score).map((quote) => {
              const color = themeColors[quote.theme] || '#7c5cfc';
              return (
                <div
                  key={quote.id}
                  className="glass-card glass-card-hover p-6 transition-all duration-300"
                >
                  {/* Quote mark */}
                  <div className="text-4xl mb-2 opacity-20" style={{ color }}>&ldquo;</div>

                  {/* Quote text */}
                  <p className="text-sm leading-relaxed text-foreground/85 mb-4">
                    {quote.text}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${color}15`, color }}
                      >
                        {quote.theme}
                      </span>
                      <p className="text-xs text-muted mt-1">— {quote.source_note_title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">洞见指数 {quote.score}</span>
                      <button
                        onClick={() => handleCopyQuote(quote.text, quote.id)}
                        className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <Copy className={cn('w-3.5 h-3.5', copiedQuote === quote.id ? 'text-accent-green' : 'text-muted')} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      )}

      {/* Annual Report */}
      {activeTab === 'report' && (
        <div className="glass-card p-8 max-w-3xl mx-auto">
          {reportLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted">正在加载年度报告数据...</p>
            </div>
          ) : !reportData || reportData.totalNotes === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-base font-medium mb-2">还没有足够的分析数据</p>
              <p className="text-sm text-muted mb-4">
                请先导入并分析笔记，年度报告将基于你的真实笔记数据自动生成
              </p>
              <a href="/notes" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">
                <FileText className="w-4 h-4" /> 去管理笔记
              </a>
            </div>
          ) : (() => {
            // Compute stats from real data
            const { totalNotes, totalBooks, totalActivities, knowledgeDomains, milestones, cognitiveRadar, thinkingStyle, goldenQuotes: reportQuotes, wordCloud, year } = reportData;
            const consolidateCount = milestones.filter(m => m.type === 'consolidate').length;
            const overturnCount = milestones.filter(m => m.type === 'overturn').length;
            const exploreCount = milestones.filter(m => m.type === 'explore').length;
            const milestoneCount = milestones.length;
            const domainCount = knowledgeDomains.length;
            // Calculate average cognitive depth from radar scores
            const radarVals = cognitiveRadar ? Object.values(cognitiveRadar).filter((v): v is number => typeof v === 'number') : [];
            const avgDepth = radarVals.length > 0 ? Math.round(radarVals.reduce((a, b) => a + b, 0) / radarVals.length) : 0;
            const maxQuoteScore = reportQuotes.length > 0 ? Math.max(...reportQuotes.map(q => q.score)) : 0;
            const topQuote = reportQuotes.length > 0
              ? reportQuotes.reduce((best, q) => q.score > best.score ? q : best, reportQuotes[0])
              : null;
            // Top keywords from word cloud (top 8 by weight)
            const topKeywords = [...wordCloud].sort((a, b) => b.weight - a.weight).slice(0, 8).map(w => w.text);
            // Cognitive journey: group milestones by month
            const monthColors = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#eab308', '#06b6d4', '#ef4444'];
            const monthMap = new Map<string, { label: string; count: number }>();
            milestones.forEach(m => {
              if (!m.date) return;
              const d = new Date(m.date);
              const key = `${d.getMonth() + 1}月`;
              const existing = monthMap.get(key);
              if (existing) {
                existing.count++;
              } else {
                monthMap.set(key, { label: m.title, count: 1 });
              }
            });
            const phases = Array.from(monthMap.entries()).map(([month, data], i) => ({
              month,
              label: data.label,
              color: monthColors[i % monthColors.length],
              count: data.count,
            }));
            const totalMilestoneWeight = phases.reduce((sum, p) => sum + p.count, 0) || 1;
            const statsData = [
              { label: '阅读笔记', value: `${totalNotes} 篇`, sub: `书籍 ${totalBooks} · 活动 ${totalActivities}` },
              { label: '认知升级', value: `${milestoneCount} 次`, sub: `巩固 ${consolidateCount} · 颠覆 ${overturnCount} · 开拓 ${exploreCount}` },
              { label: '知识领域', value: `${domainCount} 个`, sub: knowledgeDomains.slice(0, 4).join(' · ') || '暂无' },
              { label: '思考深度', value: `${avgDepth}/100`, sub: avgDepth >= 70 ? '深度思考者' : avgDepth >= 50 ? '均衡发展' : '成长中' },
              { label: '金句产出', value: `${reportQuotes.length} 条`, sub: maxQuoteScore > 0 ? `最高洞见指数 ${maxQuoteScore}` : '暂无金句' },
              { label: '思考风格', value: thinkingStyle?.type?.slice(0, 4) || '待分析', sub: thinkingStyle?.type || '暂无数据' },
            ];
            return (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold gradient-text mb-2">{year} 年度思想报告</h2>
                  <p className="text-sm text-muted">你的认知成长全景回顾</p>
                  <p className="text-xs text-accent-green mt-1">基于 {totalNotes} 篇真实笔记分析生成</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {statsData.map((stat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-secondary/20 text-center">
                      <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                      <p className="text-sm font-medium mt-1">{stat.label}</p>
                      <p className="text-xs text-muted mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Yearly Journey */}
                {phases.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-semibold mb-4">年度认知旅程</h3>
                    <div className="relative h-16 rounded-xl bg-secondary/10 overflow-hidden">
                      <div className="absolute inset-0 flex">
                        {phases.map((phase, i) => (
                          <div
                            key={i}
                            className="h-full flex items-center justify-center text-xs text-white font-medium border-r border-background/20"
                            style={{ backgroundColor: phase.color, width: `${Math.max((phase.count / totalMilestoneWeight) * 100, 10)}%`, opacity: 0.8 }}
                          >
                            <span>{phase.month} · {phase.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Annual Keywords */}
                {topKeywords.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-semibold mb-3">年度关键词</h3>
                    <div className="flex flex-wrap gap-2">
                      {topKeywords.map((word) => (
                        <span
                          key={word}
                          className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Annual Golden Quote */}
                {topQuote && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent-pink/5 border border-primary/20 text-center">
                    <p className="text-xs text-muted mb-2">年度最佳金句</p>
                    <p className="text-base font-medium leading-relaxed text-foreground/90 italic">
                      &ldquo;{topQuote.text}&rdquo;
                    </p>
                    <p className="text-xs text-muted mt-3">— {topQuote.source_note_title}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-center gap-3 mt-8 pt-6 border-t border-card-border">
                  <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" /> 导出长图
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 text-sm transition-colors flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> 分享到社交媒体
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
