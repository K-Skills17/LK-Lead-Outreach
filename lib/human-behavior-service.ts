/**
 * Human Behavior Simulation Service
 * 
 * Simulates human-like behavior for outreach to avoid spam detection:
 * - Variable delays between messages (60-210 seconds in human mode)
 * - Coffee breaks every 15 messages (15 minutes)
 * - Long breaks every 50 messages (45 minutes)
 * - Working hours restriction (10 AM - 6 PM)
 * - Random variations in actions
 */

export interface HumanBehaviorSettings {
  // Delay settings
  humanMode: boolean; // If true, uses 60-210s random delays; if false, uses configurable delay
  delayBetweenMessages: number; // Base delay in seconds (used in standard mode)
  delayVariation: number; // ±20% variation (default: 0.2)
  
  // Break settings
  coffeeBreakInterval: number; // Every N messages (default: 15)
  coffeeBreakDuration: number; // Duration in seconds (default: 900 = 15 minutes)
  longBreakInterval: number; // Every N messages (default: 50)
  longBreakDuration: number; // Duration in seconds (default: 2700 = 45 minutes)
  
  // Working hours
  workingHoursEnabled: boolean;
  startTime: string; // Format: "HH:MM" (default: "10:00")
  endTime: string; // Format: "HH:MM" (default: "18:00")
  timezone?: string; // Default: America/Sao_Paulo
  
  // Contact frequency
  daysSinceLastContact: number; // Minimum days between contacts (default: 3)
  
  // Daily limits
  dailyLimit: number; // Maximum messages per day (default: 250)
  dailyLimitWarning: number; // Warning threshold (default: 200)
}

export const DEFAULT_HUMAN_BEHAVIOR_SETTINGS: HumanBehaviorSettings = {
  humanMode: true,
  delayBetweenMessages: 60,
  delayVariation: 0.2,
  coffeeBreakInterval: 15,
  coffeeBreakDuration: 900, // 15 minutes
  longBreakInterval: 50,
  longBreakDuration: 2700, // 45 minutes
  workingHoursEnabled: true,
  startTime: '10:00',
  endTime: '18:00',
  timezone: 'America/Sao_Paulo',
  daysSinceLastContact: 3,
  dailyLimit: 250,
  dailyLimitWarning: 200,
};

/**
 * Calculate delay before next message (human-like behavior)
 */
export function calculateDelay(
  messagesSent: number,
  settings: HumanBehaviorSettings = DEFAULT_HUMAN_BEHAVIOR_SETTINGS
): number {
  let delay: number;
  
  if (settings.humanMode) {
    // Human mode: random delay between 60-210 seconds (1 to 3.5 minutes)
    delay = Math.random() * (210 - 60) + 60;
  } else {
    // Standard mode: base delay with ±20% variation
    delay = settings.delayBetweenMessages;
    const variation = delay * settings.delayVariation;
    delay = delay + (Math.random() * 2 - 1) * variation; // ±variation
  }
  
  // Ensure minimum 5 seconds (Meta's recommendation)
  return Math.max(5, Math.round(delay));
}

/**
 * Check if a break is needed based on messages sent
 */
export function shouldTakeBreak(
  messagesSent: number,
  settings: HumanBehaviorSettings = DEFAULT_HUMAN_BEHAVIOR_SETTINGS
): { shouldBreak: boolean; breakType: 'coffee' | 'long' | null; duration: number } {
  // Long break every 50 messages
  if (messagesSent > 0 && messagesSent % settings.longBreakInterval === 0) {
    return {
      shouldBreak: true,
      breakType: 'long',
      duration: settings.longBreakDuration,
    };
  }
  
  // Coffee break every 15 messages
  if (messagesSent > 0 && messagesSent % settings.coffeeBreakInterval === 0) {
    return {
      shouldBreak: true,
      breakType: 'coffee',
      duration: settings.coffeeBreakDuration,
    };
  }
  
  return {
    shouldBreak: false,
    breakType: null,
    duration: 0,
  };
}

/**
 * Check if current time is within working hours
 */
