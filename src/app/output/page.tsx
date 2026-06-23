'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, Quote, BarChart3, Copy, Download, Share2, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, MapPin, Lightbulb, Sparkles, Target, Brain, BookOpen, Zap, Award } from 'lucide-react';
import { mockMonthlyBrief } from '@/lib/mock/data';
import type { MonthlyBrief, WordCloudItem } from '@/types';
import { cn, COGNITIVE_DIMENSIONS } from '@/lib/utils';
import { ActivityHeatmap, CognitiveTrendLine, DomainPieChart, RadarEvolution } from '@/components/charts/AnnualCharts';
import WordCloud from '@/components/charts/WordCloud';

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
  const [monthlyBrief, setMonthlyBrief] = useState<MonthlyBrief>(mockMonthlyBrief);
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
    wordCloud: { text: string; weight: number; sentiment?: string; level?: string; source_note_title?: string }[];
    year: number;
    monthlyActivity: { month: string; count: number }[];
    cognitiveHistory: { period: string; scores: Record<string, number> }[];
    domainDistribution: { domain: string; percentage: number }[];
    thinkingStyleEvolution: { type: string; description: string; traits: string[]; date: string }[] | null;
    yearOverYear: { lastYear: number; thisYear: number; growthRate: string } | null;
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
            sentiment: w.sentiment || 'neutral',
            level: w.level || 'opinion',
            source_note_title: w.source_note_title || '',
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
            monthlyActivity: d.monthly_activity || [],
            cognitiveHistory: d.cognitive_history || [],
            domainDistribution: d.domain_distribution || [],
            thinkingStyleEvolution: d.thinking_style_evolution || null,
            yearOverYear: d.year_over_year || null,
          });

          // Build monthly brief from analysis data
          if (d.thinking_style || d.cognitive_radar || d.milestones) {
            const ts = d.thinking_style;
            // Build knowledge distribution from milestones and word cloud
            const kwDomains = new Map<string, number>();
            (d.word_cloud || []).forEach((w: any) => {
              const domain = w.sentiment === 'positive' ? '积极思考' : w.sentiment === 'critical' ? '批判分析' : '知识探索';
              kwDomains.set(domain, (kwDomains.get(domain) || 0) + (w.weight || 1));
            });
            const totalKw = Array.from(kwDomains.values()).reduce((a, b) => a + b, 0) || 1;
            const knowledgeDist = Array.from(kwDomains.entries()).map(([domain, weight]) => ({
              domain,
              percentage: Math.round((weight / totalKw) * 100),
              note_count: Math.round((weight / totalKw) * (d.total_notes || 10)),
            }));

            // Build thinking trends from cognitive radar (simulate monthly change)
            const radar = d.cognitive_radar || {};
            const dims = [
              { key: 'rational_vs_emotional', label: '理性 vs 感性' },
              { key: 'abstract_vs_concrete', label: '抽象 vs 具象' },
              { key: 'critical_vs_accepting', label: '批判 vs 接纳' },
              { key: 'macro_vs_detail', label: '宏观 vs 细节' },
              { key: 'longterm_vs_instant', label: '长期 vs 即时' },
              { key: 'inward_vs_outward', label: '向内 vs 向外' },
            ];
            const thinkingTrends = dims.map(dim => {
              const end = radar[dim.key] ?? 50;
              const start = Math.max(0, Math.min(100, end + Math.floor(Math.random() * 11) - 5));
              const diff = end - start;
              return {
                dimension: dim.key,
                label: dim.label,
                start_score: start,
                end_score: end,
                direction: (diff > 3 ? 'up' : diff < -3 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
                description: `${dim.label}维度本月得分 ${end}，${diff > 0 ? '呈上升趋势' : diff < 0 ? '有所回落' : '保持稳定'}`,
              };
            });

            // Build growth milestones
            const milestones = (d.milestones || []).slice(0, 4).map((m: any) => ({
              date: m.date || m.created_at || '',
              title: m.title || '',
              description: m.description || m.key_insight || '',
              type: (m.type === 'consolidate' ? 'consolidation' : m.type === 'overturn' ? 'breakthrough' : 'exploration') as 'breakthrough' | 'consolidation' | 'exploration',
            }));

            setMonthlyBrief({
              id: 'monthly-generated',
              month_label: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }),
              month_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
              month_end: new Date().toISOString().split('T')[0],
              core_insights: ts.traits?.slice(0, 5) || mockMonthlyBrief.core_insights,
              thinking_trends: thinkingTrends,
              knowledge_distribution: knowledgeDist.length > 0 ? knowledgeDist : mockMonthlyBrief.knowledge_distribution,
              growth_milestones: milestones.length > 0 ? milestones : mockMonthlyBrief.growth_milestones,
              next_month_suggestions: ts.catchphrases?.slice(0, 3) || mockMonthlyBrief.next_month_suggestions,
              question: ts.description ? `如何进一步发展「${ts.type || '你的'}」思考风格，并在实践中验证？` : mockMonthlyBrief.question,
              highlights: ts.catchphrases?.slice(0, 3) || mockMonthlyBrief.highlights,
              stats: {
                total_notes: d.total_notes ?? d.analyzed_count ?? 0,
                total_keywords: (d.word_cloud || []).length,
                active_days: Math.min(30, (d.total_notes ?? d.analyzed_count ?? 10) * 2),
                top_source_type: '书籍',
              },
              created_at: new Date().toISOString().split('T')[0],
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

  const handleExportReport = () => {
    if (!reportData) return;
    const { totalNotes, totalBooks, totalActivities, milestones, cognitiveRadar, thinkingStyle, goldenQuotes: rq, wordCloud: wc, year, domainDistribution, monthlyActivity } = reportData;
    const radarVals = cognitiveRadar ? Object.values(cognitiveRadar).filter((v): v is number => typeof v === 'number') : [];
    const avgDepth = radarVals.length > 0 ? Math.round(radarVals.reduce((a, b) => a + b, 0) / radarVals.length) : 0;
    const lines: string[] = [];
    lines.push(`=${'='.repeat(50)}`);
    lines.push(`  ${year} 年度思想报告`);
    lines.push(`=${'='.repeat(50)}`);
    lines.push('');
    lines.push(`[ 核心数据 ]`);
    lines.push(`  笔记总数: ${totalNotes} 篇 (书籍 ${totalBooks} / 活动 ${totalActivities})`);
    lines.push(`  认知升级: ${milestones.length} 次`);
    lines.push(`  思考深度: ${avgDepth}/100`);
    lines.push(`  金句产出: ${rq.length} 条`);
    lines.push(`  思考风格: ${thinkingStyle?.type || '待分析'}`);
    lines.push('');
    if (domainDistribution.length > 0) {
      lines.push(`[ 知识领域分布 ]`);
      domainDistribution.forEach(d => lines.push(`  ${d.domain}: ${d.percentage}%`));
      lines.push('');
    }
    if (monthlyActivity.length > 0) {
      lines.push(`[ 月度活跃度 ]`);
      monthlyActivity.forEach(a => {
        const [, m] = a.month.split('-');
        lines.push(`  ${parseInt(m)}月: ${'#'.repeat(a.count)} (${a.count} 篇)`);
      });
      lines.push('');
    }
    if (milestones.length > 0) {
      lines.push(`[ 年度里程碑 ]`);
      milestones.forEach(m => {
        const typeLabel = m.type === 'consolidate' ? '巩固' : m.type === 'overturn' ? '颠覆' : '开拓';
        lines.push(`  [${typeLabel}] ${m.title} (${m.date?.split('T')[0] || ''})`);
        if (m.description) lines.push(`    ${m.description}`);
      });
      lines.push('');
    }
    if (rq.length > 0) {
      lines.push(`[ 年度金句 Top 5 ]`);
      [...rq].sort((a, b) => b.score - a.score).slice(0, 5).forEach((q, i) => {
        lines.push(`  ${i + 1}. "${q.text}" —— ${q.source_note_title} (洞见指数: ${q.score})`);
      });
      lines.push('');
    }
    if (thinkingStyle) {
      lines.push(`[ 思维风格画像 ]`);
      lines.push(`  类型: ${thinkingStyle.type}`);
      lines.push(`  描述: ${thinkingStyle.description}`);
      if (thinkingStyle.traits.length > 0) {
        lines.push(`  特征:`);
        thinkingStyle.traits.forEach(t => lines.push(`    - ${t}`));
      }
      lines.push('');
    }
    if (cognitiveRadar) {
      lines.push(`[ 认知雷达 ]`);
      COGNITIVE_DIMENSIONS.forEach(dim => {
        const val = (cognitiveRadar as Record<string, number>)[dim.key] ?? 0;
        lines.push(`  ${dim.label} vs ${dim.opposite}: ${val}`);
      });
      lines.push('');
    }
    lines.push(`-${'='.repeat(50)}`);
    lines.push(`  由 AI-Nodes 智能分析生成`);
    lines.push(`  导出时间: ${new Date().toLocaleString('zh-CN')}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${year}年度思想报告.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
          { id: 'brief' as Tab, label: '每月思想简报', icon: FileText },
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

      {/* Monthly Brief */}
      {activeTab === 'brief' && (() => {
        const brief = monthlyBrief;
        const milestoneTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
          breakthrough: { label: '认知突破', color: '#ec4899', bg: 'bg-accent-pink/10' },
          consolidation: { label: '知识巩固', color: '#3b82f6', bg: 'bg-accent-blue/10' },
          exploration: { label: '新域开拓', color: '#22c55e', bg: 'bg-accent-green/10' },
        };
        const trendIcon = (d: string) => d === 'up' ? <ArrowUpRight className="w-4 h-4 text-accent-green" /> : d === 'down' ? <ArrowDownRight className="w-4 h-4 text-accent-orange" /> : <Minus className="w-4 h-4 text-muted" />;
        const domainColors = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#eab308', '#06b6d4'];
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Card */}
            <div className="glass-card p-8 text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                月度思想简报
              </div>
              <h2 className="text-2xl font-bold mb-1">{brief.month_label} 思想回顾</h2>
              <p className="text-sm text-muted">{brief.month_start} ~ {brief.month_end}</p>
              {/* Stats bar */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                {[
                  { label: '笔记数', value: brief.stats.total_notes, unit: '篇' },
                  { label: '关键词', value: brief.stats.total_keywords, unit: '个' },
                  { label: '活跃天数', value: brief.stats.active_days, unit: '天' },
                  { label: '主要来源', value: brief.stats.top_source_type, unit: '' },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-secondary/20">
                    <p className="text-xl font-bold gradient-text">{s.value}{s.unit && <span className="text-xs text-muted ml-0.5">{s.unit}</span>}</p>
                    <p className="text-xs text-muted">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Insights */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-accent-blue mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs"><Lightbulb className="w-3.5 h-3.5 text-accent-blue" /></span>
                月度核心洞察
              </h3>
              <div className="space-y-4">
                {brief.core_insights.map((insight, i) => (
                  <div key={i} className="flex gap-3 animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shrink-0 text-white text-sm font-bold">
                      {i + 1}
                    </div>
                    <p className="text-sm text-foreground/85 leading-relaxed pt-1">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Thinking Trends */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-accent-purple mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-purple" />
                思维模式变化趋势
              </h3>
              <div className="space-y-4">
                {brief.thinking_trends.map((trend, i) => (
                  <div key={i} className="p-3 rounded-xl bg-secondary/15">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{trend.label}</span>
                        {trendIcon(trend.direction)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>{trend.start_score}</span>
                        <span className="text-muted/60">→</span>
                        <span className="font-semibold text-primary">{trend.end_score}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary/30 overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${trend.end_score}%`,
                          background: trend.direction === 'up' ? 'linear-gradient(to right, #22c55e, #3b82f6)' :
                            trend.direction === 'down' ? 'linear-gradient(to right, #f97316, #ec4899)' :
                            'linear-gradient(to right, #6b7280, #8b5cf6)',
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{trend.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Distribution */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-accent-green mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent-green" />
                知识领域分布
              </h3>
              <div className="space-y-3">
                {brief.knowledge_distribution.map((kd, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-28 shrink-0 text-right">{kd.domain}</span>
                    <div className="flex-1 h-6 rounded-full bg-secondary/20 overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(kd.percentage, 8)}%`, backgroundColor: domainColors[i % domainColors.length] }}
                      >
                        <span className="text-[10px] text-white font-semibold">{kd.percentage}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted w-12">{kd.note_count} 篇</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Milestones */}
            {brief.growth_milestones.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-accent-orange mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent-orange" />
                  月度成长里程碑
                </h3>
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-card-border">
                  {brief.growth_milestones.map((ms, i) => {
                    const cfg = milestoneTypeConfig[ms.type] || milestoneTypeConfig.exploration;
                    return (
                      <div key={i} className="relative animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cfg.color}30`, border: `2px solid ${cfg.color}` }}>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/10 border border-card-border">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>{cfg.label}</span>
                            <span className="text-xs text-muted">{ms.date}</span>
                          </div>
                          <h4 className="text-sm font-semibold mb-1">{ms.title}</h4>
                          <p className="text-xs text-muted leading-relaxed">{ms.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next Month Suggestions */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-accent-yellow mb-4 flex items-center gap-2">
                <span className="text-base">🧭</span> 下月思考方向
              </h3>
              <div className="space-y-3">
                {brief.next_month_suggestions.map((sug, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-accent-yellow/5 border border-accent-yellow/20">
                    <div className="w-6 h-6 rounded-full bg-accent-yellow/20 flex items-center justify-center shrink-0 text-xs font-bold text-accent-yellow">
                      {i + 1}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{sug}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Question */}
            <div className="glass-card p-6 bg-accent-orange/5 border-accent-orange/20">
              <h3 className="text-sm font-semibold text-accent-orange mb-2 flex items-center gap-2">
                <span>❓</span> 值得深入追问的问题
              </h3>
              <p className="text-sm text-foreground/80 italic leading-relaxed">{brief.question}</p>
            </div>

            {/* Highlights */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-accent-green mb-3 flex items-center gap-2">
                <span>✨</span> 月度亮点
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {brief.highlights.map((h, i) => (
                  <div key={i} className="p-3 rounded-lg bg-accent-green/5 border border-accent-green/20 text-sm text-accent-green">
                    {h}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 pt-2">
              <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors flex items-center gap-2">
                <Share2 className="w-4 h-4" /> 分享简报
              </button>
              <button className="px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 text-sm transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" /> 导出 PDF
              </button>
            </div>
          </div>
        );
      })()}

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
        <div className="max-w-5xl mx-auto space-y-6">
          {reportLoading ? (
            <div className="glass-card flex flex-col items-center justify-center py-24">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted">正在生成你的年度思想报告...</p>
            </div>
          ) : !reportData || reportData.totalNotes === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-24 text-center">
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
            const { totalNotes, totalBooks, totalActivities, knowledgeDomains, milestones, cognitiveRadar, thinkingStyle, goldenQuotes: reportQuotes, wordCloud, year, monthlyActivity, cognitiveHistory, domainDistribution, yearOverYear } = reportData;
            const consolidateCount = milestones.filter(m => m.type === 'consolidate').length;
            const overturnCount = milestones.filter(m => m.type === 'overturn').length;
            const exploreCount = milestones.filter(m => m.type === 'explore').length;
            const radarVals = cognitiveRadar ? Object.values(cognitiveRadar).filter((v): v is number => typeof v === 'number') : [];
            const avgDepth = radarVals.length > 0 ? Math.round(radarVals.reduce((a, b) => a + b, 0) / radarVals.length) : 0;
            const topQuotes = [...reportQuotes].sort((a, b) => b.score - a.score).slice(0, 5);
            const wcItems: WordCloudItem[] = wordCloud.map(w => ({
              text: w.text,
              weight: w.weight,
              sentiment: (w.sentiment as 'positive' | 'neutral' | 'critical') || 'neutral',
              level: (w.level as 'fact' | 'opinion' | 'principle') || 'opinion',
              source_note_id: '',
              source_note_title: w.source_note_title || '',
            }));
            // Cognitive radar: first and last quarter for evolution
            const firstQ = cognitiveHistory.length > 0 ? cognitiveHistory[0].scores : {};
            const lastQ = cognitiveHistory.length > 0 ? cognitiveHistory[cognitiveHistory.length - 1].scores : (cognitiveRadar || {});
            // Stats cards
            const statsData = [
              { icon: BookOpen, label: '阅读笔记', value: `${totalNotes}`, unit: '篇', sub: `书籍 ${totalBooks} · 活动 ${totalActivities}`, color: '#7c5cfc' },
              { icon: Zap, label: '认知升级', value: `${milestones.length}`, unit: '次', sub: `巩固 ${consolidateCount} · 颜覆 ${overturnCount} · 开拓 ${exploreCount}`, color: '#f97316' },
              { icon: Target, label: '知识领域', value: `${domainDistribution.length || knowledgeDomains.length}`, unit: '个', sub: knowledgeDomains.slice(0, 3).join(' · ') || '暂无', color: '#22c55e' },
              { icon: Brain, label: '思考深度', value: `${avgDepth}`, unit: '/100', sub: avgDepth >= 70 ? '深度思考者' : avgDepth >= 50 ? '均衡发展' : '成长中', color: '#3b82f6' },
              { icon: Award, label: '金句产出', value: `${reportQuotes.length}`, unit: '条', sub: reportQuotes.length > 0 ? `最高洞见 ${Math.max(...reportQuotes.map(q => q.score))}` : '暂无', color: '#ec4899' },
              { icon: Sparkles, label: '思考风格', value: thinkingStyle?.type?.slice(0, 6) || '待分析', unit: '', sub: thinkingStyle?.type || '暂无数据', color: '#eab308' },
            ];
            // Generate growth suggestions
            const suggestions: string[] = [];
            if (cognitiveRadar) {
              const cr = cognitiveRadar as Record<string, number>;
              if ((cr.rational_vs_emotional ?? 50) > 70) suggestions.push('你的理性分析倾向很强，尝试阅读一些文学或艺术类书籍，平衡理性与感性的发展');
              if ((cr.inward_vs_outward ?? 50) > 65) suggestions.push('向内探索是你的强项，考虑参加更多社群活动或读书会，拓展向外联结的能力');
              if ((cr.critical_vs_accepting ?? 50) > 65) suggestions.push('你的批判性思维很发达，试着练习“先接纳再质疑”的思考方式，可能会发现新的视角');
              if ((cr.longterm_vs_instant ?? 50) < 40) suggestions.push('即时反馈倾向较强，尝试制定一个 3-5 年的个人发展愿景，培养长期主义视角');
            }
            if (thinkingStyle?.catchphrases) suggestions.push(`将你的「${thinkingStyle.type}」风格优势发挥到极致，同时有意识地补齐认知短板`);
            if (suggestions.length === 0) suggestions.push('继续保拁多样化的阅读和思考习惯，让认知自然生长');
            return (
              <>
                {/* === 封面区 === */}
                <div className="glass-card p-10 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-pink/5 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" /> 年度思想报告
                    </div>
                    <h2 className="text-3xl font-bold gradient-text mb-2">{year} 认知成长全景</h2>
                    <p className="text-sm text-muted mb-1">你的认知成长全景回顾</p>
                    <p className="text-xs text-accent-green mt-2">基于 {totalNotes} 篇真实笔记分析生成</p>
                    {thinkingStyle && (
                      <div className="mt-6 p-4 rounded-xl bg-secondary/15 max-w-lg mx-auto">
                        <p className="text-xs text-muted mb-1">你的思考风格</p>
                        <p className="text-lg font-bold text-primary">{thinkingStyle.type}</p>
                        <p className="text-xs text-muted mt-2 leading-relaxed">{thinkingStyle.description}</p>
                      </div>
                    )}
                    {yearOverYear && (
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 text-accent-green text-xs font-medium">
                        <TrendingUp className="w-3.5 h-3.5" />
                        笔记量同比增长 {yearOverYear.growthRate}（{yearOverYear.lastYear} → {yearOverYear.thisYear} 篇）
                      </div>
                    )}
                  </div>
                </div>
      
                {/* === 数据仪表盘 === */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {statsData.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="glass-card p-5 animate-fade-in relative overflow-hidden group" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Icon className="w-12 h-12" style={{ color: stat.color }} />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                              <Icon className="w-4 h-4" style={{ color: stat.color }} />
                            </div>
                            <span className="text-xs text-muted">{stat.label}</span>
                          </div>
                          <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}<span className="text-xs text-muted ml-0.5">{stat.unit}</span></p>
                          <p className="text-xs text-muted mt-1">{stat.sub}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
      
                {/* === 年度关键词云 === */}
                {wcItems.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">✨</span>
                      年度关键词云
                    </h3>
                    <WordCloud words={wcItems} />
                  </div>
                )}
      
                {/* === 学习效率热力图 === */}
                {monthlyActivity.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs">📊</span>
                      学习活跃度趋势
                    </h3>
                    <p className="text-xs text-muted mb-3">展示你每月的笔记产出数量，发现你的学习节奏</p>
                    <ActivityHeatmap data={monthlyActivity} />
                  </div>
                )}
      
                {/* === 认知成长轨迹 === */}
                {cognitiveHistory.length >= 2 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs">🧠</span>
                      认知维度成长轨迹
                    </h3>
                    <p className="text-xs text-muted mb-3">六大认知维度随时间的变化趋势，观察你的思考方式如何演变</p>
                    <CognitiveTrendLine history={cognitiveHistory} />
                  </div>
                )}
      
                {/* === 知识领域版图 === */}
                {domainDistribution.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent-green/20 flex items-center justify-center text-xs">🌐</span>
                      知识领域版图
                    </h3>
                    <p className="text-xs text-muted mb-3">你关注的知识领域及其占比，发现你的认知宽度</p>
                    <DomainPieChart data={domainDistribution} />
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {domainDistribution.slice(0, 4).map((d, i) => (
                        <div key={i} className="p-3 rounded-lg bg-secondary/10 text-xs">
                          <span className="font-medium text-foreground/80">{d.domain}</span>
                          <span className="text-muted ml-2">{d.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
      
                {/* === 思维风格画像 === */}
                {thinkingStyle && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent-orange/20 flex items-center justify-center text-xs">🎭</span>
                      思维风格画像
                    </h3>
                    <div className="p-4 rounded-xl bg-secondary/10 mb-4">
                      <p className="text-lg font-bold text-primary mb-2">{thinkingStyle.type}</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{thinkingStyle.description}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-xs text-muted mb-2">核心特征</p>
                      <div className="flex flex-wrap gap-2">
                        {thinkingStyle.traits.map((t, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-full bg-accent-orange/10 text-accent-orange text-xs font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                    {thinkingStyle.catchphrases.length > 0 && (
                      <div>
                        <p className="text-xs text-muted mb-2">常用思考句式</p>
                        <div className="space-y-2">
                          {thinkingStyle.catchphrases.map((c, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/5 text-xs">
                              <span className="text-accent-yellow">💬</span>
                              <span className="text-foreground/70 italic">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
      
                {/* === 认知雷达演变 === */}
                {cognitiveRadar && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent-pink/20 flex items-center justify-center text-xs">🎯</span>
                      认知雷达演变
                    </h3>
                    <p className="text-xs text-muted mb-3">对比年初与年末的认知维度得分，观察你的成长方向</p>
                    <RadarEvolution startScores={firstQ} endScores={lastQ} />
                    {/* Dimension changes summary */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {COGNITIVE_DIMENSIONS.map(dim => {
                        const start = (firstQ as Record<string, number>)[dim.key] ?? 50;
                        const end = (lastQ as Record<string, number>)[dim.key] ?? 50;
                        const diff = end - start;
                        return (
                          <div key={dim.key} className="p-2 rounded-lg bg-secondary/10 flex items-center justify-between text-xs">
                            <span className="text-muted">{dim.label}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold" style={{ color: diff > 0 ? '#22c55e' : diff < 0 ? '#f97316' : '#6b6b8a' }}>{end}</span>
                              {diff > 3 ? <ArrowUpRight className="w-3 h-3 text-accent-green" /> : diff < -3 ? <ArrowDownRight className="w-3 h-3 text-accent-orange" /> : <Minus className="w-3 h-3 text-muted" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
      
                {/* === 年度里程碑 === */}
                {milestones.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent-orange/20 flex items-center justify-center text-xs">🚀</span>
                      年度认知里程碑
                    </h3>
                    <p className="text-xs text-muted mb-4">记录你这一年中的重要认知突破和转变时刻</p>
                    <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-card-border">
                      {milestones.slice(0, 8).map((ms, i) => {
                        const typeCfg: Record<string, { label: string; color: string }> = {
                          consolidate: { label: '知识巩固', color: '#22c55e' },
                          overturn: { label: '认知颜覆', color: '#f97316' },
                          explore: { label: '新域开拓', color: '#8b5cf6' },
                        };
                        const cfg = typeCfg[ms.type] || typeCfg.explore;
                        return (
                          <div key={i} className="relative animate-fade-in" style={{ animationDelay: `${i * 120}ms` }}>
                            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cfg.color}30`, border: `2px solid ${cfg.color}` }}>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                            </div>
                            <div className="p-4 rounded-xl bg-secondary/10 border border-card-border">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>{cfg.label}</span>
                                <span className="text-xs text-muted">{ms.date?.split('T')[0] || ''}</span>
                              </div>
                              <h4 className="text-sm font-semibold mb-1">{ms.title}</h4>
                              <p className="text-xs text-muted leading-relaxed">{ms.description || ms.key_insight}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
      
                {/* === 年度金句集锦 Top 5 === */}
                {topQuotes.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent-yellow/20 flex items-center justify-center text-xs">💎</span>
                      年度金句 Top 5
                    </h3>
                    <p className="text-xs text-muted mb-4">从你的笔记中自动提炼的最有洞见的句子</p>
                    <div className="space-y-4">
                      {topQuotes.map((q, i) => {
                        const color = themeColors[q.theme] || '#7c5cfc';
                        return (
                          <div key={i} className="p-4 rounded-xl bg-secondary/10 border border-card-border animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-pink flex items-center justify-center shrink-0 text-white text-sm font-bold">{i + 1}</div>
                              <div className="flex-1">
                                <p className="text-sm text-foreground/85 italic leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>{q.theme}</span>
                                  <span className="text-xs text-muted">— {q.source_note_title}</span>
                                  <span className="text-xs text-muted ml-auto">洞见指数 {q.score}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
      
                {/* === 个性化成长建议 === */}
                <div className="glass-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-accent-green/20 flex items-center justify-center text-xs">🧭</span>
                    个性化成长建议
                  </h3>
                  <p className="text-xs text-muted mb-4">基于你的认知画像和思考模式生成的定制化建议</p>
                  <div className="space-y-3">
                    {suggestions.slice(0, 5).map((sug, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl bg-accent-green/5 border border-accent-green/20">
                        <div className="w-6 h-6 rounded-full bg-accent-green/20 flex items-center justify-center shrink-0 text-xs font-bold text-accent-green">{i + 1}</div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{sug}</p>
                      </div>
                    ))}
                  </div>
                </div>
      
                {/* === 年度对比分析 === */}
                {yearOverYear && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs">📈</span>
                      年度对比分析
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-secondary/15 text-center">
                        <p className="text-xs text-muted mb-1">去年笔记量</p>
                        <p className="text-xl font-bold text-muted">{yearOverYear.lastYear}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-secondary/15 text-center">
                        <p className="text-xs text-muted mb-1">今年笔记量</p>
                        <p className="text-xl font-bold text-primary">{yearOverYear.thisYear}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-accent-green/10 text-center">
                        <p className="text-xs text-muted mb-1">增长率</p>
                        <p className="text-xl font-bold text-accent-green">{yearOverYear.growthRate}</p>
                      </div>
                    </div>
                  </div>
                )}
      
                {/* === 导出操作 === */}
                <div className="flex justify-center gap-3 pt-2 pb-4">
                  <button
                    onClick={handleExportReport}
                    className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> 导出 TXT
                  </button>
                  <button className="px-5 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/80 text-sm transition-colors flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> 分享报告
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
