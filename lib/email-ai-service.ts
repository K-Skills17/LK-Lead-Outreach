/**
 * Email AI Service
 * 
 * Generates 3 email variations using AI for A/B testing
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  enrichmentData?: any;
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
    
    const businessMetricsText = businessMetrics.length > 0 ? businessMetrics.join(' | ') : 'Not available';
    
    const locationInfo = input.location ? `Location: ${input.location}` : '';
    const contactInfo = input.allEmails && input.allEmails.length > 0 
      ? `Additional Emails: ${input.allEmails.join(', ')}`
      : '';
    const contactNamesInfo = input.contactNames && input.contactNames.length > 0
      ? `Contact Names: ${input.contactNames.join(', ')}`
      : '';

    const prompt = `You are an expert email copywriter specializing in high-converting B2B outreach. Generate 3 distinct, RICH, and highly engaging email variations for A/B testing.

COMPREHENSIVE LEAD INFORMATION:
- Company: ${input.leadCompany}
- Contact Name: ${input.leadName || 'Not provided'}
- Role/Title: ${input.leadRole || 'Not provided'}
- Website: ${input.leadWebsite || 'Not provided'}
- Niche/Industry: ${input.niche || 'General business'}
${locationInfo ? `- ${locationInfo}` : ''}
${contactInfo ? `- ${contactInfo}` : ''}
${contactNamesInfo ? `- ${contactNamesInfo}` : ''}

PAIN POINTS IDENTIFIED:
${painPointsList}

OPPORTUNITIES DISCOVERED:
${opportunitiesList}

BUSINESS METRICS & ANALYSIS:
${businessMetricsText}
${input.businessAnalysis ? `\nBusiness Analysis: ${input.businessAnalysis}` : ''}
${input.businessContext ? `\nAdditional Context: ${input.businessContext}` : ''}

CRITICAL REQUIREMENTS:
1. Create 3 distinct variations with different psychological approaches:
   - Variation 1: "Direct" - Lead with the PRIMARY PAIN POINT or most urgent opportunity. Be direct about the problem and solution. Create urgency. Use specific data/metrics discovered.
   - Variation 2: "Question" - Open with a thought-provoking question based on their pain points or business metrics. Make them think about their current situation. Use curiosity gap.
   - Variation 3: "Story" - Use a brief, relevant case study or story that relates to their pain points/opportunities. Build emotional connection and show proof.

2. Each email MUST:
   - Use SPECIFIC data discovered (scores, ratings, competitor count, pain points, opportunities)
   - Reference their website/company if available to show research
   - Lead with pain point, curiosity, or opportunity (depending on variation)
   - Be RICH in content (200-250 words) - not generic or shallow
   - Create URGENCY or compelling reason to respond NOW
   - Include a STRONG, specific call-to-action that solicits engagement
   - Use ${input.tone || 'professional'} tone but be conversational and human
   - Be optimized to START CONVERSATIONS and get responses
   - Show you understand their business deeply

3. Subject lines should:
   - Be compelling and create curiosity or urgency
   - Reference specific pain point, opportunity, or discovery
   - Be different for each variation
   - 50-60 characters maximum

4. HTML content should:
   - Professional email format with proper structure
   - Include greeting, rich body with specific details, strong CTA
   - Use simple HTML (no complex styling)
   - Be engaging and scannable

Return ONLY a valid JSON object with this exact structure:
{
  "variations": [
    {
      "variation_name": "Direct",
      "subject": "Subject line here",
      "html_content": "Full HTML email content here",
      "text_content": "Plain text version here",
      "description": "Brief description of this variation's approach"
    },
    {
      "variation_name": "Question",
      "subject": "Subject line here",
      "html_content": "Full HTML email content here",
      "text_content": "Plain text version here",
      "description": "Brief description of this variation's approach"
    },
    {
      "variation_name": "Story",
      "subject": "Subject line here",
      "html_content": "Full HTML email content here",
      "text_content": "Plain text version here",
      "description": "Brief description of this variation's approach"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email copywriter specializing in high-converting B2B outreach. Always return valid JSON only, no additional text. Make emails rich, specific, and engaging.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.85,
      max_tokens: 3000, // Increased for richer content (200-250 words per email x 3)
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

    const variations: EmailVariation[] = parsed.variations.map((v: any) => ({
      variation_name: v.variation_name,
      subject: v.subject,
      html_content: v.html_content,
      text_content: v.text_content || v.html_content.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
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
