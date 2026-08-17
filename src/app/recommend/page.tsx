// Copyright 2026 WXL8000
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use client';

import { useState, useEffect } from 'react';
import { BookOpen, AlertTriangle, Zap, Link2, Eye, ArrowRight } from 'lucide-react';
import { mockBookRecommendations, mockConceptNodes, mockConceptEdges, mockNotes } from '@/lib/mock/data';
import { cn } from '@/lib/utils';

type Tab = 'books' | 'network' | 'blindspot';

export default function RecommendPage() {
  const [activeTab, setActiveTab] = useState<Tab>('books');
  const [expandedBook, setExpandedBook] = useState<number | null>(null);
  const [isRealData, setIsRealData] = useState(false);
  const [books, setBooks] = useState(mockBookRecommendations);
  const [conceptNodes, setConceptNodes] = useState(mockConceptNodes);
  const [conceptEdges, setConceptEdges] = useState(mockConceptEdges);
  const [notes, setNotes] = useState(mockNotes);

  useEffect(() => {
    async function fetchData() {
      try {
        const [analysisRes, notesRes] = await Promise.all([
          fetch('/api/analysis'),
          fetch('/api/notes'),
        ]);
        const analysisJson = await analysisRes.json();
        const notesJson = await notesRes.json();

        // Use real notes if available
        if (notesJson.success && notesJson.data?.length > 0) {
          setNotes(notesJson.data);
        }

        if (analysisJson.success && analysisJson.data) {
          const d = analysisJson.data;
          setIsRealData(true);

          // Book recommendations
          if (d.book_recommendations?.length > 0) {
            setBooks(d.book_recommendations.map((b: any) => ({
              title: b.title || b.book_title || '未知',
              author: b.author || '未知',
              reason: b.reason || b.description || '',
              gap_type: b.gap_type || 'weak_area',
              related_notes: b.related_notes || [],
              urgency: b.urgency || 'medium',
            })));
          }

          // Concept network from galaxy or word_cloud
          if (d.galaxy?.nodes?.length > 0) {
            setConceptNodes(d.galaxy.nodes.map((n: any, i: number) => ({
              id: n.id || `c-${i}`,
              name: n.name || '',
              occurrences: n.weight || 1,
              related_notes: (n.related_notes || []).map((nid: string) => ({
                note_id: nid,
                note_title: notesJson.data?.find((nn: any) => nn.id === nid)?.title || nid,
                snippet: '',
              })),
            })));
          }
          if (d.galaxy?.edges?.length > 0) {
            setConceptEdges(d.galaxy.edges.map((e: any, i: number) => ({
              source: e.source || '',
              target: e.target || '',
              relation: e.relation || `关联强度 ${Math.round((e.strength || 0.5) * 100)}%`,
            })));
          }
        }
      } catch (e) {
        console.error('Failed to fetch recommend data:', e);
      }
    }
    fetchData();
  }, []);

  const gapTypeConfig = {
    weak_area: { label: '薄弱环节', icon: AlertTriangle, color: '#f97316', bg: 'bg-accent-orange/15' },
    shallow_topic: { label: '浅尝辄止', icon: Eye, color: '#8b5cf6', bg: 'bg-accent-purple/15' },
    contradiction: { label: '观点矛盾', icon: Zap, color: '#ec4899', bg: 'bg-accent-pink/15' },
  };

  const urgencyConfig = {
    high: { label: '急需', color: '#ef4444' },
    medium: { label: '推荐', color: '#f59e0b' },
    low: { label: '可选', color: '#6b7280' },
  };

  // Calculate blind spots from mock data
  const blindSpots = [
    {
      area: '情感与人文',
      description: '你的笔记大量聚焦于理性决策和系统思维，较少涉及情感管理、人文艺术和关系建设',
      risk: 'high',
      suggestion: '尝试阅读一些文学类或心理学类书籍，关注非理性的正面价值',
    },
    {
      area: '实践落地',
      description: '你倾向于分析和思考，但较少记录实际的行动计划和执行结果',
      risk: 'medium',
      suggestion: '在每篇笔记末尾增加"下一步行动"部分，并定期回顾',
    },
    {
      area: '跨文化视角',
      description: '你的阅读和思考主要基于中文和西方视角，缺少东方哲学和非主流文化的输入',
      risk: 'medium',
      suggestion: '尝试阅读一些日本、印度或非洲作者的作品',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">智能推荐</h1>
        <p className="text-sm text-muted mt-1">比你更懂你需要什么</p>
        {isRealData ? (
          <p className="text-xs text-accent-green mt-1">基于真实分析数据</p>
        ) : (
          <p className="text-xs text-muted mt-1">当前展示演示数据 · <a href="/notes" className="text-primary underline">去分析笔记</a></p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'books' as Tab, label: '认知缺口书单', icon: BookOpen },
          { id: 'network' as Tab, label: '概念关联网络', icon: Link2 },
          { id: 'blindspot' as Tab, label: '认知盲区预警', icon: Eye },
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

      {/* Book Recommendations */}
      {activeTab === 'books' && (
        <div className="space-y-4">
          <div className="glass-card p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-foreground/80">
              以下推荐基于你的笔记分析，重点弥补你知识体系中的薄弱环节，而非推荐你喜欢的同类书。
            </p>
          </div>

          {books.map((book, index) => {
            const gapConfig = gapTypeConfig[book.gap_type];
            const urgencyInfo = urgencyConfig[book.urgency];
            const GapIcon = gapConfig.icon;
            const isExpanded = expandedBook === index;

            return (
              <div
                key={index}
                className={cn(
                  'glass-card glass-card-hover p-5 cursor-pointer transition-all duration-300',
                  isExpanded && 'border-primary/50'
                )}
                onClick={() => setExpandedBook(isExpanded ? null : index)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-secondary to-card-border flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-muted" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{book.title}</h3>
                      <span className="text-xs text-muted">— {book.author}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full flex items-center gap-1', gapConfig.bg)} style={{ color: gapConfig.color }}>
                        <GapIcon className="w-3 h-3" /> {gapConfig.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${urgencyInfo.color}20`, color: urgencyInfo.color }}>
                        {urgencyInfo.label}
                      </span>
                    </div>
                    <p className={cn('text-sm text-foreground/75 leading-relaxed', !isExpanded && 'line-clamp-2')}>
                      {book.reason}
                    </p>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-card-border animate-fade-in">
                        <h4 className="text-xs font-semibold text-muted mb-2">相关笔记</h4>
                        <div className="flex gap-2 flex-wrap">
                          {book.related_notes.map((noteId: string) => {
                            const note = notes.find((n) => n.id === noteId);
                            return note ? (
                              <span key={noteId} className="text-xs px-2 py-1 rounded-lg bg-secondary/30">
                                {note.title}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <ArrowRight className={cn('w-4 h-4 text-muted transition-transform', isExpanded && 'rotate-90')} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Concept Network */}
      {activeTab === 'network' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">跨笔记概念关联网络</h2>
            <div className="space-y-4">
              {conceptNodes.map((concept) => (
                <div key={concept.id} className="p-4 rounded-xl bg-secondary/20 border border-card-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {concept.occurrences}
                    </div>
                    <h3 className="font-semibold">{concept.name}</h3>
                    <span className="text-xs text-muted">出现 {concept.occurrences} 次</span>
                  </div>
                  <div className="space-y-2 ml-11">
                    {concept.related_notes.map((note, i) => (
                      <div key={i} className="text-xs text-muted flex items-start gap-2">
                        <span className="text-primary shrink-0">📎</span>
                        <div>
                          <span className="font-medium text-foreground/70">{note.note_title}</span>
                          <span className="ml-2 italic">&quot;{note.snippet}&quot;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relations */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">概念关联</h3>
            <div className="space-y-3">
              {conceptEdges.map((edge, i) => {
                const source = conceptNodes.find((n) => n.id === edge.source);
                const target = conceptNodes.find((n) => n.id === edge.target);
                return (
                  <div key={i} className="p-3 rounded-lg bg-secondary/20 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-primary font-medium">{source?.name}</span>
                      <span className="text-muted">→</span>
                      <span className="text-accent-blue font-medium">{target?.name}</span>
                    </div>
                    <p className="text-muted">{edge.relation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Blind Spot */}
      {activeTab === 'blindspot' && (
        <div className="space-y-4">
          <div className="glass-card p-4 bg-accent-orange/5 border-accent-orange/20">
            <p className="text-sm text-foreground/80">
              以下分析基于你所有笔记的综合评估，标识了你可能存在认知盲区的领域。
            </p>
          </div>

          {blindSpots.map((spot, i) => (
            <div key={i} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: spot.risk === 'high' ? '#ef4444' : '#f59e0b' }}
                />
                <h3 className="font-semibold">{spot.area}</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: spot.risk === 'high' ? '#ef444420' : '#f59e0b20',
                    color: spot.risk === 'high' ? '#ef4444' : '#f59e0b',
                  }}
                >
                  {spot.risk === 'high' ? '高风险' : '中风险'}
                </span>
              </div>
              <p className="text-sm text-foreground/75 mb-3">{spot.description}</p>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-green/5">
                <span className="text-accent-green text-sm">💡</span>
                <p className="text-sm text-accent-green">{spot.suggestion}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
