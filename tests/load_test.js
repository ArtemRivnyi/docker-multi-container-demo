import http from 'k6/http';
import { check, sleep } from 'k6';

// Read target scenario from environment variable (default to 'with_cache')
const SCENARIO = __ENV.SCENARIO || 'with_cache';

const BASE_URL = 'http://localhost/get';
const TEST_KEY = 'k6_test_key';
const NO_CACHE_KEY = 'uncached_key_' + Math.floor(Math.random() * 1000000); // Key that probably doesn't exist to simulate cache miss

// Setup a small load
export const options = {
    stages: [
        { duration: '5s', target: 50 },  // Ramp up to 50 users over 5 seconds
        { duration: '15s', target: 50 }, // Maintain 50 users for 15 seconds
        { duration: '5s', target: 0 },   // Ramp down to 0 users over 5 seconds
    ],
    thresholds: {
        // 95% of requests should complete within 200ms
        http_req_duration: ['p(95)<200'],
    },
};

export function setup() {
    // Before load test starts, ensure we have a key in Redis for the 'with_cache' scenario
    if (SCENARIO === 'with_cache') {
        const payload = JSON.stringify({ key: TEST_KEY, value: 'k6_test_data' });
        const params = { headers: { 'Content-Type': 'application/json' } };
        http.post('http://localhost/set', payload, params);
    }
}

export default function () {
    let url;
    if (SCENARIO === 'with_cache') {
        // Repeatedly hit the same key - Redis should serve this extremely fast
        url = `${BASE_URL}/${TEST_KEY}`;
    } else {
        // Hit a unique key each time to force a cache miss and execute API logic
        url = `${BASE_URL}/${NO_CACHE_KEY}_${__ITER}`;
    }

    const res = http.get(url, {
        headers: { 'Host': 'api.localhost' }
    });

    check(res, {
        'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
        'response time < 100ms': (r) => r.timings.duration < 100,
    });

    sleep(0.1); // Small sleep to pace the requests
}
