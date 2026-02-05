/**
 * AI Strategist Service
 * Analyzes campaign data and provides actionable insights and suggestions
 */

import OpenAI from 'openai';
import { supabaseAdmin } from './supabaseAdmin';

// Lazy-initialize OpenAI so build can succeed without OPENAI_API_KEY (only required at runtime)
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('Missing credentials. Set OPENAI_API_KEY environment variable.');
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

export interface AIStrategySuggestion {
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendedAction: string;
  category: 'personalization' | 'ab_testing' | 'send_time' | 'campaign_optimization' | 'lead_quality';
}

export interface CampaignAnalysisData {
  totalLeads: number;
  pendingLeads: number;
  sentLeads: number;
  vipLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  avgPersonalizationScore: number;
  totalCampaigns: number;
  activeCampaigns: number;
  unassignedLeads: number;
  personalizationStats: {
    withPersonalization: number;
    withoutPersonalization: number;
    avgScore: number;
    tierDistribution: {
      VIP: number;
      HOT: number;
      WARM: number;
      COLD: number;
    };
  };
  sendTimeStats: {
    withOptimalTime: number;
    withoutOptimalTime: number;
    avgConfidence: number;
  };
  abTestStats: {
    activeTests: number;
    completedTests: number;
    testsWithResults: number;
  };
}

/**
 * Analyze campaign data and generate AI-powered suggestions
 */
