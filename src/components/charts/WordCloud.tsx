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

'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import type { WordCloudItem } from '@/types';
import { SENTIMENT_COLORS } from '@/lib/utils';

interface WordCloudProps {
  words: WordCloudItem[];
}

// Layout constants
const SVG_WIDTH = 800;
const SVG_HEIGHT = 480;
const CENTER_X = SVG_WIDTH / 2;
const CENTER_Y = SVG_HEIGHT / 2;
const MAX_WORDS = 35;
const PADDING = 8;
const MIN_FONT = 13;
const MAX_FONT = 42;

interface PlacedWord extends WordCloudItem {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  opacity: number;
  width: number;
  height: number;
}

type SentimentKey = 'positive' | 'neutral' | 'critical';

// Approximate text bounding box (Chinese chars ~1em wide)
function estimateTextSize(text: string, fontSize: number) {
  const charWidth = fontSize * 0.92;
  const width = text.length * charWidth + PADDING * 2;
  const height = fontSize * 1.3 + PADDING * 2;
  return { width, height };
}

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) {
  return (
    a.x - a.width / 2 < b.x + b.width / 2 &&
    a.x + a.width / 2 > b.x - b.width / 2 &&
    a.y - a.height / 2 < b.y + b.height / 2 &&
    a.y + a.height / 2 > b.y - b.height / 2
  );
}

// Spiral placement with collision detection
function layoutWords(words: WordCloudItem[]): PlacedWord[] {
  const sorted = [...words]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_WORDS);

  if (sorted.length === 0) return [];

  const maxWeight = sorted[0].weight || 100;
  const minWeight = sorted[sorted.length - 1]?.weight || 10;
  const weightRange = maxWeight - minWeight || 1;

  const placed: PlacedWord[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const word = sorted[i];
    const weightNorm = (word.weight - minWeight) / weightRange;
    const fontSize = MIN_FONT + weightNorm * (MAX_FONT - MIN_FONT);
    const { width, height } = estimateTextSize(word.text, fontSize);
    const color = SENTIMENT_COLORS[word.sentiment];
    const opacity = 0.65 + weightNorm * 0.35;

    // Spiral search from center outward
    let bestX = CENTER_X;
    let bestY = CENTER_Y;
    let found = false;

    const angleStep = 0.35;
    const radiusStep = 3.2;
    const maxRadius = Math.max(SVG_WIDTH, SVG_HEIGHT) * 0.55;

    for (let r = 0; r < maxRadius && !found; r += radiusStep) {
      const angleOffset = i * 1.2;
      for (let a = 0; a < Math.PI * 2 && !found; a += angleStep) {
        const cx = CENTER_X + Math.cos(a + angleOffset) * r * 1.15;
        const cy = CENTER_Y + Math.sin(a + angleOffset) * r * 0.75;

        if (
          cx - width / 2 < 10 || cx + width / 2 > SVG_WIDTH - 10 ||
          cy - height / 2 < 10 || cy + height / 2 > SVG_HEIGHT - 10
        ) continue;

        const candidate = { x: cx, y: cy, width, height };
        const overlaps = placed.some(p => rectsOverlap(candidate, p));

        if (!overlaps) {
          bestX = cx;
          bestY = cy;
          found = true;
        }
      }
    }

    if (!found) continue;

    placed.push({
      ...word,
      x: bestX,
      y: bestY,
      fontSize,
      color,
      opacity,
      width,
      height,
    });
  }

  return placed;
}

