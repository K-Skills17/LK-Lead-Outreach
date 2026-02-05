/**
 * WhatsApp AI Variation Service
 *
 * Generates 3 distinct WhatsApp message variations for SDRs to choose from,
 * using Lead Gen intelligence data for deep personalization.
 */

import OpenAI from 'openai';
import {
  isLeadGenDatabaseConfigured,
  getCompleteLeadGenData,
} from './lead-gen-db-service';
import type { CompleteLeadGenData } from './lead-gen-db-service';

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiInstance) return openaiInstance;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY environment variable');
  openaiInstance = new OpenAI({ apiKey });
  return openaiInstance;
}

export interface WhatsAppVariationInput {
  contactId: string;
  nome?: string;
  empresa?: string;
  cargo?: string;
  phone?: string;
  site?: string;
  niche?: string;
  location?: string;
  city?: string;
  state?: string;
  dor_especifica?: string;
  pain_points?: string[];
  opportunities?: string[];
  personalized_message?: string;
  business_quality_score?: number;
  business_quality_tier?: string;
  seo_score?: number;
  page_score?: number;
  rating?: number;
  reviews?: number;
  competitor_count?: number;
  enrichment_data?: Record<string, unknown>;
  // Lead Gen fields (populated from database)
  lead_gen_id?: string;
  competitors?: { name: string; domain?: string; gap_analysis?: string }[];
  marketing_tags?: string[];
  has_contact_page?: boolean;
  has_booking_system?: boolean;
  ai_email_intro?: string;
  ai_email_cta?: string;
  quality_tier?: string;
  is_icp?: boolean;
  landing_page_slug?: string;
  pdf_report_url?: string;
  mockup_url?: string;
  sdr_name?: string;
  tone?: 'friendly' | 'professional' | 'casual' | 'formal';
}

export interface WhatsAppVariation {
  id: string;
  name: string;
  description: string;
  message: string;
}

export interface WhatsAppVariationsResult {
  variations: WhatsAppVariation[];
  leadGenDataUsed: boolean;
}

/**
 * Fetch Lead Gen data and merge into input
 */
async function enrichWithLeadGenData(
  input: WhatsAppVariationInput
): Promise<WhatsAppVariationInput> {
  if (!isLeadGenDatabaseConfigured()) return input;

  const leadGenId = input.lead_gen_id;
  if (!leadGenId) return input;

  try {
    const lgData = await getCompleteLeadGenData(leadGenId);
    if (!lgData || !lgData.lead) return input;

    return mergeLeadGenIntoInput(input, lgData);
  } catch (err) {
    console.warn('[WhatsApp AI] Error fetching Lead Gen data:', err);
    return input;
  }
}

function mergeLeadGenIntoInput(
  input: WhatsAppVariationInput,
  lg: CompleteLeadGenData
): WhatsAppVariationInput {
  const merged = { ...input };

  if (lg.lead) {
    if (!merged.site && lg.lead.website) merged.site = lg.lead.website;
    if (!merged.city && lg.lead.city) merged.city = lg.lead.city;
    if (!merged.state && lg.lead.state) merged.state = lg.lead.state;
    if (!merged.rating && lg.lead.rating) merged.rating = lg.lead.rating;
    if (!merged.reviews && lg.lead.reviews) merged.reviews = lg.lead.reviews;
  }

  if (lg.enrichment) {
    merged.has_contact_page = lg.enrichment.has_contact_page ?? undefined;
    merged.has_booking_system = lg.enrichment.has_booking_system ?? undefined;
    if (lg.enrichment.marketing_tags && Array.isArray(lg.enrichment.marketing_tags)) {
      merged.marketing_tags = lg.enrichment.marketing_tags as string[];
    }
  }

  if (lg.analysis) {
    if (!merged.ai_email_intro && lg.analysis.ai_email_intro)
      merged.ai_email_intro = lg.analysis.ai_email_intro;
    if (!merged.ai_email_cta && lg.analysis.ai_email_cta)
      merged.ai_email_cta = lg.analysis.ai_email_cta;
    if (lg.analysis.pain_points) {
      const pp = lg.analysis.pain_points;
      if (Array.isArray(pp)) {
        merged.pain_points = pp as string[];
      } else if (typeof pp === 'object' && pp !== null) {
        merged.pain_points = Object.keys(pp).filter(
          (k) => (pp as Record<string, unknown>)[k]
        );
      }
    }
  }

  if (lg.competitors && lg.competitors.length > 0) {
    merged.competitors = lg.competitors.map((c) => ({
      name: c.competitor_name || '',
      domain: c.competitor_website || undefined,
      gap_analysis: c.gap_analysis || undefined,
    }));
    merged.competitor_count = lg.competitors.length;
  }

  if (lg.qualityScore) {
    if (lg.qualityScore.quality_score)
      merged.business_quality_score = lg.qualityScore.quality_score;
    if (lg.qualityScore.quality_tier)
      merged.quality_tier = lg.qualityScore.quality_tier;
    if (lg.qualityScore.is_icp !== undefined)
      merged.is_icp = lg.qualityScore.is_icp;
  }

  if (lg.report) {
    if (lg.report.pdf_url) merged.pdf_report_url = lg.report.pdf_url;
    if (lg.report.mockup_url) merged.mockup_url = lg.report.mockup_url;
  }

  if (lg.landingPage) {
    if (lg.landingPage.slug) merged.landing_page_slug = lg.landingPage.slug;
  }

  return merged;
}

