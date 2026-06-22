import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_AI_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_AI_BASE_URL;
  const model = process.env.NEXT_PUBLIC_AI_MODEL;
  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER;

  if (!apiKey || !baseUrl) {
    return NextResponse.json({
      success: false,
      message: '环境变量缺失：NEXT_PUBLIC_AI_API_KEY 或 NEXT_PUBLIC_AI_BASE_URL 未配置',
    });
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
    });

    const response = await client.chat.completions.create({
      model: model || provider || 'default',
      messages: [{ role: 'user', content: '请回复"连接成功"四个字' }],
      max_tokens: 50,
      temperature: 0.1,
    });

    const reply = response.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      message: '大模型连接成功！',
      provider,
      model: model || provider,
      baseUrl,
      reply,
      usage: response.usage,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      message: `大模型调用失败: ${message}`,
      provider,
      model,
      baseUrl,
    });
  }
}
