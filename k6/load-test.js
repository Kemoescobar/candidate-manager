import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time', true);
const successfulRequests = new Counter('successful_requests');

export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },   // Ramp up
        { duration: '1m', target: 500 },    // Peak: 500 VUs
        { duration: '30s', target: 0 },     // Ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],         // < 5% error rate
    error_rate: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Shared auth token (set via env or login once)
let authToken = __ENV.AUTH_TOKEN || '';

export function setup() {
  // Login to get a token
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'loadtest@test.com', password: 'Password123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body as string);
    return { token: body.data?.token || '' };
  }

  // Try to register first
  http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({ email: 'loadtest@test.com', password: 'Password123', name: 'Load Tester' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const retryLogin = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'loadtest@test.com', password: 'Password123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const retryBody = JSON.parse(retryLogin.body as string);
  return { token: retryBody.data?.token || '' };
}

export default function (data: { token: string }) {
  const token = data.token || authToken;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const candidatePayload = JSON.stringify({
    firstName: `Test${__VU}`,
    lastName: `User${__ITER}`,
    email: `test.${__VU}.${__ITER}.${Date.now()}@loadtest.com`,
    position: 'Load Test Engineer',
    experience: Math.floor(Math.random() * 10),
    skills: ['k6', 'Performance Testing'],
  });

  // POST /api/candidates - main load test target
  const createRes = http.post(`${BASE_URL}/api/candidates`, candidatePayload, { headers });

  const createSuccess = check(createRes, {
    'create status 201': (r) => r.status === 201,
    'create has id': (r) => {
      try {
        return !!JSON.parse(r.body as string).data?.id;
      } catch {
        return false;
      }
    },
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!createSuccess);
  responseTime.add(createRes.timings.duration);
  if (createSuccess) successfulRequests.add(1);

  // GET /api/candidates - secondary test
  if (Math.random() < 0.3) {
    const listRes = http.get(`${BASE_URL}/api/candidates?page=1&limit=10`, { headers });
    check(listRes, {
      'list status 200': (r) => r.status === 200,
    });
  }

  sleep(Math.random() * 0.5 + 0.1); // 100-600ms think time
}

export function handleSummary(data: Record<string, unknown>) {
  return {
    'k6-report.json': JSON.stringify(data, null, 2),
    'k6-summary.txt': textSummary(data),
  };
}

function textSummary(data: Record<string, unknown>): string {
  const metrics = data.metrics as Record<string, { values?: Record<string, number>; value?: number }> || {};
  const dur = metrics['http_req_duration'];
  const failed = metrics['http_req_failed'];
  const reqs = metrics['http_reqs'];

  return `
============================
K6 LOAD TEST REPORT
============================
Total Requests:     ${reqs?.values?.['count'] ?? 'N/A'}
Request Rate:       ${typeof reqs?.values?.['rate'] === 'number' ? reqs.values['rate'].toFixed(2) : 'N/A'} req/s
Error Rate:         ${typeof failed?.values?.['rate'] === 'number' ? (failed.values['rate'] * 100).toFixed(2) : 'N/A'}%

Response Times:
  Median (p50):     ${dur?.values?.['med'] != null ? dur.values['med'].toFixed(0) : 'N/A'}ms
  p90:              ${dur?.values?.['p(90)'] != null ? dur.values['p(90)'].toFixed(0) : 'N/A'}ms
  p95:              ${dur?.values?.['p(95)'] != null ? dur.values['p(95)'].toFixed(0) : 'N/A'}ms
  p99:              ${dur?.values?.['p(99)'] != null ? dur.values['p(99)'].toFixed(0) : 'N/A'}ms
  Max:              ${dur?.values?.['max'] != null ? dur.values['max'].toFixed(0) : 'N/A'}ms
============================
`;
}
