# WhatsApp Worker – Automatic sending with human-like behavior

The app sends WhatsApp messages **automatically** by enqueueing them and processing them with a separate **WhatsApp worker** that uses WhatsApp Web and applies human-like delays and breaks.

## How it works

1. **Leads tab / Send message / Process Queue**  
   When you click "Send message", "Send Photo", or "Process Queue Now", the app **enqueues** the message(s) in the `whatsapp_send_queue` table. Nothing is sent yet.

2. **WhatsApp worker**  
   You run the worker on your machine (or a server that can run Node and Puppeteer):
   ```bash
   npm run whatsapp-worker
   ```
   - On first run you scan a **QR code** with WhatsApp (Linked devices). The session is saved in `.wwebjs_auth/`.
   - The worker then polls the queue, and for each pending message:
     - Waits a **random delay** (60–210 seconds in human mode)
     - Takes a **coffee break** (15 min) every 15 messages and a **long break** (45 min) every 50 messages
     - Respects **working hours** (default 10:00–18:00) and **no weekends**
     - Sends the message via WhatsApp Web and marks the queue row and contact as sent

3. **Result**  
   Messages are delivered to the lead’s WhatsApp without you sending them manually, while still looking human (delays, breaks, working hours).

## Requirements

- **Node.js** 18+
- **.env.local** with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (same as the main app)
- **WhatsApp** on your phone to scan the QR once; after that the worker keeps the session

## Run the worker

From the project root:

```bash
npm run whatsapp-worker
```

Or:

```bash
npx tsx scripts/whatsapp-worker.ts
```

Make sure `.env.local` exists so the worker can connect to Supabase.

## Human-like behavior (defaults)

- **Delay between messages:** 60–210 seconds (random)
- **Coffee break:** every 15 messages, 15 minutes
- **Long break:** every 50 messages, 45 minutes
- **Working hours:** 10:00–18:00 (configurable in the app’s sending settings)
- **Weekends:** no sending (Monday–Friday only)

These are the same rules as in the main app’s human-behavior service; the worker applies them when actually sending.

## Where messages are enqueued

- **Leads tab:** "Send message" / "Send Photo" on a lead
- **Sending control:** "Process Queue Now" (enqueues all ready pending contacts)

Once enqueued, only the worker sends them (with delays and breaks). Keep the worker running when you want automatic delivery.