function buildLeadContext(input: WhatsAppVariationInput): string {
  const parts: string[] = [];

  parts.push('LEAD INFORMATION:');
  if (input.nome) parts.push(`- Name: ${input.nome}`);
  if (input.empresa) parts.push(`- Company: ${input.empresa}`);
  if (input.cargo) parts.push(`- Role: ${input.cargo}`);
  if (input.site) parts.push(`- Website: ${input.site}`);
  if (input.niche) parts.push(`- Niche: ${input.niche}`);
  const loc = [input.city, input.state].filter(Boolean).join(', ');
  if (loc) parts.push(`- Location: ${loc}`);

  if (
    input.pain_points &&
    input.pain_points.length > 0
  ) {
    parts.push('\nPAIN POINTS:');
    input.pain_points.forEach((p, i) => parts.push(`${i + 1}. ${p}`));
  } else if (input.dor_especifica) {
    parts.push(`\nPAIN POINT: ${input.dor_especifica}`);
  }

  if (input.opportunities && input.opportunities.length > 0) {
    parts.push('\nOPPORTUNITIES:');
    input.opportunities.forEach((o, i) => parts.push(`${i + 1}. ${o}`));
  }

  const metrics: string[] = [];
  if (input.business_quality_score) metrics.push(`Quality: ${input.business_quality_score}/100`);
  if (input.seo_score) metrics.push(`SEO: ${input.seo_score}/100`);
  if (input.page_score) metrics.push(`Page: ${input.page_score}/100`);
  if (input.rating) metrics.push(`Rating: ${input.rating}/5${input.reviews ? ` (${input.reviews} reviews)` : ''}`);
  if (metrics.length > 0) {
    parts.push(`\nBUSINESS METRICS: ${metrics.join(' | ')}`);
  }

  if (input.competitors && input.competitors.length > 0) {
    parts.push(`\nCOMPETITORS (${input.competitors.length} found):`);
    input.competitors.slice(0, 3).forEach((c) => {
      let line = `- ${c.name}`;
      if (c.gap_analysis) line += ` — Gap: ${c.gap_analysis}`;
      parts.push(line);
    });
  }

  if (input.marketing_tags && input.marketing_tags.length > 0) {
    parts.push(`\nMARKETING TECH DETECTED: ${input.marketing_tags.join(', ')}`);
  }

  if (input.has_contact_page === false) {
    parts.push('\nNOTE: No contact page found on website');
  }
  if (input.has_booking_system === false) {
    parts.push('NOTE: No online booking system detected');
  }

  if (input.quality_tier) {
    parts.push(`\nQUALITY TIER: ${input.quality_tier}${input.is_icp ? ' (ICP Match)' : ''}`);
  }

  if (input.ai_email_intro) {
    parts.push(`\nPREVIOUS AI ANALYSIS INTRO: ${input.ai_email_intro}`);
  }

  if (input.personalized_message) {
    parts.push(`\nBUSINESS ANALYSIS: ${input.personalized_message.substring(0, 500)}`);
  }

  // Deliverables SDR can reference
  const deliverables: string[] = [];
  if (input.pdf_report_url) deliverables.push('PDF analysis report');
  if (input.mockup_url) deliverables.push('website mockup redesign');
  if (input.landing_page_slug) deliverables.push('personalized landing page');
  if (deliverables.length > 0) {
    parts.push(`\nDELIVERABLES AVAILABLE TO MENTION: ${deliverables.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Generate 3 WhatsApp message variations for a lead
 */
export async function generateWhatsAppVariations(
  input: WhatsAppVariationInput
): Promise<WhatsAppVariationsResult> {
  // Enrich with Lead Gen data if available
  const enriched = await enrichWithLeadGenData(input);
  const leadGenDataUsed = enriched !== input;

  const leadContext = buildLeadContext(enriched);

  const toneMap: Record<string, string> = {
    friendly: 'amigável e acolhedor',
    professional: 'profissional e respeitoso',
    casual: 'descontraído e informal',
    formal: 'formal e educado',
  };
  const tone = enriched.tone || 'friendly';
  const sdrName = enriched.sdr_name || 'Equipe LK Digital';

  const systemPrompt = `You are a High-Ticket B2B Sales Closer specialized in cold WhatsApp outreach.
You create RICH, PERSONALIZED, HIGHLY ENGAGING messages that start conversations.

Rules:
- Language: Portuguese (Brazil)
- Tone: ${toneMap[tone]}
- Each variation: 120-180 words
- Format: WhatsApp-friendly (use 3-4 appropriate emojis max)
- Use ALL available data (metrics, competitors, pain points, opportunities)
- Reference specific findings to show deep research
- Create urgency or curiosity to generate a reply
- Include a strong CTA asking for engagement
- Be human, conversational, not robotic
- SDR name for sign-off: ${sdrName}

You must return EXACTLY 3 variations in valid JSON format:
{
  "variations": [
    {
      "id": "pain_point",
      "name": "Direct Pain Point",
      "description": "Leads with the main pain point or problem discovered, using specific data",
      "message": "..."
    },
    {
      "id": "curiosity_hook",
      "name": "Curiosity Hook",
      "description": "Opens with an intriguing question or insight that creates curiosity",
      "message": "..."
    },
    {
      "id": "value_offer",
      "name": "Value Proposition",
      "description": "Leads with a specific deliverable or result the SDR can offer",
      "message": "..."
    }
  ]
}

IMPORTANT: Return ONLY the JSON, no markdown code blocks, no extra text.`;

  const userPrompt = `Generate 3 WhatsApp message variations for this lead using ALL available intelligence:

${leadContext}

Each variation must be distinct in approach:
1. "Direct Pain Point" — Lead with the #1 pain or problem found, use specific metrics
2. "Curiosity Hook" — Open with a surprising insight or question about their business
3. "Value Proposition" — Lead with a concrete deliverable or result you can offer them

Use discovered data (scores, competitors, marketing tech, pain points) to make each message feel deeply researched and personal.`;

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.85,
    max_tokens: 2000,
  });

  const raw = completion.choices[0]?.message?.content || '';

  try {
    // Clean potential markdown wrapping
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.variations && Array.isArray(parsed.variations)) {
      // Replace placeholders
      const variations: WhatsAppVariation[] = parsed.variations.map(
        (v: Record<string, string>) => ({
          id: v.id || 'unknown',
          name: v.name || 'Variation',
          description: v.description || '',
          message: (v.message || '')
            .replace(/{nome}/g, enriched.nome || '')
            .replace(/{empresa}/g, enriched.empresa || '')
            .replace(/{cargo}/g, enriched.cargo || '')
            .replace(/{site}/g, enriched.site || ''),
        })
      );

      return { variations, leadGenDataUsed };
    }

    throw new Error('Invalid response structure');
  } catch (parseError) {
    console.error('[WhatsApp AI] Parse error, attempting fallback:', parseError);

    // Fallback: extract messages from raw text
    const fallbackVariations: WhatsAppVariation[] = [
      {
        id: 'pain_point',
        name: 'Direct Pain Point',
        description: 'Generated from raw response',
        message: raw.substring(0, 600),
      },
      {
        id: 'curiosity_hook',
        name: 'Curiosity Hook',
        description: 'Default template',
        message: `Olá ${enriched.nome || 'Cliente'}! 👋\n\nEstive analisando a ${enriched.empresa || 'sua empresa'} e encontrei algumas oportunidades interessantes.\n\nVocê sabia que ${enriched.competitor_count || 'vários'} concorrentes na sua região já estão investindo em presença digital?\n\nGostaria de compartilhar o que descobrimos?\n\n${sdrName}`,
      },
      {
        id: 'value_offer',
        name: 'Value Proposition',
        description: 'Default template',
        message: `Olá ${enriched.nome || 'Cliente'}! 💼\n\nPreparei uma análise completa da ${enriched.empresa || 'sua empresa'} com insights sobre como melhorar sua presença online.\n\nPosso enviar o relatório para você dar uma olhada?\n\n${sdrName}`,
      },
    ];

    return { variations: fallbackVariations, leadGenDataUsed };
  }
}
