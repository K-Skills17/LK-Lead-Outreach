/**
 * Lead Quality Scoring Service
 * Scores business quality based on multiple signals from Google, website analysis, and competitive position
 * Returns score 0-100 indicating lead quality and recommendations
 */

export interface LeadQualityInput {
  verified?: boolean;
  rating?: number;
  reviews?: number;
  website?: string;
  has_https?: boolean;
  has_contact_page?: boolean;
  has_booking_system?: boolean;
  rank?: number;
  competitors?: Array<{
    competitor_rating?: number;
    competitor_reviews?: number;
  }>;
  analysis?: {
    speed_mobile?: number;
    seo_score?: number;
  };
  domain_age_days?: number;
}

export interface EnrichmentData {
  emails?: string[];
  whatsapp_phone?: string;
  contact_name?: string;
  found_on_page?: string;
  has_contact_page?: boolean;
  has_booking_system?: boolean;
}

export interface LeadQualityResult {
  score: number;
  signals: string[];
  tier: 'VIP' | 'HOT' | 'WARM' | 'COLD' | 'SKIP';
  recommendation: {
    action: string;
    primaryOffer: string | null;
    personalization: string | null;
    channels: string[];
    urgency: string | null;
    notes: string;
  };
}

export interface ContactDecision {
  shouldContact: boolean;
  reason?: string;
  primaryEmail?: string | null;
  allQualityEmails?: string[];
  emailQuality?: number;
  businessScore?: number;
  businessTier?: string;
  isICP?: boolean;
  recommendation?: LeadQualityResult['recommendation'];
  reasons?: string[];
  warnings?: string[];
  businessSignals?: string[];
}

/**
 * Score business quality based on multiple signals
 * Returns score 0-100 indicating lead quality
 */
