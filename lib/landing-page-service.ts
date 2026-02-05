/**
 * Landing Page Generation Service
 * 
 * Generates sample landing page mockups for leads based on website performance
 * Available for ALL leads (not qualification-based)
 */

import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('Missing credentials. Set OPENAI_API_KEY environment variable.');
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

interface LandingPageGenerationInput {
  leadName?: string;
  leadCompany: string;
  leadLocation?: string;
  leadWebsite?: string;
  leadNiche?: string;
  leadIndustry?: string;
  seoScore?: number;
  pageScore?: number;
  businessDescription?: string;
  logoUrl?: string;
}

interface LandingPageResult {
  success: boolean;
  landingPageUrl?: string;
  generationId?: string;
  error?: string;
}

/**
 * Check if lead needs a landing page based on website performance
 */
export function shouldGenerateLandingPage(input: {
  seoScore?: number | null;
  pageScore?: number | null;
  hasWebsite?: boolean;
}): boolean {
  // Generate landing page if:
  // 1. Has website but poor SEO score (< 70)
  // 2. Has website but poor page score (< 70)
  // 3. No website at all (hasWebsite = false)
  
  const hasPoorPerformance = 
    (input.seoScore !== null && input.seoScore !== undefined && input.seoScore < 70) ||
    (input.pageScore !== null && input.pageScore !== undefined && input.pageScore < 70);
  
  const noWebsite = input.hasWebsite === false;
  
  return hasPoorPerformance || noWebsite;
}

/**
 * Generate AI-powered prompt for landing page mockup using Leonardo AI
 */
async function generateLandingPagePrompt(
  input: LandingPageGenerationInput
): Promise<{ success: boolean; prompt?: string; error?: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: 'OPENAI_API_KEY not configured' };
    }

    const performanceIssues: string[] = [];
    if (input.seoScore !== undefined && input.seoScore < 70) {
      performanceIssues.push(`SEO score: ${input.seoScore}/100 (needs improvement)`);
    }
    if (input.pageScore !== undefined && input.pageScore < 70) {
      performanceIssues.push(`Page performance: ${input.pageScore}/100 (needs optimization)`);
    }
    if (!input.leadWebsite) {
      performanceIssues.push('No website currently');
    }

    const prompt = `You are an expert at creating prompts for professional landing page mockups. Generate a detailed, specific prompt for Leonardo AI to create a high-quality landing page mockup.

Business Information:
- Company Name: ${input.leadCompany}
- Contact Name: ${input.leadName || 'Not provided'}
- Location: ${input.leadLocation || 'Not provided'}
- Current Website: ${input.leadWebsite || 'No website'}
- Industry/Niche: ${input.leadIndustry || input.leadNiche || 'General business'}
- Business Description: ${input.businessDescription || 'Not provided'}

Website Performance Issues:
${performanceIssues.length > 0 ? performanceIssues.map(issue => `- ${issue}`).join('\n') : '- Not analyzed'}

Requirements:
1. Create a professional, modern landing page mockup design
2. Include the company name "${input.leadCompany}" prominently in the header
3. Design should be conversion-focused with clear call-to-action buttons
4. Modern, clean design suitable for ${input.leadIndustry || input.leadNiche || 'business'} industry
5. Include hero section with compelling headline
6. Show key features/benefits section
7. Include testimonials/reviews section (if applicable)
8. Strong call-to-action buttons (e.g., "Get Started", "Contact Us", "Request Quote")
9. Mobile-responsive design preview
10. Professional color scheme appropriate for the industry
11. Include placeholder for logo if logo_url provided
12. Make it visually appealing and conversion-optimized
13. Show what a high-performing landing page would look like for this business

Return ONLY a single, detailed prompt (no JSON, no markdown, just the prompt text) that Leonardo AI can use to generate this landing page mockup. The prompt should be specific, descriptive, and include all relevant visual elements.`;

    const completion = await getOpenAI().chat.completions.create({
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
      max_tokens: 600,
    });

    const generatedPrompt = completion.choices[0]?.message?.content?.trim();
    if (!generatedPrompt) {
      return { success: false, error: 'No prompt generated from OpenAI' };
    }

    return { success: true, prompt: generatedPrompt };
  } catch (error) {
    console.error('[LandingPage] Error generating prompt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating prompt',
    };
  }
}

/**
 * Call Leonardo AI API to generate landing page mockup
 */
async function callLeonardoAPIForLandingPage(
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
        width: 1920, // Wider for landing page
        height: 1080, // Standard landing page aspect ratio
        num_images: 1,
        guidance_scale: 7,
        negative_prompt: 'blurry, low quality, unprofessional, cluttered, text-heavy, hard to read, distorted text, watermark, signature, incomplete design',
        presetStyle: 'LEONARDO',
        num_inference_steps: 30,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LandingPage] API error:', response.status, errorText);
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
    console.error('[LandingPage] Error calling API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error calling Leonardo AI',
    };
  }
}

/**
 * Poll Leonardo AI for landing page completion
 */
async function pollForLandingPage(
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
        return { success: false, error: `Landing page generation failed: ${generation.status}` };
      }
    }

    return { success: false, error: 'Landing page generation timed out' };
  } catch (error) {
    console.error('[LandingPage] Error polling for image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error polling for image',
    };
  }
}

/**
 * Generate landing page mockup for a lead
 */
export async function generateLandingPage(
  input: LandingPageGenerationInput
): Promise<LandingPageResult> {
  try {
    // Step 1: Generate AI prompt
    const promptResult = await generateLandingPagePrompt(input);
    if (!promptResult.success || !promptResult.prompt) {
      return { success: false, error: promptResult.error || 'Failed to generate prompt' };
    }

    console.log('[LandingPage] Generated prompt:', promptResult.prompt.substring(0, 100) + '...');

    // Step 2: Call Leonardo AI API
    const apiResult = await callLeonardoAPIForLandingPage(promptResult.prompt);
    if (!apiResult.success || !apiResult.generationId) {
      return { success: false, error: apiResult.error || 'Failed to start landing page generation' };
    }

    console.log('[LandingPage] Generation started:', apiResult.generationId);

    // Step 3: Poll for completion
    const imageResult = await pollForLandingPage(apiResult.generationId);
    if (!imageResult.success || !imageResult.imageUrl) {
      return { success: false, error: imageResult.error || 'Failed to get landing page URL' };
    }

    console.log('[LandingPage] Landing page generated successfully:', imageResult.imageUrl);

    return {
      success: true,
      landingPageUrl: imageResult.imageUrl,
      generationId: apiResult.generationId,
    };
  } catch (error) {
    console.error('[LandingPage] Error generating landing page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating landing page',
    };
  }
}
