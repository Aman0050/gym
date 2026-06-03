/**
 * GYM Management System — Load Test: 1000 Concurrent Users
 * ==========================================================
 * Full stress test: 10× baseline — identifies breaking points,
 * queue backlogs, race conditions & timeout cascades
 *
 * Run: k6 run --out json=../../results/raw_1000.json 1000_users.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';

// ── Custom Metrics ─────────────────────────────────────────────────────────────
const apiErrors        = new Counter('gym_api_errors');
const authSuccess      = new Rate('gym_auth_success_rate');
const memberFetch      = new Trend('gym_member_fetch_ms');
const attendanceTrend  = new Trend('gym_attendance_ms');
const dbWriteTime      = new Trend('gym_db_write_ms');
const wsConnectTime    = new Trend('gym_ws_connect_ms');
const rateLimitHits    = new Counter('gym_rate_limit_hits');
const timeoutErrors    = new Counter('gym_timeout_errors');
const serverErrors     = new Counter('gym_server_errors_5xx');
const raceCondHits     = new Counter('gym_race_condition_hits');
const queueBacklog     = new Counter('gym_queue_backlog_proxy');
const activeConns      = new Gauge('gym_active_connections');

export const options = {
  scenarios: {
    // PRIMARY: Maximum sustained load
    api_breaking_point: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100  },
        { duration: '10s', target: 500  },
        { duration: '10s', target: 1000 },
        { duration: '60s', target: 1000 },   // 60-sec max pressure
        { duration: '10s', target: 0    },
      ],
      tags: { scenario: 'breaking_point_1000' },
    },
    // SOCKET: 200 concurrent socket users to stress Redis adapter
    socket_max: {
      executor: 'constant-vus',
      vus: 200,
      duration: '100s',
      tags: { scenario: 'socket_max_1000' },
      exec: 'socketScenario',
    },
    // RACE CONDITION: Simultaneous attendance check-ins for same members
    race_condition_test: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 500,
      maxDuration: '1m',
      startTime: '20s',
      tags: { scenario: 'race_condition' },
      exec: 'raceConditionScenario',
    },
    // QUEUE BACKLOG: Mass notification triggers
    queue_flood: {
      executor: 'constant-arrival-rate',
      rate: 100,             // 100 requests/sec constant pressure
      timeUnit: '1s',
      duration: '40s',
      preAllocatedVUs: 150,
      maxVUs: 300,
      startTime: '40s',
      tags: { scenario: 'queue_flood' },
      exec: 'queueFloodScenario',
    },
  },

  thresholds: {
    'http_req_duration':             ['p(95)<2000', 'p(99)<5000'],
    'http_req_failed':               ['rate<0.10'],          // 10% tolerance at 1000 users
    'gym_auth_success_rate':         ['rate>0.85'],
    'gym_db_write_ms':               ['p(95)<3000'],
    'gym_timeout_errors':            ['count<200'],
    'gym_server_errors_5xx':         ['count<100'],
    'gym_race_condition_hits':       ['count<10'],           // Max 10 duplicate writes
    'gym_ws_connect_ms':             ['p(95)<5000'],
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
  const res = http.get(`${BASE_URL}${path}`, {
    headers: AUTH_HEADERS,
    tags: { name: tag },
    timeout: '20s',
  });
  if (res.status === 0)   timeoutErrors.add(1);
  if (res.status === 429) rateLimitHits.add(1);
  if (res.status >= 500)  serverErrors.add(1);
  return res;
}

function authPost(path, body, tag) {
  const res = http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: AUTH_HEADERS,
    tags: { name: tag },
    timeout: '20s',
  });
  if (res.status === 0)   timeoutErrors.add(1);
  if (res.status === 429) rateLimitHits.add(1);
  if (res.status >= 500)  serverErrors.add(1);
  return res;
}

// ── Primary Breaking Point Scenario ───────────────────────────────────────────
export default function () {
  activeConns.add(1);

  // Health — fast sanity check
  const health = http.get(`${BASE_URL}/health`, { timeout: '5s' });
  check(health, { 'health: alive': r => r.status === 200 });
  if (health.status === 503) {
    serverErrors.add(1);
    activeConns.add(-1);
    return; // Server overwhelmed — skip this iteration
  }

  sleep(0.1);

  // Auth
  group('auth_stress', () => {
    const res = authPost('/api/auth/login', {
      email:    __ENV.TEST_EMAIL    || 'admin@testgym.com',
      password: __ENV.TEST_PASSWORD || 'TestPass123!',
    }, 'auth_login_1000');
    authSuccess.add(res.status === 200);
    check(res, { 'auth: not crashed': r => r.status !== 500 && r.status !== 503 });
  });

  sleep(0.2);

  // DB Read — Member list (pool saturation probe)
  group('db_read_stress', () => {
    const start = Date.now();
    const res   = authGet(`/api/members?page=${Math.floor(Math.random() * 50) + 1}&limit=10`, 'member_list_1000');
    memberFetch.add(Date.now() - start);
    check(res, { 'db read: not crashed': r => r.status !== 500 });
  });

  sleep(0.1);

  // DB Write — Continuous insert pressure
  group('db_write_stress', () => {
    const start = Date.now();
    const res   = authPost('/api/analytics/log', {
      event:    'BREAKING_POINT_1000',
      path:     '/breaking-point',
      metadata: { vu: __VU, iter: __ITER, scenario: '1000_users', ts: Date.now() },
    }, 'analytics_log_1000');
    dbWriteTime.add(Date.now() - start);
    // Proxy for queue backlog: if analytics writes slow down, the queue is backing up
    if (Date.now() - start > 2000) queueBacklog.add(1);
    check(res, { 'db write: not crashed': r => r.status !== 500 });
  });

  sleep(0.1);

  // Attendance read under peak load
  group('attendance_stress', () => {
    const start = Date.now();
    const res   = authGet('/api/attendance/today', 'attendance_1000');
    attendanceTrend.add(Date.now() - start);
    check(res, { 'attendance: not crashed': r => r.status !== 500 });
  });

  sleep(0.15);
  activeConns.add(-1);
}

// ── WebSocket Max Scenario ─────────────────────────────────────────────────────
export function socketScenario() {
  const WS_URL = BASE_URL.replace('http', 'ws') + '/socket.io/?EIO=4&transport=websocket';
  const start  = Date.now();

  const res = ws.connect(WS_URL, {
    headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
  }, function (socket) {
    wsConnectTime.add(Date.now() - start);

    let alive = true;
    socket.on('open',    () => { socket.send('40'); });
    socket.on('message', () => { /* count messages silently */ });
    socket.on('error',   () => { apiErrors.add(1); alive = false; });
    socket.on('close',   () => { alive = false; });

    // Long-lived connection (60s) to stress Redis Pub/Sub
    socket.setTimeout(() => {
      if (alive) {
        socket.send('41');
        socket.close();
      }
    }, 60000);
  });

  check(res, { 'ws: connection attempt': r => r !== null });
  sleep(1);
}

