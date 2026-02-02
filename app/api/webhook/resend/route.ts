/**
 * Alias route for /api/webhooks/resend (singular path)
 * This allows the webhook to work with both /api/webhook/resend and /api/webhooks/resend
 */

// Re-export the handler from the plural path
export { POST } from '@/app/api/webhooks/resend/route';
