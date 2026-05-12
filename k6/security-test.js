import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  scenarios: {
    sql_injection: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      exec: 'sqlInjectionTest',
    },
    brute_force: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'bruteForceTest',
      startTime: '5s',
    },
  },
};

// SQL Injection payloads (testing API resilience)
const sqlPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1; SELECT * FROM users",
  "admin'--",
  "' UNION SELECT * FROM users--",
  "<script>alert('xss')</script>",
  "{{7*7}}",
  "${7*7}",
];

export function sqlInjectionTest() {
  const headers = { 'Content-Type': 'application/json' };

  for (const payload of sqlPayloads) {
    // Test email field
    const res = http.post(
      `${BASE_URL}/api/candidates`,
      JSON.stringify({
        firstName: payload,
        lastName: payload,
        email: payload,
        position: payload,
        experience: 0,
        skills: [payload],
      }),
      { headers }
    );

    check(res, {
      'SQL injection rejected (401/422)': (r) => [401, 422, 403].includes(r.status),
      'No server error on injection': (r) => r.status !== 500,
    });

    // Test login endpoint
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: payload, password: payload }),
      { headers }
    );

    check(loginRes, {
      'Login injection rejected': (r) => [400, 401, 422].includes(r.status),
    });

    sleep(0.1);
  }

  console.log('✅ SQL injection tests completed');
}

export function bruteForceTest() {
  const headers = { 'Content-Type': 'application/json' };

  // Attempt brute force on login
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'victim@example.com',
      password: `password${Math.floor(Math.random() * 10000)}`,
    }),
    { headers }
  );

  check(res, {
    'Brute force eventually rate-limited': (r) => [401, 423, 429].includes(r.status),
    'No 500 errors': (r) => r.status !== 500,
  });

  sleep(0.1);
}
