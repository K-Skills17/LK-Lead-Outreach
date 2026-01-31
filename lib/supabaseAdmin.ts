/**
 * Supabase Admin Client
 * 
 * This module initializes a Supabase client with service-role key
 * for server-side operations. NEVER expose this to the client.
 * 
 * Usage:
 * import { supabaseAdmin } from '@/lib/supabaseAdmin';
 * const { data, error } = await supabaseAdmin.from('campaigns').select();
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Get Supabase Admin Client (lazy-loaded)
 * 
 * Uses service-role key to bypass Row Level Security (RLS)
 * and access all tables directly. Only use on server-side.
 * 
 * Creates the client on first use (not at module load time)
 * to avoid build-time errors when env vars are missing.
 */
function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminInstance;
}

/**
 * Supabase Admin Client
 * 
 * Use this in your API routes and server-side code.
 * It will be lazily initialized on first access.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = client[prop as keyof SupabaseClient];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// Export types for TypeScript
export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          license_key: string;
          email: string;
          clinic_name: string | null;
          tier: 'FREE' | 'PRO' | 'PREMIUM';
          verified_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          license_key: string;
          email: string;
          clinic_name?: string | null;
          tier: 'FREE' | 'PRO' | 'PREMIUM';
          verified_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          license_key?: string;
          email?: string;
          clinic_name?: string | null;
          tier?: 'FREE' | 'PRO' | 'PREMIUM';
          verified_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          clinic_id: string;
          name: string;
          status: 'draft' | 'active' | 'paused' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          status?: 'draft' | 'active' | 'paused' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          name?: string;
          status?: 'draft' | 'active' | 'paused' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
      };
      campaign_contacts: {
        Row: {
          id: string;
          campaign_id: string;
          name: string; // Keep for backward compatibility
          nome: string | null;
          empresa: string | null;
          cargo: string | null;
          site: string | null;
          dor_especifica: string | null;
          phone: string;
          status: 'pending' | 'sent' | 'failed';
          personalized_message: string | null;
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          name?: string; // Keep for backward compatibility
          nome?: string | null;
          empresa?: string | null;
          cargo?: string | null;
          site?: string | null;
          dor_especifica?: string | null;
          phone: string;
          status?: 'pending' | 'sent' | 'failed';
          personalized_message?: string | null;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          name?: string;
          nome?: string | null;
          empresa?: string | null;
          cargo?: string | null;
          site?: string | null;
          dor_especifica?: string | null;
          phone?: string;
          status?: 'pending' | 'sent' | 'failed';
          personalized_message?: string | null;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      message_drafts: {
        Row: {
          id: string;
          clinic_id: string;
          name: string;
          template_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          template_text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          name?: string;
          template_text?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      do_not_contact: {
        Row: {
          id: string;
          phone: string;
          reason: string | null;
          blocked_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          reason?: string | null;
          blocked_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          reason?: string | null;
          blocked_at?: string;
          created_at?: string;
        };
      };
      ai_usage_daily: {
        Row: {
          id: string;
          clinic_id: string;
          usage_date: string;
          count: number;
          tier: 'FREE' | 'PRO' | 'PREMIUM';
          daily_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          usage_date?: string;
          count?: number;
          tier: 'FREE' | 'PRO' | 'PREMIUM';
          daily_limit: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          usage_date?: string;
          count?: number;
          tier?: 'FREE' | 'PRO' | 'PREMIUM';
          daily_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
