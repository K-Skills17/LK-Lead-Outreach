/**
 * Optimal Send Time Analysis Service
 * 
 * Calculates optimal send times based on:
 * - Day of week preferences
 * - Time of day by business type
 * - Historical open rate data
 * - Lead priority
 * - Anti-spam randomization
 * - Batch distribution
 */

import { supabaseAdmin } from './supabaseAdmin';

export type LeadPriority = 'VIP' | 'HIGH' | 'MEDIUM' | 'LOW';
export type BusinessType = 'healthcare' | 'general' | 'retail' | 'finance' | 'tech' | 'services';

export interface SendTimeInput {
  contactId: string;
  businessType?: BusinessType;
  niche?: string;
  leadPriority?: LeadPriority;
  timezone?: string; // Default: America/Sao_Paulo
  batchId?: string;
  batchSize?: number;
}

export interface SendTimeResult {
  optimalSendAt: Date;
  dayOfWeek: number;
  hourOfDay: number;
  minuteRandomization: number;
  reason: string;
  confidenceScore: number;
  historicalOpenRate: number | null;
  historicalSampleSize: number;
}

// Business type specific optimal times (hour in 24h format)
const BUSINESS_OPTIMAL_TIMES: Record<BusinessType, number[]> = {
  healthcare: [8, 13, 18], // 8:15 AM, 1:30 PM, 6:00 PM
  general: [9, 13, 17], // 9:30 AM, 1:30 PM, 5:00 PM
  retail: [10, 14, 19], // 10:00 AM, 2:00 PM, 7:00 PM
  finance: [9, 14, 16], // 9:00 AM, 2:00 PM, 4:00 PM
  tech: [10, 15, 17], // 10:00 AM, 3:00 PM, 5:00 PM
  services: [9, 13, 16], // 9:00 AM, 1:00 PM, 4:00 PM
};

/**
 * Get day of week score (0 = worst, 100 = best)
 */
function getDayOfWeekScore(day: number): number {
  // 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
  const scores: Record<number, number> = {
    0: 20, // Sunday - avoid
    1: 40, // Monday - avoid (too busy)
    2: 100, // Tuesday - best
    3: 95, // Wednesday - best
    4: 90, // Thursday - best
    5: 50, // Friday - ok
    6: 10, // Saturday - avoid
  };
  
  return scores[day] || 50;
}

/**
 * Calculate optimal day of week
 */
function calculateOptimalDay(currentDate: Date, leadPriority: LeadPriority): { date: Date; score: number } {
  const results: Array<{ date: Date; score: number }> = [];
  
  // Check next 7 days
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() + i);
    
    const dayOfWeek = checkDate.getDay();
    let score = getDayOfWeekScore(dayOfWeek);
    
    // VIP leads get earlier slots (prefer sooner dates)
    if (leadPriority === 'VIP') {
      score += Math.max(0, 20 - i * 3);
    } else if (leadPriority === 'HIGH') {
      score += Math.max(0, 10 - i * 2);
    }
    
    results.push({ date: checkDate, score });
  }
  
  // Sort by score and return best day
  results.sort((a, b) => b.score - a.score);
  return results[0];
}

/**
 * Get historical open rate for specific time slot
 */
async function getHistoricalOpenRate(
  dayOfWeek: number,
  hourOfDay: number,
  niche?: string,
  businessType?: BusinessType
): Promise<{ openRate: number | null; sampleSize: number }> {
  try {
    let query = supabaseAdmin
      .from('send_time_analytics')
      .select('open_rate, total_sent')
      .eq('day_of_week', dayOfWeek)
      .eq('hour_of_day', hourOfDay);
    
    if (niche) {
      query = query.eq('niche', niche);
    }
    
    if (businessType) {
      query = query.eq('business_type', businessType);
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) {
      return { openRate: null, sampleSize: 0 };
    }
    
    return {
      openRate: parseFloat(data.open_rate?.toString() || '0'),
      sampleSize: data.total_sent || 0,
    };
  } catch (error) {
    console.error('[SendTime] Error fetching historical data:', error);
    return { openRate: null, sampleSize: 0 };
  }
}

/**
 * Select best hour based on business type and historical data
 */