// ── Race Condition Scenario ────────────────────────────────────────────────────
// 50 VUs hammering the same 3 member IDs simultaneously — triggers DB write conflicts
export function raceConditionScenario() {
  const SHARED_MEMBER_IDS = [
    'race-member-001',
    'race-member-002',
    'race-member-003',
  ];
  const memberId = SHARED_MEMBER_IDS[__VU % SHARED_MEMBER_IDS.length];

  // Fire two rapid check-ins for the same member (potential duplicate write)
  const res1 = authPost('/api/attendance/check-in', { memberId }, 'race_checkin_1');
  const res2 = authPost('/api/attendance/check-in', { memberId }, 'race_checkin_2');

  // Both returning 200 on the same member = possible race condition / duplicate entry
  if (res1.status === 200 && res2.status === 200) {
    raceCondHits.add(1);
  }

  check(res1, { 'race: member 1 handled': r => r.status !== 500 });
  check(res2, { 'race: member 2 handled': r => r.status !== 500 });

  sleep(0.05);  // Minimal sleep to maximise collision probability
}

// ── Queue Flood Scenario ───────────────────────────────────────────────────────
// Constant 100 req/s to test BullMQ queue depth and Redis backpressure
export function queueFloodScenario() {
  const res = authPost('/api/analytics/log', {
    event:    'QUEUE_FLOOD_TEST',
    path:     '/queue-flood',
    metadata: { ts: Date.now(), batch: __ITER },
  }, 'queue_flood_log');

  // Measure proxy: if response consistently >1s, queue is backing up
  const parsed = res.timings?.duration || 0;
  if (parsed > 1000) queueBacklog.add(1);

  check(res, {
    'queue: not 503': r => r.status !== 503,
    'queue: not 500': r => r.status !== 500,
  });

  // No sleep — constant arrival rate handles pacing
}

