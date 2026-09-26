---
title: API Status
description: Live status of the ETF Holdings API — per-issuer source health, fund-discovery status, and recent incidents.
---

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const STATUS_URL = "https://etf-api-production-c321.up.railway.app/v1/status";
// The underlying data only changes as often as the daily health-check and
// discovery schedules run (see the main API's README) — this polling
// interval exists purely so a visitor watching this page during an actual
// incident sees an update without reloading, not because the data itself
// changes this fast.
const POLL_INTERVAL_MS = 60_000;

const state = ref("loading"); // loading | success | error
const data = ref(null);
const lastFetchedAt = ref(null);
let timer = null;

async function load() {
  try {
    const res = await fetch(STATUS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data.value = await res.json();
    state.value = "success";
    lastFetchedAt.value = new Date();
  } catch (err) {
    state.value = "error";
  }
}

onMounted(() => {
  load();
  timer = setInterval(load, POLL_INTERVAL_MS);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const OVERALL_STATUS_META = {
  operational: { label: "All systems operational", className: "status-ok" },
  degraded: { label: "Degraded — some issuers unhealthy", className: "status-warn" },
  outage: { label: "Outage — all monitored issuers unhealthy", className: "status-bad" },
  unknown: { label: "Status unknown — no health checks recorded yet", className: "status-unknown" },
};

function overallMeta(status) {
  return OVERALL_STATUS_META[status] ?? OVERALL_STATUS_META.unknown;
}

function issuerMeta(status) {
  if (status === "healthy") return { label: "Healthy", className: "status-ok" };
  if (status === "unhealthy") return { label: "Unhealthy", className: "status-bad" };
  return { label: "Unknown", className: "status-unknown" };
}

function formatTime(iso) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
</script>

# API status

<div v-if="state === 'loading'" class="status-banner status-unknown">
  Loading live status…
</div>

<div v-else-if="state === 'error'" class="status-banner status-bad">
  <strong>Unable to load live status right now.</strong>
  This page couldn't reach the status endpoint — it will keep retrying automatically every minute.
</div>

<template v-else>

<div class="status-banner" :class="overallMeta(data.overallStatus).className">
  <strong>{{ overallMeta(data.overallStatus).label }}</strong>
</div>

<p class="status-meta">
  Last health check: <strong>{{ formatTime(data.lastHealthCheckAt) }}</strong>
  &nbsp;·&nbsp; Page last refreshed: <strong>{{ lastFetchedAt ? formatTime(lastFetchedAt.toISOString()) : "—" }}</strong>
  (auto-refreshes every minute)
</p>

## Per-issuer source health

<table class="status-table">
  <thead>
    <tr>
      <th>Issuer</th>
      <th>Ticker</th>
      <th>Status</th>
      <th>Last checked</th>
      <th>Serving fallback data?</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="issuer in data.issuers" :key="issuer.ticker">
      <td>{{ issuer.issuer }}</td>
      <td><code>{{ issuer.ticker }}</code></td>
      <td><span class="status-pill" :class="issuerMeta(issuer.status).className">{{ issuerMeta(issuer.status).label }}</span></td>
      <td>{{ formatTime(issuer.lastCheckAt) }}</td>
      <td>{{ issuer.likelyServingLastKnownGood ? "Likely — see note below" : "No" }}</td>
    </tr>
  </tbody>
</table>

<p class="status-note">
"Serving fallback data" is an honest best-guess, not a direct observation —
the health check and a live API request are two independent calls to the
same upstream source. It's flagged only when an issuer is unhealthy
specifically because its <em>live fetch itself</em> failed (as opposed to,
say, a staleness or schema check), which is the one failure mode where the
live API would also have reason to fall back to a cached
<code>last_known_good</code> response.
</p>

## Fund-discovery status

<table class="status-table">
  <thead>
    <tr>
      <th>Issuer</th>
      <th>Last successful discovery run</th>
      <th>Baseline established</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="issuer in data.discovery.issuers" :key="issuer.issuer">
      <td>{{ issuer.issuer }}</td>
      <td>{{ formatTime(issuer.lastSuccessfulRunAt) }}</td>
      <td>{{ issuer.baselineEstablished ? "Yes" : "Not yet" }}</td>
    </tr>
  </tbody>
</table>

<p class="status-note">
<strong>{{ data.discovery.manualOnlyIssuers.join(", ") }}</strong> have no
automated fund-discovery run at all — their fund lineups are tracked
manually (see the main API's README for why). Only the issuers in the table
above have an automated run to report on.
</p>

## Snapshot collection

<p>
Most recent snapshot recorded:
<strong v-if="data.snapshots.lastSnapshotDate">{{ data.snapshots.lastSnapshotDate }} ({{ data.snapshots.lastSnapshotTicker }})</strong>
<strong v-else>none yet</strong>
</p>

<p class="status-note">{{ data.snapshots.note }}</p>

## Recent incidents

<p v-if="data.recentIncidents.events.length === 0">
No health-state transitions recorded in the last {{ data.recentIncidents.windowDays }} days.
</p>

<table v-else class="status-table">
  <thead>
    <tr>
      <th>When</th>
      <th>Issuer</th>
      <th>Ticker</th>
      <th>Event</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(event, i) in [...data.recentIncidents.events].reverse()" :key="i">
      <td>{{ formatTime(event.at) }}</td>
      <td>{{ event.issuer }}</td>
      <td><code>{{ event.ticker }}</code></td>
      <td>
        <span v-if="event.type === 'incident'" class="status-pill status-bad">Went unhealthy ({{ event.failedCheck }})</span>
        <span v-else class="status-pill status-ok">Recovered</span>
      </td>
    </tr>
  </tbody>
</table>

## Uptime

<p class="status-note">{{ data.uptimeNote }}</p>

</template>

## About this page

This page is a thin, client-side view over
[`GET /v1/status`](https://github.com/robertjevans31-cmd/ETF-API#public-status-endpoint)
— a small, anonymous endpoint on the main API that reuses the same
health-monitoring, fund-discovery, and incident data the API already
collects for its own internal alerting, rather than tracking anything new.
Nothing on this page is fabricated: where real historical data doesn't
exist yet (like a genuine uptime percentage), that's stated plainly instead
of an invented number.

This page itself is static, hosted on the same GitHub Pages infrastructure
as the rest of this documentation site — deliberately separate from the
main API's own hosting, so a real API outage doesn't also take down the
page reporting on it.

- Every API response already tells you its own freshness and sourcing
  directly — see [How freshness works](/freshness) — so you don't need this
  page to know whether a *specific response* is current.
- For the full mechanics behind each field above, see the
  [public status endpoint section](https://github.com/robertjevans31-cmd/ETF-API#public-status-endpoint)
  of the main API's README.

<style>
.status-banner {
  padding: 14px 18px;
  border-radius: 10px;
  margin: 20px 0 8px;
  font-size: 15px;
}
.status-meta {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 24px;
}
.status-note {
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.status-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 14px;
}
.status-table th,
.status-table td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.status-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.status-ok {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}
.status-warn {
  background: rgba(234, 179, 8, 0.18);
  color: #a16207;
}
.status-bad {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}
.status-unknown {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}
</style>
