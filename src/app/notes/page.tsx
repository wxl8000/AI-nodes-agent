'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, BookOpen, Calendar, Tag, Search, FileText,
  Upload, FileUp, CheckCircle2, XCircle, Loader2,
  PenLine, Lightbulb, X, Trash2, Briefcase, Sparkles,
} from 'lucide-react';
import { mockNotes } from '@/lib/mock/data';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';

// 来源类型图标和颜色配置
const SOURCE_CONFIG = {
  book:       { icon: BookOpen,   color: 'text-accent-blue',   bg: 'bg-accent-blue/15',   label: '书籍' },
  activity:   { icon: Calendar,   color: 'text-accent-orange', bg: 'bg-accent-orange/15', label: '活动' },
  article:    { icon: PenLine,    color: 'text-accent-green',  bg: 'bg-accent-green/15',  label: '文章' },
  thought:    { icon: Lightbulb,  color: 'text-accent-purple', bg: 'bg-accent-purple/15', label: '随想' },
  experience: { icon: Briefcase,  color: 'text-accent-yellow', bg: 'bg-accent-yellow/15', label: '经历' },
};

// 导入结果类型
interface ImportResult {
  fileName: string;
  success: boolean;
  title?: string;
  action?: 'created' | 'updated';
  error?: string;
}

