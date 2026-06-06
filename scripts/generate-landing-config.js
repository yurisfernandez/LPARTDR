import { writeFileSync } from 'node:fs';

const required = ['LEADS_API_ENDPOINT', 'LEADS_API_KEY'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
    throw new Error(`Missing required landing environment variables: ${missing.join(', ')}`);
}

const config = [
    `window.LEADS_API_ENDPOINT = ${JSON.stringify(process.env.LEADS_API_ENDPOINT)};`,
    `window.LEADS_API_KEY = ${JSON.stringify(process.env.LEADS_API_KEY)};`,
    ''
].join('\n');

writeFileSync(new URL('../config.js', import.meta.url), config);

console.log('Generated config.js from landing environment variables.');
