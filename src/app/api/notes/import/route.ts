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

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { parseNoteText } from '@/lib/utils/note-parser';

// POST /api/notes/import - 上传 TXT 文件并导入笔记
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: '请上传至少一个 TXT 文件' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    const results: { fileName: string; success: boolean; title?: string; action?: 'created' | 'updated' | 'skipped'; error?: string }[] = [];

    for (const file of files) {
      if (!file.name.endsWith('.txt')) {
        results.push({ fileName: file.name, success: false, error: '仅支持 .txt 文件' });
        continue;
      }

      try {
        const text = await file.text();
        const parsed = parseNoteText(text, file.name);

        // 检查是否已存在同标题笔记
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabase.from('notes') as any)
          .select('id, content, created_at')
          .eq('title', parsed.title)
          .limit(1);

        if (existing && existing.length > 0) {
          // 标题相同 → 比较内容是否变化
          const existingNote = existing[0];

          // 内容未变 → 跳过，不重置分析状态
          if (existingNote.content === parsed.content) {
            results.push({
              fileName: file.name,
              success: true,
              title: parsed.title,
              action: 'skipped',
            });
            continue;
          }

          // 内容变化 → 更新内容和日期，重置分析状态
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase.from('notes') as any)
            .update({
              content: parsed.content,
              source_type: parsed.source_type,
              source_name: parsed.source_name,
              created_at: parsed.created_at,
              tags: parsed.tags,
              analysis_status: 'pending', // 内容变更后重新分析
            })
            .eq('id', existingNote.id);

          if (error) {
            results.push({
              fileName: file.name,
              success: false,
              title: parsed.title,
              error: error.message,
            });
          } else {
            results.push({
              fileName: file.name,
              success: true,
              title: parsed.title,
              action: 'updated',
            });
          }
          continue;
        }

        // 不存在 → 新增笔记
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('notes') as any).insert({
          title: parsed.title,
          content: parsed.content,
          source_type: parsed.source_type,
          source_name: parsed.source_name,
          created_at: parsed.created_at,
          tags: parsed.tags,
          analysis_status: 'pending',
        });

        if (error) {
          results.push({
            fileName: file.name,
            success: false,
            title: parsed.title,
            error: error.message,
          });
        } else {
          results.push({
            fileName: file.name,
            success: true,
            title: parsed.title,
            action: 'created',
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ fileName: file.name, success: false, error: message });
      }
    }

    const createdCount = results.filter(r => r.success && r.action === 'created').length;
    const updatedCount = results.filter(r => r.success && r.action === 'updated').length;
    const skippedCount = results.filter(r => r.success && r.action === 'skipped').length;
    return NextResponse.json({
      success: true,
      message: `导入完成：新增 ${createdCount} 条，更新 ${updatedCount} 条，跳过 ${skippedCount} 条（内容未变），共 ${files.length} 个文件`,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `服务器错误: ${message}` },
      { status: 500 }
    );
  }
}
