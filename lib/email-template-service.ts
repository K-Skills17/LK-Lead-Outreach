/**
 * Email Template Service
 * 
 * Manages email templates, variable substitution, and template usage
 */

import { supabaseAdmin } from './supabaseAdmin';

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: string[];
  created_by_admin_email?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  times_used: number;
  last_used_at?: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables?: string[];
  created_by_admin_email?: string;
  is_active?: boolean;
}

/**
 * Create a new email template
 */
export async function createEmailTemplate(
  input: CreateTemplateInput
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    // Extract variables from content (look for {{variable}} patterns)
    const variablePattern = /\{\{(\w+)\}\}/g;
    const foundVariables = new Set<string>();
    
    [input.subject, input.html_content, input.text_content || ''].forEach(content => {
      if (content) {
        let match;
        while ((match = variablePattern.exec(content)) !== null) {
          foundVariables.add(match[1]);
        }
      }
    });
    
    const variables = input.variables || Array.from(foundVariables);
    
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        name: input.name,
        description: input.description,
        subject: input.subject,
        html_content: input.html_content,
        text_content: input.text_content,
        variables: variables as any,
        created_by_admin_email: input.created_by_admin_email,
        is_active: true,
      })
      .select('id')
      .single();
    
    if (error || !data) {
      console.error('[EmailTemplate] Error creating template:', error);
      return { success: false, error: error?.message || 'Failed to create template' };
    }
    
    return { success: true, templateId: data.id };
  } catch (error) {
    console.error('[EmailTemplate] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all active email templates
 */
export async function getEmailTemplates(includeInactive = false): Promise<EmailTemplate[]> {
  try {
    let query = supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[EmailTemplate] Error fetching templates:', error);
      return [];
    }
    
    return (data || []).map((t: any) => ({
      ...t,
      variables: t.variables || [],
    }));
  } catch (error) {
    console.error('[EmailTemplate] Error:', error);
    return [];
  }
}

/**
 * Get a single email template by ID
 */
export async function getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (error || !data) {
      console.error('[EmailTemplate] Error fetching template:', error);
      return null;
    }
    
    return {
      ...data,
      variables: data.variables || [],
    };
  } catch (error) {
    console.error('[EmailTemplate] Error:', error);
    return null;
  }
}

/**
 * Render template with variables
 */
export function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, string>
): { subject: string; html: string; text?: string } {
  let subject = template.subject;
  let html = template.html_content;
  let text = template.text_content;
  
  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    subject = subject.replace(pattern, value || '');
    html = html.replace(pattern, value || '');
    if (text) {
      text = text.replace(pattern, value || '');
    }
  });
  
  return { subject, html, text };
}

/**
 * Update email template
 */
export async function updateEmailTemplate(
  templateId: string,
  updates: Partial<CreateTemplateInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.subject) updateData.subject = updates.subject;
    if (updates.html_content) updateData.html_content = updates.html_content;
    if (updates.text_content !== undefined) updateData.text_content = updates.text_content;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    
    // Re-extract variables if content changed
    if (updates.subject || updates.html_content || updates.text_content) {
      const variablePattern = /\{\{(\w+)\}\}/g;
      const foundVariables = new Set<string>();
      
      [updateData.subject || updates.subject, 
       updateData.html_content || updates.html_content, 
       updateData.text_content || updates.text_content || ''].forEach(content => {
        if (content) {
          let match;
          while ((match = variablePattern.exec(content)) !== null) {
            foundVariables.add(match[1]);
          }
        }
      });
      
      updateData.variables = Array.from(foundVariables);
    }
    
    const { error } = await supabaseAdmin
      .from('email_templates')
      .update(updateData)
      .eq('id', templateId);
    
    if (error) {
      console.error('[EmailTemplate] Error updating template:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[EmailTemplate] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete email template
 */
export async function deleteEmailTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('email_templates')
      .delete()
      .eq('id', templateId);
    
    if (error) {
      console.error('[EmailTemplate] Error deleting template:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[EmailTemplate] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
