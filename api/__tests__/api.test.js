const request = require('supertest');
const app = require('../server');
const client = require('../redis-client');

// Mock redis client
jest.mock('../redis-client', () => ({
    set: jest.fn(),
    get: jest.fn()
}));

describe('API Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /health', () => {
        it('should return health check information', async () => {
            const res = await request(app).get('/health');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('status', 'OK');
            expect(res.body).toHaveProperty('service', 'Node.js API');
        });
    });

    describe('GET /', () => {
        it('should return welcome message', async () => {
            const res = await request(app).get('/');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Hello from Dockerized Node.js API with Redis!');
        });
    });

    describe('POST /set', () => {
        it('should set key and value successfully', async () => {
            client.set.mockResolvedValue('OK');

            const res = await request(app)
                .post('/set')
                .send({ key: 'testKey', value: 'testValue' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('status', 'Key "testKey" set successfully!');
            expect(client.set).toHaveBeenCalledWith('testKey', 'testValue');
        });

        it('should return 400 if key or value is missing', async () => {
            const res = await request(app)
                .post('/set')
                .send({ key: 'testKey' });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('GET /get/:key', () => {
        it('should get value successfully', async () => {
            client.get.mockResolvedValue('testValue');

            const res = await request(app).get('/get/testKey');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('key', 'testKey');
            expect(res.body).toHaveProperty('value', 'testValue');
            expect(client.get).toHaveBeenCalledWith('testKey');
        });

        it('should return 404 if key is not found', async () => {
            client.get.mockResolvedValue(null);

            const res = await request(app).get('/get/testKey');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Key "testKey" not found.');
        });
    });
});
