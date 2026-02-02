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

    const prompt = `You are an expert email copywriter specializing in B2B outreach. Generate 3 distinct email variations for A/B testing.

Lead Information:
- Company: ${input.leadCompany}
- Contact Name: ${input.leadName || 'Not provided'}
- Role: ${input.leadRole || 'Not provided'}
- Pain Point: ${input.leadPainPoint || 'Not provided'}
- Website: ${input.leadWebsite || 'Not provided'}
- Niche: ${input.niche || 'General business'}
- Business Context: ${input.businessContext || 'Not provided'}

Requirements:
1. Create 3 distinct variations with different approaches:
   - Variation 1: "Direct" - Straightforward, value-focused, clear CTA
   - Variation 2: "Question" - Opens with a thought-provoking question, consultative approach
   - Variation 3: "Story" - Uses a brief case study or story, builds connection

2. Each email should:
   - Be personalized to the company/contact
   - Be concise (150-200 words)
   - Include a clear call-to-action
   - Use ${input.tone || 'professional'} tone
   - Be suitable for B2B outreach

3. Subject lines should be:
   - Compelling and relevant
   - Different for each variation
   - 50 characters or less

4. HTML content should be:
   - Professional email format
   - Include proper structure (greeting, body, CTA)
   - Use simple HTML (no complex styling)

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
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email copywriter. Always return valid JSON only, no additional text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
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