async function selectOptimalHour(
  businessType: BusinessType,
  dayOfWeek: number,
  niche?: string
): Promise<{ hour: number; openRate: number | null; sampleSize: number; reason: string }> {
  const possibleHours = BUSINESS_OPTIMAL_TIMES[businessType] || BUSINESS_OPTIMAL_TIMES.general;
  
  // Check historical data for each possible hour
  const hourResults = await Promise.all(
    possibleHours.map(async (hour) => {
      const { openRate, sampleSize } = await getHistoricalOpenRate(dayOfWeek, hour, niche, businessType);
      
      return {
        hour,
        openRate,
        sampleSize,
        score: openRate && sampleSize > 10 ? openRate : 50, // Default 50 if no data
      };
    })
  );
  
  // Sort by score (historical open rate or default)
  hourResults.sort((a, b) => b.score - a.score);
  
  const best = hourResults[0];
  
  let reason = `Optimal for ${businessType} business`;
  if (best.sampleSize > 10) {
    reason += ` (${best.openRate?.toFixed(1)}% open rate from ${best.sampleSize} sends)`;
  }
  
  return {
    hour: best.hour,
    openRate: best.openRate,
    sampleSize: best.sampleSize,
    reason,
  };
}

/**
 * Add randomization to avoid spam detection
 */
function addRandomization(): number {
  // Random ±10 minutes
  return Math.floor(Math.random() * 21) - 10;
}

/**
 * Calculate optimal send time
 */
export async function calculateOptimalSendTime(input: SendTimeInput): Promise<SendTimeResult> {
  const now = new Date();
  const businessType = input.businessType || 'general';
  const leadPriority = input.leadPriority || 'MEDIUM';
  
  // 1. Find optimal day
  const { date: optimalDay, score: dayScore } = calculateOptimalDay(now, leadPriority);
  const dayOfWeek = optimalDay.getDay();
  
  // 2. Find optimal hour
  const { hour, openRate, sampleSize, reason: hourReason } = await selectOptimalHour(
    businessType,
    dayOfWeek,
    input.niche
  );
  
  // 3. Add minutes (15 or 30) + randomization
  const baseMinutes = hour >= 12 ? 30 : 15; // Morning: :15, Afternoon: :30
  const randomization = addRandomization();
  const finalMinutes = Math.max(0, Math.min(59, baseMinutes + randomization));
  
  // 4. Construct final datetime
  const optimalSendAt = new Date(optimalDay);
  optimalSendAt.setHours(hour, finalMinutes, 0, 0);
  
  // 5. If batch, add staggering (2-5 minutes apart)
  if (input.batchId && input.batchSize) {
    const stagger = Math.floor(Math.random() * 4) + 2; // 2-5 minutes
    optimalSendAt.setMinutes(optimalSendAt.getMinutes() + stagger);
  }
  
  // 6. Calculate confidence score
  let confidenceScore = dayScore;
  if (sampleSize > 50) {
    confidenceScore = Math.min(100, confidenceScore + 15);
  } else if (sampleSize > 20) {
    confidenceScore = Math.min(100, confidenceScore + 10);
  }
  
  // 7. Build reason
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const reasonParts = [
    `${dayNames[dayOfWeek]}`,
    `${hour}:${finalMinutes.toString().padStart(2, '0')}`,
    hourReason,
  ];
  
  if (leadPriority === 'VIP') {
    reasonParts.push('VIP priority - earlier slot');
  }
  
  return {
    optimalSendAt,
    dayOfWeek,
    hourOfDay: hour,
    minuteRandomization: randomization,
    reason: reasonParts.join(' | '),
    confidenceScore,
    historicalOpenRate: openRate,
    historicalSampleSize: sampleSize,
  };
}

/**
 * Save optimal send time to database
 */
