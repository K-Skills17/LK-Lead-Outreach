import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/leads/delete
 * 
 * Delete one or more leads from campaign_contacts table
 * 
 * Query params:
 * - id: single lead ID to delete
 * - ids: comma-separated list of lead IDs to delete (for bulk delete)
 * 
 * Authentication: Bearer token (ADMIN_DASHBOARD_TOKEN)
 */
export async function DELETE(request: NextRequest) {
  // Authentication
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_DASHBOARD_TOKEN;

  if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids'); // For bulk delete

    // Get lead IDs to delete
    let leadIds: string[] = [];
    
    if (ids) {
      // Bulk delete - comma-separated IDs
      leadIds = ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
    } else if (id) {
      // Single delete
      leadIds = [id];
    } else {
      return NextResponse.json({ error: 'Missing lead ID(s). Provide either "id" or "ids" parameter.' }, { status: 400 });
    }

    if (leadIds.length === 0) {
      return NextResponse.json({ error: 'No valid lead IDs provided' }, { status: 400 });
    }

    console.log(`[Delete Lead] Deleting ${leadIds.length} lead(s): ${leadIds.join(', ')}`);

    // Delete the leads from campaign_contacts
    // Note: Related data in email_sends, whatsapp_sends, etc. will be handled by CASCADE or kept for history
    const { error, count } = await supabaseAdmin
      .from('campaign_contacts')
      .delete()
      .in('id', leadIds);

    if (error) {
      console.error('[Delete Lead] Error deleting leads:', error);
      return NextResponse.json({ 
        error: 'Failed to delete lead(s)',
        details: error.message 
      }, { status: 500 });
    }

    console.log(`[Delete Lead] Successfully deleted ${leadIds.length} lead(s)`);

    return NextResponse.json({ 
      success: true,
      deleted: leadIds.length,
      lead_ids: leadIds
    });
  } catch (error) {
    console.error('[Delete Lead] Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
