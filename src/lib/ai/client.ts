import OpenAI from 'openai';
import type { AIProvider, AIConfig } from '@/types';

const PROVIDER_CONFIG: Record<AIProvider, { baseUrl: string; defaultModel: string }> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo',
  },
};

let clientInstance: OpenAI | null = null;
let currentConfig: AIConfig | null = null;

export function getAIConfig(): AIConfig {
  if (currentConfig) return currentConfig;

  const provider = (process.env.NEXT_PUBLIC_AI_PROVIDER as AIProvider) || 'deepseek';
  const apiKey = process.env.NEXT_PUBLIC_AI_API_KEY || '';

  currentConfig = {
    provider,
    apiKey,
    model: process.env.NEXT_PUBLIC_AI_MODEL,
    baseUrl: process.env.NEXT_PUBLIC_AI_BASE_URL,
  };

  return currentConfig;
}

export function createAIClient(config?: AIConfig): OpenAI {
  const cfg = config || getAIConfig();
  const providerConfig = PROVIDER_CONFIG[cfg.provider];

  clientInstance = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseUrl || providerConfig.baseUrl,
    dangerouslyAllowBrowser: true,
  });

  return clientInstance;
}

export function getClient(): OpenAI {
  if (!clientInstance) {
    return createAIClient();
  }
  return clientInstance;
}

export function getModel(): string {
  const cfg = getAIConfig();
  const providerConfig = PROVIDER_CONFIG[cfg.provider];
  return cfg.model || providerConfig.defaultModel;
}

export async function chatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<string> {
  const client = getClient();
  const model = getModel();

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000,
    ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
  });

  return response.choices[0]?.message?.content || '';
}

export async function chatCompletionJSON<T>(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const result = await chatCompletion(messages, { ...options, jsonMode: true });
  try {
    return JSON.parse(result) as T;
  } catch {
    console.error('Failed to parse AI response as JSON:', result);
    throw new Error('AI 返回的结果无法解析为 JSON');
  }
}

export async function chatCompletionStream(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  onChunk: (text: string) => void,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const client = getClient();
  const model = getModel();

  const stream = await client.chat.completions.create({
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000,
    stream: true,
  });

  let fullResponse = '';
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullResponse += content;
      onChunk(content);
    }
  }

  return fullResponse;
}
