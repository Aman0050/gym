#!/usr/bin/env node
/**
 * GYM Load Test — Master Score Aggregator
 * ==========================================
 * Reads results/report_100.json, report_500.json, report_1000.json
 * Produces a final weighted Performance Score /100
 * and full scaling recommendations.
 *
 * Usage: node aggregate_scores.js
 */

const fs   = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'results');

// ── Weighted Score Config (weights sum to 1.0) ────────────────────────────────
const WEIGHTS = {
  '100_users':  0.20,   // baseline — lighter weight
  '500_users':  0.35,   // stress — heavier
  '1000_users': 0.45,   // breaking point — heaviest
};

// ── Thresholds for issue categorization ──────────────────────────────────────
const THRESHOLDS = {
  latency_p95_warn:     500,
  latency_p95_critical: 2000,
  error_rate_warn:      2,
  error_rate_critical:  10,
  db_write_warn:        1000,
  db_write_critical:    3000,
  timeout_warn:         20,
  timeout_critical:     100,
};

function loadReport(scenario) {
  const filePath = path.join(RESULTS_DIR, `report_${scenario}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Missing: ${filePath} — skipping scenario`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed to parse ${filePath}: ${e.message}`);
    return null;
  }
}

function computeWeightedScore(reports) {
  let totalScore  = 0;
  let totalWeight = 0;

  for (const [scenario, weight] of Object.entries(WEIGHTS)) {
    const key    = scenario.replace('_users', '');
    const report = reports[scenario];
    if (!report) continue;

    totalScore  += report.performance_score * weight;
    totalWeight += weight;
    console.log(`  ✓ ${scenario}: ${report.performance_score}/100 (weight ${(weight * 100).toFixed(0)}%)`);
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

function aggregateBottlenecks(reports) {
  const all = [];
  for (const report of Object.values(reports)) {
    if (!report) continue;
    const issues = report.bottlenecks || report.identified_issues || [];
    for (const issue of issues) {
      if (issue.severity !== 'OK') {
        all.push({ ...issue, scenario: report.scenario });
      }
    }
  }
  // De-duplicate by category
  const seen = new Set();
  return all.filter(i => {
    const key = `${i.category || i.type}:${i.severity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateScalingRecommendations(reports, finalScore) {
  const recs = [];
  const all  = Object.values(reports).filter(Boolean);

  // ── Database Scaling ────────────────────────────────────────────────────────
  const dbP95_1000 = parseFloat(all[2]?.metrics?.db_write_p95_ms || 0);
  const dbP95_500  = parseFloat(all[1]?.metrics?.db_write_p95_ms || 0);

  if (dbP95_1000 > 2000 || dbP95_500 > 1000) {
    recs.push({
      area:     '🗄️  Database (PostgreSQL/Supabase)',
      priority: 'CRITICAL',
      actions: [
        'Increase pg Pool max from 20 → 50 in config/db.js (connectionTimeoutMillis: 5000)',
        'Add pgBouncer connection pooler in transaction mode to reduce per-request pool pressure',
        'Create composite index: CREATE INDEX ON audit_logs (gym_id, created_at DESC)',
        'Add READ REPLICA for analytics & report queries (analytics/log inserts are write-heavy)',
        'Wrap attendance check-in in a SERIALIZABLE transaction to prevent duplicate writes',
      ],
    });
  } else {
    recs.push({
      area:     '🗄️  Database (PostgreSQL/Supabase)',
      priority: 'LOW',
      actions: [
        'Pool size (max: 20) is adequate for current load',
        'Consider adding query result caching with Redis for /api/members and /api/analytics',
      ],
    });
  }

  // ── API / Express Scaling ───────────────────────────────────────────────────
  const p95_1000   = parseFloat(all[2]?.metrics?.api_latency_p95_ms || 0);
  const errRate    = parseFloat(all[2]?.metrics?.api_error_rate_pct || 0);
  const rateLimits = all[2]?.metrics?.rate_limit_hits || 0;

  if (p95_1000 > 1000 || errRate > 5) {
    recs.push({
      area:     '⚡ API Layer (Express 5)',
      priority: 'HIGH',
      actions: [
        'Deploy 2–3 additional Node.js instances behind a load balancer (Nginx / Render auto-scale)',
        'Enable cluster mode: cluster.fork() × os.cpus().length in server.js for multi-core usage',
        'Add response caching middleware (e.g., Redis cache for GET /api/members, /api/plans)',
        'Tune rate limiter: apiLimiter max: 300 → 500 for authenticated users (adjust in server.js)',
        'Add circuit-breaker (e.g., opossum) to fail-fast on DB/Redis failures and return 503 gracefully',
      ],
    });
  } else {
    recs.push({
      area:     '⚡ API Layer (Express 5)',
      priority: 'MEDIUM',
      actions: [
        'Enable cluster mode for multi-core utilization (currently single-threaded)',
        'Add Redis caching layer for read-heavy routes (/api/members, /api/plans)',
      ],
    });
  }

  if (rateLimits > 500) {
    recs.push({
      area:     '🔒 Rate Limiter',
      priority: 'HIGH',
      actions: [
        `${rateLimits} rate-limit hits detected — window is being exhausted under load`,
        'Increase apiLimiter max: 300 → 600 for authenticated admin sessions',
        'Use a sliding-window strategy instead of fixed-window to reduce burst cliffs',
        'Consider per-gym rate limiting instead of per-IP to avoid collateral throttling',
      ],
    });
  }

  // ── WebSocket / Socket.io Scaling ───────────────────────────────────────────
  const wsP95 = parseFloat(all[2]?.metrics?.ws_connect_p95_ms || 0);

  if (wsP95 > 3000) {
    recs.push({
      area:     '🔌 WebSocket (Socket.io + Redis Adapter)',
      priority: 'HIGH',
      actions: [
        'Redis adapter is correctly in place — but Redis may be under-provisioned',
        'Upgrade Redis instance to at least 1 GB RAM (Upstash/Render Redis)',
        'Enable Socket.io sticky sessions on load balancer to prevent polling fallbacks',
        'Set transports: ["websocket"] only (remove "polling") to reduce handshake overhead',
        'Add pingTimeout: 30000 (from 60000) to evict dead connections faster',
      ],
    });
  } else {
    recs.push({
      area:     '🔌 WebSocket (Socket.io + Redis Adapter)',
      priority: 'LOW',
      actions: [
        'Socket.io with Redis adapter is performing well',
        'Monitor Redis memory usage as concurrent socket users grow beyond 500',
      ],
    });
  }

  // ── BullMQ Queue Scaling ────────────────────────────────────────────────────
  const queueBacklog = all[2]?.metrics?.queue_backlog_events || 0;

  if (queueBacklog > 50) {
    recs.push({
      area:     '📬 BullMQ Job Queues (Redis)',
      priority: 'HIGH',
      actions: [
        `${queueBacklog} queue backlog events detected — notification/analytics workers are lagging`,
        'Add more worker concurrency: Worker("notifications", handler, { concurrency: 10 })',
        'Implement back-pressure: if queue depth > 500 jobs, reject new analytics/log requests with 503',
        'Add queue monitoring dashboard (Bull Board) to visualize backlog in real-time',
        'Separate Redis instances for BullMQ queues vs Socket.io adapter to prevent contention',
      ],
    });
  } else {
    recs.push({
      area:     '📬 BullMQ Job Queues (Redis)',
      priority: 'LOW',
      actions: [
        'Queues are not backing up at current load levels',
        'Add queue depth monitoring as a health check metric in /health endpoint',
      ],
    });
  }

  // ── Race Conditions ─────────────────────────────────────────────────────────
  const races = all[2]?.metrics?.race_condition_hits || 0;

  if (races > 0) {
    recs.push({
      area:     '⚠️  Race Conditions (Attendance Check-in)',
      priority: 'CRITICAL',
      actions: [
        `${races} duplicate attendance writes detected — critical data integrity issue`,
        'Add UNIQUE constraint: ALTER TABLE attendance ADD CONSTRAINT unique_daily_checkin UNIQUE (member_id, DATE(checked_in_at))',
        'Wrap recordAttendance in a DB transaction with SELECT ... FOR UPDATE lock on member row',
        'Use Redis SETNX as a per-member check-in lock (TTL: 60s) before hitting the DB',
        'Return 409 Conflict instead of 500 when duplicate check-in is detected',
      ],
    });
  }

  // ── Timeout Risks ───────────────────────────────────────────────────────────
  const timeouts = all[2]?.metrics?.timeout_errors || 0;

  if (timeouts > 20) {
    recs.push({
      area:     '⏱️  Timeout Risks',
      priority: 'HIGH',
      actions: [
        `${timeouts} request timeouts under 1000-user load`,
        'Reduce connectionTimeoutMillis: 10000 → 3000 in config/db.js to fail-fast',
        'Add a global Express timeout middleware: express-timeout-handler (10s hard limit)',
        'Implement retry logic with exponential backoff on the client side for 503 responses',
        'Add /health endpoint to queue health (BullMQ queue depth) for load balancer health checks',
      ],
    });
  }

  // ── Infrastructure / General ────────────────────────────────────────────────
  recs.push({
    area:     '🏗️  Infrastructure & General',
    priority: finalScore < 60 ? 'CRITICAL' : 'MEDIUM',
    actions: [
      'Enable Node.js --max-old-space-size=4096 to prevent OOM at 1000 users',
      'Add APM tracing (Sentry tracesSampleRate is already 1.0 — consider reducing to 0.1 in production to lower overhead)',
      'Set up horizontal autoscaling: CPU > 70% → add 1 instance (Render auto-scale or K8s HPA)',
      'Enable gzip compression (already present ✅) — also add Brotli for static assets',
      'Add Redis sentinel or cluster mode for high availability of the Redis instance',
    ],
  });

  return recs;
}

function formatReport(finalScore, reports, bottlenecks, recs) {
  const verdict =
    finalScore >= 80 ? '🟢 EXCELLENT — Production Ready' :
    finalScore >= 65 ? '🟡 GOOD — Minor Tuning Required' :
    finalScore >= 50 ? '🟠 FAIR — Architectural Changes Needed' :
                       '🔴 POOR — Major Scaling Required Before Launch';

  const lines = [];
  lines.push('');
  lines.push('╔════════════════════════════════════════════════════════════════════════════╗');
  lines.push('║          GYM MANAGEMENT SYSTEM — COMPLETE LOAD TEST ANALYSIS              ║');
  lines.push('╠════════════════════════════════════════════════════════════════════════════╣');
  lines.push(`║  FINAL PERFORMANCE SCORE:  ${String(finalScore).padEnd(3)}/100                                    ║`);
  lines.push(`║  VERDICT: ${verdict.padEnd(60)}║`);
  lines.push('╠════════════════════════════════════════════════════════════════════════════╣');
  lines.push('║  SCENARIO BREAKDOWN:                                                       ║');

  for (const [scenario, report] of Object.entries(reports)) {
    if (!report) { lines.push(`║    ${scenario}: NO DATA`.padEnd(76) + '║'); continue; }
    const users = scenario.replace('_users', '');
    lines.push(`║    ${users} Users: Score=${report.performance_score}/100 | RPS=${report.metrics.api_throughput_rps} | p95=${report.metrics.api_latency_p95_ms}ms | Err=${report.metrics.api_error_rate_pct}%`.padEnd(76) + '║');
  }

  lines.push('╠════════════════════════════════════════════════════════════════════════════╣');
  lines.push('║  IDENTIFIED ISSUES:                                                        ║');

  if (bottlenecks.length === 0) {
    lines.push('║    ✅ No critical issues detected                                          ║');
  } else {
    for (const b of bottlenecks) {
      const line = `    [${b.severity}] ${b.category || b.type}: ${(b.detail || '').substring(0, 55)}`;
      lines.push(`║${line.padEnd(76)}║`);
    }
  }

  lines.push('╠════════════════════════════════════════════════════════════════════════════╣');
  lines.push('║  SCALING RECOMMENDATIONS:                                                  ║');
  lines.push('╚════════════════════════════════════════════════════════════════════════════╝');
  lines.push('');

  for (const rec of recs) {
    lines.push(`  ${rec.priority === 'CRITICAL' ? '🔴' : rec.priority === 'HIGH' ? '🟠' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'} [${rec.priority}] ${rec.area}`);
    for (const action of rec.actions) {
      lines.push(`     → ${action}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  console.log('\n🔄 GYM Load Test Score Aggregator\n');

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const reports = {
    '100_users':  loadReport('100'),
    '500_users':  loadReport('500'),
    '1000_users': loadReport('1000'),
  };

  const hasAny = Object.values(reports).some(Boolean);
  if (!hasAny) {
    console.error('❌ No result files found. Run the k6 tests first:\n');
    console.error('   k6 run load-tests/k6/scenarios/100_users.js');
    console.error('   k6 run load-tests/k6/scenarios/500_users.js');
    console.error('   k6 run load-tests/k6/scenarios/1000_users.js\n');
    process.exit(1);
  }

  console.log('📊 Individual Scores:');
  const finalScore = computeWeightedScore(reports);
  console.log(`\n🏆 Weighted Final Score: ${finalScore}/100\n`);

  const bottlenecks = aggregateBottlenecks(reports);
  const recs        = generateScalingRecommendations(reports, finalScore);
  const reportText  = formatReport(finalScore, reports, bottlenecks, recs);

  console.log(reportText);

  // Save full JSON
  const fullReport = {
    generated_at:      new Date().toISOString(),
    final_score:       finalScore,
    verdict:           finalScore >= 80 ? 'EXCELLENT' : finalScore >= 65 ? 'GOOD' : finalScore >= 50 ? 'FAIR' : 'POOR',
    scenarios:         reports,
    bottlenecks,
    scaling_recommendations: recs,
  };

  const outPath = path.join(RESULTS_DIR, 'final_report.json');
  fs.writeFileSync(outPath, JSON.stringify(fullReport, null, 2));
  console.log(`\n✅ Full report saved to: ${outPath}\n`);
}

main();
