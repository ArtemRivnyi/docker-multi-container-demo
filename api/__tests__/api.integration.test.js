const request = require('supertest');
const app = require('../server');
const client = require('../redis-client');

// Mock redis client
jest.mock('../redis-client', () => ({
    set: jest.fn(),
    get: jest.fn()
}));

describe('Integration Tests - Error Handling & Edge Cases', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // ─── 404 Handler Tests ───────────────────────────────────────────
    describe('404 - Undefined Routes', () => {
        it('should return 404 for GET /nonexistent', async () => {
            const res = await request(app).get('/nonexistent');
            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Endpoint not found');
        });

        it('should return 404 for POST /nonexistent', async () => {
            const res = await request(app).post('/nonexistent');
            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Endpoint not found');
        });

        it('should return 404 for PUT /unknown-route', async () => {
            const res = await request(app).put('/unknown-route');
            expect(res.statusCode).toEqual(404);
        });

        it('should include the attempted route in the error message', async () => {
            const res = await request(app).get('/this/path/does/not/exist');
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toContain('/this/path/does/not/exist');
        });
    });

    // ─── Redis Error Handling Tests ──────────────────────────────────
    describe('Redis Error Handling', () => {
        it('should return 500 when Redis SET fails', async () => {
            client.set.mockRejectedValue(new Error('Redis connection refused'));

            const res = await request(app)
                .post('/set')
                .send({ key: 'failKey', value: 'failValue' });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Failed to set key in Redis');
            expect(res.body).toHaveProperty('details', 'Redis connection refused');
        });

        it('should return 500 when Redis GET fails', async () => {
            client.get.mockRejectedValue(new Error('Redis timeout'));

            const res = await request(app).get('/get/someKey');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Failed to get key from Redis');
            expect(res.body).toHaveProperty('details', 'Redis timeout');
        });
    });

    // ─── Input Validation Tests ──────────────────────────────────────
    describe('POST /set - Input Validation', () => {
        it('should return 400 when body is completely empty', async () => {
            const res = await request(app)
                .post('/set')
                .send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should return 400 when only value is provided (no key)', async () => {
            const res = await request(app)
                .post('/set')
                .send({ value: 'orphanValue' });

            expect(res.statusCode).toEqual(400);
        });

        it('should return 400 when only key is provided (no value)', async () => {
            const res = await request(app)
                .post('/set')
                .send({ key: 'orphanKey' });

            expect(res.statusCode).toEqual(400);
        });

        it('should accept valid key-value with special characters', async () => {
            client.set.mockResolvedValue('OK');

            const res = await request(app)
                .post('/set')
                .send({ key: 'special-key_123', value: 'value with spaces & symbols!' });

            expect(res.statusCode).toEqual(200);
            expect(client.set).toHaveBeenCalledWith('special-key_123', 'value with spaces & symbols!');
        });
    });

    // ─── Root Endpoint Tests ─────────────────────────────────────────
    describe('GET / - API Information', () => {
        it('should return welcome message with correct structure', async () => {
            const res = await request(app).get('/');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('endpoints');
        });

        it('should list all available endpoints', async () => {
            const res = await request(app).get('/');

            expect(res.body.endpoints).toHaveProperty('set');
            expect(res.body.endpoints).toHaveProperty('get');
            expect(res.body.endpoints).toHaveProperty('health');
        });

        it('should have a valid ISO timestamp', async () => {
            const res = await request(app).get('/');
            const timestamp = new Date(res.body.timestamp);
            expect(timestamp.toISOString()).toBe(res.body.timestamp);
        });
    });

    // ─── Health Check Tests ──────────────────────────────────────────
    describe('GET /health - Extended Checks', () => {
        it('should return version information', async () => {
            const res = await request(app).get('/health');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('version');
            expect(res.body.version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        it('should return service name', async () => {
            const res = await request(app).get('/health');
            expect(res.body).toHaveProperty('service', 'Node.js API');
        });

        it('should return a valid timestamp', async () => {
            const res = await request(app).get('/health');
            const timestamp = new Date(res.body.timestamp);
            expect(timestamp).toBeInstanceOf(Date);
            expect(isNaN(timestamp.getTime())).toBe(false);
        });
    });

    // ─── Content-Type Tests ──────────────────────────────────────────
    describe('Response Headers', () => {
        it('should return JSON content type for all API endpoints', async () => {
            const endpoints = [
                { method: 'get', path: '/' },
                { method: 'get', path: '/health' },
            ];

            for (const endpoint of endpoints) {
                const res = await request(app)[endpoint.method](endpoint.path);
                expect(res.headers['content-type']).toMatch(/application\/json/);
            }
        });
    });
});
