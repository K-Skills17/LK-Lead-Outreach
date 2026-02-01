import { NextRequest, NextResponse } from 'next/server';
import { getCampaignAnalysisData, generateAIStrategistSuggestions } from '@/lib/ai-strategist-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/ai-strategist
 * Get AI-powered campaign optimization suggestions
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

    // Get analysis data
    const analysisData = await getCampaignAnalysisData();

    // Generate AI suggestions
    const suggestions = await generateAIStrategistSuggestions(analysisData);

    return NextResponse.json({
      success: true,
      suggestions,
      analysisData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AI Strategist] Error:', error);
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
