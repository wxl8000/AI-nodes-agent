import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSupabase } from '@/lib/supabase/server';

function getAI() {
  return new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_AI_API_KEY || '',
    baseURL: process.env.NEXT_PUBLIC_AI_BASE_URL || '',
  });
}

const SUMMARY_SYSTEM_PROMPT = `你是一位专业的辩论摘要助手。你的任务是将一场"魔鬼代言人"辩论对话浓缩为一段精炼的摘要。

摘要要求：
- 总结 AI（魔鬼代言人）提出的核心反驳论点（1-3个）
- 提炼用户在辩论中展现的新思考或被挑战的盲点
- 如果辩论中有未解决的问题，以"值得继续思考"的形式列出
- 语言简洁、客观，使用第三人称

格式要求（严格遵循，不含多余标记）：
以 "---" 分隔符开头，后跟标题 "[辩论摘要]"，再跟正文。`;

interface RequestBody {
  noteId: string;
  noteTitle: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { noteId, noteTitle, messages } = body;

    if (!noteId || !messages?.length) {
      return NextResponse.json(
        { success: false, error: '缺少笔记ID或辩论记录' },
        { status: 400 }
      );
    }

    // Step 1: Call AI to generate summary
    const client = getAI();
    const model = process.env.NEXT_PUBLIC_AI_MODEL || process.env.NEXT_PUBLIC_AI_PROVIDER || 'default';

    const conversationText = messages
      .map((m) => `${m.role === 'user' ? '【用户】' : '【魔鬼代言人】'}：${m.content}`)
      .join('\n\n');

    const summaryResponse = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `请为以下关于《${noteTitle}》的辩论对话生成摘要：\n\n${conversationText}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.4,
    });

    const summary = summaryResponse.choices[0]?.message?.content || '';
    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'AI 未能生成摘要' },
        { status: 500 }
      );
    }

    // Step 2: Append summary to note content in Supabase
    const supabase = getServerSupabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: note, error: fetchErr } = await (supabase.from('notes') as any)
      .select('content')
      .eq('id', noteId)
      .single();

    if (fetchErr || !note) {
      return NextResponse.json(
        { success: false, error: `获取笔记失败：${fetchErr?.message || '笔记不存在'}` },
        { status: 404 }
      );
    }

    const currentDate = new Date().toLocaleDateString('zh-CN');
    const appendedSection = `\n\n---\n\n[辩论摘要] (${currentDate})\n\n${summary}`;
    const updatedContent = note.content + appendedSection;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase.from('notes') as any)
      .update({ content: updatedContent })
      .eq('id', noteId);

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: `保存笔记失败：${updateErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { summary, appendedSection },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Debate summary API error:', msg);
    return NextResponse.json(
      { success: false, error: `服务器错误：${msg}` },
      { status: 500 }
    );
  }
}
