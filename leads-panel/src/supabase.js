import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(config) {
    return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
}
