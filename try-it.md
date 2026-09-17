---
title: Try It Now
description: Trigger a real, live request to the ETF Holdings API — no API key required.
---

<script setup>
import { ref } from "vue";

const SANDBOX_URL = "https://etf-api-production-c321.up.railway.app/v1/sandbox/try";

const TABS = [
  {
    id: "holdings",
    label: "Holdings",
    examples: [
      { id: "SPY_HOLDINGS", label: "SPY", sublabel: "plain equity ETF" },
      { id: "RAMZ_HOLDINGS", label: "RAMZ", sublabel: "2x inverse leveraged fund" },
      { id: "QYLD_HOLDINGS", label: "QYLD", sublabel: "covered-call / option-income fund" },
    ],
  },
  {
    id: "changes",
    label: "Changes",
    examples: [{ id: "SPY_CHANGES", label: "SPY", sublabel: "day-over-day changes" }],
  },
  {
    id: "exposure",
    label: "Reverse Exposure",
    examples: [{ id: "NVDA_EXPOSURE", label: "NVDA", sublabel: "who has exposure to NVDA?" }],
  },
];

const activeTab = ref("holdings");
const activeExample = ref(null);
const status = ref("idle"); // idle | loading | success | error
const response = ref(null);
const httpStatus = ref(null);

async function runExample(exampleId) {
  activeExample.value = exampleId;
  status.value = "loading";
  response.value = null;
  httpStatus.value = null;

  try {
    const res = await fetch(SANDBOX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ example: exampleId }),
    });
    httpStatus.value = res.status;
    const body = await res.json();
    response.value = body;
    status.value = res.ok ? "success" : "error";
  } catch (err) {
    status.value = "error";
    response.value = { error: "Request failed — check your network connection.", detail: String(err) };
  }
}
</script>

# Try it now

Click a button below to trigger a **real, live request** to the ETF
Holdings API — the exact response you'll get back, straight from the
issuer's own current data. No API key required: this hits a dedicated,
[rate-limited sandbox endpoint](https://github.com/robertjevans31-cmd/ETF-API#public-sandbox-endpoint)
that only accepts a fixed set of curated examples.

::: tip This is genuinely live
If an issuer's site happens to be having a bad day right now, you might
see a `source_mode: "last_known_good"` response (served from a recent
cache) or even a real error — that's shown exactly as returned, not
hidden. See [How freshness works](/freshness) for what those fields mean.
:::

<div class="sandbox-tabs">
  <button
    v-for="tab in TABS"
    :key="tab.id"
    class="sandbox-tab"
    :class="{ active: activeTab === tab.id }"
    @click="activeTab = tab.id"
  >
    {{ tab.label }}
  </button>
</div>

<div class="sandbox-panel" v-for="tab in TABS" :key="tab.id" v-show="activeTab === tab.id">
  <div class="sandbox-buttons">
    <button
      v-for="example in tab.examples"
      :key="example.id"
      class="sandbox-example-button"
      :disabled="status === 'loading'"
      @click="runExample(example.id)"
    >
      <strong>{{ example.label }}</strong>
      <span>{{ example.sublabel }}</span>
    </button>
  </div>
</div>

<div v-if="status === 'loading'" class="sandbox-status">
  ⏳ Fetching a real response for <code>{{ activeExample }}</code>…
</div>

<div v-if="status === 'success' || status === 'error'" class="sandbox-result">
  <div class="sandbox-result-header">
    <span :class="['sandbox-badge', status]">HTTP {{ httpStatus }}</span>
    <code>{{ activeExample }}</code>
  </div>
  <pre class="sandbox-json">{{ JSON.stringify(response, null, 2) }}</pre>
</div>

## What's actually happening

Every button above sends `POST /v1/sandbox/try` with a fixed body like
`{"example": "RAMZ_HOLDINGS"}` — this page never sends a ticker, a URL, or
anything else; the server maps that fixed identifier to a real internal
call using the API's own credentials, which this page (and you) never
see. See the full mechanics, including the allowlist, CORS restriction,
rate limits, and timeout protection, in the
[main API's README](https://github.com/robertjevans31-cmd/ETF-API#public-sandbox-endpoint).

Ready to make this call yourself, with your own API key? See
[Getting started](/getting-started) and the
[endpoint reference](/endpoints/).

<style>
.sandbox-tabs {
  display: flex;
  gap: 8px;
  margin: 24px 0 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.sandbox-tab {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  background: none;
}
.sandbox-tab.active {
  color: var(--vp-c-brand-1);
  border-bottom-color: var(--vp-c-brand-1);
}
.sandbox-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.sandbox-example-button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  min-width: 160px;
  text-align: left;
}
.sandbox-example-button:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
}
.sandbox-example-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.sandbox-example-button strong {
  font-size: 15px;
}
.sandbox-example-button span {
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.sandbox-status {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  margin-bottom: 16px;
}
.sandbox-result {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
.sandbox-result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 13px;
}
.sandbox-badge {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
}
.sandbox-badge.success {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}
.sandbox-badge.error {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}
.sandbox-json {
  margin: 0;
  padding: 16px;
  max-height: 480px;
  overflow: auto;
  font-size: 13px;
  line-height: 1.5;
}
</style>