export async function saveOptimalSendTime(
  input: SendTimeInput,
  result: SendTimeResult
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('optimal_send_times')
      .upsert({
        contact_id: input.contactId,
        optimal_send_at: result.optimalSendAt.toISOString(),
        day_of_week: result.dayOfWeek,
        hour_of_day: result.hourOfDay,
        minute_randomization: result.minuteRandomization,
        reason: result.reason,
        confidence_score: result.confidenceScore,
        business_type: input.businessType,
        lead_priority: input.leadPriority,
        historical_open_rate: result.historicalOpenRate,
        historical_sample_size: result.historicalSampleSize,
        niche: input.niche,
        batch_id: input.batchId,
      });
    
    if (error) {
      console.error('[SendTime] Error saving:', error);
      return { success: false, error: error.message };
    }
    
    // Also update campaign_contacts.scheduled_send_at
    await supabaseAdmin
      .from('campaign_contacts')
      .update({ scheduled_send_at: result.optimalSendAt.toISOString() })
      .eq('id', input.contactId);
    
    return { success: true };
  } catch (error) {
    console.error('[SendTime] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track send event for analytics
 */
export async function trackSendEvent(
  contactId: string,
  eventType: 'sent' | 'opened' | 'clicked' | 'responded',
  occurredAt: Date = new Date()
): Promise<void> {
  try {
    // Get send time info
    const { data: sendTime } = await supabaseAdmin
      .from('optimal_send_times')
      .select('*')
      .eq('contact_id', contactId)
      .single();
    
    if (!sendTime) return;
    
    // Update or create analytics record
    const { data: existing } = await supabaseAdmin
      .from('send_time_analytics')
      .select('*')
      .eq('day_of_week', sendTime.day_of_week)
      .eq('hour_of_day', sendTime.hour_of_day)
      .eq('niche', sendTime.niche)
      .eq('business_type', sendTime.business_type)
      .single();
    
    if (existing) {
      // Update existing record
      const updates: any = {
        last_updated: occurredAt.toISOString(),
      };
      
      if (eventType === 'sent') {
        updates.total_sent = (existing.total_sent || 0) + 1;
      } else if (eventType === 'opened') {
        updates.total_opened = (existing.total_opened || 0) + 1;
      } else if (eventType === 'clicked') {
        updates.total_clicked = (existing.total_clicked || 0) + 1;
      } else if (eventType === 'responded') {
        updates.total_responded = (existing.total_responded || 0) + 1;
      }
      
      // Recalculate rates
      const totalSent = updates.total_sent || existing.total_sent || 1;
      updates.open_rate = ((updates.total_opened || existing.total_opened || 0) / totalSent * 100).toFixed(2);
      updates.click_rate = ((updates.total_clicked || existing.total_clicked || 0) / totalSent * 100).toFixed(2);
      updates.response_rate = ((updates.total_responded || existing.total_responded || 0) / totalSent * 100).toFixed(2);
      
      await supabaseAdmin
        .from('send_time_analytics')
        .update(updates)
        .eq('id', existing.id);
    } else {
      // Create new record
      await supabaseAdmin
        .from('send_time_analytics')
        .insert({
          day_of_week: sendTime.day_of_week,
          hour_of_day: sendTime.hour_of_day,
          niche: sendTime.niche,
          business_type: sendTime.business_type,
          lead_tier: sendTime.lead_priority,
          total_sent: eventType === 'sent' ? 1 : 0,
          total_opened: eventType === 'opened' ? 1 : 0,
          total_clicked: eventType === 'clicked' ? 1 : 0,
          total_responded: eventType === 'responded' ? 1 : 0,
          open_rate: eventType === 'opened' ? 100 : 0,
          click_rate: 0,
          response_rate: 0,
        });
    }
  } catch (error) {
    console.error('[SendTime] Error tracking event:', error);
  }
}

/**
 * Get optimal send time for a contact
 */
export async function getOptimalSendTime(contactId: string): Promise<SendTimeResult | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('optimal_send_times')
      .select('*')
      .eq('contact_id', contactId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      optimalSendAt: new Date(data.optimal_send_at),
      dayOfWeek: data.day_of_week,
      hourOfDay: data.hour_of_day,
      minuteRandomization: data.minute_randomization,
      reason: data.reason,
      confidenceScore: data.confidence_score,
      historicalOpenRate: data.historical_open_rate,
      historicalSampleSize: data.historical_sample_size,
    };
  } catch (error) {
    console.error('[SendTime] Error fetching:', error);
    return null;
  }
}

/**
 * Get best performing send times for a niche
 */
export async function getBestSendTimes(
  niche?: string,
  businessType?: BusinessType,
  limit: number = 5
): Promise<Array<{
  dayOfWeek: number;
  hourOfDay: number;
  openRate: number;
  sampleSize: number;
}>> {
  try {
    let query = supabaseAdmin
      .from('send_time_analytics')
      .select('day_of_week, hour_of_day, open_rate, total_sent')
      .order('open_rate', { ascending: false })
      .limit(limit);
    
    if (niche) {
      query = query.eq('niche', niche);
    }
    
    if (businessType) {
      query = query.eq('business_type', businessType);
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
      return [];
    }
    
    return data.map(d => ({
      dayOfWeek: d.day_of_week,
      hourOfDay: d.hour_of_day,
      openRate: parseFloat(d.open_rate?.toString() || '0'),
      sampleSize: d.total_sent || 0,
    }));
  } catch (error) {
    console.error('[SendTime] Error fetching best times:', error);
    return [];
  }
}
