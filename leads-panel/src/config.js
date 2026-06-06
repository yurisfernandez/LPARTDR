import dotenv from 'dotenv';

dotenv.config();

const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'INTERNAL_API_KEY',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'SESSION_SECRET'
];

export function getConfig() {
    return {
        port: Number(process.env.PORT || 3000),
        nodeEnv: process.env.NODE_ENV || 'development',
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        internalApiKey: process.env.INTERNAL_API_KEY,
        adminUsername: process.env.ADMIN_USERNAME,
        adminPassword: process.env.ADMIN_PASSWORD,
        sessionSecret: process.env.SESSION_SECRET,
        landingOrigin: process.env.LANDING_ORIGIN || '*'
    };
}

export function assertConfig(config) {
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (config.sessionSecret.length < 24) {
        throw new Error('SESSION_SECRET must be at least 24 characters long');
    }
}
