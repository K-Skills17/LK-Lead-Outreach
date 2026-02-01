import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getABTestResults, determineWinner } from '@/lib/ab-testing-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/ab-lab
 * Get A/B test performance data for all active and completed tests
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token !== process.env.ADMIN_DASHBOARD_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all A/B tests (active and completed)
    const { data: tests, error: testsError } = await supabaseAdmin
      .from('ab_test_campaigns')
      .select('*')
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false });

    if (testsError) {
      console.error('[AB Lab] Error fetching tests:', testsError);
      return NextResponse.json(
        { error: 'Failed to fetch tests' },
        { status: 500 }
      );
    }

    // Get performance data for each test
    const testsWithResults = await Promise.all(
      (tests || []).map(async (test: any) => {
        // Get results from view
        const { data: results } = await supabaseAdmin
          .from('ab_test_results')
          .select('*')
          .eq('test_id', test.id);

        // Calculate variant performance
        const variants = (test.variants || []) as Array<{
          name: string;
          weight: number;
          content: any;
        }>;

        const variantPerformance = variants.map((variant) => {
          const result = results?.find((r: any) => r.variant_name === variant.name);
          
          if (!result) {
            return {
              name: variant.name,
              weight: variant.weight,
              distribution: `${variant.weight}%`,
              sampleSize: 0,
              sent: 0,
              opened: 0,
              clicked: 0,
              responded: 0,
              booked: 0,
              openRate: 0,
              clickRate: 0,
              responseRate: 0,
              bookingRate: 0,
              isWinner: false,
              confidence: 0,
            };
          }

          return {
            name: variant.name,
            weight: variant.weight,
            distribution: `${variant.weight}%`,
            sampleSize: parseInt(result.total_assigned) || 0,
            sent: parseInt(result.total_sent) || 0,
            opened: parseInt(result.total_opened) || 0,
            clicked: parseInt(result.total_clicked) || 0,
            responded: parseInt(result.total_responded) || 0,
            booked: parseInt(result.total_booked) || 0,
            openRate: parseFloat(result.open_rate) || 0,
            clickRate: parseFloat(result.click_rate) || 0,
            responseRate: parseFloat(result.response_rate) || 0,
            bookingRate: parseFloat(result.booking_rate) || 0,
            isWinner: test.winner_variant === variant.name,
            confidence: test.confidence_level ? parseFloat(test.confidence_level) : 0,
          };
        });

        // Determine winner if not already determined
        let winner = test.winner_variant;
        let confidence = test.confidence_level ? parseFloat(test.confidence_level) : 0;

        if (!winner && test.status === 'active' && variantPerformance.some(v => v.sent > 50)) {
          // Try to determine winner if we have enough data
          const winnerResult = await determineWinner(test.id, 'open_rate');
          if (winnerResult.success && winnerResult.winner) {
            winner = winnerResult.winner;
            confidence = winnerResult.confidence || 0;
          }
        }

        // Find best performing variant
        const bestVariant = variantPerformance.reduce((best, current) => {
          if (current.openRate > best.openRate) return current;
          return best;
        }, variantPerformance[0] || null);

        return {
          testId: test.id,
          testName: test.test_name,
          description: test.description,
          testType: test.test_type,
          status: test.status,
          startedAt: test.started_at,
          endedAt: test.ended_at,
          variants: variantPerformance,
          winner: winner,
          confidence: confidence,
          bestVariant: bestVariant?.name,
          totalSent: variantPerformance.reduce((sum, v) => sum + v.sent, 0),
          totalOpened: variantPerformance.reduce((sum, v) => sum + v.opened, 0),
          avgOpenRate: variantPerformance.length > 0
            ? variantPerformance.reduce((sum, v) => sum + v.openRate, 0) / variantPerformance.length
            : 0,
        };
      })
    );

    // Get overall statistics
    const allAssignments = await supabaseAdmin
      .from('ab_test_assignments')
      .select('variant_name, test_id');

    const allEvents = await supabaseAdmin
      .from('ab_test_events')
      .select('event_type, assignment_id, ab_test_assignments!inner(test_id, variant_name)');

    // Calculate overall variant performance (across all tests)
    const variantStats: Record<string, {
      name: string;
      totalSent: number;
      totalOpened: number;
      totalClicked: number;
      totalResponded: number;
      totalBooked: number;
      openRate: number;
      clickRate: number;
      responseRate: number;
      bookingRate: number;
    }> = {};

    // Initialize variants
    const allVariants = new Set<string>();
    testsWithResults.forEach(test => {
      test.variants.forEach((v: any) => allVariants.add(v.name));
    });

    allVariants.forEach(variantName => {
      variantStats[variantName] = {
        name: variantName,
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalResponded: 0,
        totalBooked: 0,
        openRate: 0,
        clickRate: 0,
        responseRate: 0,
        bookingRate: 0,
      };
    });

    // Aggregate events by variant
    if (allEvents.data) {
      allEvents.data.forEach((event: any) => {
        const assignment = event.ab_test_assignments;
        if (!assignment) return;

        const variantName = assignment.variant_name;
        if (!variantStats[variantName]) return;

        const stats = variantStats[variantName];

        if (event.event_type === 'sent') stats.totalSent++;
        if (event.event_type === 'opened') stats.totalOpened++;
        if (event.event_type === 'clicked') stats.totalClicked++;
        if (event.event_type === 'responded') stats.totalResponded++;
        if (event.event_type === 'booked') stats.totalBooked++;
      });

      // Calculate rates
      Object.values(variantStats).forEach(stats => {
        stats.openRate = stats.totalSent > 0 ? (stats.totalOpened / stats.totalSent) * 100 : 0;
        stats.clickRate = stats.totalSent > 0 ? (stats.totalClicked / stats.totalSent) * 100 : 0;
        stats.responseRate = stats.totalSent > 0 ? (stats.totalResponded / stats.totalSent) * 100 : 0;
        stats.bookingRate = stats.totalSent > 0 ? (stats.totalBooked / stats.totalSent) * 100 : 0;
      });
    }

    return NextResponse.json({
      success: true,
      tests: testsWithResults,
      overallStats: {
        totalTests: testsWithResults.length,
        activeTests: testsWithResults.filter(t => t.status === 'active').length,
        completedTests: testsWithResults.filter(t => t.status === 'completed').length,
        variantPerformance: Object.values(variantStats),
      },
    });
  } catch (error) {
    console.error('[AB Lab] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
