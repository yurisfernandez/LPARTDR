import { createApp } from './app.js';
import { getConfig, assertConfig } from './config.js';
import { createSupabaseClient } from './supabase.js';

const config = getConfig();

try {
    assertConfig(config);
} catch (error) {
    console.error(`[startup] ${error.message}`);
    console.error('[startup] Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, INTERNAL_API_KEY, ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET');
    process.exit(1);
}

const supabase = createSupabaseClient(config);
const app = createApp({ config, supabase });

app.listen(config.port, '0.0.0.0', () => {
    console.log(`Leads panel running on http://localhost:${config.port}`);
});
