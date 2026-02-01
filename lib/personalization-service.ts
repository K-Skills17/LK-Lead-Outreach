/**
 * Personalization Analysis Service
 * 
 * Generates personalized email content using GPT-4 based on lead data
 * Calculates personalization scores and determines lead tiers
 */

import OpenAI from 'openai';
import { supabaseAdmin } from './supabaseAdmin';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type LeadTier = 'VIP' | 'HOT' | 'WARM' | 'COLD';

export interface PersonalizationInput {
  // Lead basic info
  name: string;
  empresa: string;
  industry?: string;
  
  // Enrichment data
  google_maps_ranking?: number;
  rating?: number;
  competitors?: Array<{ name: string; rating?: number }>;
  website_performance?: {
    speed_score?: number;
    seo_score?: number;
    mobile_friendly?: boolean;
  };
  marketing_tags?: string[];
  
  // Analysis data
  pain_points?: string[];
  quality_score?: number;
  fit_score?: number;
  enrichment_score?: number;
  
  // Campaign context
  niche?: string;
  campaign_name?: string;
}

export interface PersonalizationResult {
  personalizedIntro: string;
  painPoints: string[];
  ctaText: string;
  ctaType: LeadTier;
  personalizationScore: number;
  leadTier: LeadTier;
  inputData: PersonalizationInput;
  aiMetadata: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    generationTimeMs: number;
  };
}

/**
 * Determine lead tier based on quality scores
 */
export function determineLeadTier(input: PersonalizationInput): LeadTier {
  const qualityScore = input.quality_score || 0;
  const fitScore = input.fit_score || 0;
  const enrichmentScore = input.enrichment_score || 0;
  
  const avgScore = (qualityScore + fitScore + enrichmentScore) / 3;
  
  if (avgScore >= 85) return 'VIP';
  if (avgScore >= 70) return 'HOT';
  if (avgScore >= 50) return 'WARM';
  return 'COLD';
}

/**
 * Extract specific pain points from lead data
 */
export function extractPainPoints(input: PersonalizationInput): string[] {
  const painPoints: string[] = [];
  
  // Existing pain points from analysis
  if (input.pain_points && input.pain_points.length > 0) {
    painPoints.push(...input.pain_points);
  }
  
  // Google Maps ranking
  if (input.google_maps_ranking && input.google_maps_ranking > 5) {
    painPoints.push(`Ranked #${input.google_maps_ranking} on Google Maps - below top 5 visibility`);
  }
  
  // Rating gaps
  if (input.rating && input.competitors && input.competitors.length > 0) {
    const avgCompetitorRating = input.competitors
      .filter(c => c.rating)
      .reduce((sum, c) => sum + (c.rating || 0), 0) / input.competitors.length;
    
    if (avgCompetitorRating - input.rating > 0.3) {
      painPoints.push(`Rating ${input.rating.toFixed(1)} vs competitors avg ${avgCompetitorRating.toFixed(1)}`);
    }
  }
  
  // Website performance
  if (input.website_performance) {
    if (input.website_performance.speed_score && input.website_performance.speed_score < 70) {
      painPoints.push(`Website speed score ${input.website_performance.speed_score}/100 - needs optimization`);
    }
    if (input.website_performance.seo_score && input.website_performance.seo_score < 70) {
      painPoints.push(`SEO score ${input.website_performance.seo_score}/100 - missing visibility opportunities`);
    }
    if (input.website_performance.mobile_friendly === false) {
      painPoints.push(`Website not mobile-friendly - losing mobile customers`);
    }
  }
  
  return painPoints;
}

/**
 * Calculate personalization score based on data specificity
 */
export function calculatePersonalizationScore(input: PersonalizationInput, painPoints: string[]): number {
  let score = 0;
  
  // Base score for having name and company
  if (input.name && input.empresa) score += 20;
  
  // Industry knowledge
  if (input.industry) score += 10;
  
  // Specific pain points (most important)
  score += Math.min(painPoints.length * 15, 40);
  
  // Enrichment data
  if (input.google_maps_ranking) score += 5;
  if (input.rating) score += 5;
  if (input.competitors && input.competitors.length > 0) score += 5;
  if (input.website_performance) score += 5;
  
  // Quality scores
  if (input.quality_score && input.quality_score > 70) score += 10;
  if (input.fit_score && input.fit_score > 70) score += 10;
  
  return Math.min(score, 100);
}

/**
 * Generate CTA based on lead tier
 */
export function generateCTA(tier: LeadTier, niche?: string): string {
  const ctas = {
    VIP: [
      `Gostaria de agendar uma consulta estratégica de 15 minutos esta semana?`,
      `Podemos conversar amanhã sobre como resolver isso especificamente para ${niche || 'sua empresa'}?`,
      `Tenho algumas ideias específicas que funcionaram com empresas similares. Que tal conversarmos hoje?`,
    ],
    HOT: [
      `Quer ver alguns exemplos de como resolvemos isso para outras empresas?`,
      `Posso te enviar um case de sucesso relevante. Interessado?`,
      `Gostaria de uma análise rápida e gratuita da sua situação atual?`,
    ],
    WARM: [
      `Quer saber mais sobre como podemos ajudar?`,
      `Posso te enviar mais informações sobre nossas soluções?`,
      `Interessado em conhecer nossas opções?`,
    ],
    COLD: [
      `Se tiver interesse, ficarei feliz em compartilhar mais detalhes.`,
      `Quer conhecer nossas soluções? Só responder este email.`,
      `Caso queira explorar isso, estou à disposição.`,
    ],
  };
  
  const tierCTAs = ctas[tier];
  return tierCTAs[Math.floor(Math.random() * tierCTAs.length)];
}

