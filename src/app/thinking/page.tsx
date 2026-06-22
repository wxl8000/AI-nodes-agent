'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, RotateCcw, Swords, HelpCircle, ArrowRight, Loader2, BookCheck, Check } from 'lucide-react';
import { mockNotes as fallbackNotes } from '@/lib/mock/data';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';

type Tab = 'devil' | 'inquiry';

interface DebateMsg {
  role: 'user' | 'devil';
  content: string;
}



const inquiryLevels = [
  { level: 1, label: '是什么', prompt: '厘清概念和现象', color: '#3b82f6' },
  { level: 2, label: '为什么', prompt: '理解原因和机制', color: '#22c55e' },
  { level: 3, label: '所以呢', prompt: '思考影响和后果', color: '#f97316' },
  { level: 4, label: '还有呢', prompt: '发现其他视角', color: '#8b5cf6' },
  { level: 5, label: '如果不呢', prompt: '反面假设和边界', color: '#ec4899' },
];

export default function ThinkingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('devil');
  const [notes, setNotes] = useState<Note[]>(fallbackNotes);
  const [selectedNote, setSelectedNote] = useState<Note>(fallbackNotes[0]);

  // Load real notes
  useEffect(() => {
    fetch('/api/notes')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.length > 0) {
          setNotes(json.data);
          setSelectedNote(json.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Devil's advocate state
  const [debateMessages, setDebateMessages] = useState<DebateMsg[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [debateSummarySaved, setDebateSummarySaved] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Deep inquiry state
  const [inquiryLevel, setInquiryLevel] = useState(1);
  const [inquiryMessages, setInquiryMessages] = useState<{ level: number; question: string; answer: string }[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isSavingInquiry, setIsSavingInquiry] = useState(false);
  const [inquirySavedInfo, setInquirySavedInfo] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [debateMessages]);

  // Call AI devil's advocate API
  const callDevilAdvocate = async (conversationMessages: { role: 'user' | 'assistant'; content: string }[], isStart: boolean) => {
    try {
      const res = await fetch('/api/devil-advocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: selectedNote, messages: conversationMessages, isStart }),
      });
      const json = await res.json();
      if (json.success && json.data?.reply) {
        return json.data.reply as string;
      }
      throw new Error(json.error || 'AI 返回为空');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return `⚠️ AI 暂时无法响应（${msg}）。请稍后重试，或换一篇笔记试试。`;
    }
  };

  // Devil's advocate conversation
  const handleDebateSend = async () => {
    if (!userInput.trim() || isThinking) return;
    const msg = userInput;
    setUserInput('');
    const newUserMsg: DebateMsg = { role: 'user', content: msg };
    setDebateMessages((prev) => [...prev, newUserMsg]);
    setIsThinking(true);

    // Build API message history (role mapping: devil -> assistant)
    const apiMessages = [...debateMessages, newUserMsg].map((m) => ({
      role: (m.role === 'devil' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    }));

    const reply = await callDevilAdvocate(apiMessages, false);
    setDebateMessages((prev) => [...prev, { role: 'devil', content: reply }]);
    setIsThinking(false);
  };

  const startDebate = async () => {
    setIsThinking(true);
    setDebateMessages([]);
    setDebateSummarySaved(false);

    const reply = await callDevilAdvocate([], true);
    setDebateMessages([{ role: 'devil', content: reply }]);
    setIsThinking(false);
  };

  // Finish debate: generate summary and append to note
  const finishDebate = async () => {
    if (isSavingSummary || debateSummarySaved || debateMessages.length < 2) return;
    setIsSavingSummary(true);
    try {
      const apiMessages = debateMessages.map((m) => ({
        role: (m.role === 'devil' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      }));
      const res = await fetch('/api/debate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: selectedNote.id, noteTitle: selectedNote.title, messages: apiMessages }),
      });
      const json = await res.json();
      if (json.success) {
        setDebateSummarySaved(true);
        // Refresh the note in the sidebar so the content preview updates
        const notesRes = await fetch('/api/notes');
        const notesJson = await notesRes.json();
        if (notesJson.success && notesJson.data?.length > 0) {
          setNotes(notesJson.data);
          const updated = notesJson.data.find((n: Note) => n.id === selectedNote.id);
          if (updated) setSelectedNote(updated);
        }
      } else {
        alert(`保存失败：${json.error || '未知错误'}`);
      }
    } catch (err) {
      alert(`网络错误：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSavingSummary(false);
    }
  };

  // Fetch AI-generated inquiry question
  const fetchInquiryQuestion = useCallback(async (level: number, prevAnswers: { level: number; question: string; answer: string }[]) => {
    setIsLoadingQuestion(true);
    setCurrentQuestion('');
    try {
      const res = await fetch('/api/deep-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: selectedNote, level, previousAnswers: prevAnswers }),
      });
      const json = await res.json();
      if (json.success && json.data?.question) {
        setCurrentQuestion(json.data.question as string);
      } else {
        setCurrentQuestion(`⚠️ AI 暂时无法生成追问（${json.error || '未知错误'}）。请稍后重试。`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCurrentQuestion(`⚠️ 网络请求失败（${msg}）。请检查连接后重试。`);
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [selectedNote]);

  // Load question when entering inquiry tab or level/note changes
  useEffect(() => {
    if (activeTab === 'inquiry') {
      fetchInquiryQuestion(inquiryLevel, inquiryMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, inquiryLevel, selectedNote.id]);

  // Submit answer and advance to next level
  const handleInquiryAnswer = async () => {
    if (!currentAnswer.trim() || isLoadingQuestion) return;
    const newEntry = { level: inquiryLevel, question: currentQuestion, answer: currentAnswer };
    const newMessages = [...inquiryMessages, newEntry];
    setInquiryMessages(newMessages);
    setCurrentAnswer('');
    if (inquiryLevel < 5) {
      setInquiryLevel(inquiryLevel + 1);
      // fetchInquiryQuestion will be triggered by useEffect via inquiryLevel change
    } else {
      // All 5 levels done - save as a new note
      setIsSavingInquiry(true);
      try {
        const res = await fetch('/api/deep-inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save',
            note: { id: selectedNote.id, title: selectedNote.title, source_name: selectedNote.source_name },
            messages: newMessages,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setInquirySavedInfo({ id: json.data.id, title: json.data.title });
        } else {
          alert(`保存失败：${json.error || '未知错误'}`);
        }
      } catch (err) {
        alert(`网络错误：${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsSavingInquiry(false);
      }
    }
  };

  const resetInquiry = () => {
    setInquiryLevel(1);
    setInquiryMessages([]);
    setCurrentAnswer('');
    setCurrentQuestion('');
    setInquirySavedInfo(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">深度思考</h1>
        <p className="text-sm text-muted mt-1">让 AI 做你的专属思辨教练</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('devil')}
          className={cn(
            'px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
            activeTab === 'devil'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-card border border-card-border text-muted hover:text-foreground'
          )}
        >
          <Swords className="w-4 h-4" /> 魔鬼代言人
        </button>
        <button
          onClick={() => setActiveTab('inquiry')}
          className={cn(
            'px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
            activeTab === 'inquiry'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-card border border-card-border text-muted hover:text-foreground'
          )}
        >
          <HelpCircle className="w-4 h-4" /> 五级深度追问
        </button>
      </div>

      {/* Devil's Advocate */}
      {activeTab === 'devil' && (
        <div className="grid grid-cols-4 gap-6">
          {/* Note Selector */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-3">选择要辩论的笔记</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-all text-xs',
                    selectedNote.id === note.id
                      ? 'bg-primary/15 border border-primary/30'
                      : 'hover:bg-secondary/30'
                  )}
                >
                  <p className="font-medium truncate">{note.title}</p>
                  <p className="text-muted mt-1 line-clamp-2">{note.content.substring(0, 60)}...</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-3 glass-card flex flex-col" style={{ height: '600px' }}>
            {/* Chat Header */}
            <div className="p-4 border-b border-card-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">与 AI 辩论</h3>
                <p className="text-xs text-muted mt-0.5">当前话题：{selectedNote.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Finish debate button */}
                {debateMessages.length >= 2 && !debateSummarySaved && (
                  <button
                    onClick={finishDebate}
                    disabled={isSavingSummary}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      isSavingSummary
                        ? 'bg-secondary/50 text-muted cursor-wait'
                        : 'bg-accent-green/15 text-accent-green hover:bg-accent-green/25 border border-accent-green/30'
                    )}
                  >
                    {isSavingSummary ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 生成摘要中…</>
                    ) : (
                      <><BookCheck className="w-3.5 h-3.5" /> 结束辩论</>
                    )}
                  </button>
                )}
                {debateSummarySaved && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-green/10 text-accent-green">
                    <Check className="w-3.5 h-3.5" /> 摘要已保存
                  </span>
                )}
                <button
                  onClick={() => { setDebateMessages([]); setDebateSummarySaved(false); }}
                  className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  title="重新开始"
                >
                  <RotateCcw className="w-4 h-4 text-muted" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {debateMessages.length === 0 && !isThinking ? (
                <div className="flex flex-col items-center justify-center h-full text-muted">
                  <Swords className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm mb-4">选择一篇笔记，让 AI 成为你的辩论对手</p>
                  <button
                    onClick={startDebate}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
                  >
                    开始辩论
                  </button>
                </div>
              ) : debateMessages.length === 0 && isThinking ? (
                <div className="flex flex-col items-center justify-center h-full text-muted">
                  <div className="w-12 h-12 mb-3 rounded-full bg-gradient-to-br from-accent-orange to-accent-pink flex items-center justify-center text-xl opacity-80 animate-pulse">
                    😈
                  </div>
                  <p className="text-sm mb-2">AI 正在分析《{selectedNote.title}》…</p>
                  <p className="text-xs">正在阅读你的笔记，准备个性化反驳</p>
                  <div className="flex gap-1 mt-3">
                    <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : (
                debateMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex gap-3 animate-fade-in',
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                        msg.role === 'devil'
                          ? 'bg-gradient-to-br from-accent-orange to-accent-pink text-white'
                          : 'bg-gradient-to-br from-accent-blue to-accent-purple text-white'
                      )}
                    >
                      {msg.role === 'devil' ? '😈' : '🧑'}
                    </div>
                    <div
                      className={cn(
                        'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                        msg.role === 'devil'
                          ? 'bg-secondary/30 rounded-tl-none'
                          : 'bg-primary/15 rounded-tr-none'
                      )}
                    >
                      {msg.content.split('\n').map((line, j) => (
                        <p key={j} className={cn(line === '' ? 'h-2' : 'mb-1')}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              )}
              {isThinking && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-orange to-accent-pink flex items-center justify-center text-xs">
                    😈
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-secondary/30 rounded-tl-none">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            {debateMessages.length > 0 && (
              <div className="p-4 border-t border-card-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDebateSend()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-card-border text-sm focus:border-primary focus:outline-none"
                    placeholder="回应 AI 的反驳..."
                  />
                  <button
                    onClick={handleDebateSend}
                    className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Five-Level Deep Inquiry */}
      {activeTab === 'inquiry' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Progress */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">追问进度</h3>
            <div className="space-y-3">
              {inquiryLevels.map((level) => {
                const isActive = inquiryLevel === level.level;
                const isDone = inquiryLevel > level.level;
                return (
                  <div
                    key={level.level}
                    className={cn(
                      'p-3 rounded-lg transition-all flex items-center gap-3',
                      isActive ? 'bg-primary/15 border border-primary/30' : isDone ? 'bg-accent-green/10' : 'bg-secondary/20'
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: isDone ? '#22c55e' : isActive ? level.color : '#3d3d6b',
                        color: '#fff',
                      }}
                    >
                      {isDone ? '✓' : level.level}
                    </div>
                    <div>
                      <p className={cn('text-sm font-medium', isActive ? 'text-primary' : isDone ? 'text-accent-green' : 'text-muted')}>
                        {level.label}
                      </p>
                      <p className="text-xs text-muted">{level.prompt}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={resetInquiry}
              className="mt-4 w-full px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3 h-3" /> 重新开始
            </button>

            {/* Topic */}
            <div className="mt-6 pt-4 border-t border-card-border">
              <h4 className="text-xs font-semibold text-muted mb-2">当前话题</h4>
              <p className="text-sm">{selectedNote.title}</p>
              <select
                className="w-full mt-2 px-3 py-2 rounded-lg bg-background border border-card-border text-xs focus:border-primary focus:outline-none"
                value={selectedNote.id}
                onChange={(e) => {
                  const note = notes.find((n) => n.id === e.target.value);
                  if (note) { setSelectedNote(note); resetInquiry(); }
                }}
              >
                {notes.map((n) => (
                  <option key={n.id} value={n.id}>{n.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Inquiry Area */}
          <div className="col-span-2 glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
                style={{ backgroundColor: inquiryLevels[inquiryLevel - 1].color }}
              >
                {inquiryLevel}
              </div>
              <div>
                <h3 className="font-semibold">第 {inquiryLevel} 级追问：{inquiryLevels[inquiryLevel - 1].label}</h3>
                <p className="text-xs text-muted">{inquiryLevels[inquiryLevel - 1].prompt}</p>
              </div>
            </div>

            {/* Previous answers */}
            {inquiryMessages.length > 0 && (
              <div className="space-y-4 mb-6">
                {inquiryMessages.map((msg, i) => (
                  <div key={i} className="border-l-2 pl-4 pb-2 animate-fade-in" style={{ borderColor: inquiryLevels[msg.level - 1].color }}>
                    <p className="text-xs text-muted mb-1">Q{msg.level}: {msg.question.substring(0, 80)}...</p>
                    <p className="text-sm">{msg.answer}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Current question */}
            <div className="bg-secondary/20 rounded-xl p-4 mb-4 min-h-[80px]">
              {isLoadingQuestion ? (
                <div className="flex items-center gap-3 text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm">AI 正在分析笔记，生成追问中…</p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentQuestion}</p>
              )}
            </div>

            {/* Answer input */}
            <div>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                disabled={inquiryLevel >= 5 && inquiryMessages.length >= 5}
                className="w-full px-4 py-3 rounded-xl bg-background border border-card-border text-sm focus:border-primary focus:outline-none resize-none h-32 disabled:opacity-50"
                placeholder={
                  inquirySavedInfo ? '追问已完成并保存 ✓' :
                  inquiryLevel <= 5 ? `回答第 ${inquiryLevel} 级追问...` : '追问已完成'
                }
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted">
                  {inquiryLevel <= 5 && inquiryMessages.length < 5 ? `还有 ${5 - inquiryLevel} 级追问` : '所有追问已完成'}
                </p>
                {inquiryLevel <= 5 && inquiryMessages.length < 5 && (
                  <button
                    onClick={handleInquiryAnswer}
                    disabled={isLoadingQuestion || isSavingInquiry || !currentQuestion || currentQuestion.startsWith('⚠️')}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {isSavingInquiry ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> 保存中…</>
                    ) : inquiryLevel === 5 ? (
                      <>完成并保存 <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>提交回答 <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>

              {/* Saved success notification */}
              {inquirySavedInfo && (
                <div className="mt-4 p-4 rounded-xl bg-accent-green/10 border border-accent-green/30 animate-fade-in">
                  <p className="text-sm font-medium text-accent-green mb-1">✓ 深度追问已保存为独立笔记</p>
                  <p className="text-xs text-muted">{inquirySavedInfo.title}</p>
                  <p className="text-xs text-muted mt-1">可在「笔记」页面查看完整追问记录，原始笔记内容不受影响。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
