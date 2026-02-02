/**
 * Alias route for /api/webhooks/resend (singular path)
 * This allows the webhook to work with both /api/webhook/resend and /api/webhooks/resend
 */

import { POST as webhookPOST } from '../webhooks/resend/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = webhookPOST;