/**
 * Generate personalized intro using GPT-4
 */
export async function generatePersonalizedIntro(
  input: PersonalizationInput,
  painPoints: string[],
  tier: LeadTier
): Promise<{ intro: string; promptTokens: number; completionTokens: number; generationTimeMs: number }> {
  const startTime = Date.now();
  
  // Build context for GPT-4
  const painPointsText = painPoints.length > 0
    ? `Pontos específicos identificados:\n${painPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
    : 'Dados limitados disponíveis.';
  
  const prompt = `Você é um especialista em vendas B2B escrevendo emails altamente personalizados.

INFORMAÇÕES DO LEAD:
- Nome: ${input.name}
- Empresa: ${input.empresa}
- Indústria: ${input.industry || 'não especificado'}
- Nicho: ${input.niche || 'geral'}
- Tier do Lead: ${tier}

${painPointsText}

TAREFA:
Escreva uma introdução personalizada de 2-3 frases para um email de outreach. A introdução deve:
1. Mencionar dados ESPECÍFICOS do lead (números, rankings, problemas identificados)
2. Demonstrar que você pesquisou a empresa
3. Criar curiosidade sobre como resolver o problema
4. Ser conversacional, não robótico
5. NÃO usar chavões ou frases genéricas

IMPORTANTE:
- Para leads VIP/HOT: Seja direto, mencione dados específicos e crie urgência
- Para leads WARM/COLD: Seja mais suave, focando em oferecer valor

Escreva APENAS a introdução (2-3 frases), sem saudação ou fechamento.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em vendas B2B que escreve emails altamente personalizados e baseados em dados.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    
    const generationTimeMs = Date.now() - startTime;
    const intro = completion.choices[0]?.message?.content?.trim() || '';
    
    return {
      intro,
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      generationTimeMs,
    };
  } catch (error) {
    console.error('[Personalization] Error generating intro:', error);
    
    // Fallback to template-based intro
    const fallbackIntro = generateFallbackIntro(input, painPoints, tier);
    return {
      intro: fallbackIntro,
      promptTokens: 0,
      completionTokens: 0,
      generationTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Fallback intro generation (template-based)
 */
function generateFallbackIntro(input: PersonalizationInput, painPoints: string[], tier: LeadTier): string {
  const name = input.name.split(' ')[0]; // First name
  
  if (painPoints.length > 0 && tier !== 'COLD') {
    return `Olá ${name}, notei que ${input.empresa} ${painPoints[0].toLowerCase()}. Tenho algumas ideias sobre como resolver isso e melhorar seus resultados rapidamente.`;
  }
  
  return `Olá ${name}, vi que ${input.empresa} está em ${input.niche || 'seu segmento'} e acredito que posso agregar valor com nossa solução especializada.`;
}

/**
 * Generate complete personalization for a lead
 */
export async function generatePersonalization(input: PersonalizationInput): Promise<PersonalizationResult> {
  // 1. Determine lead tier
  const leadTier = determineLeadTier(input);
  
  // 2. Extract pain points
  const painPoints = extractPainPoints(input);
  
  // 3. Calculate personalization score
  const personalizationScore = calculatePersonalizationScore(input, painPoints);
  
  // 4. Generate personalized intro with GPT-4
  const { intro, promptTokens, completionTokens, generationTimeMs } = await generatePersonalizedIntro(
    input,
    painPoints,
    leadTier
  );
  
  // 5. Generate appropriate CTA
  const ctaText = generateCTA(leadTier, input.niche);
  
  return {
    personalizedIntro: intro,
    painPoints,
    ctaText,
    ctaType: leadTier,
    personalizationScore,
    leadTier,
    inputData: input,
    aiMetadata: {
      model: 'gpt-4',
      promptTokens,
      completionTokens,
      generationTimeMs,
    },
  };
}

/**
 * Save personalization to database
 */
export async function savePersonalization(
  contactId: string,
  result: PersonalizationResult
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('lead_personalization')
      .upsert({
        contact_id: contactId,
        personalized_intro: result.personalizedIntro,
        pain_points: result.painPoints,
        cta_text: result.ctaText,
        cta_type: result.ctaType,
        personalization_score: result.personalizationScore,
        lead_tier: result.leadTier,
        input_data: result.inputData as any,
        ai_model: result.aiMetadata.model,
        ai_prompt_tokens: result.aiMetadata.promptTokens,
        ai_completion_tokens: result.aiMetadata.completionTokens,
        generation_time_ms: result.aiMetadata.generationTimeMs,
      });
    
    if (error) {
      console.error('[Personalization] Error saving:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Personalization] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get personalization for a contact
 */
export async function getPersonalization(contactId: string): Promise<PersonalizationResult | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('lead_personalization')
      .select('*')
      .eq('contact_id', contactId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      personalizedIntro: data.personalized_intro,
      painPoints: data.pain_points as string[],
      ctaText: data.cta_text,
      ctaType: data.cta_type as LeadTier,
      personalizationScore: data.personalization_score,
      leadTier: data.lead_tier as LeadTier,
      inputData: data.input_data as PersonalizationInput,
      aiMetadata: {
        model: data.ai_model,
        promptTokens: data.ai_prompt_tokens,
        completionTokens: data.ai_completion_tokens,
        generationTimeMs: data.generation_time_ms,
      },
    };
  } catch (error) {
    console.error('[Personalization] Error fetching:', error);
    return null;
  }
}
