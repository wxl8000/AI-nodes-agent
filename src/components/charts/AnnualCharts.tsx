'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { COGNITIVE_DIMENSIONS } from '@/lib/utils';

const CHART_BG = 'transparent';
const AXIS_COLOR = '#6b6b8a';
const GRID_COLOR = 'rgba(42, 42, 74, 0.4)';
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(26, 26, 46, 0.95)',
  borderColor: '#2a2a4a',
  textStyle: { color: '#e8e8ef', fontSize: 12 },
};

// ========== 1. 月度学习活跃度柱状图 ==========

interface ActivityHeatmapProps {
  data: { month: string; count: number }[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    instanceRef.current = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const months = data.map(d => {
      const [, m] = d.month.split('-');
      return `${parseInt(m)}月`;
    });
    const counts = data.map(d => d.count);
    const maxCount = Math.max(...counts, 1);

    const option: echarts.EChartsOption = {
      backgroundColor: CHART_BG,
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'axis',
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `<div style="font-size:13px;font-weight:600">${p.name}</div><div style="margin-top:4px;color:#7c5cfc">笔记数: ${p.value} 篇</div>`;
        },
      },
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: GRID_COLOR } },
        axisLabel: { color: AXIS_COLOR, fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: GRID_COLOR, type: 'dashed' } },
        axisLabel: { color: AXIS_COLOR, fontSize: 11 },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: counts.map(v => ({
            value: v,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: v / maxCount > 0.7 ? '#7c5cfc' : '#3b82f6' },
                { offset: 1, color: v / maxCount > 0.7 ? '#ec4899' : '#22c55e' },
              ]),
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barMaxWidth: 36,
          animationDuration: 1500,
          animationEasing: 'elasticOut',
        },
      ],
    };

    instanceRef.current.setOption(option);
    const onResize = () => instanceRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      instanceRef.current?.dispose();
    };
  }, [data]);

  if (data.length === 0) {
    return <div className="text-center text-sm text-muted py-8">暂无月度活跃数据</div>;
  }

  return <div ref={chartRef} className="w-full h-[280px]" />;
}

// ========== 2. 认知维度趋势折线图 ==========

interface CognitiveTrendLineProps {
  history: { period: string; scores: Record<string, number> }[];
}

const DIM_COLORS = ['#7c5cfc', '#3b82f6', '#22c55e', '#f97316', '#ec4899', '#eab308'];

export function CognitiveTrendLine({ history }: CognitiveTrendLineProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || history.length < 2) return;
    instanceRef.current = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const periods = history.map(h => h.period);
    const series = COGNITIVE_DIMENSIONS.map((dim, i) => ({
      name: dim.label,
      type: 'line' as const,
      data: history.map(h => h.scores[dim.key] ?? 50),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: DIM_COLORS[i], width: 2 },
      itemStyle: { color: DIM_COLORS[i] },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: `${DIM_COLORS[i]}20` },
          { offset: 1, color: `${DIM_COLORS[i]}05` },
        ]),
      },
      animationDuration: 1500 + i * 200,
    }));

    const option: echarts.EChartsOption = {
      backgroundColor: CHART_BG,
      tooltip: { ...TOOLTIP_STYLE, trigger: 'axis' },
      legend: {
        data: COGNITIVE_DIMENSIONS.map(d => d.label),
        bottom: 0,
        textStyle: { color: AXIS_COLOR, fontSize: 11 },
        itemWidth: 14,
        itemHeight: 8,
      },
      grid: { left: 40, right: 20, top: 20, bottom: 50 },
      xAxis: {
        type: 'category',
        data: periods,
        axisLine: { lineStyle: { color: GRID_COLOR } },
        axisLabel: { color: AXIS_COLOR, fontSize: 11 },
        axisTick: { show: false },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: GRID_COLOR, type: 'dashed' } },
        axisLabel: { color: AXIS_COLOR, fontSize: 11 },
        axisLine: { show: false },
      },
      series,
    };

    instanceRef.current.setOption(option);
    const onResize = () => instanceRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      instanceRef.current?.dispose();
    };
  }, [history]);

  if (history.length < 2) {
    return (
      <div className="text-center text-sm text-muted py-8">
        需要至少 2 个季度的数据才能展示趋势变化
      </div>
    );
  }

  return <div ref={chartRef} className="w-full h-[320px]" />;
}

// ========== 3. 知识领域分布环形图 ==========

interface DomainPieChartProps {
  data: { domain: string; percentage: number }[];
}

