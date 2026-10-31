import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'MY_SUPABASE_URL' &&
    supabaseKey !== 'MY_SUPABASE_KEY' &&
    supabaseUrl.startsWith('https://')
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl!, supabaseKey!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('[Supabase] Failed to initialize client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export interface SupabaseHealthResult {
  configured: boolean;
  connected: boolean;
  latencyMs?: number;
  message: string;
  error?: string;
  url?: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  if (!isSupabaseConfigured()) {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      configured: false,
      connected: false,
      message: isProd
        ? 'CONFIGURATION REQUIRED: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided for production PostgreSQL storage.'
        : 'Local resilient JSON storage active with atomic mutex lock. Provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to connect to Supabase PostgreSQL.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      configured: true,
      connected: false,
      message: 'Failed to instantiate Supabase client.',
      error: 'Client initialization error',
    };
  }

  const startTime = Date.now();
  try {
    // Attempt a light query against users or database schema
    const { data, error } = await client.from('users').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      // Table may not have been migrated yet or invalid key
      return {
        configured: true,
        connected: false,
        latencyMs,
        message: `Supabase reachable but query returned error: ${error.message}. Ensure database/supabase_schema.sql has been executed in the Supabase SQL editor.`,
        error: error.message,
        url: supabaseUrl,
      };
    }

    return {
      configured: true,
      connected: true,
      latencyMs,
      message: `Successfully connected to Supabase PostgreSQL (${latencyMs}ms latency).`,
      url: supabaseUrl,
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      message: `Failed to connect to Supabase: ${err.message}`,
      error: err.message,
      url: supabaseUrl,
    };
  }
}
