/**
 * Email AI Service
 *
 * Generates 3 email variations using AI for A/B testing.
 * Uses Lead Gen Tool database data for deep personalization.
 */

import OpenAI from 'openai';

// Lazy-initialize so build can succeed without OPENAI_API_KEY (only required at runtime)
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('Missing credentials. Set OPENAI_API_KEY environment variable.');
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

export interface EmailVariation {
  subject: string;
  html_content: string;
  text_content?: string;
  variation_name: string; // e.g., "Direct", "Question", "Value"
  description?: string;
}

export interface GenerateEmailVariationsInput {
  leadName?: string;
  leadCompany: string;
  leadRole?: string;
  leadPainPoint?: string;
  leadWebsite?: string;
  businessContext?: string;
  niche?: string;
  tone?: 'professional' | 'friendly' | 'direct' | 'consultative';
  includeCTA?: boolean;
  ctaText?: string;
  // Lead Gen Tool Data
  painPoints?: string[];
  opportunities?: string[];
  businessQualityScore?: number;
  businessQualityTier?: string;
  seoScore?: number;
  pageScore?: number;
  rating?: number;
  reviews?: number;
  competitorCount?: number;
  businessAnalysis?: string;
  location?: string;
  allEmails?: string[];
  contactNames?: string[];
  enrichmentData?: Record<string, unknown>;
  // Enhanced Lead Gen Database Fields
  competitors?: {
    name: string;
    website?: string;
    rank?: number;
    rating?: number;
    reviews?: number;
    gapAnalysis?: string;
  }[];
  marketingTags?: Record<string, unknown>;
  hasContactPage?: boolean;
  hasBookingSystem?: boolean;
  aiEmailIntro?: string;
  aiEmailCta?: string;
  subjectLine?: string;
  personalizationScore?: number;
  sendTimeReason?: string;
  qualityTier?: string;
  isICP?: boolean;
  landingPageSlug?: string;
  pdfReportUrl?: string;
  mockupUrl?: string;
}

/**
 * Build a rich competitor intelligence section for the AI prompt
 */
function buildCompetitorContext(competitors?: GenerateEmailVariationsInput['competitors']): string {
  if (!competitors || competitors.length === 0) return '';

  const lines = ['COMPETITOR INTELLIGENCE:'];
  competitors.slice(0, 5).forEach((c, i) => {
    const parts = [`  ${i + 1}. ${c.name}`];
    if (c.rating) parts.push(`Rating: ${c.rating}/5`);
    if (c.reviews) parts.push(`${c.reviews} reviews`);
    if (c.rank) parts.push(`Rank #${c.rank}`);
    lines.push(parts.join(' | '));
    if (c.gapAnalysis) lines.push(`     Gap: ${c.gapAnalysis}`);
  });
  return lines.join('\n');
}

/**
 * Build marketing technology context
 */
function buildMarketingContext(tags?: Record<string, unknown>): string {
  if (!tags || Object.keys(tags).length === 0) return '';

  const detected: string[] = [];
  const missing: string[] = [];

  const importantTools = ['google_analytics', 'google_ads', 'facebook_pixel', 'google_tag_manager', 'crm', 'live_chat', 'email_marketing'];

  for (const tool of importantTools) {
    if (tags[tool]) {
      detected.push(tool.replace(/_/g, ' '));
    } else {
      missing.push(tool.replace(/_/g, ' '));
    }
  }

  const lines = ['MARKETING TECHNOLOGY DETECTED:'];
  if (detected.length > 0) lines.push(`  Using: ${detected.join(', ')}`);
  if (missing.length > 0) lines.push(`  Missing: ${missing.join(', ')}`);
  return lines.join('\n');
}

/**
 * Build business signals section
 */
function buildBusinessSignals(input: GenerateEmailVariationsInput): string {
  const signals: string[] = [];

  if (input.isICP) signals.push('IDEAL CUSTOMER PROFILE MATCH');
  if (input.qualityTier) signals.push(`Quality Tier: ${input.qualityTier}`);
  if (input.hasContactPage === false) signals.push('No contact page found on website');
  if (input.hasBookingSystem === false) signals.push('No online booking system detected');
  if (input.hasBookingSystem === true) signals.push('Has online booking system');
  if (input.pdfReportUrl) signals.push('Custom analysis report available');
  if (input.mockupUrl) signals.push('Custom mockup/design available');

  if (signals.length === 0) return '';
  return `BUSINESS SIGNALS:\n  ${signals.join('\n  ')}`;
}

