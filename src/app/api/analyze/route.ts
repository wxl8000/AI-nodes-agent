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

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  SYSTEM_PROMPT,
  ANALYZE_COGNITIVE_RADAR,
  ANALYZE_WORD_CLOUD,
  ANALYZE_MILESTONE,
  ANALYZE_KNOWLEDGE_GALAXY,
  ANALYZE_THINKING_STYLE,
  GOLDEN_QUOTES_PROMPT,
  BOOK_RECOMMENDATION_PROMPT,
  EXTRACT_PRACTICE_INTENTS,
} from '@/lib/ai/prompts';

interface DbNote {
  id: string;
  title: string;
  content: string;
  source_type: string;
  source_name: string;
  created_at: string;
  tags: string[];
  analysis_status: string;
}

function getAI() {
  return new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_AI_API_KEY || '',
    baseURL: process.env.NEXT_PUBLIC_AI_BASE_URL || '',
  });
}

async function callAI(prompt: string): Promise<Record<string, unknown>> {
  const client = getAI();
  const model = process.env.NEXT_PUBLIC_AI_MODEL || process.env.NEXT_PUBLIC_AI_PROVIDER || 'default';

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  });

  const text = response.choices[0]?.message?.content || '{}';
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {};
  }
}

function sendEvent(encoder: TextEncoder, controller: ReadableStreamDefaultController, data: Record<string, unknown>) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(msg));
}