export function scoreBusinessQuality(
  lead: LeadQualityInput,
  niche: string = 'local business'
): LeadQualityResult {
  let score = 0;
  const signals: string[] = [];
  const n = niche.toLowerCase();

  // ============================================
  // GOOGLE REPUTATION SIGNALS (40 points max)
  // ============================================

  // Google Verified Badge
  if (lead.verified) {
    score += 15;
    signals.push('Google verified business');
  }

  // Rating quality - Niche specific
  if (lead.rating !== undefined) {
    const isProfessional =
      n.includes('advogado') ||
      n.includes('dentist') ||
      n.includes('lawyer') ||
      n.includes('médico') ||
      n.includes('doctor') ||
      n.includes('physician') ||
      n.includes('attorney');

    if (lead.rating >= 4.8) {
      score += 15;
      signals.push('Excellent rating (4.8+)');
    } else if (lead.rating >= 4.5) {
      score += 12;
      signals.push('Very good rating (4.5+)');
    } else if (lead.rating >= 4.0) {
      score += 8;
      signals.push('Good rating (4.0+)');
    } else if (lead.rating < 3.5 && isProfessional) {
      score -= 25; // Professionals need higher trust
      signals.push('⚠️ Poor professional reputation');
    }
  }

  // ============================================
  // WEBSITE QUALITY SIGNALS (30 points max)
  // ============================================

  // Has website at all - Niche specific importance
  if (lead.website) {
    score += 5;
  } else {
    // Some niches don't need websites as much (e.g. painters, plumbers)
    const needsWebsite =
      n.includes('dentist') ||
      n.includes('lawyer') ||
      n.includes('spa') ||
      n.includes('médico');
    if (needsWebsite) {
      score -= 15;
      signals.push('⚠️ No website (Critical for niche)');
    } else {
      score -= 5;
      signals.push('⚠️ No website');
    }
  }

  // HTTPS (security)
  if (lead.has_https) {
    score += 5;
    signals.push('Secure website (HTTPS)');
  } else if (lead.website) {
    score -= 5;
    signals.push('⚠️ Not secure (HTTP only)');
  }

  // Website performance (opportunity)
  if (lead.analysis?.speed_mobile !== undefined) {
    if (lead.analysis.speed_mobile < 40) {
      score += 15; // GREAT opportunity - needs lots of help
      signals.push('🎯 Poor site speed - HIGH NEED');
    } else if (lead.analysis.speed_mobile < 60) {
      score += 12; // Good opportunity
      signals.push('🎯 Below average site speed - GOOD NEED');
    } else if (lead.analysis.speed_mobile < 80) {
      score += 8; // Some opportunity
      signals.push('Average site speed - SOME NEED');
    } else {
      score += 3; // Already good
      signals.push('Good site speed');
    }
  }

  // SEO quality (opportunity)
  if (lead.analysis?.seo_score !== undefined) {
    if (lead.analysis.seo_score < 60) {
      score += 10; // Needs SEO help
      signals.push('🎯 Poor SEO - OPPORTUNITY');
    } else if (lead.analysis.seo_score < 80) {
      score += 5;
      signals.push('Average SEO');
    }
  }

  // Has booking system (sophistication indicator)
  if (lead.has_booking_system) {
    score -= 5; // Already tech-savvy, might not need us
    signals.push('Already has booking system');
  } else {
    score += 5; // Opportunity to add value
    signals.push('🎯 No booking system - OPPORTUNITY');
  }

  // Has contact page
  if (lead.has_contact_page) {
    score += 3;
  } else {
    score += 8; // Easy win for us
    signals.push('🎯 No contact page - EASY WIN');
  }

  // ============================================
  // COMPETITIVE POSITION (25 points max)
  // ============================================

  // Google Maps ranking position
  if (lead.rank !== undefined) {
    if (lead.rank === 1) {
      score -= 15; // #1 doesn't need help
      signals.push('Already #1 in Google Maps');
    } else if (lead.rank >= 2 && lead.rank <= 3) {
      score -= 8; // Top 3 might not need help
      signals.push('Top 3 position');
    } else if (lead.rank >= 4 && lead.rank <= 10) {
      score += 15; // PERFECT - visible but wants to improve
      signals.push('🎯 PERFECT TARGET - Position 4-10');
    } else if (lead.rank >= 11 && lead.rank <= 20) {
      score += 18; // HUNGRY for improvement
      signals.push('🎯 HUNGRY - Position 11-20');
    } else if (lead.rank > 20) {
      score += 10; // Needs help but might lack budget
      signals.push('Low visibility (20+)');
    }
  }

  // Competitor gap analysis
  if (lead.competitors && lead.competitors.length > 0) {
    const topCompetitor = lead.competitors[0];

    // Rating gap
    if (
      topCompetitor.competitor_rating !== undefined &&
      lead.rating !== undefined
    ) {
      const ratingGap = topCompetitor.competitor_rating - lead.rating;

      if (ratingGap >= 0.5) {
        score += 10; // Significant rating gap = pain point
        signals.push(
          `🎯 ${ratingGap.toFixed(1)}★ behind top competitor`
        );
      } else if (ratingGap >= 0.3) {
        score += 7;
        signals.push(`${ratingGap.toFixed(1)}★ behind top competitor`);
      }
    }

    // Review gap
    if (
      topCompetitor.competitor_reviews !== undefined &&
      lead.reviews !== undefined
    ) {
      const reviewGap =
        topCompetitor.competitor_reviews - lead.reviews;

      if (reviewGap >= 50) {
        score += 10; // Big gap in social proof
        signals.push(
          `🎯 ${reviewGap} fewer reviews than top competitor`
        );
      } else if (reviewGap >= 20) {
        score += 5;
        signals.push(`${reviewGap} fewer reviews than competitor`);
      }
    }
  }

  // ============================================
  // BUSINESS MATURITY (5 points max)
  // ============================================

  // Domain age (if available from validation)
  if (lead.domain_age_days !== undefined) {
    if (lead.domain_age_days < 180) {
      score -= 5; // Very new, might not have budget
      signals.push('⚠️ Very new business (<6 months)');
    } else if (lead.domain_age_days >= 365 && lead.domain_age_days < 1825) {
      score += 5; // 1-5 years = sweet spot
      signals.push('Established business (1-5 years)');
    } else if (lead.domain_age_days >= 1825) {
      score += 3; // 5+ years = very established
      signals.push('Long-established business (5+ years)');
    }
  }

  // ============================================
  // FINAL SCORE NORMALIZATION
  // ============================================

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    signals: signals,
    tier: getTier(finalScore),
    recommendation: getRecommendation(finalScore, signals, lead),
  };
}

/**
 * Get quality tier based on score
 */