const PIE_COLORS = ['#7c5cfc', '#3b82f6', '#22c55e', '#f97316', '#ec4899', '#eab308', '#06b6d4', '#ef4444'];

export function DomainPieChart({ data }: DomainPieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    instanceRef.current = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const total = data.reduce((s, d) => s + d.percentage, 0);

    const option: echarts.EChartsOption = {
      backgroundColor: CHART_BG,
      tooltip: {
        ...TOOLTIP_STYLE,
        trigger: 'item',
        formatter: (params: any) =>
          `<div style="font-size:13px;font-weight:600">${params.name}</div><div style="margin-top:4px;color:${params.color}">占比: ${params.value}%</div>`,
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '48%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#0f0f17', borderWidth: 3 },
          label: {
            show: true,
            color: '#e8e8ef',
            fontSize: 12,
            formatter: '{b}\n{d}%',
          },
          labelLine: { lineStyle: { color: '#3d3d6b' } },
          emphasis: {
            itemStyle: { shadowBlur: 20, shadowColor: 'rgba(124,92,252,0.4)' },
            label: { fontSize: 14, fontWeight: 'bold' },
          },
          data: data.map((d, i) => ({
            value: d.percentage,
            name: d.domain,
            itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] },
          })),
          animationDuration: 1500,
          animationEasing: 'elasticOut',
        },
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '44%',
          style: {
            text: `${data.length}`,
            fontSize: 28,
            fontWeight: 'bold',
            fill: '#7c5cfc',
          },
        },
        {
          type: 'text',
          left: 'center',
          top: '54%',
          style: {
            text: '个领域',
            fontSize: 12,
            fill: AXIS_COLOR,
          },
        },
      ],
    };

    instanceRef.current.setOption(option);
    const onResize = () => instanceRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      instanceRef.current?.dispose();
    };
  }, [data]);

  if (data.length === 0) {
    return <div className="text-center text-sm text-muted py-8">暂无知识领域数据</div>;
  }

  return <div ref={chartRef} className="w-full h-[320px]" />;
}

// ========== 4. 认知雷达对比图（年初 vs 年末） ==========

interface RadarEvolutionProps {
  startScores: Record<string, number>;
  endScores: Record<string, number>;
}

export function RadarEvolution({ startScores, endScores }: RadarEvolutionProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    instanceRef.current = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const indicators = COGNITIVE_DIMENSIONS.map(d => ({
      name: `${d.label}\n/ ${d.opposite}`,
      max: 100,
    }));

    const option: echarts.EChartsOption = {
      backgroundColor: CHART_BG,
      tooltip: { ...TOOLTIP_STYLE, trigger: 'item' },
      legend: {
        data: ['年初', '年末'],
        bottom: 0,
        textStyle: { color: AXIS_COLOR, fontSize: 12 },
        itemWidth: 16,
        itemHeight: 8,
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        radius: '62%',
        axisName: { color: '#9ca3af', fontSize: 11 },
        splitLine: { lineStyle: { color: GRID_COLOR } },
        splitArea: { areaStyle: { color: ['rgba(42,42,74,0.1)', 'rgba(42,42,74,0.2)'] } },
        axisLine: { lineStyle: { color: GRID_COLOR } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: COGNITIVE_DIMENSIONS.map(d => startScores[d.key] ?? 50),
              name: '年初',
              lineStyle: { color: '#ec4899', width: 2, type: 'dashed' },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(236,72,153,0.25)' },
                  { offset: 1, color: 'rgba(236,72,153,0.03)' },
                ]),
              },
              itemStyle: { color: '#ec4899' },
              symbol: 'diamond',
              symbolSize: 7,
            },
            {
              value: COGNITIVE_DIMENSIONS.map(d => endScores[d.key] ?? 50),
              name: '年末',
              lineStyle: { color: '#7c5cfc', width: 2 },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(124,92,252,0.35)' },
                  { offset: 1, color: 'rgba(124,92,252,0.05)' },
                ]),
              },
              itemStyle: { color: '#7c5cfc' },
              symbol: 'circle',
              symbolSize: 6,
            },
          ],
          animationDuration: 1500,
          animationEasing: 'elasticOut',
        },
      ],
    };

    instanceRef.current.setOption(option);
    const onResize = () => instanceRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      instanceRef.current?.dispose();
    };
  }, [startScores, endScores]);

  return <div ref={chartRef} className="w-full h-[380px]" />;
}