export async function generateAIStrategistSuggestions(
  analysisData: CampaignAnalysisData
): Promise<AIStrategySuggestion[]> {
  try {
    // Build analysis context for GPT-4
    const analysisContext = buildAnalysisContext(analysisData);

    // Generate suggestions using GPT-4
    const prompt = `You are an AI strategist analyzing campaign performance data. Based on the following data, provide 3-5 actionable suggestions to improve campaign performance.

Campaign Data:
${analysisContext}

For each suggestion, provide:
1. Title (in Portuguese, max 50 characters)
2. Impact level (HIGH, MEDIUM, or LOW)
3. Description (in Portuguese, 1-2 sentences explaining what the data shows)
4. Recommended Action (in Portuguese, 1-2 sentences with specific actionable steps)
5. Category (one of: personalization, ab_testing, send_time, campaign_optimization, lead_quality)

Focus on:
- Personalization improvements (if personalization scores are low or missing)
- A/B testing opportunities (if no tests are running)
- Send time optimization (ALWAYS include if send times aren't optimized or if many leads lack optimal send times - this is critical for maximizing open rates)
- Campaign organization (if many unassigned leads)
- Lead quality improvements (if tier distribution is poor)

IMPORTANT: If send time data shows that many leads don't have optimal send times configured, you MUST include a suggestion titled "Definir Horários de Envio Eficazes" with category "send_time". This is a critical optimization that directly impacts email open rates.

Return ONLY a valid JSON object with a "suggestions" array in this format:
{
  "suggestions": [
    {
      "title": "Aprimorar a Personalização",
      "impact": "HIGH",
      "description": "Os dados mostram que a personalização é um fator crítico...",
      "recommendedAction": "Desenvolver conteúdos de email personalizados...",
      "category": "personalization"
    }
  ]
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing strategist that analyzes campaign data and provides actionable, data-driven suggestions. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      // Note: Using text response and parsing JSON array manually
      // as json_object mode expects a single object, not an array
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return getFallbackSuggestions(analysisData);
    }

    // Parse JSON response
    const parsed = JSON.parse(responseContent);
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];

    // Validate and ensure we have suggestions
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return getFallbackSuggestions(analysisData);
    }

    // Validate each suggestion has required fields
    let validSuggestions = suggestions
      .filter((s: any) => s.title && s.impact && s.description && s.recommendedAction);
    
    // Ensure send time suggestion is included if relevant (merge with fallback if missing)
    const hasSendTimeSuggestion = validSuggestions.some((s: any) => s.category === 'send_time');
    const needsSendTimeSuggestion = analysisData.sendTimeStats.withoutOptimalTime > 0 || 
                                    (analysisData.sendTimeStats.withOptimalTime > 0 && analysisData.sendTimeStats.avgConfidence < 70);
    
    if (!hasSendTimeSuggestion && needsSendTimeSuggestion) {
      const sendTimeFallback = getFallbackSuggestions(analysisData).find((s) => s.category === 'send_time');
      if (sendTimeFallback) {
        // Add send time suggestion at the beginning to ensure visibility
        validSuggestions = [sendTimeFallback, ...validSuggestions];
      }
    }
    
    // Sort by impact (HIGH first) to ensure important suggestions appear first
    const impactOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    validSuggestions.sort((a: any, b: any) => {
      const impactDiff = impactOrder[a.impact as keyof typeof impactOrder] - impactOrder[b.impact as keyof typeof impactOrder];
      if (impactDiff !== 0) return impactDiff;
      // If same impact, prioritize send_time category
      if (a.category === 'send_time' && b.category !== 'send_time') return -1;
      if (b.category === 'send_time' && a.category !== 'send_time') return 1;
      return 0;
    });
    
    return validSuggestions.slice(0, 5); // Max 5 suggestions
  } catch (error) {
    console.error('[AI Strategist] Error generating suggestions:', error);
    return getFallbackSuggestions(analysisData);
  }
}

/**
 * Build analysis context string from data
 */
function buildAnalysisContext(data: CampaignAnalysisData): string {
  const context = [
    `Total Leads: ${data.totalLeads}`,
    `Pending: ${data.pendingLeads}, Sent: ${data.sentLeads}`,
    `Lead Tiers: VIP=${data.vipLeads}, HOT=${data.hotLeads}, WARM=${data.warmLeads}, COLD=${data.coldLeads}`,
    `Average Personalization Score: ${data.avgPersonalizationScore}%`,
    `Total Campaigns: ${data.totalCampaigns}, Active: ${data.activeCampaigns}`,
    `Unassigned Leads: ${data.unassignedLeads}`,
    `Personalization: ${data.personalizationStats.withPersonalization} with, ${data.personalizationStats.withoutPersonalization} without`,
    `Tier Distribution: VIP=${data.personalizationStats.tierDistribution.VIP}, HOT=${data.personalizationStats.tierDistribution.HOT}, WARM=${data.personalizationStats.tierDistribution.WARM}, COLD=${data.personalizationStats.tierDistribution.COLD}`,
    `Send Time Optimization: ${data.sendTimeStats.withOptimalTime} with optimal time, ${data.sendTimeStats.withoutOptimalTime} without`,
    `A/B Tests: ${data.abTestStats.activeTests} active, ${data.abTestStats.completedTests} completed`,
  ].join('\n');

  return context;
}

/**
 * Generate fallback suggestions based on data analysis (no AI)
 */
function getFallbackSuggestions(data: CampaignAnalysisData): AIStrategySuggestion[] {
  const suggestions: AIStrategySuggestion[] = [];

  // Personalization suggestion
  if (data.personalizationStats.withoutPersonalization > 0 || data.avgPersonalizationScore < 70) {
    suggestions.push({
      title: 'Aprimorar a Personalização',
      impact: data.avgPersonalizationScore < 50 ? 'HIGH' : 'MEDIUM',
      description: data.avgPersonalizationScore < 50
        ? 'A personalização está abaixo do ideal. Leads com personalização têm muito melhor desempenho.'
        : `A personalização é um fator crítico, especialmente nos tiers 'WARM' e 'HOT', com scores de ${data.avgPersonalizationScore}%.`,
      recommendedAction: 'Desenvolver conteúdos de email personalizados para esses tiers, focando nas necessidades e interesses específicos dos leads.',
      category: 'personalization',
    });
  }

  // A/B Testing suggestion
  if (data.abTestStats.activeTests === 0 && data.abTestStats.completedTests === 0) {
    suggestions.push({
      title: 'Implementar Testes A/B',
      impact: 'MEDIUM',
      description: 'Não foram realizados testes A/B, o que limita a capacidade de otimizar a abordagem de email.',
      recommendedAction: 'Criar e testar duas variantes de email para avaliar qual gera mais aberturas e cliques, focando em diferentes linhas de assunto ou chamadas à ação.',
      category: 'ab_testing',
    });
  }

  // Send Time suggestion - Always show if there are leads without optimal send times
  // Also show if confidence scores are low (below 70) OR if we have leads but no optimal times at all
  const needsSendTimeOptimization = 
    data.sendTimeStats.withoutOptimalTime > 0 || 
    (data.sendTimeStats.withOptimalTime > 0 && data.sendTimeStats.avgConfidence < 70) ||
    (data.totalLeads > 0 && data.sendTimeStats.withOptimalTime === 0); // Show if we have leads but no optimal times at all
  
  if (needsSendTimeOptimization || data.totalLeads > 0) {
    // Determine impact and description based on data
    let impact: 'HIGH' | 'MEDIUM' = 'MEDIUM';
    let description = '';
    let recommendedAction = '';
    
    if (data.sendTimeStats.withoutOptimalTime > data.sendTimeStats.withOptimalTime) {
      impact = 'HIGH';
      description = `A maioria dos leads (${data.sendTimeStats.withoutOptimalTime}) não possui horários de envio otimizados, o que reduz significativamente as taxas de abertura.`;
      recommendedAction = 'Configurar horários de envio otimizados para todos os leads pendentes. O sistema já calcula automaticamente os melhores horários baseado em dia da semana (prioriza terça-quinta, evita fins de semana) e histórico de aberturas.';
    } else if (data.sendTimeStats.avgConfidence < 70 && data.sendTimeStats.withOptimalTime > 0) {
      impact = 'MEDIUM';
      description = `Os horários de envio estão configurados, mas com baixa confiança (${data.sendTimeStats.avgConfidence}%). Otimizar os horários pode aumentar as taxas de abertura.`;
      recommendedAction = 'Revisar e otimizar os horários de envio existentes. O sistema pode recalcular horários otimizados baseado em dados históricos de abertura e padrões de comportamento.';
    } else if (data.totalLeads > 0 && data.sendTimeStats.withOptimalTime === 0) {
      impact = 'HIGH';
      description = `Nenhum lead possui horários de envio otimizados configurados. Configurar horários eficazes é essencial para maximizar as taxas de abertura de emails.`;
      recommendedAction = 'Ativar a otimização de horários de envio para todos os leads. O sistema calcula automaticamente os melhores horários baseado em: dia da semana (prioriza terça-quinta-feira, evita fins de semana), histórico de aberturas, e tipo de negócio.';
    } else {
      impact = 'MEDIUM';
      description = 'Otimizar horários de envio pode melhorar significativamente as taxas de abertura. O sistema já implementa lógica para evitar fins de semana e priorizar terça-quinta-feira.';
      recommendedAction = 'Revisar os horários de envio configurados e garantir que todos os leads pendentes tenham horários otimizados calculados automaticamente pelo sistema.';
    }
    
    suggestions.push({
      title: 'Definir Horários de Envio Eficazes',
      impact,
      description,
      recommendedAction,
      category: 'send_time',
    });
  }

  // Unassigned leads suggestion
  if (data.unassignedLeads > 0) {
    suggestions.push({
      title: 'Atribuir Leads Não Atribuídos',
      impact: data.unassignedLeads > 10 ? 'HIGH' : 'MEDIUM',
      description: `Existem ${data.unassignedLeads} leads não atribuídos que não estão sendo trabalhados.`,
      recommendedAction: 'Atribuir leads não atribuídos a SDRs para garantir que todos os leads sejam contactados.',
      category: 'campaign_optimization',
    });
  }

  // Lead quality suggestion
  if (data.coldLeads > data.vipLeads + data.hotLeads) {
    suggestions.push({
      title: 'Melhorar Qualidade dos Leads',
      impact: 'MEDIUM',
      description: `A maioria dos leads está no tier 'COLD' (${data.coldLeads}), indicando necessidade de melhorar a qualificação.`,
      recommendedAction: 'Revisar critérios de qualificação e focar em leads com maior potencial de conversão.',
      category: 'lead_quality',
    });
  }

  return suggestions.slice(0, 5);
}

/**
 * Fetch comprehensive analysis data for AI strategist
 */
export async function getCampaignAnalysisData(): Promise<CampaignAnalysisData> {
  try {
    // Get all leads
    const { data: leads } = await supabaseAdmin
      .from('campaign_contacts')
      .select('*');

    // Get campaigns
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('*');

    // Get personalization data
    const { data: personalizations } = await supabaseAdmin
      .from('lead_personalization')
      .select('*');

    // Get send time data
    const { data: sendTimes } = await supabaseAdmin
      .from('optimal_send_times')
      .select('*');

    // Get A/B test data
    const { data: abTests } = await supabaseAdmin
      .from('ab_test_campaigns')
      .select('*');

    const totalLeads = leads?.length || 0;
    const pendingLeads = leads?.filter((l: any) => l.status === 'pending').length || 0;
    const sentLeads = leads?.filter((l: any) => l.status === 'sent').length || 0;
    const unassignedLeads = leads?.filter((l: any) => !l.assigned_sdr_id).length || 0;

    // Personalization stats
    const personalizationMap = new Map();
    personalizations?.forEach((p: any) => {
      personalizationMap.set(p.contact_id, p);
    });

    const withPersonalization = personalizations?.length || 0;
    const withoutPersonalization = totalLeads - withPersonalization;
    const avgScore = personalizations?.length
      ? Math.round(
          personalizations.reduce((sum: number, p: any) => sum + (p.personalization_score || 0), 0) /
            personalizations.length
        )
      : 0;

    const tierDistribution = {
      VIP: personalizations?.filter((p: any) => p.lead_tier === 'VIP').length || 0,
      HOT: personalizations?.filter((p: any) => p.lead_tier === 'HOT').length || 0,
      WARM: personalizations?.filter((p: any) => p.lead_tier === 'WARM').length || 0,
      COLD: personalizations?.filter((p: any) => p.lead_tier === 'COLD').length || 0,
    };

    // Send time stats
    const withOptimalTime = sendTimes?.length || 0;
    const withoutOptimalTime = totalLeads - withOptimalTime;
    const avgConfidence = sendTimes?.length
      ? Math.round(
          sendTimes.reduce((sum: number, st: any) => sum + (st.confidence_score || 0), 0) /
            sendTimes.length
        )
      : 0;

    // A/B test stats
    const activeTests = abTests?.filter((t: any) => t.status === 'active').length || 0;
    const completedTests = abTests?.filter((t: any) => t.status === 'completed').length || 0;
    const testsWithResults = abTests?.filter((t: any) => t.status === 'completed').length || 0;

    return {
      totalLeads,
      pendingLeads,
      sentLeads,
      vipLeads: tierDistribution.VIP,
      hotLeads: tierDistribution.HOT,
      warmLeads: tierDistribution.WARM,
      coldLeads: tierDistribution.COLD,
      avgPersonalizationScore: avgScore,
      totalCampaigns: campaigns?.length || 0,
      activeCampaigns: campaigns?.filter((c: any) => c.status === 'active').length || 0,
      unassignedLeads,
      personalizationStats: {
        withPersonalization,
        withoutPersonalization,
        avgScore,
        tierDistribution,
      },
      sendTimeStats: {
        withOptimalTime,
        withoutOptimalTime,
        avgConfidence,
      },
      abTestStats: {
        activeTests,
        completedTests,
        testsWithResults,
      },
    };
  } catch (error) {
    console.error('[AI Strategist] Error fetching analysis data:', error);
    throw error;
  }
}
