/**
 * WhatsApp Worker – automatic sending with human-like behavior
 *
 * Run: npm run whatsapp-worker   (or: npx tsx scripts/whatsapp-worker.ts)
 * Ensure .env.local is loaded first (run from project root).
 *
 * - Connects to WhatsApp Web (scan QR once; session saved in .wwebjs_auth/)
 * - Polls whatsapp_send_queue for pending messages
 * - Applies delays (60–210s) and coffee/long breaks between sends
 * - Sends messages via WhatsApp Web and marks queue + campaign_contacts + whatsapp_sends
 */

import './load-env';

import fs from 'fs';
import path from 'path';
import {
  getNextPendingQueueItems,
  markQueueSending,
  markQueueSent,
  markQueueFailed,
  phoneToChatId,
  type QueueItem,
} from '../lib/whatsapp-queue-service';
import {
  calculateDelay,
  shouldTakeBreak,
  isWithinWorkingHours,
  getTimeUntilWorkingHours,
  DEFAULT_HUMAN_BEHAVIOR_SETTINGS,
} from '../lib/human-behavior-service';
import { shouldSkipDay } from '../lib/send-time-service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client, LocalAuth } = require('whatsapp-web.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qrcode = require('qrcode-terminal');

const POLL_INTERVAL_MS = 30000;
const SETTINGS = DEFAULT_HUMAN_BEHAVIOR_SETTINGS;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

/** Prefer system Chrome so we don't need Puppeteer's download (avoids broken chrome-headless-shell). */
function getChromePath(): string | undefined {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  if (process.platform !== 'win32') return undefined;
  const candidates = [
    path.join(process.env['ProgramFiles'] ?? 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

const puppeteerOptions: { executablePath?: string } = {};
const chromePath = getChromePath();
if (chromePath) {
  puppeteerOptions.executablePath = chromePath;
  log('Using system Chrome: ' + chromePath);
}

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'lk-outreach' }),
  puppeteer: puppeteerOptions,
});

client.on('qr', (qr: string) => {
  log('Scan this QR in WhatsApp (Linked devices):');
  qrcode.generate(qr, { small: true });
});

let messagesSentThisSession = 0;

async function runLoop(): Promise<void> {
  while (true) {
    try {
      const now = new Date();
      const day = now.getDay();

      if (shouldSkipDay(day)) {
        log('Weekend – skipping send. Resumes Monday–Friday.');
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      if (!isWithinWorkingHours(SETTINGS, now)) {
        const mins = Math.round((getTimeUntilWorkingHours(SETTINGS, now) ?? 0) / 60);
        log(`Outside working hours. Resumes in ${mins} min.`);
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      const items = await getNextPendingQueueItems(1);
      if (items.length === 0) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      const item: QueueItem = items[0];

      const delaySec = calculateDelay(messagesSentThisSession, SETTINGS);
      log(`Waiting ${delaySec}s (human delay) before sending to ${item.lead_phone}...`);
      await sleep(delaySec * 1000);

      const breakCheck = shouldTakeBreak(messagesSentThisSession, SETTINGS);
      if (breakCheck.shouldBreak && breakCheck.duration > 0) {
        log(`Break: ${breakCheck.breakType} for ${breakCheck.duration}s`);
        await sleep(breakCheck.duration * 1000);
      }

      await markQueueSending(item.id);
      const chatId = phoneToChatId(item.lead_phone);

      try {
        await client.sendMessage(chatId, item.message_text);
      } catch (sendErr: unknown) {
        const errMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        log(`Send failed for ${item.lead_phone}: ${errMsg}`);
        await markQueueFailed(item.id, errMsg);
        await sleep(5000);
        continue;
      }

      const result = await markQueueSent(item.id, item);
      if (result) {
        messagesSentThisSession++;
        log(
          `Sent to ${item.lead_phone} (${item.lead_company ?? item.lead_name ?? 'lead'}). Session total: ${messagesSentThisSession}.`
        );
      }
    } catch (err) {
      log('Loop error: ' + (err instanceof Error ? err.message : err));
      await sleep(10000);
    }
  }
}

client.on('ready', () => {
  log('WhatsApp client ready. Processing queue with human-like delays and breaks.');
  runLoop();
});

client.on('auth_failure', (msg: string) => {
  log('Auth failure: ' + msg);
});

client.on('disconnected', (reason: string) => {
  log('Disconnected: ' + reason);
});

log('Starting WhatsApp worker...');
client.initialize();