// ── Summary Hook ──────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const metrics = data.metrics;
  const score   = computeScore(metrics);
  const issues  = detectAllIssues(metrics);

  const report = {
    scenario:          '1000_users',
    timestamp:         new Date().toISOString(),
    performance_score: score,
    verdict:           score >= 60 ? 'PASS ✅' : score >= 40 ? 'WARN ⚠️' : 'FAIL ❌',
    metrics: {
      api_throughput_rps:   metrics['http_reqs']?.values?.rate?.toFixed(2)              || 'N/A',
      api_latency_avg_ms:   metrics['http_req_duration']?.values?.avg?.toFixed(2)       || 'N/A',
      api_latency_p95_ms:   metrics['http_req_duration']?.values?.['p(95)']?.toFixed(2) || 'N/A',
      api_latency_p99_ms:   metrics['http_req_duration']?.values?.['p(99)']?.toFixed(2) || 'N/A',
      api_error_rate_pct:  ((metrics['http_req_failed']?.values?.rate || 0) * 100).toFixed(2),
      auth_success_rate:   ((metrics['gym_auth_success_rate']?.values?.rate || 0) * 100).toFixed(2),
      db_write_p95_ms:      metrics['gym_db_write_ms']?.values?.['p(95)']?.toFixed(2)   || 'N/A',
      db_write_p99_ms:      metrics['gym_db_write_ms']?.values?.['p(99)']?.toFixed(2)   || 'N/A',
      ws_connect_p95_ms:    metrics['gym_ws_connect_ms']?.values?.['p(95)']?.toFixed(2) || 'N/A',
      rate_limit_hits:      metrics['gym_rate_limit_hits']?.values?.count               || 0,
      timeout_errors:       metrics['gym_timeout_errors']?.values?.count                || 0,
      server_errors_5xx:    metrics['gym_server_errors_5xx']?.values?.count             || 0,
      race_condition_hits:  metrics['gym_race_condition_hits']?.values?.count           || 0,
      queue_backlog_events: metrics['gym_queue_backlog_proxy']?.values?.count           || 0,
      total_requests:       metrics['http_reqs']?.values?.count                         || 0,
    },
    identified_issues: issues,
  };

  return {
    'results/report_1000.json': JSON.stringify(report, null, 2),
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
  const crashes    = metrics['gym_server_errors_5xx']?.values?.count || 0;
  const races      = metrics['gym_race_condition_hits']?.values?.count || 0;
  const dbP95      = metrics['gym_db_write_ms']?.values?.['p(95)'] || 0;

  // Error rate (-30 max)
  if (errorRate > 20)     score -= 30;
  else if (errorRate > 10) score -= 20;
  else if (errorRate > 5)  score -= 10;

  // Latency (-20 max)
  if (p95 > 5000)      score -= 20;
  else if (p95 > 2000) score -= 12;
  else if (p95 > 1000) score -= 6;

  // Auth success (-15 max)
  if (authRate < 60)      score -= 15;
  else if (authRate < 80) score -= 8;

  // Throughput (-10 max) — expect >500 rps at 1000 VUs
  if (throughput < 100)   score -= 10;
  else if (throughput < 300) score -= 5;

  // Crashes (-10 max)
  if (crashes > 200)  score -= 10;
  else if (crashes > 50) score -= 5;

  // Race conditions (-8 max)
  if (races > 20) score -= 8;
  else if (races > 5) score -= 4;

  // Timeouts (-7 max)
  if (timeouts > 200) score -= 7;
  else if (timeouts > 50) score -= 3;

  return Math.max(0, Math.round(score));
}