/**
 * Generate 3 email variations for A/B testing
 */
export async function generateEmailVariations(
  input: GenerateEmailVariationsInput
): Promise<{ success: boolean; variations?: EmailVariation[]; error?: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: 'OPENAI_API_KEY not configured' };
    }

    // Build comprehensive lead context from all available data
    const painPointsList = input.painPoints && input.painPoints.length > 0
      ? input.painPoints.join(', ')
      : input.leadPainPoint || 'Not identified';

    const opportunitiesList = input.opportunities && input.opportunities.length > 0
      ? input.opportunities.join(', ')
      : 'Not identified';

    const businessMetrics = [];
    if (input.businessQualityScore !== undefined) businessMetrics.push(`Business Quality Score: ${input.businessQualityScore}/100`);
    if (input.seoScore !== undefined) businessMetrics.push(`SEO Score: ${input.seoScore}/100`);
    if (input.pageScore !== undefined) businessMetrics.push(`Page Score: ${input.pageScore}/100`);
    if (input.rating !== undefined) businessMetrics.push(`Google Rating: ${input.rating}/5${input.reviews ? ` (${input.reviews} reviews)` : ''}`);
    if (input.competitorCount !== undefined) businessMetrics.push(`Competitors Found: ${input.competitorCount}`);
    if (input.personalizationScore !== undefined) businessMetrics.push(`Personalization Score: ${input.personalizationScore}/100`);

    const businessMetricsText = businessMetrics.length > 0 ? businessMetrics.join(' | ') : 'Not available';

    const locationInfo = input.location ? `Location: ${input.location}` : '';
    const contactNamesInfo = input.contactNames && input.contactNames.length > 0
      ? `Contact Names: ${input.contactNames.join(', ')}`
      : '';

    // Build enhanced context sections
    const competitorContext = buildCompetitorContext(input.competitors);
    const marketingContext = buildMarketingContext(input.marketingTags);
    const businessSignals = buildBusinessSignals(input);

    // Build assets section
    const assetsAvailable: string[] = [];
    if (input.pdfReportUrl) assetsAvailable.push('Custom PDF analysis report');
    if (input.mockupUrl) assetsAvailable.push('Custom website mockup/redesign');
    if (input.landingPageSlug) assetsAvailable.push('Personalized landing page');
    const assetsSection = assetsAvailable.length > 0
      ? `\nDELIVERABLES TO REFERENCE IN CTA:\n  ${assetsAvailable.join('\n  ')}\n  (These are ready to share - use them to create compelling CTAs)`
      : '';

    // Build previous AI analysis section
    const previousAnalysis: string[] = [];
    if (input.aiEmailIntro) previousAnalysis.push(`Previous AI Intro: ${input.aiEmailIntro}`);
    if (input.aiEmailCta) previousAnalysis.push(`Previous AI CTA: ${input.aiEmailCta}`);
    if (input.sendTimeReason) previousAnalysis.push(`Send Time Reasoning: ${input.sendTimeReason}`);
    const previousAnalysisSection = previousAnalysis.length > 0
      ? `\nPREVIOUS AI ANALYSIS (use for inspiration, but create fresh content):\n  ${previousAnalysis.join('\n  ')}`
      : '';

    const prompt = `You are an elite email copywriter specializing in high-converting B2B outreach. Generate 3 distinct, deeply personalized email variations for A/B testing.

COMPREHENSIVE LEAD INTELLIGENCE:
- Company: ${input.leadCompany}
- Contact Name: ${input.leadName || 'Not provided'}
- Role/Title: ${input.leadRole || 'Not provided'}
- Website: ${input.leadWebsite || 'Not provided'}
- Niche/Industry: ${input.niche || 'General business'}
${locationInfo ? `- ${locationInfo}` : ''}
${contactNamesInfo ? `- ${contactNamesInfo}` : ''}

PAIN POINTS IDENTIFIED:
${painPointsList}

OPPORTUNITIES DISCOVERED:
${opportunitiesList}

BUSINESS METRICS & SCORES:
${businessMetricsText}
${input.businessAnalysis ? `\nDetailed Analysis: ${input.businessAnalysis}` : ''}
${input.businessContext ? `\nAdditional Context: ${input.businessContext}` : ''}

${competitorContext}

${marketingContext}

${businessSignals}
${assetsSection}
${previousAnalysisSection}

CRITICAL REQUIREMENTS FOR ALL 3 VARIATIONS:

1. **Variation 1: "Direct Pain Point"**
   - Open by directly naming their BIGGEST, most specific pain point with concrete data
   - Example: "Your website's SEO score of 42/100 means you're likely invisible to 73% of potential customers searching for [niche] in [location]"
   - Show the COST of inaction using their actual metrics
   - If competitor data is available, contrast their position vs top competitors
   - End with urgent, specific CTA (reference report/mockup if available)

2. **Variation 2: "Insight Question"**
   - Open with a provocative question that uses their SPECIFIC data to create a knowledge gap
   - Example: "Did you know that [top competitor] has [X] more reviews than ${input.leadCompany}? Here's what that's costing you..."
   - Present unexpected insights from their metrics (connect dots they haven't connected)
   - Use marketing technology gaps or competitor advantages as leverage points
   - End with curiosity-driven CTA

3. **Variation 3: "Strategic Opportunity"**
   - Open by painting a picture of what's POSSIBLE, not what's wrong
   - Reference their strengths (rating, reviews, location) as foundations to build on
   - Present a specific, data-backed growth opportunity from their analysis
   - If they're an ICP match or high-quality lead, mention exclusive/priority access
   - End with value-first CTA (offer to share report/analysis/mockup)

2. Each email MUST:
   - Use AT LEAST 3 specific data points from the lead intelligence above (scores, ratings, competitor data, marketing tools, etc.)
   - Be 200-300 words with RICH, specific, non-generic content
   - Reference their actual website/company by name
   - Include specific numbers, scores, or findings (never vague)
   - Match ${input.tone || 'professional'} tone while being conversational
   - Have a different, compelling subject line (50-60 chars, referencing specific data)
   - Include a STRONG call-to-action${assetsAvailable.length > 0 ? ' (reference available deliverables)' : ''}

3. Subject line strategy:
   - Variation 1: Pain/urgency based (reference a specific metric or finding)
   - Variation 2: Curiosity/question based (hint at an insight they don't know)
   - Variation 3: Opportunity/value based (reference growth potential)

4. HTML format: Professional email with proper greeting, structured body, clear CTA. Use simple HTML only.

Return ONLY a valid JSON object with this exact structure:
{
  "variations": [
    {
      "variation_name": "Direct Pain Point",
      "subject": "Subject line here",
      "html_content": "Full HTML email content here",
      "text_content": "Plain text version here",
      "description": "Brief description of this variation's approach and data points used"
    },
    {
      "variation_name": "Insight Question",
      "subject": "Subject line here",
      "html_content": "Full HTML email content here",
      "text_content": "Plain text version here",
      "description": "Brief description of this variation's approach and data points used"
    },
    {
      "variation_name": "Strategic Opportunity",
      "subject": "Subject line here",
      "html_content": "Full HTML email content here",
      "text_content": "Plain text version here",
      "description": "Brief description of this variation's approach and data points used"
    }
  ]
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an elite B2B email copywriter. You create hyper-personalized, data-driven emails that convert. Always return valid JSON only. Every sentence must reference specific data about the lead. Never use generic filler.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.85,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return { success: false, error: 'No response from AI' };
    }

    // Parse JSON response (handle markdown code blocks if present)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    if (!parsed.variations || !Array.isArray(parsed.variations) || parsed.variations.length !== 3) {
      return { success: false, error: 'Invalid response format from AI' };
    }

    const variations: EmailVariation[] = parsed.variations.map((v: Record<string, string>) => ({
      variation_name: v.variation_name,
      subject: v.subject,
      html_content: v.html_content,
      text_content: v.text_content || v.html_content.replace(/<[^>]*>/g, ''),
      description: v.description,
    }));

    return { success: true, variations };
  } catch (error) {
    console.error('[EmailAI] Error generating variations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate a single email using AI (for template generation)
 */
export async function generateEmail(
  input: GenerateEmailVariationsInput
): Promise<{ success: boolean; email?: EmailVariation; error?: string }> {
  try {
    const result = await generateEmailVariations(input);
    if (!result.success || !result.variations || result.variations.length === 0) {
      return { success: false, error: result.error || 'Failed to generate email' };
    }

    // Return the first variation
    return { success: true, email: result.variations[0] };
  } catch (error) {
    console.error('[EmailAI] Error generating email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
