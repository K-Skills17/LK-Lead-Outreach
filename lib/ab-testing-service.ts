/**
 * A/B/C Testing Framework
 * 
 * Manages variant testing for subject lines, intros, send times, and CTAs
 * Tracks events and determines winners with statistical significance
 */

import { supabaseAdmin } from './supabaseAdmin';

export type TestType = 'subject_line' | 'intro' | 'send_time' | 'cta' | 'combined';
export type TestStatus = 'draft' | 'active' | 'completed' | 'paused';
export type EventType = 'sent' | 'opened' | 'clicked' | 'responded' | 'booked' | 'bounced';

export interface TestVariant {
  name: string;
  weight: number; // 0-100 (must sum to 100 across all variants)
  content: {
    subject_line?: string;
    intro?: string;
    send_time_adjustment?: number; // Hours to adjust from optimal
    cta?: string;
    custom?: any;
  };
}

export interface ABTestConfig {
  campaignId?: string;
  testName: string;
  description?: string;
  testType: TestType;
  variants: TestVariant[];
  targetDistribution?: Record<string, number>; // variant_name: percentage
}

export interface ABTestResult {
  testId: string;
  variantName: string;
  sampleSize: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  respondedCount: number;
  bookedCount: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
  bookingRate: number;
  isWinner: boolean;
  confidence: number;
}

/**
 * Create A/B test
 */
