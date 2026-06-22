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
