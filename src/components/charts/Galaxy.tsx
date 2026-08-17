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

import { useState, useEffect, useRef, useCallback } from 'react';
import type { GalaxyNode, GalaxyEdge } from '@/types';
import { cn } from '@/lib/utils';

interface GalaxyProps {
  nodes: GalaxyNode[];
  edges: GalaxyEdge[];
}

interface RenderNode extends GalaxyNode {
  x: number;
  y: number;
  radius: number;
  color: string;
  glowColor: string;
  vx: number;
  vy: number;
}

const NODE_STYLES = {
  star: { baseRadius: 30, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
  planet: { baseRadius: 18, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.2)' },
  comet: { baseRadius: 12, color: '#8b5cf6', glow: 'rgba(139, 92, 252, 0.2)' },
};

export default function Galaxy({ nodes, edges }: GalaxyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<GalaxyNode | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const renderNodesRef = useRef<RenderNode[]>([]);

  // Initialize node positions
  useEffect(() => {
    const centerX = 500;
    const centerY = 350;

    const renderNodes: RenderNode[] = nodes.map((node, index) => {
      const style = NODE_STYLES[node.type];
      const radius = style.baseRadius * (node.weight / 100);

      let x: number, y: number;
      if (node.type === 'star') {
        // Stars near center
        const starIndex = nodes.filter((n) => n.type === 'star').indexOf(node);
        const angle = (starIndex * Math.PI * 2) / nodes.filter((n) => n.type === 'star').length;
        x = centerX + Math.cos(angle) * 80;
        y = centerY + Math.sin(angle) * 80;
      } else if (node.type === 'planet') {
        // Planets orbit around parent star
        const parentEdge = edges.find((e) => e.target === node.id && nodes.find((n) => n.id === e.source)?.type === 'star');
        const parent = parentEdge ? nodes.find((n) => n.id === parentEdge.source) : null;
        const parentPos = parent
          ? renderNodesRef.current.find((rn) => rn.id === parent.id)
          : null;
        const planetIndex = index % 6;
        const angle = (planetIndex * Math.PI * 2) / 6 + Math.random() * 0.5;
        const dist = 160 + Math.random() * 80;
        x = (parentPos?.x || centerX) + Math.cos(angle) * dist;
        y = (parentPos?.y || centerY) + Math.sin(angle) * dist;
      } else {
        // Comets far out
        const angle = Math.random() * Math.PI * 2;
        const dist = 280 + Math.random() * 60;
        x = centerX + Math.cos(angle) * dist;
        y = centerY + Math.sin(angle) * dist;
      }

      return {
        ...node,
        x,
        y,
        radius: Math.max(8, radius),
        color: style.color,
        glowColor: style.glow,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      };
    });

    renderNodesRef.current = renderNodes;
  }, [nodes, edges]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(offset.x + w / 2, offset.y + h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -h / 2);

    const renderNodes = renderNodesRef.current;

    // Draw edges
    edges.forEach((edge) => {
      const source = renderNodes.find((n) => n.id === edge.source);
      const target = renderNodes.find((n) => n.id === edge.target);
      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = `rgba(124, 92, 252, ${edge.strength * 0.3})`;
      ctx.lineWidth = edge.strength * 2;
      ctx.stroke();
    });

    // Draw nodes
    renderNodes.forEach((node) => {
      // Glow
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 2.5);
      gradient.addColorStop(0, node.glowColor);
      gradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Node body
      const bodyGradient = ctx.createRadialGradient(
        node.x - node.radius * 0.3,
        node.y - node.radius * 0.3,
        0,
        node.x,
        node.y,
        node.radius
      );
      bodyGradient.addColorStop(0, '#fff');
      bodyGradient.addColorStop(0.3, node.color);
      bodyGradient.addColorStop(1, `${node.color}80`);

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = bodyGradient;
      ctx.fill();

      // Selected ring
      if (selectedNode?.id === node.id) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Comet tail
      if (node.type === 'comet') {
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(node.x - 40, node.y + 20);
        const tailGradient = ctx.createLinearGradient(node.x, node.y, node.x - 40, node.y + 20);
        tailGradient.addColorStop(0, node.color);
        tailGradient.addColorStop(1, 'transparent');
        ctx.strokeStyle = tailGradient;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#e8e8ef';
      ctx.font = `${node.type === 'star' ? 13 : 11}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + node.radius + 16);
    });

    ctx.restore();
  }, [edges, offset, scale, selectedNode]);

  useEffect(() => {
    const animate = () => {
      draw();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(Math.max(0.3, Math.min(3, scale * delta)));
  };

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Transform coordinates
    const w = canvas.width;
    const h = canvas.height;
    const tx = (mx - offset.x - w / 2) / scale + w / 2;
    const ty = (my - offset.y - h / 2) / scale + h / 2;

    const clicked = renderNodesRef.current.find((node) => {
      const dx = tx - node.x;
      const dy = ty - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius + 10;
    });

    setSelectedNode(clicked || null);
  };

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex gap-4 mb-4">
        {Object.entries(NODE_STYLES).map(([type, style]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: style.color }} />
            <span className="text-xs text-muted">
              {type === 'star' ? '恒星（深耕领域）' : type === 'planet' ? '行星（关联书籍）' : '彗星（跨界思考）'}
            </span>
          </div>
        ))}
        <span className="text-xs text-muted ml-auto">滚轮缩放 · 拖拽漫游</span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={700}
        className="w-full h-[500px] rounded-xl bg-background/50 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* Selected Node Detail */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 glass-card p-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: NODE_STYLES[selectedNode.type].color }}
            />
            <h3 className="font-semibold">{selectedNode.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted">
              {selectedNode.domain}
            </span>
            <span className="text-xs text-muted ml-auto">权重: {selectedNode.weight}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {selectedNode.related_notes.map((note, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary">
                {note}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