export async function createABTest(config: ABTestConfig): Promise<{ success: boolean; testId?: string; error?: string }> {
  try {
    // Validate variants
    if (!config.variants || config.variants.length < 2) {
      return { success: false, error: 'At least 2 variants required' };
    }
    
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      return { success: false, error: 'Variant weights must sum to 100' };
    }
    
    // Build target distribution
    const targetDistribution: Record<string, number> = {};
    config.variants.forEach(v => {
      targetDistribution[v.name] = v.weight;
    });
    
    // Create test
    const { data, error } = await supabaseAdmin
      .from('ab_test_campaigns')
      .insert({
        campaign_id: config.campaignId,
        test_name: config.testName,
        description: config.description,
        test_type: config.testType,
        variants: config.variants as any,
        target_distribution: targetDistribution as any,
        status: 'draft',
      })
      .select('id')
      .single();
    
    if (error || !data) {
      console.error('[ABTest] Error creating test:', error);
      return { success: false, error: error?.message || 'Failed to create test' };
    }
    
    return { success: true, testId: data.id };
  } catch (error) {
    console.error('[ABTest] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Start A/B test
 */
export async function startABTest(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('ab_test_campaigns')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', testId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[ABTest] Error starting test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Assign variant to a contact using weighted random with balancing
 */
export async function assignVariant(
  testId: string,
  contactId: string
): Promise<{ success: boolean; variantName?: string; variant?: TestVariant; error?: string }> {
  try {
    // Get test config
    const { data: test, error: testError } = await supabaseAdmin
      .from('ab_test_campaigns')
      .select('*')
      .eq('id', testId)
      .single();
    
    if (testError || !test) {
      return { success: false, error: 'Test not found' };
    }
    
    if (test.status !== 'active') {
      return { success: false, error: 'Test is not active' };
    }
    
    // Check if already assigned
    const { data: existing } = await supabaseAdmin
      .from('ab_test_assignments')
      .select('*')
      .eq('test_id', testId)
      .eq('contact_id', contactId)
      .single();
    
    if (existing) {
      const variant = (test.variants as TestVariant[]).find(v => v.name === existing.variant_name);
      return {
        success: true,
        variantName: existing.variant_name,
        variant: variant,
      };
    }
    
    // Get current distribution
    const { data: assignments } = await supabaseAdmin
      .from('ab_test_assignments')
      .select('variant_name')
      .eq('test_id', testId);
    
    const currentCounts: Record<string, number> = {};
    const variants = test.variants as TestVariant[];
    
    variants.forEach(v => {
      currentCounts[v.name] = 0;
    });
    
    (assignments || []).forEach((a: any) => {
      currentCounts[a.variant_name] = (currentCounts[a.variant_name] || 0) + 1;
    });
    
    const totalAssignments = (assignments || []).length;
    
    // Calculate which variant is most "behind" its target
    let selectedVariant = variants[0];
    let maxDeficit = -Infinity;
    
    for (const variant of variants) {
      const currentPercentage = totalAssignments > 0
        ? (currentCounts[variant.name] / totalAssignments) * 100
        : 0;
      
      const targetPercentage = variant.weight;
      const deficit = targetPercentage - currentPercentage;
      
      if (deficit > maxDeficit) {
        maxDeficit = deficit;
        selectedVariant = variant;
      }
    }
    
    // If all are balanced, use weighted random
    if (Math.abs(maxDeficit) < 5 && totalAssignments > 20) {
      const rand = Math.random() * 100;
      let cumulative = 0;
      
      for (const variant of variants) {
        cumulative += variant.weight;
        if (rand <= cumulative) {
          selectedVariant = variant;
          break;
        }
      }
    }
    
    // Create assignment
    const { error: assignError } = await supabaseAdmin
      .from('ab_test_assignments')
      .insert({
        test_id: testId,
        contact_id: contactId,
        variant_name: selectedVariant.name,
        applied_content: selectedVariant.content as any,
      });
    
    if (assignError) {
      console.error('[ABTest] Error assigning variant:', assignError);
      return { success: false, error: assignError.message };
    }
    
    return {
      success: true,
      variantName: selectedVariant.name,
      variant: selectedVariant,
    };
  } catch (error) {
    console.error('[ABTest] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track event for A/B test
 */
export async function trackABTestEvent(
  testId: string,
  contactId: string,
  eventType: EventType,
  eventData?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get assignment
    const { data: assignment } = await supabaseAdmin
      .from('ab_test_assignments')
      .select('id')
      .eq('test_id', testId)
      .eq('contact_id', contactId)
      .single();
    
    if (!assignment) {
      return { success: false, error: 'No assignment found' };
    }
    
    // Create event
    const { error } = await supabaseAdmin
      .from('ab_test_events')
      .insert({
        assignment_id: assignment.id,
        event_type: eventType,
        event_data: eventData || {},
      });
    
    if (error) {
      console.error('[ABTest] Error tracking event:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[ABTest] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get A/B test results
 */
export async function getABTestResults(testId: string): Promise<ABTestResult[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ab_test_results')
      .select('*')
      .eq('test_id', testId);
    
    if (error || !data) {
      console.error('[ABTest] Error fetching results:', error);
      return [];
    }
    
    return data.map((r: any) => ({
      testId: r.test_id,
      variantName: r.variant_name,
      sampleSize: parseInt(r.total_assigned) || 0,
      sentCount: parseInt(r.total_sent) || 0,
      openedCount: parseInt(r.total_opened) || 0,
      clickedCount: parseInt(r.total_clicked) || 0,
      respondedCount: parseInt(r.total_responded) || 0,
      bookedCount: parseInt(r.total_booked) || 0,
      openRate: parseFloat(r.open_rate) || 0,
      clickRate: parseFloat(r.click_rate) || 0,
      responseRate: parseFloat(r.response_rate) || 0,
      bookingRate: parseFloat(r.booking_rate) || 0,
      isWinner: false, // Will be calculated next
      confidence: 0,
    }));
  } catch (error) {
    console.error('[ABTest] Error:', error);
    return [];
  }
}

/**
 * Calculate statistical significance and determine winner
 */
export async function determineWinner(
  testId: string,
  metric: 'open_rate' | 'click_rate' | 'response_rate' | 'booking_rate' = 'open_rate'
): Promise<{ success: boolean; winner?: string; confidence?: number; results?: ABTestResult[]; error?: string }> {
  try {
    // Use the database function
    const { data, error } = await supabaseAdmin
      .rpc('calculate_ab_test_significance', {
        test_id_input: testId,
        metric: metric,
      });
    
    if (error || !data || data.length === 0) {
      return { success: false, error: 'No data available' };
    }
    
    // Find the winner
    const winner = data.find((d: any) => d.is_winner);
    
    if (!winner) {
      return { success: false, error: 'Could not determine winner' };
    }
    
    // Update test with winner
    await supabaseAdmin
      .from('ab_test_campaigns')
      .update({
        winner_variant: winner.variant_name,
        confidence_level: winner.confidence,
        determined_at: new Date().toISOString(),
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', testId);
    
    // Convert to results
    const results: ABTestResult[] = data.map((d: any) => ({
      testId: testId,
      variantName: d.variant_name,
      sampleSize: parseInt(d.sample_size) || 0,
      sentCount: parseInt(d.sample_size) || 0,
      openedCount: 0, // Not in function output
      clickedCount: 0,
      respondedCount: 0,
      bookedCount: 0,
      openRate: parseFloat(d.rate) || 0,
      clickRate: 0,
      responseRate: 0,
      bookingRate: 0,
      isWinner: d.is_winner,
      confidence: parseFloat(d.confidence) || 0,
    }));
    
    return {
      success: true,
      winner: winner.variant_name,
      confidence: parseFloat(winner.confidence),
      results: results,
    };
  } catch (error) {
    console.error('[ABTest] Error determining winner:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get active A/B test for a campaign
 */
export async function getActiveTestForCampaign(campaignId: string): Promise<{
  testId: string;
  testName: string;
  testType: TestType;
  variants: TestVariant[];
} | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ab_test_campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      testId: data.id,
      testName: data.test_name,
      testType: data.test_type,
      variants: data.variants as TestVariant[],
    };
  } catch (error) {
    console.error('[ABTest] Error fetching active test:', error);
    return null;
  }
}

/**
 * Apply variant content to message
 */
export function applyVariantContent(
  originalContent: {
    subject?: string;
    intro?: string;
    cta?: string;
    sendTime?: Date;
  },
  variantContent: TestVariant['content']
): {
  subject?: string;
  intro?: string;
  cta?: string;
  sendTime?: Date;
} {
  const result = { ...originalContent };
  
  if (variantContent.subject_line) {
    result.subject = variantContent.subject_line;
  }
  
  if (variantContent.intro) {
    result.intro = variantContent.intro;
  }
  
  if (variantContent.cta) {
    result.cta = variantContent.cta;
  }
  
  if (variantContent.send_time_adjustment && originalContent.sendTime) {
    const adjusted = new Date(originalContent.sendTime);
    adjusted.setHours(adjusted.getHours() + variantContent.send_time_adjustment);
    result.sendTime = adjusted;
  }
  
  return result;
}

/**
 * Pause A/B test
 */
export async function pauseABTest(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('ab_test_campaigns')
      .update({ status: 'paused' })
      .eq('id', testId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resume A/B test
 */
export async function resumeABTest(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('ab_test_campaigns')
      .update({ status: 'active' })
      .eq('id', testId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
