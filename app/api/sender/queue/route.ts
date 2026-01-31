import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSDRById } from '@/lib/sdr-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Verify Bearer token from Authorization header
 * Supports both:
 * 1. SENDER_SERVICE_TOKEN (for backward compatibility)
 * 2. SDR ID (for SDR-specific authentication)
 */
async function verifyBearerToken(request: NextRequest): Promise<{ valid: boolean; sdrId?: string }> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.substring(7);
  const expectedToken = process.env.SENDER_SERVICE_TOKEN;

  // Check if it's the service token (backward compatibility)
  if (expectedToken && token === expectedToken) {
    return { valid: true };
  }

  // Check if it's an SDR ID (for SDR authentication)
  try {
    const sdr = await getSDRById(token);
    if (sdr && sdr.is_active) {
      return { valid: true, sdrId: sdr.id };
    }
  } catch (error) {
    // Not an SDR ID, continue to return invalid
  }

  return { valid: false };
}

/**
 * GET /api/sender/queue
 * 
 * Get pending contacts for the desktop sender app
 * 
 * Authentication:
 * - SDR authentication: Bearer token = SDR ID (from /api/sender/auth)
 * - Service token: Bearer token = SENDER_SERVICE_TOKEN (backward compatibility)
 * 
 * Query parameters:
 * - campaignId (optional): Filter by campaign
 * - limit (optional): Max number of contacts (default: 50)
 * 
 * Behavior:
 * - If SDR authenticated: Returns only leads assigned to that SDR
 * - If service token: Returns all pending leads (or filtered by campaignId)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyBearerToken(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('campaignId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Build query
    let query = supabaseAdmin
      .from('campaign_contacts')
      .select(`
        id,
        nome,
        empresa,
        cargo,
        site,
        dor_especifica,
        phone,
        personalized_message,
        status,
        campaign_id
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    // If SDR authenticated, only get their assigned leads
    if (authResult.sdrId) {
      query = query.eq('assigned_sdr_id', authResult.sdrId);
    }

    // If campaignId provided, filter by campaign
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    // Execute query
    const { data: contacts, error } = await query;

    if (error) {
      console.error('[API] Database error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Format response with all CSV fields
    const formattedContacts = (contacts || []).map((cc: any) => ({
      contactId: cc.id,
      phone: cc.phone,
      nome: cc.nome || cc.name || '',
      empresa: cc.empresa || '',
      cargo: cc.cargo || null,
      site: cc.site || null,
      dor_especifica: cc.dor_especifica || null,
      message: cc.personalized_message,
    }));

    return NextResponse.json({
      contacts: formattedContacts,
      count: formattedContacts.length,
      total: formattedContacts.length,
    });

  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
