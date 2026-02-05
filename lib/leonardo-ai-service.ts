/**
 * Leonardo AI Service
 * 
 * Generates personalized visual analysis images for leads using Leonardo AI
 */

import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (openaiInstance) return openaiInstance;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  openaiInstance = new OpenAI({ apiKey });
  return openaiInstance;
}

interface LeonardoImageGenerationInput {
  leadName?: string;
  leadCompany: string;
  leadLocation?: string;
  leadWebsite?: string;
  leadNiche?: string;
  painPoints?: string[];
  competitorCount?: number;
  googleRanking?: number;
  googleRating?: number;
  googleReviews?: number;
  businessQualityScore?: number;
  businessQualityTier?: string;
  opportunities?: string[];
}

interface LeonardoImageResult {
  success: boolean;
  imageUrl?: string;
  generationId?: string;
  error?: string;
}

/**
 * Generate AI-powered prompt for Leonardo AI based on lead data
 */
async function generateLeonardoPrompt(
  input: LeonardoImageGenerationInput
): Promise<{ success: boolean; prompt?: string; error?: string }> {
  try {
    const openai = getOpenAI();
    if (!openai) {
      return { success: false, error: 'OPENAI_API_KEY not configured. Set the OPENAI_API_KEY environment variable.' };
    }

    if (!process.env.LEONARDO_API_KEY) {
      return { success: false, error: 'LEONARDO_API_KEY not configured. Set the LEONARDO_API_KEY environment variable.' };
    }

    const prompt = `You are an expert at creating prompts for professional business analysis infographics. Generate a detailed, specific prompt for Leonardo AI to create a personalized visual analysis image.

Business Information:
- Company Name: ${input.leadCompany}
- Contact Name: ${input.leadName || 'Not provided'}
- Location: ${input.leadLocation || 'Not provided'}
- Website: ${input.leadWebsite || 'Not provided'}
- Industry/Niche: ${input.leadNiche || 'General business'}

Key Metrics:
${input.googleRanking ? `- Google Maps Ranking: #${input.googleRanking}` : ''}
${input.googleRating ? `- Google Rating: ${input.googleRating}/5` : ''}
${input.googleReviews ? `- Reviews: ${input.googleReviews}` : ''}
${input.businessQualityScore ? `- Business Quality Score: ${input.businessQualityScore}/100` : ''}
${input.businessQualityTier ? `- Quality Tier: ${input.businessQualityTier}` : ''}

Pain Points:
${input.painPoints && input.painPoints.length > 0
  ? input.painPoints.map((p, i) => `- ${i + 1}. ${p}`).join('\n')
  : '- Not identified'}

Competitive Insights:
${input.competitorCount ? `- Competitors Identified: ${input.competitorCount}` : '- Not analyzed'}

Opportunities:
${input.opportunities && input.opportunities.length > 0
  ? input.opportunities.map((o, i) => `- ${i + 1}. ${o}`).join('\n')
  : '- Not identified'}

Requirements:
1. Create a professional business analysis infographic
2. Include the company name "${input.leadCompany}" prominently
3. Display key metrics visually (charts, numbers, ratings)
4. Highlight main pain points if identified
5. Show competitive positioning if available
6. Modern, clean design suitable for email and WhatsApp sharing
7. Professional color scheme appropriate for business
8. Include data visualization elements (charts, graphs, icons)
9. Make it attention-grabbing but professional
10. Ensure text is readable and well-organized

Return ONLY a single, detailed prompt (no JSON, no markdown, just the prompt text) that Leonardo AI can use to generate this image. The prompt should be specific, descriptive, and include all relevant visual elements.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating detailed prompts for AI image generation. Always return only the prompt text, no additional formatting or explanation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const generatedPrompt = completion.choices[0]?.message?.content?.trim();
    if (!generatedPrompt) {
      return { success: false, error: 'No prompt generated from OpenAI' };
    }

    return { success: true, prompt: generatedPrompt };
  } catch (error) {
    console.error('[LeonardoAI] Error generating prompt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating prompt',
    };
  }
}

/**
 * Call Leonardo AI API to generate image
 */
