#!/usr/bin/env node
// Horizontal-scaling evidence: fires N requests at GET /api/health through the nginx load
// balancer and prints how they were distributed across the api replicas (X-Served-By).
//
//   node scripts/scaling-demo.js                 # 90 requests, concurrency 10
//   node scripts/scaling-demo.js 300 30          # 300 requests, concurrency 30
//   BASE_URL=http://localhost:8080 node scripts/scaling-demo.js
//
// No dependencies — needs only Node.js 18+ (global fetch).
const BASE = process.env.BASE_URL || 'http://localhost:8080';
const total = Number(process.argv[2] || 90);
const concurrency = Number(process.argv[3] || 10);

const counts = new Map();
let failed = 0;
let next = 0;

async function worker() {
  while (next < total) {
    next += 1;
    try {
      const res = await fetch(`${BASE}/api/health`, { headers: { Connection: 'close' } });
      const instance = res.headers.get('x-served-by') || 'unknown';
      if (!res.ok) failed += 1;
      counts.set(instance, (counts.get(instance) || 0) + 1);
    } catch {
      failed += 1;
    }
  }
}

const started = Date.now();
await Promise.all(Array.from({ length: concurrency }, worker));
const ms = Date.now() - started;

console.log(
  `\n${total} requests to ${BASE}/api/health in ${ms} ms (${Math.round((total / ms) * 1000)} req/s)`,
);
console.log(`Failed: ${failed}\n`);
console.log('Instance (container id)   Requests   Share');
console.log('------------------------  ---------  -----');
const width = Math.max(...counts.values());
for (const [instance, n] of [...counts].sort((a, b) => b[1] - a[1])) {
  const bar = '█'.repeat(Math.round((n / width) * 30));
  console.log(
    `${instance.padEnd(24)}  ${String(n).padStart(9)}  ${String(Math.round((n / total) * 100)).padStart(4)}%  ${bar}`,
  );
}
console.log(`\n${counts.size} replica(s) served traffic.`);
