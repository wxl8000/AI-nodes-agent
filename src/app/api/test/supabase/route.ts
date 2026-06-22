import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      success: false,
      message: '环境变量缺失：NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY 未配置',
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 尝试查询 notes 表
    const { data, error } = await supabase.from('notes').select('*').limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        message: `数据库查询失败: ${error.message}`,
        detail: error,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase 连接成功！',
      url: supabaseUrl,
      sampleData: data,
      noteCount: data?.length ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      message: `连接异常: ${message}`,
    });
  }
}
