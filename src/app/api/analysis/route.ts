import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = getServerSupabase();

  try {
    // Fetch all analysis results
    const { data: results, error } = await (supabase.from('analysis_results') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!results || results.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    // Organize by type
    const grouped: Record<string, any[]> = {};
    for (const r of results) {
      if (!grouped[r.analysis_type]) grouped[r.analysis_type] = [];
      grouped[r.analysis_type].push(r);
    }

    // Cognitive radar: average across all notes
    let cognitiveRadar: Record<string, number> | null = null;
    const radarResults = grouped['cognitive_radar'] || [];
    if (radarResults.length > 0) {
      const dims = ['rational_vs_emotional', 'abstract_vs_concrete', 'critical_vs_accepting', 'macro_vs_detail', 'longterm_vs_instant', 'inward_vs_outward'];
      cognitiveRadar = {} as Record<string, number>;
      for (const dim of dims) {
        const vals = radarResults
          .map(r => r.result?.scores?.[dim])
          .filter((v): v is number => typeof v === 'number');
        cognitiveRadar[dim] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 50;
      }
    }

    // Word cloud: merge all keywords
    const wordCloud: any[] = [];
    for (const r of (grouped['word_cloud'] || [])) {
      if (r.result?.keywords) {
        for (const kw of r.result.keywords) {
          wordCloud.push({
            ...kw,
            source_note_id: r.note_id,
          });
        }
      }
    }

    // Milestones
    const milestones: any[] = [];
    for (const r of (grouped['milestone'] || [])) {
      if (r.result?.is_milestone) {
        milestones.push({
          id: r.id,
          note_id: r.note_id,
          date: r.created_at,
          ...r.result,
        });
      }
    }

    // Knowledge galaxy (aggregated)
    const galaxyResult = grouped['knowledge_galaxy']?.[0]?.result || null;

    // Thinking style (aggregated)
    const thinkingStyle = grouped['thinking_style']?.[0]?.result || null;

    // Golden quotes (aggregated)
    const goldenQuotes = grouped['golden_quotes']?.[0]?.result?.quotes || [];

    // Book recommendations (aggregated)
    const bookRecommendations = grouped['book_recommendations']?.[0]?.result?.recommendations || [];

    // Monthly activity: aggregate cognitive_radar results by month
    const monthlyActivityMap = new Map<string, number>();
    for (const r of radarResults) {
      if (!r.created_at) continue;
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyActivityMap.set(key, (monthlyActivityMap.get(key) || 0) + 1);
    }
    const monthlyActivity = Array.from(monthlyActivityMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Cognitive history: average radar scores by quarter
    const quarterMap = new Map<string, { sums: Record<string, number>; count: number }>();
    const dims = ['rational_vs_emotional', 'abstract_vs_concrete', 'critical_vs_accepting', 'macro_vs_detail', 'longterm_vs_instant', 'inward_vs_outward'];
    for (const r of radarResults) {
      if (!r.created_at) continue;
      const d = new Date(r.created_at);
      const q = Math.ceil((d.getMonth() + 1) / 3);
      const key = `${d.getFullYear()}-Q${q}`;
      const existing = quarterMap.get(key) || { sums: {} as Record<string, number>, count: 0 };
      for (const dim of dims) {
        const val = r.result?.scores?.[dim];
        if (typeof val === 'number') {
          existing.sums[dim] = (existing.sums[dim] || 0) + val;
        }
      }
      existing.count++;
      quarterMap.set(key, existing);
    }
    const cognitiveHistory = Array.from(quarterMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => {
        const scores: Record<string, number> = {};
        for (const dim of dims) {
          scores[dim] = data.count > 0 ? Math.round((data.sums[dim] || 0) / data.count) : 50;
        }
        return { period, scores };
      });

    // Domain distribution: aggregate from word_cloud sentiments and tags
    const domainMap = new Map<string, number>();
    for (const w of wordCloud) {
      const tags = w.tags || [];
      if (tags.length > 0) {
        for (const tag of tags) {
          domainMap.set(tag, (domainMap.get(tag) || 0) + (w.weight || 1));
        }
      } else {
        const domain = w.sentiment === 'positive' ? '积极思考' : w.sentiment === 'critical' ? '批判分析' : '知识探索';
        domainMap.set(domain, (domainMap.get(domain) || 0) + (w.weight || 1));
      }
    }
    const totalDomainWeight = Array.from(domainMap.values()).reduce((a, b) => a + b, 0) || 1;
    const domainDistribution = Array.from(domainMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([domain, weight]) => ({
        domain,
        percentage: Math.round((weight / totalDomainWeight) * 100),
      }));

    // Thinking style evolution (from multiple thinking_style results if available)
    const thinkingStyleResults = grouped['thinking_style'] || [];
    const thinkingStyleEvolution = thinkingStyleResults.length > 1
      ? thinkingStyleResults.map(r => ({
          type: r.result?.type || '',
          description: r.result?.description || '',
          traits: r.result?.traits || [],
          date: r.created_at || '',
        }))
      : null;

    // Year-over-year comparison (notes count)
    const currentYear = new Date().getFullYear();
    const notesByYear = new Map<number, number>();
    for (const r of radarResults) {
      if (!r.created_at) continue;
      const y = new Date(r.created_at).getFullYear();
      notesByYear.set(y, (notesByYear.get(y) || 0) + 1);
    }
    const thisYearCount = notesByYear.get(currentYear) || 0;
    const lastYearCount = notesByYear.get(currentYear - 1) || 0;
    const yearOverYear = lastYearCount > 0
      ? { lastYear: lastYearCount, thisYear: thisYearCount, growthRate: `${Math.round(((thisYearCount - lastYearCount) / lastYearCount) * 100)}%` }
      : null;

    // User profile
    const { data: profile } = await (supabase.from('user_profile') as any)
      .select('*')
      .eq('id', 'default')
      .single();

    return NextResponse.json({
      success: true,
      data: {
        cognitive_radar: profile?.cognitive_radar || cognitiveRadar,
        word_cloud: wordCloud,
        milestones: milestones,
        galaxy: galaxyResult,
        thinking_style: profile?.thinking_style || thinkingStyle,
        golden_quotes: goldenQuotes,
        book_recommendations: bookRecommendations,
        monthly_activity: monthlyActivity,
        cognitive_history: cognitiveHistory,
        domain_distribution: domainDistribution,
        thinking_style_evolution: thinkingStyleEvolution,
        year_over_year: yearOverYear,
        analyzed_count: radarResults.length,
        total_notes: profile?.total_notes ?? radarResults.length,
        total_books: profile?.total_books ?? 0,
        total_activities: profile?.total_activities ?? 0,
        knowledge_domains: profile?.knowledge_domains ?? [],
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
