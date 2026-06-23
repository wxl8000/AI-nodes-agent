import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

// GET /api/practice-goals - 获取实践目标列表
// 支持查询参数:
//   ?status=pending|reminded|done|deferred|ignored  按状态过滤
//   ?overdue=true  查询超60天未处理的目标
//   ?note_id=xxx   按笔记ID过滤
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const overdue = searchParams.get('overdue');
    const noteId = searchParams.get('note_id');

    const supabase = getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('practice_goals') as any)
      .select('*')
      .order('created_at', { ascending: false });

    // 按笔记ID过滤
    if (noteId) {
      query = query.eq('note_id', noteId);
    }

    // 超期查询：状态为 pending/reminded 且创建时间超过60天
    if (overdue === 'true') {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      query = query
        .in('status', ['pending', 'reminded'])
        .lt('created_at', sixtyDaysAgo.toISOString());
    } else if (status) {
      // 按状态过滤
      query = query.eq('status', status);
    }

    const { data, error } = await query;

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

// PATCH /api/practice-goals - 更新实践目标状态
// body: { id, status: 'done' | 'deferred' | 'ignored' }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少目标 ID' },
        { status: 400 }
      );
    }

    const allowedStatuses = ['done', 'deferred', 'ignored', 'pending', 'reminded'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `无效状态: ${status}` },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // 延期处理：推迟30天并递增延期次数
    if (status === 'deferred') {
      // 先获取当前记录
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: current } = await (supabase.from('practice_goals') as any)
        .select('deferred_count')
        .eq('id', id)
        .single();

      const newRemindAt = new Date();
      newRemindAt.setDate(newRemindAt.getDate() + 30);
      updateData.remind_at = newRemindAt.toISOString();
      updateData.deferred_count = (current?.deferred_count || 0) + 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('practice_goals') as any)
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
