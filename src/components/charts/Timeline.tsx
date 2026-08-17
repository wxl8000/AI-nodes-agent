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

import { useState } from 'react';
import type { Milestone } from '@/types';
import { MILESTONE_COLORS } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineProps {
  milestones: Milestone[];
}

const typeLabels = {
  consolidate: '巩固认知',
  overturn: '推翻旧观念',
  explore: '开拓新领域',
};

const typeIcons = {
  consolidate: '🔒',
  overturn: '💥',
  explore: '🚀',
};

export default function Timeline({ milestones }: TimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = filterType === 'all'
    ? milestones
    : milestones.filter((m) => m.type === filterType);

  return (
    <div>
      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'consolidate', 'overturn', 'explore'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              filterType === type
                ? 'text-white'
                : 'bg-secondary/30 text-muted hover:text-foreground'
            )}
            style={filterType === type ? { backgroundColor: type === 'all' ? '#7c5cfc' : MILESTONE_COLORS[type as keyof typeof MILESTONE_COLORS] } : {}}
          >
            {type === 'all' ? '全部' : `${typeIcons[type as keyof typeof typeIcons]} ${typeLabels[type as keyof typeof typeLabels]}`}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-accent-blue/30 to-transparent" />

        <div className="space-y-4">
          {filtered.map((milestone, index) => {
            const isExpanded = expandedId === milestone.id;
            const color = MILESTONE_COLORS[milestone.type];

            return (
              <div
                key={milestone.id}
                className="relative pl-16 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Dot */}
                <div
                  className="absolute left-4 top-3 w-5 h-5 rounded-full border-2 z-10"
                  style={{ borderColor: color, backgroundColor: `${color}30` }}
                >
                  <div className="absolute inset-1 rounded-full" style={{ backgroundColor: color }} />
                </div>

                {/* Card */}
                <div
                  className={cn(
                    'glass-card p-4 cursor-pointer transition-all duration-300',
                    isExpanded && 'border-primary/50'
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : milestone.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: color }}>
                      {typeIcons[milestone.type]} {typeLabels[milestone.type]}
                    </span>
                    <span className="text-xs text-muted">{milestone.date}</span>
                    <span className="ml-auto">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                    </span>
                  </div>
                  <h3 className="font-semibold mt-2">{milestone.title}</h3>
                  <p className="text-xs text-muted mt-1">来源：{milestone.note_title}</p>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-card-border animate-fade-in">
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
