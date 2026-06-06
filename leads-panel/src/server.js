import { createApp } from './app.js';
import { getConfig, assertConfig } from './config.js';
import { createSupabaseClient } from './supabase.js';

const config = getConfig();
assertConfig(config);

const supabase = createSupabaseClient(config);
const app = createApp({ config, supabase });

app.listen(config.port, () => {
    console.log(`Leads panel running on http://localhost:${config.port}`);
});
