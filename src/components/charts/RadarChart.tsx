'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { CognitiveRadar } from '@/types';
import { COGNITIVE_DIMENSIONS } from '@/lib/utils';

interface RadarChartProps {
  aiRadar: CognitiveRadar;
  userRadar?: CognitiveRadar;
  showComparison?: boolean;
}

export default function RadarChart({ aiRadar, userRadar, showComparison = false }: RadarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    const indicators = COGNITIVE_DIMENSIONS.map((d) => ({
      name: `${d.label}\n/ ${d.opposite}`,
      max: 100,
    }));

    const series: echarts.RadarSeriesOption[] = [
      {
        type: 'radar',
        data: [
          {
            value: Object.values(aiRadar),
            name: 'AI 分析',
            lineStyle: { color: '#7c5cfc', width: 2 },
            areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(124, 92, 252, 0.4)' },
              { offset: 1, color: 'rgba(124, 92, 252, 0.05)' },
            ]) },
            itemStyle: { color: '#7c5cfc' },
            symbol: 'circle',
            symbolSize: 6,
          },
        ],
        animationDuration: 1500,
        animationEasing: 'elasticOut',
      },
    ];

    if (showComparison && userRadar) {
      series[0].data!.push({
        value: Object.values(userRadar),
        name: '你的自评',
        lineStyle: { color: '#ec4899', width: 2, type: 'dashed' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(236, 72, 153, 0.2)' },
          { offset: 1, color: 'rgba(236, 72, 153, 0.02)' },
        ]) },
        itemStyle: { color: '#ec4899' },
        symbol: 'diamond',
        symbolSize: 8,
      });
    }

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      legend: {
        data: showComparison ? ['AI 分析', '你的自评'] : ['AI 分析'],
        bottom: 0,
        textStyle: { color: '#6b6b8a', fontSize: 12 },
        itemWidth: 16,
        itemHeight: 8,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        borderColor: '#2a2a4a',
        textStyle: { color: '#e8e8ef', fontSize: 12 },
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        radius: '65%',
        axisName: {
          color: '#9ca3af',
          fontSize: 11,
        },
        splitLine: {
          lineStyle: { color: 'rgba(42, 42, 74, 0.6)' },
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(42, 42, 74, 0.1)', 'rgba(42, 42, 74, 0.2)'],
          },
        },
        axisLine: {
          lineStyle: { color: 'rgba(42, 42, 74, 0.6)' },
        },
      },
      series,
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [aiRadar, userRadar, showComparison]);

  return <div ref={chartRef} className="w-full h-[400px]" />;
}