export function isWithinWorkingHours(
  settings: HumanBehaviorSettings = DEFAULT_HUMAN_BEHAVIOR_SETTINGS,
  date: Date = new Date()
): boolean {
  if (!settings.workingHoursEnabled) {
    return true; // Always allow if working hours disabled
  }
  
  // Parse start and end times
  const [startHour, startMinute] = settings.startTime.split(':').map(Number);
  const [endHour, endMinute] = settings.endTime.split(':').map(Number);
  
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Get time until working hours start (if outside working hours)
 */
export function getTimeUntilWorkingHours(
  settings: HumanBehaviorSettings = DEFAULT_HUMAN_BEHAVIOR_SETTINGS,
  date: Date = new Date()
): number | null {
  if (isWithinWorkingHours(settings, date)) {
    return null; // Already within working hours
  }
  
  const [startHour, startMinute] = settings.startTime.split(':').map(Number);
  const startTime = new Date(date);
  startTime.setHours(startHour, startMinute, 0, 0);
  
  // If start time has passed today, it's for tomorrow
  if (startTime <= date) {
    startTime.setDate(startTime.getDate() + 1);
  }
  
  const diffMs = startTime.getTime() - date.getTime();
  return Math.ceil(diffMs / 1000); // Return seconds
}

/**
 * Check if contact can be reached (respects days since last contact)
 */
export async function canContactLead(
  phone: string | null,
  email: string | null,
  daysThreshold: number = 3
): Promise<{ canContact: boolean; lastContactedAt: Date | null; daysSinceContact: number | null }> {
  if (!phone && !email) {
    return { canContact: false, lastContactedAt: null, daysSinceContact: null };
  }
  
  const { supabaseAdmin } = await import('./supabaseAdmin');
  
  // Build query to find most recent contact
  let query = supabaseAdmin
    .from('contact_history')
    .select('contacted_at')
    .order('contacted_at', { ascending: false })
    .limit(1);
  
  // Filter by phone or email
  if (phone && email) {
    query = query.or(`phone.eq.${phone},email.eq.${email}`);
  } else if (phone) {
    query = query.eq('phone', phone);
  } else if (email) {
    query = query.eq('email', email);
  }
  
  const { data: recentContacts, error } = await query;
  
  if (error) {
    console.error('[Human Behavior] Error checking contact history:', error);
    // On error, allow contact (fail open)
    return { canContact: true, lastContactedAt: null, daysSinceContact: null };
  }
  
  if (!recentContacts || recentContacts.length === 0) {
    // No previous contact - can contact
    return { canContact: true, lastContactedAt: null, daysSinceContact: null };
  }
  
  const lastContactedAt = new Date(recentContacts[0].contacted_at);
  const now = new Date();
  const daysSinceContact = (now.getTime() - lastContactedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  const canContact = daysSinceContact >= daysThreshold;
  
  return {
    canContact,
    lastContactedAt,
    daysSinceContact: Math.round(daysSinceContact * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Record a contact in history
 */
export async function recordContact(params: {
  contactId?: string;
  phone?: string;
  email?: string;
  channel: 'email' | 'whatsapp' | 'both';
  campaignId?: string;
  sdrId?: string;
  delaySeconds?: number;
  breakType?: 'coffee' | 'long' | null;
  status?: 'sent' | 'failed' | 'skipped';
  errorMessage?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabaseAdmin } = await import('./supabaseAdmin');
    
    // Get current contact count
    let timesContacted = 1;
    if (params.phone || params.email) {
      const { data: existingContacts } = await supabaseAdmin
        .from('contact_history')
        .select('times_contacted')
        .or(`phone.eq.${params.phone || ''},email.eq.${params.email || ''}`)
        .order('contacted_at', { ascending: false })
        .limit(1)
        .single();
      
      if (existingContacts?.times_contacted) {
        timesContacted = existingContacts.times_contacted + 1;
      }
    }
    
    const { error } = await supabaseAdmin.from('contact_history').insert({
      contact_id: params.contactId || null,
      phone: params.phone || null,
      email: params.email || null,
      channel: params.channel,
      campaign_id: params.campaignId || null,
      assigned_sdr_id: params.sdrId || null,
      delay_seconds: params.delaySeconds || null,
      was_break: params.breakType !== null,
      break_type: params.breakType || null,
      status: params.status || 'sent',
      error_message: params.errorMessage || null,
      times_contacted: timesContacted,
    });
    
    if (error) {
      console.error('[Human Behavior] Error recording contact:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('[Human Behavior] Error recording contact:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get daily message count for an SDR or campaign
 */
export async function getDailyMessageCount(
  sdrId?: string,
  campaignId?: string,
  date: Date = new Date()
): Promise<number> {
  const { supabaseAdmin } = await import('./supabaseAdmin');
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  let query = supabaseAdmin
    .from('contact_history')
    .select('id', { count: 'exact', head: true })
    .gte('contacted_at', startOfDay.toISOString())
    .lte('contacted_at', endOfDay.toISOString())
    .eq('status', 'sent');
  
  if (sdrId) {
    query = query.eq('assigned_sdr_id', sdrId);
  }
  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }
  
  const { count, error } = await query;
  
  if (error) {
    console.error('[Human Behavior] Error getting daily count:', error);
    return 0;
  }
  
  return count || 0;
}