async function callLeonardoAPI(
  prompt: string
): Promise<{ success: boolean; generationId?: string; error?: string }> {
  try {
    const apiKey = process.env.LEONARDO_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'LEONARDO_API_KEY not configured' };
    }

    const apiUrl = process.env.LEONARDO_API_URL || 'https://cloud.leonardo.ai/api/rest/v1';
    const modelId = process.env.LEONARDO_MODEL_ID || '6bef9f1b-29eb-4322-9e0c-66c551b158c1';

    const response = await fetch(`${apiUrl}/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        modelId: modelId,
        width: 1024,
        height: 1024,
        num_images: 1,
        guidance_scale: 7,
        negative_prompt: 'blurry, low quality, unprofessional, cluttered, text-heavy, hard to read, distorted text, watermark, signature',
        presetStyle: 'LEONARDO',
        num_inference_steps: 30,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LeonardoAI] API error:', response.status, errorText);
      return {
        success: false,
        error: `Leonardo AI API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    const generationId = data?.sdGenerationJob?.generationId;

    if (!generationId) {
      return { success: false, error: 'No generation ID returned from Leonardo AI' };
    }

    return { success: true, generationId };
  } catch (error) {
    console.error('[LeonardoAI] Error calling API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error calling Leonardo AI',
    };
  }
}

/**
 * Poll Leonardo AI for image completion
 */
async function pollForImage(
  generationId: string,
  maxAttempts: number = 30,
  intervalMs: number = 1000
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const apiKey = process.env.LEONARDO_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'LEONARDO_API_KEY not configured' };
    }

    const apiUrl = process.env.LEONARDO_API_URL || 'https://cloud.leonardo.ai/api/rest/v1';

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));

      const response = await fetch(`${apiUrl}/generations/${generationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        if (attempt === maxAttempts - 1) {
          return { success: false, error: `Failed to get generation status: ${response.status}` };
        }
        continue;
      }

      const data = await response.json();
      const generation = data?.generations_by_pk;

      if (generation?.generated_images && generation.generated_images.length > 0) {
        const imageUrl = generation.generated_images[0]?.url;
        if (imageUrl) {
          return { success: true, imageUrl };
        }
      }

      // Check if generation failed
      if (generation?.status === 'FAILED' || generation?.status === 'CANCELLED') {
        return { success: false, error: `Image generation failed: ${generation.status}` };
      }
    }

    return { success: false, error: 'Image generation timed out' };
  } catch (error) {
    console.error('[LeonardoAI] Error polling for image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error polling for image',
    };
  }
}

/**
 * Generate Leonardo AI image for a lead
 */
export async function generateLeonardoImage(
  input: LeonardoImageGenerationInput
): Promise<LeonardoImageResult> {
  try {
    // Step 1: Generate AI prompt
    const promptResult = await generateLeonardoPrompt(input);
    if (!promptResult.success || !promptResult.prompt) {
      return { success: false, error: promptResult.error || 'Failed to generate prompt' };
    }

    console.log('[LeonardoAI] Generated prompt:', promptResult.prompt.substring(0, 100) + '...');

    // Step 2: Call Leonardo AI API
    const apiResult = await callLeonardoAPI(promptResult.prompt);
    if (!apiResult.success || !apiResult.generationId) {
      return { success: false, error: apiResult.error || 'Failed to start image generation' };
    }

    console.log('[LeonardoAI] Generation started:', apiResult.generationId);

    // Step 3: Poll for completion
    const imageResult = await pollForImage(apiResult.generationId);
    if (!imageResult.success || !imageResult.imageUrl) {
      return { success: false, error: imageResult.error || 'Failed to get image URL' };
    }

    console.log('[LeonardoAI] Image generated successfully:', imageResult.imageUrl);

    return {
      success: true,
      imageUrl: imageResult.imageUrl,
      generationId: apiResult.generationId,
    };
  } catch (error) {
    console.error('[LeonardoAI] Error generating image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating image',
    };
  }
}

/**
 * Check if a lead qualifies for image generation
 */
export function shouldGenerateImage(lead: {
  personalization?: { tier?: string };
  pain_points?: any;
  business_quality_tier?: string;
  business_quality_score?: number;
}): boolean {
  // Check quality tier (VIP, HOT, or WARM)
  const tier = lead.personalization?.tier || lead.business_quality_tier;
  const isHighQuality = tier === 'VIP' || tier === 'HOT' || tier === 'WARM';

  // Check if has pain points
  const hasPainPoints =
    (lead.pain_points && Array.isArray(lead.pain_points) && lead.pain_points.length > 0) ||
    (typeof lead.pain_points === 'object' && lead.pain_points !== null && Object.keys(lead.pain_points).length > 0);

  // Check business quality score (if available)
  const hasGoodScore = lead.business_quality_score && lead.business_quality_score >= 50;

  // Generate if: (high quality tier OR good score) AND has pain points
  return (isHighQuality || hasGoodScore) && hasPainPoints;
}
