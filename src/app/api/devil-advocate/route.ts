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
import OpenAI from 'openai';

function getAI() {
  return new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_AI_API_KEY || '',
    baseURL: process.env.NEXT_PUBLIC_AI_BASE_URL || '',
  });
}

const DEVIL_SYSTEM_PROMPT = `你是一位专业的"魔鬼代言人"（Devil's Advocate），你的职责是针对用户的读书笔记或个人感想，提出尖锐但有建设性的反驳和挑战。

你的辩论风格：
- 直接针对笔记中的核心观点、假设和论据提出质疑，绝不使用通用模板
- 引用笔记中的具体原文来支撑你的反驳
- 提供反例、替代解释或被忽略的视角
- 用苏格拉底式追问引导更深层思考
- 语言风格：犀利但不刻薄，学术但易读
- 每次回复都紧扣该笔记的独特内容，不重复套路

【重要】对话节奏规则：
- 每次回复只抛出 **1个** 核心反驳点，不要列多个编号论点
- 反驳内容应精炼，控制在 200-350 字以内（约3-5个自然段）
- 结构：先用 **加粗** 概括核心论点（1-2句），然后展开论证和追问
- 结尾以一个明确的苏格拉底式追问收尾，等待用户回应
- 禁止一次性倾泻多个反驳，这是一场对话，不是一场演讲

你的目标是帮助用户发现自己思维中的盲点，深化对主题的理解。请始终使用中文回复。`;

interface RequestBody {
  note: {
    id: string;
    title: string;
    content: string;
    source_type: string;
    source_name: string;
    tags?: string[];
  };
  messages: { role: 'user' | 'assistant'; content: string }[];
  isStart: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { note, messages, isStart } = body;

    if (!note?.content) {
      return NextResponse.json(
        { success: false, error: '缺少笔记内容' },
        { status: 400 }
      );
    }

    const client = getAI();
    const model = process.env.NEXT_PUBLIC_AI_MODEL || process.env.NEXT_PUBLIC_AI_PROVIDER || 'default';

    const systemMessage = `${DEVIL_SYSTEM_PROMPT}

当前分析的笔记信息：
- 标题：《${note.title}》
- 来源：${note.source_name}（类型：${note.source_type}）
${note.tags?.length ? `- 标签：${note.tags.join('、')}` : ''}

笔记完整内容：
"""
${note.content}
"""

${isStart ? '请针对这篇笔记中最核心、最值得挑战的一个观点或隐含假设，提出一个有力的反驳。只说一个点，用 **加粗** 标记关键论点，结尾以一个苏格拉底式追问邀请用户回应。不要列举多个反驳。' : '继续与用户辩论，针对用户的回应提出进一步的质疑和反驳。保持紧扣笔记内容。每次只聚焦一个论点。'}`;

    const apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemMessage },
      ...messages,
    ];

    // 讯飞 MaaS 要求 messages 中必须包含至少一条 user 消息，否则返回 400
    if (!apiMessages.some((m) => m.role === 'user')) {
      apiMessages.push({ role: 'user', content: '请开始。' });
    }

    const response = await client.chat.completions.create({
      model,
      messages: apiMessages,
      max_tokens: 800,
      temperature: 0.85,
    });

    const reply = response.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      data: { reply },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Devil advocate API error:', msg);
    return NextResponse.json(
      { success: false, error: `AI 调用失败：${msg}` },
      { status: 500 }
    );
  }
}
