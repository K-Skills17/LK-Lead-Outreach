import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAndGetClinic } from '@/lib/license';
import { verifyCampaignOwnership, isPhoneBlocked, isPhoneInCampaign } from '@/lib/campaigns';
import { normalizePhone } from '@/lib/phone';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone is required'),
});

const importCsvSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  contacts: z.array(contactSchema).min(1, 'At least one contact is required'),
});

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * POST /api/campaigns/[id]/import-csv
 * 
 * Import contacts from CSV data into a campaign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();

    // Validate request body
    const validated = importCsvSchema.parse(body);

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
      campaignId,
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

    // Process contacts
    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    const contactsToInsert: Array<{
      campaign_id: string;
      name: string;
      phone: string;
      status: 'pending';
    }> = [];

    for (const contact of validated.contacts) {
      try {
        // Normalize phone to E.164
        const normalizedPhone = normalizePhone(contact.phone);

        // Check if phone is blocked
        const isBlocked = await isPhoneBlocked(normalizedPhone);
        if (isBlocked) {
          result.skipped++;
          result.errors.push(`Blocked: ${contact.phone} (${contact.name})`);
          continue;
        }

        // Check if phone already exists in campaign
        const isDuplicate = await isPhoneInCampaign(campaignId, normalizedPhone);
        if (isDuplicate) {
          result.skipped++;
          result.errors.push(`Duplicate: ${contact.phone} (${contact.name})`);
          continue;
        }

        // Add to batch insert
        contactsToInsert.push({
          campaign_id: campaignId,
          name: contact.name,
          phone: normalizedPhone,
          status: 'pending',
        });
      } catch (error) {
        result.skipped++;
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(
          `Invalid phone: ${contact.phone} (${contact.name}) - ${errorMsg}`
        );
      }
    }

    // Bulk insert valid contacts
    if (contactsToInsert.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('campaign_contacts')
        .insert(contactsToInsert)
        .select('id');

      if (error) {
        console.error('[API] Error inserting contacts:', error);
        return NextResponse.json(
          {
            error: 'Failed to import contacts',
            details: error.message,
          },
          { status: 500 }
        );
      }

      result.imported = data.length;
    }

    return NextResponse.json(result);
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('[API] Error importing contacts:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
