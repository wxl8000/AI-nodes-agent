'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import RadarChart from '@/components/charts/RadarChart';
import WordCloud from '@/components/charts/WordCloud';
import Timeline from '@/components/charts/Timeline';
import Galaxy from '@/components/charts/Galaxy';
import {
  mockCognitiveRadar,
  mockUserSelfAssessment,
  mockWordCloud,
  mockMilestones,
  mockGalaxyNodes,
  mockGalaxyEdges,
  mockThinkingStyle,
} from '@/lib/mock/data';
import { COGNITIVE_DIMENSIONS, cn } from '@/lib/utils';
import { Sparkles, Loader2, Link } from 'lucide-react';
import type { CognitiveRadar, ThinkingStyle } from '@/types';

type Tab = 'radar' | 'wordcloud' | 'timeline' | 'galaxy';

const tabs = [
  { id: 'radar' as Tab, label: '认知雷达图', emoji: '🧠' },
  { id: 'wordcloud' as Tab, label: '思想词云', emoji: '☁️' },
  { id: 'timeline' as Tab, label: '认知里程碑', emoji: '📅' },
  { id: 'galaxy' as Tab, label: '知识星系', emoji: '🌌' },
];

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'radar';
  const [activeTab, setActiveTab] = useState<Tab>(['radar', 'wordcloud', 'timeline', 'galaxy'].includes(initialTab) ? initialTab : 'radar');
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);

  // Real data states
  const [cognitiveRadar, setCognitiveRadar] = useState<CognitiveRadar>(mockCognitiveRadar);
  const [wordCloud, setWordCloud] = useState(mockWordCloud);
  const [milestones, setMilestones] = useState(mockMilestones);
  const [galaxyNodes, setGalaxyNodes] = useState(mockGalaxyNodes);
  const [galaxyEdges, setGalaxyEdges] = useState(mockGalaxyEdges);
  const [thinkingStyle, setThinkingStyle] = useState<ThinkingStyle>(mockThinkingStyle);

  useEffect(() => {
    fetch('/api/analysis')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data && json.data.analyzed_count > 0) {
          setHasRealData(true);
          if (json.data.cognitive_radar) setCognitiveRadar(json.data.cognitive_radar);
          if (json.data.word_cloud?.length > 0) setWordCloud(json.data.word_cloud);
          if (json.data.milestones?.length > 0) setMilestones(json.data.milestones);
          if (json.data.galaxy?.nodes) {
            setGalaxyNodes(json.data.galaxy.nodes);
            setGalaxyEdges(json.data.galaxy.edges || []);
          }
          if (json.data.thinking_style) setThinkingStyle(json.data.thinking_style);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">认知可视化</h1>
          <p className="text-sm text-muted mt-1">
            把你的思想转化为直观的视觉展示
            {hasRealData && <span className="ml-2 text-accent-green">· 基于真实分析数据</span>}
          </p>
        </div>
        {!hasRealData && !loading && (
          <div className="glass-card px-4 py-3 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-accent-yellow" />
            <div>
              <p className="text-xs font-medium">当前展示演示数据</p>
              <p className="text-[10px] text-muted">在<a href="/notes" className="text-primary hover:underline">笔记页面</a>点击「AI 分析全部」后显示真实结果</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-card border border-card-border text-muted hover:text-foreground'
            )}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Radar Tab */}
          {activeTab === 'radar' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">认知六维雷达图</h2>
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      showComparison
                        ? 'bg-accent-pink/20 text-accent-pink border border-accent-pink/30'
                        : 'bg-secondary/50 text-muted hover:text-foreground'
                    )}
                  >
                    {showComparison ? '🎯 对比模式已开启' : '开启对比彩蛋'}
                  </button>
                </div>
                <RadarChart
                  aiRadar={cognitiveRadar}
                  userRadar={showComparison ? mockUserSelfAssessment : undefined}
                  showComparison={showComparison}
                />
              </div>

              {/* Dimension Details */}
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4">维度解析</h3>
                <div className="space-y-4">
                  {COGNITIVE_DIMENSIONS.map((dim) => {
                    const key = dim.key as keyof typeof cognitiveRadar;
                    const aiScore = cognitiveRadar[key];
                    const userScore = mockUserSelfAssessment[key];
                    const gap = showComparison ? Math.abs(aiScore - userScore) : 0;

                    return (
                      <div key={dim.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{dim.label}</span>
                          <span className="text-xs text-primary font-semibold">{aiScore}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-secondary/30 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent-purple transition-all duration-1000"
                            style={{ width: `${aiScore}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">vs {dim.opposite}</p>
                        {showComparison && gap > 10 && (
                          <p className="text-[10px] text-accent-pink mt-0.5">
                            ⚡ 差异 {gap} 分：自评 {userScore} vs AI {aiScore}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {showComparison && (
                  <div className="mt-4 pt-4 border-t border-card-border">
                    <p className="text-xs text-accent-pink font-medium mb-2">🎭 彩蛋发现</p>
                    <p className="text-xs text-muted leading-relaxed">
                      AI 基于你的笔记分析出的认知画像，可能和你自评的结果有差异，这正是认知的有趣之处。
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Word Cloud Tab */}
          {activeTab === 'wordcloud' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">思想词云 · 进阶版</h2>
              <WordCloud words={wordCloud} />
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-2">认知里程碑时间轴</h2>
              <p className="text-sm text-muted mb-6">记录你思想进化的每一个转折点</p>
              {milestones.length > 0 ? (
                <Timeline milestones={milestones} />
              ) : (
                <p className="text-sm text-muted text-center py-10">暂无里程碑数据，请先分析笔记</p>
              )}
            </div>
          )}

          {/* Galaxy Tab */}
          {activeTab === 'galaxy' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-2">知识领域星系图</h2>
              <p className="text-sm text-muted mb-4">你的知识宇宙全景</p>
              <Galaxy nodes={galaxyNodes} edges={galaxyEdges} />
            </div>
          )}
        </>
      )}

      {/* Thinking Style Card */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">思考风格诊断卡</h2>
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent-pink/20 border border-primary/30 mb-4">
              <span className="text-base font-bold gradient-text">{thinkingStyle.type}</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              {thinkingStyle.description}
            </p>
            <div>
              <h4 className="text-sm font-semibold mb-2">典型特征</h4>
              <div className="space-y-2">
                {(thinkingStyle.traits || []).map((trait: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {trait}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-64">
            <h4 className="text-sm font-semibold mb-3">你的思考口头禅</h4>
            <div className="space-y-2">
              {(thinkingStyle.catchphrases || []).map((phrase: string, i: number) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg bg-secondary/30 border border-card-border text-sm text-foreground/80 italic"
                >
                  &quot;{phrase}&quot;
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
