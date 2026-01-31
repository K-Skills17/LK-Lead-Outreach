import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Verify Bearer token from Authorization header
 */
function verifyBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  const expectedToken = process.env.SENDER_SERVICE_TOKEN;

  if (!expectedToken) {
    console.error('[API] SENDER_SERVICE_TOKEN not configured');
    return false;
  }

  return token === expectedToken;
}

/**
 * GET /api/sender/queue
 * 
 * Get pending contacts from a campaign for the Python sender to process
 * Protected by Bearer token authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyBearerToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get('campaignId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId required' },
        { status: 400 }
      );
    }

    // Fetch pending contacts with all CSV fields
    const { data: contacts, error } = await supabaseAdmin
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
        status
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

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
