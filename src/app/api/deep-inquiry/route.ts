import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSupabase } from '@/lib/supabase/server';

function getAI() {
  return new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_AI_API_KEY || '',
    baseURL: process.env.NEXT_PUBLIC_AI_BASE_URL || '',
  });
}

const INQUIRY_SYSTEM_PROMPT = `你是一位专业的苏格拉底式追问教练，擅长通过层层递进的提问帮助用户深入理解自己的笔记内容。

你的追问风格：
- 紧密围绕用户笔记中的具体内容展开，绝不使用泛泛的通用问题
- 引用笔记中的原文观点作为追问的出发点
- 每一级追问都自然承接上一级的对话脉络
- 问题开放且有启发性，引导用户进行深度反思
- 语言风格：温暖但犀利，像一位睿智的导师

【重要】追问规则：
- 每次只提出 **1个** 精准的问题，不要列多个问题
- 问题应精炼清晰，控制在 80-180 字以内
- 先用一句话点出笔记中值得追问的核心内容，再抛出问题
- 结尾明确抛出问题，等待用户回应
- 禁止笼统的哲学追问，一切问题都必须扎根于该笔记的具体内容

请始终使用中文回复。`;

interface InquiryRequestBody {
  note: {
    id: string;
    title: string;
    content: string;
    source_type: string;
    source_name: string;
    tags?: string[];
  };
  level: number;
  previousAnswers: { level: number; question: string; answer: string }[];
}

interface SaveInquiryBody {
  action: 'save';
  note: {
    id: string;
    title: string;
    source_name: string;
  };
  messages: { level: number; question: string; answer: string }[];
}

function buildLevelInstruction(level: number, noteTitle: string, previousAnswers: { level: number; question: string; answer: string }[]): string {
  const prevContext = previousAnswers.length > 0
    ? `\n\n用户之前的回答记录：\n${previousAnswers.map(a => `【第${a.level}级】问：${a.question}\n答：${a.answer}`).join('\n\n')}`
    : '';

  const levelInstructions: Record<number, string> = {
    1: `当前是第1级追问（"是什么"层面）。请基于笔记内容，提出一个帮助用户厘清核心概念或现象的问题。这是追问的起点，要抓住笔记中最值得深挖的核心概念。`,
    2: `当前是第2级追问（"为什么"层面）。用户在第1级已经做了初步回答。请基于笔记内容和用户的回答，提出一个帮助用户理解原因和机制的问题。`,
    3: `当前是第3级追问（"所以呢"层面）。用户已经分析了概念和原因。请基于笔记内容和之前的对话，提出一个帮助用户思考影响和后果的问题。`,
    4: `当前是第4级追问（"还有呢"层面）。用户已经做了较深入的分析。请基于笔记内容和之前的对话，提出一个帮助用户发现其他视角和可能性的问题。`,
    5: `当前是第5级追问（"如果不呢"层面）。这是最深层次的追问。请基于笔记内容和之前的完整对话，提出一个帮助用户思考反面假设和边界条件的问题。`,
  };

  return `${levelInstructions[level] || levelInstructions[1]}${prevContext}

请针对笔记《${noteTitle}》的内容，提出你的追问。只提一个问题，直接开始，不要有前缀说明。`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle save action
    if (body.action === 'save') {
      return await handleSaveInquiry(body as SaveInquiryBody);
    }

    const { note, level, previousAnswers } = body as InquiryRequestBody;

    if (!note?.content) {
      return NextResponse.json(
        { success: false, error: '缺少笔记内容' },
        { status: 400 }
      );
    }

    if (!level || level < 1 || level > 5) {
      return NextResponse.json(
        { success: false, error: '追问层级无效，应为 1-5' },
        { status: 400 }
      );
    }

    const client = getAI();
    const model = process.env.NEXT_PUBLIC_AI_MODEL || process.env.NEXT_PUBLIC_AI_PROVIDER || 'default';

    const systemMessage = `${INQUIRY_SYSTEM_PROMPT}

当前分析的笔记信息：
- 标题：《${note.title}》
- 来源：${note.source_name}（类型：${note.source_type}）
${note.tags?.length ? `- 标签：${note.tags.join('、')}` : ''}

笔记完整内容：
"""
${note.content}
"""

${buildLevelInstruction(level, note.title, previousAnswers || [])}`;

    const apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `请对我进行第${level}级追问。` },
    ];

    const response = await client.chat.completions.create({
      model,
      messages: apiMessages,
      max_tokens: 400,
      temperature: 0.8,
    });

    const question = response.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      data: { question, level },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Deep inquiry API error:', msg);
    return NextResponse.json(
      { success: false, error: `AI 调用失败：${msg}` },
      { status: 500 }
    );
  }
}

async function handleSaveInquiry(body: SaveInquiryBody) {
  try {
    const { note, messages } = body;

    if (!note?.id || !messages?.length) {
      return NextResponse.json(
        { success: false, error: '缺少笔记信息或追问记录' },
        { status: 400 }
      );
    }

    const levelLabels = ['是什么', '为什么', '所以呢', '还有呢', '如果不呢'];

    // Build formatted content
    const content = messages.map(m => {
      const label = levelLabels[m.level - 1] || `第${m.level}级`;
      return `【第${m.level}级 · ${label}】\n\n问：${m.question}\n\n答：${m.answer}`;
    }).join('\n\n---\n\n');

    const title = `【深度追问】${note.title}`;

    const supabase = getServerSupabase();

    // Save as a new note
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newNote, error: noteError } = await (supabase.from('notes') as any)
      .insert({
        title,
        content,
        source_type: 'thought',
        source_name: note.source_name || note.title,
        tags: ['deep-inquiry', `parent:${note.id}`],
        analysis_status: 'completed',
      })
      .select()
      .single();

    if (noteError) {
      console.error('Save inquiry note error:', noteError);
      return NextResponse.json(
        { success: false, error: `保存笔记失败：${noteError.message}` },
        { status: 500 }
      );
    }

    // Also save to deep_inquiry_sessions for record keeping
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('deep_inquiry_sessions') as any)
      .insert({
        note_id: note.id,
        topic: note.title,
        questions: messages,
        current_level: messages.length,
      });

    return NextResponse.json({
      success: true,
      data: { id: newNote.id, title },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Save inquiry error:', msg);
    return NextResponse.json(
      { success: false, error: `保存失败：${msg}` },
      { status: 500 }
    );
  }
}
