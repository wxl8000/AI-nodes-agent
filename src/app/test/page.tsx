'use client';

import { useState } from 'react';

interface TestResult {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

export default function TestPage() {
  const [supabaseResult, setSupabaseResult] = useState<TestResult | null>(null);
  const [aiResult, setAiResult] = useState<TestResult | null>(null);
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  const testSupabase = async () => {
    setLoadingSupabase(true);
    setSupabaseResult(null);
    try {
      const res = await fetch('/api/test/supabase');
      const data = await res.json();
      setSupabaseResult(data);
    } catch (err) {
      setSupabaseResult({ success: false, message: `请求失败: ${err}` });
    } finally {
      setLoadingSupabase(false);
    }
  };

  const testAI = async () => {
    setLoadingAi(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/test/ai');
      const data = await res.json();
      setAiResult(data);
    } catch (err) {
      setAiResult({ success: false, message: `请求失败: ${err}` });
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">连接测试</h1>

      {/* Supabase Test */}
      <section className="border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Supabase 数据库</h2>
          <button
            onClick={testSupabase}
            disabled={loadingSupabase}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {loadingSupabase ? '测试中...' : '测试连接'}
          </button>
        </div>
        {supabaseResult && (
          <div className={`p-4 rounded-lg text-sm ${supabaseResult.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
            <p className="font-medium">{supabaseResult.success ? '✅' : '❌'} {supabaseResult.message}</p>
            <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-40">
              {JSON.stringify(supabaseResult, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {/* AI Test */}
      <section className="border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">大模型 API</h2>
          <button
            onClick={testAI}
            disabled={loadingAi}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {loadingAi ? '测试中...' : '测试连接'}
          </button>
        </div>
        {aiResult && (
          <div className={`p-4 rounded-lg text-sm ${aiResult.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
            <p className="font-medium">{aiResult.success ? '✅' : '❌'} {aiResult.message}</p>
            <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-40">
              {JSON.stringify(aiResult, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
