import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

function createFakeSupabase() {
    const leads = [];

    return {
        leads,
        from(table) {
            assert.equal(table, 'leads');

            const builder = {
                insert(payload) {
                    const lead = {
                        id: `lead-${leads.length + 1}`,
                        created_at: new Date().toISOString(),
                        ...payload
                    };
                    leads.push(lead);

                    return {
                        select() {
                            return {
                                async single() {
                                    return { data: { id: lead.id, created_at: lead.created_at }, error: null };
                                }
                            };
                        }
                    };
                },
                select() {
                    return builder;
                },
                order() {
                    return builder;
                },
                limit() {
                    return Promise.resolve({ data: leads, error: null });
                },
                eq(field, value) {
                    builder.filter = { field, value };
                    return builder;
                },
                update(payload) {
                    builder.updatePayload = payload;
                    return builder;
                },
                async single() {
                    const lead = leads.find((item) => item.id === builder.filter?.value);
                    Object.assign(lead, builder.updatePayload);
                    return { data: { id: lead.id, status: lead.status }, error: null };
                },
                then(resolve) {
                    const filtered = builder.filter
                        ? leads.filter((item) => item[builder.filter.field] === builder.filter.value)
                        : leads;
                    resolve({ data: filtered, error: null });
                }
            };

            return builder;
        }
    };
}

function createTestApp() {
    const supabase = createFakeSupabase();
    const app = createApp({
        config: {
            internalApiKey: 'test-key',
            adminUsername: 'admin',
            adminPassword: 'secret',
            sessionSecret: 'test-session-secret-at-least-24',
            landingOrigin: '*'
        },
        supabase
    });

    return { app, supabase };
}

test('POST /api/leads creates a lead with a valid API key', async () => {
    const { app, supabase } = createTestApp();
    const response = await request(app)
        .post('/api/leads')
        .set('X-Internal-Api-Key', 'test-key')
        .send({
            nombre: 'Juan Perez',
            telefono: '11 1234-5678',
            lesion: 'Dolor lumbar',
            enBlanco: 'si',
            tiempo: 'menos18'
        });

    assert.equal(response.status, 201);
    assert.equal(response.body.ok, true);
    assert.equal(supabase.leads[0].status, 'new');
});

test('POST /api/leads rejects missing or invalid API key', async () => {
    const { app } = createTestApp();
    const response = await request(app)
        .post('/api/leads')
        .send({
            nombre: 'Juan Perez',
            telefono: '11 1234-5678',
            lesion: 'Dolor lumbar',
            enBlanco: 'si',
            tiempo: 'menos18'
        });

    assert.equal(response.status, 401);
});

test('POST /api/leads validates required fields', async () => {
    const { app } = createTestApp();
    const response = await request(app)
        .post('/api/leads')
        .set('X-Internal-Api-Key', 'test-key')
        .send({ nombre: '', telefono: '', lesion: '' });

    assert.equal(response.status, 400);
    assert.equal(response.body.error, 'Invalid lead');
});

test('GET /api/leads requires login', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/leads');

    assert.equal(response.status, 401);
});

test('login allows listing leads and updating status', async () => {
    const { app } = createTestApp();
    const agent = request.agent(app);

    await agent
        .post('/api/leads')
        .set('X-Internal-Api-Key', 'test-key')
        .send({
            nombre: 'Juan Perez',
            telefono: '11 1234-5678',
            lesion: 'Dolor lumbar',
            enBlanco: 'si',
            tiempo: 'menos18'
        })
        .expect(201);

    await agent
        .post('/api/login')
        .send({ username: 'admin', password: 'secret' })
        .expect(200);

    const listResponse = await agent.get('/api/leads').expect(200);
    assert.equal(listResponse.body.leads.length, 1);

    await agent
        .patch('/api/leads/lead-1')
        .send({ status: 'contacted' })
        .expect(200);
});
