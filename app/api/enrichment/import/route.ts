import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAndGetClinic } from '@/lib/license';
import { verifyCampaignOwnership, isPhoneBlocked, isPhoneInCampaign } from '@/lib/campaigns';
import { normalizePhone } from '@/lib/phone';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for direct import from enrichment tool
const leadSchema = z.object({
  nome: z.string().min(1, 'Nome is required'),
  empresa: z.string().min(1, 'Empresa is required'),
  cargo: z.string().optional(),
  site: z.string().url().optional().or(z.literal('')),
  dor_especifica: z.string().optional(),
  phone: z.string().min(10, 'Phone is required'),
  email: z.string().email().optional(),
});

const importSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  campaignId: z.string().uuid('Invalid campaign ID'),
  leads: z.array(leadSchema).min(1, 'At least one lead is required'),
});

/**
 * POST /api/enrichment/import
 * 
 * Direct import of leads from your enrichment tool
 * Your enrichment tool can call this endpoint to send leads directly
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = importSchema.parse(body);

    // Verify license and get clinic ID
    const licenseResult = await verifyAndGetClinic(validated.licenseKey);

    if (!licenseResult.valid || !licenseResult.clinicId) {
      return NextResponse.json(
        {
          error: licenseResult.error || 'Invalid license key',
        },
        { status: 401 }
      );
    }

    // Verify campaign ownership
    const isOwner = await verifyCampaignOwnership(
      validated.campaignId,
      licenseResult.clinicId
    );

    if (!isOwner) {
      return NextResponse.json(
        {
          error: 'Campaign not found or access denied',
        },
        { status: 404 }
      );
    }

    // Process leads
    const result = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const leadsToInsert: Array<{
      campaign_id: string;
      name: string;
      nome: string;
      empresa: string;
      cargo?: string | null;
      site?: string | null;
      dor_especifica?: string | null;
      phone: string;
      status: 'pending';
    }> = [];

    for (const lead of validated.leads) {
      try {
        // Normalize phone to E.164
        const normalizedPhone = normalizePhone(lead.phone);

        // Check if phone is blocked
        const isBlocked = await isPhoneBlocked(normalizedPhone);
        if (isBlocked) {
          result.skipped++;
          result.errors.push(`Blocked: ${lead.phone} (${lead.nome})`);
          continue;
        }

        // Check if phone already exists in campaign
        const isDuplicate = await isPhoneInCampaign(validated.campaignId, normalizedPhone);
        if (isDuplicate) {
          result.skipped++;
          result.errors.push(`Duplicate: ${lead.phone} (${lead.nome})`);
          continue;
        }

        // Add to batch insert
        leadsToInsert.push({
          campaign_id: validated.campaignId,
          name: lead.nome,
          nome: lead.nome,
          empresa: lead.empresa,
          cargo: lead.cargo || null,
          site: lead.site || null,
          dor_especifica: lead.dor_especifica || null,
          phone: normalizedPhone,
          status: 'pending',
        });
      } catch (error) {
        result.skipped++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Invalid lead: ${lead.phone} (${lead.nome}) - ${errorMsg}`);
      }
    }

    // Bulk insert valid leads
    if (leadsToInsert.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('campaign_contacts')
        .insert(leadsToInsert)
        .select('id');

      if (error) {
        console.error('[API] Error inserting leads:', error);
        return NextResponse.json(
          {
            error: 'Failed to import leads',
            details: error.message,
          },
          { status: 500 }
        );
      }

      result.imported = data.length;
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('[API] Error importing leads:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
