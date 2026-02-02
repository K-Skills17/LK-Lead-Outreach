import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/integration/test
 * 
 * Test endpoint for Lead Gen Tool to verify:
 * 1. Authentication works
 * 2. Endpoint is reachable
 * 3. Integration is configured correctly
 * 
 * Authentication: Bearer token (optional for testing, but recommended)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if authentication token is configured
    const expectedToken = process.env.LEAD_GEN_INTEGRATION_TOKEN;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Verify authentication if token is provided
    if (token) {
      if (!expectedToken) {
        return NextResponse.json({
          success: false,
          status: 'not_configured',
          message: 'LEAD_GEN_INTEGRATION_TOKEN not configured in Outreach Tool',
          hint: 'Set LEAD_GEN_INTEGRATION_TOKEN environment variable',
          authenticated: false,
        }, { status: 503 });
      }

      if (token !== expectedToken) {
        return NextResponse.json({
          success: false,
          status: 'unauthorized',
          message: 'Invalid authentication token',
          hint: 'Verify LEAD_GEN_INTEGRATION_TOKEN matches MESSAGING_TOOL_API_KEY in Lead Gen Tool',
          authenticated: false,
        }, { status: 401 });
      }
    }

    // Check database connectivity
    const { error: dbError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id')
      .limit(1);

    if (dbError) {
      return NextResponse.json({
        success: false,
        status: 'database_error',
        message: 'Database connection failed',
        error: dbError.message,
        authenticated: !!token && token === expectedToken,
      }, { status: 500 });
    }

    // Get endpoint information
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   request.headers.get('host') || 
                   'unknown';
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      message: 'Integration endpoint is ready',
      authenticated: !!token && token === expectedToken,
      endpoints: {
        receive_leads: `${baseUrl}/api/integration/leads/receive`,
        webhook: `${baseUrl}/api/integration/webhook`,
        status: `${baseUrl}/api/integration/status`,
        debug: `${baseUrl}/api/integration/leads/debug`,
        test: `${baseUrl}/api/integration/test`,
      },
      configuration: {
        token_configured: !!expectedToken,
        token_length: expectedToken?.length || 0,
        database_connected: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Integration Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integration/test
 * 
 * Test endpoint that accepts a sample payload and validates it
 * without actually saving to database
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const expectedToken = process.env.LEAD_GEN_INTEGRATION_TOKEN;

    if (!expectedToken) {
      return NextResponse.json({
        success: false,
        error: 'Integration not configured',
        code: 'NOT_CONFIGURED',
      }, { status: 503 });
    }

    if (!token || token !== expectedToken) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Basic validation (same as receive endpoint)
    if (!body.empresa || typeof body.empresa !== 'string' || body.empresa.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation error: empresa is required',
        code: 'VALIDATION_ERROR',
        field: 'empresa',
      }, { status: 400 });
    }

    if (!body.phone || typeof body.phone !== 'string' || !body.phone.startsWith('+')) {
      return NextResponse.json({
        success: false,
        error: 'Validation error: phone is required and must be in E.164 format (start with +)',
        code: 'VALIDATION_ERROR',
        field: 'phone',
      }, { status: 400 });
    }

    // Validation passed
    return NextResponse.json({
      success: true,
      message: 'Payload validation passed',
      validated_fields: {
        empresa: body.empresa,
        phone: body.phone,
        has_nome: !!body.nome,
        has_email: !!body.email,
        has_enrichment_data: !!body.enrichment_data,
        has_lead_id: !!body.enrichment_data?.lead?.id,
      },
      note: 'This is a test - no data was saved to database',
    });
  } catch (error) {
    console.error('[Integration Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