export function getTier(score: number): 'VIP' | 'HOT' | 'WARM' | 'COLD' | 'SKIP' {
  if (score >= 70) return 'VIP';
  if (score >= 55) return 'HOT';
  if (score >= 40) return 'WARM';
  if (score >= 25) return 'COLD';
  return 'SKIP';
}

/**
 * Get recommendation based on score and signals
 */
export function getRecommendation(
  score: number,
  signals: string[],
  lead: LeadQualityInput
): LeadQualityResult['recommendation'] {
  // Determine Primary Offer based on biggest pain point
  let primaryOffer: string = 'WEBSITE_DESIGN'; // Default

  if (lead.analysis?.speed_mobile !== undefined && lead.analysis.speed_mobile < 40) {
    primaryOffer = 'SPEED_OPTIMIZATION';
  } else if (lead.analysis?.seo_score !== undefined && lead.analysis.seo_score < 60) {
    primaryOffer = 'SEO_STRATEGY';
  } else if (lead.rank !== undefined && lead.rank > 10) {
    primaryOffer = 'MAPS_RANKING';
  } else if (lead.reviews !== undefined && lead.reviews < 30) {
    primaryOffer = 'REPUTATION_MANAGEMENT';
  } else if (!lead.has_https && lead.website) {
    primaryOffer = 'SECURITY_SETUP';
  }

  const baseRec = {
    primaryOffer,
    urgency: 'LOW' as string,
    channels: ['email'] as string[],
    personalization: 'MEDIUM' as string,
  };

  if (score >= 70) {
    return {
      ...baseRec,
      action: 'PRIORITY_OUTREACH',
      personalization: 'MAXIMUM',
      channels: ['email', 'whatsapp', 'linkedin'],
      urgency: 'HIGH',
      notes: 'Perfect ICP - use multi-channel, highly personalized approach',
    };
  }

  if (score >= 55) {
    return {
      ...baseRec,
      action: 'STANDARD_OUTREACH',
      personalization: 'HIGH',
      channels: ['email', 'whatsapp'],
      urgency: 'MEDIUM',
      notes: 'Good fit - standard personalized outreach',
    };
  }

  if (score >= 40) {
    return {
      ...baseRec,
      action: 'OUTREACH',
      notes: 'Decent fit - email outreach with moderate personalization',
    };
  }

  if (score >= 25) {
    return {
      ...baseRec,
      action: 'NURTURE',
      personalization: 'LOW',
      urgency: 'VERY_LOW',
      notes: 'Low priority - add to nurture sequence',
    };
  }

  return {
    action: 'SKIP',
    primaryOffer: null,
    personalization: null,
    channels: [],
    urgency: null,
    notes: 'Not a good fit - skip or review manually',
  };
}

/**
 * Score email quality (simplified version)
 * In production, this would use the email-validation.service
 */
