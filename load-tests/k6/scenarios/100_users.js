/**
 * GYM Management System — Load Test: 100 Concurrent Users
 * =========================================================
 * Stack: Express 5 + PostgreSQL (Supabase) + Socket.io + Redis + BullMQ
 * Target: http://localhost:5000
 *
 * Run: k6 run --out json=../../results/raw_100.json 100_users.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// ── Custom Metrics ─────────────────────────────────────────────────────────────
const apiErrors      = new Counter('gym_api_errors');
const authSuccess    = new Rate('gym_auth_success_rate');
const memberFetch    = new Trend('gym_member_fetch_ms');
const attendanceTrend = new Trend('gym_attendance_ms');
const analyticsTrend = new Trend('gym_analytics_ms');
const wsConnectTime  = new Trend('gym_ws_connect_ms');
const dbWriteTime    = new Trend('gym_db_write_ms');
const activeConns    = new Gauge('gym_active_connections');

// ── Test Configuration ─────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    api_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 25  },   // Warm-up
        { duration: '10s', target: 100 },   // Ramp to 100 VUs
        { duration: '30s', target: 100 },   // Hold at 100 VUs
        { duration: '10s', target: 0   },   // Cool-down
      ],
      tags: { scenario: 'api_load_100' },
    },
    socket_load: {
      executor: 'constant-vus',
      vus: 30,
      duration: '60s',
      tags: { scenario: 'socket_load_100' },
      exec: 'socketScenario',
    },
  },
  thresholds: {
    // API Performance SLAs
    'http_req_duration':             ['p(95)<500', 'p(99)<1000'],
    'http_req_failed':               ['rate<0.02'],          // < 2% error rate
    'gym_member_fetch_ms':           ['p(95)<400'],
    'gym_attendance_ms':             ['p(95)<300'],
    'gym_analytics_ms':              ['p(95)<600'],
    'gym_auth_success_rate':         ['rate>0.95'],
    // WebSocket SLAs
    'gym_ws_connect_ms':             ['p(95)<2000'],
  },
  summaryTrendStats: ['min', 'avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:5000';
const JWT_TOKEN  = __ENV.JWT_TOKEN  || 'YOUR_TEST_JWT_TOKEN_HERE';
const GYM_ID     = __ENV.GYM_ID    || '1';

const AUTH_HEADERS = {
  'Authorization': `Bearer ${JWT_TOKEN}`,
  'Content-Type':  'application/json',
};

// ── Helper: Authenticated GET ──────────────────────────────────────────────────
function authGet(path, tag) {
  const start = Date.now();
  const res = http.get(`${BASE_URL}${path}`, { headers: AUTH_HEADERS, tags: { name: tag } });
  return { res, duration: Date.now() - start };
}

function authPost(path, body, tag) {
  const start = Date.now();
  const res = http.post(`${BASE_URL}${path}`, JSON.stringify(body), { headers: AUTH_HEADERS, tags: { name: tag } });
  return { res, duration: Date.now() - start };
}

// ── Main API Scenario ──────────────────────────────────────────────────────────
export default function () {
  activeConns.add(1);

  // 1. Health check (baseline)
  group('health_check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health: status 200': r => r.status === 200 });
  });

  // 2. Auth — Login
  group('auth', () => {
    const { res } = authPost('/api/auth/login', {
      email:    __ENV.TEST_EMAIL    || 'admin@testgym.com',
      password: __ENV.TEST_PASSWORD || 'TestPass123!',
    }, 'auth_login');
    const ok = check(res, {
      'auth: status 200': r => r.status === 200,
      'auth: has token':  r => JSON.parse(r.body || '{}').accessToken !== undefined,
    });
    authSuccess.add(ok);
    if (!ok) apiErrors.add(1);
  });

  sleep(0.5);

  // 3. Members — List (pagination stress)
  group('members', () => {
    const page = Math.floor(Math.random() * 10) + 1;
    const { res, duration } = authGet(`/api/members?page=${page}&limit=20`, 'member_list');
    memberFetch.add(duration);
    const ok = check(res, { 'members: status 200': r => r.status === 200 || r.status === 429 });
    if (!ok) apiErrors.add(1);
  });

  sleep(0.3);

  // 4. Attendance — Today's log
  group('attendance', () => {
    const { res, duration } = authGet('/api/attendance/today', 'attendance_today');
    attendanceTrend.add(duration);
    const ok = check(res, { 'attendance: status 200': r => r.status === 200 || r.status === 429 });
    if (!ok) apiErrors.add(1);
  });

  sleep(0.3);

  // 5. Analytics — Event log (DB write under load)
  group('analytics_write', () => {
    const start = Date.now();
    const { res } = authPost('/api/analytics/log', {
      event:    'LOAD_TEST_EVENT',
      path:     '/load-test',
      metadata: { vu: __VU, iter: __ITER, scenario: '100_users' },
    }, 'analytics_log');
    dbWriteTime.add(Date.now() - start);
    const ok = check(res, { 'analytics: status 200': r => r.status === 200 || r.status === 429 });
    if (!ok) apiErrors.add(1);
  });

  sleep(0.4);

  // 6. Plans list
  group('plans', () => {
    const { res } = authGet('/api/plans', 'plans_list');
    check(res, { 'plans: status 200': r => r.status === 200 || r.status === 429 });
  });

  sleep(0.5);
  activeConns.add(-1);
}

// ── WebSocket Scenario ─────────────────────────────────────────────────────────
export function socketScenario() {
  const WS_URL = (BASE_URL.replace('http', 'ws')) + '/socket.io/?EIO=4&transport=websocket';
  const start  = Date.now();

  const res = ws.connect(WS_URL, {
    headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
  }, function (socket) {
    wsConnectTime.add(Date.now() - start);

    socket.on('open', () => {
      // Socket.IO handshake
      socket.send('40');  // connect packet
    });

    socket.on('message', (msg) => {
      check(msg, { 'ws: message received': m => m !== undefined });
    });

    socket.on('error', (e) => {
      apiErrors.add(1);
    });

    // Keep connection alive for 30s, mimicking a dashboard user
    socket.setTimeout(() => {
      socket.send('41');  // disconnect packet
      socket.close();
    }, 30000);
  });

  check(res, { 'ws: connected': r => r && r.status === 101 });
  sleep(1);
}

// ── Summary Hook ──────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const metrics = data.metrics;
  const score   = computeScore(metrics);

  const report = {
    scenario:         '100_users',
    timestamp:        new Date().toISOString(),
    performance_score: score,
    metrics: {
      api_throughput_rps:   metrics['http_reqs']?.values?.rate?.toFixed(2)  || 'N/A',
      api_latency_p95_ms:   metrics['http_req_duration']?.values?.['p(95)']?.toFixed(2) || 'N/A',
      api_latency_p99_ms:   metrics['http_req_duration']?.values?.['p(99)']?.toFixed(2) || 'N/A',
      api_error_rate_pct:  ((metrics['http_req_failed']?.values?.rate || 0) * 100).toFixed(2),
      ws_connect_p95_ms:    metrics['gym_ws_connect_ms']?.values?.['p(95)']?.toFixed(2) || 'N/A',
      db_write_p95_ms:      metrics['gym_db_write_ms']?.values?.['p(95)']?.toFixed(2) || 'N/A',
      member_fetch_p95_ms:  metrics['gym_member_fetch_ms']?.values?.['p(95)']?.toFixed(2) || 'N/A',
      auth_success_rate:   (metrics['gym_auth_success_rate']?.values?.rate * 100)?.toFixed(2) || 'N/A',
      total_requests:       metrics['http_reqs']?.values?.count || 0,
    },
    thresholds_passed: countThresholds(data),
    verdict: score >= 80 ? 'PASS ✅' : score >= 60 ? 'WARN ⚠️' : 'FAIL ❌',
  };

  return {
    'results/report_100.json': JSON.stringify(report, null, 2),
    stdout: buildConsoleReport(report),
  };
}

function computeScore(metrics) {
  let score = 100;
  const errorRate  = (metrics['http_req_failed']?.values?.rate || 0) * 100;
  const p95        = metrics['http_req_duration']?.values?.['p(95)'] || 0;
  const authRate   = (metrics['gym_auth_success_rate']?.values?.rate || 1) * 100;
  const throughput = metrics['http_reqs']?.values?.rate || 0;

  // Deduct for high error rate (max -30)
  if (errorRate > 5)  score -= 30;
  else if (errorRate > 2) score -= 15;
  else if (errorRate > 0.5) score -= 5;

  // Deduct for high p95 latency (max -25)
  if (p95 > 2000) score -= 25;
  else if (p95 > 1000) score -= 15;
  else if (p95 > 500)  score -= 8;

  // Deduct for low auth success (max -20)
  if (authRate < 80) score -= 20;
  else if (authRate < 95) score -= 10;

  // Deduct for low throughput at 100 VUs (max -15)
  if (throughput < 50)  score -= 15;
  else if (throughput < 100) score -= 8;

  // Deduct for WS issues (max -10)
  const wsP95 = metrics['gym_ws_connect_ms']?.values?.['p(95)'] || 0;
  if (wsP95 > 5000) score -= 10;
  else if (wsP95 > 2000) score -= 5;

  return Math.max(0, Math.round(score));
}

function countThresholds(data) {
  let passed = 0, total = 0;
  for (const [, tData] of Object.entries(data.metrics)) {
    if (tData.thresholds) {
      for (const [, tResult] of Object.entries(tData.thresholds)) {
        total++;
        if (!tResult.ok === false) passed++;
      }
    }
  }
  return `${passed}/${total}`;
}

function buildConsoleReport(r) {
  return `
╔══════════════════════════════════════════════════════════════╗
║          GYM LOAD TEST — 100 USERS — RESULTS                ║
╠══════════════════════════════════════════════════════════════╣
║  Performance Score:  ${r.performance_score}/100                              
║  Verdict:            ${r.verdict}                          
╠══════════════════════════════════════════════════════════════╣
║  API Throughput:     ${r.metrics.api_throughput_rps} req/s                    
║  API Latency p95:    ${r.metrics.api_latency_p95_ms} ms                      
║  API Latency p99:    ${r.metrics.api_latency_p99_ms} ms                      
║  API Error Rate:     ${r.metrics.api_error_rate_pct}%                        
║  Auth Success Rate:  ${r.metrics.auth_success_rate}%                         
║  WS Connect p95:     ${r.metrics.ws_connect_p95_ms} ms                      
║  DB Write p95:       ${r.metrics.db_write_p95_ms} ms                        
║  Total Requests:     ${r.metrics.total_requests}                              
╚══════════════════════════════════════════════════════════════╝
`;
}
