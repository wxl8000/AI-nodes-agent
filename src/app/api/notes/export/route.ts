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
import { noteToTxt, sanitizeFileName } from '@/lib/utils/note-exporter';
import JSZip from 'jszip';
import type { Note } from '@/types';

// GET /api/notes/export
// 单条导出: ?id=xxx          → 返回 TXT 文件
// 批量导出: ?ids=id1,id2,... → 返回 ZIP 文件
// 全部导出: 无参数           → 返回 ZIP 文件（所有笔记）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const singleId = searchParams.get('id');
    const idsParam = searchParams.get('ids');

    const supabase = getServerSupabase();

    // 单条导出
    if (singleId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: note, error } = await (supabase.from('notes') as any)
        .select('*')
        .eq('id', singleId)
        .single();

      if (error || !note) {
        return NextResponse.json(
          { success: false, message: '笔记不存在' },
          { status: 404 }
        );
      }

      const txt = noteToTxt(note as Note);
      const fileName = `${sanitizeFileName(note.title)}.txt`;

      return new NextResponse(txt, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        },
      });
    }

    // 批量导出或全部导出
    let notes: Note[];

    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json(
          { success: false, message: '请提供有效的笔记 ID' },
          { status: 400 }
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('notes') as any)
        .select('*')
        .in('id', ids);

      if (error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
        );
      }
      notes = (data || []) as Note[];
    } else {
      // 全部导出
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('notes') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
        );
      }
      notes = (data || []) as Note[];
    }

    if (notes.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有可导出的笔记' },
        { status: 404 }
      );
    }

    // 生成 ZIP
    const zip = new JSZip();
    const nameCountMap = new Map<string, number>();

    for (const note of notes) {
      const txt = noteToTxt(note);
      let baseName = sanitizeFileName(note.title);

      const count = nameCountMap.get(baseName) || 0;
      nameCountMap.set(baseName, count + 1);
      if (count > 0) {
        baseName = `${baseName}_${count + 1}`;
      }

      zip.file(`${baseName}.txt`, txt);
    }

    const zipBuffer = Buffer.from(await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const zipFileName = `笔记导出_${timestamp}.zip`;

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(zipFileName)}`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `导出失败: ${message}` },
      { status: 500 }
    );
  }
}
  