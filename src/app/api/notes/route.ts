import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { detectPracticeIntents } from '@/lib/utils/practice-intent';

// GET /api/notes - 获取笔记列表
export async function GET() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `服务器错误: ${message}` },
      { status: 500 }
    );
  }
}

// POST /api/notes - 创建单条笔记
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, source_type, source_name, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('notes') as any)
      .insert({
        title,
        content,
        source_type: source_type || 'thought',
        source_name: source_name || title,
        tags: tags || [],
        analysis_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    // 轻量正则检测实践意图并异步写入（不阻塞响应）
    if (data) {
      const intents = detectPracticeIntents(content);
      if (intents.length > 0) {
        // 异步写入，不等待完成
        Promise.all(
          intents.map(intent =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase.from('practice_goals') as any).insert({
              note_id: data.id,
              note_title: title,
              source_name: source_name || title,
              intention_text: intent.intention_text,
              description: intent.description,
              status: 'pending',
            })
          )
        ).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `服务器错误: ${message}` },
      { status: 500 }
    );
  }
}

// PATCH /api/notes - 更新笔记（支持部分字段更新）
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少笔记 ID' },
        { status: 400 }
      );
    }

    // 只允许更新的字段
    const allowedFields = ['title', 'content', 'source_type', 'source_name', 'tags', 'analysis_status'];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: '没有可更新的字段' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('notes') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `服务器错误: ${message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/notes - 删除笔记
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少笔记 ID' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('notes') as any)
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `服务器错误: ${message}` },
      { status: 500 }
    );
  }
}