export default function NotesPage() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>(searchParams.get('filter') || 'all');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source_type: 'book' as Note['source_type'],
    source_name: '',
    tags: '',
  });

  // 从 API 加载笔记
  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes');
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setNotes(json.data);
      } else {
        // API 无数据时使用 mock 数据
        setNotes(mockNotes);
      }
    } catch {
      // API 失败时 fallback 到 mock
      setNotes(mockNotes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // 根据 URL 参数 noteId 自动选中对应笔记
  useEffect(() => {
    const noteId = searchParams.get('noteId');
    if (noteId && notes.length > 0 && !selectedNote) {
      const target = notes.find(n => n.id === noteId);
      if (target) setSelectedNote(target);
    }
  }, [notes, searchParams]);

  // 过滤笔记
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.includes(searchTerm) ||
      note.content.includes(searchTerm) ||
      note.source_name.includes(searchTerm);
    const matchesType = filterType === 'all' || note.source_type === filterType;
    return matchesSearch && matchesType;
  });

  // 导入 TXT 文件
  const handleImportFiles = async (files: FileList | File[]) => {
    const txtFiles = Array.from(files).filter(f => f.name.endsWith('.txt'));
    if (txtFiles.length === 0) return;

    setImporting(true);
    setImportResults(null);

    const formDataObj = new FormData();
    txtFiles.forEach(f => formDataObj.append('files', f));

    try {
      const res = await fetch('/api/notes/import', {
        method: 'POST',
        body: formDataObj,
      });
      const json = await res.json();
      setImportResults(json.results || []);

      if (json.success) {
        await fetchNotes(); // 重新加载列表
      }
    } catch {
      setImportResults([{ fileName: '上传失败', success: false, error: '网络错误' }]);
    } finally {
      setImporting(false);
    }
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleImportFiles(e.dataTransfer.files);
    }
  };

  // 手动添加笔记
  const handleAddNote = async () => {
    if (!formData.title || !formData.content) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          source_type: formData.source_type,
          source_name: formData.source_name,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchNotes();
        setFormData({ title: '', content: '', source_type: 'book', source_name: '', tags: '' });
        setShowForm(false);
      }
    } catch {
      // fallback: 本地添加
      const newNote: Note = {
        id: `note-${Date.now()}`,
        title: formData.title,
        content: formData.content,
        source_type: formData.source_type,
        source_name: formData.source_name,
        created_at: new Date().toISOString().split('T')[0],
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        analysis_status: 'pending',
      };
      setNotes([newNote, ...notes]);
      setFormData({ title: '', content: '', source_type: 'book', source_name: '', tags: '' });
      setShowForm(false);
    }
  };

  // 删除笔记
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('确定要删除这条笔记吗？')) return;

    try {
      const res = await fetch(`/api/notes?id=${noteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setNotes(notes.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) setSelectedNote(null);
      }
    } catch {
      // fallback: 本地删除
      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) setSelectedNote(null);
    }
  };

  // AI 分析全部笔记
  const handleAnalyzeAll = async () => {
    setAnalyzing(true);
    setAnalysisProgress('开始分析...');

    try {
      const res = await fetch('/api/analyze', { method: 'POST' });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('无法读取响应流');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'progress') {
              if (data.step === 'per-note') {
                setAnalysisProgress(`分析 ${data.current}/${data.total}: ${data.title}`);
              } else if (data.step === 'aggregate') {
                setAnalysisProgress(data.message || '聚合分析中...');
              }
            } else if (data.type === 'note-done') {
              setAnalysisProgress(`✓ ${data.title} (${data.current}/${data.total})`);
            } else if (data.type === 'done') {
              setAnalysisProgress(`分析完成！共 ${data.analyzed} 条笔记`);
              // Refresh notes
              fetchNotes();
            } else if (data.type === 'error') {
              setAnalysisProgress(`错误: ${data.message}`);
            } else if (data.type === 'info') {
              setAnalysisProgress(data.message);
            }
          } catch { /* skip parse errors */ }
        }
      }
    } catch (err) {
      setAnalysisProgress(`分析失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  // 生成摘要
  const getSummary = (content: string, maxLen = 80) => {
    const cleaned = content.replace(/\n+/g, ' ').trim();
    return cleaned.length > maxLen ? cleaned.substring(0, maxLen) + '…' : cleaned;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">笔记管理</h1>
          <p className="text-sm text-muted mt-1">
            管理你的读书笔记和活动感想
            {notes.length > 0 && <span className="ml-2 text-primary">· {notes.length} 条笔记</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAnalyzeAll}
            disabled={analyzing || notes.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analyzing ? '分析中...' : 'AI 分析全部'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors disabled:opacity-50"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            导入 TXT
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleImportFiles(e.target.files)}
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加笔记
          </button>
        </div>
      </div>

      {/* 分析进度 */}
      {analyzing && analysisProgress && (
        <div className="glass-card p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-accent-purple" />
          <span className="text-sm">{analysisProgress}</span>
        </div>
      )}
      {!analyzing && analysisProgress && analysisProgress.includes('完成') && (
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent-green" />
            <span className="text-sm">{analysisProgress}</span>
          </div>
          <button onClick={() => setAnalysisProgress('')} className="text-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 导入结果提示 */}
      {importResults && (
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">导入结果</h3>
            <button onClick={() => setImportResults(null)} className="text-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          {importResults.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {r.success ? (
                <CheckCircle2 className={cn('w-4 h-4 shrink-0', r.action === 'updated' ? 'text-accent-blue' : 'text-accent-green')} />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="text-foreground/80">{r.fileName}</span>
              {r.title && <span className="text-muted">→ {r.title}</span>}
              {r.action === 'created' && <span className="text-accent-green text-xs">新增</span>}
              {r.action === 'updated' && <span className="text-accent-blue text-xs">已更新</span>}
              {r.error && <span className="text-red-400 text-xs">{r.error}</span>}
            </div>
          ))}
        </div>
      )}

      {/* 拖拽上传区域 */}
      {isDragging && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="glass-card p-12 flex flex-col items-center gap-4 border-2 border-dashed border-primary">
            <FileUp className="w-16 h-16 text-primary animate-bounce" />
            <p className="text-lg font-medium">松开鼠标导入 TXT 笔记</p>
            <p className="text-sm text-muted">支持同时上传多个文件</p>
          </div>
        </div>
      )}

      {/* 手动添加表单 */}
      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">新建笔记</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-card-border text-sm focus:border-primary focus:outline-none"
                placeholder="笔记标题"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">来源类型</label>
              <select
                value={formData.source_type}
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value as Note['source_type'] })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-card-border text-sm focus:border-primary focus:outline-none"
              >
                <option value="book">书籍</option>
                <option value="article">文章</option>
                <option value="activity">活动</option>
                <option value="experience">经历</option>
                <option value="thought">随想</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">来源名称</label>
              <input
                type="text"
                value={formData.source_name}
                onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-card-border text-sm focus:border-primary focus:outline-none"
                placeholder="书名/活动名"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">标签（逗号分隔）</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-card-border text-sm focus:border-primary focus:outline-none"
                placeholder="心理学, 决策, ..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">内容</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-card-border text-sm focus:border-primary focus:outline-none h-40 resize-none"
              placeholder="粘贴你的笔记内容..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddNote}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
            >
              保存笔记
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-card-border text-sm focus:border-primary focus:outline-none"
            placeholder="搜索笔记..."
          />
        </div>
        <div className="flex gap-2">
          {['all', 'book', 'article', 'activity', 'experience', 'thought'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                filterType === type
                  ? 'bg-primary text-white'
                  : 'bg-card border border-card-border text-muted hover:text-foreground'
              )}
            >
              {type === 'all' ? '全部' : SOURCE_CONFIG[type as keyof typeof SOURCE_CONFIG].label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List & Detail */}
      <div className="grid grid-cols-5 gap-6">
        {/* List - 卡片样式 */}
        <div
          className="col-span-2 space-y-3 max-h-[650px] overflow-y-auto pr-2"
          onDragOver={handleDragOver}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted">
              <FileText className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">暂无笔记</p>
              <p className="text-xs mt-1">点击「导入 TXT」或「添加笔记」开始</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const cfg = SOURCE_CONFIG[note.source_type] || SOURCE_CONFIG.thought;
              const Icon = cfg.icon;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={cn(
                    'glass-card p-5 cursor-pointer transition-all duration-200 group',
                    selectedNote?.id === note.id
                      ? 'border-primary shadow-[0_0_20px_rgba(124,92,252,0.15)]'
                      : 'hover:border-primary/50'
                  )}
                >
                  {/* 来源图标 + 来源名 + 日期 */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', cfg.bg)}>
                      <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                    </div>
                    <span className="text-xs text-muted truncate">{note.source_name}</span>
                    <span className="ml-auto text-xs text-muted shrink-0">{formatDate(note.created_at)}</span>
                  </div>

                  {/* 标题 */}
                  <h3 className="text-sm font-semibold mb-1.5 leading-snug group-hover:text-primary transition-colors">
                    {note.title}
                  </h3>

                  {/* 摘要 */}
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">
                    {getSummary(note.content)}
                  </p>

                  {/* 标签 */}
                  {note.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-3">
                      {note.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2.5 py-0.5 rounded-full bg-secondary/40 text-foreground/60 border border-card-border/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Detail */}
        <div className="col-span-3 glass-card p-6 max-h-[650px] overflow-y-auto">
          {selectedNote ? (
            <div>
              {/* Detail Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center',
                  SOURCE_CONFIG[selectedNote.source_type]?.bg || 'bg-secondary'
                )}>
                  {(() => {
                    const Icon = SOURCE_CONFIG[selectedNote.source_type]?.icon || Lightbulb;
                    return <Icon className={cn('w-4.5 h-4.5', SOURCE_CONFIG[selectedNote.source_type]?.color || 'text-muted')} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold truncate">{selectedNote.title}</h2>
                  <p className="text-xs text-muted">{selectedNote.source_name} · {formatDate(selectedNote.created_at)}</p>
                </div>
                <span className={cn(
                  'text-[10px] px-2 py-1 rounded-full',
                  selectedNote.analysis_status === 'completed'
                    ? 'bg-accent-green/15 text-accent-green'
                    : selectedNote.analysis_status === 'analyzing'
                    ? 'bg-accent-blue/15 text-accent-blue'
                    : 'bg-secondary/50 text-muted'
                )}>
                  {selectedNote.analysis_status === 'completed' ? '已分析' :
                   selectedNote.analysis_status === 'analyzing' ? '分析中' :
                   selectedNote.analysis_status === 'failed' ? '失败' : '待分析'}
                </span>
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="p-2 rounded-lg hover:bg-red-500/15 text-muted hover:text-red-400 transition-colors"
                  title="删除笔记"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Tags */}
              {selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {selectedNote.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-secondary/50 text-foreground/80 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="space-y-3">
                {selectedNote.content.split('\n').filter(Boolean).map((line, i) => {
                  // 检测是否为标题行（一、二、三... 或 1. 2. 3.）
                  const isHeading = /^[一二三四五六七八九十]+、/.test(line) ||
                                   /^\d+\.\s/.test(line.trim());
                  return isHeading ? (
                    <h4 key={i} className="text-sm font-semibold text-foreground mt-4 mb-1">
                      {line}
                    </h4>
                  ) : (
                    <p key={i} className="text-sm leading-relaxed text-foreground/80">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p>点击左侧笔记查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