function detectAllIssues(metrics) {
  const issues = [];

  const p99      = metrics['http_req_duration']?.values?.['p(99)'] || 0;
  const dbP95    = metrics['gym_db_write_ms']?.values?.['p(95)'] || 0;
  const wsP95    = metrics['gym_ws_connect_ms']?.values?.['p(95)'] || 0;
  const rl       = metrics['gym_rate_limit_hits']?.values?.count || 0;
  const to       = metrics['gym_timeout_errors']?.values?.count || 0;
  const crashes  = metrics['gym_server_errors_5xx']?.values?.count || 0;
  const races    = metrics['gym_race_condition_hits']?.values?.count || 0;
  const backlog  = metrics['gym_queue_backlog_proxy']?.values?.count || 0;
  const errRate  = (metrics['http_req_failed']?.values?.rate || 0) * 100;

  // Bottlenecks
  if (p99 > 5000)
    issues.push({ category: 'BOTTLENECK',      severity: 'CRITICAL', detail: `API p99=${p99.toFixed(0)}ms — server is CPU-bound or DB pool exhausted` });
  if (dbP95 > 2000)
    issues.push({ category: 'BOTTLENECK',      severity: 'HIGH',     detail: `DB write p95=${dbP95.toFixed(0)}ms — pg Pool max=20 saturated at 1000 concurrent users` });
  if (wsP95 > 5000)
    issues.push({ category: 'BOTTLENECK',      severity: 'HIGH',     detail: `WS connect p95=${wsP95.toFixed(0)}ms — Socket.io Redis adapter under contention` });

  // Race Conditions
  if (races > 0)
    issues.push({ category: 'RACE_CONDITION',  severity: races > 10 ? 'CRITICAL' : 'HIGH', detail: `${races} duplicate attendance check-ins detected — missing DB-level UNIQUE constraint or transaction lock` });

  // Queue Backlogs
  if (backlog > 100)
    issues.push({ category: 'QUEUE_BACKLOG',   severity: 'HIGH',     detail: `${backlog} analytics writes exceeded 2s — BullMQ notification/analytics queues backing up in Redis` });

  // Timeout Risks
  if (to > 50)
    issues.push({ category: 'TIMEOUT_RISK',    severity: 'HIGH',     detail: `${to} request timeouts — pg connectionTimeoutMillis=10000ms may need reduction + circuit breaker` });
  if (rl > 1000)
    issues.push({ category: 'TIMEOUT_RISK',    severity: 'MEDIUM',   detail: `${rl} rate-limit 429s — 300 req/15m window exhausted; clients retry → amplifies backlog` });

  // General Health
  if (crashes > 50)
    issues.push({ category: 'STABILITY',       severity: 'CRITICAL', detail: `${crashes} 5xx errors — server unstable at 1000 VUs; immediate scaling required` });
  if (errRate > 10)
    issues.push({ category: 'STABILITY',       severity: 'HIGH',     detail: `${errRate.toFixed(1)}% total error rate — unacceptable for production` });

  return issues.length > 0 ? issues : [{ category: 'NONE', severity: 'OK', detail: 'System stable at 1000 users — excellent!' }];
}

function buildConsoleReport(r) {
  const issues = r.identified_issues.map(i =>
    `  [${i.severity.padEnd(8)}] ${i.category}: ${i.detail}`
  ).join('\n');

  return `
╔══════════════════════════════════════════════════════════════════════════╗
║         GYM BREAKING-POINT TEST — 1000 USERS — RESULTS                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║  Performance Score:   ${r.performance_score}/100                                    
║  Verdict:             ${r.verdict}                               
╠══════════════════════════════════════════════════════════════════════════╣
║  API Throughput:      ${r.metrics.api_throughput_rps} req/s                          
║  API Latency avg:     ${r.metrics.api_latency_avg_ms} ms                            
║  API Latency p95:     ${r.metrics.api_latency_p95_ms} ms                            
║  API Latency p99:     ${r.metrics.api_latency_p99_ms} ms                            
║  API Error Rate:      ${r.metrics.api_error_rate_pct}%                              
║  Auth Success Rate:   ${r.metrics.auth_success_rate}%                               
║  DB Write p95:        ${r.metrics.db_write_p95_ms} ms                              
║  DB Write p99:        ${r.metrics.db_write_p99_ms} ms                              
║  WS Connect p95:      ${r.metrics.ws_connect_p95_ms} ms                            
║  Rate Limit Hits:     ${r.metrics.rate_limit_hits}                                  
║  Timeout Errors:      ${r.metrics.timeout_errors}                                   
║  Server 5xx Errors:   ${r.metrics.server_errors_5xx}                                
║  Race Condition Hits: ${r.metrics.race_condition_hits}                               
║  Queue Backlog Events:${r.metrics.queue_backlog_events}                              
║  Total Requests:      ${r.metrics.total_requests}                                    
╠══════════════════════════════════════════════════════════════════════════╣
║  IDENTIFIED ISSUES:
${issues}
╚══════════════════════════════════════════════════════════════════════════╝
`;
}
