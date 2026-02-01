-- ============================================
-- SDR WhatsApp Connection Support
-- ============================================
-- Adds WhatsApp connection tracking for SDRs
-- Allows each SDR to connect their own WhatsApp account

-- Add WhatsApp connection fields to sdr_users
ALTER TABLE sdr_users 
ADD COLUMN IF NOT EXISTS whatsapp_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_session_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_connected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_last_seen TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_qr_code TEXT; -- For storing QR code data temporarily

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sdr_users_whatsapp_connected ON sdr_users(whatsapp_connected) WHERE whatsapp_connected = true;
CREATE INDEX IF NOT EXISTS idx_sdr_users_whatsapp_session ON sdr_users(whatsapp_session_id) WHERE whatsapp_session_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN sdr_users.whatsapp_connected IS 'Whether the SDR has connected their WhatsApp account';
COMMENT ON COLUMN sdr_users.whatsapp_session_id IS 'Unique session identifier for WhatsApp Web connection';
COMMENT ON COLUMN sdr_users.whatsapp_phone IS 'Phone number associated with the connected WhatsApp account';
COMMENT ON COLUMN sdr_users.whatsapp_connected_at IS 'Timestamp when WhatsApp was connected';
COMMENT ON COLUMN sdr_users.whatsapp_last_seen IS 'Last time the WhatsApp connection was active';
COMMENT ON COLUMN sdr_users.whatsapp_qr_code IS 'Temporary storage for QR code data during connection process';