export default function WordCloud({ words }: WordCloudProps) {
  const [hoveredWord, setHoveredWord] = useState<PlacedWord | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const placed = useMemo(() => layoutWords(words), [words]);

  const levelLabels = { fact: '事实描述', opinion: '观点表达', principle: '底层规律' };
  const sentimentLabels: Record<SentimentKey, string> = { positive: '正向', neutral: '中性', critical: '批判' };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleEnter = useCallback((word: PlacedWord) => {
    setHoveredWord(word);
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredWord(null);
  }, []);

  // Group by sentiment for legend stats
  const stats = useMemo(() => {
    const s: Record<SentimentKey, number> = { positive: 0, neutral: 0, critical: 0 };
    placed.forEach(w => { s[w.sentiment] = (s[w.sentiment] || 0) + 1; });
    return s;
  }, [placed]);

  return (
    <div className="relative">
      {/* Legend bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-5">
          <span className="text-xs text-muted font-medium">情感色彩</span>
          {(Object.entries(SENTIMENT_COLORS) as [SentimentKey, string][]).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}40` }}
              />
              <span className="text-xs text-muted">
                {sentimentLabels[key]} ({stats[key] || 0})
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">字号</span>
            <span className="text-[11px] text-foreground/70 font-medium">大=重要</span>
            <span className="text-muted text-[10px]">|</span>
            <span className="text-[10px] text-muted">粗细</span>
            <span className="text-[11px] text-foreground/70 font-medium">粗=深层规律</span>
          </div>
        </div>
      </div>

      {/* Word Cloud SVG */}
      <div className="relative" onMouseMove={handleMouseMove}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full"
          style={{ height: 'min(480px, 60vh)' }}
        >
          <defs>
            <radialGradient id="wc-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(124,92,252,0.04)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#wc-bg)" rx="12" />

          {placed.map((word, i) => {
            const isHovered = hoveredWord === word;
            const fontWeight =
              word.level === 'principle' ? 700 :
              word.level === 'opinion' ? 500 : 400;

            return (
              <g key={`${word.text}-${i}`}>
                {isHovered && (
                  <text
                    x={word.x}
                    y={word.y}
                    fontSize={word.fontSize + 2}
                    fill={word.color}
                    opacity={0.2}
                    fontWeight={fontWeight}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fontFamily: 'var(--font-sans)', filter: 'blur(6px)' }}
                  >
                    {word.text}
                  </text>
                )}
                <text
                  x={word.x}
                  y={word.y}
                  fontSize={word.fontSize}
                  fill={word.color}
                  opacity={isHovered ? 1 : word.opacity}
                  fontWeight={fontWeight}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s, font-size 0.2s',
                    transform: isHovered ? 'scale(1.08)' : undefined,
                    transformOrigin: `${word.x}px ${word.y}px`,
                  }}
                  onMouseEnter={() => handleEnter(word)}
                  onMouseLeave={handleLeave}
                >
                  {word.text}
                </text>
              </g>
            );
          })}

          {placed.length === 0 && (
            <text
              x={CENTER_X}
              y={CENTER_Y}
              textAnchor="middle"
              fill="var(--muted)"
              fontSize={16}
            >
              暂无词云数据
            </text>
          )}
        </svg>

        {/* Floating tooltip */}
        {hoveredWord && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: Math.min(tooltipPos.x + 14, (svgRef.current?.getBoundingClientRect().width || SVG_WIDTH) - 220),
              top: Math.max(tooltipPos.y - 95, 8),
            }}
          >
            <div
              className="rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md"
              style={{
                background: 'rgba(26,26,46,0.92)',
                borderColor: `${hoveredWord.color}50`,
                minWidth: 180,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: hoveredWord.color }}
                />
                <span className="font-bold text-foreground" style={{ fontSize: Math.max(13, hoveredWord.fontSize * 0.36) }}>
                  {hoveredWord.text}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-muted">认知层级</span>
                <span className="text-foreground/80 font-medium">{levelLabels[hoveredWord.level]}</span>
                <span className="text-muted">情感色彩</span>
                <span style={{ color: hoveredWord.color }} className="font-medium">
                  {sentimentLabels[hoveredWord.sentiment]}
                </span>
                <span className="text-muted">权重</span>
                <span className="text-foreground/80 font-medium">{hoveredWord.weight}</span>
                <span className="text-muted">来源</span>
                <span className="text-primary truncate max-w-[120px]">{hoveredWord.source_note_title}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-card-border/50">
        <span className="text-[11px] text-muted">
          共展示 <span className="text-foreground/70 font-medium">{placed.length}</span> 个关键词
          {words.length > MAX_WORDS && (
            <span className="ml-1">(已按权重筛选前 {MAX_WORDS} 个)</span>
          )}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted">认知层级分布</span>
          {(['principle', 'opinion', 'fact'] as const).map(lvl => {
            const count = placed.filter(w => w.level === lvl).length;
            if (count === 0) return null;
            return (
              <span key={lvl} className="text-[11px] text-foreground/60">
                {levelLabels[lvl]}: {count}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
