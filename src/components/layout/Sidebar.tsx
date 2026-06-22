'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Brain,
  BookOpen,
  BarChart3,
  MessageCircleQuestion,
  Lightbulb,
  Sparkles,
  Home,
  PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '总览面板', icon: Home },
  { href: '/notes', label: '笔记管理', icon: PenLine },
  { href: '/analysis', label: '认知可视化', icon: BarChart3 },
  { href: '/thinking', label: '深度思考', icon: MessageCircleQuestion },
  { href: '/recommend', label: '智能推荐', icon: Lightbulb },
  { href: '/output', label: '创意输出', icon: Sparkles },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] bg-card border-r border-card-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-pink flex items-center justify-center shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">AI Nodes</h1>
            <p className="text-xs text-muted">笔记分析智能体</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-card-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted truncate">Demo 模式</p>
            <p className="text-xs text-foreground/60 truncate">使用模拟数据</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