export async function POST(req: NextRequest) {
  const supabase = getServerSupabase();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Get pending notes
        const { data: pendingNotes, error } = await (supabase.from('notes') as any)
          .select('*')
          .in('analysis_status', ['pending', 'failed'])
          .order('created_at', { ascending: true });

        if (error) throw error;

        const notes: DbNote[] = (pendingNotes || []) as DbNote[];
        if (notes.length === 0) {
          // Check if we already have analysis results
          const { data: existing } = await (supabase.from('analysis_results') as any).select('id').limit(1);
          if (existing && existing.length > 0) {
            sendEvent(encoder, controller, { type: 'info', message: '所有笔记已分析完毕，无需重新分析' });
            sendEvent(encoder, controller, { type: 'done', analyzed: 0, total: 0 });
            controller.close();
            return;
          }
          // No notes at all - get all notes regardless of status
          const { data: allNotes } = await (supabase.from('notes') as any)
            .select('*')
            .order('created_at', { ascending: true });
          if (!allNotes || allNotes.length === 0) {
            sendEvent(encoder, controller, { type: 'error', message: '没有笔记可分析' });
            controller.close();
            return;
          }
          // Reset all to pending for re-analysis
          for (const n of allNotes) {
            await (supabase.from('notes') as any).update({ analysis_status: 'pending' }).eq('id', n.id);
          }
          notes.push(...(allNotes as DbNote[]));
        }

        const total = notes.length;
        sendEvent(encoder, controller, { type: 'start', total });

        // 2. Analyze each note individually
        const allRadarScores: Record<string, number>[] = [];
        const allKeywords: Record<string, unknown>[] = [];
        const allMilestones: Record<string, unknown>[] = [];

        for (let i = 0; i < notes.length; i++) {
          const note = notes[i];
          sendEvent(encoder, controller, { type: 'progress', current: i + 1, total, title: note.title, step: 'per-note' });

          // Mark as analyzing
          await (supabase.from('notes') as any).update({ analysis_status: 'analyzing' }).eq('id', note.id);

          try {
            // Parallel: cognitive_radar + word_cloud + milestone + practice_intents，每个调用独立容错
            const [radarResult, wordCloudResult, milestoneResult, practiceIntentResult] = await Promise.all([
              callAI(ANALYZE_COGNITIVE_RADAR(note.content, note.source_name)).catch(() => null),
              callAI(ANALYZE_WORD_CLOUD(note.content, note.source_name)).catch(() => null),
              callAI(ANALYZE_MILESTONE(note.content, note.source_name, note.created_at)).catch(() => null),
              callAI(EXTRACT_PRACTICE_INTENTS(note.content, note.source_name, note.title, note.created_at)).catch(() => null),
            ]);

            // 降级兜底：AI 调用失败时使用默认值而非标记 failed
            const defaultRadar: Record<string, unknown> = {
              scores: {
                rational_vs_emotional: 50,
                abstract_vs_concrete: 50,
                critical_vs_accepting: 50,
                macro_vs_detail: 50,
                longterm_vs_instant: 50,
                inward_vs_outward: 50,
              },
              reasoning: '文本过短，无法进行有效认知分析，已赋予中间值',
            };
            const defaultWordCloud: Record<string, unknown> = { keywords: [] };
            const defaultMilestone: Record<string, unknown> = {
              is_milestone: false,
              type: null,
              title: '',
              description: '',
              key_insight: '',
            };

            const finalRadar = (radarResult && Object.keys(radarResult).length > 0) ? radarResult : defaultRadar;
            const finalWordCloud = (wordCloudResult && Object.keys(wordCloudResult).length > 0) ? wordCloudResult : defaultWordCloud;
            const finalMilestone = (milestoneResult && Object.keys(milestoneResult).length > 0) ? milestoneResult : defaultMilestone;

            // Store results
            const results = [
              { note_id: note.id, analysis_type: 'cognitive_radar', result: finalRadar },
              { note_id: note.id, analysis_type: 'word_cloud', result: finalWordCloud },
              { note_id: note.id, analysis_type: 'milestone', result: finalMilestone },
            ];

            for (const r of results) {
              // Delete old result then insert new one
              await (supabase.from('analysis_results') as any)
                .delete()
                .eq('note_id', r.note_id)
                .eq('analysis_type', r.analysis_type);
              await (supabase.from('analysis_results') as any).insert({
                note_id: r.note_id,
                analysis_type: r.analysis_type,
                result: r.result,
              });
            }

            // Collect for aggregation
            const scores = finalRadar.scores as Record<string, number> | undefined;
            if (scores) allRadarScores.push(scores);
            const keywords = finalWordCloud.keywords as any[] | undefined;
            if (keywords) {
              keywords.forEach((kw: any) => {
                allKeywords.push({ ...kw, source_note_id: note.id, source_note_title: note.title });
              });
            }
            if (finalMilestone.is_milestone) {
              allMilestones.push({
                ...finalMilestone,
                note_id: note.id,
                note_title: note.title,
                date: note.created_at,
              });
            }

            // 存储 AI 识别到的实践意图到 practice_goals 表
            if (practiceIntentResult) {
              const intentions = practiceIntentResult.intentions as
                | { intention_text: string; description: string }[]
                | undefined;
              if (Array.isArray(intentions) && intentions.length > 0) {
                for (const intent of intentions) {
                  // 先删除同一笔记的旧实践意图，避免重复
                  await (supabase.from('practice_goals') as any)
                    .delete()
                    .eq('note_id', note.id)
                    .eq('intention_text', intent.intention_text);
                  await (supabase.from('practice_goals') as any).insert({
                    note_id: note.id,
                    note_title: note.title,
                    source_name: note.source_name,
                    intention_text: intent.intention_text,
                    description: intent.description,
                    status: 'pending',
                  });
                }
              }
            }

            // Mark as completed（含降级完成）
            await (supabase.from('notes') as any).update({ analysis_status: 'completed' }).eq('id', note.id);

            sendEvent(encoder, controller, { type: 'note-done', current: i + 1, total, title: note.title });
          } catch (err) {
            // 只有在数据库操作失败时才标记 failed，AI 调用失败已降级处理
            const msg = err instanceof Error ? err.message : String(err);
            await (supabase.from('notes') as any).update({ analysis_status: 'failed' }).eq('id', note.id);
            sendEvent(encoder, controller, { type: 'note-error', title: note.title, error: msg });
          }
        }

        // 3. Aggregated analysis
        sendEvent(encoder, controller, { type: 'progress', step: 'aggregate', message: '正在进行聚合分析...' });

        // Aggregate cognitive radar (average scores)
        let avgRadar: Record<string, number> = {};
        if (allRadarScores.length > 0) {
          const dims = ['rational_vs_emotional', 'abstract_vs_concrete', 'critical_vs_accepting', 'macro_vs_detail', 'longterm_vs_instant', 'inward_vs_outward'];
          for (const dim of dims) {
            const vals = allRadarScores.map(s => s[dim]).filter(v => typeof v === 'number');
            avgRadar[dim] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 50;
          }
        }

        // Knowledge galaxy
        const galaxyNotes = notes.map(n => ({
          title: n.title,
          content: n.content,
          source_name: n.source_name,
          tags: n.tags || [],
        }));
        const galaxyResult = await callAI(ANALYZE_KNOWLEDGE_GALAXY(galaxyNotes));

        // Thinking style
        const thinkingNotes = notes.map(n => ({ title: n.title, content: n.content }));
        const thinkingResult = await callAI(ANALYZE_THINKING_STYLE(thinkingNotes));

        // Golden quotes
        const quoteNotes = notes.map(n => ({ id: n.id, title: n.title, content: n.content }));
        const quotesResult = await callAI(GOLDEN_QUOTES_PROMPT(quoteNotes));

        // Book recommendations
        const readBooks = notes.filter(n => n.source_type === 'book').map(n => n.source_name);
        const domains = [...new Set(notes.map(n => n.source_type))];
        const recommendResult = await callAI(BOOK_RECOMMENDATION_PROMPT(domains, [], [], readBooks));

        // 4. Store aggregated results
        const aggregatedResults = [
          { analysis_type: 'knowledge_galaxy', result: galaxyResult },
          { analysis_type: 'thinking_style', result: thinkingResult },
          { analysis_type: 'golden_quotes', result: quotesResult },
          { analysis_type: 'book_recommendations', result: recommendResult },
        ];

        for (const r of aggregatedResults) {
          // Delete old aggregated results first
          await (supabase.from('analysis_results') as any).delete().eq('analysis_type', r.analysis_type).is('note_id', null);
          await (supabase.from('analysis_results') as any).insert({
            note_id: null,
            analysis_type: r.analysis_type,
            result: r.result,
          });
        }

        // 5. Update user_profile
        await (supabase.from('user_profile') as any).upsert({
          id: 'default',
          cognitive_radar: avgRadar,
          thinking_style: thinkingResult,
          knowledge_domains: domains,
          total_notes: total,
          total_books: notes.filter(n => n.source_type === 'book').length,
          total_activities: notes.filter(n => n.source_type === 'activity').length,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        sendEvent(encoder, controller, { type: 'done', analyzed: total, total });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sendEvent(encoder, controller, { type: 'error', message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
