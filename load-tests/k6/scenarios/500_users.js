/**
 * GYM Management System — Load Test: 500 Concurrent Users
 * =========================================================
 * Stress test: 5× baseline load to identify saturation points
 *
 * Run: k6 run --out json=../../results/raw_500.json 500_users.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';

// ── Custom Metrics ─────────────────────────────────────────────────────────────
const apiErrors       = new Counter('gym_api_errors');
const authSuccess     = new Rate('gym_auth_success_rate');
const memberFetch     = new Trend('gym_member_fetch_ms');
const attendanceTrend = new Trend('gym_attendance_ms');
const analyticsTrend  = new Trend('gym_analytics_ms');
const wsConnectTime   = new Trend('gym_ws_connect_ms');
const dbWriteTime     = new Trend('gym_db_write_ms');
const rateLimitHits   = new Counter('gym_rate_limit_hits');
const timeoutErrors   = new Counter('gym_timeout_errors');
const activeConns     = new Gauge('gym_active_connections');

export const options = {
  scenarios: {
    api_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 50  },   // Warm-up
        { duration: '10s', target: 250 },   // Ramp to 250 VUs
        { duration: '10s', target: 500 },   // Ramp to 500 VUs
        { duration: '45s', target: 500 },   // Hold at 500 VUs (stress hold)
        { duration: '10s', target: 0   },   // Cool-down
      ],
      tags: { scenario: 'api_stress_500' },
    },
    socket_stress: {
      executor: 'constant-vus',
      vus: 100,
      duration: '85s',
      tags: { scenario: 'socket_stress_500' },
      exec: 'socketScenario',
    },
    // Spike scenario: sudden burst to detect race conditions
    spike_burst: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 0   },
        { duration: '5s',  target: 400 },   // ← Sudden spike
        { duration: '20s',  target: 400 },
        { duration: '5s',  target: 0   },
      ],
      startTime: '25s',                       // Fire spike mid-test
      tags: { scenario: 'spike_500' },
      exec: 'spikeScenario',
    },
  },

  thresholds: {
    'http_req_duration':             ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed':               ['rate<0.05'],          // < 5% under stress
    'gym_member_fetch_ms':           ['p(95)<800'],
    'gym_attendance_ms':             ['p(95)<600'],
    'gym_auth_success_rate':         ['rate>0.90'],
    'gym_ws_connect_ms':             ['p(95)<3000'],
    'gym_db_write_ms':               ['p(95)<1500'],
    'gym_timeout_errors':            ['count<50'],           // Timeout budget
  },
  summaryTrendStats: ['min', 'avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const BASE_URL  = __ENV.BASE_URL  || 'http://localhost:5000';
const JWT_TOKEN = __ENV.JWT_TOKEN || 'YOUR_TEST_JWT_TOKEN_HERE';

const AUTH_HEADERS = {
  'Authorization': `Bearer ${JWT_TOKEN}`,
  'Content-Type':  'application/json',
};

function authGet(path, tag) {
  const start = Date.now();
  const res = http.get(`${BASE_URL}${path}`, {
    headers: AUTH_HEADERS,
    tags: { name: tag },
    timeout: '15s',
  });
  if (res.status === 0) timeoutErrors.add(1);
  if (res.status === 429) rateLimitHits.add(1);
  return { res, duration: Date.now() - start };
}

function authPost(path, body, tag) {
  const start = Date.now();
  const res = http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: AUTH_HEADERS,
    tags: { name: tag },
    timeout: '15s',
  });
  if (res.status === 0) timeoutErrors.add(1);
  if (res.status === 429) rateLimitHits.add(1);
  return { res, duration: Date.now() - start };
}

// ── Main API Stress Scenario ───────────────────────────────────────────────────
export default function () {
  activeConns.add(1);

  group('health_check', () => {
    const res = http.get(`${BASE_URL}/health`, { timeout: '5s' });
    check(res, { 'health: alive': r => r.status === 200 });
  });

  group('auth', () => {
    const { res } = authPost('/api/auth/login', {
      email:    __ENV.TEST_EMAIL    || 'admin@testgym.com',
      password: __ENV.TEST_PASSWORD || 'TestPass123!',
    }, 'auth_login');
    const ok = check(res, {
      'auth: 200 or 429': r => r.status === 200 || r.status === 429,
    });
    authSuccess.add(res.status === 200);
    if (!ok && res.status !== 429) apiErrors.add(1);
  });

  sleep(0.3);

  group('members', () => {
    const page = Math.floor(Math.random() * 20) + 1;
    const { res, duration } = authGet(`/api/members?page=${page}&limit=20`, 'member_list');
    memberFetch.add(duration);
    check(res, { 'members: valid response': r => [200, 401, 429].includes(r.status) });
  });

  sleep(0.2);

  group('attendance', () => {
    const { res, duration } = authGet('/api/attendance/today', 'attendance_today');
    attendanceTrend.add(duration);
    check(res, { 'attendance: valid response': r => [200, 401, 429].includes(r.status) });
  });

  sleep(0.2);

  // Write stress — tests DB connection pool saturation
  group('analytics_write_stress', () => {
    const start = Date.now();
    const { res } = authPost('/api/analytics/log', {
      event:    'STRESS_TEST_500',
      path:     '/stress-test',
      metadata: { vu: __VU, iter: __ITER, concurrent: 500 },
    }, 'analytics_log');
    dbWriteTime.add(Date.now() - start);
    const ok = check(res, { 'db write: accepted': r => [200, 429].includes(r.status) });
    if (!ok) apiErrors.add(1);
  });

  sleep(0.3);

  group('notifications', () => {
    const { res } = authGet('/api/notifications', 'notifications_list');
    check(res, { 'notifications: valid': r => [200, 401, 429].includes(r.status) });
  });

  sleep(0.2);
  activeConns.add(-1);
}

// ── Socket Stress Scenario ─────────────────────────────────────────────────────
export function socketScenario() {
  const WS_URL = BASE_URL.replace('http', 'ws') + '/socket.io/?EIO=4&transport=websocket';
  const start  = Date.now();

  const res = ws.connect(WS_URL, {
    headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
  }, function (socket) {
    wsConnectTime.add(Date.now() - start);

    socket.on('open', () => { socket.send('40'); });

    let messageCount = 0;
    socket.on('message', () => { messageCount++; });
    socket.on('error',   () => { apiErrors.add(1); });

    socket.setTimeout(() => {
      socket.send('41');
      socket.close();
    }, 45000);
  });

  check(res, { 'ws: connection accepted': r => r && r.status === 101 });
  sleep(1);
}

// ── Spike Scenario (Race Condition Detection) ──────────────────────────────────
export function spikeScenario() {
  // Rapid concurrent attendance check-ins — most likely race condition trigger
  group('race_condition_probe', () => {
    const res = authPost('/api/attendance/check-in', {
      memberId: `test-member-${Math.floor(Math.random() * 10) + 1}`,
    }, 'attendance_checkin_spike');
    check(res.res, {
      'spike: no server crash': r => r.status !== 500,
      'spike: no 503':          r => r.status !== 503,
    });
    if (res.res.status === 500) apiErrors.add(1);
  });

  sleep(0.1);  // Very tight loop to maximise concurrency pressure
}

// ── Summary Hook ──────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const metrics = data.metrics;
  const score   = computeScore(metrics);

  const rateLimitCount = metrics['gym_rate_limit_hits']?.values?.count || 0;
  const timeoutCount   = metrics['gym_timeout_errors']?.values?.count  || 0;

  const bottlenecks = detectBottlenecks(metrics);

  const report = {
    scenario:          '500_users',
    timestamp:         new Date().toISOString(),
    performance_score: score,
    verdict:           score >= 70 ? 'PASS ✅' : score >= 50 ? 'WARN ⚠️' : 'FAIL ❌',
    metrics: {
      api_throughput_rps:   metrics['http_reqs']?.values?.rate?.toFixed(2)            || 'N/A',
      api_latency_p95_ms:   metrics['http_req_duration']?.values?.['p(95)']?.toFixed(2) || 'N/A',
      api_latency_p99_ms:   metrics['http_req_duration']?.values?.['p(99)']?.toFixed(2) || 'N/A',
      api_error_rate_pct:  ((metrics['http_req_failed']?.values?.rate || 0) * 100).toFixed(2),
      auth_success_rate:   (metrics['gym_auth_success_rate']?.values?.rate * 100)?.toFixed(2),
      ws_connect_p95_ms:    metrics['gym_ws_connect_ms']?.values?.['p(95)']?.toFixed(2) || 'N/A',
      db_write_p95_ms:      metrics['gym_db_write_ms']?.values?.['p(95)']?.toFixed(2)   || 'N/A',
      rate_limit_hits:      rateLimitCount,
      timeout_errors:       timeoutCount,
      total_requests:       metrics['http_reqs']?.values?.count || 0,
    },
    bottlenecks,
  };

  return {
    'results/report_500.json': JSON.stringify(report, null, 2),
    stdout: buildConsoleReport(report),
  };
}

function computeScore(metrics) {
  let score = 100;
  const errorRate  = (metrics['http_req_failed']?.values?.rate || 0) * 100;
  const p95        = metrics['http_req_duration']?.values?.['p(95)'] || 0;
  const authRate   = (metrics['gym_auth_success_rate']?.values?.rate || 1) * 100;
  const throughput = metrics['http_reqs']?.values?.rate || 0;
  const timeouts   = metrics['gym_timeout_errors']?.values?.count || 0;
  const rateLimits = metrics['gym_rate_limit_hits']?.values?.count || 0;

  if (errorRate > 10) score -= 30;
  else if (errorRate > 5) score -= 20;
  else if (errorRate > 2) score -= 10;

  if (p95 > 3000) score -= 25;
  else if (p95 > 1000) score -= 15;
  else if (p95 > 500)  score -= 5;

  if (authRate < 70) score -= 20;
  else if (authRate < 90) score -= 10;

  if (throughput < 200) score -= 15;
  else if (throughput < 400) score -= 8;

  if (timeouts > 100) score -= 10;
  else if (timeouts > 20) score -= 5;

  if (rateLimits > 500) score -= 10;
  else if (rateLimits > 100) score -= 5;

  return Math.max(0, Math.round(score));
}

function detectBottlenecks(metrics) {
  const issues = [];
  const p99    = metrics['http_req_duration']?.values?.['p(99)'] || 0;
  const dbP95  = metrics['gym_db_write_ms']?.values?.['p(95)']  || 0;
  const wsP95  = metrics['gym_ws_connect_ms']?.values?.['p(95)'] || 0;
  const rl     = metrics['gym_rate_limit_hits']?.values?.count  || 0;
  const to     = metrics['gym_timeout_errors']?.values?.count   || 0;
  const err    = (metrics['http_req_failed']?.values?.rate || 0) * 100;

  if (p99 > 2000)  issues.push({ type: 'LATENCY',     severity: 'HIGH',   detail: `API p99=${p99.toFixed(0)}ms — CPU or DB bottleneck likely` });
  if (dbP95 > 1000) issues.push({ type: 'DB_POOL',    severity: 'HIGH',   detail: `DB writes p95=${dbP95.toFixed(0)}ms — Pool max=20 may be saturated` });
  if (wsP95 > 3000) issues.push({ type: 'SOCKET',     severity: 'MEDIUM', detail: `WS connect p95=${wsP95.toFixed(0)}ms — Redis adapter contention possible` });
  if (rl > 200)    issues.push({ type: 'RATE_LIMIT',  severity: 'MEDIUM', detail: `${rl} rate-limit hits — 300 req/15m window being exhausted` });
  if (to > 20)     issues.push({ type: 'TIMEOUT',     severity: 'HIGH',   detail: `${to} timeouts — queue backlog or DB connection starvation` });
  if (err > 5)     issues.push({ type: 'ERROR_RATE',  severity: 'CRITICAL', detail: `${err.toFixed(1)}% error rate exceeds 5% SLA` });

  return issues.length > 0 ? issues : [{ type: 'NONE', severity: 'OK', detail: 'No bottlenecks detected' }];
}

function buildConsoleReport(r) {
  const bn = r.bottlenecks.map(b => `  [${b.severity}] ${b.type}: ${b.detail}`).join('\n');
  return `
╔══════════════════════════════════════════════════════════════╗
║          GYM STRESS TEST — 500 USERS — RESULTS              ║
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
║  Rate Limit Hits:    ${r.metrics.rate_limit_hits}                             
║  Timeout Errors:     ${r.metrics.timeout_errors}                              
║  Total Requests:     ${r.metrics.total_requests}                              
╠══════════════════════════════════════════════════════════════╣
║  BOTTLENECKS DETECTED:
${bn}
╚══════════════════════════════════════════════════════════════╝
`;
}
