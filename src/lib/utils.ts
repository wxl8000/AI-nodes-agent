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

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short') {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const COGNITIVE_DIMENSIONS = [
  { key: 'rational_vs_emotional', label: '理性分析', opposite: '感性共情' },
  { key: 'abstract_vs_concrete', label: '抽象思辨', opposite: '具象实践' },
  { key: 'critical_vs_accepting', label: '批判质疑', opposite: '接纳吸收' },
  { key: 'macro_vs_detail', label: '宏观格局', opposite: '细节洞察' },
  { key: 'longterm_vs_instant', label: '长期主义', opposite: '即时反馈' },
  { key: 'inward_vs_outward', label: '向内探索', opposite: '向外联结' },
] as const;

export const MILESTONE_COLORS = {
  consolidate: '#22c55e',
  overturn: '#f97316',
  explore: '#8b5cf6',
} as const;

export const SENTIMENT_COLORS = {
  positive: '#f0b429',
  neutral: '#8b8fa3',
  critical: '#e85d75',
} as const;
