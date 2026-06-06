import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VALID_STATUSES = new Set(['new', 'contacted', 'closed']);

function normalizeLead(body) {
    return {
        nombre: String(body.nombre || '').trim(),
        telefono: String(body.telefono || '').trim(),
        lesion: String(body.lesion || '').trim(),
        en_blanco: String(body.enBlanco || body.en_blanco || '').trim(),
        tiempo: String(body.tiempo || '').trim(),
        source: String(body.source || 'landing-art').trim()
    };
}

function getClientIp(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
        return forwardedFor.split(',')[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || null;
}

function requireLogin(req, res, next) {
    if (req.session?.authenticated === true) {
        next();
        return;
    }

    res.status(401).json({ error: 'Unauthorized' });
}

function requireInternalApiKey(config) {
    return (req, res, next) => {
        const apiKey = req.headers['x-internal-api-key'];

        if (!apiKey || apiKey !== config.internalApiKey) {
            res.status(401).json({ error: 'Invalid API key' });
            return;
        }

        next();
    };
}

function validateLead(lead) {
    const errors = [];

    if (!lead.nombre) errors.push('nombre is required');
    if (!lead.telefono) errors.push('telefono is required');
    if (!lead.lesion) errors.push('lesion is required');
    if (!['si', 'no'].includes(lead.en_blanco)) errors.push('enBlanco must be si or no');
    if (!['menos18', 'mas18'].includes(lead.tiempo)) errors.push('tiempo must be menos18 or mas18');

    return errors;
}

export function createApp({ config, supabase }) {
    const app = express();
    const publicDir = path.join(__dirname, '..', 'public');
    const corsOptions = config.landingOrigin === '*'
        ? { origin: true, credentials: true }
        : { origin: config.landingOrigin, credentials: true };

    app.set('trust proxy', 1);
    app.use(cors(corsOptions));
    app.use(express.json({ limit: '32kb' }));
    app.use(session({
        name: 'leads_panel_sid',
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: config.nodeEnv === 'production',
            maxAge: 1000 * 60 * 60 * 8
        }
    }));
    app.use(express.static(publicDir));

    app.get('/health', (req, res) => {
        res.json({ ok: true });
    });

    app.post('/api/login', (req, res) => {
        const username = String(req.body.username || '');
        const password = String(req.body.password || '');

        if (username !== config.adminUsername || password !== config.adminPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        req.session.authenticated = true;
        res.json({ ok: true });
    });

    app.post('/api/logout', requireLogin, (req, res) => {
        req.session.destroy(() => {
            res.clearCookie('leads_panel_sid');
            res.json({ ok: true });
        });
    });

    app.post('/api/leads', requireInternalApiKey(config), async (req, res, next) => {
        try {
            const lead = normalizeLead(req.body);
            const errors = validateLead(lead);

            if (errors.length > 0) {
                res.status(400).json({ error: 'Invalid lead', details: errors });
                return;
            }

            const payload = {
                ...lead,
                user_agent: req.get('user-agent') || null,
                ip: getClientIp(req),
                status: 'new'
            };
            const { data, error } = await supabase
                .from('leads')
                .insert(payload)
                .select('id, created_at')
                .single();

            if (error) throw error;

            res.status(201).json({ ok: true, lead: data });
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/leads', requireLogin, async (req, res, next) => {
        try {
            const status = String(req.query.status || '').trim();
            let query = supabase
                .from('leads')
                .select('id, created_at, nombre, telefono, lesion, en_blanco, tiempo, source, user_agent, ip, status')
                .order('created_at', { ascending: false })
                .limit(250);

            if (status && VALID_STATUSES.has(status)) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) throw error;

            res.json({ leads: data || [] });
        } catch (error) {
            next(error);
        }
    });

    app.patch('/api/leads/:id', requireLogin, async (req, res, next) => {
        try {
            const status = String(req.body.status || '').trim();

            if (!VALID_STATUSES.has(status)) {
                res.status(400).json({ error: 'Invalid status' });
                return;
            }

            const { data, error } = await supabase
                .from('leads')
                .update({ status })
                .eq('id', req.params.id)
                .select('id, status')
                .single();

            if (error) throw error;

            res.json({ ok: true, lead: data });
        } catch (error) {
            next(error);
        }
    });

    app.use((error, req, res, next) => {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    });

    return app;
}