function scoreEmailQuality(
  email: string,
  contactName?: string,
  foundOnPage?: string
): number {
  let score = 50; // Base score

  // Check if email matches contact name
  if (contactName && email.toLowerCase().includes(contactName.toLowerCase().split(' ')[0])) {
    score += 30;
  }

  // Check if it's a generic email
  const genericEmails = ['info', 'contact', 'hello', 'support', 'sales', 'admin'];
  const emailLocal = email.split('@')[0].toLowerCase();
  if (genericEmails.some(g => emailLocal.includes(g))) {
    score -= 20;
  }

  // Check domain quality
  if (email.includes('gmail.com') || email.includes('yahoo.com') || email.includes('hotmail.com')) {
    score -= 10; // Personal email, less ideal
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine if lead should be contacted
 */
export function shouldContactLead(
  lead: LeadQualityInput,
  enrichment: EnrichmentData,
  analysis?: any,
  niche: string = 'local business'
): ContactDecision {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const n = niche.toLowerCase();

  // ============================================
  // HARD BLOCKS (Never contact)
  // ============================================

  // Check if we have ANY contact method (Email OR WhatsApp)
  const hasEmail = enrichment?.emails && enrichment.emails.length > 0;
  const hasWhatsApp = !!enrichment?.whatsapp_phone;

  if (!hasEmail && !hasWhatsApp) {
    return {
      shouldContact: false,
      reason: 'No contact method found (No Email and No WhatsApp)',
      primaryEmail: null,
      businessScore: 0,
    };
  }

  // Poor reputation - Niche specific
  const isProfessional =
    n.includes('advogado') ||
    n.includes('dentist') ||
    n.includes('lawyer') ||
    n.includes('médico');
  if (
    lead.rating !== undefined &&
    lead.rating < (isProfessional ? 3.8 : 3.0) &&
    (lead.reviews || 0) > 10
  ) {
    return {
      shouldContact: false,
      reason: `Poor reputation for ${niche}`,
      primaryEmail: null,
      businessScore: 0,
    };
  }

  // ============================================
  // EMAIL QUALITY FILTER
  // ============================================

  // Score all emails and filter by quality
  const emailScores = (enrichment?.emails || []).map((email) => {
    const score = scoreEmailQuality(
      email,
      enrichment.contact_name,
      enrichment.found_on_page
    );
    return { email, score };
  });

  // Filter to quality emails only (score >= 40)
  const qualityEmails = emailScores
    .filter((e) => e.score >= 40)
    .sort((a, b) => b.score - a.score);

  let primaryEmail = qualityEmails[0]?.email;
  let emailQuality = qualityEmails[0]?.score || 0;

  if (hasEmail && qualityEmails.length === 0) {
    warnings.push('Only low-quality emails found (generic/shared)');

    // Check if we should still try with best available
    const bestAvailable = emailScores.sort((a, b) => b.score - a.score)[0];

    if (bestAvailable && bestAvailable.score >= 20) {
      warnings.push(`Using fallback email: ${bestAvailable.email}`);
      primaryEmail = bestAvailable.email;
      emailQuality = bestAvailable.score;
    } else if (!hasWhatsApp) {
      // ONLY block if we also don't have WhatsApp
      return {
        shouldContact: false,
        reason: 'No usable emails and no WhatsApp found',
        primaryEmail: null,
        businessScore: 0,
      };
    }
  }

  // ============================================
  // BUSINESS QUALITY SCORING
  // ============================================

  const businessQuality = scoreBusinessQuality(
    {
      ...lead,
      analysis: analysis || lead.analysis,
      has_https: lead.website?.startsWith('https'),
      has_contact_page: enrichment.has_contact_page,
      has_booking_system: enrichment.has_booking_system,
    },
    niche
  );

  // Skip if business score too low
  if (businessQuality.score < 20) {
    return {
      shouldContact: false,
      reason: 'Business quality score too low',
      primaryEmail: qualityEmails[0]?.email,
      businessScore: businessQuality.score,
      businessSignals: businessQuality.signals,
    };
  }

  // ============================================
  // IDEAL CLIENT PROFILE (ICP) CHECK
  // ============================================

  const isICP =
    (lead.rank !== undefined && lead.rank >= 4 && lead.rank <= 20) && // Visible but wants improvement
    (lead.reviews || 0) >= (isProfessional ? 20 : 10) && // Somewhat established
    (lead.rating || 0) >= (isProfessional ? 4.2 : 3.5) && // Decent reputation
    ((analysis?.speed_mobile !== undefined && analysis.speed_mobile < 70) ||
      (analysis?.seo_score !== undefined && analysis.seo_score < 75)); // Room for improvement

  if (isICP) {
    reasons.push('✅ Matches Ideal Customer Profile');
  }

  // ============================================
  // FINAL DECISION
  // ============================================

  return {
    shouldContact: true,
    primaryEmail: primaryEmail || emailScores[0]?.email,
    allQualityEmails: qualityEmails.map((e) => e.email),
    emailQuality: emailQuality || emailScores[0]?.score || 0,
    businessScore: businessQuality.score,
    businessTier: businessQuality.tier,
    isICP: isICP,
    recommendation: businessQuality.recommendation,
    reasons: [...reasons, ...businessQuality.signals],
    warnings: warnings,
  };
}

/**
 * Batch score multiple leads
 */
export function scoreLeadBatch(leads: LeadQualityInput[]): Array<LeadQualityInput & {
  qualityScore: number;
  qualityTier: string;
  qualitySignals: string[];
  recommendation: LeadQualityResult['recommendation'];
}> {
  return leads
    .map((lead) => {
      const score = scoreBusinessQuality(lead);
      return {
        ...lead,
        qualityScore: score.score,
        qualityTier: score.tier,
        qualitySignals: score.signals,
        recommendation: score.recommendation,
      };
    })
    .sort((a, b) => b.qualityScore - a.qualityScore); // Best first
}
